import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function createFaceAR(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, 1, 0.1, 1000);
  camera.position.z = 100;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5a4565, 2));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-1, 2, 5);
  scene.add(key);
  const root = new THREE.Group();
  scene.add(root);
  let active = '';

  const gold = new THREE.MeshStandardMaterial({ color: 0xe8b94f, metalness: 0.82, roughness: 0.22 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x171923, metalness: 0.55, roughness: 0.2 });
  const lens = new THREE.MeshPhysicalMaterial({ color: 0x54677f, metalness: 0.2, roughness: 0.12, transparent: true, opacity: 0.58, transmission: 0.12 });
  const jewelMats = [0x76d9ff, 0xff79b8, 0xffe8a1].map(color => new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.16, emissive: color, emissiveIntensity: 0.12 }));

  function makeGlasses() {
    const g = new THREE.Group();
    for (const x of [-0.14, 0.14]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.014, 12, 48), dark);
      ring.position.x = x;
      g.add(ring);
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.095, 48), lens);
      glass.position.set(x, 0, -0.012);
      g.add(glass);
      const shine = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.008, 0.008), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
      shine.position.set(x - 0.018, 0.045, 0.018);
      g.add(shine);
    }
    const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 10, 24, Math.PI), dark);
    bridge.rotation.z = Math.PI;
    bridge.position.y = 0.012;
    g.add(bridge);
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.19, 10), dark);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(side * 0.285, 0.012, -0.015);
      g.add(arm);
    }
    return g;
  }

  function makeCrown() {
    const shape = new THREE.Shape();
    shape.moveTo(-0.49, -0.12);
    shape.lineTo(-0.49, 0.08);
    shape.lineTo(-0.25, -0.015);
    shape.lineTo(-0.13, 0.31);
    shape.lineTo(0, 0.04);
    shape.lineTo(0.14, 0.31);
    shape.lineTo(0.27, -0.015);
    shape.lineTo(0.49, 0.08);
    shape.lineTo(0.49, -0.12);
    shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.075, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.018, bevelThickness: 0.018 }), gold);
    mesh.position.z = 0;
    const group = new THREE.Group();
    group.add(mesh);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.095, 0.10), gold);
    band.position.set(0, -0.13, 0.035);
    group.add(band);
    [-0.25, 0, 0.25].forEach((x, i) => {
      const gem = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 16), jewelMats[i]);
      gem.position.set(x, -0.015, 0.09);
      group.add(gem);
    });
    return group;
  }

  const models = { glasses: makeGlasses(), crown: makeCrown() };
  Object.values(models).forEach(model => { model.visible = false; root.add(model); });

  function resize(width, height) {
    renderer.setSize(width, height, false);
    camera.left = 0; camera.right = width; camera.top = 0; camera.bottom = height;
    camera.updateProjectionMatrix();
  }

  function update(points, width, height, type) {
    if (canvas.width !== width || canvas.height !== height) resize(width, height);
    Object.entries(models).forEach(([name, model]) => { model.visible = name === type; });
    active = type;
    const model = models[type];
    if (!model || !points) { renderer.clear(); renderer.render(scene, camera); return; }
    const point = i => ({ x: points[i].x * width, y: points[i].y * height });
    const left = point(234), right = point(454), top = point(10);
    const eyeA = point(33), eyeB = point(133), eyeC = point(362), eyeD = point(263);
    const eyeL = { x: (eyeA.x + eyeB.x) / 2, y: (eyeA.y + eyeB.y) / 2 };
    const eyeR = { x: (eyeC.x + eyeD.x) / 2, y: (eyeC.y + eyeD.y) / 2 };
    const faceW = Math.hypot(right.x - left.x, right.y - left.y);
    const angle = Math.atan2(right.y - left.y, right.x - left.x);
    const center = type === 'glasses'
      ? { x: (eyeL.x + eyeR.x) / 2, y: (eyeL.y + eyeR.y) / 2 }
      : { x: top.x, y: top.y - faceW * 0.30 };
    root.position.set(center.x, center.y, 0);
    root.rotation.set(0, 0, angle);
    model.scale.setScalar(faceW);
    renderer.clear();
    renderer.render(scene, camera);
  }

  function clear() {
    Object.values(models).forEach(model => { model.visible = false; });
    renderer.clear();
    renderer.render(scene, camera);
  }
  return { update, clear, resize };
}
