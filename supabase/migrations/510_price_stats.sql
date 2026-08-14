-- ============================================================================
-- 510_price_stats.sql — честная цена: сколько это стоит на самом деле.
--
--   bazar_price_peers()      — цены похожих объявлений (модель+год → модель →
--                              подкатегория);
--   bazar_price_stats()      — медиана, MAD, p10/p90 по этим ценам;
--   bazar_price_verdict()    — вердикт по цене и выборке;
--   rpc_price_verdict()      — вердикт по конкретному объявлению;
--   rpc_price_verdict_draft()— вердикт по ещё не опубликованной цене (форма подачи).
--
-- Сейчас это считает клиент (js/app.js: priceVerdict) по тем объявлениям, что
-- успели загрузиться в память. На 6030 мок-строках выборка полная, на живой
-- базе с пагинацией — случайная: «ниже рынка» превращается в «ниже того, что
-- лежало на первой странице». Здесь сравнение идёт по всей базе.
--
-- Почему медиана и MAD, а не среднее и проценты.
--
--   Среднее в объявлениях бесполезно: один Rolls-Royce в подкатегории двигает
--   его сильнее сотни Corolla. Медиана к выбросам равнодушна.
--
--   Дальше нужен ответ на вопрос «7% ниже медианы — это уже выгодно?». Он
--   зависит не от числа 7, а от того, насколько плотно вообще стоят цены. У
--   одинаковых iPhone 13 128 ГБ разброс маленький, и −7% — заметная скидка. У
--   квартир разброс огромный, и −7% — шум. MAD (медиана абсолютных отклонений)
--   как раз измеряет этот разброс и, в отличие от дисперсии, сам не ломается от
--   выбросов. Множитель 1.4826 приводит MAD к масштабу обычного σ, чтобы
--   «дальше одного отклонения» читалось привычно.
--
--   Второй порог — на размер выборки: 40%/√n, но не мягче 7%. На шести
--   объявлениях уверенно говорить можно только о разнице в 16%, на сотне
--   хватает 7%. Без этого вердикт «выгодно» выдавался бы по трём случайным
--   ценам и обесценивался.
--
-- Зависимости: 300_listings (listings, attrs), 500_search (bazar_attr_num).
-- Файл идемпотентен.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- Сколько цен нужно, чтобы это был рынок
--
-- Отдельной функцией, а не числом в двух местах: выборку набирает
-- bazar_price_peers, а молчит при малой выборке bazar_price_stats, и разойдясь
-- эти два числа дали бы вердикт по трём объявлениям. То же число живёт в
-- js/app.js — вердикт не должен меняться от того, кто его посчитал.
-- ---------------------------------------------------------------------------

create or replace function public.bazar_price_min_peers()
returns int language sql immutable parallel safe as $$ select 6 $$;

comment on function public.bazar_price_min_peers() is
  'Минимальный размер выборки для вердикта по цене. Меньше — это не рынок, а совпадение.';


-- ---------------------------------------------------------------------------
-- Похожие объявления
--
-- Три круга, от узкого к широкому — как и на клиенте: марка+модель и близкий
-- год, потом марка+модель, потом вся подкатегория. Сравнивать Camry 2012 с
-- новыми Camry так же неверно, как Corolla со «всеми авто».
--
-- Круг выбирается одним проходом, а не тремя запросами подряд: последовательные
-- `return query` не заменяют результат, а дописывают к нему, и объявления
-- узкого круга попадали бы в выборку дважды — n завышен, медиана притянута к
-- ним же.
-- ---------------------------------------------------------------------------

create or replace function public.bazar_price_peers(
  p_subcategory text,
  p_brand       text,
  p_model       text,
  p_year        numeric,
  p_exclude     uuid
)
returns table (price numeric, basis text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  -- Наружу уходят только цены уже опубликованных объявлений — ровно то, что и
  -- так видно в ленте. Черновики, снятое и забаненные продавцы не участвуют ни
  -- в выборке, ни в счёте.
  with base as (
    select l.price,
           coalesce(p_brand is not null and p_model is not null
                    and l.attrs ->> 'brand' = p_brand
                    and l.attrs ->> 'model' = p_model, false)                  as is_model,
           coalesce(p_year is not null
                    and abs(public.bazar_attr_num(l.attrs, 'year') - p_year) <= 3,
                    false)                                                      as is_year
      from public.listings l
      left join public.profiles pr on pr.id = l.owner_id
     where l.subcategory = p_subcategory
       and l.status = 'active'
       and l.expires_at > now()
       and (pr.banned_until is null or pr.banned_until <= now())
       and l.price > 0
       and (p_exclude is null or l.id <> p_exclude)
  ),
  tier as (
    select count(*) filter (where is_model and is_year) >= public.bazar_price_min_peers() as by_year,
           count(*) filter (where is_model)             >= public.bazar_price_min_peers() as by_model
      from base
  )
  select b.price,
         case when t.by_year or t.by_model then 'model' else 'sub' end
    from base b, tier t
   where case when t.by_year  then b.is_model and b.is_year
              when t.by_model then b.is_model
              else true end;
$$;

comment on function public.bazar_price_peers(text, text, text, numeric, uuid) is
  'Цены похожих объявлений: марка+модель и год ±3, иначе марка+модель, иначе вся подкатегория. Возвращает только цены опубликованных объявлений, каждое по одному разу.';


-- ---------------------------------------------------------------------------
-- Медиана, MAD, границы «обычной» цены
-- ---------------------------------------------------------------------------

create or replace function public.bazar_price_stats(
  p_subcategory text,
  p_brand       text default null,
  p_model       text default null,
  p_year        numeric default null,
  p_exclude     uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_prices numeric[];
  v_basis  text;
  v_n      int;
  v_median numeric;
  v_mad    numeric;
  v_p10    numeric;
  v_p90    numeric;
begin
  select array_agg(t.price), min(t.basis), count(*)
    into v_prices, v_basis, v_n
    from public.bazar_price_peers(p_subcategory, p_brand, p_model, p_year, p_exclude) t;

  if v_n is null or v_n < public.bazar_price_min_peers() then
    -- Мало цен — молчим. Пустой вердикт честнее натянутого: «дешевле рынка»
    -- по трём объявлениям читается как обещание, а не как оценка.
    return jsonb_build_object('n', coalesce(v_n, 0));
  end if;

  select percentile_cont(0.5) within group (order by p),
         percentile_cont(0.1) within group (order by p),
         percentile_cont(0.9) within group (order by p)
    into v_median, v_p10, v_p90
    from unnest(v_prices) as p;

  -- MAD = медиана |цена − медиана|. Считается вторым проходом по той же
  -- выборке, поэтому массив и держим в памяти, а не запрашиваем дважды.
  select percentile_cont(0.5) within group (order by abs(p - v_median))
    into v_mad
    from unnest(v_prices) as p;

  return jsonb_build_object(
    'n',      v_n,
    'basis',  v_basis,
    'median', round(v_median),
    'mad',    round(coalesce(v_mad, 0)),
    'p10',    round(v_p10),
    'p90',    round(v_p90));
end;
$$;

comment on function public.bazar_price_stats(text, text, text, numeric, uuid) is
  'Статистика цен похожих объявлений: n, медиана, MAD, p10/p90, основа выборки (model/sub). При n < 6 возвращает только n — на такой выборке вердикта не бывает.';


-- ---------------------------------------------------------------------------
-- Вердикт
-- ---------------------------------------------------------------------------

create or replace function public.bazar_price_verdict(p_price numeric, p_stats jsonb)
returns jsonb
language plpgsql
immutable
parallel safe
as $$
declare
  v_n      int     := coalesce((p_stats ->> 'n')::int, 0);
  v_median numeric := (p_stats ->> 'median')::numeric;
  v_mad    numeric := coalesce((p_stats ->> 'mad')::numeric, 0);
  v_p10    numeric := (p_stats ->> 'p10')::numeric;
  v_p90    numeric := (p_stats ->> 'p90')::numeric;
  v_dev    numeric;
  v_thr    numeric;
  v_side   numeric;
  v_z      numeric;
  v_bait   boolean;
  v_verdict text;
begin
  if v_n < public.bazar_price_min_peers() or v_median is null or v_median <= 0
     or p_price is null or p_price <= 0 then
    return p_stats || jsonb_build_object('verdict', null);
  end if;

  v_dev := (p_price - v_median) / v_median;                    -- отклонение от медианы
  v_thr := greatest(0.07, 0.40 / sqrt(v_n::numeric));          -- порог с поправкой на размер выборки

  -- Робастный аналог z-оценки: на сколько «отклонений» цена ушла от середины.
  --
  -- Разброс считаем по той стороне, где стоит цена: цены объявлений скошены
  -- вправо (снизу их держит ноль, сверху — ничего), и одна общая мера делает
  -- верхнюю половину неоправданно «далёкой». С единым MAD «выше рынка»
  -- получала четверть каталога, а «отличная цена» — два процента: ярлык,
  -- который висит на каждом четвёртом, ничего не значит.
  --
  -- 1.2816 — z девяностого процентиля нормального распределения: делением на
  -- него полуразмах p10/p90 приводится к масштабу обычного σ, и «дальше
  -- одного отклонения» читается привычно. Если краёв нет (вырожденная
  -- выборка), возвращаемся к MAD с его множителем 1.4826.
  v_side := case
              when p_price < v_median and v_p10 is not null and v_median > v_p10
                then (v_median - v_p10) / 1.2816
              when p_price >= v_median and v_p90 is not null and v_p90 > v_median
                then (v_p90 - v_median) / 1.2816
              when v_mad > 0 then 1.4826 * v_mad
            end;
  v_z   := case when v_side > 0 then (p_price - v_median) / v_side end;

  -- Приманка — не просто «сильно ниже медианы». На рынке с широким разбросом
  -- (квартиры, авто) половина медианы — обычная дешёвая студия, а не обман;
  -- пометить её подозрительной значит наказать честного продавца. Поэтому
  -- нужны сразу два признака: цена заметно ниже середины рынка И ниже даже
  -- его дешёвого края (p10). На плотном рынке p10 почти равен медиане, и
  -- правило работает как прежде.
  v_bait := case
              when v_p10 is null or v_p10 <= 0 then p_price <= v_median * 0.45
              else p_price <= v_median * 0.60 and p_price <= v_p10 * 0.65
            end;

  if v_bait then
    -- Об этом предупреждают, а не радуются этому.
    v_verdict := 'low';
  elsif v_dev <= -v_thr and (v_z is null or v_z <= -1) then
    v_verdict := 'good';
  elsif v_dev >= v_thr and (v_z is null or v_z >= 1) then
    v_verdict := 'high';
  else
    v_verdict := 'fair';
  end if;

  return p_stats || jsonb_build_object(
    'verdict',   v_verdict,
    'deviation', round(v_dev, 4),
    'threshold', round(v_thr, 4),
    'z',         case when v_z is null then null else round(v_z, 2) end);
end;
$$;

comment on function public.bazar_price_verdict(numeric, jsonb) is
  'Вердикт по цене: low (подозрительно дёшево), good, fair, high. Порог зависит от размера выборки (40%/√n, не мягче 7%) и от разброса цен (робастный z по полуразмаху той стороны, где стоит цена).';


-- ---------------------------------------------------------------------------
-- RPC для клиента
-- ---------------------------------------------------------------------------

drop function if exists public.rpc_price_verdict(uuid);

create or replace function public.rpc_price_verdict(p_listing_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_l     record;
  v_stats jsonb;
begin
  -- Проверка прав: считаем только для объявления, которое и так публично
  -- видно. Для черновика, снятого и заблокированного возвращаем пусто — по
  -- «нашлось/не нашлось» иначе можно было бы проверять чужие черновики.
  select l.id, l.price, l.subcategory, l.attrs
    into v_l
    from public.listings l
    left join public.profiles pr on pr.id = l.owner_id
   where l.id = p_listing_id
     and l.status = 'active'
     and l.expires_at > now()
     and (pr.banned_until is null or pr.banned_until <= now());

  if not found then
    return jsonb_build_object('n', 0, 'verdict', null);
  end if;

  v_stats := public.bazar_price_stats(
    v_l.subcategory,
    nullif(btrim(coalesce(v_l.attrs ->> 'brand', '')), ''),
    nullif(btrim(coalesce(v_l.attrs ->> 'model', '')), ''),
    public.bazar_attr_num(v_l.attrs, 'year'),
    v_l.id);

  return public.bazar_price_verdict(v_l.price, v_stats);
end;
$$;

comment on function public.rpc_price_verdict(uuid) is
  'Честная цена по объявлению: { verdict, n, median, mad, p10, p90, basis, deviation, threshold, z }. Наружу уходят только агрегаты по уже опубликованным объявлениям.';


drop function if exists public.rpc_price_verdict_draft(text, numeric, jsonb);

create or replace function public.rpc_price_verdict_draft(
  p_subcategory text,
  p_price       numeric,
  p_attrs       jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_stats jsonb;
begin
  -- Для формы подачи: цену видно сразу, ещё до публикации. Идентификаторов
  -- здесь нет вообще, наружу уходят те же агрегаты.
  if nullif(btrim(coalesce(p_subcategory, '')), '') is null then
    return jsonb_build_object('n', 0, 'verdict', null);
  end if;

  v_stats := public.bazar_price_stats(
    btrim(p_subcategory),
    nullif(btrim(coalesce(p_attrs ->> 'brand', '')), ''),
    nullif(btrim(coalesce(p_attrs ->> 'model', '')), ''),
    public.bazar_attr_num(coalesce(p_attrs, '{}'::jsonb), 'year'),
    null);

  return public.bazar_price_verdict(p_price, v_stats);
end;
$$;

comment on function public.rpc_price_verdict_draft(text, numeric, jsonb) is
  'Честная цена для ещё не опубликованного объявления: продавец видит рынок, пока набирает цену.';


-- ---------------------------------------------------------------------------
-- Права
-- ---------------------------------------------------------------------------

do $grants$
declare
  v_fn text;
begin
  foreach v_fn in array array[
    'public.bazar_price_min_peers()',
    'public.bazar_price_peers(text, text, text, numeric, uuid)',
    'public.bazar_price_stats(text, text, text, numeric, uuid)',
    'public.bazar_price_verdict(numeric, jsonb)',
    'public.rpc_price_verdict(uuid)',
    'public.rpc_price_verdict_draft(text, numeric, jsonb)'
  ]
  loop
    execute format('revoke all on function %s from public', v_fn);
    -- На Supabase «public» — это не «все». Шаблонные права проекта
    -- (alter default privileges) выдают execute напрямую ролям anon и
    -- authenticated, и revoke ... from public их не трогает. Проверено на
    -- боевой: после наката гость мог позвать любой хелпер, включая сырую
    -- выборку цен. Поэтому снимаем поимённо, а нужное выдаём обратно ниже.
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on function %s from anon', v_fn);
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke all on function %s from authenticated', v_fn);
    end if;
  end loop;

  -- Вердикт по цене видит и гость: это часть карточки товара, а не личные
  -- данные. Сырую выборку цен (bazar_price_peers) наружу не отдаём — из неё
  -- можно вытащить прайс-лист конкурента строка за строкой.
  foreach v_fn in array array[
    'public.rpc_price_verdict(uuid)',
    'public.rpc_price_verdict_draft(text, numeric, jsonb)'
  ]
  loop
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('grant execute on function %s to anon', v_fn);
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('grant execute on function %s to authenticated', v_fn);
    end if;
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('grant execute on function %s to service_role', v_fn);
    end if;
  end loop;
end;
$grants$;
