/* ============================================================
   Генератор тестового каталога BAZAR.
   Грузится ПОСЛЕ js/catalog/* и ПЕРЕД data.js-потребителями.

   Принцип: объявления собираются ИЗ СПРАВОЧНИКОВ, а не случайно —
   модель принадлежит своей марке, год лежит внутри поколения, двигатель
   взят из реальных модификаций, память телефона — из существующих версий.
   Каждое объявление помечено is_test_data:true, чтобы после запуска
   отделить демо-данные от настоящих.
   ============================================================ */

const GEN_TARGET = {           // сколько объявлений хотим по разделам
  cars: 1600,
  phones: 850,
  tablets: 320,
  laptops: 520,
  tv: 240,
  audio: 200,
  consoles: 300,
  cameras: 180,
  watches: 160,
};

const GEN_COLORS_CAR = ['Чёрный', 'Белый', 'Серебристый', 'Серый', 'Синий', 'Красный', 'Зелёный', 'Коричневый', 'Бежевый'];
const GEN_INTERIOR = ['Чёрный', 'Бежевый', 'Серый', 'Коричневый'];
const GEN_CAR_EXTRA = [
  'Один хозяин по ПТС.', 'Обслужен по регламенту.', 'Родная краска.', 'Зимняя резина в подарок.',
  'Не бит, не крашен.', 'Вложений не требует.', 'Сел и поехал.', 'Возможен обмен с доплатой.',
  'Растаможен, учёт КР.', 'Полный пакет документов.', 'Салон чистый, некуренный.',
];
const GEN_TECH_EXTRA = [
  'Состояние отличное.', 'Полный комплект, коробка и документы.', 'Пользовался аккуратно, в чехле.',
  'Батарея держит весь день.', 'Никогда не вскрывался, не ремонтировался.', 'Есть чек из магазина.',
  'Экран без единой царапины.', 'Возможен небольшой торг при осмотре.', 'Отправлю в регионы.',
];

/* детерминированный ГСЧ — данные стабильны между перезагрузками */
function _genRnd(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateCatalogListings() {
  const rnd = _genRnd(20260722);
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const range = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const chance = p => rnd() < p;
  const round = (v, step) => Math.round(v / step) * step;
  const cities = typeof CITIES !== 'undefined' ? CITIES : ['Бишкек'];
  const districts = typeof BISHKEK_DISTRICTS !== 'undefined' ? BISHKEK_DISTRICTS : [];
  const sellers = typeof SELLER_NAMES !== 'undefined' ? SELLER_NAMES : ['Продавец'];
  const stores = typeof STORE_NAMES !== 'undefined' ? STORE_NAMES : ['Магазин'];
  const NOW_YEAR = 2026;
  const out = [];
  let id = 200000;

  /* общие поля объявления */
  const base = (catId, sub, title, price, opts = {}) => {
    id++;
    const isBusiness = chance(opts.bizChance != null ? opts.bizChance : 0.22);
    const city = chance(0.55) ? 'Бишкек' : pick(cities.slice(1));
    const negotiable = !price;
    const bargain = price > 5000 && chance(0.55);
    return {
      id: String(id),
      title,
      price: price || 0,
      priceSuffix: '',
      negotiable,
      floor: bargain ? round(price * (0.82 + rnd() * 0.1), 500) : 0,
      category: catId,
      subcategory: sub,
      city,
      district: city === 'Бишкек' && chance(0.7) ? pick(districts) : null,
      condition: opts.condition || null,
      description: opts.description || '',
      photoCount: chance(0.05) ? 0 : range(2, 6),
      photoSeed: id % 97,
      sellerName: isBusiness ? pick(stores) : pick(sellers),
      sellerType: isBusiness ? 'business' : 'private',
      sellerRating: Math.round((3.7 + rnd() * 1.3) * 10) / 10,
      sellerAds: range(1, isBusiness ? 140 : 12),
      sellerSinceYear: range(2018, 2026),
      postedHoursAgo: Math.floor(Math.pow(rnd(), 1.7) * 900),
      views: range(5, 5200),
      isVip: chance(0.06),
      isUrgent: chance(0.06),
      hasDelivery: opts.delivery != null ? opts.delivery : chance(0.3),
      phone: `+996 ${pick(['700', '555', '770', '709', '500', '999', '220', '312'])} ${range(100, 999)} ${range(100, 999)}`,
      attrs: opts.attrs || {},
      is_test_data: true,
    };
  };

  /* по одному объявлению на каждую модель каталога — гарантия того, что
     точный поиск конкретной модели всегда что-то находит */
  const _uniqModels = variants => {
    const seen = new Set(), out = [];
    for (const v of variants) {
      if (seen.has(v.m.name)) continue;
      seen.add(v.m.name); out.push(v);
    }
    return out;
  };

  const desc = (parts, extra) => {
    const set = new Set();
    const n = range(2, 4);
    while (set.size < n) set.add(pick(extra));
    return parts.concat([...set]).join(' ');
  };

  /* ---------------- АВТОМОБИЛИ ---------------- */
  const autoBrands = []
    .concat(typeof AUTO_WORLD !== 'undefined' ? AUTO_WORLD : [])
    .concat(typeof AUTO_CHINA !== 'undefined' ? AUTO_CHINA : []);

  // плоский список валидных «бренд+модель+поколение»
  const carVariants = [];
  for (const b of autoBrands) {
    for (const m of b.models || []) {
      for (const g of m.gens || []) {
        const weight = (b.popular ? 3 : 1) + (m.popular ? 3 : 0);
        for (let w = 0; w < weight; w++) carVariants.push({ b, m, g });
      }
    }
  }

  /* ГАРАНТИЯ ПОКРЫТИЯ: сначала по разу проходим КАЖДОЕ поколение (иначе
     случайная выборка пропускает модели, и точный поиск «бмв пятерка 2020»
     упирается в пустоту), потом добираем до цели случайными вариантами.
     Свежие годы отдельно: у актуальных поколений спрашивают именно их. */
  const uniqueGens = [];
  {
    const seen = new Set();
    for (const v of carVariants) {
      const key = v.b.name + '|' + v.m.name + '|' + (v.g.name || '');
      if (!seen.has(key)) { seen.add(key); uniqueGens.push(v); }
    }
  }
  // 3 объявления на поколение: случайный год, свежий год и середина диапазона —
  // так по любому реальному году поколения что-то находится
  const carPlan = uniqueGens.concat(uniqueGens).concat(uniqueGens);
  const carsWanted = Math.max(GEN_TARGET.cars, carPlan.length);
  for (let i = 0; i < carsWanted && carVariants.length; i++) {
    const { b, m, g } = i < carPlan.length ? carPlan[i] : pick(carVariants);
    const yFrom = (g.years && g.years[0]) || 2010;
    const yTo = Math.min((g.years && g.years[1]) || NOW_YEAR, NOW_YEAR);
    // второй проход по поколению даёт свежий год, первый — случайный
    let year;
    if (i >= uniqueGens.length * 2 && i < carPlan.length) year = Math.floor((yFrom + yTo) / 2);
    else if (i >= uniqueGens.length && i < carPlan.length) year = Math.max(yFrom, yTo);
    else year = range(yFrom, Math.max(yFrom, yTo));
    const eng = (g.engines && g.engines.length) ? pick(g.engines) : null;
    const fuel = (eng && eng.fuel) || 'Бензин';
    const isEv = fuel === 'Электро';
    const age = Math.max(0, NOW_YEAR - year);
    // пробег: чем старше, тем больше; новые — почти без пробега
    const mileage = age === 0 ? range(0, 8000) : round(range(6000, 21000) * age * (0.7 + rnd() * 0.7), 1000);
    const body = (g.body && g.body.length) ? pick(g.body) : (m.body || 'Седан');

    // цена: база поколения, минус износ по годам и пробегу
    const pr = g.price || [700000, 2500000];
    let price = range(pr[0], pr[1]);
    price = price * Math.pow(0.93, Math.min(age, 18));
    if (mileage > 200000) price *= 0.85;
    price = Math.max(120000, round(price, 10000));

    const genLabel = g.ru || g.name || '';
    const engLabel = isEv ? `${eng ? eng.hp + ' л.с.' : 'электро'}` : `${eng && eng.vol ? eng.vol.toFixed(1) : '1.6'}`;
    const title = `${b.name} ${m.name}${genLabel ? ' ' + genLabel : ''}, ${year}${isEv ? '' : ', ' + engLabel}`;

    const attrs = {
      brand: b.name, model: m.name, gen: g.name || '', year: String(year),
      country: b.country || '', body, fuel,
      gearbox: (g.gearbox && g.gearbox.length) ? pick(g.gearbox) : 'Автомат',
      drive: (g.drive && g.drive.length) ? pick(g.drive) : 'Передний',
      mileage: String(mileage),
      color: pick(GEN_COLORS_CAR),
      interior: pick(GEN_INTERIOR),
      wheel: chance(0.93) ? 'Левый' : 'Правый',
      owners: String(range(1, Math.max(1, Math.min(4, Math.floor(age / 3) + 1)))),
      customs: chance(0.9) ? 'Растаможен' : 'Не растаможен',
      accident: chance(0.72) ? 'Не был в ДТП' : 'Был в ДТП',
      exchange: chance(0.35) ? 'Возможен' : 'Нет',
      credit: chance(0.2) ? 'Возможен' : 'Нет',
      vin: chance(0.55) ? 'Есть' : 'Нет',
      seats: String(body === 'Минивэн' ? 7 : body === 'Пикап' ? 5 : 5),
    };
    if (eng && eng.hp) attrs.power = String(eng.hp);
    if (eng && eng.vol) attrs.engineVol = eng.vol.toFixed(1);
    if (isEv) {
      if (g.batteryKwh) attrs.battery = String(range(g.batteryKwh[0], g.batteryKwh[1]));
      if (g.rangeKm) attrs.rangeKm = String(round(range(g.rangeKm[0], g.rangeKm[1]), 10));
      attrs.chargePort = pick(['Type 2 / CCS', 'GB/T', 'CCS2']);
    }
    if (fuel === 'Гибрид' && g.rangeKm) attrs.rangeKm = String(round(range(g.rangeKm[0], g.rangeKm[1]), 10));

    out.push(base('transport', 'Легковые авто', title, price, {
      condition: age <= 1 && chance(0.5) ? 'new' : 'used',
      bizChance: 0.3,
      delivery: false,
      attrs,
      description: desc([
        `${b.name} ${m.name}, ${year} год.`,
        isEv ? 'Полностью электрический.' : `Двигатель ${engLabel}${eng && eng.vol ? ' л' : ''}, ${fuel.toLowerCase()}.`,
        `Пробег ${mileage.toLocaleString('ru-RU')} км.`,
      ], GEN_CAR_EXTRA),
    }));
  }

  /* ---------------- ТЕЛЕФОНЫ / ПЛАНШЕТЫ / ЧАСЫ ---------------- */
  const mobile = typeof TECH_MOBILE !== 'undefined' ? TECH_MOBILE : {};

  const flat = (brands, catId, sub) => {
    const v = [];
    for (const b of brands || []) {
      for (const m of b.models || []) {
        const weight = (b.popular ? 2 : 1) + (m.popular ? 3 : 0);
        for (let w = 0; w < weight; w++) v.push({ b, m, catId, sub });
      }
    }
    return v;
  };

  const phoneVariants = flat(mobile.phones, 'electronics', 'Телефоны');
  /* покрытие: каждая модель телефона представлена во ВСЕХ своих версиях
     памяти — иначе запрос «s26 ultra 512» упирается в пустую выдачу */
  const phonePlan = [];
  {
    const seen = new Set();
    for (const v of phoneVariants) {
      if (seen.has(v.m.name)) continue;
      seen.add(v.m.name);
      for (const st of (v.m.storage && v.m.storage.length ? v.m.storage : [128])) phonePlan.push({ ...v, forceStorage: st });
    }
  }
  const phonesWanted = Math.max(GEN_TARGET.phones, phonePlan.length);
  for (let i = 0; i < phonesWanted && phoneVariants.length; i++) {
    const v = i < phonePlan.length ? phonePlan[i] : pick(phoneVariants);
    const { b, m } = v;
    const storage = v.forceStorage || ((m.storage && m.storage.length) ? pick(m.storage) : 128);
    const color = (m.colors && m.colors.length) ? pick(m.colors) : 'Чёрный';
    const age = Math.max(0, NOW_YEAR - (m.year || 2023));
    const isNew = age <= 1 ? chance(0.45) : chance(0.08);
    const pr = m.price || [20000, 60000];
    // цена растёт с памятью и падает с возрастом/б-у
    const tierIdx = (m.storage || [storage]).indexOf(storage);
    const tierMul = 1 + Math.max(0, tierIdx) * 0.13;
    let price = range(pr[0], pr[1]) * tierMul * Math.pow(0.88, age) * (isNew ? 1 : 0.82);
    price = Math.max(2000, round(price, 500));

    const battery = isNew ? 100 : range(78, 100);
    const attrs = {
      brand: b.brand, model: m.name, storage: String(storage), color,
      foldable: /fold|flip|razr|раскладуш/i.test(m.name + ' ' + (m.aliases || []).join(' ')) ? '1' : '',
      year: String(m.year || ''),
      ram: m.ram ? String(m.ram) : '',
      screen: m.screen ? String(m.screen) : '',
      refresh: m.refresh ? String(m.refresh) : '',
      chip: m.chip || '',
      esim: m.esim ? 'Есть' : 'Нет',
      nfc: m.nfc ? 'Есть' : 'Нет',
      g5: m.g5 ? 'Есть' : 'Нет',
      battery: String(battery),
      complete: pick(['Полный комплект', 'Только телефон', 'Телефон и кабель', 'Коробка и документы']),
      repaired: chance(0.85) ? 'Не ремонтировался' : 'Был ремонт',
      screenOrig: chance(0.92) ? 'Оригинал' : 'Замена',
      imei: chance(0.6) ? 'Есть' : 'Нет',
      warranty: isNew && chance(0.7) ? 'Есть' : 'Нет',
    };

    out.push(base('electronics', 'Телефоны', `${m.name} ${storage}${storage >= 1024 ? 'ТБ' : 'ГБ'}, ${color}`, price, {
      condition: isNew ? 'new' : 'used',
      delivery: chance(0.45),
      attrs,
      description: desc([
        `${m.name}, ${storage >= 1024 ? storage / 1024 + ' ТБ' : storage + ' ГБ'}, цвет ${color.toLowerCase()}.`,
        isNew ? 'Новый, запечатан.' : `Ёмкость аккумулятора ${battery}%.`,
      ], GEN_TECH_EXTRA),
    }));
  }

  const tabletVariants = flat(mobile.tablets, 'electronics', 'Планшеты');
  const tabletPlan = _uniqModels(tabletVariants);
  for (let i = 0; i < Math.max(GEN_TARGET.tablets, tabletPlan.length) && tabletVariants.length; i++) {
    const { b, m } = i < tabletPlan.length ? tabletPlan[i] : pick(tabletVariants);
    const storage = (m.storage && m.storage.length) ? pick(m.storage) : 128;
    const age = Math.max(0, NOW_YEAR - (m.year || 2023));
    const isNew = age <= 1 ? chance(0.4) : chance(0.08);
    const pr = m.price || [20000, 70000];
    let price = range(pr[0], pr[1]) * Math.pow(0.9, age) * (isNew ? 1 : 0.8);
    price = Math.max(3000, round(price, 500));
    const cellular = m.cellular ? chance(0.5) : false;
    out.push(base('electronics', 'Планшеты', `${m.name} ${storage}ГБ${cellular ? ', SIM' : ', Wi-Fi'}`, price, {
      condition: isNew ? 'new' : 'used',
      delivery: chance(0.4),
      attrs: {
        brand: b.brand, model: m.name, storage: String(storage),
        screen: m.screen ? String(m.screen) : '', ram: m.ram ? String(m.ram) : '',
        chip: m.chip || '', refresh: m.refresh ? String(m.refresh) : '',
        cellular: cellular ? 'Есть' : 'Нет',
        stylus: m.stylus ? (chance(0.4) ? 'В комплекте' : 'Поддерживается') : 'Нет',
        battery: String(isNew ? 100 : range(80, 100)),
        color: (m.colors && m.colors.length) ? pick(m.colors) : 'Серый',
        year: String(m.year || ''),
      },
      description: desc([`${m.name}, экран ${m.screen || ''}″, ${storage} ГБ.`], GEN_TECH_EXTRA),
    }));
  }

  const watchVariants = flat(mobile.watches, 'fashion', 'Аксессуары');
  const watchPlan = _uniqModels(watchVariants);
  for (let i = 0; i < Math.max(GEN_TARGET.watches, watchPlan.length) && watchVariants.length; i++) {
    const { b, m } = i < watchPlan.length ? watchPlan[i] : pick(watchVariants);
    const pr = m.price || [8000, 40000];
    const age = Math.max(0, NOW_YEAR - (m.year || 2023));
    const isNew = chance(0.3);
    let price = Math.max(1500, round(range(pr[0], pr[1]) * Math.pow(0.88, age) * (isNew ? 1 : 0.78), 500));
    out.push(base('fashion', 'Аксессуары', `${m.name}${m.sizes ? ' ' + pick(m.sizes) + 'мм' : ''}`, price, {
      condition: isNew ? 'new' : 'used',
      delivery: chance(0.5),
      attrs: {
        brand: b.brand, model: m.name, year: String(m.year || ''),
        color: (m.colors && m.colors.length) ? pick(m.colors) : 'Чёрный',
        battery: String(isNew ? 100 : range(80, 100)),
      },
      description: desc([`${m.name}. Умные часы.`], GEN_TECH_EXTRA),
    }));
  }

  /* ---------------- НОУТБУКИ / ПК / ТВ / АУДИО / КОНСОЛИ / ФОТО ---------------- */
  const comp = typeof TECH_COMPUTE !== 'undefined' ? TECH_COMPUTE : {};

  const laptopVariants = flat(comp.laptops, 'electronics', 'Ноутбуки')
    .concat(flat(comp.desktops, 'electronics', 'Ноутбуки'));
  const laptopPlan = _uniqModels(laptopVariants);
  for (let i = 0; i < Math.max(GEN_TARGET.laptops, laptopPlan.length) && laptopVariants.length; i++) {
    const { b, m } = i < laptopPlan.length ? laptopPlan[i] : pick(laptopVariants);
    const ram = (m.ram && m.ram.length) ? pick(m.ram) : 16;
    const storage = (m.storage && m.storage.length) ? pick(m.storage) : 512;
    const age = Math.max(0, NOW_YEAR - (m.year || 2023));
    const isNew = age <= 1 ? chance(0.4) : chance(0.07);
    const pr = m.price || [40000, 120000];
    let price = range(pr[0], pr[1]) * Math.pow(0.87, age) * (isNew ? 1 : 0.8);
    price = Math.max(8000, round(price, 500));
    out.push(base('electronics', 'Ноутбуки', `${m.name}, ${ram}ГБ / ${storage >= 1024 ? storage / 1024 + 'ТБ' : storage + 'ГБ'}`, price, {
      condition: isNew ? 'new' : 'used',
      delivery: chance(0.35),
      attrs: {
        brand: b.brand, model: m.name, cpu: m.cpu || '', gpu: m.gpu || '',
        vram: m.vram ? String(m.vram) : '', ram: String(ram), storage: String(storage),
        screen: m.screen ? String(m.screen) : '', refresh: m.refresh ? String(m.refresh) : '',
        os: m.os || '', gaming: m.gaming ? 'Игровой' : 'Офисный',
        battery: String(isNew ? 100 : range(75, 100)), year: String(m.year || ''),
      },
      description: desc([
        `${m.name}. ${m.cpu || ''}${m.gpu ? ', ' + m.gpu : ''}.`,
        `${ram} ГБ ОЗУ, накопитель ${storage >= 1024 ? storage / 1024 + ' ТБ' : storage + ' ГБ'}.`,
      ], GEN_TECH_EXTRA),
    }));
  }

  const simpleGroups = [
    [comp.tv, 'ТВ и аудио', GEN_TARGET.tv, m => `${m.name}${m.screen ? ', ' + m.screen + '″' : ''}`,
      m => ({ screen: m.screen ? String(m.screen) : '', res: m.res || '', panel: m.panel || '', refresh: m.refresh ? String(m.refresh) : '', smart: m.smart || '' })],
    [comp.audio, 'ТВ и аудио', GEN_TARGET.audio, m => m.name,
      m => ({ type: m.type || '', anc: m.anc ? 'Есть' : 'Нет' })],
    [comp.consoles, 'ТВ и аудио', GEN_TARGET.consoles, m => `${m.name}${m.edition ? ' ' + m.edition : ''}`,
      m => ({ storage: (m.storage && m.storage.length) ? String(m.storage[0]) : '', edition: m.edition || '' })],
    [comp.cameras, 'Фото и видео', GEN_TARGET.cameras, m => m.name,
      m => ({ sensor: m.sensor || '', mount: m.mount || '', video: m.video || '' })],
  ];
  for (const [brands, sub, target, titleFn, attrFn] of simpleGroups) {
    const vs = flat(brands, 'electronics', sub);
    const plan = _uniqModels(vs);
    for (let i = 0; i < Math.max(target, plan.length) && vs.length; i++) {
      const { b, m } = i < plan.length ? plan[i] : pick(vs);
      const age = Math.max(0, NOW_YEAR - (m.year || 2023));
      const isNew = age <= 1 ? chance(0.45) : chance(0.1);
      const pr = m.price || [10000, 60000];
      const price = Math.max(1500, round(range(pr[0], pr[1]) * Math.pow(0.9, age) * (isNew ? 1 : 0.8), 500));
      out.push(base('electronics', sub, titleFn(m), price, {
        condition: isNew ? 'new' : 'used',
        delivery: chance(0.4),
        attrs: Object.assign({ brand: b.brand, model: m.name, year: String(m.year || '') }, attrFn(m)),
        description: desc([`${m.name}. ${isNew ? 'Новый, в упаковке.' : 'Б/у, в отличном состоянии.'}`], GEN_TECH_EXTRA),
      }));
    }
  }

  return out;
}

/* вливаем каталожные объявления в общий пул сразу при загрузке:
   тематические (авто/техника из справочников) + прежние шаблонные
   (услуги, работа, недвижимость, животные и т.д. — их каталог не покрывает) */
if (typeof LISTINGS !== 'undefined') {
  try {
    const _cat = generateCatalogListings();
    if (_cat.length) LISTINGS = _cat.concat(LISTINGS);
  } catch (e) { console.error('Каталог-генератор не отработал:', e); }
}
