/* ============================================================
   BAZAR — установка PWA как приложения (бесплатно, без стора).
   Android/Chrome: нативный prompt через сохранённое beforeinstallprompt.
   iOS Safari: инструкция «Поделиться → На экран „Домой"».
   Ненавязчиво: одноразовый баннер (запоминаем отклонение) + кнопка в профиле.
   ============================================================ */
(function () {
  'use strict';
  var LS_DISMISS = 'bazar_install_dismissed';

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream; }
  function isIOSSafari() { return isIOS() && /^((?!crios|fxios|edgios|opios).)*safari/i.test(navigator.userAgent); }
  function canPrompt() { return !!window._bipEvent; }
  function installed() { return isStandalone(); }
  function eligible() { return !installed() && (canPrompt() || isIOSSafari()); }

  function txt() {
    var lg = window.LANG || 'ru';
    return ({
      ru: { title: 'Установите приложение BAZAR', sub: 'Быстрый доступ с экрана, работает офлайн', btn: 'Установить', later: 'Позже', iosT: 'Как установить на iPhone', iosP: 'Нажмите «Поделиться» внизу Safari, затем выберите «На экран „Домой"».', ok: 'Понятно', done: 'Приложение установлено' },
      en: { title: 'Install the BAZAR app', sub: 'Home-screen access, works offline', btn: 'Install', later: 'Later', iosT: 'Install on iPhone', iosP: 'Tap Share at the bottom of Safari, then choose "Add to Home Screen".', ok: 'Got it', done: 'App installed' },
      ky: { title: 'BAZAR тиркемесин орнотуңуз', sub: 'Экрандан тез кирүү, офлайн иштейт', btn: 'Орнотуу', later: 'Кийин', iosT: 'iPhone-го орнотуу', iosP: '«Бөлүшүү» → «Башкы экранга кошуу».', ok: 'Түшүндүм', done: 'Тиркеме орнотулду' },
    })[lg] || { title: 'Установите приложение BAZAR', sub: 'Быстрый доступ с экрана, работает офлайн', btn: 'Установить', later: 'Позже', iosT: 'Как установить', iosP: '«Поделиться» → «На экран „Домой"».', ok: 'Понятно', done: 'Установлено' };
  }

  var ICN = function (n, o) { return (typeof icon === 'function') ? icon(n, o) : ''; };

  /* запустить установку: Android — нативный prompt; iOS — инструкция */
  function doInstall() {
    var T = txt();
    if (canPrompt()) {
      var e = window._bipEvent;
      e.prompt();
      e.userChoice.then(function () { window._bipEvent = null; hideBanner(); });
      return;
    }
    if (isIOSSafari()) {
      if (typeof openModal === 'function') {
        openModal('<h3>' + ICN('share', { size: 18 }) + ' ' + T.iosT + '</h3>' +
          '<p class="modal-text">' + T.iosP + '</p>' +
          '<div class="modal-actions"><button class="btn btn-primary btn-block" data-action="modal-close">' + T.ok + '</button></div>');
      } else if (typeof showToast === 'function') { showToast(T.iosP); }
      hideBanner();
    }
  }

  /* одноразовый ненавязчивый баннер снизу */
  function showBanner() {
    if (document.getElementById('installBanner')) return;
    var T = txt();
    var b = document.createElement('div');
    b.id = 'installBanner';
    b.className = 'install-banner';
    b.innerHTML =
      '<span class="ib-ico">' + ICN('box', { size: 22 }) + '</span>' +
      '<span class="ib-text"><span class="ib-title">' + T.title + '</span><span class="ib-sub">' + T.sub + '</span></span>' +
      '<button class="btn btn-primary btn-sm ib-go">' + T.btn + '</button>' +
      '<button class="ib-x" aria-label="' + T.later + '">' + ICN('close', { size: 18 }) + '</button>';
    document.body.appendChild(b);
    b.querySelector('.ib-go').addEventListener('click', doInstall);
    b.querySelector('.ib-x').addEventListener('click', function () {
      localStorage.setItem(LS_DISMISS, '1'); hideBanner();
    });
    requestAnimationFrame(function () { b.classList.add('show'); });
  }
  function hideBanner() {
    var b = document.getElementById('installBanner');
    if (b) { b.classList.remove('show'); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 260); }
  }

  function maybeOfferBanner() {
    if (localStorage.getItem(LS_DISMISS) === '1') return;
    if (!eligible()) return;
    // не сразу — дать осмотреться (ненавязчиво), только на главной
    setTimeout(function () {
      if (eligible() && localStorage.getItem(LS_DISMISS) !== '1' && (location.hash === '' || location.hash === '#/' || location.hash === '#')) showBanner();
    }, 3500);
  }

  // публичный API (для кнопки в профиле)
  window.bzInstall = {
    eligible: eligible,
    installed: installed,
    isIOS: isIOS,
    prompt: doInstall,
    rowHTML: function () {
      if (installed()) return '';
      if (!eligible()) return '';
      var T = txt();
      return '<button class="btn btn-secondary btn-block install-row-btn" data-action="pwa-install">' +
        ICN('box', { size: 18 }) + ' ' + T.title + '</button>';
    },
  };

  // событие: стало установимым (beforeinstallprompt пришёл после загрузки)
  window.addEventListener('bz-installable', maybeOfferBanner);
  if (document.readyState === 'complete' || document.readyState === 'interactive') maybeOfferBanner();
  else window.addEventListener('DOMContentLoaded', maybeOfferBanner);
})();
