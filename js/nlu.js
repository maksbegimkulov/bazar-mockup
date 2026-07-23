/* ============================================================
   NLU-ядро умного поиска BAZAR.
   Грузится ПЕРЕД search.js. Ничего не рендерит — только разбор текста.

   Задача: понять живой запрос («айфон эйр», «iphone17promax», «fqajy»,
   «бмв пятерка 2020», «телефон до 50000 с хорошей камерой», «не самсунг»)
   и вытащить из него бренд/модель/поколение + числовые параметры.

   ВАЖНО (грабли проекта): \b и \w в JS не видят кириллицу → границы слов
   только через пробелы. Lookbehind НЕ используем — старый iOS Safari падает.
   ============================================================ */

/* ---------- 1. Раскладка клавиатуры: «fqajy» → «айфон» ---------- */
const KB_EN2RU = {
  q: 'й', w: 'ц', e: 'у', r: 'к', t: 'е', y: 'н', u: 'г', i: 'ш', o: 'щ', p: 'з', '[': 'х', ']': 'ъ',
  a: 'ф', s: 'ы', d: 'в', f: 'а', g: 'п', h: 'р', j: 'о', k: 'л', l: 'д', ';': 'ж', "'": 'э',
  z: 'я', x: 'ч', c: 'с', v: 'м', b: 'и', n: 'т', m: 'ь', ',': 'б', '.': 'ю',
};
const KB_RU2EN = Object.fromEntries(Object.entries(KB_EN2RU).map(([k, v]) => [v, k]));

function kbToRu(s) { return s.replace(/[a-z[\];',.]/g, c => KB_EN2RU[c] || c); }
function kbToEn(s) { return s.replace(/[а-яё]/g, c => KB_RU2EN[c] || c); }

/* ---------- 2. Транслитерация и фонетический «скелет» ---------- */
const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
};
function translit(s) { return s.replace(/[а-яё]/g, c => (c in TRANSLIT ? TRANSLIT[c] : c)); }

/* Единый «скелет» слова: латиница + схлопнутые звуковые варианты.
   «айфон»/«ayfon»/«iphone» → близкие формы; «камри»/«camry» → «kamri». */
function phonetic(s) {
  let x = translit(String(s).toLowerCase());
  x = x
    .replace(/ph/g, 'f').replace(/kh/g, 'h').replace(/ck/g, 'k').replace(/qu/g, 'kv')
    .replace(/sch/g, 'sh').replace(/tz/g, 'c').replace(/ts/g, 'c')
    .replace(/[yj]/g, 'i').replace(/w/g, 'v').replace(/q/g, 'k').replace(/x/g, 'ks')
    .replace(/ee/g, 'i').replace(/oo/g, 'u').replace(/ou/g, 'u')
    // схлопываем повторы ТОЛЬКО у букв. У цифр — нельзя: иначе «50000» → «50»,
    // и цена в запросе начинала матчиться как поколение (Camry XV50)
    .replace(/([^\d])\1+/g, '$1');
  return x;
}

/* ---------- 3. Индекс алиасов из каталогов ---------- */
/* Ключ → { kind:'brand'|'model', cat, sub, brand, model, gen, tokens }
   Держим три формы ключа: как есть, без пробелов, фонетическую. */
const ALIAS_INDEX = new Map();
const ALIAS_KEYS = [];        // отсортированы по длине (сначала длинные)
let _aliasBuilt = false;

function _idxAdd(key, payload) {
  const k = String(key).toLowerCase().trim().replace(/\s+/g, ' ');
  if (k.length < 2) return;
  if (!ALIAS_INDEX.has(k)) { ALIAS_INDEX.set(k, payload); ALIAS_KEYS.push(k); }
  const glued = k.replace(/\s+/g, '');
  if (glued !== k && !ALIAS_INDEX.has(glued)) { ALIAS_INDEX.set(glued, payload); ALIAS_KEYS.push(glued); }
  // фонетика — мост кириллица↔латиница: «айфон 15 про» и «айфон 15 pro»
  // сводятся к одному ключу «aifon15pro». Строим её для ВСЕХ алиасов, включая
  // цифровые: phonetic больше не схлопывает повторы у цифр, так что коллизии
  // цены с поколением («50000»→«50») не будет.
  const ph = phonetic(glued);
  if (ph && ph !== glued && !ALIAS_INDEX.has(ph)) { ALIAS_INDEX.set(ph, payload); ALIAS_KEYS.push(ph); }
}

/* строим один раз при первом обращении — каталоги к этому моменту загружены */
function buildAliasIndex() {
  if (_aliasBuilt) return;
  _aliasBuilt = true;

  const autoBrands = []
    .concat(typeof AUTO_WORLD !== 'undefined' ? AUTO_WORLD : [])
    .concat(typeof AUTO_CHINA !== 'undefined' ? AUTO_CHINA : []);

  for (const b of autoBrands) {
    const brandPayload = { kind: 'brand', cat: 'transport', sub: 'Легковые авто', brand: b.name };
    [b.name, b.ru, ...(b.aliases || [])].filter(Boolean).forEach(a => _idxAdd(a, brandPayload));
    for (const m of b.models || []) {
      const mp = { kind: 'model', cat: 'transport', sub: 'Легковые авто', brand: b.name, model: m.name };
      [m.name, m.ru, ...(m.aliases || [])].filter(Boolean).forEach(a => _idxAdd(a, mp));
      // «тойота камри», «bmw x5» — бренд+модель вместе
      [b.name, b.ru, ...(b.aliases || [])].filter(Boolean).forEach(ba =>
        [m.name, m.ru, ...(m.aliases || [])].filter(Boolean).forEach(ma => _idxAdd(ba + ' ' + ma, mp)));
      for (const g of m.gens || []) {
        const gp = { ...mp, gen: g.name, years: g.years };
        [g.name, g.ru].filter(Boolean).forEach(a => {
          _idxAdd(a, gp);
          // «камри 70» и «тойота камри 70» — оба варианта живого запроса
          [m.name, m.ru, ...(m.aliases || [])].filter(Boolean).forEach(ma => {
            _idxAdd(ma + ' ' + a, gp);
            [b.name, b.ru, ...(b.aliases || [])].filter(Boolean).forEach(ba => _idxAdd(ba + ' ' + ma + ' ' + a, gp));
          });
        });
      }
    }
  }

  const techGroups = [];
  if (typeof TECH_MOBILE !== 'undefined') {
    techGroups.push(['electronics', 'Телефоны', TECH_MOBILE.phones]);
    techGroups.push(['electronics', 'Планшеты', TECH_MOBILE.tablets]);
    techGroups.push(['fashion', 'Аксессуары', TECH_MOBILE.watches]);
  }
  if (typeof TECH_COMPUTE !== 'undefined') {
    techGroups.push(['electronics', 'Ноутбуки', TECH_COMPUTE.laptops]);
    techGroups.push(['electronics', 'Ноутбуки', TECH_COMPUTE.desktops]);
    techGroups.push(['electronics', 'ТВ и аудио', TECH_COMPUTE.tv]);
    techGroups.push(['electronics', 'ТВ и аудио', TECH_COMPUTE.audio]);
    techGroups.push(['electronics', 'Фото и видео', TECH_COMPUTE.cameras]);
    techGroups.push(['electronics', null, TECH_COMPUTE.consoles]);
  }
  for (const [cat, sub, brands] of techGroups) {
    for (const b of brands || []) {
      const bp = { kind: 'brand', cat, sub, brand: b.brand };
      [b.brand, b.ru, ...(b.aliases || [])].filter(Boolean).forEach(a => _idxAdd(a, bp));
      for (const m of b.models || []) {
        const mp = { kind: 'model', cat, sub, brand: b.brand, model: m.name };
        [m.name, m.ru, ...(m.aliases || [])].filter(Boolean).forEach(a => _idxAdd(a, mp));
        [b.brand, b.ru, ...(b.aliases || [])].filter(Boolean).forEach(ba =>
          [m.name, m.ru, ...(m.aliases || [])].filter(Boolean).forEach(ma => _idxAdd(ba + ' ' + ma, mp)));
      }
    }
  }

  ALIAS_KEYS.sort((a, b) => b.length - a.length); // длинные совпадения важнее
}

/* ---------- 4. Числовые параметры из живого текста ---------- */
/* Возвращает { attrs:{...}, rest:'остаток строки' } */
function extractSpecs(sNorm) {
  let s = ' ' + sNorm + ' ';
  const attrs = {};
  const eat = re => { const m = s.match(re); if (m) { s = s.replace(m[0], ' '); } return m; };

  // ОЗУ ПЕРВЫМ: «32 гб оперативки» — это ОЗУ, а не встроенная память
  let m = eat(/ (\d{1,3})\s*(?:гб|gb)?\s*(?:озу|оперативк[а-я]*|ram|оперативной)(?= )/);
  if (m) attrs.ram = String(+m[1]);

  // объём встроенной памяти: «256 гб», «512gb», «1 тб»
  m = eat(/ (\d{2,4})\s*(?:гб|gb|g)(?= )/);
  if (m) attrs.storage = String(+m[1]);
  else { m = eat(/ (\d)\s*(?:тб|tb)(?= )/); if (m) attrs.storage = String(+m[1] * 1024); }

  // диагональ: «12 дюймов», «55"», «13.3 дюйма»
  m = eat(/ (\d{1,3}(?:[.,]\d)?)\s*(?:дюйм[а-я]*|inch|")(?= )/);
  if (m) attrs.screen = m[1].replace(',', '.');

  // батарея iPhone: «батарея от 90», «акб 87%», «от 90 процентов»
  m = eat(/ (?:батаре[а-я]*|акб|аккум[а-я]*|battery)\s*(?:от\s*)?(\d{2,3})\s*%?(?= )/)
   || eat(/ от\s*(\d{2,3})\s*(?:%|процент[а-я]*)(?= )/);
  if (m) attrs.batteryMin = String(+m[1]);

  // видеокарта: «rtx 4070», «gtx1660», «rx 6600»
  m = eat(/ (rtx|gtx|rx)\s*(\d{3,4})\s*(ti|super|xt)?(?= )/);
  if (m) attrs.gpu = (m[1] + ' ' + m[2] + (m[3] ? ' ' + m[3] : '')).toUpperCase();

  // процессор: «i7», «ryzen 7», «m2 pro», «snapdragon 8 gen 3»
  m = eat(/ (?:core\s*)?(i[3579])(?= )/);
  if (m) attrs.cpu = m[1].toUpperCase();
  if (!attrs.cpu) { m = eat(/ ryzen\s*([3579])(?= )/); if (m) attrs.cpu = 'Ryzen ' + m[1]; }
  if (!attrs.cpu) {
    m = eat(/ (m[1-4])\s*(pro|max|ultra)?(?= )/);
    if (m) attrs.cpu = ('Apple ' + m[1].toUpperCase() + (m[2] ? ' ' + m[2] : '')).trim();
  }

  // пробег: «до 100 тыс км», «пробег 80000»
  m = eat(/ (?:пробег[а-я]*\s*)?(?:до\s*)?(\d{1,3})\s*(?:тыс[а-я]*)\s*км(?= )/);
  if (m) attrs.mileageMax = String(+m[1] * 1000);
  else { m = eat(/ (?:пробег[а-я]*\s*)(\d{4,7})(?= )/); if (m) attrs.mileageMax = String(+m[1]); }

  // запас хода электромобиля: «запас хода от 500 км»
  m = eat(/ запас[а-я]*\s*хода\s*(?:от\s*)?(\d{3,4})(?:\s*км)?(?= )/);
  if (m) attrs.rangeKmMin = String(+m[1]);

  // год / диапазон лет: «2020», «2018-2022», «от 2019 года»
  m = eat(/ (?:от\s*)?((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2})(?= )/);
  if (m) { attrs.yearMin = m[1]; attrs.yearMax = m[2]; }
  else {
    m = eat(/ (?:от\s*)((?:19|20)\d{2})(?:\s*год[а-я]*)?(?= )/);
    if (m) attrs.yearMin = m[1];
    m = eat(/ ((?:19|20)\d{2})(?:\s*год[а-я]*)?(?= )/);
    if (m && !attrs.yearMin) { attrs.yearMin = String(+m[1] - 1); attrs.yearMax = String(+m[1] + 1); }
  }

  return { attrs, rest: s.trim().replace(/\s+/g, ' ') };
}

/* ---------- 4b. Смысловые признаки: «электромобиль», «китайский джип» ---------- */
/* Слова, за которыми стоит фильтр, а не просто текст поиска. */
const SEMANTIC_HINTS = [
  // [regex, что проставляем]
  [/ (?:электромобил|электрокар|электричк|электро)[а-я]*(?= )/, { cat: 'transport', sub: 'Легковые авто', attrs: { fuel: 'Электро' } }],
  [/ (?:гибрид)[а-я]*(?= )/, { cat: 'transport', sub: 'Легковые авто', attrs: { fuel: 'Гибрид' } }],
  [/ (?:внедорожник|джип|паркетник)[а-я]*(?= )/, { cat: 'transport', sub: 'Легковые авто', attrs: { body: 'Внедорожник' } }],
  [/ (?:кроссовер)[а-я]*(?= )/, { cat: 'transport', sub: 'Легковые авто', attrs: { body: 'Кроссовер' } }],
  [/ (?:седан)[а-я]*(?= )/, { cat: 'transport', sub: 'Легковые авто', attrs: { body: 'Седан' } }],
  [/ (?:хэтчбек|хетчбек)[а-я]*(?= )/, { cat: 'transport', sub: 'Легковые авто', attrs: { body: 'Хэтчбек' } }],
  [/ (?:универсал)[а-я]*(?= )/, { cat: 'transport', sub: 'Легковые авто', attrs: { body: 'Универсал' } }],
  [/ (?:минивэн|минивен)[а-я]*(?= )/, { cat: 'transport', sub: 'Легковые авто', attrs: { body: 'Минивэн' } }],
  [/ (?:пикап)[а-я]*(?= )/, { cat: 'transport', sub: 'Легковые авто', attrs: { body: 'Пикап' } }],
  [/ (?:китайск)[а-я]*(?= )/, { cat: 'transport', sub: 'Легковые авто', attrs: { country: 'cn' } }],
  [/ (?:полный привод|4wd|awd|4х4|4x4)(?= )/, { attrs: { drive: 'Полный' } }],
  [/ (?:механик|ручк)[а-я]*(?= )/, { attrs: { gearbox: 'Механика' } }],
  [/ (?:автомат)[а-я]*(?= )/, { attrs: { gearbox: 'Автомат' } }],
  [/ (?:вариатор)[а-я]*(?= )/, { attrs: { gearbox: 'Вариатор' } }],
  [/ (?:игров|гейминг)[а-я]*(?= )/, { attrs: { gaming: 'Игровой' } }],
  // только обиходные слова: «фолд»/«флип» — части названий моделей,
  // их должен ловить каталог, иначе «з фолд 7» уедет во все раскладушки
  [/ (?:раскладушк|складн)[а-я]*(?= )/, { cat: 'electronics', sub: 'Телефоны', attrs: { foldable: '1' } }],
];

function extractSemantic(sNorm) {
  let s = ' ' + sNorm + ' ';
  const out = { attrs: {} };
  for (const [re, payload] of SEMANTIC_HINTS) {
    if (re.test(s)) {
      if (payload.cat && !out.cat) { out.cat = payload.cat; out.sub = payload.sub; }
      Object.assign(out.attrs, payload.attrs || {});
      s = s.replace(new RegExp(re.source, 'g'), ' ');
    }
  }
  out.rest = s.trim().replace(/\s+/g, ' ');
  return out;
}

/* ---------- 5. Исключения: «не самсунг», «кроме айфона» ---------- */
function extractExclusions(sNorm) {
  let s = ' ' + sNorm + ' ';
  const out = [];
  const re = / (?:не|кроме|без|исключая)\s+([а-яa-z0-9]+(?:\s+[а-яa-z0-9]+)?)(?= )/g;
  let m;
  const hits = [];
  while ((m = re.exec(s)) !== null) hits.push(m);
  for (const h of hits) {
    const phrase = h[1].trim();
    // берём самое длинное известное совпадение внутри фразы
    const one = phrase.split(' ')[0];
    const hit = ALIAS_INDEX.get(phrase) || ALIAS_INDEX.get(one)
      || ALIAS_INDEX.get(phonetic(phrase.replace(/\s/g, ''))) || ALIAS_INDEX.get(phonetic(one));
    if (hit && (hit.brand || hit.model)) {
      out.push({ brand: hit.brand, model: hit.kind === 'model' ? hit.model : null, word: one });
      s = s.replace(h[0], ' ');
    }
  }
  return { exclude: out, rest: s.trim().replace(/\s+/g, ' ') };
}

/* ---------- 6. Матч бренда/модели по индексу алиасов ---------- */
/* Идём по n-граммам (до 4 слов), сначала длинные — «ли авто л9» бьёт «ли». */
function matchCatalog(sNorm) {
  buildAliasIndex();
  const words = sNorm.split(/\s+/).filter(Boolean);
  const used = new Array(words.length).fill(false);
  const hits = [];

  for (let n = Math.min(4, words.length); n >= 1; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      if (used.slice(i, i + n).some(Boolean)) continue;
      const phrase = words.slice(i, i + n).join(' ');
      const cands = [phrase, phrase.replace(/\s+/g, ''), phonetic(phrase.replace(/\s+/g, ''))];
      let hit = null;
      for (const c of cands) { if (ALIAS_INDEX.has(c)) { hit = ALIAS_INDEX.get(c); break; } }
      // одиночное короткое слово («ли», «м3») и голое число («50000», «2020»)
      // не берём: иначе цена и год превращаются в модель или поколение
      const bareNumber = n === 1 && /^\d+$/.test(phrase);
      if (hit && !bareNumber && !(n === 1 && phrase.length <= 2)) {
        hits.push(hit);
        for (let k = i; k < i + n; k++) used[k] = true;
      }
    }
  }
  const rest = words.filter((_, i) => !used[i]).join(' ');
  // приоритет: модель > поколение-бренд
  const model = hits.find(h => h.kind === 'model');
  const brand = hits.find(h => h.kind === 'brand');
  return { model: model || null, brand: brand || null, hits, rest };
}

/* ---------- 7. «Возможно, вы искали…» ---------- */
/* Если исходный запрос ничего не дал, а исправленный (раскладка/транслит)
   попал в каталог — вернём человекочитаемое предложение. */
function didYouMean(rawNorm) {
  buildAliasIndex();
  const variants = [];
  const kb = kbToRu(rawNorm);
  if (kb !== rawNorm) variants.push(kb);
  const ph = phonetic(rawNorm.replace(/\s+/g, ''));
  if (ph) variants.push(ph);
  for (const v of variants) {
    const m = matchCatalog(v);
    if (m.model) return { text: m.model.brand + ' ' + m.model.model, payload: m.model, via: v };
    if (m.brand) return { text: m.brand.brand, payload: m.brand, via: v };
  }
  return null;
}

/* ---------- 8. Главная точка входа ---------- */
/* Полный разбор живого запроса. Возвращает всё, что удалось понять. */
function nluParse(raw) {
  let s = String(raw || '').toLowerCase().replace(/ё/g, 'е').trim();
  s = s.replace(/[^a-zа-я0-9.,%"'\s+-]/g, ' ').replace(/\s+/g, ' ').trim();

  const ex = extractExclusions(s);
  const sem = extractSemantic(ex.rest);
  const sp = extractSpecs(sem.rest);
  const cat = matchCatalog(sp.rest);

  // если по латинице ничего не нашли — пробуем раскладку
  let fixed = null;
  if (!cat.model && !cat.brand && /[a-z]/.test(sp.rest)) {
    const ru = kbToRu(sp.rest);
    if (ru !== sp.rest) {
      const c2 = matchCatalog(ru);
      if (c2.model || c2.brand) { fixed = ru; Object.assign(cat, c2); }
    }
  }

  const attrs = Object.assign({}, sem.attrs, sp.attrs);
  let rest = cat.rest;

  // «s26 ultra 512» — голое число рядом с моделью техники = объём памяти,
  // но только если у модели действительно есть такая версия
  if (!attrs.storage && cat.model && cat.model.kind === 'model' && rest) {
    const num = rest.match(/(?:^| )(\d{2,4})(?: |$)/);
    if (num && [64, 128, 256, 512, 1024, 2048].includes(+num[1])) {
      attrs.storage = String(+num[1]);
      rest = rest.replace(num[0], ' ').trim();
    }
  }
  // поколение авто числом: «камри 70», если тройка не сматчилась целиком
  if (cat.model && cat.model.cat === 'transport' && !cat.model.gen && rest) {
    const g = rest.match(/(?:^| )(\d{2,3})(?: |$)/);
    if (g) {
      const key = (cat.model.model + ' ' + g[1]).toLowerCase();
      const hit = ALIAS_INDEX.get(key);
      if (hit && hit.gen) { cat.model = hit; rest = rest.replace(g[0], ' ').trim(); }
    }
  }

  return {
    exclude: ex.exclude,
    attrs,
    brand: cat.brand ? cat.brand.brand : (cat.model ? cat.model.brand : null),
    model: cat.model ? cat.model.model : null,
    gen: cat.model ? cat.model.gen || null : null,
    cat: (cat.model && cat.model.cat) || (cat.brand && cat.brand.cat) || sem.cat || null,
    sub: (cat.model && cat.model.sub) || (cat.brand && cat.brand.sub) || sem.sub || null,
    rest,
    layoutFixed: fixed,
  };
}
