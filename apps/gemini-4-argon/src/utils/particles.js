import * as THREE from 'three'

export function createSoftCircleTexture(size = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createParticleSystem({
  count,
  size,
  color,
  blending = THREE.AdditiveBlending,
  opacity = 0.9,
  depthWrite = false,
  map,
}) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  const lifetimes = new Float32Array(count)
  const seeds = new Float32Array(count)
  const colors = new Float32Array(count * 3)
  const c = new THREE.Color(color)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = 0
    positions[i * 3 + 1] = 0
    positions[i * 3 + 2] = 0
    velocities[i * 3] = 0
    velocities[i * 3 + 1] = 0
    velocities[i * 3 + 2] = 0
    lifetimes[i] = Math.random()
    seeds[i] = Math.random()
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size,
    map,
    transparent: true,
    opacity,
    depthWrite,
    blending,
    vertexColors: true,
    sizeAttenuation: true,
  })

  const points = new THREE.Points(geometry, material)
  points.userData = { velocities, lifetimes, seeds, count }
  return points
}

export function createPedestal(accentHex) {
  const group = new THREE.Group()

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.35, 0.18, 48),
    new THREE.MeshStandardMaterial({
      color: 0x1a1c22,
      metalness: 0.55,
      roughness: 0.35,
    }),
  )
  base.position.y = 0.09
  base.receiveShadow = true
  group.add(base)

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.05, 0.035, 16, 64),
    new THREE.MeshStandardMaterial({
      color: accentHex,
      emissive: accentHex,
      emissiveIntensity: 0.55,
      metalness: 0.8,
      roughness: 0.25,
    }),
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.2
  group.add(ring)

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 48),
    new THREE.MeshBasicMaterial({
      color: accentHex,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  glow.rotation.x = -Math.PI / 2
  glow.position.y = 0.02
  group.add(glow)

  return group
}
