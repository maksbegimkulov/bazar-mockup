/* ============================================================
   BAZAR — аналитика ключевых действий (бесплатно, self-contained).
   track(event, props) пишет событие в кольцевой буфер localStorage.
   Экран #/analytics — обзор для владельца: воронка, топ-запросы, по дням.
   ЧЕСТНО: пока ЛОКАЛЬНО (по устройству). Для реальной кросс-юзер аналитики
   в track() добавляется fire-and-forget отправка в приёмник (таблица Supabase
   / Plausible) — инструментирование событий уже готово, менять только сток.
   ============================================================ */
(function () {
  'use strict';
  var LS = 'bazar_events';
  var CAP = 1000;

  function load() { try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(LS, JSON.stringify(a.slice(-CAP))); } catch (e) {} }

  window.track = function (ev, props) {
    if (!ev) return;
    var a = load();
    a.push(Object.assign({ e: ev, ts: Date.now() }, props || {}));
    save(a);
    // TODO(сток): если появится приёмник — здесь fire-and-forget insert.
  };

  var LBL = {
    ru: { title: 'Аналитика платформы', sub: 'Локально по этому устройству — основа под серверный сбор', total: 'событий', days: 'дней активности', funnel: 'Воронка', fSearch: 'Поиски', fView: 'Открытий товара', fContact: 'Контактов с продавцом', fPublish: 'Публикаций', conv: 'конверсия', topq: 'Топ запросов', byday: 'По дням (7 дней)', types: 'Типы событий', empty: 'Событий пока нет — попользуйтесь приложением, и здесь появится статистика.', reset: 'Очистить статистику' },
    en: { title: 'Platform analytics', sub: 'Local to this device — foundation for server-side collection', total: 'events', days: 'active days', funnel: 'Funnel', fSearch: 'Searches', fView: 'Item views', fContact: 'Seller contacts', fPublish: 'Listings posted', conv: 'conversion', topq: 'Top queries', byday: 'By day (7 days)', types: 'Event types', empty: 'No events yet — use the app and stats will appear here.', reset: 'Clear stats' },
    ky: { title: 'Платформа аналитикасы', sub: 'Ушул түзмөктө локалдуу — сервердик чогултууга негиз', total: 'окуя', days: 'активдүү күн', funnel: 'Воронка', fSearch: 'Издөөлөр', fView: 'Товар ачылды', fContact: 'Сатуучу менен байланыш', fPublish: 'Жарыялоолор', conv: 'конверсия', topq: 'Топ суроо-талаптар', byday: 'Күндөр боюнча (7 күн)', types: 'Окуя түрлөрү', empty: 'Азырынча окуя жок — колдонсоңуз, статистика чыгат.', reset: 'Тазалоо' },
  };

  var IC = function (n, o) { return (typeof icon === 'function') ? icon(n, o) : ''; };

  function bar(label, value, max, cls) {
    var pct = max > 0 ? Math.round(value / max * 100) : 0;
    return '<div class="an-bar-row"><span class="an-bar-lbl">' + label + '</span>' +
      '<span class="an-bar-track"><span class="an-bar-fill ' + (cls || '') + '" style="width:' + Math.max(pct, value > 0 ? 4 : 0) + '%"></span></span>' +
      '<span class="an-bar-val">' + value + '</span></div>';
  }

  window.renderAnalytics = function () {
    var app = document.getElementById('app');
    var L = LBL[window.LANG || 'ru'] || LBL.ru;
    var ev = load();
    if (!ev.length) {
      app.innerHTML = '<div class="page-head"><h1>' + L.title + '</h1></div>' +
        (typeof emptyHTML === 'function' ? emptyHTML('chart', L.title, L.empty) : '<p>' + L.empty + '</p>');
      return;
    }
    var by = {};
    ev.forEach(function (e) { by[e.e] = (by[e.e] || 0) + 1; });
    var searches = by.search || 0, views = by.item_view || 0;
    var contacts = (by.contact_write || 0) + (by.contact_call || 0);
    var publishes = by.sell_publish || 0;
    var fmax = Math.max(searches, views, contacts, publishes, 1);

    // топ-запросы
    var qc = {};
    ev.filter(function (e) { return e.e === 'search' && e.q; }).forEach(function (e) { var q = String(e.q).trim().toLowerCase(); if (q) qc[q] = (qc[q] || 0) + 1; });
    var topq = Object.keys(qc).sort(function (a, b) { return qc[b] - qc[a]; }).slice(0, 5);
    var qmax = topq.length ? qc[topq[0]] : 1;

    // по дням (7)
    var DAY = 86400000, now = Date.now();
    var days = [];
    for (var i = 6; i >= 0; i--) { var d0 = now - i * DAY; days.push({ d: new Date(d0), n: 0 }); }
    ev.forEach(function (e) { var idx = 6 - Math.floor((now - e.ts) / DAY); if (idx >= 0 && idx < 7) days[idx].n++; });
    var dmax = Math.max.apply(null, days.map(function (x) { return x.n; }).concat([1]));
    var uniqDays = new Set(ev.map(function (e) { return new Date(e.ts).toDateString(); })).size;
    var WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

    var conv = views > 0 ? Math.round(contacts / views * 100) : 0;

    app.innerHTML =
      '<div class="page-head"><h1>' + L.title + '</h1></div>' +
      '<p class="an-sub">' + L.sub + '</p>' +
      '<div class="an-stat-row">' +
        '<div class="an-stat"><span class="an-stat-n">' + ev.length + '</span><span class="an-stat-l">' + L.total + '</span></div>' +
        '<div class="an-stat"><span class="an-stat-n">' + uniqDays + '</span><span class="an-stat-l">' + L.days + '</span></div>' +
        '<div class="an-stat"><span class="an-stat-n">' + conv + '%</span><span class="an-stat-l">' + L.conv + '</span></div>' +
      '</div>' +
      '<div class="panel"><h2>' + IC('chart', { size: 18 }) + ' ' + L.funnel + '</h2><div class="an-bars">' +
        bar(L.fSearch, searches, fmax, 'b-accent') +
        bar(L.fView, views, fmax, 'b-accent') +
        bar(L.fContact, contacts, fmax, 'b-ai') +
        bar(L.fPublish, publishes, fmax, 'b-ok') +
      '</div></div>' +
      (topq.length ? '<div class="panel"><h2>' + IC('search', { size: 18 }) + ' ' + L.topq + '</h2><div class="an-bars">' +
        topq.map(function (q) { return bar(esc(q), qc[q], qmax, 'b-accent'); }).join('') + '</div></div>' : '') +
      '<div class="panel"><h2>' + IC('clock', { size: 18 }) + ' ' + L.byday + '</h2><div class="an-days">' +
        days.map(function (x) { var h = Math.round(x.n / dmax * 100); return '<div class="an-day"><span class="an-day-bar" style="height:' + Math.max(h, x.n > 0 ? 6 : 2) + '%"></span><span class="an-day-lbl">' + WD[x.d.getDay()] + '</span><span class="an-day-n">' + x.n + '</span></div>'; }).join('') +
      '</div></div>' +
      '<button class="btn btn-danger-soft btn-block" data-action="analytics-reset">' + IC('trash', { size: 16 }) + ' ' + L.reset + '</button>';
  };

  window.analyticsReset = function () { try { localStorage.removeItem(LS); } catch (e) {} if (typeof renderAnalytics === 'function') renderAnalytics(); };

  // если страница открыта СРАЗУ на #/analytics — стартовый router() app.js мог
  // сработать до загрузки этого файла (renderAnalytics был не определён →
  // фолбэк на главную). До-рендерим теперь, когда функция готова.
  try {
    if (typeof parseHash === 'function' && /^\/analytics/.test(parseHash().path || '')) renderAnalytics();
  } catch (e) {}
})();
