import * as THREE from 'three'
import { createGlowSprite, createParticleField } from '../particles.js'

export function createFire(position) {
  const group = new THREE.Group()
  group.position.copy(position)

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xff2a00,
      emissive: 0xff5500,
      emissiveIntensity: 2.4,
      roughness: 0.35,
      metalness: 0.1,
    }),
  )
  core.position.y = 0.45
  group.add(core)

  const flameGeo = new THREE.ConeGeometry(0.55, 1.8, 32, 1, true)
  const flameMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color('#ffeb3b') },
      uColorB: { value: new THREE.Color('#ff3d00') },
      uColorC: { value: new THREE.Color('#7a0000') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vY;
      uniform float uTime;
      void main() {
        vUv = uv;
        vY = position.y;
        vec3 pos = position;
        float wiggle = sin(uTime * 6.0 + position.y * 8.0 + position.x * 10.0) * 0.08;
        pos.x += wiggle * (1.0 - uv.y);
        pos.z += cos(uTime * 5.0 + position.y * 7.0) * 0.07 * (1.0 - uv.y);
        pos.y += sin(uTime * 4.0 + position.x * 5.0) * 0.05;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      varying float vY;
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      void main() {
        float flicker = 0.85 + 0.15 * sin(uTime * 12.0 + vUv.x * 20.0);
        float heat = smoothstep(0.0, 0.55, vUv.y);
        vec3 col = mix(uColorA, uColorB, heat);
        col = mix(col, uColorC, smoothstep(0.45, 1.0, vUv.y));
        float alpha = (1.0 - vUv.y) * flicker * 0.95;
        alpha *= smoothstep(0.0, 0.15, 1.0 - abs(vUv.x - 0.5) * 2.0);
        gl_FragColor = vec4(col * 1.35, alpha);
      }
    `,
  })
  const flame = new THREE.Mesh(flameGeo, flameMat)
  flame.position.y = 1.15
  group.add(flame)

  const innerFlame = flame.clone()
  innerFlame.scale.set(0.55, 0.75, 0.55)
  innerFlame.position.y = 0.95
  group.add(innerFlame)

  const sparks = createParticleField({
    count: 520,
    size: 0.08,
    color: 0xffaa33,
    opacity: 0.95,
  })
  group.add(sparks)

  const embers = createParticleField({
    count: 180,
    size: 0.12,
    color: 0xff5722,
    opacity: 0.75,
  })
  group.add(embers)

  const glow = createGlowSprite('rgba(255, 90, 20, 0.55)', 3.2)
  glow.position.y = 0.9
  group.add(glow)

  const light = new THREE.PointLight(0xff6a2a, 4.5, 12, 2)
  light.position.y = 1.2
  group.add(light)

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.7, 0.18, 32),
    new THREE.MeshStandardMaterial({
      color: 0x2a1208,
      roughness: 0.85,
      metalness: 0.2,
      emissive: 0x331100,
      emissiveIntensity: 0.4,
    }),
  )
  group.add(base)

  const label = makeLabel('FIRE')
  label.position.y = 2.55
  group.add(label)

  group.userData = {
    type: 'fire',
    update(t, dt) {
      flameMat.uniforms.uTime.value = t
      light.intensity = 4.2 + Math.sin(t * 11) * 0.8 + Math.sin(t * 17) * 0.35
      glow.material.opacity = 0.55 + Math.sin(t * 9) * 0.12
      core.scale.setScalar(0.95 + Math.sin(t * 8) * 0.08)

      updateRisingParticles(sparks, dt, {
        rise: 2.8,
        spread: 0.55,
        height: 2.4,
        swirl: 1.4,
      })
      updateRisingParticles(embers, dt, {
        rise: 1.4,
        spread: 0.85,
        height: 2.8,
        swirl: 0.7,
      })
    },
  }

  return group
}

function updateRisingParticles(points, dt, { rise, spread, height, swirl }) {
  const { velocities, lifetimes, seeds, count } = points.userData
  const positions = points.geometry.attributes.position.array

  for (let i = 0; i < count; i++) {
    lifetimes[i] += dt * (0.35 + seeds[i] * 0.55)
    if (lifetimes[i] > 1 || (positions[i * 3] === 0 && positions[i * 3 + 1] === 0 && lifetimes[i] > 0.02 && velocities[i * 3 + 1] === 0)) {
      lifetimes[i] = 0
      const a = seeds[i]
      const r = Math.random() * spread * 0.35
      positions[i * 3] = Math.cos(a) * r
      positions[i * 3 + 1] = 0.2 + Math.random() * 0.2
      positions[i * 3 + 2] = Math.sin(a) * r
      velocities[i * 3] = (Math.random() - 0.5) * spread
      velocities[i * 3 + 1] = rise * (0.6 + Math.random() * 0.8)
      velocities[i * 3 + 2] = (Math.random() - 0.5) * spread
    }

    const life = lifetimes[i]
    positions[i * 3] += velocities[i * 3] * dt + Math.sin(life * 10 + seeds[i]) * swirl * 0.01
    positions[i * 3 + 1] += velocities[i * 3 + 1] * dt
    positions[i * 3 + 2] += velocities[i * 3 + 2] * dt + Math.cos(life * 9 + seeds[i]) * swirl * 0.01

    if (positions[i * 3 + 1] > height) lifetimes[i] = 1.1
  }

  points.geometry.attributes.position.needsUpdate = true
  points.material.opacity = 0.85
}

function makeLabel(text) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 256, 64)
  ctx.font = '500 28px "Cormorant Garamond", serif'
  ctx.fillStyle = 'rgba(255,220,180,0.9)'
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
