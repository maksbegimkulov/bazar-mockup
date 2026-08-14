-- ============================================================================
-- 875_saved_search_match.sql — «живой запрос»: сохранённый поиск сам находит
-- новые объявления.
--
--   saved_search_hits              — что нашлось по каждому сохранённому поиску;
--   bazar_saved_search_where()     — фильтр клиента → условие WHERE поиска;
--   bazar_saved_search_matches()   — «этот поиск действительно вернул бы это
--                                    объявление?»;
--   bazar_saved_search_score()     — насколько запрос конкретен (0.50…1.00);
--   tg_match_saved_searches()      — триггер на публикацию объявления;
--   rpc_flush_saved_search_digest()— накопленное одним уведомлением;
--   rpc_saved_search_new_counts()  — «+N новых» для бейджей.
--
-- Сейчас «новое по сохранённому поиску» считает клиент: держит снимок из 3000
-- id (js/app.js: savedSearchesHTML / savedNewCount) и сравнивает его с локальным
-- массивом объявлений. Пока приложение закрыто, не происходит ничего — а
-- смысл сохранённого поиска ровно в том, чтобы человек НЕ заходил проверять.
-- Здесь совпадение находится там же, где рождается объявление.
--
-- Два обещания, на которых всё держится.
--
--   1. Уведомление приходит только о том, что этот поиск реально вернул бы.
--      Поэтому фильтры не переписаны заново, а собраны тем же
--      bazar_search_where() из 500_search.sql — единственным источником правды
--      по семантике фильтров. Своя копия логики разошлась бы с выдачей на
--      первой же правке, и человек получил бы «новое по запросу», которого в
--      запросе нет.
--
--   2. Уведомлений мало. Совпадение записывается всегда (из него растёт
--      бейдж «+N новых»), а вот уведомление уходит, только если запрос
--      достаточно конкретен, не чаще раза в сутки на поиск, не больше трёх в
--      сутки на человека и не ночью. Остальное копится и уходит одним
--      письмом-сводкой.
--
-- Зависимости: 300_listings (listings), 500_search (bazar_* хелперы),
--              600_personal (saved_searches), 870_notifications (notifications).
-- Файл идемпотентен.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. saved_search_hits — найденное по сохранённым поискам
-- ---------------------------------------------------------------------------

create table if not exists public.saved_search_hits (
  search_id   uuid          not null references public.saved_searches(id) on delete cascade,
  listing_id  uuid          not null references public.listings(id) on delete cascade,
  user_id     uuid          not null references auth.users(id) on delete cascade,
  score       numeric(3,2)  not null,
  created_at  timestamptz   not null default now(),
  notified_at timestamptz,
  primary key (search_id, listing_id)
);

alter table public.saved_search_hits add column if not exists score       numeric(3,2);
alter table public.saved_search_hits add column if not exists created_at  timestamptz not null default now();
alter table public.saved_search_hits add column if not exists notified_at timestamptz;

comment on table public.saved_search_hits is
  'Объявления, найденные сохранёнными поисками. Ключ (search_id, listing_id) — одно объявление по одному поиску засчитывается ровно один раз, сколько бы раз его ни снимали и ни публиковали заново.';
comment on column public.saved_search_hits.user_id is
  'Владелец поиска. Дублирует saved_searches.user_id намеренно: по нему идут и RLS, и суточный потолок уведомлений — без этой колонки оба лезли бы в join на каждую строку.';
comment on column public.saved_search_hits.score is
  'Конкретность запроса на момент совпадения (bazar_saved_search_score). Решает, уходит ли уведомление; на бейдж «+N новых» не влияет.';
comment on column public.saved_search_hits.notified_at is
  'Когда по этому совпадению ушло уведомление. NULL = ещё не уходило: либо запрос слишком широкий, либо упёрлись в потолок/тишину — тогда его подберёт rpc_flush_saved_search_digest().';

-- Бейдж «+N новых» и сводка ходят по владельцу и времени.
create index if not exists saved_search_hits_user_created_idx
  on public.saved_search_hits (user_id, created_at desc);

-- Сводка перебирает только неотправленное — частичный индекс держит её в
-- пределах десятка строк на человека даже на большой таблице.
create index if not exists saved_search_hits_pending_idx
  on public.saved_search_hits (user_id, created_at)
  where notified_at is null;

-- «Не чаще раза в сутки на поиск» — проверка на каждое совпадение.
create index if not exists saved_search_hits_search_notified_idx
  on public.saved_search_hits (search_id, notified_at desc)
  where notified_at is not null;

-- Каскад при удалении объявления и проверка перепостов.
create index if not exists saved_search_hits_listing_idx
  on public.saved_search_hits (listing_id);

alter table public.saved_search_hits enable row level security;

drop policy if exists saved_search_hits_select_own on public.saved_search_hits;
create policy saved_search_hits_select_own on public.saved_search_hits
  for select to authenticated
  using (user_id = auth.uid());

-- Insert/update/delete не разрешены никому: строки заводит только триггер
-- (definer), а notified_at — служебная отметка доставки. Разрешив update,
-- мы бы дали любому обнулить себе потолок уведомлений.

revoke all on public.saved_search_hits from anon;
grant select on public.saved_search_hits to authenticated;


-- ---------------------------------------------------------------------------
-- 2. Насколько запрос конкретен
--
-- Порог существует не ради экономии строк в таблице, а ради доверия: если по
-- сохранённому «Квартиры, Бишкек» приходит уведомление на каждое из сотни
-- дневных объявлений, человек выключает уведомления целиком — и больше не
-- узнает о том единственном, ради чего сохранял поиск.
--
-- Считаем не «хороший/плохой запрос», а число независимых ограничений в нём.
-- Вес у каждого — сколько выдачи оно реально отсекает на этой базе:
--
--   слово запроса        0.20 (максимум два: третье почти ничего не режет)
--   характеристика       0.18 (максимум три: brand+model+объём и т.п.)
--   подкатегория         0.20   (одна категория без подкатегории — 0.08)
--   граница цены         0.12 за каждую
--   город                0.06
--   состояние            0.06
--
-- score = 0.5 + 0.5 × min(1, сумма). Совпадение — это всегда не меньше 0.50,
-- потому что фильтры уже сошлись; верх 1.00. Уведомление уходит от 0.75.
--
-- Как это ложится на живые запросы:
--   «айфон 13 про 128»          brand+model+память+подкатегория → 0.87  шлём
--   «квартира 2 комнаты Бишкек  подкат.+комнаты+город+цена       → 0.78  шлём
--    до 50000»
--   «коляска трансформер»       два слова + подкатегория         → 0.80  шлём
--   «велосипед»                 слово + подкатегория             → 0.70  копим
--   «Квартиры»                  только подкатегория              → 0.60  копим
--   пустой фильтр (вся лента)   ничего                           → 0.50  копим
-- ---------------------------------------------------------------------------

create or replace function public.bazar_saved_search_score(p_query jsonb)
returns numeric
language sql
immutable
parallel safe
as $$
  with j as (select coalesce(p_query, '{}'::jsonb) as q),
  n as (
    select
      -- Слова остатка запроса: то, что не разобрал парсер (js/nlu.js) и что
      -- уходит в полнотекст.
      least(2, coalesce(array_length(
        regexp_split_to_array(nullif(btrim(coalesce(j.q ->> 'q', '')), ''), '\s+'), 1), 0)) as words,
      -- Характеристики: точные значения и диапазоны считаются одинаково —
      -- «год от 2015» ограничивает выдачу не слабее, чем «цвет чёрный».
      least(3, (
        select count(*) from jsonb_object_keys(public.bazar_attrs_exact(j.q -> 'attrs'))
      ) + (
        select count(*) from jsonb_object_keys(public.bazar_attrs_ranges(j.q -> 'attrs'))
      )) as attrs,
      (public.bazar_nz(j.q ->> 'sub')       is not null) as has_sub,
      (public.bazar_nz(j.q ->> 'cat')       is not null) as has_cat,
      (public.bazar_attr_num(j.q, 'priceMin') is not null) as has_pmin,
      (public.bazar_attr_num(j.q, 'priceMax') is not null) as has_pmax,
      (public.bazar_nz(j.q ->> 'city')      is not null) as has_city,
      (public.bazar_nz(j.q ->> 'condition') is not null) as has_cond
    from j
  )
  select round(0.5 + 0.5 * least(1.0,
           n.words * 0.20
         + n.attrs * 0.18
         + case when n.has_sub then 0.20 when n.has_cat then 0.08 else 0 end
         + case when n.has_pmin then 0.12 else 0 end
         + case when n.has_pmax then 0.12 else 0 end
         + case when n.has_city then 0.06 else 0 end
         + case when n.has_cond then 0.06 else 0 end
         ), 2)
  from n;
$$;

comment on function public.bazar_saved_search_score(jsonb) is
  'Конкретность сохранённого запроса, 0.50…1.00. Считает число независимых ограничений (слова, характеристики, подкатегория, цена, город, состояние), а не качество запроса.';


-- Порог отправки живёт в одном месте: триггер и сводка обязаны решать
-- одинаково, иначе «не пришло сразу» превратится в «пришло ночью пачкой».
create or replace function public.bazar_saved_search_push_min()
returns numeric
language sql
immutable
parallel safe
as $$
  select 0.75::numeric;
$$;

comment on function public.bazar_saved_search_push_min() is
  'Минимальная конкретность запроса, при которой совпадение превращается в уведомление. Ниже порога совпадение только копится в saved_search_hits (бейдж «+N новых»).';


-- Тишина: с 22:00 до 09:00 по Бишкеку уведомления не уходят. Совпадения при
-- этом продолжают записываться — утром их заберёт сводка.
create or replace function public.bazar_quiet_hours(p_at timestamptz default now())
returns boolean
language sql
stable
parallel safe
as $$
  select extract(hour from (p_at at time zone 'Asia/Bishkek'))::int not between 9 and 21;
$$;

comment on function public.bazar_quiet_hours(timestamptz) is
  'Ночное окно 22:00–09:00 по Бишкеку, когда уведомления не отправляются.';


-- Заголовок без регистра, пунктуации и лишних пробелов — для сравнения
-- перепостов («iPhone 13 Pro, 128гб» и «iPhone 13 Pro 128 ГБ» — одно и то же).
--
-- Цифры и буквы дополнительно разводятся пробелом: «128гб» и «128 гб» человек
-- пишет как придётся, и без этого шага перепост считался бы новым товаром.
-- Именно нормализация, а не похожесть: «iPhone 13 Pro 128» и «iPhone 13 Pro
-- 256» триграммы считают почти одинаковыми (0.85), и объявление на 256 ГБ
-- молча не дошло бы до человека — а это ровно то, ради чего он сохранял поиск.
create or replace function public.bazar_norm_title(p_title text)
returns text
language sql
immutable
parallel safe
as $$
  select nullif(btrim(regexp_replace(
           regexp_replace(
             regexp_replace(lower(coalesce(p_title, '')), '([0-9])([a-zа-яё])', '\1 \2', 'g'),
             '([a-zа-яё])([0-9])', '\1 \2', 'g'),
           '[^0-9a-zа-яё]+', ' ', 'g')), '');
$$;

comment on function public.bazar_norm_title(text) is
  'Заголовок в сравнимом виде: нижний регистр, только буквы и цифры, пробел между цифрой и буквой, одиночные пробелы.';


-- ---------------------------------------------------------------------------
-- 3. Фильтр клиента → условие WHERE поиска
--
-- Ключи здесь — те же, что в defaultFilters() (js/app.js): q, cat, sub, city,
-- priceMin, priceMax, condition, sellerType, withPhoto, delivery, period,
-- attrs, exclude. Ровно этот объект клиент кладёт в saved_searches.query.
--
-- Чего сознательно НЕ учитываем:
--   belowMarket / verifiedSeller — пресеты, считаются по статистике цен и
--     репутации; на момент публикации объявления и то и другое ещё неизвестно.
--     Пропустить такой фильтр — значит уведомить чуть шире, чем просил человек;
--     учесть его наполовину — значит молча не уведомить о подходящем. Первое
--     честнее и заметно реже.
--   sort — на «подходит или нет» не влияет вообще.
-- ---------------------------------------------------------------------------

create or replace function public.bazar_saved_search_where(p_query jsonb)
returns text
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_q     jsonb := coalesce(p_query, '{}'::jsonb);
  v_text  text  := nullif(btrim(coalesce(v_q ->> 'q', '')), '');
  v_where text;
  v_cond  text;
  v_kind  text;
  v_del   boolean;
  r       jsonb;
begin
  -- Состояние и тип продавца — enum'ы: чужое значение уронило бы приведение
  -- типа внутри триггера, поэтому неизвестное молча считаем «не задано».
  v_cond := public.bazar_nz(v_q ->> 'condition');
  if v_cond is not null and v_cond not in ('new', 'used') then
    v_cond := null;
  end if;

  v_kind := public.bazar_nz(v_q ->> 'sellerType');
  if v_kind is not null and v_kind not in ('private', 'business') then
    v_kind := null;
  end if;

  -- delivery в клиенте — галочка: снята = «не важно», а не «без доставки».
  v_del := case when v_q -> 'delivery' = 'true'::jsonb then true end;

  v_where := public.bazar_search_where(
    v_text,
    public.bazar_nz(v_q ->> 'cat'),
    public.bazar_nz(v_q ->> 'sub'),
    public.bazar_nz(v_q ->> 'city'),
    public.bazar_attr_num(v_q, 'priceMin'),   -- '' и мусор → NULL, а не ошибка
    public.bazar_attr_num(v_q, 'priceMax'),
    v_cond::item_condition,
    v_kind::seller_kind,
    v_del,
    coalesce(v_q -> 'attrs', '{}'::jsonb),
    public.bazar_nz(v_q ->> 'period'),
    case when v_text is null then 'none' else 'fts' end
    -- Только полнотекст. Триграммный откат в поиске включается, когда
    -- полнотекст не дал НИЧЕГО, — это спасение пустой выдачи от опечатки.
    -- Уведомление же приходит без спроса, и «похоже на то, что вы искали»
    -- здесь читается как ошибка, а не как помощь.
  );

  -- withPhoto: в серверном поиске такого параметра пока нет (клиент режет
  -- сам), но в сохранённом фильтре он есть — и без него человек получил бы
  -- уведомление ровно про то, что просил не показывать.
  if v_q -> 'withPhoto' = 'true'::jsonb then
    v_where := v_where || ' and coalesce(array_length(l.photos, 1), 0) > 0';
  end if;

  -- Отрицания из строки запроса («телефон не самсунг»): парсер кладёт их в
  -- exclude как [{brand}|{model}]. position(... in ...) вместо like/~ —
  -- у пользовательской строки нет шанса стать шаблоном.
  for r in select value from jsonb_array_elements(
             case when jsonb_typeof(v_q -> 'exclude') = 'array'
                  then v_q -> 'exclude' else '[]'::jsonb end)
  loop
    if nullif(btrim(coalesce(r ->> 'brand', '')), '') is not null then
      v_where := v_where || format(
        ' and not (l.attrs @> jsonb_build_object(''brand'', %L))'
        || ' and position(lower(%L) in lower(l.title)) = 0',
        btrim(r ->> 'brand'), btrim(r ->> 'brand'));
    end if;
    if nullif(btrim(coalesce(r ->> 'model', '')), '') is not null then
      v_where := v_where || format(
        ' and not (l.attrs @> jsonb_build_object(''model'', %L))',
        btrim(r ->> 'model'));
    end if;
  end loop;

  return v_where;
end;
$$;

comment on function public.bazar_saved_search_where(jsonb) is
  'Сохранённый фильтр клиента → условие WHERE поиска (алиасы l = listings, p = profiles). Семантику берёт из bazar_search_where, чтобы уведомления не расходились с выдачей.';


create or replace function public.bazar_saved_search_matches(p_query jsonb, p_listing uuid)
returns boolean
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_res boolean;
begin
  -- Тот же запрос, что и в ленте, но по одной строке: «вернул бы этот поиск
  -- это объявление прямо сейчас?». Проверки прав здесь не нужно — условие
  -- из bazar_search_where само отсекает всё, кроме активного, непросроченного
  -- и не забаненного, то есть публично видимого.
  execute format(
    'select exists (select 1 from public.listings l'
    || ' left join public.profiles p on p.id = l.owner_id'
    || ' where l.id = %L and %s)',
    p_listing, public.bazar_saved_search_where(p_query))
  into v_res;
  return coalesce(v_res, false);
end;
$$;

comment on function public.bazar_saved_search_matches(jsonb, uuid) is
  'Вернул бы сохранённый поиск это объявление. Внутренняя функция матчера: наружу не выдаётся, вызывается из definer-триггера.';


-- ---------------------------------------------------------------------------
-- 4. Триггер: объявление опубликовано → кому оно нужно
--
-- Definer: чужие сохранённые поиски под RLS не видны, а уведомление создаётся
-- другому пользователю — политики insert на notifications нет ни у кого.
-- Пользовательских аргументов у функции нет, вызывается только как триггер,
-- наружу ничего не возвращает.
-- ---------------------------------------------------------------------------

create or replace function public.tg_match_saved_searches()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  -- Потолок разбираемых поисков на одно объявление. Живой размер выборки —
  -- десятки строк (поиски с этой же категорией/городом), 500 взяты как
  -- предохранитель от «все сохранили Бишкек»: публикация объявления не должна
  -- превращаться в минутную транзакцию.
  c_max_searches constant int := 500;
  -- Не больше одного уведомления в сутки на поиск и трёх в сутки на человека:
  -- дальше это перестаёт быть новостью и становится фоном.
  c_per_user_day constant int := 3;
  v_actor  uuid := auth.uid();
  v_min    numeric := public.bazar_saved_search_push_min();
  v_quiet  boolean := public.bazar_quiet_hours();
  v_seen   int := 0;
  v_score  numeric;
  v_ok     boolean;
  v_match  boolean;
  v_price  text;
  v_dup_at timestamptz;
  s        record;
begin
  for s in
    select ss.id, ss.user_id, ss.name, ss.query
      from public.saved_searches ss
     where ss.notify
       -- Себе не ищем: своё же объявление в сохранённом поиске — не новость.
       and ss.user_id <> new.owner_id
       and ss.user_id is distinct from v_actor
       -- Дешёвый отсев до разбора фильтра: категория, подкатегория и город
       -- сравниваются прямо в jsonb. Всё остальное (цена, характеристики,
       -- текст) считает уже полноценный матчер.
       and (public.bazar_nz(ss.query ->> 'cat')  is null or ss.query ->> 'cat'  = new.category)
       and (public.bazar_nz(ss.query ->> 'sub')  is null or ss.query ->> 'sub'  = new.subcategory)
       and (public.bazar_nz(ss.query ->> 'city') is null or ss.query ->> 'city' = new.city)
     order by ss.created_at
     limit c_max_searches + 1
  loop
    v_seen := v_seen + 1;
    if v_seen > c_max_searches then
      -- Молча обрезать нельзя: со стороны это выглядит как «уведомления
      -- работают», хотя часть людей их уже не получает.
      raise warning 'saved_search: у объявления % больше % подходящих поисков, остальные пропущены',
        new.id, c_max_searches;
      exit;
    end if;

    -- Сохранённый фильтр — пользовательские данные: там может лежать период
    -- «за 3 дня» строкой «позавчера» или сломанный attrs от старой версии
    -- клиента. Чужая кривая запись не имеет права уронить публикацию, поэтому
    -- разбор каждого поиска отдельный. Ошибку не проглатываем — она уходит в
    -- лог предупреждением, иначе сломанный матчер выглядел бы как «просто
    -- никто не подписан».
    v_ok := true;
    begin
      v_match := public.bazar_saved_search_matches(s.query, new.id);
    exception when others then
      v_ok := false;
      raise warning 'saved_search %: фильтр не применился (%), поиск пропущен', s.id, sqlerrm;
    end;

    if not v_ok or not v_match then
      continue;
    end if;

    v_score := public.bazar_saved_search_score(s.query);

    -- Совпадение засчитывается один раз навсегда. Продавец может снять и
    -- вернуть объявление хоть десять раз — второй строки не будет, а значит
    -- и второго «+1 новое» в бейдже.
    insert into public.saved_search_hits (search_id, listing_id, user_id, score)
    values (s.id, new.id, s.user_id, v_score)
    on conflict (search_id, listing_id) do nothing;

    if not found then
      continue;
    end if;

    -- Дальше — только про отправку. Само совпадение уже записано и попадёт в
    -- бейдж «+N новых» в любом случае.
    if v_score < v_min or v_quiet then
      continue;
    end if;

    -- Перепост: то же объявление тем же продавцом под новым id. Для человека
    -- это не новинка, он его уже видел.
    select h.notified_at into v_dup_at
      from public.saved_search_hits h
      join public.listings l2 on l2.id = h.listing_id
     where h.search_id = s.id
       and h.listing_id <> new.id
       and h.created_at > now() - interval '7 days'
       and l2.owner_id = new.owner_id
       and public.bazar_norm_title(l2.title) is not distinct from public.bazar_norm_title(new.title)
     order by h.created_at desc
     limit 1;

    if found then
      -- Считаем доставленным тем же моментом, что и оригинал: иначе перепост
      -- сжёг бы суточное окно поиска, ничего человеку не сказав. Если по
      -- оригиналу уведомления не было вовсе — закрываем сейчас, чтобы сводка
      -- не подняла ночью то, что и так лежит в бейдже.
      update public.saved_search_hits
         set notified_at = coalesce(v_dup_at, now())
       where search_id = s.id and listing_id = new.id;
      continue;
    end if;

    -- Потолок на поиск: одно уведомление в сутки.
    -- (Две одновременные публикации теоретически могут проскочить обе — блокировать
    -- ради этого чужую вставку дороже, чем изредка прислать второе уведомление.)
    if exists (
      select 1 from public.saved_search_hits h
       where h.search_id = s.id
         and h.notified_at > now() - interval '24 hours'
    ) then
      continue;
    end if;

    -- Потолок на человека: три уведомления в сутки по всем его поискам.
    -- Считаем именно уведомления, а не совпадения: сводка помечает доставленной
    -- сразу всю пачку, и по совпадениям потолок выбирался бы одним письмом.
    if (
      select count(*) from public.notifications n
       where n.user_id = s.user_id
         and n.kind = 'saved_search'
         and n.created_at > now() - interval '24 hours'
    ) >= c_per_user_day then
      continue;
    end if;

    v_price := case
                 when new.price is null or new.price <= 0 then 'цена договорная'
                 else regexp_replace(round(new.price)::text, '(\d)(?=(\d{3})+$)', '\1 ', 'g') || ' сом'
               end;

    insert into public.notifications (user_id, kind, title, body, link)
    values (s.user_id,
            'saved_search'::notify_kind,
            'Новое по запросу «' || left(s.name, 40) || '»',
            left(new.title, 80) || ' — ' || v_price,
            '#/item/' || new.id::text);

    update public.saved_search_hits
       set notified_at = now()
     where search_id = s.id and listing_id = new.id;
  end loop;

  return null;
end;
$$;

comment on function public.tg_match_saved_searches() is
  'Разносит новое объявление по сохранённым поискам: записывает совпадение всем подходящим и отправляет уведомление тем, чей запрос достаточно конкретен (с потолками и ночной тишиной).';

drop trigger if exists trg_match_saved_searches on public.listings;
create trigger trg_match_saved_searches
  after insert on public.listings
  for each row
  when (new.status = 'active'::listing_status)
  execute function public.tg_match_saved_searches();

-- Черновик, дозревший до публикации, — такое же новое объявление. Условие
-- «стало active, а было другим» держит триггер в стороне от обычных апдейтов
-- (просмотры, bump, правка цены) и от повторного «снял — вернул» в тот же
-- статус.
drop trigger if exists trg_match_saved_searches_activate on public.listings;
create trigger trg_match_saved_searches_activate
  after update of status on public.listings
  for each row
  when (new.status = 'active'::listing_status
        and old.status is distinct from 'active'::listing_status)
  execute function public.tg_match_saved_searches();


-- ---------------------------------------------------------------------------
-- 5. rpc_saved_search_new_counts — «+N новых» для списка сохранённых
--
-- Клиент считает это, прогоняя фильтр по всем объявлениям в памяти. На живой
-- базе так нельзя: счётчик у пяти поисков стоил бы пяти полных выдач.
-- ---------------------------------------------------------------------------

drop function if exists public.rpc_saved_search_new_counts();

create or replace function public.rpc_saved_search_new_counts()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_res jsonb;
begin
  -- Сессии нет — считать нечего: пустой объект, а не ошибка. Гость сюда и не
  -- доходит (execute ему не выдан, см. блок прав ниже), но служебная роль зовёт
  -- функцию без auth.uid(), и падать на этом незачем.
  if v_uid is null then
    return '{}'::jsonb;
  end if;

  -- Definer, потому что считать надо по saved_search_hits и listings разом, но
  -- личность берётся из auth.uid(), а наружу уходят только числа: ни строк, ни
  -- заголовков чужих объявлений.
  select coalesce(jsonb_object_agg(t.search_id, t.n), '{}'::jsonb) into v_res
    from (
      select h.search_id, count(*) as n
        from public.saved_search_hits h
        join public.saved_searches ss on ss.id = h.search_id
        join public.listings l on l.id = h.listing_id
       where h.user_id = v_uid
         and h.created_at > ss.last_seen_at   -- «новое» = появилось после того, как человек открывал поиск
         and l.status = 'active'
         and l.expires_at > now()
       group by h.search_id
    ) t;

  return v_res;
end;
$$;

comment on function public.rpc_saved_search_new_counts() is
  'Счётчики «+N новых» по сохранённым поискам текущего пользователя: { "<search_id>": N }. Считаются только ещё живые объявления, появившиеся после last_seen_at.';


-- ---------------------------------------------------------------------------
-- 6. rpc_flush_saved_search_digest — накопленное одним уведомлением
--
-- Сюда стекается всё, что триггер не отправил: ночная тишина и упёршиеся в
-- потолок совпадения. Одно уведомление на поиск, не на объявление.
--
-- Вызывается клиентом при открытии приложения (тогда обрабатывается только
-- свой пользователь) и служебной ролью по расписанию — тогда auth.uid() пуст
-- и разбираются все. Никаких внешних сервисов: уведомление остаётся в
-- приложении, канал доставки наружу подключается отдельно.
-- ---------------------------------------------------------------------------

drop function if exists public.rpc_flush_saved_search_digest();

create or replace function public.rpc_flush_saved_search_digest()
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c_per_user_day constant int := 3;
  -- Глубина сводки. Без неё человек, не заходивший месяц, получил бы
  -- «142 новых» — число, из которого ничего не следует.
  c_window       constant interval := interval '7 days';
  v_uid   uuid := auth.uid();
  v_min   numeric := public.bazar_saved_search_push_min();
  v_sent  int := 0;
  v_today int;
  v_body  text;
  s       record;
begin
  -- Ночью не шлём ничего: сводка и существует ради того, чтобы дождаться утра.
  if public.bazar_quiet_hours() then
    return 0;
  end if;

  -- Хвосты старше месяца не нужны ни бейджу, ни сводке, а таблица растёт на
  -- каждое совпадение. Чистим только своё — чужие строки под RLS не видны
  -- никому, но и definer'у здесь незачем трогать чужое.
  delete from public.saved_search_hits h
   where h.created_at < now() - interval '30 days'
     and (v_uid is null or h.user_id = v_uid);

  for s in
    select h.user_id,
           h.search_id,
           ss.name,
           count(*)::int as n,
           (array_agg(l.title order by h.created_at desc))[1:2] as titles
      from public.saved_search_hits h
      join public.saved_searches ss on ss.id = h.search_id
      join public.listings l on l.id = h.listing_id
     where h.notified_at is null
       and h.score >= v_min
       and h.created_at > now() - c_window
       and ss.notify
       and l.status = 'active'
       and l.expires_at > now()
       and (v_uid is null or h.user_id = v_uid)
       -- Потолок на поиск действует и здесь: сводка не обходит правило
       -- «не чаще раза в сутки», она лишь переносит отправку на утро.
       and not exists (
         select 1 from public.saved_search_hits h2
          where h2.search_id = h.search_id
            and h2.notified_at > now() - interval '24 hours'
       )
     group by h.user_id, h.search_id, ss.name
     order by h.user_id, min(h.created_at)
  loop
    -- Потолок на человека считается внутри цикла: за проход мы сами добавляем
    -- отправленные, и следующий поиск того же человека обязан их видеть.
    -- Считаем уведомления, а не совпадения: одно письмо сводки закрывает всю
    -- пачку совпадений, и по ним потолок выбирался бы мгновенно.
    select count(*) into v_today
      from public.notifications n
     where n.user_id = s.user_id
       and n.kind = 'saved_search'
       and n.created_at > now() - interval '24 hours';

    if v_today >= c_per_user_day then
      continue;
    end if;

    v_body := left(s.titles[1], 60)
              || case when s.n > 1 then ', ' || left(s.titles[2], 60) else '' end
              || case when s.n > 2 then ' и ещё ' || (s.n - 2)::text else '' end;

    insert into public.notifications (user_id, kind, title, body, link)
    values (s.user_id,
            'saved_search'::notify_kind,
            case when s.n = 1 then 'Новое по запросу «' || left(s.name, 40) || '»'
                 else s.n::text || ' новых по запросу «' || left(s.name, 40) || '»' end,
            v_body,
            '#/saved/' || s.search_id::text);

    -- Отмечаем доставленной всю пачку, а не только показанные в тексте:
    -- человек откроет поиск и увидит их все.
    update public.saved_search_hits h
       set notified_at = now()
     where h.search_id = s.search_id
       and h.notified_at is null
       and h.score >= v_min
       and h.created_at > now() - c_window;

    v_sent := v_sent + 1;
  end loop;

  return v_sent;
end;
$$;

comment on function public.rpc_flush_saved_search_digest() is
  'Отправляет накопившиеся совпадения по сохранённым поискам одним уведомлением на поиск (то, что не ушло сразу из-за ночной тишины или потолка). Без сессии обрабатывает всех — вызов по расписанию служебной ролью.';


-- ---------------------------------------------------------------------------
-- Права
-- ---------------------------------------------------------------------------

do $grants$
declare
  v_fn text;
begin
  -- Хелперы матчера наружу не отдаём: bazar_saved_search_matches отвечает на
  -- вопрос про конкретное объявление, и незачем давать этот вопрос задавать
  -- пачкой. Внутри definer-функций они работают правами владельца.
  foreach v_fn in array array[
    'public.bazar_saved_search_score(jsonb)',
    'public.bazar_saved_search_push_min()',
    'public.bazar_quiet_hours(timestamptz)',
    'public.bazar_norm_title(text)',
    'public.bazar_saved_search_where(jsonb)',
    'public.bazar_saved_search_matches(jsonb, uuid)',
    'public.tg_match_saved_searches()',
    'public.rpc_saved_search_new_counts()',
    'public.rpc_flush_saved_search_digest()'
  ]
  loop
    execute format('revoke all on function %s from public', v_fn);
    -- «public» на Supabase — не «все»: шаблонные права проекта выдают execute
    -- прямо ролям anon и authenticated, и revoke ... from public их не снимает.
    -- Без этих двух строк сводку мог запустить кто угодно без сессии — а без
    -- сессии она означает «разобрать всех», то есть чужие уведомления.
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on function %s from anon', v_fn);
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke all on function %s from authenticated', v_fn);
    end if;
  end loop;

  -- Ролей Supabase на голом Postgres нет — миграция не обязана из-за этого
  -- падать (локальная проверка схемы должна проходить где угодно).
  foreach v_fn in array array[
    'public.rpc_saved_search_new_counts()',
    'public.rpc_flush_saved_search_digest()'
  ]
  loop
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('grant execute on function %s to authenticated', v_fn);
    end if;
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('grant execute on function %s to service_role', v_fn);
    end if;
  end loop;
  -- anon не получает ничего: у гостя нет сохранённых поисков, а сводка без
  -- сессии означает «обработать всех» — это работа расписания, не браузера.
end;
$grants$;
