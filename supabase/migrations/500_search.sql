-- ============================================================================
-- 500_search.sql — серверный поиск BAZAR
--
--   rpc_search_listings — лента и поиск: полнотекст + фильтры + keyset-страницы
--   rpc_attr_counts     — счётчики значений характеристик для панели фильтров
--
-- Почему это вообще на сервере. Сейчас клиент тянет все объявления и фильтрует
-- их в браузере (js/app.js: applyFilters / attrCountsFor). На 6030 мок-строках
-- это ещё работает, на реальной базе — нет: трафик растёт линейно, а телефон
-- пересчитывает счётчики характеристик на каждый тап по фильтру.
--
-- Файл идемпотентен: все объекты пересоздаются, drop идёт перед create там,
-- где сигнатура может измениться (create or replace не умеет менять тип
-- возврата и падает при повторном прогоне после правки).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Мелкие чистые хелперы
--
-- Ни один из них НЕ security definer и НЕ фиксирует search_path: они не
-- обращаются к таблицам, только к функциям pg_catalog, и я хочу, чтобы
-- планировщик мог их инлайнить. Функция с `SET` в определении не инлайнится
-- никогда, а bazar_attr_num и bazar_cursor_encode вызываются на КАЖДУЮ строку
-- выборки — там это разница в разы.
-- ----------------------------------------------------------------------------

-- Числовое значение атрибута или NULL, если там не число.
-- Значения attrs заполняет человек (или парсер заголовков в js/attributes.js),
-- поэтому в year может лежать '2015', 2015 или 'не помню'. Прямой ::numeric
-- уронил бы весь запрос на одной кривой строке. Обёртка begin/exception здесь
-- тоже не годится: это подтранзакция на каждую строку выборки. Регулярка
-- дешевле на порядок и даёт ровно тот же результат.
create or replace function public.bazar_attr_num(p_attrs jsonb, p_key text)
returns numeric
language sql
immutable
parallel safe
as $$
  select case
           when p_attrs ->> p_key ~ '^\s*-?[0-9]+(\.[0-9]+)?\s*$'
           then (p_attrs ->> p_key)::numeric
         end;
$$;

comment on function public.bazar_attr_num(jsonb, text) is
  'Значение ключа attrs как numeric; NULL, если значение не число (не падает на мусоре).';


-- Клиент шлёт «фильтр не задан» тремя разными способами: '', 'all' (город,
-- период) и 'any' (состояние, тип продавца) — см. defaultFilters() в js/app.js.
-- Без этой нормализации фильтр city='all' искал бы город с названием «all»
-- и отдавал ноль результатов.
create or replace function public.bazar_nz(p text)
returns text
language sql
immutable
parallel safe
as $$
  select nullif(nullif(nullif(btrim(coalesce(p, '')), ''), 'all'), 'any');
$$;

comment on function public.bazar_nz(text) is
  'Сентинелы клиента ('''' / ''all'' / ''any'') → NULL, то есть «фильтр не задан».';


-- Точные значения характеристик: всё, кроме диапазонных ключей вида ключMin /
-- ключMax и пустых значений. Результат идёт в оператор @> — он ложится на
-- индекс gin (attrs jsonb_path_ops) из 300.
create or replace function public.bazar_attrs_exact(p_attrs jsonb)
returns jsonb
language sql
immutable
parallel safe
as $$
  select coalesce(
           jsonb_object_agg(e.key, e.value) filter (
             where e.key !~ '(Min|Max)$'
               and jsonb_typeof(e.value) <> 'null'
               and nullif(btrim(e.value #>> '{}'), '') is not null
           ),
           '{}'::jsonb)
  from jsonb_each(coalesce(p_attrs, '{}'::jsonb)) as e(key, value);
$$;

comment on function public.bazar_attrs_exact(jsonb) is
  'Из объекта фильтров характеристик — только точные значения (без *Min/*Max и пустых).';


-- Диапазоны: {"yearMin":"2010","yearMax":"2020"} → {"year":{"min":"2010","max":"2020"}}.
-- Границы оставляем текстом: валидирует их bazar_search_where, а хранить их
-- как numeric здесь нельзя — тогда мусорный ввод падал бы внутри immutable
-- функции без внятного сообщения.
create or replace function public.bazar_attrs_ranges(p_attrs jsonb)
returns jsonb
language sql
immutable
parallel safe
as $$
  select coalesce(jsonb_object_agg(t.base, t.spec), '{}'::jsonb)
  from (
    select substring(e.key from '^(.+)(?:Min|Max)$') as base,
           jsonb_object_agg(
             case when e.key like '%Min' then 'min' else 'max' end,
             btrim(e.value #>> '{}')
           ) filter (where nullif(btrim(e.value #>> '{}'), '') is not null) as spec
    from jsonb_each(coalesce(p_attrs, '{}'::jsonb)) as e(key, value)
    where e.key ~ '(Min|Max)$'
      and jsonb_typeof(e.value) <> 'null'
    group by 1
  ) t
  where t.base is not null and t.spec is not null;
$$;

comment on function public.bazar_attrs_ranges(jsonb) is
  'Ключи ключMin/ключMax → {"ключ":{"min":...,"max":...}} для диапазонных фильтров.';


-- Курсор keyset-пагинации. Клиент обязан считать его непрозрачным и возвращать
-- байт-в-байт, поэтому кодируем base64url: '+' и '/' ломаются в query-строке,
-- а encode() ещё и разбивает вывод переводами строки каждые 76 символов —
-- их убираем, иначе курсор рвётся в логах и заголовках.
create or replace function public.bazar_cursor_encode(p jsonb)
returns text
language sql
immutable
parallel safe
as $$
  select translate(
           translate(encode(convert_to(p::text, 'UTF8'), 'base64'), E'\n\r', ''),
           '+/', '-_');
$$;

create or replace function public.bazar_cursor_decode(p text)
returns jsonb
language plpgsql
immutable
parallel safe
as $$
declare
  v jsonb;
begin
  select convert_from(decode(translate(p, '-_', '+/'), 'base64'), 'UTF8')::jsonb into v;
  if jsonb_typeof(v) <> 'object' then
    raise exception 'битый курсор поиска' using errcode = '22023';
  end if;
  return v;
exception when others then
  -- Тихо игнорировать битый курсор нельзя: клиент молча получил бы первую
  -- страницу вместо третьей и решил бы, что пагинация зациклилась.
  raise exception 'битый курсор поиска' using errcode = '22023';
end;
$$;

comment on function public.bazar_cursor_encode(jsonb) is
  'jsonb → непрозрачный base64url-курсор keyset-пагинации.';
comment on function public.bazar_cursor_decode(text) is
  'Обратно к jsonb; на мусоре — понятная ошибка, а не тихая первая страница.';


-- В каком схеме живёт pg_trgm, знать заранее нельзя: Supabase кладёт
-- расширения в `extensions`, чистый Postgres — в `public`. А search_path у
-- наших definer-функций по контракту прибит к `public, pg_temp`, поэтому
-- функции pg_trgm надо звать со схемой. NULL = расширения нет, тогда
-- триграммный откат просто выключается (см. rpc_search_listings).
create or replace function public.bazar_trgm_schema()
returns text
language sql
stable
parallel safe
as $$
  select n.nspname::text
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pg_trgm';
$$;

comment on function public.bazar_trgm_schema() is
  'Схема расширения pg_trgm (или NULL). Нужна, чтобы звать similarity со схемой при фиксированном search_path.';


-- ----------------------------------------------------------------------------
-- 2. Сборщик условия WHERE — единственный источник правды по семантике фильтров
--
-- rpc_search_listings и rpc_attr_counts обязаны фильтровать ОДИНАКОВО: если
-- счётчик обещает 128 объявлений, а выдача даёт 96, доверие к фильтрам
-- кончается сразу. Поэтому условие собирается здесь один раз, а обе RPC его
-- подставляют.
--
-- Почему текст, а не общая view/SRF: фильтров дюжина и почти все опциональные.
-- Статический запрос со списком `(p_city is null or l.city = p_city)` заставляет
-- планировщик строить один общий план на все комбинации и терять индексы, а
-- set-returning функция материализует весь список id и убивает смысл keyset —
-- страница должна стоить O(размера страницы), а не O(всей выдачи).
--
-- Инъекции: наружу не уходит ни одного куска пользовательской строки без
-- format(%L)/quote_ident. Числа и enum приходят уже типизированными.
-- ----------------------------------------------------------------------------
create or replace function public.bazar_search_where(
  p_query        text,
  p_category     text,
  p_subcategory  text,
  p_city         text,
  p_price_min    numeric,
  p_price_max    numeric,
  p_condition    item_condition,
  p_seller_kind  seller_kind,
  p_delivery     boolean,
  p_attrs        jsonb,
  p_period       text,
  p_mode         text          -- 'none' | 'fts' | 'trgm'
)
returns text
language plpgsql
stable
set search_path = public, pg_temp
as $bsw$
declare
  -- Алиасы фиксированы: l = public.listings, p = public.profiles.
  v_parts  text[] := array[
    -- Это и есть проверка прав для definer-функций поиска: наружу уходят
    -- только опубликованные и непросроченные объявления, чьё-либо авторство
    -- роли не играет. Черновики, проданное, заблокированное модерацией и
    -- протухшее не видит никто, включая владельца.
    'l.status = ''active''::listing_status',
    'l.expires_at > now()',
    -- Забаненный продавец исчезает из выдачи целиком. Иначе бан пришлось бы
    -- «доносить» до каждого его объявления отдельным апдейтом.
    '(p.banned_until is null or p.banned_until <= now())'
  ];
  v_exact  jsonb;
  v_ranges jsonb;
  v_days   int;
  v_trgm   text;
  r        record;
begin
  if p_category is not null then
    v_parts := v_parts || format('l.category = %L', p_category);
  end if;
  if p_subcategory is not null then
    v_parts := v_parts || format('l.subcategory = %L', p_subcategory);
  end if;
  if p_city is not null then
    v_parts := v_parts || format('l.city = %L', p_city);
  end if;

  -- price = 0 в этой базе означает «цена не указана / договорная», а не «даром».
  -- Такое объявление под ценовой диапазон не подходит: про него ничего не
  -- известно. Клиент ведёт себя ровно так же (applyFilters в js/app.js), и
  -- расхождение здесь дало бы разные выдачи до и после включения бэкенда.
  if p_price_min is not null then
    v_parts := v_parts || format('(l.price > 0 and l.price >= %L::numeric)', p_price_min);
  end if;
  if p_price_max is not null then
    v_parts := v_parts || format('(l.price > 0 and l.price <= %L::numeric)', p_price_max);
  end if;

  if p_condition is not null then
    v_parts := v_parts || format('l.condition = %L::item_condition', p_condition);
  end if;
  if p_seller_kind is not null then
    -- profiles подключён LEFT JOIN, поэтому объявление без профиля владельца
    -- при фильтре по типу продавца отсеется — это правильно: тип неизвестен.
    v_parts := v_parts || format('p.kind = %L::seller_kind', p_seller_kind);
  end if;

  -- Отдельной колонки delivery в контракте нет, признак живёт в attrs
  -- (в клиенте это hasDelivery). Форму `attrs @> '{"delivery": true}'`
  -- выбрал не случайно: только она ложится на gin (attrs jsonb_path_ops).
  if p_delivery is true then
    v_parts := v_parts || 'l.attrs @> ''{"delivery": true}''::jsonb';
  elsif p_delivery is false then
    v_parts := v_parts || 'not (l.attrs @> ''{"delivery": true}''::jsonb)';
  end if;

  -- Период. Контракт называет 'day'/'week'/'month', живой клиент шлёт '1'/'7'/'30'
  -- (см. фильтр-чипы в js/app.js) — принимаем оба словаря, иначе переключение
  -- на серверный поиск потребовало бы синхронной правки фронта.
  if public.bazar_nz(p_period) is not null then
    v_days := case lower(btrim(p_period))
                when 'day'   then 1
                when 'week'  then 7
                when 'month' then 30
                when 'year'  then 365
                else null
              end;
    if v_days is null then
      if btrim(p_period) ~ '^[0-9]+$' then
        v_days := btrim(p_period)::int;
      else
        raise exception 'неизвестный период поиска: %', p_period using errcode = '22023';
      end if;
    end if;
    -- Считаем от created_at, а не от bumped_at: «за неделю» — это про то,
    -- когда объявление появилось, иначе поднятое старьё выглядело бы свежим.
    v_parts := v_parts || format('l.created_at >= now() - %L::interval', v_days || ' days');
  end if;

  -- Точные характеристики одним @>: одно обращение к GIN вместо N сравнений.
  -- ВАЖНО: @> сверяет и JSON-тип тоже. Клиент хранит значения select-полей
  -- строками ('128', '2015'), фильтры шлёт тоже строками — совпадает. Числовые
  -- характеристики (year, mileage, area) фильтруются диапазонами ниже, там тип
  -- не важен, так что расхождение строка/число практике не мешает.
  v_exact := public.bazar_attrs_exact(p_attrs);
  if v_exact <> '{}'::jsonb then
    v_parts := v_parts || format('l.attrs @> %L::jsonb', v_exact);
  end if;

  -- Диапазоны. Нет атрибута — не подходит: «год от 2015» не должно вытаскивать
  -- объявления без года (так же ведёт себя passesAttrs в js/attributes.js).
  v_ranges := public.bazar_attrs_ranges(p_attrs);
  if v_ranges <> '{}'::jsonb then
    for r in select key, value from jsonb_each(v_ranges) loop
      if (r.value ->> 'min') is not null and (r.value ->> 'min') !~ '^-?[0-9]+(\.[0-9]+)?$' then
        raise exception 'граница фильтра %Min должна быть числом, пришло %', r.key, r.value ->> 'min'
          using errcode = '22023';
      end if;
      if (r.value ->> 'max') is not null and (r.value ->> 'max') !~ '^-?[0-9]+(\.[0-9]+)?$' then
        raise exception 'граница фильтра %Max должна быть числом, пришло %', r.key, r.value ->> 'max'
          using errcode = '22023';
      end if;
    end loop;
    v_parts := v_parts || format(
      'not exists (select 1 from jsonb_each(%L::jsonb) as rg(k, spec) where '
      || 'public.bazar_attr_num(l.attrs, rg.k) is null '
      || 'or (spec ->> ''min'' is not null and public.bazar_attr_num(l.attrs, rg.k) < (spec ->> ''min'')::numeric) '
      || 'or (spec ->> ''max'' is not null and public.bazar_attr_num(l.attrs, rg.k) > (spec ->> ''max'')::numeric))',
      v_ranges);
  end if;

  -- Текстовый поиск.
  if p_mode = 'fts' then
    -- websearch_to_tsquery, а не plainto_: человек имеет право написать
    -- "фразу в кавычках" и -минус-слово, и это должно работать, а не искаться
    -- буквально. Ещё он никогда не падает на кривом синтаксисе, в отличие от
    -- to_tsquery — а поисковую строку набирает пользователь.
    v_parts := v_parts || format('l.search_vector @@ websearch_to_tsquery(''russian'', %L)', p_query);
  elsif p_mode = 'trgm' then
    v_trgm := public.bazar_trgm_schema();
    if v_trgm is null then
      raise exception 'триграммный поиск запрошен, но расширение pg_trgm не установлено'
        using errcode = '0A000';
    end if;
    -- Мягкий откат «на похожесть», когда полнотекст не дал ничего.
    --
    -- Порог 0.5 по strict_word_similarity — не с потолка, замерял на строках
    -- вида реальных заголовков:
    --   опечатки, которые надо ловить: мерседесс→Мерседес 0.73, велосипет→
    --   Велосипед 0.67, халодильник→Холодильник 0.60, квартра→Квартира 0.55,
    --   «кросовки найк»→«Кроссовки Nike» 0.50;
    --   мусор, который ловить нельзя: стол→Столица 0.44, телефон→Телевизор
    --   0.29, ноутбук→Ноготочки 0.13.
    -- Ниже 0.45 в выдачу лезет «Столица» по запросу «стол» — а это ровно тот
    -- случай, из-за которого поиск считают сломанным. Взял обычный
    -- word_similarity — разделения нет вовсе: там и «стол»→«Столица» 0.80.
    --
    -- Индекс gin (title gin_trgm_ops) здесь не используется: его понимают
    -- только операторы <<% / %, а их порог живёт в сессионной GUC
    -- pg_trgm.strict_word_similarity_threshold, то есть был бы невидим в коде
    -- и менялся бы из-под ног. Явное сравнение дороже, но откат срабатывает
    -- только когда полнотекст дал ноль, и всегда поверх остальных фильтров.
    v_parts := v_parts || format('%I.strict_word_similarity(%L, l.title) >= 0.5', v_trgm, p_query);
  elsif p_mode <> 'none' then
    raise exception 'неизвестный режим текстового поиска: %', p_mode using errcode = '22023';
  end if;

  return array_to_string(v_parts, ' and ');
end;
$bsw$;

comment on function public.bazar_search_where(text, text, text, text, numeric, numeric,
                                              item_condition, seller_kind, boolean, jsonb, text, text) is
  'Собирает условие WHERE для поиска (алиасы l = listings, p = profiles). Общая семантика фильтров для rpc_search_listings и rpc_attr_counts.';


-- ----------------------------------------------------------------------------
-- 3. rpc_search_listings — лента и поиск
-- ----------------------------------------------------------------------------
drop function if exists public.rpc_search_listings(
  text, text, text, text, numeric, numeric, item_condition, seller_kind,
  boolean, jsonb, text, text, text, int);

create function public.rpc_search_listings(
  p_query        text default null,
  p_category     text default null,
  p_subcategory  text default null,
  p_city         text default null,
  p_price_min    numeric default null,
  p_price_max    numeric default null,
  p_condition    item_condition default null,
  p_seller_kind  seller_kind default null,
  p_delivery     boolean default null,
  p_attrs        jsonb default '{}'::jsonb,
  p_period       text default null,
  p_sort         text default 'date',
  p_cursor       text default null,
  p_limit        int default 24
)
returns table (
  -- Колонки public_listings, кроме search_vector: тащить tsvector на телефон
  -- незачем, он весит больше самого объявления. floor не отдаётся никогда —
  -- только признак has_floor, как требует контракт.
  id            uuid,
  owner_id      uuid,
  title         text,
  description   text,
  price         numeric,
  negotiable    boolean,
  has_floor     boolean,
  category      text,
  subcategory   text,
  city          text,
  district      text,
  condition     item_condition,
  photos        text[],
  attrs         jsonb,
  status        listing_status,
  views_count   int,
  report_count  int,
  created_at    timestamptz,
  updated_at    timestamptz,
  bumped_at     timestamptz,
  expires_at    timestamptz,
  sold_at       timestamptz,
  relevance     real,
  next_cursor   text,
  total_count   bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $rsl$
declare
  -- Точный count по всей выдаче — это второй проход по таблице ради числа,
  -- которое человек всё равно читает как «много». Компромисс: считаем до
  -- потолка. Ниже потолка число точное, выше — вернём сам потолок, и клиент
  -- показывает «20 000+». 20 000 выбрано так, чтобы весь текущий каталог
  -- (6030 объявлений) считался точно, а патологическая выдача не съедала
  -- таблицу целиком.
  c_count_cap constant int := 20000;

  v_limit   int;
  v_sort    text;
  v_mode    text := 'none';
  v_trgm    text := public.bazar_trgm_schema();
  v_q       text;
  v_tsq     tsquery;
  v_rank    text;
  v_where   text;
  v_keyset  text := 'true';
  v_sk      text;
  v_order   text;
  v_curexpr text;
  v_total   text;
  v_cur     jsonb;
  v_exists  boolean;
  v_sql     text;
begin
  -- Гостю поиск обязан работать: auth.uid() здесь не вызывается вообще.
  -- Выдача одинакова для всех, персонализация (избранное, свои объявления,
  -- скрытые жалобщиком) живёт в других запросах и не смешивается с поиском.

  if p_attrs is not null and jsonb_typeof(p_attrs) <> 'object' then
    raise exception 'p_attrs должен быть объектом' using errcode = '22023';
  end if;

  -- Потолок страницы: без него один вызов с p_limit = 10^6 выгребает базу.
  v_limit := least(greatest(coalesce(p_limit, 24), 1), 100);

  -- 'cheap'/'expensive'/'popular' — имена сортировок нынешнего клиента
  -- (js/app.js). Принимаем как синонимы, чтобы включение серверного поиска не
  -- требовало одновременной правки фронта. Неизвестную сортировку не глотаем:
  -- молчаливый откат на 'date' — это выдача, отсортированная не так, как
  -- показывает интерфейс, и ищут такое потом неделю.
  v_sort := lower(coalesce(nullif(btrim(p_sort), ''), 'date'));
  v_sort := case v_sort
              when 'cheap'     then 'price_asc'
              when 'expensive' then 'price_desc'
              else v_sort
            end;
  if v_sort not in ('date', 'price_asc', 'price_desc', 'relevance', 'popular') then
    raise exception 'неизвестная сортировка: %', p_sort using errcode = '22023';
  end if;

  v_q := nullif(btrim(coalesce(p_query, '')), '');
  if v_q is not null then
    v_tsq := websearch_to_tsquery('russian', v_q);
    if numnode(v_tsq) > 0 then
      v_mode := 'fts';
    else
      -- Запрос состоит из одних стоп-слов или знаков препинания: полнотекст
      -- по нему не построить. Пробуем триграммы, а без pg_trgm — показываем
      -- выдачу по остальным фильтрам, а не пустой экран.
      v_mode := case when v_trgm is null then 'none' else 'trgm' end;
    end if;
  end if;

  -- Сортировка по релевантности без запроса вырождается в случайный порядок.
  if v_sort = 'relevance' and v_mode = 'none' then
    v_sort := 'date';
  end if;

  if p_cursor is not null and btrim(p_cursor) <> '' then
    v_cur := public.bazar_cursor_decode(p_cursor);
    -- Курсор привязан к сортировке и к режиму текстового поиска. Если клиент
    -- сменил сортировку и оставил старый курсор, страницы просто не стыкуются:
    -- лучше внятная ошибка, чем молча перемешанная выдача.
    if (v_cur ->> 's') is distinct from v_sort then
      raise exception 'курсор относится к другой сортировке, начните выдачу заново'
        using errcode = '22023';
    end if;
    if (v_cur ->> 'm') is distinct from v_mode and coalesce(v_cur ->> 'm', 'none') <> v_mode then
      -- Режим фиксируем курсором: иначе вторая страница могла бы «сама»
      -- переехать с полнотекста на триграммы и показать другой набор.
      v_mode := v_cur ->> 'm';
    end if;
    if (v_cur ->> 'i') is null then
      raise exception 'битый курсор поиска' using errcode = '22023';
    end if;
  elsif v_mode = 'fts' and v_trgm is not null then
    -- Мягкий откат ищем ровно один раз — на первой странице. exists()
    -- останавливается на первой же строке, полного прохода нет.
    v_where := public.bazar_search_where(v_q, public.bazar_nz(p_category),
                 public.bazar_nz(p_subcategory), public.bazar_nz(p_city),
                 p_price_min, p_price_max, p_condition, p_seller_kind, p_delivery,
                 p_attrs, p_period, 'fts');
    execute 'select exists (select 1 from public.listings l'
         || ' left join public.profiles p on p.id = l.owner_id where ' || v_where || ')'
      into v_exists;
    if not v_exists then
      v_mode := 'trgm';
    end if;
  end if;

  v_where := public.bazar_search_where(v_q, public.bazar_nz(p_category),
               public.bazar_nz(p_subcategory), public.bazar_nz(p_city),
               p_price_min, p_price_max, p_condition, p_seller_kind, p_delivery,
               p_attrs, p_period, v_mode);

  -- Выражение релевантности. Оно попадает и в select, и (для keyset по
  -- релевантности) в where — поэтому собирается один раз строкой.
  v_rank := case v_mode
              when 'fts'  then format('ts_rank(l.search_vector, websearch_to_tsquery(''russian'', %L))', v_q)
              when 'trgm' then format('%I.strict_word_similarity(%L, l.title)', v_trgm, v_q)
              else             '0'
            end;

  -- Ключи сортировки выносим в page под фиксированными именами sk_*, чтобы
  -- и order by, и keyset, и курсор говорили об одном и том же.
  -- Все значения в курсоре — текст: float4 и numeric так переживают
  -- round-trip без потери разряда, а jsonb-число могло бы её дать.
  case v_sort
    when 'date' then
      v_sk    := 'l.bumped_at as sk_ts, null::numeric as sk_num, l.id as sk_id';
      v_order := 'sk_ts desc, sk_id desc';
      v_curexpr := format(
        'jsonb_build_object(''s'', %L, ''m'', %L, ''b'','
        || ' to_char(l.bumped_at at time zone ''UTC'', ''YYYY-MM-DD HH24:MI:SS.US''), ''i'', l.id)',
        v_sort, v_mode);
    when 'price_asc' then
      v_sk    := 'null::timestamptz as sk_ts, nullif(l.price, 0) as sk_num, l.id as sk_id';
      v_order := 'sk_num asc nulls last, sk_id asc';
      v_curexpr := format(
        'jsonb_build_object(''s'', %L, ''m'', %L, ''n'', nullif(l.price, 0)::text, ''i'', l.id)',
        v_sort, v_mode);
    when 'price_desc' then
      v_sk    := 'null::timestamptz as sk_ts, nullif(l.price, 0) as sk_num, l.id as sk_id';
      v_order := 'sk_num desc nulls last, sk_id asc';
      v_curexpr := format(
        'jsonb_build_object(''s'', %L, ''m'', %L, ''n'', nullif(l.price, 0)::text, ''i'', l.id)',
        v_sort, v_mode);
    when 'popular' then
      v_sk    := 'null::timestamptz as sk_ts, l.views_count::numeric as sk_num, l.id as sk_id';
      v_order := 'sk_num desc, sk_id desc';
      v_curexpr := format(
        'jsonb_build_object(''s'', %L, ''m'', %L, ''n'', l.views_count::text, ''i'', l.id)',
        v_sort, v_mode);
    else -- relevance
      v_sk    := 'l.bumped_at as sk_ts, null::numeric as sk_num, l.id as sk_id';
      v_order := 'relevance desc, sk_ts desc, sk_id desc';
      v_curexpr := format(
        'jsonb_build_object(''s'', %L, ''m'', %L, ''r'', (%s)::real::text, ''b'','
        || ' to_char(l.bumped_at at time zone ''UTC'', ''YYYY-MM-DD HH24:MI:SS.US''), ''i'', l.id)',
        v_sort, v_mode, v_rank);
  end case;

  -- Keyset вместо offset. offset на большой таблице заставляет базу
  -- пересчитать и выбросить все предыдущие страницы, а при вставке между
  -- запросами страницы начинают перекрываться — человек видит один и тот же
  -- товар дважды. Сравнение по кортежу от этого свободно.
  if v_cur is not null then
    case v_sort
      when 'date' then
        v_keyset := format('(l.bumped_at, l.id) < (%L::timestamptz, %L::uuid)',
                           (v_cur ->> 'b') || '+00', v_cur ->> 'i');
      when 'price_asc' then
        -- nulls last руками: сравнение кортежей с NULL даёт NULL, а не «дальше».
        v_keyset := case
          when (v_cur ->> 'n') is null
            then format('(nullif(l.price, 0) is null and l.id > %L::uuid)', v_cur ->> 'i')
          else format('(nullif(l.price, 0) > %L::numeric or nullif(l.price, 0) is null'
                      || ' or (nullif(l.price, 0) = %L::numeric and l.id > %L::uuid))',
                      v_cur ->> 'n', v_cur ->> 'n', v_cur ->> 'i')
        end;
      when 'price_desc' then
        v_keyset := case
          when (v_cur ->> 'n') is null
            then format('(nullif(l.price, 0) is null and l.id > %L::uuid)', v_cur ->> 'i')
          else format('(nullif(l.price, 0) < %L::numeric or nullif(l.price, 0) is null'
                      || ' or (nullif(l.price, 0) = %L::numeric and l.id > %L::uuid))',
                      v_cur ->> 'n', v_cur ->> 'n', v_cur ->> 'i')
        end;
      when 'popular' then
        v_keyset := format('(l.views_count, l.id) < (%L::int, %L::uuid)',
                           v_cur ->> 'n', v_cur ->> 'i');
      else -- relevance
        v_keyset := format('((%s)::real, l.bumped_at, l.id) < (%L::real, %L::timestamptz, %L::uuid)',
                           v_rank, v_cur ->> 'r', (v_cur ->> 'b') || '+00', v_cur ->> 'i');
    end case;
  end if;

  -- Общее число считаем только на первой странице: на второй и дальше клиент
  -- его уже знает, а повторный счёт удваивал бы стоимость каждой страницы.
  -- NULL в total_count = «спроси на первой странице», не «ноль».
  v_total := case
               when v_cur is null then format(
                 '(select count(*) from (select 1 from public.listings l'
                 || ' left join public.profiles p on p.id = l.owner_id'
                 || ' where %s limit %s) z)::bigint', v_where, c_count_cap)
               else 'null::bigint'
             end;

  -- Берём на одну строку больше, чем нужно: наличие «лишней» строки — это и
  -- есть ответ на вопрос «есть ли следующая страница». Без этого на последней
  -- странице пришлось бы отдавать курсор в никуда.
  v_sql := format($q$
    with page as (
      select l.id, l.owner_id, l.title, l.description, l.price, l.negotiable,
             (l.floor is not null) as has_floor,
             l.category, l.subcategory, l.city, l.district, l.condition,
             l.photos, l.attrs, l.status, l.views_count, l.report_count,
             l.created_at, l.updated_at, l.bumped_at, l.expires_at, l.sold_at,
             (%s)::real as relevance,
             public.bazar_cursor_encode(%s) as cur,
             %s
      from public.listings l
      left join public.profiles p on p.id = l.owner_id
      where %s and %s
      order by %s
      limit %s
    )
    select page.id, page.owner_id, page.title, page.description, page.price,
           page.negotiable, page.has_floor, page.category, page.subcategory,
           page.city, page.district, page.condition, page.photos, page.attrs,
           page.status, page.views_count, page.report_count,
           page.created_at, page.updated_at, page.bumped_at, page.expires_at,
           page.sold_at, page.relevance,
           case when (select count(*) from page) > %s
                then (select p2.cur from page p2 order by %s offset %s limit 1)
           end as next_cursor,
           %s as total_count
    from page
    order by %s
    limit %s
  $q$,
    v_rank, v_curexpr, v_sk, v_where, v_keyset, v_order, v_limit + 1,
    v_limit, v_order, v_limit - 1, v_total, v_order, v_limit);

  return query execute v_sql;
end;
$rsl$;

comment on function public.rpc_search_listings(text, text, text, text, numeric, numeric,
                                               item_condition, seller_kind, boolean, jsonb,
                                               text, text, text, int) is
  'Поиск и лента объявлений: полнотекст (russian, websearch) с откатом на триграммы, фильтры, keyset-пагинация. Работает для гостя. next_cursor и total_count продублированы в каждой строке; total_count не NULL только на первой странице.';


-- ----------------------------------------------------------------------------
-- 4. rpc_attr_counts — счётчики значений характеристик
--
-- Сейчас это делает браузер: attrCountsFor в js/app.js гоняет полный проход по
-- 6030 объявлениям на каждое открытие панели фильтров и на каждый тап.
--
-- Два правила, без которых счётчики бесполезны (оба — из attrCountsFor):
--   1. счётчик КЛЮЧА считается на выборке БЕЗ фильтра по этому же ключу.
--      Иначе после выбора «Toyota» у всех остальных марок будет ноль, они
--      погаснут, и сменить марку станет нечем;
--   2. зависимые ключи снимаются вместе с родителем: выбрав модель, надо
--      снять и модель, и поколение, считая марки — иначе залипает так же.
-- ----------------------------------------------------------------------------
drop function if exists public.rpc_attr_counts(text, text, jsonb);

create function public.rpc_attr_counts(
  p_category    text default null,
  p_subcategory text default null,
  p_filters     jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $rac$
declare
  -- Дерево зависимостей характеристик. Обязано совпадать с ATTR_DEPENDENTS
  -- в js/app.js — это одно и то же продуктовое правило «модель осмысленна
  -- только внутри марки».
  c_dependents constant jsonb := '{"brand": ["model", "gen"], "model": ["gen"]}'::jsonb;
  -- Потолок на число значений одного ключа: в <select> с 82 марками человек
  -- и так не смотрит дальше первых, а отдавать хвост из тысячи значений с
  -- единицей у каждого — это мегабайты трафика на подсказку.
  c_max_values constant int := 200;
  -- В attrs может лежать служебный признак доставки — он не характеристика
  -- и в панели фильтров отдельным списком не нужен.
  c_skip_keys  constant text[] := array['delivery'];

  v_f       jsonb := coalesce(p_filters, '{}'::jsonb);
  v_cat     text  := public.bazar_nz(p_category);
  v_sub     text  := public.bazar_nz(p_subcategory);
  v_q       text;
  v_city    text;
  v_pmin    numeric;
  v_pmax    numeric;
  v_cond    item_condition;
  v_kind    seller_kind;
  v_deliv   boolean;
  v_period  text;
  v_attrs   jsonb;
  v_keys    text[];
  v_mode    text := 'none';
  v_trgm    text := public.bazar_trgm_schema();
  v_tsq     tsquery;
  v_where   text;
  v_attrs_g jsonb;
  v_out     jsonb := '{}'::jsonb;
  v_base    jsonb;
  v_part    jsonb;
  v_exists  boolean;
  v_tmp     text;
  r         record;
begin
  if jsonb_typeof(v_f) <> 'object' then
    raise exception 'p_filters должен быть объектом' using errcode = '22023';
  end if;

  -- Разбор объекта фильтров клиента. Имена — как в state.filters (js/app.js);
  -- параллельно принимаем snake_case, чтобы новый клиент мог слать имена из
  -- контракта и не изобретать переходник.
  v_q     := public.bazar_nz(v_f ->> 'q');
  v_city  := public.bazar_nz(v_f ->> 'city');
  v_pmin  := coalesce(public.bazar_attr_num(v_f, 'priceMin'), public.bazar_attr_num(v_f, 'price_min'));
  v_pmax  := coalesce(public.bazar_attr_num(v_f, 'priceMax'), public.bazar_attr_num(v_f, 'price_max'));
  v_period := public.bazar_nz(v_f ->> 'period');

  -- Enum-значения проверяем списком, а не приведением: неизвестная строка от
  -- клиента должна давать понятный отказ, а не 22P02 из недр приведения типа.
  v_tmp := public.bazar_nz(v_f ->> 'condition');
  if v_tmp is not null then
    if v_tmp not in ('new', 'used') then
      raise exception 'неизвестное состояние: %', v_tmp using errcode = '22023';
    end if;
    v_cond := v_tmp::item_condition;
  end if;

  v_tmp := public.bazar_nz(coalesce(v_f ->> 'sellerType', v_f ->> 'seller_kind'));
  if v_tmp is not null then
    if v_tmp not in ('private', 'business') then
      raise exception 'неизвестный тип продавца: %', v_tmp using errcode = '22023';
    end if;
    v_kind := v_tmp::seller_kind;
  end if;

  -- Клиент шлёт delivery либо булевым, либо строкой из URL-параметров.
  if v_f ? 'delivery' and jsonb_typeof(v_f -> 'delivery') <> 'null' then
    v_deliv := case
                 when jsonb_typeof(v_f -> 'delivery') = 'boolean' then (v_f ->> 'delivery')::boolean
                 when lower(v_f ->> 'delivery') in ('true', '1')  then true
                 when lower(v_f ->> 'delivery') in ('false', '0', '') then false
               end;
  end if;

  v_attrs := case when jsonb_typeof(v_f -> 'attrs') = 'object' then v_f -> 'attrs' else '{}'::jsonb end;

  if jsonb_typeof(v_f -> 'keys') = 'array' then
    select array_agg(x #>> '{}')
      into v_keys
      from jsonb_array_elements(v_f -> 'keys') as x
     where nullif(btrim(x #>> '{}'), '') is not null;
  end if;

  -- Режим текстового поиска считаем ровно так же, как rpc_search_listings, и
  -- ОДИН раз на весь вызов: счётчики обязаны описывать ту же выдачу, которую
  -- человек видит рядом. Пересчёт режима на каждой группе ключей мог бы дать
  -- полнотекст в одном списке и триграммы в другом.
  if v_q is not null then
    v_tsq := websearch_to_tsquery('russian', v_q);
    v_mode := case when numnode(v_tsq) > 0 then 'fts'
                   when v_trgm is null then 'none'
                   else 'trgm' end;
    if v_mode = 'fts' and v_trgm is not null then
      v_where := public.bazar_search_where(v_q, v_cat, v_sub, v_city, v_pmin, v_pmax,
                                           v_cond, v_kind, v_deliv, v_attrs, v_period, 'fts');
      execute 'select exists (select 1 from public.listings l'
           || ' left join public.profiles p on p.id = l.owner_id where ' || v_where || ')'
        into v_exists;
      if not v_exists then
        v_mode := 'trgm';
      end if;
    end if;
  end if;

  -- Клиент может не присылать список ключей (он знает его из ATTR_SCHEMA, но
  -- новый клиент может и не знать). Тогда выясняем ключи по самим данным —
  -- по категории и подкатегории, без учёта прочих фильтров: иначе набор
  -- списков в панели прыгал бы от одного тапа к другому.
  if v_keys is null or cardinality(v_keys) = 0 then
    v_where := public.bazar_search_where(null, v_cat, v_sub, null, null, null,
                                         null, null, null, '{}'::jsonb, null, 'none');
    execute format($q$
      select array_agg(k)
      from (
        select a.key as k, count(*) as n
        from public.listings l
        left join public.profiles p on p.id = l.owner_id
        cross join lateral jsonb_each_text(l.attrs) as a(key, value)
        where %s and btrim(a.value) <> '' and not (a.key = any (%L::text[]))
        group by 1
        order by n desc
        limit 50
      ) d
    $q$, v_where, c_skip_keys)
      into v_keys;
  end if;

  if v_keys is null or cardinality(v_keys) = 0 then
    return '{}'::jsonb;
  end if;

  -- Ключи с одинаковым набором «что снять» считаются на ОДНОЙ выборке: марка,
  -- модель и поколение зависят друг от друга, а цвет и коробка — нет, значит
  -- проходов будет два-три, а не по одному на каждое поле.
  for r in
    with k as (
      select distinct unnest(v_keys) as key
    ),
    g as (
      select k.key,
             (array[k.key, k.key || 'Min', k.key || 'Max']
              || coalesce((select array_agg(d #>> '{}')
                           from jsonb_array_elements(c_dependents -> k.key) as d),
                          array[]::text[])) as drop_set
      from k
    )
    select array_agg(g.key order by g.key) as keys, g.drop_set
    from g
    group by g.drop_set
  loop
    v_attrs_g := (
      select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
      from jsonb_each(v_attrs) as e(key, value)
      where not (e.key = any (r.drop_set))
    );

    v_where := public.bazar_search_where(v_q, v_cat, v_sub, v_city, v_pmin, v_pmax,
                                         v_cond, v_kind, v_deliv, v_attrs_g, v_period, v_mode);

    execute format($q$
      select coalesce(jsonb_object_agg(g.k, g.vals), '{}'::jsonb)
      from (
        select t.k, jsonb_object_agg(t.v, t.n) as vals
        from (
          select c.k, c.v, c.n,
                 row_number() over (partition by c.k order by c.n desc, c.v) as rn
          from (
            select a.key as k, a.value as v, count(*) as n
            from public.listings l
            left join public.profiles p on p.id = l.owner_id
            cross join lateral jsonb_each_text(l.attrs) as a(key, value)
            where %s and a.key = any (%L::text[]) and btrim(a.value) <> ''
            group by 1, 2
          ) c
        ) t
        where t.rn <= %s
        group by t.k
      ) g
    $q$, v_where, r.keys, c_max_values)
      into v_part;

    v_out := v_out || coalesce(v_part, '{}'::jsonb);
  end loop;

  -- Ключ, по которому в выборке нет ни одного значения, должен вернуться
  -- пустым объектом, а не пропасть: пропажу клиент трактует как «счётчиков
  -- нет, оставить подписи как есть» и показывает числа от прошлой выборки.
  select coalesce(jsonb_object_agg(k, '{}'::jsonb), '{}'::jsonb)
    into v_base
    from unnest(v_keys) as k;

  return v_base || v_out;
end;
$rac$;

comment on function public.rpc_attr_counts(text, text, jsonb) is
  'Сколько объявлений даст каждое значение характеристики при текущих фильтрах: {"brand": {"Toyota": 128}, ...}. Счётчик ключа считается без фильтра по этому же ключу и без зависимых от него.';


-- ----------------------------------------------------------------------------
-- 5. Права
--
-- Хелперы — внутренняя кухня: bazar_search_where отдаёт кусок SQL, и снаружи
-- он никому не нужен. Обеим RPC явно открываем доступ гостю: поиск обязан
-- работать до логина.
-- ----------------------------------------------------------------------------
do $grants$
declare
  v_fn text;
begin
  foreach v_fn in array array[
    'public.bazar_attr_num(jsonb, text)',
    'public.bazar_nz(text)',
    'public.bazar_attrs_exact(jsonb)',
    'public.bazar_attrs_ranges(jsonb)',
    'public.bazar_cursor_encode(jsonb)',
    'public.bazar_cursor_decode(text)',
    'public.bazar_trgm_schema()',
    'public.bazar_search_where(text, text, text, text, numeric, numeric,'
      || ' item_condition, seller_kind, boolean, jsonb, text, text)',
    'public.rpc_search_listings(text, text, text, text, numeric, numeric,'
      || ' item_condition, seller_kind, boolean, jsonb, text, text, text, int)',
    'public.rpc_attr_counts(text, text, jsonb)'
  ]
  loop
    execute format('revoke all on function %s from public', v_fn);
  end loop;

  -- Ролей Supabase на голом Postgres нет — миграция не обязана из-за этого
  -- падать (локальная проверка схемы должна проходить где угодно).
  foreach v_fn in array array[
    'public.rpc_search_listings(text, text, text, text, numeric, numeric,'
      || ' item_condition, seller_kind, boolean, jsonb, text, text, text, int)',
    'public.rpc_attr_counts(text, text, jsonb)'
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
