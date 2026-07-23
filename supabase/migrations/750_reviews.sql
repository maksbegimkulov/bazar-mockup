/* 750_reviews.sql — отзывы о продавцах и честный пересчёт рейтинга в profiles.

   Рейтинг считается ПОЛНОСТЬЮ: avg() по всем отзывам продавца, а не
   «(старое_среднее * n + новая_оценка) / (n + 1)». Инкрементальное среднее
   выглядит дешевле, но разъезжается на первой же правке отзыва (была 5, стала
   1 — в среднее надо вычесть старое значение, которого у триггера уже нет) и
   на удалении. Отзывов у продавца десятки, avg() по индексу (seller_id) —
   микросекунды, экономить нечего, а расхождение рейтинга с отзывами под ним
   пользователь замечает сразу.

   Защита от накрутки, слоями:
     * check (author_id <> seller_id) — сам себе оценку не поставишь;
     * RLS insert разрешает вставку только от своего имени (author_id = auth.uid()),
       так что «отзыв от лица другого» невозможен;
     * unique (author_id, listing_id) — один отзыв на объявление от автора;
     * отдельно закрыт обход через listing_id = NULL (см. reviews_before_write);
     * объявление обязано принадлежать оцениваемому продавцу — иначе отзыв
       можно было бы прицепить к любому чужому объявлению и получить столько
       «уникальных» отзывов, сколько в базе объявлений;
     * автор/продавец/дата у существующего отзыва неизменяемы — иначе правкой
       одной строки можно было бы перегонять оценку между продавцами.

   Чего эта схема НЕ ловит (осознанно): продавец с сообщником, который заводит
   объявления и оставляет по отзыву на каждое. Для этого нужен факт сделки,
   которого в базе нет. */

do $$
begin
  if to_regclass('public.listings') is null then
    raise exception '750_reviews: нет таблицы listings — сначала прогоните 300_listings.sql';
  end if;
  if to_regclass('public.profiles') is null then
    raise exception '750_reviews: нет таблицы profiles — сначала прогоните 200_profiles.sql';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'profiles'
                    and column_name in ('rating', 'reviews_count')
                  group by table_name having count(*) = 2) then
    raise exception '750_reviews: в profiles нет колонок rating/reviews_count — обновите 200_profiles.sql';
  end if;
  if to_regprocedure('auth.role()') is null or to_regprocedure('auth.uid()') is null then
    raise exception '750_reviews: нет auth.uid()/auth.role() — база не похожа на Supabase';
  end if;
end $$;


/* ---------------------------------------------------------------- reviews */

create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  seller_id  uuid not null references auth.users(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  /* set null, а не cascade: продавец удалил объявление — отзыв остаётся.
     Иначе достаточно снести объявление, чтобы стереть плохую оценку. */
  listing_id uuid references public.listings(id) on delete set null,
  rating     int not null,
  text       text,
  created_at timestamptz not null default now(),
  constraint reviews_rating_check       check (rating between 1 and 5),
  constraint reviews_not_self_check     check (author_id <> seller_id),
  constraint reviews_author_listing_key unique (author_id, listing_id)
);

/* Лечение таблицы от прошлой версии файла. */
alter table public.reviews add column if not exists seller_id  uuid;
alter table public.reviews add column if not exists author_id  uuid;
alter table public.reviews add column if not exists listing_id uuid;
alter table public.reviews add column if not exists rating     int;
alter table public.reviews add column if not exists text       text;
alter table public.reviews add column if not exists created_at timestamptz not null default now();

do $$
begin
  alter table public.reviews add constraint reviews_rating_check check (rating between 1 and 5);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.reviews add constraint reviews_not_self_check check (author_id <> seller_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.reviews add constraint reviews_author_listing_key unique (author_id, listing_id);
exception when duplicate_table or duplicate_object then null;
end $$;

comment on table public.reviews is
  'Отзывы покупателей о продавцах. Один отзыв на объявление от автора; рейтинг продавца '
  'пересчитывается триггером как среднее по всем его отзывам.';
comment on column public.reviews.seller_id is
  'Кого оценивают. Если указан listing_id, обязан совпадать с владельцем объявления.';
comment on column public.reviews.listing_id is
  'Объявление, по которому отзыв. NULL = общий отзыв о продавце или объявление удалено; '
  'общий отзыв разрешён один на пару автор-продавец (проверка в reviews_before_write).';
comment on column public.reviews.rating is 'Оценка 1..5 звёзд, целое.';

/* Витрина продавца читает отзывы пачкой и в обратном хронологическом порядке —
   это единственный горячий запрос. Пересчёт рейтинга живёт на том же индексе. */
create index if not exists reviews_seller_id_created_at_idx
  on public.reviews (seller_id, created_at desc);
/* author_id стоит первым в unique-индексе, отдельный не нужен; а вот listing_id
   без индекса превратил бы удаление объявления (on delete set null) в seq scan. */
create index if not exists reviews_listing_id_idx on public.reviews (listing_id);

alter table public.reviews enable row level security;

/* Отзывы публичны — их читают гости на странице продавца. */
drop policy if exists reviews_select_all on public.reviews;
create policy reviews_select_all on public.reviews
  for select using (true);

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert to authenticated
  with check (author_id = auth.uid() and author_id <> seller_id);

/* Правит и удаляет только автор. Продавцу собственные отзывы недоступны на
   запись сознательно: возможность «убрать единицу» обесценила бы рейтинг. */
drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists reviews_delete_own on public.reviews;
create policy reviews_delete_own on public.reviews
  for delete to authenticated
  using (author_id = auth.uid());

/* Поколоночные права: менять в существующем отзыве можно только оценку и текст.
   Ссылки и дату защищает ещё и триггер, но грант отсекает попытку раньше и
   дешевле. FK on delete set null это не мешает — ссылочные действия выполняет
   владелец таблицы, а не клиент. */
revoke all on table public.reviews from anon, authenticated;
grant select on table public.reviews to anon, authenticated;
grant insert (seller_id, author_id, listing_id, rating, text) on table public.reviews to authenticated;
grant update (rating, text) on table public.reviews to authenticated;
grant delete on table public.reviews to authenticated;
grant all on table public.reviews to service_role;


/* -------------------------------------------------------------- механика */

/* Пересчёт рейтинга продавца.

   security definer нужен: автор отзыва по RLS правит только свою строку в
   profiles, а тут надо записать чужую. Рычага у вызывающего нет — функция не
   принимает ни рейтинг, ни счётчик, она считает их из reviews; худшее, что
   даёт вызов, — приведение profiles к тому, что реально лежит в отзывах.
   Прямой вызов из клиента всё равно закрыт (auth.role() + revoke ниже). */
create or replace function public.reviews_recount_profile(p_seller_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rating numeric(3,2);
  v_count  int;
begin
  if pg_trigger_depth() = 0 and coalesce(auth.role(), 'postgres') in ('anon', 'authenticated') then
    raise exception 'reviews_recount_profile(): прямой вызов из клиента запрещён'
      using errcode = '42501';
  end if;

  if p_seller_id is null then
    return;
  end if;

  /* Блокируем профиль ДО чтения отзывов. Два параллельных отзыва иначе оба
     посчитали бы среднее без чужой невидимой строки, и один из отзывов пропал
     бы из рейтинга навсегда. После снятия блокировки следующий запрос берёт
     свежий снимок и видит уже зафиксированный отзыв соседа. */
  perform 1 from public.profiles where id = p_seller_id for update;
  if not found then
    /* Профиля нет: аккаунт продавца удаляется прямо сейчас (каскад снёс
       profiles раньше reviews). Пересчитывать нечего и некуда. */
    return;
  end if;

  select round(coalesce(avg(rating), 0)::numeric, 2), count(*)
    into v_rating, v_count
    from public.reviews
   where seller_id = p_seller_id;

  update public.profiles
     set rating = v_rating,
         reviews_count = v_count
   where id = p_seller_id
     and (rating is distinct from v_rating or reviews_count is distinct from v_count);
end $$;

comment on function public.reviews_recount_profile(uuid) is
  'Пересчитывает profiles.rating и profiles.reviews_count как среднее и количество по всем отзывам '
  'продавца. Зовётся триггером reviews; service_role может позвать вручную для починки.';

revoke all on function public.reviews_recount_profile(uuid) from public, anon, authenticated;
grant execute on function public.reviews_recount_profile(uuid) to service_role;


/* Проверки, которые нельзя выразить ограничением: они смотрят в соседние
   таблицы и в старую версию строки. definer — потому что проверка владельца
   объявления читает чужую строку listings, а по RLS обычному пользователю
   видны только свои объявления: invoker-версия отвергала бы каждый отзыв. */
create or replace function public.reviews_before_write()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.text := nullif(btrim(new.text), '');

  if tg_op = 'UPDATE' then
    /* Личность отзыва неизменяема. Дырка, которую это закрывает: автор правит
       seller_id у старого хорошего отзыва и переносит пятёрку другому
       продавцу — сколько угодно раз одной строкой. */
    if new.author_id is distinct from old.author_id
       or new.seller_id is distinct from old.seller_id then
      raise exception 'У отзыва нельзя менять автора и продавца'
        using errcode = '42501';
    end if;
    /* listing_id разрешено только обнулять — это делает сам FK при удалении
       объявления (on delete set null). Перевешивание отзыва на другое
       объявление обходило бы unique (author_id, listing_id). */
    if new.listing_id is distinct from old.listing_id and new.listing_id is not null then
      raise exception 'У отзыва нельзя менять объявление'
        using errcode = '42501';
    end if;
    new.created_at := old.created_at;   -- дату отзыва не переписываем
    return new;
  end if;

  /* Отзыв «по объявлению» имеет смысл только если объявление и правда этого
     продавца. Иначе автор набивает продавцу отзывы, подставляя чужие id
     объявлений: unique (author_id, listing_id) их все считает разными. */
  if new.listing_id is not null
     and not exists (select 1 from public.listings l
                      where l.id = new.listing_id and l.owner_id = new.seller_id) then
    raise exception 'Объявление принадлежит другому продавцу'
      using errcode = '23514';
  end if;

  /* Общий отзыв (без объявления) — ровно один на пару автор-продавец.
     Уникальным индексом это не сделать: listing_id обнуляется каскадом при
     удалении объявления, и такой индекс превратил бы удаление объявления в
     ошибку у продавца, который тут ни при чём. Проверка на вставке ловит
     именно накрутку и не мешает FK. */
  if new.listing_id is null
     and exists (select 1 from public.reviews r
                  where r.author_id = new.author_id
                    and r.seller_id = new.seller_id
                    and r.listing_id is null) then
    raise exception 'Вы уже оставляли отзыв этому продавцу'
      using errcode = '23505';
  end if;

  return new;
end $$;

revoke all on function public.reviews_before_write() from public, anon, authenticated;

drop trigger if exists reviews_before_write on public.reviews;
create trigger reviews_before_write
  before insert or update on public.reviews
  for each row execute function public.reviews_before_write();


create or replace function public.reviews_after_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform public.reviews_recount_profile(old.seller_id);
    return old;
  end if;

  /* seller_id заморожен триггером выше, но пересчёт обеих сторон оставлен
     намеренно: если правило когда-нибудь ослабят, рейтинг старого продавца не
     останется завышенным. Порядок блокировок по значению uuid — от дедлока. */
  if tg_op = 'UPDATE' and old.seller_id is distinct from new.seller_id then
    perform public.reviews_recount_profile(least(old.seller_id, new.seller_id));
    perform public.reviews_recount_profile(greatest(old.seller_id, new.seller_id));
    return new;
  end if;

  perform public.reviews_recount_profile(new.seller_id);
  return new;
end $$;

revoke all on function public.reviews_after_change() from public, anon, authenticated;

/* update of rating, seller_id: правка текста отзыва рейтинг не меняет,
   гонять из-за неё пересчёт и блокировать профиль незачем. */
drop trigger if exists reviews_after_change on public.reviews;
create trigger reviews_after_change
  after insert or update of rating, seller_id or delete on public.reviews
  for each row execute function public.reviews_after_change();
