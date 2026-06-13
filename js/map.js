/* ============================================================
   BAZAR mockup — SVG-карта Кыргызстана (офлайн, без зависимостей)
   ============================================================ */

/* упрощённый контур границы КР: [долгота, широта] */
const KG_BORDER = [
  [69.25, 40.10], [69.45, 40.65], [70.55, 40.95], [70.95, 40.65], [71.65, 40.25],
  [72.35, 40.00], [73.10, 39.60], [73.90, 39.45], [74.85, 39.80], [75.65, 39.95],
  [76.35, 40.35], [77.80, 41.05], [79.10, 41.60], [80.20, 42.05], [79.95, 42.45],
  [78.90, 42.75], [77.20, 42.90], [75.80, 42.95], [74.90, 43.20], [73.55, 43.05],
  [72.75, 42.65], [71.85, 42.80], [71.25, 42.55], [70.40, 42.05], [70.85, 41.65],
  [70.45, 41.40], [69.85, 41.55], [69.30, 41.00],
];

const KG_CITY_COORDS = {
  'Бишкек': [74.59, 42.87],
  'Ош': [72.80, 40.53],
  'Джалал-Абад': [72.98, 40.93],
  'Каракол': [78.39, 42.49],
  'Токмок': [75.30, 42.83],
  'Кара-Балта': [73.85, 42.81],
  'Кант': [74.85, 42.89],
  'Нарын': [75.98, 41.43],
  'Талас': [72.24, 42.52],
  'Баткен': [70.82, 40.06],
  'Чолпон-Ата': [77.08, 42.65],
};

function kgProject(lon, lat) {
  return [Math.round((lon - 69.0) * 60), Math.round((43.45 - lat) * 80)];
}

/* SVG-карта с маркером активного города */
function kgMapSVG(activeCity) {
  const path = KG_BORDER.map((p, i) => {
    const [x, y] = kgProject(p[0], p[1]);
    return (i === 0 ? 'M' : 'L') + x + ' ' + y;
  }).join(' ') + ' Z';

  // озеро Иссык-Куль — узнаваемая деталь
  const lake = '<ellipse class="lake" cx="495" cy="78" rx="52" ry="14" stroke-width="1"/>';

  let dots = '';
  let activeMark = '';
  for (const [city, [lon, lat]] of Object.entries(KG_CITY_COORDS)) {
    const [x, y] = kgProject(lon, lat);
    if (city === activeCity) {
      const labelLeft = x > 540; // подпись влево у правого края
      activeMark = `
        <g class="map-active">
          <circle cx="${x}" cy="${y}" r="14" class="map-pulse"/>
          <circle cx="${x}" cy="${y}" r="6" fill="var(--accent)" stroke="#fff" stroke-width="2.5"/>
          <text x="${labelLeft ? x - 12 : x + 12}" y="${y + 4}" text-anchor="${labelLeft ? 'end' : 'start'}" class="map-label">${city}</text>
        </g>`;
    } else {
      dots += `<circle class="citydot" cx="${x}" cy="${y}" r="3"><title>${city}</title></circle>`;
    }
  }

  return `
  <svg viewBox="0 0 690 335" xmlns="http://www.w3.org/2000/svg" class="kg-map" role="img" aria-label="Карта Кыргызстана: ${activeCity || ''}">
    <path class="land" d="${path}" stroke-width="2" stroke-linejoin="round"/>
    ${lake}
    ${dots}
    ${activeMark}
  </svg>`;
}
