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

    const prompt = `Ты — ассистент торговой площадки в Кыргызстане (BAZAR). На фото — товар, который пользователь хочет продать.
Определи его максимально точно: бренд и модель, если их видно. Верни данные для объявления СТРОГО в JSON.
Категорию (поле category = id) и подкатегорию (subcategory — точное название) выбери ТОЛЬКО из этого списка:
${catList}
Требования:
- title: краткий заголовок на русском, с брендом/моделью если различимы (например «iPhone 13 128GB» или «Диван угловой, велюр»).
- description: 1–2 коротких естественных предложения на русском.
- condition: "new" если выглядит новым, иначе "used".
- priceKGS: реалистичная цена в сомах для Кыргызстана (б/у — дешевле).
- specs: 2–4 ключевые характеристики ([{label,value}] на русском), если различимы.
- confidence: 0–100 — насколько уверен.`;

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
            specs: { type: 'ARRAY', items: { type: 'OBJECT', properties: { label: { type: 'STRING' }, value: { type: 'STRING' } } } },
          },
          required: ['category', 'subcategory', 'title', 'description', 'condition', 'priceKGS'],
        },
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_KEY}`;
    let g;
    try {
      g = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (e) {
      return json({ error: 'upstream fetch failed' }, 502);
    }
    if (!g.ok) return json({ error: 'gemini ' + g.status }, 502);

    const data = await g.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return json({ error: 'empty' }, 502);

    // отдаём распарсенный объект — сайт сам нормализует под свой каталог
    try { return json(JSON.parse(text)); }
    catch { return json({ error: 'bad model json' }, 502); }
  },
};
