// Female body model anatomical data - BodyParts3D Female variant
// This extends the base anatomy with female-specific structures and variations

export const APP_VERSION = '5.1-female';

// Female-specific anatomical systems (replaces/extends male data)
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

// Female-specific anatomical details
const FEMALE_DETAILS = {
  // Pelvis - key female-specific feature
  FMA16586: { // Right hip bone (female)
    system: 'skeletal', region: 'Pelvis', location: 'Right side of pelvis', major: true,
    description: 'Right hip bone (female variant) - wider pelvic inlet for childbirth',
    functions: ['Support for pelvic organs', 'Attachment for leg muscles'],
    related: ['FMA16587', 'FMA16202']
  },
  FMA16587: { // Left hip bone (female)
    system: 'skeletal', region: 'Pelvis', location: 'Left side of pelvis', major: true,
    description: 'Left hip bone (female variant) - wider pelvic inlet',
    functions: ['Support for pelvic organs', 'Attachment for leg muscles'],
    related: ['FMA16586', 'FMA16202']
  },
  FMA16202: { // Sacrum (female)
    system: 'skeletal', region: 'Pelvis', location: 'Bottom of spine', major: true,
    description: 'Sacrum (female variant) - shorter and less curved than male',
    functions: ['Support for pelvis', 'Protection of pelvic organs'],
    related: ['FMA16586', 'FMA16587']
  },

  // Female reproductive organs
  FMA7486: { // Uterus
    system: 'reproductive', region: 'Pelvis', location: 'Center of pelvis, between bladder and rectum', major: true,
    latin: 'Uterus', functions: ['Pregnancy support', 'Menstrual cycle regulation'],
    description: 'Pear-shaped organ where a fetus develops during pregnancy',
    related: ['FMA7208', 'FMA7209', 'FMA18255', 'FMA18256']
  },
  FMA7204: { // Ovary right
    system: 'reproductive', region: 'Pelvis', location: 'Right side of uterus', major: true,
    latin: 'Ovarium dextrum', functions: ['Egg production', 'Hormone production'],
    description: 'Right ovary - produces eggs and hormones (estrogen, progesterone)',
    related: ['FMA7208', 'FMA7486', 'FMA18255']
  },
  FMA7205: { // Ovary left
    system: 'reproductive', region: 'Pelvis', location: 'Left side of uterus', major: true,
    latin: 'Ovarium sinistrum', functions: ['Egg production', 'Hormone production'],
    description: 'Left ovary - produces eggs and hormones',
    related: ['FMA7209', 'FMA7486', 'FMA18256']
  },
  FMA18256: { // Fallopian tube right
    system: 'reproductive', region: 'Pelvis', location: 'Above right ovary', major: true,
    latin: 'Tuba uterina dextra', functions: ['Egg transport', 'Fertilization site'],
    description: 'Right fallopian tube - transports egg from ovary to uterus',
    related: ['FMA7204', 'FMA7486']
  },
  FMA18255: { // Fallopian tube left
    system: 'reproductive', region: 'Pelvis', location: 'Above left ovary', major: true,
    latin: 'Tuba uterina sinistra', functions: ['Egg transport', 'Fertilization site'],
    description: 'Left fallopian tube - transports egg from ovary to uterus',
    related: ['FMA7205', 'FMA7486']
  },
  FMA19949: { // Vagina
    system: 'reproductive', region: 'Perineum', location: 'Below uterus', major: true,
    latin: 'Vagina', functions: ['Birth canal', 'Sexual intercourse', 'Menstrual flow'],
    description: 'Muscular canal connecting uterus to external genitalia',
    related: ['FMA7486']
  },

  // Breast tissue
  FMA9601: { // Right breast
    system: 'integumentary', region: 'Thorax', location: 'Right chest wall', major: true,
    latin: 'Glandula mammaria dextra', functions: ['Milk production', 'Sexual sensation'],
    description: 'Right mammary gland - develops during puberty and pregnancy',
    related: ['FMA9602']
  },
  FMA9602: { // Left breast
    system: 'integumentary', region: 'Thorax', location: 'Left chest wall', major: true,
    latin: 'Glandula mammaria sinistra', functions: ['Milk production', 'Sexual sensation'],
    description: 'Left mammary gland - develops during puberty and pregnancy',
    related: ['FMA9601']
  }
};

// Merge base details with female-specific details
export const DETAILS = {
  ...FEMALE_DETAILS
};

// Learning tours specific to female anatomy
export const LEARNING_TOURS = [
  {
    id: 'female-reproductive-tour',
    title: 'Женская репродуктивная система',
    description: 'Интерактивный тур по органам женской репродуктивной системы',
    duration: '8 минут',
    steps: [
      { target: 'FMA7486', camera: [0, -2, 8], labelMode: 'major', description: 'Матка - орган, где развивается плод' },
      { target: 'FMA7204', camera: [-3, -2, 8], description: 'Правый яичник - производит яйцеклетки' },
      { target: 'FMA7205', camera: [3, -2, 8], description: 'Левый яичник - производит яйцеклетки' },
      { target: 'FMA18255', camera: [3, 0, 8], description: 'Левая маточная труба - транспортирует яйцеклетку' },
      { target: 'FMA18256', camera: [-3, 0, 8], description: 'Правая маточная труба - транспортирует яйцеклетку' },
      { target: 'FMA19949', camera: [0, -4, 8], description: 'Влагалище - родовой канал' }
    ]
  },
  {
    id: 'female-pelvis-tour',
    title: 'Женский таз',
    description: 'Особенности строения женского таза',
    duration: '6 минут',
    steps: [
      { target: 'FMA16586', camera: [-4, -3, 8], description: 'Правая тазовая кость - шире, чем у мужчин' },
      { target: 'FMA16587', camera: [4, -3, 8], description: 'Левая тазовая кость - расширена для рождения' },
      { target: 'FMA16202', camera: [0, -3, 8], description: 'Крестец (женский вариант) - более короткий и менее изогнутый' },
      { camera: [0, -2, 10], labelMode: 'system', description: 'Женский таз шире и более округлый' }
    ]
  }
];

// Female-specific quiz questions
export const QUIZ_BANK = [
  {
    id: 'female-reproductive-q1',
    system: 'reproductive',
    question: 'Какой орган производит яйцеклетки?',
    answers: [
      { text: 'Яичник', correct: true, explanation: 'Яичники производят яйцеклетки и гормоны' },
      { text: 'Матка', correct: false, explanation: 'Матка - это орган, где развивается плод' },
      { text: 'Маточная труба', correct: false, explanation: 'Маточная труба транспортирует яйцеклетку' }
    ]
  },
  {
    id: 'female-reproductive-q2',
    system: 'reproductive',
    question: 'Какой путь проходит яйцеклетка после выхода из яичника?',
    answers: [
      { text: 'Маточная труба → Матка → Влагалище', correct: true, explanation: 'Яйцеклетка проходит через маточную трубу в матку' },
      { text: 'Матка → Маточная труба → Яичник', correct: false, explanation: 'Направление неправильное' },
      { text: 'Влагалище → Матка → Маточная труба', correct: false, explanation: 'Направление неправильное' }
    ]
  },
  {
    id: 'female-pelvis-q1',
    system: 'skeletal',
    question: 'Какая особенность женского таза по сравнению с мужским?',
    answers: [
      { text: 'Более широкий пораз', correct: true, explanation: 'Женский таз шире для возможности рождения' },
      { text: 'Более узкий пораз', correct: false, explanation: 'Напротив, женский таз более широкий' },
      { text: 'Одинаковый размер', correct: false, explanation: 'Размеры существенно отличаются' }
    ]
  }
];

// Female-specific anatomical measurements (cm)
export const FEMALE_STATS = {
  pelvisBreadth: { min: 28, max: 35, average: 31 },
  pelvicInletWidth: { min: 13, max: 14, average: 13.5 },
  pelvicOutletWidth: { min: 11, max: 13, average: 12 },
  sacralPromontoryToSymphysisPubis: { min: 12.5, max: 13, average: 12.75 }
};

// Export enrichment function
export function enrichEntry(part, details = {}) {
  if (!details.id || !details.ru) return null;
  
  const female_specific = DETAILS[details.id];
  
  return {
    ...part,
    ...details,
    ...female_specific
  };
}
