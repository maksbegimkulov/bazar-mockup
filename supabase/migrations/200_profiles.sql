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
