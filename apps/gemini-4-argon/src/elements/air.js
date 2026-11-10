import * as THREE from 'three'
import { createParticleSystem, createPedestal, createSoftCircleTexture } from '../utils/particles.js'

function createRibbon(radius, height, turns, tubularSegments, color, opacity) {
  const curvePoints = []
  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments
    const angle = t * Math.PI * 2 * turns
    curvePoints.push(
      new THREE.Vector3(
        Math.cos(angle) * radius * (1 - t * 0.25),
        t * height,
        Math.sin(angle) * radius * (1 - t * 0.25),
      ),
    )
  }
  const curve = new THREE.CatmullRomCurve3(curvePoints)
  const geometry = new THREE.TubeGeometry(curve, tubularSegments, 0.035, 8, false)
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity,
    roughness: 0.25,
    metalness: 0.1,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geometry, material)
  return mesh
}

export function createAir() {
  const root = new THREE.Group()
  root.name = 'air'
  root.add(createPedestal(0xb8d4c8))

  const body = new THREE.Group()
  body.position.y = 0.25
  root.add(body)

  const ribbons = [
    createRibbon(0.75, 2.2, 2.2, 120, 0xd7ebe4, 0.45),
    createRibbon(0.55, 2.5, 2.8, 140, 0xa8d0e8, 0.4),
    createRibbon(0.95, 1.8, 1.6, 100, 0xf0f7f4, 0.3),
  ]
  ribbons[1].rotation.y = Math.PI / 2
  ribbons[2].rotation.y = Math.PI / 4
  ribbons.forEach((r) => {
    r.position.y = 0.2
    body.add(r)
  })

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 32, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0xe8f4ef,
      transmission: 0.7,
      thickness: 0.5,
      roughness: 0.05,
      transparent: true,
      opacity: 0.55,
      emissive: 0x8fbfb0,
      emissiveIntensity: 0.4,
    }),
  )
  core.position.y = 1.25
  body.add(core)

  const clouds = []
  for (let i = 0; i < 6; i++) {
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(0.22 + Math.random() * 0.18, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xeef6f2,
        transparent: true,
        opacity: 0.18 + Math.random() * 0.12,
        roughness: 1,
        depthWrite: false,
      }),
    )
    const a = (i / 6) * Math.PI * 2
    cloud.position.set(Math.cos(a) * 0.7, 0.9 + (i % 3) * 0.25, Math.sin(a) * 0.7)
    cloud.scale.set(1.4, 0.7, 1.1)
    body.add(cloud)
    clouds.push({ mesh: cloud, angle: a, radius: 0.55 + (i % 3) * 0.15, speed: 0.4 + i * 0.08 })
  }

  const softMap = createSoftCircleTexture()
  const wind = createParticleSystem({
    count: 500,
    size: 0.07,
    color: 0xd9efe8,
    map: softMap,
    opacity: 0.75,
  })
  body.add(wind)

  const gusts = createParticleSystem({
    count: 180,
    size: 0.11,
    color: 0xb5d9ee,
    map: softMap,
    opacity: 0.55,
  })
  body.add(gusts)

  const light = new THREE.PointLight(0xb8d4c8, 2.8, 9, 1.5)
  light.position.set(0, 1.5, 0)
  body.add(light)

  const wPos = wind.geometry.attributes.position.array
  const wVel = wind.userData.velocities
  const wLife = wind.userData.lifetimes
  const wSeed = wind.userData.seeds
  for (let i = 0; i < wind.userData.count; i++) resetWind(i, wPos, wVel, wLife, wSeed, true)

  const gPos = gusts.geometry.attributes.position.array
  const gVel = gusts.userData.velocities
  const gLife = gusts.userData.lifetimes
  for (let i = 0; i < gusts.userData.count; i++) resetGust(i, gPos, gVel, gLife, true)

  function resetWind(i, pos, vel, life, seed, randomize = false) {
    const a = Math.random() * Math.PI * 2
    const r = 0.3 + Math.random() * 0.9
    const y = randomize ? Math.random() * 2.2 : Math.random() * 0.4
    pos[i * 3] = Math.cos(a) * r
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = Math.sin(a) * r
    vel[i * 3] = -Math.sin(a) * (1.2 + Math.random())
    vel[i * 3 + 1] = 0.4 + Math.random() * 0.8
    vel[i * 3 + 2] = Math.cos(a) * (1.2 + Math.random())
    life[i] = randomize ? Math.random() : 0
    seed[i] = a
  }

  function resetGust(i, pos, vel, life, randomize = false) {
    const a = Math.random() * Math.PI * 2
    const r = 0.2 + Math.random() * 0.5
    pos[i * 3] = Math.cos(a) * r
    pos[i * 3 + 1] = randomize ? 0.5 + Math.random() * 1.6 : 0.6
    pos[i * 3 + 2] = Math.sin(a) * r
    vel[i * 3] = (Math.random() - 0.5) * 0.8
    vel[i * 3 + 1] = 0.6 + Math.random() * 1.1
    vel[i * 3 + 2] = (Math.random() - 0.5) * 0.8
    life[i] = randomize ? Math.random() : 0
  }

  root.userData.update = (t, dt) => {
    ribbons.forEach((ribbon, i) => {
      ribbon.rotation.y += dt * (0.55 + i * 0.2)
      ribbon.position.y = 0.2 + Math.sin(t * 1.4 + i) * 0.08
    })

    core.scale.setScalar(0.95 + Math.sin(t * 2.4) * 0.08)
    core.rotation.y = t * 0.6
    light.intensity = 2.4 + Math.sin(t * 3.2) * 0.45

    clouds.forEach((c, i) => {
      const a = c.angle + t * c.speed
      c.mesh.position.x = Math.cos(a) * c.radius
      c.mesh.position.z = Math.sin(a) * c.radius
      c.mesh.position.y = 0.9 + Math.sin(t * 1.5 + i) * 0.15 + (i % 3) * 0.2
      c.mesh.rotation.y += dt * 0.3
    })

    for (let i = 0; i < wind.userData.count; i++) {
      wLife[i] += dt * 0.4
      const a = wSeed[i] + t * 1.8
      const r = 0.35 + (1 - wLife[i]) * 0.7
      wPos[i * 3] = Math.cos(a) * r
      wPos[i * 3 + 1] += wVel[i * 3 + 1] * dt * 0.5
      wPos[i * 3 + 2] = Math.sin(a) * r
      if (wLife[i] > 1 || wPos[i * 3 + 1] > 2.6) resetWind(i, wPos, wVel, wLife, wSeed)
    }
    wind.geometry.attributes.position.needsUpdate = true

    for (let i = 0; i < gusts.userData.count; i++) {
      gLife[i] += dt * 0.5
      gPos[i * 3] += gVel[i * 3] * dt
      gPos[i * 3 + 1] += gVel[i * 3 + 1] * dt
      gPos[i * 3 + 2] += gVel[i * 3 + 2] * dt
      if (gLife[i] > 1 || gPos[i * 3 + 1] > 2.8) resetGust(i, gPos, gVel, gLife)
    }
    gusts.geometry.attributes.position.needsUpdate = true
  }

  root.userData.focusPoint = new THREE.Vector3(0, 1.3, 0)
  return root
}
