import * as THREE from "three";

/**
 * Water: animated shader surface, caustic glow, rising bubbles, deep pool.
 */
export function createWater(position = new THREE.Vector3(0, 0, 0)) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.name = "water";

  // Underwater light
  const waterLight = new THREE.PointLight(0x2288ff, 5, 16, 1.8);
  waterLight.position.set(0, 0.3, 0);
  group.add(waterLight);

  const waterLight2 = new THREE.PointLight(0x44ccff, 2, 10, 2);
  waterLight2.position.set(0.5, 1.0, 0.3);
  group.add(waterLight2);

  // --- Animated water surface ---
  const surfaceGeo = new THREE.PlaneGeometry(3.2, 3.2, 128, 128);
  const surfaceMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true,
    uniforms: {
      uTime: { value: 0 },
      uColorDeep: { value: new THREE.Color(0x0a2a4a) },
      uColorShallow: { value: new THREE.Color(0x3ab0e8) },
      uColorFoam: { value: new THREE.Color(0xb8e8ff) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      varying float vElevation;
      varying vec3 vNormalW;
      varying vec3 vWorldPos;

      // Simplex-ish layered waves
      float wave(vec2 p, float t, float freq, float amp, float speed, vec2 dir) {
        return sin(dot(p, dir) * freq + t * speed) * amp;
      }

      void main() {
        vUv = uv;
        vec3 pos = position;

        float t = uTime;
        float e = 0.0;
        e += wave(pos.xy, t, 2.5, 0.12, 1.8, normalize(vec2(1.0, 0.4)));
        e += wave(pos.xy, t, 4.0, 0.06, 2.4, normalize(vec2(-0.6, 1.0)));
        e += wave(pos.xy, t, 7.0, 0.03, 3.2, normalize(vec2(0.3, -0.9)));
        e += wave(pos.xy, t, 11.0, 0.015, 4.0, normalize(vec2(-0.8, -0.5)));
        // Circular ripple from center
        float dist = length(pos.xy);
        e += sin(dist * 6.0 - t * 3.0) * 0.04 * exp(-dist * 0.8);

        pos.z += e;
        vElevation = e;

        // Approximate normal from wave derivatives
        float eps = 0.05;
        float ex = wave(pos.xy + vec2(eps, 0.0), t, 2.5, 0.12, 1.8, normalize(vec2(1.0, 0.4)))
                 + wave(pos.xy + vec2(eps, 0.0), t, 4.0, 0.06, 2.4, normalize(vec2(-0.6, 1.0)));
        float ey = wave(pos.xy + vec2(0.0, eps), t, 2.5, 0.12, 1.8, normalize(vec2(1.0, 0.4)))
                 + wave(pos.xy + vec2(0.0, eps), t, 4.0, 0.06, 2.4, normalize(vec2(-0.6, 1.0)));
        vec3 tangent = normalize(vec3(eps, 0.0, ex - e));
        vec3 bitangent = normalize(vec3(0.0, eps, ey - e));
        vec3 n = normalize(cross(tangent, bitangent));
        vNormalW = normalize(normalMatrix * n);

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColorDeep;
      uniform vec3 uColorShallow;
      uniform vec3 uColorFoam;
      varying vec2 vUv;
      varying float vElevation;
      varying vec3 vNormalW;
      varying vec3 vWorldPos;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormalW)), 0.0), 3.0);

        float depth = length(vUv - 0.5) * 2.0;
        vec3 col = mix(uColorShallow, uColorDeep, smoothstep(0.0, 1.0, depth));

        // Specular highlight
        vec3 lightDir = normalize(vec3(0.4, 0.8, 0.5));
        float spec = pow(max(dot(reflect(-lightDir, normalize(vNormalW)), viewDir), 0.0), 48.0);
        col += vec3(0.7, 0.9, 1.0) * spec * 0.9;

        // Foam on peaks
        float foam = smoothstep(0.08, 0.14, vElevation);
        col = mix(col, uColorFoam, foam * 0.55);

        // Caustic-like shimmer
        float caustic = sin(vWorldPos.x * 8.0 + uTime * 2.0) * sin(vWorldPos.z * 7.0 - uTime * 1.5);
        caustic = caustic * 0.5 + 0.5;
        col += vec3(0.15, 0.35, 0.5) * caustic * 0.15 * (1.0 - depth);

        // Edge falloff for circular pool look
        float edge = 1.0 - smoothstep(0.72, 1.0, depth);
        float alpha = mix(0.75, 0.95, fresnel) * edge;

        col = mix(col, vec3(0.6, 0.85, 1.0), fresnel * 0.45);

        gl_FragColor = vec4(col, alpha);
      }
    `,
  });

  const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 0.6;
  group.add(surface);

  // Deep pool body (cylinder under surface)
  const poolGeo = new THREE.CylinderGeometry(1.45, 1.35, 1.1, 64, 1, true);
  const poolMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vY;
      void main() {
        vUv = uv;
        vY = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      varying float vY;
      void main() {
        float depth = 1.0 - (vY + 0.55) / 1.1;
        vec3 top = vec3(0.15, 0.5, 0.75);
        vec3 bot = vec3(0.02, 0.08, 0.2);
        vec3 col = mix(top, bot, depth);
        float bands = sin(vY * 20.0 + uTime * 1.5 + vUv.x * 10.0) * 0.04;
        col += bands;
        float alpha = 0.55 + depth * 0.25;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  const pool = new THREE.Mesh(poolGeo, poolMat);
  pool.position.y = 0.05;
  group.add(pool);

  // Pool floor
  const floorGeo = new THREE.CircleGeometry(1.35, 64);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0a2035,
    roughness: 0.8,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.5;
  group.add(floor);

  // Rim
  const rimGeo = new THREE.TorusGeometry(1.5, 0.06, 12, 64);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x3a5a70,
    roughness: 0.4,
    metalness: 0.6,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.58;
  group.add(rim);

  // --- Bubbles ---
  const bubbleCount = 180;
  const bubbleGeo = new THREE.BufferGeometry();
  const bPos = new Float32Array(bubbleCount * 3);
  const bData = new Float32Array(bubbleCount * 3); // speed, phase, size

  for (let i = 0; i < bubbleCount; i++) {
    resetBubble(i, bPos, bData, true);
  }

  bubbleGeo.setAttribute("position", new THREE.BufferAttribute(bPos, 3));
  bubbleGeo.setAttribute("aData", new THREE.BufferAttribute(bData, 3));

  const bubbleMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aData;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vAlpha;

      void main() {
        vec3 pos = position;
        pos.x += sin(uTime * 1.5 + aData.y) * 0.08;
        pos.z += cos(uTime * 1.2 + aData.y * 1.3) * 0.08;
        float life = fract(aData.y + uTime * aData.x * 0.15);
        pos.y = -0.4 + life * 1.4;
        vAlpha = sin(life * 3.14159) * 0.8;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aData.z * uPixelRatio * (120.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float ring = smoothstep(0.5, 0.3, d) * smoothstep(0.15, 0.35, d);
        float core = pow(1.0 - smoothstep(0.0, 0.25, d), 2.0) * 0.4;
        float soft = ring + core;
        vec3 col = vec3(0.6, 0.85, 1.0);
        gl_FragColor = vec4(col, soft * vAlpha * 0.7);
      }
    `,
  });

  const bubbles = new THREE.Points(bubbleGeo, bubbleMat);
  group.add(bubbles);

  // Droplet spray above surface
  const sprayCount = 120;
  const sprayGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array(sprayCount * 3);
  const sVel = new Float32Array(sprayCount * 3);
  const sLife = new Float32Array(sprayCount);
  const sAge = new Float32Array(sprayCount);

  for (let i = 0; i < sprayCount; i++) {
    resetSpray(i, sPos, sVel, sLife, sAge, true);
  }
  sprayGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));

  const sprayMat = new THREE.PointsMaterial({
    color: 0xaaddff,
    size: 0.04,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const spray = new THREE.Points(sprayGeo, sprayMat);
  group.add(spray);

  let time = 0;

  function update(dt) {
    time += dt;
    surfaceMat.uniforms.uTime.value = time;
    poolMat.uniforms.uTime.value = time;
    bubbleMat.uniforms.uTime.value = time;

    waterLight.intensity = 4.5 + Math.sin(time * 2.5) * 0.8;
    waterLight2.intensity = 1.8 + Math.sin(time * 3.2 + 1) * 0.5;

    // Spray particles
    const sp = sprayGeo.attributes.position.array;
    for (let i = 0; i < sprayCount; i++) {
      sAge[i] += dt;
      if (sAge[i] >= sLife[i]) {
        resetSpray(i, sPos, sVel, sLife, sAge, false);
        continue;
      }
      const i3 = i * 3;
      sp[i3] += sVel[i3] * dt;
      sp[i3 + 1] += sVel[i3 + 1] * dt;
      sp[i3 + 2] += sVel[i3 + 2] * dt;
      sVel[i3 + 1] -= 2.5 * dt; // gravity
    }
    sprayGeo.attributes.position.needsUpdate = true;
  }

  function onResize(pixelRatio) {
    bubbleMat.uniforms.uPixelRatio.value = pixelRatio;
  }

  return { group, update, onResize };
}

function resetBubble(i, pos, data, randomAge) {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * 1.1;
  pos[i * 3] = Math.cos(angle) * r;
  pos[i * 3 + 1] = -0.4 + Math.random() * 1.2;
  pos[i * 3 + 2] = Math.sin(angle) * r;
  data[i * 3] = 0.5 + Math.random() * 1.5; // speed
  data[i * 3 + 1] = randomAge ? Math.random() : Math.random(); // phase
  data[i * 3 + 2] = 3 + Math.random() * 10; // size
}

function resetSpray(i, pos, vel, life, age, randomAge) {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * 0.8;
  pos[i * 3] = Math.cos(angle) * r;
  pos[i * 3 + 1] = 0.65 + Math.random() * 0.2;
  pos[i * 3 + 2] = Math.sin(angle) * r;
  vel[i * 3] = (Math.random() - 0.5) * 0.8;
  vel[i * 3 + 1] = 0.8 + Math.random() * 1.5;
  vel[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
  life[i] = 0.4 + Math.random() * 0.8;
  age[i] = randomAge ? Math.random() * life[i] : 0;
}
