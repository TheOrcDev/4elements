import * as THREE from "three";

/**
 * Earth: rocky core, floating stones, crystals, moss glow, dust motes.
 */
export function createEarth(position = new THREE.Vector3(0, 0, 0)) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.name = "earth";

  const earthLight = new THREE.PointLight(0x88_aa_44, 3, 14, 2);
  earthLight.position.set(0, 1.2, 0);
  group.add(earthLight);

  const crystalLight = new THREE.PointLight(0x66_ff_aa, 2, 8, 2);
  crystalLight.position.set(0.3, 1.5, 0.2);
  group.add(crystalLight);

  // --- Central rock mass ---
  const coreGeo = new THREE.IcosahedronGeometry(0.85, 1);
  // Displace vertices for rocky look
  const corePos = coreGeo.attributes.position;
  for (let i = 0; i < corePos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(corePos, i);
    const n = v.clone().normalize();
    const noise =
      Math.sin(v.x * 4.2) * Math.cos(v.y * 3.7) * Math.sin(v.z * 5.1) * 0.12 +
      Math.sin(v.x * 8 + v.y * 6) * 0.05;
    v.addScaledVector(n, noise);
    corePos.setXYZ(i, v.x, v.y, v.z);
  }
  coreGeo.computeVertexNormals();

  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x5a_4a_38,
    roughness: 0.92,
    metalness: 0.08,
    flatShading: true,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 0.9;
  group.add(core);

  // Moss patches on core (slightly larger green shell, partial)
  const mossGeo = new THREE.IcosahedronGeometry(0.88, 1);
  const mossPos = mossGeo.attributes.position;
  for (let i = 0; i < mossPos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(mossPos, i);
    const n = v.clone().normalize();
    const noise =
      Math.sin(v.x * 4.2) * Math.cos(v.y * 3.7) * Math.sin(v.z * 5.1) * 0.12 +
      Math.sin(v.x * 8 + v.y * 6) * 0.05;
    v.addScaledVector(n, noise + 0.02);
    // Flatten some faces by pushing others in (fake patches via vertex colors later)
    mossPos.setXYZ(i, v.x, v.y, v.z);
  }
  mossGeo.computeVertexNormals();

  const colors = new Float32Array(mossPos.count * 3);
  for (let i = 0; i < mossPos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(mossPos, i);
    const mossiness = Math.max(0, Math.sin(v.x * 3 + v.y * 5 + v.z * 2));
    const g = 0.35 + mossiness * 0.35;
    colors[i * 3] = 0.15 * mossiness;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = 0.1 * mossiness;
  }
  mossGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mossMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    metalness: 0,
    flatShading: true,
    transparent: true,
    opacity: 0.85,
  });
  const moss = new THREE.Mesh(mossGeo, mossMat);
  moss.position.y = 0.9;
  group.add(moss);

  // --- Floating rocks ---
  const rocks = [];
  const rockCount = 14;

  for (let i = 0; i < rockCount; i++) {
    const detail = i % 3 === 0 ? 0 : 1;
    const geo = new THREE.DodecahedronGeometry(
      0.12 + Math.random() * 0.22,
      detail
    );
    const p = geo.attributes.position;
    for (let j = 0; j < p.count; j++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, j);
      v.multiplyScalar(0.85 + Math.random() * 0.3);
      p.setXYZ(j, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();

    const isCrystal = i < 4;
    let mat;
    if (isCrystal) {
      mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(0.35 + Math.random() * 0.1, 0.7, 0.55),
        roughness: 0.15,
        metalness: 0.1,
        transmission: 0.45,
        thickness: 0.5,
        transparent: true,
        opacity: 0.85,
        flatShading: true,
      });
    } else {
      mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(
          0.08,
          0.25,
          0.25 + Math.random() * 0.15
        ),
        roughness: 0.9,
        metalness: 0.05,
        flatShading: true,
      });
    }

    const mesh = new THREE.Mesh(geo, mat);
    const angle = (i / rockCount) * Math.PI * 2;
    const radius = 1.1 + Math.random() * 0.7;
    const y = 0.4 + Math.random() * 1.8;
    mesh.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    mesh.userData = {
      angle,
      radius,
      y,
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.5
      ),
      orbitSpeed: 0.15 + Math.random() * 0.25,
      bobPhase: Math.random() * Math.PI * 2,
      bobAmp: 0.08 + Math.random() * 0.12,
      isCrystal,
    };
    group.add(mesh);
    rocks.push(mesh);
  }

  // Large base stone / terrain mound
  const baseGeo = new THREE.ConeGeometry(1.6, 0.7, 7, 1);
  const bp = baseGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(bp, i);
    if (v.y > -0.2) {
      v.x += (Math.random() - 0.5) * 0.15;
      v.z += (Math.random() - 0.5) * 0.15;
    }
    bp.setXYZ(i, v.x, v.y, v.z);
  }
  baseGeo.computeVertexNormals();
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x3d_34_28,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.15;
  base.rotation.y = 0.4;
  group.add(base);

  // Ground grass ring
  const grassGeo = new THREE.RingGeometry(1.3, 1.9, 48);
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x2d_5a_28,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = 0.02;
  group.add(grass);

  // Crystal spikes on top of core
  const spikes = [];
  for (let i = 0; i < 6; i++) {
    const spikeGeo = new THREE.ConeGeometry(
      0.06 + Math.random() * 0.04,
      0.35 + Math.random() * 0.3,
      5
    );
    const spikeMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color().setHSL(0.4 + Math.random() * 0.08, 0.75, 0.55),
      roughness: 0.1,
      metalness: 0.15,
      transmission: 0.5,
      thickness: 0.4,
      transparent: true,
      opacity: 0.9,
      emissive: new THREE.Color(0x11_44_22),
      emissiveIntensity: 0.3,
      flatShading: true,
    });
    const spike = new THREE.Mesh(spikeGeo, spikeMat);
    const a = (i / 6) * Math.PI * 2 + 0.2;
    spike.position.set(
      Math.cos(a) * 0.35,
      1.55 + Math.random() * 0.15,
      Math.sin(a) * 0.35
    );
    spike.rotation.z = (Math.random() - 0.5) * 0.4;
    spike.rotation.x = (Math.random() - 0.5) * 0.4;
    group.add(spike);
    spikes.push(spike);
  }

  // Dust / soil particles
  const dustCount = 500;
  const dustGeo = new THREE.BufferGeometry();
  const dPos = new Float32Array(dustCount * 3);
  const dData = new Float32Array(dustCount * 3);

  for (let i = 0; i < dustCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.5 + Math.random() * 1.6;
    dPos[i * 3] = Math.cos(angle) * r;
    dPos[i * 3 + 1] = Math.random() * 2.5;
    dPos[i * 3 + 2] = Math.sin(angle) * r;
    dData[i * 3] = 0.1 + Math.random() * 0.3;
    dData[i * 3 + 1] = Math.random() * Math.PI * 2;
    dData[i * 3 + 2] = 2 + Math.random() * 5;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  dustGeo.setAttribute("aData", new THREE.BufferAttribute(dData, 3));

  const dustMat = new THREE.ShaderMaterial({
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
        pos.x += sin(uTime * aData.x + aData.y) * 0.15;
        pos.y += sin(uTime * 0.3 + aData.y) * 0.1;
        pos.z += cos(uTime * aData.x * 0.8 + aData.y) * 0.15;
        vAlpha = 0.35 + 0.25 * sin(uTime + aData.y);

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aData.z * uPixelRatio * (100.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float soft = pow(1.0 - smoothstep(0.0, 0.5, d), 1.8);
        vec3 col = vec3(0.55, 0.7, 0.35);
        gl_FragColor = vec4(col, soft * vAlpha * 0.5);
      }
    `,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  group.add(dust);

  let time = 0;

  function update(dt) {
    time += dt;
    dustMat.uniforms.uTime.value = time;

    core.rotation.y += dt * 0.08;
    moss.rotation.y += dt * 0.08;

    earthLight.intensity = 2.5 + Math.sin(time * 1.2) * 0.4;
    crystalLight.intensity = 1.5 + Math.sin(time * 2.5) * 0.6;

    for (const rock of rocks) {
      const u = rock.userData;
      u.angle += dt * u.orbitSpeed * 0.3;
      rock.position.x = Math.cos(u.angle) * u.radius;
      rock.position.z = Math.sin(u.angle) * u.radius;
      rock.position.y = u.y + Math.sin(time * 1.2 + u.bobPhase) * u.bobAmp;
      rock.rotation.x += u.spin.x * dt;
      rock.rotation.y += u.spin.y * dt;
      rock.rotation.z += u.spin.z * dt;
    }

    for (let i = 0; i < spikes.length; i++) {
      const s = spikes[i];
      s.material.emissiveIntensity = 0.25 + Math.sin(time * 2 + i) * 0.15;
      s.position.y = 1.55 + Math.sin(time * 1.5 + i * 0.8) * 0.03;
    }
  }

  function onResize(pixelRatio) {
    dustMat.uniforms.uPixelRatio.value = pixelRatio;
  }

  return { group, update, onResize };
}
