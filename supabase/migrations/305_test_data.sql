/* Пометка демо-данных.

   Витрину наполняют 6030 сгенерированных объявлений — без них сайт выглядит
   мёртвым, а серверный поиск нечем проверять. Но смешивать их с настоящими
   объявлениями без опознавательного знака нельзя: когда пойдут живые
   пользователи, демо надо будет убрать одной командой, не гадая, что чьё.

     delete from listings where is_test_data;
*/

alter table public.listings
  add column if not exists is_test_data boolean not null default false;

comment on column public.listings.is_test_data is
  'Сгенерированное демо-объявление. Настоящие объявления всегда false.';

/* Частичный индекс: нужен ровно один запрос — «покажи/удали демо».
   Полный индекс по булеву столбцу, где 99% строк одинаковы, бесполезен. */
create index if not exists listings_test_data_idx
  on public.listings (created_at desc) where is_test_data;
