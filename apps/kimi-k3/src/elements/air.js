import * as THREE from "three";

// Soft irregular cloud-puff sprite, drawn once on a canvas (no external assets).
function makePuffTexture() {
  const s = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d");
  const lobes = [
    [64, 70, 46],
    [42, 66, 30],
    [86, 64, 30],
    [58, 48, 28],
    [74, 52, 24],
  ];
  for (const [x, y, r] of lobes) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  }
  return new THREE.CanvasTexture(canvas);
}

export function createAir(originX = 0) {
  const group = new THREE.Group();
  group.position.x = originX;
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  const HEIGHT = 12;

  // ---------- vortex: ~5000 swirling particles ----------
  const COUNT = 5000;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3)
  );
  const seeds = new Float32Array(COUNT);
  const rands = new Float32Array(COUNT);
  const speeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    seeds[i] = Math.random();
    rands[i] = Math.random();
    speeds[i] = 0.5 + Math.random();
  }
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute("aRand", new THREE.BufferAttribute(rands, 1));
  geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));

  const vortexUniforms = {
    uTime: { value: 0 },
    uHeight: { value: HEIGHT },
    uSize: { value: 1.6 },
    uPixelRatio: { value: pixelRatio },
  };
  const vortexMat = new THREE.ShaderMaterial({
    uniforms: vortexUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime, uHeight, uSize, uPixelRatio;
      attribute float aSeed, aRand, aSpeed;
      varying float vAlpha;
      varying float vH;
      varying float vDepth;
      void main() {
        float h = fract(aSeed + uTime * aSpeed * 0.09); // looped climb up the funnel
        vH = h;
        float r = (0.45 + 3.9 * pow(h, 1.3)) * (0.8 + 0.4 * aRand); // radius grows with height
        float ang = aRand * 6.2831 + uTime * (2.4 - 0.9 * h) * (0.7 + 0.6 * aSpeed) + h * 5.0;
        float turb = sin(h * 18.0 + uTime * 2.6 + aSeed * 40.0) * 0.28 * h;
        vec3 p = vec3(cos(ang) * (r + turb), h * uHeight, sin(ang) * (r + turb));
        vAlpha = smoothstep(0.02, 0.14, h) * (1.0 - smoothstep(0.68, 1.0, h));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vDepth = -mv.z;
        gl_PointSize = uSize * (0.6 + 0.7 * h) * uPixelRatio * (120.0 / vDepth);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      varying float vH;
      varying float vDepth;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.0, d);
        a *= a;
        vec3 col = mix(vec3(0.9, 0.97, 1.0), vec3(0.4, 0.85, 1.0), vH) * 1.4;
        float fogFade = exp(-vDepth * vDepth * 0.0009);
        gl_FragColor = vec4(col, a * vAlpha * 0.35 * fogFade);
      }
    `,
  });
  const vortex = new THREE.Points(geo, vortexMat);
  vortex.frustumCulled = false;
  group.add(vortex);

  // ---------- flowing ribbons with scrolling bright dashes ----------
  const ribbonUniforms = [];
  for (let i = 0; i < 6; i++) {
    const pts = [];
    const turns = 2.0 + i * 0.3;
    const baseR = 1.3 + i * 0.55;
    const hMax = 9.5 + (i % 3);
    for (let j = 0; j <= 26; j++) {
      const t = j / 26;
      const ang = t * Math.PI * 2 * turns + i * 1.05;
      const r = baseR * (0.55 + t * 0.95) + Math.sin(t * 8.0 + i * 2.0) * 0.35;
      pts.push(
        new THREE.Vector3(Math.cos(ang) * r, 0.3 + t * hMax, Math.sin(ang) * r)
      );
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 240, 0.05, 6, false);
    const uni = {
      uTime: { value: 0 },
      uRepeat: { value: 6 + i },
      uOffset: { value: Math.random() },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying float vDepth;
        void main() {
          vUv = uv;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime, uRepeat, uOffset;
        varying vec2 vUv;
        varying float vDepth;
        void main() {
          float dash = fract(vUv.x * uRepeat - uTime * 0.5 + uOffset);
          float bright = smoothstep(0.0, 0.1, dash) * (1.0 - smoothstep(0.1, 0.32, dash));
          float ends = smoothstep(0.0, 0.05, vUv.x) * (1.0 - smoothstep(0.95, 1.0, vUv.x));
          vec3 col = mix(vec3(0.25, 0.6, 0.75), vec3(0.75, 0.97, 1.0), bright);
          float fogFade = exp(-vDepth * vDepth * 0.0009);
          gl_FragColor = vec4(col * (0.35 + bright * 2.4), (0.1 + bright * 0.8) * ends * fogFade);
        }
      `,
    });
    group.add(new THREE.Mesh(tubeGeo, mat));
    ribbonUniforms.push(uni);
  }

  // ---------- orbiting cloud puffs ----------
  const puffTex = makePuffTexture();
  const clouds = [];
  for (let i = 0; i < 40; i++) {
    const mat = new THREE.SpriteMaterial({
      map: puffTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.05 + Math.random() * 0.07,
      color: new THREE.Color().setHSL(0.55, 0.25, 0.75),
    });
    const sp = new THREE.Sprite(mat);
    const s = 2.5 + Math.random() * 3.5;
    sp.scale.set(s, s * 0.7, 1);
    clouds.push({
      sprite: sp,
      r: 6 + Math.random() * 8,
      y: 1 + Math.random() * 9.5,
      speed: (0.03 + Math.random() * 0.08) * (Math.random() < 0.5 ? 1 : -1),
      phase: Math.random() * Math.PI * 2,
    });
    group.add(sp);
  }

  // ---------- leaves / feathers caught in the swirl ----------
  const leafGeo = new THREE.PlaneGeometry(0.18, 0.1);
  const leafColors = [0x93_a8_9b, 0xae_be_c4, 0x7b_92_96];
  const leaves = [];
  for (let i = 0; i < 36; i++) {
    const m = new THREE.Mesh(
      leafGeo,
      new THREE.MeshBasicMaterial({
        color: leafColors[i % 3],
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    leaves.push({
      mesh: m,
      seed: Math.random(),
      speed: 0.6 + Math.random() * 0.8,
      spin: new THREE.Vector3(
        Math.random() * 2,
        Math.random() * 2,
        Math.random() * 2
      ),
    });
    group.add(m);
  }

  // ---------- cool light at the vortex heart ----------
  const light = new THREE.PointLight(0x6f_d3_ff, 50, 38, 2);
  light.position.set(0, 4.5, 0);
  group.add(light);

  function update(elapsed) {
    vortexUniforms.uTime.value = elapsed;
    for (const uni of ribbonUniforms) {
      uni.uTime.value = elapsed;
    }
    for (const c of clouds) {
      const a = c.phase + elapsed * c.speed;
      c.sprite.position.set(
        Math.cos(a) * c.r,
        c.y + Math.sin(elapsed * 0.2 + c.phase) * 0.4,
        Math.sin(a) * c.r
      );
    }
    for (const l of leaves) {
      const h = (l.seed + elapsed * l.speed * 0.09) % 1;
      const r = 0.55 + 3.3 * h ** 1.3;
      const ang = l.seed * Math.PI * 2 + elapsed * (2.2 - 0.9 * h);
      l.mesh.position.set(Math.cos(ang) * r, h * 10.5, Math.sin(ang) * r);
      l.mesh.rotation.set(
        elapsed * l.spin.x,
        elapsed * l.spin.y,
        elapsed * l.spin.z
      );
    }
  }

  return {
    group,
    update,
    anchor: new THREE.Vector3(originX, 3.4, 13.5),
    target: new THREE.Vector3(originX, 4.6, 0),
    background: 0x0a_10_18,
  };
}
