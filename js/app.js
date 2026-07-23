/* ============================================================
   BAZAR mockup — приложение: роутинг, фильтры, чаты, избранное
   ============================================================ */

const NOW = Date.now();
const PAGE_SIZE = 24;
const USER_NAME = 'Максат';

const LS = {
  favs: 'bazar_favs',
  my: 'bazar_my',
  chats: 'bazar_chats',
  view: 'bazar_view',
  city: 'bazar_city',
  hist: 'bazar_hist',
  viewed: 'bazar_viewed',
  saved: 'bazar_saved',     // сохранённые поиски (Авито «Уведомлять о новых»)
  compare: 'bazar_compare', // выбранные для сравнения id (Авто.ру «Сравнить»)
  sold: 'bazar_sold',       // локально отмеченные «продано»/«архив» id
  reported: 'bazar_reported', // id, на которые юзер пожаловался (прячем у него)
  reportLog: 'bazar_report_log', // причина жалобы: копится до появления серверной модерации
  chatRead: 'bazar_chat_read', // chatId → ts последнего прочитанного (для unread DB-чатов)
  postDraft: 'bazar_post_draft', // незаконченное объявление (не терять при уходе)
  favMeta: 'bazar_fav_meta',     // по избранному: цена на момент добавления, заметка, статус
};

/* lsLoad / lsSave определены в i18n.js (грузится раньше) */

const state = {};
state.city = lsLoad(LS.city, 'all');
state.favorites = new Set(lsLoad(LS.favs, []));
state.myListings = lsLoad(LS.my, []);
// чистим возможный мусор от старых версий (кэш индекса в localStorage)
state.myListings.forEach(l => { delete l.__idx; });
state.chats = lsLoad(LS.chats, {});
state.view = lsLoad(LS.view, 'grid');
state.viewed = lsLoad(LS.viewed, []); // недавно просмотренные id
state.saved = lsLoad(LS.saved, []);   // сохранённые поиски [{id,name,f,seen,ts}]
state.compare = new Set(lsLoad(LS.compare, [])); // id для сравнения
state.soldIds = new Set(lsLoad(LS.sold, []));    // отмеченные продано/архив (мок/демо)
state.reported = new Set(lsLoad(LS.reported, [])); // id с жалобой юзера — прячем у него
state.chatRead = lsLoad(LS.chatRead, {});          // chatId → ts прочитанного
state.favMeta = lsLoad(LS.favMeta, {});            // id → {price, ts, note, gone}
state.page = 1;
state.galleryIndex = 0;
state.auth = { mode: 'login', method: 'email' };  // экран входа/регистрации
state._scroll = {};      // позиции скролла списков для возврата «назад»
state._appliedQS = null; // последний применённый query из hash

function defaultFilters() {
  return {
    q: '', cat: '', sub: '',
    priceMin: '', priceMax: '',
    city: state.city,
    condition: 'any', sellerType: 'any',
    withPhoto: false, delivery: false,
    period: 'all', sort: 'date',
    attrs: {}, // фильтры по характеристикам (бренд/модель/год/спеки)
  };
}
state.filters = defaultFilters();

/* ---------------- утилиты ---------------- */

const $ = sel => document.querySelector(sel);
const app = $('#app');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function fmtNum(n) { return Number(n).toLocaleString('ru-RU'); }

/* «5 объявлений» — счётчик с учётом языка (listingsWord в i18n.js) */
function nLabel(n) { return `${fmtNum(n)} ${listingsWord(n)}`; }

/* перевод названия категории (контент объявлений остаётся на русском) */
function catName(c) {
  if (!c) return '';
  if (LANG === 'ru') return c.name;
  return (CAT_I18N[c.id] && CAT_I18N[c.id][LANG]) || c.name;
}
function catNameById(id) { return catName(catById(id)); }

function cityLabel(c) { return c === 'all' ? t('city.all') : c; }

function hoursAgo(l) {
  return l.createdAt ? (NOW - l.createdAt) / 36e5 : l.postedHoursAgo;
}

function postedLabel(l) {
  const h = hoursAgo(l);
  if (h < 1) return t('time.now');
  if (h < 24) return t('time.today');
  if (h < 48) return t('time.yesterday');
  return daysAgoLabel(Math.floor(h / 24));
}

function priceHTML(l) {
  if (l.negotiable || l.price === 0) return t('price.negotiable');
  return `${fmtNum(l.price)} <span class="suffix">${t('som')}${esc(l.priceSuffix)}</span>`;
}

function getPhotos(l) {
  if (l.userPhotos && l.userPhotos.length) return l.userPhotos; // реальные фото с камеры
  if (l.pickedSeeds) return l.pickedSeeds.map(s => photoURL(l.category, s, l.subcategory));
  if (!l.photoCount) return [];
  return Array.from({ length: l.photoCount }, (_, i) => photoURL(l.category, l.photoSeed + i * 13, l.subcategory));
}

function catById(id) { return CATEGORIES.find(c => c.id === id); }

state.dbListings = []; // реальные объявления из Supabase (от всех юзеров)
function allListings() { return [...state.myListings, ...state.dbListings, ...LISTINGS]; }

/* строгий allowlist фото из чужой БД: только настоящие base64-картинки.
   Любая другая строка (потенциальный XSS через кавычку в src) отбрасывается. */
const DB_PHOTO_RE = /^data:image\/(png|jpe?g|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/;

/* строка из БД → форма объявления, понятная приложению */
function dbToListing(r, profs) {
  const raw = Array.isArray(r.photos) ? r.photos : [];
  // реальные фото (камера/ИИ) приходят как data-URI строки → userPhotos (рендерим как есть);
  // демо-сиды (числа) → pickedSeeds (через photoURL-заглушки)
  const realPhotos = raw.length && typeof raw[0] === 'string' && String(raw[0]).startsWith('data:');
  const photos = realPhotos
    ? raw.filter(p => typeof p === 'string' && DB_PHOTO_RE.test(p))
    : raw.filter(p => typeof p === 'number');
  // служебные поля внутри attrs (телефон/спеки едут в jsonb без миграции схемы);
  // в сами атрибуты-фильтры они не попадают — вычищаем
  const allAttrs = (r.attrs && typeof r.attrs === 'object') ? r.attrs : {};
  const { _phone, _specs, ...attrs } = allAttrs;
  return {
    id: r.id, ownerId: r.owner_id, title: r.title,
    // floor приходит только в СВОИХ строках (после insert .select() по таблице);
    // из public_listings его нет — там has_floor. Для чужих объявлений торг
    // считает сервер (rpc_make_offer), точное число клиенту не нужно.
    price: Number(r.price) || 0, floor: Number(r.floor) || 0, priceSuffix: '',
    hasFloor: r.has_floor != null ? !!r.has_floor : (Number(r.floor) > 0),
    negotiable: !!r.negotiable, category: r.category, subcategory: r.subcategory,
    city: r.city, district: r.district || null, condition: r.condition || null,
    description: r.description || '',
    userPhotos: realPhotos ? photos : null,
    pickedSeeds: realPhotos ? null : photos, photoCount: photos.length, photoSeed: 11,
    attrs,
    specs: Array.isArray(_specs) ? _specs.filter(x => Array.isArray(x) && x.length === 2) : undefined,
    // profs[owner] — публичный профиль (или строка-имя со старых мест вызова)
    ...(() => {
      const p = profs && profs[r.owner_id];
      const prof = (p && typeof p === 'object') ? p : null;
      return {
        sellerName: (prof ? prof.name : (typeof p === 'string' ? p : '')) || t('seller.anon'),
        sellerType: prof && prof.kind === 'business' ? 'business' : 'private',
        // РЕАЛЬНЫЕ рейтинг/отзывы из профиля; 0 отзывов = новый продавец (честно)
        sellerRating: prof ? Number(prof.rating) || 0 : 0,
        sellerReviews: prof ? Number(prof.reviews_count) || 0 : 0,
        sellerSinceYear: prof && prof.created_at ? new Date(prof.created_at).getFullYear() : 2026,
        sellerReal: true, // отзывы/рейтинг — из БД, не из хеша
      };
    })(),
    sellerAds: 1,
    createdAt: new Date(r.created_at).getTime(),
    postedHoursAgo: Math.max(0, Math.round((Date.now() - new Date(r.created_at).getTime()) / 3600000)),
    views: Number(r.views_count) || 0, isVip: false, isUrgent: false, hasDelivery: false,
    phone: typeof _phone === 'string' ? _phone.slice(0, 24) : '',
  };
}

/* подтянуть из облака: реальные объявления + чаты пользователя (с именами участников) */
async function loadCloudData() {
  if (typeof sb === 'undefined' || !sb) { state.dbListings = []; return; }
  const me = isAuthed() ? currentUser().id : null; // гость → me=null
  try {
    const rows = await dbAllListings();             // реальные объявления — ВИДНЫ ВСЕМ, включая гостей
    const chats = me ? await dbMyChats() : [];      // личные чаты — только залогиненным
    const ids = new Set();
    rows.forEach(r => ids.add(r.owner_id));
    chats.forEach(c => { ids.add(c.buyer_id); ids.add(c.seller_id); });
    // тянем ПУБЛИЧНЫЙ профиль: реальные имя/рейтинг/отзывы/тип продавца.
    // Раньше брали только name и рисовали рейтинг из хеша — теперь честно.
    let profs = {};
    if (ids.size) {
      const { data } = await sb.from('public_profiles')
        .select('id,name,rating,reviews_count,kind,created_at').in('id', [...ids]);
      (data || []).forEach(p => profs[p.id] = p);
    }
    state.dbListings = rows.map(r => dbToListing(r, profs));
    state._cloudLoaded = true;
    // чистим «фантомы»: облачное объявление удалили — из избранного/сравнения тоже
    let pruned = false;
    // избранное не чистим молча: человек должен понять, что объявление сняли,
    // а не гадать, куда оно делось. Помечаем и показываем в списке.
    for (const oid of [...state.favorites]) {
      if (!getListing(oid)) {
        state.favMeta[oid] = { ...(state.favMeta[oid] || {}), gone: true };
        pruned = true;
      } else if (state.favMeta[oid] && state.favMeta[oid].gone) {
        delete state.favMeta[oid].gone; pruned = true;
      }
    }
    if (pruned) lsSave(LS.favMeta, state.favMeta);
    for (const oid of [...state.compare]) if (!getListing(oid)) { state.compare.delete(oid); pruned = true; }
    if (pruned) {
      lsSave(LS.favs, [...state.favorites]);
      lsSave(LS.compare, [...state.compare]);
      updateCompareBar();
    }
    if (me) {
      // МЕРЖ, а не перезапись: локальные мок/демо-чаты (без isDb) живут дальше,
      // DB-чаты обновляются; свои сообщения «в полёте» (ещё без id) не теряем
      const fresh = {};
      for (const c of chats) {
        const msgs = await dbMessages(c.id);
        const otherId = c.buyer_id === me ? c.seller_id : c.buyer_id;
        const messages = msgs.map(m => ({ from: m.sender_id === me ? 'me' : 'them', text: m.text, ts: new Date(m.created_at).getTime(), id: m.id }));
        const old = state.chats[c.id];
        if (old && Array.isArray(old.messages)) {
          old.messages.forEach(m => { if (m.from === 'me' && !m.id) messages.push(m); });
        }
        const last = messages[messages.length - 1];
        fresh[c.id] = {
          itemId: c.listing_ref, chatId: c.id, isDb: true,
          sellerId: c.seller_id, buyerId: c.buyer_id, otherName: (profs[otherId] && profs[otherId].name) || t('seller.anon'),
          title: c.listing_title,
          messages,
          // непрочитано = последнее сообщение от собеседника новее моей отметки прочтения
          unread: !!(last && last.from === 'them' && last.ts > (state.chatRead[c.id] || 0)),
          updatedAt: new Date(c.updated_at).getTime(),
        };
      }
      for (const k of Object.keys(state.chats)) if (state.chats[k].isDb && !fresh[k]) delete state.chats[k];
      Object.assign(state.chats, fresh);

      // синк избранного/сохранённых поисков (переживают смену устройства)
      await syncFavoritesFromCloud();
      await syncSavedFromCloud();
      refreshNotifCount();
    }
    updateBadges();
    // точечный рефреш: открытый чат НЕ ререндерим (сотрёт набранный текст) — только
    // дорисовываем новые сообщения; /item не трогаем (собьёт скролл и галерею)
    const p = parseHash().path;
    if (p === '/' || p === '' || p.startsWith('/search') || p.startsWith('/profile') || p === '/chats') router();
    else if (p.startsWith('/chats/')) syncOpenChat(decodeURIComponent(p.slice(7)));
  } catch (e) { /* офлайн/ошибка — оставляем что есть */ }
}

/* Избранное: облако ↔ локально (мерж, не перезапись). Синкаются только
   облачные объявления (uuid id) — у демо id не-uuid, FK к listings не пустит. */
async function syncFavoritesFromCloud() {
  if (typeof BZ === 'undefined' || !BZ.available()) return;
  const cloud = await BZ.favorites.list();
  if (!Array.isArray(cloud)) return;
  const cloudIds = new Set(cloud.map(f => f.listing_id));
  let changed = false;
  for (const f of cloud) {
    if (!state.favorites.has(f.listing_id)) {
      state.favorites.add(f.listing_id);
      if (f.price_at_add != null && !state.favMeta[f.listing_id]) {
        state.favMeta[f.listing_id] = { price: Number(f.price_at_add) || 0, ts: Date.now() };
      }
      changed = true;
    }
  }
  // локальные облачные избранные, которых нет в облаке (добавляли до входа) → вверх
  for (const id of state.favorites) {
    if (typeof id === 'string' && id.includes('-') && !cloudIds.has(id)) {
      const l = getListing(id);
      BZ.favorites.add(id, l ? l.price : null, null, null);
    }
  }
  if (changed) { lsSave(LS.favs, [...state.favorites]); lsSave(LS.favMeta, state.favMeta); updateBadges(); }
}

/* Сохранённые поиски: облако ↔ локально по имени. */
async function syncSavedFromCloud() {
  if (typeof BZ === 'undefined' || !BZ.available()) return;
  const cloud = await BZ.savedSearches.list();
  if (!Array.isArray(cloud)) return;
  const localNames = new Set(state.saved.map(s => s.name));
  let changed = false;
  for (const c of cloud) {
    if (!localNames.has(c.name)) {
      state.saved.unshift({ id: c.id, name: c.name, f: c.query || {}, seen: 0, seenIds: [],
        ts: Date.now(), cloud: true, notify: c.notify !== false });
      changed = true;
    }
  }
  const cloudNames = new Set(cloud.map(c => c.name));
  for (const s of state.saved) {
    if (!cloudNames.has(s.name)) BZ.savedSearches.add(s.name, s.f, s.notify !== false);
  }
  if (changed) { state.saved = state.saved.slice(0, 30); lsSave(LS.saved, state.saved); }
}

/* мягкая синхронизация открытого диалога: дорисовать новые сообщения без ререндера */
function syncOpenChat(key) {
  const chat = state.chats[key];
  const box = $('#chatMsgs');
  if (!chat || !box) { updateBadges(); return; }
  const have = box.querySelectorAll('.msg').length;
  if (chat.messages.length > have) {
    for (let i = have; i < chat.messages.length; i++) appendChatMsg(key, chat.messages[i]);
    markChatRead(key);
    chat.unread = false;
    updateBadges();
  }
}

/* отметка «прочитано» для DB-чата — от неё считается unread после перезагрузки */
function markChatRead(key) {
  const c = state.chats[key];
  if (!c || !c.isDb) return;
  const last = c.messages[c.messages.length - 1];
  state.chatRead[key] = last ? last.ts : Date.now();
  lsSave(LS.chatRead, state.chatRead);
}

/* realtime: любое новое/изменённое объявление → перезагрузить ленту (видно всем live).
   Дебаунс, чтобы пачка вставок не дёргала рендер. Идемпотентно — один канал.
   УСТОЙЧИВОСТЬ: если realtime-сокет не поднялся (наблюдали живьём: endpoint
   рвёт WS с кодом 1006 при живом REST) — тихий фолбэк-поллинг раз в 60с
   (только в видимой вкладке), чтобы лента всё равно оставалась свежей. */
let _listingsLiveT = null, _listingsLiveSub = null, _livePoll = null, _liveUp = false;
function _startLivePolling() {
  if (_livePoll) return;
  _livePoll = setInterval(() => {
    if (document.visibilityState === 'visible' && !_liveUp) loadCloudData();
  }, 60000);
}
function startListingsLive() {
  if (_listingsLiveSub || typeof dbSubscribeListings !== 'function') return;
  _listingsLiveSub = dbSubscribeListings(() => {
    clearTimeout(_listingsLiveT);
    _listingsLiveT = setTimeout(loadCloudData, 350);
  }, status => {
    _liveUp = status === 'SUBSCRIBED';
    if (!_liveUp) _startLivePolling();
    else if (_livePoll) { clearInterval(_livePoll); _livePoll = null; }
  });
  // если сокет умер молча (ни SUBSCRIBED, ни ошибки) — поллинг как страховка
  setTimeout(() => { if (!_liveUp) _startLivePolling(); }, 8000);
}

/* realtime своих чатов: новые диалоги/сообщения подтягиваются live даже когда
   нужный чат не открыт (раньше это работало только через перезагрузку) */
let _myChatsSub = null, _myChatsT = null, _myChatsUid = null;
function startMyChatsLive() {
  const uid = isAuthed() ? currentUser().id : null;
  if (!uid || typeof dbSubscribeMyChats !== 'function') {
    if (_myChatsSub) { _myChatsSub(); _myChatsSub = null; _myChatsUid = null; }
    return;
  }
  if (_myChatsSub && _myChatsUid === uid) return;
  if (_myChatsSub) _myChatsSub();
  _myChatsUid = uid;
  _myChatsSub = dbSubscribeMyChats(() => {
    clearTimeout(_myChatsT);
    _myChatsT = setTimeout(loadCloudData, 350);
  });
}

function getListing(id) { return allListings().find(l => l.id === id); }

/* ============================================================
   НОВЫЕ ФИЧИ (как у Avito/Auto.ru): продавцы+рейтинги, сравнение,
   сохранённые поиски, статус продано/архив.
   ============================================================ */

/* ключ продавца: реальный ownerId или имя (для мок-данных) */
function sellerKey(l) { return l.ownerId || ('name:' + (l.sellerName || '')); }

/* «47 отзывов» с правильным склонением */
function ratingWord(n) {
  if (LANG === 'en') return n + (n === 1 ? ' review' : ' reviews');
  if (LANG === 'ky') return n + ' пикир';
  const m10 = n % 10, m100 = n % 100;
  let w = 'отзывов';
  if (m10 === 1 && m100 !== 11) w = 'отзыв';
  else if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) w = 'отзыва';
  return n + ' ' + w;
}

/* Подпись рейтинга продавца: реальная звезда+отзывы, либо честный «Новый
   продавец» когда отзывов ещё нет (вместо выдуманного ★4.8). */
function sellerRatingHTML(ss) {
  if (ss.isNew) return `<span class="seller-new">${t('seller.new')}</span>`;
  return `<span class="seller-rating"><span class="star">★</span> ${ss.rating}</span> · ${ratingWord(ss.reviews)}`;
}

/* Рейтинг/отзывы продавца.
   Реальные облачные продавцы (l.sellerReal) → честные данные из БД: если
   отзывов ещё нет, это НОВЫЙ продавец (isNew), а не выдуманные «★4.8 · 47».
   Демо-каталог (сгенерированные объявления) → детерминированные правдоподобные
   значения; весь этот каталог — демонстрационный по своей природе. */
function sellerStats(l) {
  if (l && l.sellerReal) {
    const reviews = Number(l.sellerReviews) || 0;
    return {
      rating: reviews ? (Number(l.sellerRating) || 0).toFixed(1) : null,
      reviews,
      isNew: reviews === 0,
      verified: false,        // раздельные верификации подключим отдельно
      business: l.sellerType === 'business',
      real: true,
    };
  }
  const key = sellerKey(l);
  let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return {
    rating: ((40 + (h % 11)) / 10).toFixed(1),  // 4.0..5.0
    reviews: 3 + (h % 180),                       // 3..182
    isNew: false,
    verified: (h % 3) !== 0,                      // ~2/3 проверены
    business: l.sellerType === 'business',
    demo: true,
  };
}

/* объявление продано/в архиве? (исключаем из поиска/ленты) */
function isSold(l) { return l && (l.status === 'sold' || l.status === 'archived' || state.soldIds.has(l.id)); }
function listingStatus(l) { return l.status || (state.soldIds.has(l.id) ? 'sold' : 'active'); }

/* активные объявления продавца */
function sellerActiveListings(key) { return allListings().filter(l => sellerKey(l) === key && !isSold(l)); }

/* ---- сравнение (Авто.ру «Сравнить») ---- */
function inCompare(id) { return state.compare.has(id); }
function toggleCompare(id) {
  if (state.compare.has(id)) state.compare.delete(id);
  else {
    if (state.compare.size >= 4) { showToast(t('cmp.max')); return false; }
    state.compare.add(id);
  }
  lsSave(LS.compare, [...state.compare]);
  return true;
}
function clearCompare() { state.compare.clear(); lsSave(LS.compare, []); }

/* ---- сохранённые поиски (Авито «Уведомлять о новых») ---- */
function saveCurrentSearch() {
  const f = state.filters;
  if (state.saved.some(s => JSON.stringify(s.f) === JSON.stringify(f))) { showToast(t('saved.dup')); return false; }
  const name = searchTitle(f).replace(/<[^>]*>/g, '');
  const ids = applyFilters(f).map(l => l.id).slice(0, 3000); // снапшот увиденных id
  state.saved.unshift({ id: 's' + Date.now(), name, f: JSON.parse(JSON.stringify(f)), seen: ids.length, seenIds: ids, ts: Date.now(), notify: true });
  state.saved = state.saved.slice(0, 30);
  lsSave(LS.saved, state.saved);
  // залогинен → в облако (уведомления о новых объявлениях приходят с сервера)
  if (typeof BZ !== 'undefined' && BZ.available() && typeof isAuthed === 'function' && isAuthed()) {
    BZ.savedSearches.add(name, f, true);
  }
  return true;
}
function savedNewCount(s) {
  // по снапшоту id: удаления не маскируют новинки (разница счётчиков это скрывала)
  if (Array.isArray(s.seenIds)) {
    const seen = new Set(s.seenIds);
    return applyFilters(s.f).filter(l => !seen.has(l.id)).length;
  }
  return Math.max(0, applyFilters(s.f).length - (s.seen || 0)); // старые записи
}
function removeSaved(id) {
  const s = state.saved.find(x => x.id === id);
  state.saved = state.saved.filter(x => x.id !== id);
  lsSave(LS.saved, state.saved);
  // облачную запись убираем и на сервере (id из БД — uuid)
  if (s && s.cloud && typeof BZ !== 'undefined' && BZ.available()) BZ.savedSearches.remove(id);
}
function openSavedSearch(id) {
  const s = state.saved.find(x => x.id === id);
  if (!s) return;
  const cur = applyFilters(s.f); // отметили просмотренным → бейдж сбрасывается
  s.seen = cur.length;
  s.seenIds = cur.map(l => l.id).slice(0, 3000);
  lsSave(LS.saved, state.saved);
  // мерж с дефолтами: старые сохранённые снимки могут не знать новых полей фильтра
  state.filters = { ...defaultFilters(), ...JSON.parse(JSON.stringify(s.f)) };
  state.page = 1;
  state._appliedQS = 'saved'; // не сбрасывать фильтры роутером
  const inp = $('#searchInput'); if (inp) inp.value = state.filters.qRaw || state.filters.q || ''; // строка = активный запрос
  location.hash = '#/search';
  if (parseHash().path.startsWith('/search')) renderSearch();
}

function avatarStyle(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `background: hsl(${h}, 55%, 52%)`;
}

function showToast(text, type = '') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = text;
  $('#toastWrap').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; }, 2300);
  setTimeout(() => t.remove(), 2700);
}

/* ---------------- скролл-лок (iOS-надёжный: body position:fixed) ---------------- */

const _lockOwners = new Set();
let _lockY = 0;
function lockScroll(owner) {
  if (_lockOwners.size === 0) {
    _lockY = window.scrollY;
    document.body.style.cssText = `overflow:hidden;position:fixed;top:-${_lockY}px;left:0;right:0;width:100%`;
  }
  _lockOwners.add(owner);
}
function unlockScroll(owner) {
  if (!_lockOwners.delete(owner)) return;
  if (_lockOwners.size === 0) {
    document.body.style.cssText = '';
    window.scrollTo(0, _lockY);
  }
}

/* ---------------- модалка ---------------- */

function openModal(html) {
  $('#modalBox').innerHTML = html;
  if ($('#modalBackdrop').hidden) lockScroll('modal');
  $('#modalBackdrop').hidden = false;
}
function closeModal() {
  if ($('#modalBackdrop').hidden) return;
  $('#modalBackdrop').hidden = true;
  unlockScroll('modal');
}
function closeFilterSheet() {
  const panel = $('#filtersPanel');
  if (panel && panel.classList.contains('open')) {
    panel.classList.remove('open');
    unlockScroll('sheet');
  }
}
$('#modalBackdrop').addEventListener('click', e => {
  if (e.target === $('#modalBackdrop')) closeModal();
});

/* ---------------- фильтрация ---------------- */

function applyFilters(f) {
  let qTokens = f.q && f.q.trim() ? prepQueryTokens(f.q) : null;
  const scores = new Map();

  const passesBase = l => {
    if (isSold(l)) return false; // продано/архив — не показываем в поиске и ленте
    if (state.reported.has(l.id)) return false; // на это объявление юзер пожаловался — прячем у него
    if (f.cat && l.category !== f.cat) return false;
    if (f.sub && l.subcategory !== f.sub) return false;
    if (f.city !== 'all' && l.city !== f.city) return false;
    if (f.priceMin !== '' && (l.price === 0 || l.price < +f.priceMin)) return false;
    if (f.priceMax !== '' && (l.price === 0 || l.price > +f.priceMax)) return false;
    if (f.condition !== 'any' && l.condition !== f.condition) return false;
    if (f.sellerType !== 'any' && l.sellerType !== f.sellerType) return false;
    if (f.withPhoto && getPhotos(l).length === 0) return false;
    if (f.delivery && !l.hasDelivery) return false;
    if (f.period !== 'all' && hoursAgo(l) > +f.period * 24) return false;
    if (f.attrs && !passesAttrs(l, f.attrs)) return false;
    // отрицательные условия из запроса: «телефон не самсунг и не айфон»
    if (f.exclude && f.exclude.length) {
      const la = getAttrs(l);
      const hay = ((l.title || '') + ' ' + (la.brand || '') + ' ' + (la.model || '')).toLowerCase();
      for (const ex of f.exclude) {
        if (ex.brand && String(la.brand || '').toLowerCase() === ex.brand.toLowerCase()) return false;
        if (ex.model && String(la.model || '').toLowerCase() === ex.model.toLowerCase()) return false;
        if (ex.brand && hay.includes(ex.brand.toLowerCase())) return false;
      }
    }
    return true;
  };

  const collect = minMatched => allListings().filter(l => {
    if (!passesBase(l)) return false;
    if (qTokens) {
      const s = scoreListing(l, qTokens, minMatched);
      if (s <= 0) return false;
      scores.set(l.id, s);
    }
    return true;
  });

  let res = collect(qTokens ? requiredMatches(qTokens) : 0);
  // мягкий режим: по строгому совпадению пусто — ищем по части слов
  if (qTokens && !res.length && qTokens.length > 1) res = collect(1);
  // категория распознана, но текст не совпал ни с чем («наушники») —
  // показываем категорию целиком вместо пустой выдачи
  if (qTokens && !res.length && (f.cat || f.sub)) {
    qTokens = null;
    res = collect(0);
  }

  const cheapVal = l => (l.price === 0 ? Infinity : l.price);
  const sorts = {
    date: (a, b) => hoursAgo(a) - hoursAgo(b),
    cheap: (a, b) => cheapVal(a) - cheapVal(b),
    expensive: (a, b) => b.price - a.price,
    popular: (a, b) => b.views - a.views,
  };
  const base = sorts[f.sort] || sorts.date;

  if (f._skipSort) return res; // подсчёт значений фильтра сортировка не нужна
  if (qTokens) {
    // релевантность первична при сортировке «по дате», вторична при явной сортировке
    if (f.sort === 'date') res.sort((a, b) => (scores.get(b.id) - scores.get(a.id)) || sorts.date(a, b));
    else res.sort((a, b) => base(a, b) || (scores.get(b.id) - scores.get(a.id)));
  } else {
    res.sort(base);
    if (f.sort === 'date') {
      res = [...res.filter(l => l.isVip), ...res.filter(l => !l.isVip)];
    }
  }
  return res;
}

function activeFilterCount(f) {
  let n = 0;
  if (f.cat) n++;
  if (f.sub) n++;
  if (f.priceMin !== '' || f.priceMax !== '') n++;
  if (f.city !== 'all') n++;
  if (f.condition !== 'any') n++;
  if (f.sellerType !== 'any') n++;
  if (f.withPhoto) n++;
  if (f.delivery) n++;
  if (f.period !== 'all') n++;
  n += attrFilterCount(f.attrs);
  return n;
}

/* ---------------- карточка объявления ---------------- */

const HEART_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21C8 17.5 3 13.6 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 4.6-5 8.5-9 12z"/></svg>';
const COMPARE_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>';

function cardHTML(l) {
  const photos = getPhotos(l);
  const isFav = state.favorites.has(l.id);
  const tags = [
    l.isVip ? '<span class="tag tag-vip">VIP</span>' : '',
    l.isUrgent ? `<span class="tag tag-urgent">${t('tag.urgent')}</span>` : '',
    l.condition === 'new' ? `<span class="tag tag-new">${t('tag.new')}</span>` : '',
    l.hasDelivery ? `<span class="tag tag-delivery">${t('tag.delivery')}</span>` : '',
  ].filter(Boolean).slice(0, 2).join('');
  return `
  <a class="card ${l.isVip ? 'vip' : ''}" href="#/item/${l.id}" data-link>
    <div class="card-photo">
      ${photos.length
        ? `<img src="${esc(photos[0])}" loading="lazy" alt="${esc(l.title)}">`
        : `<div class="nophoto">📷&nbsp; ${t('nophoto')}</div>`}
      ${photos.length > 1 ? `<span class="photo-count">${photos.length} ${t('photo.word')}</span>` : ''}
      ${isSold(l) ? `<div class="sold-ribbon">${t('status.sold')}</div>` : ''}
      <div class="card-tags">${tags}</div>
      <button class="cmp-btn ${inCompare(l.id) ? 'on' : ''}" data-action="compare-card" data-id="${l.id}" title="${t('cmp.add')}" aria-label="${t('cmp.add')}">${COMPARE_SVG}</button>
      <button class="fav-btn ${isFav ? 'active' : ''}" data-fav="${l.id}" title="${t('item.fav')}" aria-label="${t('item.fav')}">${HEART_SVG}</button>
    </div>
    <div class="card-body">
      <div class="card-price">${priceHTML(l)}${(l.floor || l.hasFloor) ? `<span class="card-bargain">🤝 ${t('tag.bargain')}</span>` : ''}</div>
      <div class="card-title">${esc(l.title)}</div>
      ${(() => { const s = attrSubtitle(l.category, l.subcategory, getAttrs(l)); return s ? `<div class="card-attrs">${esc(s)}</div>` : ''; })()}
      <div class="card-meta">${esc(l.city)}${l.district ? ', ' + esc(l.district) : ''} · ${postedLabel(l)}</div>
    </div>
  </a>`;
}

function emptyHTML(emoji, title, text, btn = '') {
  return `<div class="empty" style="grid-column:1/-1">
    <div class="empty-emoji">${emoji}</div>
    <h3>${title}</h3>
    <p>${text}</p>
    ${btn}
  </div>`;
}

/* ---------------- главная ---------------- */

function renderHome() {
  // ушли на главную → повторный клик той же категории/ссылки должен применить
  // её базовые фильтры заново (back-с-/item при этом не страдает — он не через home)
  state._appliedQS = null;
  const base = { ...defaultFilters(), city: state.city };
  const all = applyFilters(base);
  const vip = all.filter(l => l.isVip).slice(0, 4);
  // «свежие» — строго по дате, без VIP-буста
  const fresh = [...all].sort((a, b) => hoursAgo(a) - hoursAgo(b)).slice(0, 12);

  const tiles = CATEGORIES.map(c => {
    const count = all.filter(l => l.category === c.id).length;
    return `
    <a class="cat-tile" href="#/search?cat=${c.id}" data-link>
      <span class="cat-tile-emoji">${c.emoji}</span>
      <span>
        <div class="cat-tile-name">${catName(c)}</div>
        <div class="cat-tile-count">${nLabel(count)}</div>
      </span>
    </a>`;
  }).join('');

  // блок «вы смотрели» шёл мимо applyFilters, и объявление, на которое
  // юзер только что пожаловался (или которое продано), возвращалось на главную
  const viewed = state.viewed.map(getListing).filter(Boolean)
    .filter(l => !state.reported.has(l.id) && !isSold(l)).slice(0, 4);

  app.innerHTML = `
    <section>
      <div class="section-title"><h2>${t('home.cats')}</h2></div>
      <div class="cat-grid">${tiles}</div>
    </section>
    <div class="home-ai-row">
      <div class="ai-banner">
        <span class="ai-banner-icon">✨</span>
        <div class="ai-banner-text">
          <div class="ai-banner-title">${t('ai.banner.title')}</div>
          <div class="ai-banner-sub">${t('ai.banner.sub')}</div>
        </div>
        <button class="btn btn-primary" data-ai-ask="">${t('ai.banner.btn')}</button>
      </div>
      <a class="ai-banner sell-banner" href="#/sell" data-link>
        <span class="ai-banner-icon sell-banner-icon">📷</span>
        <div class="ai-banner-text">
          <div class="ai-banner-title">${t('sell.cta')}</div>
          <div class="ai-banner-sub">${t('sell.ctaSub')}</div>
        </div>
        <span class="btn btn-secondary sell-banner-btn">${t('nav.post')}</span>
      </a>
    </div>
    ${viewed.length ? `
    <section>
      <div class="section-title"><h2>👀 ${t('home.viewed')}</h2></div>
      <div class="grid">${viewed.map(cardHTML).join('')}</div>
    </section>` : ''}
    ${vip.length ? `
    <section>
      <div class="section-title"><h2>⭐ ${t('home.vip')}</h2><a href="#/search?reset=1" data-link>${t('home.seeAll')}</a></div>
      <div class="grid">${vip.map(cardHTML).join('')}</div>
    </section>` : ''}
    <section>
      <div class="section-title"><h2>${t('home.fresh')}</h2><a href="#/search?reset=1" data-link>${t('results.all')}</a></div>
      <div class="grid">${fresh.map(cardHTML).join('')}</div>
      <div class="show-more"><a class="btn btn-secondary btn-lg" href="#/search?reset=1" data-link>${t('home.allBtn')}</a></div>
    </section>`;
}

/* ---------------- поиск ---------------- */

/* — фильтры по характеристикам в поиске (бренд→модель + спеки) — */
/* Сколько объявлений даст каждое значение атрибута при ОСТАЛЬНЫХ активных
   фильтрах — чтобы результат был виден ДО выбора и не приводил в пустоту.

   Два важных правила:
   1) считаем ВСЕ поля за один проход (раньше был отдельный скан 6030
      объявлений на каждое поле — до 9 полных проходов на один тап);
   2) снимаем не только само поле, но и зависимые от него: иначе после
      выбора модели все прочие марки оказывались с нулём и «залипали»
      задизейбленными — сменить марку становилось невозможно. */
const ATTR_DEPENDENTS = { brand: ['model', 'gen'], model: ['gen'] };
let _countsCache = null;

function attrCountsFor(f, keys) {
  // поле называется sellerType: с опечаткой `f.seller` в ключе всегда лежал
  // undefined, и смена «Частные/Бизнес» отдавала счётчики от прошлой выборки
  const cacheKey = JSON.stringify([f.cat, f.sub, f.city, f.q, f.priceMin, f.priceMax,
    f.condition, f.sellerType, f.period, f.delivery, f.attrs, keys]);
  if (_countsCache && _countsCache.key === cacheKey) return _countsCache.val;

  const out = Object.create(null);
  // группируем поля по «уровню зависимости»: поля одного уровня считаются
  // на одной и той же выборке, поэтому проходов максимум три, а не девять
  const levels = new Map();
  for (const key of keys) {
    const drop = [key, key + 'Min', key + 'Max'].concat(ATTR_DEPENDENTS[key] || []);
    const sig = drop.join(',');
    if (!levels.has(sig)) levels.set(sig, { drop, keys: [] });
    levels.get(sig).keys.push(key);
  }
  for (const { drop, keys: group } of levels.values()) {
    const probe = { ...f, attrs: { ...(f.attrs || {}) }, _skipSort: true };
    for (const d of drop) delete probe.attrs[d];
    const rows = applyFilters(probe);
    for (const key of group) out[key] = Object.create(null);
    for (const l of rows) {
      const la = getAttrs(l);
      for (const key of group) {
        const v = la[key];
        if (v == null || v === '') continue;
        out[key][v] = (out[key][v] || 0) + 1;
      }
    }
  }
  _countsCache = { key: cacheKey, val: out };
  return out;
}

/* Выпадающий список фильтра. Популярные значения выносим в отдельную группу
   сверху (в каталоге 82 марки — без этого нужное тонет), рядом со значением
   показываем число объявлений. Остаётся нативным <select>: работает пикер
   телефона, клавиатура и экранный диктор. */
/* Счётчики у марок и моделей зависят от города, цены, состояния и продавца.
   Перерисовывать весь блок нельзя — это сбивает фокус, пока человек набирает
   год или пробег. Поэтому правим подписи прямо в существующих <option>. */
function refreshAttrCounts() {
  const box = $('#fAttrs');
  if (!box) return;
  const sels = [...box.querySelectorAll('select[data-fattr]')];
  if (!sels.length) return;
  const C = attrCountsFor(state.filters, [...new Set(sels.map(s => s.dataset.fattr))]);
  for (const sel of sels) {
    const counts = C[sel.dataset.fattr];
    if (!counts) continue;
    const cur = sel.value;
    for (const o of sel.options) {
      if (!o.value || o.dataset.base == null) continue;
      const n = counts[o.value] || 0;
      o.textContent = o.dataset.base + (n ? ` (${n})` : '');
      o.disabled = !n && o.value !== cur;
    }
  }
}

function filterAttrSelect(key, label, pairs, cur, opts = {}) {
  const counts = opts.counts || null;
  const popular = new Set(opts.popular || []);
  const anyLabel = aL({ ru: 'Любая', en: 'Any', ky: 'Каалаган' });

  const optHTML = ([v, l]) => {
    const n = counts ? (counts[v] || 0) : null;
    // значения без единого объявления не прячем, а гасим — список стабилен
    const dis = counts && !n && v !== cur ? ' disabled' : '';
    const suffix = n ? ` (${n})` : '';
    return `<option value="${esc(v)}" data-base="${esc(l)}" ${cur === v ? 'selected' : ''}${dis}>${esc(l)}${suffix}</option>`;
  };

  let body;
  const pops = pairs.filter(p => popular.has(p[0]));
  if (pops.length && pairs.length > 12) {
    const rest = pairs.filter(p => !popular.has(p[0]));
    body = `<optgroup label="${esc(aL({ ru: 'Популярные', en: 'Popular', ky: 'Популярдуу' }))}">${pops.map(optHTML).join('')}</optgroup>`
         + `<optgroup label="${esc(aL({ ru: 'Все', en: 'All', ky: 'Баары' }))}">${rest.map(optHTML).join('')}</optgroup>`;
  } else {
    body = pairs.map(optHTML).join('');
  }

  return `<div class="fblock"><div class="fblock-label">${esc(label)}</div>
    <select class="fselect" data-fattr="${key}"><option value="">${anyLabel}</option>${body}</select></div>`;
}
function filterAttrRange(fld, fa) {
  const lbl = aL(fld.label) + (fld.unit ? ', ' + aL(fld.unit) : '');
  return `<div class="fblock"><div class="fblock-label">${esc(lbl)}</div>
    <div class="price-row">
      <input type="number" inputmode="numeric" data-fattr="${fld.key}Min" placeholder="${t('filters.from')}" value="${esc(fa[fld.key + 'Min'] || '')}">
      <input type="number" inputmode="numeric" data-fattr="${fld.key}Max" placeholder="${t('filters.to')}" value="${esc(fa[fld.key + 'Max'] || '')}">
    </div></div>`;
}
function filterAttrsHTML(f) {
  const schema = attrSchema(f.cat, f.sub);
  if (!schema) return '';
  const fa = f.attrs || {};
  // все счётчики одним заходом
  const keys = schema.map(fl => (fl.type === 'brand' ? 'brand' : fl.type === 'model' ? 'model' : fl.key))
    .filter(k => k && schema.find(fl => fl.type === 'brand' || fl.type === 'model' || fl.type === 'select'));
  const C = attrCountsFor(f, [...new Set(keys)]);
  let html = '';
  for (const fld of schema) {
    if (fld.type === 'brand') {
      html += filterAttrSelect('brand', aL(fld.label), brandsFor(fld.group).map(b => [b, b]), fa.brand,
        { counts: C.brand, popular: popularBrandsFor(fld.group) });
    } else if (fld.type === 'model') {
      const bf = schema.find(x => x.type === 'brand');
      const models = (bf && fa.brand) ? modelsFor(bf.group, fa.brand) : [];
      if (models.length) html += filterAttrSelect('model', aL({ ru: 'Модель', en: 'Model', ky: 'Модель' }), models.map(m => [m, m]), fa.model,
        { counts: C.model });
    } else if (fld.type === 'gen') {
      // поколения появляются только когда выбраны марка и модель
      const bf = schema.find(x => x.type === 'brand');
      const gens = (bf && fa.brand && fa.model && typeof catalogGens === 'function')
        ? catalogGens(GROUP_TO_SUB[bf.group] || f.sub, fa.brand, fa.model) : [];
      if (gens.length) html += filterAttrSelect('gen', aL(fld.label),
        gens.map(g => [g.name, g.ru ? `${g.name} (${g.ru})` : g.name]), fa.gen, { counts: C.gen });
    } else if (fld.type === 'select') {
      html += filterAttrSelect(fld.key, aL(fld.label), fld.options.map(o => [o.v, aL(o.l)]), fa[fld.key],
        { counts: C[fld.key] });
    } else if (fld.type === 'number') {
      html += filterAttrRange(fld, fa);
    }
  }
  return html;
}

function filterPanelHTML(f) {
  const cat = catById(f.cat);
  const catOptions = [`<option value="">${t('filters.allCats')}</option>`]
    .concat(CATEGORIES.map(c => `<option value="${c.id}" ${f.cat === c.id ? 'selected' : ''}>${c.emoji} ${catName(c)}</option>`))
    .join('');
  const subOptions = cat
    ? [`<option value="">${t('filters.allSubs')}</option>`]
        .concat(cat.subs.map(s => `<option value="${esc(s)}" ${f.sub === s ? 'selected' : ''}>${esc(subName(s))}</option>`))
        .join('')
    : '';
  const cityOptions = [`<option value="all">${t('city.all')}</option>`]
    .concat(CITIES.map(c => `<option value="${esc(c)}" ${f.city === c ? 'selected' : ''}>${esc(c)}</option>`))
    .join('');

  const chip = (group, val, label, active) =>
    `<button class="fchip ${active ? 'active' : ''}" data-fgroup="${group}" data-fval="${val}">${label}</button>`;

  return `
    <div class="filters-head">
      <h3>${t('filters.title')}</h3>
      <button class="filters-reset" data-action="reset-filters">${t('filters.reset')}</button>
      <button class="icon-btn filters-close" data-action="close-filters" aria-label="✕">✕</button>
    </div>
    <div class="fblock">
      <div class="fblock-label">${t('filters.category')}</div>
      <select class="fselect" id="fCat">${catOptions}</select>
    </div>
    <div class="fblock" id="fSubBlock" ${cat ? '' : 'hidden'}>
      <div class="fblock-label">${t('filters.sub')}</div>
      <select class="fselect" id="fSub">${subOptions}</select>
    </div>
    <div id="fAttrs">${filterAttrsHTML(f)}</div>
    <div class="fblock">
      <div class="fblock-label">${t('filters.price')}</div>
      <div class="price-row">
        <input type="number" inputmode="numeric" id="fPriceMin" placeholder="${t('filters.from')}" min="0" value="${esc(f.priceMin)}">
        <input type="number" inputmode="numeric" id="fPriceMax" placeholder="${t('filters.to')}" min="0" value="${esc(f.priceMax)}">
      </div>
    </div>
    <div class="fblock">
      <div class="fblock-label">${t('filters.city')}</div>
      <select class="fselect" id="fCity">${cityOptions}</select>
    </div>
    <div class="fblock">
      <div class="fblock-label">${t('filters.condition')}</div>
      <div class="chip-row" id="fCondition">
        ${chip('condition', 'any', t('cond.any'), f.condition === 'any')}
        ${chip('condition', 'new', t('cond.new'), f.condition === 'new')}
        ${chip('condition', 'used', t('cond.used'), f.condition === 'used')}
      </div>
    </div>
    <div class="fblock">
      <div class="fblock-label">${t('filters.seller')}</div>
      <div class="chip-row" id="fSeller">
        ${chip('sellerType', 'any', t('seller.all'), f.sellerType === 'any')}
        ${chip('sellerType', 'private', t('seller.private'), f.sellerType === 'private')}
        ${chip('sellerType', 'business', t('seller.business'), f.sellerType === 'business')}
      </div>
    </div>
    <div class="fblock">
      <div class="fblock-label">${t('filters.posted')}</div>
      <div class="chip-row" id="fPeriod">
        ${chip('period', 'all', t('period.all'), f.period === 'all')}
        ${chip('period', '1', t('period.day'), f.period === '1')}
        ${chip('period', '7', t('period.week'), f.period === '7')}
        ${chip('period', '30', t('period.month'), f.period === '30')}
      </div>
    </div>
    <div class="fblock">
      <label class="fcheck"><input type="checkbox" id="fPhoto" ${f.withPhoto ? 'checked' : ''}>
        <span class="box"><svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="#fff" stroke-width="2.4"><path d="M1 5l3.5 3.5L11 1"/></svg></span>
        ${t('filters.withPhoto')}</label>
      <label class="fcheck"><input type="checkbox" id="fDelivery" ${f.delivery ? 'checked' : ''}>
        <span class="box"><svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="#fff" stroke-width="2.4"><path d="M1 5l3.5 3.5L11 1"/></svg></span>
        ${t('filters.delivery')}</label>
    </div>
    <div class="filters-apply">
      <button class="btn btn-primary btn-block btn-lg" id="filtersApplyBtn" data-action="close-filters"></button>
    </div>`;
}

function searchTitle(f) {
  // человек должен видеть СВОЙ запрос: раньше «камри» превращалось в
  // «Легковые авто», и было непонятно, что вообще искали
  const raw = (f.qRaw || '').trim();
  if (raw) {
    const scope = f.sub ? subName(f.sub) : (catById(f.cat) ? catName(catById(f.cat)) : '');
    return `«${esc(raw)}»` + (scope ? `<span class="rt-scope"> · ${esc(scope)}</span>` : '');
  }
  if (f.sub) return esc(subName(f.sub));
  const cat = catById(f.cat);
  if (cat) return esc(catName(cat));
  if (f.q.trim()) return `«${esc(f.q.trim())}»`;
  return t('results.all');
}

function activeChipsHTML(f) {
  const chips = [];
  const add = (key, label) => chips.push(`<span class="achip"><span class="achip-label">${label}</span><button data-clear="${key}" aria-label="${t('a11y.remove')}">✕</button></span>`);
  const rawChip = (f.qRaw || f.q || '').trim();
  if (rawChip) add('q', `${t('search.prefix')}: ${esc(rawChip)}`);
  if (f.cat) add('cat', esc(catNameById(f.cat) || f.cat));
  if (f.sub) add('sub', esc(subName(f.sub)));
  attrFilterChips(f).forEach(c => add(c.key, esc(c.label)));
  if (f.priceMin !== '' || f.priceMax !== '') {
    add('price', `${t('chip.price')}: ${f.priceMin !== '' ? t('filters.from') + ' ' + fmtNum(f.priceMin) : ''}${f.priceMin !== '' && f.priceMax !== '' ? ' ' : ''}${f.priceMax !== '' ? t('filters.to') + ' ' + fmtNum(f.priceMax) : ''} ${t('som')}`);
  }
  if (f.city !== 'all') add('city', esc(f.city));
  if (f.condition !== 'any') add('condition', f.condition === 'new' ? t('cond.new') : t('cond.used'));
  if (f.sellerType !== 'any') add('sellerType', f.sellerType === 'private' ? t('seller.private') : t('seller.business'));
  if (f.withPhoto) add('withPhoto', t('chip.withPhoto'));
  if (f.delivery) add('delivery', t('filters.delivery'));
  if (f.period !== 'all') add('period', { 1: t('chip.day'), 7: t('chip.week'), 30: t('chip.month') }[f.period]);
  return chips.join('');
}

function renderSearch() {
  app.innerHTML = `
    <div class="search-layout">
      <aside class="filters-panel" id="filtersPanel">${filterPanelHTML(state.filters)}</aside>
      <section style="min-width:0">
        <div class="results-head">
          <h1 id="resultsTitle"></h1>
          <span class="results-count" id="resultsCount"></span>
        </div>
        <div class="results-bar">
          <button class="filters-open-btn" data-action="open-filters">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 6h18M7 12h10M10 18h4"/></svg>
            ${t('filters.title')} <span class="fcount" id="filtersCountBadge" hidden></span>
          </button>
          <select class="sort-select" id="sortSel">
            <option value="date">${t('sort.new')}</option>
            <option value="cheap">${t('sort.cheap')}</option>
            <option value="expensive">${t('sort.exp')}</option>
            <option value="popular">${t('sort.popular')}</option>
          </select>
          <button class="save-search-btn ${state.saved.some(s => JSON.stringify(s.f) === JSON.stringify(state.filters)) ? 'on' : ''}" id="saveSearchBtn" data-action="save-search">🔔 ${state.saved.some(s => JSON.stringify(s.f) === JSON.stringify(state.filters)) ? t('saved.savedShort') : t('saved.save')}</button>
          <div class="view-toggle">
            <button data-view="grid" title="${t('view.grid')}" aria-label="${t('view.grid')}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></button>
            <button data-view="list" title="${t('view.list')}" aria-label="${t('view.list')}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
          </div>
        </div>
        <div class="active-chips" id="activeChips"></div>
        <div class="grid" id="resultsGrid"></div>
        <div class="show-more" id="showMoreWrap"></div>
      </section>
    </div>`;

  bindFilterPanel();
  $('#sortSel').value = state.filters.sort;
  $('#sortSel').addEventListener('change', e => {
    state.filters.sort = e.target.value;
    state.page = 1;
    updateResults();
  });
  updateResults();
}

function bindFilterPanel() {
  const f = state.filters;
  const rerun = () => { state.page = 1; updateResults(); };
  const refillAttrs = () => { const c = $('#fAttrs'); if (c) c.innerHTML = filterAttrsHTML(f); };

  $('#fCat').addEventListener('change', e => {
    f.cat = e.target.value;
    f.sub = '';
    f.attrs = {}; // другая категория → сбрасываем фильтры характеристик
    const cat = catById(f.cat);
    const block = $('#fSubBlock');
    if (cat) {
      block.hidden = false;
      $('#fSub').innerHTML = [`<option value="">${t('filters.allSubs')}</option>`]
        .concat(cat.subs.map(s => `<option value="${esc(s)}">${esc(subName(s))}</option>`)).join('');
    } else {
      block.hidden = true;
    }
    refillAttrs();
    rerun();
  });
  $('#fSub').addEventListener('change', e => { f.sub = e.target.value; f.attrs = {}; refillAttrs(); rerun(); });

  // фильтры характеристик: select → точное совпадение, бренд каскадит модель;
  // числовые (год/пробег/площадь) → диапазон от/до с дебаунсом
  const faBox = $('#fAttrs');
  if (faBox) {
    faBox.addEventListener('change', e => {
      const el = e.target.closest('select[data-fattr]');
      if (!el) return;
      const key = el.dataset.fattr, val = el.value;
      if (val) f.attrs[key] = val; else delete f.attrs[key];
      if (key === 'brand') { delete f.attrs.model; refillAttrs(); }
      rerun();
    });
    let attrTimer;
    faBox.addEventListener('input', e => {
      const el = e.target.closest('input[data-fattr]');
      if (!el) return;
      const key = el.dataset.fattr;
      clearTimeout(attrTimer);
      attrTimer = setTimeout(() => {
        if (el.value !== '') f.attrs[key] = el.value; else delete f.attrs[key];
        rerun();
      }, 350);
    });
  }
  $('#fCity').addEventListener('change', e => { f.city = e.target.value; rerun(); });

  let priceTimer;
  const commitPrice = () => {
    clearTimeout(priceTimer);
    const mn = $('#fPriceMin'), mx = $('#fPriceMax');
    if (!mn || !mx) return;
    if (f.priceMin === mn.value && f.priceMax === mx.value) return;
    f.priceMin = mn.value;
    f.priceMax = mx.value;
    rerun();
  };
  state._commitPrice = commitPrice;
  const onPrice = () => {
    clearTimeout(priceTimer);
    priceTimer = setTimeout(commitPrice, 350);
  };
  $('#fPriceMin').addEventListener('input', onPrice);
  $('#fPriceMax').addEventListener('input', onPrice);

  $('#fPhoto').addEventListener('change', e => { f.withPhoto = e.target.checked; rerun(); });
  $('#fDelivery').addEventListener('change', e => { f.delivery = e.target.checked; rerun(); });
}

function updateResults() {
  if (!$('#resultsTitle')) return; // вид уже размонтирован (дебаунс-таймер пережил навигацию)
  const f = state.filters;
  const res = applyFilters(f);
  const shown = res.slice(0, state.page * PAGE_SIZE);

  $('#resultsTitle').innerHTML = searchTitle(f);
  $('#resultsCount').textContent = nLabel(res.length);

  const grid = $('#resultsGrid');
  grid.className = 'grid' + (state.view === 'list' ? ' list-view' : '');
  grid.innerHTML = shown.length
    ? shown.map(cardHTML).join('')
    : emptyHTML('🔍', t('empty.search.t'), t('empty.search.p'), emptyRecoveryHTML(f));

  $('#showMoreWrap').innerHTML = res.length > shown.length
    ? `<button class="btn btn-outline btn-lg" data-action="show-more">${t('more.show')} ${Math.min(PAGE_SIZE, res.length - shown.length)} ${t('more.of')} ${fmtNum(res.length - shown.length)}</button>`
    : '';

  $('#activeChips').innerHTML = activeChipsHTML(f);

  const n = activeFilterCount(f);
  const badge = $('#filtersCountBadge');
  badge.hidden = n === 0;
  badge.textContent = n;

  const applyBtn = $('#filtersApplyBtn');
  if (applyBtn) applyBtn.textContent = `${t('filters.show')} ${nLabel(res.length)}`;

  document.querySelectorAll('.view-toggle button').forEach(b =>
    b.classList.toggle('active', b.dataset.view === state.view));

  // числа рядом с марками и моделями должны отражать текущую выборку
  refreshAttrCounts();
}

/* Пустая выдача не должна быть тупиком: считаем, снятие КАКОГО ИМЕННО
   условия вернёт результаты, и предлагаем убрать именно его — вместо
   единственной кнопки «сбросить всё», которая уносит и запрос, и фильтры.
   Плюс подсказка «Возможно, вы искали…» по каталогу (раскладка/опечатка). */
function emptyRecoveryHTML(f) {
  const opts = [];

  // 1. подсказка по каталогу для неудачного текстового запроса
  if (f.q && typeof didYouMean === 'function') {
    try {
      const dym = didYouMean(String(f.q).toLowerCase());
      if (dym && dym.payload) {
        opts.push(`<button class="btn btn-primary" data-action="dym"
          data-brand="${esc(dym.payload.brand || '')}" data-model="${esc(dym.payload.model || '')}"
          data-cat="${esc(dym.payload.cat || '')}" data-sub="${esc(dym.payload.sub || '')}">
          ${t('empty.didYouMean')} ${esc(dym.text)}</button>`);
      }
    } catch (e) {}
  }

  // 2. какие ограничения можно снять — с числом объявлений после снятия
  const probes = [];
  if (f.city && f.city !== 'all') probes.push(['city', t('empty.dropCity'), { city: 'all' }]);
  if (f.priceMin || f.priceMax) probes.push(['price', t('empty.dropPrice'), { priceMin: '', priceMax: '' }]);
  if (f.condition && f.condition !== 'any') probes.push(['condition', t('empty.dropCondition'), { condition: 'any' }]);
  if (f.delivery) probes.push(['delivery', t('empty.dropDelivery'), { delivery: false }]);
  if (f.q) probes.push(['q', t('empty.dropQuery'), { q: '' }]);
  for (const k of Object.keys(f.attrs || {})) {
    const bare = k.replace(/(Min|Max)$/, '');
    if (probes.some(p => p[0] === 'attr:' + bare)) continue;
    const attrs = { ...f.attrs };
    delete attrs[bare]; delete attrs[bare + 'Min']; delete attrs[bare + 'Max'];
    const lab = (typeof NLU_KEY_LABELS !== 'undefined' && NLU_KEY_LABELS[bare]) ? aL(NLU_KEY_LABELS[bare]) : bare;
    probes.push(['attr:' + bare, `${t('empty.dropFilter')} «${lab}»`, { attrs }]);
  }

  for (const [key, label, patch] of probes) {
    const n = applyFilters({ ...f, ...patch, _skipSort: true }).length;
    if (!n) continue;
    opts.push(`<button class="btn btn-secondary" data-action="relax" data-relax="${esc(key)}">
      ${esc(label)} — ${nLabel(n)}</button>`);
    if (opts.length >= 4) break;
  }

  // 3. подписка на новые объявления по этому запросу
  opts.push(`<button class="btn btn-outline" data-action="save-search">🔔 ${t('saved.save')}</button>`);
  // 4. полный сброс — последним и без акцента
  opts.push(`<button class="btn btn-ghost" data-action="reset-filters">${t('empty.reset')}</button>`);
  return `<div class="empty-actions">${opts.join('')}</div>`;
}

function clearFilter(key) {
  const f = state.filters;
  if (key.startsWith('attr:')) {
    const base = key.slice(5);
    delete f.attrs[base]; delete f.attrs[base + 'Min']; delete f.attrs[base + 'Max'];
    // каскад: модель зависит от марки, поколение — от модели
    if (base === 'brand') { delete f.attrs.model; delete f.attrs.gen; }
    if (base === 'model') delete f.attrs.gen;
    $('#filtersPanel').innerHTML = filterPanelHTML(f);
    bindFilterPanel(); state.page = 1; updateResults();
    return;
  }
  if (key === 'q') { f.q = ''; f.qRaw = ''; $('#searchInput').value = ''; }
  if (key === 'cat') { f.cat = ''; f.sub = ''; f.attrs = {}; }
  if (key === 'sub') { f.sub = ''; f.attrs = {}; }
  if (key === 'price') { f.priceMin = ''; f.priceMax = ''; }
  if (key === 'city') f.city = 'all';
  if (key === 'condition') f.condition = 'any';
  if (key === 'sellerType') f.sellerType = 'any';
  if (key === 'withPhoto') f.withPhoto = false;
  if (key === 'delivery') f.delivery = false;
  if (key === 'period') f.period = 'all';
  $('#filtersPanel').innerHTML = filterPanelHTML(f);
  bindFilterPanel();
  state.page = 1;
  updateResults();
}

/* ---------------- страница объявления ---------------- */

/* сравнение с рынком: медиана цен той же подкатегории */
function priceVerdict(l) {
  if (!l.price || l.negotiable) return null;
  const peers = allListings().filter(x =>
    x.subcategory === l.subcategory && x.id !== l.id && x.price > 0 && x.priceSuffix === l.priceSuffix);
  if (peers.length < 6) return null;
  const prices = peers.map(x => x.price).sort((a, b) => a - b);
  // честная медиана: для чётного n — среднее двух центральных (иначе завышаем рынок)
  const mid = prices.length >> 1;
  const median = prices.length % 2 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2);
  const r = l.price / median;
  const unit = `${t('som')}${esc(l.priceSuffix)}`; // «сом/мес» у аренды, не голый «сом»
  const avg = `${t('verdict.avg')} ${fmtNum(median)} ${unit}`;
  // ≤45% медианы — не «выгодно», а тревога: заниженная цена частая приманка мошенника
  if (r <= 0.45) return { cls: 'danger', label: t('verdict.low'), hint: t('verdict.lowHint'), danger: true };
  if (r <= 0.87) return { cls: 'good', label: t('verdict.good'), hint: `${t('verdict.goodHint')} (${fmtNum(median)} ${unit})` };
  if (r <= 1.12) return { cls: 'fair', label: t('verdict.fair'), hint: avg };
  return { cls: 'high', label: t('verdict.high'), hint: avg };
}

function renderItem(id) {
  const l = getListing(id);
  if (!l) {
    app.innerHTML = emptyHTML('🤷', t('item.404.t'), t('item.404.p'),
      `<a class="btn btn-primary" href="#/" data-link>${t('item.404.btn')}</a>`);
    return;
  }
  state.galleryIndex = 0;
  const photos = getPhotos(l);
  const cat = catById(l.category);
  const isFav = state.favorites.has(l.id);
  // моё = локальное ('m…') ИЛИ облачное с моим ownerId (у облачных id — UUID)
  const isMine = l.id.startsWith('m') || (!!l.ownerId && isAuthed() && l.ownerId === currentUser().id);
  const verdict = isMine ? null : priceVerdict(l);
  // риск увода оплаты в тексте объявления — соразмерно (high/critical → заметный
  // баннер, med → тихая заметка, low/none → ничего, чтобы не напрягать)
  const risk = isMine ? { level: 'none', reasons: [] } : assessTextRisk((l.title || '') + ' ' + (l.description || ''));
  const riskHigh = risk.level === 'high' || risk.level === 'critical';
  const riskMed = risk.level === 'med';

  // история просмотров для блока «Вы недавно смотрели»
  if (!isMine) {
    state.viewed = [l.id, ...state.viewed.filter(x => x !== l.id)].slice(0, 12);
    lsSave(LS.viewed, state.viewed);
    // облачное объявление → честный серверный счётчик (без накрутки обновлением:
    // сервер режет по отпечатку в пределах суток). Демо-объявления не трогаем.
    if (isCloudListing(l) && typeof BZ !== 'undefined' && BZ.available()) BZ.trackView(l.id);
  }
  const similar = applyFilters({ ...defaultFilters(), city: 'all', cat: l.category, sub: l.subcategory })
    .filter(x => x.id !== l.id).slice(0, 4);

  const params = [
    [t('item.cat'), catName(cat) || l.category],
    [t('item.section'), subName(l.subcategory)],
    // структурированные характеристики (бренд/модель/год/спеки)
    ...attrPairs(l.category, l.subcategory, getAttrs(l)),
    l.condition ? [t('item.cond'), l.condition === 'new' ? t('cond.new') : t('cond.used')] : null,
    // характеристики, распознанные ИИ при «продаже за 30 секунд»
    ...(Array.isArray(l.specs) ? l.specs.map(([k, v]) => [t(k), v]) : []),
    [t('item.city'), l.city + (l.district ? ', ' + l.district : '')],
    [t('item.delivery'), l.hasDelivery ? t('item.yes') : t('item.no')],
    [t('item.views'), fmtNum(l.views)],
    [t('item.posted'), postedLabel(l)],
    [t('item.num'), '№ ' + l.id.replace(/^m/, '')],
  ].filter(Boolean);

  const galleryHTML = `
    <div class="gallery">
      <div class="gallery-main" id="galleryMain">
        ${photos.length
          ? `<img id="galleryImg" src="${esc(photos[0])}" alt="${esc(l.title)}">
             ${photos.length > 1 ? `
             <button class="gallery-nav prev" data-action="gallery-prev" aria-label="‹">‹</button>
             <button class="gallery-nav next" data-action="gallery-next" aria-label="›">›</button>
             <span class="gallery-counter" id="galleryCounter">1 / ${photos.length}</span>` : ''}`
          : `<div class="nophoto">📷 ${t('item.noPhotoSeller')}</div>`}
      </div>
      ${photos.length > 1 ? `
      <div class="gallery-thumbs" id="galleryThumbs">
        ${photos.map((p, i) => `<img src="${esc(p)}" data-thumb="${i}" class="${i === 0 ? 'active' : ''}" alt="">`).join('')}
      </div>` : ''}
    </div>`;

  const buyCardHTML = `
    <div class="buy-card">
      <div class="buy-title">${esc(l.title)}</div>
      <div class="buy-price">${priceHTML(l)}</div>
      ${verdict ? `<div class="price-verdict ${verdict.cls}" title="${esc(verdict.hint)}">${verdict.label} · ${esc(verdict.hint)}</div>` : ''}
      ${riskHigh ? `<div class="scam-banner"><span class="sb-ico">⚠️</span><div class="sb-text"><b>${t('safety.itemScamT')}</b><span>${t(risk.reasons.includes('otp') ? 'safety.itemOtpP' : 'safety.itemScamP')}</span></div></div>`
        : riskMed ? `<div class="scam-note">⚠️ ${t('safety.itemNoteP')}</div>` : ''}
      ${(l.floor || l.hasFloor) && !isMine ? `<div class="bargain-badge">🤝 ${t('item.bargainOk')}</div>` : ''}
      <div class="buy-meta">${esc(l.city)}${l.district ? ', ' + esc(l.district) : ''} · ${postedLabel(l)} · 👁️ ${fmtNum(l.views)}</div>
      ${isMine && isSold(l) ? `<div class="sold-banner">✅ ${t('status.soldNote')}</div>` : ''}
      <div class="buy-actions">
        ${isMine ? `
          <button class="btn ${isSold(l) ? 'btn-primary' : 'btn-secondary'}" data-action="toggle-sold" data-id="${l.id}">${isSold(l) ? '↩️ ' + t('status.reactivate') : '✅ ' + t('status.markSold')}</button>
          <a class="btn btn-secondary" href="#/post?edit=${l.id}" data-link>✏️ ${t('item.edit')}</a>
          ${l.id.startsWith('m') ? `<button class="btn btn-outline" data-action="bump" data-id="${l.id}">⬆️ ${t('item.bump')}</button>` : ''}
          <button class="btn btn-danger-soft" data-action="delete-my" data-id="${l.id}">${t('item.delete')}</button>
        ` : `
          ${(l.floor || l.hasFloor) ? `<button class="btn btn-bargain btn-lg" data-action="offer-price" data-id="${l.id}">🤝 ${t('item.offerPrice')}</button>` : ''}
          ${l.phone ? `<button class="btn btn-primary btn-lg" data-action="show-phone" data-id="${l.id}">📞 ${t('item.showPhone')}</button>` : ''}
          <button class="btn ${l.phone ? 'btn-secondary' : 'btn-primary'} btn-lg" data-action="write-seller" data-id="${l.id}">💬 ${t('item.write')}</button>
          <button class="btn btn-outline" data-fav="${l.id}">${isFav ? '❤️ ' + t('item.faved') : '🤍 ' + t('item.fav')}</button>
        `}
      </div>
      <div class="buy-mini-actions">
        <button data-action="share" data-id="${l.id}">🔗 ${t('item.share')}</button>
        <button data-action="compare-toggle" data-id="${l.id}" class="${inCompare(l.id) ? 'on' : ''}">⚖️ ${inCompare(l.id) ? t('cmp.inList') : t('cmp.add')}</button>
        ${isMine ? '' : `<button data-action="report" data-id="${l.id}">⚑ ${t('item.report')}</button>`}
      </div>
    </div>`;

  const ss = sellerStats(l);
  const sideHTML = `
    ${buyCardHTML}
    <a class="seller-card" href="#/seller/${encodeURIComponent(sellerKey(l))}" data-link>
      <div class="avatar" style="${avatarStyle(l.sellerName)}">${esc(l.sellerName[0] || 'U')}</div>
      <div class="seller-info">
        <div class="seller-name"><span>${esc(l.sellerName)}</span> ${ss.business ? `<span class="seller-badge">${t('seller.business')}</span>` : ''} ${ss.verified ? `<span class="verif-badge" title="${t('seller.verifiedHint')}">✓ ${t('seller.verified')}</span>` : ''}</div>
        <div class="seller-sub">${sellerRatingHTML(ss)} · ${t('seller.since')} ${l.sellerSinceYear} ${t('seller.sinceEnd')}</div>
        <div class="seller-sub">${nLabel(sellerActiveListings(sellerKey(l)).length || l.sellerAds)} · ${t('seller.viewAll')} ›</div>
      </div>
    </a>
    <details class="safety-note"${riskMed || riskHigh ? ' open' : ''}>
      <summary class="sn-head"><span>🛡️ <b>${t('safety.tipsT')}</b></span><span class="sn-chev" aria-hidden="true">⌄</span></summary>
      <ul class="sn-list">${safetyTips(l.category).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    </details>`;

  const panelsHTML = `
    <div class="panel">
      <h2>${t('item.specs')}</h2>
      <div class="params-table">
        ${params.map(([k, v]) => `<div class="prow"><span>${k}</span><span>${esc(v)}</span></div>`).join('')}
      </div>
    </div>
    <div class="panel">
      <h2>${t('item.desc')}</h2>
      <div class="item-desc">${maskUnsafe(l.description)}</div>
    </div>
    <div class="panel">
      <h2>${t('item.location')}</h2>
      <div class="map-wrap">${kgMapSVG(l.city)}</div>
      <div class="map-caption">📍 ${esc(l.city)}${l.district ? ', ' + esc(l.district) : ''} · ${t('item.mapNote')}</div>
      <a class="btn btn-secondary" href="${buildSearchHash({ ...defaultFilters(), city: l.city })}" data-link>${t('item.inCity')} ${esc(l.city)}</a>
    </div>`;

  app.innerHTML = `
    <nav class="breadcrumbs">
      <a href="#/" data-link>${t('nav.home')}</a> ›
      <a href="#/search?cat=${l.category}" data-link>${esc(catName(cat))}</a> ›
      <a href="#/search?cat=${l.category}&sub=${encodeURIComponent(l.subcategory)}" data-link>${esc(subName(l.subcategory))}</a> ›
      <span>${esc(l.title)}</span>
    </nav>
    <div class="item-layout">
      <div class="item-gallery">${galleryHTML}</div>
      <aside class="item-side">${sideHTML}</aside>
      <div class="item-panels">${panelsHTML}</div>
    </div>
    ${isMine ? '' : `
    <div class="item-contactbar" id="itemContactBar">
      <button class="icon-btn cb-fav fav-btn ${isFav ? 'active' : ''}" data-fav="${l.id}" aria-label="${t('item.fav')}">${HEART_SVG}</button>
      ${l.phone ? `<button class="btn btn-secondary cb-call" data-action="show-phone" data-id="${l.id}">📞 ${t('item.callShort')}</button>` : ''}
      <button class="btn btn-primary cb-write" data-action="write-seller" data-id="${l.id}">💬 ${t('item.writeShort')}</button>
    </div>`}
    ${similar.length ? `
    <section>
      <div class="section-title"><h2>${t('item.similar')}</h2>
        <a href="#/search?cat=${l.category}&sub=${encodeURIComponent(l.subcategory)}" data-link>${t('home.seeAll')}</a></div>
      <div class="grid">${similar.map(cardHTML).join('')}</div>
    </section>` : ''}`;

  // всегда обновляем (иначе стрелки листают фото предыдущего объявления)
  window._itemPhotos = photos.length > 1 ? photos : [];

  // свайп по фото: не перехватываем вертикальный скролл (passive + проверка доминанты dx)
  if (photos.length > 1) {
    const gm = $('#galleryMain');
    let sx = 0, sy = 0;
    gm.addEventListener('touchstart', e => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });
    gm.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > 1.5 * Math.abs(dy)) galleryGo(dx < 0 ? 1 : -1);
    }, { passive: true });
  }
}

function galleryGo(delta, exact) {
  const photos = window._itemPhotos || [];
  if (!photos.length) return;
  let i = exact !== undefined ? exact : state.galleryIndex + delta;
  i = (i + photos.length) % photos.length;
  state.galleryIndex = i;
  $('#galleryImg').src = photos[i];
  const counter = $('#galleryCounter');
  if (counter) counter.textContent = `${i + 1} / ${photos.length}`;
  document.querySelectorAll('#galleryThumbs img').forEach((t, idx) =>
    t.classList.toggle('active', idx === i));
  const activeThumb = document.querySelector(`#galleryThumbs img[data-thumb="${i}"]`);
  if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
}

function showPhoneModal(id) {
  const l = getListing(id);
  if (!l) return;
  openModal(`
    <h3>${t('phone.modal')}</h3>
    <div class="phone-reveal">
      <div class="avatar" style="${avatarStyle(l.sellerName)}; margin: 0 auto;">${esc(l.sellerName[0])}</div>
      <div class="num">${esc(l.phone)}</div>
      <div class="who">${esc(l.sellerName)} · ${esc(l.title)}</div>
      <a class="btn btn-primary btn-block btn-lg" href="tel:${l.phone.replace(/\s/g, '')}">${t('phone.call')}</a>
      <div style="height:8px"></div>
      <button class="btn btn-outline btn-block btn-lg" data-action="write-seller" data-id="${l.id}">${t('phone.chat')}</button>
    </div>`);
}

/* ---------------- «Культурный торг» (авто-переговорщик) ---------------- */

/* облачное объявление? у него UUID-id и торг считает сервер, а не браузер */
function isCloudListing(l) { return !!(l && typeof l.id === 'string' && l.id.includes('-')); }

function openOfferModal(id) {
  const l = getListing(id);
  if (!l || !(l.floor || l.hasFloor)) return;
  state._offerTries = 0;
  openModal(`
    <h3>🤝 ${t('offer.title')}</h3>
    <p class="modal-text">${t('offer.sub').replace('{price}', '<b>' + fmtNum(l.price) + ' ' + t('som') + '</b>')}</p>
    <input class="finput offer-input" id="offerInput" type="number" inputmode="numeric" min="0" placeholder="${t('offer.ph')}" autocomplete="off">
    <div id="offerResult"></div>
    <div class="modal-actions" id="offerActions">
      <button class="btn btn-outline btn-block" data-action="modal-close">${t('del.cancel')}</button>
      <button class="btn btn-primary btn-block" data-action="offer-submit" data-id="${l.id}">${t('offer.submit')}</button>
    </div>`);
  const inp = $('#offerInput');
  if (inp && window.innerWidth > 920) inp.focus();
  if (inp) inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); submitOffer(id); } });
}

/* Облачный торг: floor лежит на сервере и клиенту не виден. Оценку делает
   rpc_make_offer — здесь только показываем вердикт. Точное число нигде не
   светится (встречное сервер отдаёт сам, осознанно, после двух неудач). */
async function submitOfferCloud(id, l) {
  const inp = $('#offerInput'); const result = $('#offerResult');
  if (!inp || !result) return;
  const offer = Math.round(+inp.value || 0);
  if (offer <= 0) { result.innerHTML = `<div class="offer-msg offer-warn">${t('offer.enter')}</div>`; return; }
  if (typeof BZ === 'undefined' || !BZ.available()) {
    result.innerHTML = `<div class="offer-msg offer-no">${t('offer.rejected')}</div>`; return;
  }
  result.innerHTML = `<div class="offer-msg">…</div>`;
  const r = await BZ.makeOffer(id, offer);
  if (!r) { result.innerHTML = `<div class="offer-msg offer-warn">${t('offer.enter')}</div>`; return; }
  if (r.status === 'accepted') {
    const deal = Math.min(offer, l.price);
    result.innerHTML = `<div class="offer-msg offer-ok">
        <div class="offer-ok-head">✅ ${t('offer.accepted')}</div>
        <div class="offer-deal">${fmtNum(deal)} ${t('som')}</div>
        <button class="btn btn-primary btn-block btn-lg" data-action="offer-deal" data-id="${id}" data-price="${deal}">💬 ${t('offer.toChat')}</button>
      </div>`;
    inp.disabled = true;
    const b = document.querySelector('#offerActions [data-action="offer-submit"]'); if (b) b.remove();
  } else if (r.status === 'countered' && r.counter_amount) {
    result.innerHTML = `<div class="offer-msg offer-warn">${t('offer.rejected')}</div>
      <div class="offer-counter">
        <div class="offer-counter-text">${t('offer.counter').replace('{price}', '<b>' + fmtNum(r.counter_amount) + ' ' + t('som') + '</b>')}</div>
        <button class="btn btn-bargain btn-block" data-action="offer-deal" data-id="${id}" data-price="${r.counter_amount}">🤝 ${t('offer.acceptCounter')}</button>
      </div>`;
  } else {
    const head = r.gap_hint === 'almost' ? t('offer.close') : t('offer.rejected');
    const cls = r.gap_hint === 'almost' ? 'offer-warn' : 'offer-no';
    result.innerHTML = `<div class="offer-msg ${cls}">${head}</div>`;
  }
}

function submitOffer(id) {
  const l = getListing(id);
  if (!l || !(l.floor || l.hasFloor)) return;
  if (isCloudListing(l)) { submitOfferCloud(id, l); return; }
  const inp = $('#offerInput');
  const result = $('#offerResult');
  if (!inp || !result) return;
  const offer = Math.round(+inp.value || 0);
  if (offer <= 0) { result.innerHTML = `<div class="offer-msg offer-warn">${t('offer.enter')}</div>`; return; }
  state._offerTries = (state._offerTries || 0) + 1;

  if (offer >= l.floor) {
    const deal = Math.min(offer, l.price); // не дороже витрины
    result.innerHTML = `<div class="offer-msg offer-ok">
        <div class="offer-ok-head">✅ ${t('offer.accepted')}</div>
        <div class="offer-deal">${fmtNum(deal)} ${t('som')}</div>
        <button class="btn btn-primary btn-block btn-lg" data-action="offer-deal" data-id="${id}" data-price="${deal}">💬 ${t('offer.toChat')}</button>
      </div>`;
    inp.disabled = true;
    const submitBtn = document.querySelector('#offerActions [data-action="offer-submit"]');
    if (submitBtn) submitBtn.remove();
  } else {
    const gap = (l.floor - offer) / l.floor;
    const isClose = gap <= 0.07;
    const head = isClose ? t('offer.close') : t('offer.rejected');
    const cls = isClose ? 'offer-warn' : 'offer-no';
    let counter = '';
    if (state._offerTries >= 2) {
      counter = `<div class="offer-counter">
          <div class="offer-counter-text">${t('offer.counter').replace('{price}', '<b>' + fmtNum(l.floor) + ' ' + t('som') + '</b>')}</div>
          <button class="btn btn-bargain btn-block" data-action="offer-deal" data-id="${id}" data-price="${l.floor}">🤝 ${t('offer.acceptCounter')}</button>
        </div>`;
    }
    result.innerHTML = `<div class="offer-msg ${cls}">${head}</div>${counter}`;
  }
}

/* открыть чат с продавцом по объявлению: реальное (БД) → realtime-чат, мок → демо-бот */
async function openChatForListing(listingId, prefillText) {
  if (!requireAuth(location.hash)) return;
  const l = getListing(listingId);
  if (!l) return;
  if (l.ownerId) { // реальное объявление с владельцем → настоящий чат
    if (l.ownerId === currentUser().id) { showToast(t('chat.ownListing')); return; }
    try {
      const chat = await dbStartChat({ listingRef: l.id, listingTitle: l.title, sellerId: l.ownerId });
      if (!state.chats[chat.id]) {
        state.chats[chat.id] = {
          itemId: l.id, chatId: chat.id, isDb: true, sellerId: chat.seller_id, buyerId: chat.buyer_id,
          otherName: l.sellerName, title: l.title, messages: [], unread: false, updatedAt: Date.now(),
        };
      }
      if (prefillText) {
        const msg = { from: 'me', text: prefillText, ts: Date.now() };
        state.chats[chat.id].messages.push(msg);
        try {
          const saved = await dbSendMessage(chat.id, prefillText);
          msg.id = saved.id;
          showToast(t('offer.dealDone'), 'success');
        } catch (e) {
          // откат: сообщение не ушло — не показываем его как отправленное
          const arr = state.chats[chat.id].messages;
          const i = arr.indexOf(msg);
          if (i >= 0) arr.splice(i, 1);
          showToast(t('toast.sendFail'), 'error');
        }
      }
      location.hash = '#/chats/' + chat.id;
    } catch (e) { showToast(t('auth.errGeneric')); }
    return;
  }
  // мок-объявление → локальный демо-чат
  const chat = ensureChat(listingId);
  if (prefillText) {
    chat.messages.push({ from: 'me', text: prefillText, ts: Date.now() });
    chat.updatedAt = Date.now();
    lsSave(LS.chats, state.chats);
    showToast(t('offer.dealDone'), 'success');
    setTimeout(() => {
      const c = state.chats[listingId];
      if (!c) return;
      const reply = { from: 'them', text: t('offer.sellerConfirm'), ts: Date.now() };
      c.messages.push(reply); c.updatedAt = Date.now();
      const here = location.hash === '#/chats/' + listingId;
      c.unread = !here; lsSave(LS.chats, state.chats);
      if (here && !appendChatMsg(listingId, reply)) renderChats(listingId);
      updateBadges();
    }, 1200);
  }
  location.hash = '#/chats/' + listingId;
}

function offerToChat(id, price) {
  closeModal();
  openChatForListing(id, t('offer.chatMsg').replace('{price}', fmtNum(price) + ' ' + t('som')));
}

/* ---------------- избранное ---------------- */

function toggleFav(id) {
  const l = getListing(id);
  // облачное объявление + залогинен → зеркалим в облако (переживёт смену
  // устройства). Демо-объявления (не-uuid id) FK к listings не пустит — они
  // остаются локально, что для демо-каталога и правильно.
  const toCloud = l && isCloudListing(l) && typeof BZ !== 'undefined' && BZ.available()
    && typeof isAuthed === 'function' && isAuthed();
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
    if (toCloud) BZ.favorites.remove(id);
    showToast(t('toast.favDel'));
  } else {
    state.favorites.add(id);
    // запоминаем цену на момент добавления — потом покажем, подешевело или нет
    state.favMeta[id] = { ...(state.favMeta[id] || {}), price: l ? l.price : 0,
      title: l ? l.title : '', ts: Date.now() };
    lsSave(LS.favMeta, state.favMeta);
    if (toCloud) BZ.favorites.add(id, l.price, null, null);
    showToast(t('toast.favAdd'), 'success');
  }
  lsSave(LS.favs, [...state.favorites]);
  updateBadges();
}

function renderFavorites() {
  const meta = state.favMeta || {};
  const rows = [...state.favorites]
    .filter(id => !state.reported.has(id))
    .map(id => ({ id, l: getListing(id), m: meta[id] || {} }));

  // сортировка сохраняется между заходами
  const sort = state.favSort || 'added';
  const cmp = {
    added: (a, b) => (b.m.ts || 0) - (a.m.ts || 0),
    cheap: (a, b) => (a.l ? a.l.price : Infinity) - (b.l ? b.l.price : Infinity),
    drop: (a, b) => priceDelta(b) - priceDelta(a),
  };
  function priceDelta(r) { // насколько подешевело с момента добавления, %
    if (!r.l || !r.m.price || !r.l.price) return -Infinity;
    return (r.m.price - r.l.price) / r.m.price * 100;
  }
  rows.sort(cmp[sort] || cmp.added);

  // пока облачные объявления не подгрузились, getListing по ним вернёт пусто —
  // объявить их «снятыми» значило бы предложить удалить живое объявление
  const cloudReady = typeof sb === 'undefined' || !sb || state.dbListings.length > 0 || state._cloudLoaded;
  const live = rows.filter(r => r.l);
  const gone = cloudReady ? rows.filter(r => !r.l) : [];

  const cardWithMeta = r => {
    const d = priceDelta(r);
    let badge = '';
    if (isFinite(d) && Math.abs(d) >= 1) {
      const down = d > 0;
      badge = `<div class="fav-price ${down ? 'down' : 'up'}">${down ? '↓' : '↑'} ${Math.abs(Math.round(d))}% · ${down ? t('favs.cheaper') : t('favs.pricier')}</div>`;
    }
    const note = r.m.note
      ? `<div class="fav-note">📝 ${esc(r.m.note)}</div>` : '';
    return `<div class="fav-item">
      ${cardHTML(r.l)}
      ${badge}${note}
      <button class="fav-note-btn" data-action="fav-note" data-id="${r.id}">${r.m.note ? t('favs.noteEdit') : t('favs.noteAdd')}</button>
    </div>`;
  };

  app.innerHTML = `
    <div class="page-head">
      <h1>${t('favs.title')}</h1>
      ${live.length ? `<span class="results-count">${nLabel(live.length)}</span>` : ''}
    </div>
    ${rows.length ? `
    <div class="fav-tools">
      <select class="fselect fav-sort" id="favSort">
        <option value="added" ${sort === 'added' ? 'selected' : ''}>${t('favs.sortAdded')}</option>
        <option value="cheap" ${sort === 'cheap' ? 'selected' : ''}>${t('favs.sortCheap')}</option>
        <option value="drop" ${sort === 'drop' ? 'selected' : ''}>${t('favs.sortDrop')}</option>
      </select>
    </div>` : ''}
    <div class="grid">
      ${live.length
        ? live.map(cardWithMeta).join('')
        : (gone.length ? '' : emptyHTML('💔', t('favs.empty.t'), t('favs.empty.p'),
            `<a class="btn btn-primary" href="#/search?reset=1" data-link>${t('favs.empty.btn')}</a>`))}
    </div>
    ${gone.length ? `
    <section class="fav-gone">
      <div class="section-title"><h2>${t('favs.goneTitle')}</h2></div>
      <p class="fav-gone-sub">${t('favs.goneSub')}</p>
      <div class="fav-gone-list">
        ${gone.map(r => `<div class="fav-gone-row">
          <span>${esc((r.m.title) || t('favs.goneItem'))}${r.m.price ? ' · ' + fmtNum(r.m.price) + ' ' + t('som') : ''}</span>
          <button class="btn-ghost" data-action="fav-forget" data-id="${r.id}">${t('favs.forget')}</button>
        </div>`).join('')}
      </div>
    </section>` : ''}`;

  const sortSel = $('#favSort');
  if (sortSel) sortSel.addEventListener('change', e => { state.favSort = e.target.value; renderFavorites(); });
}

/* ---------------- продажа за 30 секунд (реальная камера + ИИ) ---------------- */

const DEFAULT_PHONE = '+996 700 123 456';
state.sell = { step: 'pick' };

function sellPhoto(p) { return photoURL(p.category, p.photoSeed, p.subcategory); }

/* статистика цен подкатегории (для оценки цены по фото) — без аренды (/мес и т.п.) */
function subPriceStats(sub) {
  const ps = LISTINGS.filter(l => l.subcategory === sub && l.price > 0 && !l.priceSuffix)
    .map(l => l.price).sort((a, b) => a - b);
  if (ps.length < 4) return null;
  // перцентиль по (n-1): floor(q*n) на малых выборках давал абсолютный min/max
  const at = q => ps[Math.min(ps.length - 1, Math.round(q * (ps.length - 1)))];
  const m2 = ps.length >> 1;
  const med = ps.length % 2 ? ps[m2] : Math.round((ps[m2 - 1] + ps[m2]) / 2);
  // lo = осторожный ориентир (p30): без знания модели лучше не завышать
  return { min: at(0.1), max: at(0.9), median: med, lo: at(0.3) };
}

/* шаблон заголовка/описания, когда известна только категория (CLIP) */
function sellTemplate(noun, condition) {
  const n = noun || '';
  const c = condition === 'new' ? 'новый, не использовался' : 'в хорошем состоянии';
  return {
    title: n,
    desc: `${n}${n ? ', ' : ''}${c}. Продаю, всё работает исправно. Пишите в сообщения — отвечу на вопросы и пришлю дополнительные фото.`,
  };
}

function renderSell() {
  if (state.sell.step !== 'camera') visionStopCamera();
  if (state.sell.step === 'camera') renderSellCamera();
  else if (state.sell.step === 'analyze') renderSellAnalyze();
  else if (state.sell.step === 'draft') renderSellDraft();
  else renderSellPick();
}

function renderSellPick() {
  const grid = DEMO_PRODUCTS.map(p =>
    `<button class="sell-sample" data-sell-demo="${p.id}" aria-label="${esc(p.title)}"><img src="${sellPhoto(p)}" loading="lazy" alt=""></button>`).join('');
  app.innerHTML = `
    <div class="form-page">
      <div class="sell-head">
        <div class="sell-head-icon">✨</div>
        <h1>${t('sell.title')}</h1>
        <p>${t('sell.step1sub')}</p>
      </div>
      <button class="sell-snap" data-sell-camera>
        <span class="sell-snap-cam">📷</span>
        <span>${t('sell.camera')}</span>
      </button>
      <label class="btn btn-outline btn-block btn-lg sell-upload-btn">
        🖼️ ${t('sell.upload')}
        <input type="file" accept="image/*" id="sellFile" hidden>
      </label>
      <div class="sell-or">${t('sell.examples')}</div>
      <div class="sell-samples">${grid}</div>
      <a class="sell-manual-link" href="#/post" data-link>${t('post.choice.manual')} ›</a>`;
  app.innerHTML += '</div>';
  const file = $('#sellFile');
  if (file) file.addEventListener('change', onSellFile);
}

/* живая камера устройства */
function renderSellCamera() {
  app.innerHTML = `
    <div class="form-page sell-cam-page">
      <div class="sell-cam-frame">
        <video id="sellVideo" playsinline autoplay muted></video>
      </div>
      <div class="sell-cam-bar">
        <button class="btn btn-outline" data-sell-cancelcam>${t('sell.cancel')}</button>
        <button class="sell-shutter" id="sellShutter" aria-label="${t('sell.shutter')}"><span></span></button>
        <label class="btn btn-outline sell-upload-mini">🖼️<input type="file" accept="image/*" id="sellFile2" hidden></label>
      </div>
    </div>`;
  const video = $('#sellVideo');
  visionStartCamera(video).catch(err => {
    if (err && err.message === 'aborted') return; // юзер уже ушёл — молча
    showToast(t('sell.camDenied'));
    state.sell.step = 'pick';
    renderSell();
  });
  $('#sellShutter').addEventListener('click', () => {
    const lo = visionDownscale(video, 1024, 0.72); // хранение/показ
    const hi = visionDownscale(video, 1600, 0.85); // распознавание (мелкие детали)
    visionStopCamera();
    if (lo) startSellAnalyze(lo, hi);
  });
  $('#sellFile2').addEventListener('change', onSellFile);
}

async function onSellFile(e) {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  try {
    const { lo, hi } = await visionFileToPair(f);
    if (lo) startSellAnalyze(lo, hi);
  } catch { showToast(t('toast.checkFields')); }
}

/* фото получено → распознаём. photo = для показа/хранения, photoHi = для ИИ */
function startSellAnalyze(dataURL, hiURL) {
  state.sell = { step: 'analyze', photo: dataURL, photoHi: hiURL || dataURL };
  if (!parseHash().path.startsWith('/sell')) location.hash = '#/sell';
  else renderSell();
}

function renderSellAnalyze() {
  const isDemo = !!state.sell.product;
  const useSmart = !isDemo && typeof smartOn === 'function' && smartOn();
  const photo = isDemo ? sellPhoto(state.sell.product) : state.sell.photo;            // для показа
  const recoPhoto = isDemo ? photo : (state.sell.photoHi || state.sell.photo);        // для распознавания (выше разрешение)
  const firstStatus = isDemo ? t('sell.scanning') : (useSmart ? t('sell.smartRecognizing') : t('sell.modelLoading'));
  app.innerHTML = `
    <div class="form-page sell-scan-page">
      <div class="sell-scan-card">
        <div class="sell-scan-photo">
          <img src="${photo}" alt="">
          <div class="sell-scan-grid"></div>
          <div class="sell-scan-line"></div>
        </div>
        <div class="sell-scan-status">
          <span class="ai-avatar">✨</span>
          <span id="sellScanText">${firstStatus}</span>
        </div>
        <div class="ai-bubble sell-scan-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
        <button class="btn btn-outline sell-scan-cancel" data-sell-restart>✕ ${t('sell.cancel')}</button>
      </div>
    </div>`;

  const self = state.sell; // идентичность сессии: отменённое/устаревшее распознавание не применяется
  const live = () => state.sell === self && self.step === 'analyze' && parseHash().path.startsWith('/sell');
  const toDraft = () => { if (!live()) return; self.step = 'draft'; renderSell(); };

  if (isDemo) {
    // демо: анимация распознавания, данные предзаписаны
    const steps = [t('sell.scan1'), t('sell.scan2'), t('sell.scan3')];
    let i = 0;
    const tick = setInterval(() => { const el = $('#sellScanText'); if (el && steps[i]) el.textContent = steps[i++]; }, 540);
    self._scanTimer = setTimeout(() => { clearInterval(tick); self._scanTimer = null; toDraft(); }, 1850);
    return;
  }

  // реальное фото: точный сервер-ИИ (если подключён) ИЛИ встроенный CLIP on-device
  const recognize = useSmart
    ? smartRecognize(recoPhoto).catch(err => {
        // сервер недоступен/ошибка — мягко падаем на встроенный движок
        return visionClassifyDataURL(recoPhoto);
      })
    : visionClassifyDataURL(recoPhoto);
  recognize.then(det => {
    if (!live()) return;
    self.detection = det;
    toDraft();
  }).catch(() => {
    if (!live()) return;
    self.detection = { category: null, subcategory: null, label: '', confidence: 0, failed: true };
    toDraft();
  });
  if (!useSmart) setTimeout(() => { const el = $('#sellScanText'); if (live() && el) el.textContent = t('sell.analyzing'); }, 1500);
}

/* единый черновик: демо-товар ИЛИ реальное фото (точный сервер-ИИ / встроенный CLIP) */
function renderSellDraft() {
  const isReal = !state.sell.product;
  const p = state.sell.product;
  const det = state.sell.detection || {};
  const isSmart = isReal && det.source === 'smart' && det.category;
  const photo = isReal ? state.sell.photo : sellPhoto(p);

  let category = isReal ? (det.category || '') : p.category;
  let subcategory = isReal ? (det.subcategory || '') : p.subcategory;
  let condition = isReal ? (det.condition || 'used') : (p.condition || '');

  // заголовок и описание: сервер-ИИ пишет сам, CLIP — шаблон по категории, демо — готовое
  const tmpl = (isReal && !isSmart && subcategory) ? sellTemplate(det.noun, condition) : null;
  let titleVal = isSmart ? det.title : (isReal ? (tmpl ? tmpl.title : '') : p.title);
  let descVal = isSmart ? det.description : (isReal ? (tmpl ? tmpl.desc : '') : p.desc);

  // цена: сервер-ИИ даёт конкретную, CLIP — осторожный ориентир (p30), демо — готовую
  const stats = isReal && subcategory ? subPriceStats(subcategory) : null;
  let market = isReal ? (stats ? [stats.min, stats.max] : null) : p.market;
  let suggested = isSmart ? det.price : (isReal ? (stats ? Math.round(stats.lo / 500) * 500 : '') : p.suggested);

  const specs = isSmart ? (det.specs || []) : (isReal ? [] : (p.specs || []));

  const cityOptions = CITIES.map(c => `<option ${c === (state.city !== 'all' ? state.city : 'Бишкек') ? 'selected' : ''}>${esc(c)}</option>`).join('');
  const condChip = (val, label) => `<button type="button" class="fchip ${condition === val ? 'active' : ''}" data-scond="${val}">${label}</button>`;
  const specsHTML = specs.map(([k, v]) => `<div class="prow"><span>${esc(t(k))}</span><span>${esc(v)}</span></div>`).join('');

  // шапка распознавания
  let detLine;
  if (!isReal) detLine = t('sell.recognized').replace('{c}', p.confidence);
  else if (det.failed) detLine = t('sell.modelFail');
  else if (isSmart) detLine = `${t('sell.detected').replace('{label}', esc(det.title))} · ${det.confidence}%`;
  else if (det.category) detLine = `${t('sell.looksLike').replace('{cat}', subName(det.subcategory))} · ${det.confidence}%`;
  else detLine = det.label ? `${t('sell.detected').replace('{label}', esc(det.label))} — ${t('sell.unknownCat')}` : t('sell.unknownCat');

  // категория/подкатегория редактируются только в реальном режиме
  const catSelect = isReal ? `
    <div class="form-row">
      <div class="fgroup">
        <label class="flabel">${t('form.cat')}</label>
        <select class="fselect" id="sCat">
          <option value="">${t('form.chooseCat')}</option>
          ${CATEGORIES.map(c => `<option value="${c.id}" ${category === c.id ? 'selected' : ''}>${c.emoji} ${catName(c)}</option>`).join('')}
        </select>
      </div>
      <div class="fgroup" id="sSubWrap" ${category ? '' : 'hidden'}>
        <label class="flabel">${t('form.sub')}</label>
        <select class="fselect" id="sSub">${category ? (catById(category)?.subs || []).map(sx => `<option value="${esc(sx)}" ${subcategory === sx ? 'selected' : ''}>${esc(subName(sx))}</option>`).join('') : ''}</select>
      </div>
    </div>` : '';

  app.innerHTML = `
    <div class="form-page">
      <div class="sell-draft-top ${isReal && (det.failed || !det.category) ? 'sell-draft-warn' : ''}">
        <img class="sell-draft-photo" src="${photo}" alt="">
        <div class="sell-draft-meta">
          <div class="sell-ready"><span class="sell-ready-check">✓</span> ${isReal ? t('sell.yourPhoto') : t('sell.title')}</div>
          <div class="sell-confidence">${detLine}</div>
        </div>
      </div>
      ${isReal && !isSmart ? `<div class="sell-real-note">ℹ️ ${t('sell.realNote')}</div>` : ''}
      ${isSmart && det.modelCertain === false ? `<div class="sell-real-note sell-verify-note">💡 ${t('sell.verifyModel')}</div>` : ''}
      <form id="sellForm" class="form-card">
        ${catSelect}
        <div class="fgroup">
          <label class="flabel">${t('form.title')}</label>
          <input class="finput" id="sTitle" maxlength="80" placeholder="${t('sell.titleHint')}" value="${esc(titleVal)}">
        </div>
        <div class="fgroup sell-price-group">
          <label class="flabel">${isSmart || !isReal ? t('sell.priceSuggested') : t('sell.priceByCat')}</label>
          <input class="finput sell-price-input" id="sPrice" type="number" inputmode="numeric" min="0" value="${suggested}" placeholder="0">
          <div class="sell-market" id="sMarket">${market ? '📊 ' + t('sell.market').replace('{min}', fmtNum(market[0])).replace('{max}', fmtNum(market[1])).replace('{som}', t('som')) : ''}</div>
          ${isSmart ? `<div class="sell-price-why">💡 ${t('sell.byAI')}</div>` : (!isReal ? `<div class="sell-price-why">💡 ${t('sell.priceWhy')}</div>` : '')}
        </div>
        <div class="form-row">
          <div class="fgroup">
            <label class="flabel">${t('form.cond')}</label>
            <div class="chip-row" id="sCond">
              ${condChip('', t('form.condNone'))}
              ${condChip('new', t('cond.new'))}
              ${condChip('used', t('cond.used'))}
            </div>
          </div>
          <div class="fgroup">
            <label class="flabel">${t('form.city')}</label>
            <select class="fselect" id="sCity">${cityOptions}</select>
          </div>
        </div>
        ${specsHTML ? `<div class="fgroup"><label class="flabel">${t('item.specs')}</label><div class="params-table sell-specs">${specsHTML}</div></div>` : ''}
        <div class="fgroup">
          <label class="flabel">${t('form.desc')}</label>
          <textarea class="ftextarea" id="sDesc" maxlength="2000" placeholder="${t('form.descPh')}">${esc(descVal)}</textarea>
        </div>
        <div class="sell-hint">${t('sell.manualHint')}</div>
        <button type="submit" class="btn btn-primary btn-block btn-lg">${t('sell.publish')}</button>
      </form>
      <div class="sell-draft-actions">
        <button class="btn btn-outline" data-action="sell-to-manual">✏️ ${t('sell.edit')}</button>
        <button class="btn btn-outline" data-sell-restart>📷 ${t('sell.retake')}</button>
        <button class="btn btn-danger-soft" data-sell-exit>✕ ${t('sell.cancel')}</button>
      </div>
    </div>`;

  $('#sCond').addEventListener('click', e => {
    const b = e.target.closest('[data-scond]');
    if (!b) return;
    condition = b.dataset.scond;
    document.querySelectorAll('#sCond .fchip').forEach(x => x.classList.toggle('active', x === b));
  });

  // реальный режим: смена категории → подкатегории + переоценка цены
  if (isReal) {
    const refreshPrice = () => {
      const st = subPriceStats(subcategory);
      market = st ? [st.min, st.max] : null;
      const mEl = $('#sMarket');
      if (mEl) mEl.innerHTML = market ? '📊 ' + t('sell.market').replace('{min}', fmtNum(market[0])).replace('{max}', fmtNum(market[1])).replace('{som}', t('som')) : '';
      if (st && !$('#sPrice').value) $('#sPrice').value = Math.round(st.median / 500) * 500;
    };
    $('#sCat')?.addEventListener('change', e => {
      category = e.target.value;
      const c = catById(category);
      $('#sSubWrap').hidden = !c;
      $('#sSub').innerHTML = c ? c.subs.map(sx => `<option value="${esc(sx)}">${esc(subName(sx))}</option>`).join('') : '';
      subcategory = c ? c.subs[0] : '';
      refreshPrice();
    });
    $('#sSub')?.addEventListener('change', e => { subcategory = e.target.value; refreshPrice(); });
  }

  const collect = () => ({
    category, subcategory,
    title: $('#sTitle').value.trim(),
    description: $('#sDesc').value.trim(),
    price: +$('#sPrice').value || 0,
    negotiable: false,
    city: $('#sCity').value,
    condition: condition || null,
    phone: DEFAULT_PHONE,
    hasDelivery: false,
    userPhotos: isReal ? [photo] : null,
    pickedSeeds: isReal ? null : [p.photoSeed, p.photoSeed + 7, p.photoSeed + 13],
    specs: specs && specs.length ? specs : null, // и демо, и smart-распознанные
  });
  state.sell._collect = collect;

  $('#sellForm').addEventListener('submit', async e => {
    e.preventDefault();
    const d = collect();
    if (!d.category || !d.subcategory) { showToast(t('err.cat')); return; }
    if (d.title.length < 5 || d.price <= 0) { showToast(t('toast.checkFields')); return; }
    // фото: реальные (data-URI с камеры/ИИ) или демо-сиды (числа)
    const photos = d.userPhotos || d.pickedSeeds || [];
    // #/sell под гардом авторизации → юзер ЗАЛОГИНЕН → публикуем В ОБЛАКО (видно ВСЕМ,
    // как у обычной формы). Раньше тут было только локальное сохранение — поэтому
    // объявления из «Сделать фото» видел только автор.
    if (isAuthed()) {
      const btn = $('#sellForm button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        // распознанные спеки едут в jsonb (attrs._specs); телефона в фото-флоу нет —
        // НЕ публикуем демо-номер, контакт = чат (кнопка телефона скроется сама)
        const row = await dbCreateListing({
          title: d.title, price: d.price, floor: 0,
          category: d.category, subcategory: d.subcategory, city: d.city,
          district: null, condition: d.condition, description: d.description || d.title,
          photos, negotiable: false,
          attrs: d.specs && d.specs.length ? { _specs: d.specs } : {},
        });
        const mapped = dbToListing(row, { [currentUser().id]: currentUser().name });
        state.dbListings.unshift(mapped);
        state.sell = { step: 'pick' };
        showToast(t('toast.published'), 'success');
        location.hash = '#/item/' + mapped.id;
        return;
      } catch (err) {
        console.error('Публикация (фото-флоу) в облако не удалась:', err);
        if (btn) btn.disabled = false;
        const msg = (err && (err.message || err.hint || err.details)) ? String(err.message || err.hint || err.details) : '';
        showToast(t('toast.publishFail') + (msg ? ': ' + msg : ''), 'error');
        return;
      }
    }
    // фолбэк (теоретически недостижим — /sell под requireAuth): локально
    const listing = {
      id: 'm' + Date.now(),
      title: d.title, price: d.price, priceSuffix: '', negotiable: false,
      category: d.category, subcategory: d.subcategory, city: d.city, district: null,
      condition: d.condition, description: d.description || d.title,
      userPhotos: d.userPhotos, pickedSeeds: d.pickedSeeds,
      photoCount: d.userPhotos ? d.userPhotos.length : (d.pickedSeeds ? d.pickedSeeds.length : 0),
      photoSeed: isReal ? 11 : p.photoSeed,
      specs: d.specs,
      sellerName: (currentUser() && currentUser().name) || USER_NAME, sellerType: 'private', sellerRating: 5.0,
      sellerAds: state.myListings.length + 1, sellerSinceYear: 2026,
      createdAt: Date.now(), views: 1, isVip: false, isUrgent: false,
      hasDelivery: false, phone: DEFAULT_PHONE,
    };
    state.myListings.unshift(listing);
    try { lsSave(LS.my, state.myListings); } catch (e2) {}
    state.sell = { step: 'pick' };
    showToast(t('toast.published'), 'success');
    location.hash = '#/item/' + listing.id;
  });
}

/* ---------------- подача объявления ---------------- */

/* — динамические поля характеристик (бренд→модель каскад + спеки) — */
const _L_NOTSET = { ru: 'Не указано', en: 'Not set', ky: 'Көрсөтүлгөн эмес' };
const _L_OTHER = { ru: 'Другое…', en: 'Other…', ky: 'Башка…' };
const _L_CUSTOM = { ru: 'Свой вариант', en: 'Custom', ky: 'Өз вариант' };

function attrSelectHTML(key, label, pairs, cur, otherPh, extraData) {
  const isOther = cur != null && cur !== '' && !pairs.some(([v]) => v === cur);
  const sel = isOther ? OTHER_VAL : (cur || '');
  const opts = [`<option value="">${aL(_L_NOTSET)}</option>`]
    .concat(pairs.map(([v, l]) => `<option value="${esc(v)}" ${sel === v ? 'selected' : ''}>${esc(l)}</option>`))
    .concat([`<option value="${OTHER_VAL}" ${isOther ? 'selected' : ''}>${aL(_L_OTHER)}</option>`])
    .join('');
  return `<div class="fgroup attr-field" data-attr-field="${key}" ${extraData || ''}>
    <label class="flabel">${esc(label)}</label>
    <select class="fselect" data-attr="${key}">${opts}</select>
    <input class="finput attr-other" data-attr-other="${key}" placeholder="${esc(aL(otherPh || _L_CUSTOM))}" value="${isOther ? esc(String(cur)) : ''}" ${isOther ? '' : 'hidden'}>
  </div>`;
}

function attrModelFieldHTML(catId, subName, attrs) {
  const schema = attrSchema(catId, subName) || [];
  const bf = schema.find(f => f.type === 'brand');
  const group = bf ? bf.group : null;
  const brand = attrs.brand || '';
  const models = (group && brand) ? modelsFor(group, brand) : [];
  const lbl = aL({ ru: 'Модель', en: 'Model', ky: 'Модель' });
  const cur = attrs.model;
  if (!models.length) {
    return `<div class="fgroup attr-field" data-attr-field="model">
      <label class="flabel">${lbl}</label>
      <input class="finput" data-attr="model" maxlength="40" placeholder="${aL({ ru: 'Напр. Camry, iPhone 15…', en: 'e.g. Camry, iPhone 15…', ky: 'Мис. Camry…' })}" value="${cur ? esc(String(cur)) : ''}">
    </div>`;
  }
  return attrSelectHTML('model', lbl, models.map(m => [m, m]), cur, { ru: 'Своя модель', en: 'Custom model', ky: 'Өз модель' });
}

function attrFieldsHTML(catId, subName, attrs) {
  const schema = attrSchema(catId, subName);
  if (!schema) return '';
  attrs = attrs || {};
  return schema.map(f => {
    if (f.type === 'model') return attrModelFieldHTML(catId, subName, attrs);
    if (f.type === 'number') {
      const unit = f.unit ? ` <span class="attr-unit">(${aL(f.unit)})</span>` : '';
      const cur = attrs[f.key];
      return `<div class="fgroup attr-field" data-attr-field="${f.key}">
        <label class="flabel">${aL(f.label)}${unit}</label>
        <input class="finput" data-attr="${f.key}" type="number" inputmode="numeric" ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} value="${cur != null ? esc(String(cur)) : ''}" placeholder="—">
      </div>`;
    }
    // поколение приходит из каталога и зависит от выбранных марки+модели,
    // своего списка options у него нет — без этой ветки форма авто падала
    let pairs;
    if (f.type === 'brand') pairs = brandsFor(f.group).map(b => [b, b]);
    else if (f.type === 'gen') {
      const bf = schema.find(x => x.type === 'brand');
      const sub = (bf && typeof GROUP_TO_SUB !== 'undefined') ? GROUP_TO_SUB[bf.group] : null;
      const gens = (sub && attrs.brand && attrs.model && typeof catalogGens === 'function')
        ? catalogGens(sub, attrs.brand, attrs.model) : [];
      if (!gens.length) return ''; // марка/модель ещё не выбраны — поле не нужно
      pairs = gens.map(g => [g.name, g.ru ? `${g.name} (${g.ru})` : g.name]);
    } else pairs = f.options.map(o => [o.v, aL(o.l)]);
    const extra = f.type === 'brand' ? `data-attr-brand="${f.group}"` : '';
    return attrSelectHTML(f.key, aL(f.label), pairs, attrs[f.key], _L_CUSTOM, extra);
  }).join('');
}

/* собрать значения характеристик из контейнера формы */
function collectAttrs(container) {
  if (!container) return {};
  const attrs = {};
  container.querySelectorAll('[data-attr]').forEach(el => {
    const key = el.dataset.attr;
    let v = el.value;
    if (v === OTHER_VAL) {
      const other = container.querySelector(`[data-attr-other="${key}"]`);
      v = other ? other.value.trim() : '';
    }
    if (v != null && String(v).trim() !== '') attrs[key] = el.type === 'number' ? +v : String(v).trim();
  });
  return attrs;
}

/* ============================================================
   Черновик формы подачи.
   Форма длинная (категория, до 8 характеристик, заголовок, описание,
   цена, город, телефон, фото). Один промах по нижней навигации, «назад»
   или перезагрузка — и всё введённое пропадало. Пишем снимок в
   localStorage на каждое изменение (с задержкой) и предлагаем вернуться.
   ============================================================ */
function collectPostDraft() {
  const val = id => { const el = $(id); return el ? el.value : ''; };
  const chk = id => { const el = $(id); return el ? el.checked : false; };
  if (!$('#postForm')) return null;
  return {
    category: val('#pCat'), subcategory: val('#pSub'),
    title: val('#pTitle'), description: val('#pDesc'),
    price: val('#pPrice'), floor: val('#pFloor'),
    city: val('#pCity'), phone: val('#pPhone'),
    negotiable: chk('#pNegotiable'), hasDelivery: chk('#pDelivery'),
    condition: (document.querySelector('#pCondition .fchip.active') || { dataset: {} }).dataset.cond || '',
    attrs: typeof collectAttrs === 'function' ? collectAttrs($('#pAttrs')) : {},
    pickedSeeds: [...document.querySelectorAll('#photoPicker .photo-slot.selected[data-seed]')].map(b => +b.dataset.seed),
    userPhotos: state._postPhotos || null,
    step: (function () { const sec = document.querySelector('#postForm .pstep:not([hidden])'); return sec ? +sec.dataset.step : 1; })(),
    ts: Date.now(),
  };
}
function savePostDraft() {
  // в режиме правки черновик не трогаем: иначе открытая правка затирает
  // неоконченное новое объявление
  if (state._postEditing) return;
  const d = collectPostDraft();
  if (!d) return;
  // пустую форму в черновик не пишем — иначе баннер «черновик» на чистой форме
  const meaningful = d.title || d.description || d.price || (d.attrs && Object.keys(d.attrs).length)
    || (d.pickedSeeds && d.pickedSeeds.length) || (d.userPhotos && d.userPhotos.length);
  if (!meaningful) { clearPostDraft(); return; }
  try { lsSave(LS.postDraft, d); } catch (e) {}
}
function loadPostDraft() {
  const d = lsLoad(LS.postDraft, null);
  if (!d || !d.ts) return null;
  if (Date.now() - d.ts > 7 * 24 * 3600 * 1000) { clearPostDraft(); return null; } // протух
  return d;
}
function clearPostDraft() { try { localStorage.removeItem(LS.postDraft); } catch (e) {} }

function renderPost(params) {
  const editId = params.get('edit');
  // редактируем и локальные, и облачные — но только СВОИ
  const editTarget = editId ? getListing(editId) : null;
  const editing = editTarget && (editTarget.id.startsWith('m')
    || (editTarget.ownerId && isAuthed() && editTarget.ownerId === currentUser().id))
    ? editTarget : null;

  // ссылка на правку чужого/удалённого объявления не должна открывать пустую
  // форму «нового объявления» — иначе юзер думает, что правит, а создаёт дубль
  if (editId && !editing) {
    app.innerHTML = emptyHTML('🤷', t('post.editGone.t'), t('post.editGone.p'),
      `<a class="btn btn-primary" href="#/profile" data-link>${t('post.editGone.btn')}</a>`);
    return;
  }

  const prefill = state._prefill;
  state._prefill = null;
  state._postEditing = !!editing;
  // фото прошлой сессии формы не должны утечь в следующее объявление
  if (editing) state._postPhotos = null;
  // черновик восстанавливаем только для НОВОГО объявления
  const draft = !editing && !prefill ? loadPostDraft() : null;
  const f = editing || prefill || draft || {};
  const selCat = f.category || '';
  const cat = catById(selCat);

  const catOptions = [`<option value="">${t('form.chooseCat')}</option>`]
    .concat(CATEGORIES.map(c => `<option value="${c.id}" ${selCat === c.id ? 'selected' : ''}>${c.emoji} ${catName(c)}</option>`)).join('');
  const cityOptions = [`<option value="">${t('form.chooseCity')}</option>`]
    .concat(CITIES.map(c => `<option value="${esc(c)}" ${f.city === c ? 'selected' : ''}>${esc(c)}</option>`)).join('');

  const aiChoice = (editing || prefill) ? '' : `
    <a class="sell-promo" href="#/sell" data-link>
      <span class="sell-promo-icon">✨</span>
      <span class="sell-promo-text">
        <span class="sell-promo-title">${t('post.choice.ai')}</span>
        <span class="sell-promo-sub">${t('post.choice.aiSub')}</span>
      </span>
      <span class="ai-item-arrow">›</span>
    </a>
    <div class="sell-or sell-or-post">${t('post.choice.manual')}</div>`;

  app.innerHTML = `
    <div class="form-page">
      ${aiChoice}
      <div class="form-card">
        <h1>${editing ? t('form.edit') : t('form.new')}</h1>
        ${draft ? `<div class="draft-note">
          <span>📝 ${t('form.draftRestored')}</span>
          <button type="button" class="btn-ghost" data-action="draft-discard">${t('form.draftDiscard')}</button>
        </div>` : ''}
        <div class="pstep-bar" id="pStepBar">
          <div class="pstep-track"><div class="pstep-fill" id="pStepFill"></div></div>
          <div class="pstep-meta"><span id="pStepNum"></span><span id="pStepName"></span></div>
        </div>
        <form id="postForm" novalidate>
          <!-- Форма разбита на шаги: на телефоне одно полотно из 15+ полей
               (7 селектов характеристик ДО заголовка) читается как стена, и
               непонятно, сколько осталось. На каждом шаге — только связанные
               между собой поля. -->
          <section class="pstep" data-step="1">
            <div class="fgroup">
              <label class="flabel">${t('form.cat')}</label>
              <select class="fselect" id="pCat" required>${catOptions}</select>
            </div>
            <div class="fgroup" id="pSubWrap" ${cat ? '' : 'hidden'}>
              <label class="flabel">${t('form.sub')}</label>
              <select class="fselect" id="pSub">${cat ? cat.subs.map(s => `<option value="${esc(s)}" ${f.subcategory === s ? 'selected' : ''}>${esc(subName(s))}</option>`).join('') : ''}</select>
            </div>
          </section>

          <section class="pstep" data-step="2" hidden>
            <div class="fgroup">
              <label class="flabel">${t('form.photos')} <span style="font-weight:400">${t('form.photosHint')}</span></label>
              <div class="photo-picker" id="photoPicker"></div>
            </div>
          </section>

          <section class="pstep" data-step="3" hidden>
            <div class="attr-block" id="pAttrsWrap" hidden>
              <div class="attr-block-head">⚙️ ${t('form.specs')}</div>
              <div class="attr-grid" id="pAttrs"></div>
            </div>
            <div class="fgroup">
              <label class="flabel">${t('form.cond')}</label>
              <div class="chip-row" id="pCondition">
                <button type="button" class="fchip ${!f.condition ? 'active' : ''}" data-cond="">${t('form.condNone')}</button>
                <button type="button" class="fchip ${f.condition === 'new' ? 'active' : ''}" data-cond="new">${t('cond.new')}</button>
                <button type="button" class="fchip ${f.condition === 'used' ? 'active' : ''}" data-cond="used">${t('cond.used')}</button>
              </div>
            </div>
          </section>

          <section class="pstep" data-step="4" hidden>
            <div class="fgroup">
              <label class="flabel">${t('form.title')}</label>
              <input class="finput" id="pTitle" maxlength="80" placeholder="${t('form.titlePh')}" value="${esc(f.title || '')}">
              <div class="hint">${t('form.titleHint')}</div>
            </div>
            <div class="fgroup">
              <label class="flabel">${t('form.desc')}</label>
              <textarea class="ftextarea" id="pDesc" maxlength="2000" placeholder="${t('form.descPh')}">${esc(f.description || '')}</textarea>
            </div>
          </section>

          <section class="pstep" data-step="5" hidden>
            <div class="fgroup">
              <label class="flabel">${t('form.price')}</label>
              <input class="finput" id="pPrice" type="number" inputmode="numeric" min="0" placeholder="0" value="${f.price || ''}" ${f.negotiable ? 'disabled' : ''}>
              <div class="price-hint" id="pPriceHint" hidden></div>
              <label class="fcheck" style="margin-top:6px"><input type="checkbox" id="pNegotiable" ${f.negotiable ? 'checked' : ''}>
                <span class="box"><svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="#fff" stroke-width="2.4"><path d="M1 5l3.5 3.5L11 1"/></svg></span>
                ${t('price.negotiable')}</label>
            </div>
            <div class="fgroup post-floor" id="pFloorWrap" ${f.negotiable ? 'hidden' : ''}>
              <label class="flabel">🤝 ${t('form.floor')}</label>
              <input class="finput" id="pFloor" type="number" inputmode="numeric" min="0" placeholder="${t('form.floorPh')}" value="${f.floor || ''}">
              <div class="hint">${t('form.floorHint')}</div>
            </div>
          </section>

          <section class="pstep" data-step="6" hidden>
            <div class="fgroup">
              <label class="flabel">${t('form.city')}</label>
              <select class="fselect" id="pCity">${cityOptions}</select>
            </div>
            <div class="fgroup">
              <label class="flabel">${t('form.phone')}</label>
              <input class="finput" id="pPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+996 700 123 456" value="${esc(f.phone || '+996 ')}">
            </div>
            <div class="fgroup">
              <label class="fcheck"><input type="checkbox" id="pDelivery" ${f.hasDelivery ? 'checked' : ''}>
                <span class="box"><svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="#fff" stroke-width="2.4"><path d="M1 5l3.5 3.5L11 1"/></svg></span>
                ${t('form.delivery')}</label>
            </div>
          </section>

          <section class="pstep" data-step="7" hidden>
            <div class="preview-note">${t('form.previewNote')}</div>
            <div class="grid" id="pPreview"></div>
          </section>

          <div class="pstep-nav">
            <button type="button" class="btn btn-secondary" id="pPrev" hidden>← ${t('form.back')}</button>
            <button type="button" class="btn btn-primary btn-lg" id="pNext">${t('form.next')} →</button>
            <button type="submit" class="btn btn-primary btn-lg" id="pSubmit" hidden>${editing ? t('form.save') : t('form.publish')}</button>
          </div>
        </form>
      </div>
    </div>`;

  const picked = new Set(f.pickedSeeds || []);
  // реальные снимки: с камеры («изменить вручную» из флоу «Сделать фото»),
  // из восстановленного черновика или из правки существующего объявления
  let realPhotos = (state._postPhotos && state._postPhotos.length ? state._postPhotos
    : (f.userPhotos && f.userPhotos.length ? f.userPhotos
      : (editing && editing.userPhotos ? editing.userPhotos : []))) || [];
  state._postPhotos = realPhotos.length ? realPhotos : null;

  function renderPicker() {
    const c = $('#pCat').value || 'home';
    const sub = $('#pSub') ? $('#pSub').value : '';
    // свои фото идут первыми и помечены как уже прикреплённые
    const mine = realPhotos.map((src, i) =>
      `<button type="button" class="photo-slot selected is-real" data-real="${i}" title="${esc(t('form.photoRemove'))}">
         <img src="${esc(src)}" alt=""><span class="ps-x">✕</span></button>`).join('');
    const stock = Array.from({ length: 8 }, (_, i) => {
      const seed = 11 + i * 7;
      return `<button type="button" class="photo-slot ${picked.has(seed) ? 'selected' : ''}" data-seed="${seed}">
        <img src="${photoURL(c, seed, sub)}" alt=""></button>`;
    }).join('');
    $('#photoPicker').innerHTML = mine + stock;
  }
  renderPicker();

  // характеристики (бренд→модель + спеки), стартовые значения из edit/prefill
  let curAttrs = Object.assign({}, f.attrs || {});
  function renderPostAttrs() {
    const catId = $('#pCat').value;
    const sub = $('#pSub') ? $('#pSub').value : '';
    const wrap = $('#pAttrsWrap');
    if (!hasAttrs(catId, sub)) { wrap.hidden = true; $('#pAttrs').innerHTML = ''; return; }
    wrap.hidden = false;
    $('#pAttrs').innerHTML = attrFieldsHTML(catId, sub, curAttrs);
  }
  renderPostAttrs();

  $('#pAttrs').addEventListener('change', e => {
    const el = e.target.closest('[data-attr]');
    if (!el) return;
    const key = el.dataset.attr;
    const val = el.value;
    if (el.tagName === 'SELECT') { // «Другое» → раскрыть свободный ввод
      const other = $('#pAttrs').querySelector(`[data-attr-other="${key}"]`);
      if (other) { other.hidden = val !== OTHER_VAL; if (val === OTHER_VAL) other.focus(); }
    }
    if (key === 'brand') { // марка сменилась → пересобрать поле модели
      curAttrs.brand = val === OTHER_VAL ? '' : val;
      curAttrs.model = '';
      const mf = $('#pAttrs').querySelector('[data-attr-field="model"]');
      if (mf) mf.outerHTML = attrModelFieldHTML($('#pCat').value, $('#pSub').value, curAttrs);
    }
  });

  $('#photoPicker').addEventListener('click', e => {
    // снятое фото удаляем по тапу
    const real = e.target.closest('[data-real]');
    if (real) {
      realPhotos.splice(+real.dataset.real, 1);
      state._postPhotos = realPhotos.length ? realPhotos : null;
      renderPicker();
      savePostDraft();
      return;
    }
    const slot = e.target.closest('[data-seed]');
    if (!slot) return;
    const seed = +slot.dataset.seed;
    if (picked.has(seed)) picked.delete(seed);
    else if (picked.size < 5) picked.add(seed);
    else { showToast(t('toast.maxPhotos')); return; }
    slot.classList.toggle('selected', picked.has(seed));
  });

  $('#pCat').addEventListener('change', () => {
    const c = catById($('#pCat').value);
    $('#pSubWrap').hidden = !c;
    $('#pSub').innerHTML = c ? c.subs.map(s => `<option value="${esc(s)}">${esc(subName(s))}</option>`).join('') : '';
    curAttrs = {}; // другая категория → другие характеристики
    renderPicker(); renderPostAttrs(); updatePriceHint();
  });
  $('#pSub').addEventListener('change', () => { curAttrs = {}; renderPicker(); renderPostAttrs(); updatePriceHint(); });

  /* Подсказка по рынку прямо в форме: раньше продавец вводил цену вслепую,
     публиковал — и приложение само же вешало покупателю «Дорого» или
     «Подозрительно дёшево». Теперь он видит вилку заранее. */
  function updatePriceHint() {
    const box = $('#pPriceHint');
    if (!box) return;
    const sub = $('#pSub') ? $('#pSub').value : '';
    const st = (sub && typeof subPriceStats === 'function') ? subPriceStats(sub) : null;
    if (!st || $('#pNegotiable').checked) { box.hidden = true; return; }
    const val = +$('#pPrice').value || 0;
    let verdict = '';
    if (val > 0) {
      const r = val / st.median;
      if (r <= 0.6) verdict = `<span class="ph-v low">${t('form.priceLow')}</span>`;
      else if (r <= 1.15) verdict = `<span class="ph-v ok">${t('form.priceOk')}</span>`;
      else verdict = `<span class="ph-v high">${t('form.priceHigh')}</span>`;
    }
    box.innerHTML = `📊 ${t('form.priceMarket')} ${fmtNum(st.min)}–${fmtNum(st.max)} ${t('som')} · ${t('form.priceMedian')} ${fmtNum(st.median)} ${verdict}`;
    box.hidden = false;
  }
  $('#pPrice').addEventListener('input', updatePriceHint);
  updatePriceHint();

  /* ---------- пошаговая навигация ---------- */
  const STEP_NAMES = [t('form.stepWhat'), t('form.stepPhotos'), t('form.stepSpecs'),
    t('form.stepDesc'), t('form.stepPrice'), t('form.stepContacts'), t('form.stepPreview')];
  const TOTAL = 7;
  let step = Math.min(TOTAL, Math.max(1, (draft && draft.step) || 1));

  /* проверка ТОЛЬКО полей текущего шага: человек не должен видеть ошибку
     про телефон, стоя на шаге с фотографиями */
  function validateStep(n) {
    document.querySelectorAll('#postForm .field-error').forEach(x => x.remove());
    document.querySelectorAll('#postForm .error').forEach(x => x.classList.remove('error'));
    const bad = [];
    const mark = (sel, msg) => {
      const el = $(sel);
      if (!el) return;
      el.classList.add('error');
      const d = document.createElement('div');
      d.className = 'field-error'; d.textContent = msg;
      el.parentElement.appendChild(d);
      bad.push(el);
    };
    if (n === 1 && !$('#pCat').value) mark('#pCat', t('err.cat'));
    if (n === 4) {
      if ($('#pTitle').value.trim().length < 5) mark('#pTitle', t('err.title'));
      if ($('#pDesc').value.trim().length < 10) mark('#pDesc', t('err.desc'));
    }
    if (n === 5) {
      const neg = $('#pNegotiable').checked;
      const price = +$('#pPrice').value;
      const fl = Math.round(+$('#pFloor').value || 0);
      if (!neg && (!price || price <= 0)) mark('#pPrice', t('err.price'));
      if (fl > 0 && price > 0 && fl >= price) mark('#pFloor', t('err.floor'));
    }
    if (n === 6) {
      if (!$('#pCity').value) mark('#pCity', t('err.city'));
      if (!/^\+?[\d\s()-]{9,}$/.test($('#pPhone').value.trim())) mark('#pPhone', t('err.phone'));
    }
    if (bad.length) {
      bad[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => { try { bad[0].focus({ preventScroll: true }); } catch (e) {} }, 250);
    }
    return !bad.length;
  }

  function renderPreview() {
    const box = $('#pPreview');
    if (!box) return;
    const neg = $('#pNegotiable').checked;
    const draftListing = {
      id: 'preview', title: $('#pTitle').value.trim() || t('form.titlePh'),
      price: neg ? 0 : (+$('#pPrice').value || 0), priceSuffix: '', negotiable: neg,
      floor: 0, category: $('#pCat').value, subcategory: $('#pSub').value,
      city: $('#pCity').value || CITIES[0], district: null,
      condition: (document.querySelector('#pCondition .fchip.active') || { dataset: {} }).dataset.cond || null,
      description: $('#pDesc').value, attrs: collectAttrs($('#pAttrs')),
      userPhotos: realPhotos.length ? realPhotos : null,
      pickedSeeds: [...picked], photoCount: realPhotos.length + picked.size, photoSeed: 11,
      sellerName: (currentUser() && currentUser().name) || USER_NAME, sellerType: 'private',
      sellerRating: 5, sellerAds: 1, sellerSinceYear: 2026,
      createdAt: Date.now(), postedHoursAgo: 0, views: 0,
      isVip: false, isUrgent: false, hasDelivery: $('#pDelivery').checked, phone: $('#pPhone').value,
    };
    // карточка только для показа: ссылка и кнопки лайка/сравнения с
    // несуществующим id увели бы в никуда
    box.innerHTML = `<div class="preview-lock">${cardHTML(draftListing)}</div>`;
    box.querySelectorAll('a').forEach(a => { a.removeAttribute('href'); a.removeAttribute('data-link'); });
    box.querySelectorAll('[data-fav], [data-action]').forEach(b => b.remove());
  }

  function showStep(n, opts = {}) {
    step = Math.min(TOTAL, Math.max(1, n));
    document.querySelectorAll('#postForm .pstep').forEach(sec => {
      sec.hidden = +sec.dataset.step !== step;
    });
    const pct = Math.round((step / TOTAL) * 100);
    $('#pStepFill').style.width = pct + '%';
    $('#pStepNum').textContent = t('form.stepOf').replace('{n}', step).replace('{total}', TOTAL);
    $('#pStepName').textContent = STEP_NAMES[step - 1] || '';
    $('#pPrev').hidden = step === 1;
    $('#pNext').hidden = step === TOTAL;
    $('#pSubmit').hidden = step !== TOTAL;
    if (step === TOTAL) renderPreview();
    if (!opts.silent) {
      const card = document.querySelector('.form-card');
      if (card) card.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
    savePostDraft();
  }

  $('#pNext').addEventListener('click', () => {
    if (!validateStep(step)) return;
    // шаг 3 не пропускаем: даже без характеристик там выбирается состояние
    showStep(step + 1);
  });
  $('#pPrev').addEventListener('click', () => {
    showStep(step - 1);
  });
  // Enter в поле = «Далее», а не публикация с середины формы
  $('#postForm').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && step !== TOTAL) {
      e.preventDefault();
      $('#pNext').click();
    }
  });
  showStep(step, { silent: true });

  $('#pNegotiable').addEventListener('change', e => {
    $('#pPrice').disabled = e.target.checked;
    if (e.target.checked) $('#pPrice').value = '';
    const fw = $('#pFloorWrap');
    if (fw) { fw.hidden = e.target.checked; if (e.target.checked) $('#pFloor').value = ''; }
    updatePriceHint();
  });

  let condition = f.condition || '';
  $('#pCondition').addEventListener('click', e => {
    const b = e.target.closest('[data-cond]');
    if (!b) return;
    condition = b.dataset.cond;
    document.querySelectorAll('#pCondition .fchip').forEach(x => x.classList.toggle('active', x === b));
  });

  /* автосохранение черновика: пишем с задержкой, чтобы не дёргать хранилище
     на каждую букву. Только для нового объявления — правку не подменяем. */
  if (!editing) {
    let draftTimer = null;
    const scheduleDraft = () => { clearTimeout(draftTimer); draftTimer = setTimeout(savePostDraft, 400); };
    const form = $('#postForm');
    form.addEventListener('input', scheduleDraft);
    form.addEventListener('change', scheduleDraft);
    form.addEventListener('click', e => { if (e.target.closest('.fchip, .photo-slot')) scheduleDraft(); });
    // уход со страницы (нижняя навигация, «назад») — сохранить немедленно
    window.addEventListener('hashchange', savePostDraft, { once: true });
  }

  // ошибку у поля снимаем сразу, как только его начали править
  $('#postForm').addEventListener('input', e => {
    const el = e.target.closest('.error');
    if (!el) return;
    el.classList.remove('error');
    const msg = el.parentElement && el.parentElement.querySelector('.field-error');
    if (msg) msg.remove();
  });

  $('#postForm').addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelectorAll('.field-error').forEach(x => x.remove());
    document.querySelectorAll('.error').forEach(x => x.classList.remove('error'));

    const errs = [];
    const mark = (sel, msg) => {
      const el = $(sel);
      el.classList.add('error');
      el.insertAdjacentHTML('afterend', `<div class="field-error">${msg}</div>`);
      errs.push(msg);
    };

    const catVal = $('#pCat').value;
    const title = $('#pTitle').value.trim();
    const desc = $('#pDesc').value.trim();
    const negotiable = $('#pNegotiable').checked;
    const price = negotiable ? 0 : +$('#pPrice').value;
    const floorRaw = negotiable ? 0 : Math.round(+$('#pFloor').value || 0);
    const city = $('#pCity').value;
    const phone = $('#pPhone').value.trim();

    if (!catVal) mark('#pCat', t('err.cat'));
    if (title.length < 5) mark('#pTitle', t('err.title'));
    if (desc.length < 10) mark('#pDesc', t('err.desc'));
    if (!negotiable && (!price || price <= 0)) mark('#pPrice', t('err.price'));
    if (floorRaw > 0 && price > 0 && floorRaw >= price) mark('#pFloor', t('err.floor'));
    if (!city) mark('#pCity', t('err.city'));
    if (!/^\+?[\d\s()-]{9,}$/.test(phone)) mark('#pPhone', t('err.phone'));
    if (errs.length) {
      // на телефоне форма длиной в несколько экранов: без прокрутки к полю
      // юзер видит только тост и не понимает, что и где не так
      const first = document.querySelector('#postForm .error');
      if (first) {
        first.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(() => { try { first.focus({ preventScroll: true }); } catch (e) {} }, 300);
      }
      showToast(t('toast.checkFields') + ' (' + errs.length + ')');
      return;
    }

    const listing = {
      id: editing ? editing.id : 'm' + Date.now(),
      title,
      price,
      priceSuffix: '',
      negotiable,
      floor: (floorRaw > 0 && floorRaw < price) ? floorRaw : 0,
      category: catVal,
      subcategory: $('#pSub').value || catById(catVal).subs[0],
      city,
      district: null,
      condition: condition || null,
      description: desc,
      pickedSeeds: [...picked],
      userPhotos: realPhotos.length ? realPhotos : null,
      photoCount: realPhotos.length + picked.size,
      photoSeed: 11,
      sellerName: (currentUser() && currentUser().name) || USER_NAME,
      sellerType: 'private',
      sellerRating: 5.0,
      sellerAds: state.myListings.length + (editing ? 0 : 1),
      sellerSinceYear: 2026,
      createdAt: editing ? editing.createdAt : Date.now(),
      views: editing ? editing.views : 1,
      isVip: false,
      isUrgent: false,
      hasDelivery: $('#pDelivery').checked,
      phone,
      attrs: collectAttrs($('#pAttrs')),
    };

    if (editing) {
      LISTING_IDX.delete(listing.id); // заголовок мог измениться — индекс пересоберётся
      const isCloud = !editing.id.startsWith('m');
      if (isCloud) {
        // облачное объявление правим в БД: правка видна всем, а не только автору
        const saveBtn = $('#postForm button[type="submit"]');
        if (saveBtn) saveBtn.disabled = true;
        try {
          const row = await dbUpdateListing(editing.id, {
            title: listing.title, price: listing.price, floor: listing.floor,
            category: listing.category, subcategory: listing.subcategory, city: listing.city,
            district: listing.district, condition: listing.condition, description: listing.description,
            photos: realPhotos.length ? realPhotos : listing.pickedSeeds,
            negotiable: listing.negotiable,
            attrs: { ...listing.attrs, _phone: listing.phone || '', _specs: editing.specs || undefined },
          });
          const mapped = dbToListing(row, { [currentUser().id]: currentUser().name });
          const j = state.dbListings.findIndex(l => l.id === editing.id);
          if (j >= 0) state.dbListings[j] = mapped; else state.dbListings.unshift(mapped);
          clearPostDraft(); state._postPhotos = null;
          showToast(t('toast.saved'), 'success');
          location.hash = '#/item/' + mapped.id;
        } catch (err) {
          console.error('Правка объявления не сохранилась:', err);
          if (saveBtn) saveBtn.disabled = false;
          const m = (err && (err.message || err.hint)) ? String(err.message || err.hint) : '';
          showToast(t('toast.publishFail') + (m ? ': ' + m : ''), 'error');
        }
        return;
      }
      const i = state.myListings.findIndex(l => l.id === editing.id);
      state.myListings[i] = { ...editing, ...listing }; // status/userPhotos/specs переживают правку
      lsSave(LS.my, state.myListings);
      clearPostDraft(); state._postPhotos = null;
      showToast(t('toast.saved'), 'success');
      location.hash = '#/item/' + listing.id;
      return;
    }
    // новое объявление: залогинен → сохраняем в облако (с реальным владельцем,
    // видно всем и можно писать продавцу), иначе локально как раньше
    if (isAuthed()) {
      const pubBtn = $('#pSubmit');
      const pubLabel = pubBtn ? pubBtn.textContent : '';
      // на медленной сети кнопка просто гасла и казалось, что ничего не происходит
      if (pubBtn) { pubBtn.disabled = true; pubBtn.textContent = t('form.publishing'); }
      try {
        const row = await dbCreateListing({
          title: listing.title, price: listing.price, floor: listing.floor,
          category: listing.category, subcategory: listing.subcategory, city: listing.city,
          district: listing.district, condition: listing.condition, description: listing.description,
          photos: realPhotos.length ? realPhotos : listing.pickedSeeds,
          negotiable: listing.negotiable,
          // телефон продавца едет в jsonb (attrs._phone) — колонки phone в схеме нет
          attrs: { ...listing.attrs, _phone: listing.phone || '', _specs: (f.specs && f.specs.length) ? f.specs : undefined },
        });
        const mapped = dbToListing(row, { [currentUser().id]: currentUser().name });
        state.dbListings.unshift(mapped);
        clearPostDraft(); state._postPhotos = null;
        showToast(t('toast.published'), 'success');
        location.hash = '#/item/' + mapped.id;
        return;
      } catch (err) {
        // НЕ падаем молча в local — иначе объявление видит ТОЛЬКО автор, а у
        // других не появляется (ровно этот баг ловили). Показываем реальную ошибку.
        console.error('Публикация в облако не удалась:', err);
        if (pubBtn) { pubBtn.disabled = false; pubBtn.textContent = pubLabel; }
        const msg = (err && (err.message || err.hint || err.details)) ? String(err.message || err.hint || err.details) : '';
        showToast(t('toast.publishFail') + (msg ? ': ' + msg : ''), 'error');
        return;
      }
    }
    // сюда попадают только гости (на /post их не пускает гард — на всякий случай)
    state.myListings.unshift(listing);
    lsSave(LS.my, state.myListings);
    clearPostDraft();
    showToast(t('toast.published'), 'success');
    location.hash = '#/item/' + listing.id;
  });
}

/* ---------------- профиль ---------------- */

/* ---------------- вход / регистрация ---------------- */

const GOOGLE_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>';
const APPLE_SVG = '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.78 1.3 10.33.86 1.25 1.88 2.65 3.22 2.6 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.27 3.12-2.53.98-1.45 1.39-2.85 1.41-2.93-.03-.01-2.71-1.04-2.74-4.13zM14.47 4.34c.71-.86 1.19-2.06 1.06-3.26-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.43z"/></svg>';

function renderAuth() {
  if (isAuthed()) { location.hash = state.auth._return || '#/profile'; return; }
  const a = state.auth;
  const isReg = a.mode === 'register';
  const isPhone = a.method === 'phone';
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="auth-logo">B</div>
          <h1>${isReg ? t('auth.join') : t('auth.welcome')}</h1>
          <p>${t('auth.tagline')}</p>
        </div>
        <div class="auth-tabs">
          <button class="auth-tab ${!isReg ? 'active' : ''}" data-auth-mode="login">${t('auth.login')}</button>
          <button class="auth-tab ${isReg ? 'active' : ''}" data-auth-mode="register">${t('auth.register')}</button>
        </div>
        <div class="auth-social">
          <button class="auth-soc" data-auth-social="google">${GOOGLE_SVG}<span>${t('auth.withGoogle')}</span></button>
          <button class="auth-soc auth-apple" data-auth-social="apple">${APPLE_SVG}<span>${t('auth.withApple')}</span></button>
        </div>
        <div class="auth-or"><span>${t('auth.or')}</span></div>
        <div class="auth-method">
          <button class="auth-mbtn ${!isPhone ? 'active' : ''}" data-auth-method="email">${t('auth.byEmail')}</button>
          <button class="auth-mbtn ${isPhone ? 'active' : ''}" data-auth-method="phone">${t('auth.byPhone')}</button>
        </div>
        <form id="authForm" class="auth-form" novalidate>
          ${isReg ? `<input class="finput" id="authName" placeholder="${t('auth.name')}" autocomplete="name" value="${esc(a._name || '')}">` : ''}
          ${isPhone
            ? `<input class="finput" id="authPhone" type="tel" placeholder="+996 700 123 456" autocomplete="tel" inputmode="tel" value="${esc(a._phone || '')}">`
            : `<input class="finput" id="authEmail" type="email" placeholder="you@email.com" autocomplete="email" inputmode="email" value="${esc(a._email || '')}">`}
          <input class="finput" id="authPass" type="password" placeholder="${t('auth.password')}" autocomplete="${isReg ? 'new-password' : 'current-password'}">
          <div class="auth-error" id="authError" hidden></div>
          <button class="btn btn-primary btn-block btn-lg" type="submit">${isReg ? t('auth.registerBtn') : t('auth.loginBtn')}</button>
        </form>
        <div class="auth-foot">
          ${isReg ? `${t('auth.hasAcc')} <a data-auth-mode="login">${t('auth.login')}</a>` : `${t('auth.noAcc')} <a data-auth-mode="register">${t('auth.register')}</a>`}
        </div>
        <a class="auth-skip" href="#/" data-link>${t('auth.skip')} →</a>
      </div>
    </div>`;
  const form = $('#authForm');
  if (form) form.addEventListener('submit', onAuthSubmit);
}

async function onAuthSubmit(e) {
  e.preventDefault();
  const a = state.auth;
  const isReg = a.mode === 'register';
  const isPhone = a.method === 'phone';
  const err = $('#authError');
  const showErr = (m) => { if (err) { err.textContent = m; err.hidden = false; } };
  const pass = $('#authPass') ? $('#authPass').value : '';
  const email = $('#authEmail') ? $('#authEmail').value.trim() : '';
  const phone = $('#authPhone') ? $('#authPhone').value.trim() : '';
  const name = $('#authName') ? $('#authName').value.trim() : '';
  a._email = email; a._phone = phone; a._name = name;
  if (isPhone ? phone.replace(/\D/g, '').length < 9 : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    showErr(isPhone ? t('auth.errPhone') : t('auth.errEmail')); return;
  }
  if (pass.length < 6) { showErr(t('auth.errPass')); return; }
  try {
    const creds = { name, email: isPhone ? '' : email, phone: isPhone ? phone : '', password: pass };
    if (isReg) await authSignUp(creds); else await authSignIn(creds);
    afterAuth();
  } catch (ex) {
    showErr({
      'email-exists': t('auth.errEmailExists'), 'phone-exists': t('auth.errPhoneExists'),
      'no-user': t('auth.errNoUser'), 'bad-pass': t('auth.errBadPass'),
      'bad-creds': t('auth.errBadCreds'), 'weak-pass': t('auth.errPass'), 'bad-email': t('auth.errEmail'),
      'phone-unavailable': t('auth.phoneSoon'), 'provider-unavailable': t('auth.socialSoon').replace('{provider}', 'Google/Apple'),
      'no-backend': t('auth.errGeneric'),
    }[ex.message] || t('auth.errGeneric'));
  }
}

async function doAuthSocial(provider) {
  // при успехе Supabase сам уводит на провайдера и возвращает залогиненным —
  // afterAuth не нужен (страница навигируется). Ошибку показываем мягко.
  try { await authSocial(provider); }
  catch (ex) {
    const msg = ex.message === 'provider-unavailable'
      ? t('auth.socialSoon').replace('{provider}', provider === 'google' ? 'Google' : 'Apple')
      : t('auth.errGeneric');
    showToast(msg);
  }
}

function afterAuth() {
  const u = currentUser();
  state.auth._email = state.auth._phone = state.auth._name = '';
  showToast(t('auth.welcomeToast').replace('{name}', esc(u.name)), 'success');
  const back = state.auth._return || '#/profile';
  state.auth._return = null;
  location.hash = back;
}

/* требуется вход — иначе уводим на экран входа и запоминаем, куда вернуть */
function requireAuth(returnHash) {
  if (isAuthed()) return true;
  state.auth._return = returnHash || location.hash || '#/';
  state.auth.mode = 'register';
  location.hash = '#/auth';
  return false;
}

/* ---- страница продавца (как у Avito): все объявления + рейтинг + бейджи ---- */
function renderSeller(rawKey) {
  const key = decodeURIComponent(rawKey || '');
  const listings = allListings().filter(l => sellerKey(l) === key);
  const sample = listings[0];
  if (!sample) { app.innerHTML = `<div class="form-page">${emptyHTML('🧑', t('seller.notFound'), '')}</div>`; return; }
  const active = listings.filter(l => !isSold(l));
  const ss = sellerStats(sample);
  const name = sample.sellerName || t('seller.anon');
  app.innerHTML = `
    <nav class="breadcrumbs"><a href="#/" data-link>${t('nav.home')}</a> › <span>${esc(name)}</span></nav>
    <div class="seller-hero">
      <div class="avatar avatar-xl" style="${avatarStyle(name)}">${esc(name[0] || 'U')}</div>
      <div class="seller-hero-info">
        <h1>${esc(name)} ${ss.business ? `<span class="seller-badge">${t('seller.business')}</span>` : ''} ${ss.verified ? `<span class="verif-badge">✓ ${t('seller.verified')}</span>` : ''}</h1>
        <div class="seller-hero-sub">${sellerRatingHTML(ss)} · ${t('seller.since')} ${sample.sellerSinceYear} ${t('seller.sinceEnd')}</div>
        <div class="seller-hero-stats"><span><b>${active.length}</b> ${t('seller.activeAds')}</span>${ss.verified ? `<span class="ok">✓ ${t('seller.verifiedHint')}</span>` : ''}</div>
      </div>
    </div>
    <div class="section-title"><h2>${t('seller.allAds')} <span class="muted">${active.length}</span></h2></div>
    ${active.length ? `<div class="grid">${active.map(cardHTML).join('')}</div>` : emptyHTML('📭', t('seller.noListings'), '')}`;
}

/* ---- сравнение (как у Auto.ru): таблица характеристик бок о бок ---- */
function renderCompare() {
  const items = [...state.compare].map(getListing).filter(Boolean).filter(l => !state.reported.has(l.id));
  if (items.length < 1) { app.innerHTML = `<div class="form-page">${emptyHTML('⚖️', t('cmp.empty'), t('cmp.emptyP'), `<a class="btn btn-primary" href="#/search" data-link>${t('cmp.browse')}</a>`)}</div>`; return; }
  const first = items[0];
  const schema = (typeof attrSchema === 'function') ? attrSchema(first.category, first.subcategory) : null;
  const rows = [];
  rows.push({ label: t('cmp.price'), vals: items.map(l => l.price ? fmtNum(l.price) + ' ' + t('som') : t('price.negotiable')) });
  if (schema) schema.forEach(fld => {
    const vals = items.map(l => { const a = getAttrs(l); return (a[fld.key] != null && a[fld.key] !== '') ? attrDisplayValue(fld, a[fld.key]) : '—'; });
    if (vals.some(v => v !== '—')) rows.push({ label: aL(fld.label), vals });
  });
  rows.push({ label: t('item.cond'), vals: items.map(l => l.condition === 'new' ? t('cond.new') : l.condition === 'used' ? t('cond.used') : '—') });
  rows.push({ label: t('item.city'), vals: items.map(l => l.city || '—') });
  app.innerHTML = `
    <div class="section-title"><h2>${t('cmp.title')} <span class="muted">${items.length}</span></h2>
      <button class="btn btn-outline btn-sm" data-action="compare-clear">${t('cmp.clear')}</button></div>
    <div class="cmp-scroll"><table class="cmp-table">
      <thead><tr><th class="cmp-corner"></th>${items.map(l => `<th><button class="cmp-rm" data-action="compare-remove" data-id="${l.id}" aria-label="✕">✕</button><a href="#/item/${l.id}" data-link><span class="cmp-photo">${getPhotos(l).length ? `<img src="${esc(getPhotos(l)[0])}" alt="">` : '📷'}</span><span class="cmp-name">${esc(l.title)}</span></a></th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr><td class="cmp-lbl">${esc(r.label)}</td>${r.vals.map(v => `<td>${esc(String(v))}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
}

/* блок сохранённых поисков для кабинета */
function savedSearchesHTML() {
  if (!state.saved.length) return '';
  return `<div class="panel">
    <h2>🔔 ${t('saved.title')}</h2>
    <div class="saved-list">${state.saved.map(s => {
      const n = savedNewCount(s);
      return `<div class="saved-row">
        <button class="saved-open" data-action="open-saved" data-id="${s.id}">
          <span class="saved-name">${esc(s.name)}</span>${n ? `<span class="saved-new">+${n} ${t('saved.new')}</span>` : `<span class="saved-none">${t('saved.noNew')}</span>`}
        </button>
        <button class="saved-del" data-action="remove-saved" data-id="${s.id}" aria-label="✕">✕</button>
      </div>`;
    }).join('')}</div>
  </div>`;
}

/* плавающая панель сравнения (поверх любого экрана, когда что-то выбрано) */
function compareBarHTML() {
  const n = state.compare.size;
  if (!n) return '';
  return `<div class="compare-bar">
    <span class="cmp-bar-label">⚖️ <span class="cmp-bar-text">${t('cmp.selected')}:</span> <b>${n}</b></span>
    <span class="cmp-bar-actions">
      <button class="btn btn-outline btn-sm" data-action="compare-clear">${t('cmp.clear')}</button>
      <a class="btn btn-primary btn-sm ${n < 2 ? 'is-disabled' : ''}" href="#/compare" data-link>${t('cmp.go')}</a>
    </span>
  </div>`;
}
function updateCompareBar() {
  let host = document.getElementById('compareBarHost');
  if (!host) { host = document.createElement('div'); host.id = 'compareBarHost'; document.body.appendChild(host); }
  // на самой /compare панель не нужна (мы уже сравниваем); иначе — если что-то выбрано
  const show = state.compare.size > 0 && !parseHash().path.startsWith('/compare');
  host.innerHTML = show ? compareBarHTML() : '';
  document.body.classList.toggle('has-compare-bar', show); // прячем ai-fab на мобиле, чтобы не наезжали
}

function renderProfile() {
  const me = currentUser();
  // мои объявления = локальные + мои облачные (опубликованные через форму/фото-флоу)
  const myDb = me ? state.dbListings.filter(l => l.ownerId === me.id) : [];
  const my = [...state.myListings, ...myDb];
  const unread = Object.values(state.chats).filter(c => c.unread).length;

  const rows = my.map(l => {
    const photos = getPhotos(l);
    const sold = isSold(l);
    const cloud = !!l.ownerId; // облачное (видно всем) vs локальное
    return `
    <div class="my-listing-row ${sold ? 'is-sold' : ''}">
      ${photos.length ? `<img src="${esc(photos[0])}" alt="">` : '<div class="thumb-fallback" style="width:92px;height:70px;font-size:20px">📷</div>'}
      <div class="info">
        <a class="title" href="#/item/${l.id}" data-link>${esc(l.title)}</a>
        <div class="sub">${sold ? `<span class="sold-tag">✅ ${t('status.sold')}</span> · ` : ''}${cloud ? `<span class="cloud-tag" title="${t('profile.cloudHint')}">☁️</span> ` : ''}${priceHTML(l).replace(/<[^>]*>/g, ' ')} · ${postedLabel(l)} · 👁️ ${fmtNum(l.views)}</div>
      </div>
      <div class="actions">
        <button class="btn ${sold ? 'btn-primary' : 'btn-secondary'} btn-sm" data-action="toggle-sold" data-id="${l.id}">${sold ? '↩️' : '✅'}</button>
        ${(sold || cloud) ? '' : `<button class="btn btn-secondary btn-sm" data-action="bump" data-id="${l.id}">⬆️ ${t('profile.bump')}</button>`}
        <a class="btn btn-outline btn-sm" href="#/post?edit=${l.id}" data-link aria-label="${t('item.edit')}">✏️</a>
        <button class="btn btn-danger-soft btn-sm" data-action="delete-my" data-id="${l.id}" aria-label="${t('item.delete')}">🗑️</button>
      </div>
    </div>`;
  }).join('');

  const settingsHTML = `
    <div class="panel settings-panel">
      <h2>${t('profile.settings')}</h2>
      <div class="setting-row">
        <span class="setting-label">${t('profile.lang')}</span>
        <div class="seg" id="langSeg">
          ${LANG_ORDER.map(lg => `<button class="seg-btn ${LANG === lg ? 'active' : ''}" data-set-lang="${lg}">${LANG_NAMES[lg]}</button>`).join('')}
        </div>
      </div>
      <div class="setting-row">
        <span class="setting-label">${t('profile.theme')}</span>
        <div class="seg" id="themeSeg">
          <button class="seg-btn ${THEME === 'light' ? 'active' : ''}" data-set-theme="light"><span class="seg-emoji">☀️</span> ${t('theme.light')}</button>
          <button class="seg-btn ${THEME === 'dark' ? 'active' : ''}" data-set-theme="dark"><span class="seg-emoji">🌙</span> ${t('theme.dark')}</button>
          <button class="seg-btn ${THEME === 'system' ? 'active' : ''}" data-set-theme="system"><span class="seg-emoji">🌗</span> ${t('theme.system')}</button>
        </div>
      </div>
    </div>`;

  const u = currentUser();
  const provLabel = u && u.provider === 'google' ? ' · Google' : u && u.provider === 'apple' ? ' · Apple' : '';
  const headHTML = u ? `
    <div class="profile-head">
      <div class="avatar avatar-lg" style="${avatarStyle(u.name)}">${esc((u.name[0] || 'U').toUpperCase())}</div>
      <div class="profile-id">
        <div class="profile-name">${esc(u.name)}</div>
        <div class="profile-sub">${esc(u.email || u.phone || '')}${provLabel}</div>
      </div>
      <div class="profile-stats">
        <div class="pstat"><b>${my.length}</b><span>${listingsWord(my.length)}</span></div>
        <div class="pstat"><b>${state.favorites.size}</b><span>${t('profile.inFavs')}</span></div>
        <div class="pstat"><b>${Object.keys(state.chats).length}</b><span>${dialogsWord(Object.keys(state.chats).length)}${unread ? ' · ' + unread + ' ' + t('profile.new') : ''}</span></div>
      </div>
      <button class="btn btn-outline btn-sm profile-logout" data-action="logout">${t('auth.logout')}</button>
    </div>` : `
    <div class="auth-cta">
      <div class="auth-cta-ico">👋</div>
      <div class="auth-cta-body">
        <h2>${t('auth.ctaTitle')}</h2>
        <p>${t('auth.ctaSub')}</p>
        <div class="auth-cta-actions">
          <a class="btn btn-primary btn-lg" href="#/auth" data-link data-auth-go="register">${t('auth.register')}</a>
          <a class="btn btn-outline btn-lg" href="#/auth" data-link data-auth-go="login">${t('auth.login')}</a>
        </div>
      </div>
    </div>`;

  app.innerHTML = `
    ${headHTML}
    ${u ? `
      <div class="page-head">
        <h2 class="page-subtitle">${t('profile.my')}</h2>
        <a class="btn btn-primary" href="#/post" data-link>${t('post.btnShort')}</a>
      </div>
      ${my.length ? rows : emptyHTML('📦', t('profile.empty.t'), t('profile.empty.p'),
        `<a class="btn btn-primary" href="#/post" data-link>${t('post.btn')}</a>`)}
      ${savedSearchesHTML()}
    ` : savedSearchesHTML()}
    ${settingsHTML}`;
}

function deleteMyListing(id) {
  const l = getListing(id); // локальное или облачное (моё)
  if (!l) return;
  openModal(`
    <h3>${t('del.t')}</h3>
    <p class="modal-text">«${esc(l.title)}» ${t('del.p')}</p>
    <div class="modal-actions">
      <button class="btn btn-outline btn-block" data-action="modal-close">${t('del.cancel')}</button>
      <button class="btn btn-danger-soft btn-block" data-action="delete-my-confirm" data-id="${id}">${t('del.ok')}</button>
    </div>`);
}

/* ---- поделиться (копировать ссылку / WhatsApp / Telegram) ---- */
function shareListing(id) {
  const l = getListing(id);
  if (!l) return;
  const url = location.origin + location.pathname + '#/item/' + id;
  const text = l.title + ' — ' + (l.price ? fmtNum(l.price) + ' ' + t('som') : t('price.negotiable'));
  // нативный шер только на тач-устройствах (там это удобно); на десктопе — модалка
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    navigator.share({ title: l.title, text, url }).catch(() => {});
    return;
  }
  openModal(`
    <h3>🔗 ${t('share.title')}</h3>
    <div class="share-row"><input id="shareUrl" class="finput" readonly value="${esc(url)}"></div>
    <div class="share-btns">
      <button class="btn btn-secondary" data-action="share-copy">📋 ${t('share.copy')}</button>
      <a class="btn btn-primary" href="https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}" target="_blank" rel="noopener">WhatsApp</a>
      <a class="btn btn-outline" href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}" target="_blank" rel="noopener">Telegram</a>
    </div>`);
}

/* ---- пожаловаться (как у Avito) ---- */
function openReportModal(id) {
  const reasons = ['scam', 'sold', 'wrong', 'prohibited', 'duplicate', 'offensive'];
  openModal(`
    <h3>⚑ ${t('report.title')}</h3>
    <p class="modal-text">${t('report.sub')}</p>
    <div class="report-reasons">${reasons.map(r => `<button class="report-reason" data-action="report-submit" data-id="${id}" data-reason="${r}">${t('report.r.' + r)}</button>`).join('')}</div>
    <div class="modal-actions"><button class="btn btn-outline btn-block" data-action="modal-close">${t('del.cancel')}</button></div>`);
}

/* ---- статус продано/в продаже ---- */
function toggleSold(id) {
  const my = state.myListings.find(x => x.id === id);
  let nowSold;
  if (my) {
    my.status = (my.status === 'sold') ? 'active' : 'sold';
    nowSold = my.status === 'sold';
    lsSave(LS.my, state.myListings);
  } else {
    if (state.soldIds.has(id)) state.soldIds.delete(id); else state.soldIds.add(id);
    nowSold = state.soldIds.has(id);
    lsSave(LS.sold, [...state.soldIds]);
  }
  showToast(nowSold ? t('status.markedSold') : t('status.reactivated'), 'success');
  const y = window.scrollY; router(); requestAnimationFrame(() => window.scrollTo(0, y));
}

/* ---------------- чаты ---------------- */

const AUTO_REPLIES = [
  'Здравствуйте! Да, ещё актуально 👍',
  'Добрый день! Когда вам удобно посмотреть?',
  'Небольшой торг возможен, приезжайте.',
  'Могу скинуть дополнительные фото сюда.',
  'Самовывоз, район указан в объявлении.',
  'Здравствуйте! Отвечу на любые вопросы.',
];

/* демо: иногда «продавец» оказывается скамером — Диана это ловит (живой сленг) */
const SCAM_REPLIES = [
  'Давайте лучше в WhatsApp, скину ссылку на оплату 👌',
  'Скиньте предоплату на Каспи — и я отложу для вас 🙏',
  'Пиши в вотс, там договоримся по цене 👌',
  'Я в инсте, напиши туда — отвечу быстрее',
  'Кинь аванс на карту, остальное при получении',
  'Переведи на каспи, доставка приедет сама',
  'Скинь номер, я в вацапе вышлю реквизиты',
];

/* ============ АНТИ-ФРОД РИСК-ДВИЖОК ============
   Взвешенный скоринг вместо «да/нет». Слабый сигнал (просто увод в мессенджер)
   САМ ПО СЕБЕ не тревожит — это часто легально, не напрягаем юзера. Но в связке
   с предоплатой / картой / ссылкой / «кодом из СМС» / курьер-предоплатой даёт
   высокий риск. Возвращает { score, level, reasons }.
   level: none / low / med / high / critical (critical = фишинг кода из СМС =
   захват аккаунта). ВАЖНО: \b/\w кириллицу не ловят → нормализуем и ищем по
   нормализованной строке; lookbehind НЕ используем (старый iOS Safari падает). */

const _CARD_RE = /\d(?:[ \-]?\d){12,18}/;          // 13–19 цифр (карта)
const _LINK_RE = /(?:https?:\/\/|www\.)[^\s<]+|[a-z0-9][a-z0-9-]*\.(?:ru|com|net|org|kg|io|me|app|site|online|shop|store|info|biz|xyz|top|link|pay|click)\b/i;
// контекст карты/перевода рядом с длинным числом — иначе это IMEI/серийник/трек
const _CARD_CTX_RE = /карт|каспи|kaspi|мбанк|mbank|optima|элсом|elsom|элкарт|odengi|реквизит|visa|mastercard|перевед|перевод|перекин|скин|кин/;
// длинное число, подписанное как идентификатор устройства/посылки — точно не карта
function _idLabelBefore(text, idx) {
  return /(?:imei|имеи|серийн[а-я]*|serial|s\s*\/?\s*n|артикул|трек[а-я]*|track[a-z]*|номер заказ[а-я]*)[:№#\s]*$/i
    .test(text.slice(Math.max(0, idx - 24), idx));
}
function _isCardLike(text, m, idx) {
  const n = m.replace(/\D/g, '').length;
  if (n < 13 || n > 19) return false;
  if (_idLabelBefore(text, idx)) return false;              // «IMEI: 3569…» — не карта
  const grouped = /[ \-]/.test(m.trim());                    // 4400 4301 2345 6789
  const ctx = _CARD_CTX_RE.test(_normScam(text));
  return grouped || ctx;                                     // слитный без контекста = серийник
}
function _hasCardNumber(text) {
  const t2 = text || '';
  const m = t2.match(_CARD_RE);
  return !!m && _isCardLike(t2, m[0], m.index);
}
function _hasLink(text) { return _LINK_RE.test(text || ''); }
function _normScam(text) {
  let s = ' ' + (text || '').toLowerCase().replace(/ё/g, 'е') + ' ';
  s = s.replace(/(.)\1{2,}/g, '$1$1');     // вотсаппп → вотсап, сссылка → ссылка
  s = s.replace(/[^0-9a-zа-я]+/g, ' ');     // границы слов через пробелы (имо, тг…)
  return s;
}

function assessTextRisk(text) {
  let s = _normScam(text);
  // ЛЕГИТИМНЫЕ обороты вырезаем ДО скоринга, чтобы не пугать честных продавцов:
  // «без предоплаты», «предоплата не нужна», «оплата при встрече/получении» —
  // это заверения безопасности, а не схема
  s = s.replace(/(без|нет) предоплат[а-я]*/g, ' ')
       .replace(/предоплат[а-я]* не (нужн|треб)[а-я]*/g, ' ')
       .replace(/(оплат[а-я]*|расчет) при (встрече|получении|осмотре)/g, ' ');
  let score = 0; const reasons = [];
  const add = (pts, why) => { score += pts; reasons.push(why); };

  // КРИТИЧНО: фишинг одноразового кода из СМС (захват аккаунта/банка).
  // «шестизначный/6-значный» — только рядом со словом код/смс (не зарплата!)
  const otpCore = /код из смс|смс код|код подтвержд|код верифик|код активац|одноразов[а-я]* код|(назов|продиктуй|скаж|сообщ|пришл)[а-я]* код/.test(s);
  const otpSix = /шестизначн|6 значн/.test(s) && /код|смс/.test(s);
  if (otpCore || otpSix) add(100, 'otp');
  // номер карты в тексте (с контекстом — IMEI/серийники не считаются)
  if (_hasCardNumber(text)) add(40, 'card');
  // предоплата / перевод / кошельки КР (бытовое «на карту памяти» НЕ ловим — нужен глагол перевода)
  if (/предоплат|аванс|задаток|(внес|перекин|перевед|кин|скин|отправ)[а-я]* на карт|перевод на карт|номер карт|реквизит|каспи|kaspi|мбанк|mbank|optima|элсом|elsom|элкарт|odengi|деньги вперед/.test(s)) add(30, 'prepay');
  // явная просьба оплатить ПО ССЫЛКЕ / перейти и оплатить — сильный сигнал
  if (/оплат[а-я]* по ссылк|ссылк[а-я]* (на|для) оплат|перейди[а-я]*.{0,8}оплат/.test(s)) add(35, 'paylink');
  // «оплата онлайн» сама по себе легальна у бизнесов — слабый сигнал-накопитель
  else if (/оплат[а-я]* онлайн|онлайн оплат/.test(s)) add(8, 'onlinepay');
  // просто внешняя ссылка в тексте — слабее (бывает легально), но в связке копит риск
  if (_hasLink(text)) add(22, 'link');
  // курьер / служба доставки с предоплатой (легитимные обороты уже вырезаны выше)
  if (/служб[аеуы] доставк|курьер.{0,14}оплат|оплат.{0,14}доставк|отправлю.{0,14}(проводник|водител|такси|автобус)|cdek|сдэк|деливери|доставка приедет|доставка сама/.test(s)) add(25, 'courier');
  // приз / лотерея / фейк-поддержка BAZAR
  if (/вы выиграл|поздравля.{0,18}приз|вы стали победител|выигр.{0,18}акци|служб[аы] поддержк.{0,18}bazar|администрац.{0,18}bazar|техподдержк.{0,18}bazar|бонус.{0,14}аккаунт/.test(s)) add(35, 'prize');
  // увод с площадки (слабый сам по себе). «инста» с guard'ом против «инсталляция»
  if (/инста(?!лл)/.test(s) || /whatsapp|watsap|votsap|vatsap|ватсап|вотсап|вацап|воцап| вотс | ватс |telegram|телеграм|телега|телегу|телеге| тг |тгшка|instagram|инсте|инсту|инстик| инст |вайбер|viber| имо | imo |вне сайта|вне приложени|не через приложени|мимо сайта/.test(s)) add(12, 'offplatform');
  // срочность (усилитель)
  if (/срочно|только сегодня|уезжаю|горит|успей|быстро заберут|последн[а-я]* шанс/.test(s)) add(8, 'urgency');

  const level = reasons.includes('otp') ? 'critical'
    : score >= 55 ? 'high'
    : score >= 28 ? 'med'
    : score >= 12 ? 'low' : 'none';
  return { score, level, reasons };
}

/* булев детект (обратная совместимость): любой ненулевой риск */
function detectScam(text) { return assessTextRisk(text).level !== 'none'; }

/* Анти-фишинг: экранируем текст И глушим внешние ссылки + номера карт, чтобы
   мошенник не увёл на фейковую «оплату» прямо из описания/чата. Возвращает
   безопасный HTML. Телефоны (≤12 цифр) не трогаем — контакт легитимен. */
function maskUnsafe(raw) {
  let html = esc(raw || '');
  // ссылки: http(s)://… , www.… , или domain.tld/… по списку частых зон
  html = html.replace(
    /\b((?:https?:\/\/|www\.)[^\s<]+|[a-z0-9][a-z0-9-]*\.(?:ru|com|net|org|kg|io|me|app|site|online|shop|store|info|biz|xyz|top|link|pay|click)\b[^\s<]*)/gi,
    `<span class="masked" title="${esc(t('safety.maskLinkHint'))}">🔒 ${esc(t('safety.maskLink'))}</span>`);
  // номера карт: 13–19 цифр (группировка ИЛИ платёжный контекст рядом);
  // IMEI/серийники/трек-номера («IMEI: 3569…», слитные без контекста) не трогаем
  html = html.replace(/\d(?:[ \-]?\d){12,18}/g, (m, idx) =>
    _isCardLike(html, m, idx)
      ? `<span class="masked" title="${esc(t('safety.maskCardHint'))}">🔒 ${esc(t('safety.maskCard'))}</span>` : m);
  return html;
}

/* контекстная памятка безопасной сделки: спец-совет под категорию + общие */
function safetyTips(category) {
  const tips = [];
  if (category === 'transport') tips.push(t('safety.tip.auto'));
  else if (category === 'realty') tips.push(t('safety.tip.realty'));
  else if (category === 'electronics') tips.push(t('safety.tip.electronics'));
  tips.push(t('safety.tip.meet'), t('safety.tip.noPrepay'), t('safety.tip.noLink'));
  return tips;
}

/* анти-фишинг баннер в чате — закрываемый на сессию (не напрягаем повторно) */
function phishBannerDismissed() {
  try { return sessionStorage.getItem('bz_phish_off') === '1'; } catch (e) { return false; }
}

function ensureChat(itemId) {
  if (!state.chats[itemId]) {
    state.chats[itemId] = { itemId, messages: [], unread: false, updatedAt: Date.now() };
    lsSave(LS.chats, state.chats);
  }
  return state.chats[itemId];
}

function msgTime(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function msgHTML(m) {
  const r = assessTextRisk(m.text);
  let warn = '';
  if (r.level === 'critical') {       // фишинг кода из СМС — захват аккаунта
    warn = `<div class="chat-scam-warn critical"><span class="csw-ico">⛔</span><span><b>${t('scam.otpWho')}</b> ${t('scam.otp')}</span></div>`;
  } else if (r.level === 'high' || r.level === 'med') {  // реальная схема оплаты
    warn = `<div class="chat-scam-warn"><span class="csw-ico">🛡️</span><span><b>${t('scam.who')}</b> ${t('scam.warn')}</span></div>`;
  } // low/none (просто «вотсап» и т.п.) — НЕ тревожим, верхний баннер уже напоминает
  return `<div class="msg ${m.from}">${maskUnsafe(m.text)}<time>${msgTime(m.ts)}</time></div>${warn}`;
}

/* дописать сообщение в открытый диалог без полного ререндера (фокус и клавиатура живут) */
function appendChatMsg(itemId, m) {
  const win = document.querySelector('[data-active-chat]');
  const msgs = $('#chatMsgs');
  if (!win || win.dataset.activeChat !== itemId || !msgs) return false;
  msgs.insertAdjacentHTML('beforeend', msgHTML(m));
  msgs.scrollTop = msgs.scrollHeight;
  const row = document.querySelector(`.chat-row[data-chat="${CSS.escape(itemId)}"]`);
  if (row) {
    const last = row.querySelector('.last');
    if (last) last.textContent = m.text;
    const t = row.querySelector('.name time');
    if (t) t.textContent = msgTime(m.ts);
  }
  return true;
}

let _chatSub = null; // отписка от realtime текущего открытого DB-чата

/* пришло realtime-сообщение от собеседника */
function onRealtimeMsg(chatKey, m) {
  const chat = state.chats[chatKey];
  if (!chat || !currentUser()) return;
  if (m.sender_id === currentUser().id) return;        // своё уже показали оптимистично
  if (chat.messages.some(x => x.id === m.id)) return;   // дедуп
  const msg = { from: 'them', text: m.text, ts: new Date(m.created_at).getTime(), id: m.id };
  chat.messages.push(msg);
  chat.updatedAt = Date.now();
  const here = location.hash === '#/chats/' + chatKey;
  chat.unread = !here;
  if (here) {
    if (!appendChatMsg(chatKey, msg)) renderChats(chatKey);
    markChatRead(chatKey); // диалог открыт — сразу прочитано
  }
  updateBadges();
}

function renderChats(activeId) {
  const chats = Object.entries(state.chats)
    .map(([key, c]) => ({ ...c, key, listing: getListing(c.itemId) }))
    .filter(c => c.listing || c.isDb)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (_chatSub) { _chatSub(); _chatSub = null; } // снять старую подписку при перерисовке

  if (!chats.length) {
    app.innerHTML = `
      <div class="page-head"><h1>${t('chats.title')}</h1></div>
      ${emptyHTML('💬', t('chats.empty.t'), t('chats.empty.p'),
        `<a class="btn btn-primary" href="#/search?reset=1" data-link>${t('favs.empty.btn')}</a>`)}`;
    return;
  }

  const active = activeId ? chats.find(c => c.key === activeId) : null;
  if (active) markChatRead(active.key); // открыл диалог — отметка прочтения (для unread после перезагрузки)
  if (active && active.unread) {
    active.unread = false;
    if (state.chats[active.key]) state.chats[active.key].unread = false;
    if (!active.isDb) lsSave(LS.chats, state.chats);
    updateBadges();
  }

  const chName = (c) => c.isDb ? (c.otherName || (c.listing ? c.listing.sellerName : t('chats.title'))) : (c.listing ? c.listing.sellerName : '');
  const chPhoto = (c) => (c.listing ? (getPhotos(c.listing)[0] || '') : '');
  const chTitle = (c) => (c.listing ? c.listing.title : c.title) || '';

  const rowsHTML = chats.map(c => {
    const photo = chPhoto(c);
    const last = c.messages[c.messages.length - 1];
    return `
    <div class="chat-row ${active && c.key === active.key ? 'active' : ''}" data-chat="${esc(c.key)}">
      ${photo ? `<img src="${esc(photo)}" alt="">` : '<div class="thumb-fallback" style="width:48px;height:48px">📷</div>'}
      <div class="info">
        <div class="name"><span class="nm">${esc(chName(c))}</span> ${last ? `<time>${msgTime(last.ts)}</time>` : ''}</div>
        <div class="last">${c.unread ? '<b style="color:var(--accent-dark)">● </b>' : ''}${last ? esc(last.text) : esc(chTitle(c))}</div>
      </div>
    </div>`;
  }).join('');

  const windowHTML = active ? `
    <div class="chat-head">
      <button class="icon-btn back-btn" data-action="chat-back" aria-label="${t('a11y.back')}">←</button>
      ${chPhoto(active) ? `<img src="${esc(chPhoto(active))}" alt="">` : ''}
      <div style="min-width:0">
        <div class="t">${esc(chName(active))}</div>
        ${active.listing
          ? `<a class="s" href="#/item/${active.listing.id}" data-link style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${esc(active.listing.title)} · ${active.listing.negotiable ? t('price.negotiable') : fmtNum(active.listing.price) + ' ' + t('som')}</a>`
          : `<div class="s" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${esc(chTitle(active))}</div>`}
      </div>
    </div>
    ${phishBannerDismissed() ? '' : `<div class="chat-phish-banner"><span>🛡️ ${t('safety.chatBanner')}</span><button class="cpb-x" data-action="dismiss-phish" aria-label="${t('safety.dismiss')}">✕</button></div>`}
    <div class="chat-msgs" id="chatMsgs">
      ${active.messages.length
        ? active.messages.map(msgHTML).join('')
        : `<div class="empty empty-sm"><div class="empty-emoji">👋</div><h3>${t('chats.start.t')}</h3><p>${t('chats.start.p')}</p></div>`}
    </div>
    ${active.messages.length === 0 ? `
    <div class="chip-row chat-quick">
      <button class="fchip" data-quick="${t('chats.q1')}">${t('chats.q1s')}</button>
      <button class="fchip" data-quick="${t('chats.q2')}">${t('chats.q2s')}</button>
      <button class="fchip" data-quick="${t('chats.q3')}">${t('chats.q3s')}</button>
    </div>` : ''}
    <div class="chat-input">
      <input type="text" id="chatText" placeholder="${t('chats.msgPh')}" autocomplete="off" enterkeyhint="send">
      <button data-action="chat-send" aria-label="${t('a11y.send')}">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
      </button>
    </div>
  ` : `<div class="chat-placeholder">${t('chats.pick')}</div>`;

  app.innerHTML = `
    <div class="page-head chats-page-head"><h1>${t('chats.title')}</h1></div>
    <div class="chats-layout">
      <div class="chats-list ${active ? 'hide-mobile' : ''}">
        ${rowsHTML}
      </div>
      <div class="chat-window ${active ? '' : 'hide-mobile'}" data-active-chat="${active ? esc(active.key) : ''}">${windowHTML}</div>
    </div>`;

  // живая подписка на сообщения собеседника (DB-чат)
  if (active && active.isDb && active.chatId) {
    _chatSub = dbSubscribeMessages(active.chatId, m => onRealtimeMsg(active.key, m));
  }

  const msgs = $('#chatMsgs');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
  const input = $('#chatText');
  if (input && window.innerWidth > 920) input.focus();

  // открытый диалог на мобиле — полноэкранный оверлей: блокируем прокрутку фона
  // и привязываем высоту к visual viewport (клавиатура не утаскивает шапку)
  if (active && window.innerWidth <= 920) {
    lockScroll('chat');
    syncChatViewport();
  } else {
    unlockScroll('chat');
  }
}

/* высота оверлея диалога = visual viewport (видимая область над клавиатурой).
   Без этого на iOS при подъёме клавиатуры шапка чата и сообщения уезжают за экран. */
function syncChatViewport() {
  const vv = window.visualViewport;
  if (!vv) return;
  const root = document.documentElement.style;
  root.setProperty('--vvh', vv.height + 'px');
  root.setProperty('--vvtop', vv.offsetTop + 'px');
  const msgs = $('#chatMsgs');
  if (msgs && document.querySelector('.chat-window:not(.hide-mobile)')) msgs.scrollTop = msgs.scrollHeight;
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncChatViewport);
  window.visualViewport.addEventListener('scroll', syncChatViewport);
}

function sendChatMessage(chatKey, text) {
  text = text.trim();
  if (!text) return;
  const existing = state.chats[chatKey];

  // === реальный DB-чат: шлём в облако, отвечает живой собеседник через realtime (без бота) ===
  if (existing && existing.isDb) {
    const msg = { from: 'me', text, ts: Date.now() };
    existing.messages.push(msg);
    existing.updatedAt = Date.now();
    const inp = $('#chatText'); if (inp) { inp.value = ''; inp.focus(); }
    if (!appendChatMsg(chatKey, msg)) renderChats(chatKey);
    dbSendMessage(existing.chatId, text)
      .then(saved => { msg.id = saved.id; })
      .catch(() => {
        // откат оптимистичного сообщения: не притворяемся, что доставлено
        const i = existing.messages.indexOf(msg);
        if (i >= 0) existing.messages.splice(i, 1);
        showToast(t('toast.sendFail'), 'error');
        if (location.hash === '#/chats/' + chatKey) renderChats(chatKey);
      });
    return;
  }

  // === локальный демо-чат (мок-объявление): бот-автоответ + демо анти-скама ===
  const chat = ensureChat(chatKey);
  const msg = { from: 'me', text, ts: Date.now() };
  chat.messages.push(msg);
  chat.updatedAt = Date.now();
  lsSave(LS.chats, state.chats);
  if (chat.messages.length === 1 || !appendChatMsg(chatKey, msg)) {
    renderChats(chatKey);
    const inp = $('#chatText'); if (inp) inp.focus();
  } else {
    const inp = $('#chatText'); if (inp) { inp.value = ''; inp.focus(); }
  }

  setTimeout(() => {
    const pool = Math.random() < 0.16 ? SCAM_REPLIES : AUTO_REPLIES; // ~16% — демо анти-скама
    const reply = { from: 'them', text: pool[Math.floor(Math.random() * pool.length)], ts: Date.now() };
    chat.messages.push(reply);
    chat.updatedAt = Date.now();
    const here = location.hash === '#/chats/' + chatKey;
    chat.unread = !here;
    lsSave(LS.chats, state.chats);
    if (here) {
      if (!appendChatMsg(chatKey, reply)) renderChats(chatKey);
    } else if (location.hash === '#/chats') {
      renderChats(null);
    }
    updateBadges();
  }, 1100 + Math.random() * 1400);
}

/* ---------------- выбор города ---------------- */

function openCityModal() {
  const all = allListings();
  const rows = ['all', ...CITIES].map(c => {
    const count = c === 'all' ? all.length : all.filter(l => l.city === c).length;
    const label = cityLabel(c);
    return `<button class="${state.city === c ? 'active' : ''}" data-city="${c}">
      <span>${esc(label)}</span><span class="count">${count}</span></button>`;
  }).join('');
  openModal(`<h3>${t('city.modal')}</h3><div class="city-list">${rows}</div>`);
}

function setCity(c) {
  state.city = c;
  state.filters.city = c;
  lsSave(LS.city, c);
  $('#cityBtnLabel').textContent = cityLabel(c);
  closeModal();
  // перерисовываем только страницы, зависящие от города, — иначе смена города
  // на полпути заполнения формы подачи стёрла бы введённое
  const { path } = parseHash();
  if (path === '/' || path === '' || path.startsWith('/search')) router();
}

/* ---------------- язык и тема ---------------- */

function openLangModal() {
  const rows = LANG_ORDER.map(lg =>
    `<button class="${LANG === lg ? 'active' : ''}" data-set-lang="${lg}">
       <span>${LANG_NAMES[lg]}</span>${LANG === lg ? '<span class="lang-check">✓</span>' : ''}
     </button>`).join('');
  openModal(`<h3>${t('lang.modal')}</h3><div class="city-list lang-list">${rows}</div>`);
}

/* применить смену языка и перерисовать всё */
function applyLang(lg) {
  if (lg === LANG) { closeModal(); return; }
  setLang(lg);                 // обновляет статичный хром (i18n.js)
  $('#cityBtnLabel').textContent = cityLabel(state.city);
  if (typeof aiOnLangChange === 'function') aiOnLangChange();
  closeModal();
  router();                    // перерисовать текущую страницу на новом языке
}

function cycleTheme() {
  const order = ['light', 'dark', 'system'];
  setTheme(order[(order.indexOf(THEME) + 1) % 3]);
  if (parseHash().path.startsWith('/profile')) renderProfile();
}

/* ---------------- поиск из шапки + подсказки ---------------- */

function addSearchHistory(qRaw) {
  const h = lsLoad(LS.hist, []).filter(x => x.toLowerCase() !== qRaw.toLowerCase());
  h.unshift(qRaw);
  lsSave(LS.hist, h.slice(0, 6));
}

function doHeaderSearch() {
  const input = $('#searchInput');
  input.blur(); // iOS не убирает клавиатуру сам
  const raw = input.value.trim();
  hideSuggest();
  if (raw) addSearchHistory(raw);

  // NLU: «айфон до 50к бу в бишкеке» → фильтры + остаток в q
  const parsed = parseSearchQuery(raw);
  const f = { ...defaultFilters(), city: state.city };
  Object.assign(f, parsed.filters);
  f.q = parsed.q;
  f.qRaw = raw; // то, что человек набрал руками
  state.filters = f;
  state.page = 1;
  // строку НЕ очищаем: когда NLU разобрал запрос целиком («камри»), parsed.q
  // пуст, и поле обнулялось — уточнить запрос можно было только набрав заново
  input.value = raw;

  if (parseHash().path.startsWith('/search')) {
    renderSearch(); // полный рендер: панель и сортировка должны отразить новые фильтры
  } else {
    location.hash = '#/search';
  }
}

const POPULAR_QUERIES = ['iPhone', 'Снять квартиру', 'Toyota Camry', 'Велосипед', 'Диван', 'Ноутбук'];

/* ============================================================
   Подсказки поиска.
   Раньше был плоский список заголовков объявлений: каталог из 608 моделей
   не использовался, подкатегории не искались, счётчиков не было, а сверху
   всегда висел баннер ИИ. Теперь — сгруппировано и с числами, чтобы можно
   было выбрать нужное, не читая шесть длинных заголовков подряд.
   ============================================================ */
function suggestCatalogRows(q) {
  if (typeof CATALOG === 'undefined') return [];
  const rows = [];
  const push = (sub, brand, model) => {
    const attrs = model ? { brand, model } : { brand };
    const n = applyFilters({ ...defaultFilters(), sub, attrs, _skipSort: true }).length;
    if (!n) return;
    rows.push({ sub, brand, model, n, label: model ? brand + ' ' + model : brand });
  };
  const subs = ['Легковые авто', 'Телефоны', 'Ноутбуки', 'Планшеты'];
  for (const sub of subs) {
    if (rows.length >= 5) break;
    const brands = (typeof catalogBrands === 'function') ? catalogBrands(sub) : [];
    for (const b of brands) {
      if (rows.length >= 5) break;
      const bn = (b.brand || b.name || '');
      const bMatch = bn.toLowerCase().startsWith(q) || (b.ru || '').toLowerCase().startsWith(q)
        || (b.aliases || []).some(a => String(a).toLowerCase().startsWith(q));
      for (const m of (b.models || [])) {
        if (rows.length >= 5) break;
        const full = (bn + ' ' + m.name).toLowerCase();
        const mMatch = m.name.toLowerCase().startsWith(q) || full.includes(q)
          || (m.aliases || []).some(a => String(a).toLowerCase().startsWith(q));
        if (mMatch) push(sub, bn, m.name);
      }
      if (bMatch && rows.length < 5) push(sub, bn, null);
    }
  }
  return rows.sort((a, b) => b.n - a.n).slice(0, 5);
}

function showSuggest() {
  const raw = $('#searchInput').value.trim();
  const q = raw.toLowerCase();
  const box = $('#searchSuggest');
  const head = txt => `<div class="sug-head">${esc(txt)}</div>`;

  // пустое поле: история (с удалением) + популярные запросы
  if (q.length < 2) {
    const hist = lsLoad(LS.hist, []);
    let rows = '';
    if (hist.length) {
      rows += head(t('sug.recent')) + hist.map(h =>
        `<div class="sug-row"><button data-sug-q="${esc(h)}"><span class="sug-ico">🕐</span><span class="sug-hist">${esc(h)}</span></button>` +
        `<button class="sug-del" data-hist-del="${esc(h)}" aria-label="${t('sug.del')}">✕</button></div>`).join('');
    }
    const pops = POPULAR_QUERIES.filter(p => !hist.some(h => h.toLowerCase() === p.toLowerCase())).slice(0, Math.max(0, 6 - hist.length));
    if (pops.length) {
      rows += head(t('sug.popular')) + pops.map(p =>
        `<button data-sug-q="${esc(p)}"><span class="sug-ico">🔥</span>${esc(p)}</button>`).join('');
    }
    if (!rows) { hideSuggest(); return; }
    box.innerHTML = rows;
    box.hidden = false;
    return;
  }

  // 1. категории и подкатегории
  const catRows = [];
  for (const c of CATEGORIES) {
    if (catRows.length >= 3) break;
    if (c.name.toLowerCase().includes(q) || catName(c).toLowerCase().includes(q)) {
      const n = applyFilters({ ...defaultFilters(), cat: c.id, _skipSort: true }).length;
      catRows.push(`<button data-sug-cat="${c.id}">${c.emoji}&nbsp; <b>${esc(catName(c))}</b><span class="sug-cat">${nLabel(n)}</span></button>`);
    }
    for (const sub of c.subs) {
      if (catRows.length >= 3) break;
      if (sub.toLowerCase().includes(q) || subName(sub).toLowerCase().includes(q)) {
        const n = applyFilters({ ...defaultFilters(), cat: c.id, sub, _skipSort: true }).length;
        catRows.push(`<button data-sug-cat="${c.id}" data-sug-sub="${esc(sub)}">${c.emoji}&nbsp; <b>${esc(subName(sub))}</b><span class="sug-cat">${nLabel(n)}</span></button>`);
      }
    }
  }

  // 2. марки и модели из каталога
  const brandRows = suggestCatalogRows(q).map(r =>
    `<button data-sug-brand="${esc(r.brand)}" data-sug-model="${esc(r.model || '')}" data-sug-sub2="${esc(r.sub)}">
      <span class="sug-ico">🏷️</span><b>${esc(r.label)}</b><span class="sug-cat">${nLabel(r.n)}</span></button>`);

  // 3. конкретные объявления
  const tokens = prepQueryTokens(raw);
  const scored = [];
  const seen = new Set();
  if (tokens.length) {
    for (const l of allListings()) {
      const sc = scoreListing(l, tokens, requiredMatches(tokens));
      if (sc > 0 && !seen.has(l.title)) { seen.add(l.title); scored.push([sc, l]); }
    }
    scored.sort((a, b) => b[0] - a[0]);
  }
  const itemRows = scored.slice(0, 4).map(x => x[1]).map(l =>
    `<button data-sug-item="${esc(l.id)}">
      <svg class="sug-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg>
      ${esc(l.title)}<span class="sug-cat">${esc(catNameById(l.category))}</span></button>`);

  let html = '';
  if (catRows.length) html += head(t('sug.cats')) + catRows.join('');
  if (brandRows.length) html += head(t('sug.brands')) + brandRows.join('');
  if (itemRows.length) html += head(t('sug.items')) + itemRows.join('');
  // ИИ — внизу и только как дополнение, а не первым перехватом внимания
  html += `<button class="sug-aiRow" data-ai-ask="${esc(raw)}"><span class="sug-ai">${t('sug.ai')}</span>&nbsp;«${esc(raw)}»</button>`;

  box.innerHTML = html;
  box.hidden = false;
}

function hideSuggest() { $('#searchSuggest').hidden = true; }

/* ---------------- роутер ---------------- */

function parseHash() {
  const h = location.hash.slice(1) || '/';
  const [path, qs] = h.split('?');
  return { path, params: new URLSearchParams(qs || ''), hasQuery: qs !== undefined };
}

/* фильтры → hash для диплинков (ИИ, карта, шеринг) */
function buildSearchHash(f) {
  const p = new URLSearchParams();
  if (f.cat) p.set('cat', f.cat);
  if (f.sub) p.set('sub', f.sub);
  if (f.q && f.q.trim()) p.set('q', f.q.trim());
  // city кодируем ВСЕГДА (включая 'all') — иначе роутер подставит город юзера
  // и выдача разойдётся с обещанием ИИ («по всему КР нашлось N»)
  if (f.city) p.set('city', f.city);
  if (f.condition && f.condition !== 'any') p.set('cond', f.condition);
  if (f.priceMin) p.set('pmin', f.priceMin);
  if (f.priceMax) p.set('pmax', f.priceMax);
  if (f.delivery) p.set('deliv', '1');
  if (f.sort && f.sort !== 'date') p.set('sort', f.sort);
  if (f.period && f.period !== 'all') p.set('period', f.period);
  const qs = p.toString();
  return '#/search' + (qs ? '?' + qs : '?reset=1');
}

function updateNav(path) {
  let key = 'home';
  if (path.startsWith('/favorites')) key = 'favorites';
  else if (path.startsWith('/post')) key = 'post';
  else if (path.startsWith('/chats')) key = 'chats';
  else if (path.startsWith('/profile')) key = 'profile';
  else if (path !== '/' && path !== '') key = '';
  document.querySelectorAll('#bottomnav a').forEach(a => {
    const active = a.dataset.nav === key;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function updateBadges() {
  const favN = state.favorites.size;
  const unread = Object.values(state.chats).filter(c => c.unread).length;
  const notifN = state.notifUnread || 0;
  const set = (el, n) => { if (!el) return; el.hidden = n === 0; el.textContent = n > 99 ? '99+' : n; };
  set($('#favBadge'), favN);
  set($('#chatBadge'), unread);
  set($('#notifBadge'), notifN);
  set(document.querySelector('[data-badge="fav"]'), favN);
  set(document.querySelector('[data-badge="chat"]'), unread);
}

/* сколько непрочитанных уведомлений — тянем с сервера (rpc_unread_counts) */
async function refreshNotifCount() {
  if (typeof BZ === 'undefined' || !BZ.available() || !(typeof isAuthed === 'function' && isAuthed())) {
    state.notifUnread = 0; updateBadges(); return;
  }
  const c = await BZ.notifications.counts();
  state.notifUnread = (c && (c.notifications ?? c.notif ?? 0)) || 0;
  updateBadges();
}

/* ---------------- Центр уведомлений ---------------- */

const NOTIF_ICON = { message: '💬', offer: '🤝', price_drop: '📉', saved_search: '🔔', moderation: '🛡️' };

/* относительное время по метке (переиспользует логику postedLabel) */
function notifTime(ts) { return postedLabel({ createdAt: ts }); }

/* какие типы показывать — управляется юзером, хранится локально */
function notifPrefs() {
  const d = { message: true, offer: true, price_drop: true, saved_search: true, moderation: true };
  try { return { ...d, ...(JSON.parse(localStorage.getItem('bazar_notif_prefs') || '{}')) }; } catch (e) { return d; }
}

async function renderNotifications() {
  const app = $('#app');
  app.innerHTML = `<div class="notif-page">
    <div class="page-head">
      <h1 class="page-title">🔔 ${t('notif.title')}</h1>
      <button class="btn btn-outline btn-sm" data-action="notif-read-all">${t('notif.readAll')}</button>
    </div>
    <div id="notifList"><div class="boot-skeleton"><div class="sk-card"><div class="sk-photo"></div><div class="sk-line"></div></div></div></div>
    <details class="notif-settings"><summary>⚙️ ${t('notif.settings')}</summary>
      <div class="notif-prefs">${Object.keys(NOTIF_ICON).map(k => {
        const on = notifPrefs()[k];
        return `<label class="notif-pref"><span>${NOTIF_ICON[k]} ${t('notif.kind.' + k)}</span>
          <input type="checkbox" data-notif-pref="${k}" ${on ? 'checked' : ''}></label>`;
      }).join('')}</div>
    </details>
  </div>`;

  let list = [];
  if (typeof BZ !== 'undefined' && BZ.available()) list = (await BZ.notifications.list(60)) || [];
  const prefs = notifPrefs();
  const shown = list.filter(n => prefs[n.kind] !== false);
  const box = $('#notifList');
  if (!box) return;
  if (!shown.length) {
    box.innerHTML = emptyHTML('🔔', t('notif.empty.t'), t('notif.empty.p'));
  } else {
    box.innerHTML = shown.map(n => {
      const unread = !n.read_at;
      const link = n.link && n.link.startsWith('#') ? n.link : '';
      return `<div class="notif-row ${unread ? 'unread' : ''}" data-action="notif-open" data-id="${n.id}" data-link="${esc(link)}">
        <span class="notif-ico">${NOTIF_ICON[n.kind] || '🔔'}</span>
        <div class="notif-body">
          <div class="notif-t">${esc(n.title || '')}</div>
          ${n.body ? `<div class="notif-p">${esc(n.body)}</div>` : ''}
          <div class="notif-time">${notifTime(new Date(n.created_at).getTime())}</div>
        </div>
        ${unread ? '<span class="notif-dot"></span>' : ''}
      </div>`;
    }).join('');
  }
  // настройки типов: переключение хранится локально, список перерисовываем
  app.querySelectorAll('[data-notif-pref]').forEach(cb => {
    cb.addEventListener('change', () => {
      const prefs = notifPrefs();
      prefs[cb.dataset.notifPref] = cb.checked;
      try { localStorage.setItem('bazar_notif_prefs', JSON.stringify(prefs)); } catch (e) {}
      renderNotifications();
    });
  });
}

function router() {
  const { path, params, hasQuery } = parseHash();
  closeModal();
  closeFilterSheet();
  hideSuggest();
  unlockScroll('chat'); // уходим с диалога — снять блокировку прокрутки (re-lock в renderChats)
  if (!path.startsWith('/chats') && _chatSub) { _chatSub(); _chatSub = null; } // снять realtime-подписку
  if (!path.startsWith('/sell') && typeof visionStopCamera === 'function') visionStopCamera();

  if (path === '/' || path === '') {
    renderHome();
  } else if (path.startsWith('/search')) {
    const qs = location.hash.split('?')[1] || '';
    // сбрасываем фильтры только при НОВОМ запросе из ссылки — кнопка «назад»
    // не должна стирать уточнения. reset=1 («Показать все») сбрасывает и при
    // повторном КЛИКЕ, но не при возврате по истории: _navClick ставится
    // обработчиком ссылок и живёт один переход
    if (hasQuery && (qs !== state._appliedQS || (params.get('reset') && state._navClick))) {
      const f = defaultFilters();
      if (params.get('cat')) f.cat = params.get('cat');
      if (params.get('sub')) f.sub = params.get('sub');
      if (params.get('q')) f.q = params.get('q');
      if (params.get('city')) f.city = params.get('city');
      if (params.get('cond')) f.condition = params.get('cond');
      if (params.get('pmin')) f.priceMin = params.get('pmin');
      if (params.get('pmax')) f.priceMax = params.get('pmax');
      if (params.get('deliv')) f.delivery = true;
      if (params.get('sort')) f.sort = params.get('sort');
      if (params.get('period')) f.period = params.get('period');
      state.filters = f;
      state.page = 1;
      delete state._scroll[location.hash];
      $('#searchInput').value = f.qRaw || f.q;
    }
    if (hasQuery) state._appliedQS = qs;
    renderSearch();
  } else if (path.startsWith('/auth')) {
    renderAuth();
  } else if (path.startsWith('/item/')) {
    renderItem(path.slice('/item/'.length));
  } else if (path.startsWith('/seller/')) {
    renderSeller(path.slice('/seller/'.length));
  } else if (path.startsWith('/compare')) {
    renderCompare();
  } else if (path.startsWith('/favorites')) {
    renderFavorites();
  } else if (path.startsWith('/sell')) {
    if (requireAuth('#/sell')) renderSell();
  } else if (path.startsWith('/post')) {
    if (requireAuth(location.hash)) renderPost(params);
  } else if (path.startsWith('/chats/')) {
    if (requireAuth(location.hash)) renderChats(decodeURIComponent(path.slice('/chats/'.length)));
  } else if (path.startsWith('/chats')) {
    if (requireAuth('#/chats')) renderChats(null);
  } else if (path.startsWith('/notifications')) {
    if (requireAuth('#/notifications')) renderNotifications();
  } else if (path.startsWith('/profile')) {
    renderProfile();
  } else {
    renderHome();
  }
  updateNav(path);
  updateBadges();
  updateCompareBar();
  // липкая панель связи живёт только на странице товара
  document.body.classList.toggle('has-contactbar', !!document.getElementById('itemContactBar'));

  // возврат «назад» к спискам — на сохранённую позицию, остальное — наверх
  const key = location.hash || '#/';
  const saved = state._scroll[key];
  const restorable = path === '/' || path === '' || path.startsWith('/search') || path.startsWith('/favorites');
  if (restorable && saved != null) {
    delete state._scroll[key];
    requestAnimationFrame(() => window.scrollTo(0, saved));
  } else {
    window.scrollTo(0, 0);
  }
}

/* ---------------- глобальные обработчики ---------------- */

document.addEventListener('click', async e => {
  /* экран входа/регистрации: вкладки, способ, соц-вход */
  const authMode = e.target.closest('[data-auth-mode]');
  if (authMode) { e.preventDefault(); state.auth.mode = authMode.dataset.authMode; renderAuth(); return; }
  const authMethod = e.target.closest('[data-auth-method]');
  if (authMethod) { e.preventDefault(); state.auth.method = authMethod.dataset.authMethod; renderAuth(); return; }
  const authSoc = e.target.closest('[data-auth-social]');
  if (authSoc) { e.preventDefault(); doAuthSocial(authSoc.dataset.authSocial); return; }
  const authGo = e.target.closest('[data-auth-go]');
  if (authGo) { state.auth.mode = authGo.dataset.authGo; } // ссылка сама уведёт на #/auth

  /* избранное: обновляем ВСЕ кнопки этого объявления (карточка может быть на странице дважды) */
  const favBtn = e.target.closest('[data-fav]');
  if (favBtn) {
    e.preventDefault();
    const id = favBtn.dataset.fav;
    toggleFav(id);
    document.querySelectorAll(`[data-fav="${CSS.escape(id)}"]`).forEach(b => {
      if (b.classList.contains('fav-btn')) {
        b.classList.toggle('active', state.favorites.has(id));
      } else {
        b.innerHTML = state.favorites.has(id) ? '❤️ ' + t('item.faved') : '🤍 ' + t('item.fav');
      }
    });
    if (parseHash().path.startsWith('/favorites')) renderFavorites();
    return;
  }

  /* переключатель плитка/список */
  const viewBtn = e.target.closest('.view-toggle [data-view]');
  if (viewBtn) {
    state.view = viewBtn.dataset.view;
    lsSave(LS.view, state.view);
    updateResults();
    return;
  }

  /* чипы-фильтры в панели */
  const fchip = e.target.closest('[data-fgroup]');
  if (fchip) {
    state.filters[fchip.dataset.fgroup] = fchip.dataset.fval;
    fchip.parentElement.querySelectorAll('.fchip').forEach(x => x.classList.toggle('active', x === fchip));
    state.page = 1;
    updateResults();
    return;
  }

  /* удаление активного чипа */
  const clearBtn = e.target.closest('[data-clear]');
  if (clearBtn) { clearFilter(clearBtn.dataset.clear); return; }

  /* подсказки поиска */
  // удалить один запрос из истории (крестик), не закрывая список
  const histDel = e.target.closest('[data-hist-del]');
  if (histDel) {
    e.stopPropagation();
    const q = histDel.dataset.histDel;
    lsSave(LS.hist, lsLoad(LS.hist, []).filter(h => h !== q));
    showSuggest();
    return;
  }
  // марка/модель из каталога — сразу точные фильтры, без текстового поиска
  const sugBrand = e.target.closest('[data-sug-brand]');
  if (sugBrand) {
    hideSuggest();
    const d = sugBrand.dataset;
    const f = state.filters;
    f.q = ''; f.qRaw = ''; $('#searchInput').value = '';
    f.sub = d.sugSub2 || '';
    f.cat = (CATEGORIES.find(c => c.subs.includes(f.sub)) || {}).id || f.cat;
    f.attrs = d.sugModel ? { brand: d.sugBrand, model: d.sugModel } : { brand: d.sugBrand };
    state.page = 1;
    state._appliedQS = 'suggest';
    location.hash = '#/search';
    if (parseHash().path.startsWith('/search')) renderSearch();
    return;
  }
  // конкретное объявление — открываем его, а не ищем по заголовку
  const sugItem = e.target.closest('[data-sug-item]');
  if (sugItem) {
    hideSuggest();
    $('#searchInput').value = '';
    location.hash = '#/item/' + sugItem.dataset.sugItem;
    return;
  }
  const sugCat = e.target.closest('[data-sug-cat]');
  if (sugCat) {
    hideSuggest();
    $('#searchInput').value = '';
    const sub = sugCat.dataset.sugSub;
    location.hash = '#/search?cat=' + sugCat.dataset.sugCat + (sub ? '&sub=' + encodeURIComponent(sub) : '');
    return;
  }
  const sugQ = e.target.closest('[data-sug-q]');
  if (sugQ) {
    $('#searchInput').value = sugQ.dataset.sugQ;
    // подсказки ищут по всем категориям — сбрасываем категорийный фильтр,
    // иначе результат не совпадёт с обещанием подсказки
    state.filters.cat = '';
    state.filters.sub = '';
    const sugPanel = $('#filtersPanel');
    if (sugPanel) { sugPanel.innerHTML = filterPanelHTML(state.filters); bindFilterPanel(); }
    doHeaderSearch();
    return;
  }

  /* выбор города в модалке */
  const cityOpt = e.target.closest('[data-city]');
  if (cityOpt) { setCity(cityOpt.dataset.city); return; }

  /* язык / тема */
  const langOpt = e.target.closest('[data-set-lang]');
  if (langOpt) { applyLang(langOpt.dataset.setLang); return; }
  const themeOpt = e.target.closest('[data-set-theme]');
  if (themeOpt) { setTheme(themeOpt.dataset.setTheme); renderProfile(); return; }

  /* продажа за 30 секунд */
  const sellDemoBtn = e.target.closest('[data-sell-demo]');
  if (sellDemoBtn) {
    const p = DEMO_PRODUCTS.find(x => x.id === sellDemoBtn.dataset.sellDemo);
    if (p) {
      state.sell = { step: 'analyze', product: p };
      if (parseHash().path.startsWith('/sell')) renderSell(); else location.hash = '#/sell';
    }
    return;
  }
  if (e.target.closest('[data-sell-camera]')) {
    state.sell = { step: 'camera' };
    if (parseHash().path.startsWith('/sell')) renderSell(); else location.hash = '#/sell';
    return;
  }
  if (e.target.closest('[data-sell-cancelcam]')) {
    visionStopCamera();
    state.sell = { step: 'pick' };
    renderSell();
    return;
  }
  if (e.target.closest('[data-sell-restart]')) {
    state.sell = { step: 'pick' };
    renderSell();
    return;
  }
  if (e.target.closest('[data-sell-exit]')) {
    visionStopCamera();
    state.sell = { step: 'pick' };
    location.hash = '#/';
    return;
  }
  /* чаты */
  const chatRow = e.target.closest('[data-chat]');
  if (chatRow) { location.hash = '#/chats/' + chatRow.dataset.chat; return; }
  const quick = e.target.closest('[data-quick]');
  if (quick) {
    const activeChat = document.querySelector('[data-active-chat]')?.dataset.activeChat;
    if (activeChat) sendChatMessage(activeChat, quick.dataset.quick);
    return;
  }

  /* действия */
  const actBtn = e.target.closest('[data-action]');
  if (actBtn) {
    e.preventDefault(); // не дать ссылке-обёртке (карточке) увести при клике на кнопку-действие
    const act = actBtn.dataset.action;
    const id = actBtn.dataset.id;
    switch (act) {
      case 'notif-open': {
        if (typeof BZ !== 'undefined' && BZ.available() && id) BZ.notifications.markRead(id);
        state.notifUnread = Math.max(0, (state.notifUnread || 0) - 1); updateBadges();
        const link = actBtn.dataset.link;
        if (link) location.hash = link;
        else { const row = actBtn; row.classList.remove('unread'); const d = row.querySelector('.notif-dot'); if (d) d.remove(); }
        break;
      }
      case 'notif-read-all': {
        if (typeof BZ !== 'undefined' && BZ.available()) {
          const list = (await BZ.notifications.list(60)) || [];
          await Promise.all(list.filter(n => !n.read_at).map(n => BZ.notifications.markRead(n.id)));
        }
        state.notifUnread = 0; updateBadges();
        document.querySelectorAll('.notif-row.unread').forEach(r => { r.classList.remove('unread'); const d = r.querySelector('.notif-dot'); if (d) d.remove(); });
        break;
      }
      case 'open-filters': {
        const panel = $('#filtersPanel');
        if (panel && !panel.classList.contains('open')) {
          panel.classList.add('open');
          lockScroll('sheet');
        }
        break;
      }
      case 'close-filters':
        state._commitPrice?.(); // дозаписать цену, если дебаунс не успел
        closeFilterSheet();
        break;
      // «Возможно, вы искали…» из пустой выдачи — применяем найденное в каталоге
      case 'dym': {
        const f = state.filters;
        const d = actBtn.dataset;
        f.q = ''; f.qRaw = ''; $('#searchInput').value = '';
        if (d.cat) f.cat = d.cat;
        if (d.sub) f.sub = d.sub;
        f.attrs = {};
        if (d.brand) f.attrs.brand = d.brand;
        if (d.model) f.attrs.model = d.model;
        state.page = 1;
        const p1 = $('#filtersPanel');
        if (p1) { p1.innerHTML = filterPanelHTML(f); bindFilterPanel(); }
        updateResults();
        break;
      }
      // снять ОДНО мешающее условие вместо сброса всего
      case 'relax': {
        const f = state.filters;
        const key = actBtn.dataset.relax;
        if (key === 'city') f.city = 'all';
        else if (key === 'price') { f.priceMin = ''; f.priceMax = ''; }
        else if (key === 'condition') f.condition = 'any';
        else if (key === 'delivery') f.delivery = false;
        else if (key === 'q') { f.q = ''; f.qRaw = ''; $('#searchInput').value = ''; }
        else if (key.startsWith('attr:')) {
          const bare = key.slice(5);
          delete f.attrs[bare]; delete f.attrs[bare + 'Min']; delete f.attrs[bare + 'Max'];
          if (bare === 'brand') { delete f.attrs.model; delete f.attrs.gen; }
          if (bare === 'model') delete f.attrs.gen;
        }
        state.page = 1;
        const p2 = $('#filtersPanel');
        if (p2) { p2.innerHTML = filterPanelHTML(f); bindFilterPanel(); }
        updateResults();
        break;
      }
      case 'fav-note': {
        const cur = (state.favMeta[id] || {}).note || '';
        openModal(`
          <h3>${t('favs.noteTitle')}</h3>
          <textarea class="ftextarea" id="favNoteInput" maxlength="200" placeholder="${t('favs.notePh')}">${esc(cur)}</textarea>
          <div class="modal-actions">
            <button class="btn btn-outline" data-action="modal-close">${t('modal.cancel')}</button>
            <button class="btn btn-primary" data-action="fav-note-save" data-id="${id}">${t('modal.save')}</button>
          </div>`);
        setTimeout(() => { const i = $('#favNoteInput'); if (i) i.focus(); }, 60);
        break;
      }
      case 'fav-note-save': {
        const v = ($('#favNoteInput') || {}).value || '';
        state.favMeta[id] = { ...(state.favMeta[id] || {}), note: v.trim() };
        if (!state.favMeta[id].note) delete state.favMeta[id].note;
        lsSave(LS.favMeta, state.favMeta);
        closeModal();
        renderFavorites();
        break;
      }
      case 'fav-forget': {
        state.favorites.delete(id);
        delete state.favMeta[id];
        lsSave(LS.favs, [...state.favorites]);
        lsSave(LS.favMeta, state.favMeta);
        updateBadges();
        renderFavorites();
        break;
      }
      case 'draft-discard': {
        clearPostDraft();
        showToast(t('form.draftCleared'));
        renderPost(new URLSearchParams());
        break;
      }
      case 'reset-filters': {
        const keepCity = state.city;
        state.filters = { ...defaultFilters(), city: keepCity };
        $('#searchInput').value = '';
        const panel = $('#filtersPanel');
        if (panel) { panel.innerHTML = filterPanelHTML(state.filters); bindFilterPanel(); }
        const ss = $('#sortSel');
        if (ss) ss.value = state.filters.sort;
        state.page = 1;
        updateResults();
        break;
      }
      case 'show-more': state.page++; updateResults(); break;
      case 'gallery-prev': galleryGo(-1); break;
      case 'gallery-next': galleryGo(1); break;
      case 'show-phone': showPhoneModal(id); break;
      case 'write-seller': { closeModal(); openChatForListing(id); break; }
      case 'offer-price': openOfferModal(id); break;
      case 'offer-submit': submitOffer(id); break;
      case 'offer-deal': offerToChat(id, +actBtn.dataset.price); break;
      case 'logout': { authSignOut(); showToast(t('auth.bye')); location.hash = '#/'; break; }
      case 'compare-toggle': {
        if (toggleCompare(id)) {
          const on = inCompare(id);
          actBtn.classList.toggle('on', on);
          actBtn.innerHTML = '⚖️ ' + (on ? t('cmp.inList') : t('cmp.add'));
          updateCompareBar();
        }
        break;
      }
      case 'compare-card': { // компактная кнопка на карточке
        if (toggleCompare(id)) { actBtn.classList.toggle('on', inCompare(id)); updateCompareBar(); }
        break;
      }
      case 'compare-clear': { clearCompare(); updateCompareBar(); if (parseHash().path.startsWith('/compare')) renderCompare(); break; }
      case 'compare-remove': { state.compare.delete(id); lsSave(LS.compare, [...state.compare]); updateCompareBar(); renderCompare(); break; }
      case 'share': shareListing(id); break;
      case 'share-copy': {
        const i = $('#shareUrl');
        if (i) { i.select(); try { document.execCommand('copy'); } catch (e) {} if (navigator.clipboard) navigator.clipboard.writeText(i.value).catch(() => {}); showToast(t('share.copied'), 'success'); }
        break;
      }
      case 'report': openReportModal(id); break;
      case 'report-submit': {
        closeModal();
        if (id) {
          const reason = actBtn.dataset.reason || 'other';
          // Облачное объявление → жалоба уходит на сервер (3 жалобы от разных
          // людей = автоблокировка + журнал модерации). Демо-объявления живут
          // только локально, для них копим причину на будущее.
          const l = getListing(id);
          if (l && isCloudListing(l) && typeof BZ !== 'undefined' && BZ.available()) {
            BZ.report(id, reason).then(r => {
              if (r && !r.ok && r.reason === 'auth') showToast(t('report.needAuth') || t('auth.needLogin'), 'info');
            });
          } else {
            const log = lsLoad(LS.reportLog, []);
            if (!log.some(r => r.id === id)) {
              log.push({ id, reason, ts: Date.now() });
              lsSave(LS.reportLog, log.slice(-200));
            }
          }
          state.reported.add(id); lsSave(LS.reported, [...state.reported]);
          state.favorites.delete(id); lsSave(LS.favs, [...state.favorites]);
          state.compare.delete(id); lsSave(LS.compare, [...state.compare]);
          updateBadges(); updateCompareBar();
        }
        showToast(t('report.sent'), 'success');
        // если жаловались со страницы товара — увести в ленту (объявление скрыто)
        if (parseHash().path.startsWith('/item/')) location.hash = '#/';
        break;
      }
      case 'dismiss-phish': {
        try { sessionStorage.setItem('bz_phish_off', '1'); } catch (e) {}
        const b = actBtn.closest('.chat-phish-banner'); if (b) b.remove();
        break;
      }
      case 'toggle-sold': toggleSold(id); break;
      case 'save-search': {
        if (saveCurrentSearch()) showToast(t('saved.saved'), 'success');
        const b = $('#saveSearchBtn'); if (b) { b.classList.add('on'); b.innerHTML = '🔔 ' + t('saved.savedShort'); }
        break;
      }
      case 'open-saved': openSavedSearch(id); break;
      case 'remove-saved': { removeSaved(id); if (parseHash().path.startsWith('/profile')) renderProfile(); break; }
      case 'bump': {
        const l = state.myListings.find(x => x.id === id);
        if (l) {
          l.createdAt = Date.now();
          lsSave(LS.my, state.myListings);
          showToast(t('toast.bumped'), 'success');
          const y = window.scrollY;
          router();
          requestAnimationFrame(() => window.scrollTo(0, y));
        }
        break;
      }
      case 'delete-my': deleteMyListing(id); break;
      case 'delete-my-confirm': {
        if (state.dbListings.some(x => x.id === id)) {
          // облачное объявление → удаляем из БД (у всех пропадёт через realtime)
          if (typeof dbDeleteListing === 'function') dbDeleteListing(id).catch(() => {});
          state.dbListings = state.dbListings.filter(x => x.id !== id);
        } else {
          state.myListings = state.myListings.filter(x => x.id !== id);
          delete state.chats[id];
          lsSave(LS.my, state.myListings);
          lsSave(LS.chats, state.chats);
        }
        state.favorites.delete(id);
        lsSave(LS.favs, [...state.favorites]);
        state.compare.delete(id); // иначе панель сравнения считает удалённое
        lsSave(LS.compare, [...state.compare]);
        updateCompareBar();
        closeModal();
        showToast(t('toast.deleted'));
        if (parseHash().path.startsWith('/item/')) {
          location.hash = '#/profile';
        } else {
          const y = window.scrollY;
          router();
          requestAnimationFrame(() => window.scrollTo(0, y));
        }
        break;
      }
      case 'chat-send': {
        const activeChat = document.querySelector('[data-active-chat]')?.dataset.activeChat;
        const input = $('#chatText');
        if (activeChat && input) { sendChatMessage(activeChat, input.value); }
        break;
      }
      case 'chat-back': location.hash = '#/chats'; break;
      case 'sell-to-manual': {
        if (state.sell._collect) {
          const pf = state.sell._collect();
          // СНЯТОЕ ФОТО И РАСПОЗНАННЫЕ СПЕКИ СОХРАНЯЕМ: «сфоткал → ИИ распознал →
          // поправлю вручную» — самый частый путь, а раньше на этом шаге фото
          // и характеристики молча пропадали, и объявление уходило без снимка
          if (pf.userPhotos && pf.userPhotos.length) state._postPhotos = pf.userPhotos;
          else delete pf.pickedSeeds; // демо-заглушки не тащим, выберет заново
          state._prefill = pf;
        }
        state.sell = { step: 'pick', product: null };
        location.hash = '#/post';
        break;
      }
      case 'modal-close': closeModal(); break;
    }
    return;
  }

  /* миниатюры галереи */
  const thumb = e.target.closest('[data-thumb]');
  if (thumb) { galleryGo(0, +thumb.dataset.thumb); return; }

  /* клик мимо подсказок */
  if (!e.target.closest('#searchbar')) hideSuggest();

  /* повторный клик по той же ссылке (например, категория) — форсируем роутер;
     сбрасываем _appliedQS, чтобы базовый фильтр ссылки применился заново */
  const link = e.target.closest('a[data-link]');
  if (!link) return;
  // отмечаем, что переход инициирован кликом, а не кнопкой «назад»:
  // по этому признаку reset=1 сбрасывает фильтры только при реальном клике
  state._navClick = true;
  setTimeout(() => { state._navClick = false; }, 0);
  if (link.getAttribute('href') === location.hash) {
    e.preventDefault();
    state._appliedQS = null;
    router();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    hideSuggest();
    closeFilterSheet();
  }
  if (e.key === 'Enter' && e.target.id === 'searchInput') doHeaderSearch();
  if (e.key === 'Enter' && e.target.id === 'chatText') {
    const activeChat = document.querySelector('[data-active-chat]')?.dataset.activeChat;
    if (activeChat) sendChatMessage(activeChat, e.target.value);
  }
  // стрелки листают галерею, только если пользователь не печатает в поле
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  if (!typing && e.key === 'ArrowLeft' && $('#galleryImg')) galleryGo(-1);
  if (!typing && e.key === 'ArrowRight' && $('#galleryImg')) galleryGo(1);
});

let suggestTimer;
$('#searchInput').addEventListener('input', () => {
  clearTimeout(suggestTimer);
  suggestTimer = setTimeout(showSuggest, 100); // дебаунс скоринга ~570 объявлений
});
$('#searchInput').addEventListener('focus', showSuggest); // пустое поле → история + популярное
$('#searchGo').addEventListener('click', doHeaderSearch);
$('#cityBtn').addEventListener('click', openCityModal);
$('#langBtn').addEventListener('click', openLangModal);
$('#themeBtn').addEventListener('click', cycleTheme);

/* ---------------- старт ---------------- */

window.addEventListener('hashchange', e => {
  // запоминаем позицию скролла покидаемой страницы — для возврата «назад»
  try {
    const oldHash = new URL(e.oldURL).hash || '#/';
    state._scroll[oldHash] = window.scrollY;
  } catch {}
  router();
});

// при выходе из мобильного диапазона шит фильтров и его скролл-лок не должны зависнуть
onMediaChange('(min-width: 921px)', e => {
  if (e.matches) { closeFilterSheet(); unlockScroll('chat'); } // на десктоп диалог в потоке — снять блок
});

// подсказки поиска прячем при скролле страницы (нативный паттерн)
window.addEventListener('scroll', hideSuggest, { passive: true });

applyStaticChrome();   // перевести шапку/навигацию/панель ИИ (i18n.js)
applyTheme();          // синхронизировать иконку темы
$('#cityBtnLabel').textContent = cityLabel(state.city);
router();

// авторизация резолвится асинхронно (Supabase) — когда сессия подтянулась
// или сменилась (вход/выход/возврат из OAuth): перерисовываем + тянем облачные данные
authOnChange(() => { router(); loadCloudData(); startMyChatsLive(); });

// realtime: новые объявления появляются в ленте у всех (и у гостей) без перезагрузки
startListingsLive();
