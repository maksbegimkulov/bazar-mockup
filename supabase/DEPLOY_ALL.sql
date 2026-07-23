-- ============================================================
-- BAZAR · единый накат схемы (16 миграций, автосборка)
-- Идемпотентно и безопасно поверх боевой базы. Прогнать целиком
-- в SQL Editor Supabase.
-- ============================================================


-- ═══════════════════════════════════════════════════════════
-- 100_extensions.sql
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- 110_types.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================================
-- BAZAR · 110 · перечислимые типы
--
-- Набор и порядок меток зафиксированы контрактом схемы, менять нельзя:
-- на них завязаны колонки listings, offers, reports, notifications и
-- сигнатуры RPC (rpc_search_listings принимает item_condition и
-- seller_kind как типы, а не как text).
-- ============================================================

-- `create type if not exists` в PostgreSQL не существует, поэтому
-- идемпотентность даёт do-блок с перехватом duplicate_object.
--
-- Обработчик делает на один шаг больше, чем просто «молча пропустить»:
-- если тип уже есть, но в нём не хватает меток (боевая база, где тип
-- заводили руками и раньше), недостающие дотягиваются. Молчаливый
-- пропуск в этом случае оставил бы схему рабочей на вид, а падало бы
-- потом и в соседнем файле — на вставке значения, которого в типе нет.
--
-- ВАЖНО про ADD VALUE: PostgreSQL запрещает использовать метку,
-- добавленную в существующий тип, в той же транзакции. Для нормального
-- сценария (тип создаётся здесь же) ограничение не действует, но если
-- обработчик реально дотянул метку, миграции, которые эту метку
-- вставляют, должны идти отдельной транзакцией. На практике это ветка
-- «чинили руками» — прогон с нуля её не задевает.
do $$
declare
  r       record;
  v_label text;
begin
  for r in
    select *
      from (values
        ('listing_status', array['draft', 'active', 'sold', 'archived', 'blocked']),
        ('item_condition', array['new', 'used']),
        ('seller_kind',    array['private', 'business']),
        ('offer_status',   array['pending', 'accepted', 'rejected', 'countered', 'withdrawn']),
        ('report_reason',  array['scam', 'sold', 'wrong', 'prohibited', 'duplicate', 'offensive']),
        ('moderation_act', array['auto_hidden', 'restored', 'blocked', 'cleared']),
        ('notify_kind',    array['message', 'offer', 'price_drop', 'saved_search', 'moderation'])
      ) as t(type_name, labels)
  loop
    begin
      execute format(
        'create type public.%I as enum (%s)',
        r.type_name,
        (select string_agg(quote_literal(l.label), ', ' order by l.ord)
           from unnest(r.labels) with ordinality as l(label, ord)));
    exception when duplicate_object then
      foreach v_label in array r.labels loop
        execute format('alter type public.%I add value if not exists %L', r.type_name, v_label);
      end loop;
    end;
  end loop;
end;
$$;

comment on type public.listing_status is
  'Состояние объявления. draft — черновик, active — в ленте, sold — продано, archived — снято владельцем, blocked — скрыто модерацией.';
comment on type public.item_condition is
  'Состояние товара: новый / бывший в употреблении. NULL допустим — для услуг, работы и недвижимости поле бессмысленно.';
comment on type public.seller_kind is
  'Тип продавца: частное лицо или бизнес. Значение фильтра в ленте.';
comment on type public.offer_status is
  'Состояние торга. countered — продавец ответил встречной ценой, withdrawn — покупатель отозвал предложение.';
comment on type public.report_reason is
  'Причина жалобы на объявление: мошенничество, уже продано, неверная категория, запрещённый товар, дубль, оскорбление.';
comment on type public.moderation_act is
  'Запись в журнале модерации. auto_hidden — скрыто автоматом по порогу жалоб, cleared — жалобы признаны необоснованными.';
comment on type public.notify_kind is
  'Повод уведомления: сообщение, предложение цены, падение цены в избранном, попадание в сохранённый поиск, действие модерации.';

-- ═══════════════════════════════════════════════════════════
-- 120_taxonomy.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================================
-- BAZAR · 120 · справочники: категории, подкатегории, города
--
-- Зачем справочники в базе, если те же списки есть в js/data.js:
-- клиентскому значению нельзя верить. listings.category и
-- listings.city ссылаются сюда внешними ключами, а пара
-- (category, subcategory) проверяется триггером по subcategories —
-- иначе кто угодно отправил бы объявление в несуществующий раздел и
-- оно бы просто исчезло из выдачи.
--
-- Наполнение — в 900_seed_taxonomy.sql, данные берутся из js/data.js.
-- ============================================================


-- ------------------------------------------------------------
-- categories
-- ------------------------------------------------------------
-- Названий категорий здесь нет намеренно: интерфейс трёхъязычный
-- (RU/EN/KY), и подписи живут в js/i18n.js. База хранит только
-- машинный id — его же кладёт в listings.category клиент.
create table if not exists public.categories (
  id   text primary key,
  sort int not null default 0
);

alter table public.categories add column if not exists sort int not null default 0;

comment on table  public.categories      is 'Справочник категорий. Машинные id (electronics, transport, …); подписи локализуются на клиенте.';
comment on column public.categories.id   is 'Машинный идентификатор категории, совпадает с CATEGORIES[].id в js/data.js.';
comment on column public.categories.sort is 'Порядок показа в интерфейсе; повторяет порядок массива CATEGORIES.';


-- ------------------------------------------------------------
-- subcategories
-- ------------------------------------------------------------
-- Здесь, в отличие от категорий, хранится именно РУССКОЕ НАЗВАНИЕ, а не
-- машинный ключ: подкатегория передаётся клиентом строкой (listings.
-- subcategory text) и этой же строкой ищется в ATTR_SCHEMA из
-- js/attributes.js, чтобы понять набор характеристик раздела. Любое
-- расхождение в байтах — и раздел останется без фильтров, поэтому
-- значения должны совпадать с клиентскими символ в символ.
create table if not exists public.subcategories (
  id          bigserial primary key,
  category_id text not null references public.categories(id) on delete cascade,
  name        text not null,
  unique (category_id, name)
);

-- Досоздание колонок на случай, если таблица уже была заведена урезанной.
-- Здесь они получаются nullable — навесить not null на непустую таблицу
-- без значения по умолчанию нельзя, а придумывать «пустую подкатегорию»
-- хуже, чем оставить ограничение только на пути create table.
alter table public.subcategories add column if not exists category_id text;
alter table public.subcategories add column if not exists name        text;

-- Ключи добиваем отдельно: таблица могла быть создана раньше и без них.
-- Имена констрейнтов те же, что сгенерировал бы create table выше.
--
-- Проверяем наличие по pg_constraint, а не ловим исключение: у
-- `add constraint ... unique` под капотом создаётся индекс, и если имя
-- уже занято, PostgreSQL падает с duplicate_table («relation already
-- exists»), а вовсе не с ожидаемым duplicate_object. Перехват одного
-- duplicate_object здесь молча не сработал бы и уронил всю миграцию.
-- Исключения всё же ловим — оба кода — как страховку от гонки, если
-- параллельная сессия добавит тот же констрейнт между проверкой и
-- alter'ом.
do $$ begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.subcategories'::regclass
       and conname  = 'subcategories_category_id_fkey'
  ) then
    alter table public.subcategories
      add constraint subcategories_category_id_fkey
      foreign key (category_id) references public.categories(id) on delete cascade;
  end if;
exception when duplicate_object or duplicate_table then null;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.subcategories'::regclass
       and conname  = 'subcategories_category_id_name_key'
  ) then
    alter table public.subcategories
      add constraint subcategories_category_id_name_key unique (category_id, name);
  end if;
exception when duplicate_object or duplicate_table then null;
end $$;

-- Отдельный индекс по category_id не нужен: уникальный ключ
-- (category_id, name) — составной btree, и выборка «все подкатегории
-- категории» идёт по его первой колонке.

comment on table  public.subcategories             is 'Справочник подкатегорий. Проверка пары (category, subcategory) в listings опирается на эту таблицу.';
comment on column public.subcategories.category_id is 'Категория-владелец. Удаление категории уносит её подкатегории.';
comment on column public.subcategories.name        is 'Русское название, байт-в-байт как в js/data.js: это же значение приходит в listings.subcategory и служит ключом ATTR_SCHEMA.';


-- ------------------------------------------------------------
-- cities
-- ------------------------------------------------------------
-- Первичный ключ — само название: города приходят с клиента строкой
-- ('Бишкек'), и суррогатный id заставил бы конвертировать её на каждой
-- вставке listings и profiles. Названия городов не переводятся.
create table if not exists public.cities (
  name text primary key,
  sort int not null default 0
);

alter table public.cities add column if not exists sort int not null default 0;

comment on table  public.cities      is 'Справочник городов. На него ссылаются listings.city и profiles.city.';
comment on column public.cities.name is 'Название города по-русски, байт-в-байт как в CITIES из js/data.js.';
comment on column public.cities.sort is 'Порядок показа; Бишкек первым, дальше по убыванию значимости — как в клиентском массиве.';


-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
-- Справочники обязаны читаться гостем: фильтры и форма подачи
-- объявления рисуются до входа в аккаунт.
alter table public.categories    enable row level security;
alter table public.subcategories enable row level security;
alter table public.cities        enable row level security;

drop policy if exists categories_select_public on public.categories;
create policy categories_select_public
  on public.categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists subcategories_select_public on public.subcategories;
create policy subcategories_select_public
  on public.subcategories
  for select
  to anon, authenticated
  using (true);

drop policy if exists cities_select_public on public.cities;
create policy cities_select_public
  on public.cities
  for select
  to anon, authenticated
  using (true);

-- Политик на insert/update/delete нет СОЗНАТЕЛЬНО. Роль service_role в
-- Supabase объявлена bypassrls, то есть пишет мимо политик, а всем
-- остальным отсутствие политики означает отказ. Явная политика «для
-- service_role» была бы декорацией: она всё равно не проверяется.


-- ------------------------------------------------------------
-- Привилегии
-- ------------------------------------------------------------
-- RLS работает поверх GRANT, а не вместо него: без права select
-- политика чтения ничего не даст. В Supabase нужные default privileges
-- обычно уже настроены, но полагаться на настройку проекта не хочется —
-- выдаём явно. Право на запись анонимам и залогиненным не выдаётся
-- вовсе, так что даже случайно появившаяся политика ничего не откроет.
grant select on public.categories, public.subcategories, public.cities to anon, authenticated;
grant all    on public.categories, public.subcategories, public.cities to service_role;
grant usage, select on sequence public.subcategories_id_seq to service_role;

-- ═══════════════════════════════════════════════════════════
-- 200_profiles.sql
-- ═══════════════════════════════════════════════════════════

-- =============================================================================
-- 200_profiles.sql — профили пользователей BAZAR
--
-- Файл идемпотентен: переживает повторный прогон и ложится как на пустую базу,
-- так и поверх облачной, где public.profiles уже существует (создавалась
-- триггером handle_new_user ещё до появления схемы).
--
-- Зависимости по порядку применения: 110_types.sql (seller_kind),
-- 120_taxonomy.sql (cities). Тип seller_kind продублирован здесь идемпотентно —
-- определение зафиксировано контрактом, поэтому повтор безопасен, зато файл
-- применяется и в одиночку (например, при точечном пересоздании профилей).
--
-- Что здесь есть:
--   1. таблица profiles (колонки, ограничения, комментарии)
--   2. RLS + КОЛОНОЧНЫЕ гранты (именно они прячут phone/banned_until)
--   3. вью public_profiles и rpc_my_profile (владелец читает свой телефон)
--   4. handle_new_user — профиль при регистрации (email/пароль и Google OAuth)
--   5. tg_sync_ads_count — счётчик активных объявлений (триггер вешает 300)
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Предпосылки
-- -----------------------------------------------------------------------------

-- create type if not exists в PostgreSQL нет — только перехват duplicate_object.
do $do$
begin
  create type public.seller_kind as enum ('private', 'business');
exception when duplicate_object then null;
end $do$;


-- -----------------------------------------------------------------------------
-- 1. Таблица profiles
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key
);

-- Колонки добавляются по одной: в облаке часть из них уже есть, и падать на
-- этом нельзя. Ниже отдельно чинятся default/not null — add column if not
-- exists молча пропускает существующую колонку и её nullability не трогает.
alter table public.profiles add column if not exists name           text;
alter table public.profiles add column if not exists avatar_url     text;
alter table public.profiles add column if not exists phone          text;
alter table public.profiles add column if not exists phone_verified boolean;
alter table public.profiles add column if not exists city           text;
alter table public.profiles add column if not exists kind           public.seller_kind;
alter table public.profiles add column if not exists bio            text;
alter table public.profiles add column if not exists rating         numeric(3,2);
alter table public.profiles add column if not exists reviews_count  integer;
alter table public.profiles add column if not exists ads_count      integer;
alter table public.profiles add column if not exists banned_until   timestamptz;
alter table public.profiles add column if not exists last_seen_at   timestamptz;
alter table public.profiles add column if not exists created_at     timestamptz;
alter table public.profiles add column if not exists updated_at     timestamptz;

-- Порядок важен: сперва default, потом добивка NULL-ов, и только потом not null —
-- иначе set not null упадёт на строках, приехавших из облака без этих колонок.
alter table public.profiles alter column name           set default '';
alter table public.profiles alter column phone_verified set default false;
alter table public.profiles alter column kind           set default 'private';
alter table public.profiles alter column rating         set default 0;
alter table public.profiles alter column reviews_count  set default 0;
alter table public.profiles alter column ads_count      set default 0;
alter table public.profiles alter column created_at     set default now();
alter table public.profiles alter column updated_at     set default now();

update public.profiles
   set name           = coalesce(name, ''),
       phone_verified = coalesce(phone_verified, false),
       kind           = coalesce(kind, 'private'),
       rating         = coalesce(rating, 0),
       reviews_count  = coalesce(reviews_count, 0),
       ads_count      = coalesce(ads_count, 0),
       created_at     = coalesce(created_at, now()),
       updated_at     = coalesce(updated_at, now())
 where name is null or phone_verified is null or kind is null or rating is null
    or reviews_count is null or ads_count is null
    or created_at is null or updated_at is null;

alter table public.profiles alter column name           set not null;
alter table public.profiles alter column phone_verified set not null;
alter table public.profiles alter column kind           set not null;
alter table public.profiles alter column rating         set not null;
alter table public.profiles alter column reviews_count  set not null;
alter table public.profiles alter column ads_count      set not null;
alter table public.profiles alter column created_at     set not null;
alter table public.profiles alter column updated_at     set not null;

-- Ключи. Первичный ключ и внешний на auth.users проверяются по системному
-- каталогу, а не по имени: в облаке они могли быть заведены с другим именем
-- или, что хуже, без on delete cascade — тогда удаление аккаунта оставило бы
-- висячий профиль. Такой FK пересоздаётся.
do $do$
declare
  v_id_attnum smallint;
  v_con       record;
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.profiles'::regclass and contype = 'p'
  ) then
    alter table public.profiles add primary key (id);
  end if;

  select attnum into v_id_attnum
    from pg_attribute
   where attrelid = 'public.profiles'::regclass and attname = 'id';

  select conname, confdeltype into v_con
    from pg_constraint
   where conrelid = 'public.profiles'::regclass
     and contype = 'f'
     and confrelid = 'auth.users'::regclass
     and conkey = array[v_id_attnum]
   limit 1;

  if found and v_con.confdeltype <> 'c' then
    execute format('alter table public.profiles drop constraint %I', v_con.conname);
  end if;

  if not found or v_con.confdeltype <> 'c' then
    alter table public.profiles
      add constraint profiles_id_fkey foreign key (id)
      references auth.users(id) on delete cascade;
  end if;
end $do$;

-- Город — справочный: on update cascade, чтобы переименование города не рвало
-- профили; on delete set null, чтобы удаление города не удаляло пользователя.
do $do$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.profiles'::regclass and conname = 'profiles_city_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_city_fkey foreign key (city)
      references public.cities(name) on update cascade on delete set null;
  end if;
end $do$;

-- Ограничения-инварианты. Добавляются как not valid: в облаке таблица уже с
-- данными, и падение миграции из-за одной кривой строки хуже, чем непровалиди-
-- рованное ограничение. NOT VALID означает «старые строки не проверяли», но на
-- любую новую вставку и обновление check действует в полную силу. Сразу ниже
-- делается попытка validate — на чистых данных ограничения станут полноценными.
do $do$
begin
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.profiles'::regclass
                    and conname = 'profiles_rating_range') then
    alter table public.profiles add constraint profiles_rating_range
      check (rating >= 0 and rating <= 5) not valid;
  end if;

  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.profiles'::regclass
                    and conname = 'profiles_counters_nonneg') then
    alter table public.profiles add constraint profiles_counters_nonneg
      check (reviews_count >= 0 and ads_count >= 0) not valid;
  end if;

  -- E.164: плюс, код страны, всего 8..15 цифр. Кыргызстан это +996XXXXXXXXX,
  -- но ограничивать схему одной страной незачем — тут живут и мигранты.
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.profiles'::regclass
                    and conname = 'profiles_phone_e164') then
    alter table public.profiles add constraint profiles_phone_e164
      check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$') not valid;
  end if;

  -- Потолки длин: поля свободные и попадают в вёрстку карточки продавца,
  -- поэтому текст ограничен здесь, а не только в клиенте.
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.profiles'::regclass
                    and conname = 'profiles_text_limits') then
    alter table public.profiles add constraint profiles_text_limits
      check (
        char_length(name) <= 80
        and (bio is null or char_length(bio) <= 1000)
        and (avatar_url is null or char_length(avatar_url) <= 2048)
      ) not valid;
  end if;
end $do$;

do $do$
declare
  v_con text;
begin
  foreach v_con in array array[
    'profiles_rating_range', 'profiles_counters_nonneg',
    'profiles_phone_e164',   'profiles_text_limits'
  ] loop
    begin
      execute format('alter table public.profiles validate constraint %I', v_con);
    exception when others then
      raise warning '200_profiles: % осталось NOT VALID (старые строки нарушают правило: %); на новые записи ограничение уже действует',
        v_con, sqlerrm;
    end;
  end loop;
end $do$;

comment on table public.profiles is
  'Профиль пользователя. Строка создаётся триггером handle_new_user при регистрации. '
  'Публичное чтение — через вью public_profiles: phone и banned_until наружу не отдаются.';
comment on column public.profiles.id is 'Тот же id, что в auth.users; удаление аккаунта каскадом удаляет профиль';
comment on column public.profiles.name is 'Отображаемое имя. Из raw_user_meta_data (Google full_name) либо из локальной части email';
comment on column public.profiles.avatar_url is 'Внешний URL аватара (Google picture) либо путь в Storage';
comment on column public.profiles.phone is 'E.164, +996… ПРИВАТНАЯ колонка: не входит в public_profiles и не выдана anon/authenticated';
comment on column public.profiles.phone_verified is 'Телефон подтверждён SMS. Публично видно как «бейдж доверия»';
comment on column public.profiles.city is 'Город из справочника cities; используется как значение по умолчанию в форме подачи';
comment on column public.profiles.kind is 'private — частник, business — магазин; влияет на фильтр «тип продавца» в поиске';
comment on column public.profiles.rating is 'Средняя оценка 0..5, пересчитывается триггером отзывов (750_reviews.sql). Клиенту на запись не выдана';
comment on column public.profiles.reviews_count is 'Число отзывов, поддерживается триггером отзывов. Клиенту на запись не выдана';
comment on column public.profiles.ads_count is 'Число АКТИВНЫХ объявлений, поддерживается tg_sync_ads_count. Клиенту на запись не выдана';
comment on column public.profiles.banned_until is 'NULL = не забанен. ПРИВАТНАЯ колонка: пользователь не должен видеть/менять срок бана';
comment on column public.profiles.last_seen_at is 'Последняя активность; из него клиент рисует «был(а) в сети»';


-- -----------------------------------------------------------------------------
-- 2. updated_at
-- -----------------------------------------------------------------------------

-- Своя триггерная функция, а не общая из 100_extensions.sql: имя общей контракт
-- не фиксирует, а create or replace чужого имени с моим телом затёр бы её
-- поведение. Дублирование трёх строк дешевле такого риска.
create or replace function public.tg_profiles_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

comment on function public.tg_profiles_updated_at() is
  'BEFORE UPDATE на profiles: штампует updated_at серверным временем, клиентскому времени тут доверия нет';

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.tg_profiles_updated_at();


-- -----------------------------------------------------------------------------
-- 3. RLS и права
--
-- Разделение обязанностей, которое здесь принципиально:
--   RLS решает, какие СТРОКИ видны/меняются;
--   гранты на КОЛОНКИ решают, какие поля видны/меняются.
-- RLS колоночно резать не умеет, поэтому phone и banned_until защищены именно
-- грантами, а не политикой. По той же причине счётчики (rating, reviews_count,
-- ads_count, phone_verified) не выданы клиенту на update: политика
-- «auth.uid() = id» разрешила бы владельцу нарисовать себе рейтинг 5.0.
--
-- ВАЖНО для соседних файлов: серверные триггеры, которые правят эти счётчики
-- (отзывы в 750, объявления в 300), обязаны быть security definer — иначе они
-- выполнятся от имени authenticated и получат «permission denied for column».
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles
  for select to anon, authenticated
  using (true);

-- Вставка своей строки нужна как самолечение: если триггер на auth.users не
-- отработал (или профиль удалили руками), клиент восстановит профиль сам.
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Политики delete нет намеренно: удаление профиля = удаление аккаунта, оно
-- идёт через auth.users и приезжает сюда каскадом.

revoke all on public.profiles from public, anon, authenticated;

grant select (
  id, name, avatar_url, phone_verified, city, kind, bio,
  rating, reviews_count, ads_count, last_seen_at, created_at, updated_at
) on public.profiles to anon, authenticated;

grant insert (id, name, avatar_url, phone, city, kind, bio)
  on public.profiles to authenticated;

grant update (name, avatar_url, phone, city, kind, bio, last_seen_at)
  on public.profiles to authenticated;

grant all on public.profiles to service_role;


-- -----------------------------------------------------------------------------
-- 4. public_profiles — публичное лицо профиля
-- -----------------------------------------------------------------------------

-- security_invoker = true: вью не должна повышать права. RLS у profiles на
-- чтение всё равно using (true), а колонок phone/banned_until тут просто нет —
-- ни в вью, ни в грантах на базовую таблицу.
create or replace view public.public_profiles
with (security_invoker = true) as
select
  p.id,
  p.name,
  p.avatar_url,
  p.city,
  p.kind,
  p.bio,
  p.rating,
  p.reviews_count,
  p.ads_count,
  p.created_at
from public.profiles p;

comment on view public.public_profiles is
  'Публичная проекция профиля: без phone и banned_until. Клиент читает продавцов только отсюда.';

grant select on public.public_profiles to anon, authenticated;
grant select on public.public_profiles to service_role;


-- -----------------------------------------------------------------------------
-- 5. rpc_my_profile — свой профиль целиком
--
-- Колоночные гранты глобальны: скрыв phone от authenticated, мы скрыли его и от
-- владельца, а тому телефон в настройках нужен. Отдаём через definer-функцию,
-- которая по построению не умеет вернуть чужую строку.
-- -----------------------------------------------------------------------------

create or replace function public.rpc_my_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  -- проверка прав и есть это условие: у гостя auth.uid() = null, строк не будет
  select p.* from public.profiles p where p.id = auth.uid();
$fn$;

comment on function public.rpc_my_profile() is
  'Свой профиль вместе с приватными колонками (phone, banned_until). Гостю возвращает пустой результат.';

revoke all on function public.rpc_my_profile() from public, anon;
grant execute on function public.rpc_my_profile() to authenticated, service_role;


-- -----------------------------------------------------------------------------
-- 6. Профиль при регистрации
-- -----------------------------------------------------------------------------

-- Чистые помощники: одна и та же логика нужна и триггеру, и разовой добивке
-- существующих пользователей, а расхождение между двумя копиями выражения
-- потом ищется часами.

-- GoTrue хранит телефон без плюса ('996555112233'), а схема требует E.164.
-- Всё, что не приводится к E.164, отбрасывается: кривой телефон нарушил бы
-- check и оставил пользователя вовсе без профиля.
create or replace function public.profile_phone_from_auth(p_phone text)
returns text
language sql
immutable
as $fn$
  select case
    when btrim(coalesce(p_phone, '')) = '' then null
    when btrim(p_phone) ~ '^\+[1-9][0-9]{6,14}$' then btrim(p_phone)
    when btrim(p_phone) ~ '^[1-9][0-9]{6,14}$'   then '+' || btrim(p_phone)
    else null
  end;
$fn$;

comment on function public.profile_phone_from_auth(text) is
  'Нормализация телефона из auth.users в E.164; неприводимое значение отбрасывается в NULL';

create or replace function public.profile_name_from_auth(
  p_meta jsonb, p_email text, p_phone text
) returns text
language sql
immutable
as $fn$
  select left(coalesce(
    nullif(btrim(p_meta ->> 'name'), ''),
    nullif(btrim(p_meta ->> 'full_name'), ''),   -- Google OAuth
    nullif(btrim(p_meta ->> 'user_name'), ''),
    nullif(btrim(split_part(coalesce(p_email, ''), '@', 1)), ''),
    -- телефон как имя показывается пользователю, поэтому в том же виде,
    -- в каком он ляжет в profiles.phone, а не сырым из GoTrue
    public.profile_phone_from_auth(p_phone),
    'Пользователь'
  ), 80);
$fn$;

comment on function public.profile_name_from_auth(jsonb, text, text) is
  'Имя для профиля из raw_user_meta_data → email → телефона. left(80) держит ограничение profiles_text_limits';

-- security definer обязателен: вставку делает supabase_auth_admin, у которого
-- прав на public.profiles нет, а RLS-политика insert написана под auth.uid().
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
begin
  -- Проверка прав для definer-функции: она вправе работать только как триггер
  -- на auth.users. Повешенная на чужую таблицу, она писала бы в profiles
  -- строки с чужими id — поэтому источник проверяется явно.
  if tg_table_schema <> 'auth' or tg_table_name <> 'users' then
    raise exception 'handle_new_user: функция рассчитана только на auth.users (получено %.%)',
      tg_table_schema, tg_table_name;
  end if;

  begin
    insert into public.profiles as p (id, name, avatar_url, phone, phone_verified, created_at)
    values (
      new.id,
      public.profile_name_from_auth(new.raw_user_meta_data, new.email, new.phone),
      left(nullif(btrim(coalesce(
        new.raw_user_meta_data ->> 'avatar_url',
        new.raw_user_meta_data ->> 'picture'      -- Google кладёт сюда
      )), ''), 2048),
      public.profile_phone_from_auth(new.phone),
      new.phone_confirmed_at is not null,
      coalesce(new.created_at, now())
    )
    on conflict (id) do update
      set name           = case when btrim(p.name) = '' then excluded.name else p.name end,
          avatar_url     = coalesce(p.avatar_url, excluded.avatar_url),
          phone          = coalesce(p.phone, excluded.phone),
          phone_verified = p.phone_verified or excluded.phone_verified;
      -- on conflict, а не do nothing: триггер может сработать повторно (ручная
      -- добивка, второй триггер на той же таблице), и затирать уже введённые
      -- пользователем данные нельзя — дописываем только пустые поля.
  exception when others then
    -- Регистрацию ронять нельзя ни при каких обстоятельствах: без профиля
    -- пользователь войдёт и починится сам (политика profiles_insert_own),
    -- а исключение здесь означало бы «Database error saving new user».
    raise warning 'handle_new_user: профиль для % не создан: %', new.id, sqlerrm;
  end;

  return new;
end;
$fn$;

comment on function public.handle_new_user() is
  'AFTER INSERT на auth.users: заводит строку в profiles. Имя берётся из raw_user_meta_data (Google full_name) либо из email.';

-- В облаке функция под этим именем уже жила и могла быть подцеплена триггером
-- с другим именем. Такие дубликаты снимаются: сама по себе двойная вставка
-- безопасна (on conflict), но два триггера на регистрацию — это мина.
do $do$
declare
  r record;
begin
  for r in
    select t.tgname
      from pg_trigger t
      join pg_proc p on p.oid = t.tgfoid
      join pg_namespace n on n.oid = p.pronamespace
     where t.tgrelid = 'auth.users'::regclass
       and not t.tgisinternal
       and n.nspname = 'public'
       and p.proname = 'handle_new_user'
       and t.tgname <> 'on_auth_user_created'
  loop
    execute format('drop trigger %I on auth.users', r.tgname);
    raise notice '200_profiles: снят дублирующий триггер % на auth.users', r.tgname;
  end loop;
end $do$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Добивка тех, кто зарегистрировался до появления триггера (в облаке это
-- прежде всего пользователи Google OAuth).
insert into public.profiles (id, name, avatar_url, phone, phone_verified, created_at)
select
  u.id,
  public.profile_name_from_auth(u.raw_user_meta_data, u.email, u.phone),
  left(nullif(btrim(coalesce(
    u.raw_user_meta_data ->> 'avatar_url',
    u.raw_user_meta_data ->> 'picture'
  )), ''), 2048),
  public.profile_phone_from_auth(u.phone),
  u.phone_confirmed_at is not null,
  coalesce(u.created_at, now())
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- Лечение строк, заведённых прежним триггером «только id»: пустое имя в облаке
-- рисуется в карточке продавца как пустое место. Заполняем ТОЛЬКО пустое —
-- имя, введённое пользователем, не трогаем.
update public.profiles p
   set name = public.profile_name_from_auth(u.raw_user_meta_data, u.email, u.phone),
       avatar_url = coalesce(p.avatar_url, left(nullif(btrim(coalesce(
         u.raw_user_meta_data ->> 'avatar_url',
         u.raw_user_meta_data ->> 'picture'
       )), ''), 2048))
  from auth.users u
 where u.id = p.id
   and btrim(p.name) = '';


-- -----------------------------------------------------------------------------
-- 7. ads_count — число активных объявлений
--
-- Функция живёт здесь (она про profiles), а вешает её на listings файл 300 —
-- к моменту применения 200 таблицы listings ещё может не быть.
--
-- Счётчик ПЕРЕСЧИТЫВАЕТСЯ, а не инкрементится. Дороже на один count по
-- владельцу (десятки строк, индекс (owner_id, created_at) есть), зато:
--   • массовые правки статусов (истечение срока, разбан) не разъезжаются;
--   • если 300 повесит триггер под другим именем и он сработает вторым,
--     результат не поедет — два пересчёта дают то же число.
-- -----------------------------------------------------------------------------

create or replace function public.tg_sync_ads_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_owners uuid[];
begin
  -- Проверка прав для definer-функции: работать она вправе только как триггер
  -- на public.listings. На другой таблице колонки owner_id/status значат иное,
  -- и функция превратилась бы в способ править чужие профили.
  if tg_table_schema <> 'public' or tg_table_name <> 'listings' then
    raise exception 'tg_sync_ads_count: функция рассчитана только на public.listings (получено %.%)',
      tg_table_schema, tg_table_name;
  end if;

  -- Смена владельца — редкость, но тогда пересчитать надо обоих.
  if tg_op = 'INSERT' then
    v_owners := array[new.owner_id];
  elsif tg_op = 'DELETE' then
    v_owners := array[old.owner_id];
  else
    v_owners := array[new.owner_id, old.owner_id];
  end if;

  update public.profiles p
     set ads_count = (
           select count(*)
             from public.listings l
            where l.owner_id = p.id
              -- ::text намеренно: в облаке status ещё может быть text, а не
              -- listing_status — сравнение через текст переживёт оба варианта
              and l.status::text = 'active'
         )
   where p.id = any (v_owners)
     and p.id is not null;

  -- Триггер вешается как AFTER, возвращаемое значение не используется, но
  -- вернуть строку надо — на DELETE это old.
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$fn$;

comment on function public.tg_sync_ads_count() is
  'AFTER INSERT/UPDATE OF status,owner_id/DELETE на listings: пересчитывает profiles.ads_count владельцу (и прежнему владельцу при смене). Триггер вешает 300_listings.sql.';

-- Привязка «по возможности»: если 300 уже применён (повторный прогон, точечный
-- накат 200), триггер ставится сразу; на чистой базе шаг пропускается без
-- ошибки, и триггер поставит 300. drop + create делает шаг идемпотентным.
do $do$
begin
  if to_regclass('public.listings') is null then
    raise notice '200_profiles: public.listings ещё нет — триггер ads_count повесит 300_listings.sql';
    return;
  end if;

  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'listings'
                    and column_name = 'owner_id')
     or not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'listings'
                       and column_name = 'status') then
    raise notice '200_profiles: в public.listings нет owner_id/status — триггер ads_count повесит 300_listings.sql';
    return;
  end if;

  drop trigger if exists trg_sync_ads_count on public.listings;
  create trigger trg_sync_ads_count
    after insert or delete or update of status, owner_id on public.listings
    for each row execute function public.tg_sync_ads_count();

  -- Разовая синхронизация: после наката счётчик обязан сойтись с фактом,
  -- даже если объявления меняли статусы, пока триггера не было.
  update public.profiles p
     set ads_count = coalesce(c.cnt, 0)
    from (
      select p2.id,
             (select count(*) from public.listings l
               where l.owner_id = p2.id and l.status::text = 'active') as cnt
        from public.profiles p2
    ) c
   where c.id = p.id
     and p.ads_count is distinct from coalesce(c.cnt, 0);
end $do$;

-- ═══════════════════════════════════════════════════════════
-- 300_listings.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================================
--  BAZAR • 300_listings.sql — объявления
--
--  Зависит (по порядку файлов) от:
--    100_extensions.sql  — pg_trgm, public.bazar_tsv()
--    110_types.sql       — listing_status, item_condition
--    120_taxonomy.sql    — categories / subcategories / cities
--    200_profiles.sql    — public.tg_sync_ads_count()
--
--  Файл обязан ложиться и на пустую базу, и поверх боевой таблицы listings,
--  которая создавалась вручную и часть контракта не соблюдает. Поэтому
--  структура правится шагами (add column if not exists / alter type / нормализация
--  данных / ограничения), а не одним create table.
--
--  Ограничения добавляются как NOT VALID с последующим VALIDATE: если в боевой
--  базе завалялось одно кривое объявление, миграция не должна падать целиком —
--  новые строки всё равно будут проверяться, а старые видно по warning'у.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Санитарная проверка: тип первичного ключа
--    Половина схемы (favorites, offers, reports, listing_views) ссылается на
--    listings(id) как на uuid. Если в боевой базе id оказался bigint —
--    молча продолжать нельзя, всё развалится через два файла.
-- ------------------------------------------------------------
do $do$
declare
  v_type text;
begin
  if to_regclass('public.listings') is null then
    return;
  end if;

  select format_type(a.atttypid, a.atttypmod) into v_type
    from pg_attribute a
   where a.attrelid = 'public.listings'::regclass
     and a.attname = 'id' and a.attnum > 0 and not a.attisdropped;

  if v_type is not null and v_type <> 'uuid' then
    raise exception
      'BAZAR 300: listings.id имеет тип % вместо uuid — автоматически конвертировать нельзя, нужна ручная миграция данных',
      v_type;
  end if;
end
$do$;

-- ------------------------------------------------------------
-- 1. Таблица (чистая база)
--    Внешние ключи и check'и здесь НЕ пишем: они добавляются ниже одним
--    общим механизмом, чтобы у ветки «таблица уже есть» и ветки «таблицы нет»
--    был ровно один источник правды по именам ограничений.
-- ------------------------------------------------------------
create table if not exists public.listings (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid,
  title         text,
  description   text        default '',
  price         numeric(12,2) default 0,
  negotiable    boolean     default false,
  floor         numeric(12,2),
  category      text,
  subcategory   text,
  city          text,
  district      text,
  condition     item_condition,
  photos        text[]      default '{}',
  attrs         jsonb       default '{}',
  status        listing_status default 'active',
  views_count   int         default 0,
  report_count  int         default 0,
  search_vector tsvector,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  bumped_at     timestamptz default now(),
  expires_at    timestamptz default (now() + interval '60 days'),
  sold_at       timestamptz
);

-- ------------------------------------------------------------
-- 2. Недостающие колонки (боевая база)
-- ------------------------------------------------------------
alter table public.listings add column if not exists owner_id      uuid;
alter table public.listings add column if not exists title         text;
alter table public.listings add column if not exists description   text;
alter table public.listings add column if not exists price         numeric(12,2);
alter table public.listings add column if not exists negotiable    boolean;
alter table public.listings add column if not exists floor         numeric(12,2);
alter table public.listings add column if not exists category      text;
alter table public.listings add column if not exists subcategory   text;
alter table public.listings add column if not exists city          text;
alter table public.listings add column if not exists district      text;
alter table public.listings add column if not exists condition     item_condition;
alter table public.listings add column if not exists photos        text[];
alter table public.listings add column if not exists attrs         jsonb;
alter table public.listings add column if not exists status        listing_status;
alter table public.listings add column if not exists views_count   int;
alter table public.listings add column if not exists report_count  int;
alter table public.listings add column if not exists search_vector tsvector;
alter table public.listings add column if not exists created_at    timestamptz;
alter table public.listings add column if not exists updated_at    timestamptz;
alter table public.listings add column if not exists bumped_at     timestamptz;
alter table public.listings add column if not exists expires_at    timestamptz;
alter table public.listings add column if not exists sold_at       timestamptz;

-- ------------------------------------------------------------
-- 3. Типы существующих колонок
--    varchar вместо text ломает не только вкус, но и индекс gin_trgm_ops
--    (опкласс не принимает character varying), а float вместо numeric —
--    деньги. Поэтому приводим молча и без потерь.
-- ------------------------------------------------------------
do $do$
declare
  r     record;
  v_cur text;
begin
  for r in
    select *
      from (values
        ('title',       'text',          'title::text'),
        ('description', 'text',          'description::text'),
        ('category',    'text',          'category::text'),
        ('subcategory', 'text',          'subcategory::text'),
        ('city',        'text',          'city::text'),
        ('district',    'text',          'district::text'),
        ('price',       'numeric(12,2)', 'price::numeric(12,2)'),
        ('floor',       'numeric(12,2)', 'floor::numeric(12,2)'),
        ('views_count', 'integer',       'views_count::int'),
        ('report_count','integer',       'report_count::int')
      ) as v(col, target, expr)
  loop
    select format_type(a.atttypid, a.atttypmod) into v_cur
      from pg_attribute a
     where a.attrelid = 'public.listings'::regclass
       and a.attname = r.col and a.attnum > 0 and not a.attisdropped;

    if v_cur is not null and v_cur <> r.target then
      execute format('alter table public.listings alter column %I drop default', r.col);
      execute format('alter table public.listings alter column %I type %s using %s',
                     r.col, r.target, r.expr);
      raise notice 'BAZAR 300: listings.% приведена % -> %', r.col, v_cur, r.target;
    end if;
  end loop;
end
$do$;

-- condition и status: текст -> перечислимый тип. Всё, что не входит в словарь,
-- обнуляем (condition) или считаем активным (status) — так поступать честнее,
-- чем ронять миграцию из-за одной строки с мусором.
do $do$
declare
  v_cur text;
begin
  select format_type(a.atttypid, a.atttypmod) into v_cur
    from pg_attribute a
   where a.attrelid = 'public.listings'::regclass and a.attname = 'condition'
     and a.attnum > 0 and not a.attisdropped;

  if v_cur is not null and v_cur not in ('item_condition', 'public.item_condition') then
    alter table public.listings alter column condition drop default;
    alter table public.listings
      alter column condition type item_condition
      using (case lower(btrim(condition::text))
               when 'new'  then 'new'
               when 'used' then 'used'
               else null
             end)::item_condition;
    raise notice 'BAZAR 300: listings.condition приведена % -> item_condition', v_cur;
  end if;

  select format_type(a.atttypid, a.atttypmod) into v_cur
    from pg_attribute a
   where a.attrelid = 'public.listings'::regclass and a.attname = 'status'
     and a.attnum > 0 and not a.attisdropped;

  if v_cur is not null and v_cur not in ('listing_status', 'public.listing_status') then
    alter table public.listings alter column status drop default;
    alter table public.listings
      alter column status type listing_status
      using (case lower(btrim(coalesce(status::text, 'active')))
               when 'draft'    then 'draft'
               when 'sold'     then 'sold'
               when 'archived' then 'archived'
               when 'blocked'  then 'blocked'
               else 'active'
             end)::listing_status;
    raise notice 'BAZAR 300: listings.status приведена % -> listing_status', v_cur;
  end if;
end
$do$;

-- photos: если исторически лёг jsonb-массив, переливаем в text[].
-- ALTER ... USING подзапросы не принимает, поэтому через временную колонку.
do $do$
declare
  v_cur text;
begin
  select format_type(a.atttypid, a.atttypmod) into v_cur
    from pg_attribute a
   where a.attrelid = 'public.listings'::regclass and a.attname = 'photos'
     and a.attnum > 0 and not a.attisdropped;

  if v_cur in ('json', 'jsonb') then
    alter table public.listings add column if not exists photos__migrating text[];
    execute format(
      'update public.listings set photos__migrating =
         case when jsonb_typeof(photos::jsonb) = ''array''
              then array(select jsonb_array_elements_text(photos::jsonb))
              else ''{}''::text[] end');
    alter table public.listings drop column photos;
    alter table public.listings rename column photos__migrating to photos;
    raise notice 'BAZAR 300: listings.photos перелита % -> text[]', v_cur;
  elsif v_cur is not null and v_cur <> 'text[]' then
    execute 'alter table public.listings alter column photos drop default';
    execute 'alter table public.listings alter column photos type text[] using photos::text[]';
  end if;

  select format_type(a.atttypid, a.atttypmod) into v_cur
    from pg_attribute a
   where a.attrelid = 'public.listings'::regclass and a.attname = 'attrs'
     and a.attnum > 0 and not a.attisdropped;

  if v_cur is not null and v_cur <> 'jsonb' then
    execute 'alter table public.listings alter column attrs drop default';
    execute 'alter table public.listings alter column attrs type jsonb using attrs::jsonb';
  end if;
end
$do$;

-- ------------------------------------------------------------
-- 4. Значения по умолчанию
-- ------------------------------------------------------------
alter table public.listings
  alter column id           set default gen_random_uuid(),
  alter column description  set default '',
  alter column price        set default 0,
  alter column negotiable   set default false,
  alter column photos       set default '{}',
  alter column attrs        set default '{}',
  alter column status       set default 'active',
  alter column views_count  set default 0,
  alter column report_count set default 0,
  alter column created_at   set default now(),
  alter column updated_at   set default now(),
  alter column bumped_at    set default now(),
  alter column expires_at   set default (now() + interval '60 days');

-- ------------------------------------------------------------
-- 5. Нормализация данных перед ограничениями
-- ------------------------------------------------------------
update public.listings
   set description  = coalesce(description, ''),
       price        = coalesce(price, 0),
       negotiable   = coalesce(negotiable, false),
       photos       = coalesce(photos, '{}'),
       attrs        = coalesce(attrs, '{}'),
       status       = coalesce(status, 'active'),
       views_count  = coalesce(views_count, 0),
       report_count = coalesce(report_count, 0),
       created_at   = coalesce(created_at, now()),
       updated_at   = coalesce(updated_at, now()),
       bumped_at    = coalesce(bumped_at, created_at, now())
 where description is null or price is null or negotiable is null
    or photos is null or attrs is null or status is null
    or views_count is null or report_count is null
    or created_at is null or updated_at is null or bumped_at is null;

-- Старым объявлениям даём полные 60 дней от сегодня, а не от created_at:
-- иначе в день миграции половина ленты разом протухнет и уедет в архив.
update public.listings
   set expires_at = now() + interval '60 days'
 where expires_at is null;

-- floor = 0 в старом клиенте означал «торга нет», а контракт требует NULL
-- (0 не проходит check floor > 0). Заодно снимаем невозможный floor > price.
update public.listings
   set floor = null
 where floor is not null and (floor <= 0 or floor > price);

-- ------------------------------------------------------------
-- 6. NOT NULL
--    Поколоночно и с перехватом: owner_id/title в боевой базе теоретически
--    могут быть пустыми, и тогда важнее domиграть остальное, чем упасть.
-- ------------------------------------------------------------
do $do$
declare
  c text;
begin
  foreach c in array array[
    'owner_id','title','description','price','negotiable','category','subcategory',
    'city','photos','attrs','status','views_count','report_count',
    'created_at','updated_at','bumped_at','expires_at'
  ]
  loop
    begin
      execute format('alter table public.listings alter column %I set not null', c);
    exception when not_null_violation then
      raise warning 'BAZAR 300: в listings.% есть NULL — not null не поставлен, почините данные и прогоните файл ещё раз', c;
    end;
  end loop;
end
$do$;

-- ------------------------------------------------------------
-- 7. Внешние ключи и check-ограничения
-- ------------------------------------------------------------
do $do$
declare
  r record;
begin
  for r in
    select *
      from (values
        -- внешние ключи
        ('listings_owner_id_fkey',
         'foreign key (owner_id) references auth.users(id) on delete cascade'),
        ('listings_category_fkey',
         'foreign key (category) references public.categories(id)'),
        ('listings_city_fkey',
         'foreign key (city) references public.cities(name)'),
        -- проверки из контракта
        ('listings_title_len_check',
         'check (char_length(btrim(title)) between 3 and 120)'),
        ('listings_description_len_check',
         'check (char_length(description) <= 5000)'),
        ('listings_price_range_check',
         'check (price >= 0 and price <= 10000000000)'),
        ('listings_photos_limit_check',
         'check (array_length(photos, 1) is null or array_length(photos, 1) <= 10)'),
        ('listings_floor_check',
         'check (floor is null or (floor > 0 and floor <= price))')
      ) as v(name, def)
  loop
    if not exists (
      select 1 from pg_constraint
       where conrelid = 'public.listings'::regclass and conname = r.name
    ) then
      execute format('alter table public.listings add constraint %I %s not valid', r.name, r.def);
    end if;

    -- validate идемпотентен: на уже проверенном ограничении это no-op
    begin
      execute format('alter table public.listings validate constraint %I', r.name);
    exception
      when check_violation or foreign_key_violation then
        raise warning
          'BAZAR 300: ограничение % осталось NOT VALID — старые строки его нарушают (новые всё равно проверяются)',
          r.name;
    end;
  end loop;
end
$do$;

-- ------------------------------------------------------------
-- 8. Индексы
-- ------------------------------------------------------------
create index if not exists listings_search_vector_idx
  on public.listings using gin (search_vector);

-- pg_trgm в Supabase живёт в схеме extensions, а не в public: имя опкласса
-- резолвим динамически, иначе голое gin_trgm_ops упадёт при чужом search_path.
do $do$
declare
  v_ns text;
begin
  select n.nspname into v_ns
    from pg_opclass o
    join pg_namespace n on n.oid = o.opcnamespace
    join pg_am am       on am.oid = o.opcmethod
   where o.opcname = 'gin_trgm_ops' and am.amname = 'gin'
   limit 1;

  if v_ns is null then
    raise exception 'BAZAR 300: нет опкласса gin_trgm_ops — расширение pg_trgm ставится в 100_extensions.sql';
  end if;

  execute format(
    'create index if not exists listings_title_trgm_idx on public.listings using gin (title %I.gin_trgm_ops)',
    v_ns);
end
$do$;

create index if not exists listings_status_bumped_idx
  on public.listings (status, bumped_at desc);

create index if not exists listings_cat_sub_status_idx
  on public.listings (category, subcategory, status);

create index if not exists listings_city_status_idx
  on public.listings (city, status);

create index if not exists listings_price_active_idx
  on public.listings (price) where status = 'active';

create index if not exists listings_attrs_idx
  on public.listings using gin (attrs jsonb_path_ops);

create index if not exists listings_owner_created_idx
  on public.listings (owner_id, created_at desc);

-- ------------------------------------------------------------
-- 9. Триггеры
-- ------------------------------------------------------------

-- 9.1 search_vector.
-- Контракт называет функцию public.bazar_tsv, но не фиксирует её сигнатуру
-- (100_extensions.sql пишется параллельно). Поэтому подстраиваемся под то, что
-- реально лежит в базе на момент миграции, и проверяем выражение пробным
-- вызовом — лучше узнать о несовпадении здесь, чем на первом же insert'е.
do $do$
declare
  v_ret      text;
  v_nargs    int;
  v_ndef     int;
  v_variadic boolean;
  v_expr     text;
  v_trigfn   text := 'public.tg_listings_search_vector()';
  v_probe    text;
  v_default  constant text :=
    'setweight(to_tsvector(''russian'', coalesce(new.title, '''')), ''A'') || '
 || 'setweight(to_tsvector(''russian'', coalesce(new.description, '''')), ''B'')';
begin
  select p.prorettype::regtype::text, p.pronargs, p.pronargdefaults, p.provariadic <> 0
    into v_ret, v_nargs, v_ndef, v_variadic
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'bazar_tsv'
   order by p.pronargs desc
   limit 1;

  if not found then
    raise warning 'BAZAR 300: public.bazar_tsv не найдена (100_extensions.sql), search_vector считаем своей формулой';
    v_expr := v_default;
  elsif v_ret = 'trigger' then
    -- bazar_tsv сама триггерная функция — вешаем её напрямую
    v_trigfn := 'public.bazar_tsv()';
  elsif v_variadic or (v_nargs >= 2 and v_nargs - v_ndef <= 2) then
    v_expr := 'public.bazar_tsv(new.title, new.description)';
  elsif v_nargs - v_ndef <= 1 and v_nargs >= 1 then
    v_expr := 'public.bazar_tsv(coalesce(new.title, '''') || '' '' || coalesce(new.description, ''''))';
  else
    raise warning 'BAZAR 300: у public.bazar_tsv неожиданная сигнатура (% арг.), search_vector считаем своей формулой', v_nargs;
    v_expr := v_default;
  end if;

  if v_expr is not null then
    -- пробный прогон выражения с литералами вместо new.*
    v_probe := replace(replace(v_expr, 'new.title', quote_literal('проверка')),
                       'new.description', quote_literal('проверка'));
    begin
      execute format('select (%s) is not null', v_probe);
    exception when others then
      raise warning 'BAZAR 300: % не выполняется (%), search_vector считаем своей формулой', v_expr, sqlerrm;
      v_expr := v_default;
    end;

    execute format($fn$
      create or replace function public.tg_listings_search_vector() returns trigger
      language plpgsql
      as $body$
      begin
        new.search_vector := %s;
        return new;
      end
      $body$;
    $fn$, v_expr);
  end if;

  drop trigger if exists listings_search_vector on public.listings;
  execute format(
    'create trigger listings_search_vector before insert or update of title, description '
 || 'on public.listings for each row execute function %s', v_trigfn);
end
$do$;

-- Досчитываем вектор старым строкам. Делается здесь, ДО триггеров такcономии
-- и updated_at: иначе legacy-строка с неизвестной подкатегорией уронила бы
-- backfill, а у всех объявлений разом поехала бы дата обновления.
update public.listings set title = title where search_vector is null;

-- 9.2 Пара категория+подкатегория.
-- security definer: справочник subcategories закрыт RLS, а проверять пару надо
-- и для anon-вставок через RPC. Функция ничего не возвращает наружу (только
-- бросает исключение), вызвать её напрямую Postgres не даст — это триггерная
-- функция, — а привязку к чужой таблице отсекаем проверкой tg_table_name.
create or replace function public.tg_listings_check_taxonomy() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
begin
  if tg_table_schema <> 'public' or tg_table_name <> 'listings' then
    raise exception 'BAZAR: tg_listings_check_taxonomy повешена на постороннюю таблицу %.%',
      tg_table_schema, tg_table_name using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.subcategories s
     where s.category_id = new.category and s.name = new.subcategory
  ) then
    raise exception 'BAZAR: подкатегория «%» не принадлежит категории «%»',
      new.subcategory, new.category
      using errcode = '23514',
            hint = 'допустимые пары лежат в public.subcategories';
  end if;

  return new;
end
$fn$;

drop trigger if exists listings_taxonomy_check on public.listings;
create trigger listings_taxonomy_check
  before insert or update of category, subcategory on public.listings
  for each row execute function public.tg_listings_check_taxonomy();

-- 9.3 updated_at.
-- Своя функция, а не общая из 100: имя листинг-специфичное, коллизий с чужими
-- файлами не будет. WHEN отсекает пустые сохранения — PostgREST шлёт весь набор
-- колонок, и «Сохранить» без правок иначе двигало бы дату обновления.
create or replace function public.tg_listings_updated_at() returns trigger
language plpgsql
as $fn$
begin
  new.updated_at := now();
  return new;
end
$fn$;

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
  before update on public.listings
  for each row when (old.* is distinct from new.*)
  execute function public.tg_listings_updated_at();

-- 9.4 Защита блокировки.
-- RLS разрешает владельцу править свои строки в любом статусе — иначе он не
-- отредактирует заблокированное объявление. Но выйти из 'blocked' сам он не
-- должен, иначе автоблокировка по трём жалобам (700_moderation) снимается в
-- один клик. Модерация ходит от postgres/service_role — ей можно.
create or replace function public.tg_listings_status_guard() returns trigger
language plpgsql
as $fn$
begin
  if new.status is distinct from old.status
     and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'BAZAR: снять блокировку с объявления может только модерация'
      using errcode = '42501';
  end if;
  return new;
end
$fn$;

drop trigger if exists listings_status_guard on public.listings;
create trigger listings_status_guard
  before update of status on public.listings
  for each row when (old.status = 'blocked')
  execute function public.tg_listings_status_guard();

-- 9.4b Сброс минимальной цены при снижении цены.
-- Ограничение floor <= price правильно для вставки, но на UPDATE оно роняет
-- законный сценарий: продавец опускает цену НИЖЕ своего же старого минимума.
-- Ошибку про check-constraint человек не поймёт. Поэтому здесь: если цена
-- упала ниже floor, торг обнуляем (floor := null) — старый минимум потерял
-- смысл, продавец при желании выставит новый. BEFORE-триггер срабатывает до
-- проверки ограничения, так что конфликта не будет.
create or replace function public.tg_listings_clamp_floor() returns trigger
language plpgsql
as $fn$
begin
  -- Сбрасываем floor ТОЛЬКО когда цену реально опустили ниже старого минимума.
  -- Если же floor > price из-за кривого ввода самого floor (цена не менялась) —
  -- не глотаем ошибку, а даём check-ограничению её отклонить: это опечатка
  -- продавца, и молча стереть минимум хуже, чем честно отказать.
  if tg_op = 'UPDATE'
     and new.floor is not null and new.floor > new.price
     and new.price < old.price          -- цену снизили
     and new.floor is not distinct from old.floor then  -- floor не трогали
    new.floor := null;
  end if;
  return new;
end
$fn$;

drop trigger if exists listings_clamp_floor on public.listings;
create trigger listings_clamp_floor
  before insert or update of price, floor on public.listings
  for each row execute function public.tg_listings_clamp_floor();

-- 9.5 profiles.ads_count.
-- Слушаем только status/owner_id: счётчик считает активные объявления, а
-- вешать пересчёт на каждый инкремент views_count — гарантированный тормоз.
do $do$
begin
  if to_regprocedure('public.tg_sync_ads_count()') is null then
    raise exception 'BAZAR 300: нет public.tg_sync_ads_count() — сначала прогоните 200_profiles.sql';
  end if;
end
$do$;

drop trigger if exists listings_sync_ads_count on public.listings;
create trigger listings_sync_ads_count
  after insert or delete or update of status, owner_id on public.listings
  for each row execute function public.tg_sync_ads_count();

-- ------------------------------------------------------------
-- 10. RLS
--
--     Главная идея: чужие строки из самой таблицы не читает никто. Владелец
--     видит и правит свои в любом статусе, все остальные — включая гостя —
--     идут во вью public_listings (310), где колонки floor физически нет.
--     Пока это единственная гарантия того, что минимальная цена продавца не
--     утечёт в devtools покупателя.
-- ------------------------------------------------------------

-- Сначала снимаем всё постороннее: в боевой базе таблица заводилась руками и
-- на ней вполне может висеть политика вида «select using (true)», которая
-- отдаёт floor всему интернету. Свои политики пересоздаём ниже.
do $do$
declare
  r record;
begin
  for r in
    select policyname
      from pg_policies
     where schemaname = 'public' and tablename = 'listings'
       and policyname <> all (array[
         'listings_select_own','listings_insert_own',
         'listings_update_own','listings_delete_own'])
  loop
    execute format('drop policy %I on public.listings', r.policyname);
    raise notice 'BAZAR 300: снята посторонняя политика % (могла отдавать floor наружу)', r.policyname;
  end loop;
end
$do$;

alter table public.listings enable row level security;

-- (select auth.uid()) вместо auth.uid(): так планировщик вычисляет его один
-- раз на запрос, а не на каждую строку — на 6000+ объявлениях это заметно.
drop policy if exists listings_select_own on public.listings;
create policy listings_select_own on public.listings
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists listings_insert_own on public.listings;
create policy listings_insert_own on public.listings
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

-- with check тем же условием: иначе владелец мог бы переписать owner_id и
-- «подарить» объявление чужому аккаунту.
drop policy if exists listings_update_own on public.listings;
create policy listings_update_own on public.listings
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists listings_delete_own on public.listings;
create policy listings_delete_own on public.listings
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Гостю таблица не нужна вообще: он читает вью. Заодно это закрывает realtime —
-- подписка на listings отдавала бы гостю целые строки, включая floor.
revoke all on table public.listings from anon;
revoke all on table public.listings from authenticated;
grant select, insert, update, delete on table public.listings to authenticated;
grant all on table public.listings to service_role;

-- ------------------------------------------------------------
-- 11. Протухшие объявления
--     Вызывается по расписанию (pg_cron от postgres) или из service_role.
--     security definer не нужен: обе роли и так с bypassrls, а лишний definer —
--     лишняя дыра. Обычному пользователю функция просто не выдана.
-- ------------------------------------------------------------
create or replace function public.expire_listings()
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $fn$
declare
  v_count integer;
begin
  update public.listings
     set status = 'archived'
   where status = 'active'
     and expires_at < now();

  get diagnostics v_count = row_count;
  return v_count;
end
$fn$;

revoke all on function public.expire_listings() from public;
revoke all on function public.expire_listings() from anon;
revoke all on function public.expire_listings() from authenticated;
grant execute on function public.expire_listings() to service_role;

-- ------------------------------------------------------------
-- 12. Документация схемы
-- ------------------------------------------------------------
comment on table public.listings is
  'Объявления. Читается наружу только через вью public_listings: прямой select чужих строк закрыт RLS, чтобы не утекала колонка floor.';

comment on column public.listings.owner_id is 'Автор объявления, auth.users(id); удаление аккаунта уносит объявления.';
comment on column public.listings.title is 'Заголовок, 3..120 символов после trim.';
comment on column public.listings.price is 'Цена в сомах. numeric, не float: на float цена 12 345.67 перестаёт быть собой.';
comment on column public.listings.negotiable is 'Продавец согласен торговаться «в свободной форме», без нижней границы.';
comment on column public.listings.floor is
  'СЕКРЕТ ПРОДАВЦА: минимальная цена, ниже которой он не отдаст. Наружу не отдаётся никогда — оценку предложения делает rpc_make_offer. NULL = торга нет.';
comment on column public.listings.subcategory is 'Русское название из subcategories.name; пару category+subcategory проверяет триггер.';
comment on column public.listings.district is 'Район города, свободный текст (справочника районов нет).';
comment on column public.listings.photos is 'Пути внутри бакета listing-photos, не URL и не base64. Максимум 10.';
comment on column public.listings.attrs is 'Характеристики по ATTR_SCHEMA клиента: {"brand":"Toyota","year":2015,...}. Индексируется gin/jsonb_path_ops для фильтров.';
comment on column public.listings.status is 'draft/active/sold/archived/blocked. Наружу видны только active.';
comment on column public.listings.views_count is 'Уникальные просмотры за сутки на зрителя, инкремент из listing_views.';
comment on column public.listings.report_count is 'Число жалоб; на третьей от разных людей объявление уходит в blocked.';
comment on column public.listings.search_vector is 'Полнотекстовый вектор по заголовку и описанию, поддерживается триггером listings_search_vector.';
comment on column public.listings.bumped_at is 'Дата поднятия в ленте. Сортировка ленты идёт по ней, а не по created_at.';
comment on column public.listings.expires_at is 'Срок жизни объявления; после него expire_listings() уводит его в archived.';
comment on column public.listings.sold_at is 'Момент отметки «продано» (ставит rpc_mark_sold).';

comment on function public.expire_listings() is
  'Переводит активные объявления с истёкшим expires_at в archived. Возвращает число обработанных строк. Вызывать по расписанию.';
comment on function public.tg_listings_check_taxonomy() is
  'Триггер: проверяет, что пара category+subcategory есть в справочнике subcategories.';
comment on function public.tg_listings_updated_at() is
  'Триггер: проставляет updated_at при реальном изменении строки.';
comment on function public.tg_listings_status_guard() is
  'Триггер: запрещает владельцу самому выводить объявление из статуса blocked.';

-- ═══════════════════════════════════════════════════════════
-- 305_test_data.sql
-- ═══════════════════════════════════════════════════════════

/* Пометка демо-данных.

   Витрину наполняют 6030 сгенерированных объявлений — без них сайт выглядит
   мёртвым, а серверный поиск нечем проверять. Но смешивать их с настоящими
   объявлениями без опознавательного знака нельзя: когда пойдут живые
   пользователи, демо надо будет убрать одной командой, не гадая, что чьё.

     delete from listings where is_test_data;
*/

alter table public.listings
  add column if not exists is_test_data boolean not null default false;

comment on column public.listings.is_test_data is
  'Сгенерированное демо-объявление. Настоящие объявления всегда false.';

/* Частичный индекс: нужен ровно один запрос — «покажи/удали демо».
   Полный индекс по булеву столбцу, где 99% строк одинаковы, бесполезен. */
create index if not exists listings_test_data_idx
  on public.listings (created_at desc) where is_test_data;

-- ═══════════════════════════════════════════════════════════
-- 310_listings_view.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================================
-- BAZAR · 310 · public_listings — публичное лицо объявления
--
-- Единственный способ прочитать чужое объявление. Прямой select таблицы
-- listings закрыт политикой listings_select_own (300): человек видит в самой
-- таблице только свои строки. Всё остальное идёт сюда.
--
-- Зачем вью, а не открытая политика на чтение: колонку floor (скрытая
-- минимальная цена продавца) нельзя отдавать покупателю. RLS отсекает строки,
-- но не колонки — а во вью колонки floor просто нет. Что не выбрано, то не
-- утечёт ни через select('*'), ни через адресный select('floor').
--
-- Модель безопасности (важно, легко сделать наоборот и всё сломать):
-- вью НАМЕРЕННО security definer (security_invoker = false). Политика
-- listings_select_own отдаёт из таблицы только СВОИ строки — если бы вью
-- исполнялась с правами вызывающего (invoker), покупатель видел бы через неё
-- ноль чужих объявлений, и витрина была бы пустой. Здесь всё наоборот, чем
-- в обычном правиле «не обходи RLS»: скрытие обеспечивают ПРОЕКЦИЯ (колонки
-- floor во вью нет вовсе) и фильтр status='active', а не построчная политика.
-- Прямой select таблицы по-прежнему закрыт — floor не достать ни через вью
-- (нет колонки), ни через таблицу (RLS отдаёт только своё).
-- ============================================================

drop view if exists public.public_listings;

create view public.public_listings
with (security_invoker = false)
as
select
  l.id,
  l.owner_id,
  l.title,
  l.description,
  l.price,
  l.negotiable,
  -- покупателю нужен только факт «торг уместен», а не само значение
  (l.floor is not null) as has_floor,
  l.category,
  l.subcategory,
  l.city,
  l.district,
  l.condition,
  l.photos,
  l.attrs,
  l.status,
  l.views_count,
  l.report_count,
  l.created_at,
  l.updated_at,
  l.bumped_at,
  l.expires_at,
  l.sold_at,
  coalesce(l.is_test_data, false) as is_test_data
from public.listings l
-- витрина = только то, что реально можно купить прямо сейчас: активные и
-- непросроченные. Черновики, проданное, архив и заблокированное сюда не
-- попадают. Владелец видит свои такие объявления через саму таблицу.
where l.status = 'active'
  and (l.expires_at is null or l.expires_at > now());

comment on view public.public_listings is
  'Публичное чтение объявлений. Без колонки floor (секрет продавца) — вместо неё has_floor. Только активные непросроченные. security_invoker, чтобы не обходить RLS.';

-- Гость — тоже покупатель: читать витрину должны и anon, и залогиненные.
grant select on public.public_listings to anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════
-- 400_storage.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================================
-- BAZAR · 400 · хранилище фотографий объявлений
--
-- Раньше фото лежали base64 прямо в колонке listings.photos: одно объявление
-- с тремя снимками ≈ 300 КБ в одной строке Postgres, база пухла на пустом
-- месте. Теперь снимки живут в бакете, а в колонке — только пути к ним.
--
-- Путь строго `{owner_id}/{listing_id}/{файл}`. Первый сегмент = владелец;
-- политики ниже сверяют его с auth.uid(), поэтому залить файл в чужую папку
-- нельзя, как бы клиент ни подделывал путь.
-- ============================================================

-- ------------------------------------------------------------
-- Бакет
-- ------------------------------------------------------------
-- Публичный на ЧТЕНИЕ (карточки показываются всем, в т.ч. гостям), но запись
-- закрыта политиками. public=true снимает только барьер на select объектов;
-- на insert/update/delete всё равно действуют политики storage.objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos', 'listing-photos', true,
  5 * 1024 * 1024,                                  -- 5 МБ на файл
  array['image/jpeg', 'image/png', 'image/webp']    -- только картинки
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------
-- Политики доступа к объектам бакета
-- ------------------------------------------------------------
-- storage.objects общая для всех бакетов, поэтому каждая политика начинается
-- с bucket_id = 'listing-photos' — иначе правило растечётся на чужие бакеты.
--
-- Ключ проверки владельца: (storage.foldername(name))[1] — первый сегмент
-- пути. Он обязан равняться auth.uid()::text. storage.foldername возвращает
-- массив сегментов пути без имени файла; [1] — папка верхнего уровня.

-- читать может кто угодно (бакет публичный, но пусть будет и явное правило)
drop policy if exists "listing_photos_read" on storage.objects;
create policy "listing_photos_read" on storage.objects
  for select
  using (bucket_id = 'listing-photos');

-- загрузка: только залогиненный и только в свою папку
drop policy if exists "listing_photos_insert_own" on storage.objects;
create policy "listing_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- замена файла: тоже только в своей папке (upsert, поворот фото)
drop policy if exists "listing_photos_update_own" on storage.objects;
create policy "listing_photos_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- удаление: только своё (при удалении объявления или замене снимков)
drop policy if exists "listing_photos_delete_own" on storage.objects;
create policy "listing_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════
-- 500_search.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================================================
-- 500_search.sql — серверный поиск BAZAR
--
--   rpc_search_listings — лента и поиск: полнотекст + фильтры + keyset-страницы
--   rpc_attr_counts     — счётчики значений характеристик для панели фильтров
--
-- Почему это вообще на сервере. Сейчас клиент тянет все объявления и фильтрует
-- их в браузере (js/app.js: applyFilters / attrCountsFor). На 6030 мок-строках
-- это ещё работает, на реальной базе — нет: трафик растёт линейно, а телефон
-- пересчитывает счётчики характеристик на каждый тап по фильтру.
--
-- Файл идемпотентен: все объекты пересоздаются, drop идёт перед create там,
-- где сигнатура может измениться (create or replace не умеет менять тип
-- возврата и падает при повторном прогоне после правки).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Мелкие чистые хелперы
--
-- Ни один из них НЕ security definer и НЕ фиксирует search_path: они не
-- обращаются к таблицам, только к функциям pg_catalog, и я хочу, чтобы
-- планировщик мог их инлайнить. Функция с `SET` в определении не инлайнится
-- никогда, а bazar_attr_num и bazar_cursor_encode вызываются на КАЖДУЮ строку
-- выборки — там это разница в разы.
-- ----------------------------------------------------------------------------

-- Числовое значение атрибута или NULL, если там не число.
-- Значения attrs заполняет человек (или парсер заголовков в js/attributes.js),
-- поэтому в year может лежать '2015', 2015 или 'не помню'. Прямой ::numeric
-- уронил бы весь запрос на одной кривой строке. Обёртка begin/exception здесь
-- тоже не годится: это подтранзакция на каждую строку выборки. Регулярка
-- дешевле на порядок и даёт ровно тот же результат.
create or replace function public.bazar_attr_num(p_attrs jsonb, p_key text)
returns numeric
language sql
immutable
parallel safe
as $$
  select case
           when p_attrs ->> p_key ~ '^\s*-?[0-9]+(\.[0-9]+)?\s*$'
           then (p_attrs ->> p_key)::numeric
         end;
$$;

comment on function public.bazar_attr_num(jsonb, text) is
  'Значение ключа attrs как numeric; NULL, если значение не число (не падает на мусоре).';


-- Клиент шлёт «фильтр не задан» тремя разными способами: '', 'all' (город,
-- период) и 'any' (состояние, тип продавца) — см. defaultFilters() в js/app.js.
-- Без этой нормализации фильтр city='all' искал бы город с названием «all»
-- и отдавал ноль результатов.
create or replace function public.bazar_nz(p text)
returns text
language sql
immutable
parallel safe
as $$
  select nullif(nullif(nullif(btrim(coalesce(p, '')), ''), 'all'), 'any');
$$;

comment on function public.bazar_nz(text) is
  'Сентинелы клиента ('''' / ''all'' / ''any'') → NULL, то есть «фильтр не задан».';


-- Точные значения характеристик: всё, кроме диапазонных ключей вида ключMin /
-- ключMax и пустых значений. Результат идёт в оператор @> — он ложится на
-- индекс gin (attrs jsonb_path_ops) из 300.
create or replace function public.bazar_attrs_exact(p_attrs jsonb)
returns jsonb
language sql
immutable
parallel safe
as $$
  select coalesce(
           jsonb_object_agg(e.key, e.value) filter (
             where e.key !~ '(Min|Max)$'
               and jsonb_typeof(e.value) <> 'null'
               and nullif(btrim(e.value #>> '{}'), '') is not null
           ),
           '{}'::jsonb)
  from jsonb_each(coalesce(p_attrs, '{}'::jsonb)) as e(key, value);
$$;

comment on function public.bazar_attrs_exact(jsonb) is
  'Из объекта фильтров характеристик — только точные значения (без *Min/*Max и пустых).';


-- Диапазоны: {"yearMin":"2010","yearMax":"2020"} → {"year":{"min":"2010","max":"2020"}}.
-- Границы оставляем текстом: валидирует их bazar_search_where, а хранить их
-- как numeric здесь нельзя — тогда мусорный ввод падал бы внутри immutable
-- функции без внятного сообщения.
create or replace function public.bazar_attrs_ranges(p_attrs jsonb)
returns jsonb
language sql
immutable
parallel safe
as $$
  select coalesce(jsonb_object_agg(t.base, t.spec), '{}'::jsonb)
  from (
    select substring(e.key from '^(.+)(?:Min|Max)$') as base,
           jsonb_object_agg(
             case when e.key like '%Min' then 'min' else 'max' end,
             btrim(e.value #>> '{}')
           ) filter (where nullif(btrim(e.value #>> '{}'), '') is not null) as spec
    from jsonb_each(coalesce(p_attrs, '{}'::jsonb)) as e(key, value)
    where e.key ~ '(Min|Max)$'
      and jsonb_typeof(e.value) <> 'null'
    group by 1
  ) t
  where t.base is not null and t.spec is not null;
$$;

comment on function public.bazar_attrs_ranges(jsonb) is
  'Ключи ключMin/ключMax → {"ключ":{"min":...,"max":...}} для диапазонных фильтров.';


-- Курсор keyset-пагинации. Клиент обязан считать его непрозрачным и возвращать
-- байт-в-байт, поэтому кодируем base64url: '+' и '/' ломаются в query-строке,
-- а encode() ещё и разбивает вывод переводами строки каждые 76 символов —
-- их убираем, иначе курсор рвётся в логах и заголовках.
create or replace function public.bazar_cursor_encode(p jsonb)
returns text
language sql
immutable
parallel safe
as $$
  select translate(
           translate(encode(convert_to(p::text, 'UTF8'), 'base64'), E'\n\r', ''),
           '+/', '-_');
$$;

create or replace function public.bazar_cursor_decode(p text)
returns jsonb
language plpgsql
immutable
parallel safe
as $$
declare
  v jsonb;
begin
  select convert_from(decode(translate(p, '-_', '+/'), 'base64'), 'UTF8')::jsonb into v;
  if jsonb_typeof(v) <> 'object' then
    raise exception 'битый курсор поиска' using errcode = '22023';
  end if;
  return v;
exception when others then
  -- Тихо игнорировать битый курсор нельзя: клиент молча получил бы первую
  -- страницу вместо третьей и решил бы, что пагинация зациклилась.
  raise exception 'битый курсор поиска' using errcode = '22023';
end;
$$;

comment on function public.bazar_cursor_encode(jsonb) is
  'jsonb → непрозрачный base64url-курсор keyset-пагинации.';
comment on function public.bazar_cursor_decode(text) is
  'Обратно к jsonb; на мусоре — понятная ошибка, а не тихая первая страница.';


-- В каком схеме живёт pg_trgm, знать заранее нельзя: Supabase кладёт
-- расширения в `extensions`, чистый Postgres — в `public`. А search_path у
-- наших definer-функций по контракту прибит к `public, pg_temp`, поэтому
-- функции pg_trgm надо звать со схемой. NULL = расширения нет, тогда
-- триграммный откат просто выключается (см. rpc_search_listings).
create or replace function public.bazar_trgm_schema()
returns text
language sql
stable
parallel safe
as $$
  select n.nspname::text
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pg_trgm';
$$;

comment on function public.bazar_trgm_schema() is
  'Схема расширения pg_trgm (или NULL). Нужна, чтобы звать similarity со схемой при фиксированном search_path.';


-- ----------------------------------------------------------------------------
-- 2. Сборщик условия WHERE — единственный источник правды по семантике фильтров
--
-- rpc_search_listings и rpc_attr_counts обязаны фильтровать ОДИНАКОВО: если
-- счётчик обещает 128 объявлений, а выдача даёт 96, доверие к фильтрам
-- кончается сразу. Поэтому условие собирается здесь один раз, а обе RPC его
-- подставляют.
--
-- Почему текст, а не общая view/SRF: фильтров дюжина и почти все опциональные.
-- Статический запрос со списком `(p_city is null or l.city = p_city)` заставляет
-- планировщик строить один общий план на все комбинации и терять индексы, а
-- set-returning функция материализует весь список id и убивает смысл keyset —
-- страница должна стоить O(размера страницы), а не O(всей выдачи).
--
-- Инъекции: наружу не уходит ни одного куска пользовательской строки без
-- format(%L)/quote_ident. Числа и enum приходят уже типизированными.
-- ----------------------------------------------------------------------------
create or replace function public.bazar_search_where(
  p_query        text,
  p_category     text,
  p_subcategory  text,
  p_city         text,
  p_price_min    numeric,
  p_price_max    numeric,
  p_condition    item_condition,
  p_seller_kind  seller_kind,
  p_delivery     boolean,
  p_attrs        jsonb,
  p_period       text,
  p_mode         text          -- 'none' | 'fts' | 'trgm'
)
returns text
language plpgsql
stable
set search_path = public, pg_temp
as $bsw$
declare
  -- Алиасы фиксированы: l = public.listings, p = public.profiles.
  v_parts  text[] := array[
    -- Это и есть проверка прав для definer-функций поиска: наружу уходят
    -- только опубликованные и непросроченные объявления, чьё-либо авторство
    -- роли не играет. Черновики, проданное, заблокированное модерацией и
    -- протухшее не видит никто, включая владельца.
    'l.status = ''active''::listing_status',
    'l.expires_at > now()',
    -- Забаненный продавец исчезает из выдачи целиком. Иначе бан пришлось бы
    -- «доносить» до каждого его объявления отдельным апдейтом.
    '(p.banned_until is null or p.banned_until <= now())'
  ];
  v_exact  jsonb;
  v_ranges jsonb;
  v_days   int;
  v_trgm   text;
  r        record;
begin
  if p_category is not null then
    v_parts := v_parts || format('l.category = %L', p_category);
  end if;
  if p_subcategory is not null then
    v_parts := v_parts || format('l.subcategory = %L', p_subcategory);
  end if;
  if p_city is not null then
    v_parts := v_parts || format('l.city = %L', p_city);
  end if;

  -- price = 0 в этой базе означает «цена не указана / договорная», а не «даром».
  -- Такое объявление под ценовой диапазон не подходит: про него ничего не
  -- известно. Клиент ведёт себя ровно так же (applyFilters в js/app.js), и
  -- расхождение здесь дало бы разные выдачи до и после включения бэкенда.
  if p_price_min is not null then
    v_parts := v_parts || format('(l.price > 0 and l.price >= %L::numeric)', p_price_min);
  end if;
  if p_price_max is not null then
    v_parts := v_parts || format('(l.price > 0 and l.price <= %L::numeric)', p_price_max);
  end if;

  if p_condition is not null then
    v_parts := v_parts || format('l.condition = %L::item_condition', p_condition);
  end if;
  if p_seller_kind is not null then
    -- profiles подключён LEFT JOIN, поэтому объявление без профиля владельца
    -- при фильтре по типу продавца отсеется — это правильно: тип неизвестен.
    v_parts := v_parts || format('p.kind = %L::seller_kind', p_seller_kind);
  end if;

  -- Отдельной колонки delivery в контракте нет, признак живёт в attrs
  -- (в клиенте это hasDelivery). Форму `attrs @> '{"delivery": true}'`
  -- выбрал не случайно: только она ложится на gin (attrs jsonb_path_ops).
  if p_delivery is true then
    v_parts := v_parts || 'l.attrs @> ''{"delivery": true}''::jsonb';
  elsif p_delivery is false then
    v_parts := v_parts || 'not (l.attrs @> ''{"delivery": true}''::jsonb)';
  end if;

  -- Период. Контракт называет 'day'/'week'/'month', живой клиент шлёт '1'/'7'/'30'
  -- (см. фильтр-чипы в js/app.js) — принимаем оба словаря, иначе переключение
  -- на серверный поиск потребовало бы синхронной правки фронта.
  if public.bazar_nz(p_period) is not null then
    v_days := case lower(btrim(p_period))
                when 'day'   then 1
                when 'week'  then 7
                when 'month' then 30
                when 'year'  then 365
                else null
              end;
    if v_days is null then
      if btrim(p_period) ~ '^[0-9]+$' then
        v_days := btrim(p_period)::int;
      else
        raise exception 'неизвестный период поиска: %', p_period using errcode = '22023';
      end if;
    end if;
    -- Считаем от created_at, а не от bumped_at: «за неделю» — это про то,
    -- когда объявление появилось, иначе поднятое старьё выглядело бы свежим.
    v_parts := v_parts || format('l.created_at >= now() - %L::interval', v_days || ' days');
  end if;

  -- Точные характеристики одним @>: одно обращение к GIN вместо N сравнений.
  -- ВАЖНО: @> сверяет и JSON-тип тоже. Клиент хранит значения select-полей
  -- строками ('128', '2015'), фильтры шлёт тоже строками — совпадает. Числовые
  -- характеристики (year, mileage, area) фильтруются диапазонами ниже, там тип
  -- не важен, так что расхождение строка/число практике не мешает.
  v_exact := public.bazar_attrs_exact(p_attrs);
  if v_exact <> '{}'::jsonb then
    v_parts := v_parts || format('l.attrs @> %L::jsonb', v_exact);
  end if;

  -- Диапазоны. Нет атрибута — не подходит: «год от 2015» не должно вытаскивать
  -- объявления без года (так же ведёт себя passesAttrs в js/attributes.js).
  v_ranges := public.bazar_attrs_ranges(p_attrs);
  if v_ranges <> '{}'::jsonb then
    for r in select key, value from jsonb_each(v_ranges) loop
      if (r.value ->> 'min') is not null and (r.value ->> 'min') !~ '^-?[0-9]+(\.[0-9]+)?$' then
        raise exception 'граница фильтра %Min должна быть числом, пришло %', r.key, r.value ->> 'min'
          using errcode = '22023';
      end if;
      if (r.value ->> 'max') is not null and (r.value ->> 'max') !~ '^-?[0-9]+(\.[0-9]+)?$' then
        raise exception 'граница фильтра %Max должна быть числом, пришло %', r.key, r.value ->> 'max'
          using errcode = '22023';
      end if;
    end loop;
    v_parts := v_parts || format(
      'not exists (select 1 from jsonb_each(%L::jsonb) as rg(k, spec) where '
      || 'public.bazar_attr_num(l.attrs, rg.k) is null '
      || 'or (spec ->> ''min'' is not null and public.bazar_attr_num(l.attrs, rg.k) < (spec ->> ''min'')::numeric) '
      || 'or (spec ->> ''max'' is not null and public.bazar_attr_num(l.attrs, rg.k) > (spec ->> ''max'')::numeric))',
      v_ranges);
  end if;

  -- Текстовый поиск.
  if p_mode = 'fts' then
    -- websearch_to_tsquery, а не plainto_: человек имеет право написать
    -- "фразу в кавычках" и -минус-слово, и это должно работать, а не искаться
    -- буквально. Ещё он никогда не падает на кривом синтаксисе, в отличие от
    -- to_tsquery — а поисковую строку набирает пользователь.
    v_parts := v_parts || format('l.search_vector @@ websearch_to_tsquery(''russian'', %L)', p_query);
  elsif p_mode = 'trgm' then
    v_trgm := public.bazar_trgm_schema();
    if v_trgm is null then
      raise exception 'триграммный поиск запрошен, но расширение pg_trgm не установлено'
        using errcode = '0A000';
    end if;
    -- Мягкий откат «на похожесть», когда полнотекст не дал ничего.
    --
    -- Порог 0.5 по strict_word_similarity — не с потолка, замерял на строках
    -- вида реальных заголовков:
    --   опечатки, которые надо ловить: мерседесс→Мерседес 0.73, велосипет→
    --   Велосипед 0.67, халодильник→Холодильник 0.60, квартра→Квартира 0.55,
    --   «кросовки найк»→«Кроссовки Nike» 0.50;
    --   мусор, который ловить нельзя: стол→Столица 0.44, телефон→Телевизор
    --   0.29, ноутбук→Ноготочки 0.13.
    -- Ниже 0.45 в выдачу лезет «Столица» по запросу «стол» — а это ровно тот
    -- случай, из-за которого поиск считают сломанным. Взял обычный
    -- word_similarity — разделения нет вовсе: там и «стол»→«Столица» 0.80.
    --
    -- Индекс gin (title gin_trgm_ops) здесь не используется: его понимают
    -- только операторы <<% / %, а их порог живёт в сессионной GUC
    -- pg_trgm.strict_word_similarity_threshold, то есть был бы невидим в коде
    -- и менялся бы из-под ног. Явное сравнение дороже, но откат срабатывает
    -- только когда полнотекст дал ноль, и всегда поверх остальных фильтров.
    v_parts := v_parts || format('%I.strict_word_similarity(%L, l.title) >= 0.5', v_trgm, p_query);
  elsif p_mode <> 'none' then
    raise exception 'неизвестный режим текстового поиска: %', p_mode using errcode = '22023';
  end if;

  return array_to_string(v_parts, ' and ');
end;
$bsw$;

comment on function public.bazar_search_where(text, text, text, text, numeric, numeric,
                                              item_condition, seller_kind, boolean, jsonb, text, text) is
  'Собирает условие WHERE для поиска (алиасы l = listings, p = profiles). Общая семантика фильтров для rpc_search_listings и rpc_attr_counts.';


-- ----------------------------------------------------------------------------
-- 3. rpc_search_listings — лента и поиск
-- ----------------------------------------------------------------------------
drop function if exists public.rpc_search_listings(
  text, text, text, text, numeric, numeric, item_condition, seller_kind,
  boolean, jsonb, text, text, text, int);

create function public.rpc_search_listings(
  p_query        text default null,
  p_category     text default null,
  p_subcategory  text default null,
  p_city         text default null,
  p_price_min    numeric default null,
  p_price_max    numeric default null,
  p_condition    item_condition default null,
  p_seller_kind  seller_kind default null,
  p_delivery     boolean default null,
  p_attrs        jsonb default '{}'::jsonb,
  p_period       text default null,
  p_sort         text default 'date',
  p_cursor       text default null,
  p_limit        int default 24
)
returns table (
  -- Колонки public_listings, кроме search_vector: тащить tsvector на телефон
  -- незачем, он весит больше самого объявления. floor не отдаётся никогда —
  -- только признак has_floor, как требует контракт.
  id            uuid,
  owner_id      uuid,
  title         text,
  description   text,
  price         numeric,
  negotiable    boolean,
  has_floor     boolean,
  category      text,
  subcategory   text,
  city          text,
  district      text,
  condition     item_condition,
  photos        text[],
  attrs         jsonb,
  status        listing_status,
  views_count   int,
  report_count  int,
  created_at    timestamptz,
  updated_at    timestamptz,
  bumped_at     timestamptz,
  expires_at    timestamptz,
  sold_at       timestamptz,
  relevance     real,
  next_cursor   text,
  total_count   bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $rsl$
declare
  -- Точный count по всей выдаче — это второй проход по таблице ради числа,
  -- которое человек всё равно читает как «много». Компромисс: считаем до
  -- потолка. Ниже потолка число точное, выше — вернём сам потолок, и клиент
  -- показывает «20 000+». 20 000 выбрано так, чтобы весь текущий каталог
  -- (6030 объявлений) считался точно, а патологическая выдача не съедала
  -- таблицу целиком.
  c_count_cap constant int := 20000;

  v_limit   int;
  v_sort    text;
  v_mode    text := 'none';
  v_trgm    text := public.bazar_trgm_schema();
  v_q       text;
  v_tsq     tsquery;
  v_rank    text;
  v_where   text;
  v_keyset  text := 'true';
  v_sk      text;
  v_order   text;
  v_curexpr text;
  v_total   text;
  v_cur     jsonb;
  v_exists  boolean;
  v_sql     text;
begin
  -- Гостю поиск обязан работать: auth.uid() здесь не вызывается вообще.
  -- Выдача одинакова для всех, персонализация (избранное, свои объявления,
  -- скрытые жалобщиком) живёт в других запросах и не смешивается с поиском.

  if p_attrs is not null and jsonb_typeof(p_attrs) <> 'object' then
    raise exception 'p_attrs должен быть объектом' using errcode = '22023';
  end if;

  -- Потолок страницы: без него один вызов с p_limit = 10^6 выгребает базу.
  v_limit := least(greatest(coalesce(p_limit, 24), 1), 100);

  -- 'cheap'/'expensive'/'popular' — имена сортировок нынешнего клиента
  -- (js/app.js). Принимаем как синонимы, чтобы включение серверного поиска не
  -- требовало одновременной правки фронта. Неизвестную сортировку не глотаем:
  -- молчаливый откат на 'date' — это выдача, отсортированная не так, как
  -- показывает интерфейс, и ищут такое потом неделю.
  v_sort := lower(coalesce(nullif(btrim(p_sort), ''), 'date'));
  v_sort := case v_sort
              when 'cheap'     then 'price_asc'
              when 'expensive' then 'price_desc'
              else v_sort
            end;
  if v_sort not in ('date', 'price_asc', 'price_desc', 'relevance', 'popular') then
    raise exception 'неизвестная сортировка: %', p_sort using errcode = '22023';
  end if;

  v_q := nullif(btrim(coalesce(p_query, '')), '');
  if v_q is not null then
    v_tsq := websearch_to_tsquery('russian', v_q);
    if numnode(v_tsq) > 0 then
      v_mode := 'fts';
    else
      -- Запрос состоит из одних стоп-слов или знаков препинания: полнотекст
      -- по нему не построить. Пробуем триграммы, а без pg_trgm — показываем
      -- выдачу по остальным фильтрам, а не пустой экран.
      v_mode := case when v_trgm is null then 'none' else 'trgm' end;
    end if;
  end if;

  -- Сортировка по релевантности без запроса вырождается в случайный порядок.
  if v_sort = 'relevance' and v_mode = 'none' then
    v_sort := 'date';
  end if;

  if p_cursor is not null and btrim(p_cursor) <> '' then
    v_cur := public.bazar_cursor_decode(p_cursor);
    -- Курсор привязан к сортировке и к режиму текстового поиска. Если клиент
    -- сменил сортировку и оставил старый курсор, страницы просто не стыкуются:
    -- лучше внятная ошибка, чем молча перемешанная выдача.
    if (v_cur ->> 's') is distinct from v_sort then
      raise exception 'курсор относится к другой сортировке, начните выдачу заново'
        using errcode = '22023';
    end if;
    if (v_cur ->> 'm') is distinct from v_mode and coalesce(v_cur ->> 'm', 'none') <> v_mode then
      -- Режим фиксируем курсором: иначе вторая страница могла бы «сама»
      -- переехать с полнотекста на триграммы и показать другой набор.
      v_mode := v_cur ->> 'm';
    end if;
    if (v_cur ->> 'i') is null then
      raise exception 'битый курсор поиска' using errcode = '22023';
    end if;
  elsif v_mode = 'fts' and v_trgm is not null then
    -- Мягкий откат ищем ровно один раз — на первой странице. exists()
    -- останавливается на первой же строке, полного прохода нет.
    v_where := public.bazar_search_where(v_q, public.bazar_nz(p_category),
                 public.bazar_nz(p_subcategory), public.bazar_nz(p_city),
                 p_price_min, p_price_max, p_condition, p_seller_kind, p_delivery,
                 p_attrs, p_period, 'fts');
    execute 'select exists (select 1 from public.listings l'
         || ' left join public.profiles p on p.id = l.owner_id where ' || v_where || ')'
      into v_exists;
    if not v_exists then
      v_mode := 'trgm';
    end if;
  end if;

  v_where := public.bazar_search_where(v_q, public.bazar_nz(p_category),
               public.bazar_nz(p_subcategory), public.bazar_nz(p_city),
               p_price_min, p_price_max, p_condition, p_seller_kind, p_delivery,
               p_attrs, p_period, v_mode);

  -- Выражение релевантности. Оно попадает и в select, и (для keyset по
  -- релевантности) в where — поэтому собирается один раз строкой.
  v_rank := case v_mode
              when 'fts'  then format('ts_rank(l.search_vector, websearch_to_tsquery(''russian'', %L))', v_q)
              when 'trgm' then format('%I.strict_word_similarity(%L, l.title)', v_trgm, v_q)
              else             '0'
            end;

  -- Ключи сортировки выносим в page под фиксированными именами sk_*, чтобы
  -- и order by, и keyset, и курсор говорили об одном и том же.
  -- Все значения в курсоре — текст: float4 и numeric так переживают
  -- round-trip без потери разряда, а jsonb-число могло бы её дать.
  case v_sort
    when 'date' then
      v_sk    := 'l.bumped_at as sk_ts, null::numeric as sk_num, l.id as sk_id';
      v_order := 'sk_ts desc, sk_id desc';
      v_curexpr := format(
        'jsonb_build_object(''s'', %L, ''m'', %L, ''b'','
        || ' to_char(l.bumped_at at time zone ''UTC'', ''YYYY-MM-DD HH24:MI:SS.US''), ''i'', l.id)',
        v_sort, v_mode);
    when 'price_asc' then
      v_sk    := 'null::timestamptz as sk_ts, nullif(l.price, 0) as sk_num, l.id as sk_id';
      v_order := 'sk_num asc nulls last, sk_id asc';
      v_curexpr := format(
        'jsonb_build_object(''s'', %L, ''m'', %L, ''n'', nullif(l.price, 0)::text, ''i'', l.id)',
        v_sort, v_mode);
    when 'price_desc' then
      v_sk    := 'null::timestamptz as sk_ts, nullif(l.price, 0) as sk_num, l.id as sk_id';
      v_order := 'sk_num desc nulls last, sk_id asc';
      v_curexpr := format(
        'jsonb_build_object(''s'', %L, ''m'', %L, ''n'', nullif(l.price, 0)::text, ''i'', l.id)',
        v_sort, v_mode);
    when 'popular' then
      v_sk    := 'null::timestamptz as sk_ts, l.views_count::numeric as sk_num, l.id as sk_id';
      v_order := 'sk_num desc, sk_id desc';
      v_curexpr := format(
        'jsonb_build_object(''s'', %L, ''m'', %L, ''n'', l.views_count::text, ''i'', l.id)',
        v_sort, v_mode);
    else -- relevance
      v_sk    := 'l.bumped_at as sk_ts, null::numeric as sk_num, l.id as sk_id';
      v_order := 'relevance desc, sk_ts desc, sk_id desc';
      v_curexpr := format(
        'jsonb_build_object(''s'', %L, ''m'', %L, ''r'', (%s)::real::text, ''b'','
        || ' to_char(l.bumped_at at time zone ''UTC'', ''YYYY-MM-DD HH24:MI:SS.US''), ''i'', l.id)',
        v_sort, v_mode, v_rank);
  end case;

  -- Keyset вместо offset. offset на большой таблице заставляет базу
  -- пересчитать и выбросить все предыдущие страницы, а при вставке между
  -- запросами страницы начинают перекрываться — человек видит один и тот же
  -- товар дважды. Сравнение по кортежу от этого свободно.
  if v_cur is not null then
    case v_sort
      when 'date' then
        v_keyset := format('(l.bumped_at, l.id) < (%L::timestamptz, %L::uuid)',
                           (v_cur ->> 'b') || '+00', v_cur ->> 'i');
      when 'price_asc' then
        -- nulls last руками: сравнение кортежей с NULL даёт NULL, а не «дальше».
        v_keyset := case
          when (v_cur ->> 'n') is null
            then format('(nullif(l.price, 0) is null and l.id > %L::uuid)', v_cur ->> 'i')
          else format('(nullif(l.price, 0) > %L::numeric or nullif(l.price, 0) is null'
                      || ' or (nullif(l.price, 0) = %L::numeric and l.id > %L::uuid))',
                      v_cur ->> 'n', v_cur ->> 'n', v_cur ->> 'i')
        end;
      when 'price_desc' then
        v_keyset := case
          when (v_cur ->> 'n') is null
            then format('(nullif(l.price, 0) is null and l.id > %L::uuid)', v_cur ->> 'i')
          else format('(nullif(l.price, 0) < %L::numeric or nullif(l.price, 0) is null'
                      || ' or (nullif(l.price, 0) = %L::numeric and l.id > %L::uuid))',
                      v_cur ->> 'n', v_cur ->> 'n', v_cur ->> 'i')
        end;
      when 'popular' then
        v_keyset := format('(l.views_count, l.id) < (%L::int, %L::uuid)',
                           v_cur ->> 'n', v_cur ->> 'i');
      else -- relevance
        v_keyset := format('((%s)::real, l.bumped_at, l.id) < (%L::real, %L::timestamptz, %L::uuid)',
                           v_rank, v_cur ->> 'r', (v_cur ->> 'b') || '+00', v_cur ->> 'i');
    end case;
  end if;

  -- Общее число считаем только на первой странице: на второй и дальше клиент
  -- его уже знает, а повторный счёт удваивал бы стоимость каждой страницы.
  -- NULL в total_count = «спроси на первой странице», не «ноль».
  v_total := case
               when v_cur is null then format(
                 '(select count(*) from (select 1 from public.listings l'
                 || ' left join public.profiles p on p.id = l.owner_id'
                 || ' where %s limit %s) z)::bigint', v_where, c_count_cap)
               else 'null::bigint'
             end;

  -- Берём на одну строку больше, чем нужно: наличие «лишней» строки — это и
  -- есть ответ на вопрос «есть ли следующая страница». Без этого на последней
  -- странице пришлось бы отдавать курсор в никуда.
  v_sql := format($q$
    with page as (
      select l.id, l.owner_id, l.title, l.description, l.price, l.negotiable,
             (l.floor is not null) as has_floor,
             l.category, l.subcategory, l.city, l.district, l.condition,
             l.photos, l.attrs, l.status, l.views_count, l.report_count,
             l.created_at, l.updated_at, l.bumped_at, l.expires_at, l.sold_at,
             (%s)::real as relevance,
             public.bazar_cursor_encode(%s) as cur,
             %s
      from public.listings l
      left join public.profiles p on p.id = l.owner_id
      where %s and %s
      order by %s
      limit %s
    )
    select page.id, page.owner_id, page.title, page.description, page.price,
           page.negotiable, page.has_floor, page.category, page.subcategory,
           page.city, page.district, page.condition, page.photos, page.attrs,
           page.status, page.views_count, page.report_count,
           page.created_at, page.updated_at, page.bumped_at, page.expires_at,
           page.sold_at, page.relevance,
           case when (select count(*) from page) > %s
                then (select p2.cur from page p2 order by %s offset %s limit 1)
           end as next_cursor,
           %s as total_count
    from page
    order by %s
    limit %s
  $q$,
    v_rank, v_curexpr, v_sk, v_where, v_keyset, v_order, v_limit + 1,
    v_limit, v_order, v_limit - 1, v_total, v_order, v_limit);

  return query execute v_sql;
end;
$rsl$;

comment on function public.rpc_search_listings(text, text, text, text, numeric, numeric,
                                               item_condition, seller_kind, boolean, jsonb,
                                               text, text, text, int) is
  'Поиск и лента объявлений: полнотекст (russian, websearch) с откатом на триграммы, фильтры, keyset-пагинация. Работает для гостя. next_cursor и total_count продублированы в каждой строке; total_count не NULL только на первой странице.';


-- ----------------------------------------------------------------------------
-- 4. rpc_attr_counts — счётчики значений характеристик
--
-- Сейчас это делает браузер: attrCountsFor в js/app.js гоняет полный проход по
-- 6030 объявлениям на каждое открытие панели фильтров и на каждый тап.
--
-- Два правила, без которых счётчики бесполезны (оба — из attrCountsFor):
--   1. счётчик КЛЮЧА считается на выборке БЕЗ фильтра по этому же ключу.
--      Иначе после выбора «Toyota» у всех остальных марок будет ноль, они
--      погаснут, и сменить марку станет нечем;
--   2. зависимые ключи снимаются вместе с родителем: выбрав модель, надо
--      снять и модель, и поколение, считая марки — иначе залипает так же.
-- ----------------------------------------------------------------------------
drop function if exists public.rpc_attr_counts(text, text, jsonb);

create function public.rpc_attr_counts(
  p_category    text default null,
  p_subcategory text default null,
  p_filters     jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $rac$
declare
  -- Дерево зависимостей характеристик. Обязано совпадать с ATTR_DEPENDENTS
  -- в js/app.js — это одно и то же продуктовое правило «модель осмысленна
  -- только внутри марки».
  c_dependents constant jsonb := '{"brand": ["model", "gen"], "model": ["gen"]}'::jsonb;
  -- Потолок на число значений одного ключа: в <select> с 82 марками человек
  -- и так не смотрит дальше первых, а отдавать хвост из тысячи значений с
  -- единицей у каждого — это мегабайты трафика на подсказку.
  c_max_values constant int := 200;
  -- В attrs может лежать служебный признак доставки — он не характеристика
  -- и в панели фильтров отдельным списком не нужен.
  c_skip_keys  constant text[] := array['delivery'];

  v_f       jsonb := coalesce(p_filters, '{}'::jsonb);
  v_cat     text  := public.bazar_nz(p_category);
  v_sub     text  := public.bazar_nz(p_subcategory);
  v_q       text;
  v_city    text;
  v_pmin    numeric;
  v_pmax    numeric;
  v_cond    item_condition;
  v_kind    seller_kind;
  v_deliv   boolean;
  v_period  text;
  v_attrs   jsonb;
  v_keys    text[];
  v_mode    text := 'none';
  v_trgm    text := public.bazar_trgm_schema();
  v_tsq     tsquery;
  v_where   text;
  v_attrs_g jsonb;
  v_out     jsonb := '{}'::jsonb;
  v_base    jsonb;
  v_part    jsonb;
  v_exists  boolean;
  v_tmp     text;
  r         record;
begin
  if jsonb_typeof(v_f) <> 'object' then
    raise exception 'p_filters должен быть объектом' using errcode = '22023';
  end if;

  -- Разбор объекта фильтров клиента. Имена — как в state.filters (js/app.js);
  -- параллельно принимаем snake_case, чтобы новый клиент мог слать имена из
  -- контракта и не изобретать переходник.
  v_q     := public.bazar_nz(v_f ->> 'q');
  v_city  := public.bazar_nz(v_f ->> 'city');
  v_pmin  := coalesce(public.bazar_attr_num(v_f, 'priceMin'), public.bazar_attr_num(v_f, 'price_min'));
  v_pmax  := coalesce(public.bazar_attr_num(v_f, 'priceMax'), public.bazar_attr_num(v_f, 'price_max'));
  v_period := public.bazar_nz(v_f ->> 'period');

  -- Enum-значения проверяем списком, а не приведением: неизвестная строка от
  -- клиента должна давать понятный отказ, а не 22P02 из недр приведения типа.
  v_tmp := public.bazar_nz(v_f ->> 'condition');
  if v_tmp is not null then
    if v_tmp not in ('new', 'used') then
      raise exception 'неизвестное состояние: %', v_tmp using errcode = '22023';
    end if;
    v_cond := v_tmp::item_condition;
  end if;

  v_tmp := public.bazar_nz(coalesce(v_f ->> 'sellerType', v_f ->> 'seller_kind'));
  if v_tmp is not null then
    if v_tmp not in ('private', 'business') then
      raise exception 'неизвестный тип продавца: %', v_tmp using errcode = '22023';
    end if;
    v_kind := v_tmp::seller_kind;
  end if;

  -- Клиент шлёт delivery либо булевым, либо строкой из URL-параметров.
  if v_f ? 'delivery' and jsonb_typeof(v_f -> 'delivery') <> 'null' then
    v_deliv := case
                 when jsonb_typeof(v_f -> 'delivery') = 'boolean' then (v_f ->> 'delivery')::boolean
                 when lower(v_f ->> 'delivery') in ('true', '1')  then true
                 when lower(v_f ->> 'delivery') in ('false', '0', '') then false
               end;
  end if;

  v_attrs := case when jsonb_typeof(v_f -> 'attrs') = 'object' then v_f -> 'attrs' else '{}'::jsonb end;

  if jsonb_typeof(v_f -> 'keys') = 'array' then
    select array_agg(x #>> '{}')
      into v_keys
      from jsonb_array_elements(v_f -> 'keys') as x
     where nullif(btrim(x #>> '{}'), '') is not null;
  end if;

  -- Режим текстового поиска считаем ровно так же, как rpc_search_listings, и
  -- ОДИН раз на весь вызов: счётчики обязаны описывать ту же выдачу, которую
  -- человек видит рядом. Пересчёт режима на каждой группе ключей мог бы дать
  -- полнотекст в одном списке и триграммы в другом.
  if v_q is not null then
    v_tsq := websearch_to_tsquery('russian', v_q);
    v_mode := case when numnode(v_tsq) > 0 then 'fts'
                   when v_trgm is null then 'none'
                   else 'trgm' end;
    if v_mode = 'fts' and v_trgm is not null then
      v_where := public.bazar_search_where(v_q, v_cat, v_sub, v_city, v_pmin, v_pmax,
                                           v_cond, v_kind, v_deliv, v_attrs, v_period, 'fts');
      execute 'select exists (select 1 from public.listings l'
           || ' left join public.profiles p on p.id = l.owner_id where ' || v_where || ')'
        into v_exists;
      if not v_exists then
        v_mode := 'trgm';
      end if;
    end if;
  end if;

  -- Клиент может не присылать список ключей (он знает его из ATTR_SCHEMA, но
  -- новый клиент может и не знать). Тогда выясняем ключи по самим данным —
  -- по категории и подкатегории, без учёта прочих фильтров: иначе набор
  -- списков в панели прыгал бы от одного тапа к другому.
  if v_keys is null or cardinality(v_keys) = 0 then
    v_where := public.bazar_search_where(null, v_cat, v_sub, null, null, null,
                                         null, null, null, '{}'::jsonb, null, 'none');
    execute format($q$
      select array_agg(k)
      from (
        select a.key as k, count(*) as n
        from public.listings l
        left join public.profiles p on p.id = l.owner_id
        cross join lateral jsonb_each_text(l.attrs) as a(key, value)
        where %s and btrim(a.value) <> '' and not (a.key = any (%L::text[]))
        group by 1
        order by n desc
        limit 50
      ) d
    $q$, v_where, c_skip_keys)
      into v_keys;
  end if;

  if v_keys is null or cardinality(v_keys) = 0 then
    return '{}'::jsonb;
  end if;

  -- Ключи с одинаковым набором «что снять» считаются на ОДНОЙ выборке: марка,
  -- модель и поколение зависят друг от друга, а цвет и коробка — нет, значит
  -- проходов будет два-три, а не по одному на каждое поле.
  for r in
    with k as (
      select distinct unnest(v_keys) as key
    ),
    g as (
      select k.key,
             (array[k.key, k.key || 'Min', k.key || 'Max']
              || coalesce((select array_agg(d #>> '{}')
                           from jsonb_array_elements(c_dependents -> k.key) as d),
                          array[]::text[])) as drop_set
      from k
    )
    select array_agg(g.key order by g.key) as keys, g.drop_set
    from g
    group by g.drop_set
  loop
    v_attrs_g := (
      select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
      from jsonb_each(v_attrs) as e(key, value)
      where not (e.key = any (r.drop_set))
    );

    v_where := public.bazar_search_where(v_q, v_cat, v_sub, v_city, v_pmin, v_pmax,
                                         v_cond, v_kind, v_deliv, v_attrs_g, v_period, v_mode);

    execute format($q$
      select coalesce(jsonb_object_agg(g.k, g.vals), '{}'::jsonb)
      from (
        select t.k, jsonb_object_agg(t.v, t.n) as vals
        from (
          select c.k, c.v, c.n,
                 row_number() over (partition by c.k order by c.n desc, c.v) as rn
          from (
            select a.key as k, a.value as v, count(*) as n
            from public.listings l
            left join public.profiles p on p.id = l.owner_id
            cross join lateral jsonb_each_text(l.attrs) as a(key, value)
            where %s and a.key = any (%L::text[]) and btrim(a.value) <> ''
            group by 1, 2
          ) c
        ) t
        where t.rn <= %s
        group by t.k
      ) g
    $q$, v_where, r.keys, c_max_values)
      into v_part;

    v_out := v_out || coalesce(v_part, '{}'::jsonb);
  end loop;

  -- Ключ, по которому в выборке нет ни одного значения, должен вернуться
  -- пустым объектом, а не пропасть: пропажу клиент трактует как «счётчиков
  -- нет, оставить подписи как есть» и показывает числа от прошлой выборки.
  select coalesce(jsonb_object_agg(k, '{}'::jsonb), '{}'::jsonb)
    into v_base
    from unnest(v_keys) as k;

  return v_base || v_out;
end;
$rac$;

comment on function public.rpc_attr_counts(text, text, jsonb) is
  'Сколько объявлений даст каждое значение характеристики при текущих фильтрах: {"brand": {"Toyota": 128}, ...}. Счётчик ключа считается без фильтра по этому же ключу и без зависимых от него.';


-- ----------------------------------------------------------------------------
-- 5. Права
--
-- Хелперы — внутренняя кухня: bazar_search_where отдаёт кусок SQL, и снаружи
-- он никому не нужен. Обеим RPC явно открываем доступ гостю: поиск обязан
-- работать до логина.
-- ----------------------------------------------------------------------------
do $grants$
declare
  v_fn text;
begin
  foreach v_fn in array array[
    'public.bazar_attr_num(jsonb, text)',
    'public.bazar_nz(text)',
    'public.bazar_attrs_exact(jsonb)',
    'public.bazar_attrs_ranges(jsonb)',
    'public.bazar_cursor_encode(jsonb)',
    'public.bazar_cursor_decode(text)',
    'public.bazar_trgm_schema()',
    'public.bazar_search_where(text, text, text, text, numeric, numeric,'
      || ' item_condition, seller_kind, boolean, jsonb, text, text)',
    'public.rpc_search_listings(text, text, text, text, numeric, numeric,'
      || ' item_condition, seller_kind, boolean, jsonb, text, text, text, int)',
    'public.rpc_attr_counts(text, text, jsonb)'
  ]
  loop
    execute format('revoke all on function %s from public', v_fn);
  end loop;

  -- Ролей Supabase на голом Postgres нет — миграция не обязана из-за этого
  -- падать (локальная проверка схемы должна проходить где угодно).
  foreach v_fn in array array[
    'public.rpc_search_listings(text, text, text, text, numeric, numeric,'
      || ' item_condition, seller_kind, boolean, jsonb, text, text, text, int)',
    'public.rpc_attr_counts(text, text, jsonb)'
  ]
  loop
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('grant execute on function %s to anon', v_fn);
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('grant execute on function %s to authenticated', v_fn);
    end if;
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('grant execute on function %s to service_role', v_fn);
    end if;
  end loop;
end;
$grants$;

-- ═══════════════════════════════════════════════════════════
-- 600_personal.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================================================
-- 600_personal.sql — личное пространство пользователя:
--   favorites      — избранное (+ цена на момент добавления),
--   saved_searches — сохранённые поиски,
--   listing_views  — просмотры объявлений и честный счётчик views_count.
--
-- Сейчас всё это лежит в localStorage (bazar_favs, bazar_fav_meta, bazar_saved,
-- bazar_viewed) и умирает вместе с браузером: сменил телефон — избранного нет.
-- Здесь оно переезжает в базу.
--
-- Зависимости: 110_types (listing_status), 300_listings (public.listings).
-- Файл идемпотентен: переживает повторный прогон, накатывается и на пустую
-- базу, и поверх боевой (create if not exists / add column if not exists /
-- drop policy перед create policy).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------

create table if not exists public.favorites (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  listing_id   uuid        not null references public.listings(id) on delete cascade,
  note         text,
  folder       text,
  price_at_add numeric(12,2),
  created_at   timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- Догоняем колонки, если таблица уже была создана более ранней версией файла.
alter table public.favorites add column if not exists note         text;
alter table public.favorites add column if not exists folder       text;
alter table public.favorites add column if not exists price_at_add numeric(12,2);
alter table public.favorites add column if not exists created_at   timestamptz not null default now();

-- Заметка и папка — поля для человека, а не хранилище: без потолка таблица
-- превращается в бесплатный блоб-стор на пользовательских данных.
do $$
begin
  alter table public.favorites
    add constraint favorites_note_len_chk check (note is null or length(note) <= 500);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.favorites
    add constraint favorites_folder_len_chk check (folder is null or length(folder) <= 40);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.favorites
    add constraint favorites_price_at_add_chk check (price_at_add is null or price_at_add >= 0);
exception when duplicate_object then null;
end $$;

comment on table  public.favorites is
  'Избранное пользователя. Раньше жило в localStorage (bazar_favs + bazar_fav_meta) и терялось при смене устройства.';
comment on column public.favorites.note is
  'Личная заметка покупателя по объявлению («торгуется до 40к»). Видна только владельцу записи.';
comment on column public.favorites.folder is
  'Пользовательская папка избранного («Квартиры», «Подарки»); NULL = без папки.';
comment on column public.favorites.price_at_add is
  'Цена объявления в момент добавления. Нужна, чтобы показать «цена упала на N%» и чтобы триггер price_drop имел базу сравнения. Заполняется автоматически, если клиент не прислал.';

-- Индекс по listing_id обязателен: по нему ходит триггер уведомлений о падении
-- цены (favorites where listing_id = ...) и каскад при удалении объявления.
create index if not exists favorites_listing_id_idx on public.favorites (listing_id);
-- Лента «моё избранное» отсортирована по времени добавления.
create index if not exists favorites_user_created_idx on public.favorites (user_id, created_at desc);

-- Автоподстановка цены на момент добавления.
-- Definer, потому что прямой select чужого listings закрыт политикой (см.
-- контракт, раздел про floor), а цена нужна именно чужого объявления —
-- своё в избранном скорее исключение. Наружу функция отдаёт только price
-- активного объявления, то есть ровно то, что и так публично видно во вью
-- public_listings; floor и черновики не читаются никогда.
create or replace function public.tg_favorites_fill_price()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.price_at_add is null then
    select l.price into new.price_at_add
      from public.listings l
     where l.id = new.listing_id
       and l.status = 'active';   -- цену черновика/заблокированного не раскрываем
  end if;
  return new;
end;
$$;

comment on function public.tg_favorites_fill_price() is
  'Подставляет favorites.price_at_add из текущей цены активного объявления, если клиент её не передал.';

drop trigger if exists trg_favorites_fill_price on public.favorites;
create trigger trg_favorites_fill_price
  before insert on public.favorites
  for each row execute function public.tg_favorites_fill_price();

alter table public.favorites enable row level security;

drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own on public.favorites
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own on public.favorites
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists favorites_update_own on public.favorites;
create policy favorites_update_own on public.favorites
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own on public.favorites
  for delete to authenticated
  using (user_id = auth.uid());

-- Гостю в избранном делать нечего: право отбираем на уровне grant, не полагаясь
-- только на RLS (две независимые преграды вместо одной).
revoke all on public.favorites from anon;
grant select, insert, update, delete on public.favorites to authenticated;

-- ---------------------------------------------------------------------------
-- saved_searches
-- ---------------------------------------------------------------------------

create table if not exists public.saved_searches (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text        not null,
  query        jsonb       not null,
  notify       boolean     not null default true,
  last_seen_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  constraint saved_searches_user_name_key unique (user_id, name)
);

alter table public.saved_searches add column if not exists notify       boolean     not null default true;
alter table public.saved_searches add column if not exists last_seen_at timestamptz not null default now();
alter table public.saved_searches add column if not exists created_at   timestamptz not null default now();

-- Для таблицы, доставшейся от прошлой версии без этого ограничения.
do $$
begin
  alter table public.saved_searches
    add constraint saved_searches_user_name_key unique (user_id, name);
exception when duplicate_table then null;   -- индекс с таким именем уже есть
         when duplicate_object then null;   -- ограничение уже есть
end $$;

-- Имя показывается в списке — пустое имя = неотличимая строка в интерфейсе.
do $$
begin
  alter table public.saved_searches
    add constraint saved_searches_name_len_chk
    check (length(btrim(name)) between 1 and 120);
exception when duplicate_object then null;
end $$;

-- Фильтр клиента — десяток полей плюс attrs. 20 КБ хватает с запасом, а вот
-- без потолка сюда можно залить мегабайт JSON на каждую строку.
-- jsonb -> text (jsonb_out) immutable, поэтому выражение допустимо в check.
do $$
begin
  alter table public.saved_searches
    add constraint saved_searches_query_size_chk check (length(query::text) <= 20000);
exception when duplicate_object then null;
end $$;

comment on table  public.saved_searches is
  'Сохранённые поиски («уведомлять о новых»). Ключ (user_id, name) — повтор того же названия перезаписывать нельзя, клиент показывает «уже сохранён».';
comment on column public.saved_searches.query is
  'Полный объект фильтров клиента (state.filters) как есть: q, category, subcategory, city, price, attrs и т.д.';
comment on column public.saved_searches.notify is
  'Слать ли уведомления о новых объявлениях по этому поиску.';
comment on column public.saved_searches.last_seen_at is
  'Момент, когда пользователь последний раз открывал этот поиск. Всё, что новее — «+N новых» в бейдже (клиентский seenIds-снимок заменяется одной меткой времени).';

create index if not exists saved_searches_user_created_idx
  on public.saved_searches (user_id, created_at desc);

-- Потолок на число сохранённых поисков: клиент режет список до 30, но сервер
-- не должен верить клиенту — иначе таблица растёт бесконтрольно.
-- НЕ definer: под RLS count видит только свои строки, поэтому чужое количество
-- через эту функцию не подсмотреть.
create or replace function public.tg_saved_searches_limit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_count int;
begin
  select count(*) into v_count
    from public.saved_searches s
   where s.user_id = new.user_id;

  if v_count >= 50 then
    raise exception 'Превышен лимит сохранённых поисков (50). Удалите ненужные.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

comment on function public.tg_saved_searches_limit() is
  'Не даёт пользователю накопить больше 50 сохранённых поисков.';

drop trigger if exists trg_saved_searches_limit on public.saved_searches;
create trigger trg_saved_searches_limit
  before insert on public.saved_searches
  for each row execute function public.tg_saved_searches_limit();

alter table public.saved_searches enable row level security;

drop policy if exists saved_searches_select_own on public.saved_searches;
create policy saved_searches_select_own on public.saved_searches
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists saved_searches_insert_own on public.saved_searches;
create policy saved_searches_insert_own on public.saved_searches
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists saved_searches_update_own on public.saved_searches;
create policy saved_searches_update_own on public.saved_searches
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists saved_searches_delete_own on public.saved_searches;
create policy saved_searches_delete_own on public.saved_searches
  for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.saved_searches from anon;
grant select, insert, update, delete on public.saved_searches to authenticated;

-- ---------------------------------------------------------------------------
-- listing_views
-- ---------------------------------------------------------------------------

create table if not exists public.listing_views (
  listing_id        uuid        not null references public.listings(id) on delete cascade,
  viewer_id         uuid        references auth.users(id) on delete set null,
  viewer_fingerprint text,
  viewed_at         timestamptz not null default now()
);

alter table public.listing_views add column if not exists viewer_fingerprint text;
alter table public.listing_views add column if not exists viewed_at timestamptz not null default now();

-- Строка без «кто» бесполезна: по ней не построить суточную уникальность,
-- то есть счётчик снова накручивается перезагрузкой страницы.
do $$
begin
  alter table public.listing_views
    add constraint listing_views_viewer_chk
    check (viewer_id is not null or nullif(btrim(viewer_fingerprint), '') is not null);
exception when duplicate_object then null;
end $$;

comment on table  public.listing_views is
  'Просмотры объявлений. Один просмотр на «зрителя» в сутки — источник честного listings.views_count.';
comment on column public.listing_views.viewer_id is
  'Залогиненный зритель. on delete set null: пользователь ушёл, но просмотр из статистики продавца пропадать не должен.';
comment on column public.listing_views.viewer_fingerprint is
  'Отпечаток гостя (генерится клиентом и живёт в localStorage). Заполняется только когда viewer_id пуст.';
comment on column public.listing_views.viewed_at is
  'Момент просмотра, всегда серверный. NOT NULL здесь принципиален: по этой метке считается календарный день в ключе уникальности, а NULL сделал бы любой просмотр «уникальным».';

-- Ключ уникальности: (объявление, зритель, календарный день).
-- День считаем по Бишкеку, а не по UTC: для пользователя «сегодня» — это его
-- сегодня, иначе сутки счётчика ломались бы посреди дня (UTC+6).
-- Выражение timestamptz at time zone '<константа>' immutable, поэтому годится
-- для уникального индекса; generated-колонка тут не подошла бы.
create unique index if not exists listing_views_daily_uniq_idx
  on public.listing_views (
    listing_id,
    coalesce(viewer_id::text, viewer_fingerprint),
    ((viewed_at at time zone 'Asia/Bishkek')::date)
  );

create index if not exists listing_views_listing_time_idx
  on public.listing_views (listing_id, viewed_at desc);

-- Нормализация входа. Без неё суточную уникальность обходят в лоб: подсунул
-- viewed_at на год вперёд — и это «другой день», счётчик накручен.
create or replace function public.tg_listing_views_stamp()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.viewed_at := now();                                    -- время ставит сервер, не клиент
  new.viewer_fingerprint := left(btrim(coalesce(new.viewer_fingerprint, '')), 64);
  new.viewer_fingerprint := nullif(new.viewer_fingerprint, '');
  if new.viewer_id is not null then
    new.viewer_fingerprint := null;                          -- у залогиненного отпечаток лишний
  end if;
  return new;
end;
$$;

comment on function public.tg_listing_views_stamp() is
  'Нормализует строку просмотра: серверное время, обрезанный отпечаток, отпечаток только для гостей.';

drop trigger if exists trg_listing_views_stamp on public.listing_views;
create trigger trg_listing_views_stamp
  before insert on public.listing_views
  for each row execute function public.tg_listing_views_stamp();

-- Инкремент listings.views_count.
-- Definer обязателен: update чужого объявления политика listings не пропустит,
-- и счётчик молча остался бы нулём (RLS не ошибку даёт, а ноль строк).
-- Проверка прав: функция вызывается ТОЛЬКО как триггер (plpgsql не даст позвать
-- её иначе) на строке, которую уже пропустила RLS-политика listing_views,
-- и меняет ровно одно поле ровно того объявления, которое в этой строке.
create or replace function public.tg_listing_views_bump()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
begin
  select l.owner_id into v_owner
    from public.listings l
   where l.id = new.listing_id;

  if v_owner is null then
    return null;
  end if;

  -- Свои просмотры продавцу не считаем: иначе счётчик накручивается тем, что
  -- продавец сам открывает объявление, и цифра перестаёт что-либо значить.
  if new.viewer_id is not null and new.viewer_id = v_owner then
    return null;
  end if;

  update public.listings
     set views_count = views_count + 1
   where id = new.listing_id;

  return null;
end;
$$;

comment on function public.tg_listing_views_bump() is
  'Инкрементит listings.views_count на каждый засчитанный просмотр, кроме просмотров владельцем.';

drop trigger if exists trg_listing_views_bump on public.listing_views;
create trigger trg_listing_views_bump
  after insert on public.listing_views
  for each row execute function public.tg_listing_views_bump();

alter table public.listing_views enable row level security;

-- Читает статистику только продавец — это его данные о его объявлении.
drop policy if exists listing_views_select_owner on public.listing_views;
create policy listing_views_select_owner on public.listing_views
  for select to authenticated
  using (
    exists (
      select 1 from public.listings l
       where l.id = listing_views.listing_id
         and l.owner_id = auth.uid()
    )
  );

-- Писать может кто угодно, включая гостя: просмотр — не привилегия.
-- Но приписать просмотр чужому аккаунту нельзя.
drop policy if exists listing_views_insert_any on public.listing_views;
create policy listing_views_insert_any on public.listing_views
  for insert to anon, authenticated
  with check (viewer_id is null or viewer_id = auth.uid());

-- update/delete не даём никому: журнал просмотров правится только каскадом от
-- listings/auth.users. Политик нет — значит операция запрещена всем, кроме
-- service_role. Это осознанно.

revoke all on public.listing_views from anon, authenticated;
grant insert on public.listing_views to anon, authenticated;
grant select on public.listing_views to authenticated;

-- ---------------------------------------------------------------------------
-- rpc_track_view — засчитать просмотр (доступна гостю)
-- ---------------------------------------------------------------------------

-- drop перед create: create or replace не умеет менять тип возврата, а файл
-- обязан накатываться поверх предыдущей версии самого себя.
drop function if exists public.rpc_track_view(uuid, text);

create or replace function public.rpc_track_view(p_listing_id uuid, p_fingerprint text default null)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_fp     text;
  v_status listing_status;
  v_count  int;
begin
  -- Проверка прав здесь такая: функция не принимает «от чьего имени», личность
  -- берётся только из auth.uid(), а гостю разрешено ровно одно — прибавить
  -- просмотр активному объявлению. Ничего чужого наружу не отдаётся.
  select l.status, l.views_count into v_status, v_count
    from public.listings l
   where l.id = p_listing_id;

  if not found then
    return 0;                       -- нет такого объявления — считать нечего
  end if;

  if v_status <> 'active' then
    return v_count;                 -- снятое объявление просмотрами не растим
  end if;

  v_fp := nullif(left(btrim(coalesce(p_fingerprint, '')), 64), '');

  -- У гостя без внятного отпечатка нет суточного ключа: любой такой просмотр
  -- уникален, и счётчик накручивался бы перезагрузкой страницы. Молча не
  -- считаем — падать из-за счётчика просмотров смысла нет.
  if v_uid is null and (v_fp is null or length(v_fp) < 8) then
    return v_count;
  end if;

  insert into public.listing_views (listing_id, viewer_id, viewer_fingerprint)
  values (p_listing_id, v_uid, case when v_uid is null then v_fp else null end)
  on conflict do nothing;           -- повтор в тот же день — не ошибка, просто не считаем

  select l.views_count into v_count
    from public.listings l
   where l.id = p_listing_id;

  return coalesce(v_count, 0);
end;
$$;

comment on function public.rpc_track_view(uuid, text) is
  'Засчитывает просмотр объявления (гостю тоже можно) и возвращает актуальный views_count. Повторный вызов в тех же сутках счётчик не двигает.';

revoke all on function public.rpc_track_view(uuid, text) from public;
grant execute on function public.rpc_track_view(uuid, text) to anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════
-- 700_moderation.sql
-- ═══════════════════════════════════════════════════════════

/* 700_moderation.sql — жалобы на объявления (reports) и журнал модерации
   (moderation_log).

   Три решения, которые можно было принять иначе, поэтому объясняю:

   1. Счётчик жалоб пересчитывается ЦЕЛИКОМ — count(*), а не report_count + 1.
      Инкремент расходится с реальностью после любого отката, ручной правки в
      админ-панели и, главное, после УДАЛЕНИЯ жалобы: объявление осталось бы
      заблокированным навсегда, хотя жалоб уже нет. Пересчёт по индексу
      (listing_id, reporter_id) стоит доли миллисекунды — экономить не на чем.

   2. Автоматика трогает статус только у объявлений в 'active'. Тогда обратная
      операция однозначна: снять автоблокировку = вернуть 'active'. Иначе
      пришлось бы где-то помнить прежний статус и мы рисковали бы воскресить
      проданное или чужой черновик. Объявления не в 'active' и так не видны в
      public_listings, скрывать там нечего.

   3. Ручную блокировку модератора автоматика НЕ снимает. Разделение такое:
      'auto_hidden'/'restored' — работа триггера, 'blocked'/'cleared' — решение
      живого модератора. Если последняя запись в журнале не 'auto_hidden',
      объявление заблокировал человек, и падение числа жалоб ничего не значит.

   Читать жалобы и журнал не может никто, кроме service_role: админки пока нет,
   но «кто именно на меня пожаловался» — это то, что нельзя отдавать наружу
   вообще никогда, иначе жаловаться перестанут. */

/* Зависимости: типы из 110_types.sql, listings из 300_listings.sql.
   Падаем сразу и с понятным текстом, иначе ошибка вылезет глубоко в теле
   триггера уже на живых данных. */
do $$
begin
  if to_regtype('public.report_reason') is null or to_regtype('public.moderation_act') is null then
    raise exception '700_moderation: нет типов report_reason/moderation_act — сначала прогоните 110_types.sql';
  end if;
  if to_regclass('public.listings') is null then
    raise exception '700_moderation: нет таблицы listings — сначала прогоните 300_listings.sql';
  end if;
  if to_regprocedure('auth.role()') is null or to_regprocedure('auth.uid()') is null then
    raise exception '700_moderation: нет auth.uid()/auth.role() — база не похожа на Supabase';
  end if;
end $$;


/* ---------------------------------------------------------------- reports */

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  /* on delete set null, а не cascade: удалили аккаунт — жалоба остаётся.
     Она уже сыграла роль в блокировке, и обнулять её задним числом значит
     дать способ разблокировать объявление, удалив пару аккаунтов. */
  reporter_id uuid references auth.users(id) on delete set null,
  reason      public.report_reason not null,
  comment     text,
  created_at  timestamptz not null default now(),
  constraint reports_listing_id_reporter_id_key unique (listing_id, reporter_id)
);

/* Лечение таблицы, созданной прошлой версией файла: create table if not exists
   молча пропустит существующую таблицу с неполным набором колонок. */
alter table public.reports add column if not exists listing_id  uuid;
alter table public.reports add column if not exists reporter_id uuid;
alter table public.reports add column if not exists reason      public.report_reason;
alter table public.reports add column if not exists comment     text;
alter table public.reports add column if not exists created_at  timestamptz not null default now();

do $$
begin
  alter table public.reports
    add constraint reports_listing_id_reporter_id_key unique (listing_id, reporter_id);
exception
  when duplicate_table or duplicate_object then null;   -- ограничение уже на месте
end $$;

comment on table public.reports is
  'Жалобы пользователей на объявления. Одна жалоба от аккаунта на объявление '
  '(unique listing_id + reporter_id), три жалобы — автоскрытие. Видит только service_role.';
comment on column public.reports.reporter_id is
  'Кто пожаловался. NULL = аккаунт удалён после жалобы; сама жалоба продолжает считаться.';
comment on column public.reports.comment is
  'Свободный текст жалобы. Не показывается никому, кроме модерации.';

/* Индекс по (listing_id, reporter_id) уже есть — он же обслуживает пересчёт
   count(*) по listing_id и каскад при удалении объявления, отдельный индекс по
   listing_id был бы дублем. А вот reporter_id стоит вторым столбцом и как
   префикс не работает: без своего индекса удаление аккаунта (on delete set
   null) пойдёт seq scan'ом по всем жалобам. */
create index if not exists reports_reporter_id_idx on public.reports (reporter_id);

alter table public.reports enable row level security;

/* Жалуется только залогиненный и только от своего имени. Политики select нет
   вовсе: RLS без политики = строки не видны никому, кроме service_role
   (у него bypassrls). Клиенту поэтому нельзя делать insert().select() —
   RETURNING упрётся в отсутствующую политику чтения; вставка без select
   работает штатно, а повторная жалоба вернёт 23505 (unique_violation). */
drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

/* Права выдаём поколоночно: id и created_at должны браться из default'ов,
   иначе клиент сможет подделать время жалобы. */
revoke all on table public.reports from anon, authenticated;
grant insert (listing_id, reporter_id, reason, comment) on table public.reports to authenticated;
grant all on table public.reports to service_role;


/* --------------------------------------------------------- moderation_log */

create table if not exists public.moderation_log (
  id         bigserial primary key,
  listing_id uuid references public.listings(id) on delete cascade,
  act        public.moderation_act not null,
  actor_id   uuid references auth.users(id) on delete set null,
  note       text,
  created_at timestamptz not null default now()
);

alter table public.moderation_log add column if not exists listing_id uuid;
alter table public.moderation_log add column if not exists act        public.moderation_act;
alter table public.moderation_log add column if not exists actor_id   uuid;
alter table public.moderation_log add column if not exists note       text;
alter table public.moderation_log add column if not exists created_at timestamptz not null default now();

comment on table public.moderation_log is
  'Журнал модерации: что и почему сделали с объявлением. Пишется триггером жалоб '
  'и вручную модератором. Читает только service_role.';
comment on column public.moderation_log.act is
  'auto_hidden/restored — решение автоматики по числу жалоб; blocked/cleared — решение человека. '
  'Автоматика снимает только собственную блокировку, ручную не трогает.';
comment on column public.moderation_log.actor_id is
  'Кто действовал. NULL = автоматика (или удалённый аккаунт модератора).';

/* Триггеру нужна ровно одна выборка: последнее действие по объявлению.
   id в индексе — тай-брейк, когда две записи легли в одну микросекунду. */
create index if not exists moderation_log_listing_id_created_at_idx
  on public.moderation_log (listing_id, created_at desc, id desc);
create index if not exists moderation_log_actor_id_idx
  on public.moderation_log (actor_id);

alter table public.moderation_log enable row level security;
/* Политик нет намеренно: журнал модерации — служебные данные. */

revoke all on table public.moderation_log from anon, authenticated;
grant all on table public.moderation_log to service_role;

do $$
declare
  v_seq text := pg_get_serial_sequence('public.moderation_log', 'id');
begin
  if v_seq is not null then
    execute format('revoke all on sequence %s from anon, authenticated', v_seq);
    execute format('grant usage, select on sequence %s to service_role', v_seq);
  end if;
end $$;


/* -------------------------------------------------------------- механика */

/* Пересчёт жалоб по одному объявлению + решение о блокировке.

   security definer здесь обязателен и без вариантов: жалобщик по RLS не имеет
   права трогать чужое объявление и вообще не видит moderation_log. Защита
   definer-функции — не «проверка кто ты», а отсутствие рычага: функция не
   принимает ни статус, ни счётчик, она их СЧИТАЕТ из базы. Максимум, чего
   добьётся посторонний вызов, — приведение счётчика к правде. И всё же прямой
   вызов из клиента закрыт (см. проверку auth.role() и revoke ниже), чтобы
   нельзя было дёргать блокировку в обход жалоб. */
create or replace function public.moderation_recount_reports(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  /* Порог из контракта. Меняется здесь и больше нигде. */
  c_threshold constant int := 3;
  v_status    public.listing_status;
  v_count     int;
  v_last_act  public.moderation_act;
begin
  /* pg_trigger_depth() > 0 — нас позвал триггер жалоб. Прямой вызов разрешён
     только service_role (починить счётчики) и суперпользователю в psql, где
     JWT нет и auth.role() возвращает NULL. */
  if pg_trigger_depth() = 0 and coalesce(auth.role(), 'postgres') in ('anon', 'authenticated') then
    raise exception 'moderation_recount_reports(): прямой вызов из клиента запрещён'
      using errcode = '42501';
  end if;

  if p_listing_id is null then
    return;
  end if;

  /* Блокировка строки объявления сериализует две одновременные жалобы. Без неё
     обе транзакции увидели бы «жалоб 2», обе решили бы, что порог достигнут, и
     в журнале появились бы две записи об автоскрытии одного объявления. */
  select status into v_status from public.listings where id = p_listing_id for update;
  if not found then
    /* Объявление удаляют прямо сейчас, каскад снёс его жалобы — считать нечего. */
    return;
  end if;

  /* Каждая строка жалобы — отдельный аккаунт: unique (listing_id, reporter_id)
     не даёт одному человеку пожаловаться дважды. Поэтому count(*) и есть
     «сколько разных пользователей пожаловалось». */
  select count(*) into v_count from public.reports where listing_id = p_listing_id;

  update public.listings
     set report_count = v_count
   where id = p_listing_id
     and report_count is distinct from v_count;

  select act into v_last_act
    from public.moderation_log
   where listing_id = p_listing_id
   order by created_at desc, id desc
   limit 1;

  if v_count >= c_threshold and v_status = 'active' then
    update public.listings set status = 'blocked' where id = p_listing_id;
    insert into public.moderation_log (listing_id, act, actor_id, note)
    values (p_listing_id, 'auto_hidden', null,
            format('автоскрытие: жалоб %s при пороге %s', v_count, c_threshold));

  elsif v_count < c_threshold and v_status = 'blocked' and v_last_act = 'auto_hidden' then
    /* v_last_act = 'auto_hidden' — ключевое условие. Блокировку, которую
       поставил человек ('blocked') или которой вообще нет в журнале, снимать
       нельзя: иначе жалобщики отзывом жалоб отменяли бы решение модератора. */
    update public.listings set status = 'active' where id = p_listing_id;
    insert into public.moderation_log (listing_id, act, actor_id, note)
    values (p_listing_id, 'restored', null,
            format('автоскрытие снято: жалоб осталось %s при пороге %s', v_count, c_threshold));
  end if;
end $$;

comment on function public.moderation_recount_reports(uuid) is
  'Честный пересчёт жалоб по объявлению + авто-блокировка/разблокировка. Зовётся триггером reports; '
  'service_role может позвать вручную, чтобы починить разъехавшийся report_count.';

revoke all on function public.moderation_recount_reports(uuid) from public, anon, authenticated;
grant execute on function public.moderation_recount_reports(uuid) to service_role;


/* Жаловаться на собственное объявление бессмысленно: своя жалоба всё равно
   входит в порог, и владелец мог бы наполовину заблокировать сам себя, а в
   журнале осталась бы ложная картина «на него жалуются». Проверка требует
   чтения чужой строки listings, поэтому definer: у обычного пользователя по
   RLS видны только свои объявления, и invoker-версия отвергала бы вообще всё. */
create or replace function public.reports_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.reporter_id is not null
     and exists (select 1 from public.listings l
                  where l.id = new.listing_id and l.owner_id = new.reporter_id) then
    raise exception 'Нельзя пожаловаться на собственное объявление'
      using errcode = '23514';
  end if;

  new.comment := nullif(btrim(new.comment), '');
  return new;
end $$;

revoke all on function public.reports_before_insert() from public, anon, authenticated;

drop trigger if exists reports_before_insert on public.reports;
create trigger reports_before_insert
  before insert on public.reports
  for each row execute function public.reports_before_insert();


/* Одна точка входа на insert/delete/update — счётчик обязан быть верным во всех
   трёх случаях, а не только при появлении жалобы. */
create or replace function public.reports_after_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform public.moderation_recount_reports(old.listing_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.listing_id is distinct from new.listing_id then
    /* Жалобу перевесили на другое объявление — пересчитать надо оба. Порядок
       по значению uuid, а не «сначала старое»: две встречные правки иначе
       возьмут блокировки крест-накрест и поймают дедлок. */
    perform public.moderation_recount_reports(least(old.listing_id, new.listing_id));
    perform public.moderation_recount_reports(greatest(old.listing_id, new.listing_id));
    return new;
  end if;

  perform public.moderation_recount_reports(new.listing_id);
  return new;
end $$;

revoke all on function public.reports_after_change() from public, anon, authenticated;

/* update of listing_id, а не update целиком: смена reason или comment на число
   жалоб не влияет, гонять пересчёт и брать блокировку из-за неё незачем. */
drop trigger if exists reports_after_change on public.reports;
create trigger reports_after_change
  after insert or update of listing_id or delete on public.reports
  for each row execute function public.reports_after_change();

-- ═══════════════════════════════════════════════════════════
-- 750_reviews.sql
-- ═══════════════════════════════════════════════════════════

/* 750_reviews.sql — отзывы о продавцах и честный пересчёт рейтинга в profiles.

   Рейтинг считается ПОЛНОСТЬЮ: avg() по всем отзывам продавца, а не
   «(старое_среднее * n + новая_оценка) / (n + 1)». Инкрементальное среднее
   выглядит дешевле, но разъезжается на первой же правке отзыва (была 5, стала
   1 — в среднее надо вычесть старое значение, которого у триггера уже нет) и
   на удалении. Отзывов у продавца десятки, avg() по индексу (seller_id) —
   микросекунды, экономить нечего, а расхождение рейтинга с отзывами под ним
   пользователь замечает сразу.

   Защита от накрутки, слоями:
     * check (author_id <> seller_id) — сам себе оценку не поставишь;
     * RLS insert разрешает вставку только от своего имени (author_id = auth.uid()),
       так что «отзыв от лица другого» невозможен;
     * unique (author_id, listing_id) — один отзыв на объявление от автора;
     * отдельно закрыт обход через listing_id = NULL (см. reviews_before_write);
     * объявление обязано принадлежать оцениваемому продавцу — иначе отзыв
       можно было бы прицепить к любому чужому объявлению и получить столько
       «уникальных» отзывов, сколько в базе объявлений;
     * автор/продавец/дата у существующего отзыва неизменяемы — иначе правкой
       одной строки можно было бы перегонять оценку между продавцами.

   Чего эта схема НЕ ловит (осознанно): продавец с сообщником, который заводит
   объявления и оставляет по отзыву на каждое. Для этого нужен факт сделки,
   которого в базе нет. */

do $$
begin
  if to_regclass('public.listings') is null then
    raise exception '750_reviews: нет таблицы listings — сначала прогоните 300_listings.sql';
  end if;
  if to_regclass('public.profiles') is null then
    raise exception '750_reviews: нет таблицы profiles — сначала прогоните 200_profiles.sql';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'profiles'
                    and column_name in ('rating', 'reviews_count')
                  group by table_name having count(*) = 2) then
    raise exception '750_reviews: в profiles нет колонок rating/reviews_count — обновите 200_profiles.sql';
  end if;
  if to_regprocedure('auth.role()') is null or to_regprocedure('auth.uid()') is null then
    raise exception '750_reviews: нет auth.uid()/auth.role() — база не похожа на Supabase';
  end if;
end $$;


/* ---------------------------------------------------------------- reviews */

create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  seller_id  uuid not null references auth.users(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  /* set null, а не cascade: продавец удалил объявление — отзыв остаётся.
     Иначе достаточно снести объявление, чтобы стереть плохую оценку. */
  listing_id uuid references public.listings(id) on delete set null,
  rating     int not null,
  text       text,
  created_at timestamptz not null default now(),
  constraint reviews_rating_check       check (rating between 1 and 5),
  constraint reviews_not_self_check     check (author_id <> seller_id),
  constraint reviews_author_listing_key unique (author_id, listing_id)
);

/* Лечение таблицы от прошлой версии файла. */
alter table public.reviews add column if not exists seller_id  uuid;
alter table public.reviews add column if not exists author_id  uuid;
alter table public.reviews add column if not exists listing_id uuid;
alter table public.reviews add column if not exists rating     int;
alter table public.reviews add column if not exists text       text;
alter table public.reviews add column if not exists created_at timestamptz not null default now();

do $$
begin
  alter table public.reviews add constraint reviews_rating_check check (rating between 1 and 5);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.reviews add constraint reviews_not_self_check check (author_id <> seller_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.reviews add constraint reviews_author_listing_key unique (author_id, listing_id);
exception when duplicate_table or duplicate_object then null;
end $$;

comment on table public.reviews is
  'Отзывы покупателей о продавцах. Один отзыв на объявление от автора; рейтинг продавца '
  'пересчитывается триггером как среднее по всем его отзывам.';
comment on column public.reviews.seller_id is
  'Кого оценивают. Если указан listing_id, обязан совпадать с владельцем объявления.';
comment on column public.reviews.listing_id is
  'Объявление, по которому отзыв. NULL = общий отзыв о продавце или объявление удалено; '
  'общий отзыв разрешён один на пару автор-продавец (проверка в reviews_before_write).';
comment on column public.reviews.rating is 'Оценка 1..5 звёзд, целое.';

/* Витрина продавца читает отзывы пачкой и в обратном хронологическом порядке —
   это единственный горячий запрос. Пересчёт рейтинга живёт на том же индексе. */
create index if not exists reviews_seller_id_created_at_idx
  on public.reviews (seller_id, created_at desc);
/* author_id стоит первым в unique-индексе, отдельный не нужен; а вот listing_id
   без индекса превратил бы удаление объявления (on delete set null) в seq scan. */
create index if not exists reviews_listing_id_idx on public.reviews (listing_id);

alter table public.reviews enable row level security;

/* Отзывы публичны — их читают гости на странице продавца. */
drop policy if exists reviews_select_all on public.reviews;
create policy reviews_select_all on public.reviews
  for select using (true);

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert to authenticated
  with check (author_id = auth.uid() and author_id <> seller_id);

/* Правит и удаляет только автор. Продавцу собственные отзывы недоступны на
   запись сознательно: возможность «убрать единицу» обесценила бы рейтинг. */
drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists reviews_delete_own on public.reviews;
create policy reviews_delete_own on public.reviews
  for delete to authenticated
  using (author_id = auth.uid());

/* Поколоночные права: менять в существующем отзыве можно только оценку и текст.
   Ссылки и дату защищает ещё и триггер, но грант отсекает попытку раньше и
   дешевле. FK on delete set null это не мешает — ссылочные действия выполняет
   владелец таблицы, а не клиент. */
revoke all on table public.reviews from anon, authenticated;
grant select on table public.reviews to anon, authenticated;
grant insert (seller_id, author_id, listing_id, rating, text) on table public.reviews to authenticated;
grant update (rating, text) on table public.reviews to authenticated;
grant delete on table public.reviews to authenticated;
grant all on table public.reviews to service_role;


/* -------------------------------------------------------------- механика */

/* Пересчёт рейтинга продавца.

   security definer нужен: автор отзыва по RLS правит только свою строку в
   profiles, а тут надо записать чужую. Рычага у вызывающего нет — функция не
   принимает ни рейтинг, ни счётчик, она считает их из reviews; худшее, что
   даёт вызов, — приведение profiles к тому, что реально лежит в отзывах.
   Прямой вызов из клиента всё равно закрыт (auth.role() + revoke ниже). */
create or replace function public.reviews_recount_profile(p_seller_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rating numeric(3,2);
  v_count  int;
begin
  if pg_trigger_depth() = 0 and coalesce(auth.role(), 'postgres') in ('anon', 'authenticated') then
    raise exception 'reviews_recount_profile(): прямой вызов из клиента запрещён'
      using errcode = '42501';
  end if;

  if p_seller_id is null then
    return;
  end if;

  /* Блокируем профиль ДО чтения отзывов. Два параллельных отзыва иначе оба
     посчитали бы среднее без чужой невидимой строки, и один из отзывов пропал
     бы из рейтинга навсегда. После снятия блокировки следующий запрос берёт
     свежий снимок и видит уже зафиксированный отзыв соседа. */
  perform 1 from public.profiles where id = p_seller_id for update;
  if not found then
    /* Профиля нет: аккаунт продавца удаляется прямо сейчас (каскад снёс
       profiles раньше reviews). Пересчитывать нечего и некуда. */
    return;
  end if;

  select round(coalesce(avg(rating), 0)::numeric, 2), count(*)
    into v_rating, v_count
    from public.reviews
   where seller_id = p_seller_id;

  update public.profiles
     set rating = v_rating,
         reviews_count = v_count
   where id = p_seller_id
     and (rating is distinct from v_rating or reviews_count is distinct from v_count);
end $$;

comment on function public.reviews_recount_profile(uuid) is
  'Пересчитывает profiles.rating и profiles.reviews_count как среднее и количество по всем отзывам '
  'продавца. Зовётся триггером reviews; service_role может позвать вручную для починки.';

revoke all on function public.reviews_recount_profile(uuid) from public, anon, authenticated;
grant execute on function public.reviews_recount_profile(uuid) to service_role;


/* Проверки, которые нельзя выразить ограничением: они смотрят в соседние
   таблицы и в старую версию строки. definer — потому что проверка владельца
   объявления читает чужую строку listings, а по RLS обычному пользователю
   видны только свои объявления: invoker-версия отвергала бы каждый отзыв. */
create or replace function public.reviews_before_write()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.text := nullif(btrim(new.text), '');

  if tg_op = 'UPDATE' then
    /* Личность отзыва неизменяема. Дырка, которую это закрывает: автор правит
       seller_id у старого хорошего отзыва и переносит пятёрку другому
       продавцу — сколько угодно раз одной строкой. */
    if new.author_id is distinct from old.author_id
       or new.seller_id is distinct from old.seller_id then
      raise exception 'У отзыва нельзя менять автора и продавца'
        using errcode = '42501';
    end if;
    /* listing_id разрешено только обнулять — это делает сам FK при удалении
       объявления (on delete set null). Перевешивание отзыва на другое
       объявление обходило бы unique (author_id, listing_id). */
    if new.listing_id is distinct from old.listing_id and new.listing_id is not null then
      raise exception 'У отзыва нельзя менять объявление'
        using errcode = '42501';
    end if;
    new.created_at := old.created_at;   -- дату отзыва не переписываем
    return new;
  end if;

  /* Отзыв «по объявлению» имеет смысл только если объявление и правда этого
     продавца. Иначе автор набивает продавцу отзывы, подставляя чужие id
     объявлений: unique (author_id, listing_id) их все считает разными. */
  if new.listing_id is not null
     and not exists (select 1 from public.listings l
                      where l.id = new.listing_id and l.owner_id = new.seller_id) then
    raise exception 'Объявление принадлежит другому продавцу'
      using errcode = '23514';
  end if;

  /* Общий отзыв (без объявления) — ровно один на пару автор-продавец.
     Уникальным индексом это не сделать: listing_id обнуляется каскадом при
     удалении объявления, и такой индекс превратил бы удаление объявления в
     ошибку у продавца, который тут ни при чём. Проверка на вставке ловит
     именно накрутку и не мешает FK. */
  if new.listing_id is null
     and exists (select 1 from public.reviews r
                  where r.author_id = new.author_id
                    and r.seller_id = new.seller_id
                    and r.listing_id is null) then
    raise exception 'Вы уже оставляли отзыв этому продавцу'
      using errcode = '23505';
  end if;

  return new;
end $$;

revoke all on function public.reviews_before_write() from public, anon, authenticated;

drop trigger if exists reviews_before_write on public.reviews;
create trigger reviews_before_write
  before insert or update on public.reviews
  for each row execute function public.reviews_before_write();


create or replace function public.reviews_after_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform public.reviews_recount_profile(old.seller_id);
    return old;
  end if;

  /* seller_id заморожен триггером выше, но пересчёт обеих сторон оставлен
     намеренно: если правило когда-нибудь ослабят, рейтинг старого продавца не
     останется завышенным. Порядок блокировок по значению uuid — от дедлока. */
  if tg_op = 'UPDATE' and old.seller_id is distinct from new.seller_id then
    perform public.reviews_recount_profile(least(old.seller_id, new.seller_id));
    perform public.reviews_recount_profile(greatest(old.seller_id, new.seller_id));
    return new;
  end if;

  perform public.reviews_recount_profile(new.seller_id);
  return new;
end $$;

revoke all on function public.reviews_after_change() from public, anon, authenticated;

/* update of rating, seller_id: правка текста отзыва рейтинг не меняет,
   гонять из-за неё пересчёт и блокировать профиль незачем. */
drop trigger if exists reviews_after_change on public.reviews;
create trigger reviews_after_change
  after insert or update of rating, seller_id or delete on public.reviews
  for each row execute function public.reviews_after_change();

-- ═══════════════════════════════════════════════════════════
-- 800_offers.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================================================
-- 800_offers.sql — торг («Культурный торг»)
--
-- Раньше сравнение «предложение >= floor» жило в браузере (js/app.js,
-- submitOffer), а floor приезжал на клиент вместе с объявлением. Любой
-- покупатель видел минимальную цену продавца в devtools, и торг был театром.
--
-- Здесь торг переезжает на сервер: floor читает только rpc_make_offer
-- (security definer), наружу уходит вердикт, а не число.
-- Зависимости: 110_types.sql (offer_status), 300_listings.sql (listings).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Таблица предложений
-- ---------------------------------------------------------------------------

create table if not exists offers (
  id             uuid primary key default gen_random_uuid(),
  listing_id     uuid not null references listings(id) on delete cascade,
  buyer_id       uuid not null references auth.users(id) on delete cascade,
  amount         numeric(12,2) not null check (amount > 0),
  status         offer_status not null default 'pending',
  counter_amount numeric(12,2),
  attempt        int not null default 1,
  created_at     timestamptz default now()
);

-- Догоняем колонки, если таблица осталась с прошлого прогона в другой форме.
alter table offers add column if not exists counter_amount numeric(12,2);
alter table offers add column if not exists attempt        int not null default 1;
alter table offers add column if not exists created_at     timestamptz default now();

comment on table offers is
  'История торга: каждая попытка покупателя по объявлению и вердикт сервера. '
  'Строки пишет ТОЛЬКО rpc_make_offer — прямой insert закрыт и политикой, и правами.';
comment on column offers.amount is
  'Сумма покупателя после обрезки по цене витрины: платить дороже объявления не даём даже при опечатке.';
comment on column offers.counter_amount is
  'Встречное предложение продавца. Заполняется только на шаге осознанного раскрытия floor (см. rpc_make_offer).';
comment on column offers.attempt is
  'Порядковый номер попытки в паре (listing_id, buyer_id). Лимит попыток считается по нему.';
comment on column offers.status is
  'Вердикт сервера: accepted / rejected / countered. pending и withdrawn зарезервированы контрактом под ручной торг продавца.';

-- Основной индекс: rpc_make_offer на каждом вызове считает попытки этой пары.
create index if not exists offers_listing_buyer_idx
  on offers (listing_id, buyer_id, created_at desc);
-- «Мои предложения» в кабинете покупателя.
create index if not exists offers_buyer_idx
  on offers (buyer_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Права и RLS
-- ---------------------------------------------------------------------------

alter table offers enable row level security;

-- Явный revoke, а не надежда на default privileges: в облаке и локально они
-- разные, и «забытый» insert для anon стоил бы фальшивых предложений.
revoke all on table offers from anon, authenticated;
grant select on table offers to authenticated;
grant all    on table offers to service_role;

drop policy if exists offers_select_participants on offers;
create policy offers_select_participants on offers
  for select to authenticated
  using (
    buyer_id = auth.uid()
    or exists (
      select 1 from listings l
       where l.id = offers.listing_id
         and l.owner_id = auth.uid()
    )
  );

-- insert/update/delete-политик нет намеренно: единственный законный способ
-- создать предложение — rpc_make_offer, иначе клиент снова начнёт решать
-- «принято/отклонено» сам, а это ровно та дыра, которую мы закрываем.

-- ---------------------------------------------------------------------------
-- rpc_make_offer — весь торг
-- ---------------------------------------------------------------------------
--
-- ПОЧЕМУ ПОДСКАЗКА УСТРОЕНА ИМЕННО ТАК.
--
-- Задача: сказать «почти», но не дать вычислить floor перебором. Любой
-- ЧЁТКИЙ порог вида «gap <= 7%» бинарным поиском находится за десяток
-- запросов, и floor восстанавливается точно: floor = граница / 0.93.
-- Поэтому подсказка защищена тремя независимыми свойствами:
--
-- 1) Порог «принято» невозможно нащупать. Первое же предложение >= floor
--    принимается и ЗАКРЫВАЕТ торг: следующие вызовы возвращают уже принятое
--    предложение, не оценивая новую сумму. То есть проверить «а если чуть
--    меньше?» после успеха нельзя — бинарный поиск по границе принятия
--    требует отката, которого нет.
--
-- 2) Подсказка — ступенчатая функция на КРУПНОЙ сетке. Сумма покупателя перед
--    сравнением округляется до шага ~2% цены (но не мельче 100 сом), поэтому
--    все суммы внутри одной клетки дают ОДИН И ТОТ ЖЕ ответ. Прообраз ответа —
--    интервал шириной в клетку, а не точка: сколько ни дели отрезок пополам,
--    мельче клетки не станет.
--
-- 3) Сама граница сдвинута на случайное, но стабильное число клеток (0..2),
--    выведенное из хеша пары (объявление, покупатель). Стабильное — чтобы
--    повторный ввод той же суммы не давал новый ответ (иначе floor вылавливался
--    бы усреднением). Неизвестное покупателю — чтобы найденная граница не
--    пересчитывалась в floor: она равна floor*0.93 минус неизвестные 0..2 шага.
--
-- Итого даже при безлимитных попытках максимум знания о floor — полоса шириной
-- в несколько процентов цены. А попыток к тому же пять на пару, и после второй
-- неудачи floor и так называется вслух — подсказка обязана быть грубее того,
-- что продавец раскрывает осознанно, иначе она бессмысленна.
--
-- ВАЖНО: округляется только подсказка. Проверка «принято» идёт по точной сумме,
-- иначе округление вверх продало бы вещь дешевле floor.

create or replace function rpc_make_offer(p_listing_id uuid, p_amount numeric)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  -- Пять попыток: после второй floor уже назван, дальше торг идёт «вручную»,
  -- и большее число попыток только кормит перебор.
  c_max_attempts  constant int     := 5;
  c_counter_after constant int     := 2;     -- после стольких неудач — встречное
  c_close_gap     constant numeric := 0.07;  -- «почти» — разрыв до 7% от floor

  v_uid        uuid := auth.uid();
  v_owner      uuid;
  v_price      numeric(12,2);
  v_floor      numeric(12,2);
  v_lstatus    listing_status;

  v_amount     numeric(12,2);
  v_attempts   int;
  v_failed     int;
  v_attempt    int;

  v_prev_id     uuid;
  v_prev_amount numeric(12,2);

  v_step       numeric;
  v_jitter     int;
  v_edge       numeric;
  v_probe      numeric;

  v_verdict    offer_status;
  v_counter    numeric(12,2);
  v_hint       text;
  v_offer_id   uuid;
begin
  -- Проверка прав внутри definer-функции обязательна: без неё она читала бы
  -- чужой floor по любому id для кого угодно.
  if v_uid is null then
    raise exception 'Чтобы предложить свою цену, войдите в аккаунт.';
  end if;

  select l.owner_id, l.price, l.floor, l.status
    into v_owner, v_price, v_floor, v_lstatus
    from listings l
   where l.id = p_listing_id;

  if not found then
    raise exception 'Объявление не найдено.';
  end if;
  if v_lstatus is distinct from 'active'::listing_status then
    raise exception 'Объявление уже неактивно — торг по нему закрыт.';
  end if;
  if v_owner = v_uid then
    raise exception 'Это ваше объявление — торговаться с самим собой нельзя.';
  end if;
  -- floor = 0 приходит от старого клиента (он писал ноль вместо NULL), для нас
  -- это то же самое, что «автоторг не настроен».
  if v_floor is null or v_floor <= 0 then
    raise exception 'Продавец не открыл торг по этому объявлению — напишите ему в чат.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Укажите сумму больше нуля.';
  end if;

  -- Дороже витрины не берём: опечатка в лишний ноль не должна стоить покупателю денег.
  v_amount := round(least(p_amount, v_price), 2);

  select count(*),
         count(*) filter (where o.status in ('rejected', 'countered'))
    into v_attempts, v_failed
    from offers o
   where o.listing_id = p_listing_id
     and o.buyer_id = v_uid;

  -- Уже договорились — возвращаем прежний вердикт, не оценивая новую сумму.
  -- Это и есть защита №1: после «принято» границу принятия не прощупать.
  select o.id, o.amount
    into v_prev_id, v_prev_amount
    from offers o
   where o.listing_id = p_listing_id
     and o.buyer_id = v_uid
     and o.status = 'accepted'
   order by o.created_at desc
   limit 1;

  if v_prev_id is not null then
    return jsonb_build_object(
      'status',         'accepted',
      'counter_amount', null,
      'attempts_left',  greatest(c_max_attempts - v_attempts, 0),
      'gap_hint',       null,
      'amount',         v_prev_amount,
      'offer_id',       v_prev_id
    );
  end if;

  if v_attempts >= c_max_attempts then
    raise exception 'Попытки торга по этому объявлению закончились. Напишите продавцу в чат — договоритесь напрямую.';
  end if;
  v_attempt := v_attempts + 1;

  if v_amount >= v_floor then
    v_verdict := 'accepted';
    v_counter := null;
    v_hint    := null;
  else
    -- Шаг сетки привязан к ЦЕНЕ (она публичная), а не к floor: сетка не должна
    -- сама по себе быть источником сведений о секрете.
    v_step   := greatest(100::numeric, round(v_price * 0.02 / 100) * 100);
    -- mod вместо abs: abs(-9223372036854775808) переполняется, а нам нужен лишь остаток.
    v_jitter := ((hashtextextended(p_listing_id::text || ':' || v_uid::text, 0) % 3) + 3) % 3;
    v_edge   := v_floor * (1 - c_close_gap) - v_step * v_jitter;
    v_probe  := round(v_amount / v_step) * v_step;

    v_hint := case when v_probe >= v_edge then 'almost' else 'far' end;

    -- Решение об раскрытии floor принимаем по ПРОШЛЫМ неудачам (v_failed из
    -- запроса выше, ещё без текущей). c_counter_after = 2 значит «после двух
    -- неудачных попыток», то есть встречное появляется не раньше третьей —
    -- иначе floor раскрывался бы уже на второй, и его было бы легко нащупать.
    if v_failed >= c_counter_after then
      -- Осознанное раскрытие floor: дальше торговаться вслепую бессмысленно
      -- обоим, и лучше честное встречное предложение, чем брошенная сделка.
      v_verdict := 'countered';
      v_counter := v_floor;
    else
      v_verdict := 'rejected';
      v_counter := null;
    end if;
    v_failed := v_failed + 1;   -- учитываем текущую неудачу для следующего вызова
  end if;

  -- Здесь же срабатывает лимит из 880_rate_limits.sql (30 предложений в час).
  insert into offers (listing_id, buyer_id, amount, status, counter_amount, attempt)
  values (p_listing_id, v_uid, v_amount, v_verdict, v_counter, v_attempt)
  returning id into v_offer_id;

  return jsonb_build_object(
    'status',         v_verdict,
    'counter_amount', v_counter,
    'attempts_left',  greatest(c_max_attempts - v_attempt, 0),
    'gap_hint',       v_hint,       -- 'almost' | 'far' | null, НИКОГДА не число
    'amount',         v_amount,
    'offer_id',       v_offer_id
  );
end $$;

comment on function rpc_make_offer(uuid, numeric) is
  'Оценивает предложение покупателя, не выпуская floor наружу. Возвращает '
  '{status, counter_amount, attempts_left, gap_hint, amount, offer_id}. '
  'gap_hint — только ''almost''/''far''/null: числовой разрыв не отдаём, он равносилен выдаче floor.';

revoke all on function rpc_make_offer(uuid, numeric) from public, anon;
grant execute on function rpc_make_offer(uuid, numeric) to authenticated, service_role;

-- ═══════════════════════════════════════════════════════════
-- 850_chats.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================================================
-- 850_chats.sql — переписка покупатель↔продавец и отметки прочтения
--
-- Таблицы chats/messages уже живут в облаке (их создавал ранний прототип), но
-- на чистой базе их нет. Поэтому файл и создаёт их с нуля, и достраивает
-- существующие — один и тот же прогон должен пройти в обоих случаях.
--
-- Форма chats повторяет то, что шлёт клиент (js/auth.js, dbStartChat):
-- listing_ref — ТЕКСТ, а не uuid и не FK, потому что в чат можно прийти и с
-- демо-объявления, у которого id вида 'mock-42'. Ссылочной целостности здесь
-- нет сознательно: потерять переписку из-за удалённого объявления хуже, чем
-- держать «висячий» ref.
-- ============================================================================

create table if not exists chats (
  id            uuid primary key default gen_random_uuid(),
  listing_ref   text not null,
  listing_title text not null default '',
  buyer_id      uuid not null references auth.users(id) on delete cascade,
  seller_id     uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  chat_id    uuid not null references chats(id) on delete cascade,
  sender_id  uuid not null references auth.users(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Колонки по контракту
-- ---------------------------------------------------------------------------

alter table chats add column if not exists last_message_at     timestamptz;
alter table chats add column if not exists last_message_text   text;
alter table chats add column if not exists buyer_last_read_at  timestamptz;
alter table chats add column if not exists seller_last_read_at timestamptz;
alter table chats add column if not exists updated_at          timestamptz not null default now();

alter table messages add column if not exists read_at timestamptz;

comment on table chats is
  'Переписка по объявлению. Пара (listing_ref, buyer_id, seller_id) — один диалог, второй не заводится.';
comment on column chats.listing_ref is
  'Текстовая ссылка на объявление. Не FK: демо-объявления живут только на клиенте, а переписку по ним терять нельзя.';
comment on column chats.last_message_at is
  'Время последнего сообщения. Денормализация ради списка чатов: иначе каждая отрисовка списка — это N подзапросов к messages.';
comment on column chats.last_message_text is
  'Первые 200 символов последнего сообщения для превью в списке. Полный текст живёт в messages.';
comment on column chats.buyer_last_read_at is
  'Докуда дочитал покупатель. Отметка на уровне чата, а не только messages.read_at: счётчик непрочитанного считается по ней одним сравнением.';
comment on column chats.seller_last_read_at is 'Докуда дочитал продавец.';
comment on column messages.read_at is
  'Когда сообщение прочитал получатель (галочка в интерфейсе). Ставится rpc_mark_chat_read, отправитель себе её не ставит.';

-- Один диалог на пару по объявлению. В облаке дубли теоретически возможны
-- (клиент делает «найти или создать» без блокировки), поэтому индекс строим
-- аккуратно: миграция не имеет права упасть на пользовательских данных,
-- но и молча оставить гонку без защиты нельзя — отсюда предупреждение.
do $$
begin
  create unique index if not exists chats_pair_uniq
    on chats (listing_ref, buyer_id, seller_id);
exception when unique_violation then
  raise warning 'chats: найдены дубли диалогов, уникальный индекс chats_pair_uniq не создан. '
                'Схлопните дубли и повторите: select listing_ref, buyer_id, seller_id, count(*) '
                'from chats group by 1,2,3 having count(*) > 1;';
end $$;

-- Диалог с самим собой — всегда ошибка клиента. На существующих данных
-- ограничение может не пройти, тогда предупреждаем вместо падения.
do $$
begin
  alter table chats add constraint chats_participants_differ check (buyer_id <> seller_id);
exception
  when duplicate_object then null;
  when check_violation then
    raise warning 'chats: есть диалоги, где покупатель и продавец совпадают; '
                  'ограничение chats_participants_differ не добавлено.';
end $$;

-- Пустое сообщение — мусор в ленте, 4000 символов хватает с запасом.
do $$
begin
  alter table messages add constraint messages_text_sane
    check (length(btrim(text)) between 1 and 4000);
exception
  when duplicate_object then null;
  when check_violation then
    raise warning 'messages: есть пустые или слишком длинные сообщения; '
                  'ограничение messages_text_sane не добавлено.';
end $$;

-- Списки чатов сортируются по последнему сообщению — под каждую сторону свой индекс.
create index if not exists chats_buyer_idx  on chats (buyer_id,  last_message_at desc nulls last);
create index if not exists chats_seller_idx on chats (seller_id, last_message_at desc nulls last);
create index if not exists messages_chat_idx on messages (chat_id, created_at);
-- Частичный индекс под счётчик непрочитанного: строк с read_at is null всегда мало.
create index if not exists messages_unread_idx on messages (chat_id, sender_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- Триггер: новое сообщение → шапка чата
-- ---------------------------------------------------------------------------
--
-- security definer, потому что участникам чата НЕ выдан update на chats
-- (иначе покупатель мог бы переписать чужую отметку прочтения или подменить
-- превью). Проверка прав здесь уже сделана: строка в messages появилась только
-- если её пропустила RLS-политика messages_insert_participant, то есть автор
-- доказал участие в этом чате.

create or replace function tg_messages_touch_chat()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update chats c
     set last_message_at   = new.created_at,
         last_message_text = left(new.text, 200),
         updated_at        = now(),
         -- Отправил сообщение — значит чат открыт и прочитан. Без этого у
         -- автора горел бы бейдж непрочитанного на собственной реплике.
         -- greatest в PostgreSQL пропускает NULL, поэтому первая отметка
         -- проставляется этим же выражением, без отдельного coalesce.
         buyer_last_read_at  = case when c.buyer_id  = new.sender_id
                                    then greatest(c.buyer_last_read_at,  new.created_at)
                                    else c.buyer_last_read_at end,
         seller_last_read_at = case when c.seller_id = new.sender_id
                                    then greatest(c.seller_last_read_at, new.created_at)
                                    else c.seller_last_read_at end
   where c.id = new.chat_id;
  return null;  -- after-триггер, возвращаемое значение не используется
end $$;

comment on function tg_messages_touch_chat() is
  'Поддерживает шапку чата (последнее сообщение, отметка прочтения автора). Definer, т.к. клиенту update на chats не выдан.';

drop trigger if exists trg_messages_touch_chat on messages;
create trigger trg_messages_touch_chat
  after insert on messages
  for each row execute function tg_messages_touch_chat();

-- Разовая досыпка для чатов, живших до появления колонок: без неё старые
-- диалоги провалились бы в конец списка (last_message_at is null).
update chats c
   set last_message_at = coalesce(
         (select max(m.created_at) from messages m where m.chat_id = c.id),
         c.updated_at, c.created_at),
       last_message_text = (
         select left(m.text, 200) from messages m
          where m.chat_id = c.id
          order by m.created_at desc, m.id desc
          limit 1)
 where c.last_message_at is null;

-- ---------------------------------------------------------------------------
-- rpc_mark_chat_read — «я это прочитал»
-- ---------------------------------------------------------------------------

create or replace function rpc_mark_chat_read(p_chat_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_buyer  uuid;
  v_seller uuid;
begin
  if v_uid is null then
    raise exception 'Войдите в аккаунт, чтобы открыть переписку.';
  end if;

  select c.buyer_id, c.seller_id into v_buyer, v_seller
    from chats c where c.id = p_chat_id;

  if not found then
    raise exception 'Переписка не найдена.';
  end if;

  -- Явная проверка участия: функция definer, RLS её не прикроет.
  -- is distinct from — чтобы NULL не превратился в «доступ разрешён».
  if v_uid is distinct from v_buyer and v_uid is distinct from v_seller then
    raise exception 'Это чужая переписка.';
  end if;

  update chats c
     set buyer_last_read_at  = case when v_uid = v_buyer  then now() else c.buyer_last_read_at  end,
         seller_last_read_at = case when v_uid = v_seller then now() else c.seller_last_read_at end
   where c.id = p_chat_id;

  -- Свои сообщения не трогаем: read_at — это «прочитал получатель», и ставить
  -- его себе значило бы рисовать собеседнику галочку, которой он не заслужил.
  update messages m
     set read_at = now()
   where m.chat_id = p_chat_id
     and m.sender_id <> v_uid
     and m.read_at is null;
end $$;

comment on function rpc_mark_chat_read(uuid) is
  'Отмечает чат прочитанным для вызывающего: двигает его *_last_read_at и проставляет read_at входящим сообщениям.';

revoke all on function rpc_mark_chat_read(uuid) from public, anon;
grant execute on function rpc_mark_chat_read(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Права и RLS
-- ---------------------------------------------------------------------------

alter table chats    enable row level security;
alter table messages enable row level security;

-- update/delete клиенту не выдаём вовсе: шапку чата ведёт триггер, отметки
-- прочтения — rpc_mark_chat_read, а редактировать отправленное сообщение
-- задним числом в переписке о сделке нельзя.
revoke all on table chats    from anon, authenticated;
revoke all on table messages from anon, authenticated;
grant select, insert on table chats    to authenticated;
grant select, insert on table messages to authenticated;
grant all on table chats    to service_role;
grant all on table messages to service_role;

drop policy if exists chats_select_participants on chats;
create policy chats_select_participants on chats
  for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- Диалог заводит покупатель и только от своего имени. Продавцу инициировать
-- переписку незачем: он и так отвечает в уже созданном чате.
drop policy if exists chats_insert_buyer on chats;
create policy chats_insert_buyer on chats
  for insert to authenticated
  with check (buyer_id = auth.uid() and seller_id is distinct from auth.uid());

drop policy if exists messages_select_participants on messages;
create policy messages_select_participants on messages
  for select to authenticated
  using (exists (
    select 1 from chats c
     where c.id = messages.chat_id
       and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  ));

drop policy if exists messages_insert_participant on messages;
create policy messages_insert_participant on messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from chats c
       where c.id = messages.chat_id
         and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 870_notifications.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================================================
-- 870_notifications.sql — уведомления пользователя.
--
--   notifications        — лента уведомлений, только своё;
--   rpc_unread_counts()  — счётчики для бейджей нижнего меню;
--   триггеры-источники   — падение цены в избранном и новое сообщение в чате.
--
-- Клиент сейчас считает непрочитанное сам, перебирая чаты в localStorage
-- (bazar_chat_read), и про падение цены узнаёт, только пока страница открыта.
-- Здесь событие рождается в базе — там же, где происходит.
--
-- Зависимости: 110_types (notify_kind), 300_listings (listings),
--              600_personal (favorites), 850_chats (chats.buyer_last_read_at /
--              seller_last_read_at, messages).
-- Файл идемпотентен.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  kind       notify_kind not null,
  title      text        not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications add column if not exists body       text;
alter table public.notifications add column if not exists link       text;
alter table public.notifications add column if not exists read_at    timestamptz;
alter table public.notifications add column if not exists created_at timestamptz not null default now();

comment on table  public.notifications is
  'Уведомления пользователя. Пишутся только триггерами/RPC (definer) — политики insert нет ни у кого, чтобы нельзя было подделать уведомление ни себе, ни другому.';
comment on column public.notifications.link is
  'Hash-маршрут клиента: «#/item/<uuid>» или «#/chats/<uuid>». Он же ключ склейки: повторные уведомления по одному и тому же адресату+ссылке не плодятся.';
comment on column public.notifications.read_at is
  'NULL = непрочитано. Единственная колонка, которую владельцу разрешено менять.';

-- Лента: свои уведомления, свежие сверху.
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- Бейдж непрочитанного дёргается на каждой навигации — частичный индекс
-- держит его в пределах десятка строк на пользователя.
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

-- Поиск «уже уведомляли по этой ссылке» из триггеров-источников.
create index if not exists notifications_user_kind_link_idx
  on public.notifications (user_id, kind, link, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

-- Обновление нужно ровно для «прочитано». Смену остальных колонок отсекает
-- триггер ниже: политика умеет проверять строку, но не «какие поля менялись».
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete to authenticated
  using (user_id = auth.uid());

-- Политики insert нет намеренно: уведомления рождаются только внутри
-- definer-функций этого файла (и у service_role, который RLS обходит).

revoke all on public.notifications from anon;
grant select, update, delete on public.notifications to authenticated;

-- Владелец может отметить прочитанным — и только. Текст, тип и ссылку
-- возвращаем к прежним значениям молча, а не ошибкой: клиент supabase-js
-- нередко шлёт объект строки целиком, и падать на этом незачем.
create or replace function public.tg_notifications_lock_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    return new;          -- служебный доступ (service_role/крон), не пользовательская сессия
  end if;
  new.id         := old.id;
  new.user_id    := old.user_id;
  new.kind       := old.kind;
  new.title      := old.title;
  new.body       := old.body;
  new.link       := old.link;
  new.created_at := old.created_at;
  return new;
end;
$$;

comment on function public.tg_notifications_lock_columns() is
  'Разрешает пользователю менять в своём уведомлении только read_at; остальные поля восстанавливает из старой строки.';

drop trigger if exists trg_notifications_lock_columns on public.notifications;
create trigger trg_notifications_lock_columns
  before update on public.notifications
  for each row execute function public.tg_notifications_lock_columns();

-- ---------------------------------------------------------------------------
-- rpc_unread_counts — { "chats": N, "notifications": M }
-- ---------------------------------------------------------------------------

drop function if exists public.rpc_unread_counts();

create or replace function public.rpc_unread_counts()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_chats int;
  v_notes int;
begin
  -- Гость непрочитанного не имеет; нули, а не ошибка — бейджи рисуются и до входа.
  if v_uid is null then
    return jsonb_build_object('chats', 0, 'notifications', 0);
  end if;

  -- Definer, потому что считать надо по всем чатам пользователя, не завися от
  -- того, как соседний файл написал политики chats/messages. Проверка прав:
  -- личность берётся из auth.uid(), любой другой аккаунт посчитать нельзя,
  -- наружу уходят только два числа — ни строк, ни текстов.
  select count(*)::int into v_chats
    from public.chats c
   where (c.buyer_id = v_uid or c.seller_id = v_uid)
     and exists (
       select 1
         from public.messages m
        where m.chat_id = c.id
          and m.sender_id is distinct from v_uid       -- свои сообщения не считаются
          and m.created_at > coalesce(
                case when c.buyer_id = v_uid then c.buyer_last_read_at
                     else c.seller_last_read_at end,
                to_timestamp(0))                        -- ни разу не открывал чат
     );

  select count(*)::int into v_notes
    from public.notifications n
   where n.user_id = v_uid
     and n.read_at is null;

  return jsonb_build_object('chats', v_chats, 'notifications', v_notes);
end;
$$;

comment on function public.rpc_unread_counts() is
  'Счётчики для бейджей: число чатов с непрочитанными сообщениями и число непрочитанных уведомлений текущего пользователя.';

revoke all on function public.rpc_unread_counts() from public;
grant execute on function public.rpc_unread_counts() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- источник 1: цена упала у объявления, которое в избранном
-- ---------------------------------------------------------------------------

-- Definer: чужое избранное под RLS не видно, и вставка уведомления другому
-- пользователю политикой не разрешена никому. Проверка прав не нужна в виде
-- «а можно ли»: функция вызывается только как триггер (plpgsql другого вызова
-- не допустит), решение принимается по строкам самой базы, пользовательских
-- аргументов у неё нет.
create or replace function public.tg_notify_price_drop()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_link     text := '#/item/' || new.id::text;
  v_new_txt  text;
  v_actor    uuid := auth.uid();
begin
  -- Снятое/заблокированное объявление рекламировать некому.
  if new.status <> 'active' then
    return null;
  end if;

  -- Разряды пробелами: to_char зависит от локали базы, а regexp — нет.
  v_new_txt := regexp_replace(round(new.price)::text, '(\d)(?=(\d{3})+$)', '\1 ', 'g');

  insert into public.notifications (user_id, kind, title, body, link)
  select f.user_id,
         'price_drop'::notify_kind,
         'Цена снизилась',
         '«' || left(new.title, 60) || '» — было '
           || regexp_replace(round(f.price_at_add)::text, '(\d)(?=(\d{3})+$)', '\1 ', 'g')
           || ', стало ' || v_new_txt || ' сом (−'
           || round((1 - new.price / nullif(f.price_at_add, 0)) * 100)::text || '%)',
         v_link
    from public.favorites f
   where f.listing_id = new.id
     and f.price_at_add is not null
     and f.price_at_add > 0
     -- Порог: падение хотя бы на 1% от цены, которую человек видел, добавляя
     -- в избранное. Копеечные шевеления ценой уведомлением не считаются.
     and new.price <= f.price_at_add * 0.99
     -- Автору собственного действия не пишем: и владельцу объявления, и тому,
     -- кто цену правит (обычно это один и тот же человек, но не всегда —
     -- бывает правка из админки).
     and f.user_id <> new.owner_id
     and f.user_id is distinct from v_actor
     -- Антиспам: продавец может уронить цену тремя правками подряд, человеку
     -- нужно одно уведомление, а не три.
     and not exists (
       select 1
         from public.notifications n
        where n.user_id = f.user_id
          and n.kind = 'price_drop'
          and n.link = v_link
          and n.created_at > now() - interval '24 hours'
     );

  return null;
end;
$$;

comment on function public.tg_notify_price_drop() is
  'Уведомляет тех, у кого объявление в избранном, если цена упала минимум на 1% от price_at_add. Не чаще одного раза в сутки на объявление.';

drop trigger if exists trg_notify_price_drop on public.listings;
-- «update of price» + when: триггер не будится на каждом апдейте строки
-- (а их много — просмотры, bump, модерация).
create trigger trg_notify_price_drop
  after update of price on public.listings
  for each row
  when (new.price < old.price)
  execute function public.tg_notify_price_drop();

-- ---------------------------------------------------------------------------
-- источник 2: новое сообщение в чате
-- ---------------------------------------------------------------------------

-- Definer по той же причине: уведомление создаётся ДРУГОМУ пользователю.
create or replace function public.tg_notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_buyer  uuid;
  v_seller uuid;
  v_to     uuid;
  v_name   text;
  v_title  text;
  v_body   text;
  v_link   text := '#/chats/' || new.chat_id::text;
begin
  select c.buyer_id, c.seller_id into v_buyer, v_seller
    from public.chats c
   where c.id = new.chat_id;

  if not found then
    return null;
  end if;

  -- Отправитель обязан быть участником чата (это же проверяет RLS messages);
  -- если нет — молча ничего не шлём, чтобы не гадать, кому адресовано.
  if new.sender_id is distinct from v_buyer and new.sender_id is distinct from v_seller then
    return null;
  end if;

  v_to := case when new.sender_id = v_seller then v_buyer else v_seller end;

  -- Себе не пишем: продавец, написавший в собственный чат (или чат, где он
  -- одновременно и покупатель), уведомления получать не должен.
  if v_to is null or v_to = new.sender_id then
    return null;
  end if;

  select nullif(btrim(p.name), '') into v_name
    from public.profiles p
   where p.id = new.sender_id;

  v_title := 'Новое сообщение' || coalesce(' от ' || left(v_name, 40), '');
  v_body  := left(coalesce(new.text, ''), 140);

  -- Склейка: пока предыдущее уведомление по этому чату не прочитано, новое не
  -- заводим — иначе диалог из двадцати реплик даст двадцать «непрочитанных».
  update public.notifications n
     set title      = v_title,
         body       = v_body,
         created_at = now()
   where n.user_id = v_to
     and n.kind = 'message'
     and n.link = v_link
     and n.read_at is null;

  if not found then
    insert into public.notifications (user_id, kind, title, body, link)
    values (v_to, 'message', v_title, v_body, v_link);
  end if;

  return null;
end;
$$;

comment on function public.tg_notify_new_message() is
  'Уведомляет получателя о новом сообщении. Непрочитанное уведомление по тому же чату обновляется, а не дублируется.';

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message
  after insert on public.messages
  for each row execute function public.tg_notify_new_message();

-- ═══════════════════════════════════════════════════════════
-- 880_rate_limits.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================================================
-- 880_rate_limits.sql — частотные лимиты на запись
--
-- Публичный ключ Supabase лежит в открытом виде в js/auth.js, так что любой
-- желающий может слать insert'ы из консоли. RLS решает «чьё», но не «сколько»:
-- залогиненный спамер имеет полное право писать СВОИ объявления и сообщения —
-- просто не тысячу в минуту. Это и закрываем здесь.
--
-- Зависимости: 300_listings.sql, 700_moderation.sql (reports),
-- 800_offers.sql, 850_chats.sql — триггеры вешаются на их таблицы.
-- ============================================================================

create table if not exists rate_limits (
  subject      text not null,
  actor        uuid not null,
  window_start timestamptz not null,
  count        int not null default 0,
  primary key (subject, actor, window_start)
);

comment on table rate_limits is
  'Счётчики действий по часовым окнам. Служебная таблица: RLS включена, политик нет — читает и чистит только service_role.';
comment on column rate_limits.subject is
  'Что считаем: listing_insert | message_send | report | offer.';
comment on column rate_limits.actor is
  'Всегда auth.uid() вызывающего. Значение никогда не приходит из аргументов — иначе лимит обходился бы подстановкой чужого id.';
comment on column rate_limits.window_start is
  'Начало часа (date_trunc). Окно «прыгающее», а не скользящее: скользящее требует строку на каждое действие, а нам хватает счётчика.';

alter table rate_limits enable row level security;

-- Ни одной политики намеренно: таблица не нужна клиенту ни на чтение (это
-- карта того, кто чем занят), ни на запись (пишет только definer-функция).
revoke all on table rate_limits from anon, authenticated;
grant all on table rate_limits to service_role;

-- ---------------------------------------------------------------------------
-- check_rate_limit — счётчик и отказ
-- ---------------------------------------------------------------------------
--
-- security definer нужен по-настоящему: rate_limits закрыта RLS без политик,
-- и обычный пользователь физически не может увеличить свой счётчик. Проверка
-- прав внутри — в том, что actor берётся ИЗ СЕССИИ (auth.uid()), а не из
-- аргументов: подставить чужого actor или обнулить свой счётчик нельзя.
--
-- Имена аргументов заданы контрактом и совпадают с именами колонок, поэтому
-- в теле параметр пишется как p_subject, а колонки — через
-- алиас rl. Без этого PostgreSQL ругается на неоднозначность.

create or replace function check_rate_limit(p_subject text, max_per_hour int)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_window timestamptz := date_trunc('hour', now());
  v_count  int;
  v_what   text;
  v_reset  text;
begin
  -- Гость до лимитов не доходит: RLS всё равно не даст ему записать строку, а
  -- сообщение «слишком часто» на месте «войдите в аккаунт» только запутает.
  -- Сюда же попадают миграции и service_role — их ограничивать нечем и незачем.
  if v_uid is null then
    return;
  end if;

  insert into rate_limits as rl (subject, actor, window_start, count)
  values (p_subject, v_uid, v_window, 1)
  on conflict (subject, actor, window_start)
  do update set count = rl.count + 1
  returning rl.count into v_count;

  -- Уборка старых окон делается ровно в момент открытия нового и только по
  -- своему actor: дешёво, детерминированно и без отдельного крона.
  if v_count = 1 then
    delete from rate_limits rl
     where rl.actor = v_uid
       and rl.window_start < v_window - interval '24 hours';
  end if;

  if v_count > max_per_hour then
    v_what := case p_subject
                when 'listing_insert' then 'объявлений'
                when 'message_send'   then 'сообщений'
                when 'report'         then 'жалоб'
                when 'offer'          then 'предложений цены'
                else 'действий'
              end;
    -- Время показываем по Бишкеку: база живёт в UTC, а человек — нет.
    v_reset := to_char((v_window + interval '1 hour') at time zone 'Asia/Bishkek', 'HH24:MI');

    raise exception using
      errcode = 'P0001',
      message = format('Слишком много %s за час — можно не больше %s. Попробуйте позже.', v_what, max_per_hour),
      hint    = format('Лимит обнулится в %s по Бишкеку.', v_reset);
  end if;
end $$;

comment on function check_rate_limit(text, int) is
  'Считает действия вызывающего в текущем часе и бросает понятную ошибку при превышении. Actor всегда auth.uid().';

-- Клиенту вызывать нечего: функция только тратит его же квоту.
revoke all on function check_rate_limit(text, int) from public, anon, authenticated;
grant execute on function check_rate_limit(text, int) to service_role;

-- ---------------------------------------------------------------------------
-- Общий триггер
-- ---------------------------------------------------------------------------
--
-- Одна функция на все таблицы: лимит и предмет приходят аргументами триггера.
-- Definer — чтобы иметь право позвать check_rate_limit, у роли authenticated
-- execute на неё отобран. Напрямую вызвать эту функцию нельзя: без триггерного
-- контекста PostgreSQL сам откажет.

create or replace function tg_check_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform check_rate_limit(tg_argv[0]::text, tg_argv[1]::int);
  return new;
end $$;

comment on function tg_check_rate_limit() is
  'Триггер-обёртка над check_rate_limit. Аргументы: имя счётчика и максимум в час, например (''offer'', ''30'').';

-- Лимиты из контракта. Числа подобраны так, чтобы живой человек их не заметил:
-- 10 объявлений в час — это уже оптовик, 60 сообщений — минута непрерывной
-- переписки в пике.
drop trigger if exists trg_rate_limit_listings on listings;
create trigger trg_rate_limit_listings
  before insert on listings
  for each row execute function tg_check_rate_limit('listing_insert', '10');

drop trigger if exists trg_rate_limit_messages on messages;
create trigger trg_rate_limit_messages
  before insert on messages
  for each row execute function tg_check_rate_limit('message_send', '60');

drop trigger if exists trg_rate_limit_reports on reports;
create trigger trg_rate_limit_reports
  before insert on reports
  for each row execute function tg_check_rate_limit('report', '20');

drop trigger if exists trg_rate_limit_offers on offers;
create trigger trg_rate_limit_offers
  before insert on offers
  for each row execute function tg_check_rate_limit('offer', '30');

-- ═══════════════════════════════════════════════════════════
-- 890_realtime.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================================================
-- 890_realtime.sql — публикация для Supabase Realtime
--
-- Клиент подписывается на listings (лента обновляется у всех, включая гостей),
-- chats и messages (переписка «на глазах») и notifications. Без записи таблицы
-- в публикацию supabase_realtime события до WebSocket просто не доезжают.
--
-- Главная засада: в облаке часть таблиц в публикацию уже добавлена, а
-- `alter publication ... add table` на повторе падает с 42710. Отсюда цикл с
-- проверкой pg_publication_tables вместо четырёх прямых alter'ов.
-- ============================================================================

do $$
declare
  v_table text;
begin
  -- На чистой базе публикации может не быть вовсе (её заводит платформа
  -- Supabase). Создаём пустой — таблицы добавит цикл ниже.
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach v_table in array array['listings', 'chats', 'messages', 'notifications']
  loop
    if exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = v_table
    ) then
      continue;
    end if;

    execute format('alter publication supabase_realtime add table public.%I', v_table);
  end loop;
end $$;

-- REPLICA IDENTITY намеренно оставлена по умолчанию (первичный ключ).
-- Realtime проверяет RLS подписчика по содержимому WAL-записи; для INSERT и
-- UPDATE там лежит полная новая строка, а именно их и слушает клиент
-- (js/auth.js: dbSubscribeMessages, dbSubscribeMyChats, dbSubscribeListings).
-- `replica identity full` понадобилась бы только ради DELETE-событий и ради
-- фильтров по старым значениям, но она удваивает объём WAL на каждой правке —
-- цена, которую нечем оправдать: в BAZAR удаляют объявления, а не переписку.

-- ═══════════════════════════════════════════════════════════
-- 900_seed_taxonomy.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================================
-- BAZAR · 900 · наполнение справочников
--
-- Источник данных — js/data.js: константы CITIES и CATEGORIES.
-- 10 категорий, 41 подкатегория, 11 городов.
--
-- Русские названия подкатегорий и городов скопированы оттуда БАЙТ В
-- БАЙТ, включая букву ё («Тренажёры»). Это не украшательство: та же
-- строка приходит с клиента в listings.subcategory, ею же выбирается
-- набор характеристик из ATTR_SCHEMA (js/attributes.js) и по ней
-- фильтруется лента. Расхождение в один символ — и раздел молча
-- перестаёт находиться.
--
-- on conflict do nothing вместо upsert выбран сознательно. Сид — это
-- «завези недостающее», а не «приведи к эталону»: перезапись затёрла бы
-- правки, сделанные в боевой базе, а переименование подкатегории — это
-- не задача сида (оно оставляет за собой объявления со старым
-- значением, их надо переносить отдельной миграцией данных).
-- ============================================================


-- ------------------------------------------------------------
-- Города. sort повторяет порядок массива CITIES: Бишкек первым.
-- ------------------------------------------------------------
insert into public.cities (name, sort) values
  ('Бишкек', 1),
  ('Ош', 2),
  ('Джалал-Абад', 3),
  ('Каракол', 4),
  ('Токмок', 5),
  ('Кара-Балта', 6),
  ('Кант', 7),
  ('Нарын', 8),
  ('Талас', 9),
  ('Баткен', 10),
  ('Чолпон-Ата', 11)
on conflict (name) do nothing;


-- ------------------------------------------------------------
-- Категории. id машинные, подписи локализуются на клиенте.
-- ------------------------------------------------------------
insert into public.categories (id, sort) values
  ('electronics', 1),
  ('transport', 2),
  ('realty', 3),
  ('fashion', 4),
  ('home', 5),
  ('services', 6),
  ('jobs', 7),
  ('animals', 8),
  ('kids', 9),
  ('hobby', 10)
on conflict (id) do nothing;


-- ------------------------------------------------------------
-- Подкатегории. Колонки sort у них нет — порядок показа задаётся
-- порядком вставки через bigserial id, поэтому строки идут ровно так
-- же, как в массивах subs у CATEGORIES.
-- ------------------------------------------------------------
insert into public.subcategories (category_id, name) values
  ('electronics', 'Телефоны'),
  ('electronics', 'Ноутбуки'),
  ('electronics', 'ТВ и аудио'),
  ('electronics', 'Фото и видео'),
  ('electronics', 'Планшеты'),
  ('electronics', 'Бытовая техника'),
  ('transport', 'Легковые авто'),
  ('transport', 'Мото'),
  ('transport', 'Грузовой транспорт'),
  ('transport', 'Запчасти и аксессуары'),
  ('realty', 'Продажа квартир'),
  ('realty', 'Аренда квартир'),
  ('realty', 'Дома и участки'),
  ('realty', 'Коммерческая'),
  ('fashion', 'Мужская одежда'),
  ('fashion', 'Женская одежда'),
  ('fashion', 'Обувь'),
  ('fashion', 'Аксессуары'),
  ('home', 'Мебель'),
  ('home', 'Ремонт и стройка'),
  ('home', 'Посуда и кухня'),
  ('home', 'Растения'),
  ('services', 'Ремонт техники'),
  ('services', 'Строительство'),
  ('services', 'Красота и здоровье'),
  ('services', 'Обучение'),
  ('services', 'Перевозки'),
  ('services', 'Клининг'),
  ('jobs', 'Вакансии'),
  ('jobs', 'Ищу работу'),
  ('animals', 'Собаки'),
  ('animals', 'Кошки'),
  ('animals', 'Птицы и рыбки'),
  ('animals', 'Товары для животных'),
  ('kids', 'Игрушки'),
  ('kids', 'Коляски и кресла'),
  ('kids', 'Детская одежда'),
  ('hobby', 'Велосипеды'),
  ('hobby', 'Тренажёры'),
  ('hobby', 'Музыка'),
  ('hobby', 'Туризм и отдых')
on conflict (category_id, name) do nothing;


-- ------------------------------------------------------------
-- Контроль: справочники не должны оказаться пустыми или неполными.
-- Сид гоняется на боевой базе, и тихо недолитый справочник — это
-- отвалившиеся внешние ключи в listings, то есть неработающая подача
-- объявлений. Лучше упасть здесь.
-- ------------------------------------------------------------
do $$
declare
  v_cities int;
  v_cats   int;
  v_subs   int;
begin
  select count(*) into v_cities from public.cities;
  select count(*) into v_cats   from public.categories;
  select count(*) into v_subs   from public.subcategories;

  if v_cities < 11 or v_cats < 10 or v_subs < 41 then
    raise exception
      'Справочники BAZAR неполные: городов %, категорий %, подкатегорий % (ожидалось минимум 11 / 10 / 41)',
      v_cities, v_cats, v_subs;
  end if;
end;
$$;
