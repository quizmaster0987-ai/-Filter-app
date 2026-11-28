import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Face-attached 3D accessories. MediaPipe landmarks drive position, scale and head pose.
export function createFaceAR(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, 1, 0.1, 100);
  camera.position.z = 20;
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x30202f, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(-2, 3, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0xffb9d7, 1.4, 8);
  rim.position.set(0, 1, 2);
  scene.add(rim);

  const root = new THREE.Group();
  scene.add(root);
  const mat = (color, metalness, roughness, extra={}) =>
    new THREE.MeshPhysicalMaterial({ color, metalness, roughness, ...extra });
  const frameBlack = mat(0x171923, 0.72, 0.2, { clearcoat: 0.9, clearcoatRoughness: 0.12 });
  const frameGold = mat(0xc99a42, 0.88, 0.19, { clearcoat: 1 });
  const lensSmoke = mat(0x263c58, 0.25, 0.12, { transparent: true, opacity: 0.74, transmission: 0.12, thickness: 0.08 });
  const lensRose = mat(0x8c466b, 0.18, 0.14, { transparent: true, opacity: 0.68, transmission: 0.16 });
  const shine = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.56 });
  const gems = [0x7ee6ff,0xff78b9,0xffe9a1].map(c => mat(c,0.45,0.12,{emissive:c,emissiveIntensity:0.18}));

  function tube(points, radius, material, segments=28) {
    const curve = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 8, false), material);
  }
  function roundedLensShape(w,h,r) {
    const s = new THREE.Shape();
    s.moveTo(-w/2+r,-h/2); s.lineTo(w/2-r,-h/2); s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
    s.lineTo(w/2,h/2-r); s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
    s.lineTo(-w/2+r,h/2); s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
    s.lineTo(-w/2,-h/2+r); s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
    return s;
  }
  function makeSunglasses(style='classic') {
    const g = new THREE.Group();
    const w = style==='catEye' ? 0.245 : 0.225;
    const h = style==='catEye' ? 0.155 : 0.17;
    const lensMat = style==='rose' ? lensRose : lensSmoke;
    for (const side of [-1,1]) {
      const x = side*0.145;
      const lensShape = roundedLensShape(w,h,style==='catEye'?0.045:0.055);
      if (style==='catEye') {
        lensShape.moveTo(x-w/2+0.025,-h/2);
        lensShape.lineTo(x+w/2+0.035,h/2+0.045);
      }
      const lensMesh = new THREE.Mesh(new THREE.ShapeGeometry(lensShape,32),lensMat);
      lensMesh.position.set(x,0,0.012); g.add(lensMesh);
      const border = new THREE.Mesh(new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(x-w/2+0.04,-h/2,0.025),
          new THREE.Vector3(x+w/2-0.035,-h/2,0.025),
          new THREE.Vector3(x+w/2,h/2-0.045,0.025),
          new THREE.Vector3(x+w/2-0.04,h/2,0.025),
          new THREE.Vector3(x-w/2+0.04,h/2,0.025),
          new THREE.Vector3(x-w/2,h/2-0.045,0.025),
          new THREE.Vector3(x-w/2+0.04,-h/2,0.025)
        ],true),0.012,32,8,false),style==='gold'?frameGold:frameBlack);
      g.add(border);
      // Lens reflection gives the glass a curved, polished look.
      const glint = new THREE.Mesh(new THREE.PlaneGeometry(w*0.42,0.012),shine);
      glint.position.set(x-w*0.08,h*0.29,0.035); glint.rotation.z=-0.18; g.add(glint);
      g.add(tube([[x+side*w*0.48,0,0],[x+side*0.17,0.018,-0.015],[x+side*0.22,-0.025,-0.07],[x+side*0.30,-0.12,-0.16]],0.009,style==='gold'?frameGold:frameBlack));
      const hinge = new THREE.Mesh(new THREE.SphereGeometry(0.018,12,10),style==='gold'?frameGold:frameBlack);
      hinge.position.set(x+side*w*0.5,0,0.025); g.add(hinge);
    }
    g.add(tube([[-0.035,0.015,0.02],[0,-0.005,0.055],[0.035,0.015,0.02]],0.012,style==='gold'?frameGold:frameBlack,16));
    if(style==='gold') {
      const detail = new THREE.Mesh(new THREE.SphereGeometry(0.018,12,10),gems[1]);
      detail.position.set(0,0.105,0.035); g.add(detail);
    }
    return g;
  }
  function makeCrown() {
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(-0.47,-0.12); shape.lineTo(-0.47,0.08); shape.lineTo(-0.28,-0.005);
    shape.lineTo(-0.17,0.29); shape.lineTo(-0.035,0.06); shape.lineTo(0,0.34);
    shape.lineTo(0.13,0.06); shape.lineTo(0.27,0.29); shape.lineTo(0.36,0.03);
    shape.lineTo(0.47,0.08); shape.lineTo(0.47,-0.12); shape.closePath();
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:0.075,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:0.022,bevelThickness:0.025}),frameGold);
    g.add(body);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.49,0.47,0.09,48,1,true,0,Math.PI),frameGold);
    band.rotation.x=Math.PI/2; band.position.set(0,-0.13,-0.025); g.add(band);
    [-0.28,-0.14,0,0.14,0.28].forEach((x,i)=>{
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(i===2?0.052:0.038,1),gems[i%3]);
      gem.position.set(x,i===2?0.12:0.035,0.105); g.add(gem);
    });
    return g;
  }
  const models = {
    glasses: makeSunglasses('classic'),
    goldGlasses: makeSunglasses('gold'),
    roseGlasses: makeSunglasses('rose'),
    catEye: makeSunglasses('catEye'),
    crown: makeCrown()
  };
  Object.values(models).forEach(m=>{m.visible=false;root.add(m);});
  let current='';
  let smooth = null;

  function resize(width,height) {
    renderer.setSize(width,height,false);
    camera.left=0; camera.right=width; camera.top=0; camera.bottom=height;
    camera.updateProjectionMatrix();
  }
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function update(points,width,height,type) {
    if(canvas.width!==width||canvas.height!==height) resize(width,height);
    Object.entries(models).forEach(([name,m])=>m.visible=name===type);
    const model=models[type];
    if(!model||!points){clear();return}
    const at=i=>({x:points[i].x*width,y:points[i].y*height,z:points[i].z||0});
    const left=at(234),right=at(454),nose=at(1),forehead=at(10);
    const eyeAL=at(33),eyeBL=at(133),eyeAR=at(362),eyeBR=at(263);
    const eyeL={x:(eyeAL.x+eyeBL.x)/2,y:(eyeAL.y+eyeBL.y)/2};
    const eyeR={x:(eyeAR.x+eyeBR.x)/2,y:(eyeAR.y+eyeBR.y)/2};
    const center={x:(eyeL.x+eyeR.x)/2,y:(eyeL.y+eyeR.y)/2};
    const faceW=Math.hypot(right.x-left.x,right.y-left.y);
    const roll=Math.atan2(eyeR.y-eyeL.y,eyeR.x-eyeL.x);
    const yaw=clamp((nose.x-center.x)/Math.max(1,faceW)*2.8,-0.62,0.62);
    const pitch=clamp((nose.y-center.y)/Math.max(1,faceW)*2.0-0.13,-0.42,0.42);
    const target={x:center.x,y:type==='crown'?forehead.y-faceW*0.31:center.y,z:0,scale:faceW,roll,yaw,pitch};
    if(!smooth)smooth={...target};
    const k=0.42;
    Object.keys(target).forEach(key=>smooth[key]+=(target[key]-smooth[key])*k);
    root.position.set(smooth.x,smooth.y,0);
    root.rotation.set(smooth.pitch,smooth.yaw,smooth.roll);
    model.scale.setScalar(smooth.scale);
    renderer.clear(); renderer.render(scene,camera);
    current=type;
  }
  function clear() {
    Object.values(models).forEach(m=>m.visible=false);
    current='';
    renderer.clear(); renderer.render(scene,camera);
  }
  return {update,clear,resize};
}
