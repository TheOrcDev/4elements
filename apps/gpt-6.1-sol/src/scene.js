import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createFire } from './elements/fire.js';
import { createWater } from './elements/water.js';
import { createEarth } from './elements/earth.js';
import { createAir } from './elements/air.js';

export function createExperience(container, { onFps } = {}) {
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setClearColor(0x0c0f10, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label','Three-dimensional elemental sculpture');
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label','Interactive elemental sculpture. Arrow keys orbit, plus and minus zoom, Home resets the view.');
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37,1,.1,60);
  const cameraPosition = new THREE.Vector3(3.4,1.8,6.5);
  camera.position.copy(cameraPosition);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .055;
  controls.enablePan = false;
  controls.minDistance = 4.2;
  controls.maxDistance = 10;
  controls.minPolarAngle = .5;
  controls.maxPolarAngle = Math.PI * .61;
  controls.target.set(0,-.05,0);
  controls.autoRotate = true;
  controls.autoRotateSpeed = .45;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room,.035);
  scene.environment = environment.texture;
  scene.environmentIntensity = .7;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.AmbientLight(0xc4dce6,.35));
  const key = new THREE.DirectionalLight(0xffebdd,2.8); key.position.set(-3,5,4);scene.add(key);
  const rim = new THREE.DirectionalLight(0xbedbff,2);rim.position.set(4,2,-4);scene.add(rim);
  const fill = new THREE.PointLight(0xff8054,14,8,2);fill.position.set(-2,.4,2);scene.add(fill);
  const top = new THREE.PointLight(0xe8f6ff,14,9,2);top.position.set(0,4,-.5);scene.add(top);

  const pedestal = new THREE.Group();
  const darkMaterial = new THREE.MeshStandardMaterial({color:0x0e1415,roughness:.7,metalness:.25,envMapIntensity:.3});
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(1.42,1.46,.09,128),darkMaterial);upper.position.y=-1.73;pedestal.add(upper);
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(1.46,1.51,.14,128),new THREE.MeshStandardMaterial({color:0x0c1315,roughness:.6,metalness:.4,envMapIntensity:.35}));lower.position.y=-1.83;pedestal.add(lower);
  const accentMaterial = new THREE.MeshBasicMaterial({color:0xff8054,transparent:true,opacity:.65,toneMapped:false});
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.44,.007,6,160),accentMaterial);ring.rotation.x=Math.PI/2;ring.position.y=-1.68;pedestal.add(ring);
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.1,.003,6,128),new THREE.MeshBasicMaterial({color:0x759195,transparent:true,opacity:.22}));innerRing.rotation.x=Math.PI/2;innerRing.position.y=-1.675;pedestal.add(innerRing);
  scene.add(pedestal);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18,18),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uColor:{value:new THREE.Color(0xff8054)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform vec3 uColor;void main(){float r=length((vUv-.5)*18.);float rings=pow(.5+.5*cos(r*7.5),75.)*.055;float glow=exp(-r*r*.6)*.09;float edge=1.-smoothstep(1.,6.,r);gl_FragColor=vec4(mix(vec3(.12,.19,.20),uColor,.2), (rings+glow)*edge);}' }));
  floor.rotation.x=-Math.PI/2;floor.position.y=-1.94;scene.add(floor);

  const objects = {fire:createFire(),water:createWater(),earth:createEarth(),air:createAir()};
  for (const [name,object] of Object.entries(objects)) {object.group.visible=name==='fire';scene.add(object.group);}
  const dustGeometry = new THREE.BufferGeometry();
  const dust = new Float32Array(160*3);
  for (let i=0;i<160;i++){dust[i*3]=(Math.random()-.5)*11;dust[i*3+1]=(Math.random()-.5)*7;dust[i*3+2]=(Math.random()-.5)*6-1.5;}
  dustGeometry.setAttribute('position',new THREE.BufferAttribute(dust,3));
  const dustPoints = new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0xa8c2c9,size:.009,transparent:true,opacity:.26,depthWrite:false}));scene.add(dustPoints);
  const renderTarget = new THREE.WebGLRenderTarget(1,1,{type:THREE.UnsignedByteType,format:THREE.RGBAFormat});
  const composer = new EffectComposer(renderer,renderTarget);
  composer.addPass(new RenderPass(scene,camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1,1),.3,.5,.85);
  // Byte targets work across GPUs that cannot render floating-point attachments.
  for (const target of [bloom.renderTargetBright,...bloom.renderTargetsHorizontal,...bloom.renderTargetsVertical]) target.texture.type=THREE.UnsignedByteType;
  // Preserve the transparent stage; the stock bloom copy makes its entire background opaque.
  bloom.blendMaterial.fragmentShader=bloom.blendMaterial.fragmentShader.replace('gl_FragColor = opacity * texel;', 'gl_FragColor = vec4(opacity * texel.rgb, clamp(max(max(texel.r, texel.g), texel.b) * opacity, 0.0, 1.0));');
  bloom.blendMaterial.blending=THREE.CustomBlending;
  bloom.blendMaterial.blendSrc=THREE.OneFactor;
  bloom.blendMaterial.blendDst=THREE.OneFactor;
  bloom.blendMaterial.blendSrcAlpha=THREE.OneFactor;
  bloom.blendMaterial.blendDstAlpha=THREE.OneFactor;
  composer.addPass(bloom);
  const outputPass = new OutputPass();
  composer.addPass(outputPass);
  let active='fire', paused=false, time=0, previous=performance.now(), frame, autoRotate=true;
  let intensity=1,speed=1,frames=0,fpsTime=0,hidden=document.hidden,disposed=false;
  let wasPausedBeforeLoss=false;
  function resetCamera(){camera.position.copy(cameraPosition);controls.target.set(0,-.05,0);controls.update();}
  const keyboardOrbit=event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='Home'){resetCamera();return;}
    const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if(event.key==='ArrowLeft')spherical.theta-=.12;
    if(event.key==='ArrowRight')spherical.theta+=.12;
    if(event.key==='ArrowUp')spherical.phi=Math.max(controls.minPolarAngle,spherical.phi-.1);
    if(event.key==='ArrowDown')spherical.phi=Math.min(controls.maxPolarAngle,spherical.phi+.1);
    if(event.key==='+'||event.key==='=')spherical.radius=Math.max(controls.minDistance,spherical.radius*.92);
    if(event.key==='-')spherical.radius=Math.min(controls.maxDistance,spherical.radius*1.08);
    camera.position.setFromSpherical(spherical).add(controls.target);controls.update();
  };
  renderer.domElement.addEventListener('keydown',keyboardOrbit);
  function resize(){
    const width=container.clientWidth,height=container.clientHeight;
    if(!width || !height)return;
    renderer.setSize(width,height);
    composer.setSize(width,height);
    camera.aspect=width/height;
    camera.fov=window.innerWidth<600?42:37;
    camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function selectElement(id,color){
    if(!objects[id])return;
    objects[active].group.visible=false;
    active=id;objects[id].group.visible=true;
    accentMaterial.color.set(color);
    floor.material.uniforms.uColor.value.set(color);
    fill.color.set(color);
    fill.intensity=id==='earth'?4:14;
    key.intensity=id==='earth'?2:2.8;
    scene.environmentIntensity=id==='earth'?.45:.7;
    bloom.strength=id==='fire'?.35:id==='air'?.3:.27;
    renderer.toneMappingExposure=id==='fire'?1.0:1.15;
  }
  const visibilityChange=()=>{hidden=document.hidden;previous=performance.now();};
  document.addEventListener('visibilitychange',visibilityChange);
  const contextLost=event=>{event.preventDefault();wasPausedBeforeLoss=paused;paused=true;container.dispatchEvent(new CustomEvent('elemental-context-lost'));};
  const contextRestored=()=>{paused=wasPausedBeforeLoss;container.dispatchEvent(new CustomEvent('elemental-context-restored'));};
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  renderer.domElement.addEventListener('webglcontextrestored',contextRestored);
  function render(now){
    if(disposed)return;
    frame=requestAnimationFrame(render);
    const elapsed=(now-previous)/1000;
    const delta=Math.min(elapsed,.05);previous=now;
    if(hidden)return;
    if(!paused){time+=delta*speed;objects[active].update(time,delta*speed,{intensity});dustPoints.rotation.y=time*.008;}
    controls.autoRotate=autoRotate&&!paused;
    controls.update(delta);
    composer.render();
    frames++;fpsTime+=elapsed;
    if(fpsTime>1.4){onFps?.(Math.round(frames/fpsTime));frames=0;fpsTime=0;}
  }
  objects.fire.update(0,0,{intensity});
  frame=requestAnimationFrame(render);
  return {
    selectElement,
    setParameter(key,value){if(key==='intensity')intensity=value;if(key==='speed')speed=value;},
    setAutoRotate(value){autoRotate=value;},
    togglePause(){paused=!paused;return paused;},
    resetCamera,
    async capture(name){
      composer.render();
      const blob=await new Promise(resolve=>renderer.domElement.toBlob(resolve,'image/png'));
      if(!blob)throw new Error('Unable to capture the scene');
      const url=URL.createObjectURL(blob);
      const anchor=document.createElement('a');anchor.download=`elemental-${name}.png`;anchor.href=url;
      document.body.appendChild(anchor);anchor.click();anchor.remove();
      setTimeout(()=>URL.revokeObjectURL(url),10000);
    },
    dispose(){
      disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();
      document.removeEventListener('visibilitychange',visibilityChange);
      renderer.domElement.removeEventListener('webglcontextlost',contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored',contextRestored);
      renderer.domElement.removeEventListener('keydown',keyboardOrbit);
      const geometries=new Set(),materials=new Set();
      scene.traverse(node=>{if(node.geometry)geometries.add(node.geometry);if(node.material){for(const material of Array.isArray(node.material)?node.material:[node.material])materials.add(material);}});
      geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());
    environment.dispose();bloom.dispose();outputPass.dispose();composer.dispose();renderer.dispose();renderer.domElement.remove();
    }
  };
}
