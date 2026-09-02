import * as THREE from 'three';

export class Starfield {
  constructor(count = 2500) {
    this.group = new THREE.Group();

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const starColors = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x9bd4ff),
      new THREE.Color(0xffe8a3),
      new THREE.Color(0xd2b5ff)
    ];

    for (let i = 0; i < count; i++) {
      // Distribute stars on a wide sphere shell
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 50.0 + Math.random() * 40.0;

      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = starColors[Math.floor(Math.random() * starColors.length)];
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 1.0 + Math.random() * 2.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom twinkling star shader
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          vColor = color;
          // Deterministic twinkle phase based on position
          float twinkle = sin(uTime * 2.0 + position.x * 0.1 + position.y * 0.1) * 0.5 + 0.5;
          vTwinkle = twinkle;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * (0.6 + twinkle * 0.8) * (200.0 / -mvPosition.z);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          float intensity = pow(1.0 - smoothstep(0.0, 0.5, dist), 2.0);
          gl_FragColor = vec4(vColor * 0.85, intensity * (0.45 + vTwinkle * 0.35));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(geo, mat);
    this.group.add(this.points);
  }

  update(delta, elapsed) {
    this.points.material.uniforms.uTime.value = elapsed;
    this.group.rotation.y = elapsed * 0.008;
    this.group.rotation.x = elapsed * 0.004;
  }
}
