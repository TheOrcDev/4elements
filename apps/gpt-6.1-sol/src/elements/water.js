import * as THREE from 'three';

const TAU = Math.PI * 2;

function liquidMaterial() {
  const uniforms = {
    uWaterTime: { value: 0 },
    uWaterPower: { value: 1 },
  };
  const material = new THREE.MeshPhysicalMaterial({
    color: '#0365a6',
    roughness: 0.022,
    metalness: 0,
    transmission: 0.72,
    thickness: 1.4,
    ior: 1.333,
    clearcoat: 0.65,
    clearcoatRoughness: 0.01,
    attenuationColor: new THREE.Color('#0068b0'),
    attenuationDistance: 0.95,
    envMapIntensity: 1.05,
    emissive: '#00345b',
    emissiveIntensity: 0.04,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      uniform float uWaterTime;
      uniform float uWaterPower;
      varying vec3 vLiquidPosition;
      float liquidWave(vec3 p) {
        float t = uWaterTime * .72;
        float broad = sin(p.x * 5.6 + p.y * 3.2 + t) * sin(p.z * 4.0 - p.y * 2.7 - t * .83);
        float cross = sin(dot(p, vec3(-4.2, 6.8, 3.1)) - t * 1.24) * sin(dot(p, vec3(3.5, 2.1, -5.4)) + t * .67);
        float fine = sin(p.x * 14.0 - p.z * 11.0 + t * 1.9) * sin(p.y * 12.0 + t * 1.2);
        float capillary = sin(dot(p, vec3(24.0, -14.0, 19.0)) + t * 2.7);
        return (.041 * broad + .022 * cross + .008 * fine + .0025 * capillary) * uWaterPower;
      }`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `#include <beginnormal_vertex>
      float d = .006;
      vec3 grad = vec3(
        liquidWave(position + vec3(d,0.,0.)) - liquidWave(position - vec3(d,0.,0.)),
        liquidWave(position + vec3(0.,d,0.)) - liquidWave(position - vec3(0.,d,0.)),
        liquidWave(position + vec3(0.,0.,d)) - liquidWave(position - vec3(0.,0.,d))
      ) / (2. * d);
      objectNormal = normalize(objectNormal - grad + objectNormal * dot(grad, objectNormal));`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      transformed += normal * liquidWave(position);
      vLiquidPosition = transformed;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      uniform float uWaterTime;
      varying vec3 vLiquidPosition;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      float fold = sin(vLiquidPosition.y * 10.0 + vLiquidPosition.x * 4.0 + sin(vLiquidPosition.z * 6.0 + uWaterTime * .42));
      diffuseColor.rgb *= mix(vec3(.22,.57,.92), vec3(.62,1.0,1.12), smoothstep(-.85,.75,fold));`,
    );
  };
  material.customProgramCacheKey = () => 'element-liquid-v1';
  return { material, uniforms };
}

function flowingArc(radius, start, span, height, tilt) {
  const points = [];
  for (let i = 0; i <= 180; i++) {
    const t = i / 180;
    const a = start + span * t;
    points.push(new THREE.Vector3(
      Math.cos(a) * radius * (1 + .035 * Math.sin(a * 3)),
      height + Math.sin(a) * tilt + .075 * Math.sin(a * 2),
      Math.sin(a) * radius,
    ));
  }
  return new THREE.CatmullRomCurve3(points);
}

export function createWater() {
  const group = new THREE.Group();
  const { material, uniforms } = liquidMaterial();
  const orb = new THREE.Mesh(new THREE.SphereGeometry(.91, 112, 80), material);
  orb.position.y = .02;
  orb.castShadow = true;
  group.add(orb);

  const streamMaterial = new THREE.MeshPhysicalMaterial({
    color: '#087ead',
    roughness: .018,
    metalness: 0,
    clearcoat: .5,
    transmission: .72,
    thickness: .16,
    ior: 1.333,
    attenuationColor: new THREE.Color('#0082b4'),
    attenuationDistance: .5,
    envMapIntensity: 1.05,
    emissive: '#003450',
    emissiveIntensity: .05,
  });
  const streams = new THREE.Group();
  group.add(streams);
  const arcs = [
    flowingArc(1.11, -.3, TAU * .89, -.09, .39),
    flowingArc(1.01, 1.4, TAU * .83, .04, -.67),
    flowingArc(.96, -2.1, TAU * .67, .06, .91),
  ];
  arcs.forEach((curve, i) => {
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 180, .021 + i * .008, 8, false), streamMaterial);
    tube.rotation.y = i * .37;
    streams.add(tube);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.055, 20, 16), streamMaterial);
    tip.position.copy(curve.getPoint(1));
    tip.rotation.y = i * .37;
    tube.add(tip);
  });

  // A thin sheet at the equator catches the room lights like the lip of a breaking wave.
  const crestGeometry = new THREE.BufferGeometry();
  const crestPositions = [];
  const crestIndices = [];
  for (let i = 0; i <= 160; i++) {
    const t = i / 160;
    const a = t * TAU * .79 - .8;
    const width = .045 + Math.sin(t * Math.PI) * .11;
    const r = 1.085 + Math.sin(a * 2) * .018;
    const y = .02 + Math.sin(a) * .38;
    for (const side of [-1, 1]) {
      crestPositions.push(Math.cos(a) * (r + side * width * .5), y + side * width * .34, Math.sin(a) * (r + side * width * .5));
    }
    if (i < 160) {
      const n = i * 2;
      crestIndices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
  }
  crestGeometry.setAttribute('position', new THREE.Float32BufferAttribute(crestPositions, 3));
  crestGeometry.setIndex(crestIndices);
  crestGeometry.computeVertexNormals();
  const crestMaterial = streamMaterial.clone();
  crestMaterial.side = THREE.DoubleSide;
  crestMaterial.transmission = .82;
  crestMaterial.thickness = .075;
  streams.add(new THREE.Mesh(crestGeometry, crestMaterial));

  const dropletGeometry = new THREE.SphereGeometry(1, 16, 12);
  const dropletMaterial = streamMaterial.clone();
  dropletMaterial.color.set('#168eb6');
  dropletMaterial.transmission = .8;
  dropletMaterial.thickness = .09;
  const droplets = new THREE.InstancedMesh(dropletGeometry, dropletMaterial, 70);
  droplets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  const seeds = Array.from({ length: 70 }, (_, i) => ({
    angle: i * 2.399963,
    height: Math.sin(i * 13.713) * 1.07,
    radius: 1.14 + (.5 + .5 * Math.sin(i * 5.73)) * .22,
    size: .012 + (.5 + .5 * Math.cos(i * 6.31)) * .031,
    speed: .08 + (i % 7) * .017,
  }));
  group.add(droplets);

  const glints = new THREE.BufferGeometry();
  const glintPositions = new Float32Array(60 * 3);
  for (let i = 0; i < 60; i++) {
    const a = i * 2.399963;
    const y = Math.sin(i * 41.17) * 1.05;
    const r = 1.17 + .12 * Math.sin(i * 7.1);
    glintPositions.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
  }
  glints.setAttribute('position', new THREE.BufferAttribute(glintPositions, 3));
  const glintMaterial = new THREE.PointsMaterial({ color: '#8cdbff', size: .009, transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false });
  const sparkles = new THREE.Points(glints, glintMaterial);
  group.add(sparkles);

  const update = (time, delta, { intensity = 1 } = {}) => {
    uniforms.uWaterTime.value = time;
    uniforms.uWaterPower.value = .6 + intensity * .4;
    orb.rotation.y = time * .075;
    orb.position.y = .02 + Math.sin(time * .8) * .035;
    streams.rotation.y = time * .115;
    streams.rotation.z = Math.sin(time * .38) * .055;
    sparkles.rotation.y = -time * .095;
    glintMaterial.opacity = .26 + .1 * Math.sin(time * 1.7);
    seeds.forEach((seed, i) => {
      const a = seed.angle + time * seed.speed * (.5 + intensity * .5);
      dummy.position.set(Math.cos(a) * seed.radius, seed.height + Math.sin(time * .7 + i) * .065, Math.sin(a) * seed.radius);
      dummy.scale.set(seed.size, seed.size * (1.35 + .4 * Math.sin(a)), seed.size);
      dummy.rotation.set(.12 * Math.sin(a), a, .12 * Math.cos(a));
      dummy.updateMatrix();
      droplets.setMatrixAt(i, dummy.matrix);
    });
    droplets.instanceMatrix.needsUpdate = true;
  };
  update(0, 0, { intensity: 1 });
  return { group, update };
}
