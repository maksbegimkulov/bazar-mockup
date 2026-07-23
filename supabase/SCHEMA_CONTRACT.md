# BAZAR — контракт схемы бэкенда

Это единственный источник правды по именам. Миграции пишутся разными людьми
и должны сойтись без правок, поэтому **имена таблиц, колонок, типов и функций
менять нельзя** — только реализовывать.

Диалект: PostgreSQL 15 (Supabase). Все объекты в схеме `public`, если не
сказано иное. Идентификаторы — `snake_case`, без кавычек, латиницей.

## Общие правила

1. **Каждая миграция идемпотентна**: `create ... if not exists`,
   `alter table ... add column if not exists`, `drop policy if exists` перед
   `create policy`. Файл должен переживать повторный прогон.
2. **RLS включён на КАЖДОЙ таблице** без исключений, даже на служебных.
   Таблица без политик = таблица, недоступная никому, кроме `service_role`;
   это осознанный дефолт.
3. **Никаких `security definer` без нужды.** Если функция всё же definer —
   первой строкой тела `set search_path = public, pg_temp` и явная проверка
   прав внутри. Definer-функция без проверки прав = дыра.
4. Внешние ключи на `auth.users(id)` всегда `on delete cascade`.
5. Денежные значения — `numeric(12,2)`, не `float`. Кыргызский сом, копеек нет,
   но масштаб оставляем.
6. Время — `timestamptz`, дефолт `now()`.
7. Комментарии к таблицам и неочевидным колонкам — обязательны
   (`comment on ...`), это единственная документация схемы.

## Перечислимые типы

```sql
listing_status : 'draft' | 'active' | 'sold' | 'archived' | 'blocked'
item_condition : 'new' | 'used'
seller_kind    : 'private' | 'business'
offer_status   : 'pending' | 'accepted' | 'rejected' | 'countered' | 'withdrawn'
report_reason  : 'scam' | 'sold' | 'wrong' | 'prohibited' | 'duplicate' | 'offensive'
moderation_act : 'auto_hidden' | 'restored' | 'blocked' | 'cleared'
notify_kind    : 'message' | 'offer' | 'price_drop' | 'saved_search' | 'moderation'
```

Создавать через `do $$ begin ... exception when duplicate_object then null; end $$;`
— `create type if not exists` в PostgreSQL нет.

## Справочники (нужны для серверной валидации)

```sql
categories(id text primary key, sort int not null default 0)
subcategories(id bigserial primary key,
              category_id text not null references categories(id) on delete cascade,
              name text not null,
              unique(category_id, name))
cities(name text primary key, sort int not null default 0)
```

10 категорий: electronics, transport, realty, fashion, home, services, jobs,
animals, kids, hobby. 41 подкатегория. 11 городов. Данные засеваются в
`900_seed_taxonomy.sql` — берутся из `js/data.js`, названия подкатегорий
русские и совпадают с клиентскими байт-в-байт (они же значения фильтра).

## profiles

Расширяет существующую таблицу (создаётся триггером на `auth.users`).

```
id uuid primary key references auth.users(id) on delete cascade
name text not null default ''            -- отображаемое имя
avatar_url text
phone text                                -- E.164, +996…
phone_verified boolean not null default false
city text references cities(name)
kind seller_kind not null default 'private'
bio text
rating numeric(3,2) not null default 0    -- пересчитывается триггером отзывов
reviews_count int not null default 0
ads_count int not null default 0          -- активные объявления, триггер
banned_until timestamptz                  -- NULL = не забанен
last_seen_at timestamptz
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

RLS: читают все (`using (true)`); правит только владелец
(`auth.uid() = id`). **Колонки `phone`, `banned_until` наружу не отдаём** —
публичное чтение идёт через вью `public_profiles` (см. ниже).

## listings

Расширяет существующую.

```
id uuid primary key default gen_random_uuid()
owner_id uuid not null references auth.users(id) on delete cascade
title text not null                       -- check: длина 3..120 после trim
description text not null default ''      -- check: длина <= 5000
price numeric(12,2) not null default 0    -- check: >= 0 and <= 1e10
negotiable boolean not null default false
floor numeric(12,2)                       -- СЕКРЕТ ПРОДАВЦА, см. ниже
category text not null references categories(id)
subcategory text not null
city text not null references cities(name)
district text
condition item_condition
photos text[] not null default '{}'       -- пути в Storage, НЕ base64
attrs jsonb not null default '{}'
status listing_status not null default 'active'
views_count int not null default 0
report_count int not null default 0
search_vector tsvector                    -- поддерживается триггером
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
bumped_at timestamptz not null default now()  -- сортировка ленты
expires_at timestamptz not null default now() + interval '60 days'
sold_at timestamptz
```

Ограничения:
- `check (category, subcategory)` существует в `subcategories` — через триггер
  (составной внешний ключ на текстовое имя неудобен, но проверка обязательна).
- `check (array_length(photos,1) is null or array_length(photos,1) <= 10)`
- `check (floor is null or (floor > 0 and floor <= price))`

Индексы (без них поиск по 6000+ строкам ляжет):
- `gin (search_vector)`
- `gin (title gin_trgm_ops)` — опечатки
- `btree (status, bumped_at desc)` — лента
- `btree (category, subcategory, status)`
- `btree (city, status)`
- `btree (price)` где `status = 'active'`
- `gin (attrs jsonb_path_ops)` — фильтры характеристик
- `btree (owner_id, created_at desc)`

### floor — секрет продавца

Сейчас `floor` уезжает на клиент через `select('*')`, и покупатель видит в
devtools минимальную цену продавца. Торг из-за этого бессмысленен.

В новой схеме:
- прямой `select` таблицы `listings` **закрыт** для чтения чужих строк
  политикой, отдающей только свои;
- все читают вью `public_listings`, где колонки `floor` нет вовсе;
- предложение цены оценивает `rpc_make_offer` (security definer), floor из
  базы не выходит никогда.

## public_listings (вью)

`security_invoker = true`. Отдаёт все колонки `listings`, **кроме `floor`**,
плюс `has_floor boolean` (`floor is not null`) — клиенту нужно знать лишь
факт «торг уместен». Только строки со `status = 'active'` и непросроченные.

## public_profiles (вью)

`id, name, avatar_url, city, kind, bio, rating, reviews_count, ads_count,
created_at`. Без `phone` и `banned_until`.

## listing_photos — хранилище

Bucket `listing-photos`, публичное чтение, запись только владельцу.
Путь строго `{owner_id}/{listing_id}/{uuid}.jpg`. Политики Storage проверяют,
что первый сегмент пути равен `auth.uid()::text`. Ограничения бакета:
5 МБ на файл, только `image/jpeg`, `image/png`, `image/webp`.

В `listings.photos` лежат **пути внутри бакета**, не URL и не base64.

## favorites

```
user_id uuid references auth.users(id) on delete cascade
listing_id uuid references listings(id) on delete cascade
note text
folder text
price_at_add numeric(12,2)   -- чтобы показывать «цена упала на N»
created_at timestamptz default now()
primary key (user_id, listing_id)
```
RLS: только своё, во всех операциях.

## saved_searches

```
id uuid primary key default gen_random_uuid()
user_id uuid not null references auth.users(id) on delete cascade
name text not null
query jsonb not null            -- полный объект фильтров клиента
notify boolean not null default true
last_seen_at timestamptz not null default now()
created_at timestamptz default now()
```
RLS: только своё. Уникальность `(user_id, name)`.

## listing_views

```
listing_id uuid references listings(id) on delete cascade
viewer_id uuid references auth.users(id) on delete set null
viewer_fingerprint text          -- для гостей
viewed_at timestamptz default now()
```
Уникальность `(listing_id, coalesce(viewer_id::text, viewer_fingerprint), день)`
— чтобы счётчик не накручивался обновлением страницы. Триггер инкрементит
`listings.views_count`. RLS: вставлять может кто угодно (в т.ч. `anon`),
читать — только владелец объявления.

## reports

```
id uuid primary key default gen_random_uuid()
listing_id uuid not null references listings(id) on delete cascade
reporter_id uuid references auth.users(id) on delete set null
reason report_reason not null
comment text
created_at timestamptz default now()
unique (listing_id, reporter_id)   -- одна жалоба от человека
```
Триггер: инкрементит `listings.report_count`; при достижении **3** жалоб от
разных пользователей ставит `status = 'blocked'` и пишет в `moderation_log`.
RLS: вставляет любой залогиненный; читает только `service_role`.

## moderation_log

```
id bigserial primary key
listing_id uuid references listings(id) on delete cascade
act moderation_act not null
actor_id uuid references auth.users(id) on delete set null   -- NULL = автомат
note text
created_at timestamptz default now()
```
RLS: читает только `service_role`.

## reviews

```
id uuid primary key default gen_random_uuid()
seller_id uuid not null references auth.users(id) on delete cascade
author_id uuid not null references auth.users(id) on delete cascade
listing_id uuid references listings(id) on delete set null
rating int not null check (rating between 1 and 5)
text text
created_at timestamptz default now()
unique (author_id, listing_id)
check (author_id <> seller_id)
```
Триггер пересчитывает `profiles.rating` и `profiles.reviews_count`.
RLS: читают все; пишет залогиненный от своего имени; правит/удаляет автор.

## offers (торг)

```
id uuid primary key default gen_random_uuid()
listing_id uuid not null references listings(id) on delete cascade
buyer_id uuid not null references auth.users(id) on delete cascade
amount numeric(12,2) not null check (amount > 0)
status offer_status not null default 'pending'
counter_amount numeric(12,2)     -- встречное предложение продавца
attempt int not null default 1
created_at timestamptz default now()
```
RLS: видят покупатель и владелец объявления. **Оценку делает только
`rpc_make_offer`** — клиент не сравнивает цену сам.

## chats / messages

Расширяем существующие.

```
chats:    + last_message_at timestamptz, last_message_text text,
          + buyer_last_read_at timestamptz, seller_last_read_at timestamptz
messages: + read_at timestamptz
```
RLS: только участники (`buyer_id` или `seller_id`). Триггер на `messages`
обновляет `last_message_at` и `last_message_text` в чате.

## notifications

```
id uuid primary key default gen_random_uuid()
user_id uuid not null references auth.users(id) on delete cascade
kind notify_kind not null
title text not null
body text
link text                      -- hash-маршрут клиента, например '#/item/123'
read_at timestamptz
created_at timestamptz default now()
```
RLS: только своё.

## rate_limits

```
subject text not null          -- 'listing_insert' | 'message_send' | 'report' | 'offer'
actor uuid not null
window_start timestamptz not null
count int not null default 0
primary key (subject, actor, window_start)
```
Функция `check_rate_limit(subject text, max_per_hour int)` — окно в один час,
превышение → `raise exception` с понятным сообщением. Дёргается из триггеров
`before insert` на `listings`, `messages`, `reports`, `offers`.

Лимиты: объявления 10/час, сообщения 60/час, жалобы 20/час, предложения 30/час.

## Функции (RPC, вызываются клиентом)

```sql
-- Лента и поиск. Keyset-пагинация: курсор, НЕ offset.
rpc_search_listings(
  p_query text default null,
  p_category text default null,
  p_subcategory text default null,
  p_city text default null,
  p_price_min numeric default null,
  p_price_max numeric default null,
  p_condition item_condition default null,
  p_seller_kind seller_kind default null,
  p_delivery boolean default null,
  p_attrs jsonb default '{}',
  p_period text default null,          -- 'day' | 'week' | 'month' | null
  p_sort text default 'date',          -- 'date'|'price_asc'|'price_desc'|'relevance'
  p_cursor text default null,          -- непрозрачный курсор предыдущей страницы
  p_limit int default 24
) returns table(...)   -- строки public_listings + next_cursor + total_count

-- Счётчики для фильтров: сколько объявлений даст каждое значение атрибута
rpc_attr_counts(p_category text, p_subcategory text, p_filters jsonb)
  returns jsonb        -- { "brand": {"Toyota": 128, ...}, "model": {...} }

-- Торг. Floor не покидает сервер.
rpc_make_offer(p_listing_id uuid, p_amount numeric)
  returns jsonb        -- { status, counter_amount, attempts_left, gap_hint }

rpc_bump_listing(p_listing_id uuid)    -- поднять своё, не чаще раза в сутки
rpc_mark_sold(p_listing_id uuid, p_sold boolean)
rpc_track_view(p_listing_id uuid, p_fingerprint text)
rpc_unread_counts()  returns jsonb     -- { chats: N, notifications: M }
```

Все RPC — `security definer`, с `set search_path = public, pg_temp`, и каждая
**сама** проверяет `auth.uid()` там, где это нужно. Функции, доступные гостю
(`rpc_search_listings`, `rpc_track_view`), обязаны работать при `auth.uid() is null`.

## Порядок файлов

```
100_extensions.sql        расширения, общие триггерные функции
110_types.sql             перечислимые типы
120_taxonomy.sql          categories / subcategories / cities
200_profiles.sql          profiles + вью + триггеры
300_listings.sql          listings: колонки, ограничения, индексы, триггеры, RLS
310_listings_view.sql     public_listings
400_storage.sql           бакет и политики
500_search.sql            rpc_search_listings, rpc_attr_counts
600_personal.sql          favorites, saved_searches, listing_views
700_moderation.sql        reports, moderation_log
750_reviews.sql           reviews
800_offers.sql            offers + rpc_make_offer
850_chats.sql             chats/messages, непрочитанное
870_notifications.sql     notifications
880_rate_limits.sql       rate_limits + check_rate_limit + триггеры
890_realtime.sql          публикация realtime
900_seed_taxonomy.sql     наполнение справочников
```

Имя файла = `supabase/migrations/<номер>_<имя>.sql`. Нумерация оставляет зазоры
намеренно: между 300 и 400 можно вставить новое, не перенумеровывая всё.

## Дополнение: is_test_data

`listings.is_test_data boolean not null default false` — признак демо-строки
(файл `320_test_data.sql`). Витрину наполняют 6030 сгенерированных объявлений;
без флага их потом не отличить от настоящих. Чистка: `delete from listings
where is_test_data;`
