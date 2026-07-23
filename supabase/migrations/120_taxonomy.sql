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
