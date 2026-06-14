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
  ['a photo of a smartphone or mobile phone', 'electronics', 'Телефоны'],
  ['a photo of a laptop computer', 'electronics', 'Ноутбуки'],
  ['a photo of a tablet computer', 'electronics', 'Планшеты'],
  ['a photo of a flat-screen television', 'electronics', 'ТВ и аудио'],
  ['a photo of headphones or earbuds', 'electronics', 'ТВ и аудио'],
  ['a photo of a bluetooth speaker', 'electronics', 'ТВ и аудио'],
  ['a photo of a video game console', 'electronics', 'ТВ и аудио'],
  ['a photo of a digital photo camera', 'electronics', 'Фото и видео'],
  ['a photo of a refrigerator', 'electronics', 'Бытовая техника'],
  ['a photo of a washing machine', 'electronics', 'Бытовая техника'],
  ['a photo of a microwave oven or kitchen appliance', 'electronics', 'Бытовая техника'],
  ['a photo of a vacuum cleaner', 'electronics', 'Бытовая техника'],
  ['a photo of a car or automobile', 'transport', 'Легковые авто'],
  ['a photo of a motorcycle', 'transport', 'Мото'],
  ['a photo of a motor scooter', 'transport', 'Мото'],
  ['a photo of car tires or wheels', 'transport', 'Запчасти и аксессуары'],
  ['a photo of a bicycle', 'hobby', 'Велосипеды'],
  ['a photo of a sofa or couch', 'home', 'Мебель'],
  ['a photo of an armchair or office chair', 'home', 'Мебель'],
  ['a photo of a table or desk', 'home', 'Мебель'],
  ['a photo of a bed', 'home', 'Мебель'],
  ['a photo of a wardrobe or cabinet', 'home', 'Мебель'],
  ['a photo of kitchenware, pots or plates', 'home', 'Посуда и кухня'],
  ['a photo of a power drill or hand tools', 'home', 'Ремонт и стройка'],
  ['a photo of a potted houseplant', 'home', 'Растения'],
  ['a photo of a jacket or winter coat', 'fashion', 'Мужская одежда'],
  ['a photo of a dress', 'fashion', 'Женская одежда'],
  ['a photo of a shirt or t-shirt', 'fashion', 'Мужская одежда'],
  ['a photo of shoes or sneakers', 'fashion', 'Обувь'],
  ['a photo of a handbag or purse', 'fashion', 'Аксессуары'],
  ['a photo of a backpack', 'fashion', 'Аксессуары'],
  ['a photo of a wristwatch', 'fashion', 'Аксессуары'],
  ['a photo of sunglasses', 'fashion', 'Аксессуары'],
  ['a photo of an acoustic or electric guitar', 'hobby', 'Музыка'],
  ['a photo of a piano or music keyboard', 'hobby', 'Музыка'],
  ['a photo of gym or fitness equipment', 'hobby', 'Тренажёры'],
  ['a photo of a camping tent', 'hobby', 'Туризм и отдых'],
  ['a photo of a baby stroller', 'kids', 'Коляски и кресла'],
  ['a photo of a child car seat', 'kids', 'Коляски и кресла'],
  ['a photo of a toy', 'kids', 'Игрушки'],
  ['a photo of a dog', 'animals', 'Собаки'],
  ['a photo of a cat', 'animals', 'Кошки'],
];
const CLIP_PROMPTS = CLIP_LABELS.map(l => l[0]);
const CLIP_BY_PROMPT = Object.fromEntries(CLIP_LABELS.map(([p, c, s]) => [p, { category: c, subcategory: s }]));

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
  const map = CLIP_BY_PROMPT[top.label] || { category: null, subcategory: null };
  const confidence = Math.round(top.score * 100);
  // ближайший результат ДРУГОЙ категории — для оценки уверенности
  const otherCat = res.find(r => (CLIP_BY_PROMPT[r.label] || {}).category !== map.category);
  const margin = otherCat ? top.score - otherCat.score : top.score;
  const uncertain = top.score < 0.18 || margin < 0.05;
  if (uncertain) {
    return { category: null, subcategory: null, label: cleanLabel(top.label), confidence, uncertain: true };
  }
  return { category: map.category, subcategory: map.subcategory, label: cleanLabel(top.label), confidence };
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

/* dataURL напрямую отдаём в CLIP (Transformers.js сам читает картинку) */
function visionClassifyDataURL(dataURL) {
  return visionClassify(dataURL);
}
