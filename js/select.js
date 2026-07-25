/* ============================================================
   BAZAR — кастомный dropdown (единый на iOS/Android).
   ПОЧЕМУ: нативный <select> открывается по-разному — на iOS барабан-пикер
   снизу, на Android выпадающий список/диалог. Это ломает «одинаково везде».

   ПОДХОД (прогрессивное улучшение, минимум риска): нативный <select> остаётся
   в DOM как ИСТОЧНИК СОСТОЯНИЯ (его читают/пишут обработчики change по всему
   app.js, включая делегирование на #fAttrs/#pAttrs). Мы лишь прячем его
   визуально и рисуем поверх свой триггер + панель. Выбор опции пишет
   select.value и диспатчит bubbling 'change' → все существующие обработчики
   срабатывают без единой правки. Панель одинаковая на обеих платформах:
   bottom-sheet на телефоне, popover на десктопе.
   ============================================================ */
(function () {
  'use strict';
  var open = null; // {sel, trigger, valueEl, layer}

  function selText(sel) {
    var o = sel.options[sel.selectedIndex];
    return o ? o.textContent : '';
  }
  function isMobile() { return window.matchMedia('(max-width: 720px)').matches; }

  function close() {
    if (!open) return;
    if (open.layer && open.layer.parentNode) open.layer.parentNode.removeChild(open.layer);
    if (open.trigger) open.trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKey, true);
    open = null;
  }
  function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }

  function choose(sel, valueEl, value) {
    if (sel.value !== value) {
      sel.value = value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (valueEl) valueEl.textContent = selText(sel);
    close();
  }

  function buildList(sel, valueEl) {
    var list = document.createElement('div');
    list.className = 'cs-list';
    Array.prototype.forEach.call(sel.options, function (o) {
      if (o.disabled || o.hidden) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cs-opt' + (o.value === sel.value ? ' sel' : '');
      b.setAttribute('role', 'option');
      b.textContent = o.textContent;
      b.addEventListener('click', function () { choose(sel, valueEl, o.value); });
      list.appendChild(b);
    });
    return list;
  }

  function openFor(cs) {
    if (open) close();
    var sel = cs.sel, mobile = isMobile();
    var layer = document.createElement('div');
    var panel = document.createElement('div');
    panel.className = 'cs-panel';
    panel.setAttribute('role', 'listbox');

    if (mobile) {
      layer.className = 'cs-backdrop';
      panel.classList.add('cs-sheet');
      var head = document.createElement('div');
      head.className = 'cs-sheet-head';
      head.textContent = cs.label || '';
      panel.appendChild(head);
      panel.appendChild(buildList(sel, cs.valueEl));
      layer.appendChild(panel);
      layer.addEventListener('click', function (e) { if (e.target === layer) close(); });
      document.body.appendChild(layer);
    } else {
      // popover под триггером — позиционируем абсолютно в общем слое
      layer.className = 'cs-layer';
      panel.classList.add('cs-pop');
      panel.appendChild(buildList(sel, cs.valueEl));
      layer.appendChild(panel);
      layer.addEventListener('mousedown', function (e) { if (e.target === layer) close(); });
      document.body.appendChild(layer);
      var r = cs.trigger.getBoundingClientRect();
      panel.style.left = Math.round(r.left) + 'px';
      panel.style.width = Math.round(r.width) + 'px';
      var below = window.innerHeight - r.bottom;
      var maxH = Math.min(320, Math.max(below, r.top) - 16);
      panel.style.maxHeight = maxH + 'px';
      if (below < 240 && r.top > below) {
        panel.style.bottom = Math.round(window.innerHeight - r.top + 6) + 'px';
      } else {
        panel.style.top = Math.round(r.bottom + 6) + 'px';
      }
    }
    cs.trigger.setAttribute('aria-expanded', 'true');
    open = { sel: sel, trigger: cs.trigger, valueEl: cs.valueEl, layer: layer };
    document.addEventListener('keydown', onKey, true);
    var selOpt = panel.querySelector('.cs-opt.sel');
    if (selOpt) selOpt.scrollIntoView({ block: 'nearest' });
  }

  function enhance(sel) {
    if (!sel || sel.dataset.cs === '1' || sel.multiple) return;
    sel.dataset.cs = '1';

    var inline = /\bsort-select\b/.test(sel.className);
    var wrap = document.createElement('span');
    wrap.className = 'cs ' + (inline ? 'cs-inline' : 'cs-block');
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);

    var trigger = document.createElement('button');
    trigger.type = 'button';
    // класс исходного select → триггер выглядит идентично закрытому select
    trigger.className = 'cs-trigger ' + sel.className;
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    var valueEl = document.createElement('span');
    valueEl.className = 'cs-value';
    valueEl.textContent = selText(sel);
    trigger.appendChild(valueEl);
    wrap.appendChild(trigger);

    // подпись для шапки мобильного шита — из ближайшего .fblock-label / label
    var lbl = '';
    var block = sel.closest ? sel.closest('.fblock, .fgroup, .setting-row, label') : null;
    if (block) { var le = block.querySelector('.fblock-label, .flabel, .setting-label'); if (le) lbl = le.textContent.trim(); }

    var cs = { sel: sel, trigger: trigger, valueEl: valueEl, label: lbl };
    trigger.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (open && open.sel === sel) { close(); return; }
      openFor(cs);
    });

    // прячем нативный select (остаётся для состояния/доступности)
    sel.setAttribute('tabindex', '-1');
    sel.setAttribute('aria-hidden', 'true');

    // опции могут перезаписываться программно (fSub при смене категории) —
    // держим текст триггера в синхроне
    var mo = new MutationObserver(function () { valueEl.textContent = selText(sel); });
    mo.observe(sel, { childList: true });
    sel.addEventListener('change', function () { valueEl.textContent = selText(sel); });
  }

  function enhanceAll(root) {
    (root || document).querySelectorAll('select:not([data-cs])').forEach(enhance);
  }

  // первичный проход + наблюдение за появлением новых select после ре-рендеров
  var pending = false;
  function schedule() {
    if (pending) return; pending = true;
    (window.requestAnimationFrame || setTimeout)(function () { pending = false; enhanceAll(); });
  }
  function init() {
    enhanceAll();
    var bodyMo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].addedNodes && muts[i].addedNodes.length) { schedule(); return; }
      }
    });
    bodyMo.observe(document.body, { childList: true, subtree: true });
    // при смене ориентации/ресайза закрываем открытую панель (позиция устареет)
    window.addEventListener('resize', close);
    window.addEventListener('hashchange', close);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.enhanceSelects = enhanceAll;
})();
