import * as THREE from 'three'
import { createParticleSystem, createPedestal, createSoftCircleTexture } from '../utils/particles.js'

const waterVertex = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying float vWave;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;
    float w1 = sin(pos.x * 4.0 + uTime * 2.2) * 0.06;
    float w2 = cos(pos.z * 5.0 - uTime * 1.8) * 0.05;
    float w3 = sin((pos.x + pos.z) * 3.0 + uTime * 2.8) * 0.04;
    vWave = w1 + w2 + w3;
    pos += normal * vWave;
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const waterFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uFresnel;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying float vWave;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorld);
    float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 2.8);
    float foam = smoothstep(0.04, 0.1, abs(vWave));
    vec3 col = mix(uDeep, uShallow, fresnel * 0.55 + foam * 0.3);
    col += uFresnel * fresnel * 0.35;
    col += vec3(0.35, 0.7, 0.95) * foam * 0.2;
    float alpha = 0.72 + fresnel * 0.22;
    gl_FragColor = vec4(col, alpha);
  }
`

export function createWater() {
  const root = new THREE.Group()
  root.name = 'water'
  root.add(createPedestal(0x3db7ff))

  const body = new THREE.Group()
  body.position.y = 0.25
  root.add(body)

  const orbMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#053a62') },
      uShallow: { value: new THREE.Color('#2ea0e8') },
      uFresnel: { value: new THREE.Color('#7ed7ff') },
    },
    vertexShader: waterVertex,
    fragmentShader: waterFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.85, 96, 96), orbMat)
  orb.position.y = 1.15
  body.add(orb)

  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 48, 48),
    new THREE.MeshStandardMaterial({
      color: 0x0d6ea8,
      roughness: 0.15,
      metalness: 0.35,
      transparent: true,
      opacity: 0.85,
      emissive: 0x0870b0,
      emissiveIntensity: 0.55,
    }),
  )
  inner.position.y = 1.15
  body.add(inner)

  const rings = []
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55 + i * 0.22, 0.018, 12, 64),
      new THREE.MeshBasicMaterial({
        color: 0x8adfff,
        transparent: true,
        opacity: 0.35 - i * 0.08,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.35
    body.add(ring)
    rings.push(ring)
  }

  const softMap = createSoftCircleTexture()
  const bubbles = createParticleSystem({
    count: 280,
    size: 0.09,
    color: 0xb8ecff,
    map: softMap,
    opacity: 0.85,
  })
  body.add(bubbles)

  const droplets = createParticleSystem({
    count: 120,
    size: 0.06,
    color: 0xe8f8ff,
    map: softMap,
    opacity: 0.9,
  })
  body.add(droplets)

  const light = new THREE.PointLight(0x3db7ff, 3.2, 9, 1.5)
  light.position.set(0, 1.4, 0)
  body.add(light)

  const mist = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x6ecfff,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  mist.position.y = 1.15
  body.add(mist)

  const bPos = bubbles.geometry.attributes.position.array
  const bVel = bubbles.userData.velocities
  const bLife = bubbles.userData.lifetimes
  for (let i = 0; i < bubbles.userData.count; i++) resetBubble(i, bPos, bVel, bLife, true)

  const dPos = droplets.geometry.attributes.position.array
  const dVel = droplets.userData.velocities
  const dLife = droplets.userData.lifetimes
  for (let i = 0; i < droplets.userData.count; i++) resetDroplet(i, dPos, dVel, dLife, true)

  function resetBubble(i, pos, vel, life, randomize = false) {
    const a = Math.random() * Math.PI * 2
    const r = Math.random() * 0.55
    pos[i * 3] = Math.cos(a) * r
    pos[i * 3 + 1] = randomize ? 0.4 + Math.random() * 1.6 : 0.35 + Math.random() * 0.3
    pos[i * 3 + 2] = Math.sin(a) * r
    vel[i * 3] = (Math.random() - 0.5) * 0.15
    vel[i * 3 + 1] = 0.35 + Math.random() * 0.55
    vel[i * 3 + 2] = (Math.random() - 0.5) * 0.15
    life[i] = randomize ? Math.random() : 0
  }

  function resetDroplet(i, pos, vel, life, randomize = false) {
    const a = Math.random() * Math.PI * 2
    const r = 0.7 + Math.random() * 0.35
    pos[i * 3] = Math.cos(a) * r
    pos[i * 3 + 1] = randomize ? 0.8 + Math.random() * 1.4 : 1.5 + Math.random() * 0.4
    pos[i * 3 + 2] = Math.sin(a) * r
    vel[i * 3] = -Math.cos(a) * 0.2
    vel[i * 3 + 1] = -0.4 - Math.random() * 0.5
    vel[i * 3 + 2] = -Math.sin(a) * 0.2
    life[i] = randomize ? Math.random() : 0
  }

  root.userData.update = (t, dt) => {
    orbMat.uniforms.uTime.value = t
    orb.rotation.y = t * 0.15
    inner.rotation.y = -t * 0.22
    mist.scale.setScalar(1 + Math.sin(t * 1.4) * 0.05)
    light.intensity = 2.8 + Math.sin(t * 2.2) * 0.4

    rings.forEach((ring, i) => {
      const pulse = (t * 0.7 + i * 0.45) % 1
      ring.scale.setScalar(0.7 + pulse * 1.4)
      ring.material.opacity = (1 - pulse) * (0.35 - i * 0.06)
      ring.position.y = 0.35 + pulse * 0.15
    })

    for (let i = 0; i < bubbles.userData.count; i++) {
      bLife[i] += dt * 0.35
      bPos[i * 3] += bVel[i * 3] * dt + Math.sin(t * 3 + i) * 0.01
      bPos[i * 3 + 1] += bVel[i * 3 + 1] * dt
      bPos[i * 3 + 2] += bVel[i * 3 + 2] * dt + Math.cos(t * 2.5 + i) * 0.01
      if (bLife[i] > 1 || bPos[i * 3 + 1] > 2.4) resetBubble(i, bPos, bVel, bLife)
    }
    bubbles.geometry.attributes.position.needsUpdate = true

    for (let i = 0; i < droplets.userData.count; i++) {
      dLife[i] += dt * 0.55
      dPos[i * 3] += dVel[i * 3] * dt
      dPos[i * 3 + 1] += dVel[i * 3 + 1] * dt
      dPos[i * 3 + 2] += dVel[i * 3 + 2] * dt
      if (dLife[i] > 1 || dPos[i * 3 + 1] < 0.2) resetDroplet(i, dPos, dVel, dLife)
    }
    droplets.geometry.attributes.position.needsUpdate = true
  }

  root.userData.focusPoint = new THREE.Vector3(0, 1.3, 0)
  return root
}
