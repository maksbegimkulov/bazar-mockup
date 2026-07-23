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
