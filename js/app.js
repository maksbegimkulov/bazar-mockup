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
state.page = 1;
state.galleryIndex = 0;
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
  if (l.pickedSeeds) return l.pickedSeeds.map(s => photoURL(l.category, s, l.subcategory));
  if (!l.photoCount) return [];
  return Array.from({ length: l.photoCount }, (_, i) => photoURL(l.category, l.photoSeed + i * 13, l.subcategory));
}

function catById(id) { return CATEGORIES.find(c => c.id === id); }

function allListings() { return [...state.myListings, ...LISTINGS]; }

function getListing(id) { return allListings().find(l => l.id === id); }

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
  return n;
}

/* ---------------- карточка объявления ---------------- */

const HEART_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21C8 17.5 3 13.6 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 4.6-5 8.5-9 12z"/></svg>';

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
        ? `<img src="${photos[0]}" loading="lazy" alt="${esc(l.title)}">`
        : `<div class="nophoto">📷&nbsp; ${t('nophoto')}</div>`}
      ${photos.length > 1 ? `<span class="photo-count">${photos.length} ${t('photo.word')}</span>` : ''}
      <div class="card-tags">${tags}</div>
      <button class="fav-btn ${isFav ? 'active' : ''}" data-fav="${l.id}" title="${t('item.fav')}" aria-label="${t('item.fav')}">${HEART_SVG}</button>
    </div>
    <div class="card-body">
      <div class="card-price">${priceHTML(l)}</div>
      <div class="card-title">${esc(l.title)}</div>
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

  const viewed = state.viewed.map(getListing).filter(Boolean).slice(0, 4);

  app.innerHTML = `
    <section>
      <div class="section-title"><h2>${t('home.cats')}</h2></div>
      <div class="cat-grid">${tiles}</div>
    </section>
    <div class="ai-banner">
      <span class="ai-banner-icon">✨</span>
      <div class="ai-banner-text">
        <div class="ai-banner-title">${t('ai.banner.title')}</div>
        <div class="ai-banner-sub">${t('ai.banner.sub')}</div>
      </div>
      <button class="btn btn-primary" data-ai-ask="">${t('ai.banner.btn')}</button>
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
  if (f.sub) return esc(subName(f.sub));
  const cat = catById(f.cat);
  if (cat) return esc(catName(cat));
  if (f.q.trim()) return `«${esc(f.q.trim())}»`;
  return t('results.all');
}

function activeChipsHTML(f) {
  const chips = [];
  const add = (key, label) => chips.push(`<span class="achip"><span class="achip-label">${label}</span><button data-clear="${key}" aria-label="${t('a11y.remove')}">✕</button></span>`);
  if (f.q.trim()) add('q', `${t('search.prefix')}: ${esc(f.q.trim())}`);
  if (f.cat) add('cat', esc(catNameById(f.cat) || f.cat));
  if (f.sub) add('sub', esc(subName(f.sub)));
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

  $('#fCat').addEventListener('change', e => {
    f.cat = e.target.value;
    f.sub = '';
    const cat = catById(f.cat);
    const block = $('#fSubBlock');
    if (cat) {
      block.hidden = false;
      $('#fSub').innerHTML = [`<option value="">${t('filters.allSubs')}</option>`]
        .concat(cat.subs.map(s => `<option value="${esc(s)}">${esc(subName(s))}</option>`)).join('');
    } else {
      block.hidden = true;
    }
    rerun();
  });
  $('#fSub').addEventListener('change', e => { f.sub = e.target.value; rerun(); });
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
  const f = state.filters;
  const res = applyFilters(f);
  const shown = res.slice(0, state.page * PAGE_SIZE);

  $('#resultsTitle').innerHTML = searchTitle(f);
  $('#resultsCount').textContent = nLabel(res.length);

  const grid = $('#resultsGrid');
  grid.className = 'grid' + (state.view === 'list' ? ' list-view' : '');
  grid.innerHTML = shown.length
    ? shown.map(cardHTML).join('')
    : emptyHTML('🔍', t('empty.search.t'), t('empty.search.p'),
        `<button class="btn btn-primary" data-action="reset-filters">${t('empty.reset')}</button>`);

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
}

function clearFilter(key) {
  const f = state.filters;
  if (key === 'q') { f.q = ''; $('#searchInput').value = ''; }
  if (key === 'cat') { f.cat = ''; f.sub = ''; }
  if (key === 'sub') f.sub = '';
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
  const median = prices[Math.floor(prices.length / 2)];
  const r = l.price / median;
  const avg = `${t('verdict.avg')} ${fmtNum(median)} ${t('som')}`;
  if (r <= 0.87) return { cls: 'good', label: t('verdict.good'), hint: `${t('verdict.goodHint')} (${fmtNum(median)} ${t('som')})` };
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
  const isMine = l.id.startsWith('m');
  const verdict = isMine ? null : priceVerdict(l);

  // история просмотров для блока «Вы недавно смотрели»
  if (!isMine) {
    state.viewed = [l.id, ...state.viewed.filter(x => x !== l.id)].slice(0, 12);
    lsSave(LS.viewed, state.viewed);
  }
  const similar = applyFilters({ ...defaultFilters(), city: 'all', cat: l.category, sub: l.subcategory })
    .filter(x => x.id !== l.id).slice(0, 4);

  const params = [
    [t('item.cat'), catName(cat) || l.category],
    [t('item.section'), subName(l.subcategory)],
    l.condition ? [t('item.cond'), l.condition === 'new' ? t('cond.new') : t('cond.used')] : null,
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
          ? `<img id="galleryImg" src="${photos[0]}" alt="${esc(l.title)}">
             ${photos.length > 1 ? `
             <button class="gallery-nav prev" data-action="gallery-prev" aria-label="‹">‹</button>
             <button class="gallery-nav next" data-action="gallery-next" aria-label="›">›</button>
             <span class="gallery-counter" id="galleryCounter">1 / ${photos.length}</span>` : ''}`
          : `<div class="nophoto">📷 ${t('item.noPhotoSeller')}</div>`}
      </div>
      ${photos.length > 1 ? `
      <div class="gallery-thumbs" id="galleryThumbs">
        ${photos.map((p, i) => `<img src="${p}" data-thumb="${i}" class="${i === 0 ? 'active' : ''}" alt="">`).join('')}
      </div>` : ''}
    </div>`;

  const buyCardHTML = `
    <div class="buy-card">
      <div class="buy-title">${esc(l.title)}</div>
      <div class="buy-price">${priceHTML(l)}</div>
      ${verdict ? `<div class="price-verdict ${verdict.cls}" title="${esc(verdict.hint)}">${verdict.label} · ${esc(verdict.hint)}</div>` : ''}
      <div class="buy-meta">${esc(l.city)}${l.district ? ', ' + esc(l.district) : ''} · ${postedLabel(l)} · 👁️ ${fmtNum(l.views)}</div>
      <div class="buy-actions">
        ${isMine ? `
          <a class="btn btn-secondary" href="#/post?edit=${l.id}" data-link>✏️ ${t('item.edit')}</a>
          <button class="btn btn-outline" data-action="bump" data-id="${l.id}">⬆️ ${t('item.bump')}</button>
          <button class="btn btn-danger-soft" data-action="delete-my" data-id="${l.id}">${t('item.delete')}</button>
        ` : `
          <button class="btn btn-primary btn-lg" data-action="show-phone" data-id="${l.id}">📞 ${t('item.showPhone')}</button>
          <button class="btn btn-secondary btn-lg" data-action="write-seller" data-id="${l.id}">💬 ${t('item.write')}</button>
          <button class="btn btn-outline" data-fav="${l.id}">${isFav ? '❤️ ' + t('item.faved') : '🤍 ' + t('item.fav')}</button>
        `}
      </div>
    </div>`;

  const sideHTML = `
    ${buyCardHTML}
    <div class="seller-card">
      <div class="avatar" style="${avatarStyle(l.sellerName)}">${esc(l.sellerName[0])}</div>
      <div class="seller-info">
        <div class="seller-name"><span>${esc(l.sellerName)}</span> ${l.sellerType === 'business' ? `<span class="seller-badge">${t('seller.business')}</span>` : ''}</div>
        <div class="seller-sub"><span class="seller-rating"><span class="star">★</span> ${l.sellerRating}</span> · ${t('seller.since')} ${l.sellerSinceYear} ${t('seller.sinceEnd')}</div>
        <div class="seller-sub">${nLabel(l.sellerAds)}</div>
      </div>
    </div>
    <div class="safety-note">
      🛡️ <b>${t('safety.t')}</b> ${t('safety.p')}
    </div>`;

  const panelsHTML = `
    <div class="panel">
      <h2>${t('item.specs')}</h2>
      <div class="params-table">
        ${params.map(([k, v]) => `<div class="prow"><span>${k}</span><span>${esc(v)}</span></div>`).join('')}
      </div>
    </div>
    <div class="panel">
      <h2>${t('item.desc')}</h2>
      <div class="item-desc">${esc(l.description)}</div>
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

/* ---------------- избранное ---------------- */

function toggleFav(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
    showToast(t('toast.favDel'));
  } else {
    state.favorites.add(id);
    showToast(t('toast.favAdd'), 'success');
  }
  lsSave(LS.favs, [...state.favorites]);
  updateBadges();
}

function renderFavorites() {
  const items = allListings().filter(l => state.favorites.has(l.id));
  app.innerHTML = `
    <div class="page-head">
      <h1>${t('favs.title')}</h1>
      ${items.length ? `<span class="results-count">${nLabel(items.length)}</span>` : ''}
    </div>
    <div class="grid">
      ${items.length
        ? items.map(cardHTML).join('')
        : emptyHTML('💔', t('favs.empty.t'), t('favs.empty.p'),
            `<a class="btn btn-primary" href="#/search?reset=1" data-link>${t('favs.empty.btn')}</a>`)}
    </div>`;
}

/* ---------------- подача объявления ---------------- */

function renderPost(params) {
  const editId = params.get('edit');
  const editing = editId ? state.myListings.find(l => l.id === editId) : null;
  const f = editing || {};
  const selCat = f.category || '';
  const cat = catById(selCat);

  const catOptions = [`<option value="">${t('form.chooseCat')}</option>`]
    .concat(CATEGORIES.map(c => `<option value="${c.id}" ${selCat === c.id ? 'selected' : ''}>${c.emoji} ${catName(c)}</option>`)).join('');
  const cityOptions = [`<option value="">${t('form.chooseCity')}</option>`]
    .concat(CITIES.map(c => `<option value="${esc(c)}" ${f.city === c ? 'selected' : ''}>${esc(c)}</option>`)).join('');

  app.innerHTML = `
    <div class="form-page">
      <div class="form-card">
        <h1>${editing ? t('form.edit') : t('form.new')}</h1>
        <form id="postForm" novalidate>
          <div class="fgroup">
            <label class="flabel">${t('form.cat')}</label>
            <select class="fselect" id="pCat" required>${catOptions}</select>
          </div>
          <div class="fgroup" id="pSubWrap" ${cat ? '' : 'hidden'}>
            <label class="flabel">${t('form.sub')}</label>
            <select class="fselect" id="pSub">${cat ? cat.subs.map(s => `<option value="${esc(s)}" ${f.subcategory === s ? 'selected' : ''}>${esc(subName(s))}</option>`).join('') : ''}</select>
          </div>
          <div class="fgroup">
            <label class="flabel">${t('form.title')}</label>
            <input class="finput" id="pTitle" maxlength="80" placeholder="${t('form.titlePh')}" value="${esc(f.title || '')}">
            <div class="hint">${t('form.titleHint')}</div>
          </div>
          <div class="fgroup">
            <label class="flabel">${t('form.desc')}</label>
            <textarea class="ftextarea" id="pDesc" maxlength="2000" placeholder="${t('form.descPh')}">${esc(f.description || '')}</textarea>
          </div>
          <div class="form-row">
            <div class="fgroup">
              <label class="flabel">${t('form.price')}</label>
              <input class="finput" id="pPrice" type="number" inputmode="numeric" min="0" placeholder="0" value="${f.price || ''}" ${f.negotiable ? 'disabled' : ''}>
              <label class="fcheck" style="margin-top:6px"><input type="checkbox" id="pNegotiable" ${f.negotiable ? 'checked' : ''}>
                <span class="box"><svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="#fff" stroke-width="2.4"><path d="M1 5l3.5 3.5L11 1"/></svg></span>
                ${t('price.negotiable')}</label>
            </div>
            <div class="fgroup">
              <label class="flabel">${t('form.city')}</label>
              <select class="fselect" id="pCity">${cityOptions}</select>
            </div>
          </div>
          <div class="form-row">
            <div class="fgroup">
              <label class="flabel">${t('form.cond')}</label>
              <div class="chip-row" id="pCondition">
                <button type="button" class="fchip ${!f.condition ? 'active' : ''}" data-cond="">${t('form.condNone')}</button>
                <button type="button" class="fchip ${f.condition === 'new' ? 'active' : ''}" data-cond="new">${t('cond.new')}</button>
                <button type="button" class="fchip ${f.condition === 'used' ? 'active' : ''}" data-cond="used">${t('cond.used')}</button>
              </div>
            </div>
            <div class="fgroup">
              <label class="flabel">${t('form.phone')}</label>
              <input class="finput" id="pPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+996 700 123 456" value="${esc(f.phone || '+996 ')}">
            </div>
          </div>
          <div class="fgroup">
            <label class="flabel">${t('form.photos')} <span style="font-weight:400">${t('form.photosHint')}</span></label>
            <div class="photo-picker" id="photoPicker"></div>
          </div>
          <div class="fgroup">
            <label class="fcheck"><input type="checkbox" id="pDelivery" ${f.hasDelivery ? 'checked' : ''}>
              <span class="box"><svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="#fff" stroke-width="2.4"><path d="M1 5l3.5 3.5L11 1"/></svg></span>
              ${t('form.delivery')}</label>
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg">${editing ? t('form.save') : t('form.publish')}</button>
        </form>
      </div>
    </div>`;

  const picked = new Set(f.pickedSeeds || []);

  function renderPicker() {
    const c = $('#pCat').value || 'home';
    const sub = $('#pSub') ? $('#pSub').value : '';
    $('#photoPicker').innerHTML = Array.from({ length: 8 }, (_, i) => {
      const seed = 11 + i * 7;
      return `<button type="button" class="photo-slot ${picked.has(seed) ? 'selected' : ''}" data-seed="${seed}">
        <img src="${photoURL(c, seed, sub)}" alt=""></button>`;
    }).join('');
  }
  renderPicker();

  $('#photoPicker').addEventListener('click', e => {
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
    renderPicker();
  });
  $('#pSub').addEventListener('change', renderPicker);

  $('#pNegotiable').addEventListener('change', e => {
    $('#pPrice').disabled = e.target.checked;
    if (e.target.checked) $('#pPrice').value = '';
  });

  let condition = f.condition || '';
  $('#pCondition').addEventListener('click', e => {
    const b = e.target.closest('[data-cond]');
    if (!b) return;
    condition = b.dataset.cond;
    document.querySelectorAll('#pCondition .fchip').forEach(x => x.classList.toggle('active', x === b));
  });

  $('#postForm').addEventListener('submit', e => {
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
    const city = $('#pCity').value;
    const phone = $('#pPhone').value.trim();

    if (!catVal) mark('#pCat', t('err.cat'));
    if (title.length < 5) mark('#pTitle', t('err.title'));
    if (desc.length < 10) mark('#pDesc', t('err.desc'));
    if (!negotiable && (!price || price <= 0)) mark('#pPrice', t('err.price'));
    if (!city) mark('#pCity', t('err.city'));
    if (!/^\+?[\d\s()-]{9,}$/.test(phone)) mark('#pPhone', t('err.phone'));
    if (errs.length) { showToast(t('toast.checkFields')); return; }

    const listing = {
      id: editing ? editing.id : 'm' + Date.now(),
      title,
      price,
      priceSuffix: '',
      negotiable,
      category: catVal,
      subcategory: $('#pSub').value || catById(catVal).subs[0],
      city,
      district: null,
      condition: condition || null,
      description: desc,
      pickedSeeds: [...picked],
      photoCount: picked.size,
      photoSeed: 11,
      sellerName: USER_NAME,
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
    };

    if (editing) {
      const i = state.myListings.findIndex(l => l.id === editing.id);
      state.myListings[i] = listing;
      LISTING_IDX.delete(listing.id); // заголовок мог измениться — индекс пересоберётся
      showToast(t('toast.saved'), 'success');
    } else {
      state.myListings.unshift(listing);
      showToast(t('toast.published'), 'success');
    }
    lsSave(LS.my, state.myListings);
    location.hash = '#/item/' + listing.id;
  });
}

/* ---------------- профиль ---------------- */

function renderProfile() {
  const my = state.myListings;
  const unread = Object.values(state.chats).filter(c => c.unread).length;

  const rows = my.map(l => {
    const photos = getPhotos(l);
    return `
    <div class="my-listing-row">
      ${photos.length ? `<img src="${photos[0]}" alt="">` : '<div class="thumb-fallback" style="width:92px;height:70px;font-size:20px">📷</div>'}
      <div class="info">
        <a class="title" href="#/item/${l.id}" data-link>${esc(l.title)}</a>
        <div class="sub">${priceHTML(l).replace(/<[^>]*>/g, ' ')} · ${postedLabel(l)} · 👁️ ${fmtNum(l.views)}</div>
      </div>
      <div class="actions">
        <button class="btn btn-secondary btn-sm" data-action="bump" data-id="${l.id}">⬆️ ${t('profile.bump')}</button>
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
          <button class="seg-btn ${THEME === 'light' ? 'active' : ''}" data-set-theme="light">☀️ ${t('theme.light')}</button>
          <button class="seg-btn ${THEME === 'dark' ? 'active' : ''}" data-set-theme="dark">🌙 ${t('theme.dark')}</button>
          <button class="seg-btn ${THEME === 'system' ? 'active' : ''}" data-set-theme="system">🌗 ${t('theme.system')}</button>
        </div>
      </div>
    </div>`;

  app.innerHTML = `
    <div class="profile-head">
      <div class="avatar avatar-lg" style="${avatarStyle(USER_NAME)}">${USER_NAME[0]}</div>
      <div>
        <div class="profile-name">${USER_NAME}</div>
        <div class="profile-sub">${t('profile.city')} · ${t('seller.since')} 2026 ${t('seller.sinceEnd')} · <span class="seller-rating"><span class="star">★</span> 5.0</span></div>
      </div>
      <div class="profile-stats">
        <div class="pstat"><b>${my.length}</b><span>${listingsWord(my.length)}</span></div>
        <div class="pstat"><b>${state.favorites.size}</b><span>${t('profile.inFavs')}</span></div>
        <div class="pstat"><b>${Object.keys(state.chats).length}</b><span>${dialogsWord(Object.keys(state.chats).length)}${unread ? ' · ' + unread + ' ' + t('profile.new') : ''}</span></div>
      </div>
    </div>
    <div class="page-head">
      <h2 class="page-subtitle">${t('profile.my')}</h2>
      <a class="btn btn-primary" href="#/post" data-link>${t('post.btnShort')}</a>
    </div>
    ${my.length ? rows : emptyHTML('📦', t('profile.empty.t'), t('profile.empty.p'),
      `<a class="btn btn-primary" href="#/post" data-link>${t('post.btn')}</a>`)}
    ${settingsHTML}`;
}

function deleteMyListing(id) {
  const l = state.myListings.find(x => x.id === id);
  if (!l) return;
  openModal(`
    <h3>${t('del.t')}</h3>
    <p class="modal-text">«${esc(l.title)}» ${t('del.p')}</p>
    <div class="modal-actions">
      <button class="btn btn-outline btn-block" data-action="modal-close">${t('del.cancel')}</button>
      <button class="btn btn-danger-soft btn-block" data-action="delete-my-confirm" data-id="${id}">${t('del.ok')}</button>
    </div>`);
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
  return `<div class="msg ${m.from}">${esc(m.text)}<time>${msgTime(m.ts)}</time></div>`;
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

function renderChats(activeId) {
  const chats = Object.values(state.chats)
    .map(c => ({ ...c, listing: getListing(c.itemId) }))
    .filter(c => c.listing)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (!chats.length) {
    app.innerHTML = `
      <div class="page-head"><h1>${t('chats.title')}</h1></div>
      ${emptyHTML('💬', t('chats.empty.t'), t('chats.empty.p'),
        `<a class="btn btn-primary" href="#/search?reset=1" data-link>${t('favs.empty.btn')}</a>`)}`;
    return;
  }

  const active = activeId ? chats.find(c => c.itemId === activeId) : null;
  if (active && active.unread) {
    active.unread = false; // и в копии для рендера строк
    state.chats[active.itemId].unread = false;
    lsSave(LS.chats, state.chats);
    updateBadges();
  }

  const rowsHTML = chats.map(c => {
    const photos = getPhotos(c.listing);
    const last = c.messages[c.messages.length - 1];
    return `
    <div class="chat-row ${active && c.itemId === active.itemId ? 'active' : ''}" data-chat="${c.itemId}">
      ${photos.length ? `<img src="${photos[0]}" alt="">` : '<div class="thumb-fallback" style="width:48px;height:48px">📷</div>'}
      <div class="info">
        <div class="name"><span class="nm">${esc(c.listing.sellerName)}</span> ${last ? `<time>${msgTime(last.ts)}</time>` : ''}</div>
        <div class="last">${c.unread ? '<b style="color:var(--accent-dark)">● </b>' : ''}${last ? esc(last.text) : esc(c.listing.title)}</div>
      </div>
    </div>`;
  }).join('');

  const windowHTML = active ? `
    <div class="chat-head">
      <button class="icon-btn back-btn" data-action="chat-back" aria-label="${t('a11y.back')}">←</button>
      ${getPhotos(active.listing)[0] ? `<img src="${getPhotos(active.listing)[0]}" alt="">` : ''}
      <div style="min-width:0">
        <div class="t">${esc(active.listing.sellerName)}</div>
        <a class="s" href="#/item/${active.listing.id}" data-link style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${esc(active.listing.title)} · ${active.listing.negotiable ? t('price.negotiable') : fmtNum(active.listing.price) + ' ' + t('som')}</a>
      </div>
    </div>
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
      <div class="chat-window ${active ? '' : 'hide-mobile'}" data-active-chat="${active ? active.itemId : ''}">${windowHTML}</div>
    </div>`;

  const msgs = $('#chatMsgs');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
  const input = $('#chatText');
  if (input && window.innerWidth > 920) input.focus();
}

function sendChatMessage(itemId, text) {
  text = text.trim();
  if (!text) return;
  const chat = ensureChat(itemId);
  const msg = { from: 'me', text, ts: Date.now() };
  chat.messages.push(msg);
  chat.updatedAt = Date.now();
  lsSave(LS.chats, state.chats);

  // первое сообщение — полный рендер (уходит пустое состояние и быстрые ответы),
  // дальше — дозапись в DOM, чтобы не закрывать клавиатуру
  if (chat.messages.length === 1 || !appendChatMsg(itemId, msg)) {
    renderChats(itemId);
    const inp = $('#chatText');
    if (inp) inp.focus();
  } else {
    const inp = $('#chatText');
    if (inp) { inp.value = ''; inp.focus(); }
  }

  setTimeout(() => {
    const reply = { from: 'them', text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)], ts: Date.now() };
    chat.messages.push(reply);
    chat.updatedAt = Date.now();
    const here = location.hash === '#/chats/' + itemId;
    chat.unread = !here;
    lsSave(LS.chats, state.chats);
    if (here) {
      if (!appendChatMsg(itemId, reply)) renderChats(itemId);
    } else if (location.hash === '#/chats') {
      renderChats(null); // обновить список: последнее сообщение + маркер непрочитанного
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
  state.filters = f;
  state.page = 1;
  input.value = parsed.q; // распознанное ушло в чипы фильтров

  if (parseHash().path.startsWith('/search')) {
    renderSearch(); // полный рендер: панель и сортировка должны отразить новые фильтры
  } else {
    location.hash = '#/search';
  }
}

const POPULAR_QUERIES = ['iPhone', 'Снять квартиру', 'Toyota Camry', 'Велосипед', 'Диван', 'Ноутбук'];

function showSuggest() {
  const raw = $('#searchInput').value.trim();
  const q = raw.toLowerCase();
  const box = $('#searchSuggest');

  // пустое поле: история + популярные запросы
  if (q.length < 2) {
    const hist = lsLoad(LS.hist, []);
    const rows =
      hist.map(h => `<button data-sug-q="${esc(h)}"><span class="sug-ico">🕐</span><span class="sug-hist">${esc(h)}</span></button>`).join('') +
      POPULAR_QUERIES.filter(p => !hist.some(h => h.toLowerCase() === p.toLowerCase())).slice(0, Math.max(0, 6 - hist.length))
        .map(p => `<button data-sug-q="${esc(p)}"><span class="sug-ico">🔥</span>${esc(p)}</button>`).join('');
    if (!rows) { hideSuggest(); return; }
    box.innerHTML = rows;
    box.hidden = false;
    return;
  }

  const catMatches = CATEGORIES.filter(c => c.name.toLowerCase().includes(q) || catName(c).toLowerCase().includes(q)).slice(0, 2);

  // топ-подсказки через то же поисковое ядро (понимает «айфон», опечатки)
  const tokens = prepQueryTokens(raw);
  const scored = [];
  const seen = new Set();
  if (tokens.length) {
    for (const l of allListings()) {
      const s = scoreListing(l, tokens, requiredMatches(tokens));
      if (s > 0 && !seen.has(l.title)) { seen.add(l.title); scored.push([s, l]); }
    }
    scored.sort((a, b) => b[0] - a[0]);
  }
  const titleMatches = scored.slice(0, 5).map(x => x[1]);

  box.innerHTML =
    `<button data-ai-ask="${esc(raw)}"><span class="sug-ai">${t('sug.ai')}</span>&nbsp;«${esc(raw)}»</button>` +
    catMatches.map(c => `<button data-sug-cat="${c.id}">${c.emoji}&nbsp; <b>${esc(catName(c))}</b><span class="sug-cat">${t('sug.cat')}</span></button>`).join('') +
    titleMatches.map(l => `<button data-sug-q="${esc(l.title)}">
      <svg class="sug-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg>
      ${esc(l.title)}<span class="sug-cat">${esc(catNameById(l.category))}</span></button>`).join('');
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
  const set = (el, n) => { if (!el) return; el.hidden = n === 0; el.textContent = n; };
  set($('#favBadge'), favN);
  set($('#chatBadge'), unread);
  set(document.querySelector('[data-badge="fav"]'), favN);
  set(document.querySelector('[data-badge="chat"]'), unread);
}

function router() {
  const { path, params, hasQuery } = parseHash();
  closeModal();
  closeFilterSheet();
  hideSuggest();

  if (path === '/' || path === '') {
    renderHome();
  } else if (path.startsWith('/search')) {
    const qs = location.hash.split('?')[1] || '';
    // сбрасываем фильтры только при НОВОМ запросе из ссылки —
    // кнопка «назад» с тем же hash не должна стирать уточнения пользователя
    if (hasQuery && qs !== state._appliedQS) {
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
      $('#searchInput').value = f.q;
    }
    if (hasQuery) state._appliedQS = qs;
    renderSearch();
  } else if (path.startsWith('/item/')) {
    renderItem(path.slice('/item/'.length));
  } else if (path.startsWith('/favorites')) {
    renderFavorites();
  } else if (path.startsWith('/post')) {
    renderPost(params);
  } else if (path.startsWith('/chats/')) {
    renderChats(decodeURIComponent(path.slice('/chats/'.length)));
  } else if (path.startsWith('/chats')) {
    renderChats(null);
  } else if (path.startsWith('/profile')) {
    renderProfile();
  } else {
    renderHome();
  }
  updateNav(path);
  updateBadges();

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

document.addEventListener('click', e => {
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
  const sugCat = e.target.closest('[data-sug-cat]');
  if (sugCat) {
    hideSuggest();
    $('#searchInput').value = '';
    location.hash = '#/search?cat=' + sugCat.dataset.sugCat;
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
    const act = actBtn.dataset.action;
    const id = actBtn.dataset.id;
    switch (act) {
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
      case 'write-seller': {
        closeModal();
        ensureChat(id);
        location.hash = '#/chats/' + id;
        break;
      }
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
        state.myListings = state.myListings.filter(x => x.id !== id);
        state.favorites.delete(id);
        delete state.chats[id];
        lsSave(LS.my, state.myListings);
        lsSave(LS.favs, [...state.favorites]);
        lsSave(LS.chats, state.chats);
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
  if (link && link.getAttribute('href') === location.hash) {
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
matchMedia('(min-width: 921px)').addEventListener('change', e => {
  if (e.matches) closeFilterSheet();
});

// подсказки поиска прячем при скролле страницы (нативный паттерн)
window.addEventListener('scroll', hideSuggest, { passive: true });

applyStaticChrome();   // перевести шапку/навигацию/панель ИИ (i18n.js)
applyTheme();          // синхронизировать иконку темы
$('#cityBtnLabel').textContent = cityLabel(state.city);
router();
