import * as THREE from 'three';

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (values) => values[Math.floor(Math.random() * values.length)];

function points(count, color, size, placement) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const p = placement(i);
    positions.set(p, i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity: .78, depthWrite: false, blending: THREE.AdditiveBlending });
  return new THREE.Points(geometry, material);
}

function fire() {
  const group = new THREE.Group();
  const animated = [];
  const flameVertex = /* glsl */`
    uniform float uTime;
    uniform float uSeed;
    varying float vHeight;
    varying float vNoise;
    void main() {
      float h = (position.y + 1.3) / 2.6;
      vec3 p = position;
      float wave = sin(h * 15.0 + uTime * 4.0 + uSeed) * .09
                 + sin(h * 27.0 - uTime * 6.0 + p.x * 8.0) * .045;
      float twist = sin(h * 8.0 + uTime * 2.8 + uSeed) * .18 * h;
      p.x += wave + twist;
      p.z += cos(h * 11.0 - uTime * 3.2 + uSeed) * .1 * h;
      p.xz *= 1.0 + sin(h * 18.0 + uTime * 4.0 + uSeed) * .07;
      vHeight = h;
      vNoise = sin(h * 20.0 + p.x * 8.0 + uTime * 4.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `;
  const flameFragment = /* glsl */`
    uniform float uInner;
    varying float vHeight;
    varying float vNoise;
    void main() {
      float h = clamp(vHeight, 0.0, 1.0);
      vec3 base = vec3(1.0, .16, .025);
      vec3 mid = vec3(1.0, .47, .05);
      vec3 tip = vec3(1.0, .79, .31);
      vec3 color = mix(base, mid, smoothstep(.06, .55, h));
      color = mix(color, tip, smoothstep(.47, .88, h) * uInner);
      float flicker = .77 + .23 * vNoise;
      float alpha = (1.0 - smoothstep(.68, 1.0, h)) * smoothstep(0.0, .1, h);
      alpha *= flicker * mix(.25, .53, uInner);
      gl_FragColor = vec4(color * (1.15 + uInner * .35), alpha);
    }
  `;
  for (let i = 0; i < 6; i++) {
    const geometry = new THREE.CylinderGeometry(.015 + i * .018, .44 + i * .105, 2.6 - i * .12, 28, 22, true);
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSeed: { value: i * 1.73 }, uInner: { value: 1 - i / 6 } },
      vertexShader: flameVertex, fragmentShader: flameFragment,
      transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = i * 1.1;
    mesh.position.y = -.05 - i * .04;
    group.add(mesh);
    animated.push(material);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(.39, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffb737, transparent: true, opacity: .48, blending: THREE.AdditiveBlending, depthWrite: false }));
  core.scale.set(1.1, 1.8, 1.1);
  core.position.y = -1.02;
  group.add(core);
  const coalMaterial = new THREE.MeshStandardMaterial({ color: 0x45251e, roughness: .85, flatShading: true, emissive: 0x8c2b07, emissiveIntensity: .5 });
  for (let i = 0; i < 14; i++) {
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(.13, .29), 0), coalMaterial);
    const a = i * 2.399;
    const r = rand(.2, .68);
    rock.position.set(Math.cos(a) * r, -1.34 + rand(-.08, .16), Math.sin(a) * r);
    rock.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
    group.add(rock);
  }
  const embers = points(90, 0xffa346, .037, () => [rand(-1.15, 1.15), rand(-1.2, 1.6), rand(-.8, .8)]);
  group.add(embers);
  return { group, update(time, delta) {
    animated.forEach((m) => { m.uniforms.uTime.value = time; });
    const array = embers.geometry.attributes.position.array;
    for (let i = 0; i < array.length; i += 3) {
      array[i + 1] += delta * (.3 + (i % 7) * .06);
      array[i] += Math.sin(time * 2 + i) * delta * .07;
      if (array[i + 1] > 1.6) array[i + 1] = -1.3;
    }
    embers.geometry.attributes.position.needsUpdate = true;
    core.scale.x = 1.05 + Math.sin(time * 5) * .06;
  }};
}

function air() {
  const group = new THREE.Group();
  const vortex = new THREE.Group();
  group.add(vortex);
  const colors = [0xe0fdff, 0x9ad9e6, 0xffffff, 0x90bccf];
  for (let i = 0; i < 11; i++) {
    const path = [];
    const start = i * .56;
    const turns = rand(1.05, 1.45);
    for (let s = 0; s <= 45; s++) {
      const t = s / 45;
      const angle = start + turns * Math.PI * 2 * t;
      const radius = .58 + .23 * Math.sin(Math.PI * t) + .14 * Math.sin(t * 9 + i);
      path.push(new THREE.Vector3(Math.cos(angle) * radius, -1.18 + 2.35 * t, Math.sin(angle) * radius));
    }
    const curve = new THREE.CatmullRomCurve3(path);
    const geometry = new THREE.TubeGeometry(curve, 110, i % 4 === 0 ? .052 : .023, 7, false);
    const material = new THREE.MeshBasicMaterial({ color: colors[i % colors.length], transparent: true, opacity: i % 4 === 0 ? .46 : .6, depthWrite: false, blending: THREE.AdditiveBlending });
    vortex.add(new THREE.Mesh(geometry, material));
  }
  const hazeMaterial = new THREE.MeshBasicMaterial({ color: 0x9bdce9, transparent: true, opacity: .055, depthWrite: false, blending: THREE.AdditiveBlending });
  for (let i = 0; i < 8; i++) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(rand(.25, .42), 20, 12), hazeMaterial);
    const y = -1 + i * .28;
    cloud.position.set(Math.sin(i * 1.8) * .27, y, Math.cos(i * 1.5) * .2);
    cloud.scale.set(1.6, .66, 1.3);
    vortex.add(cloud);
  }
  const motes = points(140, 0xe0faff, .023, () => {
    const theta = rand(0, Math.PI * 2), r = rand(.48, 1.32);
    return [Math.cos(theta) * r, rand(-1.3, 1.35), Math.sin(theta) * r];
  });
  vortex.add(motes);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.86, .007, 5, 80), new THREE.MeshBasicMaterial({ color: 0xb8edf3, transparent: true, opacity: .33 }));
  ring.rotation.x = Math.PI * .42;
  group.add(ring);
  return { group, update(time) {
    vortex.rotation.y = time * .33;
    vortex.rotation.z = Math.sin(time * .55) * .045;
    ring.rotation.z = time * .22;
  }};
}

function water() {
  const group = new THREE.Group();
  const waterVertex = /* glsl */`
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    void main() {
      vec3 p = position;
      float wave = sin(p.y * 9.0 + uTime * 1.8 + p.x * 4.0) * .038
                 + sin(p.z * 13.0 - uTime * 2.4) * .025;
      p += normal * wave;
      vNormal = normalize(mat3(modelMatrix) * normal);
      vPosition = p;
      vec4 world = modelMatrix * vec4(p, 1.0);
      vWorldPosition = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `;
  const waterFragment = /* glsl */`
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    void main() {
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.25);
      float ripple = sin(vPosition.y * 16.0 + vPosition.x * 10.0 - uTime * 2.1);
      ripple += sin(vPosition.z * 19.0 - vPosition.y * 9.0 + uTime * 1.6);
      float bands = smoothstep(1.0, 1.75, ripple);
      vec3 deep = vec3(.005, .14, .25);
      vec3 teal = vec3(.025, .46, .57);
      vec3 surface = vec3(.24, .86, .91);
      vec3 color = mix(deep, teal, .56 + .33 * vPosition.y);
      color = mix(color, surface, fresnel * .92 + bands * .22);
      color += vec3(.02, .14, .17) * sin(vPosition.y * 5.0 + uTime);
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  const liquid = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 } }, vertexShader: waterVertex, fragmentShader: waterFragment });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.04, 72, 50), liquid);
  orb.scale.set(1.03, 1.06, .88);
  group.add(orb);
  const surface = new THREE.Mesh(new THREE.SphereGeometry(1.075, 48, 32), new THREE.MeshBasicMaterial({ color: 0x4bc4df, transparent: true, opacity: .055, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  group.add(surface);
  const ribbonGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const path = [];
    for (let j = 0; j <= 70; j++) {
      const t = j / 70;
      const theta = t * Math.PI * 2 * (1.12 + i * .08) + i * 1.5;
      const radius = 1.17 + .15 * Math.sin(t * Math.PI * 2 + i);
      path.push(new THREE.Vector3(Math.cos(theta) * radius, -.63 + 1.3 * t + .16 * Math.sin(theta * 2), Math.sin(theta) * radius));
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path), 120, .018 + i * .006, 7, false), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x7ceeff : 0x2db3d5, transparent: true, opacity: .58, depthWrite: false, blending: THREE.AdditiveBlending }));
    ribbonGroup.add(tube);
  }
  group.add(ribbonGroup);
  const drops = [];
  const dropMat = new THREE.MeshPhysicalMaterial({ color: 0x78e9f4, metalness: .2, roughness: .1, clearcoat: 1, transparent: true, opacity: .82 });
  for (let i = 0; i < 19; i++) {
    const radius = rand(.022, .078);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), dropMat);
    const a = rand(0, Math.PI * 2), r = rand(1.2, 1.65);
    drop.position.set(Math.cos(a) * r, rand(-1.1, 1.2), Math.sin(a) * r);
    drop.userData.speed = rand(.12, .35);
    group.add(drop); drops.push(drop);
  }
  return { group, update(time, delta) {
    liquid.uniforms.uTime.value = time;
    orb.rotation.y = time * .12;
    ribbonGroup.rotation.y = -time * .22;
    drops.forEach((drop) => { drop.position.y += delta * drop.userData.speed; if (drop.position.y > 1.25) drop.position.y = -1.2; });
  }};
}

function earth() {
  const group = new THREE.Group();
  const rockGroup = new THREE.Group();
  group.add(rockGroup);
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(.91, 2), new THREE.MeshStandardMaterial({ color: 0x4f5d3c, roughness: 1, flatShading: true, emissive: 0x163d24, emissiveIntensity: .25 }));
  rockGroup.add(inner);
  const rockColors = [0x83775e, 0x706852, 0x9a8564, 0x59684d, 0xaaa077, 0x50594a];
  for (let i = 0; i < 60; i++) {
    const phi = Math.acos(1 - 2 * (i + .5) / 60);
    const theta = i * 2.39996;
    const normal = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
    const radius = rand(.92, 1.12);
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(.22, .38), 0), new THREE.MeshStandardMaterial({ color: pick(rockColors), roughness: 1, metalness: .03, flatShading: true }));
    mesh.position.copy(normal).multiplyScalar(radius);
    mesh.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
    mesh.scale.set(rand(.8, 1.5), rand(.62, 1.2), rand(.8, 1.5));
    rockGroup.add(mesh);
  }
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0xa3ce88, roughness: .28, metalness: .25, emissive: 0x3c7f50, emissiveIntensity: .32, flatShading: true });
  for (let i = 0; i < 24; i++) {
    const a = i * 2.39996, y = 1 - 2 * (i + .5) / 24, r = Math.sqrt(1 - y * y);
    const normal = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(rand(.05, .1), rand(.2, .48), 5), crystalMat);
    crystal.position.copy(normal).multiplyScalar(rand(1.07, 1.24));
    crystal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    rockGroup.add(crystal);
  }
  const debris = new THREE.Group();
  const smallRockMat = new THREE.MeshStandardMaterial({ color: 0x9a8d6e, roughness: 1, flatShading: true });
  for (let i = 0; i < 19; i++) {
    const a = i * 2.39996, r = rand(1.43, 1.87);
    const piece = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(.035, .105), 0), smallRockMat);
    piece.position.set(Math.cos(a) * r, rand(-1.02, 1.02), Math.sin(a) * r);
    debris.add(piece);
  }
  group.add(debris);
  const dust = points(85, 0xc8d998, .018, () => [rand(-1.8, 1.8), rand(-1.7, 1.7), rand(-1.3, 1.3)]);
  group.add(dust);
  return { group, update(time) { rockGroup.rotation.y = time * .12; rockGroup.rotation.z = Math.sin(time * .33) * .045; debris.rotation.y = -time * .08; }};
}

export const elementFactories = { fire, air, water, earth };
