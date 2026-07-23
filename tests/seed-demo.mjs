/* Переселение демо-каталога в базу.

   Зачем: серверный поиск бесполезен, пока объявления живут только в браузере.
   Заодно это единственный честный способ проверить, что индексы и пагинация
   держат нагрузку — на трёх строках это не проверяется.

   Все строки помечаются is_test_data, чтобы их можно было вычистить одной
   командой, когда пойдут настоящие объявления:
     delete from listings where is_test_data;

   Запуск:  node seed-demo.mjs [--limit N]
*/

import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { admin, sql, API, SERVICE } from './harness.mjs';
import { createClient } from '@supabase/supabase-js';

// fileURLToPath: путь с кириллицей/пробелом иначе приходит percent-encoded
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit');
  return i > -1 ? +process.argv[i + 1] : Infinity;
})();

/* ---------- 1. вытаскиваем каталог из браузерных файлов ---------- */

function loadBrowserData() {
  const files = [
    'js/catalog/auto-world.js', 'js/catalog/auto-china.js',
    'js/catalog/tech-mobile.js', 'js/catalog/tech-compute.js',
    'js/catalog/index.js', 'js/data.js', 'js/generate.js',
  ];
  const ctx = createContext({
    console, Math, Date, JSON, Object, Array, String, Number, Boolean,
    parseInt, parseFloat, isNaN, isFinite,
  });
  for (const f of files) {
    runInContext(readFileSync(ROOT + f, 'utf8'), ctx, { filename: f });
  }
  const grab = expr => runInContext(`(typeof ${expr} !== 'undefined') ? ${expr} : null`, ctx);
  // generate.js уже ДОПИСАЛ сгенерированные в LISTINGS при загрузке (6030 всего) —
  // повторно звать generateCatalogListings() значит задвоить 5428 строк.
  return { all: grab('LISTINGS') || [], cities: grab('CITIES') || [] };
}

const { all: allRaw, cities } = loadBrowserData();
const all = allRaw.slice(0, LIMIT === Infinity ? undefined : LIMIT);
console.log(`каталог: ${all.length} объявлений`);

/* ---------- 2. продавцы ---------- */

/* Демо-объявления принадлежат синтетическим продавцам: без владельца строка не
   пройдёт ни внешний ключ, ни политики. Берём немного (сорок) — этого хватает,
   чтобы фильтр «частные/бизнес» и рейтинги выглядели живыми. */
const SELLERS = 40;
const a = admin();

async function ensureSellers() {
  const existing = sql(`select count(*) from profiles where id in (
    select id from auth.users where email like 'demo-seller-%@bazar.local')`);
  if (+existing >= SELLERS) {
    const ids = sql(`select id from auth.users where email like 'demo-seller-%@bazar.local' order by email`)
      .split('\n').filter(Boolean);
    console.log(`продавцы уже есть: ${ids.length}`);
    return ids;
  }
  const ids = [];
  for (let i = 0; i < SELLERS; i++) {
    const email = `demo-seller-${String(i).padStart(3, '0')}@bazar.local`;
    const { data, error } = await a.auth.admin.createUser({
      email, password: 'demo-' + Math.random().toString(36).slice(2),
      email_confirm: true,
      user_metadata: { full_name: ['Азамат', 'Айбек', 'Нурлан', 'Гульнара', 'Бакыт', 'Эldar',
        'Салтанат', 'Тимур', 'Жамиля', 'Руслан'][i % 10] + ' ' + String.fromCharCode(1040 + (i % 32)) + '.' },
    });
    if (error && !/already/i.test(error.message)) throw error;
    if (data?.user) ids.push(data.user.id);
  }
  // часть продавцов делаем магазинами
  const idList = ids.map(x => `'${x}'`).join(',');
  if (idList) sql(`update profiles set kind='business' where id in (${idList}) and random() < 0.28`);
  console.log(`создано продавцов: ${ids.length}`);
  return ids;
}

const sellerIds = await ensureSellers();
if (!sellerIds.length) { console.error('нет продавцов — заливать не от кого'); process.exit(1); }

/* ---------- 3. заливка пачками ---------- */

const svc = createClient(API, SERVICE, { auth: { persistSession: false } });
const CONDITIONS = new Set(['new', 'used']);
const citySet = new Set(cities);

function toRow(l, i) {
  const owner = sellerIds[i % sellerIds.length];
  const hoursAgo = Number(l.postedHoursAgo) || 0;
  const created = new Date(Date.now() - hoursAgo * 3600e3).toISOString();
  return {
    owner_id: owner,
    title: String(l.title || '').slice(0, 120),
    description: String(l.description || '').slice(0, 5000),
    price: Math.max(0, Math.round(Number(l.price) || 0)),
    negotiable: !!l.negotiable,
    // floor у демо-строк оставляем только там, где он был — это витрина торга
    floor: l.floor > 0 && l.floor <= l.price ? l.floor : null,
    category: l.category,
    subcategory: l.subcategory,
    city: citySet.has(l.city) ? l.city : cities[0],
    district: l.district || null,
    condition: CONDITIONS.has(l.condition) ? l.condition : null,
    photos: [],                       // у демо-строк фото рисуются заглушкой
    attrs: l.attrs || {},
    views_count: Number(l.views) || 0,
    created_at: created,
    bumped_at: created,
    is_test_data: true,
  };
}

const BATCH = 500;
let done = 0, failed = 0;
const started = Date.now();

for (let i = 0; i < all.length; i += BATCH) {
  const chunk = all.slice(i, i + BATCH).map((l, j) => toRow(l, i + j));
  const { error } = await svc.from('listings').insert(chunk);
  if (error) {
    failed += chunk.length;
    console.error(`пачка ${i}..${i + chunk.length}: ${error.message}`);
    // одна плохая строка не должна ронять всю заливку — доливаем поштучно
    for (const row of chunk) {
      const { error: e2 } = await svc.from('listings').insert(row);
      if (!e2) { done++; failed--; }
      else if (failed < 6) console.error('  строка «' + row.title.slice(0, 40) + '»: ' + e2.message);
    }
  } else {
    done += chunk.length;
  }
  process.stdout.write(`\rзалито ${done}/${all.length}`);
}

const secs = ((Date.now() - started) / 1000).toFixed(1);
console.log(`\nготово за ${secs}с: ${done} строк, отказов ${failed}`);
console.log('в базе всего:', sql('select count(*) from listings'));
console.log('с поисковым вектором:', sql('select count(*) from listings where search_vector is not null'));
