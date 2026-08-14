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

/* ══════════════════════════ живой запрос ══════════════════════════ */
group('Сохранённые поиски: матчер');

// Конкретный запрос третьего лица: Camry XV70 до 2 млн в Бишкеке.
const SS_NARROW = 'ss-narrow-' + Math.random().toString(36).slice(2, 8);
const SS_WIDE   = 'ss-wide-'   + Math.random().toString(36).slice(2, 8);
let ssNarrowId = null, ssWideId = null, ssListingId = null;

/* Матчер и сводка сознательно молчат ночью (22:00–09:00 по Бишкеку). Если
   оставить это на настоящие часы, набор зелёный днём и красный ночью — причём
   ночью он выглядит поломкой, хотя код прав, и половина группы просто не
   проверяется. Поэтому на время группы приколачиваем один источник времени, а
   саму тишину проверяем отдельно: ниже есть тест с приколоченной ночью и тест
   на таблицу часов с явными метками времени. Определение забираем из базы и
   возвращаем как было — руками его не переписываем, чтобы копия не разошлась
   с миграцией. */
const QUIET_DEF = sql(`select pg_get_functiondef('public.bazar_quiet_hours(timestamptz)'::regprocedure)`);
const pinQuiet = v => sql(
  `create or replace function public.bazar_quiet_hours(p_at timestamptz default now())
   returns boolean language sql stable parallel safe as $pin$ select ${v} $pin$`);
const unpinQuiet = () => sql(QUIET_DEF);
pinQuiet(false);

await test('конкретный запрос ловит новое объявление и уведомляет', async () => {
  const s = await mustPass(C.client.from('saved_searches').insert({
    user_id: C.id, name: SS_NARROW,
    query: { cat: 'transport', sub: 'Легковые авто', city: 'Бишкек', priceMax: '2000000',
             attrs: { brand: 'Toyota', model: 'Camry' } },
  }).select().single(), 'сохранение конкретного поиска');
  ssNarrowId = s.id;

  const before = +sql(`select count(*) from notifications where user_id='${C.id}' and kind='saved_search'`);
  const l = await mustPass(A.client.from('listings').insert({
    ...baseListing({ title: 'Toyota Camry 70, 2020, 2.5 — свежая' }), owner_id: A.id,
  }).select().single(), 'публикация подходящего объявления');
  ssListingId = l.id;

  eq(+sql(`select count(*) from saved_search_hits where search_id='${ssNarrowId}' and listing_id='${l.id}'`),
     1, 'совпадение записано');
  const after = +sql(`select count(*) from notifications where user_id='${C.id}' and kind='saved_search'`);
  eq(after - before, 1, 'уведомление о новом по запросу');
});

await test('уведомление ведёт на само объявление', async () => {
  const link = sql(`select link from notifications where user_id='${C.id}' and kind='saved_search'
                    order by created_at desc limit 1`);
  eq(link, '#/item/' + ssListingId, 'ссылка уведомления');
});

await test('объявление мимо фильтра не попадает в поиск', async () => {
  const before = +sql(`select count(*) from saved_search_hits where search_id='${ssNarrowId}'`);
  await mustPass(A.client.from('listings').insert({
    ...baseListing({ title: 'Honda Fit, 2015', price: 700000,
                     attrs: { brand: 'Honda', model: 'Fit', year: '2015' } }), owner_id: A.id,
  }).select().single(), 'публикация другого авто');
  eq(+sql(`select count(*) from saved_search_hits where search_id='${ssNarrowId}'`), before,
     'чужая марка попала в поиск');
});

await test('своё объявление в свой же поиск не попадает', async () => {
  const own = await mustPass(A.client.from('saved_searches').insert({
    user_id: A.id, name: 'ss-own-' + Math.random().toString(36).slice(2, 8),
    query: { cat: 'transport', sub: 'Легковые авто', attrs: { brand: 'Toyota' } },
  }).select().single(), 'поиск продавца');
  await mustPass(A.client.from('listings').insert({
    ...baseListing({ title: 'Toyota Camry 70, 2018' }), owner_id: A.id,
  }).select().single(), 'своё объявление');
  eq(+sql(`select count(*) from saved_search_hits where search_id='${own.id}'`), 0,
     'продавец получил уведомление о самом себе');
});

await test('широкий запрос копится, но не уведомляет', async () => {
  const s = await mustPass(C.client.from('saved_searches').insert({
    user_id: C.id, name: SS_WIDE, query: { cat: 'transport', sub: 'Легковые авто' },
  }).select().single(), 'сохранение широкого поиска');
  ssWideId = s.id;

  const before = +sql(`select count(*) from notifications where user_id='${C.id}' and kind='saved_search'`);
  await mustPass(A.client.from('listings').insert({
    ...baseListing({ title: 'Lexus ES 250, 2021', price: 3300000,
                     attrs: { brand: 'Lexus', model: 'ES' } }), owner_id: A.id,
  }).select().single(), 'публикация в широкую подкатегорию');

  ok(+sql(`select count(*) from saved_search_hits where search_id='${ssWideId}'`) > 0,
     'широкий поиск ничего не насчитал');
  eq(+sql(`select count(*) from notifications where user_id='${C.id}' and kind='saved_search'`), before,
     'широкий запрос прислал уведомление');
});

await test('второе уведомление по тому же поиску за сутки не приходит', async () => {
  const before = +sql(`select count(*) from notifications where user_id='${C.id}' and kind='saved_search'`);
  const l = await mustPass(A.client.from('listings').insert({
    ...baseListing({ title: 'Toyota Camry 70, 2019, чёрная', price: 1600000 }), owner_id: A.id,
  }).select().single(), 'ещё одно подходящее объявление');
  eq(+sql(`select count(*) from saved_search_hits where search_id='${ssNarrowId}' and listing_id='${l.id}'`),
     1, 'совпадение записано');
  eq(+sql(`select count(*) from notifications where user_id='${C.id}' and kind='saved_search'`), before,
     'второе уведомление за сутки');
});

await test('черновик молчит, публикация — нет', async () => {
  const before = +sql(`select count(*) from saved_search_hits where search_id='${ssWideId}'`);
  const l = await mustPass(A.client.from('listings').insert({
    ...baseListing({ title: 'Toyota Corolla, 2017', status: 'draft' }), owner_id: A.id,
  }).select().single(), 'черновик');
  eq(+sql(`select count(*) from saved_search_hits where search_id='${ssWideId}'`), before, 'черновик засчитан');

  await mustPass(A.client.from('listings').update({ status: 'active' }).eq('id', l.id).select().single(),
    'публикация черновика');
  eq(+sql(`select count(*) from saved_search_hits where search_id='${ssWideId}'`), before + 1,
     'опубликованный черновик не засчитан');

  // снял и вернул — это не новое объявление
  await mustPass(A.client.from('listings').update({ status: 'archived' }).eq('id', l.id).select().single(), 'снятие');
  await mustPass(A.client.from('listings').update({ status: 'active' }).eq('id', l.id).select().single(), 'возврат');
  eq(+sql(`select count(*) from saved_search_hits where search_id='${ssWideId}'`), before + 1,
     'снял-вернул задвоило совпадение');
});

await test('совпадение нельзя подделать с клиента', async () => {
  await mustFail(C.client.from('saved_search_hits').insert({
    search_id: ssNarrowId, listing_id: ssListingId, user_id: C.id, score: 1.0,
  }), 'ручная вставка совпадения');
  // и обнулить себе потолок уведомлений — тоже
  await mustFail(C.client.from('saved_search_hits').update({ notified_at: null })
    .eq('search_id', ssNarrowId), 'ручной сброс отметки доставки');
});

await test('чужие совпадения не видны', async () => {
  const d = await mustPass(B.client.from('saved_search_hits').select('*'), 'чтение совпадений');
  ok(d.every(h => h.user_id === B.id), 'видны чужие совпадения');
});

await test('бейдж «+N новых» считает сервер', async () => {
  const counts = await mustPass(C.client.rpc('rpc_saved_search_new_counts'), 'счётчики поисков');
  ok((counts?.[ssNarrowId] || 0) >= 1, 'по конкретному поиску нет новых');

  // открыли поиск → счётчик обнулился
  await mustPass(C.client.from('saved_searches').update({ last_seen_at: new Date().toISOString() })
    .eq('id', ssNarrowId), 'отметка просмотра');
  const after = await mustPass(C.client.rpc('rpc_saved_search_new_counts'), 'счётчики после просмотра');
  ok(!after?.[ssNarrowId], 'счётчик не обнулился после открытия поиска');
});

await test('гость счётчиков не получает и сводку не запускает', async () => {
  // Гостю обе функции просто не выданы (блок прав в 875): сохранённых поисков
  // у него нет, а сводка без сессии означает «разобрать всех» — это работа
  // расписания, не браузера. Клиент их без входа и не зовёт.
  await mustFail(guest.rpc('rpc_saved_search_new_counts'), 'счётчики гостю');
  await mustFail(guest.rpc('rpc_flush_saved_search_digest'), 'сводка от имени гостя');
});

await test('сводка забирает накопленное одним уведомлением', async () => {
  // Отматываем сутки: потолок «одно уведомление в сутки на поиск» тут не
  // проверяется, он уже проверен выше.
  sql(`update saved_search_hits set notified_at = null where search_id='${ssNarrowId}'`);
  sql(`update notifications set created_at = created_at - interval '2 days'
        where user_id='${C.id}' and kind='saved_search'`);

  const before = +sql(`select count(*) from notifications where user_id='${C.id}' and kind='saved_search'`);
  const sent = await mustPass(C.client.rpc('rpc_flush_saved_search_digest'), 'сводка');
  eq(sent, 1, 'сводка отправила не одно уведомление');
  eq(+sql(`select count(*) from notifications where user_id='${C.id}' and kind='saved_search'`), before + 1,
     'уведомление сводки не создалось');
  eq(+sql(`select count(*) from saved_search_hits where search_id='${ssNarrowId}' and notified_at is null`), 0,
     'часть пачки осталась неотправленной');
  eq(await mustPass(C.client.rpc('rpc_flush_saved_search_digest'), 'повторная сводка'), 0,
     'повторная сводка снова отправила');
});

await test('ночью совпадение копится, но не уведомляет', async () => {
  // Отдельный поиск: у SS_NARROW суточный потолок уже выбран, и «уведомления
  // нет» на нём доказывало бы потолок, а не тишину. Публикует B — у A свой
  // часовой потолок на объявления, и он тут почти выбран.
  const s = await mustPass(C.client.from('saved_searches').insert({
    user_id: C.id, name: 'ss-night-' + Math.random().toString(36).slice(2, 8),
    query: { cat: 'transport', sub: 'Легковые авто', city: 'Бишкек', priceMax: '2000000',
             attrs: { brand: 'Toyota', model: 'Camry' } },
  }).select().single(), 'ночной поиск');

  pinQuiet(true);
  try {
    const before = +sql(`select count(*) from notifications where user_id='${C.id}' and kind='saved_search'`);
    const l = await mustPass(B.client.from('listings').insert({
      ...baseListing({ title: 'Toyota Camry 70, 2021, серебро', price: 1700000 }), owner_id: B.id,
    }).select().single(), 'ночная публикация');

    eq(+sql(`select count(*) from saved_search_hits where search_id='${s.id}' and listing_id='${l.id}'`),
       1, 'ночью совпадение не записалось');
    eq(+sql(`select count(*) from notifications where user_id='${C.id}' and kind='saved_search'`), before,
       'ночью ушло уведомление');
    // Сводка ночью тоже молчит: она и существует ради того, чтобы дождаться утра.
    eq(await mustPass(C.client.rpc('rpc_flush_saved_search_digest'), 'сводка ночью'), 0,
       'сводка отправила ночью');
    eq(+sql(`select count(*) from saved_search_hits
              where search_id='${s.id}' and notified_at is null`), 1, 'ночное совпадение помечено доставленным');
  } finally {
    pinQuiet(false);
  }
});

await test('ночная тишина считается по Бишкеку', async () => {
  unpinQuiet();   // дальше время настоящее: проверяем сам расчёт окна
  eq(sql(`select bazar_quiet_hours('2026-08-13 21:00:00+00')`), 't', '03:00 по Бишкеку — тишина');
  eq(sql(`select bazar_quiet_hours('2026-08-14 03:30:00+00')`), 'f', '09:30 по Бишкеку — можно');
  eq(sql(`select bazar_quiet_hours('2026-08-14 16:30:00+00')`), 't', '22:30 по Бишкеку — тишина');
  eq(sql(`select pg_get_functiondef('public.bazar_quiet_hours(timestamptz)'::regprocedure)`),
     QUIET_DEF, 'исходное определение не вернулось на место');
});

/* ══════════════════════════ честная цена ══════════════════════════ */
group('Честная цена');

// Свой угол рынка: марка и модель, которых нет ни в сидах, ни в других
// группах. Иначе выборку двигали бы чужие Camry, и «медиана 1 175 000»
// держалась бы ровно до следующего теста.
const PB = 'Testo', PM = 'PriceProbe-' + Math.random().toString(36).slice(2, 8);
const PEERS = [1000000, 1050000, 1100000, 1150000, 1200000, 1250000, 1300000, 1400000];
const P_MEDIAN = 1175000, P_P10 = 1035000;

// Рынок засеваем через psql: у объявлений свой потолок «10 в час на человека»,
// и восемь фикстур съели бы его целиком. Правила показа проверяются ниже
// настоящим клиентом и гостем, а не этим сидом.
const seedPeer = (price, year) => sql(
  `insert into listings (owner_id, title, description, price, category, subcategory, city, condition, photos, attrs, status)
   values ('${A.id}', 'Testo PriceProbe ${year} за ${price}', 'Фикстура рынка', ${price},
           'transport', 'Легковые авто', 'Бишкек', 'used', array['a.jpg'],
           jsonb_build_object('brand','${PB}','model','${PM}','year','${year}'), 'active')`);

PEERS.forEach(p => seedPeer(p, 2020));

const draft = (price, attrs = { brand: PB, model: PM, year: '2020' }, sub = 'Легковые авто') =>
  mustPass(B.client.rpc('rpc_price_verdict_draft',
    { p_subcategory: sub, p_price: price, p_attrs: attrs }), 'вердикт для черновика');

await test('рынок считается по модели, а не по всей подкатегории', async () => {
  const st = await draft(P_MEDIAN);
  eq(st.n, PEERS.length, 'в выборку попали чужие объявления');
  eq(st.basis, 'model', 'сравнили не с моделью');
  eq(+st.median, P_MEDIAN, 'медиана');
  eq(+st.p10, P_P10, 'дешёвый край рынка');
});

await test('вердикт зависит от разброса и размера выборки', async () => {
  eq((await draft(P_MEDIAN)).verdict, 'fair', 'цена на медиане');
  // порог на восьми объявлениях — 40%/√8 = 14.1%, и дальше одного отклонения
  eq(+(await draft(P_MEDIAN)).threshold.toFixed(4), 0.1414, 'порог по размеру выборки');
  eq((await draft(1120000)).verdict, 'fair', '−5% при таком разбросе ещё не скидка');
  eq((await draft(1000000)).verdict, 'good', '−15% ниже рынка');
  eq((await draft(1400000)).verdict, 'high', '+19% выше рынка');
});

await test('приманку отличают от просто дешёвого', async () => {
  eq((await draft(600000)).verdict, 'low', 'вдвое ниже дешёвого края — не предупредили');
  // ровно та же цена в −49% от медианы, но выше p10·0.65 — это ещё не обман
  eq((await draft(700000)).verdict, 'good', 'честного продавца пометили обманщиком');
});

await test('год сужает круг сравнения', async () => {
  [380000, 400000, 420000, 440000, 460000, 480000].forEach(p => seedPeer(p, 2010));
  eq(+(await draft(P_MEDIAN)).median, P_MEDIAN, 'десятилетние машины попали в выборку свежих');
  const old = await draft(P_MEDIAN, { brand: PB, model: PM, year: '2010' });
  ok(+old.median < 500000, 'выборка по году не сузилась');
  eq(old.verdict, 'high', 'цена свежей машины за десятилетнюю — не «дорого»');
});

await test('узкий круг заменяется широким, а не складывается с ним', async () => {
  // Ровесников 2035 года всего трое — этого мало, сравнение уходит на круг по
  // модели. Он обязан заменить узкий: если круги сложить, три машины попадут
  // в выборку дважды, n завысится, а медиана уедет к ним.
  const YB = 'Testo', YM = 'YearProbe-' + Math.random().toString(36).slice(2, 8);
  const seed = (price, year) => sql(
    `insert into listings (owner_id, title, description, price, category, subcategory, city, condition, photos, attrs, status)
     values ('${A.id}', 'Testo YearProbe ${year}', 'Фикстура рынка', ${price},
             'transport', 'Легковые авто', 'Бишкек', 'used', array['a.jpg'],
             jsonb_build_object('brand','${YB}','model','${YM}','year','${year}'), 'active')`);
  [800000, 820000, 840000].forEach(p => seed(p, 2035));
  [300000, 320000, 340000, 360000, 380000, 400000].forEach(p => seed(p, 2005));

  const wide = await draft(500000, { brand: YB, model: YM, year: '2035' });
  eq(wide.n, 9, 'ровесники посчитаны дважды');
  eq(+wide.median, 380000, 'медиана уехала к задвоенным');

  // а когда ровесников хватает, широкий круг не подмешивается
  const narrow = await draft(500000, { brand: YB, model: YM, year: '2005' });
  eq(narrow.n, 6, 'к ровесникам подмешался круг по модели');
  eq(+narrow.median, 350000, 'медиана ровесников');
});

await test('на пустом рынке вердикта нет', async () => {
  const st = await draft(1000000, {}, 'Такой подкатегории нет');
  eq(st.n, 0, 'выборка не пуста');
  eq(st.verdict, null, 'вердикт выдали без данных');
});

let probeId = null;
await test('вердикт по объявлению не считает его самого', async () => {
  const l = await mustPass(B.client.from('listings').insert({
    ...baseListing({ title: 'Testo PriceProbe 2020 — продаю', price: 1000000,
                     attrs: { brand: PB, model: PM, year: '2020' } }), owner_id: B.id,
  }).select().single(), 'публикация объявления для вердикта');
  probeId = l.id;

  const st = await mustPass(B.client.rpc('rpc_price_verdict', { p_listing_id: probeId }),
    'вердикт по объявлению');
  eq(st.n, PEERS.length, 'себя посчитали в собственную выборку');
  eq(st.verdict, 'good', 'вердикт по объявлению');
});

await test('гость видит вердикт, но не сырые цены', async () => {
  const st = await mustPass(guest.rpc('rpc_price_verdict', { p_listing_id: probeId }),
    'вердикт гостю');
  eq(st.n, PEERS.length, 'гостю посчитали другой рынок');
  // Из сырой выборки собирается прайс-лист конкурента строка за строкой.
  await mustFail(guest.rpc('bazar_price_peers',
    { p_subcategory: 'Легковые авто', p_brand: PB, p_model: PM, p_year: null, p_exclude: null }),
    'выборка цен гостю');
  await mustFail(B.client.rpc('bazar_price_peers',
    { p_subcategory: 'Легковые авто', p_brand: PB, p_model: PM, p_year: null, p_exclude: null }),
    'выборка цен пользователю');
});

await test('по снятому и чужому черновику вердикта нет', async () => {
  await mustPass(B.client.from('listings').update({ status: 'archived' }).eq('id', probeId),
    'снятие объявления');
  const st = await mustPass(guest.rpc('rpc_price_verdict', { p_listing_id: probeId }),
    'вердикт по снятому');
  eq(st.verdict, null, 'по снятому объявлению отдали вердикт');
  eq(st.n, 0, 'по снятому объявлению отдали размер выборки');

  // «нашлось / не нашлось» не должно отличаться — иначе по вердикту можно
  // перебирать чужие черновики
  const ghost = await mustPass(guest.rpc('rpc_price_verdict',
    { p_listing_id: '00000000-0000-0000-0000-000000000000' }), 'вердикт по несуществующему');
  eq(ghost, st, 'несуществующее объявление отличается от снятого');
});

await test('черновики и снятое рынок не двигают', async () => {
  const before = (await draft(P_MEDIAN)).n;
  sql(`insert into listings (owner_id, title, description, price, category, subcategory, city,
                             condition, photos, attrs, status)
       values ('${A.id}', 'Testo PriceProbe черновик', 'Фикстура', 111,
               'transport', 'Легковые авто', 'Бишкек', 'used', array['a.jpg'],
               jsonb_build_object('brand','${PB}','model','${PM}','year','2020'), 'draft')`);
  eq((await draft(P_MEDIAN)).n, before, 'черновик попал в рынок');
  eq(+(await draft(P_MEDIAN)).median, P_MEDIAN, 'черновик сдвинул медиану');
});

/* ══════════════════════════ автоответ продавца ══════════════════════════ */
group('Автоответ продавца');

// Свои продавец и покупатель: правила действуют на все чаты человека, и
// подсаженные продавцу A они поменяли бы поведение группы «Чаты».
const S = await makeUser('autoseller');
const Q = await makeUser('autobuyer');

const newChat = async ref => (await mustPass(Q.client.from('chats').insert({
  buyer_id: Q.id, seller_id: S.id, listing_ref: ref, listing_title: 'Товар',
}).select().single(), 'создание чата ' + ref)).id;

const ask = (chat, text) => mustPass(Q.client.from('messages')
  .insert({ chat_id: chat, sender_id: Q.id, text }).select().single(), 'вопрос «' + text + '»');

// Список тем — по алфавиту, а не по времени: несколько вставок укладываются в
// одну секунду, и сортировка по created_at выродилась бы в сортировку по
// случайному uuid. Повтор темы такой список всё равно покажет.
const autos = chat => sql(`select coalesce(string_agg(auto_topic, ',' order by auto_topic), '')
                             from messages where chat_id = '${chat}' and is_auto`);

await test('правила видит и заводит только их владелец', async () => {
  await mustPass(S.client.from('auto_reply_rules').insert([
    { user_id: S.id, topic: 'available', reply: 'Да, ещё продаю' },
    { user_id: S.id, topic: 'price', reply: 'Цена в объявлении, 45 000 сом' },
    { user_id: S.id, topic: 'where', reply: 'Бишкек, 6 мкр, после 18:00' },
    { user_id: S.id, topic: 'bargain', reply: 'Небольшой торг при осмотре' },
  ]).select(), 'продавец заводит правила');

  eq((await mustPass(S.client.from('auto_reply_rules').select('*'), 'свои правила')).length, 4,
    'продавец не видит собственные правила');
  eq((await mustPass(C.client.from('auto_reply_rules').select('*'), 'чужие правила')).length, 0,
    'правила продавца видны постороннему');
  await mustFail(C.client.from('auto_reply_rules')
    .insert({ user_id: S.id, topic: 'delivery', reply: 'подделка' }).select().single(),
    'правило от чужого имени');
});

await test('ответ уходит сразу, подписан и не гасит непрочитанное', async () => {
  const c = await newChat('auto-1');
  await ask(c, 'Здравствуйте, актуально?');

  const msgs = await mustPass(Q.client.from('messages').select('*').eq('chat_id', c), 'чтение диалога');
  eq(msgs.length, 2, 'в диалоге не два сообщения');
  const a = msgs.find(m => m.is_auto);
  ok(a, 'автоответ не пришёл');
  eq(a.text, 'Да, ещё продаю', 'ответили не по теме');
  eq(a.sender_id, S.id, 'автоответ отправлен не от имени продавца');
  eq(a.auto_topic, 'available', 'тема не записана');

  // Вставка от имени продавца сдвинула бы ему отметку прочтения — и вопрос
  // покупателя исчез бы из непрочитанного потому, что ответил бот.
  eq(sql(`select coalesce(seller_last_read_at::text, '') from chats where id = '${c}'`), '',
    'автоответ погасил продавцу непрочитанное');
});

await test('в вопросе выигрывает конкретный признак', async () => {
  const c = await newChat('auto-2');
  await ask(c, 'Уступите в цене?');
  eq(autos(c), 'bargain', 'торг разобрали как вопрос о цене');

  const d = await newChat('auto-3');
  await ask(d, 'Сколько стоит доставка?');
  eq(autos(d), '', 'на вопрос о доставке ответили ценой (правила доставки нет)');
});

await test('одна тема — один ответ, не больше трёх на диалог', async () => {
  const c = await newChat('auto-4');
  await ask(c, 'Актуально?');
  await ask(c, 'Ещё актуально??');
  eq(autos(c), 'available', 'на ту же тему ответили дважды');

  await ask(c, 'Сколько стоит?');
  await ask(c, 'Где посмотреть?');
  eq(autos(c), 'available,price,where', 'три темы не отработали');

  await ask(c, 'Торг будет?');
  eq(autos(c), 'available,price,where', 'потолок в три автоответа не сработал');
});

await test('пока продавец отвечает сам, бот молчит', async () => {
  const c = await newChat('auto-5');
  await mustPass(S.client.from('messages')
    .insert({ chat_id: c, sender_id: S.id, text: 'Здравствуйте, слушаю' }).select().single(),
    'продавец пишет сам');
  await ask(c, 'Актуально?');
  eq(autos(c), '', 'бот перебил живого продавца');
});

await test('приветствие только на первое сообщение', async () => {
  await mustPass(S.client.from('auto_reply_rules')
    .insert({ user_id: S.id, topic: 'greeting', reply: 'Здравствуйте! Отвечу в течение часа' }).select(),
    'правило приветствия');

  const c = await newChat('auto-6');
  await ask(c, 'Добрый день');
  eq(autos(c), 'greeting', 'на первое нераспознанное не поздоровались');

  const d = await newChat('auto-7');
  await ask(d, 'Актуально?');
  await ask(d, 'Ясно, спасибо');
  eq(autos(d), 'available', 'поздоровались посреди разговора');
});

await test('выключенное правило молчит, но текст остаётся', async () => {
  await mustPass(S.client.from('auto_reply_rules').update({ enabled: false })
    .eq('user_id', S.id).eq('topic', 'available').select(), 'выключение правила');

  const c = await newChat('auto-8');
  await ask(c, 'Актуально?');
  eq(autos(c), '', 'выключенное правило сработало');

  const r = await mustPass(S.client.from('auto_reply_rules').select('reply')
    .eq('topic', 'available').single(), 'чтение выключенного правила');
  eq(r.reply, 'Да, ещё продаю', 'выключение стёрло текст ответа');

  await mustPass(S.client.from('auto_reply_rules').update({ enabled: true })
    .eq('user_id', S.id).eq('topic', 'available').select(), 'включение обратно');
});

await test('автоответ не тратит почасовую квоту покупателя', async () => {
  const spent = () => +sql(`select coalesce(sum(count), 0) from rate_limits
                              where subject = 'message_send' and actor = '${Q.id}'`);
  const before = spent();
  const c = await newChat('auto-9');
  await ask(c, 'Актуально?');
  await ask(c, 'Где посмотреть?');
  eq(autos(c), 'available,where', 'автоответы не пришли');
  // Лимит считается по auth.uid(), а это покупатель: без исключения чужой бот
  // отъедал бы его квоту и в пределе запретил бы ему писать.
  eq(spent() - before, 2, 'автоответ съел квоту покупателя');
});

/* ══════════════════════════ итог ══════════════════════════ */
process.exit(summary() ? 1 : 0);
