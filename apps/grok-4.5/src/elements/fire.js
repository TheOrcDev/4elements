import * as THREE from "three";

/**
 * Roaring fire: layered GPU particles, glowing core, floating embers.
 */
export function createFire(position = new THREE.Vector3(0, 0, 0)) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.name = "fire";

  // --- Glowing core ---
  const coreGeo = new THREE.SphereGeometry(0.35, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffaa33,
    transparent: true,
    opacity: 0.9,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 0.4;
  group.add(core);

  // Inner white-hot core
  const hotGeo = new THREE.SphereGeometry(0.18, 24, 24);
  const hotMat = new THREE.MeshBasicMaterial({
    color: 0xfff5d0,
    transparent: true,
    opacity: 0.95,
  });
  const hot = new THREE.Mesh(hotGeo, hotMat);
  hot.position.y = 0.35;
  group.add(hot);

  // Soft light
  const fireLight = new THREE.PointLight(0xff6622, 8, 18, 1.5);
  fireLight.position.set(0, 1.2, 0);
  group.add(fireLight);

  const fireLight2 = new THREE.PointLight(0xffaa44, 3, 10, 2);
  fireLight2.position.set(0, 0.5, 0);
  group.add(fireLight2);

  // --- Main flame particles ---
  const flameCount = 2800;
  const flameGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(flameCount * 3);
  const velocities = new Float32Array(flameCount * 3);
  const lifetimes = new Float32Array(flameCount);
  const ages = new Float32Array(flameCount);
  const sizes = new Float32Array(flameCount);
  const seeds = new Float32Array(flameCount);

  for (let i = 0; i < flameCount; i++) {
    resetFlame(i, positions, velocities, lifetimes, ages, sizes, seeds, true);
  }

  flameGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  flameGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  flameGeo.setAttribute("aAge", new THREE.BufferAttribute(ages, 1));
  flameGeo.setAttribute("aLife", new THREE.BufferAttribute(lifetimes, 1));
  flameGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  const flameMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aAge;
      attribute float aLife;
      attribute float aSeed;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vLife;
      varying float vSeed;

      void main() {
        vLife = 1.0 - (aAge / aLife);
        vSeed = aSeed;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float sizeBoost = mix(1.4, 0.3, aAge / aLife);
        gl_PointSize = aSize * sizeBoost * uPixelRatio * (180.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vLife;
      varying float vSeed;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;

        float soft = 1.0 - smoothstep(0.0, 0.5, d);
        soft = pow(soft, 1.4);

        // Color ramp: white-hot -> yellow -> orange -> deep red -> black
        vec3 cHot  = vec3(1.0, 0.98, 0.85);
        vec3 cYel  = vec3(1.0, 0.85, 0.25);
        vec3 cOrg  = vec3(1.0, 0.35, 0.05);
        vec3 cRed  = vec3(0.7, 0.08, 0.02);
        vec3 cDark = vec3(0.15, 0.02, 0.0);

        float t = 1.0 - vLife;
        vec3 col;
        if (t < 0.15) {
          col = mix(cHot, cYel, t / 0.15);
        } else if (t < 0.4) {
          col = mix(cYel, cOrg, (t - 0.15) / 0.25);
        } else if (t < 0.75) {
          col = mix(cOrg, cRed, (t - 0.4) / 0.35);
        } else {
          col = mix(cRed, cDark, (t - 0.75) / 0.25);
        }

        // Slight hue variance per particle
        col += vec3(vSeed * 0.08, -vSeed * 0.04, 0.0);

        float alpha = soft * vLife * 0.9;
        gl_FragColor = vec4(col * 1.4, alpha);
      }
    `,
  });

  const flames = new THREE.Points(flameGeo, flameMat);
  group.add(flames);

  // --- Ember particles (slower, float higher) ---
  const emberCount = 400;
  const emberGeo = new THREE.BufferGeometry();
  const ePos = new Float32Array(emberCount * 3);
  const eVel = new Float32Array(emberCount * 3);
  const eLife = new Float32Array(emberCount);
  const eAge = new Float32Array(emberCount);
  const eSize = new Float32Array(emberCount);

  for (let i = 0; i < emberCount; i++) {
    resetEmber(i, ePos, eVel, eLife, eAge, eSize, true);
  }

  emberGeo.setAttribute("position", new THREE.BufferAttribute(ePos, 3));
  emberGeo.setAttribute("aSize", new THREE.BufferAttribute(eSize, 1));
  emberGeo.setAttribute("aAge", new THREE.BufferAttribute(eAge, 1));
  emberGeo.setAttribute("aLife", new THREE.BufferAttribute(eLife, 1));

  const emberMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aAge;
      attribute float aLife;
      uniform float uPixelRatio;
      varying float vLife;

      void main() {
        vLife = 1.0 - (aAge / aLife);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixelRatio * (140.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vLife;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float soft = pow(1.0 - smoothstep(0.0, 0.5, d), 2.0);
        vec3 col = mix(vec3(1.0, 0.6, 0.15), vec3(1.0, 0.2, 0.0), 1.0 - vLife);
        gl_FragColor = vec4(col * 2.0, soft * vLife * 0.85);
      }
    `,
  });

  const embers = new THREE.Points(emberGeo, emberMat);
  group.add(embers);

  // Base glow disc
  const discGeo = new THREE.CircleGeometry(1.1, 48);
  const discMat = new THREE.MeshBasicMaterial({
    color: 0xff4400,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.02;
  group.add(disc);

  // Ground ring
  const ringGeo = new THREE.RingGeometry(0.9, 1.35, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff6622,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  group.add(ring);

  let time = 0;

  function update(dt) {
    time += dt;
    flameMat.uniforms.uTime.value = time;

    // Pulse core
    const pulse = 1 + Math.sin(time * 8) * 0.08 + Math.sin(time * 13.7) * 0.04;
    core.scale.setScalar(pulse);
    hot.scale.setScalar(1 + Math.sin(time * 11) * 0.12);
    fireLight.intensity = 7 + Math.sin(time * 9) * 2 + Math.random() * 1.5;
    fireLight2.intensity = 2.5 + Math.sin(time * 14) * 0.8;
    disc.material.opacity = 0.18 + Math.sin(time * 6) * 0.08;
    disc.scale.setScalar(0.95 + Math.sin(time * 5) * 0.08);

    // Update flames
    const pos = flameGeo.attributes.position.array;
    const ageArr = flameGeo.attributes.aAge.array;

    for (let i = 0; i < flameCount; i++) {
      const i3 = i * 3;
      ages[i] += dt;
      if (ages[i] >= lifetimes[i]) {
        resetFlame(i, positions, velocities, lifetimes, ages, sizes, seeds, false);
        continue;
      }
      const life = ages[i] / lifetimes[i];
      // Turbulence
      const turb = Math.sin(time * 3 + seeds[i] * 20) * 0.4;
      pos[i3] += velocities[i3] * dt + Math.sin(time * 4 + seeds[i] * 10 + pos[i3 + 1]) * 0.015;
      pos[i3 + 1] += velocities[i3 + 1] * dt;
      pos[i3 + 2] += velocities[i3 + 2] * dt + Math.cos(time * 3.5 + seeds[i] * 8) * 0.012;
      // Spread as rises
      velocities[i3] += turb * dt * 0.3;
      velocities[i3 + 1] *= 1 - life * 0.002;
      ageArr[i] = ages[i];
    }
    flameGeo.attributes.position.needsUpdate = true;
    flameGeo.attributes.aAge.needsUpdate = true;

    // Embers
    const ep = emberGeo.attributes.position.array;
    const ea = emberGeo.attributes.aAge.array;
    for (let i = 0; i < emberCount; i++) {
      eAge[i] += dt;
      if (eAge[i] >= eLife[i]) {
        resetEmber(i, ePos, eVel, eLife, eAge, eSize, false);
        continue;
      }
      const i3 = i * 3;
      ep[i3] += eVel[i3] * dt + Math.sin(time * 2 + i) * 0.008;
      ep[i3 + 1] += eVel[i3 + 1] * dt;
      ep[i3 + 2] += eVel[i3 + 2] * dt + Math.cos(time * 1.7 + i) * 0.008;
      ea[i] = eAge[i];
    }
    emberGeo.attributes.position.needsUpdate = true;
    emberGeo.attributes.aAge.needsUpdate = true;
  }

  function onResize(pixelRatio) {
    flameMat.uniforms.uPixelRatio.value = pixelRatio;
    emberMat.uniforms.uPixelRatio.value = pixelRatio;
  }

  return { group, update, onResize };
}

function resetFlame(i, pos, vel, life, age, size, seed, randomAge) {
  const i3 = i * 3;
  const angle = Math.random() * Math.PI * 2;
  const r = Math.pow(Math.random(), 0.6) * 0.45;
  pos[i3] = Math.cos(angle) * r;
  pos[i3 + 1] = Math.random() * 0.15;
  pos[i3 + 2] = Math.sin(angle) * r;

  vel[i3] = (Math.random() - 0.5) * 0.35;
  vel[i3 + 1] = 1.2 + Math.random() * 2.2;
  vel[i3 + 2] = (Math.random() - 0.5) * 0.35;

  life[i] = 0.5 + Math.random() * 1.1;
  age[i] = randomAge ? Math.random() * life[i] : 0;
  size[i] = 8 + Math.random() * 28;
  seed[i] = Math.random();
}

function resetEmber(i, pos, vel, life, age, size, randomAge) {
  const i3 = i * 3;
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * 0.5;
  pos[i3] = Math.cos(angle) * r;
  pos[i3 + 1] = 0.5 + Math.random() * 1.5;
  pos[i3 + 2] = Math.sin(angle) * r;

  vel[i3] = (Math.random() - 0.5) * 0.6;
  vel[i3 + 1] = 0.4 + Math.random() * 1.2;
  vel[i3 + 2] = (Math.random() - 0.5) * 0.6;

  life[i] = 1.5 + Math.random() * 3;
  age[i] = randomAge ? Math.random() * life[i] : 0;
  size[i] = 2 + Math.random() * 6;
}
