/* ============================================================
   BZ — единственная дверь из приложения в бэкенд.

   Правила этого файла:

   1. Приложение НЕ знает про Supabase. Оно зовёт BZ.search(), BZ.report() и
      получает обычные объекты. Если завтра бэкенд сменится — переписывается
      только этот файл.

   2. Сервера может не быть. PWA работает офлайн, у гостя бывает мёртвая сеть,
      а демо-каталог из 6030 объявлений лежит в браузере. Поэтому каждый метод
      обязан деградировать, а не падать: `available()` показывает, живой ли
      сервер, и вызывающий код выбирает локальный путь.

   3. Ошибки не глотаем. Молчаливый catch прячет поломку до жалобы человека:
      логируем и возвращаем понятный признак неудачи.

   Грузится ПОСЛЕ auth.js (нужен клиент `sb`) и ДО app.js.
   ============================================================ */

const BZ = (() => {
  const BUCKET = 'listing-photos';

  /* sb создаётся в auth.js; здесь только пользуемся */
  const db = () => (typeof sb !== 'undefined' ? sb : null);
  const uid = () => (typeof AUTH !== 'undefined' && AUTH.user ? AUTH.user.id : null);

  /* Состояние доступности сервера. Держим отдельно от «залогинен»: гость тоже
     должен получать серверную выдачу. */
  const net = { ok: !!db(), lastError: null, checkedAt: 0 };

  function fail(where, error) {
    net.lastError = { where, message: error?.message || String(error), at: Date.now() };
    // сетевые сбои гасят сервер до следующей удачной попытки
    if (/Failed to fetch|NetworkError|timeout/i.test(net.lastError.message)) net.ok = false;
    console.warn('[BZ] ' + where + ': ' + net.lastError.message);
    return null;
  }
  function good() { net.ok = true; net.checkedAt = Date.now(); }

  /* ---------- фото ---------- */

  /* В базе лежит путь внутри бакета. Старые записи (до переезда на хранилище)
     держат base64 прямо в колонке — их отдаём как есть, иначе у человека
     пропадут уже загруженные фотографии. */
  function photoUrl(pathOrData) {
    if (!pathOrData) return '';
    if (/^data:|^https?:/i.test(pathOrData)) return pathOrData;
    const base = (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL) || '';
    return base ? `${base}/storage/v1/object/public/${BUCKET}/${pathOrData}` : '';
  }

  function dataUrlToBlob(dataUrl) {
    const [head, body] = String(dataUrl).split(',');
    const mime = (head.match(/data:([^;]+)/) || [, 'image/jpeg'])[1];
    const bin = atob(body);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return new Blob([buf], { type: mime });
  }

  /* Заливает фотографии объявления и возвращает пути в бакете.
     Путь строго `{uid}/{listingId}/{случайное}.jpg` — политика хранилища
     проверяет первый сегмент, чужую папку залить нельзя. */
  async function uploadPhotos(listingId, photos) {
    const s = db(), me = uid();
    if (!s || !me || !photos || !photos.length) return [];
    const out = [];
    for (let i = 0; i < photos.length && i < 10; i++) {
      const p = photos[i];
      if (typeof p === 'string' && !p.startsWith('data:')) { out.push(p); continue; } // уже в хранилище
      try {
        const blob = p instanceof Blob ? p : dataUrlToBlob(p);
        if (blob.size > 5 * 1024 * 1024) { console.warn('[BZ] фото больше 5 МБ пропущено'); continue; }
        const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const path = `${me}/${listingId}/${name}`;
        const { error } = await s.storage.from(BUCKET).upload(path, blob, {
          contentType: blob.type || 'image/jpeg', upsert: false,
        });
        if (error) { fail('uploadPhotos', error); continue; }
        out.push(path);
      } catch (e) { fail('uploadPhotos', e); }
    }
    return out;
  }

  async function removePhotos(paths) {
    const s = db();
    if (!s || !paths?.length) return;
    const own = paths.filter(p => typeof p === 'string' && !p.startsWith('data:'));
    if (own.length) await s.storage.from(BUCKET).remove(own).catch(e => fail('removePhotos', e));
  }

  /* ---------- чтение объявлений ---------- */

  /* Приводим строку из базы к тому виду, в котором приложение ожидает
     объявление. Один переводчик на весь код — иначе поля разъезжаются. */
  function fromRow(r) {
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      price: Number(r.price) || 0,
      priceSuffix: '',
      negotiable: !!r.negotiable,
      hasFloor: !!r.has_floor,          // сам floor сервер не отдаёт — и правильно
      category: r.category,
      subcategory: r.subcategory,
      city: r.city,
      district: r.district || null,
      condition: r.condition || null,
      description: r.description || '',
      attrs: r.attrs || {},
      photoPaths: r.photos || [],
      userPhotos: (r.photos || []).map(photoUrl).filter(Boolean),
      photoCount: (r.photos || []).length,
      photoSeed: 7,
      views: r.views_count || 0,
      status: r.status,
      ownerId: r.owner_id,
      sellerName: r.seller_name || '',
      sellerType: r.seller_kind || 'private',
      sellerRating: Number(r.seller_rating) || 0,
      sellerAds: r.seller_ads || 0,
      createdAt: r.created_at ? Date.parse(r.created_at) : Date.now(),
      postedHoursAgo: r.created_at ? Math.max(0, (Date.now() - Date.parse(r.created_at)) / 3600e3) : 0,
      isTestData: !!r.is_test_data,
      fromServer: true,
    };
  }

  /* Поиск целиком на сервере: полнотекст, фильтры, сортировка, пагинация
     курсором. Возвращает { rows, nextCursor, total } либо null, если сервер
     недоступен — тогда вызывающий код ищет локально. */
  async function search(f = {}, cursor = null, limit = 24) {
    const s = db();
    if (!s) return null;
    const attrs = {};
    for (const [k, v] of Object.entries(f.attrs || {})) if (v !== '' && v != null) attrs[k] = v;
    try {
      const { data, error } = await s.rpc('rpc_search_listings', {
        p_query: f.q || null,
        p_category: f.cat || null,
        p_subcategory: f.sub || null,
        p_city: f.city && f.city !== 'all' ? f.city : null,
        p_price_min: f.priceMin !== '' && f.priceMin != null ? Number(f.priceMin) : null,
        p_price_max: f.priceMax !== '' && f.priceMax != null ? Number(f.priceMax) : null,
        p_condition: f.condition && f.condition !== 'any' ? f.condition : null,
        p_seller_kind: f.sellerType && f.sellerType !== 'any' ? f.sellerType : null,
        p_delivery: f.delivery ? true : null,
        p_attrs: attrs,
        p_period: f.period && f.period !== 'all' ? f.period : null,
        p_sort: f.sort || 'date',
        p_cursor: cursor,
        p_limit: limit,
      });
      if (error) return fail('search', error);
      good();
      const rows = Array.isArray(data) ? data : (data?.rows || []);
      return {
        rows: rows.map(fromRow).filter(Boolean),
        nextCursor: (rows.length && rows[rows.length - 1].next_cursor) || data?.next_cursor || null,
        total: rows[0]?.total_count ?? data?.total_count ?? rows.length,
      };
    } catch (e) { return fail('search', e); }
  }

  async function attrCounts(cat, sub, filters = {}) {
    const s = db();
    if (!s) return null;
    try {
      const { data, error } = await s.rpc('rpc_attr_counts', {
        p_category: cat || null, p_subcategory: sub || null, p_filters: filters,
      });
      if (error) return fail('attrCounts', error);
      good();
      return data || {};
    } catch (e) { return fail('attrCounts', e); }
  }

  async function getListing(id) {
    const s = db();
    if (!s) return null;
    try {
      const { data, error } = await s.from('public_listings').select('*').eq('id', id).maybeSingle();
      if (error) return fail('getListing', error);
      good();
      return fromRow(data);
    } catch (e) { return fail('getListing', e); }
  }

  /* ---------- запись объявлений ---------- */

  function toRow(l) {
    return {
      title: (l.title || '').trim(),
      description: l.description || '',
      price: Number(l.price) || 0,
      negotiable: !!l.negotiable,
      floor: l.floor > 0 ? Number(l.floor) : null,
      category: l.category,
      subcategory: l.subcategory,
      city: l.city,
      district: l.district || null,
      condition: l.condition || null,
      attrs: l.attrs || {},
    };
  }

  /* Сначала строка, потом фото: путь в хранилище содержит id объявления,
     а до вставки его ещё нет. */
  async function createListing(l, photos) {
    const s = db(), me = uid();
    if (!s || !me) return null;
    try {
      const { data, error } = await s.from('listings')
        .insert({ ...toRow(l), owner_id: me }).select().single();
      if (error) return fail('createListing', error);
      const paths = await uploadPhotos(data.id, photos);
      if (paths.length) {
        const { data: upd } = await s.from('listings')
          .update({ photos: paths }).eq('id', data.id).select().single();
        if (upd) data.photos = upd.photos;
      }
      good();
      return fromRow({ ...data, has_floor: data.floor != null });
    } catch (e) { return fail('createListing', e); }
  }

  async function updateListing(id, l, photos) {
    const s = db(), me = uid();
    if (!s || !me) return null;
    try {
      const paths = await uploadPhotos(id, photos);
      const { data, error } = await s.from('listings')
        .update({ ...toRow(l), ...(paths.length ? { photos: paths } : {}) })
        .eq('id', id).eq('owner_id', me).select().single();
      if (error) return fail('updateListing', error);
      good();
      return fromRow({ ...data, has_floor: data.floor != null });
    } catch (e) { return fail('updateListing', e); }
  }

  async function deleteListing(id) {
    const s = db(), me = uid();
    if (!s || !me) return false;
    const { data } = await s.from('listings').select('photos').eq('id', id).eq('owner_id', me).maybeSingle();
    const { error } = await s.from('listings').delete().eq('id', id).eq('owner_id', me);
    if (error) { fail('deleteListing', error); return false; }
    if (data?.photos?.length) await removePhotos(data.photos);
    return true;
  }

  const rpc = (name, args) => async () => {
    const s = db();
    if (!s) return null;
    const { data, error } = await s.rpc(name, args);
    return error ? fail(name, error) : (good(), data);
  };

  const bump = id => rpc('rpc_bump_listing', { p_listing_id: id })();
  const markSold = (id, sold) => rpc('rpc_mark_sold', { p_listing_id: id, p_sold: !!sold })();

  /* Отпечаток гостя: без него сервер не отличит пять обновлений страницы
     от пяти разных людей. Это не слежка — значение случайное и живёт
     в самом браузере. */
  function fingerprint() {
    let v = null;
    try { v = localStorage.getItem('bazar_fp'); } catch (e) {}
    if (!v) {
      v = Math.random().toString(36).slice(2) + Date.now().toString(36);
      try { localStorage.setItem('bazar_fp', v); } catch (e) {}
    }
    return v;
  }
  const trackView = id => rpc('rpc_track_view', { p_listing_id: id, p_fingerprint: fingerprint() })();

  /* ---------- торг ---------- */

  /* Сравнение с минимальной ценой делает сервер. Раньше floor приезжал в
     браузер, и покупатель читал его в devtools — торг был фикцией. */
  async function makeOffer(listingId, amount) {
    const s = db();
    if (!s || !uid()) return null;
    const { data, error } = await s.rpc('rpc_make_offer', {
      p_listing_id: listingId, p_amount: Number(amount),
    });
    return error ? fail('makeOffer', error) : (good(), data);
  }

  /* ---------- личное ---------- */

  const favorites = {
    async list() {
      const s = db(); if (!s || !uid()) return null;
      const { data, error } = await s.from('favorites').select('*');
      return error ? fail('favorites.list', error) : (good(), data || []);
    },
    async add(listingId, price, note, folder) {
      const s = db(), me = uid(); if (!s || !me) return false;
      const { error } = await s.from('favorites').upsert({
        user_id: me, listing_id: listingId,
        price_at_add: price ?? null, note: note ?? null, folder: folder ?? null,
      });
      return error ? (fail('favorites.add', error), false) : true;
    },
    async remove(listingId) {
      const s = db(), me = uid(); if (!s || !me) return false;
      const { error } = await s.from('favorites').delete().eq('user_id', me).eq('listing_id', listingId);
      return error ? (fail('favorites.remove', error), false) : true;
    },
  };

  const savedSearches = {
    async list() {
      const s = db(); if (!s || !uid()) return null;
      const { data, error } = await s.from('saved_searches').select('*').order('created_at', { ascending: false });
      return error ? fail('savedSearches.list', error) : (good(), data || []);
    },
    async add(name, query, notify = true) {
      const s = db(), me = uid(); if (!s || !me) return false;
      const { error } = await s.from('saved_searches').upsert(
        { user_id: me, name, query, notify }, { onConflict: 'user_id,name' });
      return error ? (fail('savedSearches.add', error), false) : true;
    },
    async remove(id) {
      const s = db(), me = uid(); if (!s || !me) return false;
      const { error } = await s.from('saved_searches').delete().eq('id', id).eq('user_id', me);
      return error ? (fail('savedSearches.remove', error), false) : true;
    },
  };

  /* ---------- жалобы ---------- */

  async function report(listingId, reason, comment) {
    const s = db(), me = uid();
    if (!s || !me) return { ok: false, reason: 'auth' };
    const { error } = await s.from('reports').insert({
      listing_id: listingId, reporter_id: me, reason, comment: comment || null,
    });
    if (error) {
      // повторная жалоба того же человека — не ошибка для пользователя
      if (/duplicate key/i.test(error.message)) return { ok: true, already: true };
      fail('report', error);
      return { ok: false, reason: error.message };
    }
    return { ok: true };
  }

  /* ---------- отзывы ---------- */

  const reviews = {
    async of(sellerId) {
      const s = db(); if (!s) return null;
      const { data, error } = await s.from('reviews').select('*').eq('seller_id', sellerId)
        .order('created_at', { ascending: false }).limit(50);
      return error ? fail('reviews.of', error) : (good(), data || []);
    },
    async add(sellerId, listingId, rating, text) {
      const s = db(), me = uid(); if (!s || !me) return false;
      const { error } = await s.from('reviews').insert({
        seller_id: sellerId, author_id: me, listing_id: listingId || null,
        rating: Math.max(1, Math.min(5, Math.round(rating))), text: text || null,
      });
      return error ? (fail('reviews.add', error), false) : true;
    },
  };

  /* ---------- уведомления ---------- */

  const notifications = {
    async list(limit = 50) {
      const s = db(); if (!s || !uid()) return null;
      const { data, error } = await s.from('notifications').select('*')
        .order('created_at', { ascending: false }).limit(limit);
      return error ? fail('notifications.list', error) : (good(), data || []);
    },
    async markRead(id) {
      const s = db(), me = uid(); if (!s || !me) return false;
      const { error } = await s.from('notifications')
        .update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', me);
      return !error;
    },
    async counts() {
      const s = db(); if (!s || !uid()) return null;
      const { data, error } = await s.rpc('rpc_unread_counts');
      return error ? fail('unreadCounts', error) : (good(), data);
    },
  };

  return {
    available: () => !!db() && net.ok,
    lastError: () => net.lastError,
    photoUrl, uploadPhotos, removePhotos,
    search, attrCounts, getListing,
    createListing, updateListing, deleteListing, bump, markSold, trackView,
    makeOffer, favorites, savedSearches, report, reviews, notifications,
    _fromRow: fromRow,
  };
})();
