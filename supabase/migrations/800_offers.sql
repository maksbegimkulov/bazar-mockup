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
