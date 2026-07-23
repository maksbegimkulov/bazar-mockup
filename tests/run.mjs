/* Полный прогон бэкенда BAZAR по локальному стеку.

   Философия набора: проверяем не «функция вернула что-то», а «злоумышленник
   не смог». Успешный запрос там, где должно быть отказано, — это провал.

   Запуск:  cd tests && node run.mjs
*/

import {
  anon, admin, makeUser, sql,
  group, test, eq, ok, notOk, mustFail, mustPass, summary,
  clientParse, serverSearch,
} from './harness.mjs';

const A = await makeUser('seller');
const B = await makeUser('buyer');
const C = await makeUser('third');
const guest = anon();

const baseListing = (over = {}) => ({
  title: 'Toyota Camry 70, 2019, 2.5',
  description: 'Полная комплектация, один владелец',
  price: 1450000,
  category: 'transport',
  subcategory: 'Легковые авто',
  city: 'Бишкек',
  condition: 'used',
  attrs: { brand: 'Toyota', model: 'Camry', gen: 'XV70', year: '2019' },
  ...over,
});

let listingId = null;

/* ══════════════════════════ справочники ══════════════════════════ */
group('Справочники');

await test('10 категорий, 41 подкатегория, 11 городов', async () => {
  eq(+sql('select count(*) from categories'), 10, 'категорий');
  eq(+sql('select count(*) from subcategories'), 41, 'подкатегорий');
  eq(+sql('select count(*) from cities'), 11, 'городов');
});

await test('названия подкатегорий совпадают с клиентскими', async () => {
  const n = +sql("select count(*) from subcategories where name = 'Легковые авто'");
  eq(n, 1, 'подкатегория «Легковые авто»');
});

await test('справочник доступен гостю на чтение', async () => {
  const d = await mustPass(guest.from('cities').select('name'), 'гость читает города');
  ok(d.length === 11, 'гость видит все города');
});

await test('справочник нельзя испортить с клиента', async () => {
  await mustFail(B.client.from('cities').insert({ name: 'Мордор' }), 'вставка города юзером');
});

/* ══════════════════════════ профили ══════════════════════════ */
group('Профили');

await test('профиль создаётся автоматически при регистрации', async () => {
  eq(+sql(`select count(*) from profiles where id = '${A.id}'`), 1, 'профиль продавца');
});

await test('имя подхватывается из метаданных регистрации', async () => {
  const name = sql(`select name from profiles where id = '${A.id}'`);
  ok(name && name !== '', 'имя не пустое, получили: ' + JSON.stringify(name));
});

await test('чужой профиль не изменить', async () => {
  await mustFail(
    B.client.from('profiles').update({ name: 'взломано' }).eq('id', A.id).select().single(),
    'правка чужого профиля');
  ok(sql(`select name from profiles where id='${A.id}'`) !== 'взломано', 'имя уцелело');
});

await test('телефон не отдаётся наружу через public_profiles', async () => {
  sql(`update profiles set phone = '+996700123456' where id = '${A.id}'`);
  const d = await mustPass(guest.from('public_profiles').select('*').eq('id', A.id).single(),
    'чтение публичного профиля');
  notOk('phone' in d, 'в public_profiles не должно быть телефона, получили ключи: ' + Object.keys(d));
  notOk('banned_until' in d, 'в public_profiles не должно быть признака бана');
});

/* ══════════════════════════ объявления ══════════════════════════ */
group('Объявления');

await test('владелец создаёт объявление', async () => {
  const d = await mustPass(
    A.client.from('listings').insert({ ...baseListing(), owner_id: A.id }).select().single(),
    'вставка объявления');
  listingId = d.id;
  eq(d.status, 'active', 'статус нового объявления');
});

await test('нельзя создать объявление от чужого имени', async () => {
  await mustFail(
    B.client.from('listings').insert({ ...baseListing(), owner_id: A.id }).select().single(),
    'подделка owner_id');
});

await test('пустой заголовок отбивается', async () => {
  await mustFail(
    A.client.from('listings').insert({ ...baseListing({ title: '  ' }), owner_id: A.id }).select().single(),
    'заголовок из пробелов');
});

await test('отрицательная цена отбивается', async () => {
  await mustFail(
    A.client.from('listings').insert({ ...baseListing({ price: -100 }), owner_id: A.id }).select().single(),
    'отрицательная цена');
});

await test('несуществующая подкатегория отбивается', async () => {
  await mustFail(
    A.client.from('listings').insert({ ...baseListing({ subcategory: 'Ковры-самолёты' }), owner_id: A.id }).select().single(),
    'выдуманная подкатегория');
});

await test('подкатегория из чужой категории отбивается', async () => {
  await mustFail(
    A.client.from('listings').insert({ ...baseListing({ category: 'realty', subcategory: 'Легковые авто' }), owner_id: A.id }).select().single(),
    'подкатегория не из своей категории');
});

await test('больше 10 фото не принимается', async () => {
  const photos = Array.from({ length: 11 }, (_, i) => `${A.id}/x/${i}.jpg`);
  await mustFail(
    A.client.from('listings').insert({ ...baseListing({ photos }), owner_id: A.id }).select().single(),
    '11 фотографий');
});

await test('чужое объявление не изменить', async () => {
  await mustFail(
    B.client.from('listings').update({ price: 1 }).eq('id', listingId).select().single(),
    'правка чужого объявления');
  eq(+sql(`select price::int from listings where id='${listingId}'`), 1450000, 'цена уцелела');
});

await test('чужое объявление не удалить', async () => {
  await B.client.from('listings').delete().eq('id', listingId);
  eq(+sql(`select count(*) from listings where id='${listingId}'`), 1, 'объявление на месте');
});

await test('поисковый вектор строится автоматически', async () => {
  const v = sql(`select coalesce(search_vector::text,'') from listings where id='${listingId}'`);
  ok(v.length > 0, 'search_vector пуст');
  ok(/camry|toyota/i.test(v), 'в векторе нет марки, получили: ' + v.slice(0, 200));
});

/* ══════════════════════════ секрет продавца ══════════════════════════ */
group('Скрытая минимальная цена');

await test('floor сохраняется владельцем', async () => {
  await mustPass(A.client.from('listings').update({ floor: 1300000 }).eq('id', listingId).select().single(),
    'установка floor владельцем');
  eq(+sql(`select floor::int from listings where id='${listingId}'`), 1300000, 'floor записан');
});

await test('floor больше цены отбивается', async () => {
  await mustFail(
    A.client.from('listings').update({ floor: 9999999 }).eq('id', listingId).select().single(),
    'floor выше цены');
});

await test('покупатель НЕ видит floor через таблицу', async () => {
  const { data } = await B.client.from('listings').select('*').eq('id', listingId);
  ok(!data || data.length === 0 || !('floor' in (data[0] || {})) || data[0].floor == null,
    'floor утёк покупателю: ' + JSON.stringify(data));
});

await test('покупатель НЕ видит floor через public_listings', async () => {
  const d = await mustPass(B.client.from('public_listings').select('*').eq('id', listingId).single(),
    'чтение публичной вью');
  notOk('floor' in d, 'в public_listings есть floor, ключи: ' + Object.keys(d).join(','));
  eq(d.has_floor, true, 'признак «торг уместен» должен быть виден');
});

await test('гость НЕ видит floor', async () => {
  const d = await mustPass(guest.from('public_listings').select('*').eq('id', listingId).single(),
    'гость читает объявление');
  notOk('floor' in d, 'floor виден гостю');
});

await test('floor не достать через выборку одной колонки', async () => {
  const { data, error } = await B.client.from('listings').select('floor').eq('id', listingId);
  ok(error || !data || data.length === 0 || data[0].floor == null,
    'floor достали адресным select: ' + JSON.stringify(data));
});

/* ══════════════════════════ поиск ══════════════════════════ */
group('Поиск');

await test('гость находит объявление словами (через клиентский NLU)', async () => {
  // «камри» → parseSearchQuery → {sub:Легковые авто, attrs:{brand:Toyota,model:Camry}}
  // → серверный фильтр. Это реальный путь браузера, а не сырой rpc.
  const rows = await serverSearch(guest, 'камри');
  ok(rows.length >= 1, 'ничего не нашлось по «камри» через реальный путь клиента');
});

await test('полнотекст находит слово из описания', async () => {
  // прямой серверный полнотекст на одном алфавите — то, для чего он и есть
  const d = await mustPass(guest.rpc('rpc_search_listings', { p_query: 'комплектация' }), 'полнотекст');
  const rows = Array.isArray(d) ? d : (d.rows || []);
  ok(rows.length >= 1, 'полнотекст не нашёл слово «комплектация» из описания');
});

await test('фильтр по категории сужает выдачу', async () => {
  const a = await mustPass(guest.rpc('rpc_search_listings', { p_category: 'transport' }), 'фильтр транспорт');
  const b = await mustPass(guest.rpc('rpc_search_listings', { p_category: 'kids' }), 'фильтр детям');
  const ra = Array.isArray(a) ? a : (a.rows || []), rb = Array.isArray(b) ? b : (b.rows || []);
  ok(ra.length >= 1, 'в транспорте пусто');
  ok(!rb.some(r => r.category === 'transport'), 'авто просочилось в фильтр «детям»');
});

await test('фильтр по цене работает', async () => {
  const d = await mustPass(guest.rpc('rpc_search_listings', { p_price_max: 1000 }), 'дешевле 1000');
  const rows = Array.isArray(d) ? d : (d.rows || []);
  eq(rows.length, 0, 'машина за 1.45 млн попала в фильтр «до 1000»');
});

await test('фильтр по характеристикам работает', async () => {
  const hit = await mustPass(guest.rpc('rpc_search_listings', { p_attrs: { brand: 'Toyota' } }), 'attrs Toyota');
  const miss = await mustPass(guest.rpc('rpc_search_listings', { p_attrs: { brand: 'BMW' } }), 'attrs BMW');
  ok((Array.isArray(hit) ? hit : hit.rows || []).length >= 1, 'Toyota не нашлась');
  eq((Array.isArray(miss) ? miss : miss.rows || []).length, 0, 'BMW не должна найтись');
});

await test('в выдаче поиска нет floor', async () => {
  const d = await mustPass(guest.rpc('rpc_search_listings', { p_query: 'камри' }), 'поиск');
  const rows = Array.isArray(d) ? d : (d.rows || []);
  notOk(rows.some(r => 'floor' in r), 'floor утёк через поиск');
});

await test('заблокированное объявление не попадает в выдачу', async () => {
  sql(`update listings set status='blocked' where id='${listingId}'`);
  const d = await mustPass(guest.rpc('rpc_search_listings', { p_query: 'камри' }), 'поиск');
  const rows = Array.isArray(d) ? d : (d.rows || []);
  notOk(rows.some(r => r.id === listingId), 'заблокированное объявление видно в поиске');
  sql(`update listings set status='active' where id='${listingId}'`);
});

await test('пагинация курсором не теряет и не дублирует строки', async () => {
  // насыпаем достаточно строк, чтобы было что листать
  const rows = Array.from({ length: 30 }, (_, i) => ({
    ...baseListing({ title: `Тестовый лот пагинации ${i}`, price: 1000 + i }),
    owner_id: A.id,
  }));
  sql(`insert into listings (owner_id, title, description, price, category, subcategory, city, condition, attrs)
       select '${A.id}', 'Лот пагинации ' || g, 'описание', 1000 + g, 'transport', 'Легковые авто', 'Бишкек', 'used', '{}'::jsonb
       from generate_series(1, 30) g`);
  const seen = new Set();
  let cursor = null, pages = 0;
  for (;;) {
    const d = await mustPass(
      guest.rpc('rpc_search_listings', { p_query: 'пагинации', p_cursor: cursor, p_limit: 7 }),
      'страница ' + pages);
    const rs = Array.isArray(d) ? d : (d.rows || []);
    if (!rs.length) break;
    for (const r of rs) {
      ok(!seen.has(r.id), 'строка повторилась между страницами: ' + r.id);
      seen.add(r.id);
    }
    cursor = rs[rs.length - 1].next_cursor || (d.next_cursor ?? null);
    pages++;
    if (!cursor || pages > 12) break;
  }
  ok(seen.size >= 30, 'пагинация потеряла строки: собрали ' + seen.size + ' из 30+');
});

await test('счётчики характеристик считаются на сервере', async () => {
  const d = await mustPass(
    guest.rpc('rpc_attr_counts', { p_category: 'transport', p_subcategory: 'Легковые авто', p_filters: {} }),
    'rpc_attr_counts');
  ok(d && typeof d === 'object', 'ответ не объект');
  ok(d.brand && d.brand.Toyota >= 1, 'нет счётчика по Toyota: ' + JSON.stringify(d).slice(0, 200));
});

/* ══════════════════════════ хранилище фото ══════════════════════════ */
group('Хранилище фото');

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]);

await test('бакет создан и публично читается', async () => {
  const row = sql("select public from storage.buckets where id='listing-photos'");
  eq(row, 't', 'бакет listing-photos должен быть публичным на чтение');
});

await test('владелец грузит фото в свою папку', async () => {
  const path = `${A.id}/${listingId}/photo-1.jpg`;
  const { error } = await A.client.storage.from('listing-photos')
    .upload(path, jpeg, { contentType: 'image/jpeg', upsert: true });
  ok(!error, 'загрузка своего фото не должна падать: ' + (error && error.message));
});

await test('чужую папку залить нельзя', async () => {
  const path = `${A.id}/${listingId}/подделка.jpg`;
  const { error } = await B.client.storage.from('listing-photos')
    .upload(path, jpeg, { contentType: 'image/jpeg', upsert: true });
  ok(error, 'покупатель залил файл в папку продавца — политика не работает');
});

await test('гость не грузит ничего', async () => {
  const { error } = await guest.storage.from('listing-photos')
    .upload(`anon/x.jpg`, jpeg, { contentType: 'image/jpeg' });
  ok(error, 'гость смог загрузить файл');
});

await test('чужое фото нельзя удалить', async () => {
  const path = `${A.id}/${listingId}/photo-1.jpg`;
  await B.client.storage.from('listing-photos').remove([path]);
  const { data } = await admin().storage.from('listing-photos').list(`${A.id}/${listingId}`);
  ok((data || []).some(f => f.name === 'photo-1.jpg'), 'фото продавца удалено покупателем');
});

/* ══════════════════════════ личные данные ══════════════════════════ */
group('Личные данные');

await test('избранное пишется и читается своё', async () => {
  await mustPass(B.client.from('favorites').insert({
    user_id: B.id, listing_id: listingId, price_at_add: 1450000, note: 'позвонить',
  }).select().single(), 'добавление в избранное');
  const d = await mustPass(B.client.from('favorites').select('*'), 'чтение избранного');
  eq(d.length, 1, 'своё избранное');
});

await test('чужое избранное не видно', async () => {
  const d = await mustPass(C.client.from('favorites').select('*'), 'чтение избранного третьим лицом');
  eq(d.length, 0, 'третий видит чужое избранное');
});

await test('сохранённый поиск живёт у владельца', async () => {
  await mustPass(B.client.from('saved_searches').insert({
    user_id: B.id, name: 'Камри до 1.5 млн', query: { q: 'камри', priceMax: 1500000 },
  }).select().single(), 'сохранение поиска');
  const mine = await mustPass(B.client.from('saved_searches').select('*'), 'свои поиски');
  const alien = await mustPass(C.client.from('saved_searches').select('*'), 'чужие поиски');
  eq(mine.length, 1, 'свой поиск');
  eq(alien.length, 0, 'чужой поиск виден');
});

await test('просмотр засчитывается, накрутка обновлением — нет', async () => {
  const before = +sql(`select views_count from listings where id='${listingId}'`);
  for (let i = 0; i < 5; i++) {
    await guest.rpc('rpc_track_view', { p_listing_id: listingId, p_fingerprint: 'fp-один-и-тот-же' });
  }
  const after = +sql(`select views_count from listings where id='${listingId}'`);
  eq(after - before, 1, 'пять обновлений страницы должны дать ровно один просмотр');
});

/* ══════════════════════════ жалобы ══════════════════════════ */
group('Жалобы и модерация');

let victimId = null;

// reports читает только service_role, поэтому .insert() идёт БЕЗ .select():
// клиент (js/api.js report()) тоже не запрашивает строку назад.
await test('жалоба принимается от залогиненного', async () => {
  victimId = (await mustPass(
    A.client.from('listings').insert({ ...baseListing({ title: 'Объявление под жалобы' }), owner_id: A.id }).select().single(),
    'создание жертвы')).id;
  await mustPass(B.client.from('reports').insert({
    listing_id: victimId, reporter_id: B.id, reason: 'scam',
  }), 'жалоба покупателя');
});

await test('повторная жалоба того же человека не проходит', async () => {
  await mustFail(B.client.from('reports').insert({
    listing_id: victimId, reporter_id: B.id, reason: 'scam',
  }), 'вторая жалоба от того же');
});

await test('гость жаловаться не может', async () => {
  await mustFail(guest.from('reports').insert({
    listing_id: victimId, reason: 'scam',
  }), 'жалоба от гостя');
});

await test('три жалобы от разных людей блокируют объявление', async () => {
  await mustPass(C.client.from('reports').insert({
    listing_id: victimId, reporter_id: C.id, reason: 'prohibited',
  }), 'жалоба третьего');
  const D = await makeUser('fourth');
  await mustPass(D.client.from('reports').insert({
    listing_id: victimId, reporter_id: D.id, reason: 'scam',
  }), 'жалоба четвёртого');
  eq(sql(`select status from listings where id='${victimId}'`), 'blocked', 'статус после трёх жалоб');
  ok(+sql(`select count(*) from moderation_log where listing_id='${victimId}'`) >= 1, 'запись в журнале модерации');
});

await test('жалобы не читаются обычным пользователем', async () => {
  const { data } = await B.client.from('reports').select('*');
  eq((data || []).length, 0, 'пользователь видит таблицу жалоб');
});

/* ══════════════════════════ отзывы ══════════════════════════ */
group('Отзывы и рейтинг');

await test('покупатель оставляет отзыв продавцу', async () => {
  await mustPass(B.client.from('reviews').insert({
    seller_id: A.id, author_id: B.id, listing_id: listingId, rating: 5, text: 'всё честно',
  }).select().single(), 'отзыв');
  eq(+sql(`select reviews_count from profiles where id='${A.id}'`), 1, 'счётчик отзывов');
  eq(sql(`select rating::numeric(3,2) from profiles where id='${A.id}'`), '5.00', 'рейтинг');
});

await test('рейтинг — честное среднее', async () => {
  await mustPass(C.client.from('reviews').insert({
    seller_id: A.id, author_id: C.id, rating: 3,
  }).select().single(), 'второй отзыв');
  eq(sql(`select rating::numeric(3,2) from profiles where id='${A.id}'`), '4.00', 'среднее из 5 и 3');
});

await test('нельзя оценить самого себя', async () => {
  await mustFail(A.client.from('reviews').insert({
    seller_id: A.id, author_id: A.id, rating: 5,
  }).select().single(), 'самооценка');
});

await test('нельзя оценить дважды за одно объявление', async () => {
  await mustFail(B.client.from('reviews').insert({
    seller_id: A.id, author_id: B.id, listing_id: listingId, rating: 1,
  }).select().single(), 'второй отзыв на то же объявление');
});

await test('удаление отзыва пересчитывает рейтинг', async () => {
  sql(`delete from reviews where author_id='${C.id}' and seller_id='${A.id}'`);
  eq(sql(`select rating::numeric(3,2) from profiles where id='${A.id}'`), '5.00', 'рейтинг после удаления');
  eq(+sql(`select reviews_count from profiles where id='${A.id}'`), 1, 'счётчик после удаления');
});

/* ══════════════════════════ торг ══════════════════════════ */
group('Торг');

let bargainId = null;

await test('предложение ниже минимума отклоняется', async () => {
  bargainId = (await mustPass(A.client.from('listings').insert({
    ...baseListing({ title: 'Лот для торга', price: 100000 }), owner_id: A.id,
  }).select().single(), 'лот для торга')).id;
  await mustPass(A.client.from('listings').update({ floor: 90000 }).eq('id', bargainId).select().single(), 'floor');

  const r = await mustPass(B.client.rpc('rpc_make_offer', { p_listing_id: bargainId, p_amount: 50000 }), 'низкое предложение');
  eq(r.status, 'rejected', 'статус низкого предложения');
});

await test('ответ на предложение не раскрывает минимум', async () => {
  const r = await mustPass(B.client.rpc('rpc_make_offer', { p_listing_id: bargainId, p_amount: 60000 }), 'предложение');
  const s = JSON.stringify(r);
  notOk(/90000/.test(s), 'в ответе видно точное значение floor: ' + s);
  notOk('floor' in r, 'в ответе есть ключ floor');
});

await test('предложение выше минимума принимается', async () => {
  const D = await makeUser('bargainer');
  const r = await mustPass(D.client.rpc('rpc_make_offer', { p_listing_id: bargainId, p_amount: 95000 }), 'хорошее предложение');
  eq(r.status, 'accepted', 'статус хорошего предложения');
});

await test('минимум нельзя нащупать перебором', async () => {
  const E = await makeUser('probe');
  const seen = [];
  for (let amount = 10000; amount <= 89000; amount += 10000) {
    const { data } = await E.client.rpc('rpc_make_offer', { p_listing_id: bargainId, p_amount: amount });
    seen.push(data && data.status);
    if (data && data.status === 'accepted') break;
  }
  notOk(seen.includes('accepted'), 'перебором приняли предложение ниже минимума');
  ok(seen.some(s => s === null || s === undefined || s === 'rejected' || s === 'countered'),
    'непонятные ответы на перебор: ' + JSON.stringify(seen));
});

await test('нельзя торговаться за собственное объявление', async () => {
  const { data, error } = await A.client.rpc('rpc_make_offer', { p_listing_id: bargainId, p_amount: 95000 });
  ok(error || (data && data.status !== 'accepted'), 'продавец сторговался сам с собой: ' + JSON.stringify(data));
});

/* ══════════════════════════ чаты ══════════════════════════ */
group('Чаты');

let chatId = null;

await test('покупатель открывает чат с продавцом', async () => {
  const d = await mustPass(B.client.from('chats').insert({
    buyer_id: B.id, seller_id: A.id, listing_ref: String(listingId), listing_title: 'Toyota Camry',
  }).select().single(), 'создание чата');
  chatId = d.id;
});

await test('сообщение доходит', async () => {
  await mustPass(B.client.from('messages').insert({
    chat_id: chatId, sender_id: B.id, text: 'Здравствуйте, машина ещё в продаже?',
  }).select().single(), 'отправка сообщения');
  const d = await mustPass(A.client.from('messages').select('*').eq('chat_id', chatId), 'чтение продавцом');
  eq(d.length, 1, 'продавец видит сообщение');
});

await test('посторонний не читает чужую переписку', async () => {
  const d = await mustPass(C.client.from('messages').select('*').eq('chat_id', chatId), 'чтение посторонним');
  eq(d.length, 0, 'посторонний прочитал чужую переписку');
});

await test('посторонний не может писать в чужой чат', async () => {
  await mustFail(C.client.from('messages').insert({
    chat_id: chatId, sender_id: C.id, text: 'влезаю',
  }).select().single(), 'запись в чужой чат');
});

await test('нельзя отправить сообщение от чужого имени', async () => {
  await mustFail(B.client.from('messages').insert({
    chat_id: chatId, sender_id: A.id, text: 'я продавец, честно',
  }).select().single(), 'подделка отправителя');
});

await test('чат помнит последнее сообщение', async () => {
  const last = sql(`select coalesce(last_message_text,'') from chats where id='${chatId}'`);
  ok(last.includes('продаже'), 'last_message_text не обновился: ' + last);
});

/* ══════════════════════════ лимиты ══════════════════════════ */
group('Защита от спама');

await test('одиннадцатое объявление за час отбивается', async () => {
  const F = await makeUser('spammer');
  let blockedAt = null;
  for (let i = 1; i <= 12; i++) {
    const { error } = await F.client.from('listings')
      .insert({ ...baseListing({ title: `Спам ${i}` }), owner_id: F.id }).select().single();
    if (error) { blockedAt = i; break; }
  }
  ok(blockedAt !== null, 'лимит на подачу не сработал вовсе');
  eq(blockedAt, 11, 'лимит должен сработать на 11-м объявлении');
});

await test('сообщение об ошибке лимита понятно человеку', async () => {
  const G = await makeUser('spammer2');
  let msg = '';
  for (let i = 1; i <= 12; i++) {
    const { error } = await G.client.from('listings')
      .insert({ ...baseListing({ title: `Спам2 ${i}` }), owner_id: G.id }).select().single();
    if (error) { msg = error.message; break; }
  }
  ok(/[а-яА-Я]/.test(msg), 'сообщение не по-русски: ' + msg);
});

/* ══════════════════════════ уведомления ══════════════════════════ */
group('Уведомления');

await test('новое сообщение рождает уведомление получателю', async () => {
  // По дизайну непрочитанные уведомления по одному чату СКЛЕИВАЮТСЯ (20 реплик
  // ≠ 20 «непрочитанных»). Чтобы проверить именно РОЖДЕНИЕ нового, сперва
  // помечаем прежние прочитанными — тогда следующее сообщение заводит строку.
  sql(`update notifications set read_at = now() where user_id='${A.id}' and kind='message'`);
  const before = +sql(`select count(*) from notifications where user_id='${A.id}' and kind='message'`);
  await mustPass(B.client.from('messages').insert({
    chat_id: chatId, sender_id: B.id, text: 'Готов посмотреть завтра',
  }).select().single(), 'сообщение');
  const after = +sql(`select count(*) from notifications where user_id='${A.id}' and kind='message'`);
  eq(after - before, 1, 'уведомление продавцу');
});

await test('себе уведомление не приходит', async () => {
  const mine = +sql(`select count(*) from notifications where user_id='${B.id}' and kind='message'`);
  eq(mine, 0, 'отправитель получил уведомление о своём же сообщении');
});

await test('падение цены уведомляет тех, у кого объявление в избранном', async () => {
  const before = +sql(`select count(*) from notifications where user_id='${B.id}' and kind='price_drop'`);
  await mustPass(A.client.from('listings').update({ price: 1200000 }).eq('id', listingId).select().single(),
    'снижение цены');
  const after = +sql(`select count(*) from notifications where user_id='${B.id}' and kind='price_drop'`);
  eq(after - before, 1, 'уведомление о падении цены');
});

await test('чужие уведомления не читаются', async () => {
  const d = await mustPass(C.client.from('notifications').select('*'), 'чтение уведомлений');
  eq(d.length, 0, 'третий видит чужие уведомления');
});

/* ══════════════════════════ итог ══════════════════════════ */
process.exit(summary() ? 1 : 0);
