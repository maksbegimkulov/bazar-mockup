-- ============================================================================
-- 890_realtime.sql — публикация для Supabase Realtime
--
-- Клиент подписывается на listings (лента обновляется у всех, включая гостей),
-- chats и messages (переписка «на глазах») и notifications. Без записи таблицы
-- в публикацию supabase_realtime события до WebSocket просто не доезжают.
--
-- Главная засада: в облаке часть таблиц в публикацию уже добавлена, а
-- `alter publication ... add table` на повторе падает с 42710. Отсюда цикл с
-- проверкой pg_publication_tables вместо четырёх прямых alter'ов.
-- ============================================================================

do $$
declare
  v_table text;
begin
  -- На чистой базе публикации может не быть вовсе (её заводит платформа
  -- Supabase). Создаём пустой — таблицы добавит цикл ниже.
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach v_table in array array['listings', 'chats', 'messages', 'notifications']
  loop
    if exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = v_table
    ) then
      continue;
    end if;

    execute format('alter publication supabase_realtime add table public.%I', v_table);
  end loop;
end $$;

-- REPLICA IDENTITY намеренно оставлена по умолчанию (первичный ключ).
-- Realtime проверяет RLS подписчика по содержимому WAL-записи; для INSERT и
-- UPDATE там лежит полная новая строка, а именно их и слушает клиент
-- (js/auth.js: dbSubscribeMessages, dbSubscribeMyChats, dbSubscribeListings).
-- `replica identity full` понадобилась бы только ради DELETE-событий и ради
-- фильтров по старым значениям, но она удваивает объём WAL на каждой правке —
-- цена, которую нечем оправдать: в BAZAR удаляют объявления, а не переписку.
