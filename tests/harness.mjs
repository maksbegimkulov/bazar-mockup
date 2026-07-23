/* Обвязка тестов бэкенда BAZAR.

   Бьём по локальному стеку Supabase (supabase start). Ключи ниже — стандартные
   ключи локальной разработки, одинаковые у всех, кто ставит Supabase CLI;
   секретами они не являются и в облаке не работают. */

import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath } from 'node:url';

/* ---------- клиентский разбор запроса ----------
   Транслитерация «камри»→Toyota Camry — работа клиентского NLU (209k алиасов),
   а не серверного полнотекста: дублировать её в SQL значило бы поддерживать две
   реализации. Поэтому поиск в тестах идёт ровно тем же путём, что и браузер:
   сырой текст → parseSearchQuery → фильтры → серверный rpc_search_listings. */
// fileURLToPath, не .pathname: путь с кириллицей и пробелом иначе приходит
// percent-encoded («%D1%80…»), и readFileSync его не находит
const _CLROOT = fileURLToPath(new URL('..', import.meta.url));
const _cctx = createContext({
  console, Math, Date, JSON, Object, Array, String, Number, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Map, Set, RegExp,
});
for (const f of ['js/catalog/auto-world.js', 'js/catalog/auto-china.js',
  'js/catalog/tech-mobile.js', 'js/catalog/tech-compute.js', 'js/catalog/index.js',
  'js/nlu.js', 'js/search.js']) {
  runInContext(readFileSync(_CLROOT + f, 'utf8'), _cctx, { filename: f });
}
export function clientParse(text) {
  return runInContext(`parseSearchQuery(${JSON.stringify(text)})`, _cctx);
}

/* Тот же маппинг фильтр→RPC, что в js/api.js BZ.search — единый путь.
   Возвращает массив строк public_listings. */
export async function serverSearch(client, textOrFilters, cursor = null, limit = 24) {
  const parsed = typeof textOrFilters === 'string' ? clientParse(textOrFilters) : { q: '', filters: textOrFilters };
  const f = parsed.filters || {};
  const attrs = {};
  for (const [k, v] of Object.entries(f.attrs || {})) if (v !== '' && v != null) attrs[k] = v;
  const { data, error } = await client.rpc('rpc_search_listings', {
    p_query: (parsed.q && parsed.q.trim()) || null,
    p_category: f.cat || null,
    p_subcategory: f.sub || null,
    p_city: f.city && f.city !== 'all' ? f.city : null,
    p_price_min: f.priceMin != null && f.priceMin !== '' ? Number(f.priceMin) : null,
    p_price_max: f.priceMax != null && f.priceMax !== '' ? Number(f.priceMax) : null,
    p_condition: f.condition && f.condition !== 'any' ? f.condition : null,
    p_seller_kind: f.sellerType && f.sellerType !== 'any' ? f.sellerType : null,
    p_attrs: attrs,
    p_sort: f.sort || 'date',
    p_cursor: cursor,
    p_limit: limit,
  });
  if (error) throw new Error('serverSearch: ' + error.message);
  return Array.isArray(data) ? data : (data?.rows || []);
}

export const API = process.env.BAZAR_API || 'http://127.0.0.1:54321';
export const ANON = process.env.BAZAR_ANON
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
export const SERVICE = process.env.BAZAR_SERVICE
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const DB_CONTAINER = 'supabase_db_bazar-mockup';

/* прямой SQL мимо API — для проверки того, что через API не видно */
export function sql(q) {
  return execFileSync('docker', ['exec', DB_CONTAINER, 'psql', '-U', 'postgres',
    '-d', 'postgres', '-tAX', '-c', q], { encoding: 'utf8' }).trim();
}

export const anon = () => createClient(API, ANON, { auth: { persistSession: false } });
export const admin = () => createClient(API, SERVICE, { auth: { persistSession: false } });

/* новый залогиненный пользователь со своим клиентом */
export async function makeUser(tag) {
  const email = `${tag}-${Math.random().toString(36).slice(2, 10)}@test.local`;
  const password = 'test-password-12345';
  const a = admin();
  const { data, error } = await a.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: 'Тест ' + tag },
  });
  if (error) throw new Error('createUser: ' + error.message);
  const c = createClient(API, ANON, { auth: { persistSession: false } });
  const { error: e2 } = await c.auth.signInWithPassword({ email, password });
  if (e2) throw new Error('signIn: ' + e2.message);
  return { id: data.user.id, email, client: c };
}

/* ---------- микро-фреймворк ---------- */

const results = [];
let currentGroup = '';

export function group(name) { currentGroup = name; }

export async function test(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ group: currentGroup, name, ok: true, ms: Date.now() - started });
    process.stdout.write('  ✓ ' + name + '\n');
  } catch (e) {
    results.push({ group: currentGroup, name, ok: false, ms: Date.now() - started, err: e.message });
    process.stdout.write('  ✗ ' + name + '\n      ' + String(e.message).split('\n')[0] + '\n');
  }
}

export function eq(actual, expected, what) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${what || 'значения не совпали'}: получили ${a}, ждали ${b}`);
}
export function ok(cond, what) { if (!cond) throw new Error(what || 'условие не выполнено'); }
export function notOk(cond, what) { if (cond) throw new Error(what || 'условие должно быть ложным'); }

/* Ждём ошибку. Без этого «защита работает» проверить нельзя:
   успешный запрос там, где должно быть отказано, — это провал теста. */
export async function mustFail(promiseLike, what) {
  const { data, error } = await promiseLike;
  if (!error) throw new Error((what || 'ожидали отказ') + ', но запрос прошёл: ' + JSON.stringify(data).slice(0, 160));
  return error;
}
export async function mustPass(promiseLike, what) {
  const { data, error } = await promiseLike;
  if (error) throw new Error((what || 'ожидали успех') + ', но получили: ' + error.message);
  return data;
}

export function summary() {
  const bad = results.filter(r => !r.ok);
  const byGroup = {};
  for (const r of results) (byGroup[r.group] ||= []).push(r);
  console.log('\n' + '─'.repeat(60));
  for (const [g, rs] of Object.entries(byGroup)) {
    const f = rs.filter(r => !r.ok).length;
    console.log(`${f ? '✗' : '✓'} ${g}: ${rs.length - f}/${rs.length}`);
  }
  console.log('─'.repeat(60));
  console.log(`ИТОГО: ${results.length - bad.length}/${results.length} прошло`);
  if (bad.length) {
    console.log('\nПРОВАЛЫ:');
    for (const r of bad) console.log(`  [${r.group}] ${r.name}\n    ${r.err}`);
  }
  return bad.length;
}
