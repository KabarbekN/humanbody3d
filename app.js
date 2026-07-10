import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const REMOTE_ROOT = 'https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/BodyParts3D/main/assets/BodyParts3D_data/stl/';
const RAW_ROOT = new URLSearchParams(location.search).get('assets') === 'local' ? './models/' : REMOTE_ROOT;
const WORLD_HEIGHT = 6.4;
const REFERENCE_HEIGHT_CM = 175;
const canvas = document.getElementById('sceneCanvas');
const viewport = document.getElementById('viewport');

const layerDefinitions = {
  skin:     { label: 'Кожа',         color: '#bd826d', visible: false, opacity: 0.24, order: 6 },
  muscle:   { label: 'Мышцы',        color: '#8f2830', visible: true,  opacity: 1.00, order: 5 },
  skeleton: { label: 'Скелет',       color: '#e6ddc2', visible: false, opacity: 1.00, order: 2 },
  organ:    { label: 'Органы',       color: '#a85b55', visible: false, opacity: 1.00, order: 4 },
  artery:   { label: 'Артерии',      color: '#c52c3b', visible: false, opacity: 1.00, order: 3 },
  vein:     { label: 'Вены',         color: '#315a9e', visible: false, opacity: 1.00, order: 3 },
  nerve:    { label: 'Нервы',        color: '#d7bd55', visible: false, opacity: 1.00, order: 3 }
};

function part(id, ru, en, layer, options = {}) {
  return {
    id,
    ru,
    en,
    latin: options.latin || en,
    layer,
    color: options.color,
    core: options.core !== false,
    description: options.description || defaultDescription(layer, ru),
    file: `${id}.stl`
  };
}

function defaultDescription(layer, name) {
  const descriptions = {
    skin: `${name} — внешняя покровная структура модели.`,
    muscle: `${name} — сегментированная мышечная структура взрослого мужского анатомического эталона.`,
    skeleton: `${name} — сегментированная костная структура взрослого мужского анатомического эталона.`,
    organ: `${name} — сегментированная внутренняя анатомическая структура.`,
    artery: `${name} — сегмент артериального русла.`,
    vein: `${name} — сегмент венозного русла.`,
    nerve: `${name} — сегмент нервной системы.`
  };
  return descriptions[layer] || name;
}

const catalog = [
  // Anchor / outer layer
  part('FMA7163', 'Кожа', 'Skin', 'skin', {
    description: 'Полная поверхность кожи. Этот меш используется как пространственный эталон для масштаба и ориентации всей модели.'
  }),

  // Skeleton — axial skeleton
  part('FMA52788', 'Правая теменная кость', 'Right parietal bone', 'skeleton'),
  part('FMA52789', 'Левая теменная кость', 'Left parietal bone', 'skeleton'),
  part('FMA52738', 'Правая височная кость', 'Right temporal bone', 'skeleton'),
  part('FMA52739', 'Левая височная кость', 'Left temporal bone', 'skeleton'),
  part('FMA52892', 'Правая скуловая кость', 'Right zygomatic bone', 'skeleton'),
  part('FMA52893', 'Левая скуловая кость', 'Left zygomatic bone', 'skeleton'),
  part('FMA53647', 'Правая носовая кость', 'Right nasal bone', 'skeleton', { core: false }),
  part('FMA53648', 'Левая носовая кость', 'Left nasal bone', 'skeleton', { core: false }),
  part('FMA53649', 'Правая верхняя челюсть', 'Right maxilla', 'skeleton'),
  part('FMA53650', 'Левая верхняя челюсть', 'Left maxilla', 'skeleton'),
  part('FMA52748', 'Нижняя челюсть', 'Mandible', 'skeleton'),
  part('FMA12519', 'Атлант C1', 'Atlas vertebra', 'skeleton'),
  part('FMA12520', 'Осевой позвонок C2', 'Axis vertebra', 'skeleton'),
  part('FMA12521', 'Третий шейный позвонок', 'Third cervical vertebra', 'skeleton'),
  part('FMA12522', 'Четвёртый шейный позвонок', 'Fourth cervical vertebra', 'skeleton'),
  part('FMA12523', 'Пятый шейный позвонок', 'Fifth cervical vertebra', 'skeleton'),
  part('FMA12524', 'Шестой шейный позвонок', 'Sixth cervical vertebra', 'skeleton'),
  part('FMA12525', 'Седьмой шейный позвонок', 'Seventh cervical vertebra', 'skeleton'),
  part('FMA9165', 'Первый грудной позвонок', 'First thoracic vertebra', 'skeleton'),
  part('FMA9187', 'Второй грудной позвонок', 'Second thoracic vertebra', 'skeleton'),
  part('FMA9209', 'Третий грудной позвонок', 'Third thoracic vertebra', 'skeleton'),
  part('FMA9248', 'Четвёртый грудной позвонок', 'Fourth thoracic vertebra', 'skeleton'),
  part('FMA9922', 'Пятый грудной позвонок', 'Fifth thoracic vertebra', 'skeleton'),
  part('FMA9945', 'Шестой грудной позвонок', 'Sixth thoracic vertebra', 'skeleton'),
  part('FMA9968', 'Седьмой грудной позвонок', 'Seventh thoracic vertebra', 'skeleton'),
  part('FMA9991', 'Восьмой грудной позвонок', 'Eighth thoracic vertebra', 'skeleton'),
  part('FMA10014', 'Девятый грудной позвонок', 'Ninth thoracic vertebra', 'skeleton'),
  part('FMA10037', 'Десятый грудной позвонок', 'Tenth thoracic vertebra', 'skeleton'),
  part('FMA10059', 'Одиннадцатый грудной позвонок', 'Eleventh thoracic vertebra', 'skeleton'),
  part('FMA10081', 'Двенадцатый грудной позвонок', 'Twelfth thoracic vertebra', 'skeleton'),
  part('FMA13072', 'Первый поясничный позвонок', 'First lumbar vertebra', 'skeleton'),
  part('FMA13073', 'Второй поясничный позвонок', 'Second lumbar vertebra', 'skeleton'),
  part('FMA13074', 'Третий поясничный позвонок', 'Third lumbar vertebra', 'skeleton'),
  part('FMA13075', 'Четвёртый поясничный позвонок', 'Fourth lumbar vertebra', 'skeleton'),
  part('FMA13076', 'Пятый поясничный позвонок', 'Fifth lumbar vertebra', 'skeleton'),
  part('FMA16202', 'Крестец', 'Sacrum', 'skeleton'),
  part('FMA7485', 'Грудина', 'Sternum', 'skeleton'),

  // Ribs
  ...[
    ['FMA7857','Правое I ребро','Right first rib'], ['FMA7987','Левое I ребро','Left first rib'],
    ['FMA7882','Правое II ребро','Right second rib'], ['FMA8012','Левое II ребро','Left second rib'],
    ['FMA7909','Правое III ребро','Right third rib'], ['FMA8039','Левое III ребро','Left third rib'],
    ['FMA7957','Правое IV ребро','Right fourth rib'], ['FMA8148','Левое IV ребро','Left fourth rib'],
    ['FMA8066','Правое V ребро','Right fifth rib'], ['FMA8093','Левое V ребро','Left fifth rib'],
    ['FMA8175','Правое VI ребро','Right sixth rib'], ['FMA8202','Левое VI ребро','Left sixth rib'],
    ['FMA8229','Правое VII ребро','Right seventh rib'], ['FMA8256','Левое VII ребро','Left seventh rib'],
    ['FMA8283','Правое VIII ребро','Right eighth rib'], ['FMA8310','Левое VIII ребро','Left eighth rib'],
    ['FMA8364','Правое IX ребро','Right ninth rib'], ['FMA8391','Левое IX ребро','Left ninth rib'],
    ['FMA8445','Правое X ребро','Right tenth rib'], ['FMA8472','Левое X ребро','Left tenth rib'],
    ['FMA8531','Правое XI ребро','Right eleventh rib'], ['FMA8532','Левое XI ребро','Left eleventh rib'],
    ['FMA8533','Правое XII ребро','Right twelfth rib'], ['FMA8534','Левое XII ребро','Left twelfth rib']
  ].map(([id,ru,en]) => part(id,ru,en,'skeleton')),

  // Appendicular skeleton
  part('FMA13322', 'Правая ключица', 'Right clavicle', 'skeleton'),
  part('FMA13323', 'Левая ключица', 'Left clavicle', 'skeleton'),
  part('FMA13395', 'Правая лопатка', 'Right scapula', 'skeleton'),
  part('FMA13396', 'Левая лопатка', 'Left scapula', 'skeleton'),
  part('FMA23130', 'Правая плечевая кость', 'Right humerus', 'skeleton'),
  part('FMA23131', 'Левая плечевая кость', 'Left humerus', 'skeleton'),
  part('FMA23464', 'Правая лучевая кость', 'Right radius', 'skeleton'),
  part('FMA23465', 'Левая лучевая кость', 'Left radius', 'skeleton'),
  part('FMA23467', 'Правая локтевая кость', 'Right ulna', 'skeleton'),
  part('FMA23468', 'Левая локтевая кость', 'Left ulna', 'skeleton'),
  part('FMA16586', 'Правая тазовая кость', 'Right hip bone', 'skeleton'),
  part('FMA16587', 'Левая тазовая кость', 'Left hip bone', 'skeleton'),
  part('FMA24474', 'Правая бедренная кость', 'Right femur', 'skeleton'),
  part('FMA24475', 'Левая бедренная кость', 'Left femur', 'skeleton'),
  part('FMA24486', 'Правый надколенник', 'Right patella', 'skeleton'),
  part('FMA24487', 'Левый надколенник', 'Left patella', 'skeleton'),
  part('FMA24477', 'Правая большеберцовая кость', 'Right tibia', 'skeleton'),
  part('FMA24478', 'Левая большеберцовая кость', 'Left tibia', 'skeleton'),
  part('FMA24480', 'Правая малоберцовая кость', 'Right fibula', 'skeleton'),
  part('FMA24481', 'Левая малоберцовая кость', 'Left fibula', 'skeleton'),
  part('FMA24482', 'Правая таранная кость', 'Right talus', 'skeleton', { core: false }),
  part('FMA24483', 'Левая таранная кость', 'Left talus', 'skeleton', { core: false }),
  part('FMA24497', 'Правая пяточная кость', 'Right calcaneus', 'skeleton'),
  part('FMA24498', 'Левая пяточная кость', 'Left calcaneus', 'skeleton'),

  // Muscles — neck and torso
  part('FMA13408', 'Правая грудино-ключично-сосцевидная мышца', 'Right sternocleidomastoid', 'muscle'),
  part('FMA13409', 'Левая грудино-ключично-сосцевидная мышца', 'Left sternocleidomastoid', 'muscle'),
  part('FMA34690', 'Ключичная часть правой большой грудной мышцы', 'Clavicular part of right pectoralis major', 'muscle'),
  part('FMA34691', 'Ключичная часть левой большой грудной мышцы', 'Clavicular part of left pectoralis major', 'muscle'),
  part('FMA79979', 'Грудинно-рёберная часть правой большой грудной мышцы', 'Sternocostal part of right pectoralis major', 'muscle'),
  part('FMA79980', 'Грудинно-рёберная часть левой большой грудной мышцы', 'Sternocostal part of left pectoralis major', 'muscle'),
  part('FMA45874', 'Брюшная часть правой большой грудной мышцы', 'Abdominal part of right pectoralis major', 'muscle'),
  part('FMA45875', 'Брюшная часть левой большой грудной мышцы', 'Abdominal part of left pectoralis major', 'muscle'),
  part('FMA13375', 'Правая малая грудная мышца', 'Right pectoralis minor', 'muscle'),
  part('FMA13376', 'Левая малая грудная мышца', 'Left pectoralis minor', 'muscle'),
  part('FMA13377', 'Правая прямая мышца живота', 'Right rectus abdominis', 'muscle'),
  part('FMA13378', 'Левая прямая мышца живота', 'Left rectus abdominis', 'muscle'),
  part('FMA13336', 'Правая наружная косая мышца живота', 'Right external oblique', 'muscle'),
  part('FMA13337', 'Левая наружная косая мышца живота', 'Left external oblique', 'muscle'),
  part('FMA13892', 'Правая внутренняя косая мышца живота', 'Right internal oblique', 'muscle', { core: false }),
  part('FMA13893', 'Левая внутренняя косая мышца живота', 'Left internal oblique', 'muscle', { core: false }),
  part('FMA22344', 'Правая поперечная мышца живота', 'Right transversus abdominis', 'muscle', { core: false }),
  part('FMA22345', 'Левая поперечная мышца живота', 'Left transversus abdominis', 'muscle', { core: false }),
  part('FMA13398', 'Правая передняя зубчатая мышца', 'Right serratus anterior', 'muscle'),
  part('FMA13399', 'Левая передняя зубчатая мышца', 'Left serratus anterior', 'muscle'),
  part('FMA13358', 'Правая широчайшая мышца спины', 'Right latissimus dorsi', 'muscle'),
  part('FMA13359', 'Левая широчайшая мышца спины', 'Left latissimus dorsi', 'muscle'),
  part('FMA33586', 'Нисходящая часть правой трапециевидной мышцы', 'Descending part of right trapezius', 'muscle'),
  part('FMA33587', 'Нисходящая часть левой трапециевидной мышцы', 'Descending part of left trapezius', 'muscle'),
  part('FMA33584', 'Поперечная часть правой трапециевидной мышцы', 'Transverse part of right trapezius', 'muscle'),
  part('FMA33585', 'Поперечная часть левой трапециевидной мышцы', 'Transverse part of left trapezius', 'muscle'),
  part('FMA33581', 'Восходящая часть правой трапециевидной мышцы', 'Ascending part of right trapezius', 'muscle'),
  part('FMA33583', 'Восходящая часть левой трапециевидной мышцы', 'Ascending part of left trapezius', 'muscle'),

  // Muscles — shoulder and arms
  part('FMA34680', 'Ключичная часть правой дельтовидной мышцы', 'Clavicular part of right deltoid', 'muscle'),
  part('FMA34681', 'Ключичная часть левой дельтовидной мышцы', 'Clavicular part of left deltoid', 'muscle'),
  part('FMA34682', 'Акромиальная часть правой дельтовидной мышцы', 'Acromial part of right deltoid', 'muscle'),
  part('FMA34683', 'Акромиальная часть левой дельтовидной мышцы', 'Acromial part of left deltoid', 'muscle'),
  part('FMA34684', 'Остистая часть правой дельтовидной мышцы', 'Spinal part of right deltoid', 'muscle'),
  part('FMA34685', 'Остистая часть левой дельтовидной мышцы', 'Spinal part of left deltoid', 'muscle'),
  part('FMA37684', 'Короткая головка правой двуглавой мышцы плеча', 'Short head of right biceps brachii', 'muscle'),
  part('FMA37685', 'Короткая головка левой двуглавой мышцы плеча', 'Short head of left biceps brachii', 'muscle'),
  part('FMA37686', 'Длинная головка правой двуглавой мышцы плеча', 'Long head of right biceps brachii', 'muscle'),
  part('FMA37687', 'Длинная головка левой двуглавой мышцы плеча', 'Long head of left biceps brachii', 'muscle'),
  part('FMA37697', 'Латеральная головка правой трёхглавой мышцы плеча', 'Lateral head of right triceps brachii', 'muscle'),
  part('FMA37698', 'Латеральная головка левой трёхглавой мышцы плеча', 'Lateral head of left triceps brachii', 'muscle'),
  part('FMA37699', 'Длинная головка правой трёхглавой мышцы плеча', 'Long head of right triceps brachii', 'muscle'),
  part('FMA37700', 'Длинная головка левой трёхглавой мышцы плеча', 'Long head of left triceps brachii', 'muscle'),
  part('FMA38486', 'Правая плечелучевая мышца', 'Right brachioradialis', 'muscle'),
  part('FMA38487', 'Левая плечелучевая мышца', 'Left brachioradialis', 'muscle'),

  // Muscles — pelvis and legs
  part('FMA22328', 'Правая большая ягодичная мышца', 'Right gluteus maximus', 'muscle'),
  part('FMA22329', 'Левая большая ягодичная мышца', 'Left gluteus maximus', 'muscle'),
  part('FMA22330', 'Правая средняя ягодичная мышца', 'Right gluteus medius', 'muscle'),
  part('FMA22331', 'Левая средняя ягодичная мышца', 'Left gluteus medius', 'muscle'),
  part('FMA22354', 'Правая портняжная мышца', 'Right sartorius', 'muscle'),
  part('FMA22355', 'Левая портняжная мышца', 'Left sartorius', 'muscle'),
  part('FMA38928', 'Правая прямая мышца бедра', 'Right rectus femoris', 'muscle'),
  part('FMA38929', 'Левая прямая мышца бедра', 'Left rectus femoris', 'muscle'),
  part('FMA38930', 'Правая латеральная широкая мышца бедра', 'Right vastus lateralis', 'muscle'),
  part('FMA38931', 'Левая латеральная широкая мышца бедра', 'Left vastus lateralis', 'muscle'),
  part('FMA38932', 'Правая медиальная широкая мышца бедра', 'Right vastus medialis', 'muscle'),
  part('FMA38933', 'Левая медиальная широкая мышца бедра', 'Left vastus medialis', 'muscle'),
  part('FMA22456', 'Правая длинная приводящая мышца', 'Right adductor longus', 'muscle'),
  part('FMA22457', 'Левая длинная приводящая мышца', 'Left adductor longus', 'muscle'),
  part('FMA22459', 'Правая большая приводящая мышца', 'Right adductor magnus', 'muscle', { core: false }),
  part('FMA22460', 'Левая большая приводящая мышца', 'Left adductor magnus', 'muscle', { core: false }),
  part('FMA45888', 'Длинная головка правой двуглавой мышцы бедра', 'Long head of right biceps femoris', 'muscle'),
  part('FMA45889', 'Длинная головка левой двуглавой мышцы бедра', 'Long head of left biceps femoris', 'muscle'),
  part('FMA22358', 'Правая полусухожильная мышца', 'Right semitendinosus', 'muscle'),
  part('FMA22359', 'Левая полусухожильная мышца', 'Left semitendinosus', 'muscle'),
  part('FMA22448', 'Правая полуперепончатая мышца', 'Right semimembranosus', 'muscle', { core: false }),
  part('FMA22449', 'Левая полуперепончатая мышца', 'Left semimembranosus', 'muscle', { core: false }),
  part('FMA45957', 'Медиальная головка правой икроножной мышцы', 'Medial head of right gastrocnemius', 'muscle'),
  part('FMA45958', 'Медиальная головка левой икроножной мышцы', 'Medial head of left gastrocnemius', 'muscle'),
  part('FMA45960', 'Латеральная головка правой икроножной мышцы', 'Lateral head of right gastrocnemius', 'muscle'),
  part('FMA45961', 'Латеральная головка левой икроножной мышцы', 'Lateral head of left gastrocnemius', 'muscle'),
  part('FMA22558', 'Правая камбаловидная мышца', 'Right soleus', 'muscle'),
  part('FMA22559', 'Левая камбаловидная мышца', 'Left soleus', 'muscle'),
  part('FMA22544', 'Правая передняя большеберцовая мышца', 'Right tibialis anterior', 'muscle'),
  part('FMA22545', 'Левая передняя большеберцовая мышца', 'Left tibialis anterior', 'muscle'),

  // Internal organs — verified actual meshes where available
  part('FMA7333', 'Верхняя доля правого лёгкого', 'Upper lobe of right lung', 'organ', { color: '#b87a78' }),
  part('FMA7383', 'Средняя доля правого лёгкого', 'Middle lobe of right lung', 'organ', { color: '#b87a78' }),
  part('FMA7337', 'Нижняя доля правого лёгкого', 'Lower lobe of right lung', 'organ', { color: '#aa6869' }),
  part('FMA7370', 'Верхняя доля левого лёгкого', 'Upper lobe of left lung', 'organ', { color: '#b87a78' }),
  part('FMA7371', 'Нижняя доля левого лёгкого', 'Lower lobe of left lung', 'organ', { color: '#aa6869' }),
  part('FMA7197', 'Печень', 'Liver', 'organ', { color: '#71353a' }),
  part('FMA7148', 'Желудок', 'Stomach', 'organ', { color: '#b06f65' }),
  part('FMA7198nsn', 'Поджелудочная железа', 'Pancreas', 'organ', { color: '#c69a69' }),
  part('FMA14543nsn', 'Ободочная кишка', 'Colon', 'organ', { color: '#b88874' }),
  part('FMA7204', 'Правая почка', 'Right kidney', 'organ', { color: '#71343e' }),
  part('FMA7205', 'Левая почка', 'Left kidney', 'organ', { color: '#71343e' }),
  part('FMA15629', 'Правый надпочечник', 'Right adrenal gland', 'organ', { color: '#9b7448', core: false }),
  part('FMA15630', 'Левый надпочечник', 'Left adrenal gland', 'organ', { color: '#9b7448', core: false }),
  part('FMA15571', 'Правый мочеточник', 'Right ureter', 'organ', { color: '#c49a72', core: false }),
  part('FMA15572', 'Левый мочеточник', 'Left ureter', 'organ', { color: '#c49a72', core: false }),

  // Major vessels
  part('FMA3786', 'Грудная аорта', 'Thoracic aorta', 'artery'),
  part('FMA3784', 'Нисходящая аорта', 'Descending aorta', 'artery'),
  part('FMA3941', 'Правая общая сонная артерия', 'Right common carotid artery', 'artery'),
  part('FMA4058', 'Левая общая сонная артерия', 'Left common carotid artery', 'artery'),
  part('FMA3953', 'Правая подключичная артерия', 'Right subclavian artery', 'artery'),
  part('FMA4694', 'Левая подключичная артерия', 'Left subclavian artery', 'artery'),
  part('FMA14752', 'Правая почечная артерия', 'Right renal artery', 'artery'),
  part('FMA14753', 'Левая почечная артерия', 'Left renal artery', 'artery'),
  part('FMA14765', 'Правая общая подвздошная артерия', 'Right common iliac artery', 'artery'),
  part('FMA14766', 'Левая общая подвздошная артерия', 'Left common iliac artery', 'artery'),
  part('FMA66326', 'Лёгочная артерия', 'Pulmonary artery', 'artery'),
  part('FMA14335', 'Правая почечная вена', 'Right renal vein', 'vein'),
  part('FMA14336', 'Левая почечная вена', 'Left renal vein', 'vein'),
  part('FMA21387', 'Правая общая подвздошная вена', 'Right common iliac vein', 'vein'),
  part('FMA21388', 'Левая общая подвздошная вена', 'Left common iliac vein', 'vein'),
  part('FMA4754', 'Правая внутренняя яремная вена', 'Right internal jugular vein', 'vein'),
  part('FMA4762', 'Левая внутренняя яремная вена', 'Left internal jugular vein', 'vein'),
  part('FMA66643', 'Лёгочная вена', 'Pulmonary vein', 'vein'),

  // Nervous structures
  part('FMA50875', 'Правый зрительный нерв', 'Right optic nerve', 'nerve', { core: false }),
  part('FMA50878', 'Левый зрительный нерв', 'Left optic nerve', 'nerve', { core: false })
];

const state = {
  layer: Object.fromEntries(Object.entries(layerDefinitions).map(([key, value]) => [key, { visible: value.visible, opacity: value.opacity }])),
  loaded: new Map(),
  failed: new Set(),
  selected: null,
  isolated: false,
  coreLoading: true,
  detailLoaded: false,
  anchorCenter: new THREE.Vector3(),
  rootScale: 1,
  explode: 0,
  clipEnabled: false,
  clipValue: 0,
  targetCamera: null,
  targetLookAt: null
};

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080c11);
scene.fog = new THREE.FogExp2(0x080c11, 0.035);

const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
camera.position.set(0, 0.15, 9.3);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.05).texture;
pmremGenerator.dispose();

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.target.set(0, 0, 0);
controls.minDistance = 0.35;
controls.maxDistance = 22;
controls.screenSpacePanning = true;

const anatomyRoot = new THREE.Group();
anatomyRoot.name = 'BodyParts3D root';
scene.add(anatomyRoot);

const hemi = new THREE.HemisphereLight(0xddeeff, 0x1c1412, 1.55);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff4e8, 3.7);
key.position.set(4.5, 7, 6);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -5;
key.shadow.camera.right = 5;
key.shadow.camera.top = 6;
key.shadow.camera.bottom = -6;
scene.add(key);
const fill = new THREE.DirectionalLight(0x78c9ff, 1.6);
fill.position.set(-5, 2, 4);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xff7d68, 1.05);
rim.position.set(2, 3, -6);
scene.add(rim);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(6.4, 96),
  new THREE.MeshStandardMaterial({ color: 0x0c1218, roughness: 0.94, metalness: 0.03 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -WORLD_HEIGHT / 2 - 0.11;
ground.receiveShadow = true;
scene.add(ground);

const glowRing = new THREE.Mesh(
  new THREE.RingGeometry(1.15, 2.25, 100),
  new THREE.MeshBasicMaterial({ color: 0x267b9e, transparent: true, opacity: 0.11, side: THREE.DoubleSide })
);
glowRing.rotation.x = -Math.PI / 2;
glowRing.position.y = ground.position.y + 0.008;
scene.add(glowRing);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const ssaoPass = new SSAOPass(scene, camera, 1, 1);
ssaoPass.kernelRadius = 14;
ssaoPass.minDistance = 0.002;
ssaoPass.maxDistance = 0.11;
ssaoPass.output = SSAOPass.OUTPUT.Default;
composer.addPass(ssaoPass);
const outlinePass = new OutlinePass(new THREE.Vector2(1, 1), scene, camera);
outlinePass.edgeStrength = 4.2;
outlinePass.edgeGlow = 0.6;
outlinePass.edgeThickness = 1.25;
outlinePass.pulsePeriod = 0;
outlinePass.visibleEdgeColor.set(0x7ee8ff);
outlinePass.hiddenEdgeColor.set(0x265b6e);
composer.addPass(outlinePass);
composer.addPass(new OutputPass());

const clippingPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
const loader = new STLLoader();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pointerStart = new THREE.Vector2();
let hoverObject = null;
let anchorReady = false;

function getMaterial(entry) {
  const base = layerDefinitions[entry.layer];
  const color = new THREE.Color(entry.color || base.color);
  const common = {
    color,
    roughness: entry.layer === 'skin' ? 0.72 : entry.layer === 'skeleton' ? 0.78 : 0.64,
    metalness: 0,
    transparent: true,
    opacity: state.layer[entry.layer].opacity,
    depthWrite: state.layer[entry.layer].opacity > 0.55,
    side: entry.layer === 'skin' ? THREE.DoubleSide : THREE.FrontSide,
    clippingPlanes: state.clipEnabled ? [clippingPlane] : [],
    clipShadows: true
  };
  if (entry.layer === 'skin') {
    return new THREE.MeshPhysicalMaterial({
      ...common,
      sheen: 0.34,
      sheenColor: new THREE.Color(0x8b392e),
      sheenRoughness: 0.7,
      clearcoat: 0.04,
      clearcoatRoughness: 0.65
    });
  }
  if (entry.layer === 'muscle') {
    return new THREE.MeshPhysicalMaterial({
      ...common,
      sheen: 0.28,
      sheenColor: new THREE.Color(0x4a0710),
      sheenRoughness: 0.8,
      clearcoat: 0.025
    });
  }
  if (entry.layer === 'organ') {
    return new THREE.MeshPhysicalMaterial({
      ...common,
      sheen: 0.22,
      sheenColor: color.clone().multiplyScalar(0.6),
      sheenRoughness: 0.76,
      clearcoat: 0.08,
      clearcoatRoughness: 0.55
    });
  }
  return new THREE.MeshStandardMaterial(common);
}

async function loadPart(entry) {
  if (state.loaded.has(entry.id) || state.failed.has(entry.id)) return state.loaded.get(entry.id) || null;
  try {
    const geometry = await loader.loadAsync(`${RAW_ROOT}${entry.file}`);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const mesh = new THREE.Mesh(geometry, getMaterial(entry));
    mesh.name = entry.ru;
    mesh.userData.entry = entry;
    mesh.userData.localCenter = geometry.boundingBox.getCenter(new THREE.Vector3());
    mesh.visible = state.layer[entry.layer].visible;
    mesh.castShadow = entry.layer !== 'skin';
    mesh.receiveShadow = true;
    mesh.renderOrder = layerDefinitions[entry.layer].order;
    anatomyRoot.add(mesh);
    state.loaded.set(entry.id, mesh);

    if (entry.id === 'FMA7163') {
      orientAndScaleFromAnchor(mesh);
      anchorReady = true;
    }
    applyExplode();
    refreshSearch();
    return mesh;
  } catch (error) {
    console.warn(`Не удалось загрузить ${entry.id} (${entry.en})`, error);
    state.failed.add(entry.id);
    return null;
  }
}

function orientAndScaleFromAnchor(anchor) {
  const box = anchor.geometry.boundingBox;
  const size = box.getSize(new THREE.Vector3());
  const axes = [size.x, size.y, size.z];
  const upIndex = axes.indexOf(Math.max(...axes));
  const upVector = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)][upIndex];
  anatomyRoot.quaternion.setFromUnitVectors(upVector, new THREE.Vector3(0, 1, 0));
  anatomyRoot.updateMatrixWorld(true);

  let orientedBox = new THREE.Box3().setFromObject(anchor);
  let orientedSize = orientedBox.getSize(new THREE.Vector3());
  if (orientedSize.x < orientedSize.z) {
    anatomyRoot.rotateY(Math.PI / 2);
    anatomyRoot.updateMatrixWorld(true);
    orientedBox = new THREE.Box3().setFromObject(anchor);
    orientedSize = orientedBox.getSize(new THREE.Vector3());
  }

  const scale = WORLD_HEIGHT / orientedSize.y;
  anatomyRoot.scale.setScalar(scale);
  state.rootScale = scale;
  anatomyRoot.updateMatrixWorld(true);

  const scaledBox = new THREE.Box3().setFromObject(anchor);
  const center = scaledBox.getCenter(new THREE.Vector3());
  anatomyRoot.position.sub(center);
  anatomyRoot.updateMatrixWorld(true);

  state.anchorCenter.copy(box.getCenter(new THREE.Vector3()));
  controls.target.set(0, 0, 0);
  camera.position.set(0, 0.1, 9.2);
  camera.lookAt(0, 0, 0);
  controls.update();
}

async function runQueue(entries, concurrency, phaseTitle) {
  const pending = entries.filter(entry => !state.loaded.has(entry.id) && !state.failed.has(entry.id));
  if (!pending.length) return;
  const progress = { total: pending.length, finished: 0, loadedStart: state.loaded.size, failedStart: state.failed.size };
  setLoadingVisible(true);
  document.getElementById('loadingTitle').textContent = phaseTitle;

  let index = 0;
  async function worker() {
    while (index < pending.length) {
      const current = pending[index++];
      await loadPart(current);
      progress.finished += 1;
      updateLoading(progress.finished, progress.total);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
}

async function startLoading() {
  setConnectionStatus('loading', 'загрузка модели');
  updateLoading(0, 1);
  const skin = catalog.find(item => item.id === 'FMA7163');
  await runQueue([skin], 1, 'Загрузка поверхности тела');
  if (!anchorReady) {
    setConnectionStatus('error', 'ошибка источника');
    document.getElementById('loadingTitle').textContent = 'Не удалось загрузить опорный меш';
    document.getElementById('loadingSubtitle').textContent = 'Проверьте интернет-соединение';
    return;
  }

  const core = catalog.filter(item => item.core && item.id !== 'FMA7163');
  await runQueue(core, 5, 'Загрузка основных анатомических структур');
  state.coreLoading = false;
  setConnectionStatus('ready', `${state.loaded.size} структур`);
  setLoadingVisible(false);
  applyPreset('muscles');
  document.getElementById('loadDetail').disabled = false;
}

async function loadDetailedSet() {
  const button = document.getElementById('loadDetail');
  button.disabled = true;
  button.textContent = 'Загрузка…';
  const detail = catalog.filter(item => !item.core);
  await runQueue(detail, 5, 'Загрузка детальных структур');
  state.detailLoaded = true;
  setConnectionStatus('ready', `${state.loaded.size} структур`);
  setLoadingVisible(false);
  button.textContent = 'Детальный набор загружен';
}

function updateLoading(done, total) {
  const percent = total ? Math.round(done / total * 100) : 0;
  document.getElementById('loadingPercent').textContent = `${percent}%`;
  document.getElementById('progressBar').style.width = `${percent}%`;
  document.getElementById('loadedCount').textContent = `${state.loaded.size} загружено`;
  document.getElementById('failedCount').textContent = `${state.failed.size} пропущено`;
}

function setLoadingVisible(visible) {
  document.getElementById('loadingPanel').classList.toggle('done', !visible);
}

function setConnectionStatus(type, text) {
  const element = document.getElementById('connectionStatus');
  element.className = `status-dot ${type === 'ready' ? 'ready' : type === 'error' ? 'error' : ''}`;
  element.innerHTML = `<i></i>${text}`;
}

function applyLayerState() {
  for (const mesh of state.loaded.values()) {
    const entry = mesh.userData.entry;
    const layer = state.layer[entry.layer];
    mesh.visible = state.isolated ? mesh === state.selected : layer.visible;
    mesh.material.opacity = layer.opacity;
    mesh.material.transparent = layer.opacity < 1 || entry.layer === 'skin';
    mesh.material.depthWrite = layer.opacity > 0.55;
    mesh.material.clippingPlanes = state.clipEnabled ? [clippingPlane] : [];
    mesh.material.needsUpdate = true;
  }
  updateLayerControls();
}

function applyPreset(name) {
  const presets = {
    skin: {
      skin: [true, .86], muscle: [false, 1], skeleton: [false, 1], organ: [false, 1], artery: [false, 1], vein: [false, 1], nerve: [false, 1]
    },
    muscles: {
      skin: [false, .18], muscle: [true, 1], skeleton: [false, 1], organ: [false, 1], artery: [false, 1], vein: [false, 1], nerve: [false, 1]
    },
    skeleton: {
      skin: [false, .12], muscle: [false, .2], skeleton: [true, 1], organ: [false, 1], artery: [false, 1], vein: [false, 1], nerve: [false, 1]
    },
    internal: {
      skin: [false, .1], muscle: [true, .13], skeleton: [true, .13], organ: [true, 1], artery: [true, 1], vein: [true, 1], nerve: [true, 1]
    },
    all: {
      skin: [true, .1], muscle: [true, .35], skeleton: [true, .72], organ: [true, .95], artery: [true, 1], vein: [true, 1], nerve: [true, 1]
    }
  };
  const preset = presets[name];
  if (!preset) return;
  state.isolated = false;
  for (const [key, [visible, opacity]] of Object.entries(preset)) {
    state.layer[key].visible = visible;
    state.layer[key].opacity = opacity;
  }
  document.querySelectorAll('.preset').forEach(btn => btn.classList.toggle('active', btn.dataset.preset === name));
  applyLayerState();
}

function buildLayerControls() {
  const container = document.getElementById('layerControls');
  container.innerHTML = '';
  for (const [key, definition] of Object.entries(layerDefinitions)) {
    const row = document.createElement('div');
    row.className = 'layer-control';
    row.style.setProperty('--layer-color', definition.color);
    row.innerHTML = `
      <input type="checkbox" data-layer-check="${key}" aria-label="Показать ${definition.label}" />
      <div class="layer-label"><i></i><span>${definition.label}</span></div>
      <input type="range" min="2" max="100" data-layer-opacity="${key}" aria-label="Прозрачность ${definition.label}" />
    `;
    container.appendChild(row);
  }
  container.addEventListener('input', event => {
    const checkKey = event.target.dataset.layerCheck;
    const opacityKey = event.target.dataset.layerOpacity;
    if (checkKey) {
      state.isolated = false;
      state.layer[checkKey].visible = event.target.checked;
      applyLayerState();
    }
    if (opacityKey) {
      state.layer[opacityKey].opacity = Number(event.target.value) / 100;
      applyLayerState();
    }
  });
  updateLayerControls();
}

function updateLayerControls() {
  for (const [key, layer] of Object.entries(state.layer)) {
    const check = document.querySelector(`[data-layer-check="${key}"]`);
    const opacity = document.querySelector(`[data-layer-opacity="${key}"]`);
    if (check) check.checked = layer.visible;
    if (opacity) opacity.value = Math.round(layer.opacity * 100);
  }
}

function applyExplode() {
  if (!anchorReady) return;
  const worldAmount = state.explode * 1.2;
  const localAmount = worldAmount / Math.max(state.rootScale, 1e-9);
  for (const mesh of state.loaded.values()) {
    const center = mesh.userData.localCenter || state.anchorCenter;
    const direction = center.clone().sub(state.anchorCenter);
    direction.y *= 0.2;
    if (direction.lengthSq() < 1e-6) direction.set(0, 0, 1);
    direction.normalize();
    const layerBoost = (layerDefinitions[mesh.userData.entry.layer].order - 2) * 0.08;
    mesh.position.copy(direction.multiplyScalar(localAmount * (1 + layerBoost)));
  }
}

function updateClipping() {
  const span = WORLD_HEIGHT * 0.55;
  clippingPlane.constant = (state.clipValue / 100) * span;
  for (const mesh of state.loaded.values()) {
    mesh.material.clippingPlanes = state.clipEnabled ? [clippingPlane] : [];
    mesh.material.needsUpdate = true;
  }
}

function selectMesh(mesh, focus = false) {
  if (!mesh) return clearSelection();
  state.selected = mesh;
  outlinePass.selectedObjects = [mesh];
  document.getElementById('emptyInfo').classList.add('hidden');
  document.getElementById('selectedInfo').classList.remove('hidden');
  document.getElementById('isolateButton').disabled = false;
  document.getElementById('clearSelection').disabled = false;
  updateSelectedInfo(mesh);
  if (focus) focusOn(mesh);
}

function clearSelection() {
  state.selected = null;
  state.isolated = false;
  outlinePass.selectedObjects = [];
  document.getElementById('emptyInfo').classList.remove('hidden');
  document.getElementById('selectedInfo').classList.add('hidden');
  document.getElementById('isolateButton').disabled = true;
  document.getElementById('clearSelection').disabled = true;
  document.getElementById('isolateButton').textContent = 'Изолировать';
  applyLayerState();
}

function updateSelectedInfo(mesh) {
  const entry = mesh.userData.entry;
  const definition = layerDefinitions[entry.layer];
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3()).multiplyScalar(REFERENCE_HEIGHT_CM / WORLD_HEIGHT);
  const dimensions = [size.x, size.y, size.z].sort((a, b) => b - a).map(v => Math.max(v, 0.1).toFixed(v > 20 ? 0 : 1));
  document.getElementById('selectedSystem').textContent = definition.label;
  document.getElementById('selectedName').textContent = entry.ru;
  document.getElementById('selectedEnglish').textContent = entry.latin;
  document.getElementById('selectedId').textContent = entry.id;
  document.getElementById('selectedSize').textContent = `${dimensions[0]} × ${dimensions[1]} × ${dimensions[2]} см`;
  document.getElementById('selectedDescription').textContent = entry.description;
}

function focusOn(mesh) {
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(sphere.radius, 0.12);
  const direction = camera.position.clone().sub(controls.target).normalize();
  state.targetLookAt = center;
  state.targetCamera = center.clone().add(direction.multiplyScalar(radius * 3.2 + 0.28));
}

function setView(view) {
  const distance = 9.1;
  const positions = {
    front: new THREE.Vector3(0, 0.05, distance),
    back: new THREE.Vector3(0, 0.05, -distance),
    left: new THREE.Vector3(-distance, 0.05, 0),
    right: new THREE.Vector3(distance, 0.05, 0),
    reset: new THREE.Vector3(0, 0.15, distance)
  };
  state.targetLookAt = new THREE.Vector3(0, 0, 0);
  state.targetCamera = positions[view] || positions.reset;
}

function getIntersections(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const candidates = [...state.loaded.values()].filter(mesh => {
    if (!mesh.visible || mesh.material.opacity <= 0.06) return false;
    const entry = mesh.userData.entry;
    return !(entry.layer === 'skin' && mesh.material.opacity < 0.35);
  });
  return raycaster.intersectObjects(candidates, false);
}

canvas.addEventListener('pointerdown', event => pointerStart.set(event.clientX, event.clientY));
canvas.addEventListener('pointerup', event => {
  const movement = pointerStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
  if (movement > 5) return;
  const hit = getIntersections(event)[0];
  if (hit) selectMesh(hit.object);
});
canvas.addEventListener('pointermove', event => {
  const hit = getIntersections(event)[0];
  hoverObject = hit?.object || null;
  const label = document.getElementById('hoverLabel');
  if (hoverObject) {
    canvas.style.cursor = 'pointer';
    label.style.display = 'block';
    label.style.left = `${event.clientX}px`;
    label.style.top = `${event.clientY}px`;
    label.textContent = hoverObject.userData.entry.ru;
  } else {
    canvas.style.cursor = 'grab';
    label.style.display = 'none';
  }
});
canvas.addEventListener('pointerleave', () => {
  document.getElementById('hoverLabel').style.display = 'none';
  hoverObject = null;
});

function refreshSearch() {
  // Results are generated on demand; this also updates the badge.
  document.getElementById('datasetBadge').textContent = `${state.loaded.size} объектов`;
}

function renderSearch(query) {
  const results = document.getElementById('searchResults');
  const term = query.trim().toLocaleLowerCase('ru');
  if (term.length < 2) {
    results.classList.remove('open');
    results.innerHTML = '';
    return;
  }
  const matches = [...state.loaded.values()]
    .filter(mesh => {
      const e = mesh.userData.entry;
      return `${e.ru} ${e.en} ${e.id}`.toLocaleLowerCase('ru').includes(term);
    })
    .slice(0, 12);
  results.innerHTML = matches.length ? matches.map(mesh => {
    const e = mesh.userData.entry;
    return `<button class="search-item" data-search-id="${e.id}"><strong>${e.ru}</strong><span>${e.en} · ${layerDefinitions[e.layer].label}</span></button>`;
  }).join('') : '<div class="search-item"><strong>Ничего не найдено</strong><span>Структура могла ещё не загрузиться</span></div>';
  results.classList.add('open');
}

function bindUI() {
  buildLayerControls();
  document.querySelectorAll('.preset').forEach(button => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  document.getElementById('resetLayers').addEventListener('click', () => applyPreset('muscles'));
  document.getElementById('loadDetail').addEventListener('click', loadDetailedSet);
  document.getElementById('loadDetail').disabled = true;

  document.getElementById('clipEnabled').addEventListener('change', event => {
    state.clipEnabled = event.target.checked;
    document.getElementById('clipSlider').disabled = !state.clipEnabled;
    updateClipping();
  });
  document.getElementById('clipSlider').addEventListener('input', event => {
    state.clipValue = Number(event.target.value);
    updateClipping();
  });
  document.getElementById('explodeSlider').addEventListener('input', event => {
    state.explode = Number(event.target.value) / 100;
    applyExplode();
  });
  document.getElementById('isolateButton').addEventListener('click', () => {
    if (!state.selected) return;
    state.isolated = !state.isolated;
    document.getElementById('isolateButton').textContent = state.isolated ? 'Вернуть слои' : 'Изолировать';
    applyLayerState();
  });
  document.getElementById('clearSelection').addEventListener('click', clearSelection);
  document.getElementById('focusButton').addEventListener('click', () => state.selected && focusOn(state.selected));

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', event => renderSearch(event.target.value));
  document.getElementById('searchResults').addEventListener('click', event => {
    const button = event.target.closest('[data-search-id]');
    if (!button) return;
    const mesh = state.loaded.get(button.dataset.searchId);
    if (mesh) {
      state.layer[mesh.userData.entry.layer].visible = true;
      state.isolated = false;
      applyLayerState();
      selectMesh(mesh, true);
      searchInput.value = '';
      renderSearch('');
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.search-wrap')) document.getElementById('searchResults').classList.remove('open');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') clearSelection();
  });

  const dialog = document.getElementById('creditsDialog');
  document.getElementById('openCredits').addEventListener('click', () => dialog.showModal());
  document.getElementById('closeCredits').addEventListener('click', () => dialog.close());
}

function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  composer.setSize(width, height);
  ssaoPass.setSize(width, height);
  outlinePass.setSize(width, height);
}
window.addEventListener('resize', resize);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  controls.update();
  glowRing.rotation.z += dt * 0.04;

  if (state.targetCamera && state.targetLookAt) {
    camera.position.lerp(state.targetCamera, 1 - Math.pow(0.001, dt));
    controls.target.lerp(state.targetLookAt, 1 - Math.pow(0.001, dt));
    if (camera.position.distanceTo(state.targetCamera) < 0.01 && controls.target.distanceTo(state.targetLookAt) < 0.01) {
      state.targetCamera = null;
      state.targetLookAt = null;
    }
  }
  composer.render();
}

bindUI();
resize();
animate();
startLoading();
