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
