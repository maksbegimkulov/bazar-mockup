/* ============================================================
   BAZAR — реальное распознавание товара по фото (on-device).
   Камера (getUserMedia + file-capture fallback) + классификация
   через TensorFlow.js MobileNet, загружаемый лениво с CDN.
   Без бэкенда и без API-ключей — всё в браузере пользователя.
   ============================================================ */

const VISION = { model: null, loading: null, stream: null };

function vLoadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('script: ' + src));
    document.head.appendChild(s);
  });
}

/* ленивый прогрев модели: грузим tfjs + mobilenet только при первом распознавании */
async function visionLoadModel() {
  if (VISION.model) return VISION.model;
  if (VISION.loading) return VISION.loading;
  VISION.loading = (async () => {
    if (!window.tf) await vLoadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
    if (!window.mobilenet) await vLoadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js');
    VISION.model = await window.mobilenet.load({ version: 2, alpha: 1.0 });
    return VISION.model;
  })();
  try {
    return await VISION.loading;
  } catch (e) {
    VISION.loading = null;
    throw e;
  }
}

/* классы ImageNet → категории BAZAR (первое совпадение сверху вниз) */
const IMAGENET_MAP = [
  [/cellular|cell phone|cellphone|smartphone|ipod|hand-held|pay-phone|dial telephone/, 'electronics', 'Телефоны'],
  [/laptop|notebook computer/, 'electronics', 'Ноутбуки'],
  [/desktop computer|monitor|screen|television|home theater|projector/, 'electronics', 'ТВ и аудио'],
  [/loudspeaker|microphone|radio|cassette|tape player|cd player|ipod/, 'electronics', 'ТВ и аудио'],
  [/refrigerator|washer|washing machine|dishwasher|microwave|vacuum|espresso|toaster|oven|space heater/, 'electronics', 'Бытовая техника'],
  [/reflex camera|polaroid|lens cap|tripod|projector/, 'electronics', 'Фото и видео'],
  [/tablet|hand-held computer|e-reader/, 'electronics', 'Планшеты'],
  [/sports car|convertible|minivan|pickup|jeep|limousine|cab|station wagon|car wheel|grille|beach wagon|racer|car mirror/, 'transport', 'Легковые авто'],
  [/moped|motor scooter|motorcycle|go-kart/, 'transport', 'Мото'],
  [/garbage truck|tow truck|trailer truck|moving van|minibus|school bus|fire engine/, 'transport', 'Грузовой транспорт'],
  [/mountain bike|bicycle|tandem|tricycle|unicycle/, 'hobby', 'Велосипеды'],
  [/dumbbell|barbell|ski|snowboard|punching bag/, 'hobby', 'Тренажёры'],
  [/acoustic guitar|electric guitar|grand piano|upright piano|drum|violin|cello|saxophone|trumpet|accordion/, 'hobby', 'Музыка'],
  [/mountain tent|backpack.*tent|canoe|paddle|tent/, 'hobby', 'Туризм и отдых'],
  [/studio couch|couch|sofa|rocking chair|folding chair|throne|dining table|desk|wardrobe|bookcase|chiffonier|china cabinet|four-poster|crib|table lamp/, 'home', 'Мебель'],
  [/power drill|hammer|chain saw|lawn mower|plane|hatchet/, 'home', 'Ремонт и стройка'],
  [/teapot|coffeepot|frying pan|wok|caldron|plate|bowl|cup|water jug|mixing bowl/, 'home', 'Посуда и кухня'],
  [/pot|flowerpot|vase/, 'home', 'Растения'],
  [/backpack|purse|wallet|handbag|mailbag|sleeping bag/, 'fashion', 'Аксессуары'],
  [/analog clock|digital watch|wall clock|stopwatch|sunglass|sunglasses/, 'fashion', 'Аксессуары'],
  [/jersey|sweatshirt|cardigan|suit|jean|trench coat|fur coat|gown|kimono|poncho|jacket|abaya|cloak|vestment|miniskirt|overskirt|brassiere/, 'fashion', 'Мужская одежда'],
  [/running shoe|sandal|loafer|cowboy boot|clog|sock/, 'fashion', 'Обувь'],
  [/cradle|bassinet|crib|toyshop|teddy/, 'kids', 'Игрушки'],
  [/golden retriever|labrador|husky|pomeranian|poodle|chihuahua|german shepherd|bulldog|terrier|spaniel|collie/, 'animals', 'Собаки'],
  [/tabby|tiger cat|persian cat|siamese|egyptian cat|cat/, 'animals', 'Кошки'],
  [/macaw|parrot|lorikeet|goldfish|cockatoo/, 'animals', 'Птицы и рыбки'],
];

/* prediction[].className → { category, subcategory } | null */
function mapPrediction(preds) {
  for (const p of preds) {
    const name = p.className.toLowerCase();
    for (const [re, cat, sub] of IMAGENET_MAP) {
      if (re.test(name)) return { category: cat, subcategory: sub, label: p.className.split(',')[0], confidence: Math.round(p.probability * 100) };
    }
  }
  // не распознали категорию — отдаём верхний класс как подсказку
  return { category: null, subcategory: null, label: preds[0] ? preds[0].className.split(',')[0] : '', confidence: preds[0] ? Math.round(preds[0].probability * 100) : 0 };
}

async function visionClassify(imgEl) {
  const model = await visionLoadModel();
  const preds = await model.classify(imgEl, 5);
  return mapPrediction(preds);
}

/* ---------- камера ---------- */

async function visionStartCamera(videoEl) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no-getUserMedia');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } }, audio: false,
  });
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

/* кадр из video / картинку из file → сжатый dataURL (для localStorage и объявления) */
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

/* классификация по dataURL (когда нет живого video-элемента) */
function visionClassifyDataURL(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => { try { resolve(await visionClassify(img)); } catch (e) { reject(e); } };
    img.onerror = reject;
    img.src = dataURL;
  });
}
