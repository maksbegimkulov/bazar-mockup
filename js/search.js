/* ============================================================
   BAZAR mockup — поисковое ядро
   нормализация, синонимы/транслит, NLU-парсер запроса, скоринг
   ============================================================ */

/* --- нормализация текста --- */
function normText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* лёгкий стемминг русских окончаний (для совпадения «телефоны» ↔ «телефон») */
function stemLite(t) {
  if (/^\d+$/.test(t) || /^[a-z0-9]+$/.test(t)) return t;
  let w = t;
  const endings3 = ['ами', 'ями', 'ого', 'его', 'ому', 'ему', 'ыми', 'ими', 'ует', 'ть'];
  const endings2 = ['ой', 'ей', 'ах', 'ях', 'ам', 'ям', 'ов', 'ев', 'ие', 'ые', 'ая', 'яя', 'ую', 'юю', 'ом', 'ем'];
  const endings1 = ['ы', 'и', 'а', 'я', 'о', 'е', 'у', 'ю', 'ь', 'й'];
  for (const list of [endings3, endings2, endings1]) {
    for (const e of list) {
      if (w.length - e.length >= 4 && w.endsWith(e)) { w = w.slice(0, -e.length); return w; }
    }
  }
  return w;
}

/* --- синонимы и транслит брендов: запрос → словарь объявлений --- */
const QUERY_ALIASES = {
  'айфон': 'iphone', 'афон': 'iphone', 'iphone': 'iphone',
  'эпл': 'apple', 'апл': 'apple',
  'макбук': 'macbook', 'аирподс': 'airpods', 'эирподс': 'airpods', 'аирподсы': 'airpods',
  'самсунг': 'samsung', 'галакси': 'galaxy', 'гэлакси': 'galaxy',
  'сяоми': 'xiaomi', 'ксиоми': 'xiaomi', 'редми': 'redmi', 'пиксель': 'pixel', 'пиксел': 'pixel',
  'леново': 'lenovo', 'асус': 'asus', 'делл': 'dell', 'хп': 'hp', 'мси': 'msi',
  'нокиа': 'nokia', 'инфиникс': 'infinix', 'реалми': 'realme', 'риалми': 'realme',
  'тойота': 'toyota', 'камри': 'camry', 'королла': 'corolla', 'прадо': 'prado', 'рав4': 'rav4', 'рав': 'rav4',
  'хонда': 'honda', 'фит': 'fit', 'лексус': 'lexus', 'киа': 'kia', 'спортейдж': 'sportage',
  'хендай': 'hyundai', 'хундай': 'hyundai', 'хёндэ': 'hyundai', 'соната': 'sonata', 'элантра': 'elantra',
  'субару': 'subaru', 'форестер': 'forester', 'ниссан': 'nissan', 'лиф': 'leaf',
  'мерседес': 'mercedes', 'мерс': 'mercedes', 'бмв': 'bmw', 'матиз': 'matiz', 'приус': 'prius',
  'спринтер': 'sprinter', 'портер': 'porter', 'газель': 'газель', 'камаз': 'камаз', 'исузу': 'isuzu',
  'ямаха': 'yamaha', 'сузуки': 'suzuki', 'кайо': 'kayo',
  'джбл': 'jbl', 'сони': 'sony', 'кэнон': 'canon', 'канон': 'canon', 'никон': 'nikon',
  'гопро': 'gopro', 'дджи': 'dji', 'диджиай': 'dji', 'лджи': 'lg', 'тсл': 'tcl',
  'бош': 'bosch', 'дайсон': 'dyson', 'филипс': 'philips', 'делонги': 'delonghi', 'мидеа': 'midea',
  'найк': 'nike', 'адидас': 'adidas', 'юникло': 'uniqlo', 'левайс': 'levis', 'ливайс': 'levis',
  'тимберленд': 'timberland', 'касио': 'casio', 'рейма': 'reima', 'анекс': 'anex',
  'страйдер': 'strider', 'трек': 'trek', 'джайант': 'giant', 'гиант': 'giant', 'мерида': 'merida',
  'штиль': 'stihl', 'ваком': 'wacom', 'нинебот': 'ninebot', 'икс джими': 'xgimi', 'ксджими': 'xgimi',
  'про': 'pro', 'макс': 'max', 'мини': 'mini', 'эир': 'air', 'аир': 'air', 'ультра': 'ultra',
  'плюс': 'plus', 'нот': 'note', 'ноут': 'ноутбук',
  'велик': 'велосипед', 'мобильник': 'телефон', 'смартфон': 'телефон', 'смарт': 'телефон',
  'тачка': 'авто', 'тачку': 'авто', 'машина': 'авто', 'автомобиль': 'авто',
  'хата': 'квартира', 'жилье': 'квартира', 'стиралка': 'стиральная', 'холодос': 'холодильник',
  'телек': 'телевизор', 'комп': 'компьютер', 'пс': 'playstation', 'пс5': 'playstation 5',
  'фотик': 'фотоаппарат', 'фотак': 'фотоаппарат',
  'однушка': '1 комн квартира', 'однушку': '1 комн квартира',
  'двушка': '2 комн квартира', 'двушку': '2 комн квартира',
  'трешка': '3 комн квартира', 'трешку': '3 комн квартира',
  // авто-сленг
  'беха': 'bmw', 'бэха': 'bmw', 'бэшка': 'bmw', 'бумер': 'bmw', 'бимер': 'bmw',
  'прадик': 'prado', 'крузак': 'land cruiser', 'лексус': 'lexus',
  'моцик': 'мотоцикл', 'мот': 'мотоцикл',
  // игры/техника-сленг
  'плойка': 'playstation', 'плойку': 'playstation', 'плоечка': 'playstation',
  'хбокс': 'xbox', 'иксбокс': 'xbox', 'сега': 'приставка', 'денди': 'приставка',
  'халадос': 'холодильник', 'холодильник': 'холодильник',
  // работа-сленг
  'подработка': 'работа', 'подработку': 'работа', 'шабашка': 'работа', 'вахта': 'работа',
};

/* --- ключевые слова → категория/подкатегория --- */
const CAT_INTENT = {
  'телефон': ['electronics', 'Телефоны'], 'iphone': ['electronics', 'Телефоны'],
  'samsung': ['electronics', 'Телефоны'], 'xiaomi': ['electronics', 'Телефоны'],
  'redmi': ['electronics', 'Телефоны'], 'galaxy': ['electronics', 'Телефоны'],
  'pixel': ['electronics', 'Телефоны'], 'realme': ['electronics', 'Телефоны'],
  'infinix': ['electronics', 'Телефоны'], 'poco': ['electronics', 'Телефоны'],
  'playstation': ['electronics', null], 'xbox': ['electronics', null],
  'приставк': ['electronics', null], 'консол': ['electronics', null],
  'джойстик': ['electronics', null], 'геймпад': ['electronics', null],
  'компьютер': ['electronics', null], 'пк': ['electronics', null],
  'ноутбук': ['electronics', 'Ноутбуки'], 'macbook': ['electronics', 'Ноутбуки'],
  'телевизор': ['electronics', 'ТВ и аудио'], 'саундбар': ['electronics', 'ТВ и аудио'],
  'наушник': ['electronics', 'ТВ и аудио'], 'колонк': ['electronics', 'ТВ и аудио'],
  'планшет': ['electronics', 'Планшеты'], 'ipad': ['electronics', 'Планшеты'],
  'фотоаппарат': ['electronics', 'Фото и видео'], 'камер': ['electronics', 'Фото и видео'],
  'дрон': ['electronics', 'Фото и видео'], 'квадрокоптер': ['electronics', 'Фото и видео'],
  'холодильник': ['electronics', 'Бытовая техника'], 'стиральн': ['electronics', 'Бытовая техника'],
  'пылесос': ['electronics', 'Бытовая техника'], 'кофемашин': ['electronics', 'Бытовая техника'],
  'микроволновк': ['electronics', 'Бытовая техника'], 'кондиционер': ['electronics', 'Бытовая техника'],
  'морозильник': ['electronics', 'Бытовая техника'], 'утюг': ['electronics', 'Бытовая техника'],
  'авто': ['transport', 'Легковые авто'], 'легков': ['transport', 'Легковые авто'],
  // бренды/модели авто (юзер пишет «мерс»/«камри» без слова «машина»)
  'toyota': ['transport', 'Легковые авто'], 'camry': ['transport', 'Легковые авто'],
  'corolla': ['transport', 'Легковые авто'], 'prado': ['transport', 'Легковые авто'],
  'rav4': ['transport', 'Легковые авто'], 'cruiser': ['transport', 'Легковые авто'],
  'honda': ['transport', 'Легковые авто'], 'fit': ['transport', 'Легковые авто'],
  'lexus': ['transport', 'Легковые авто'], 'kia': ['transport', 'Легковые авто'],
  'sportage': ['transport', 'Легковые авто'], 'hyundai': ['transport', 'Легковые авто'],
  'sonata': ['transport', 'Легковые авто'], 'elantra': ['transport', 'Легковые авто'],
  'subaru': ['transport', 'Легковые авто'], 'forester': ['transport', 'Легковые авто'],
  'nissan': ['transport', 'Легковые авто'], 'leaf': ['transport', 'Легковые авто'],
  'mercedes': ['transport', 'Легковые авто'], 'bmw': ['transport', 'Легковые авто'],
  'matiz': ['transport', 'Легковые авто'], 'prius': ['transport', 'Легковые авто'],
  'sprinter': ['transport', 'Грузовой транспорт'], 'porter': ['transport', 'Грузовой транспорт'],
  'газель': ['transport', 'Грузовой транспорт'], 'камаз': ['transport', 'Грузовой транспорт'],
  'isuzu': ['transport', 'Грузовой транспорт'], 'грузов': ['transport', 'Грузовой транспорт'],
  'мотоцикл': ['transport', 'Мото'], 'мото': ['transport', 'Мото'], 'скутер': ['transport', 'Мото'],
  'мопед': ['transport', 'Мото'], 'эндуро': ['transport', 'Мото'], 'электросамокат': ['transport', 'Мото'],
  'грузовик': ['transport', 'Грузовой транспорт'], 'фургон': ['transport', 'Грузовой транспорт'],
  'самосвал': ['transport', 'Грузовой транспорт'], 'рефрижератор': ['transport', 'Грузовой транспорт'],
  'шин': ['transport', 'Запчасти и аксессуары'], 'запчаст': ['transport', 'Запчасти и аксессуары'],
  'аккумулятор': ['transport', 'Запчасти и аксессуары'], 'магнитол': ['transport', 'Запчасти и аксессуары'],
  'квартир': ['realty', null], 'студи': ['realty', null], 'жиль': ['realty', null],
  'комнат': ['realty', null],
  'дом': ['realty', 'Дома и участки'], 'дач': ['realty', 'Дома и участки'],
  'участок': ['realty', 'Дома и участки'], 'участк': ['realty', 'Дома и участки'],
  'коттедж': ['realty', 'Дома и участки'],
  'помещени': ['realty', 'Коммерческая'], 'офис': ['realty', 'Коммерческая'], 'склад': ['realty', 'Коммерческая'],
  'куртк': ['fashion', null], 'пуховик': ['fashion', null], 'джинс': ['fashion', null],
  'плать': ['fashion', 'Женская одежда'], 'шуб': ['fashion', 'Женская одежда'], 'пальто': ['fashion', null],
  'костюм': ['fashion', null], 'одежд': ['fashion', null],
  'кроссовк': ['fashion', 'Обувь'], 'ботинк': ['fashion', 'Обувь'], 'обув': ['fashion', 'Обувь'],
  'туфл': ['fashion', 'Обувь'], 'кед': ['fashion', 'Обувь'],
  'сумк': ['fashion', 'Аксессуары'], 'рюкзак': ['fashion', 'Аксессуары'], 'час': ['fashion', 'Аксессуары'],
  'очк': ['fashion', 'Аксессуары'],
  'диван': ['home', 'Мебель'], 'шкаф': ['home', 'Мебель'], 'стол': ['home', 'Мебель'],
  'стул': ['home', 'Мебель'], 'кроват': ['home', 'Мебель'], 'мебел': ['home', 'Мебель'],
  'гарнитур': ['home', 'Мебель'], 'матрас': ['home', 'Мебель'], 'тумб': ['home', 'Мебель'],
  'люстр': ['home', 'Мебель'], 'ковер': ['home', 'Мебель'], 'ковр': ['home', 'Мебель'],
  'ламинат': ['home', 'Ремонт и стройка'], 'перфоратор': ['home', 'Ремонт и стройка'],
  'бензопил': ['home', 'Ремонт и стройка'], 'сварочн': ['home', 'Ремонт и стройка'],
  'обогревател': ['home', 'Ремонт и стройка'], 'стремянк': ['home', 'Ремонт и стройка'],
  'посуд': ['home', 'Посуда и кухня'], 'сервиз': ['home', 'Посуда и кухня'], 'казан': ['home', 'Посуда и кухня'],
  'растени': ['home', 'Растения'], 'фикус': ['home', 'Растения'],
  'сантехник': ['services', 'Строительство'], 'электрик': ['services', 'Строительство'],
  'клининг': ['services', 'Клининг'], 'уборк': ['services', 'Клининг'],
  'грузоперевозк': ['services', 'Перевозки'], 'перевозк': ['services', 'Перевозки'],
  'репетитор': ['services', 'Обучение'], 'инструктор': ['services', 'Обучение'],
  'маникюр': ['services', 'Красота и здоровье'], 'массаж': ['services', 'Красота и здоровье'],
  'нян': ['services', 'Красота и здоровье'],
  'фотограф': ['services', 'Красота и здоровье'],
  'услуг': ['services', null],
  'работ': ['jobs', 'Вакансии'], 'ваканси': ['jobs', 'Вакансии'], 'резюме': ['jobs', 'Ищу работу'],
  'подработк': ['jobs', 'Вакансии'],
  'ремонт': ['services', null],
  'щен': ['animals', 'Собаки'], 'собак': ['animals', 'Собаки'], 'алабай': ['animals', 'Собаки'],
  'пудел': ['animals', 'Собаки'],
  'кошк': ['animals', 'Кошки'], 'котен': ['animals', 'Кошки'], 'котят': ['animals', 'Кошки'],
  'кот': ['animals', 'Кошки'], 'британ': ['animals', 'Кошки'],
  'попуга': ['animals', 'Птицы и рыбки'], 'рыбк': ['animals', 'Птицы и рыбки'],
  'аквариум': ['animals', 'Товары для животных'], 'корм': ['animals', 'Товары для животных'],
  'клетк': ['animals', 'Товары для животных'], 'вольер': ['animals', 'Товары для животных'],
  'коляск': ['kids', 'Коляски и кресла'], 'автокресл': ['kids', 'Коляски и кресла'],
  'игрушк': ['kids', 'Игрушки'], 'лего': ['kids', 'Игрушки'], 'конструктор': ['kids', 'Игрушки'],
  'беговел': ['kids', 'Игрушки'],
  'велосипед': ['hobby', 'Велосипеды'], 'шоссейник': ['hobby', 'Велосипеды'],
  'тренажер': ['hobby', 'Тренажёры'], 'гантел': ['hobby', 'Тренажёры'], 'турник': ['hobby', 'Тренажёры'],
  'гитар': ['hobby', 'Музыка'], 'пианино': ['hobby', 'Музыка'], 'синтезатор': ['hobby', 'Музыка'],
  'палатк': ['hobby', 'Туризм и отдых'], 'сап': ['hobby', 'Туризм и отдых'],
  'сноуборд': ['hobby', 'Туризм и отдых'], 'лыж': ['hobby', 'Туризм и отдых'],
  'мангал': ['hobby', 'Туризм и отдых'], 'скейт': ['hobby', 'Туризм и отдых'],
  'ролик': ['hobby', 'Туризм и отдых'], 'шахмат': ['hobby', 'Туризм и отдых'],
};

/* ВАЖНО: \b и \w в JS — ASCII-only и НЕ работают с кириллицей.
   Нормализованная строка всегда обрамлена пробелами, поэтому
   границы слов кодируем буквальными пробелами и lookahead (?= ). */
const RENT_WORDS = / (?:снять|сниму|аренд[а-я]*|сдается|сдам|посуточно|помесячно)(?= )/;
const BUY_WORDS = / (?:купить|куплю|продаж[а-я]*|продается)(?= )/;
/* «посуточно» оставляем в q — это полезный поисковый токен */
const RENT_CONSUME = / (?:снять|сниму|аренд[а-я]*|сдается|сдам|помесячно)(?= )/g;
const BUY_CONSUME = / (?:купить|куплю|продаж[а-я]*|продается)(?= )/g;

/* города + падежные формы через стемы */
const CITY_STEMS = [
  ['бишкек', 'Бишкек'], ['ош', 'Ош'], ['джалал', 'Джалал-Абад'], ['джалалабад', 'Джалал-Абад'],
  ['каракол', 'Каракол'], ['токмок', 'Токмок'], ['кара балт', 'Кара-Балта'], ['карабалт', 'Кара-Балта'],
  ['кант', 'Кант'], ['нарын', 'Нарын'], ['талас', 'Талас'], ['баткен', 'Баткен'],
  ['чолпон', 'Чолпон-Ата'], ['чолпоната', 'Чолпон-Ата'],
];

/* «50к», «50 тыс», «1.5 млн», «50 000» → число */
function parseAmount(numStr, unit) {
  const v = parseFloat(numStr.replace(/\s+/g, '').replace(',', '.'));
  if (isNaN(v)) return null;
  if (!unit) return Math.round(v);
  if (/^(к|k|тыс)/.test(unit)) return Math.round(v * 1000);
  if (/^(млн|миллион)/.test(unit)) return Math.round(v * 1000000);
  return Math.round(v);
}

const AMOUNT_RE = '(\\d[\\d ]*(?:[.,]\\d+)?)\\s*(к|k|тыс[а-я]*|млн[а-я]*|миллион[а-я]*)?(?= |$)';

/* --- главный парсер: текст запроса → { q, filters } --- */
function parseSearchQuery(raw) {
  // диапазон «30000-60000», «50-80 тыс»: дефис гибнет в normText, поэтому
  // заранее переписываем в «от X .. до Y ..». НО не любой «X-Y» — цена:
  // «камри 2010-2015» (годы) и «11-64gb» (спеки) ценой НЕ являются
  const preranged = String(raw).replace(
    /(\d[\d\s]*?)\s*[-–—]\s*(\d[\d\s]*)(\s*(?:к|k|тыс[а-яa-z]*|млн[а-яa-z]*))?(?=\s|$)/i,
    (m0, a, b, unit) => {
      const A = parseInt(a.replace(/\s/g, ''), 10), B = parseInt(b.replace(/\s/g, ''), 10);
      const yearish = A >= 1950 && A <= 2035 && B >= 1950 && B <= 2035;
      if (unit) return `от ${a}${unit} до ${b}${unit}`; // юнит достаётся обеим границам
      if (yearish || A < 1000 || B < 1000) return m0;    // годы/мелкие спеки — не цена
      return `от ${a} до ${b}`;
    }
  );
  let s = ' ' + normText(preranged) + ' ';
  const filters = {};

  // «до 50 000», «не дороже 50к», «дешевле 50 тыс», «в пределах 1 млн»
  let maxUnit = null;
  let m = s.match(new RegExp('(?:^| )(?:до|не дороже|дешевле|максимум|в пределах|за)\\s+' + AMOUNT_RE));
  if (m && !filters.priceMax) {
    const v = parseAmount(m[1], m[2]);
    if (v && v > 50) { filters.priceMax = String(v); maxUnit = m[2] || null; s = s.replace(m[0], ' '); }
  }
  // «от 100 000», «дороже 1 млн»; юнит наследуется от максимума («от 5 до 8 млн»)
  m = s.match(new RegExp('(?:^| )(?:от|дороже|не дешевле|минимум)\\s+' + AMOUNT_RE));
  if (m && !filters.priceMin) {
    const v = parseAmount(m[1], m[2] || maxUnit);
    if (v && v > 10 && (!filters.priceMax || v <= +filters.priceMax)) {
      filters.priceMin = String(v); s = s.replace(m[0], ' ');
    }
  }

  // цена в долларах/баксах/у.е. → пересчёт в сомы (жаргон «до 10000 долларов»)
  if ((filters.priceMax || filters.priceMin) && / (доллар[а-я]*|бакс[а-я]*|usd|у е)(?= )/.test(s)) {
    const USD_RATE = 88; // ориентировочный курс USD→KGS
    if (filters.priceMax) filters.priceMax = String(+filters.priceMax * USD_RATE);
    if (filters.priceMin) filters.priceMin = String(+filters.priceMin * USD_RATE);
    s = s.replace(/ (доллар[а-я]*|бакс[а-я]*|usd|у е)(?= )/g, ' ');
  }

  // состояние
  if (/ (?:б у|бу|подержанн[а-я]*|с рук)(?= )/.test(s)) {
    filters.condition = 'used';
    s = s.replace(/ (?:б у|бу|подержанн[а-я]*|с рук)(?= )/g, ' ');
  }
  if (/ (?:нов(?:ый|ая|ое|ые|ую|ым|ого)|new)(?= )/.test(s)) {
    filters.condition = 'new';
    s = s.replace(/ (?:нов(?:ый|ая|ое|ые|ую|ым|ого)|new)(?= )/g, ' ');
  }

  // доставка
  if (/ доставк[а-я]*(?= )/.test(s)) {
    filters.delivery = true;
    s = s.replace(/ (?:с )?доставк[а-я]*(?= )/g, ' ');
  }

  // сортировка-намерение
  if (/ (?:недорого|дешево|подешевле|бюджетн[а-я]*|сам(?:ый|ая|ое|ые) дешев[а-я]*)(?= )/.test(s)) {
    filters.sort = 'cheap';
    s = s.replace(/ (?:недорого|дешево|подешевле|бюджетн[а-я]*|сам(?:ый|ая|ое|ые) дешев[а-я]*)(?= )/g, ' ');
  }
  if (/ (?:подороже|премиум|сам(?:ый|ая|ое|ые) дорог[а-я]*)(?= )/.test(s)) {
    filters.sort = 'expensive';
    s = s.replace(/ (?:подороже|премиум|сам(?:ый|ая|ое|ые) дорог[а-я]*)(?= )/g, ' ');
  }
  if (/ (?:свежие|за сегодня|сегодняшние)(?= )/.test(s)) {
    filters.period = '1';
    s = s.replace(/ (?:свежие|за сегодня|сегодняшние)(?= )/g, ' ');
  }

  // город (включая «в бишкеке», «в оше»)
  for (const [stem, city] of CITY_STEMS) {
    const re = new RegExp(' (?:в |г )?' + stem + '[а-я]{0,3}(?= )');
    if (re.test(s)) { filters.city = city; s = s.replace(re, ' '); break; }
  }

  // аренда/покупка (до категории, чтобы уточнить sub)
  const wantsRent = RENT_WORDS.test(s);
  const wantsBuy = BUY_WORDS.test(s);
  s = s.replace(RENT_CONSUME, ' ').replace(BUY_CONSUME, ' ');
  s = s.replace(/ (?:ищу|нужен|нужна|нужно|хочу|найди|подбери|покажи|поищи|мне|есть ли|сколько стоит|сколько стоят|стоит|стоят|почем|цена|цену)(?= )/g, ' ');

  // категория по ключевым словам; токен ВСЕГДА остаётся в q —
  // специфичные слова («электросамокат») сужают выдачу внутри категории,
  // а по генерикам («телефоны») сработает category-fallback в applyFilters
  const intentOf = piece => {
    const cands = [stemLite(piece), piece];
    // обрезки только для длинных слов — иначе «котел»→'кот' (Кошки),
    // «кедр»→'кед' (Обувь), «мотор»→'мото', «столб»→'стол'
    if (piece.length > 5) cands.push(piece.slice(0, -1));
    if (piece.length > 6) cands.push(piece.slice(0, -2));
    for (const c of cands) if (CAT_INTENT[c]) return CAT_INTENT[c];
    return null;
  };

  const words = s.split(/\s+/).filter(Boolean);
  const rest = [];
  for (const w of words) {
    if (STOP_TOKENS.has(w)) continue;
    // интент ищем по алиас-форме, но в q оставляем СЛОВО ЮЗЕРА —
    // транслит применит prepQueryTokens при скоринге, а юзер видит свой текст
    const mapped = aliasFor(w);
    for (const piece of mapped.split(' ')) {
      const intent = intentOf(piece);
      if (intent && !filters.cat) {
        filters.cat = intent[0];
        if (intent[1]) filters.sub = intent[1];
      }
    }
    rest.push(w);
  }

  // недвижимость: уточняем продажу/аренду
  if (filters.cat === 'realty' && !filters.sub) {
    if (wantsRent) filters.sub = 'Аренда квартир';
    else if (wantsBuy) filters.sub = 'Продажа квартир';
  }
  // «снять/аренда» без слова «квартира»
  if (!filters.cat && wantsRent) { filters.cat = 'realty'; filters.sub = 'Аренда квартир'; }

  return { q: rest.join(' ').trim(), filters };
}

/* --- скоринг объявления по токенам запроса --- */

/* предлоги и мусорные частицы — не несут поискового смысла */
const STOP_TOKENS = new Set(['для', 'в', 'на', 'с', 'по', 'из', 'под', 'у', 'о', 'от', 'до', 'и', 'к', 'же', 'ли', 'бы']);

function lev1(a, b) {
  // расстояние Левенштейна ≤1? (быстрая проверка)
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (la > lb) i++;
    else if (lb > la) j++;
    else { i++; j++; }
  }
  if (i < la || j < lb) edits++;
  return edits <= 1;
}

/* перестановка соседних букв («айфно» → «айфон») */
function swapEq(a, b) {
  if (a.length !== b.length) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  if (i >= a.length - 1) return false;
  if (a[i] !== b[i + 1] || a[i + 1] !== b[i]) return false;
  return a.slice(i + 2) === b.slice(i + 2);
}

const fuzzyEq = (a, b) => lev1(a, b) || swapEq(a, b);

function tokenizeWords(s) {
  return normText(s).split(/\s+/).filter(t => t.length > 0);
}

/* индекс объявления: токены заголовка и «прочего» (раздел/описание/город).
   КРИТИЧНО: кэш живёт в отдельной Map, НЕ на объекте объявления —
   иначе он сериализуется в localStorage (bazar_my), Sets превращаются
   в {} и после перезагрузки весь скоринг падает с TypeError. */
const LISTING_IDX = new Map();

function listingIndex(l) {
  let idx = LISTING_IDX.get(l.id);
  if (!idx) {
    const title = new Set();
    for (const w of tokenizeWords(l.title)) { title.add(w); title.add(stemLite(w)); }
    const other = new Set();
    const cat = catById(l.category);
    const src = `${l.subcategory} ${cat ? cat.name : ''} ${l.city} ${l.description}`;
    for (const w of tokenizeWords(src)) { other.add(w); other.add(stemLite(w)); }
    idx = { title, other, titleArr: [...title] };
    LISTING_IDX.set(l.id, idx);
  }
  return idx;
}

/* алиас: точный → по префиксу («айф» → iphone, пока юзер печатает) → fuzzy («айфно») */
function aliasFor(w) {
  if (QUERY_ALIASES[w]) return QUERY_ALIASES[w];
  if (w.length >= 3 && /^[а-я]+$/.test(w)) {
    for (const k in QUERY_ALIASES) {
      if (k.length > w.length && k.startsWith(w)) return QUERY_ALIASES[k];
    }
  }
  // fuzzy-опечатки только для слов ≥5 с совпадающей первой буквой — иначе
  // короткие обычные слова прилипают к брендам («пони»→sony, «маки»→max)
  if (w.length >= 5 && /^[а-я]+$/.test(w)) {
    for (const k in QUERY_ALIASES) {
      if (k.length >= 5 && k[0] === w[0] && fuzzyEq(w, k)) return QUERY_ALIASES[k];
    }
  }
  return w;
}

/* запрос → токены для скоринга (с алиасами и стемами) */
function prepQueryTokens(q) {
  const out = [];
  for (const w of tokenizeWords(q)) {
    const mapped = aliasFor(w);
    for (const piece of mapped.split(' ')) {
      if (STOP_TOKENS.has(piece)) continue;
      out.push({ raw: piece, stem: stemLite(piece) });
    }
  }
  return out;
}

/* счёт за один токен в одном объявлении; 0 = не найден */
function tokenScore(tok, idx) {
  if (idx.title.has(tok.raw) || idx.title.has(tok.stem)) return 3;
  if (tok.raw.length >= 3) {
    for (const t of idx.titleArr) {
      if (t.length >= 3 && (t.startsWith(tok.raw) || tok.raw.startsWith(t) && t.length >= 4)) return 2;
    }
  }
  if (tok.raw.length >= 5) {
    for (const t of idx.titleArr) {
      if (t.length >= 5 && fuzzyEq(tok.raw, t)) return 1.6;
    }
  }
  if (idx.other.has(tok.raw) || idx.other.has(tok.stem)) return 1.1;
  if (tok.raw.length >= 4) {
    for (const t of idx.other) {
      if (t.length >= 4 && t.startsWith(tok.raw)) return 0.7;
    }
  }
  return 0;
}

/* суммарный счёт; minMatched — сколько токенов обязаны совпасть */
function scoreListing(l, qTokens, minMatched) {
  const idx = listingIndex(l);
  let score = 0, matched = 0;
  for (const tok of qTokens) {
    const s = tokenScore(tok, idx);
    if (s > 0) matched++;
    score += s;
  }
  if (matched < minMatched) return 0;
  return score + matched * 0.5;
}

/* сколько совпадений требуем: все, но при ≥3 токенах прощаем один промах */
function requiredMatches(qTokens) {
  return qTokens.length >= 3 ? qTokens.length - 1 : qTokens.length;
}
