import * as THREE from 'three'

function noise2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function fbm2(x, y, octaves = 5) {
  let v = 0
  let a = 0.5
  let f = 1
  for (let i = 0; i < octaves; i++) {
    v += a * noise2(x * f, y * f)
    f *= 2.03
    a *= 0.5
  }
  return v
}

export function canvasTexture(size, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  draw(ctx, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

export function makeRockMaps(size = 1024) {
  const color = canvasTexture(size, (ctx, s) => {
    const img = ctx.createImageData(s, s)
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s
        const v = y / s
        const n = fbm2(u * 6, v * 6, 6)
        const n2 = fbm2(u * 14 + 8, v * 14, 4)
        const strata = 0.5 + 0.5 * Math.sin(v * 28 + n * 4)
        const crack = Math.pow(Math.abs(Math.sin((u + n * 0.3) * 40) * Math.cos((v + n2) * 18)), 8)
        const grit = noise2(x * 0.7, y * 0.7)

        let r = 92 + n * 70 + strata * 18
        let g = 68 + n * 48 + strata * 8
        let b = 42 + n * 28
        r = r * (1 - crack * 0.7) + 28 * crack
        g = g * (1 - crack * 0.7) + 22 * crack
        b = b * (1 - crack * 0.65) + 18 * crack
        r += (grit - 0.5) * 22
        g += (grit - 0.5) * 16
        b += (grit - 0.5) * 10

        const i = (y * s + x) * 4
        img.data[i] = Math.max(0, Math.min(255, r))
        img.data[i + 1] = Math.max(0, Math.min(255, g))
        img.data[i + 2] = Math.max(0, Math.min(255, b))
        img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  })

  const bump = canvasTexture(size, (ctx, s) => {
    const img = ctx.createImageData(s, s)
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s
        const v = y / s
        const n = fbm2(u * 6, v * 6, 6)
        const crack = Math.pow(Math.abs(Math.sin((u + n * 0.3) * 40) * Math.cos(v * 18)), 8)
        const g = Math.max(0, Math.min(255, (n * 180 + 40) * (1 - crack * 0.85)))
        const i = (y * s + x) * 4
        img.data[i] = img.data[i + 1] = img.data[i + 2] = g
        img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  })
  bump.colorSpace = THREE.NoColorSpace

  return { color, bump }
}

export function makeMossMap(size = 512) {
  return canvasTexture(size, (ctx, s) => {
    ctx.fillStyle = '#0a1f0c'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < 2200; i++) {
      const x = Math.random() * s
      const y = Math.random() * s
      const r = 1.5 + Math.random() * 7
      const hue = 95 + Math.random() * 45
      const light = 16 + Math.random() * 28
      ctx.fillStyle = `hsla(${hue}, 48%, ${light}%, ${0.25 + Math.random() * 0.55})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

export function makeStoneFloor(size = 1024) {
  return canvasTexture(size, (ctx, s) => {
    const img = ctx.createImageData(s, s)
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s
        const v = y / s
        const n = fbm2(u * 8, v * 8, 5)
        const tile = Math.max(
          Math.abs(((u * 10) % 1) - 0.5),
          Math.abs(((v * 10) % 1) - 0.5),
        )
        const grout = tile > 0.46 ? 0.35 : 1
        const g = (18 + n * 22) * grout
        const i = (y * s + x) * 4
        img.data[i] = g
        img.data[i + 1] = g * 1.02
        img.data[i + 2] = g * 1.08
        img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  })
}

export function makeRadial(inner, outer, size = 256) {
  return canvasTexture(size, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    g.addColorStop(0, inner)
    g.addColorStop(1, outer)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
  })
}

export function makeCausticMap(size = 512) {
  return canvasTexture(size, (ctx, s) => {
    const img = ctx.createImageData(s, s)
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s
        const v = y / s
        const a = Math.sin(u * 18 + Math.sin(v * 14)) + Math.sin(v * 16 + Math.cos(u * 12))
        const b = Math.sin((u + v) * 22) * Math.cos((u - v) * 18)
        const c = Math.pow(0.5 + 0.5 * Math.sin(a * 1.4 + b), 4)
        const g = c * 220
        const i = (y * s + x) * 4
        img.data[i] = g * 0.45
        img.data[i + 1] = g * 0.85
        img.data[i + 2] = g
        img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  })
}
