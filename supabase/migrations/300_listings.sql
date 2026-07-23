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
