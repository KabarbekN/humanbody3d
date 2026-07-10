import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { SYSTEMS, SYSTEM_BY_ID, LEARNING_TOURS, QUIZ_BANK, enrichEntry, APP_VERSION } from './anatomy-data.js';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

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

for (const entry of catalog) Object.assign(entry, enrichEntry(entry));
for (const entry of catalog) if (entry.layer === 'brain') entry.core = false;

const catalogById = new Map(catalog.map(entry => [entry.id, entry]));
const systemVisibility = Object.fromEntries(SYSTEMS.map(system => [system.id, true]));
const urlParams = new URLSearchParams(location.search);
const qualityMode = urlParams.get('quality') || 'auto';
const bvhEnabled = urlParams.get('bvh') !== 'off';
const adaptiveDetailEnabled = urlParams.get('lod') !== 'off';
const compactDevice = matchMedia('(max-width: 900px), (pointer: coarse)').matches
  || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
  || (navigator.deviceMemory && navigator.deviceMemory <= 4);
const lowQuality = qualityMode === 'low' || (qualityMode === 'auto' && compactDevice);
const maxPixelRatio = qualityMode === 'high' ? 1.5 : lowQuality ? 1 : 1.25;
const lodPixelThreshold = qualityMode === 'high' ? 1.15 : lowQuality ? 4.2 : 2.2;
const lodUpdateIntervalMs = lowQuality ? 160 : 100;
const AUTO_UNLOAD_MS = 150000;

const state = {
  layer: Object.fromEntries(Object.entries(layerDefinitions).map(([key, value]) => [key, { visible: value.visible, opacity: value.opacity }])),
  systemVisibility,
  loaded: new Map(),
  failed: new Map(),
  pending: new Map(),
  selected: null,
  selectedId: null,
  isolated: false,
  isolateContext: 'single',
  preset: 'muscles',
  detailLoaded: false,
  anchorCenter: new THREE.Vector3(),
  rootScale: 1,
  explode: 0,
  clipping: {
    x: { enabled: false, value: 0, flip: false },
    y: { enabled: false, value: 0, flip: false },
    z: { enabled: false, value: 0, flip: false }
  },
  targetCamera: null,
  targetLookAt: null,
  mode: 'explore',
  labelsMode: 'selected',
  treeFilter: '',
  measurements: [],
  measurementPoints: [],
  annotations: [],
  pendingAnnotationPoint: null,
  currentTour: null,
  tourIndex: 0,
  quiz: { targetId: null, score: 0, total: 0, locked: false },
  loadSession: null,
  autoUnload: false,
  hiddenSince: Object.fromEntries(Object.keys(layerDefinitions).map(key => [key, 0])),
  cameraRestored: false,
  installPrompt: null
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b10);
scene.fog = new THREE.FogExp2(0x070b10, 0.034);
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
renderer.toneMappingExposure = 1.1;
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
const helperRoot = new THREE.Group();
helperRoot.name = 'User helpers';
scene.add(helperRoot);

scene.add(new THREE.HemisphereLight(0xddeeff, 0x1c1412, 1.55));
const key = new THREE.DirectionalLight(0xfff4e8, 3.7); key.position.set(4.5, 7, 6); scene.add(key);
const fill = new THREE.DirectionalLight(0x78c9ff, 1.55); fill.position.set(-5, 2, 4); scene.add(fill);
const rim = new THREE.DirectionalLight(0xff7d68, 1.0); rim.position.set(2, 3, -6); scene.add(rim);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(6.4, 72),
  new THREE.MeshStandardMaterial({ color: 0x0c1218, roughness: 0.94, metalness: 0.03 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -WORLD_HEIGHT / 2 - 0.11;
scene.add(ground);
const glowRing = new THREE.Mesh(
  new THREE.RingGeometry(1.15, 2.25, 80),
  new THREE.MeshBasicMaterial({ color: 0x267b9e, transparent: true, opacity: 0.11, side: THREE.DoubleSide })
);
glowRing.rotation.x = -Math.PI / 2;
glowRing.position.y = ground.position.y + 0.008;
scene.add(glowRing);

const clippingPlanes = {
  x: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
  y: new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
  z: new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)
};
const loader = new STLLoader();
const raycaster = new THREE.Raycaster();
raycaster.firstHitOnly = true;
const pointer = new THREE.Vector2();
const pointerStart = new THREE.Vector2();
const bvhQueue = [];
const lodWorldCenter = new THREE.Vector3();
const lodWorldScale = new THREE.Vector3();
let bvhWorkScheduled = false;
let anchorReady = false;
let hoverObject = null;
let interactionCandidates = [];
let frameHandle = 0;
let needsRender = true;
let controlsActive = false;
let renderingFrame = false;
let lastFrameTime = performance.now();
let lastLodUpdate = 0;
let lodUpdateTimer = 0;
let hoverTimer = 0;
let pendingHoverPoint = null;
let lastHoverCheck = 0;
let urlUpdateTimer = 0;
let autoUnloadTimer = 0;

function byId(id) { return document.getElementById(id); }
function qsa(selector) { return [...document.querySelectorAll(selector)]; }
function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function toast(message, tone = 'default', duration = 2600) {
  const stack = byId('toastStack');
  const item = document.createElement('div');
  item.className = `toast ${tone}`;
  item.textContent = message;
  stack.appendChild(item);
  requestAnimationFrame(() => item.classList.add('show'));
  setTimeout(() => { item.classList.remove('show'); setTimeout(() => item.remove(), 220); }, duration);
}
function invalidate() {
  needsRender = true;
  if (!frameHandle && !renderingFrame) frameHandle = requestAnimationFrame(renderFrame);
}
function activeClippingPlanes() {
  return Object.entries(state.clipping).filter(([, config]) => config.enabled).map(([axis]) => clippingPlanes[axis]);
}
function setConnectionStatus(type, text) {
  const element = byId('connectionStatus');
  element.className = `status-pill ${type}`;
  element.innerHTML = `<i></i><span>${escapeHtml(text)}</span>`;
}
function updateStats() {
  const triangles = [...state.loaded.values()].reduce((sum, mesh) => sum + (mesh.userData.triangleCount || 0), 0);
  byId('datasetBadge').textContent = `${state.loaded.size} объектов`;
  byId('memorySummary').textContent = `${state.loaded.size} мешей · ${(triangles / 1e6).toFixed(triangles > 1e6 ? 1 : 2)} млн △`;
  byId('cacheCount').textContent = 'проверка…';
  updateTreeStatuses();
}

function queueBVHBuild(geometry) {
  if (!bvhEnabled || !geometry || geometry.boundsTree || geometry.userData?.bvhQueued) return;
  const triangles = geometry.index ? geometry.index.count / 3 : (geometry.getAttribute('position')?.count || 0) / 3;
  if (triangles < 2500) return;
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
    const start = performance.now();
    while (bvhQueue.length) {
      if (deadline ? deadline.timeRemaining() <= 4 : performance.now() - start > 7) break;
      const geometry = bvhQueue.shift();
      if (!geometry || geometry.boundsTree) continue;
      try { geometry.computeBoundsTree({ maxLeafTris: lowQuality ? 24 : 14 }); } catch (error) { console.warn(error); }
    }
    if (bvhQueue.length) scheduleBVHWork();
  };
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1000 });
  else setTimeout(() => run(null), 40);
}
function projectedDiameterPixels(mesh) {
  const sphere = mesh.geometry.boundingSphere;
  if (!sphere) return Infinity;
  lodWorldCenter.copy(sphere.center).applyMatrix4(mesh.matrixWorld);
  mesh.getWorldScale(lodWorldScale);
  const radius = sphere.radius * Math.max(Math.abs(lodWorldScale.x), Math.abs(lodWorldScale.y), Math.abs(lodWorldScale.z));
  const distance = Math.max(camera.position.distanceTo(lodWorldCenter), camera.near);
  return radius * 2 * viewport.clientHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * .5)) * distance);
}
function isEntryVisible(entry, mesh) {
  if (state.isolated) {
    if (state.isolateContext === 'single') return mesh === state.selected;
    const related = new Set([state.selectedId, ...(state.selected?.userData.entry.related || [])]);
    if (state.isolateContext === 'related') return related.has(entry.id);
    if (state.isolateContext === 'system') return entry.system === state.selected?.userData.entry.system;
  }
  return state.layer[entry.layer].visible && state.systemVisibility[entry.system] !== false;
}
function updateAdaptiveVisibility() {
  anatomyRoot.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  for (const mesh of state.loaded.values()) {
    const entry = mesh.userData.entry;
    const baseVisible = isEntryVisible(entry, mesh);
    let detailVisible = true;
    if (baseVisible && adaptiveDetailEnabled && !state.isolated && mesh !== state.selected && entry.layer !== 'skin') {
      detailVisible = projectedDiameterPixels(mesh) >= (entry.core ? lodPixelThreshold * .68 : lodPixelThreshold);
    }
    mesh.userData.detailVisible = detailVisible;
    mesh.visible = baseVisible && detailVisible;
    if (mesh.visible) queueBVHBuild(mesh.geometry);
  }
  rebuildInteractionCandidates();
  updateWorldLabels();
}
function scheduleAdaptiveVisibility(force = false) {
  const elapsed = performance.now() - lastLodUpdate;
  if (!adaptiveDetailEnabled || force || elapsed >= lodUpdateIntervalMs) {
    if (lodUpdateTimer) clearTimeout(lodUpdateTimer);
    lodUpdateTimer = 0;
    lastLodUpdate = performance.now();
    updateAdaptiveVisibility();
    return;
  }
  if (!lodUpdateTimer) lodUpdateTimer = setTimeout(() => {
    lodUpdateTimer = 0;
    lastLodUpdate = performance.now();
    updateAdaptiveVisibility();
    invalidate();
  }, lodUpdateIntervalMs - elapsed);
}
function rebuildInteractionCandidates() {
  interactionCandidates = [...state.loaded.values()].filter(mesh => mesh.visible && mesh.material.opacity > .06 && !(mesh.userData.entry.layer === 'skin' && mesh.material.opacity < .35));
  if (hoverObject && !interactionCandidates.includes(hoverObject)) hoverObject = null;
}
function applySelectionHighlight(mesh, enabled) {
  if (!mesh?.material?.emissive) return;
  mesh.material.emissive.setHex(enabled ? 0x0b637b : 0x000000);
  mesh.material.emissiveIntensity = enabled ? .9 : 0;
}
function getMaterial(entry) {
  const base = layerDefinitions[entry.layer];
  const color = new THREE.Color(entry.color || base.color);
  const common = {
    color, roughness: entry.layer === 'skin' ? .72 : entry.layer === 'skeleton' ? .78 : entry.layer === 'brain' ? .7 : .64,
    metalness: 0, transparent: true, opacity: state.layer[entry.layer].opacity,
    depthWrite: state.layer[entry.layer].opacity > .55, side: entry.layer === 'skin' ? THREE.DoubleSide : THREE.FrontSide,
    emissive: new THREE.Color(0x000000), emissiveIntensity: 0, clippingPlanes: activeClippingPlanes()
  };
  if (['skin', 'muscle', 'brain', 'organ'].includes(entry.layer)) return new THREE.MeshPhysicalMaterial({
    ...common, sheen: entry.layer === 'brain' ? .34 : .24, sheenColor: color.clone().multiplyScalar(.65),
    sheenRoughness: .76, clearcoat: entry.layer === 'organ' ? .08 : .04, clearcoatRoughness: .6
  });
  return new THREE.MeshStandardMaterial(common);
}

function createLoadSession(title, entries) {
  if (state.loadSession) state.loadSession.cancelled = true;
  state.loadSession = { id: crypto.randomUUID?.() || `${Date.now()}`, title, total: entries.length, done: 0, cancelled: false };
  byId('loadingPanel').classList.add('visible');
  byId('loadingTitle').textContent = title;
  byId('cancelLoading').disabled = false;
  updateLoadingPanel();
  return state.loadSession;
}
function updateLoadingPanel() {
  const session = state.loadSession;
  const percent = session?.total ? Math.round(session.done / session.total * 100) : 0;
  byId('loadingPercent').textContent = `${percent}%`;
  byId('progressBar').style.width = `${percent}%`;
  byId('loadedCount').textContent = `${state.loaded.size} загружено`;
  byId('failedCount').textContent = `${state.failed.size} ошибок`;
  renderLoadSystems();
}
function finishLoadSession(session) {
  if (state.loadSession !== session) return;
  byId('cancelLoading').disabled = true;
  setTimeout(() => byId('loadingPanel').classList.remove('visible'), 850);
  setConnectionStatus(state.failed.size ? 'warning' : 'ready', `${state.loaded.size} структур`);
  updateStats();
}
function cancelLoading() {
  if (!state.loadSession) return;
  state.loadSession.cancelled = true;
  for (const controller of state.pending.values()) controller.abort();
  state.pending.clear();
  byId('loadingTitle').textContent = 'Загрузка остановлена';
  byId('cancelLoading').disabled = true;
  toast('Загрузка остановлена', 'warning');
}
async function loadPart(entry, session = state.loadSession) {
  if (state.loaded.has(entry.id)) return state.loaded.get(entry.id);
  if (state.pending.has(entry.id)) return null;
  const controller = new AbortController();
  state.pending.set(entry.id, controller);
  try {
    const response = await fetch(`${RAW_ROOT}${entry.file}`, { signal: controller.signal, mode: 'cors', cache: 'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    if (session?.cancelled) throw new DOMException('Cancelled', 'AbortError');
    const geometry = loader.parse(buffer);
    if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, getMaterial(entry));
    mesh.name = entry.ru;
    mesh.userData.entry = entry;
    mesh.userData.localCenter = geometry.boundingBox.getCenter(new THREE.Vector3());
    mesh.userData.triangleCount = geometry.index ? Math.floor(geometry.index.count / 3) : Math.floor(geometry.getAttribute('position').count / 3);
    mesh.renderOrder = layerDefinitions[entry.layer].order;
    anatomyRoot.add(mesh);
    state.loaded.set(entry.id, mesh);
    state.failed.delete(entry.id);
    if (entry.id === 'FMA7163') { orientAndScaleFromAnchor(mesh); anchorReady = true; restoreAnnotations(); }
    applyExplode();
    scheduleAdaptiveVisibility(true);
    updateStats();
    invalidate();
    return mesh;
  } catch (error) {
    if (error.name !== 'AbortError') {
      state.failed.set(entry.id, error.message || 'Ошибка загрузки');
      console.warn(`Не удалось загрузить ${entry.id}`, error);
    }
    return null;
  } finally {
    state.pending.delete(entry.id);
  }
}
async function runQueue(entries, concurrency, title) {
  const pending = entries.filter(entry => !state.loaded.has(entry.id));
  if (!pending.length) return [];
  const session = createLoadSession(title, pending);
  let cursor = 0;
  const results = [];
  async function worker() {
    while (cursor < pending.length && !session.cancelled) {
      const entry = pending[cursor++];
      results.push(await loadPart(entry, session));
      session.done += 1;
      updateLoadingPanel();
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
  finishLoadSession(session);
  return results.filter(Boolean);
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
  if (orientedSize.x < orientedSize.z) { anatomyRoot.rotateY(Math.PI / 2); anatomyRoot.updateMatrixWorld(true); orientedBox = new THREE.Box3().setFromObject(anchor); orientedSize = orientedBox.getSize(new THREE.Vector3()); }
  const scale = WORLD_HEIGHT / orientedSize.y;
  anatomyRoot.scale.setScalar(scale);
  state.rootScale = scale;
  anatomyRoot.updateMatrixWorld(true);
  state.anchorCenter.copy(box.getCenter(new THREE.Vector3()));
  const scaledBox = new THREE.Box3().setFromObject(anchor);
  anatomyRoot.position.sub(scaledBox.getCenter(new THREE.Vector3()));
  anatomyRoot.updateMatrixWorld(true);
  controls.target.set(0, 0, 0);
  camera.position.set(0, .1, 9.2);
  camera.lookAt(0, 0, 0);
  controls.update();
}
async function ensureEntries(entries, title = 'Загрузка структур') {
  return runQueue(entries, lowQuality ? 3 : 5, title);
}
async function ensureEntry(id, focus = false) {
  const entry = catalogById.get(id);
  if (!entry) return null;
  if (!state.loaded.has(id)) await ensureEntries([entry], `Загрузка: ${entry.ru}`);
  const mesh = state.loaded.get(id);
  if (mesh) {
    state.layer[entry.layer].visible = true;
    state.systemVisibility[entry.system] = true;
    applyLayerState();
    selectMesh(mesh, focus);
  }
  return mesh;
}
async function ensureSystem(systemId, detail = false) {
  const entries = catalog.filter(entry => entry.system === systemId && (detail || entry.core || ['organ', 'brain', 'nerve'].includes(entry.layer)));
  return ensureEntries(entries, `Загрузка: ${SYSTEM_BY_ID[systemId]?.label || systemId}`);
}
async function ensureLayers(layers, detail = false, title = 'Загрузка слоя') {
  const entries = catalog.filter(entry => layers.includes(entry.layer) && (detail || entry.core || ['organ', 'brain', 'nerve'].includes(entry.layer)));
  return ensureEntries(entries, title);
}

function applyLayerState() {
  const planes = activeClippingPlanes();
  for (const mesh of state.loaded.values()) {
    const entry = mesh.userData.entry;
    const config = state.layer[entry.layer];
    const material = mesh.material;
    const transparent = config.opacity < 1 || entry.layer === 'skin';
    const depthWrite = config.opacity > .55;
    const shaderChange = material.transparent !== transparent || material.depthWrite !== depthWrite || material.clippingPlanes.length !== planes.length;
    material.opacity = config.opacity;
    material.transparent = transparent;
    material.depthWrite = depthWrite;
    material.clippingPlanes = planes;
    if (shaderChange) material.needsUpdate = true;
  }
  if (state.selected) applySelectionHighlight(state.selected, true);
  scheduleAdaptiveVisibility(true);
  buildLayerControls();
  buildAnatomyTree();
  updateUrlSoon();
  invalidate();
}
const PRESETS = {
  skin: { skin: [true, .88], muscle: [false, 1], skeleton: [false, 1], organ: [false, 1], brain: [false, 1], artery: [false, 1], vein: [false, 1], nerve: [false, 1] },
  muscles: { skin: [false, .16], muscle: [true, 1], skeleton: [false, 1], organ: [false, 1], brain: [false, 1], artery: [false, 1], vein: [false, 1], nerve: [false, 1] },
  skeleton: { skin: [false, .1], muscle: [false, .2], skeleton: [true, 1], organ: [false, 1], brain: [false, 1], artery: [false, 1], vein: [false, 1], nerve: [false, 1] },
  brain: { skin: [false, .06], muscle: [false, .06], skeleton: [true, .11], organ: [false, 1], brain: [true, 1], artery: [false, 1], vein: [false, 1], nerve: [true, .9] },
  internal: { skin: [false, .08], muscle: [true, .1], skeleton: [true, .1], organ: [true, 1], brain: [false, 1], artery: [true, 1], vein: [true, 1], nerve: [true, 1] },
  all: { skin: [true, .08], muscle: [true, .3], skeleton: [true, .65], organ: [true, .95], brain: [true, .95], artery: [true, 1], vein: [true, 1], nerve: [true, 1] }
};
async function activatePreset(name, { load = true, focus = true } = {}) {
  const preset = PRESETS[name];
  if (!preset) return;
  state.preset = name;
  state.isolated = false;
  for (const [layer, [visible, opacity]] of Object.entries(preset)) Object.assign(state.layer[layer], { visible, opacity });
  qsa('[data-preset]').forEach(button => button.classList.toggle('active', button.dataset.preset === name));
  if (load) {
    const layers = Object.entries(preset).filter(([, config]) => config[0]).map(([layer]) => layer);
    await ensureLayers(layers, false, `Загрузка режима «${name === 'internal' ? 'Органы' : layerDefinitions[layers[0]]?.label || 'Анатомия'}»`);
  }
  applyLayerState();
  if (name === 'brain' && focus) setView('brain');
  if (name === 'internal' && focus) setView('torso');
}

function applyExplode() {
  for (const mesh of state.loaded.values()) {
    const center = mesh.userData.localCenter;
    if (!center) continue;
    const layerScale = { skin: 1.2, muscle: .75, skeleton: .22, organ: .45, brain: .35, artery: .58, vein: .58, nerve: .62 }[mesh.userData.entry.layer] || .4;
    const direction = center.clone().sub(state.anchorCenter);
    if (direction.lengthSq() > 0) direction.normalize();
    mesh.position.copy(direction.multiplyScalar(state.explode * layerScale / Math.max(state.rootScale, .001)));
  }
  invalidate();
}
function updateClipping() {
  for (const axis of ['x', 'y', 'z']) {
    const config = state.clipping[axis];
    const normal = clippingPlanes[axis].normal;
    normal.set(axis === 'x' ? -1 : 0, axis === 'y' ? -1 : 0, axis === 'z' ? -1 : 0).multiplyScalar(config.flip ? -1 : 1);
    clippingPlanes[axis].constant = config.value / 100 * WORLD_HEIGHT * .55;
  }
  applyLayerState();
}
function setView(view) {
  const distance = 9.1;
  const views = {
    front: [[0, .05, distance], [0, 0, 0]], back: [[0, .05, -distance], [0, 0, 0]],
    left: [[-distance, .05, 0], [0, 0, 0]], right: [[distance, .05, 0], [0, 0, 0]],
    brain: [[0, 2.4, 3.05], [0, 2.25, 0]], torso: [[0, .55, 5.0], [0, .45, 0]], reset: [[0, .15, distance], [0, 0, 0]]
  };
  const [position, target] = views[view] || views.reset;
  state.targetCamera = new THREE.Vector3(...position);
  state.targetLookAt = new THREE.Vector3(...target);
  updateUrlSoon();
  invalidate();
}
function focusOn(mesh, multiplier = 3.1) {
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const direction = camera.position.clone().sub(controls.target).normalize();
  state.targetLookAt = center;
  state.targetCamera = center.clone().add(direction.multiplyScalar(Math.max(sphere.radius, .12) * multiplier + .24));
  invalidate();
}
function selectMesh(mesh, focus = false) {
  if (!mesh) return;
  if (state.mode === 'quiz') return handleQuizSelection(mesh);
  if (state.selected && state.selected !== mesh) applySelectionHighlight(state.selected, false);
  state.selected = mesh;
  state.selectedId = mesh.userData.entry.id;
  applySelectionHighlight(mesh, true);
  byId('selectedInfo').classList.remove('hidden');
  updateSelectedInfo(mesh);
  if (focus) focusOn(mesh);
  updateWorldLabels();
  buildAnatomyTree();
  updateUrlSoon();
  invalidate();
}
function clearSelection() {
  if (state.selected) applySelectionHighlight(state.selected, false);
  state.selected = null; state.selectedId = null; state.isolated = false;
  byId('selectedInfo').classList.add('hidden');
  byId('isolateButton').textContent = 'Изолировать';
  applyLayerState();
}
function updateSelectedInfo(mesh) {
  const entry = mesh.userData.entry;
  const system = SYSTEM_BY_ID[entry.system];
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3()).multiplyScalar(REFERENCE_HEIGHT_CM / WORLD_HEIGHT);
  const dimensions = [size.x, size.y, size.z].sort((a, b) => b - a).map(v => Math.max(v, .1).toFixed(v > 20 ? 0 : 1));
  const triangles = mesh.userData.triangleCount || 0;
  byId('selectedSystem').textContent = system?.label || layerDefinitions[entry.layer].label;
  byId('selectedName').textContent = entry.ru;
  byId('selectedEnglish').textContent = `${entry.latin}${entry.en !== entry.latin ? ` · ${entry.en}` : ''}`;
  byId('selectedId').textContent = entry.id;
  byId('selectedSize').textContent = `${dimensions.join(' × ')} см · ${triangles >= 1000 ? `${(triangles / 1000).toFixed(triangles >= 10000 ? 0 : 1)}k` : triangles} △`;
  byId('selectedDescription').textContent = entry.description;
  byId('selectedLocation').textContent = entry.location;
  byId('selectedFunctions').innerHTML = entry.functions.length ? entry.functions.map(value => `<li>${escapeHtml(value)}</li>`).join('') : '<li>Функции не добавлены в краткую базу.</li>';
  byId('relatedStructures').innerHTML = entry.related.length ? entry.related.map(id => {
    const related = catalogById.get(id); return related ? `<button data-related-id="${id}">${escapeHtml(related.ru)}</button>` : '';
  }).join('') : '<span class="muted">Связи пока не указаны</span>';
}

function getIntersections(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(interactionCandidates, false);
}
function handleCanvasClick(event) {
  const movement = pointerStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
  if (movement > 5) return;
  const hit = getIntersections(event)[0];
  if (!hit) return;
  if (state.mode === 'measure') return addMeasurementPoint(hit.point);
  if (state.mode === 'annotate') return openAnnotationDialog(hit);
  selectMesh(hit.object);
}
function updateHover(point) {
  lastHoverCheck = performance.now();
  const hit = getIntersections(point)[0];
  hoverObject = hit?.object || null;
  const label = byId('hoverLabel');
  if (hoverObject) {
    canvas.style.cursor = 'pointer';
    label.style.display = 'block'; label.style.left = `${point.clientX}px`; label.style.top = `${point.clientY}px`;
    label.textContent = hoverObject.userData.entry.ru;
  } else {
    canvas.style.cursor = controlsActive ? 'grabbing' : 'grab'; label.style.display = 'none';
  }
}

function projectToScreen(worldPoint) {
  const projected = worldPoint.clone().project(camera);
  if (projected.z < -1 || projected.z > 1) return null;
  return { x: (projected.x * .5 + .5) * viewport.clientWidth, y: (-projected.y * .5 + .5) * viewport.clientHeight };
}
function labelCandidates() {
  if (state.labelsMode === 'off') return [];
  if (state.labelsMode === 'selected') return state.selected ? [state.selected] : [];
  const visible = [...state.loaded.values()].filter(mesh => mesh.visible);
  if (state.labelsMode === 'major') return visible.filter(mesh => mesh.userData.entry.major).slice(0, 18);
  if (state.labelsMode === 'system' && state.selected) return visible.filter(mesh => mesh.userData.entry.system === state.selected.userData.entry.system).slice(0, 24);
  return [];
}
function updateWorldLabels() {
  const layer = byId('worldLabels');
  if (!layer) return;
  const occupied = [];
  const labels = [];
  for (const mesh of labelCandidates()) {
    const box = new THREE.Box3().setFromObject(mesh);
    const point = box.getCenter(new THREE.Vector3());
    point.y += box.getSize(new THREE.Vector3()).y * .16;
    const screen = projectToScreen(point);
    if (!screen) continue;
    if (occupied.some(other => Math.abs(other.x - screen.x) < 95 && Math.abs(other.y - screen.y) < 34)) continue;
    occupied.push(screen);
    labels.push(`<button class="world-label ${mesh === state.selected ? 'selected' : ''}" data-label-id="${mesh.userData.entry.id}" style="transform:translate(${screen.x}px,${screen.y}px)"><i></i>${escapeHtml(mesh.userData.entry.ru)}</button>`);
  }
  for (const measurement of state.measurements) {
    const screen = projectToScreen(measurement.midpoint);
    if (screen) labels.push(`<span class="measure-label" style="transform:translate(${screen.x}px,${screen.y}px)">${measurement.cm.toFixed(1)} см</span>`);
  }
  for (const annotation of state.annotations) {
    const screen = projectToScreen(annotation.position);
    if (screen) labels.push(`<button class="annotation-label" data-annotation-id="${annotation.id}" style="transform:translate(${screen.x}px,${screen.y}px)">● ${escapeHtml(annotation.text)}</button>`);
  }
  layer.innerHTML = labels.join('');
}

function addMeasurementPoint(point) {
  const marker = new THREE.Mesh(new THREE.SphereGeometry(.025, 12, 12), new THREE.MeshBasicMaterial({ color: 0x69d9ff, depthTest: false }));
  marker.position.copy(point); marker.renderOrder = 50; helperRoot.add(marker);
  state.measurementPoints.push({ point: point.clone(), marker });
  if (state.measurementPoints.length === 2) {
    const [a, b] = state.measurementPoints;
    const geometry = new THREE.BufferGeometry().setFromPoints([a.point, b.point]);
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x69d9ff, depthTest: false }));
    line.renderOrder = 49; helperRoot.add(line);
    const cm = a.point.distanceTo(b.point) * REFERENCE_HEIGHT_CM / WORLD_HEIGHT;
    state.measurements.push({ a: a.point, b: b.point, midpoint: a.point.clone().lerp(b.point, .5), cm, objects: [a.marker, b.marker, line] });
    state.measurementPoints = [];
    renderMeasurementList();
    toast(`Расстояние: ${cm.toFixed(1)} см`, 'success');
  } else toast('Поставьте вторую точку', 'default');
  updateWorldLabels(); invalidate();
}
function clearMeasurements() {
  for (const item of state.measurements) for (const object of item.objects) { helperRoot.remove(object); object.geometry?.dispose(); object.material?.dispose(); }
  for (const item of state.measurementPoints) { helperRoot.remove(item.marker); item.marker.geometry.dispose(); item.marker.material.dispose(); }
  state.measurements = []; state.measurementPoints = [];
  renderMeasurementList(); updateWorldLabels(); invalidate();
}
function renderMeasurementList() {
  byId('measurementList').innerHTML = state.measurements.length ? state.measurements.map((item, i) => `<div><span>Измерение ${i + 1}</span><strong>${item.cm.toFixed(1)} см</strong></div>`).join('') : '<p class="empty-state">Поставьте две точки на модели.</p>';
}

function openAnnotationDialog(hit) {
  state.pendingAnnotationPoint = hit.point.clone();
  byId('annotationText').value = hit.object.userData.entry.ru;
  byId('annotationDialog').showModal();
}
function saveAnnotation(text) {
  if (!state.pendingAnnotationPoint || !text.trim()) return;
  const annotation = { id: crypto.randomUUID?.() || `${Date.now()}`, text: text.trim(), position: state.pendingAnnotationPoint.clone() };
  state.annotations.push(annotation); state.pendingAnnotationPoint = null;
  persistAnnotations(); renderAnnotationList(); updateWorldLabels(); invalidate();
}
function persistAnnotations() {
  localStorage.setItem('anatomy-atlas-annotations', JSON.stringify(state.annotations.map(item => ({ id: item.id, text: item.text, position: item.position.toArray() }))));
}
function restoreAnnotations() {
  try {
    const saved = JSON.parse(localStorage.getItem('anatomy-atlas-annotations') || '[]');
    state.annotations = saved.map(item => ({ ...item, position: new THREE.Vector3().fromArray(item.position) }));
  } catch { state.annotations = []; }
  renderAnnotationList(); updateWorldLabels();
}
function renderAnnotationList() {
  byId('annotationList').innerHTML = state.annotations.length ? state.annotations.map(item => `<div class="annotation-row"><button data-focus-annotation="${item.id}">${escapeHtml(item.text)}</button><button class="icon-danger" data-delete-annotation="${item.id}" aria-label="Удалить">×</button></div>`).join('') : '<p class="empty-state">Метки ещё не добавлены.</p>';
}
function deleteAnnotation(id) {
  state.annotations = state.annotations.filter(item => item.id !== id); persistAnnotations(); renderAnnotationList(); updateWorldLabels(); invalidate();
}

async function takeScreenshot() {
  const oldPixelRatio = renderer.getPixelRatio();
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.render(scene, camera);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  renderer.setPixelRatio(oldPixelRatio); resize();
  if (!blob) return toast('Не удалось создать снимок', 'error');
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `anatomy-${state.selectedId || state.preset}-${Date.now()}.png`; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  toast('Снимок сохранён', 'success');
}
function serializeState() {
  return {
    preset: state.preset,
    sel: state.selectedId || undefined,
    cam: camera.position.toArray().map(value => +value.toFixed(3)),
    target: controls.target.toArray().map(value => +value.toFixed(3)),
    layers: Object.fromEntries(Object.entries(state.layer).map(([key, value]) => [key, [value.visible ? 1 : 0, +value.opacity.toFixed(2)]])),
    clip: Object.fromEntries(Object.entries(state.clipping).map(([key, value]) => [key, [value.enabled ? 1 : 0, value.value, value.flip ? 1 : 0]]))
  };
}
function updateUrlSoon() {
  clearTimeout(urlUpdateTimer);
  urlUpdateTimer = setTimeout(() => {
    const url = new URL(location.href);
    const encoded = encodeURIComponent(JSON.stringify(serializeState()));
    url.hash = `state=${encoded}`;
    history.replaceState(null, '', url);
  }, 550);
}
function parseSharedState() {
  const match = location.hash.match(/^#state=(.+)$/);
  if (!match) return null;
  try { return JSON.parse(decodeURIComponent(match[1])); } catch { return null; }
}
async function restoreSharedState() {
  const shared = parseSharedState();
  if (!shared) return false;
  if (shared.layers) for (const [key, value] of Object.entries(shared.layers)) if (state.layer[key]) Object.assign(state.layer[key], { visible: Boolean(value[0]), opacity: Number(value[1]) });
  if (shared.clip) for (const [key, value] of Object.entries(shared.clip)) if (state.clipping[key]) Object.assign(state.clipping[key], { enabled: Boolean(value[0]), value: Number(value[1]), flip: Boolean(value[2]) });
  state.preset = shared.preset || 'muscles';
  await activatePreset(state.preset, { load: true, focus: false });
  if (Array.isArray(shared.cam)) camera.position.fromArray(shared.cam);
  if (Array.isArray(shared.target)) controls.target.fromArray(shared.target);
  controls.update(); updateClipping();
  if (shared.sel) await ensureEntry(shared.sel, false);
  toast('Состояние сцены восстановлено', 'success');
  return true;
}
async function copyDeepLink() {
  updateUrlSoon();
  await new Promise(resolve => setTimeout(resolve, 600));
  try { await navigator.clipboard.writeText(location.href); toast('Ссылка скопирована', 'success'); }
  catch { byId('shareUrl').value = location.href; byId('shareDialog').showModal(); }
}

function disposeMesh(mesh) {
  if (state.selected === mesh) clearSelection();
  anatomyRoot.remove(mesh);
  mesh.geometry?.disposeBoundsTree?.();
  mesh.geometry?.dispose();
  if (Array.isArray(mesh.material)) mesh.material.forEach(material => material.dispose()); else mesh.material?.dispose();
  state.loaded.delete(mesh.userData.entry.id);
}
function unloadLayer(layer) {
  if (layer === 'skin') return toast('Кожа используется как опорная геометрия', 'warning');
  const meshes = [...state.loaded.values()].filter(mesh => mesh.userData.entry.layer === layer);
  meshes.forEach(disposeMesh);
  scheduleAdaptiveVisibility(true); updateStats(); buildLayerControls(); buildAnatomyTree(); invalidate();
  toast(`${layerDefinitions[layer].label}: выгружено ${meshes.length}`, 'success');
}
function unloadHidden() {
  const hidden = Object.entries(state.layer).filter(([layer, config]) => !config.visible && layer !== 'skin').map(([layer]) => layer);
  hidden.forEach(unloadLayer); updateCacheStatus();
}
function scheduleAutoUnload() {
  clearInterval(autoUnloadTimer);
  if (!state.autoUnload) return;
  autoUnloadTimer = setInterval(() => {
    const now = Date.now();
    for (const [layer, config] of Object.entries(state.layer)) {
      if (layer === 'skin' || config.visible) { state.hiddenSince[layer] = 0; continue; }
      if (!state.hiddenSince[layer]) state.hiddenSince[layer] = now;
      if (now - state.hiddenSince[layer] > AUTO_UNLOAD_MS) { unloadLayer(layer); state.hiddenSince[layer] = now; }
    }
  }, 30000);
}

function buildLayerControls() {
  const container = byId('layerControls');
  container.innerHTML = Object.entries(layerDefinitions).map(([key, definition]) => {
    const config = state.layer[key];
    const count = [...state.loaded.values()].filter(mesh => mesh.userData.entry.layer === key).length;
    return `<div class="layer-control" data-layer-row="${key}">
      <button class="layer-eye ${config.visible ? 'active' : ''}" data-layer-toggle="${key}" aria-label="Видимость">${config.visible ? '●' : '○'}</button>
      <span class="layer-swatch" style="--swatch:${definition.color}"></span>
      <div class="layer-copy"><strong>${definition.label}</strong><small>${count} загружено</small></div>
      <input data-layer-opacity="${key}" type="range" min="0" max="100" value="${Math.round(config.opacity * 100)}" aria-label="Прозрачность ${definition.label}">
      <button class="layer-unload" data-layer-unload="${key}" ${key === 'skin' || count === 0 ? 'disabled' : ''} title="Освободить память">↧</button>
    </div>`;
  }).join('');
}
function buildAnatomyTree() {
  const container = byId('anatomyTree');
  const term = state.treeFilter.trim().toLocaleLowerCase('ru');
  const html = SYSTEMS.map(system => {
    const entries = catalog.filter(entry => entry.system === system.id && (!term || entry.keywords.join(' ').toLocaleLowerCase('ru').includes(term)));
    if (!entries.length) return '';
    const loaded = entries.filter(entry => state.loaded.has(entry.id)).length;
    const groups = [...new Set(entries.map(entry => entry.region))];
    return `<details class="tree-system" ${['muscular', 'nervous'].includes(system.id) || term ? 'open' : ''} data-system="${system.id}">
      <summary><span class="tree-icon">${system.icon}</span><span><strong>${system.label}</strong><small>${loaded}/${entries.length}</small></span><button data-system-toggle="${system.id}" class="tree-eye ${state.systemVisibility[system.id] ? 'active' : ''}" title="Видимость">${state.systemVisibility[system.id] ? '●' : '○'}</button></summary>
      <div class="tree-regions">${groups.map(region => {
        const regionEntries = entries.filter(entry => entry.region === region);
        return `<details class="tree-region"><summary><span>${escapeHtml(region)}</span><small>${regionEntries.filter(entry => state.loaded.has(entry.id)).length}/${regionEntries.length}</small></summary>
          <div class="tree-items">${regionEntries.map(entry => `<button class="tree-item ${state.selectedId === entry.id ? 'selected' : ''}" data-tree-id="${entry.id}"><i class="${state.loaded.has(entry.id) ? 'loaded' : state.failed.has(entry.id) ? 'failed' : ''}"></i><span>${escapeHtml(entry.ru)}</span><small>${escapeHtml(entry.id)}</small></button>`).join('')}</div>
        </details>`;
      }).join('')}</div>
    </details>`;
  }).join('');
  container.innerHTML = html || '<p class="empty-state">Ничего не найдено.</p>';
}
function updateTreeStatuses() {
  qsa('[data-system]').forEach(node => {
    const systemId = node.dataset.system;
    const entries = catalog.filter(entry => entry.system === systemId);
    const small = node.querySelector('summary small');
    if (small) small.textContent = `${entries.filter(entry => state.loaded.has(entry.id)).length}/${entries.length}`;
  });
}
function renderSearch(query) {
  const results = byId('searchResults');
  const term = query.trim().toLocaleLowerCase('ru');
  if (term.length < 2) { results.classList.remove('open'); results.innerHTML = ''; return; }
  const matches = catalog.filter(entry => entry.keywords.join(' ').toLocaleLowerCase('ru').includes(term)).slice(0, 16);
  results.innerHTML = matches.length ? matches.map(entry => `<button class="search-item" data-search-id="${entry.id}"><i class="${state.loaded.has(entry.id) ? 'loaded' : ''}"></i><span><strong>${escapeHtml(entry.ru)}</strong><small>${escapeHtml(entry.latin)} · ${escapeHtml(SYSTEM_BY_ID[entry.system]?.short || '')}</small></span><em>${state.loaded.has(entry.id) ? 'Открыть' : 'Загрузить'}</em></button>`).join('') : '<div class="empty-state">Ничего не найдено</div>';
  results.classList.add('open');
}
function renderLoadSystems() {
  byId('loadSystems').innerHTML = SYSTEMS.map(system => {
    const entries = catalog.filter(entry => entry.system === system.id);
    const loaded = entries.filter(entry => state.loaded.has(entry.id)).length;
    const pending = entries.filter(entry => state.pending.has(entry.id)).length;
    const failed = entries.filter(entry => state.failed.has(entry.id)).length;
    if (!loaded && !pending && !failed) return '';
    return `<div><span>${system.short}</span><strong>${pending ? `${loaded}/${entries.length} · ${pending}…` : `${loaded}/${entries.length}`}${failed ? ` · ${failed} !` : ''}</strong></div>`;
  }).join('');
}
function renderTours() {
  byId('tourList').innerHTML = LEARNING_TOURS.map(tour => `<button class="tour-card ${state.currentTour?.id === tour.id ? 'active' : ''}" data-tour-id="${tour.id}"><span>Маршрут</span><strong>${escapeHtml(tour.title)}</strong><small>${escapeHtml(tour.subtitle)}</small></button>`).join('');
}
async function startTour(id) {
  const tour = LEARNING_TOURS.find(item => item.id === id); if (!tour) return;
  state.currentTour = tour; state.tourIndex = 0; setMode('learn'); renderTours(); await showTourStep();
}
async function showTourStep() {
  const tour = state.currentTour; if (!tour) return;
  const step = tour.steps[state.tourIndex];
  await activatePreset(tour.preset, { load: true, focus: false });
  await ensureEntry(step.id, true);
  byId('tourProgress').textContent = `${state.tourIndex + 1} / ${tour.steps.length}`;
  byId('tourTitle').textContent = tour.title;
  byId('tourStepName').textContent = catalogById.get(step.id)?.ru || step.id;
  byId('tourStepText').textContent = step.text;
  byId('tourPrev').disabled = state.tourIndex === 0;
  byId('tourNext').textContent = state.tourIndex === tour.steps.length - 1 ? 'Завершить' : 'Далее';
  byId('tourPlayer').classList.add('visible');
}
async function moveTour(delta) {
  if (!state.currentTour) return;
  if (delta > 0 && state.tourIndex === state.currentTour.steps.length - 1) { toast('Маршрут завершён', 'success'); byId('tourPlayer').classList.remove('visible'); state.currentTour = null; renderTours(); return; }
  state.tourIndex = THREE.MathUtils.clamp(state.tourIndex + delta, 0, state.currentTour.steps.length - 1); await showTourStep();
}
async function nextQuiz() {
  setMode('quiz');
  const choices = QUIZ_BANK.filter(id => catalogById.has(id));
  let id = choices[Math.floor(Math.random() * choices.length)];
  if (choices.length > 1) while (id === state.quiz.targetId) id = choices[Math.floor(Math.random() * choices.length)];
  state.quiz.targetId = id; state.quiz.locked = false;
  const entry = catalogById.get(id);
  state.layer[entry.layer].visible = true; state.systemVisibility[entry.system] = true;
  await ensureSystem(entry.system, false);
  applyLayerState();
  byId('quizQuestion').textContent = `Найдите: ${entry.ru}`;
  byId('quizHint').textContent = `${SYSTEM_BY_ID[entry.system]?.label} · ${entry.region}`;
  byId('quizFeedback').textContent = 'Кликните по нужной структуре на модели.';
  byId('quizFeedback').className = 'quiz-feedback';
  byId('quizNext').disabled = true;
}
function handleQuizSelection(mesh) {
  if (state.quiz.locked) return;
  state.quiz.locked = true; state.quiz.total += 1;
  const correct = mesh.userData.entry.id === state.quiz.targetId;
  if (correct) state.quiz.score += 1;
  byId('quizScore').textContent = `${state.quiz.score} / ${state.quiz.total}`;
  byId('quizFeedback').textContent = correct ? 'Правильно!' : `Это «${mesh.userData.entry.ru}». Правильный ответ подсвечен.`;
  byId('quizFeedback').className = `quiz-feedback ${correct ? 'correct' : 'wrong'}`;
  byId('quizNext').disabled = false;
  ensureEntry(state.quiz.targetId, false).then(target => {
    if (!target) return;
    if (state.selected && state.selected !== target) applySelectionHighlight(state.selected, false);
    state.selected = target; state.selectedId = target.userData.entry.id;
    applySelectionHighlight(target, true); focusOn(target); updateWorldLabels(); invalidate();
  });
}
function setMode(mode) {
  state.mode = mode;
  const panelMode = ['explore', 'learn', 'quiz'].includes(mode) ? mode : 'explore';
  qsa('[data-mode]').forEach(button => button.classList.toggle('active', button.dataset.mode === mode || (button.dataset.mode === 'explore' && !['learn', 'quiz'].includes(mode))));
  qsa('[data-mode-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.modePanel === panelMode));
  canvas.classList.toggle('tool-active', ['measure', 'annotate'].includes(mode));
  if (mode === 'quiz' && !state.quiz.targetId) nextQuiz();
  toast({ explore: 'Режим просмотра', learn: 'Учебный режим', quiz: 'Тестирование', measure: 'Измерение: выберите две точки', annotate: 'Аннотации: кликните по модели' }[mode] || mode);
}

async function retryFailed() {
  const entries = [...state.failed.keys()].map(id => catalogById.get(id)).filter(Boolean);
  state.failed.clear();
  if (!entries.length) return toast('Ошибок загрузки нет');
  await ensureEntries(entries, 'Повторная загрузка');
}
async function updateCacheStatus() {
  if (!('caches' in window)) { byId('cacheCount').textContent = 'не поддерживается'; return; }
  try {
    const names = await caches.keys(); let total = 0;
    for (const name of names) total += (await caches.open(name).then(cache => cache.keys())).length;
    byId('cacheCount').textContent = `${total} файлов`;
  } catch { byId('cacheCount').textContent = 'недоступно'; }
}
async function clearAppCache() {
  if (!('caches' in window)) return;
  await Promise.all((await caches.keys()).map(name => caches.delete(name)));
  updateCacheStatus(); toast('Кэш очищен', 'success');
}

function bindUI() {
  buildLayerControls(); buildAnatomyTree(); renderTours(); renderMeasurementList(); renderAnnotationList();
  qsa('[data-preset]').forEach(button => button.addEventListener('click', () => activatePreset(button.dataset.preset)));
  qsa('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  qsa('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  byId('sidebarToggle').addEventListener('click', () => byId('leftSidebar').classList.toggle('open'));
  byId('sidebarClose').addEventListener('click', () => byId('leftSidebar').classList.remove('open'));
  byId('inspectorClose').addEventListener('click', clearSelection);
  byId('settingsToggle').addEventListener('click', () => byId('settingsPanel').classList.toggle('open'));
  byId('settingsClose').addEventListener('click', () => byId('settingsPanel').classList.remove('open'));
  byId('loadingToggle').addEventListener('click', () => byId('loadingPanel').classList.toggle('expanded'));
  byId('cancelLoading').addEventListener('click', cancelLoading);
  byId('retryFailed').addEventListener('click', retryFailed);
  byId('loadDetail').addEventListener('click', async () => { await ensureEntries(catalog.filter(entry => !entry.core), 'Загрузка детального набора'); state.detailLoaded = true; });
  byId('layerControls').addEventListener('input', event => {
    if (!event.target.dataset.layerOpacity) return;
    state.layer[event.target.dataset.layerOpacity].opacity = Number(event.target.value) / 100; applyLayerState();
  });
  byId('layerControls').addEventListener('click', async event => {
    const toggle = event.target.closest('[data-layer-toggle]');
    const unload = event.target.closest('[data-layer-unload]');
    if (toggle) {
      const layer = toggle.dataset.layerToggle; state.layer[layer].visible = !state.layer[layer].visible;
      if (state.layer[layer].visible) await ensureLayers([layer], false, `Загрузка: ${layerDefinitions[layer].label}`);
      applyLayerState();
    }
    if (unload) unloadLayer(unload.dataset.layerUnload);
  });
  byId('anatomyTree').addEventListener('click', async event => {
    const item = event.target.closest('[data-tree-id]');
    const toggle = event.target.closest('[data-system-toggle]');
    if (item) await ensureEntry(item.dataset.treeId, true);
    if (toggle) { event.preventDefault(); event.stopPropagation(); state.systemVisibility[toggle.dataset.systemToggle] = !state.systemVisibility[toggle.dataset.systemToggle]; applyLayerState(); }
  });
  byId('treeSearch').addEventListener('input', event => { state.treeFilter = event.target.value; buildAnatomyTree(); });
  byId('searchInput').addEventListener('input', event => renderSearch(event.target.value));
  byId('searchResults').addEventListener('click', async event => {
    const item = event.target.closest('[data-search-id]'); if (!item) return;
    await ensureEntry(item.dataset.searchId, true); byId('searchInput').value = ''; renderSearch('');
  });
  byId('relatedStructures').addEventListener('click', event => { const button = event.target.closest('[data-related-id]'); if (button) ensureEntry(button.dataset.relatedId, true); });
  byId('focusButton').addEventListener('click', () => state.selected && focusOn(state.selected));
  byId('isolateButton').addEventListener('click', () => { if (!state.selected) return; state.isolated = !state.isolated; state.isolateContext = byId('isolateContext').value; byId('isolateButton').textContent = state.isolated ? 'Вернуть тело' : 'Изолировать'; applyLayerState(); });
  byId('isolateContext').addEventListener('change', event => { state.isolateContext = event.target.value; if (state.isolated) applyLayerState(); });
  byId('labelMode').addEventListener('change', event => { state.labelsMode = event.target.value; updateWorldLabels(); invalidate(); });
  byId('worldLabels').addEventListener('click', event => {
    const label = event.target.closest('[data-label-id]'); if (label) ensureEntry(label.dataset.labelId, true);
    const annotation = event.target.closest('[data-annotation-id]'); if (annotation) { const item = state.annotations.find(value => value.id === annotation.dataset.annotationId); if (item) { state.targetLookAt = item.position.clone(); state.targetCamera = item.position.clone().add(new THREE.Vector3(0, .2, 1.4)); invalidate(); } }
  });
  for (const axis of ['x', 'y', 'z']) {
    byId(`clip${axis.toUpperCase()}Enabled`).addEventListener('change', event => { state.clipping[axis].enabled = event.target.checked; updateClipping(); });
    byId(`clip${axis.toUpperCase()}`).addEventListener('input', event => { state.clipping[axis].value = Number(event.target.value); updateClipping(); });
    byId(`clip${axis.toUpperCase()}Flip`).addEventListener('click', () => { state.clipping[axis].flip = !state.clipping[axis].flip; byId(`clip${axis.toUpperCase()}Flip`).classList.toggle('active', state.clipping[axis].flip); updateClipping(); });
  }
  byId('explodeSlider').addEventListener('input', event => { state.explode = Number(event.target.value) / 100; applyExplode(); });
  byId('clearMeasurements').addEventListener('click', clearMeasurements);
  byId('annotationForm').addEventListener('submit', event => { event.preventDefault(); saveAnnotation(byId('annotationText').value); byId('annotationDialog').close(); });
  byId('annotationList').addEventListener('click', event => {
    const del = event.target.closest('[data-delete-annotation]'); if (del) deleteAnnotation(del.dataset.deleteAnnotation);
    const focus = event.target.closest('[data-focus-annotation]'); if (focus) { const item = state.annotations.find(value => value.id === focus.dataset.focusAnnotation); if (item) { state.targetLookAt = item.position.clone(); state.targetCamera = item.position.clone().add(new THREE.Vector3(0, .2, 1.4)); invalidate(); } }
  });
  byId('screenshotButton').addEventListener('click', takeScreenshot);
  byId('shareButton').addEventListener('click', copyDeepLink);
  byId('copyShareUrl').addEventListener('click', async () => { await navigator.clipboard.writeText(byId('shareUrl').value); toast('Ссылка скопирована', 'success'); });
  byId('unloadHidden').addEventListener('click', unloadHidden);
  byId('autoUnload').addEventListener('change', event => { state.autoUnload = event.target.checked; scheduleAutoUnload(); });
  byId('clearCache').addEventListener('click', clearAppCache);
  byId('tourList').addEventListener('click', event => { const card = event.target.closest('[data-tour-id]'); if (card) startTour(card.dataset.tourId); });
  byId('tourPrev').addEventListener('click', () => moveTour(-1));
  byId('tourNext').addEventListener('click', () => moveTour(1));
  byId('quizNext').addEventListener('click', nextQuiz);
  byId('startQuiz').addEventListener('click', nextQuiz);
  byId('openCredits').addEventListener('click', () => byId('creditsDialog').showModal());
  qsa('[data-dialog-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  byId('installButton').addEventListener('click', async () => { if (state.installPrompt) { state.installPrompt.prompt(); await state.installPrompt.userChoice; state.installPrompt = null; byId('installButton').hidden = true; } });
  document.addEventListener('click', event => { if (!event.target.closest('.search-wrap')) byId('searchResults').classList.remove('open'); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { byId('settingsPanel').classList.remove('open'); byId('leftSidebar').classList.remove('open'); if (state.mode !== 'quiz') clearSelection(); } });
}

canvas.addEventListener('pointerdown', event => pointerStart.set(event.clientX, event.clientY));
canvas.addEventListener('pointerup', handleCanvasClick);
canvas.addEventListener('pointermove', event => {
  pendingHoverPoint = { clientX: event.clientX, clientY: event.clientY };
  if (hoverObject) { byId('hoverLabel').style.left = `${event.clientX}px`; byId('hoverLabel').style.top = `${event.clientY}px`; }
  const interval = lowQuality ? 125 : 80;
  const elapsed = performance.now() - lastHoverCheck;
  if (elapsed >= interval) { clearTimeout(hoverTimer); hoverTimer = 0; updateHover(pendingHoverPoint); }
  else if (!hoverTimer) hoverTimer = setTimeout(() => { hoverTimer = 0; if (pendingHoverPoint) updateHover(pendingHoverPoint); }, interval - elapsed);
}, { passive: true });
canvas.addEventListener('pointerleave', () => { clearTimeout(hoverTimer); hoverObject = null; byId('hoverLabel').style.display = 'none'; });

function resize() {
  const width = viewport.clientWidth; const height = viewport.clientHeight;
  camera.aspect = width / height; camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio)); renderer.setSize(width, height, false);
  scheduleAdaptiveVisibility(true); updateWorldLabels(); invalidate();
}
window.addEventListener('resize', resize, { passive: true });
controls.addEventListener('start', () => { controlsActive = true; canvas.style.cursor = 'grabbing'; invalidate(); });
controls.addEventListener('change', () => { scheduleAdaptiveVisibility(false); updateWorldLabels(); updateUrlSoon(); invalidate(); });
controls.addEventListener('end', () => { controlsActive = false; canvas.style.cursor = hoverObject ? 'pointer' : 'grab'; scheduleAdaptiveVisibility(true); });

function renderFrame(now) {
  frameHandle = 0; renderingFrame = true;
  const dt = Math.min((now - lastFrameTime) / 1000, .05); lastFrameTime = now; needsRender = false;
  let keepAnimating = controls.update() === true;
  if (state.targetCamera && state.targetLookAt) {
    const factor = 1 - Math.pow(.001, dt);
    camera.position.lerp(state.targetCamera, factor); controls.target.lerp(state.targetLookAt, factor);
    keepAnimating = true; updateWorldLabels();
    if (camera.position.distanceTo(state.targetCamera) < .01 && controls.target.distanceTo(state.targetLookAt) < .01) {
      camera.position.copy(state.targetCamera); controls.target.copy(state.targetLookAt); state.targetCamera = null; state.targetLookAt = null;
    }
  }
  renderer.render(scene, camera); renderingFrame = false;
  if ((needsRender || keepAnimating || controlsActive || state.targetCamera) && !frameHandle) frameHandle = requestAnimationFrame(renderFrame);
}

async function registerPWA() {
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    try { await navigator.serviceWorker.register('./sw.js'); setConnectionStatus('ready', 'готово'); updateCacheStatus(); }
    catch (error) { console.warn('Service Worker', error); }
  }
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); state.installPrompt = event; byId('installButton').hidden = false; });
}
async function startLoading() {
  setConnectionStatus('loading', 'загрузка');
  const skin = catalogById.get('FMA7163');
  await ensureEntries([skin], 'Загрузка поверхности тела');
  if (!anchorReady) { setConnectionStatus('error', 'источник недоступен'); toast('Не удалось загрузить опорную модель', 'error', 5000); return; }
  const restored = await restoreSharedState();
  if (!restored) await activatePreset('muscles', { load: true, focus: false });
  setConnectionStatus('ready', `${state.loaded.size} структур`);
  updateStats();
}

bindUI();
resize();
registerPWA();
startLoading();
invalidate();
