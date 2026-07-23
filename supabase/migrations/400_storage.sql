-- ============================================================
-- BAZAR · 400 · хранилище фотографий объявлений
--
-- Раньше фото лежали base64 прямо в колонке listings.photos: одно объявление
-- с тремя снимками ≈ 300 КБ в одной строке Postgres, база пухла на пустом
-- месте. Теперь снимки живут в бакете, а в колонке — только пути к ним.
--
-- Путь строго `{owner_id}/{listing_id}/{файл}`. Первый сегмент = владелец;
-- политики ниже сверяют его с auth.uid(), поэтому залить файл в чужую папку
-- нельзя, как бы клиент ни подделывал путь.
-- ============================================================

-- ------------------------------------------------------------
-- Бакет
-- ------------------------------------------------------------
-- Публичный на ЧТЕНИЕ (карточки показываются всем, в т.ч. гостям), но запись
-- закрыта политиками. public=true снимает только барьер на select объектов;
-- на insert/update/delete всё равно действуют политики storage.objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos', 'listing-photos', true,
  5 * 1024 * 1024,                                  -- 5 МБ на файл
  array['image/jpeg', 'image/png', 'image/webp']    -- только картинки
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------
-- Политики доступа к объектам бакета
-- ------------------------------------------------------------
-- storage.objects общая для всех бакетов, поэтому каждая политика начинается
-- с bucket_id = 'listing-photos' — иначе правило растечётся на чужие бакеты.
--
-- Ключ проверки владельца: (storage.foldername(name))[1] — первый сегмент
-- пути. Он обязан равняться auth.uid()::text. storage.foldername возвращает
-- массив сегментов пути без имени файла; [1] — папка верхнего уровня.

-- читать может кто угодно (бакет публичный, но пусть будет и явное правило)
drop policy if exists "listing_photos_read" on storage.objects;
create policy "listing_photos_read" on storage.objects
  for select
  using (bucket_id = 'listing-photos');

-- загрузка: только залогиненный и только в свою папку
drop policy if exists "listing_photos_insert_own" on storage.objects;
create policy "listing_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- замена файла: тоже только в своей папке (upsert, поворот фото)
drop policy if exists "listing_photos_update_own" on storage.objects;
create policy "listing_photos_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- удаление: только своё (при удалении объявления или замене снимков)
drop policy if exists "listing_photos_delete_own" on storage.objects;
create policy "listing_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
