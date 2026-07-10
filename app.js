import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const REMOTE_ROOT = 'https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/BodyParts3D/main/assets/BodyParts3D_data/stl/';
const RAW_ROOT = new URLSearchParams(location.search).get('assets') === 'local' ? './models/' : REMOTE_ROOT;
const WORLD_HEIGHT = 6.4;
const REFERENCE_HEIGHT_CM = 175;
const canvas = document.getElementById('sceneCanvas');
const viewport = document.getElementById('viewport');

// Lightweight renderer profile for large anatomical datasets.
// Override manually with ?quality=low or ?quality=high.
const urlParams = new URLSearchParams(location.search);
const qualityMode = urlParams.get('quality') || 'auto';
const bvhEnabled = urlParams.get('bvh') !== 'off';
const adaptiveDetailEnabled = urlParams.get('lod') !== 'off';
const compactDevice = matchMedia('(max-width: 900px), (pointer: coarse)').matches
  || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
  || (navigator.deviceMemory && navigator.deviceMemory <= 4);
const lowQuality = qualityMode === 'low' || (qualityMode === 'auto' && compactDevice);
const maxPixelRatio = qualityMode === 'high' ? 1.5 : lowQuality ? 1 : 1.25;
const lodPixelThreshold = qualityMode === 'high' ? 1.15 : lowQuality ? 4.0 : 2.1;
const lodUpdateIntervalMs = lowQuality ? 150 : 95;

const layerDefinitions = {
  skin:     { label: 'Кожа',         color: '#bd826d', visible: false, opacity: 0.24, order: 6 },
  muscle:   { label: 'Мышцы',        color: '#8f2830', visible: true,  opacity: 1.00, order: 5 },
  skeleton: { label: 'Скелет',       color: '#e6ddc2', visible: false, opacity: 1.00, order: 2 },
  organ:    { label: 'Органы',       color: '#a85b55', visible: false, opacity: 1.00, order: 4 },
  brain:    { label: 'Мозг',         color: '#b98783', visible: false, opacity: 1.00, order: 5 },
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
    brain: `${name} — сегментированная структура головного мозга взрослого мужского анатомического эталона.`,
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

  // Internal organs — real BodyParts3D meshes
  part('FMA7274', 'Стенка сердца', 'Wall of heart', 'organ', { color: '#7f202c' }),
  part('FMA7333', 'Верхняя доля правого лёгкого', 'Upper lobe of right lung', 'organ', { color: '#b87a78' }),
  part('FMA7383', 'Средняя доля правого лёгкого', 'Middle lobe of right lung', 'organ', { color: '#b87a78' }),
  part('FMA7337', 'Нижняя доля правого лёгкого', 'Lower lobe of right lung', 'organ', { color: '#aa6869' }),
  part('FMA7370', 'Верхняя доля левого лёгкого', 'Upper lobe of left lung', 'organ', { color: '#b87a78' }),
  part('FMA7371', 'Нижняя доля левого лёгкого', 'Lower lobe of left lung', 'organ', { color: '#aa6869' }),
  part('FMA7394', 'Трахея', 'Trachea', 'organ', { color: '#c8a98a' }),
  part('FMA7409', 'Бронх', 'Bronchus', 'organ', { color: '#c8a98a', core: false }),
  part('FMA7131', 'Пищевод', 'Esophagus', 'organ', { color: '#a96f68' }),
  part('FMA7197', 'Печень', 'Liver', 'organ', { color: '#71353a' }),
  part('FMA7202', 'Жёлчный пузырь', 'Gallbladder', 'organ', { color: '#55733d' }),
  part('FMA7148', 'Желудок', 'Stomach', 'organ', { color: '#b06f65' }),
  part('FMA7198nsn', 'Поджелудочная железа', 'Pancreas', 'organ', { color: '#c69a69' }),
  part('FMA7206', 'Двенадцатиперстная кишка', 'Duodenum', 'organ', { color: '#b88772' }),
  part('FMA7207', 'Тощая кишка', 'Jejunum', 'organ', { color: '#c2917a' }),
  part('FMA7208', 'Подвздошная кишка', 'Ileum', 'organ', { color: '#c2917a' }),
  part('FMA14543nsn', 'Ободочная кишка', 'Colon', 'organ', { color: '#a97b67' }),
  part('FMA14542', 'Червеобразный отросток', 'Appendix', 'organ', { color: '#b57f70', core: false }),
  part('FMA14544', 'Прямая кишка', 'Rectum', 'organ', { color: '#9c665d' }),
  part('FMA7196', 'Селезёнка', 'Spleen', 'organ', { color: '#70405a' }),
  part('FMA7204', 'Правая почка', 'Right kidney', 'organ', { color: '#71343e' }),
  part('FMA7205', 'Левая почка', 'Left kidney', 'organ', { color: '#71343e' }),
  part('FMA15629', 'Правый надпочечник', 'Right adrenal gland', 'organ', { color: '#9b7448', core: false }),
  part('FMA15630', 'Левый надпочечник', 'Left adrenal gland', 'organ', { color: '#9b7448', core: false }),
  part('FMA15571', 'Правый мочеточник', 'Right ureter', 'organ', { color: '#c49a72', core: false }),
  part('FMA15572', 'Левый мочеточник', 'Left ureter', 'organ', { color: '#c49a72', core: false }),
  part('FMA15900', 'Мочевой пузырь', 'Urinary bladder', 'organ', { color: '#c7a06f' }),
  part('FMA71194', 'Правая доля тимуса', 'Right lobe of thymus', 'organ', { color: '#b98f79', core: false }),
  part('FMA71195', 'Левая доля тимуса', 'Left lobe of thymus', 'organ', { color: '#b98f79', core: false }),

  // Male reproductive organs — optional detailed set
  part('FMA9600', 'Предстательная железа', 'Prostate', 'organ', { color: '#a77a67', core: false }),
  part('FMA7211', 'Правое яичко', 'Right testis', 'organ', { color: '#c8a28b', core: false }),
  part('FMA7212', 'Левое яичко', 'Left testis', 'organ', { color: '#c8a28b', core: false }),
  part('FMA19387', 'Правый семенной пузырёк', 'Right seminal vesicle', 'organ', { color: '#a78d62', core: false }),
  part('FMA19388', 'Левый семенной пузырёк', 'Left seminal vesicle', 'organ', { color: '#a78d62', core: false }),

  // Brain — cortical surface and major internal structures
  part('FMA72653', 'Правая верхняя лобная извилина', 'Right superior frontal gyrus', 'brain', { color: '#ba817e' }),
  part('FMA72654', 'Левая верхняя лобная извилина', 'Left superior frontal gyrus', 'brain', { color: '#ba817e' }),
  part('FMA72655', 'Правая средняя лобная извилина', 'Right middle frontal gyrus', 'brain', { color: '#b47776' }),
  part('FMA72656', 'Левая средняя лобная извилина', 'Left middle frontal gyrus', 'brain', { color: '#b47776' }),
  part('FMA72661', 'Правая прецентральная извилина', 'Right precentral gyrus', 'brain', { color: '#bd8580' }),
  part('FMA72662', 'Левая прецентральная извилина', 'Left precentral gyrus', 'brain', { color: '#bd8580' }),
  part('FMA72665', 'Правая постцентральная извилина', 'Right postcentral gyrus', 'brain', { color: '#ad7779' }),
  part('FMA72666', 'Левая постцентральная извилина', 'Left postcentral gyrus', 'brain', { color: '#ad7779' }),
  part('FMA72667', 'Правая надкраевая извилина', 'Right supramarginal gyrus', 'brain', { color: '#a87378' }),
  part('FMA72668', 'Левая надкраевая извилина', 'Left supramarginal gyrus', 'brain', { color: '#a87378' }),
  part('FMA72669', 'Правая угловая извилина', 'Right angular gyrus', 'brain', { color: '#a46f75' }),
  part('FMA72670', 'Левая угловая извилина', 'Left angular gyrus', 'brain', { color: '#a46f75' }),
  part('FMA72800', 'Передняя часть правой верхней височной извилины', 'Anterior part of right superior temporal gyrus', 'brain', { color: '#a86f70' }),
  part('FMA72801', 'Передняя часть левой верхней височной извилины', 'Anterior part of left superior temporal gyrus', 'brain', { color: '#a86f70' }),
  part('FMA72804', 'Задняя часть правой верхней височной извилины', 'Posterior part of right superior temporal gyrus', 'brain', { color: '#a4696d' }),
  part('FMA72805', 'Задняя часть левой верхней височной извилины', 'Posterior part of left superior temporal gyrus', 'brain', { color: '#a4696d' }),
  part('FMA72685', 'Правая средняя височная извилина', 'Right middle temporal gyrus', 'brain', { color: '#9f676c' }),
  part('FMA72686', 'Левая средняя височная извилина', 'Left middle temporal gyrus', 'brain', { color: '#9f676c' }),
  part('FMA72687', 'Правая нижняя височная извилина', 'Right inferior temporal gyrus', 'brain', { color: '#965f66' }),
  part('FMA72688', 'Левая нижняя височная извилина', 'Left inferior temporal gyrus', 'brain', { color: '#965f66' }),
  part('FMA72689', 'Правая веретенообразная извилина', 'Right fusiform gyrus', 'brain', { color: '#8e5e67' }),
  part('FMA72690', 'Левая веретенообразная извилина', 'Left fusiform gyrus', 'brain', { color: '#8e5e67' }),
  part('FMA72975', 'Правая затылочная доля', 'Right occipital lobe', 'brain', { color: '#9c707c' }),
  part('FMA72976', 'Левая затылочная доля', 'Left occipital lobe', 'brain', { color: '#9c707c' }),
  part('FMA67944', 'Мозжечок', 'Cerebellum', 'brain', { color: '#a87570' }),
  part('FMA67943', 'Мост', 'Pons', 'brain', { color: '#c19487' }),
  part('FMA62004', 'Продолговатый мозг', 'Medulla oblongata', 'brain', { color: '#c29b8c' }),
  part('FMA61993nsn', 'Средний мозг', 'Midbrain', 'brain', { color: '#b4867d' }),
  part('FMA258714', 'Правый таламус', 'Right thalamus', 'brain', { color: '#a87383' }),
  part('FMA258716', 'Левый таламус', 'Left thalamus', 'brain', { color: '#a87383' }),
  part('FMA62008nsn', 'Гипоталамус', 'Hypothalamus', 'brain', { color: '#ad7e72', core: false }),
  part('FMA86464', 'Мозолистое тело', 'Corpus callosum', 'brain', { color: '#d8c8b4' }),
  part('FMA72717', 'Правая поясная извилина', 'Right cingulate gyrus', 'brain', { color: '#aa7c78', core: false }),
  part('FMA72718', 'Левая поясная извилина', 'Left cingulate gyrus', 'brain', { color: '#aa7c78', core: false }),
  part('FMA72705', 'Правая парагиппокампальная извилина', 'Right parahippocampal gyrus', 'brain', { color: '#9b6e70', core: false }),
  part('FMA72706', 'Левая парагиппокампальная извилина', 'Left parahippocampal gyrus', 'brain', { color: '#9b6e70', core: false }),
  part('FMA72713', 'Правый гиппокамп', 'Right hippocampus', 'brain', { color: '#b58a68', core: false }),
  part('FMA72714', 'Левый гиппокамп', 'Left hippocampus', 'brain', { color: '#b58a68', core: false }),
  part('FMA72832', 'Правая миндалина', 'Right amygdala', 'brain', { color: '#9a5c63', core: false }),
  part('FMA72833', 'Левая миндалина', 'Left amygdala', 'brain', { color: '#9a5c63', core: false }),
  part('FMA72826', 'Правое хвостатое ядро', 'Right caudate nucleus', 'brain', { color: '#a8746b', core: false }),
  part('FMA72827', 'Левое хвостатое ядро', 'Left caudate nucleus', 'brain', { color: '#a8746b', core: false }),
  part('FMA72828', 'Правая скорлупа', 'Right putamen', 'brain', { color: '#93616d', core: false }),
  part('FMA72829', 'Левая скорлупа', 'Left putamen', 'brain', { color: '#93616d', core: false }),
  part('FMA72830', 'Правый бледный шар', 'Right globus pallidus', 'brain', { color: '#c09c86', core: false }),
  part('FMA72831', 'Левый бледный шар', 'Left globus pallidus', 'brain', { color: '#c09c86', core: false }),
  part('FMA78449', 'Правый боковой желудочек', 'Right lateral ventricle', 'brain', { color: '#73a8bd', core: false }),
  part('FMA78450', 'Левый боковой желудочек', 'Left lateral ventricle', 'brain', { color: '#73a8bd', core: false }),
  part('FMA13889', 'Гипофиз', 'Pituitary gland', 'brain', { color: '#b98475', core: false }),
  part('FMA62033', 'Шишковидное тело', 'Pineal body', 'brain', { color: '#c6a06b', core: false }),

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
  part('FMA7647', 'Спинной мозг', 'Spinal cord', 'nerve'),
  part('FMA50875', 'Правый зрительный нерв', 'Right optic nerve', 'nerve', { core: false }),
  part('FMA50878', 'Левый зрительный нерв', 'Left optic nerve', 'nerve', { core: false }),
  part('FMA62382', 'Правый зрительный тракт', 'Right optic tract', 'nerve', { core: false }),
  part('FMA67936', 'Левый зрительный тракт', 'Left optic tract', 'nerve', { core: false })
];

// Brain meshes are loaded on demand when the dedicated preset is opened.
for (const entry of catalog) {
  if (entry.layer === 'brain') entry.core = false;
}

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

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !lowQuality,
  powerPreference: 'high-performance',
  alpha: false,
  stencil: false
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = false;
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
key.castShadow = false;
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
ground.receiveShadow = false;
scene.add(ground);

const glowRing = new THREE.Mesh(
  new THREE.RingGeometry(1.15, 2.25, 100),
  new THREE.MeshBasicMaterial({ color: 0x267b9e, transparent: true, opacity: 0.11, side: THREE.DoubleSide })
);
glowRing.rotation.x = -Math.PI / 2;
glowRing.position.y = ground.position.y + 0.008;
scene.add(glowRing);

const clippingPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
const loader = new STLLoader();
const raycaster = new THREE.Raycaster();
raycaster.firstHitOnly = true;
const pointer = new THREE.Vector2();
const pointerStart = new THREE.Vector2();
const lodWorldCenter = new THREE.Vector3();
const lodWorldScale = new THREE.Vector3();
const bvhQueue = [];
let bvhWorkScheduled = false;
let hoverObject = null;
let anchorReady = false;
let interactionCandidates = [];
let frameHandle = 0;
let needsRender = true;
let controlsActive = false;
let lastFrameTime = performance.now();
let renderingFrame = false;
let lastLodUpdate = 0;
let lodUpdateTimer = 0;

function invalidate() {
  needsRender = true;
  if (!frameHandle && !renderingFrame) frameHandle = requestAnimationFrame(renderFrame);
}

function queueBVHBuild(geometry) {
  if (!bvhEnabled || !geometry || geometry.boundsTree || geometry.userData?.bvhQueued) return;
  const triangleCount = geometry.index
    ? Math.floor(geometry.index.count / 3)
    : Math.floor((geometry.getAttribute('position')?.count || 0) / 3);
  if (triangleCount < 2500) return;
  geometry.userData = geometry.userData || {};
  geometry.userData.bvhQueued = true;
  bvhQueue.push(geometry);
  scheduleBVHWork();
}

function scheduleBVHWork() {
  if (bvhWorkScheduled || !bvhQueue.length) return;
  bvhWorkScheduled = true;

  const run = deadline => {
    bvhWorkScheduled = false;
    const started = performance.now();
    while (bvhQueue.length) {
      const hasIdleBudget = deadline ? deadline.timeRemaining() > 4 : performance.now() - started < 7;
      if (!hasIdleBudget) break;
      const geometry = bvhQueue.shift();
      if (!geometry || geometry.boundsTree) continue;
      try {
        geometry.computeBoundsTree({ maxLeafTris: lowQuality ? 24 : 14 });
      } catch (error) {
        console.warn('BVH build skipped for one mesh', error);
      }
    }
    if (bvhQueue.length) scheduleBVHWork();
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, { timeout: 900 });
  } else {
    setTimeout(() => run(null), 35);
  }
}

function projectedDiameterPixels(mesh) {
  const sphere = mesh.geometry.boundingSphere;
  if (!sphere) return Infinity;
  lodWorldCenter.copy(sphere.center).applyMatrix4(mesh.matrixWorld);
  mesh.getWorldScale(lodWorldScale);
  const radius = sphere.radius * Math.max(Math.abs(lodWorldScale.x), Math.abs(lodWorldScale.y), Math.abs(lodWorldScale.z));
  const distance = Math.max(camera.position.distanceTo(lodWorldCenter), camera.near);
  const pixelsPerWorldUnit = viewport.clientHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance);
  return radius * 2 * pixelsPerWorldUnit;
}

function updateAdaptiveVisibility() {
  anatomyRoot.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);

  for (const mesh of state.loaded.values()) {
    const entry = mesh.userData.entry;
    const baseVisible = state.isolated ? mesh === state.selected : state.layer[entry.layer].visible;
    let detailVisible = true;

    if (baseVisible && adaptiveDetailEnabled && !state.isolated && mesh !== state.selected && entry.layer !== 'skin') {
      const threshold = entry.core ? lodPixelThreshold * 0.68 : lodPixelThreshold;
      detailVisible = projectedDiameterPixels(mesh) >= threshold;
    }

    mesh.userData.detailVisible = detailVisible;
    mesh.visible = baseVisible && detailVisible;
    if (mesh.visible) queueBVHBuild(mesh.geometry);
  }

  rebuildInteractionCandidates();
}

function scheduleAdaptiveVisibility(force = false) {
  if (!adaptiveDetailEnabled) {
    updateAdaptiveVisibility();
    return;
  }
  const elapsed = performance.now() - lastLodUpdate;
  if (force || elapsed >= lodUpdateIntervalMs) {
    if (lodUpdateTimer) clearTimeout(lodUpdateTimer);
    lodUpdateTimer = 0;
    lastLodUpdate = performance.now();
    updateAdaptiveVisibility();
    return;
  }
  if (!lodUpdateTimer) {
    lodUpdateTimer = setTimeout(() => {
      lodUpdateTimer = 0;
      lastLodUpdate = performance.now();
      updateAdaptiveVisibility();
      invalidate();
    }, lodUpdateIntervalMs - elapsed);
  }
}

function rebuildInteractionCandidates() {
  interactionCandidates = [...state.loaded.values()].filter(mesh => {
    if (!mesh.visible || mesh.material.opacity <= 0.06) return false;
    const entry = mesh.userData.entry;
    return !(entry.layer === 'skin' && mesh.material.opacity < 0.35);
  });
  if (hoverObject && !interactionCandidates.includes(hoverObject)) {
    hoverObject = null;
    document.getElementById('hoverLabel').style.display = 'none';
  }
}

function applySelectionHighlight(mesh, enabled) {
  if (!mesh?.material?.emissive) return;
  mesh.material.emissive.setHex(enabled ? 0x0b637b : 0x000000);
  mesh.material.emissiveIntensity = enabled ? 0.9 : 0;
}

function getMaterial(entry) {
  const base = layerDefinitions[entry.layer];
  const color = new THREE.Color(entry.color || base.color);
  const common = {
    color,
    roughness: entry.layer === 'skin' ? 0.72 : entry.layer === 'skeleton' ? 0.78 : entry.layer === 'brain' ? 0.7 : 0.64,
    metalness: 0,
    transparent: true,
    opacity: state.layer[entry.layer].opacity,
    depthWrite: state.layer[entry.layer].opacity > 0.55,
    side: entry.layer === 'skin' ? THREE.DoubleSide : THREE.FrontSide,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0,
    clippingPlanes: state.clipEnabled ? [clippingPlane] : []
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
  if (entry.layer === 'brain') {
    return new THREE.MeshPhysicalMaterial({
      ...common,
      sheen: 0.34,
      sheenColor: color.clone().multiplyScalar(0.72),
      sheenRoughness: 0.76,
      clearcoat: 0.055,
      clearcoatRoughness: 0.62
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
    if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const mesh = new THREE.Mesh(geometry, getMaterial(entry));
    mesh.name = entry.ru;
    mesh.userData.entry = entry;
    mesh.userData.localCenter = geometry.boundingBox.getCenter(new THREE.Vector3());
    mesh.userData.triangleCount = geometry.index
      ? Math.floor(geometry.index.count / 3)
      : Math.floor(geometry.getAttribute('position').count / 3);
    mesh.visible = state.layer[entry.layer].visible;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.renderOrder = layerDefinitions[entry.layer].order;
    anatomyRoot.add(mesh);
    state.loaded.set(entry.id, mesh);
    if (mesh.visible) queueBVHBuild(geometry);
    scheduleAdaptiveVisibility(true);
    invalidate();

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

  const initialMuscles = catalog.filter(item => item.core && item.layer === 'muscle');
  await runQueue(initialMuscles, lowQuality ? 3 : 5, 'Загрузка мышечной системы');
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
    const material = mesh.material;
    const nextTransparent = layer.opacity < 1 || entry.layer === 'skin';
    const nextDepthWrite = layer.opacity > 0.55;
    const hadClipping = Boolean(material.clippingPlanes?.length);

    material.opacity = layer.opacity;

    const shaderStateChanged = material.transparent !== nextTransparent
      || material.depthWrite !== nextDepthWrite
      || hadClipping !== state.clipEnabled;

    material.transparent = nextTransparent;
    material.depthWrite = nextDepthWrite;
    material.clippingPlanes = state.clipEnabled ? [clippingPlane] : [];
    if (shaderStateChanged) material.needsUpdate = true;
  }
  if (state.selected) applySelectionHighlight(state.selected, true);
  scheduleAdaptiveVisibility(true);
  updateLayerControls();
  invalidate();
}

function applyPreset(name) {
  const presets = {
    skin: {
      skin: [true, .86], muscle: [false, 1], skeleton: [false, 1], organ: [false, 1], brain: [false, 1], artery: [false, 1], vein: [false, 1], nerve: [false, 1]
    },
    muscles: {
      skin: [false, .18], muscle: [true, 1], skeleton: [false, 1], organ: [false, 1], brain: [false, 1], artery: [false, 1], vein: [false, 1], nerve: [false, 1]
    },
    skeleton: {
      skin: [false, .12], muscle: [false, .2], skeleton: [true, 1], organ: [false, 1], brain: [false, 1], artery: [false, 1], vein: [false, 1], nerve: [false, 1]
    },
    brain: {
      skin: [false, .08], muscle: [false, .08], skeleton: [false, .12], organ: [false, 1], brain: [true, 1], artery: [false, 1], vein: [false, 1], nerve: [true, .88]
    },
    internal: {
      skin: [false, .1], muscle: [true, .12], skeleton: [true, .12], organ: [true, 1], brain: [false, 1], artery: [true, 1], vein: [true, 1], nerve: [true, 1]
    },
    all: {
      skin: [true, .1], muscle: [true, .34], skeleton: [true, .7], organ: [true, .95], brain: [true, .96], artery: [true, 1], vein: [true, 1], nerve: [true, 1]
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

  if (name === 'brain') {
    state.targetLookAt = new THREE.Vector3(0, 2.45, 0);
    state.targetCamera = new THREE.Vector3(0, 2.45, 3.05);
  }
}

async function ensureLayersData(layers, title) {
  const entries = catalog.filter(entry => layers.includes(entry.layer));
  const pending = entries.filter(entry => !state.loaded.has(entry.id) && !state.failed.has(entry.id));
  if (!pending.length) return;

  setConnectionStatus('loading', title.toLocaleLowerCase('ru'));
  await runQueue(entries, lowQuality ? 3 : 5, title);
  setLoadingVisible(false);
  setConnectionStatus('ready', `${state.loaded.size} структур`);
}

async function ensurePresetData(name) {
  const definitions = {
    skin: { layers: ['skin'], title: 'Загрузка кожи' },
    muscles: { layers: ['muscle'], title: 'Загрузка мышц' },
    skeleton: { layers: ['skeleton'], title: 'Загрузка скелета' },
    brain: { layers: ['brain', 'nerve'], title: 'Загрузка мозга' },
    internal: { layers: ['organ', 'artery', 'vein', 'nerve'], title: 'Загрузка внутренних систем' },
    all: { layers: Object.keys(layerDefinitions), title: 'Загрузка всех систем' }
  };
  const definition = definitions[name];
  if (!definition) return;
  await ensureLayersData(definition.layers, definition.title);
}

async function activatePreset(name) {
  await ensurePresetData(name);
  applyPreset(name);
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
      if (event.target.checked) {
        event.target.disabled = true;
        ensureLayersData([checkKey], `Загрузка: ${layerDefinitions[checkKey].label}`)
          .finally(() => {
            event.target.disabled = false;
            applyLayerState();
          });
      } else {
        applyLayerState();
      }
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
  scheduleAdaptiveVisibility(true);
  invalidate();
}

function updateClipping() {
  const span = WORLD_HEIGHT * 0.55;
  clippingPlane.constant = (state.clipValue / 100) * span;
  for (const mesh of state.loaded.values()) {
    const hadClipping = Boolean(mesh.material.clippingPlanes?.length);
    mesh.material.clippingPlanes = state.clipEnabled ? [clippingPlane] : [];
    if (hadClipping !== state.clipEnabled) mesh.material.needsUpdate = true;
  }
  invalidate();
}

function selectMesh(mesh, focus = false) {
  if (!mesh) return clearSelection();
  if (state.selected && state.selected !== mesh) applySelectionHighlight(state.selected, false);
  state.selected = mesh;
  applySelectionHighlight(mesh, true);
  document.getElementById('emptyInfo').classList.add('hidden');
  document.getElementById('selectedInfo').classList.remove('hidden');
  document.getElementById('isolateButton').disabled = false;
  document.getElementById('clearSelection').disabled = false;
  updateSelectedInfo(mesh);
  if (focus) focusOn(mesh);
  invalidate();
}

function clearSelection() {
  if (state.selected) applySelectionHighlight(state.selected, false);
  state.selected = null;
  state.isolated = false;
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
  const triangleCount = mesh.userData.triangleCount || 0;
  const triangleLabel = triangleCount >= 1000 ? `${(triangleCount / 1000).toFixed(triangleCount >= 10000 ? 0 : 1)}k` : `${triangleCount}`;
  document.getElementById('selectedSize').textContent = `${dimensions[0]} × ${dimensions[1]} × ${dimensions[2]} см · ${triangleLabel} △`;
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
  invalidate();
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
  invalidate();
}

function getIntersections(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(interactionCandidates, false);
}

canvas.addEventListener('pointerdown', event => pointerStart.set(event.clientX, event.clientY));
canvas.addEventListener('pointerup', event => {
  const movement = pointerStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
  if (movement > 5) return;
  const hit = getIntersections(event)[0];
  if (hit) selectMesh(hit.object);
});
const HOVER_INTERVAL_MS = lowQuality ? 120 : 75;
let lastHoverCheck = 0;
let hoverTimer = 0;
let pendingHoverPoint = null;

function updateHover(point) {
  lastHoverCheck = performance.now();
  const hit = getIntersections(point)[0];
  hoverObject = hit?.object || null;
  const label = document.getElementById('hoverLabel');
  if (hoverObject) {
    canvas.style.cursor = 'pointer';
    label.style.display = 'block';
    label.style.left = `${point.clientX}px`;
    label.style.top = `${point.clientY}px`;
    label.textContent = hoverObject.userData.entry.ru;
  } else {
    canvas.style.cursor = controlsActive ? 'grabbing' : 'grab';
    label.style.display = 'none';
  }
}

canvas.addEventListener('pointermove', event => {
  pendingHoverPoint = { clientX: event.clientX, clientY: event.clientY };
  const label = document.getElementById('hoverLabel');
  if (hoverObject) {
    label.style.left = `${event.clientX}px`;
    label.style.top = `${event.clientY}px`;
  }
  const elapsed = performance.now() - lastHoverCheck;
  if (elapsed >= HOVER_INTERVAL_MS) {
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = 0;
    updateHover(pendingHoverPoint);
    return;
  }
  if (!hoverTimer) {
    hoverTimer = setTimeout(() => {
      hoverTimer = 0;
      if (pendingHoverPoint) updateHover(pendingHoverPoint);
    }, HOVER_INTERVAL_MS - elapsed);
  }
}, { passive: true });
canvas.addEventListener('pointerleave', () => {
  if (hoverTimer) clearTimeout(hoverTimer);
  hoverTimer = 0;
  pendingHoverPoint = null;
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
  document.querySelectorAll('.preset').forEach(button => button.addEventListener('click', () => activatePreset(button.dataset.preset)));
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
  renderer.setSize(width, height, false);
  scheduleAdaptiveVisibility(true);
  invalidate();
}
window.addEventListener('resize', resize, { passive: true });

controls.addEventListener('start', () => {
  controlsActive = true;
  canvas.style.cursor = 'grabbing';
  invalidate();
});
controls.addEventListener('change', () => {
  scheduleAdaptiveVisibility(false);
  invalidate();
});
controls.addEventListener('end', () => {
  controlsActive = false;
  canvas.style.cursor = hoverObject ? 'pointer' : 'grab';
  scheduleAdaptiveVisibility(true);
  invalidate();
});

function renderFrame(now) {
  frameHandle = 0;
  renderingFrame = true;
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;
  needsRender = false;

  let keepAnimating = controls.update() === true;

  if (state.targetCamera && state.targetLookAt) {
    const factor = 1 - Math.pow(0.001, dt);
    camera.position.lerp(state.targetCamera, factor);
    controls.target.lerp(state.targetLookAt, factor);
    scheduleAdaptiveVisibility(false);
    keepAnimating = true;
    if (camera.position.distanceTo(state.targetCamera) < 0.01 && controls.target.distanceTo(state.targetLookAt) < 0.01) {
      camera.position.copy(state.targetCamera);
      controls.target.copy(state.targetLookAt);
      state.targetCamera = null;
      state.targetLookAt = null;
    }
  }

  renderer.render(scene, camera);
  renderingFrame = false;

  if ((needsRender || keepAnimating || controlsActive || state.targetCamera) && !frameHandle) {
    frameHandle = requestAnimationFrame(renderFrame);
  }
}

bindUI();
resize();
invalidate();
startLoading();
