import * as THREE from 'three'
import { createParticleSystem, createPedestal, createSoftCircleTexture } from '../utils/particles.js'

function makeCrystal(radius, detail, color, emissive, y, rot) {
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, detail),
    new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 0.35,
      metalness: 0.45,
      roughness: 0.28,
      flatShading: true,
    }),
  )
  mesh.position.y = y
  mesh.rotation.set(rot.x, rot.y, rot.z)
  mesh.castShadow = true
  return mesh
}

export function createEarth() {
  const root = new THREE.Group()
  root.name = 'earth'
  root.add(createPedestal(0xc4a35a))

  const body = new THREE.Group()
  body.position.y = 0.25
  root.add(body)

  const cluster = new THREE.Group()
  cluster.position.y = 0.55
  body.add(cluster)

  const crystals = [
    makeCrystal(0.55, 0, 0x8a6b3d, 0x3d2a12, 0.55, { x: 0.2, y: 0.4, z: 0.1 }),
    makeCrystal(0.38, 0, 0xb8924a, 0x5a3d18, 1.15, { x: -0.3, y: 0.8, z: 0.2 }),
    makeCrystal(0.28, 1, 0xd4b36a, 0x6a4a20, 1.55, { x: 0.5, y: 0.2, z: -0.3 }),
    makeCrystal(0.22, 0, 0x6f8f5a, 0x2d4420, 0.95, { x: 0.1, y: 1.2, z: 0.4 }),
    makeCrystal(0.18, 1, 0xc9784a, 0x5a2e18, 0.75, { x: -0.6, y: 0.5, z: 0.15 }),
    makeCrystal(0.16, 0, 0x9bb0a0, 0x2f4038, 1.25, { x: 0.35, y: -0.4, z: 0.55 }),
  ]

  crystals[3].position.x = 0.45
  crystals[4].position.x = -0.42
  crystals[4].position.z = 0.28
  crystals[5].position.x = 0.2
  crystals[5].position.z = -0.4
  crystals.forEach((c) => cluster.add(c))

  const boulder = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.42, 0),
    new THREE.MeshStandardMaterial({
      color: 0x5c5348,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true,
    }),
  )
  boulder.position.set(-0.15, 0.35, 0.1)
  boulder.rotation.set(0.4, 0.8, 0.2)
  body.add(boulder)

  const moss = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0x4f7a45,
      roughness: 0.95,
      emissive: 0x1a3318,
      emissiveIntensity: 0.2,
    }),
  )
  moss.position.set(0.35, 0.42, -0.2)
  moss.scale.set(1.2, 0.7, 1)
  body.add(moss)

  const softMap = createSoftCircleTexture()
  const dust = createParticleSystem({
    count: 320,
    size: 0.08,
    color: 0xd2b48c,
    map: softMap,
    opacity: 0.65,
    blending: THREE.NormalBlending,
  })
  body.add(dust)

  const pollen = createParticleSystem({
    count: 90,
    size: 0.05,
    color: 0xe8d59a,
    map: softMap,
    opacity: 0.8,
  })
  body.add(pollen)

  const light = new THREE.PointLight(0xc4a35a, 2.4, 8, 1.6)
  light.position.set(0, 1.5, 0.4)
  body.add(light)

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xc4a35a,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  aura.position.y = 1.0
  body.add(aura)

  const dPos = dust.geometry.attributes.position.array
  const dVel = dust.userData.velocities
  const dLife = dust.userData.lifetimes
  const dSeed = dust.userData.seeds
  for (let i = 0; i < dust.userData.count; i++) resetDust(i, dPos, dVel, dLife, dSeed, true)

  const pPos = pollen.geometry.attributes.position.array
  const pVel = pollen.userData.velocities
  const pLife = pollen.userData.lifetimes
  for (let i = 0; i < pollen.userData.count; i++) resetPollen(i, pPos, pVel, pLife, true)

  function resetDust(i, pos, vel, life, seed, randomize = false) {
    const a = Math.random() * Math.PI * 2
    const r = 0.4 + Math.random() * 0.9
    pos[i * 3] = Math.cos(a) * r
    pos[i * 3 + 1] = randomize ? 0.3 + Math.random() * 1.8 : 0.25
    pos[i * 3 + 2] = Math.sin(a) * r
    vel[i * 3] = -Math.sin(a) * (0.15 + Math.random() * 0.2)
    vel[i * 3 + 1] = 0.05 + Math.random() * 0.12
    vel[i * 3 + 2] = Math.cos(a) * (0.15 + Math.random() * 0.2)
    life[i] = randomize ? Math.random() : 0
    seed[i] = a
  }

  function resetPollen(i, pos, vel, life, randomize = false) {
    const a = Math.random() * Math.PI * 2
    const r = Math.random() * 0.7
    pos[i * 3] = Math.cos(a) * r
    pos[i * 3 + 1] = randomize ? 0.5 + Math.random() * 1.5 : 0.4
    pos[i * 3 + 2] = Math.sin(a) * r
    vel[i * 3] = (Math.random() - 0.5) * 0.1
    vel[i * 3 + 1] = 0.12 + Math.random() * 0.2
    vel[i * 3 + 2] = (Math.random() - 0.5) * 0.1
    life[i] = randomize ? Math.random() : 0
  }

  root.userData.update = (t, dt) => {
    cluster.rotation.y = t * 0.18
    crystals.forEach((c, i) => {
      c.rotation.x += dt * (0.08 + i * 0.01)
      c.rotation.z += dt * (0.05 + i * 0.008)
    })
    boulder.rotation.y += dt * 0.12
    aura.scale.setScalar(1 + Math.sin(t * 1.1) * 0.04)
    light.intensity = 2.1 + Math.sin(t * 1.5) * 0.3

    for (let i = 0; i < dust.userData.count; i++) {
      dLife[i] += dt * 0.12
      const a = dSeed[i] + t * 0.35
      const r = 0.5 + (i % 7) * 0.12
      dPos[i * 3] = Math.cos(a) * r + Math.sin(t + i) * 0.05
      dPos[i * 3 + 1] += dVel[i * 3 + 1] * dt
      dPos[i * 3 + 2] = Math.sin(a) * r + Math.cos(t * 0.8 + i) * 0.05
      if (dLife[i] > 1 || dPos[i * 3 + 1] > 2.3) resetDust(i, dPos, dVel, dLife, dSeed)
    }
    dust.geometry.attributes.position.needsUpdate = true

    for (let i = 0; i < pollen.userData.count; i++) {
      pLife[i] += dt * 0.2
      pPos[i * 3] += pVel[i * 3] * dt + Math.sin(t * 2 + i) * 0.008
      pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt
      pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt + Math.cos(t * 1.7 + i) * 0.008
      if (pLife[i] > 1 || pPos[i * 3 + 1] > 2.4) resetPollen(i, pPos, pVel, pLife)
    }
    pollen.geometry.attributes.position.needsUpdate = true
  }

  root.userData.focusPoint = new THREE.Vector3(0, 1.2, 0)
  return root
}
