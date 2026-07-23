-- ============================================================
-- BAZAR · 100 · расширения и общие функции
--
-- Фундамент всей схемы: на эти три функции опираются триггеры
-- updated_at, поисковый вектор объявлений и trgm-индексы соседних
-- миграций. Файл идемпотентен: переживает и повторный прогон, и
-- накат поверх боевой базы, где часть объектов уже существует.
-- ============================================================


-- ------------------------------------------------------------
-- Расширения
-- ------------------------------------------------------------
-- Ставим ЯВНО в public, а не в супабейсовскую схему `extensions`.
-- Причина — правило контракта: каждая security definer функция обязана
-- иметь `set search_path = public, pg_temp`. Внутри такой функции всё,
-- что лежит вне public, недостижимо без явного указания схемы, и
-- безобидный `similarity(a, b)` или оператор `%` в RPC поиска упал бы
-- с «function does not exist». По той же причине класс операторов
-- gin_trgm_ops в индексах соседних миграций пишется без схемы.
--
-- Если расширение уже установлено в другой схеме (боевая база: Supabase
-- кладёт часть расширений в `extensions`), `if not exists` просто
-- пропускает команду вместе с клаузой `with schema` — ошибки не будет,
-- расширение НЕ переезжает. Ровно поэтому ниже нигде не хардкодится
-- схема unaccent: она вычисляется по факту (см. immutable_unaccent).
create extension if not exists pg_trgm  with schema public;
create extension if not exists unaccent with schema public;
create extension if not exists pgcrypto with schema public;


-- ------------------------------------------------------------
-- public.tg_set_updated_at() — общий триггер отметки времени
-- ------------------------------------------------------------
-- Единственный источник правды для updated_at: клиент это поле не
-- присылает и подделать не может, даже если положит его в payload —
-- before-триггер перезапишет. Вешается как
--   before insert or update ... for each row execute function public.tg_set_updated_at()
-- На insert тоже проставляем осознанно: значение по умолчанию и
-- значение из триггера тогда гарантированно совпадают.
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
-- функция не definer, но search_path фиксируем: триггер выполняется с
-- search_path вызывающей роли, а он у anon/authenticated задаётся
-- снаружи (PostgREST) и меняться может без нашего ведома
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.tg_set_updated_at() is
  'Триггерная функция: проставляет NEW.updated_at = now(). Общая для всех таблиц с этой колонкой.';


-- ------------------------------------------------------------
-- public.immutable_unaccent(text) — unaccent, пригодный для индекса
-- ------------------------------------------------------------
-- Штатный unaccent(text) объявлен STABLE (он смотрит на текущий
-- search_path, чтобы найти словарь), а в индексном выражении и в
-- IMMUTABLE-функции такое использовать нельзя. Лечится ровно одним
-- способом: вызвать двухаргументную форму с ЯВНО указанным словарём —
-- тогда от окружения не остаётся зависимостей и обёртку честно можно
-- пометить immutable.
--
-- Схему словаря вычисляем на лету и зашиваем в тело: на чистой базе это
-- public, на боевой Supabase расширение может уже лежать в extensions.
-- Захардкодить «public.unaccent» нельзя — на боевой create or replace
-- упал бы на этапе разбора тела.
do $$
declare
  v_schema text;
begin
  select n.nspname
    into strict v_schema
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
   where e.extname = 'unaccent';

  execute format(
    $fmt$
      create or replace function public.immutable_unaccent(p_text text)
      returns text
      language sql
      immutable
      strict
      parallel safe
      as $body$ select %I.unaccent(%L::regdictionary, p_text) $body$
    $fmt$,
    v_schema, v_schema || '.unaccent');
end;
$$;

comment on function public.immutable_unaccent(text) is
  'IMMUTABLE-обёртка над unaccent со словарём, указанным явно. Годится для индексных выражений; для русского главный эффект — ё → е.';


-- ------------------------------------------------------------
-- public.bazar_tsv(title, description, attrs) — поисковый вектор
-- ------------------------------------------------------------
-- Веса по контракту: заголовок 'A', характеристики 'B', описание 'C'.
--
-- Три неочевидных решения, каждое ради полноты выдачи:
--
-- 1. Значения attrs добавляются ДВАЖДЫ — конфигурацией 'russian' и
--    конфигурацией 'simple'. В русской конфигурации латиница уходит в
--    английский стеммер: 'Camry' → 'camri', 'iPhone' → 'iphon'. Само по
--    себе это не ломает поиск (запрос стеммится так же), но марки и
--    модели — каноничные значения справочника, и они должны лежать в
--    векторе КАК ЕСТЬ, чтобы совпадать при точном сравнении и при любом
--    способе построения запроса. Проход 'simple' стоит копейки: строка
--    характеристик короткая.
--
-- 2. К каждому полю добавляется его unaccent-версия, но ТОЛЬКО если она
--    отличается от исходной. Смысл — буква ё: 'Чёрный' даёт лексему
--    'чёрн', а покупатель почти всегда набирает «черный» → 'черн', и
--    совпадения бы не было. Держа в векторе оба варианта, мы работаем
--    правильно независимо от того, нормализует ли запрос RPC поиска.
--    Проверка на отличие оставляет размер вектора прежним для текстов
--    без ё и для чистой латиницы.
--
-- 3. Из attrs берутся только ЗНАЧЕНИЯ, не ключи. Ключи ('brand',
--    'mileage', 'engineVol') — служебные идентификаторы клиента, их
--    никто не ищет, а в векторе они давали бы ложные попадания на слово
--    «модель» и ему подобные. Булевы значения тоже отброшены: 'true' и
--    'false' в индексе — чистый шум.
create or replace function public.bazar_tsv(title text, description text, attrs jsonb)
returns tsvector
language sql
immutable
parallel safe
as $$
  with src as (
    select
      coalesce(title, '')       as t_raw,
      coalesce(description, '') as d_raw,
      -- '$.**' обходит и вложенные объекты, и массивы: вектор не
      -- сломается, если клиент положит в attrs что-то сложнее плоского
      -- «ключ → скаляр». `#>> '{}'` снимает кавычки со скаляра.
      -- order by обязателен: функция объявлена immutable и может уехать
      -- в индексное выражение, поэтому результат обязан быть побайтово
      -- одинаковым при каждом вызове.
      coalesce((
        select string_agg(x.val #>> '{}', ' ' order by x.val #>> '{}')
          from jsonb_path_query(coalesce(attrs, '{}'::jsonb), '$.**') as x(val)
         where jsonb_typeof(x.val) in ('string', 'number')
      ), '') as a_raw
  ),
  norm as (
    select
      t_raw, d_raw, a_raw,
      public.immutable_unaccent(t_raw) as t_ua,
      public.immutable_unaccent(d_raw) as d_ua,
      public.immutable_unaccent(a_raw) as a_ua
    from src
  )
  select
       setweight(to_tsvector('russian', t_raw), 'A')
    || setweight(to_tsvector('russian', a_raw), 'B')
    || setweight(to_tsvector('simple',  a_raw), 'B')
    || setweight(to_tsvector('russian', d_raw), 'C')
    || case when t_ua <> t_raw then setweight(to_tsvector('russian', t_ua), 'A') else ''::tsvector end
    || case when a_ua <> a_raw then setweight(to_tsvector('russian', a_ua), 'B') else ''::tsvector end
    || case when d_ua <> d_raw then setweight(to_tsvector('russian', d_ua), 'C') else ''::tsvector end
  from norm;
$$;

comment on function public.bazar_tsv(text, text, jsonb) is
  'Поисковый вектор объявления: заголовок A, значения характеристик B, описание C. Конфигурация russian + дубли для латиницы (simple) и для ё (unaccent).';
