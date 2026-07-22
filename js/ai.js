/* ============================================================
   BAZAR mockup — Диана, ИИ-консультант
   Мок-ассистент: NLU-парсер + поисковое ядро + диалоговый UI.
   Архитектура позволяет позже заменить aiAnswer() на вызов реального LLM.
   ============================================================ */

const AI = {
  // ключ версионирован: старые истории ссылаются на другие id объявлений
  history: lsLoad('bazar_ai2', []),
  lastF: null, // последние применённые фильтры (для уточнений)
};

/* ---------- хранение ---------- */

function aiSaveHistory() {
  lsSave('bazar_ai2', AI.history.slice(-40));
}

function aiPush(msg) {
  AI.history.push(msg);
  aiSaveHistory();
}

/* ---------- рендер ---------- */

function aiItemHTML(id) {
  const l = getListing(id);
  if (!l) return '';
  const photos = getPhotos(l);
  return `
  <a class="ai-item" href="#/item/${l.id}" data-link>
    ${photos.length ? `<img src="${esc(photos[0])}" alt="">` : '<div class="thumb-fallback" style="width:56px;height:44px">📷</div>'}
    <span class="ai-item-info">
      <span class="ai-item-title">${esc(l.title)}</span>
      <span class="ai-item-meta">${l.negotiable ? t('price.negotiable') : fmtNum(l.price) + ' ' + t('som') + esc(l.priceSuffix)} · ${esc(l.city)}</span>
    </span>
    <span class="ai-item-arrow">›</span>
  </a>`;
}

const DEC_ICON = { best: '⭐', value: '🔥', purpose: '🎯', cheap: '💸' };

/* карточка одного выбора в «решении» Дианы */
function aiPickHTML(pick) {
  const l = getListing(pick.id);
  if (!l) return '';
  const photos = getPhotos(l);
  return `
  <a class="ai-pick ai-pick-${pick.kind}" href="#/item/${l.id}" data-link>
    <span class="ai-pick-badge">${DEC_ICON[pick.kind] || '•'} ${esc(pick.label)}</span>
    <span class="ai-pick-body">
      ${photos.length ? `<img src="${esc(photos[0])}" alt="">` : '<span class="thumb-fallback" style="width:52px;height:52px">📷</span>'}
      <span class="ai-pick-info">
        <span class="ai-pick-title">${esc(l.title)}</span>
        <span class="ai-pick-price">${l.negotiable ? t('price.negotiable') : fmtNum(l.price) + ' ' + t('som') + esc(l.priceSuffix)}</span>
        <span class="ai-pick-reason">${esc(pick.reason)}</span>
      </span>
      <span class="ai-item-arrow">›</span>
    </span>
  </a>`;
}

function aiMsgHTML(m, idx) {
  let body = '';
  if (m.decision && m.decision.length) {
    const picks = m.decision.map(aiPickHTML).join('');
    const more = m.moreCount > 0
      ? `<button class="ai-pick-more" data-ai-act="${idx}:0">${t('dec.more').replace('{n}', m.moreCount)} ›</button>`
      : '';
    body = picks ? `<div class="ai-picks">${picks}${more}</div>` : `<div class="ai-stale">${t('ai.staleItems')}</div>`;
  } else {
    let items = (m.items || []).map(aiItemHTML).join('');
    if (!items && m.items && m.items.length) items = `<div class="ai-stale">${t('ai.staleItems')}</div>`;
    body = items ? `<div class="ai-items">${items}</div>` : '';
  }
  const actions = (m.actions || []).map((a, i) =>
    `<button class="fchip ai-chip" data-ai-act="${idx}:${i}">${esc(a.label)}</button>`).join('');
  return `
  <div class="ai-msg ${m.role}">
    ${m.role === 'ai' ? '<span class="ai-avatar">✨</span>' : ''}
    <div class="ai-bubble">
      <div class="ai-text">${esc(m.text).replace(/\n/g, '<br>')}</div>
      ${body}
      ${actions ? `<div class="ai-actions chip-row">${actions}</div>` : ''}
    </div>
  </div>`;
}

function renderAIMessages() {
  const box = $('#aiMsgs');
  if (!box) return;
  box.innerHTML = AI.history.map(aiMsgHTML).join('');
  box.scrollTop = box.scrollHeight;
  const quick = $('#aiQuick');
  if (quick) quick.hidden = AI.history.length > 1;
}

function aiTyping(on) {
  const box = $('#aiMsgs');
  if (!box) return;
  const ex = box.querySelector('.ai-typing');
  if (ex) ex.remove();
  if (on) {
    box.insertAdjacentHTML('beforeend',
      '<div class="ai-msg ai ai-typing"><span class="ai-avatar">✨</span><div class="ai-bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>');
    box.scrollTop = box.scrollHeight;
  }
}

/* ---------- открытие/закрытие ---------- */

function openAI(prefill) {
  const panel = $('#aiPanel');
  if (!panel) return;
  if (panel.hidden) {
    panel.hidden = false;
    if (window.innerWidth <= 920) lockScroll('ai');
    $('#aiFab').classList.remove('pulse');
    lsSave('bazar_ai_seen', true);
    if (!AI.history.length) {
      aiPush({ role: 'ai', text: t('ai.greeting') });
    }
    renderAIMessages();
    syncAIViewport(); // зафиксировать высоту под текущий visual viewport
  }
  const input = $('#aiInput');
  if (prefill) {
    input.value = prefill;
    aiSend();
  } else if (window.innerWidth > 920) {
    input.focus();
  }
}

function closeAI() {
  const panel = $('#aiPanel');
  if (panel && !panel.hidden) {
    panel.hidden = true;
    unlockScroll('ai');
  }
}

/* высота панели = visual viewport (видимая область над клавиатурой).
   Без этого на iOS при подъёме клавиатуры шапка чата уезжает за экран. */
function syncAIViewport() {
  const vv = window.visualViewport;
  if (!vv) return;
  const root = document.documentElement.style;
  root.setProperty('--vvh', vv.height + 'px');
  root.setProperty('--vvtop', vv.offsetTop + 'px');
  // держим последнее сообщение видимым, когда клавиатура поджимает список
  const panel = $('#aiPanel'), msgs = $('#aiMsgs');
  if (panel && !panel.hidden && msgs) msgs.scrollTop = msgs.scrollHeight;
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncAIViewport);
  window.visualViewport.addEventListener('scroll', syncAIViewport);
}

/* ---------- логика ответов ---------- */

function aiFilterPhrase(f) {
  const parts = [];
  if (f.sub) parts.push(subName(f.sub).toLowerCase());
  else if (f.cat) { const c = catById(f.cat); if (c) parts.push(catName(c).toLowerCase()); }
  if (f.q) parts.push(`«${f.q}»`);
  const som = t('som');
  if (f.priceMin && f.priceMax) parts.push(`${fmtNum(f.priceMin)}–${fmtNum(f.priceMax)} ${som}`);
  else if (f.priceMax) parts.push(`${t('filters.to')} ${fmtNum(f.priceMax)} ${som}`);
  else if (f.priceMin) parts.push(`${t('filters.from')} ${fmtNum(f.priceMin)} ${som}`);
  if (f.city && f.city !== 'all') parts.push(f.city);
  if (f.condition === 'new') parts.push(t('ai.q.new'));
  if (f.condition === 'used') parts.push(t('ai.q.used'));
  if (f.delivery) parts.push(t('ai.q.deliv'));
  return parts.join(' · ');
}

/* медиана цены по подкатегории (для «выгодно vs рынок») */
function subMedian(l) {
  const peers = allListings().filter(x =>
    x.subcategory === l.subcategory && x.price > 0 && x.priceSuffix === l.priceSuffix);
  if (peers.length < 6) return null;
  const ps = peers.map(x => x.price).sort((a, b) => a - b);
  return ps[Math.floor(ps.length / 2)];
}

/* цель из запроса → «лучший для съёмки/игр/работы/семьи/экономичный» */
function detectPurpose(raw, cat) {
  const s = normText(raw);
  if (/камер|видео|съёмк|съемк|фото|блог|ютуб|контент|снима/.test(s)) return 'camera';
  if (/(?:^| )игр|гейм|пубг|танк/.test(s)) return 'gaming'; // \b не ловит кириллицу
  if (/учёб|учеб|студент|работ|офис|зум|онлайн|программ|кодин/.test(s)) return 'work';
  if (cat === 'transport' && /семь|семей|(?:^| )дет/.test(s)) return 'family';
  if (cat === 'transport' && /расход|экономичн|топлив/.test(s)) return 'economy';
  return null;
}

/* «решение, а не список»: до 3 выделенных выборов с обоснованием */
function aiDecision(res, raw, f) {
  if (res.length < 3) return null;
  const priced = res.filter(l => l.price > 0);
  if (priced.length < 3) return null;

  // ratio = цена / медиана рынка (меньше 1 = ниже рынка)
  const ratio = new Map();
  for (const l of priced) {
    const m = subMedian(l);
    if (m) ratio.set(l.id, l.price / m);
  }
  // «сладкая зона» цены ценится выше, чем подозрительно дешёвое (часто старая модель)
  const score = l => {
    const r = ratio.get(l.id);
    let s = 0;
    if (r != null) s += r <= 0.7 ? 1.2 : r <= 0.88 ? 2.5 : r <= 1.0 ? 1.7 : r <= 1.12 ? 0.7 : 0;
    s += (l.sellerRating - 3.5) * 1.5;
    if (l.condition === 'new') s += 1.2;
    if (l.hasDelivery) s += 0.8;
    if (getPhotos(l).length) s += 0.5;
    if (hoursAgo(l) < 48) s += 0.6;
    s += Math.log10(l.views + 1) * 0.3;
    return s;
  };
  // обоснование: % ниже рынка показываем только в правдоподобном диапазоне
  const reasonFor = l => {
    const r = ratio.get(l.id);
    if (r != null && r >= 0.75 && r <= 0.92) return t('dec.r.belowMarket').replace('{p}', Math.round((1 - r) * 100));
    if (l.sellerRating >= 4.6) return `★ ${l.sellerRating}`;
    if (l.hasDelivery) return t('ai.q.deliv');
    if (l.condition === 'new') return t('ai.q.new');
    if (r != null && r <= 1.12) return t('dec.r.inMarket');
    if (hoursAgo(l) < 48) return t('dec.r.fresh');
    return t('dec.r.popular').replace('{v}', fmtNum(l.views));
  };

  const usedId = new Set(), usedTitle = new Set();
  const free = () => priced.filter(l => !usedId.has(l.id) && !usedTitle.has(normText(l.title)));
  const reserve = l => { usedId.add(l.id); usedTitle.add(normText(l.title)); };

  const purpose = detectPurpose(raw, f.cat);
  const purposeLabels = {
    camera: t('dec.purpose.camera'), gaming: t('dec.purpose.gaming'),
    work: t('dec.purpose.work'), family: t('dec.purpose.family'), economy: t('dec.purpose.economy'),
  };

  // сначала резервируем «премиум для цели» (топовую модель), чтобы её не забрал «лучший выбор»
  let purposePick = null;
  if (purpose && purpose !== 'economy') {
    const top = [...free()].sort((a, b) => b.price - a.price)[0];
    if (top) { purposePick = { id: top.id, label: purposeLabels[purpose], reason: t('dec.r.top'), kind: 'purpose' }; reserve(top); }
  }
  // лучший выбор — композитный скор среди оставшихся
  let bestPick = null;
  const best = [...free()].sort((a, b) => score(b) - score(a))[0];
  if (best) { bestPick = { id: best.id, label: t('dec.best'), reason: reasonFor(best), kind: 'best' }; reserve(best); }
  // самое выгодное (если не было цели)
  let valuePick = null;
  if (!purposePick) {
    const withR = free().filter(l => ratio.get(l.id) != null && ratio.get(l.id) >= 0.7 && ratio.get(l.id) < 0.95);
    const v = withR.sort((a, b) => ratio.get(a.id) - ratio.get(b.id))[0];
    if (v) { valuePick = { id: v.id, label: t('dec.value'), reason: t('dec.r.belowMarket').replace('{p}', Math.round((1 - ratio.get(v.id)) * 100)), kind: 'value' }; reserve(v); }
  }
  // дешевле всего
  let cheapPick = null;
  const cheap = [...free()].sort((a, b) => a.price - b.price)[0];
  if (cheap) { cheapPick = { id: cheap.id, label: purpose === 'economy' ? purposeLabels.economy : t('dec.cheapest'), reason: t('dec.r.cheapest'), kind: 'cheap' }; reserve(cheap); }

  // порядок показа: лучший → цель/выгодное → дешевле
  const picks = [bestPick, purposePick || valuePick, cheapPick].filter(Boolean);
  return picks.length >= 2 ? picks : null;
}

function aiSearchReply(raw) {
  const parsed = parseSearchQuery(raw);
  const f = { ...defaultFilters(), city: state.city };
  Object.assign(f, parsed.filters);
  f.q = parsed.q;

  let res = applyFilters(f);
  let note = '';

  // лестница смягчений, если по точным условиям пусто
  if (!res.length && f.city !== 'all') {
    const f2 = { ...f, city: 'all' };
    const r2 = applyFilters(f2);
    if (r2.length) { res = r2; Object.assign(f, f2); note = t('ai.relaxCity').replace('{city}', parsed.filters.city || state.city); }
  }
  if (!res.length && f.priceMax) {
    const f2 = { ...f, priceMax: String(Math.round(+f.priceMax * 1.4)) };
    const r2 = applyFilters(f2);
    if (r2.length) { res = r2; Object.assign(f, f2); note = t('ai.relaxPrice').replace('{max}', fmtNum(f2.priceMax)).replace('{som}', t('som')); }
  }
  if (!res.length && f.condition !== 'any') {
    const f2 = { ...f, condition: 'any' };
    const r2 = applyFilters(f2);
    if (r2.length) { res = r2; Object.assign(f, f2); note = t('ai.relaxCond'); }
  }

  if (!res.length) {
    return {
      text: t('ai.nothing'),
      actions: [
        { label: t('ai.a.phones'), act: { type: 'ask', text: 'телефоны' } },
        { label: t('ai.a.cars'), act: { type: 'ask', text: 'авто до 1 млн' } },
        { label: t('ai.a.rent'), act: { type: 'ask', text: 'снять квартиру' } },
      ],
    };
  }

  AI.lastF = f;
  const phrase = aiFilterPhrase(f);
  const n = res.length;
  const isPriceQ = /сколько сто|почем|стоимост|цена/.test(normText(raw));
  let text = note
    ? `${note}: ${nLabel(n)}. ${t('ai.best')}`
    : `${t('ai.found')} ${nLabel(n)}${phrase ? ` (${phrase})` : ''}. ${t('ai.best')}`;

  // вопрос о цене — отвечаем рыночной вилкой, а не просто списком
  if (isPriceQ) {
    const ps = res.map(l => l.price).filter(Boolean);
    if (ps.length) {
      const range = t('ai.priceRange')
        .replace('{min}', fmtNum(Math.min(...ps)))
        .replace('{max}', fmtNum(Math.max(...ps)))
        .replace('{som}', t('som'))
        .replace('{n}', nLabel(ps.length)); // только с ценой — договорные вне вилки
      text = `${note ? note + '. ' : ''}${t('ai.priceFrom')} ${phrase || ''}: ${range}`;
    }
  }

  // «решение, а не список»: выделенные выборы с обоснованием
  const decision = isPriceQ ? null : aiDecision(res, raw, f);
  if (decision) {
    text = note
      ? `${note}: ${nLabel(n)}. ${t('dec.lead')}`
      : `${t('ai.found')} ${nLabel(n)}${phrase ? ` (${phrase})` : ''}. ${t('dec.lead')}`;
  }

  // refine-чипы несут базовые фильтры с собой — переживают перезагрузку страницы
  const actions = [{ label: `${t('ai.showAll')} ${fmtNum(n)} ${t('ai.inSearch')}`, act: { type: 'search', f } }];
  if (f.condition === 'any' && res.some(l => l.condition === 'new')) actions.push({ label: t('ai.onlyNew'), act: { type: 'refine', patch: { condition: 'new' }, base: f } });
  if (f.sort !== 'cheap') actions.push({ label: t('ai.cheaper'), act: { type: 'refine', patch: { sort: 'cheap' }, base: f } });
  if (f.city !== 'all') actions.push({ label: t('ai.allKg'), act: { type: 'refine', patch: { city: 'all' }, base: f } });
  else if (!f.delivery && res.some(l => l.hasDelivery)) actions.push({ label: t('ai.withDeliv'), act: { type: 'refine', patch: { delivery: true }, base: f } });

  if (decision) {
    return { text, decision, moreCount: n - decision.length, actions: actions.slice(0, 3) };
  }
  return { text, items: res.slice(0, 5).map(l => l.id), actions: actions.slice(0, 4) };
}

function aiGiftReply(raw) {
  const parsed = parseSearchQuery(raw);
  const budget = +parsed.filters.priceMax || 30000;
  const s = normText(raw);

  let pools, who;
  if (/ребен|дет|сын|доч|мальчик|девочк/.test(s)) {
    pools = l => l.category === 'kids' || (l.category === 'hobby' && l.subcategory === 'Велосипеды');
    who = t('ai.who.kid');
  } else if (/девушк|жен|мам|сестр/.test(s)) {
    pools = l => (l.category === 'fashion' && ['Аксессуары', 'Женская одежда'].includes(l.subcategory)) || (l.category === 'electronics' && ['Планшеты', 'ТВ и аудио'].includes(l.subcategory));
    who = t('ai.who.her');
  } else if (/парн|муж|пап|брат|друг|дед/.test(s)) {
    pools = l => (l.category === 'electronics' && ['ТВ и аудио', 'Фото и видео'].includes(l.subcategory)) || l.category === 'hobby' || (l.category === 'fashion' && l.subcategory === 'Аксессуары');
    who = t('ai.who.him');
  } else {
    pools = l => ['electronics', 'hobby', 'kids'].includes(l.category);
    who = '';
  }

  // срезаем только сумму с юнитом — «до 1500 девушке» не должно терять адресата
  const BUDGET_RE = /до\s+\d[\d\s]*(?:к|k|тыс[а-яa-z]*|млн[а-яa-z]*|сом[а-я]*)?/i;

  const cands = allListings().filter(l => pools(l) && l.price > 0 && l.price <= budget && getPhotos(l).length && !isSold(l) && !state.reported.has(l.id));
  if (!cands.length) {
    return { text: t('ai.gift.none').replace('{budget}', fmtNum(budget)).replace('{som}', t('som')), actions: [{ label: t('ai.gift.upTo50k'), act: { type: 'ask', text: raw.replace(BUDGET_RE, '').trim() + ' до 50000' } }] };
  }
  const picks = [...cands].sort(() => Math.random() - 0.5).slice(0, 5);
  return {
    text: t('ai.gift.title').replace('{who}', who).replace('{budget}', fmtNum(budget)).replace('{som}', t('som')).replace(/\s+/g, ' ').trim(),
    items: picks.map(l => l.id),
    actions: [
      { label: t('ai.gift.more'), act: { type: 'ask', text: raw } },
      { label: t('ai.cheaper'), act: { type: 'ask', text: raw.replace(BUDGET_RE, '').trim() + ' до ' + Math.max(1000, Math.round(budget * 0.5)) } },
    ],
  };
}

function aiAnswer(raw) {
  const s = normText(raw);

  // приветствие: отвечаем и ДОРАЗБИРАЕМ остаток («привет, есть айфоны?» → поиск)
  const greetM = s.match(/^(привет(?:ик)?|салам(?:атсызбы)?|здравствуй(?:те)?|добр(?:ый|ое) (?:день|вечер|утро)|хай|hello|hi)(?= |$)/);
  if (greetM) {
    const restOfMsg = s.slice(greetM[0].length).trim().replace(/^есть /, '');
    if (restOfMsg) return aiAnswer(restOfMsg);
    return {
      text: t('ai.hi'),
      actions: [
        { label: t('ai.hi.phoneChip'), act: { type: 'ask', text: 'iphone до 60 000' } },
        { label: t('ai.hi.giftChip'), act: { type: 'ask', text: 'что подарить ребёнку' } },
      ],
    };
  }
  if (/(^| )(спасибо|рахмат|благодарю|круто|класс|супер)( |$)/.test(s) && s.split(' ').length <= 3) {
    return { text: t('ai.thanks') };
  }
  if (/кто ты|что ты умеешь|что умеешь|помощь$|^help/.test(s)) {
    return {
      text: t('ai.help'),
      actions: [{ label: t('ai.help.exampleChip'), act: { type: 'ask', text: 'айфон до 60к' } }],
    };
  }
  if (/как (подать|разместить|создать|добавить) объявлени/.test(s)) {
    return {
      text: t('ai.howPost'),
      actions: [{ label: t('post.btnShort'), act: { type: 'goto', hash: '#/post' } }],
    };
  }
  if (/как .*(продать|продается)|продать быстрее/.test(s)) {
    return {
      text: t('ai.sellTips'),
      actions: [{ label: t('post.btnShort'), act: { type: 'goto', hash: '#/post' } }],
    };
  }
  // намерение ПРОДАТЬ — не путать с поиском
  if (/(^| )(продам|продаю|продать|выставить на продажу)( |$)/.test(s)) {
    return {
      text: t('ai.sellIntent'),
      actions: [
        { label: t('post.btnShort'), act: { type: 'goto', hash: '#/post' } },
        { label: t('ai.chip.sellFaster'), act: { type: 'ask', text: 'как продать быстрее' } },
      ],
    };
  }
  if (/подар|сюрприз/.test(s)) return aiGiftReply(raw);

  // «покажи что есть», «что нового» — витрина свежего
  if (/^(покажи )?(что (есть|нового|новенького)|все объявления)$/.test(s)) {
    const fresh = applyFilters({ ...defaultFilters(), city: state.city, period: '1', sort: 'date' });
    return {
      text: t('ai.browse'),
      items: fresh.slice(0, 5).map(l => l.id),
      actions: [
        { label: t('ai.chip.popular'), act: { type: 'search', f: { ...defaultFilters(), city: state.city, sort: 'popular' } } },
        { label: t('ai.chip.phones'), act: { type: 'ask', text: 'телефоны' } },
      ],
    };
  }

  return aiSearchReply(raw);
}

/* ---------- отправка ---------- */

function aiSend() {
  const input = $('#aiInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  aiPush({ role: 'user', text });
  renderAIMessages();
  aiTyping(true);

  setTimeout(() => {
    const reply = aiAnswer(text);
    aiTyping(false);
    aiPush({ role: 'ai', ...reply });
    renderAIMessages();
  }, 650 + Math.random() * 750);
}

function aiRunAction(act) {
  if (!act) return;
  if (act.type === 'ask') {
    $('#aiInput').value = act.text;
    aiSend();
  } else if (act.type === 'goto') {
    closeAI();
    location.hash = act.hash;
  } else if (act.type === 'search') {
    if (window.innerWidth <= 920) closeAI();
    const target = buildSearchHash(act.f);
    if (location.hash === target) { state._appliedQS = null; router(); }
    else location.hash = target;
  } else if (act.type === 'refine') {
    const base = act.base || AI.lastF || { ...defaultFilters(), city: state.city };
    const f = { ...base, ...act.patch };
    const res = applyFilters(f);
    const n = res.length;
    let reply;
    if (n) {
      AI.lastF = f; // фиксируем только удачное уточнение
      reply = {
        text: `${t('ai.refined')}: ${aiFilterPhrase(f) || t('ai.noFilters')} — ${nLabel(n)}:`,
        items: res.slice(0, 5).map(l => l.id),
        actions: [{ label: `${t('ai.showAll')} ${fmtNum(n)}`, act: { type: 'search', f } }],
      };
    } else {
      reply = {
        text: t('ai.refineEmpty'),
        actions: [{ label: t('ai.showPrev'), act: { type: 'refine', patch: {}, base } }],
      };
    }
    aiTyping(true);
    setTimeout(() => { aiTyping(false); aiPush({ role: 'ai', ...reply }); renderAIMessages(); }, 500);
  }
}

/* ---------- слушатели ---------- */

document.addEventListener('click', e => {
  if (e.target.closest('#aiFab')) { openAI(); return; }
  if (e.target.closest('[data-ai-close]')) { closeAI(); return; }
  if (e.target.closest('[data-ai-clear]')) {
    AI.history = [];
    aiPush({ role: 'ai', text: t('ai.greeting') });
    renderAIMessages();
    return;
  }
  const ask = e.target.closest('[data-ai-ask]');
  if (ask) {
    hideSuggest();
    openAI(ask.dataset.aiAsk || undefined);
    return;
  }
  if (e.target.closest('[data-ai-send]')) { aiSend(); return; }
  const chip = e.target.closest('[data-ai-act]');
  if (chip) {
    const [mi, ai] = chip.dataset.aiAct.split(':').map(Number);
    aiRunAction(AI.history[mi]?.actions?.[ai]?.act);
    return;
  }
  if (e.target.closest('.ai-item') && window.innerWidth <= 920) closeAI();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'aiInput') aiSend();
  if (e.key === 'Escape') closeAI();
});

/* первый визит — лёгкая пульсация кнопки */
if (!lsLoad('bazar_ai_seen', false)) {
  $('#aiFab').classList.add('pulse');
}

/* кроссинг брейкпоинта: на десктопе панель плавает (лок не нужен),
   на мобиле открытая панель — полноэкранный шит (лок обязателен) */
onMediaChange('(min-width: 921px)', e => {
  const open = !$('#aiPanel').hidden;
  if (e.matches) unlockScroll('ai');
  else if (open) lockScroll('ai');
});

/* быстрые подсказки в панели (зависят от языка) */
function renderAIQuick() {
  const quick = $('#aiQuick');
  if (!quick) return;
  const items = t('ai.quick') || [];
  quick.innerHTML = items.map(q => `<button class="fchip" data-ai-ask="${esc(q)}">${esc(q)}</button>`).join('');
}
renderAIQuick();

/* смена языка: обновить чипы и приветствие, если диалог ещё не начат */
function aiOnLangChange() {
  renderAIQuick();
  if (AI.history.length === 1 && AI.history[0].role === 'ai') {
    AI.history[0].text = t('ai.greeting');
    aiSaveHistory();
    renderAIMessages();
  }
}
