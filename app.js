import * as THREE from 'https://esm.sh/three@0.176.0';
import { OrbitControls } from 'https://esm.sh/three@0.176.0/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'https://esm.sh/three@0.176.0/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'https://esm.sh/three@0.176.0/examples/jsm/loaders/GLTFLoader.js';

const fallbackProducts = [
  {
    id: 'vest_plate_carrier_alpha',
    name: 'Plate Carrier Alpha',
    category: 'vest',
    style_key: 'plate_carrier',
    price_cents: 26500,
    active: true,
    variants: [
      { id: 'vest_plate_carrier_alpha_black', color_name: 'Black', color_code: '#181a1d' },
      { id: 'vest_plate_carrier_alpha_tan', color_name: 'Tan', color_code: '#8a7152' },
      { id: 'vest_plate_carrier_alpha_olive', color_name: 'Olive', color_code: '#55624b' }
    ]
  },
  {
    id: 'vest_chest_rig_scout',
    name: 'Chest Rig Scout',
    category: 'vest',
    style_key: 'chest_rig',
    price_cents: 17900,
    active: true,
    variants: [
      { id: 'vest_chest_rig_scout_black', color_name: 'Black', color_code: '#181a1d' },
      { id: 'vest_chest_rig_scout_tan', color_name: 'Tan', color_code: '#91734d' },
      { id: 'vest_chest_rig_scout_gray', color_name: 'Gray', color_code: '#656b73' }
    ]
  },
  {
    id: 'helmet_high_cut_echo',
    name: 'High-Cut Helmet Echo',
    category: 'helmet',
    style_key: 'high_cut',
    price_cents: 32500,
    active: true,
    variants: [
      { id: 'helmet_high_cut_echo_black', color_name: 'Black', color_code: '#17191c' },
      { id: 'helmet_high_cut_echo_tan', color_name: 'Tan', color_code: '#8c7250' },
      { id: 'helmet_high_cut_echo_green', color_name: 'Green', color_code: '#4d5d4f' }
    ]
  },
  {
    id: 'helmet_mich_bravo',
    name: 'MICH Helmet Bravo',
    category: 'helmet',
    style_key: 'mich',
    price_cents: 28900,
    active: true,
    variants: [
      { id: 'helmet_mich_bravo_black', color_name: 'Black', color_code: '#191b1e' },
      { id: 'helmet_mich_bravo_tan', color_name: 'Tan', color_code: '#8b7252' },
      { id: 'helmet_mich_bravo_coyote', color_name: 'Coyote', color_code: '#7c6241' }
    ]
  }
];

const colorFallbacks = [
  { id: 'default_black', color_name: 'Black', color_code: '#181a1d' },
  { id: 'default_tan', color_name: 'Tan', color_code: '#8a7152' },
  { id: 'default_olive', color_name: 'Olive', color_code: '#55624b' },
  { id: 'default_gray', color_name: 'Gray', color_code: '#656b73' }
];

const state = {
  products: [],
  vests: [],
  helmets: [],
  selectedVest: null,
  selectedHelmet: null,
  selectedVestColor: colorFallbacks[0],
  selectedHelmetColor: colorFallbacks[0],
  sourceMode: 'fallback',
  mannequinMode: 'procedural',
  mannequinSourceName: 'Built-in procedural mannequin'
};

const ui = {
  vestList: document.getElementById('vestList'),
  helmetList: document.getElementById('helmetList'),
  vestColorPicker: document.getElementById('vestColorPicker'),
  helmetColorPicker: document.getElementById('helmetColorPicker'),
  vestName: document.getElementById('vestName'),
  helmetName: document.getElementById('helmetName'),
  vestColorName: document.getElementById('vestColorName'),
  helmetColorName: document.getElementById('helmetColorName'),
  selectedSummary: document.getElementById('selectedSummary'),
  selectedPrice: document.getElementById('selectedPrice'),
  dataModePill: document.getElementById('dataModePill'),
  resetVestButton: document.getElementById('resetVestButton'),
  resetHelmetButton: document.getElementById('resetHelmetButton'),
  viewFrontButton: document.getElementById('viewFrontButton'),
  viewQuarterButton: document.getElementById('viewQuarterButton'),
  viewSideButton: document.getElementById('viewSideButton')
};

const canvas = document.getElementById('viewerCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a0f13, 14, 34);

const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
camera.position.set(0.2, 1.75, 5.65);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4.1;
controls.maxDistance = 8.1;
controls.maxPolarAngle = Math.PI / 1.92;
controls.target.set(0, 1.45, 0);

const cameraViews = {
  front: { position: new THREE.Vector3(0, 1.82, 5.25), target: new THREE.Vector3(0, 1.48, 0) },
  quarter: { position: new THREE.Vector3(0.55, 1.78, 5.7), target: new THREE.Vector3(0, 1.48, 0) },
  side: { position: new THREE.Vector3(4.45, 1.72, 2.35), target: new THREE.Vector3(0, 1.44, 0) }
};
let activeView = 'quarter';
const desiredCameraPosition = cameraViews.quarter.position.clone();
const desiredCameraTarget = cameraViews.quarter.target.clone();

const PUBLIC_MODEL_SOURCES = {
  body: [
    {
      name: 'CC0 Male Base Mesh',
      url: 'https://cdn.jsdelivr.net/gh/BoQsc/Godot-3D-Male-Base-Mesh@e7807327a8ebcc637831995a231dae701b6d4f56/Original/male_base_mesh.glb'
    },
    {
      name: 'CC0 Male Base Mesh',
      url: 'https://raw.githubusercontent.com/BoQsc/Godot-3D-Male-Base-Mesh/e7807327a8ebcc637831995a231dae701b6d4f56/Original/male_base_mesh.glb'
    }
  ]
};

const gltfLoader = new GLTFLoader();
const gltfCache = new Map();

const root = new THREE.Group();
scene.add(root);

const mannequinGroup = new THREE.Group();
const gearGroup = new THREE.Group();
const motionGroup = new THREE.Group();
motionGroup.add(mannequinGroup);
motionGroup.add(gearGroup);
root.add(motionGroup);

const mannequinRootGroup = new THREE.Group();
const proceduralFigureGroup = new THREE.Group();
const remoteFigureGroup = new THREE.Group();
mannequinGroup.add(mannequinRootGroup);
mannequinGroup.add(remoteFigureGroup);

const tempColor = new THREE.Color();
const rounded = (w, h, d, r = 0.035, s = 6) => new RoundedBoxGeometry(w, h, d, s, r);

const clampHex = (hex, shift = 0) => {
  tempColor.set(hex);
  const hsl = {};
  tempColor.getHSL(hsl);
  tempColor.setHSL(hsl.h, Math.max(0, hsl.s), THREE.MathUtils.clamp(hsl.l + shift, 0, 1));
  return `#${tempColor.getHexString()}`;
};

const createLineTexture = ({
  base = '#1a1f25',
  line = 'rgba(255,255,255,0.05)',
  accent = 'rgba(0,0,0,0.15)',
  size = 256,
  spacing = 18,
  lineWidth = 2,
  diagonal = false,
  vignette = true
} = {}) => {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = line;
  ctx.lineWidth = lineWidth;
  for (let i = -size; i < size * 2; i += spacing) {
    ctx.beginPath();
    if (diagonal) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i - size, size);
    } else {
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
    }
    ctx.stroke();
  }

  ctx.fillStyle = accent;
  for (let i = 0; i < 450; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.4 + 0.3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (vignette) {
    const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.12, size / 2, size / 2, size * 0.6);
    g.addColorStop(0, 'rgba(255,255,255,0.04)');
    g.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  return tex;
};

const shirtTexture = createLineTexture({
  base: '#13181d',
  line: 'rgba(255,255,255,0.035)',
  accent: 'rgba(0,0,0,0.11)',
  spacing: 16,
  lineWidth: 1.4,
  diagonal: true
});
shirtTexture.repeat.set(3.5, 3.5);

const pantsTexture = createLineTexture({
  base: '#171d24',
  line: 'rgba(255,255,255,0.028)',
  accent: 'rgba(0,0,0,0.15)',
  spacing: 20,
  lineWidth: 1.2,
  diagonal: false
});
pantsTexture.repeat.set(2.5, 3.8);

const gearTexture = createLineTexture({
  base: '#20262d',
  line: 'rgba(255,255,255,0.055)',
  accent: 'rgba(0,0,0,0.16)',
  spacing: 14,
  lineWidth: 1.3,
  diagonal: false,
  vignette: false
});
gearTexture.repeat.set(4, 4);

const rubberTexture = createLineTexture({
  base: '#0f1317',
  line: 'rgba(255,255,255,0.03)',
  accent: 'rgba(0,0,0,0.2)',
  spacing: 22,
  lineWidth: 1,
  diagonal: true
});
rubberTexture.repeat.set(3, 3);

const graphiteMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#2d333a'),
  roughness: 0.32,
  metalness: 0.28,
  clearcoat: 0.62,
  clearcoatRoughness: 0.34,
  sheen: 0.4,
  sheenColor: new THREE.Color('#b7c3cc')
});

const shirtMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#12171c'),
  roughness: 0.8,
  metalness: 0.02,
  sheen: 0.6,
  sheenColor: new THREE.Color('#6f7b85'),
  map: shirtTexture,
  bumpMap: shirtTexture,
  bumpScale: 0.014
});

const pantsMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#171c22'),
  roughness: 0.76,
  metalness: 0.03,
  sheen: 0.35,
  sheenColor: new THREE.Color('#69737d'),
  map: pantsTexture,
  bumpMap: pantsTexture,
  bumpScale: 0.012
});

const bootMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#0c1014'),
  roughness: 0.62,
  metalness: 0.08,
  clearcoat: 0.18,
  clearcoatRoughness: 0.52,
  map: rubberTexture,
  bumpMap: rubberTexture,
  bumpScale: 0.014
});

const strapMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#0e1317'),
  roughness: 0.78,
  metalness: 0.02,
  map: rubberTexture,
  bumpMap: rubberTexture,
  bumpScale: 0.012
});

const standMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#313b46'),
  roughness: 0.3,
  metalness: 0.42,
  clearcoat: 0.45,
  clearcoatRoughness: 0.38
});

const floorMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#0b1015'),
  roughness: 0.9,
  metalness: 0.04,
  reflectivity: 0.12
});

const glowMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#26313a'),
  roughness: 0.35,
  metalness: 0.24,
  emissive: new THREE.Color('#7ed3df'),
  emissiveIntensity: 0.12
});

const hemi = new THREE.HemisphereLight(0xe7f0ff, 0x172028, 1.25);
scene.add(hemi);

const keyLight = new THREE.SpotLight(0xffffff, 900, 24, 0.44, 0.7, 1.5);
keyLight.position.set(4.8, 7.2, 5.4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.bias = -0.00004;
keyLight.target.position.set(0, 1.5, 0);
scene.add(keyLight);
scene.add(keyLight.target);

const fillLight = new THREE.DirectionalLight(0x90d8ff, 0.72);
fillLight.position.set(-5.2, 3.6, 3.8);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xb5c9ff, 0.65);
rimLight.position.set(-2.6, 3.8, -5.4);
scene.add(rimLight);

const warmSide = new THREE.DirectionalLight(0xf2d5ac, 0.22);
warmSide.position.set(3.4, 1.8, 2.8);
scene.add(warmSide);

const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 96), floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.02;
floor.receiveShadow = true;
scene.add(floor);

const stageCore = new THREE.Mesh(new THREE.CylinderGeometry(1.54, 1.68, 0.08, 72), new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#121820'),
  roughness: 0.42,
  metalness: 0.2,
  clearcoat: 0.2,
  emissive: new THREE.Color('#182634'),
  emissiveIntensity: 0.06
}));
stageCore.position.y = 0.015;
stageCore.receiveShadow = true;
scene.add(stageCore);

const stageRing = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.03, 18, 100), glowMaterial);
stageRing.rotation.x = Math.PI / 2;
stageRing.position.y = 0.06;
scene.add(stageRing);

const backHalo = new THREE.Mesh(
  new THREE.TorusGeometry(1.36, 0.05, 20, 120),
  new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#2c3844'),
    roughness: 0.28,
    metalness: 0.34,
    emissive: new THREE.Color('#7ed3df'),
    emissiveIntensity: 0.2
  })
);
backHalo.position.set(0, 1.78, -1.02);
scene.add(backHalo);

const backPanel = new THREE.Mesh(
  rounded(3.8, 5.1, 0.05, 0.09, 8),
  new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#11171d'),
    roughness: 0.5,
    metalness: 0.16,
    emissive: new THREE.Color('#0f171d'),
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 0.86
  })
);
backPanel.position.set(0, 1.95, -1.52);
scene.add(backPanel);

const lightBarMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#202932'),
  roughness: 0.3,
  metalness: 0.25,
  emissive: new THREE.Color('#89d8e6'),
  emissiveIntensity: 0.22
});

const leftLightBar = new THREE.Mesh(rounded(0.08, 3.9, 0.05, 0.025, 4), lightBarMaterial);
leftLightBar.position.set(-1.78, 1.95, -1.38);
scene.add(leftLightBar);
const rightLightBar = leftLightBar.clone();
rightLightBar.position.x = 1.78;
scene.add(rightLightBar);

const contactShadow = new THREE.Mesh(
  new THREE.CircleGeometry(1.2, 48),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 })
);
contactShadow.rotation.x = -Math.PI / 2;
contactShadow.position.y = 0.021;
contactShadow.scale.set(1.1, 0.72, 1);
scene.add(contactShadow);

const makeMesh = (geometry, material, options = {}) => {
  const {
    x = 0,
    y = 0,
    z = 0,
    rx = 0,
    ry = 0,
    rz = 0,
    sx = 1,
    sy = 1,
    sz = 1
  } = options;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true;
  return mesh;
};

const makeLathe = (points, segments, material, opts = {}) => {
  const geometry = new THREE.LatheGeometry(points, segments);
  return makeMesh(geometry, material, opts);
};

const setUvRepeat = (mesh, x = 1, y = 1) => {
  if (mesh.material?.map) mesh.material.map.repeat.set(x, y);
  if (mesh.material?.bumpMap) mesh.material.bumpMap.repeat.set(x, y);
};

const mannequinParts = [];
let remoteBodyLoaded = false;
let remoteBodySourceName = '';
const basePose = {
  torsoBob: 0,
  torsoRoll: 0,
  leftArmSwing: 0,
  rightArmSwing: 0,
  leftForearm: 0,
  rightForearm: 0,
  leftLeg: 0,
  rightLeg: 0,
  headTurn: 0
};

const buildBaseMannequin = () => {
  mannequinRootGroup.position.y = 0.06;

  const plinth = makeMesh(new THREE.CylinderGeometry(0.76, 0.82, 0.11, 56), standMaterial, { y: 0.02 });
  plinth.receiveShadow = true;
  mannequinRootGroup.add(plinth);

  const stand = makeMesh(new THREE.CylinderGeometry(0.055, 0.065, 1.26, 28), standMaterial, { x: 0.06, y: 0.72, z: -0.12 });
  mannequinRootGroup.add(stand);

  const feetBar = makeMesh(rounded(0.52, 0.045, 0.14, 0.018, 4), standMaterial, { x: 0.02, y: 0.09, z: 0.01 });
  mannequinRootGroup.add(feetBar);

  const bodyRig = new THREE.Group();
  bodyRig.position.set(0, 0.11, 0);
  bodyRig.rotation.set(0, -0.04, 0.012);
  proceduralFigureGroup.add(bodyRig);
  mannequinRootGroup.add(proceduralFigureGroup);
  mannequinParts.push({ target: bodyRig, property: 'positionY', base: bodyRig.position.y, amount: 0.014, speed: 1.1 });
  mannequinParts.push({ target: bodyRig, property: 'rotationZ', base: bodyRig.rotation.z, amount: 0.02, speed: 0.5 });

  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.y = 0.84;
  bodyRig.add(pelvisGroup);

  const pelvis = makeMesh(rounded(0.58, 0.27, 0.34, 0.08, 7), pantsMaterial, { z: -0.01, sx: 1.04, sy: 1, sz: 0.98 });
  pelvisGroup.add(pelvis);
  const gluteBridge = makeMesh(rounded(0.48, 0.16, 0.24, 0.05, 5), pantsMaterial, { y: -0.04, z: -0.11 });
  pelvisGroup.add(gluteBridge);
  const belt = makeMesh(rounded(0.6, 0.085, 0.3, 0.03, 4), graphiteMaterial, { y: 0.11, z: 0.02 });
  pelvisGroup.add(belt);

  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.43, 0.02);
  bodyRig.add(torsoGroup);
  mannequinParts.push({ target: torsoGroup, property: 'rotationX', base: torsoGroup.rotation.x, amount: 0.02, speed: 1.0 });

  const torsoProfile = [
    new THREE.Vector2(0.03, 0.0),
    new THREE.Vector2(0.21, 0.16),
    new THREE.Vector2(0.29, 0.44),
    new THREE.Vector2(0.34, 0.9),
    new THREE.Vector2(0.36, 1.18),
    new THREE.Vector2(0.39, 1.52),
    new THREE.Vector2(0.35, 1.84),
    new THREE.Vector2(0.24, 2.05),
    new THREE.Vector2(0.11, 2.18),
    new THREE.Vector2(0.04, 2.22)
  ];
  const torso = makeLathe(torsoProfile, 64, shirtMaterial, { y: 0.02, sx: 1.17, sz: 0.86 });
  setUvRepeat(torso, 3.4, 4.8);
  torsoGroup.add(torso);

  const sternum = makeMesh(rounded(0.46, 0.84, 0.16, 0.05, 6), shirtMaterial, { y: 1.16, z: 0.13, sx: 1, sy: 0.98, sz: 0.9 });
  torsoGroup.add(sternum);
  const leftPec = makeMesh(rounded(0.28, 0.18, 0.13, 0.045, 4), shirtMaterial, { x: -0.18, y: 1.76, z: 0.16, rz: 0.12 });
  torsoGroup.add(leftPec);
  const rightPec = leftPec.clone();
  rightPec.position.x = 0.18;
  rightPec.rotation.z = -0.12;
  torsoGroup.add(rightPec);
  const leftLat = makeMesh(rounded(0.15, 0.52, 0.15, 0.04, 4), shirtMaterial, { x: -0.33, y: 1.4, z: 0.04, rz: 0.12 });
  torsoGroup.add(leftLat);
  const rightLat = leftLat.clone();
  rightLat.position.x = 0.33;
  rightLat.rotation.z = -0.12;
  torsoGroup.add(rightLat);
  const upperChest = makeMesh(rounded(0.88, 0.22, 0.35, 0.085, 6), graphiteMaterial, { y: 1.93, z: 0.03 });
  torsoGroup.add(upperChest);
  const neck = makeMesh(new THREE.CylinderGeometry(0.11, 0.135, 0.18, 28), graphiteMaterial, { y: 2.17, z: 0.03 });
  torsoGroup.add(neck);
  const collarRib = makeMesh(rounded(0.5, 0.05, 0.17, 0.02, 3), graphiteMaterial, { y: 2.03, z: 0.09 });
  torsoGroup.add(collarRib);
  const trap = makeMesh(rounded(0.34, 0.12, 0.16, 0.04, 4), graphiteMaterial, { y: 2.08, z: 0.04 });
  torsoGroup.add(trap);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.26, 0.03);
  torsoGroup.add(headGroup);
  mannequinParts.push({ target: headGroup, property: 'rotationY', base: headGroup.rotation.y, amount: 0.05, speed: 0.55 });

  const skull = makeMesh(new THREE.SphereGeometry(0.245, 44, 44), graphiteMaterial, { y: 0.08, sx: 0.93, sy: 1.14, sz: 0.9 });
  headGroup.add(skull);
  const facePlane = makeMesh(rounded(0.22, 0.24, 0.08, 0.04, 4), graphiteMaterial, { y: -0.01, z: 0.17, sx: 0.9, sy: 1.15, sz: 0.7 });
  headGroup.add(facePlane);
  const jaw = makeMesh(rounded(0.2, 0.14, 0.18, 0.04, 4), graphiteMaterial, { y: -0.09, z: 0.07, rx: 0.05 });
  headGroup.add(jaw);

  const buildLeg = (side = 1, lean = 0) => {
    const legRig = new THREE.Group();
    legRig.position.set(0.18 * side, 0.72, side === 1 ? -0.02 : 0.01);
    legRig.rotation.z = -0.02 * side;
    legRig.rotation.x = lean;
    bodyRig.add(legRig);
    mannequinParts.push({ target: legRig, property: 'rotationX', base: legRig.rotation.x, amount: 0.012, speed: 1.0 });

    const thigh = makeMesh(new THREE.CapsuleGeometry(0.122, 0.64, 9, 24), pantsMaterial, { y: -0.12, z: 0.01, rx: 0.08, sx: 0.98, sy: 1.08, sz: 0.96 });
    legRig.add(thigh);
    const knee = makeMesh(rounded(0.19, 0.14, 0.16, 0.05, 4), graphiteMaterial, { y: -0.49, z: 0.08 });
    legRig.add(knee);

    const shinRig = new THREE.Group();
    shinRig.position.set(0, -0.54, 0.02);
    shinRig.rotation.x = side === -1 ? -0.08 : 0.02;
    legRig.add(shinRig);
    mannequinParts.push({ target: shinRig, property: 'rotationX', base: shinRig.rotation.x, amount: 0.012, speed: 1.02 });

    const shin = makeMesh(new THREE.CapsuleGeometry(0.096, 0.56, 8, 20), pantsMaterial, { y: -0.22, z: 0.03, sx: 0.95, sy: 1.05, sz: 0.92 });
    shinRig.add(shin);
    const calf = makeMesh(rounded(0.12, 0.26, 0.15, 0.04, 4), pantsMaterial, { y: -0.18, z: -0.06 });
    shinRig.add(calf);
    const boot = makeMesh(rounded(0.2, 0.18, 0.46, 0.045, 5), bootMaterial, { y: -0.57, z: 0.12 });
    shinRig.add(boot);
    const toe = makeMesh(rounded(0.16, 0.095, 0.22, 0.03, 4), bootMaterial, { y: -0.62, z: 0.31, rx: -0.03 });
    shinRig.add(toe);
    const heel = makeMesh(rounded(0.1, 0.08, 0.08, 0.02, 3), bootMaterial, { y: -0.61, z: -0.08 });
    shinRig.add(heel);
  };

  buildLeg(-1, 0.01);
  buildLeg(1, -0.05);

  const makeArm = (side = 1) => {
    const armRig = new THREE.Group();
    armRig.position.set(0.49 * side, 1.88, 0.03);
    armRig.rotation.z = side === -1 ? 0.25 : -0.22;
    armRig.rotation.x = side === -1 ? 0.03 : -0.02;
    torsoGroup.add(armRig);
    mannequinParts.push({ target: armRig, property: 'rotationX', base: armRig.rotation.x, amount: 0.018, speed: 1.08 });

    const deltoid = makeMesh(new THREE.SphereGeometry(0.165, 22, 22), shirtMaterial, { x: 0.02 * side, y: -0.02, z: 0.01, sx: 1.18, sy: 1.0, sz: 0.92 });
    armRig.add(deltoid);

    const upperArm = makeMesh(new THREE.CapsuleGeometry(0.094, 0.48, 8, 18), shirtMaterial, { y: -0.27, z: 0.02, rx: 0.1, sx: 0.96, sy: 1.08, sz: 0.94 });
    armRig.add(upperArm);

    const tricep = makeMesh(rounded(0.12, 0.18, 0.12, 0.03, 4), shirtMaterial, { y: -0.31, z: -0.07 });
    armRig.add(tricep);
    const elbow = makeMesh(rounded(0.15, 0.11, 0.12, 0.04, 4), graphiteMaterial, { y: -0.53, z: 0.06 });
    armRig.add(elbow);

    const forearmRig = new THREE.Group();
    forearmRig.position.set(0, -0.56, 0.04);
    forearmRig.rotation.x = side === -1 ? -0.22 : -0.16;
    armRig.add(forearmRig);
    mannequinParts.push({ target: forearmRig, property: 'rotationX', base: forearmRig.rotation.x, amount: 0.014, speed: 1.04 });

    const forearm = makeMesh(new THREE.CapsuleGeometry(0.078, 0.39, 8, 18), shirtMaterial, { y: -0.2, z: 0.03, sx: 0.92, sy: 1.05, sz: 0.9 });
    forearmRig.add(forearm);
    const cuff = makeMesh(rounded(0.15, 0.07, 0.13, 0.03, 3), graphiteMaterial, { y: -0.42, z: 0.04 });
    forearmRig.add(cuff);
    const hand = makeMesh(rounded(0.12, 0.17, 0.12, 0.035, 3), graphiteMaterial, { y: -0.56, z: 0.05, rx: 0.16 });
    forearmRig.add(hand);
  };

  makeArm(-1);
  makeArm(1);
};

buildBaseMannequin();

const cloneGltfScene = async (url) => {
  const cached = gltfCache.get(url);
  if (cached) return cached.clone(true);

  const sceneAsset = await new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => resolve(gltf.scene || gltf.scenes?.[0]),
      undefined,
      reject
    );
  });

  gltfCache.set(url, sceneAsset);
  return sceneAsset.clone(true);
};

const disposeMaterial = (material) => {
  if (!material) return;
  material.dispose?.();
};

const clearRemoteFigure = () => {
  while (remoteFigureGroup.children.length) {
    const child = remoteFigureGroup.children[0];
    remoteFigureGroup.remove(child);
    child.traverse((node) => {
      if (node.geometry) node.geometry.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach(disposeMaterial);
      else disposeMaterial(node.material);
    });
  }
};

const fitObjectToHeight = (object, targetHeight = 2.22) => {
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  let box = new THREE.Box3().setFromObject(object);
  box.getSize(size);
  if (!size.y || !Number.isFinite(size.y)) return false;

  const scale = targetHeight / size.y;
  object.scale.setScalar(scale);

  box = new THREE.Box3().setFromObject(object);
  box.getCenter(center);
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= box.min.y;
  return true;
};

const retintLoadedBody = (object) => {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  const minY = box.min.y;
  const maxY = box.max.y;
  const total = Math.max(0.001, maxY - minY);

  object.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
    node.material = new THREE.MeshPhysicalMaterial({
      color: 0x161a1e,
      roughness: 0.86,
      metalness: 0.03,
      clearcoat: 0.08,
      clearcoatRoughness: 0.85
    });

    if (!node.geometry?.boundingBox) node.geometry?.computeBoundingBox?.();
    const bb = node.geometry?.boundingBox;
    const centerYLocal = bb ? (bb.min.y + bb.max.y) * 0.5 : 0;
    const centerWorldY = node.localToWorld(new THREE.Vector3(0, centerYLocal, 0)).y;
    const ratio = (centerWorldY - minY) / total;

    if (ratio < 0.44) {
      node.material.color.set(0x11161d);
      node.material.roughness = 0.92;
    } else if (ratio < 0.86) {
      node.material.color.set(0x0d1116);
      node.material.roughness = 0.95;
    } else {
      node.material.color.set(0x2b3137);
      node.material.roughness = 0.9;
    }
  });
};

const loadPublicMannequin = async () => {
  for (const source of PUBLIC_MODEL_SOURCES.body) {
    try {
      const sceneAsset = await cloneGltfScene(source.url);
      clearRemoteFigure();
      const modelRoot = new THREE.Group();
      modelRoot.position.set(0, 0.11, 0);
      modelRoot.rotation.set(0, -0.03, 0.01);
      modelRoot.add(sceneAsset);
      const ok = fitObjectToHeight(sceneAsset, 2.24);
      if (!ok) throw new Error('Body model had invalid bounds');
      retintLoadedBody(sceneAsset);
      remoteFigureGroup.add(modelRoot);
      proceduralFigureGroup.visible = false;
      remoteBodyLoaded = true;
      remoteBodySourceName = source.name;
      state.mannequinMode = 'public_glb';
      state.mannequinSourceName = source.name;
      renderAll();
      return;
    } catch (error) {
      console.warn(`Failed to load public mannequin from ${source.url}`, error);
    }
  }

  remoteBodyLoaded = false;
  state.mannequinMode = 'procedural';
  state.mannequinSourceName = 'Built-in procedural mannequin';
  proceduralFigureGroup.visible = true;
  renderAll();
};

const createGearMaterial = (hex) => new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(hex),
  roughness: 0.5,
  metalness: 0.06,
  clearcoat: 0.26,
  clearcoatRoughness: 0.4,
  sheen: 0.42,
  sheenColor: new THREE.Color(clampHex(hex, 0.22)),
  map: gearTexture,
  bumpMap: gearTexture,
  bumpScale: 0.016,
  emissive: new THREE.Color(clampHex(hex, -0.42)),
  emissiveIntensity: 0.03
});

const disposeNode = (node) => {
  if (node.geometry) node.geometry.dispose?.();
  if (node.material) {
    if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose?.());
    else node.material.dispose?.();
  }
};

const clearGearGroup = () => {
  while (gearGroup.children.length) {
    const child = gearGroup.children[0];
    gearGroup.remove(child);
    child.traverse(disposeNode);
  }
};

const addPouch = (parent, material, x, y, z, w, h, d, radius = 0.025) => {
  const pouch = makeMesh(rounded(w, h, d, radius, 4), material, { x, y, z });
  parent.add(pouch);
  const flap = makeMesh(rounded(w * 0.92, h * 0.22, d * 1.02, radius * 0.6, 4), strapMaterial, { x, y: y + h * 0.26, z: z + d * 0.13 });
  parent.add(flap);
};

const addMolleRow = (parent, y, z, width, count, scale = 1) => {
  const gap = width / (count - 1);
  for (let i = 0; i < count; i += 1) {
    const x = -width / 2 + i * gap;
    const loop = makeMesh(rounded(0.068 * scale, 0.018 * scale, 0.018, 0.008, 2), strapMaterial, { x, y, z });
    parent.add(loop);
  }
};

const buildVestMesh = (styleKey, colorHex) => {
  const group = new THREE.Group();
  const material = createGearMaterial(colorHex);

  if (styleKey === 'plate_carrier') {
    const front = makeMesh(rounded(0.72, 0.84, 0.18, 0.065, 8), material, { y: 1.57, z: 0.15, sx: 1, sy: 1.02, sz: 0.92 });
    group.add(front);

    const back = makeMesh(rounded(0.68, 0.8, 0.14, 0.055, 8), material, { y: 1.58, z: -0.14, sx: 0.98, sy: 1.01, sz: 0.92 });
    group.add(back);

    const upperYoke = makeMesh(rounded(0.44, 0.15, 0.14, 0.045, 4), material, { y: 1.93, z: 0.1 });
    group.add(upperYoke);
    const upperCollar = makeMesh(rounded(0.34, 0.08, 0.11, 0.03, 4), strapMaterial, { y: 1.88, z: 0.24 });
    group.add(upperCollar);

    const leftShoulder = makeMesh(rounded(0.18, 0.1, 0.3, 0.04, 4), material, { x: -0.22, y: 1.92, z: 0.01, rx: 0.08, rz: 0.06 });
    group.add(leftShoulder);
    const rightShoulder = leftShoulder.clone();
    rightShoulder.position.x = 0.22;
    rightShoulder.rotation.z = -0.06;
    group.add(rightShoulder);

    const leftCummer = makeMesh(rounded(0.13, 0.34, 0.23, 0.03, 4), material, { x: -0.38, y: 1.47, z: 0.03, ry: 0.22 });
    group.add(leftCummer);
    const rightCummer = leftCummer.clone();
    rightCummer.position.x = 0.38;
    rightCummer.rotation.y = -0.22;
    group.add(rightCummer);

    const leftSidePlate = makeMesh(rounded(0.09, 0.18, 0.18, 0.02, 3), strapMaterial, { x: -0.42, y: 1.5, z: 0.02, ry: 0.25 });
    group.add(leftSidePlate);
    const rightSidePlate = leftSidePlate.clone();
    rightSidePlate.position.x = 0.42;
    rightSidePlate.rotation.y = -0.25;
    group.add(rightSidePlate);

    addMolleRow(group, 1.75, 0.25, 0.54, 6, 0.95);
    addMolleRow(group, 1.62, 0.25, 0.54, 6, 0.95);
    addMolleRow(group, 1.49, 0.25, 0.54, 6, 0.95);

    addPouch(group, material, -0.22, 1.36, 0.29, 0.16, 0.24, 0.1);
    addPouch(group, material, 0, 1.36, 0.29, 0.16, 0.24, 0.1);
    addPouch(group, material, 0.22, 1.36, 0.29, 0.16, 0.24, 0.1);
    const dangler = makeMesh(rounded(0.24, 0.18, 0.08, 0.025, 4), material, { y: 1.15, z: 0.22 });
    group.add(dangler);
    const radio = makeMesh(rounded(0.1, 0.24, 0.08, 0.02, 4), strapMaterial, { x: -0.34, y: 1.63, z: 0.24 });
    group.add(radio);
    const radioAntenna = makeMesh(rounded(0.012, 0.22, 0.012, 0.006, 2), strapMaterial, { x: -0.34, y: 1.86, z: 0.26 });
    group.add(radioAntenna);

    const admin = makeMesh(rounded(0.28, 0.15, 0.055, 0.022, 4), strapMaterial, { y: 1.74, z: 0.265 });
    group.add(admin);
    const dragHandle = makeMesh(rounded(0.22, 0.04, 0.06, 0.02, 3), strapMaterial, { y: 1.98, z: -0.13 });
    group.add(dragHandle);
  } else {
    const panel = makeMesh(rounded(0.76, 0.38, 0.14, 0.045, 5), material, { y: 1.56, z: 0.16, sx: 1.02, sy: 1, sz: 0.92 });
    group.add(panel);

    const leftHarness = makeMesh(rounded(0.095, 0.72, 0.055, 0.02, 4), material, { x: -0.28, y: 1.67, z: 0.02, rz: 0.2, rx: 0.06 });
    group.add(leftHarness);
    const rightHarness = leftHarness.clone();
    rightHarness.position.x = 0.28;
    rightHarness.rotation.z = -0.2;
    group.add(rightHarness);

    const leftWrap = makeMesh(rounded(0.11, 0.24, 0.19, 0.02, 4), material, { x: -0.31, y: 1.5, z: 0.02, ry: 0.2 });
    group.add(leftWrap);
    const rightWrap = leftWrap.clone();
    rightWrap.position.x = 0.31;
    rightWrap.rotation.y = -0.2;
    group.add(rightWrap);

    const upperBuckle = makeMesh(rounded(0.18, 0.045, 0.06, 0.018, 3), strapMaterial, { y: 1.74, z: 0.24 });
    group.add(upperBuckle);
    const lowerBuckle = makeMesh(rounded(0.22, 0.05, 0.06, 0.018, 3), strapMaterial, { y: 1.36, z: 0.24 });
    group.add(lowerBuckle);

    addMolleRow(group, 1.62, 0.23, 0.52, 6, 0.92);
    addMolleRow(group, 1.53, 0.23, 0.52, 6, 0.92);

    addPouch(group, material, -0.24, 1.44, 0.25, 0.16, 0.19, 0.08);
    addPouch(group, material, 0, 1.44, 0.25, 0.16, 0.19, 0.08);
    addPouch(group, material, 0.24, 1.44, 0.25, 0.16, 0.19, 0.08);
    const mapPocket = makeMesh(rounded(0.22, 0.12, 0.05, 0.02, 4), strapMaterial, { y: 1.6, z: 0.24 });
    group.add(mapPocket);
    const waistStrap = makeMesh(rounded(0.62, 0.045, 0.04, 0.015, 3), strapMaterial, { y: 1.28, z: 0.13 });
    group.add(waistStrap);

    const backStrap = makeMesh(rounded(0.34, 0.06, 0.05, 0.02, 4), strapMaterial, { y: 1.76, z: -0.13 });
    group.add(backStrap);
  }

  return group;
};

const buildHelmetMesh = (styleKey, colorHex) => {
  const group = new THREE.Group();
  const material = createGearMaterial(colorHex);

  const shell = makeMesh(
    new THREE.SphereGeometry(0.256, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.76),
    material,
    { y: 2.35, z: 0.01, sx: 1.13, sy: 1.03, sz: 1.08 }
  );
  group.add(shell);

  const crown = makeMesh(rounded(0.18, 0.08, 0.18, 0.025, 3), material, { y: 2.52, z: 0.01, rx: -0.1 });
  group.add(crown);

  const brim = makeMesh(rounded(0.3, 0.032, 0.16, 0.014, 2), material, { y: 2.2, z: 0.18, rx: 0.15 });
  group.add(brim);

  if (styleKey === 'high_cut') {
    const leftRail = makeMesh(rounded(0.07, 0.18, 0.17, 0.02, 3), strapMaterial, { x: -0.248, y: 2.28, z: 0.0 });
    group.add(leftRail);
    const rightRail = leftRail.clone();
    rightRail.position.x = 0.248;
    group.add(rightRail);

    const leftArc = makeMesh(rounded(0.085, 0.12, 0.12, 0.02, 3), material, { x: -0.16, y: 2.12, z: 0.03, rz: -0.2 });
    group.add(leftArc);
    const rightArc = leftArc.clone();
    rightArc.position.x = 0.16;
    rightArc.rotation.z = 0.2;
    group.add(rightArc);

    const shroud = makeMesh(rounded(0.15, 0.11, 0.065, 0.02, 3), strapMaterial, { y: 2.27, z: 0.22, rx: 0.1 });
    group.add(shroud);
    const pad = makeMesh(rounded(0.1, 0.03, 0.03, 0.01, 2), strapMaterial, { y: 2.17, z: 0.2 });
    group.add(pad);
    const leftBungee = makeMesh(rounded(0.08, 0.018, 0.016, 0.007, 2), strapMaterial, { x: -0.08, y: 2.26, z: 0.22, rz: 0.25 });
    group.add(leftBungee);
    const rightBungee = leftBungee.clone();
    rightBungee.position.x = 0.08;
    rightBungee.rotation.z = -0.25;
    group.add(rightBungee);
  } else {
    const leftEar = makeMesh(rounded(0.1, 0.21, 0.18, 0.03, 4), material, { x: -0.21, y: 2.14, z: 0.0 });
    group.add(leftEar);
    const rightEar = leftEar.clone();
    rightEar.position.x = 0.21;
    group.add(rightEar);

    const rearSkirt = makeMesh(rounded(0.3, 0.13, 0.13, 0.03, 4), material, { y: 2.08, z: -0.12, rx: -0.08 });
    group.add(rearSkirt);

    const frontBand = makeMesh(rounded(0.18, 0.05, 0.05, 0.015, 3), strapMaterial, { y: 2.24, z: 0.2 });
    group.add(frontBand);
    const cover = makeMesh(rounded(0.14, 0.06, 0.04, 0.015, 3), strapMaterial, { y: 2.16, z: 0.18 });
    group.add(cover);
  }

  const leftStrap = makeMesh(rounded(0.022, 0.31, 0.022, 0.008, 2), strapMaterial, { x: -0.14, y: 2.03, z: 0.09, rz: 0.26 });
  group.add(leftStrap);
  const rightStrap = leftStrap.clone();
  rightStrap.position.x = 0.14;
  rightStrap.rotation.z = -0.26;
  group.add(rightStrap);

  const chinCup = makeMesh(rounded(0.13, 0.04, 0.06, 0.015, 3), strapMaterial, { y: 1.9, z: 0.16 });
  group.add(chinCup);

  return group;
};

const renderSceneGear = () => {
  clearGearGroup();
  const bodyYOffset = remoteBodyLoaded ? 0.03 : 0;

  if (state.selectedVest) {
    const vest = buildVestMesh(state.selectedVest.style_key, state.selectedVestColor.color_code);
    vest.position.y += bodyYOffset;
    gearGroup.add(vest);
  }

  if (state.selectedHelmet) {
    const helmet = buildHelmetMesh(state.selectedHelmet.style_key, state.selectedHelmetColor.color_code);
    helmet.position.y += bodyYOffset + (remoteBodyLoaded ? -0.015 : 0);
    helmet.scale.multiplyScalar(remoteBodyLoaded ? 0.96 : 1);
    gearGroup.add(helmet);
  }
};

const centsToDollars = (value) => {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value / 100);
};

const totalPrice = () => {
  const vest = state.selectedVest?.price_cents || 0;
  const helmet = state.selectedHelmet?.price_cents || 0;
  return vest + helmet;
};

const getColorsForProduct = (product) => {
  const variants = product?.variants || [];
  if (!variants.length) return colorFallbacks;

  const byName = new Map();
  for (const variant of variants) {
    const key = (variant.color_name || '').trim().toLowerCase();
    if (!key || byName.has(key)) continue;
    byName.set(key, variant);
  }
  return [...byName.values()];
};

const ensureSelectedColorStillValid = (slot) => {
  const product = slot === 'vest' ? state.selectedVest : state.selectedHelmet;
  const colors = getColorsForProduct(product);
  const current = slot === 'vest' ? state.selectedVestColor : state.selectedHelmetColor;
  const stillValid = colors.some((color) => color.color_name.toLowerCase() === current.color_name.toLowerCase());
  if (stillValid) return;
  if (slot === 'vest') state.selectedVestColor = colors[0] || colorFallbacks[0];
  else state.selectedHelmetColor = colors[0] || colorFallbacks[0];
};

const formatStyleLabel = (styleKey) =>
  styleKey
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const updateSummary = () => {
  ui.vestName.textContent = state.selectedVest?.name || 'None';
  ui.helmetName.textContent = state.selectedHelmet?.name || 'None';
  ui.vestColorName.textContent = state.selectedVest ? state.selectedVestColor?.color_name || 'Black' : '—';
  ui.helmetColorName.textContent = state.selectedHelmet ? state.selectedHelmetColor?.color_name || 'Black' : '—';

  const summaryParts = [];
  if (state.selectedVest) summaryParts.push(`${state.selectedVest.name} (${state.selectedVestColor.color_name})`);
  if (state.selectedHelmet) summaryParts.push(`${state.selectedHelmet.name} (${state.selectedHelmetColor.color_name})`);
  if (!summaryParts.length) summaryParts.push('No gear selected');

  ui.selectedSummary.textContent = summaryParts.join(' • ');
  ui.selectedPrice.textContent = totalPrice() > 0 ? `Combined product total: ${centsToDollars(totalPrice())}` : 'Choose gear to preview the setup.';
  const sourceLabel = state.sourceMode === 'db' ? 'Live Neon products' : 'Fallback preview products';
  const mannequinLabel = state.mannequinMode === 'public_glb' ? `CC0 public mannequin` : 'Built-in mannequin';
  ui.dataModePill.textContent = `${sourceLabel} • ${mannequinLabel}`;
};

const renderSlotColorPicker = (target, product, selectedColor, slot) => {
  target.innerHTML = '';

  if (!product) {
    target.innerHTML = '<div class="empty-state">Pick an item first</div>';
    return;
  }

  getColorsForProduct(product).forEach((color) => {
    const button = document.createElement('button');
    button.className = `color-button ${selectedColor.color_name === color.color_name ? 'active' : ''}`;
    button.innerHTML = `
      <span class="swatch" style="background:${color.color_code}"></span>
      <span>${color.color_name}</span>
    `;
    button.addEventListener('click', () => {
      if (slot === 'vest') state.selectedVestColor = color;
      else state.selectedHelmetColor = color;
      renderAll();
    });
    target.appendChild(button);
  });
};

const createProductCard = (product, activeProduct) => {
  const button = document.createElement('button');
  button.className = `product-card ${activeProduct?.id === product.id ? 'active' : ''}`;
  button.innerHTML = `
    <div class="product-card-top">
      <h3>${product.name}</h3>
      <span class="slot-tag">${product.category}</span>
    </div>
    <div class="product-meta">
      <span>${formatStyleLabel(product.style_key)}</span>
      <strong>${centsToDollars(product.price_cents)}</strong>
    </div>
    <div class="variant-note">
      <span>${getColorsForProduct(product).map((variant) => variant.color_name).join(' • ')}</span>
      <span class="swatch-row">${getColorsForProduct(product).slice(0,4).map((variant) => `<span class="mini-swatch" style="background:${variant.color_code}"></span>`).join('')}</span>
    </div>
  `;
  return button;
};

const renderProductLists = () => {
  ui.vestList.innerHTML = '';
  ui.helmetList.innerHTML = '';

  state.vests.forEach((vest) => {
    const card = createProductCard(vest, state.selectedVest);
    card.addEventListener('click', () => {
      state.selectedVest = vest;
      ensureSelectedColorStillValid('vest');
      renderAll();
    });
    ui.vestList.appendChild(card);
  });

  state.helmets.forEach((helmet) => {
    const card = createProductCard(helmet, state.selectedHelmet);
    card.addEventListener('click', () => {
      state.selectedHelmet = helmet;
      ensureSelectedColorStillValid('helmet');
      renderAll();
    });
    ui.helmetList.appendChild(card);
  });
};

const renderAll = () => {
  ensureSelectedColorStillValid('vest');
  ensureSelectedColorStillValid('helmet');
  renderProductLists();
  renderSlotColorPicker(ui.vestColorPicker, state.selectedVest, state.selectedVestColor, 'vest');
  renderSlotColorPicker(ui.helmetColorPicker, state.selectedHelmet, state.selectedHelmetColor, 'helmet');
  updateSummary();
  renderSceneGear();
};

const setProducts = (products, mode) => {
  state.products = products.filter((product) => product.active !== false);
  state.vests = state.products.filter((product) => product.category === 'vest');
  state.helmets = state.products.filter((product) => product.category === 'helmet');
  state.sourceMode = mode;

  if (!state.selectedVest && state.vests.length) state.selectedVest = state.vests[0];
  if (!state.selectedHelmet && state.helmets.length) state.selectedHelmet = state.helmets[0];

  state.selectedVestColor = getColorsForProduct(state.selectedVest)[0] || colorFallbacks[0];
  state.selectedHelmetColor = getColorsForProduct(state.selectedHelmet)[0] || colorFallbacks[0];

  renderAll();
};

const loadProducts = async () => {
  try {
    const response = await fetch('/api/products', { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const json = await response.json();
    if (!Array.isArray(json) || json.length === 0) throw new Error('No live products returned');
    setProducts(json, 'db');
  } catch (error) {
    console.warn('Using fallback products:', error);
    setProducts(fallbackProducts, 'fallback');
  }
};

ui.resetVestButton.addEventListener('click', () => {
  state.selectedVest = null;
  state.selectedVestColor = colorFallbacks[0];
  renderAll();
});

ui.resetHelmetButton.addEventListener('click', () => {
  state.selectedHelmet = null;
  state.selectedHelmetColor = colorFallbacks[0];
  renderAll();
});

const setCameraView = (view) => {
  activeView = view;
  desiredCameraPosition.copy(cameraViews[view].position);
  desiredCameraTarget.copy(cameraViews[view].target);
  [
    [ui.viewFrontButton, 'front'],
    [ui.viewQuarterButton, 'quarter'],
    [ui.viewSideButton, 'side']
  ].forEach(([button, key]) => button.classList.toggle('active', key === view));
};

ui.viewFrontButton.addEventListener('click', () => setCameraView('front'));
ui.viewQuarterButton.addEventListener('click', () => setCameraView('quarter'));
ui.viewSideButton.addEventListener('click', () => setCameraView('side'));

const resizeRenderer = () => {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(480, Math.floor(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

window.addEventListener('resize', resizeRenderer);
resizeRenderer();

let lastTime = 0;
const animate = (time) => {
  const delta = Math.min(0.033, (time - lastTime) / 1000 || 0.016);
  lastTime = time;
  const t = time * 0.001;

  backHalo.rotation.z += delta * 0.12;
  stageRing.rotation.z -= delta * 0.08;
  motionGroup.rotation.y = Math.sin(t * 0.45) * 0.02;

  for (const part of mannequinParts) {
    const value = part.base + Math.sin(t * part.speed) * part.amount;
    if (part.property === 'positionY') part.target.position.y = value;
    if (part.property === 'rotationX') part.target.rotation.x = value;
    if (part.property === 'rotationY') part.target.rotation.y = value;
    if (part.property === 'rotationZ') part.target.rotation.z = value;
  }

  camera.position.lerp(desiredCameraPosition, 0.06);
  controls.target.lerp(desiredCameraTarget, 0.08);
  controls.minAzimuthAngle = activeView === 'front' ? -0.7 : -Infinity;
  controls.maxAzimuthAngle = activeView === 'front' ? 0.7 : Infinity;

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

Promise.allSettled([loadProducts(), loadPublicMannequin()]);
requestAnimationFrame(animate);
