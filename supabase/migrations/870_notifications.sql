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
