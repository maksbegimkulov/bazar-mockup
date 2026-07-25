/* ============================================================
   BAZAR — единая система иконок (SVG).
   ПОЧЕМУ: эмодзи рисуются системным шрифтом платформы (Apple Color Emoji
   на iOS, Noto на Android) → категории/бейджи/статусы выглядят ЗАМЕТНО
   по-разному. SVG-иконки рендерятся движком браузера ОДИНАКОВО на iOS и
   Android. Это же — фирменная иконография BAZAR (единый стиль: контур,
   толщина штриха 1.9, скруглённые концы).

   API: icon(name, opts?) → строка <svg>. opts: {size=24, cls='', stroke=1.9,
        fill=false}. Неизвестное имя → нейтральная иконка-тег (fallback),
        поэтому вызов НИКОГДА не ломает разметку.
   ============================================================ */
(function () {
  'use strict';

  /* пути рисуются в системе координат 24×24, currentColor, контур */
  var P = {
    /* ---- категории (верхний уровень) ---- */
    electronics: '<rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M10.5 18.5h3"/>',
    transport: '<path d="M3 13l1.6-4.8A2 2 0 0 1 6.5 6.8h11A2 2 0 0 1 19.4 8.2L21 13v5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1H6.5v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3.4 13h17.2"/><circle cx="7" cy="16" r="1.1"/><circle cx="17" cy="16" r="1.1"/>',
    realty: '<path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
    fashion: '<path d="M12 4.5a2 2 0 1 0 1.7 3"/><path d="M12 8l8.5 4.8a1 1 0 0 1 .5.9V15a1 1 0 0 1-1 1h-2v3.5a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V16H5a1 1 0 0 1-1-1v-.3a1 1 0 0 1 .5-.9z"/>',
    home: '<path d="M3 10.5V17a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6.5"/><path d="M3 12.5v-1a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1"/><path d="M6 9.5V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1.5"/><path d="M5 18v1.5M19 18v1.5"/>',
    services: '<path d="M14.5 6.2a3.6 3.6 0 0 0-4.9 4.6L4 16.4 7.6 20l5.6-5.6a3.6 3.6 0 0 0 4.6-4.9l-2.3 2.3-2-2z"/>',
    jobs: '<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"/><path d="M3 12.5h18"/>',
    animals: '<circle cx="7" cy="9" r="1.8"/><circle cx="12" cy="7" r="1.9"/><circle cx="17" cy="9" r="1.8"/><path d="M12 12.5c-2.6 0-4.8 2-4.8 4.1 0 1.4 1.1 2.2 2.5 2.2 .9 0 1.6-.4 2.3-.4s1.4.4 2.3.4c1.4 0 2.5-.8 2.5-2.2 0-2.1-2.2-4.1-4.8-4.1z"/>',
    kids: '<circle cx="12" cy="13" r="6"/><circle cx="6.5" cy="7.5" r="2"/><circle cx="17.5" cy="7.5" r="2"/><circle cx="10" cy="12.5" r="0.6" fill="currentColor" stroke="none"/><circle cx="14" cy="12.5" r="0.6" fill="currentColor" stroke="none"/><path d="M10.3 15.5c.5.5 2.9.5 3.4 0"/>',
    hobby: '<circle cx="12" cy="12" r="8.2"/><path d="M12 3.8v3.4M12 16.8v3.4M3.8 12h3.4M16.8 12h3.4M6 6l2.4 2.4M18 6l-2.4 2.4M6 18l2.4-2.4M18 18l-2.4-2.4"/><circle cx="12" cy="12" r="2.4"/>',

    /* ---- подкатегории (частые) ---- */
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M10.5 18.5h3"/>',
    laptop: '<rect x="4" y="5.5" width="16" height="10.5" rx="1.6"/><path d="M2.5 19h19l-1-2.8H3.5z"/>',
    tv: '<rect x="3" y="5" width="18" height="12" rx="1.8"/><path d="M8.5 20.5h7M12 17v3.5"/>',
    camera: '<rect x="3" y="7" width="18" height="12.5" rx="2"/><path d="M8.5 7l1.3-2.3h4.4L15.5 7"/><circle cx="12" cy="13.3" r="3.4"/>',
    tablet: '<rect x="5.5" y="3" width="13" height="18" rx="2.2"/><path d="M11 18h2"/>',
    appliance: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="13" r="4.6"/><path d="M8.5 6.2h3"/>',
    car: '<path d="M3 13l1.6-4.8A2 2 0 0 1 6.5 6.8h11A2 2 0 0 1 19.4 8.2L21 13v5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1H6.5v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3.4 13h17.2"/><circle cx="7" cy="16" r="1.1"/><circle cx="17" cy="16" r="1.1"/>',
    moto: '<circle cx="5.5" cy="16.5" r="3"/><circle cx="18.5" cy="16.5" r="3"/><path d="M5.5 16.5l3.5-5h5l2 3M9 11.5l-1.5-3H5M14 8.5h3.5l1.5 5"/>',
    truck: '<path d="M3 6.5h11v10H3z"/><path d="M14 10h4l3 3v3.5h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
    parts: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v2.6M12 17.9v2.6M20.5 12h-2.6M6.1 12H3.5M18 6l-1.8 1.8M7.8 16.2 6 18M18 18l-1.8-1.8M7.8 7.8 6 6"/>',
    building: '<rect x="5" y="3" width="14" height="18" rx="1.4"/><path d="M9 7h2M13 7h2M9 10.5h2M13 10.5h2M9 14h2M13 14h2M10 21v-3.5h4V21"/>',
    store: '<path d="M4 9.5V20h16V9.5"/><path d="M3 5.5h18l-.7 3.2a2.3 2.3 0 0 1-4.5 0 2.3 2.3 0 0 1-4.5 0 2.3 2.3 0 0 1-4.5 0L3 5.5z"/><path d="M9.5 20v-5h5v5"/>',
    shirt: '<path d="M8 4.5 4 7l1.8 3L8 8.8V20h8V8.8L18.2 10 20 7l-4-2.5-1.2 1.6a3 3 0 0 1-5.6 0z"/>',
    shoe: '<path d="M3 15.5V9l3.5.5 2 2.5 4 1.5 6.5 1.8a2 2 0 0 1 1.5 2v1.2H3z"/>',
    bag: '<path d="M6 8.5h12l1 11.5H5z"/><path d="M8.7 8.5V7a3.3 3.3 0 0 1 6.6 0v1.5"/>',
    sofa: '<path d="M4 12v-1.5a2.5 2.5 0 0 1 5 0V13h6v-2.5a2.5 2.5 0 0 1 5 0V12"/><path d="M3 13a2 2 0 0 1 2 2v2h14v-2a2 2 0 0 1 2-2 2 2 0 0 1 2 2v2.5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V15a2 2 0 0 1 2-2z"/><path d="M5 19.5V21M19 19.5V21"/>',
    tools: '<path d="M14.5 6.2a3.6 3.6 0 0 0-4.9 4.6L4 16.4 7.6 20l5.6-5.6a3.6 3.6 0 0 0 4.6-4.9l-2.3 2.3-2-2z"/>',
    kitchen: '<path d="M6 3v6a2 2 0 0 0 4 0V3M8 9v12"/><path d="M16 3c-1.4 0-2.3 1.6-2.3 4s.9 3.5 2.3 3.5V21"/>',
    plant: '<path d="M12 20v-7"/><path d="M12 13c0-3 2-5.5 5-5.5 0 3-2 5.5-5 5.5z"/><path d="M12 15c0-2.6-1.8-4.8-4.5-4.8 0 2.6 1.8 4.8 4.5 4.8z"/><path d="M8.5 20h7"/>',
    bike: '<circle cx="6" cy="16" r="3.4"/><circle cx="18" cy="16" r="3.4"/><path d="M6 16l4-7h5M9 9h4l3 7M14.5 9l-1-2.5H11.5"/>',
    dumbbell: '<path d="M3 9.5v5M6 7.5v9M18 7.5v9M21 9.5v5M6 12h12"/>',
    toy: '<rect x="4" y="12" width="7.5" height="7.5" rx="1.2"/><rect x="13" y="12" width="7" height="7" rx="1.2"/><path d="M8 12V9a4 4 0 0 1 8 0v3"/>',
    stroller: '<path d="M4 6h2l1.5 7"/><path d="M6.5 13a6 6 0 0 1 6-6h2a1 1 0 0 1 1 1v5z"/><path d="M6.5 13h11"/><circle cx="9" cy="18" r="1.8"/><circle cx="16" cy="18" r="1.8"/>',
    music: '<circle cx="7" cy="17" r="2.6"/><path d="M9.6 17V6l9-2v9"/><circle cx="16" cy="15" r="2.6"/><path d="M9.6 8.5l9-2"/>',
    camping: '<path d="M12 4 3 19h18z"/><path d="M12 8v11"/><path d="M9 19l3-4 3 4"/>',

    /* ---- интерфейс / статусы ---- */
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7"/>',
    moon: '<path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5z"/>',
    auto: '<circle cx="12" cy="12" r="8.2"/><path d="M12 3.8a8.2 8.2 0 0 0 0 16.4z" fill="currentColor" stroke="none"/>',
    shield: '<path d="M12 3l7 2.5v5.5c0 4.6-3 7.9-7 9.5-4-1.6-7-4.9-7-9.5V5.5z"/><path d="M9 12l2 2 4-4"/>',
    thumb: '<path d="M7 10.5V20H4a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1z"/><path d="M7 11l3.5-7a2 2 0 0 1 2 1.5l-.7 4h5.3a2 2 0 0 1 2 2.4l-1.3 6.2a2 2 0 0 1-2 1.4H7"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
    info: '<circle cx="12" cy="12" r="8.4"/><path d="M12 11v5"/><circle cx="12" cy="8" r="0.7" fill="currentColor" stroke="none"/>',
    warning: '<path d="M12 3.5 21 19H3z"/><path d="M12 9.5v4.2"/><circle cx="12" cy="16.7" r="0.7" fill="currentColor" stroke="none"/>',
    message: '<path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.2V16.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"/>',
    handshake: '<path d="M3 9l3.5-2.5L12 8l5.5-1.5L21 9v6l-3 1.5-3.5-3M12 8v3l-2.5 2.5a1.4 1.4 0 0 1-2-2L11 8"/>',
    pricedown: '<path d="M3 6.5h18M3 6.5l6.5 7v5l4 2v-7L21 6.5"/><path d="M18 15.5v4M18 19.5l-2-2M18 19.5l2-2" stroke-width="1.7"/>',
    bell: '<path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 8-2.5 8h17S18 15 18 9"/><path d="M13.5 20a2 2 0 0 1-3 0"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8l1.3 2.2 2.5-.4.6 2.5 2.3 1.1-1 2.3 1 2.3-2.3 1.1-.6 2.5-2.5-.4L12 21.2l-1.3-2.2-2.5.4-.6-2.5-2.3-1.1 1-2.3-1-2.3 2.3-1.1.6-2.5 2.5.4z"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
    starfill: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" fill="currentColor" stroke="none"/>',
    check: '<path d="M4.5 12.5l5 5 10-11"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    fire: '<path d="M12 3c1 3-1.5 4-1.5 6.5a3 3 0 0 0 6 0c0-1 .5-2 .5-2 1.5 2 2.5 3.6 2.5 6a7.5 7.5 0 0 1-15 0c0-4 3.5-5.5 3.5-9C9 6 11 5 12 3z"/>',
    tag: '<path d="M4 4.5h7l9 9-6.5 6.5-9-9z"/><circle cx="8.5" cy="8.5" r="1.4"/>',
    box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
    chevron: '<path d="M9 5l7 7-7 7"/>',
    heart: '<path d="M12 20.5C8 17 3 13.2 3 8.8A4.8 4.8 0 0 1 12 6.3 4.8 4.8 0 0 1 21 8.8c0 4.4-5 8.2-9 11.7z"/>',
    location: '<path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    clock: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.5V12l3 2"/>',
    delivery: '<path d="M3 7h11v9H3z"/><path d="M14 10h3.5l2.5 2.5V16H14z"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/>',
    eye: '<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.6"/>',
    scale: '<path d="M12 4v16M7 20h10M6 7l-3 6a3 3 0 0 0 6 0zM18 7l-3 6a3 3 0 0 0 6 0zM6 7l6-1.5L18 7"/>',
    flag: '<path d="M6 3v18M6 4h11l-2 3.5 2 3.5H6"/>',
    call: '<path d="M6.5 3.5H9l1.4 4-2 1.4a12 12 0 0 0 5.2 5.2l1.4-2 4 1.4v2.5a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z"/>',
    edit: '<path d="M5 15.5 15 5.5l3.5 3.5L8.5 19H5z"/><path d="M13 7.5l3.5 3.5"/>',
    share: '<circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6"/>',
    refresh: '<path d="M20 8a8 8 0 1 0 1.4 6"/><path d="M20 3.5V8h-4.5"/>',
    trash: '<path d="M4 6.5h16M9 6.5V4.5h6v2M6 6.5 7 20h10l1-13.5"/>',
    bump: '<path d="M12 20V6M12 6l-5 5M12 6l5 5"/>',
    chart: '<path d="M4 4v16h16"/><path d="M7.5 15l3-4 3 2.5L18 8"/>',
    bulb: '<path d="M9 17.5h6M10 20.5h4"/><path d="M12 3.5a5.5 5.5 0 0 0-3.3 9.9c.5.4.8 1 .8 1.6h5c0-.6.3-1.2.8-1.6A5.5 5.5 0 0 0 12 3.5z"/>',
    wave: '<path d="M12 21a7 7 0 0 0 7-7V8.5a1.4 1.4 0 0 0-2.8 0M16.2 9V6.5a1.4 1.4 0 0 0-2.8 0M13.4 7.5V5a1.4 1.4 0 0 0-2.8 0v6M10.6 8.5 8.9 6.8a1.4 1.4 0 0 0-2 2l3 3.2"/>',
    target: '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none"/>',
    image: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M4 17l4.5-4.5 3.5 3.5 3-3 5 5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 15.5V6a2 2 0 0 1 2-2h9.5"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8.5 21h7"/>',
    cloud: '<path d="M7 18.5A4 4 0 0 1 7 10.6 5.5 5.5 0 0 1 17.6 11 3.8 3.8 0 0 1 17 18.5z"/>',
  };

  /* синонимы: подкатегории/категории на русском → имя иконки */
  var ALIAS = {
    // категории (id)
    'kids-cat': 'kids',
    // подкатегории (значение subcategory)
    'Телефоны': 'phone', 'Ноутбуки': 'laptop', 'ТВ и аудио': 'tv', 'Фото и видео': 'camera',
    'Планшеты': 'tablet', 'Бытовая техника': 'appliance',
    'Легковые авто': 'car', 'Мото': 'moto', 'Грузовой транспорт': 'truck', 'Запчасти и аксессуары': 'parts',
    'Продажа квартир': 'building', 'Аренда квартир': 'building', 'Дома и участки': 'realty', 'Коммерческая': 'store',
    'Мужская одежда': 'shirt', 'Женская одежда': 'shirt', 'Детская одежда': 'shirt',
    'Обувь': 'shoe', 'Аксессуары': 'bag',
    'Мебель': 'sofa', 'Ремонт и стройка': 'tools', 'Посуда и кухня': 'kitchen', 'Растения': 'plant',
    'Собаки': 'animals', 'Кошки': 'animals', 'Птицы и рыбки': 'animals', 'Товары для животных': 'box',
    'Игрушки': 'toy', 'Коляски и кресла': 'stroller',
    'Велосипеды': 'bike', 'Тренажёры': 'dumbbell', 'Музыка': 'music', 'Туризм и отдых': 'camping',
    // услуги/работа — общий инструмент/портфель
    'Ремонт техники': 'tools', 'Строительство': 'tools', 'Красота и здоровье': 'sparkle',
    'Обучение': 'jobs', 'Перевозки': 'truck', 'Клининг': 'tools',
    'Вакансии': 'jobs', 'Ищу работу': 'jobs',
  };

  function resolve(name) {
    if (!name) return 'tag';
    if (P[name]) return name;
    if (ALIAS[name] && P[ALIAS[name]]) return ALIAS[name];
    return 'tag';
  }

  /* icon(name, {size, cls, stroke, fill}) → строка <svg> */
  function icon(name, opts) {
    opts = opts || {};
    var key = resolve(name);
    var size = opts.size || 24;
    var stroke = opts.stroke == null ? 1.9 : opts.stroke;
    var cls = opts.cls ? ' class="' + opts.cls + '"' : '';
    var fillMode = opts.fill ? 'currentColor' : 'none';
    return '<svg' + cls + ' width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="' + fillMode +
      '" stroke="currentColor" stroke-width="' + stroke + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      P[key] + '</svg>';
  }

  /* «сырые» пути (для встраивания в SVG data-URI плейсхолдеров фото) */
  function iconPaths(name) { return P[resolve(name)]; }

  window.icon = icon;
  window.iconPaths = iconPaths;
  window.hasIcon = function (name) { return !!(name && (P[name] || ALIAS[name])); };
})();
