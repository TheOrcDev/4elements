import * as THREE from 'three';

// A small deterministic geology toolkit. Every feature follows the same surface
// function, so the moss, seams and mineral outcrops stay attached to the stone.
function randomGenerator(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(x, y, z) {
  const value = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}

function noise(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);
  const mix = THREE.MathUtils.lerp;
  return mix(
    mix(mix(hash(ix, iy, iz), hash(ix + 1, iy, iz), ux),
      mix(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), ux), uy),
    mix(mix(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), ux),
      mix(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), ux), uy), uz);
}

function fractal(x, y, z) {
  return noise(x, y, z) * 0.58
    + noise(x * 2.07 + 12, y * 2.07 + 8, z * 2.07 + 4) * 0.28
    + noise(x * 4.13, y * 4.13, z * 4.13) * 0.14;
}

function surfaceRadius(direction) {
  const broad = fractal(direction.x * 3.1 + 3, direction.y * 3.1, direction.z * 3.1);
  const strata = Math.sin(direction.y * 42 + broad * 5);
  return 1.005 + (broad - 0.45) * 0.25 + strata * 0.009;
}

function surfacePoint(direction, lift = 0) {
  const point = direction.clone().multiplyScalar(surfaceRadius(direction) + lift);
  point.y *= 1.07;
  return point;
}

function basis(direction) {
  const u = new THREE.Vector3().crossVectors(direction,
    Math.abs(direction.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
  return [u, new THREE.Vector3().crossVectors(direction, u).normalize()];
}

function makeStoneMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.9, metalness: 0.08,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec3 vStonePosition;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvStonePosition = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
      #include <common>
      varying vec3 vStonePosition;
      float stoneHash(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
      float stoneNoise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(mix(stoneHash(i), stoneHash(i+vec3(1,0,0)), f.x),
          mix(stoneHash(i+vec3(0,1,0)), stoneHash(i+vec3(1,1,0)), f.x), f.y),
          mix(mix(stoneHash(i+vec3(0,0,1)), stoneHash(i+vec3(1,0,1)), f.x),
          mix(stoneHash(i+vec3(0,1,1)), stoneHash(i+vec3(1,1,1)), f.x), f.y), f.z);
      }
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float stoneGrain = stoneNoise(vStonePosition * 95.0);
      float stoneVein = stoneNoise(vStonePosition * 9.0);
      diffuseColor.rgb *= 0.82 + stoneGrain * 0.3;
      diffuseColor.rgb *= 1.0 - smoothstep(0.68, 0.78, stoneVein) * 0.28;
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `
      #include <normal_fragment_maps>
      vec3 stoneDx = dFdx(-vViewPosition), stoneDy = dFdy(-vViewPosition);
      vec3 stoneR1 = cross(stoneDy, normal), stoneR2 = cross(normal, stoneDx);
      float stoneDet = dot(stoneDx, stoneR1);
      vec3 stoneGradient = sign(stoneDet) * (dFdx(stoneGrain) * stoneR1 + dFdy(stoneGrain) * stoneR2);
      normal = normalize(abs(stoneDet) * normal - 0.0014 * stoneGradient);
    `);
  };
  material.customProgramCacheKey = () => 'element-earth-granite-v1';
  return material;
}

function makeCoreGeometry() {
  const geometry = new THREE.IcosahedronGeometry(1, 7);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const direction = new THREE.Vector3();
  const color = new THREE.Color();
  const charcoal = new THREE.Color('#262d26');
  const brown = new THREE.Color('#625e46');
  const sandstone = new THREE.Color('#a38c60');
  for (let i = 0; i < position.count; i++) {
    direction.fromBufferAttribute(position, i).normalize();
    const point = surfacePoint(direction);
    position.setXYZ(i, point.x, point.y, point.z);
    const variation = fractal(direction.x * 7, direction.y * 7, direction.z * 7);
    const layer = 0.5 + 0.5 * Math.sin(direction.y * 39 + variation * 5);
    color.copy(charcoal).lerp(brown, 0.32 + variation * 0.65);
    color.lerp(sandstone, Math.pow(layer, 7) * 0.45);
    colors.set([color.r, color.g, color.b], i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function makeMossPatch(direction, angularRadius, index) {
  const [u, v] = basis(direction);
  const positions = [], colors = [];
  const rings = 7, sectors = 28;
  const dark = new THREE.Color('#174b2e');
  const light = new THREE.Color('#5c9860');
  function vertex(radius, angle) {
    const edge = 1 + Math.sin(angle * 3 + index) * 0.15 + Math.sin(angle * 7 - index) * 0.08;
    const d = direction.clone().addScaledVector(u, Math.cos(angle) * radius * angularRadius * edge)
      .addScaledVector(v, Math.sin(angle) * radius * angularRadius * edge).normalize();
    const point = surfacePoint(d, 0.009 + (1 - radius) * 0.013);
    const variation = fractal(d.x * 18, d.y * 18, d.z * 18);
    const color = dark.clone().lerp(light, variation);
    return { point, color };
  }
  function push(p) {
    positions.push(p.point.x, p.point.y, p.point.z);
    colors.push(p.color.r, p.color.g, p.color.b);
  }
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < sectors; s++) {
      const a = s / sectors * Math.PI * 2, b = (s + 1) / sectors * Math.PI * 2;
      const p0 = vertex(r / rings, a), p1 = vertex((r + 1) / rings, a);
      const p2 = vertex((r + 1) / rings, b), p3 = vertex(r / rings, b);
      push(p0); push(p1); push(p2);
      if (r > 0) { push(p0); push(p2); push(p3); }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function makeCrystalGeometry() {
  const positions = [];
  const radius = 0.085, height = 0.42;
  const point = (angle, y, r) => [Math.cos(angle) * r, y, Math.sin(angle) * r];
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2, b = (i + 1) / 6 * Math.PI * 2;
    positions.push(...point(a, 0, radius), ...point(b, 0, radius), ...point(b, height * 0.7, radius));
    positions.push(...point(a, 0, radius), ...point(b, height * 0.7, radius), ...point(a, height * 0.7, radius));
    positions.push(...point(a, height * 0.7, radius), ...point(b, height * 0.7, radius), 0, height, 0);
  }
  // The angular ring runs clockwise when viewed from above.
  for (let i = 0; i < positions.length; i += 9) {
    for (let component = 0; component < 3; component++) {
      const temporary = positions[i + 3 + component];
      positions[i + 3 + component] = positions[i + 6 + component];
      positions[i + 6 + component] = temporary;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createEarth() {
  const group = new THREE.Group();
  group.name = 'Earth — living geology';
  const world = new THREE.Group();
  world.position.y = 0.06;
  group.add(world);
  const random = randomGenerator(70421);
  const stoneMaterial = makeStoneMaterial();
  const core = new THREE.Mesh(makeCoreGeometry(), stoneMaterial);
  core.castShadow = true;
  core.receiveShadow = true;
  world.add(core);

  const mossMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.98,
    side: THREE.DoubleSide,
  });
  const mossCenters = [
    [0.48, 0.7, 0.55, 0.38], [-0.62, 0.38, 0.68, 0.29], [0.18, -0.28, 0.95, 0.22],
    [0.8, -0.15, -0.5, 0.28], [-0.45, 0.75, -0.5, 0.32], [-0.7, -0.43, -0.58, 0.24],
    [0.25, 0.5, -0.8, 0.26], [-0.89, -0.2, 0.35, 0.2],
  ];
  mossCenters.forEach(([x, y, z, radius], index) => {
    const direction = new THREE.Vector3(x, y, z).normalize();
    const patch = new THREE.Mesh(makeMossPatch(direction, radius, index), mossMaterial);
    patch.receiveShadow = true;
    world.add(patch);
  });

  // Discrete plate-like inclusions create a fractured silhouette and exposed
  // strata, while moss tufts add a much finer scale of surface detail.
  const shardGeometry = new THREE.IcosahedronGeometry(1, 0);
  const shardMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.1 });
  const shards = new THREE.InstancedMesh(shardGeometry, shardMaterial, 118);
  const dummy = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();
  for (let i = 0; i < shards.count; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / shards.count);
    const theta = i * 2.399963;
    const direction = new THREE.Vector3(Math.cos(theta) * Math.sin(phi), Math.cos(phi), Math.sin(theta) * Math.sin(phi));
    dummy.position.copy(surfacePoint(direction, -0.012));
    dummy.quaternion.setFromUnitVectors(up, direction);
    dummy.rotateY(random() * Math.PI * 2);
    const size = 0.047 + random() * 0.092;
    dummy.scale.set(size * (1 + random() * 0.6), size * 0.43, size * (0.7 + random() * 0.65));
    dummy.updateMatrix();
    shards.setMatrixAt(i, dummy.matrix);
    color.set('#343c2e').lerp(new THREE.Color('#9a8863'), random());
    shards.setColorAt(i, color);
  }
  shards.castShadow = true;
  shards.receiveShadow = true;
  world.add(shards);

  const tuftMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
  const tufts = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), tuftMaterial, 470);
  for (let i = 0; i < tufts.count; i++) {
    const [x, y, z, radius] = mossCenters[i % mossCenters.length];
    const center = new THREE.Vector3(x, y, z).normalize();
    const [u, v] = basis(center);
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * radius * 0.87;
    const direction = center.addScaledVector(u, Math.cos(angle) * distance)
      .addScaledVector(v, Math.sin(angle) * distance).normalize();
    dummy.position.copy(surfacePoint(direction, 0.022));
    dummy.quaternion.setFromUnitVectors(up, direction);
    const size = 0.008 + random() * 0.018;
    dummy.scale.set(size * 1.4, size * 0.7, size);
    dummy.updateMatrix();
    tufts.setMatrixAt(i, dummy.matrix);
    color.set('#234e2e').lerp(new THREE.Color('#9bb76b'), random() * 0.8);
    tufts.setColorAt(i, color);
  }
  world.add(tufts);

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: '#cbb06e', metalness: 0.85, roughness: 0.26,
    emissive: '#8c6624', emissiveIntensity: 0.12,
  });
  const seamRoots = [
    new THREE.Vector3(0.46, 0.34, 0.83).normalize(),
    new THREE.Vector3(-0.73, -0.1, 0.68).normalize(),
    new THREE.Vector3(0.17, 0.51, -0.82).normalize(),
    new THREE.Vector3(-0.43, -0.66, -0.6).normalize(),
  ];
  seamRoots.forEach((center, index) => {
    const [u, v] = basis(center);
    const points = [];
    for (let i = 0; i < 26; i++) {
      const t = i / 25;
      const direction = center.clone().addScaledVector(v, (t - 0.5) * 0.9)
        .addScaledVector(u, Math.sin(t * 13 + index) * 0.075 + Math.sin(t * 32) * 0.02).normalize();
      points.push(surfacePoint(direction, 0.013));
    }
    world.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 74, 0.006, 5, false), goldMaterial));
  });

  const crystals = new THREE.InstancedMesh(makeCrystalGeometry(), new THREE.MeshPhysicalMaterial({
    color: '#abcbb3', metalness: 0.12, roughness: 0.22,
    transmission: 0.16, thickness: 0.2, clearcoat: 1,
    emissive: '#40634a', emissiveIntensity: 0.17,
  }), 35);
  const crystalRoots = [new THREE.Vector3(0.48, 0.57, 0.63).normalize(),
    new THREE.Vector3(-0.7, -0.32, 0.58).normalize(), new THREE.Vector3(0.47, 0.04, -0.84).normalize()];
  for (let i = 0; i < crystals.count; i++) {
    const center = crystalRoots[i % crystalRoots.length];
    const [u, v] = basis(center);
    const direction = center.clone().addScaledVector(u, (random() - 0.5) * 0.25)
      .addScaledVector(v, (random() - 0.5) * 0.25).normalize();
    dummy.position.copy(surfacePoint(direction, 0.015));
    dummy.quaternion.setFromUnitVectors(up, direction);
    dummy.rotateY(random() * 6.28);
    const size = 0.24 + random() * 0.43;
    dummy.scale.set(size * 0.7, size * (0.6 + random() * 0.7), size * 0.7);
    dummy.updateMatrix();
    crystals.setMatrixAt(i, dummy.matrix);
  }
  crystals.castShadow = true;
  world.add(crystals);

  const flecks = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1), goldMaterial, 92);
  for (let i = 0; i < flecks.count; i++) {
    const direction = new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize();
    dummy.position.copy(surfacePoint(direction, 0.012));
    dummy.rotation.set(random() * 6.28, random() * 6.28, random() * 6.28);
    const size = 0.005 + random() * 0.012;
    dummy.scale.set(size, size * 0.5, size * 1.8);
    dummy.updateMatrix();
    flecks.setMatrixAt(i, dummy.matrix);
  }
  world.add(flecks);

  const orbiters = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), shardMaterial, 18);
  const orbits = [];
  for (let i = 0; i < orbiters.count; i++) {
    orbits.push({
      angle: random() * Math.PI * 2,
      radius: 1.18 + random() * 0.2,
      height: (random() - 0.5) * 1.9,
      size: 0.022 + random() * 0.07,
      speed: (random() - 0.5) * 0.12,
      phase: random() * Math.PI * 2,
    });
    orbiters.setColorAt(i, new THREE.Color('#45493a').lerp(new THREE.Color('#b1a073'), random()));
  }
  orbiters.castShadow = true;
  group.add(orbiters);

  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(120 * 3);
  for (let i = 0; i < 120; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 1.15 + random() * 0.29;
    dustPositions[i * 3] = Math.cos(angle) * radius;
    dustPositions[i * 3 + 1] = (random() - 0.5) * 2.55;
    dustPositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({
    color: '#d1b577', size: 0.012, transparent: true, opacity: 0.48,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  group.add(dust);

  function update(time, delta, { intensity = 1 } = {}) {
    world.position.y = 0.06 + Math.sin(time * 0.42) * 0.045;
    world.rotation.y = time * 0.045;
    world.rotation.z = Math.sin(time * 0.17) * 0.018;
    dust.rotation.y = -time * 0.022;
    dust.material.opacity = 0.25 + Math.min(intensity, 2) * 0.14;
    goldMaterial.emissiveIntensity = 0.08 + intensity * 0.1;
    for (let i = 0; i < orbits.length; i++) {
      const orbit = orbits[i];
      const angle = orbit.angle + time * orbit.speed;
      dummy.position.set(Math.cos(angle) * orbit.radius,
        orbit.height + Math.sin(time * 0.5 + orbit.phase) * 0.04, Math.sin(angle) * orbit.radius);
      dummy.rotation.set(time * 0.17 + orbit.phase, angle, time * 0.08 + orbit.phase);
      dummy.scale.set(orbit.size * 1.15, orbit.size * 0.8, orbit.size);
      dummy.updateMatrix();
      orbiters.setMatrixAt(i, dummy.matrix);
    }
    orbiters.instanceMatrix.needsUpdate = true;
  }

  update(0, 0);
  return {
    group,
    update,
    dispose() {
      const geometries = new Set();
      const materials = new Set();
      group.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) materials.add(object.material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}
