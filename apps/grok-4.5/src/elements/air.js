import * as THREE from "three";

/**
 * Air: swirling vortex, wind ribbons, soft atmospheric particles.
 */
export function createAir(position = new THREE.Vector3(0, 0, 0)) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.name = "air";

  // Soft ambient light
  const airLight = new THREE.PointLight(0xaa_cc_ff, 3, 14, 2);
  airLight.position.set(0, 1.5, 0);
  group.add(airLight);

  // --- Vortex particles ---
  const count = 2200;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const data = new Float32Array(count * 4); // radius, angle, y, speed

  for (let i = 0; i < count; i++) {
    const radius = 0.2 + Math.random() * 1.8;
    const angle = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.3) * 3.5;
    const speed = 0.6 + Math.random() * 1.8;

    data[i * 4] = radius;
    data[i * 4 + 1] = angle;
    data[i * 4 + 2] = y;
    data[i * 4 + 3] = speed;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aData", new THREE.BufferAttribute(data, 4));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */ `
      attribute vec4 aData;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vAlpha;
      varying float vMix;

      void main() {
        float radius = aData.x;
        float angle = aData.y + uTime * aData.w * (1.2 / max(radius, 0.3));
        float y = aData.z + sin(uTime * 0.8 + aData.y * 3.0) * 0.15;

        // Spiral inward/outward breathing
        float breath = 1.0 + sin(uTime * 0.5 + radius) * 0.08;
        float r = radius * breath;

        // Rise and wrap
        y = mod(y + uTime * 0.25 + 1.5, 3.5) - 1.5;

        vec3 pos = vec3(cos(angle) * r, y, sin(angle) * r);

        vAlpha = smoothstep(1.9, 0.4, r) * smoothstep(-1.6, -0.5, y) * smoothstep(2.2, 1.0, y);
        vMix = radius / 2.0;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        float sz = mix(3.0, 10.0, 1.0 - radius / 2.0);
        gl_PointSize = sz * uPixelRatio * (160.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      varying float vMix;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float soft = pow(1.0 - smoothstep(0.0, 0.5, d), 1.6);

        vec3 cCore = vec3(0.95, 0.98, 1.0);
        vec3 cMid  = vec3(0.55, 0.78, 1.0);
        vec3 cEdge = vec3(0.35, 0.55, 0.95);
        vec3 col = mix(cCore, mix(cMid, cEdge, vMix), vMix);

        gl_FragColor = vec4(col * 1.3, soft * vAlpha * 0.7);
      }
    `,
  });

  const particles = new THREE.Points(geo, mat);
  group.add(particles);

  // --- Wind ribbons (static tubes, animated via group rotation + opacity) ---
  const ribbonGroup = new THREE.Group();
  ribbonGroup.position.y = 0.6;
  group.add(ribbonGroup);
  const ribbons = [];
  const ribbonCount = 10;

  for (let r = 0; r < ribbonCount; r++) {
    const points = [];
    const segs = 64;
    const baseAngle = (r / ribbonCount) * Math.PI * 2;
    const radius = 0.55 + (r % 5) * 0.28;
    const pitch = 2.4 + (r % 3) * 0.15;
    const yOff = ((r % 4) / 4 - 0.5) * 1.4;

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const angle = baseAngle + t * Math.PI * 4;
      const rad = radius * (0.65 + Math.sin(t * Math.PI) * 0.55);
      const y = yOff + t * pitch - pitch * 0.5;
      points.push(
        new THREE.Vector3(Math.cos(angle) * rad, y, Math.sin(angle) * rad)
      );
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(
      curve,
      80,
      0.01 + (r % 3) * 0.005,
      5,
      false
    );
    const tubeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.55 + r * 0.012, 0.5, 0.72),
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.userData = { index: r, spin: 0.2 + (r % 4) * 0.08 };
    ribbonGroup.add(tube);
    ribbons.push(tube);
  }

  // Central translucent sphere (air orb)
  const orbGeo = new THREE.SphereGeometry(0.55, 48, 48);
  const orbMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vWorldPos;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);
        float pulse = 0.5 + 0.5 * sin(uTime * 1.5);
        vec3 col = mix(vec3(0.4, 0.7, 1.0), vec3(0.85, 0.95, 1.0), fresnel);
        float alpha = fresnel * 0.55 + pulse * 0.08;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  const orb = new THREE.Mesh(orbGeo, orbMat);
  orb.position.y = 0.8;
  group.add(orb);

  // Inner swirl sphere
  const innerGeo = new THREE.IcosahedronGeometry(0.28, 2);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xcc_ee_ff,
    transparent: true,
    opacity: 0.25,
    wireframe: true,
  });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  inner.position.y = 0.8;
  group.add(inner);

  // Ground swirl ring
  const ringGeo = new THREE.TorusGeometry(1.3, 0.02, 8, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x88_bb_ff,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  const ring2 = ring.clone();
  ring2.scale.setScalar(0.7);
  ring2.material = ringMat.clone();
  ring2.material.opacity = 0.2;
  group.add(ring2);

  let time = 0;

  function update(dt) {
    time += dt;
    mat.uniforms.uTime.value = time;
    orbMat.uniforms.uTime.value = time;

    inner.rotation.y += dt * 0.8;
    inner.rotation.x += dt * 0.3;
    orb.rotation.y -= dt * 0.15;

    ring.rotation.z += dt * 0.6;
    ring2.rotation.z -= dt * 0.9;
    ring.scale.setScalar(1 + Math.sin(time * 1.2) * 0.05);
    ring2.scale.setScalar(0.7 + Math.sin(time * 1.5 + 1) * 0.04);

    airLight.intensity = 2.5 + Math.sin(time * 2) * 0.5;

    // Animate ribbons by spinning the group and pulsing opacity
    ribbonGroup.rotation.y = time * 0.45;
    ribbonGroup.rotation.x = Math.sin(time * 0.3) * 0.08;
    for (const tube of ribbons) {
      const { index, spin } = tube.userData;
      tube.rotation.y = time * spin * 0.15;
      tube.material.opacity = 0.1 + Math.sin(time * 2.2 + index * 0.7) * 0.08;
      tube.scale.y = 1 + Math.sin(time * 1.4 + index) * 0.06;
    }
  }

  function onResize(pixelRatio) {
    mat.uniforms.uPixelRatio.value = pixelRatio;
  }

  return { group, update, onResize };
}
