import * as THREE from 'three';

// Procedural lava-crack texture: glowing ring + jagged cracks radiating out.
function makeLavaTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  const cx = size / 2;

  const ring = ctx.createRadialGradient(cx, cx, 120, cx, cx, 200);
  ring.addColorStop(0.0, 'rgba(255,80,10,0)');
  ring.addColorStop(0.5, 'rgba(255,110,20,0.5)');
  ring.addColorStop(1.0, 'rgba(255,60,5,0)');
  ctx.fillStyle = ring;
  ctx.fillRect(0, 0, size, size);

  ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    let a = Math.random() * Math.PI * 2;
    let r = 30 + Math.random() * 40;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r, cx + Math.sin(a) * r);
    const segs = 4 + Math.floor(Math.random() * 5);
    for (let s = 0; s < segs; s++) {
      r += 14 + Math.random() * 26;
      a += (Math.random() - 0.5) * 0.55;
      ctx.lineTo(cx + Math.cos(a) * r, cx + Math.sin(a) * r);
    }
    ctx.strokeStyle = `rgba(255,${90 + Math.floor(Math.random() * 90)},20,${0.45 + Math.random() * 0.4})`;
    ctx.lineWidth = 0.8 + Math.random() * 2.4;
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createFire(originX = 0) {
  const group = new THREE.Group();
  group.position.x = originX;
  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  // ---------- flame column: ~3000 GPU particles ----------
  const COUNT = 3000;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  const seeds = new Float32Array(COUNT);
  const speeds = new Float32Array(COUNT);
  const radii = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    seeds[i] = Math.random();
    speeds[i] = 0.6 + Math.random() * 0.9;
    radii[i] = Math.sqrt(Math.random()); // uniform across the flame disc
  }
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geo.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));

  const flameUniforms = {
    uTime: { value: 0 },
    uHeight: { value: 7.0 },
    uBaseRadius: { value: 1.45 },
    uSize: { value: 2.3 },
    uPixelRatio: { value: pixelRatio },
  };
  const flameMat = new THREE.ShaderMaterial({
    uniforms: flameUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime, uHeight, uBaseRadius, uSize, uPixelRatio;
      attribute float aSeed, aSpeed, aRadius;
      varying float vLife;
      varying float vDepth;
      void main() {
        // looped life: particles rise, shrink and spiral as they age
        float life = fract(aSeed + uTime * aSpeed * 0.28);
        vLife = life;
        float y = life * uHeight;
        float r = uBaseRadius * aRadius * (1.0 - life * 0.85)
                * (0.35 + 0.65 * smoothstep(0.0, 0.12, life)); // cone profile
        float ang = aSeed * 6.28318 + life * (3.0 + aSpeed * 3.0) + uTime * 0.6;
        float wob = sin(life * 14.0 + aSeed * 40.0 + uTime * 2.5) * 0.22 * (1.0 - life);
        vec3 p = vec3(cos(ang) * r + wob, y, sin(ang) * r + wob * 0.6);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vDepth = -mv.z;
        gl_PointSize = uSize * uPixelRatio * (0.25 + 0.75 * (1.0 - life)) * (140.0 / vDepth);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      varying float vLife;
      varying float vDepth;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.0, d);
        a *= a;
        float fade = smoothstep(0.0, 0.06, vLife) * (1.0 - smoothstep(0.5, 1.0, vLife));
        // white-hot -> yellow -> orange -> deep red
        vec3 col = mix(vec3(1.0, 0.92, 0.65), vec3(1.0, 0.72, 0.18), smoothstep(0.0, 0.25, vLife));
        col = mix(col, vec3(1.0, 0.32, 0.04), smoothstep(0.25, 0.6, vLife));
        col = mix(col, vec3(0.45, 0.04, 0.0), smoothstep(0.6, 1.0, vLife));
        float fogFade = exp(-vDepth * vDepth * 0.0009); // manual exp2 fog for additive blend
        gl_FragColor = vec4(col * 2.2, a * fade * fogFade);
      }
    `,
  });
  const flame = new THREE.Points(geo, flameMat);
  flame.frustumCulled = false;
  group.add(flame);

  // ---------- embers: long-lived sparks drifting up ----------
  const ECOUNT = 150;
  const egeo = new THREE.BufferGeometry();
  egeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ECOUNT * 3), 3));
  const eSeeds = new Float32Array(ECOUNT);
  const eSpeeds = new Float32Array(ECOUNT);
  const eOffsets = new Float32Array(ECOUNT * 3);
  for (let i = 0; i < ECOUNT; i++) {
    eSeeds[i] = Math.random();
    eSpeeds[i] = 0.5 + Math.random();
    eOffsets[i * 3] = (Math.random() - 0.5) * 2.4;
    eOffsets[i * 3 + 1] = 0;
    eOffsets[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
  }
  egeo.setAttribute('aSeed', new THREE.BufferAttribute(eSeeds, 1));
  egeo.setAttribute('aSpeed', new THREE.BufferAttribute(eSpeeds, 1));
  egeo.setAttribute('aOffset', new THREE.BufferAttribute(eOffsets, 3));

  const emberUniforms = { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } };
  const emberMat = new THREE.ShaderMaterial({
    uniforms: emberUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime, uPixelRatio;
      attribute float aSeed, aSpeed;
      attribute vec3 aOffset;
      varying float vTw;
      varying float vDepth;
      void main() {
        float life = fract(aSeed + uTime * aSpeed * 0.07);
        vec3 p = vec3(
          aOffset.x * (1.0 + life * 2.0) + sin(uTime * (0.6 + aSpeed * 0.7) + aSeed * 6.2831) * (0.3 + life * 1.4),
          life * 11.0,
          aOffset.z * (1.0 + life * 2.0) + cos(uTime * (0.5 + aSpeed * 0.6) + aSeed * 6.2831) * (0.3 + life * 1.4)
        );
        // twinkle, and fade at both ends of life
        vTw = (0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (2.0 + aSpeed * 4.0) + aSeed * 40.0)))
            * smoothstep(0.0, 0.05, life) * (1.0 - smoothstep(0.7, 1.0, life));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vDepth = -mv.z;
        gl_PointSize = (0.55 + aSeed * 0.8) * uPixelRatio * (60.0 / vDepth);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      varying float vTw;
      varying float vDepth;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.0, d);
        float fogFade = exp(-vDepth * vDepth * 0.0009);
        gl_FragColor = vec4(vec3(1.0, 0.55, 0.15) * 2.0, a * vTw * fogFade);
      }
    `,
  });
  const embers = new THREE.Points(egeo, emberMat);
  embers.frustumCulled = false;
  group.add(embers);

  // ---------- glowing core with fresnel emissive ----------
  const coreUniforms = { uTime: { value: 0 } };
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 32, 32),
    new THREE.ShaderMaterial({
      uniforms: coreUniforms,
      vertexShader: /* glsl */`
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          vN = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vV = -mv.xyz;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime;
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.6);
          float pulse = 0.9 + 0.15 * sin(uTime * 9.0) + 0.08 * sin(uTime * 23.0);
          vec3 col = mix(vec3(1.0, 0.88, 0.45) * 3.2, vec3(1.0, 0.28, 0.02) * 1.6, f) * pulse;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
  );
  core.position.y = 0.5;
  group.add(core);

  // ---------- flickering fire light ----------
  const light = new THREE.PointLight(0xff6a1f, 60, 30, 2);
  light.position.set(0, 2.4, 0);
  group.add(light);

  // ---------- dark ground disc with lava-crack ring ----------
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(9, 64),
    new THREE.MeshStandardMaterial({
      color: 0x140b06,
      roughness: 0.95,
      metalness: 0.0,
      emissive: 0xffffff,
      emissiveMap: makeLavaTexture(),
      emissiveIntensity: 1.6,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  group.add(ground);

  function update(elapsed) {
    flameUniforms.uTime.value = elapsed;
    emberUniforms.uTime.value = elapsed;
    coreUniforms.uTime.value = elapsed;
    // smooth pseudo-noise flicker (sum of incommensurate sines)
    light.intensity = 58 + 16 * (
      0.5 * Math.sin(elapsed * 9.3) +
      0.3 * Math.sin(elapsed * 23.7 + 1.3) +
      0.2 * Math.sin(elapsed * 4.1 + 2.1)
    );
    core.scale.setScalar(1 + 0.05 * Math.sin(elapsed * 7.0) + 0.03 * Math.sin(elapsed * 17.0));
  }

  return {
    group,
    update,
    anchor: new THREE.Vector3(originX, 2.6, 12),
    target: new THREE.Vector3(originX, 3.6, 0),
    background: 0x0a0302,
  };
}
