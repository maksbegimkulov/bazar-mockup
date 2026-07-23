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
