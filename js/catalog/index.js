/* ============================================================
   Сборка единого справочника из файлов каталога.
   Грузится ПОСЛЕ всех js/catalog/*.js и ПЕРЕД nlu.js / generate.js.

   Смысл: справочники физически разнесены по файлам (мировые авто,
   китайские авто, мобильная и компьютерная техника), а приложение
   работает с одним объектом CATALOG. Добавить новый файл = дописать
   его сюда, остальной код не меняется.
   ============================================================ */

const _cw = typeof AUTO_WORLD !== 'undefined' ? AUTO_WORLD : [];
const _cw2 = typeof AUTO_WORLD2 !== 'undefined' ? AUTO_WORLD2 : [];
const _cc = typeof AUTO_CHINA !== 'undefined' ? AUTO_CHINA : [];

const _tm = typeof TECH_MOBILE !== 'undefined' ? TECH_MOBILE : {};
const _tm2 = typeof TECH_MOBILE2 !== 'undefined' ? TECH_MOBILE2 : {};
const _tc = typeof TECH_COMPUTE !== 'undefined' ? TECH_COMPUTE : {};
const _tc2 = typeof TECH_COMPUTE2 !== 'undefined' ? TECH_COMPUTE2 : {};

const _merge = (...objs) => {
  const out = {};
  for (const o of objs) {
    for (const k of Object.keys(o || {})) out[k] = (out[k] || []).concat(o[k] || []);
  }
  return out;
};

const CATALOG = {
  cars: _cw.concat(_cw2).concat(_cc),
  carsWorld: _cw.concat(_cw2),
  carsChina: _cc,
  tech: _merge(_tm, _tm2, _tc, _tc2), // phones/tablets/watches/laptops/desktops/tv/consoles/audio/cameras
};

/* какая ветка каталога отвечает за подкатегорию приложения */
const CATALOG_SUB_MAP = {
  'Легковые авто': { branch: 'cars', cat: 'transport' },
  'Телефоны': { branch: 'phones', cat: 'electronics' },
  'Планшеты': { branch: 'tablets', cat: 'electronics' },
  'Ноутбуки': { branch: 'laptops', cat: 'electronics', also: ['desktops'] },
  'ТВ и аудио': { branch: 'tv', cat: 'electronics', also: ['audio', 'consoles'] },
  'Фото и видео': { branch: 'cameras', cat: 'electronics' },
  'Аксессуары': { branch: 'watches', cat: 'fashion' },
};

/* бренды для подкатегории (для каскадных фильтров марка → модель) */
function catalogBrands(sub) {
  const map = CATALOG_SUB_MAP[sub];
  if (!map) return [];
  if (map.branch === 'cars') return CATALOG.cars;
  const groups = [map.branch].concat(map.also || []);
  const out = [];
  for (const g of groups) for (const b of CATALOG.tech[g] || []) out.push(b);
  // склеиваем одинаковые бренды из разных групп (Apple в laptops и desktops)
  const byName = new Map();
  for (const b of out) {
    const key = b.brand || b.name;
    if (!byName.has(key)) byName.set(key, { ...b, brand: key, name: key, models: [...(b.models || [])] });
    else byName.get(key).models.push(...(b.models || []));
  }
  return [...byName.values()];
}

/* модели выбранного бренда внутри подкатегории */
function catalogModels(sub, brandName) {
  const b = catalogBrands(sub).find(x => (x.brand || x.name) === brandName);
  return b ? (b.models || []) : [];
}

/* поколения выбранной модели (только авто) */
function catalogGens(sub, brandName, modelName) {
  const m = catalogModels(sub, brandName).find(x => x.name === modelName);
  return m ? (m.gens || []) : [];
}

/* популярные бренды подкатегории: сначала помеченные popular, затем остальные */
function catalogPopularBrands(sub, limit = 12) {
  const all = catalogBrands(sub);
  const pop = all.filter(b => b.popular);
  return (pop.length ? pop : all).slice(0, limit).map(b => b.brand || b.name);
}

/* популярные модели подкатегории (для быстрых кнопок «часто ищут») */
function catalogPopularModels(sub, limit = 12) {
  const out = [];
  for (const b of catalogBrands(sub)) {
    for (const m of b.models || []) {
      if (m.popular) out.push({ brand: b.brand || b.name, model: m.name });
      if (out.length >= limit * 3) break;
    }
  }
  return out.slice(0, limit);
}
