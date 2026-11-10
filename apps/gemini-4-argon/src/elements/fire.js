import * as THREE from 'three'
import { createParticleSystem, createPedestal, createSoftCircleTexture } from '../utils/particles.js'

const flameVertex = /* glsl */ `
  varying vec2 vUv;
  varying float vY;
  void main() {
    vUv = uv;
    vY = position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const flameFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorCore;
  uniform vec3 uColorMid;
  uniform vec3 uColorTip;
  varying vec2 vUv;
  varying float vY;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.05;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float height = clamp((vY + 0.2) / 2.4, 0.0, 1.0);
    float n = fbm(vec2(uv.x * 3.5, uv.y * 2.2 - uTime * 1.8));
    float shape = 1.0 - abs(uv.x - 0.5) * 2.0;
    shape = pow(max(shape, 0.0), 1.35);
    float flame = shape * (0.55 + 0.7 * n) * (1.0 - pow(height, 1.45));
    flame = smoothstep(0.12, 0.72, flame);

    vec3 col = mix(uColorCore, uColorMid, height);
    col = mix(col, uColorTip, pow(height, 1.8));
    float alpha = flame * (0.95 - height * 0.55);
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(col, alpha);
  }
`

function createFlameSheet(radius, height, colorCore, colorMid, colorTip, opacity = 1) {
  const geometry = new THREE.CylinderGeometry(radius * 0.15, radius, height, 32, 24, true)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorCore: { value: new THREE.Color(colorCore) },
      uColorMid: { value: new THREE.Color(colorMid) },
      uColorTip: { value: new THREE.Color(colorTip) },
    },
    vertexShader: flameVertex,
    fragmentShader: flameFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })
  material.opacity = opacity
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = height * 0.45
  return mesh
}

export function createFire() {
  const root = new THREE.Group()
  root.name = 'fire'
  root.add(createPedestal(0xff6a2b))

  const body = new THREE.Group()
  body.position.y = 0.25
  root.add(body)

  const flames = [
    createFlameSheet(0.55, 2.1, '#fff1b8', '#ff7a2f', '#ff2d00'),
    createFlameSheet(0.38, 2.5, '#ffe29a', '#ff8f3d', '#ff4500'),
    createFlameSheet(0.22, 2.9, '#ffffff', '#ffd27a', '#ff6a2b'),
  ]
  flames[1].rotation.y = Math.PI / 3
  flames[2].rotation.y = Math.PI / 1.5
  flames.forEach((f) => body.add(f))

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 24, 24),
    new THREE.MeshStandardMaterial({
      color: 0xffe7a8,
      emissive: 0xff8a2b,
      emissiveIntensity: 2.4,
      roughness: 0.2,
      metalness: 0.1,
    }),
  )
  core.position.y = 0.45
  body.add(core)

  const softMap = createSoftCircleTexture()
  const embers = createParticleSystem({
    count: 420,
    size: 0.12,
    color: 0xff9a4a,
    map: softMap,
    opacity: 0.95,
  })
  body.add(embers)

  const sparks = createParticleSystem({
    count: 160,
    size: 0.07,
    color: 0xfff0c2,
    map: softMap,
    opacity: 1,
  })
  body.add(sparks)

  const light = new THREE.PointLight(0xff7a2b, 4.5, 10, 1.6)
  light.position.set(0, 1.4, 0)
  body.add(light)

  const state = {
    flames,
    embers,
    sparks,
    light,
    core,
    body,
  }

  // initialize particles
  const ePos = embers.geometry.attributes.position.array
  const eVel = embers.userData.velocities
  const eLife = embers.userData.lifetimes
  for (let i = 0; i < embers.userData.count; i++) {
    resetEmber(i, ePos, eVel, eLife, true)
  }

  const sPos = sparks.geometry.attributes.position.array
  const sVel = sparks.userData.velocities
  const sLife = sparks.userData.lifetimes
  for (let i = 0; i < sparks.userData.count; i++) {
    resetSpark(i, sPos, sVel, sLife, true)
  }

  function resetEmber(i, pos, vel, life, randomize = false) {
    const a = Math.random() * Math.PI * 2
    const r = Math.random() * 0.35
    pos[i * 3] = Math.cos(a) * r
    pos[i * 3 + 1] = randomize ? Math.random() * 2.2 : 0.1 + Math.random() * 0.2
    pos[i * 3 + 2] = Math.sin(a) * r
    vel[i * 3] = (Math.random() - 0.5) * 0.25
    vel[i * 3 + 1] = 0.8 + Math.random() * 1.4
    vel[i * 3 + 2] = (Math.random() - 0.5) * 0.25
    life[i] = randomize ? Math.random() : 0
  }

  function resetSpark(i, pos, vel, life, randomize = false) {
    const a = Math.random() * Math.PI * 2
    const r = 0.1 + Math.random() * 0.25
    pos[i * 3] = Math.cos(a) * r
    pos[i * 3 + 1] = randomize ? Math.random() * 1.8 : 0.3
    pos[i * 3 + 2] = Math.sin(a) * r
    vel[i * 3] = Math.cos(a) * (0.4 + Math.random() * 0.6)
    vel[i * 3 + 1] = 1.2 + Math.random() * 1.8
    vel[i * 3 + 2] = Math.sin(a) * (0.4 + Math.random() * 0.6)
    life[i] = randomize ? Math.random() : 0
  }

  root.userData.update = (t, dt) => {
    state.flames.forEach((flame, idx) => {
      flame.material.uniforms.uTime.value = t * (1.1 + idx * 0.15)
      flame.rotation.y += dt * (0.15 + idx * 0.08)
      flame.scale.x = 1 + Math.sin(t * 3 + idx) * 0.04
      flame.scale.z = 1 + Math.cos(t * 2.6 + idx) * 0.04
    })

    state.core.scale.setScalar(0.95 + Math.sin(t * 8) * 0.08)
    state.light.intensity = 3.8 + Math.sin(t * 11) * 0.9 + Math.sin(t * 23) * 0.35
    state.body.rotation.y = Math.sin(t * 0.4) * 0.08

    for (let i = 0; i < state.embers.userData.count; i++) {
      eLife[i] += dt * 0.45
      ePos[i * 3] += eVel[i * 3] * dt
      ePos[i * 3 + 1] += eVel[i * 3 + 1] * dt
      ePos[i * 3 + 2] += eVel[i * 3 + 2] * dt
      eVel[i * 3] += Math.sin(t * 4 + i) * 0.15 * dt
      eVel[i * 3 + 2] += Math.cos(t * 3.5 + i) * 0.15 * dt
      if (eLife[i] > 1 || ePos[i * 3 + 1] > 2.8) {
        resetEmber(i, ePos, eVel, eLife)
      }
    }
    state.embers.geometry.attributes.position.needsUpdate = true

    for (let i = 0; i < state.sparks.userData.count; i++) {
      sLife[i] += dt * 0.7
      sPos[i * 3] += sVel[i * 3] * dt
      sPos[i * 3 + 1] += sVel[i * 3 + 1] * dt
      sPos[i * 3 + 2] += sVel[i * 3 + 2] * dt
      sVel[i * 3 + 1] -= 0.6 * dt
      if (sLife[i] > 1 || sPos[i * 3 + 1] < 0) {
        resetSpark(i, sPos, sVel, sLife)
      }
    }
    state.sparks.geometry.attributes.position.needsUpdate = true
  }

  root.userData.focusPoint = new THREE.Vector3(0, 1.4, 0)
  return root
}
