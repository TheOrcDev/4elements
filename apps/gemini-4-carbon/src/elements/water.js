import * as THREE from 'three'
import { createGlowSprite, createParticleField } from '../particles.js'

export function createWater(position) {
  const group = new THREE.Group()
  group.position.copy(position)

  const waterMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uColorDeep: { value: new THREE.Color('#043a63') },
      uColorMid: { value: new THREE.Color('#1aa7ff') },
      uColorFoam: { value: new THREE.Color('#b8f0ff') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vPos;
      uniform float uTime;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec3 pos = position;
        float wave = sin(pos.x * 4.0 + uTime * 2.2) * 0.08
                  + cos(pos.z * 5.0 + uTime * 1.8) * 0.07
                  + sin(pos.y * 6.0 + uTime * 2.6) * 0.05;
        pos += normal * wave;
        vPos = pos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vPos;
      uniform float uTime;
      uniform vec3 uColorDeep;
      uniform vec3 uColorMid;
      uniform vec3 uColorFoam;
      void main() {
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.2);
        float caustic = 0.5 + 0.5 * sin(vPos.x * 10.0 + uTime * 3.0) * sin(vPos.z * 9.0 - uTime * 2.4);
        vec3 col = mix(uColorDeep, uColorMid, fresnel);
        col = mix(col, uColorFoam, caustic * 0.25 + fresnel * 0.35);
        float alpha = 0.55 + fresnel * 0.4;
        gl_FragColor = vec4(col * 1.25, alpha);
      }
    `,
  })

  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 4), waterMat)
  orb.position.y = 1.05
  group.add(orb)

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.05, 2),
    new THREE.MeshPhysicalMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.18,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.7,
      thickness: 0.6,
      emissive: 0x0a3a55,
      emissiveIntensity: 0.35,
    }),
  )
  shell.position.y = 1.05
  group.add(shell)

  const droplets = createParticleField({
    count: 280,
    size: 0.05,
    color: 0x80deea,
    opacity: 0.85,
  })
  group.add(droplets)

  const mist = createParticleField({
    count: 90,
    size: 0.14,
    color: 0xb3e5fc,
    opacity: 0.35,
  })
  group.add(mist)

  const rings = []
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55 + i * 0.22, 0.018, 12, 64),
      new THREE.MeshBasicMaterial({
        color: 0x81d4fa,
        transparent: true,
        opacity: 0.35 - i * 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.25
    ring.userData.phase = i * 1.4
    rings.push(ring)
    group.add(ring)
  }

  const glow = createGlowSprite('rgba(40, 170, 255, 0.5)', 3.4)
  glow.position.y = 1.05
  group.add(glow)

  const light = new THREE.PointLight(0x3db8ff, 3.8, 11, 2)
  light.position.y = 1.2
  group.add(light)

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.7, 0.18, 32),
    new THREE.MeshStandardMaterial({
      color: 0x0a2433,
      roughness: 0.7,
      metalness: 0.35,
      emissive: 0x042033,
      emissiveIntensity: 0.5,
    }),
  )
  group.add(base)

  const label = makeLabel('WATER')
  label.position.y = 2.55
  group.add(label)

  const { velocities, lifetimes, seeds, count } = droplets.userData
  const pos = droplets.geometry.attributes.position.array
  for (let i = 0; i < count; i++) {
    resetDroplet(i, pos, velocities, lifetimes, seeds, true)
  }

  group.userData = {
    type: 'water',
    update(t, dt) {
      waterMat.uniforms.uTime.value = t
      orb.rotation.y = t * 0.35
      orb.rotation.x = Math.sin(t * 0.4) * 0.15
      shell.rotation.y = -t * 0.25
      shell.scale.setScalar(1 + Math.sin(t * 1.5) * 0.03)
      light.intensity = 3.4 + Math.sin(t * 2.2) * 0.5
      glow.material.opacity = 0.45 + Math.sin(t * 1.8) * 0.1

      rings.forEach((ring, i) => {
        const pulse = (Math.sin(t * 1.6 + ring.userData.phase) + 1) * 0.5
        ring.scale.setScalar(0.85 + pulse * 0.55 + i * 0.08)
        ring.material.opacity = 0.28 - pulse * 0.12
      })

      updateOrbitDroplets(droplets, dt, t)
      updateMist(mist, dt, t)
    },
  }

  return group
}

function resetDroplet(i, positions, velocities, lifetimes, seeds, randomLife = false) {
  const a = seeds[i] + Math.random() * Math.PI * 2
  const r = 0.4 + Math.random() * 0.7
  positions[i * 3] = Math.cos(a) * r
  positions[i * 3 + 1] = 0.5 + Math.random() * 1.4
  positions[i * 3 + 2] = Math.sin(a) * r
  velocities[i * 3] = -Math.sin(a) * (0.4 + Math.random() * 0.5)
  velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.6
  velocities[i * 3 + 2] = Math.cos(a) * (0.4 + Math.random() * 0.5)
  lifetimes[i] = randomLife ? Math.random() : 0
}

function updateOrbitDroplets(points, dt, t) {
  const { velocities, lifetimes, seeds, count } = points.userData
  const positions = points.geometry.attributes.position.array

  for (let i = 0; i < count; i++) {
    lifetimes[i] += dt * 0.25
    if (lifetimes[i] > 1) {
      resetDroplet(i, positions, velocities, lifetimes, seeds)
    }
    positions[i * 3] += velocities[i * 3] * dt
    positions[i * 3 + 1] += velocities[i * 3 + 1] * dt + Math.sin(t * 2 + seeds[i]) * 0.004
    positions[i * 3 + 2] += velocities[i * 3 + 2] * dt

    const dx = positions[i * 3]
    const dz = positions[i * 3 + 2]
    const len = Math.hypot(dx, dz) || 1
    velocities[i * 3] += (-dz / len) * dt * 0.8
    velocities[i * 3 + 2] += (dx / len) * dt * 0.8
  }
  points.geometry.attributes.position.needsUpdate = true
}

function updateMist(points, dt, t) {
  const { lifetimes, seeds, count } = points.userData
  const positions = points.geometry.attributes.position.array
  for (let i = 0; i < count; i++) {
    lifetimes[i] += dt * 0.15
    if (lifetimes[i] > 1) {
      lifetimes[i] = 0
      const a = seeds[i]
      positions[i * 3] = Math.cos(a + t) * (0.9 + Math.random() * 0.4)
      positions[i * 3 + 1] = 0.4 + Math.random() * 1.6
      positions[i * 3 + 2] = Math.sin(a + t) * (0.9 + Math.random() * 0.4)
    } else {
      positions[i * 3 + 1] += Math.sin(t + seeds[i]) * 0.01
    }
  }
  points.geometry.attributes.position.needsUpdate = true
}

function makeLabel(text) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.font = '500 28px "Cormorant Garamond", serif'
  ctx.fillStyle = 'rgba(180,230,255,0.9)'
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
