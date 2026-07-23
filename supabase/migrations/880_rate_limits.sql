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
