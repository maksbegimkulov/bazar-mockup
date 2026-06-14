/* ============================================================
   BAZAR — сервер-прокси для точного распознавания товара по фото.
   Деплоится на Cloudflare Workers (бесплатный тариф).

   Зачем: ключ ИИ (Google Gemini) хранится ТУТ, на сервере, как секрет
   (env.GEMINI_KEY). В коде сайта и в браузере пользователя ключа НЕТ —
   значит его нельзя украсть. Браузер шлёт только фото, получает готовое
   объявление. Работает для ВСЕХ пользователей без ввода ключа.

   Деплой — см. server/README-worker.md (5 минут).
   ============================================================ */

const ALLOW_ORIGIN = '*'; // при желании ограничьте доменом сайта

const CORS = {
  'Access-Control-Allow-Origin': ALLOW_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);
    if (!env.GEMINI_KEY) return json({ error: 'GEMINI_KEY not set on server' }, 500);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400); }
    const image = body && body.image;
    if (!image) return json({ error: 'no image' }, 400);

    // список категорий шлёт сам сайт — так сервер всегда в синхроне с каталогом
    const cats = Array.isArray(body.categories) ? body.categories : [];
    const catList = cats.map(c => `${c.id} (${c.name}): ${(c.subs || []).join(' | ')}`).join('\n');

    const prompt = `Ты — ассистент торговой площадки в Кыргызстане (BAZAR). На фото — товар, который пользователь продаёт. Сгенерируй данные объявления СТРОГО в JSON.

ПОРЯДОК АНАЛИЗА (от этого зависит точность):
1. Сначала прочитай ЛЮБОЙ видимый текст: надписи, логотипы, гравировки, модельные номера, наклейки, коробку. Это самый надёжный источник модели.
2. Затем используй отличительные детали. Для смартфонов поколение различают по: тип разъёма (Lightning → iPhone до 14 включительно; USB-C → iPhone 15 и новее), боковые кнопки (физический переключатель «без звука» → до 14; кнопка Action → 15 Pro и новее; кнопка Camera Control справа → 16 и новее), расположение/число модулей камеры, вырез экрана (чёлка → старее; Dynamic Island → новее), материал рамки (титан → Pro 15+). Для ноутбуков/техники — по портам, форме корпуса, логотипу, надписям.

КАТЕГОРИЯ: поле category (=id) и subcategory (точное название) выбери ТОЛЬКО из этого списка:
${catList}

ГЛАВНОЕ ПРАВИЛО — ЧЕСТНОСТЬ ВАЖНЕЕ ТОЧНОСТИ НАУГАД:
- Указывай конкретную модель/поколение ТОЛЬКО при явном подтверждении (видимый текст ИЛИ однозначные визуальные признаки выше).
- Если бренд и линейка ясны, но точное поколение по фото НЕ определить уверенно — НЕ выдумывай число. Дай линейку (например «iPhone Pro», «Samsung Galaxy S», «MacBook Air») и поставь modelCertain=false. Лучше общее, но верное, чем конкретное, но неверное — продавец уточнит модель сам.
- НИКОГДА не подставляй «знакомую/популярную» модель просто потому, что она частая (это главная ошибка — не пиши «iPhone 14 Pro» для любого Pro-айфона).

ПОЛЯ JSON:
- title: краткий ЧИСТЫЙ заголовок на русском — лучшая идентификация, которую можешь подтвердить: бренд + линейка + видимые признаки (цвет, объём если виден). НЕ добавляй служебные слова вроде «уточните» в заголовок. Если точная модель видна/подтверждена — укажи её («iPhone 15 Pro 256GB», «Кроссовки Nike Air Max 90»). Если нет — без выдуманного номера, просто линейка («iPhone Pro», «Кроссовки Nike», «MacBook Air»).
- modelCertain: true, если заголовок достоверно описывает товар. false — ТОЛЬКО для техники, где важно точное поколение/модель (телефоны, ноутбуки, планшеты, смарт-часы, игровые консоли), а ты НЕ уверен в нём по фото. Для товаров без значимой модели (мебель, обычная одежда, посуда, инструмент) — ВСЕГДА true. Не ставь false просто из-за неизвестного объёма памяти.
- description: 1–2 коротких естественных предложения на русском. Без выдуманных характеристик.
- condition: "new" если выглядит новым, иначе "used".
- priceKGS: реалистичная цена в сомах для Кыргызстана; если модель не точна — ориентир по линейке (б/у дешевле).
- specs: 2–4 характеристики ([{label,value}] на русском) ТОЛЬКО реально видимые/достоверные (цвет, тип разъёма, число камер). НЕ выдумывай объём памяти/год, если их не видно.
- confidence: 0–100 — общая уверенность (с учётом неопределённости модели).`;

    const payload = {
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: image } }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            category: { type: 'STRING' }, subcategory: { type: 'STRING' },
            title: { type: 'STRING' }, description: { type: 'STRING' },
            condition: { type: 'STRING' }, priceKGS: { type: 'NUMBER' }, confidence: { type: 'NUMBER' },
            modelCertain: { type: 'BOOLEAN' },
            specs: { type: 'ARRAY', items: { type: 'OBJECT', properties: { label: { type: 'STRING' }, value: { type: 'STRING' } } } },
          },
          required: ['category', 'subcategory', 'title', 'description', 'condition', 'priceKGS', 'modelCertain'],
        },
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_KEY}`;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    // повтор ТОЛЬКО при временной перегрузке сервера Gemini (500/503).
    // 429 = исчерпана квота — повтор лишь сожжёт её ещё быстрее, поэтому сразу
    // отдаём ошибку, и сайт мягко падает на встроенный движок (категория).
    let g = null, lastStatus = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        g = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } catch (e) {
        g = null; lastStatus = 0; await sleep(500 * (attempt + 1)); continue;
      }
      if (g.ok) break;
      lastStatus = g.status;
      if (g.status === 500 || g.status === 503) { g = null; await sleep(500 * (attempt + 1)); continue; }
      break; // 429 (квота) / 400/401/403 — повтор не поможет, быстрый фолбэк
    }
    if (!g || !g.ok) return json({ error: 'gemini ' + (g ? g.status : lastStatus), retryable: lastStatus === 429 || lastStatus === 503 }, 502);

    const data = await g.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return json({ error: 'empty' }, 502);

    // отдаём распарсенный объект — сайт сам нормализует под свой каталог
    try { return json(JSON.parse(text)); }
    catch { return json({ error: 'bad model json' }, 502); }
  },
};
