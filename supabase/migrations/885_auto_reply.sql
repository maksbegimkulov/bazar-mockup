-- ============================================================================
-- 885_auto_reply.sql — автоответ продавца: ответ в секунду, а не через час.
--
--   messages.is_auto / auto_topic — пометка «это ответил не человек»;
--   auto_reply_rules              — что продавец отвечает на какой вопрос;
--   bazar_reply_topic()           — к какой теме относится вопрос покупателя;
--   tg_auto_reply()               — правила применяются при новом сообщении.
--
-- Половина переписок на доске умирает на первом вопросе: покупатель спрашивает
-- «актуально?» вечером, продавец отвечает утром, покупатель уже купил у
-- другого. Автоответ закрывает именно эту дыру — те пять вопросов, которые
-- задают всем и всегда.
--
-- Здесь нет никакой модели: тема вопроса определяется по словам, ответ пишет
-- сам продавец. Это сознательно. Сгенерированный ответ от чужого имени в
-- переписке о деньгах — это когда за продавца что-то пообещали, а отвечать
-- ему. Правило же он видит целиком и заранее.
--
-- Чтобы автоответ не стал спамом, он молчит в четырёх случаях: продавец сам
-- отвечает в этом диалоге, продавец прямо сейчас его читает, на эту тему уже
-- отвечено, или в диалоге уже три автоответа. И он всегда помечен: делать вид,
-- что ответил человек, нельзя.
--
-- Зависимости: 850_chats.sql (chats, messages), 880_rate_limits.sql (триггер
-- лимита сообщений пересоздаётся здесь — см. ниже). Файл идемпотентен.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- Пометка на сообщении
-- ---------------------------------------------------------------------------

alter table public.messages add column if not exists is_auto    boolean not null default false;
alter table public.messages add column if not exists auto_topic text;

comment on column public.messages.is_auto is
  'Сообщение отправлено правилом продавца, а не им самим. Клиент обязан показывать пометку: выдавать автоответ за живого человека нельзя.';
comment on column public.messages.auto_topic is
  'Тема, на которую сработало правило. Нужна, чтобы на один и тот же вопрос в диалоге не отвечали дважды.';

-- Дедупликация «одна тема — один автоответ в диалоге» и потолок на диалог.
create index if not exists messages_auto_idx on public.messages (chat_id, auto_topic) where is_auto;


-- ---------------------------------------------------------------------------
-- Правила продавца
-- ---------------------------------------------------------------------------

create table if not exists public.auto_reply_rules (
  user_id    uuid not null references auth.users(id) on delete cascade,
  topic      text not null,
  reply      text not null,
  enabled    boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic)
);

do $$
begin
  alter table public.auto_reply_rules
    add constraint auto_reply_rules_topic_known
    check (topic in ('greeting', 'available', 'price', 'bargain', 'where', 'delivery', 'condition'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.auto_reply_rules
    add constraint auto_reply_rules_reply_sane
    check (length(btrim(reply)) between 1 and 500);
exception
  when duplicate_object then null;
  when check_violation then
    raise warning 'auto_reply_rules: есть пустые или слишком длинные ответы; ограничение не добавлено.';
end $$;

comment on table public.auto_reply_rules is
  'Готовые ответы продавца на частые вопросы. Пусто — автоответа нет: это и есть выключатель.';
comment on column public.auto_reply_rules.topic is
  'Тема вопроса: greeting (ничего не распознали, первое сообщение), available, price, bargain, where, delivery, condition.';
comment on column public.auto_reply_rules.reply is
  'Текст, который уйдёт покупателю дословно. Пишет продавец — за него ничего не досочиняют.';
comment on column public.auto_reply_rules.enabled is
  'Выключенное правило не срабатывает, но остаётся набранным: сезонную доставку не надо каждый раз переписывать.';

alter table public.auto_reply_rules enable row level security;

drop policy if exists auto_reply_rules_own on public.auto_reply_rules;
create policy auto_reply_rules_own on public.auto_reply_rules
  for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.auto_reply_rules from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant select, insert, update, delete on table public.auto_reply_rules to authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant all on table public.auto_reply_rules to service_role';
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- Тема вопроса
--
-- Порядок проверок — это и есть правила разбора, менять его наугад нельзя.
-- Люди задают вопрос целиком, и в одной фразе почти всегда несколько признаков;
-- выигрывает тот, что конкретнее:
--
--   «уступите в цене»        → торг, а не цена (иначе торг не сработает никогда);
--   «сколько стоит доставка» → доставка, а не цена (в ответе о доставке продавец
--                              всё равно называет сумму);
--   «доставка есть?»         → доставка, а не «актуально» — поэтому «есть»
--                              проверяется последним из всего конкретного;
--   «сколько?»               → цена, потому что до неё не дошло ничего другого.
--
-- Само по себе «есть» не значит ничего («есть торг», «есть царапины», «есть
-- доставка»), поэтому в признаках наличия его нет — только «есть ли», «ещё
-- есть» и прямые слова.
--
-- Ничего не совпало — NULL. Это не ошибка: на незнакомый вопрос лучше промолчать,
-- чем ответить не на него.
-- ---------------------------------------------------------------------------

create or replace function public.bazar_reply_topic(p_text text)
returns text
language sql
immutable
parallel safe
as $$
  select case
    when s ~ '(торг|уступ|скидк|дешевл|отдад|сбав|арзан)'                              then 'bargain'
    when s ~ '(доставк|отправ|привез|привёз|курьер|почт|жеткир)'                        then 'delivery'
    when s ~ '(\mгде\M|адрес|район|посмотрет|самовывоз|подъеха|подьеха|кайда|кайдасы)'  then 'where'
    when s ~ '(состояни|пробег|дефект|битый|царапин|целый|рабоч|ремонт|абал)'           then 'condition'
    when s ~ '(актуальн|в наличии|есть ли|ещ[её] есть|прода|свободн|бар бекен)'         then 'available'
    when s ~ '(цен[аыу]|скольк|стоит|стоимост|поч[её]м|канча|баас)'                     then 'price'
  end
  from (select lower(btrim(coalesce(p_text, '')))) as v(s);
$$;

comment on function public.bazar_reply_topic(text) is
  'Тема вопроса покупателя: bargain, available, delivery, where, condition, price или NULL, если не распознали. Никакой модели — только слова.';


-- ---------------------------------------------------------------------------
-- Правило срабатывает
-- ---------------------------------------------------------------------------

create or replace function public.tg_auto_reply()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  -- Три ответа на диалог: больше — это уже не помощь, а бот, который говорит
  -- вместо продавца. Три покрывают «актуально — сколько — где».
  c_max_per_chat constant int := 3;
  -- Продавец писал сам недавно → он в разговоре, автоответ будет перебивать.
  c_seller_active constant interval := interval '15 minutes';
  -- И тем более если он прямо сейчас смотрит в этот диалог.
  c_seller_here   constant interval := interval '2 minutes';
  v_chat   record;
  v_topic  text;
  v_reply  text;
begin
  if new.is_auto then
    return null;                                  -- на автоответ не отвечают
  end if;

  select c.buyer_id, c.seller_id, c.seller_last_read_at
    into v_chat
    from public.chats c
   where c.id = new.chat_id;
  if not found then
    return null;
  end if;

  -- Отвечаем правилами продавца и только покупателю. Сообщение самого продавца
  -- ничего не запускает.
  if new.sender_id is distinct from v_chat.buyer_id then
    return null;
  end if;

  if v_chat.seller_last_read_at > now() - c_seller_here then
    return null;
  end if;

  if exists (select 1 from public.messages m
              where m.chat_id = new.chat_id
                and m.sender_id = v_chat.seller_id
                and not m.is_auto
                and m.created_at > now() - c_seller_active) then
    return null;
  end if;

  if (select count(*) from public.messages m
       where m.chat_id = new.chat_id and m.is_auto) >= c_max_per_chat then
    return null;
  end if;

  v_topic := public.bazar_reply_topic(new.text);

  if v_topic is null then
    -- Вопрос не распознан. Приветствие уместно только в самом начале: посреди
    -- разговора «здравствуйте, отвечу позже» выглядит издевательством.
    if (select count(*) from public.messages m where m.chat_id = new.chat_id) > 1 then
      return null;
    end if;
    v_topic := 'greeting';
  end if;

  select r.reply into v_reply
    from public.auto_reply_rules r
   where r.user_id = v_chat.seller_id
     and r.topic = v_topic
     and r.enabled;
  if not found then
    return null;                                  -- на эту тему правила нет
  end if;

  -- На один и тот же вопрос в диалоге отвечаем один раз.
  if exists (select 1 from public.messages m
              where m.chat_id = new.chat_id and m.is_auto and m.auto_topic = v_topic) then
    return null;
  end if;

  insert into public.messages (chat_id, sender_id, text, is_auto, auto_topic)
  values (new.chat_id, v_chat.seller_id, v_reply, true, v_topic);

  -- Вставка от имени продавца сдвинула бы ему отметку прочтения (см.
  -- tg_messages_touch_chat) — и вопрос покупателя пропал бы из непрочитанного
  -- ровно потому, что на него ответил бот. Возвращаем отметку на место.
  update public.chats c
     set seller_last_read_at = v_chat.seller_last_read_at
   where c.id = new.chat_id
     and c.seller_last_read_at is distinct from v_chat.seller_last_read_at;

  return null;
end;
$$;

comment on function public.tg_auto_reply() is
  'Отвечает покупателю правилом продавца: одна тема — один ответ, не больше трёх на диалог, и только пока продавец сам не в разговоре.';

-- Порядок важен: автоответ должен видеть уже записанное сообщение покупателя,
-- поэтому after, и после tg_messages_touch_chat (триггеры срабатывают по имени,
-- «z_» держит его последним).
drop trigger if exists z_trg_auto_reply on public.messages;
create trigger z_trg_auto_reply
  after insert on public.messages
  for each row execute function public.tg_auto_reply();


-- ---------------------------------------------------------------------------
-- Лимит сообщений и автоответ
--
-- Пересоздаём триггер из 880_rate_limits.sql с условием: автоответ не должен
-- расходовать почасовой лимит. Лимит считается по auth.uid(), а в момент
-- вставки автоответа это покупатель — то есть чужой бот отъедал бы его квоту
-- и в пределе показал бы ему «слишком много сообщений» за то, чего он не
-- отправлял. Сам автоответ ограничен своими потолками (три на диалог).
-- ---------------------------------------------------------------------------

drop trigger if exists trg_rate_limit_messages on public.messages;
create trigger trg_rate_limit_messages
  before insert on public.messages
  for each row
  when (new.is_auto is not true)
  execute function public.tg_check_rate_limit('message_send', '60');


-- ---------------------------------------------------------------------------
-- Права на функции
--
-- Ни разбор темы, ни сам триггер снаружи звать незачем: тему спрашивают о
-- конкретном сообщении внутри вставки, а не пачкой по чужим диалогам.
--
-- Одного `revoke ... from public` мало: на Supabase шаблонные права проекта
-- выдают execute напрямую ролям anon и authenticated. Снимаем поимённо.
-- Триггер от этого не ломается — права на триггерную функцию проверяются
-- при создании триггера, а не на каждой строке.
-- ---------------------------------------------------------------------------

do $grants$
declare
  v_fn text;
begin
  foreach v_fn in array array[
    'public.bazar_reply_topic(text)',
    'public.tg_auto_reply()'
  ]
  loop
    execute format('revoke all on function %s from public', v_fn);
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on function %s from anon', v_fn);
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke all on function %s from authenticated', v_fn);
    end if;
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('grant execute on function %s to service_role', v_fn);
    end if;
  end loop;
end;
$grants$;
