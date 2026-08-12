import * as THREE from 'three'
import { makeRadial, makeStoneFloor } from '../textures.js'

function makeStarfield(count = 1600) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const color = new THREE.Color()
  for (let i = 0; i < count; i++) {
    const r = 30 + Math.random() * 42
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi) * 0.5 + 5
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    color.setHSL(0.55 + Math.random() * 0.12, 0.25, 0.45 + Math.random() * 0.35)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  )
}

export function createEnvironment(scene) {
  scene.background = new THREE.Color(0x0a0c12)
  scene.fog = new THREE.FogExp2(0x0a0c12, 0.018)

  scene.add(new THREE.HemisphereLight(0xb7c6d8, 0x1a1612, 0.55))

  const key = new THREE.DirectionalLight(0xfff3e4, 1.15)
  key.position.set(7, 11, 5)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.near = 1
  key.shadow.camera.far = 30
  key.shadow.camera.left = -10
  key.shadow.camera.right = 10
  key.shadow.camera.top = 10
  key.shadow.camera.bottom = -10
  key.shadow.bias = -0.00035
  scene.add(key)

  const fill = new THREE.DirectionalLight(0x8aa8c8, 0.35)
  fill.position.set(-6, 4, -5)
  scene.add(fill)

  const floorTex = makeStoneFloor()
  floorTex.repeat.set(4, 4)
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(18, 80),
    new THREE.MeshStandardMaterial({
      map: floorTex,
      color: 0x8a93a3,
      roughness: 0.92,
      metalness: 0.08,
    }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(5.55, 6.0, 96),
    new THREE.MeshStandardMaterial({
      color: 0x2a3344,
      metalness: 0.55,
      roughness: 0.35,
      side: THREE.DoubleSide,
    }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.012
  scene.add(ring)

  const sigil = new THREE.Mesh(
    new THREE.RingGeometry(1.52, 1.62, 80),
    new THREE.MeshStandardMaterial({
      color: 0x3a4558,
      metalness: 0.5,
      roughness: 0.4,
      side: THREE.DoubleSide,
    }),
  )
  sigil.rotation.x = -Math.PI / 2
  sigil.position.y = 0.014
  scene.add(sigil)

  const glowTex = makeRadial('rgba(255,255,255,0.4)', 'rgba(255,255,255,0)')
  const pedestals = []
  const colors = [0xff6a1a, 0xb7e3ff, 0x2ad0ff, 0x6bbf4e]

  for (let i = 0; i < 4; i++) {
    const ped = new THREE.Group()
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.18, 1.36, 0.22, 48),
      new THREE.MeshStandardMaterial({
        color: 0x1c212c,
        roughness: 0.62,
        metalness: 0.28,
      }),
    )
    base.castShadow = true
    base.receiveShadow = true
    ped.add(base)

    const band = new THREE.Mesh(
      new THREE.TorusGeometry(1.14, 0.028, 10, 64),
      new THREE.MeshStandardMaterial({
        color: colors[i],
        emissive: colors[i],
        emissiveIntensity: 0.18,
        roughness: 0.28,
        metalness: 0.72,
      }),
    )
    band.rotation.x = Math.PI / 2
    band.position.y = 0.12
    ped.add(band)

    const plate = new THREE.Mesh(
      new THREE.CircleGeometry(1.08, 48),
      new THREE.MeshStandardMaterial({
        color: 0x12151c,
        roughness: 0.45,
        metalness: 0.4,
      }),
    )
    plate.rotation.x = -Math.PI / 2
    plate.position.y = 0.112
    plate.receiveShadow = true
    ped.add(plate)

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 2.8),
      new THREE.MeshBasicMaterial({
        map: glowTex,
        color: colors[i],
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    glow.rotation.x = -Math.PI / 2
    glow.position.y = 0.018
    ped.add(glow)

    pedestals.push(ped)
    scene.add(ped)
  }

  const stars = makeStarfield()
  scene.add(stars)

  return { pedestals, stars, ring, sigil }
}
