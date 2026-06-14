# Точное распознавание для всех — деплой сервера (5 минут)

Это превращает «Сделать фото» в распознавание уровня Gemini (бренд, модель,
описание, цена) **для всех пользователей сразу, без ввода ключа**. Ключ ИИ
лежит на сервере как секрет — в коде сайта и в браузере его нет, украсть нельзя.

## Что нужно
- Бесплатный аккаунт Cloudflare (https://dash.cloudflare.com/sign-up)
- Новый ключ Google AI Studio: https://aistudio.google.com/apikey
  (старый, который светился в чате, **удали и создай новый**)
- Node.js на компьютере

## Шаги

```bash
# 1. ставим Wrangler (CLI Cloudflare)
npm install -g wrangler

# 2. логинимся (откроется браузер — разреши доступ)
wrangler login

# 3. из папки server деплоим воркер (конфиг в wrangler.toml)
cd server
wrangler deploy

# 4. кладём ключ Gemini как СЕКРЕТ (он не попадёт в код)
wrangler secret put GEMINI_KEY
#   вставь новый ключ, Enter
```

После `wrangler deploy` в консоли будет URL вида:
`https://bazar-recognize.<твой-субдомен>.workers.dev`

## Последний шаг — включить на сайте

В файле `js/vision.js` впиши этот URL:

```js
const SMART_ENDPOINT = 'https://bazar-recognize.<твой-субдомен>.workers.dev';
```

Запушь — и точное распознавание включится для всех. Пусто (`''`) = выключено,
сайт работает на встроенном движке без сервера.

## Проверка

```bash
curl -X POST https://bazar-recognize.<субдомен>.workers.dev \
  -H 'Content-Type: application/json' \
  -d '{"image":"<base64-jpeg>","categories":[{"id":"electronics","name":"Электроника","subs":["Телефоны"]}]}'
```

Должен вернуть JSON с `category`, `title`, `priceKGS` и т.д.

## Деньги
Gemini Flash и Cloudflare Workers — щедрые бесплатные лимиты. Для демо и
сотен распознаваний в день платить не нужно. Если пойдут тысячи в день —
включишь биллинг Google и поставишь дневной лимит в консоли.
