-- ============================================================
-- BAZAR · 110 · перечислимые типы
--
-- Набор и порядок меток зафиксированы контрактом схемы, менять нельзя:
-- на них завязаны колонки listings, offers, reports, notifications и
-- сигнатуры RPC (rpc_search_listings принимает item_condition и
-- seller_kind как типы, а не как text).
-- ============================================================

-- `create type if not exists` в PostgreSQL не существует, поэтому
-- идемпотентность даёт do-блок с перехватом duplicate_object.
--
-- Обработчик делает на один шаг больше, чем просто «молча пропустить»:
-- если тип уже есть, но в нём не хватает меток (боевая база, где тип
-- заводили руками и раньше), недостающие дотягиваются. Молчаливый
-- пропуск в этом случае оставил бы схему рабочей на вид, а падало бы
-- потом и в соседнем файле — на вставке значения, которого в типе нет.
--
-- ВАЖНО про ADD VALUE: PostgreSQL запрещает использовать метку,
-- добавленную в существующий тип, в той же транзакции. Для нормального
-- сценария (тип создаётся здесь же) ограничение не действует, но если
-- обработчик реально дотянул метку, миграции, которые эту метку
-- вставляют, должны идти отдельной транзакцией. На практике это ветка
-- «чинили руками» — прогон с нуля её не задевает.
do $$
declare
  r       record;
  v_label text;
begin
  for r in
    select *
      from (values
        ('listing_status', array['draft', 'active', 'sold', 'archived', 'blocked']),
        ('item_condition', array['new', 'used']),
        ('seller_kind',    array['private', 'business']),
        ('offer_status',   array['pending', 'accepted', 'rejected', 'countered', 'withdrawn']),
        ('report_reason',  array['scam', 'sold', 'wrong', 'prohibited', 'duplicate', 'offensive']),
        ('moderation_act', array['auto_hidden', 'restored', 'blocked', 'cleared']),
        ('notify_kind',    array['message', 'offer', 'price_drop', 'saved_search', 'moderation'])
      ) as t(type_name, labels)
  loop
    begin
      execute format(
        'create type public.%I as enum (%s)',
        r.type_name,
        (select string_agg(quote_literal(l.label), ', ' order by l.ord)
           from unnest(r.labels) with ordinality as l(label, ord)));
    exception when duplicate_object then
      foreach v_label in array r.labels loop
        execute format('alter type public.%I add value if not exists %L', r.type_name, v_label);
      end loop;
    end;
  end loop;
end;
$$;

comment on type public.listing_status is
  'Состояние объявления. draft — черновик, active — в ленте, sold — продано, archived — снято владельцем, blocked — скрыто модерацией.';
comment on type public.item_condition is
  'Состояние товара: новый / бывший в употреблении. NULL допустим — для услуг, работы и недвижимости поле бессмысленно.';
comment on type public.seller_kind is
  'Тип продавца: частное лицо или бизнес. Значение фильтра в ленте.';
comment on type public.offer_status is
  'Состояние торга. countered — продавец ответил встречной ценой, withdrawn — покупатель отозвал предложение.';
comment on type public.report_reason is
  'Причина жалобы на объявление: мошенничество, уже продано, неверная категория, запрещённый товар, дубль, оскорбление.';
comment on type public.moderation_act is
  'Запись в журнале модерации. auto_hidden — скрыто автоматом по порогу жалоб, cleared — жалобы признаны необоснованными.';
comment on type public.notify_kind is
  'Повод уведомления: сообщение, предложение цены, падение цены в избранном, попадание в сохранённый поиск, действие модерации.';
