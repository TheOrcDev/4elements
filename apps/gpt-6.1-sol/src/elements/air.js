import * as THREE from 'three';

const TAU = Math.PI * 2;

function windRibbon(turns, phase, radiusOffset, width) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const count = 220;
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const a = t * TAU * turns + phase;
    const r = .21 + Math.sin(t * Math.PI) * .6 + t * .26 + radiusOffset;
    const y = -1.17 + t * 2.57;
    const w = width * (.2 + .8 * Math.sin(t * Math.PI));
    for (const side of [-1, 1]) {
      const edgeRadius = r + side * w * .24;
      positions.push(
        Math.cos(a) * edgeRadius,
        y + side * w * .68 + Math.sin(a * 2 + t * 3) * .075,
        Math.sin(a) * edgeRadius,
      );
      uvs.push(t, (side + 1) / 2);
    }
    if (i < count) {
      const n = i * 2;
      indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function windMaterial(uniforms, phase) {
  return new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uPhase: { value: phase } },
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      uniform float uTime;
      uniform float uPower;
      uniform float uPhase;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vUv = uv;
        vec3 p = position;
        p.xz *= 1.0 + sin(p.y * 3.0 - uTime * 1.1 + uPhase) * .045 * uPower;
        p.y += sin(uv.x * 16.0 - uTime * 1.6 + uPhase) * .025 * uPower;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uPhase;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float edge = sin(vUv.y * 3.14159265);
        float taper = smoothstep(0.0, .09, vUv.x) * (1.0 - smoothstep(.91, 1.0, vUv.x));
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 1.8);
        float flow = .5 + .5 * sin(vUv.x * 66.0 - uTime * 5.0 + uPhase);
        float filament = pow(.5 + .5 * sin(vUv.y * 25.0 + vUv.x * 12.0 - uTime * 1.2), 13.0);
        vec3 pearl = mix(vec3(.39,.77,.82), vec3(.87,.98,1.0), .55 + fresnel * .45);
        pearl *= .8 + fresnel * .48 + filament * .2;
        float alpha = taper * pow(edge, .65) * (.2 + fresnel * .42 + flow * .06);
        gl_FragColor = vec4(pearl, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

export function createAir() {
  const group = new THREE.Group();
  const vortex = new THREE.Group();
  group.add(vortex);
  const uniforms = { uTime: { value: 0 }, uPower: { value: 1 } };

  for (let i = 0; i < 6; i++) {
    const phase = i * TAU / 6;
    const geometry = windRibbon(1.25 + (i % 3) * .17, phase, (i % 2) * .095, .23 + (i % 3) * .055);
    const ribbon = new THREE.Mesh(geometry, windMaterial(uniforms, phase));
    ribbon.renderOrder = 2 + i;
    vortex.add(ribbon);
  }

  // The fine outer filaments trace the vortex's motion without obscuring its interior.
  const filamentGroup = new THREE.Group();
  const filamentMaterial = new THREE.MeshBasicMaterial({ color: '#bcecf0', transparent: true, opacity: .34, blending: THREE.AdditiveBlending, depthWrite: false });
  const filamentMaterials = [];
  for (let i = 0; i < 13; i++) {
    const points = [];
    const phase = i * 2.39996;
    for (let j = 0; j <= 130; j++) {
      const t = j / 130;
      const a = t * TAU * (1.55 + (i % 3) * .12) + phase;
      const r = .24 + Math.sin(t * Math.PI) * (.64 + (i % 4) * .065) + t * .27;
      points.push(new THREE.Vector3(Math.cos(a) * r, -1.22 + t * 2.64 + Math.sin(a) * .035, Math.sin(a) * r));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const mat = filamentMaterial.clone();
    mat.opacity = .16 + (i % 4) * .07;
    filamentMaterials.push(mat);
    filamentGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 130, .003 + (i % 3) * .0014, 4, false), mat));
  }
  vortex.add(filamentGroup);

  const particleCount = 1150;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSeeds = new Float32Array(particleCount * 4);
  for (let i = 0; i < particleCount; i++) {
    // Deterministic seed distribution keeps the sculpture consistent between loads.
    const t = ((i * .61803398875) % 1);
    const a = i * 2.39996;
    const r = .14 + Math.sin(t * Math.PI) * (.25 + (i % 17) / 17 * .43);
    particlePositions.set([Math.cos(a) * r, -1.13 + t * 2.51, Math.sin(a) * r], i * 3);
    particleSeeds.set([a, t, r, .4 + (i % 23) / 23 * .6], i * 4);
  }
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('aSeed', new THREE.BufferAttribute(particleSeeds, 4));
  const mistMaterial = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime;
      uniform float uPower;
      attribute vec4 aSeed;
      varying float vAlpha;
      varying float vTint;
      void main() {
        float t = fract(aSeed.y + uTime * .042 * (.6 + aSeed.w * .4));
        float a = aSeed.x + uTime * (.35 + aSeed.w * .2) + t * 8.0;
        float r = aSeed.z * (.45 + sin(t * 3.14159265) * .75);
        vec3 p = vec3(cos(a) * r, -1.13 + t * 2.51, sin(a) * r);
        p.x += sin(t * 8.0 + uTime) * .035 * uPower;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((26.0 + aSeed.w * 42.0) / -mv.z, 1.0, 27.0);
        vAlpha = sin(t * 3.14159265) * (.12 + aSeed.w * .12);
        vTint = aSeed.w;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying float vTint;
      void main() {
        vec2 p = gl_PointCoord - .5;
        float fog = exp(-dot(p,p) * 15.0) * (1.0 - smoothstep(.25,.5,length(p)));
        gl_FragColor = vec4(mix(vec3(.3,.62,.68), vec3(.8,.92,.94), vTint), fog * vAlpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mist = new THREE.Points(particleGeometry, mistMaterial);
  mist.renderOrder = 1;
  group.add(mist);

  const motesGeometry = new THREE.BufferGeometry();
  const motePositions = new Float32Array(60 * 3);
  for (let i = 0; i < 60; i++) {
    const a = i * 2.39996;
    const y = Math.sin(i * 15.71) * 1.31;
    const r = .95 + .16 * Math.cos(i * 5.7);
    motePositions.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
  }
  motesGeometry.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  const motesMaterial = new THREE.PointsMaterial({ color: '#d6ffff', size: .014, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false });
  const motes = new THREE.Points(motesGeometry, motesMaterial);
  group.add(motes);

  const update = (time, delta, { intensity = 1 } = {}) => {
    uniforms.uTime.value = time;
    uniforms.uPower.value = intensity;
    vortex.rotation.y = -time * .14;
    vortex.rotation.z = Math.sin(time * .39) * .055;
    vortex.position.y = Math.sin(time * .72) * .025;
    filamentGroup.rotation.y = -time * .075;
    filamentMaterials.forEach((mat, i) => {
      mat.opacity = .18 + .14 * (.5 + .5 * Math.sin(time * 1.1 + i * .67));
    });
    motes.rotation.y = time * .13;
    motes.rotation.z = Math.sin(time * .25) * .09;
  };
  return { group, update };
}
