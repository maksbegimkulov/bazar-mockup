/* ============================================================
   BAZAR — атрибуты объявлений: бренды, модели, характеристики
   по категориям. Каскад бренд→модель + спеки (год / кузов / коробка /
   привод / пробег для авто; память / цвет для телефонов; ОЗУ / CPU для
   ноутбуков и т.д.). Грузится ПОСЛЕ i18n.js (нужен LANG), ДО app.js.

   ВАЖНО: у каждого select-поля есть «Другое» + свободный ввод —
   юзера НИКОГДА не блокирует отсутствие бренда/модели в списке.
   ============================================================ */

/* выбрать локализованную строку ({ru,en,ky}) по текущему языку */
function aL(o) { return (o && (o[LANG] || o.ru)) || ''; }
const T3 = (ru, en, ky) => ({ ru, en, ky }); // короткий конструктор

/* ---- общие наборы опций (значение хранится КАНОНИЧЕСКИ на русском,
        отображение локализуется) ---- */
const COLORS = [
  ['Белый', T3('Белый', 'White', 'Ак')],
  ['Чёрный', T3('Чёрный', 'Black', 'Кара')],
  ['Серебристый', T3('Серебристый', 'Silver', 'Күмүш')],
  ['Серый', T3('Серый', 'Gray', 'Боз')],
  ['Красный', T3('Красный', 'Red', 'Кызыл')],
  ['Синий', T3('Синий', 'Blue', 'Көк')],
  ['Голубой', T3('Голубой', 'Light blue', 'Ачык көк')],
  ['Зелёный', T3('Зелёный', 'Green', 'Жашыл')],
  ['Жёлтый', T3('Жёлтый', 'Yellow', 'Сары')],
  ['Оранжевый', T3('Оранжевый', 'Orange', 'Кызгылт сары')],
  ['Коричневый', T3('Коричневый', 'Brown', 'Күрөң')],
  ['Бежевый', T3('Бежевый', 'Beige', 'Беж')],
  ['Золотистый', T3('Золотистый', 'Gold', 'Алтын')],
  ['Фиолетовый', T3('Фиолетовый', 'Purple', 'Кызгылт көк')],
  ['Розовый', T3('Розовый', 'Pink', 'Кызгылт')],
];

const opt = (v, ru, en, ky) => ({ v, l: T3(ru, en, ky) });

/* ============================================================
   1. БРЕНДЫ → МОДЕЛИ (по группам товаров)
   ============================================================ */
const BRANDS = {
  /* ---------- АВТО ---------- */
  cars: {
    'Toyota': ['Camry', 'Corolla', 'RAV4', 'Land Cruiser 100', 'Land Cruiser 200', 'Land Cruiser 300', 'Land Cruiser Prado', 'Highlander', 'Avensis', 'Yaris', 'Vitz', 'Prius', 'Hilux', 'Fortuner', 'Sequoia', 'Sienna', 'Alphard', 'Mark II', 'Crown', '4Runner', 'Tundra', 'Tacoma', 'C-HR', 'Venza', 'Estima', 'Ipsum', 'Caldina', 'Carina', 'Allion', 'Premio', 'Aqua', 'Passo', 'Probox', 'Succeed', 'Harrier', 'Supra', 'GT86'],
    'Lexus': ['RX', 'NX', 'LX', 'GX', 'ES', 'IS', 'LS', 'GS', 'UX', 'RC', 'LC', 'CT', 'RZ'],
    'Honda': ['Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'Fit', 'Jazz', 'Odyssey', 'Stepwgn', 'Stream', 'Insight', 'City', 'Vezel', 'Freed', 'Element', 'Legend'],
    'Acura': ['MDX', 'RDX', 'TLX', 'ILX', 'TL', 'RL', 'ZDX'],
    'Nissan': ['Almera', 'Note', 'Qashqai', 'X-Trail', 'Juke', 'Murano', 'Patrol', 'Pathfinder', 'Teana', 'Tiida', 'Sunny', 'Sentra', 'Maxima', 'Leaf', 'March', 'Serena', 'Skyline', 'GT-R', 'Navara', 'Terrano', 'Primera', 'Cefiro', 'Wingroad'],
    'Infiniti': ['QX50', 'QX60', 'QX70', 'QX80', 'Q50', 'Q70', 'FX35', 'FX37', 'FX45', 'EX', 'M'],
    'Mazda': ['3', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-7', 'CX-9', 'MX-5', 'Demio', 'Axela', 'Atenza', 'Premacy', 'Tribute', 'RX-8'],
    'Mitsubishi': ['Lancer', 'Outlander', 'Pajero', 'Pajero Sport', 'ASX', 'Eclipse Cross', 'Galant', 'Montero', 'L200', 'Delica', 'Colt', 'RVR', 'Space Star'],
    'Subaru': ['Forester', 'Outback', 'Legacy', 'Impreza', 'XV', 'Crosstrek', 'Tribeca', 'BRZ', 'WRX', 'Exiga'],
    'Suzuki': ['Swift', 'Vitara', 'Grand Vitara', 'SX4', 'Jimny', 'Baleno', 'Alto', 'Escudo', 'Liana', 'Ignis', 'Solio'],
    'Daihatsu': ['Terios', 'Mira', 'Move', 'Tanto', 'Hijet', 'Cuore'],
    'Isuzu': ['D-Max', 'MU-X', 'Trooper', 'Bighorn', 'Elf'],
    'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z3', 'Z4', 'M2', 'M3', 'M4', 'M5', 'M8', 'X5 M', 'X6 M', 'i3', 'i4', 'i5', 'i7', 'iX', 'iX3'],
    'Mercedes-Benz': ['A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'ML', 'GL', 'GLK', 'SLK', 'SL', 'AMG GT', 'V-Class', 'Vito', 'Sprinter', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'Maybach'],
    'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'RS3', 'RS6', 'RS7', 'S3', 'S4', 'S5', 'e-tron', 'e-tron GT'],
    'Volkswagen': ['Golf', 'Polo', 'Passat', 'Jetta', 'Tiguan', 'Touareg', 'Touran', 'Caddy', 'Transporter', 'Multivan', 'Amarok', 'Beetle', 'Bora', 'Sharan', 'T-Roc', 'Atlas', 'ID.4', 'ID.6'],
    'Porsche': ['911', 'Cayenne', 'Macan', 'Panamera', 'Boxster', 'Cayman', 'Taycan', '718'],
    'Opel': ['Astra', 'Corsa', 'Insignia', 'Vectra', 'Zafira', 'Mokka', 'Antara', 'Vivaro', 'Combo'],
    'Skoda': ['Octavia', 'Superb', 'Rapid', 'Fabia', 'Kodiaq', 'Karoq', 'Kamiq', 'Yeti', 'Roomster'],
    'SEAT': ['Leon', 'Ibiza', 'Ateca', 'Arona', 'Tarraco', 'Alhambra'],
    'Volvo': ['XC40', 'XC60', 'XC70', 'XC90', 'S40', 'S60', 'S80', 'S90', 'V40', 'V60', 'V90'],
    'Hyundai': ['Accent', 'Solaris', 'Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Creta', 'Palisade', 'Getz', 'i30', 'i40', 'ix35', 'Kona', 'Grandeur', 'Starex', 'Porter', 'Genesis'],
    'Kia': ['Rio', 'Cerato', 'Optima', 'K5', 'Sportage', 'Sorento', 'Soul', 'Picanto', 'Ceed', 'Carnival', 'Mohave', 'Stinger', 'Seltos', 'Telluride', 'Spectra', 'Carens'],
    'Genesis': ['G70', 'G80', 'G90', 'GV70', 'GV80'],
    'SsangYong': ['Actyon', 'Kyron', 'Rexton', 'Korando', 'Musso', 'Tivoli'],
    'Daewoo': ['Nexia', 'Matiz', 'Lacetti', 'Gentra', 'Damas', 'Tico', 'Espero', 'Leganza'],
    'Ravon': ['Nexia R3', 'R2', 'R4', 'Gentra'],
    'Chevrolet': ['Spark', 'Aveo', 'Cobalt', 'Lacetti', 'Cruze', 'Malibu', 'Captiva', 'Tahoe', 'Tracker', 'Trailblazer', 'Camaro', 'Equinox', 'Niva', 'Epica'],
    'Ford': ['Focus', 'Fiesta', 'Mondeo', 'Fusion', 'Escape', 'Kuga', 'Explorer', 'Edge', 'Ranger', 'F-150', 'Mustang', 'Transit', 'EcoSport', 'Expedition'],
    'Cadillac': ['Escalade', 'CTS', 'SRX', 'XT5', 'ATS', 'Eldorado'],
    'GMC': ['Yukon', 'Sierra', 'Acadia', 'Terrain'],
    'Dodge': ['Ram', 'Charger', 'Challenger', 'Durango', 'Journey', 'Caravan'],
    'Jeep': ['Grand Cherokee', 'Cherokee', 'Wrangler', 'Compass', 'Renegade', 'Patriot', 'Liberty'],
    'Chrysler': ['300C', 'Pacifica', 'Sebring', 'Voyager'],
    'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck'],
    'Lada (ВАЗ)': ['Granta', 'Vesta', 'Largus', 'Niva', 'Niva Travel', 'XRAY', 'Priora', 'Kalina', 'Samara', '2107', '2109', '2110', '2114', '2115'],
    'ГАЗ': ['Газель', 'Газель Next', 'Соболь', 'Волга', '3110', '31105'],
    'УАЗ': ['Патриот', 'Хантер', 'Буханка', '469', 'Пикап'],
    'Renault': ['Logan', 'Sandero', 'Duster', 'Megane', 'Clio', 'Captur', 'Kaptur', 'Koleos', 'Fluence', 'Symbol', 'Laguna', 'Scenic'],
    'Peugeot': ['206', '207', '208', '301', '307', '308', '407', '408', '508', '2008', '3008', '5008', 'Partner'],
    'Citroen': ['C3', 'C4', 'C5', 'Berlingo', 'C-Elysee', 'Jumper'],
    'Fiat': ['500', 'Punto', 'Doblo', 'Tipo', 'Albea', 'Ducato'],
    'Alfa Romeo': ['Giulia', 'Stelvio', '159', '147', 'Giulietta'],
    'Land Rover': ['Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque', 'Discovery', 'Discovery Sport', 'Defender', 'Freelander'],
    'Jaguar': ['XF', 'XE', 'XJ', 'F-Pace', 'E-Pace', 'F-Type'],
    'Mini': ['Cooper', 'Countryman', 'Clubman', 'Paceman'],
    'Geely': ['Coolray', 'Atlas', 'Emgrand', 'Monjaro', 'Tugella', 'Okavango', 'Preface'],
    'Chery': ['Tiggo 2', 'Tiggo 4', 'Tiggo 7 Pro', 'Tiggo 8 Pro', 'Arrizo', 'Amulet', 'QQ'],
    'Haval': ['Jolion', 'F7', 'F7x', 'H6', 'H9', 'Dargo'],
    'BYD': ['Han', 'Tang', 'Song', 'Qin', 'Yuan', 'Dolphin', 'Atto 3', 'Seal'],
    'Changan': ['CS35', 'CS55', 'CS75', 'Eado', 'UNI-K', 'UNI-T', 'Alsvin'],
    'Great Wall': ['Hover', 'Poer', 'Wingle', 'Deer'],
    'JAC': ['J7', 'S3', 'S7', 'T6', 'T8'],
    'Exeed': ['TXL', 'VX', 'LX', 'RX'],
    'Tank': ['300', '500', '700'],
    'Lifan': ['X60', 'X50', 'Solano', 'Smily', 'Breez'],
    'Datsun': ['on-DO', 'mi-DO'],
    'Hummer': ['H1', 'H2', 'H3'],
    'Bentley': ['Continental', 'Bentayga', 'Flying Spur'],
    'Rolls-Royce': ['Phantom', 'Ghost', 'Cullinan', 'Wraith'],
    'Lamborghini': ['Urus', 'Huracan', 'Aventador'],
    'Ferrari': ['Roma', 'Portofino', 'F8', '488', 'SF90'],
    'Maserati': ['Levante', 'Ghibli', 'Quattroporte', 'Grecale'],
    'Smart': ['ForTwo', 'ForFour'],
  },

  /* ---------- МОТО ---------- */
  moto: {
    'Honda': ['CB', 'CBR', 'Africa Twin', 'Gold Wing', 'Rebel', 'CRF', 'Dio', 'Forza', 'PCX'],
    'Yamaha': ['YZF-R1', 'YZF-R6', 'MT-07', 'MT-09', 'FZ', 'Tenere', 'XMAX', 'NMAX', 'Jog'],
    'Suzuki': ['GSX-R', 'Hayabusa', 'V-Strom', 'Boulevard', 'Burgman', 'DR-Z'],
    'Kawasaki': ['Ninja', 'Z650', 'Z900', 'Versys', 'Vulcan', 'KLR'],
    'Harley-Davidson': ['Sportster', 'Softail', 'Touring', 'Street', 'Fat Boy'],
    'BMW': ['R 1250 GS', 'S 1000 RR', 'F 850 GS', 'G 310', 'R nineT'],
    'KTM': ['Duke', 'RC', 'Adventure', 'EXC', 'SX'],
    'Ducati': ['Monster', 'Panigale', 'Multistrada', 'Scrambler', 'Diavel'],
    'Triumph': ['Bonneville', 'Tiger', 'Street Triple', 'Rocket'],
    'Racer': ['Ranger', 'Tourist', 'Magnum'],
    'Stels': ['Flex', 'Trigger', 'Delta'],
  },

  /* ---------- ТЕЛЕФОНЫ ---------- */
  phones: {
    'Apple': ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16', 'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14', 'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini', 'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini', 'iPhone SE (2022)', 'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11', 'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X', 'iPhone SE (2020)', 'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7', 'iPhone 6s', 'iPhone 6'],
    'Samsung': ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22', 'Galaxy S21 Ultra', 'Galaxy S21', 'Galaxy S20', 'Galaxy S10', 'Galaxy Note 20 Ultra', 'Galaxy Note 10', 'Galaxy Z Fold 6', 'Galaxy Z Fold 5', 'Galaxy Z Flip 6', 'Galaxy Z Flip 5', 'Galaxy A55', 'Galaxy A54', 'Galaxy A35', 'Galaxy A34', 'Galaxy A25', 'Galaxy A15', 'Galaxy A14', 'Galaxy A05', 'Galaxy M34', 'Galaxy J7'],
    'Xiaomi': ['14 Pro', '14', '13 Pro', '13', '13T', '12', '12 Pro', '11T Pro', 'Mi 11', 'Mi 10', 'Poco X6 Pro', 'Poco X6', 'Poco F6', 'Poco F5', 'Poco M6 Pro', 'Poco C65'],
    'Redmi': ['Note 13 Pro+', 'Note 13 Pro', 'Note 13', 'Note 12 Pro', 'Note 12', 'Note 11', 'Note 10', '13C', '12C', 'A3', 'Redmi 13', 'Redmi 12'],
    'Huawei': ['P60 Pro', 'P50 Pro', 'P40 Pro', 'P40', 'P30 Pro', 'P30', 'Mate 60 Pro', 'Mate 50 Pro', 'Mate 40 Pro', 'Nova 12', 'Nova 11', 'Nova 9'],
    'Honor': ['Magic 6 Pro', 'Magic 5 Pro', '90', '70', 'X9b', 'X9', 'X8', 'X7', '50', 'Play'],
    'Realme': ['12 Pro+', '12 Pro', '11 Pro+', '11', 'C67', 'C55', 'C53', 'GT Neo', 'Narzo'],
    'OPPO': ['Find X7', 'Find X6', 'Reno 11', 'Reno 10', 'Reno 8', 'A98', 'A78', 'A58', 'A38'],
    'Vivo': ['X100 Pro', 'X90', 'V30', 'V29', 'Y100', 'Y36', 'Y27', 'Y17'],
    'OnePlus': ['12', '11', '10 Pro', 'Nord 3', 'Nord CE 3', '9 Pro'],
    'Google': ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel 7', 'Pixel 6 Pro', 'Pixel 6', 'Pixel 7a', 'Pixel 6a'],
    'Nokia': ['G42', 'G22', 'C32', 'C22', 'X30', 'XR21', '105', '110'],
    'Motorola': ['Edge 40', 'Edge 30', 'G84', 'G54', 'G73', 'G23', 'Razr 40'],
    'Tecno': ['Camon 20', 'Spark 10', 'Pova 5', 'Phantom V', 'Pop 7'],
    'Infinix': ['Note 30', 'Hot 40', 'Zero 30', 'Smart 8'],
    'ZTE': ['Blade', 'Nubia', 'Axon'],
    'Sony': ['Xperia 1 V', 'Xperia 5 V', 'Xperia 10 V'],
    'Asus': ['ROG Phone 8', 'ROG Phone 7', 'Zenfone 10'],
  },

  /* ---------- НОУТБУКИ ---------- */
  laptops: {
    'Apple': ['MacBook Air 13 M3', 'MacBook Air 15 M3', 'MacBook Air M2', 'MacBook Air M1', 'MacBook Pro 14 M3', 'MacBook Pro 16 M3', 'MacBook Pro 13 M2', 'MacBook Pro 16 M1 Pro', 'MacBook 12'],
    'Asus': ['ZenBook', 'VivoBook', 'ROG Strix', 'ROG Zephyrus', 'TUF Gaming', 'ProArt', 'ExpertBook', 'Chromebook'],
    'Acer': ['Aspire', 'Swift', 'Nitro', 'Predator Helios', 'Spin', 'TravelMate', 'Chromebook'],
    'HP': ['Pavilion', 'Envy', 'Spectre', 'Omen', 'Victus', 'ProBook', 'EliteBook', 'Laptop 15', 'ZBook'],
    'Dell': ['Inspiron', 'XPS 13', 'XPS 15', 'Latitude', 'Vostro', 'Alienware', 'G15', 'Precision'],
    'Lenovo': ['IdeaPad', 'ThinkPad X1 Carbon', 'ThinkPad', 'Legion', 'Yoga', 'ThinkBook', 'LOQ', 'V15'],
    'MSI': ['Modern', 'Prestige', 'Katana', 'Stealth', 'Raider', 'Cyborg', 'Thin GF63'],
    'Huawei': ['MateBook X Pro', 'MateBook D14', 'MateBook D15', 'MateBook 14'],
    'Microsoft': ['Surface Laptop', 'Surface Pro', 'Surface Book', 'Surface Go'],
    'Samsung': ['Galaxy Book4', 'Galaxy Book3', 'Galaxy Book Pro'],
    'LG': ['Gram 14', 'Gram 16', 'Gram 17'],
    'Honor': ['MagicBook 14', 'MagicBook X16', 'MagicBook Pro'],
    'Xiaomi': ['RedmiBook 15', 'Mi Notebook Pro', 'RedmiBook Pro'],
  },

  /* ---------- ПЛАНШЕТЫ ---------- */
  tablets: {
    'Apple': ['iPad Pro 12.9 M2', 'iPad Pro 11 M2', 'iPad Air M2', 'iPad Air 5', 'iPad 10', 'iPad 9', 'iPad mini 6'],
    'Samsung': ['Galaxy Tab S9 Ultra', 'Galaxy Tab S9+', 'Galaxy Tab S9', 'Galaxy Tab S8', 'Galaxy Tab A9', 'Galaxy Tab A8'],
    'Xiaomi': ['Pad 6', 'Pad 6 Pro', 'Pad 5', 'Redmi Pad SE', 'Redmi Pad'],
    'Huawei': ['MatePad Pro', 'MatePad 11', 'MatePad SE'],
    'Lenovo': ['Tab P12', 'Tab P11', 'Tab M10', 'Yoga Tab'],
  },

  /* ---------- ТВ ---------- */
  tv: {
    'Samsung': [], 'LG': [], 'Sony': [], 'Xiaomi': [], 'TCL': [], 'Hisense': [],
    'Philips': [], 'Panasonic': [], 'Toshiba': [], 'Haier': [], 'Artel': [], 'Skyworth': [], 'Yasin': [],
  },

  /* ---------- БЫТОВАЯ ТЕХНИКА ---------- */
  appliances: {
    'Samsung': [], 'LG': [], 'Bosch': [], 'Beko': [], 'Indesit': [], 'Ariston': [], 'Haier': [],
    'Whirlpool': [], 'Electrolux': [], 'Gorenje': [], 'Candy': [], 'Atlant': [], 'Artel': [], 'Avest': [],
    'Midea': [], 'Hisense': [], 'Dyson': [], 'Philips': [], 'Xiaomi': [], 'DeLonghi': [], 'Tefal': [], 'Panasonic': [],
  },

  /* ---------- ФОТО/ВИДЕО ---------- */
  cameras: {
    'Canon': ['EOS R5', 'EOS R6', 'EOS R', 'EOS 5D', 'EOS 90D', 'EOS 250D', 'EOS M50'],
    'Nikon': ['Z6', 'Z7', 'Z50', 'D850', 'D750', 'D5600', 'D3500'],
    'Sony': ['A7 IV', 'A7 III', 'A7R', 'A6400', 'A6000', 'ZV-E10', 'FX3'],
    'Fujifilm': ['X-T5', 'X-T4', 'X-S20', 'X100V', 'GFX'],
    'Panasonic': ['Lumix S5', 'Lumix GH6', 'Lumix G9'],
    'GoPro': ['Hero 12', 'Hero 11', 'Hero 10', 'Hero 9'],
    'DJI': ['Mini 4 Pro', 'Air 3', 'Mavic 3', 'Osmo Pocket', 'Osmo Action'],
    'Olympus': ['OM-D', 'PEN'],
  },

  /* ---------- ВЕЛОСИПЕДЫ ---------- */
  bikes: {
    'Giant': [], 'Trek': [], 'Merida': [], 'Specialized': [], 'Cube': [], 'Scott': [], 'Cannondale': [],
    'Author': [], 'Stels': [], 'Forward': [], 'Stern': [], 'Format': [], 'GT': [], 'Polygon': [],
  },

  /* ---------- ОДЕЖДА / ОБУВЬ / АКСЕССУАРЫ (бренды без каскада моделей) ---------- */
  fashion: {
    'Nike': [], 'Adidas': [], 'Puma': [], 'Reebok': [], 'New Balance': [], 'Under Armour': [], 'Asics': [],
    'Zara': [], 'H&M': [], 'Bershka': [], 'Pull&Bear': [], 'Mango': [], 'Uniqlo': [], 'Massimo Dutti': [],
    'Gucci': [], 'Louis Vuitton': [], 'Prada': [], 'Versace': [], 'Balenciaga': [], 'Dior': [], 'Chanel': [],
    'Tommy Hilfiger': [], 'Calvin Klein': [], 'Lacoste': [], 'Levi\'s': [], 'Guess': [], 'Diesel': [],
    'The North Face': [], 'Columbia': [], 'Converse': [], 'Vans': [], 'Timberland': [], 'Crocs': [], 'UGG': [],
    'Gloria Jeans': [], 'Ostin': [], 'Befree': [], 'LC Waikiki': [], 'Koton': [], 'DeFacto': [],
  },

  /* ---------- ЧАСЫ ---------- */
  watches: {
    'Apple': ['Watch Ultra 2', 'Watch Series 9', 'Watch Series 8', 'Watch SE'],
    'Samsung': ['Galaxy Watch 6', 'Galaxy Watch 5', 'Galaxy Watch 4'],
    'Garmin': [], 'Casio': [], 'Rolex': [], 'Omega': [], 'Tissot': [], 'Seiko': [], 'Citizen': [],
    'Huawei': ['Watch GT 4', 'Watch GT 3'], 'Amazfit': [], 'Xiaomi': [],
  },
};

/* ============================================================
   2. СХЕМЫ АТРИБУТОВ ПО ПОДКАТЕГОРИЯМ
   тип поля: brand | model | select | number | text
   ============================================================ */

/* набор опций кузова, коробки и т.д. — переиспользуются */
const O_BODY = [
  opt('Седан', 'Седан', 'Sedan', 'Седан'), opt('Хэтчбек', 'Хэтчбек', 'Hatchback', 'Хэтчбек'),
  opt('Универсал', 'Универсал', 'Wagon', 'Универсал'), opt('Внедорожник', 'Внедорожник', 'SUV', 'Внедорожник'),
  opt('Кроссовер', 'Кроссовер', 'Crossover', 'Кроссовер'), opt('Купе', 'Купе', 'Coupe', 'Купе'),
  opt('Минивэн', 'Минивэн', 'Minivan', 'Минивэн'), opt('Пикап', 'Пикап', 'Pickup', 'Пикап'),
  opt('Кабриолет', 'Кабриолет', 'Convertible', 'Кабриолет'), opt('Лифтбек', 'Лифтбек', 'Liftback', 'Лифтбек'),
  opt('Фургон', 'Фургон', 'Van', 'Фургон'),
];
const O_TRANS = [
  opt('Механика', 'Механика', 'Manual', 'Механика'), opt('Автомат', 'Автомат', 'Automatic', 'Автомат'),
  opt('Робот', 'Робот', 'Robot (DCT)', 'Робот'), opt('Вариатор', 'Вариатор', 'CVT', 'Вариатор'),
];
const O_DRIVE = [
  opt('Передний', 'Передний', 'Front (FWD)', 'Алдыңкы'), opt('Задний', 'Задний', 'Rear (RWD)', 'Артыңкы'),
  opt('Полный', 'Полный', 'AWD / 4WD', 'Толук'),
];
const O_FUEL = [
  opt('Бензин', 'Бензин', 'Petrol', 'Бензин'), opt('Дизель', 'Дизель', 'Diesel', 'Дизель'),
  opt('Гибрид', 'Гибрид', 'Hybrid', 'Гибрид'), opt('Электро', 'Электро', 'Electric', 'Электро'),
  opt('Газ-бензин', 'Газ-бензин', 'LPG + Petrol', 'Газ-бензин'),
];
const O_STEER = [opt('Левый', 'Левый', 'Left', 'Сол'), opt('Правый', 'Правый', 'Right', 'Оң')];
const O_STORAGE = ['16', '32', '64', '128', '256', '512', '1024'].map(g =>
  opt(g, g === '1024' ? '1 ТБ' : g + ' ГБ', g === '1024' ? '1 TB' : g + ' GB', g === '1024' ? '1 ТБ' : g + ' ГБ'));
const O_RAM = ['2', '3', '4', '6', '8', '12', '16', '24', '32', '64'].map(g => opt(g, g + ' ГБ', g + ' GB', g + ' ГБ'));
const O_LAPSSD = ['128', '256', '512', '1024', '2048'].map(g =>
  opt(g, g >= 1024 ? (g / 1024) + ' ТБ' : g + ' ГБ', g >= 1024 ? (g / 1024) + ' TB' : g + ' GB', g >= 1024 ? (g / 1024) + ' ТБ' : g + ' ГБ'));
const O_CPU = ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'Intel Celeron', 'Intel Pentium', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple M1', 'Apple M2', 'Apple M3', 'Apple M4'].map(c => opt(c, c, c, c));
const O_SCREEN = ['13', '14', '15', '16', '17'].map(s => opt(s, s + '"', s + '"', s + '"'));
const O_GPU = ['RTX 5090','RTX 5080','RTX 5070','RTX 4090','RTX 4080','RTX 4070','RTX 4060','RTX 4050','RTX 3080','RTX 3070','RTX 3060','RTX 3050','GTX 1660','GTX 1650','RX 7900','RX 7600','RX 6600','Apple M4','Apple M3','Apple M2','Apple M1','Встроенная'].map(g => opt(g, g, g, g));
const O_TABSCREEN = ['8','9','10','11','12','13','14'].map(s => opt(s, s + '"', s + '"', s + '"'));
const O_BATTERY = ['100','95','90','85','80'].map(b => opt(b, 'от ' + b + '%', b + '%+', b + '%+'));
const O_CAMMOUNT = ['E','RF','Z','X','L','EF','MFT','Fixed'].map(m => opt(m, m, m, m));
const O_TVSIZE = ['24', '32', '40', '43', '50', '55', '65', '75', '85'].map(s => opt(s, s + '"', s + '"', s + '"'));
const O_TVRES = [opt('HD', 'HD', 'HD', 'HD'), opt('Full HD', 'Full HD', 'Full HD', 'Full HD'), opt('4K', '4K Ultra HD', '4K Ultra HD', '4K Ultra HD'), opt('8K', '8K', '8K', '8K')];
const O_TVTECH = [opt('LED', 'LED', 'LED', 'LED'), opt('QLED', 'QLED', 'QLED', 'QLED'), opt('OLED', 'OLED', 'OLED', 'OLED'), opt('Plasma', 'Плазма', 'Plasma', 'Плазма')];
const O_CAMTYPE = [opt('Зеркальный', 'Зеркальный', 'DSLR', 'Күзгүлүү'), opt('Беззеркальный', 'Беззеркальный', 'Mirrorless', 'Күзгүсүз'), opt('Компакт', 'Компакт', 'Compact', 'Компакт'), opt('Экшн', 'Экшн-камера', 'Action cam', 'Экшн'), opt('Дрон', 'Дрон', 'Drone', 'Дрон')];
const O_APPLTYPE = ['Холодильник', 'Стиральная машина', 'Посудомоечная машина', 'Плита', 'Духовка', 'Микроволновка', 'Пылесос', 'Кондиционер', 'Морозильник', 'Водонагреватель', 'Кофемашина', 'Телевизор'].map(x => opt(x, x, x, x));
const O_CLOTHSIZE = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '40', '42', '44', '46', '48', '50', '52', '54', '56'].map(s => opt(s, s, s, s));
const O_SHOESIZE = Array.from({ length: 16 }, (_, i) => String(33 + i)).map(s => opt(s, s, s, s));
const O_GENDER = [opt('Мужской', 'Мужской', 'Men', 'Эркек'), opt('Женский', 'Женский', 'Women', 'Аял'), opt('Унисекс', 'Унисекс', 'Unisex', 'Унисекс')];
const O_ROOMS = [opt('Студия', 'Студия', 'Studio', 'Студия'), opt('1', '1 комната', '1 room', '1 бөлмө'), opt('2', '2 комнаты', '2 rooms', '2 бөлмө'), opt('3', '3 комнаты', '3 rooms', '3 бөлмө'), opt('4', '4 комнаты', '4 rooms', '4 бөлмө'), opt('5+', '5+ комнат', '5+ rooms', '5+ бөлмө')];
const O_BIKETYPE = [opt('Горный', 'Горный', 'Mountain', 'Тоо'), opt('Шоссейный', 'Шоссейный', 'Road', 'Жол'), opt('Городской', 'Городской', 'City', 'Шаар'), opt('BMX', 'BMX', 'BMX', 'BMX'), opt('Складной', 'Складной', 'Folding', 'Бүктөлмө'), opt('Детский', 'Детский', 'Kids', 'Балдар'), opt('Электро', 'Электро', 'Electric', 'Электро')];
const O_MOTOTYPE = [opt('Спорт', 'Спорт', 'Sport', 'Спорт'), opt('Туризм', 'Туризм', 'Touring', 'Туризм'), opt('Эндуро', 'Эндуро', 'Enduro', 'Эндуро'), opt('Скутер', 'Скутер', 'Scooter', 'Скутер'), opt('Чоппер', 'Чоппер', 'Chopper', 'Чоппер'), opt('Кросс', 'Кросс', 'Motocross', 'Кросс'), opt('Питбайк', 'Питбайк', 'Pit bike', 'Питбайк')];

/* поля-конструкторы */
const fBrand = (group) => ({ key: 'brand', label: T3('Марка', 'Brand', 'Марка'), type: 'brand', group });
const fModel = () => ({ key: 'model', label: T3('Модель', 'Model', 'Модель'), type: 'model' });
const fGen = () => ({ key: 'gen', label: T3('Поколение', 'Generation', 'Муун'), type: 'gen', optional: true });
const fSelect = (key, label, options, optional) => ({ key, label, type: 'select', options, optional });
const fNum = (key, label, unit, min, max, optional) => ({ key, label, type: 'number', unit, min, max, optional });
const fColor = () => fSelect('color', T3('Цвет', 'Color', 'Түс'), COLORS.map(([v, l]) => ({ v, l })), true);
const fYear = () => fNum('year', T3('Год выпуска', 'Year', 'Чыккан жылы'), null, 1950, 2026);

const ATTR_SCHEMA = {
  /* --- транспорт --- */
  'Легковые авто': [
    fBrand('cars'), fModel(), fGen(), fYear(),
    fSelect('body', T3('Кузов', 'Body type', 'Кузов'), O_BODY, true),
    fSelect('gearbox', T3('Коробка передач', 'Transmission', 'Берүү кутусу'), O_TRANS),
    fSelect('drive', T3('Привод', 'Drivetrain', 'Жүргүзгүч'), O_DRIVE, true),
    fSelect('fuel', T3('Топливо', 'Fuel', 'Күйүүчү май'), O_FUEL, true),
    fNum('engineVol', T3('Объём двигателя', 'Engine', 'Кыймылдаткыч'), T3('л', 'L', 'л'), 0, 10, true),
    fNum('mileage', T3('Пробег', 'Mileage', 'Жүрүшү'), T3('км', 'km', 'км'), 0, 1000000, true),
    fSelect('wheel', T3('Руль', 'Steering', 'Руль'), O_STEER, true),
    fSelect('customs', T3('Растаможка', 'Customs', 'Бажы'), [opt('Растаможен', 'Растаможен', 'Cleared', 'Тазаланган'), opt('Не растаможен', 'Не растаможен', 'Not cleared', 'Тазаланбаган')], true),
    fSelect('exchange', T3('Обмен', 'Exchange', 'Алмашуу'), [opt('Возможен', 'Возможен', 'Possible', 'Мүмкүн'), opt('Нет', 'Нет', 'No', 'Жок')], true),
    fSelect('credit', T3('Кредит', 'Credit', 'Кредит'), [opt('Возможен', 'Возможен', 'Available', 'Бар'), opt('Нет', 'Нет', 'No', 'Жок')], true),
    fColor(),
  ],
  'Мото': [
    fBrand('moto'), fModel(), fYear(),
    fSelect('motoType', T3('Тип', 'Type', 'Түрү'), O_MOTOTYPE, true),
    fNum('engineCC', T3('Объём', 'Engine', 'Көлөмү'), T3('см³', 'cc', 'см³'), 0, 3000, true),
    fNum('mileage', T3('Пробег', 'Mileage', 'Жүрүшү'), T3('км', 'km', 'км'), 0, 500000, true),
  ],
  'Грузовой транспорт': [
    fBrand('cars'), fModel(), fYear(),
    fNum('mileage', T3('Пробег', 'Mileage', 'Жүрүшү'), T3('км', 'km', 'км'), 0, 2000000, true),
  ],
  'Запчасти и аксессуары': [
    fBrand('cars'), fModel(),
  ],

  /* --- электроника --- */
  'Телефоны': [
    fBrand('phones'), fModel(),
    fSelect('storage', T3('Память', 'Storage', 'Эстутум'), O_STORAGE, true),
    fSelect('ram', T3('Оперативная память', 'RAM', 'Оперативдик эстутум'), O_RAM, true),
    // состояние аккумулятора — ключевой критерий при покупке б/у iPhone
    fNum('battery', T3('Аккумулятор', 'Battery health', 'Аккумулятор'), T3('%', '%', '%'), 0, 100, true),
    fSelect('g5', T3('5G', '5G', '5G'), [opt('Есть','Есть','Yes','Бар'), opt('Нет','Нет','No','Жок')], true),
    fSelect('esim', T3('eSIM', 'eSIM', 'eSIM'), [opt('Есть','Есть','Yes','Бар'), opt('Нет','Нет','No','Жок')], true),
    fSelect('warranty', T3('Гарантия', 'Warranty', 'Кепилдик'), [opt('Есть','Есть','Yes','Бар'), opt('Нет','Нет','No','Жок')], true),
    fColor(),
  ],
  'Ноутбуки': [
    fBrand('laptops'), fModel(),
    fSelect('cpu', T3('Процессор', 'Processor', 'Процессор'), O_CPU, true),
    fSelect('gpu', T3('Видеокарта', 'Graphics', 'Видеокарта'), O_GPU, true),
    fSelect('ram', T3('Оперативная память', 'RAM', 'Оперативдик эстутум'), O_RAM, true),
    fSelect('storage', T3('Накопитель', 'Storage', 'Сактагыч'), O_LAPSSD, true),
    fSelect('screen', T3('Экран', 'Screen', 'Экран'), O_SCREEN, true),
  ],
  'Планшеты': [
    fBrand('tablets'), fModel(),
    fSelect('screen', T3('Диагональ', 'Screen size', 'Диагональ'), O_TABSCREEN, true),
    fSelect('storage', T3('Память', 'Storage', 'Эстутум'), O_STORAGE, true),
    fSelect('cellular', T3('SIM-карта', 'Cellular', 'SIM-карта'), [opt('Есть','Есть','Yes','Бар'), opt('Нет','Нет','No','Жок')], true),
    fColor(),
  ],
  'ТВ и аудио': [
    fBrand('tv'), fModel(),
    fSelect('screen', T3('Диагональ', 'Screen size', 'Диагональ'), O_TVSIZE, true),
    fSelect('res', T3('Разрешение', 'Resolution', 'Чечими'), O_TVRES, true),
    fSelect('panel', T3('Технология', 'Panel', 'Технология'), O_TVTECH, true),
  ],
  'Фото и видео': [
    fBrand('cameras'), fModel(),
    fSelect('mount', T3('Байонет', 'Mount', 'Байонет'), O_CAMMOUNT, true),
  ],
  'Бытовая техника': [
    fSelect('applType', T3('Тип техники', 'Appliance', 'Техника түрү'), O_APPLTYPE, true),
    fBrand('appliances'), fModel(),
  ],

  /* --- одежда / стиль --- */
  'Мужская одежда': [fBrand('fashion'), fSelect('size', T3('Размер', 'Size', 'Өлчөмү'), O_CLOTHSIZE, true), fColor()],
  'Женская одежда': [fBrand('fashion'), fSelect('size', T3('Размер', 'Size', 'Өлчөмү'), O_CLOTHSIZE, true), fColor()],
  'Детская одежда': [fBrand('fashion'), fSelect('size', T3('Размер', 'Size', 'Өлчөмү'), O_CLOTHSIZE, true), fColor()],
  'Обувь': [fBrand('fashion'), fSelect('shoeSize', T3('Размер', 'Size', 'Өлчөмү'), O_SHOESIZE, true), fSelect('gender', T3('Пол', 'Gender', 'Жынысы'), O_GENDER, true), fColor()],
  // часы лежат в каталоге под группой watches, сумки/очки/рюкзаки — в старом
  // списке одежды; брать надо и то и другое, иначе 53 модели часов недостижимы
  'Аксессуары': [fBrand('watches'), fModel(), fColor()],

  /* --- недвижимость --- */
  'Продажа квартир': [
    fSelect('rooms', T3('Комнат', 'Rooms', 'Бөлмөлөр'), O_ROOMS, true),
    fNum('area', T3('Площадь', 'Area', 'Аянты'), T3('м²', 'm²', 'м²'), 1, 1000, true),
    fNum('floor', T3('Этаж', 'Floor', 'Кабат'), null, 1, 100, true),
    fNum('floors', T3('Этажей в доме', 'Total floors', 'Үйдөгү кабаттар'), null, 1, 100, true),
  ],
  'Аренда квартир': [
    fSelect('rooms', T3('Комнат', 'Rooms', 'Бөлмөлөр'), O_ROOMS, true),
    fNum('area', T3('Площадь', 'Area', 'Аянты'), T3('м²', 'm²', 'м²'), 1, 1000, true),
    fNum('floor', T3('Этаж', 'Floor', 'Кабат'), null, 1, 100, true),
  ],
  'Дома и участки': [
    fNum('area', T3('Площадь дома', 'House area', 'Үйдүн аянты'), T3('м²', 'm²', 'м²'), 1, 5000, true),
    fNum('land', T3('Участок', 'Land', 'Жер'), T3('сот.', 'are', 'сот.'), 0, 10000, true),
  ],

  /* --- хобби и спорт --- */
  'Велосипеды': [
    fBrand('bikes'), fModel(),
    fSelect('bikeType', T3('Тип', 'Type', 'Түрү'), O_BIKETYPE, true),
    fNum('wheel', T3('Диаметр колёс', 'Wheel size', 'Дөңгөлөк'), T3('″', '″', '″'), 12, 29, true),
  ],

  /* --- дом и сад --- */

  /* --- группы для часов (если появятся подкатегории аксессуаров «Часы») --- */
};

/* категория-фолбэк: если у подкатегории нет своей схемы, но есть у категории */
const ATTR_SCHEMA_CAT = {
  // напр. все «Услуги»/«Работа» — без атрибутов (схемы нет → ничего не рисуем)
};

/* ============================================================
   3. ХЕЛПЕРЫ
   ============================================================ */
const OTHER_VAL = '__other__';

/* список брендов группы (по алфавиту, но Apple/Toyota и т.п. как есть) */
/* группа фильтра → подкатегория каталога (js/catalog/index.js).
   Каталог — источник правды: после его роста в фильтрах должны появиться
   все 82 марки авто и весь модельный ряд, а не старый короткий список. */
const GROUP_TO_SUB = {
  cars: 'Легковые авто', phones: 'Телефоны', tablets: 'Планшеты',
  laptops: 'Ноутбуки', tv: 'ТВ и аудио', cameras: 'Фото и видео', watches: 'Аксессуары',
};

/* Каталог покрывает подкатегорию не целиком: в «Аксессуарах» это только часы,
   а сумки, очки и рюкзаки остались в старом списке одежды. */
const GROUP_LEGACY_EXTRA = { watches: 'fashion' };

function brandsFor(group) {
  const sub = GROUP_TO_SUB[group];
  if (sub && typeof catalogBrands === 'function') {
    const fromCatalog = catalogBrands(sub).map(b => b.brand || b.name).filter(Boolean);
    if (fromCatalog.length) {
      // Старые группы (мото, велосипеды, одежда) каталог не покрывает — доливаем.
      // Но без дублей: «Lada» и «Lada (ВАЗ)», «GAZ» и «ГАЗ», «OPPO» и «Oppo» —
      // это одна марка в двух написаниях, и в списке из сотни строк такая
      // пара только путает (второй вариант ещё и пустой).
      const norm = s => String(s).toLowerCase()
        .replace(/\s*\(.*?\)\s*/g, '').replace(/[^a-zа-я0-9]/g, '')
        .replace(/^lada$|^ваз$/, 'lada').replace(/^gaz$|^газ$/, 'gaz')
        .replace(/^uaz$|^уаз$/, 'uaz').replace(/^moskvich$|^москвич$/, 'moskvich');
      const seen = new Set(fromCatalog.map(norm));
      const extra = GROUP_LEGACY_EXTRA[group];
      const legacy = (BRANDS[group] ? Object.keys(BRANDS[group]) : [])
        .concat(extra && BRANDS[extra] ? Object.keys(BRANDS[extra]) : [])
        .filter(b => !seen.has(norm(b)) && (seen.add(norm(b)), true));
      return fromCatalog.concat(legacy);
    }
  }
  const g = BRANDS[group];
  return g ? Object.keys(g) : [];
}

/* марки, которые показываем первыми (реально ходовые в КР) */
function popularBrandsFor(group) {
  const sub = GROUP_TO_SUB[group];
  if (sub && typeof catalogPopularBrands === 'function') {
    const p = catalogPopularBrands(sub, 12);
    if (p && p.length) return p;
  }
  return [];
}
function modelsFor(group, brand) {
  const sub = GROUP_TO_SUB[group];
  if (sub && typeof catalogModels === 'function') {
    const fromCatalog = catalogModels(sub, brand).map(m => m.name).filter(Boolean);
    if (fromCatalog.length) return [...new Set(fromCatalog)];
  }
  const g = BRANDS[group];
  return (g && g[brand]) ? g[brand] : [];
}
/* есть ли у бренда модели для каскада */
function brandHasModels(group, brand) {
  return modelsFor(group, brand).length > 0;
}
/* схема атрибутов для пары категория+подкатегория */
function attrSchema(catId, subName) {
  if (subName && ATTR_SCHEMA[subName]) return ATTR_SCHEMA[subName];
  if (catId && ATTR_SCHEMA_CAT[catId]) return ATTR_SCHEMA_CAT[catId];
  return null;
}
/* есть ли вообще атрибуты у этой категории/подкатегории */
function hasAttrs(catId, subName) { return !!attrSchema(catId, subName); }

/* локализованная подпись опции select по её значению */
function attrOptLabel(field, value) {
  if (!field || !field.options) return value;
  const o = field.options.find(x => x.v === value);
  return o ? aL(o.l) : value;
}
/* человекочитаемое значение атрибута для показа (с единицей) */
function attrDisplayValue(field, value) {
  if (value == null || value === '') return '';
  let s = field.type === 'select' ? attrOptLabel(field, value) : String(value);
  if (field.unit) s += ' ' + aL(field.unit);
  return s;
}

/* собрать [label, value] пары для показа на карточке/странице товара */
function attrPairs(catId, subName, attrs) {
  const schema = attrSchema(catId, subName);
  if (!schema || !attrs) return [];
  const out = [];
  for (const fld of schema) {
    const v = attrs[fld.key];
    if (v == null || v === '') continue;
    out.push([aL(fld.label), attrDisplayValue(fld, v)]);
  }
  return out;
}

/* ============================================================
   4. ПАРСЕР АТРИБУТОВ ИЗ ЗАГОЛОВКА (для ~580 мок-объявлений,
   чтобы фильтры по бренду/модели реально возвращали результаты).
   Юзерские объявления несут attrs явно — для них парсер не нужен.
   ============================================================ */
const BRAND_ALIAS = {
  'iphone': 'Apple', 'ipad': 'Apple', 'macbook': 'Apple', 'airpods': 'Apple', 'apple watch': 'Apple', 'imac': 'Apple',
  'galaxy': 'Samsung', 'мерседес': 'Mercedes-Benz', 'mercedes': 'Mercedes-Benz', 'бмв': 'BMW',
  'фольксваген': 'Volkswagen', 'vw': 'Volkswagen', 'ваз': 'Lada (ВАЗ)', 'лада': 'Lada (ВАЗ)', 'жигули': 'Lada (ВАЗ)',
  'газель': 'ГАЗ', 'тойота': 'Toyota', 'хонда': 'Honda', 'ниссан': 'Nissan', 'хёндай': 'Hyundai', 'хундай': 'Hyundai',
  'киа': 'Kia', 'лексус': 'Lexus', 'мазда': 'Mazda', 'ауди': 'Audi',
};

function _norm(s) { return s.toLowerCase().replace(/ё/g, 'е'); }

/* под-бренды выигрывают у родительского, если встречаются вместе
   (Xiaomi Redmi… → Redmi; Huawei Honor… → Honor) */
const BRAND_PRIORITY = ['Redmi', 'Honor'];
function detectBrandInTitle(group, tl) {
  const brands = brandsFor(group);
  for (const p of BRAND_PRIORITY) {
    if (brands.includes(p) && tl.includes(_norm(p))) return p;
  }
  for (const b of [...brands].sort((a, z) => z.length - a.length)) {
    const name = _norm(b).replace(/\s*\(.*?\)\s*/g, '').trim();
    if (name.length >= 2 && tl.includes(name)) return b;
  }
  for (const [al, canon] of Object.entries(BRAND_ALIAS)) {
    if (brands.includes(canon) && tl.includes(al)) return canon;
  }
  return null;
}

function parseAttrsFromTitle(catId, subName, title) {
  const schema = attrSchema(catId, subName);
  if (!schema || !title) return null;
  const tl = _norm(title);
  const attrs = {};
  const brandField = schema.find(f => f.type === 'brand');
  if (brandField) {
    const brand = detectBrandInTitle(brandField.group, tl);
    if (brand) {
      attrs.brand = brand;
      const models = modelsFor(brandField.group, brand);
      for (const m of [...models].sort((a, z) => z.length - a.length)) {
        const ml = _norm(m);
        if (ml.length <= 2 ? new RegExp('(^|\\s)' + ml.replace(/[-/]/g, '.') + '($|\\s)').test(tl) : tl.includes(ml)) { attrs.model = m; break; }
      }
    }
  }
  if (schema.some(f => f.key === 'year')) {
    const ym = title.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
    if (ym) attrs.year = +ym[1];
  }
  if (schema.some(f => f.key === 'storage')) {
    const sm = title.match(/(\d+)\s?(ТБ|TB|ГБ|GB)/i);
    if (sm) attrs.storage = String(/T/i.test(sm[2]) ? +sm[1] * 1024 : +sm[1]);
  }
  if (schema.some(f => f.key === 'screen')) {
    const dm = title.match(/(\d{2})["”]|(\d{2})\s?дюйм/i);
    if (dm) attrs.screen = dm[1] || dm[2];
  }
  return Object.keys(attrs).length ? attrs : null;
}

/* attrs объявления: явные (юзерские) или распарсенные из заголовка (мок),
   кэш в Map по id — НЕ на объекте (иначе попало бы в localStorage). */
const _attrCache = new Map();
function getAttrs(l) {
  if (l && l.attrs && typeof l.attrs === 'object' && Object.keys(l.attrs).length) return l.attrs;
  if (!l || !l.id) return {};
  if (_attrCache.has(l.id)) return _attrCache.get(l.id);
  const a = parseAttrsFromTitle(l.category, l.subcategory, l.title) || {};
  _attrCache.set(l.id, a);
  return a;
}

/* матч объявления под фильтры характеристик. Ключи *Min/*Max — диапазон,
   остальные — точное совпадение. Пустые значения игнорируются. */
function passesAttrs(l, fa) {
  const keys = Object.keys(fa || {});
  if (!keys.length) return true;
  const la = getAttrs(l);
  for (const k of keys) {
    const val = fa[k];
    if (val === '' || val == null) continue;
    if (k.endsWith('Min')) {
      const key = k.slice(0, -3);
      if (la[key] == null || +la[key] < +val) return false;
    } else if (k.endsWith('Max')) {
      const key = k.slice(0, -3);
      if (la[key] == null || +la[key] > +val) return false;
    } else if (k === 'gpu' || k === 'cpu' || k === 'chip') {
      // «rtx 4070» должно ловить и «RTX 4070 Laptop», и «GeForce RTX 4070»
      const have = String(la[k] || '').toLowerCase().replace(/\s+/g, ' ');
      const want = String(val).toLowerCase().replace(/\s+/g, ' ');
      if (!have.includes(want)) return false;
    } else if (k === 'screen') {
      // диагональ спрашивают округлённо: «12 дюймов» ловит 12.4 и 12.9
      const have = parseFloat(la[k]);
      if (!isFinite(have) || Math.abs(have - parseFloat(val)) > 0.95) return false;
    } else if (String(la[k] == null ? '' : la[k]) !== String(val)) {
      return false;
    }
  }
  return true;
}

/* активные фильтры характеристик → чипы [{key:'attr:<base>', label}] */
function attrFilterChips(f) {
  const schema = attrSchema(f.cat, f.sub);
  const fa = f.attrs || {};
  if (!schema) return [];
  const chips = [];
  for (const fld of schema) {
    if (fld.type === 'number') {
      const mn = fa[fld.key + 'Min'], mx = fa[fld.key + 'Max'];
      if ((mn != null && mn !== '') || (mx != null && mx !== '')) {
        let lab = aL(fld.label) + ': ';
        if (mn != null && mn !== '') lab += aL({ ru: 'от', en: 'from', ky: 'дан' }) + ' ' + mn + ' ';
        if (mx != null && mx !== '') lab += aL({ ru: 'до', en: 'to', ky: 'чейин' }) + ' ' + mx;
        chips.push({ key: 'attr:' + fld.key, label: lab.trim() });
      }
    } else {
      const key = fld.type === 'brand' ? 'brand' : (fld.type === 'model' ? 'model' : fld.key);
      const v = fa[key];
      if (v != null && v !== '') {
        const disp = (fld.type === 'brand' || fld.type === 'model' || fld.type === 'gen') ? v : attrOptLabel(fld, v);
        chips.push({ key: 'attr:' + key, label: disp });
      }
    }
  }

  /* Фильтры, которые проставил умный поиск, а не панель («автомат»,
     «китайский», «игровой», «раскладушка»): без этого выдача сужена, а
     причина не видна и снять её нечем — тупик. Показываем чипом. */
  const shown = new Set(schema.map(fl => (fl.type === 'brand' ? 'brand' : fl.type === 'model' ? 'model' : fl.key)));
  for (const k of Object.keys(fa)) {
    const bare = k.replace(/(Min|Max)$/, '');
    if (shown.has(bare) || fa[k] === '' || fa[k] == null) continue;
    if (chips.some(c => c.key === 'attr:' + bare)) continue;
    const lab = NLU_KEY_LABELS[bare];
    const val = NLU_VALUE_LABELS[String(fa[k])] || fa[k];
    chips.push({
      key: 'attr:' + bare,
      label: lab ? `${aL(lab)}: ${val}` : String(val),
    });
  }
  return chips;
}

/* подписи для атрибутов, которые приходят только из умного поиска */
const NLU_KEY_LABELS = {
  gearbox: T3('Коробка', 'Transmission', 'Кутуча'),
  drive: T3('Привод', 'Drivetrain', 'Жүргүзгүч'),
  fuel: T3('Топливо', 'Fuel', 'Күйүүчү май'),
  body: T3('Кузов', 'Body', 'Кузов'),
  country: T3('Страна', 'Country', 'Өлкө'),
  gaming: T3('Назначение', 'Purpose', 'Багыты'),
  foldable: T3('Тип', 'Type', 'Түрү'),
  battery: T3('Аккумулятор', 'Battery', 'Аккумулятор'),
  rangeKm: T3('Запас хода', 'Range', 'Аралык'),
  gpu: T3('Видеокарта', 'GPU', 'Видеокарта'),
  cpu: T3('Процессор', 'CPU', 'Процессор'),
  ram: T3('ОЗУ', 'RAM', 'ОЗУ'),
  storage: T3('Память', 'Storage', 'Эстутум'),
  screen: T3('Экран', 'Screen', 'Экран'),
  mileage: T3('Пробег', 'Mileage', 'Жүрүшү'),
  year: T3('Год', 'Year', 'Жыл'),
};
const NLU_VALUE_LABELS = { cn: 'Китай', '1': 'Складной' };

/* кол-во активных фильтров характеристик (диапазон = 1) */
function attrFilterCount(fa) {
  const seen = new Set();
  for (const k of Object.keys(fa || {})) {
    if (fa[k] === '' || fa[k] == null) continue;
    seen.add(k.replace(/(Min|Max)$/, ''));
  }
  return seen.size;
}

/* короткий «подзаголовок» характеристик для карточки — показываем ДОБАВОЧНОЕ
   (год / пробег / память / комнаты …), бренд и модель обычно уже в заголовке */
function attrSubtitle(catId, subName, attrs) {
  const schema = attrSchema(catId, subName);
  if (!schema || !attrs) return '';
  const PRIO = ['year', 'mileage', 'storage', 'rooms', 'area', 'body', 'gearbox', 'engineCC', 'screen', 'battery', 'gpu', 'shoeSize', 'size'];
  const byKey = {}; schema.forEach(f => { byKey[f.key] = f; });
  const parts = [];
  for (const k of PRIO) {
    const f = byKey[k]; if (!f) continue;
    const v = attrs[k]; if (v == null || v === '') continue;
    parts.push(attrDisplayValue(f, v));
    if (parts.length >= 3) break;
  }
  return parts.join(' · ');
}
