-- ============================================================
-- BAZAR · 310 · public_listings — публичное лицо объявления
--
-- Единственный способ прочитать чужое объявление. Прямой select таблицы
-- listings закрыт политикой listings_select_own (300): человек видит в самой
-- таблице только свои строки. Всё остальное идёт сюда.
--
-- Зачем вью, а не открытая политика на чтение: колонку floor (скрытая
-- минимальная цена продавца) нельзя отдавать покупателю. RLS отсекает строки,
-- но не колонки — а во вью колонки floor просто нет. Что не выбрано, то не
-- утечёт ни через select('*'), ни через адресный select('floor').
--
-- Модель безопасности (важно, легко сделать наоборот и всё сломать):
-- вью НАМЕРЕННО security definer (security_invoker = false). Политика
-- listings_select_own отдаёт из таблицы только СВОИ строки — если бы вью
-- исполнялась с правами вызывающего (invoker), покупатель видел бы через неё
-- ноль чужих объявлений, и витрина была бы пустой. Здесь всё наоборот, чем
-- в обычном правиле «не обходи RLS»: скрытие обеспечивают ПРОЕКЦИЯ (колонки
-- floor во вью нет вовсе) и фильтр status='active', а не построчная политика.
-- Прямой select таблицы по-прежнему закрыт — floor не достать ни через вью
-- (нет колонки), ни через таблицу (RLS отдаёт только своё).
-- ============================================================

drop view if exists public.public_listings;

create view public.public_listings
with (security_invoker = false)
as
select
  l.id,
  l.owner_id,
  l.title,
  l.description,
  l.price,
  l.negotiable,
  -- покупателю нужен только факт «торг уместен», а не само значение
  (l.floor is not null) as has_floor,
  l.category,
  l.subcategory,
  l.city,
  l.district,
  l.condition,
  l.photos,
  l.attrs,
  l.status,
  l.views_count,
  l.report_count,
  l.created_at,
  l.updated_at,
  l.bumped_at,
  l.expires_at,
  l.sold_at,
  coalesce(l.is_test_data, false) as is_test_data
from public.listings l
-- витрина = только то, что реально можно купить прямо сейчас: активные и
-- непросроченные. Черновики, проданное, архив и заблокированное сюда не
-- попадают. Владелец видит свои такие объявления через саму таблицу.
where l.status = 'active'
  and (l.expires_at is null or l.expires_at > now());

comment on view public.public_listings is
  'Публичное чтение объявлений. Без колонки floor (секрет продавца) — вместо неё has_floor. Только активные непросроченные. security_invoker, чтобы не обходить RLS.';

-- Гость — тоже покупатель: читать витрину должны и anon, и залогиненные.
grant select on public.public_listings to anon, authenticated, service_role;
