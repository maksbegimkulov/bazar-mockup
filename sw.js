/* ============================================================
   Service worker BAZAR.

   Главное правило: НИКАКОГО cache-first для оболочки. На прошлых проектах
   этим обжигались — cache-first прячет деплой, и человек на телефоне ещё
   неделю ходит по старой версии, а исправленный баг «не исправился».

   Поэтому здесь network-first: сеть отвечает — берём её и обновляем кеш;
   сети нет — отдаём последнее сохранённое. Кеш нужен ровно для офлайна,
   а не для скорости.
   ============================================================ */

const VERSION = 69;                    // бампается вместе с BUILD в index.html
const CACHE = 'bazar-v' + VERSION;

/* Оболочка = всё, что перечислено в index.html. Узкий список не годится:
   без каталогов и генератора приложение офлайн открывается пустым — шапка
   есть, объявлений нет. Скрипты, загруженные ДО активации воркера, через
   его fetch не проходят и в кеш сами не попадают, поэтому кладём явно.
   Версия подставляется из VERSION — при деплое бампается ОДНО число, иначе
   воркер будет тянуть в кеш файлы прошлой сборки. */
const V = '?v=' + VERSION;
const SHELL = ['./', './index.html', './manifest.webmanifest'].concat([
  'css/styles.css',
  'js/catalog/auto-world.js', 'js/catalog/auto-china.js',
  'js/catalog/tech-mobile.js', 'js/catalog/tech-compute.js', 'js/catalog/index.js',
  'js/data.js', 'js/generate.js', 'js/nlu.js', 'js/i18n.js', 'js/attributes.js',
  'js/search.js', 'js/map.js', 'js/vision.js', 'js/auth.js', 'js/api.js', 'js/app.js', 'js/ai.js',
].map(u => './' + u + V));

self.addEventListener('install', e => {
  // addAll падает целиком, если хоть один файл не отдался; для офлайна лучше
  // сохранить что получилось, чем не сохранить ничего
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // чужие домены не трогаем вообще: Supabase, распознавание фото, шрифты.
  // Кешировать ответы API — прямой путь к «показывает вчерашние объявления».
  if (url.origin !== self.location.origin) return;

  // version.txt — датчик обновления. Закешируешь его, и авто-апдейт ослепнет.
  if (url.pathname.endsWith('version.txt')) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => {
        if (hit) return hit;
        // офлайн и запрошенной страницы нет — отдаём оболочку,
        // маршрутизация всё равно живёт в hash'е
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      }))
  );
});
