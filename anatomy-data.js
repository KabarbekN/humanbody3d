export const SYSTEMS = [
  { id: 'integumentary', label: 'Покровная система', short: 'Кожа', icon: '◌', layers: ['skin'] },
  { id: 'muscular', label: 'Мышечная система', short: 'Мышцы', icon: '◆', layers: ['muscle'] },
  { id: 'skeletal', label: 'Скелетная система', short: 'Скелет', icon: '◇', layers: ['skeleton'] },
  { id: 'nervous', label: 'Нервная система', short: 'Нервы и мозг', icon: '✦', layers: ['brain', 'nerve'] },
  { id: 'cardiovascular', label: 'Сердечно-сосудистая система', short: 'Сосуды', icon: '♥', layers: ['artery', 'vein'] },
  { id: 'respiratory', label: 'Дыхательная система', short: 'Дыхание', icon: '◫', layers: ['organ'] },
  { id: 'digestive', label: 'Пищеварительная система', short: 'Пищеварение', icon: '◒', layers: ['organ'] },
  { id: 'urinary', label: 'Мочевыделительная система', short: 'Почки', icon: '◐', layers: ['organ'] },
  { id: 'endocrine', label: 'Эндокринная система', short: 'Железы', icon: '✺', layers: ['organ', 'brain'] },
  { id: 'lymphatic', label: 'Лимфатическая система', short: 'Лимфа', icon: '✧', layers: ['organ'] },
  { id: 'reproductive', label: 'Репродуктивная система', short: 'Репродуктивная', icon: '◎', layers: ['organ'] }
];

export const SYSTEM_BY_ID = Object.fromEntries(SYSTEMS.map(system => [system.id, system]));

const DETAILS = {
  FMA7163: {
    system: 'integumentary', region: 'Всё тело', location: 'Наружная поверхность тела', major: true,
    functions: ['Защитный барьер', 'Терморегуляция', 'Осязание'],
    related: ['FMA52788', 'FMA52789', 'FMA13377', 'FMA13378']
  },
  FMA7274: {
    system: 'cardiovascular', region: 'Грудная клетка', location: 'Средостение, между лёгкими', major: true,
    latin: 'Cor', functions: ['Перекачивание крови', 'Поддержание системного и малого кругов кровообращения'],
    related: ['FMA3786', 'FMA66326', 'FMA66643', 'FMA7333', 'FMA7370']
  },
  FMA7197: {
    system: 'digestive', region: 'Брюшная полость', location: 'Преимущественно правое подреберье', major: true,
    latin: 'Hepar', functions: ['Обмен веществ', 'Образование желчи', 'Обезвреживание веществ'],
    related: ['FMA7202', 'FMA7148', 'FMA7198nsn']
  },
  FMA7202: {
    system: 'digestive', region: 'Брюшная полость', location: 'На нижней поверхности печени', major: true,
    latin: 'Vesica biliaris', functions: ['Накопление и концентрирование желчи'], related: ['FMA7197', 'FMA7206']
  },
  FMA7148: {
    system: 'digestive', region: 'Брюшная полость', location: 'Верхняя левая часть брюшной полости', major: true,
    latin: 'Gaster', functions: ['Механическая обработка пищи', 'Начальное переваривание белков'],
    related: ['FMA7131', 'FMA7206', 'FMA7198nsn']
  },
  FMA7198nsn: {
    system: 'digestive', region: 'Брюшная полость', location: 'Позади желудка', major: true,
    latin: 'Pancreas', functions: ['Синтез пищеварительных ферментов', 'Регуляция уровня глюкозы'],
    related: ['FMA7148', 'FMA7206']
  },
  FMA14543nsn: {
    system: 'digestive', region: 'Брюшная полость', location: 'Обрамляет петли тонкой кишки', major: true,
    latin: 'Colon', functions: ['Всасывание воды', 'Формирование каловых масс'],
    related: ['FMA7207', 'FMA7208', 'FMA14544', 'FMA14542']
  },
  FMA7204: {
    system: 'urinary', region: 'Забрюшинное пространство', location: 'Справа от позвоночника', major: true,
    latin: 'Ren dexter', functions: ['Фильтрация крови', 'Образование мочи', 'Регуляция водно-солевого баланса'],
    related: ['FMA15571', 'FMA15900', 'FMA14752', 'FMA14335']
  },
  FMA7205: {
    system: 'urinary', region: 'Забрюшинное пространство', location: 'Слева от позвоночника', major: true,
    latin: 'Ren sinister', functions: ['Фильтрация крови', 'Образование мочи', 'Регуляция водно-солевого баланса'],
    related: ['FMA15572', 'FMA15900', 'FMA14753', 'FMA14336']
  },
  FMA15900: {
    system: 'urinary', region: 'Малый таз', location: 'Позади лобкового симфиза', major: true,
    latin: 'Vesica urinaria', functions: ['Накопление мочи'], related: ['FMA15571', 'FMA15572']
  },
  FMA7333: { system: 'respiratory', region: 'Грудная клетка', location: 'Верхняя часть правого лёгкого', major: true, latin: 'Lobus superior pulmonis dextri', functions: ['Газообмен'], related: ['FMA7383', 'FMA7337', 'FMA7394'] },
  FMA7383: { system: 'respiratory', region: 'Грудная клетка', location: 'Средняя доля правого лёгкого', major: true, functions: ['Газообмен'], related: ['FMA7333', 'FMA7337'] },
  FMA7337: { system: 'respiratory', region: 'Грудная клетка', location: 'Нижняя часть правого лёгкого', major: true, functions: ['Газообмен'], related: ['FMA7333', 'FMA7383'] },
  FMA7370: { system: 'respiratory', region: 'Грудная клетка', location: 'Верхняя часть левого лёгкого', major: true, functions: ['Газообмен'], related: ['FMA7371', 'FMA7394'] },
  FMA7371: { system: 'respiratory', region: 'Грудная клетка', location: 'Нижняя часть левого лёгкого', major: true, functions: ['Газообмен'], related: ['FMA7370'] },
  FMA7394: { system: 'respiratory', region: 'Шея и грудная клетка', location: 'Между гортанью и бронхами', major: true, latin: 'Trachea', functions: ['Проведение воздуха'], related: ['FMA7409', 'FMA7333', 'FMA7370'] },
  FMA7196: { system: 'lymphatic', region: 'Брюшная полость', location: 'Левое подреберье', major: true, latin: 'Lien', functions: ['Иммунный ответ', 'Фильтрация крови'], related: ['FMA7148', 'FMA7197'] },
  FMA71194: { system: 'lymphatic', region: 'Грудная клетка', location: 'Переднее средостение', functions: ['Созревание T-лимфоцитов'], related: ['FMA71195'] },
  FMA71195: { system: 'lymphatic', region: 'Грудная клетка', location: 'Переднее средостение', functions: ['Созревание T-лимфоцитов'], related: ['FMA71194'] },
  FMA13889: { system: 'endocrine', region: 'Головной мозг', location: 'Основание мозга', major: true, latin: 'Hypophysis', functions: ['Гормональная регуляция эндокринных желёз'], related: ['FMA62008nsn'] },
  FMA62033: { system: 'endocrine', region: 'Головной мозг', location: 'Область эпиталамуса', major: true, latin: 'Glandula pinealis', functions: ['Регуляция циркадных ритмов'], related: ['FMA258714', 'FMA258716'] },
  FMA9600: { system: 'reproductive', region: 'Малый таз', location: 'Под мочевым пузырём', major: true, latin: 'Prostata', functions: ['Формирование части семенной жидкости'], related: ['FMA15900', 'FMA19387', 'FMA19388'] },
  FMA67944: { system: 'nervous', region: 'Задняя черепная ямка', location: 'Позади ствола мозга', major: true, latin: 'Cerebellum', functions: ['Координация движений', 'Поддержание равновесия'], related: ['FMA67943', 'FMA62004'] },
  FMA67943: { system: 'nervous', region: 'Ствол мозга', location: 'Между средним и продолговатым мозгом', major: true, latin: 'Pons', functions: ['Проводниковая функция', 'Участие в регуляции дыхания'], related: ['FMA67944', 'FMA62004', 'FMA61993nsn'] },
  FMA62004: { system: 'nervous', region: 'Ствол мозга', location: 'Ниже моста', major: true, latin: 'Medulla oblongata', functions: ['Регуляция дыхания и кровообращения', 'Защитные рефлексы'], related: ['FMA67943', 'FMA7647'] },
  FMA86464: { system: 'nervous', region: 'Головной мозг', location: 'Между полушариями', major: true, latin: 'Corpus callosum', functions: ['Связь между полушариями'], related: ['FMA72717', 'FMA72718'] },
  FMA72713: { system: 'nervous', region: 'Медиальная височная область', location: 'В глубине правой височной доли', major: true, latin: 'Hippocampus dexter', functions: ['Формирование памяти', 'Пространственная навигация'], related: ['FMA72832', 'FMA72705'] },
  FMA72714: { system: 'nervous', region: 'Медиальная височная область', location: 'В глубине левой височной доли', major: true, latin: 'Hippocampus sinister', functions: ['Формирование памяти', 'Пространственная навигация'], related: ['FMA72833', 'FMA72706'] },
  FMA72832: { system: 'nervous', region: 'Медиальная височная область', location: 'Перед правым гиппокампом', major: true, latin: 'Amygdala dextra', functions: ['Эмоциональная оценка', 'Формирование реакций страха'], related: ['FMA72713'] },
  FMA72833: { system: 'nervous', region: 'Медиальная височная область', location: 'Перед левым гиппокампом', major: true, latin: 'Amygdala sinistra', functions: ['Эмоциональная оценка', 'Формирование реакций страха'], related: ['FMA72714'] },
  FMA258714: { system: 'nervous', region: 'Промежуточный мозг', location: 'По сторонам третьего желудочка', major: true, latin: 'Thalamus dexter', functions: ['Переключение сенсорной информации'], related: ['FMA258716', 'FMA62008nsn'] },
  FMA258716: { system: 'nervous', region: 'Промежуточный мозг', location: 'По сторонам третьего желудочка', major: true, latin: 'Thalamus sinister', functions: ['Переключение сенсорной информации'], related: ['FMA258714', 'FMA62008nsn'] },
  FMA78449: { system: 'nervous', region: 'Головной мозг', location: 'Внутри правого полушария', major: true, functions: ['Циркуляция спинномозговой жидкости'], related: ['FMA78450'] },
  FMA78450: { system: 'nervous', region: 'Головной мозг', location: 'Внутри левого полушария', major: true, functions: ['Циркуляция спинномозговой жидкости'], related: ['FMA78449'] },
  FMA7647: { system: 'nervous', region: 'Позвоночный канал', location: 'От продолговатого мозга вниз по позвоночнику', major: true, latin: 'Medulla spinalis', functions: ['Проведение нервных импульсов', 'Спинальные рефлексы'], related: ['FMA62004'] },
  FMA3786: { system: 'cardiovascular', region: 'Грудная клетка', location: 'Вдоль позвоночника', major: true, latin: 'Aorta thoracica', functions: ['Доставка артериальной крови к органам грудной клетки'], related: ['FMA7274', 'FMA3784'] },
  FMA66326: { system: 'cardiovascular', region: 'Грудная клетка', location: 'От сердца к лёгким', major: true, functions: ['Перенос венозной крови к лёгким'], related: ['FMA7274', 'FMA66643'] },
  FMA66643: { system: 'cardiovascular', region: 'Грудная клетка', location: 'От лёгких к сердцу', major: true, functions: ['Перенос насыщенной кислородом крови к сердцу'], related: ['FMA7274', 'FMA66326'] }
};

const MUSCLE_REGION_RULES = [
  ['pectoralis|грудн', 'Грудная клетка'], ['abdom|живот|oblique', 'Живот'], ['deltoid|дельтовид', 'Плечевой пояс'],
  ['biceps|triceps|brachioradialis|плеч', 'Верхняя конечность'], ['glute|ягод', 'Таз'],
  ['femor|thigh|бедр|adductor|sartorius', 'Бедро'], ['gastrocnemius|soleus|tibialis|икрон|камбал|большеберц', 'Голень'],
  ['trapez|latissimus|спин', 'Спина'], ['sternocleidomastoid|сосцевид', 'Шея']
];

function inferSystem(entry) {
  const text = `${entry.ru} ${entry.en}`.toLowerCase();
  if (entry.layer === 'skin') return 'integumentary';
  if (entry.layer === 'muscle') return 'muscular';
  if (entry.layer === 'skeleton') return 'skeletal';
  if (entry.layer === 'brain' || entry.layer === 'nerve') return 'nervous';
  if (entry.layer === 'artery' || entry.layer === 'vein' || /heart|сердц/.test(text)) return 'cardiovascular';
  if (/lung|лёгк|trachea|трахе|bronch/.test(text)) return 'respiratory';
  if (/kidney|почка|ureter|мочеточ|bladder|мочевой/.test(text)) return 'urinary';
  if (/pituitary|pineal|adrenal|надпочеч|гипофиз|шишковид/.test(text)) return 'endocrine';
  if (/thymus|тимус|spleen|селез/.test(text)) return 'lymphatic';
  if (/prostate|яичк|testis|seminal|семенн/.test(text)) return 'reproductive';
  return 'digestive';
}

function inferRegion(entry) {
  const text = `${entry.ru} ${entry.en}`.toLowerCase();
  if (entry.layer === 'brain') return 'Головной мозг';
  if (entry.layer === 'nerve') return /optic|зритель/.test(text) ? 'Голова' : 'Центральная нервная система';
  if (entry.layer === 'muscle') {
    const found = MUSCLE_REGION_RULES.find(([pattern]) => new RegExp(pattern).test(text));
    return found?.[1] || 'Мышечная система';
  }
  if (entry.layer === 'skeleton') {
    if (/skull|bone|кость|челюст|теменн|височ|скул/.test(text) && !/femur|tibia|fibula|humerus|radius|ulna/.test(text)) return 'Череп';
    if (/rib|sternum|ребр|грудин/.test(text)) return 'Грудная клетка';
    if (/vertebra|позвон/.test(text)) return 'Позвоночник';
    if (/femur|tibia|fibula|patella|бедрен|большеберц|малоберц|надколен/.test(text)) return 'Нижняя конечность';
    if (/humerus|radius|ulna|плечев|лучев|локтев/.test(text)) return 'Верхняя конечность';
    if (/hip bone|тазов/.test(text)) return 'Таз';
  }
  return SYSTEM_BY_ID[inferSystem(entry)]?.short || 'Органы';
}

export function enrichEntry(entry) {
  const detail = DETAILS[entry.id] || {};
  const side = /right|прав/.test(`${entry.en} ${entry.ru}`.toLowerCase()) ? 'right'
    : /left|лев/.test(`${entry.en} ${entry.ru}`.toLowerCase()) ? 'left' : 'midline';
  return {
    system: detail.system || inferSystem(entry),
    region: detail.region || inferRegion(entry),
    location: detail.location || 'Расположение определяется положением структуры в анатомической модели.',
    functions: detail.functions || [],
    related: detail.related || [],
    major: detail.major ?? (entry.core && ['organ', 'brain', 'nerve'].includes(entry.layer)),
    latin: detail.latin || entry.latin || entry.en,
    side,
    keywords: [entry.ru, entry.en, detail.latin || entry.latin, entry.id, SYSTEM_BY_ID[detail.system || inferSystem(entry)]?.label, detail.region || inferRegion(entry), side].filter(Boolean)
  };
}

export const LEARNING_TOURS = [
  {
    id: 'body-systems', title: 'Системы организма', subtitle: '7 основных остановок', preset: 'all',
    steps: [
      { id: 'FMA7163', text: 'Кожа формирует наружный защитный покров тела.' },
      { id: 'FMA79979', text: 'Скелетные мышцы создают движение и поддерживают позу.' },
      { id: 'FMA13322', text: 'Скелет обеспечивает опору и защищает внутренние органы.' },
      { id: 'FMA7274', text: 'Сердце поддерживает циркуляцию крови.' },
      { id: 'FMA7333', text: 'Лёгкие обеспечивают газообмен.' },
      { id: 'FMA7197', text: 'Печень выполняет множество метаболических функций.' },
      { id: 'FMA67944', text: 'Нервная система координирует работу организма.' }
    ]
  },
  {
    id: 'brain', title: 'Строение мозга', subtitle: '9 структур', preset: 'brain',
    steps: [
      { id: 'FMA67944', text: 'Мозжечок координирует движения и равновесие.' },
      { id: 'FMA67943', text: 'Мост соединяет отделы нервной системы.' },
      { id: 'FMA62004', text: 'Продолговатый мозг регулирует жизненно важные функции.' },
      { id: 'FMA258714', text: 'Таламус переключает большинство сенсорных сигналов.' },
      { id: 'FMA86464', text: 'Мозолистое тело связывает два полушария.' },
      { id: 'FMA72713', text: 'Гиппокамп участвует в формировании памяти.' },
      { id: 'FMA72832', text: 'Миндалина участвует в эмоциональных реакциях.' },
      { id: 'FMA78449', text: 'Желудочки содержат спинномозговую жидкость.' },
      { id: 'FMA7647', text: 'Спинной мозг проводит сигналы между мозгом и телом.' }
    ]
  },
  {
    id: 'digestive', title: 'Пищеварительный тракт', subtitle: '8 структур', preset: 'internal',
    steps: [
      { id: 'FMA7131', text: 'Пищевод проводит пищу к желудку.' },
      { id: 'FMA7148', text: 'Желудок перемешивает пищу и начинает переваривание белков.' },
      { id: 'FMA7197', text: 'Печень участвует в обмене веществ и образовании желчи.' },
      { id: 'FMA7202', text: 'Жёлчный пузырь накапливает желчь.' },
      { id: 'FMA7198nsn', text: 'Поджелудочная железа выделяет ферменты и гормоны.' },
      { id: 'FMA7206', text: 'Двенадцатиперстная кишка получает желчь и панкреатический сок.' },
      { id: 'FMA7207', text: 'В тонкой кишке происходит основное всасывание питательных веществ.' },
      { id: 'FMA14543nsn', text: 'Толстая кишка всасывает воду и формирует содержимое кишечника.' }
    ]
  },
  {
    id: 'respiratory', title: 'Дыхательная система', subtitle: '6 структур', preset: 'internal',
    steps: [
      { id: 'FMA7394', text: 'Трахея проводит воздух к бронхам.' },
      { id: 'FMA7409', text: 'Бронхи распределяют воздух внутри лёгких.' },
      { id: 'FMA7333', text: 'Верхняя доля правого лёгкого.' },
      { id: 'FMA7383', text: 'Средняя доля присутствует только в правом лёгком.' },
      { id: 'FMA7370', text: 'Верхняя доля левого лёгкого.' },
      { id: 'FMA7371', text: 'Нижняя доля левого лёгкого.' }
    ]
  }
];

export const QUIZ_BANK = [
  'FMA7274', 'FMA7197', 'FMA7148', 'FMA7198nsn', 'FMA7204', 'FMA7205', 'FMA15900',
  'FMA7333', 'FMA7370', 'FMA7394', 'FMA7196', 'FMA67944', 'FMA67943', 'FMA62004',
  'FMA72713', 'FMA72714', 'FMA72832', 'FMA72833', 'FMA258714', 'FMA86464', 'FMA7647',
  'FMA24474', 'FMA24475', 'FMA23130', 'FMA23131', 'FMA13377', 'FMA13378', 'FMA38928', 'FMA38929'
];

export const APP_VERSION = '5.0.0-explorer';
