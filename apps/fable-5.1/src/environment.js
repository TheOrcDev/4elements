import * as THREE from 'three';

/**
 * Builds the shared stage: HDR environment map for reflections/refraction,
 * a dark polished floor, sky lighting and a starfield.
 */
export function createEnvironment(renderer, scene) {
  // --- HDR environment (dark studio with coloured light panels) -> PMREM
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x02030a);

  const panel = (color, intensity, w, h, pos) => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.copy(pos);
    m.lookAt(0, 0, 0);
    envScene.add(m);
  };
  panel(0xdfe9ff, 12, 6, 3, new THREE.Vector3(0, 9, 0));      // top key
  panel(0x7fb8ff, 6, 4, 8, new THREE.Vector3(-9, 3, 4));      // cool left
  panel(0xffb27a, 4, 4, 8, new THREE.Vector3(9, 2, 4));       // warm right
  panel(0x4f7cff, 3, 12, 3, new THREE.Vector3(0, 2, -10));    // blue rim behind
  panel(0x1a2240, 1.5, 30, 30, new THREE.Vector3(0, -6, 0));  // faint floor bounce
  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();

  // --- lighting
  scene.add(new THREE.HemisphereLight(0x3d4f78, 0x06070a, 0.35));
  const moon = new THREE.DirectionalLight(0x9db8ff, 0.7);
  moon.position.set(-6, 14, -8);
  scene.add(moon);

  // --- floor: dark polished stone
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x07080c,
    roughness: 0.62,
    metalness: 0.1,
    envMap,
    envMapIntensity: 0.12,
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(80, 96), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // --- starfield
  const starCount = 1800;
  const starPos = new Float32Array(starCount * 3);
  const starSize = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    const r = 90 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.9 + 0.05); // keep above the horizon
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    starSize[i] = 0.6 + Math.random() * 1.8;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSize, 1));
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
    vertexShader: /* glsl */ `
      attribute float aSize;
      uniform float uTime; uniform float uPixelRatio;
      varying float vTwinkle;
      void main() {
        vTwinkle = 0.55 + 0.45 * sin(uTime * (0.8 + aSize) + position.x * 3.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixelRatio * 1.6;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying float vTwinkle;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.1, d) * vTwinkle;
        gl_FragColor = vec4(vec3(0.75, 0.82, 1.0) * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    premultipliedAlpha: true,
    fog: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.frustumCulled = false;
  scene.add(stars);

  return {
    envMap,
    update(t) {
      starMat.uniforms.uTime.value = t;
    },
  };
}

/**
 * Stone pedestal shared by every element, with a glowing ring in the element colour.
 */
export function createPedestal(colorHex) {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x171a21, roughness: 0.82, metalness: 0.08 });
  const stoneDark = new THREE.MeshStandardMaterial({ color: 0x111319, roughness: 0.9, metalness: 0.05 });

  const step = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.7, 0.16, 64), stoneDark);
  step.position.y = 0.08;
  g.add(step);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 2.05, 0.46, 64), stone);
  base.position.y = 0.16 + 0.23;
  g.add(base);

  const ringColor = new THREE.Color(colorHex).multiplyScalar(2.4);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.78, 0.03, 10, 128),
    new THREE.MeshBasicMaterial({ color: ringColor })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.55;
  g.add(ring);

  // soft glow ring on the floor
  const glowGeo = new THREE.RingGeometry(2.7, 4.2, 96);
  glowGeo.rotateX(-Math.PI / 2);
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(colorHex) } },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; varying vec3 vPos;
      void main() {
        float r = length(vPos.xz);
        float a = smoothstep(2.7, 2.85, r) * (1.0 - smoothstep(2.9, 4.2, r));
        a *= 0.35;
        gl_FragColor = vec4(uColor * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    premultipliedAlpha: true,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = 0.01;
  g.add(glow);

  return g;
}
