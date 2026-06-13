/* ============================================================
   BAZAR mockup — Айка, ИИ-консультант
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
    ${photos.length ? `<img src="${photos[0]}" alt="">` : '<div class="thumb-fallback" style="width:56px;height:44px">📷</div>'}
    <span class="ai-item-info">
      <span class="ai-item-title">${esc(l.title)}</span>
      <span class="ai-item-meta">${l.negotiable ? t('price.negotiable') : fmtNum(l.price) + ' ' + t('som') + esc(l.priceSuffix)} · ${esc(l.city)}</span>
    </span>
    <span class="ai-item-arrow">›</span>
  </a>`;
}

function aiMsgHTML(m, idx) {
  let items = (m.items || []).map(aiItemHTML).join('');
  // объявления из старой переписки могли быть удалены
  if (!items && m.items && m.items.length) items = `<div class="ai-stale">${t('ai.staleItems')}</div>`;
  const actions = (m.actions || []).map((a, i) =>
    `<button class="fchip ai-chip" data-ai-act="${idx}:${i}">${esc(a.label)}</button>`).join('');
  return `
  <div class="ai-msg ${m.role}">
    ${m.role === 'ai' ? '<span class="ai-avatar">✨</span>' : ''}
    <div class="ai-bubble">
      <div class="ai-text">${esc(m.text).replace(/\n/g, '<br>')}</div>
      ${items ? `<div class="ai-items">${items}</div>` : ''}
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
  let text = note
    ? `${note}: ${nLabel(n)}. ${t('ai.best')}`
    : `${t('ai.found')} ${nLabel(n)}${phrase ? ` (${phrase})` : ''}. ${t('ai.best')}`;

  // вопрос о цене — отвечаем рыночной вилкой, а не просто списком
  if (/сколько сто|почем|стоимост|цена/.test(normText(raw))) {
    const ps = res.map(l => l.price).filter(Boolean);
    if (ps.length) {
      const range = t('ai.priceRange')
        .replace('{min}', fmtNum(Math.min(...ps)))
        .replace('{max}', fmtNum(Math.max(...ps)))
        .replace('{som}', t('som'))
        .replace('{n}', nLabel(n));
      text = `${t('ai.priceFrom')} ${phrase || ''}: ${range}`;
    }
  }

  // refine-чипы несут базовые фильтры с собой — переживают перезагрузку страницы
  const actions = [{ label: `${t('ai.showAll')} ${fmtNum(n)} ${t('ai.inSearch')}`, act: { type: 'search', f } }];
  if (f.condition === 'any' && res.some(l => l.condition)) actions.push({ label: t('ai.onlyNew'), act: { type: 'refine', patch: { condition: 'new' }, base: f } });
  if (f.sort !== 'cheap') actions.push({ label: t('ai.cheaper'), act: { type: 'refine', patch: { sort: 'cheap' }, base: f } });
  if (f.city !== 'all') actions.push({ label: t('ai.allKg'), act: { type: 'refine', patch: { city: 'all' }, base: f } });
  else if (!f.delivery && res.some(l => l.hasDelivery)) actions.push({ label: t('ai.withDeliv'), act: { type: 'refine', patch: { delivery: true }, base: f } });

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

  const cands = allListings().filter(l => pools(l) && l.price > 0 && l.price <= budget && getPhotos(l).length);
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
matchMedia('(min-width: 921px)').addEventListener('change', e => {
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
