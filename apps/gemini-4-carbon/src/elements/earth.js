import * as THREE from 'three'
import { createGlowSprite, createParticleField } from '../particles.js'

export function createEarth(position) {
  const group = new THREE.Group()
  group.position.copy(position)

  const rockGroup = new THREE.Group()
  rockGroup.position.y = 1.0
  group.add(rockGroup)

  const palette = [0x5d4037, 0x6d4c41, 0x8d6e63, 0x4e342e, 0x3e2723]
  const crystals = []

  for (let i = 0; i < 9; i++) {
    const geo = i % 2 === 0
      ? new THREE.DodecahedronGeometry(0.28 + Math.random() * 0.22, 0)
      : new THREE.OctahedronGeometry(0.25 + Math.random() * 0.2, 0)

    const mat = new THREE.MeshStandardMaterial({
      color: palette[i % palette.length],
      roughness: 0.72,
      metalness: 0.18,
      flatShading: true,
      emissive: 0x1b2e10,
      emissiveIntensity: 0.15,
    })

    const mesh = new THREE.Mesh(geo, mat)
    const angle = (i / 9) * Math.PI * 2
    const radius = i === 0 ? 0 : 0.35 + Math.random() * 0.35
    mesh.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 0.5,
      Math.sin(angle) * radius,
    )
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
    mesh.userData.spin = {
      x: (Math.random() - 0.5) * 0.4,
      y: 0.2 + Math.random() * 0.5,
      z: (Math.random() - 0.5) * 0.3,
    }
    crystals.push(mesh)
    rockGroup.add(mesh)
  }

  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.32, 0),
    new THREE.MeshPhysicalMaterial({
      color: 0x8bc34a,
      emissive: 0x4caf50,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.35,
      transparent: true,
      opacity: 0.92,
      transmission: 0.35,
      thickness: 0.4,
    }),
  )
  gem.position.y = 0.15
  rockGroup.add(gem)
  crystals.push(gem)

  const vines = []
  for (let i = 0; i < 5; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.2, 0),
      new THREE.Vector3(Math.cos(i) * 0.35, 0.2, Math.sin(i) * 0.35),
      new THREE.Vector3(Math.cos(i + 1) * 0.55, 0.7, Math.sin(i + 1) * 0.55),
      new THREE.Vector3(Math.cos(i + 2) * 0.3, 1.15, Math.sin(i + 2) * 0.3),
    ])
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 40, 0.018, 8, false),
      new THREE.MeshStandardMaterial({
        color: 0x558b2f,
        emissive: 0x33691e,
        emissiveIntensity: 0.45,
        roughness: 0.6,
      }),
    )
    vines.push(tube)
    rockGroup.add(tube)
  }

  const dust = createParticleField({
    count: 260,
    size: 0.045,
    color: 0xc8b48a,
    opacity: 0.65,
    blending: THREE.NormalBlending,
  })
  group.add(dust)

  const pollen = createParticleField({
    count: 80,
    size: 0.07,
    color: 0xaed581,
    opacity: 0.7,
  })
  group.add(pollen)

  const glow = createGlowSprite('rgba(120, 180, 60, 0.4)', 2.8)
  glow.position.y = 1.0
  group.add(glow)

  const light = new THREE.PointLight(0x8fbf4a, 2.8, 10, 2)
  light.position.y = 1.3
  group.add(light)

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.7, 0.18, 32),
    new THREE.MeshStandardMaterial({
      color: 0x2e241c,
      roughness: 0.9,
      metalness: 0.1,
      emissive: 0x1a2a10,
      emissiveIntensity: 0.35,
    }),
  )
  group.add(base)

  const label = makeLabel('EARTH')
  label.position.y = 2.55
  group.add(label)

  initOrbitParticles(dust, 0.5, 1.6)
  initOrbitParticles(pollen, 0.7, 1.9)

  group.userData = {
    type: 'earth',
    update(t, dt) {
      rockGroup.rotation.y = t * 0.22
      gem.rotation.y = t * 0.8
      gem.rotation.x = Math.sin(t * 0.7) * 0.25
      gem.position.y = 0.15 + Math.sin(t * 1.4) * 0.08
      light.intensity = 2.5 + Math.sin(t * 1.3) * 0.35
      glow.material.opacity = 0.35 + Math.sin(t * 1.1) * 0.08

      crystals.forEach((c, i) => {
        if (!c.userData.spin) return
        c.rotation.x += c.userData.spin.x * dt * 0.4
        c.rotation.y += c.userData.spin.y * dt * 0.4
        c.rotation.z += c.userData.spin.z * dt * 0.4
        c.position.y += Math.sin(t * 1.2 + i) * 0.0008
      })

      vines.forEach((v, i) => {
        v.scale.y = 1 + Math.sin(t * 1.5 + i) * 0.04
      })

      updateDust(dust, dt, t, 0.55)
      updateDust(pollen, dt, t, 0.35)
    },
  }

  return group
}

function initOrbitParticles(points, minR, maxR) {
  const { lifetimes, seeds, count } = points.userData
  const positions = points.geometry.attributes.position.array
  for (let i = 0; i < count; i++) {
    const a = seeds[i]
    const r = minR + Math.random() * (maxR - minR)
    positions[i * 3] = Math.cos(a) * r
    positions[i * 3 + 1] = 0.3 + Math.random() * 1.5
    positions[i * 3 + 2] = Math.sin(a) * r
    lifetimes[i] = Math.random()
  }
  points.geometry.attributes.position.needsUpdate = true
}

function updateDust(points, dt, t, speed) {
  const { lifetimes, seeds, count } = points.userData
  const positions = points.geometry.attributes.position.array
  for (let i = 0; i < count; i++) {
    lifetimes[i] += dt * 0.12
    const a = seeds[i] + t * speed
    const r = 0.55 + (seeds[i] % 1) * 1.1
    positions[i * 3] = Math.cos(a) * r
    positions[i * 3 + 2] = Math.sin(a * 0.9) * r
    positions[i * 3 + 1] = 0.35 + ((Math.sin(t * 0.8 + seeds[i] * 5) + 1) * 0.5) * 1.5
    if (lifetimes[i] > 1) lifetimes[i] = 0
  }
  points.geometry.attributes.position.needsUpdate = true
}

function makeLabel(text) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.font = '500 28px "Cormorant Garamond", serif'
  ctx.fillStyle = 'rgba(210,230,170,0.9)'
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
