/* ============================================================
   BAZAR — реальное распознавание товара по фото (on-device).
   Камера (getUserMedia + file fallback) + CLIP zero-shot
   через Transformers.js: модели даём НАШ список товаров,
   и она выбирает, что реально на фото (точнее, чем ImageNet).
   Без бэкенда и без API-ключей — всё в браузере.
   ============================================================ */

const VISION = { model: null, loading: null, stream: null };

/* промпт → категория/подкатегория BAZAR. Несколько промптов на одну
   подкатегорию повышают точность; обратно мапим по объекту. */
const CLIP_LABELS = [
  ['a photo of a smartphone or mobile phone', 'electronics', 'Телефоны', 'Телефон'],
  ['a photo of a laptop computer', 'electronics', 'Ноутбуки', 'Ноутбук'],
  ['a photo of a tablet computer', 'electronics', 'Планшеты', 'Планшет'],
  ['a photo of a flat-screen television', 'electronics', 'ТВ и аудио', 'Телевизор'],
  ['a photo of headphones or earbuds', 'electronics', 'ТВ и аудио', 'Наушники'],
  ['a photo of a bluetooth speaker', 'electronics', 'ТВ и аудио', 'Колонка'],
  ['a photo of a video game console', 'electronics', 'ТВ и аудио', 'Игровая приставка'],
  ['a photo of a digital photo camera', 'electronics', 'Фото и видео', 'Фотоаппарат'],
  ['a photo of a refrigerator', 'electronics', 'Бытовая техника', 'Холодильник'],
  ['a photo of a washing machine', 'electronics', 'Бытовая техника', 'Стиральная машина'],
  ['a photo of a microwave oven or kitchen appliance', 'electronics', 'Бытовая техника', 'Бытовая техника'],
  ['a photo of a vacuum cleaner', 'electronics', 'Бытовая техника', 'Пылесос'],
  ['a photo of a car or automobile', 'transport', 'Легковые авто', 'Автомобиль'],
  ['a photo of a motorcycle', 'transport', 'Мото', 'Мотоцикл'],
  ['a photo of a motor scooter', 'transport', 'Мото', 'Скутер'],
  ['a photo of car tires or wheels', 'transport', 'Запчасти и аксессуары', 'Шины / диски'],
  ['a photo of a bicycle', 'hobby', 'Велосипеды', 'Велосипед'],
  ['a photo of a sofa or couch', 'home', 'Мебель', 'Диван'],
  ['a photo of an armchair or office chair', 'home', 'Мебель', 'Кресло'],
  ['a photo of a table or desk', 'home', 'Мебель', 'Стол'],
  ['a photo of a bed', 'home', 'Мебель', 'Кровать'],
  ['a photo of a wardrobe or cabinet', 'home', 'Мебель', 'Шкаф'],
  ['a photo of kitchenware, pots or plates', 'home', 'Посуда и кухня', 'Посуда'],
  ['a photo of a power drill or hand tools', 'home', 'Ремонт и стройка', 'Инструмент'],
  ['a photo of a potted houseplant', 'home', 'Растения', 'Растение'],
  ['a photo of a jacket or winter coat', 'fashion', 'Мужская одежда', 'Куртка'],
  ['a photo of a dress', 'fashion', 'Женская одежда', 'Платье'],
  ['a photo of a shirt or t-shirt', 'fashion', 'Мужская одежда', 'Рубашка'],
  ['a photo of shoes or sneakers', 'fashion', 'Обувь', 'Обувь'],
  ['a photo of a handbag or purse', 'fashion', 'Аксессуары', 'Сумка'],
  ['a photo of a backpack', 'fashion', 'Аксессуары', 'Рюкзак'],
  ['a photo of a wristwatch', 'fashion', 'Аксессуары', 'Часы'],
  ['a photo of sunglasses', 'fashion', 'Аксессуары', 'Очки'],
  ['a photo of an acoustic or electric guitar', 'hobby', 'Музыка', 'Гитара'],
  ['a photo of a piano or music keyboard', 'hobby', 'Музыка', 'Синтезатор'],
  ['a photo of gym or fitness equipment', 'hobby', 'Тренажёры', 'Тренажёр'],
  ['a photo of a camping tent', 'hobby', 'Туризм и отдых', 'Палатка'],
  ['a photo of a baby stroller', 'kids', 'Коляски и кресла', 'Коляска'],
  ['a photo of a child car seat', 'kids', 'Коляски и кресла', 'Автокресло'],
  ['a photo of a toy', 'kids', 'Игрушки', 'Игрушка'],
  ['a photo of a dog', 'animals', 'Собаки', 'Собака'],
  ['a photo of a cat', 'animals', 'Кошки', 'Кошка'],
];
const CLIP_PROMPTS = CLIP_LABELS.map(l => l[0]);
const CLIP_BY_PROMPT = Object.fromEntries(CLIP_LABELS.map(([p, c, s, n]) => [p, { category: c, subcategory: s, noun: n }]));

function vLoadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src; s.onload = () => resolve(); s.onerror = () => reject(new Error('script: ' + src));
    document.head.appendChild(s);
  });
}

/* ленивый прогрев CLIP (Transformers.js, ESM через dynamic import) */
async function visionLoadModel() {
  if (VISION.model) return VISION.model;
  if (VISION.loading) return VISION.loading;
  VISION.loading = (async () => {
    const mod = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
    mod.env.allowLocalModels = false;
    VISION.model = await mod.pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
    return VISION.model;
  })();
  try {
    return await VISION.loading;
  } catch (e) {
    VISION.loading = null;
    throw e;
  }
}

function cleanLabel(prompt) {
  return (prompt || '').replace(/^a photo of (an? )?/, '');
}

/* image (url/dataURL/canvas) → { category, subcategory, label, confidence, uncertain } */
async function visionClassify(input) {
  const model = await visionLoadModel();
  const res = await model(input, CLIP_PROMPTS); // [{label, score}] по убыванию
  const top = res[0];
  const map = CLIP_BY_PROMPT[top.label] || { category: null, subcategory: null, noun: '' };
  const confidence = Math.round(top.score * 100);
  // ближайший результат ДРУГОЙ категории — для оценки уверенности
  const otherCat = res.find(r => (CLIP_BY_PROMPT[r.label] || {}).category !== map.category);
  const margin = otherCat ? top.score - otherCat.score : top.score;
  const uncertain = top.score < 0.18 || margin < 0.05;
  if (uncertain) {
    return { source: 'clip', category: null, subcategory: null, noun: '', label: cleanLabel(top.label), confidence, uncertain: true };
  }
  return { source: 'clip', category: map.category, subcategory: map.subcategory, noun: map.noun, label: cleanLabel(top.label), confidence };
}

/* ---------- Точное распознавание через сервер-прокси ----------
   Ключ ИИ хранится на сервере (Cloudflare Worker), НЕ в браузере и НЕ в коде.
   Браузер шлёт только фото → сервер распознаёт → возвращает готовое объявление.
   Работает для ВСЕХ пользователей без ввода ключа. Пусто = выключено (тогда
   используется встроенный on-device движок CLIP, тоже без ключа). */
const SMART_ENDPOINT = 'https://bazar-recognize.bazar-kg-26106bazar-kg-26106bazar-kg-26106bazar-kg-26106.workers.dev';
function smartOn() { return !!SMART_ENDPOINT; }

async function smartRecognize(dataURL) {
  const base64 = dataURL.split(',')[1];
  const categories = CATEGORIES.map(c => ({ id: c.id, name: c.name, subs: c.subs }));
  const resp = await fetch(SMART_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, categories }),
  });
  if (!resp.ok) throw new Error('smart-http-' + resp.status);
  const data = await resp.json();
  return normalizeSmart(data);
}

function normalizeSmart(p) {
  const cat = CATEGORIES.find(c => c.id === p.category)
    || CATEGORIES.find(c => Array.isArray(c.subs) && c.subs.includes(p.subcategory));
  const sub = cat && cat.subs.includes(p.subcategory) ? p.subcategory : (cat ? cat.subs[0] : null);
  const specs = Array.isArray(p.specs)
    ? p.specs.filter(s => s && s.value).slice(0, 6).map(s => [String(s.label || '').slice(0, 40), String(s.value).slice(0, 60)])
    : [];
  return {
    source: 'smart',
    category: cat ? cat.id : null,
    subcategory: sub,
    noun: '',
    title: String(p.title || '').slice(0, 80),
    description: String(p.description || '').slice(0, 600),
    condition: p.condition === 'new' ? 'new' : 'used',
    price: Math.max(0, Math.round(Number(p.priceKGS) || 0)),
    confidence: Math.min(99, Math.max(1, Math.round(Number(p.confidence) || 90))),
    modelCertain: p.modelCertain !== false, // false → ИИ не уверен в точной модели/поколении
    specs,
    uncertain: !cat,
  };
}

/* ---------- камера ---------- */

async function visionStartCamera(videoEl) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no-getUserMedia');
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
  VISION.stream = stream;
  videoEl.srcObject = stream;
  await videoEl.play().catch(() => {});
  return stream;
}

function visionStopCamera() {
  if (VISION.stream) {
    VISION.stream.getTracks().forEach(t => t.stop());
    VISION.stream = null;
  }
}

/* кадр video / картинка file → сжатый dataURL */
function visionDownscale(source, maxDim, quality) {
  const sw = source.videoWidth || source.naturalWidth || source.width;
  const sh = source.videoHeight || source.naturalHeight || source.height;
  if (!sw || !sh) return null;
  const scale = Math.min(1, maxDim / Math.max(sw, sh));
  const w = Math.round(sw * scale), h = Math.round(sh * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(source, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality || 0.7);
}

function visionFileToDataURL(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(visionDownscale(img, maxDim, quality));
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* файл → пара версий: lo (для хранения/показа, ~1024) + hi (для распознавания,
   ~1600 — на нём ИИ видит мелкие детали: разъём, кнопки, блок камер) */
function visionFileToPair(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve({
        lo: visionDownscale(img, 1024, 0.72),
        hi: visionDownscale(img, 1600, 0.85),
      });
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* dataURL напрямую отдаём в CLIP (Transformers.js сам читает картинку) */
function visionClassifyDataURL(dataURL) {
  return visionClassify(dataURL);
}
