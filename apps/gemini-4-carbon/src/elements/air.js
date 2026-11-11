import * as THREE from 'three'
import { createGlowSprite, createParticleField } from '../particles.js'

export function createAir(position) {
  const group = new THREE.Group()
  group.position.copy(position)

  const ribbons = []
  for (let i = 0; i < 4; i++) {
    const points = []
    const turns = 3
    for (let j = 0; j <= 80; j++) {
      const t = j / 80
      const angle = t * Math.PI * 2 * turns + i * (Math.PI / 2)
      const radius = 0.25 + t * 0.55
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          t * 1.8,
          Math.sin(angle) * radius,
        ),
      )
    }
    const curve = new THREE.CatmullRomCurve3(points)
    const ribbon = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 120, 0.022, 8, false),
      new THREE.MeshStandardMaterial({
        color: 0xe8f7ff,
        emissive: 0x90caf9,
        emissiveIntensity: 0.85,
        transparent: true,
        opacity: 0.55,
        roughness: 0.25,
        metalness: 0.05,
      }),
    )
    ribbon.position.y = 0.25
    ribbon.userData.offset = i * 1.2
    ribbons.push(ribbon)
    group.add(ribbon)
  }

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 32, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0xf5fcff,
      emissive: 0xb3e5fc,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0.55,
      roughness: 0.05,
      metalness: 0.0,
      transmission: 0.8,
      thickness: 0.5,
    }),
  )
  core.position.y = 1.15
  group.add(core)

  const wind = createParticleField({
    count: 500,
    size: 0.04,
    color: 0xe3f2fd,
    opacity: 0.75,
  })
  group.add(wind)

  const wisps = createParticleField({
    count: 140,
    size: 0.1,
    color: 0xffffff,
    opacity: 0.35,
  })
  group.add(wisps)

  const rings = []
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.45 + i * 0.2, 0.012, 10, 80),
      new THREE.MeshBasicMaterial({
        color: 0xd7f3ff,
        transparent: true,
        opacity: 0.3 - i * 0.05,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    ring.position.y = 1.15
    ring.userData.axis = i
    rings.push(ring)
    group.add(ring)
  }

  const glow = createGlowSprite('rgba(210, 240, 255, 0.45)', 3.0)
  glow.position.y = 1.15
  group.add(glow)

  const light = new THREE.PointLight(0xd7f3ff, 3.2, 11, 2)
  light.position.y = 1.3
  group.add(light)

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.7, 0.18, 32),
    new THREE.MeshStandardMaterial({
      color: 0x1a2228,
      roughness: 0.65,
      metalness: 0.25,
      emissive: 0x102028,
      emissiveIntensity: 0.45,
    }),
  )
  group.add(base)

  const label = makeLabel('AIR')
  label.position.y = 2.55
  group.add(label)

  initVortex(wind)
  initVortex(wisps)

  group.userData = {
    type: 'air',
    update(t, dt) {
      core.scale.setScalar(1 + Math.sin(t * 3.2) * 0.08)
      light.intensity = 2.8 + Math.sin(t * 4.0) * 0.5
      glow.material.opacity = 0.4 + Math.sin(t * 2.5) * 0.1

      ribbons.forEach((ribbon, i) => {
        ribbon.rotation.y = t * (1.2 + i * 0.15) + ribbon.userData.offset
        ribbon.material.opacity = 0.4 + Math.sin(t * 2 + i) * 0.15
      })

      rings.forEach((ring, i) => {
        ring.rotation.x = t * (0.8 + i * 0.2)
        ring.rotation.y = t * (1.1 - i * 0.15)
        ring.rotation.z = Math.sin(t + i) * 0.4
      })

      updateVortex(wind, dt, t, 2.4, 1.9)
      updateVortex(wisps, dt, t, 1.4, 2.2)
    },
  }

  return group
}

function initVortex(points) {
  const { lifetimes, seeds, count } = points.userData
  const positions = points.geometry.attributes.position.array
  for (let i = 0; i < count; i++) {
    lifetimes[i] = Math.random()
    const y = Math.random() * 2.0
    const r = 0.15 + y * 0.35
    const a = seeds[i]
    positions[i * 3] = Math.cos(a) * r
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = Math.sin(a) * r
  }
  points.geometry.attributes.position.needsUpdate = true
}

function updateVortex(points, dt, t, spin, rise) {
  const { lifetimes, seeds, count } = points.userData
  const positions = points.geometry.attributes.position.array

  for (let i = 0; i < count; i++) {
    lifetimes[i] += dt * 0.35
    if (lifetimes[i] > 1) {
      lifetimes[i] = 0
      positions[i * 3 + 1] = Math.random() * 0.2
    }

    const y = positions[i * 3 + 1] + rise * dt * (0.35 + seeds[i] * 0.4)
    const r = 0.12 + y * 0.4 + Math.sin(t * 2 + seeds[i]) * 0.05
    const a = seeds[i] + t * spin + y * 2.5
    positions[i * 3] = Math.cos(a) * r
    positions[i * 3 + 1] = y > 2.2 ? 0 : y
    positions[i * 3 + 2] = Math.sin(a) * r
  }
  points.geometry.attributes.position.needsUpdate = true
}

function makeLabel(text) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.font = '500 28px "Cormorant Garamond", serif'
  ctx.fillStyle = 'rgba(230,245,255,0.9)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 32)
  const texture = new THREE.CanvasTexture(canvas)
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }),
  )
  sprite.scale.set(1.6, 0.4, 1)
  return sprite
}
