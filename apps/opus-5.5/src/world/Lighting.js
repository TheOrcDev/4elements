import * as THREE from 'three';

/** Moonlight, sky fill and a procedural HDR environment for reflections. */
export class Lighting {
  constructor(ctx) {
    this.group = new THREE.Group();
    this.group.name = 'lighting';

    const hemi = new THREE.HemisphereLight(0x5b6fb0, 0x1c1410, 0.3);
    this.group.add(hemi);

    const moon = new THREE.DirectionalLight(0xb9c8ff, 1.35);
    moon.position.set(-13, 16, 9);
    moon.target.position.set(0, 0, 0);
    moon.castShadow = true;
    moon.shadow.mapSize.set(ctx.quality.shadowSize, ctx.quality.shadowSize);
    const sc = moon.shadow.camera;
    sc.left = -14;
    sc.right = 14;
    sc.top = 14;
    sc.bottom = -14;
    sc.near = 2;
    sc.far = 50;
    moon.shadow.bias = -0.0004;
    moon.shadow.normalBias = 0.035;
    moon.shadow.radius = 3;
    this.group.add(moon, moon.target);
    this.moon = moon;

    ctx.scene.environment = this.#buildEnvironment(ctx.renderer);
    ctx.scene.environmentIntensity = 0.42;
  }

  #buildEnvironment(renderer) {
    const env = new THREE.Scene();
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          float y = vDir.y;
          vec3 top = vec3(0.03, 0.045, 0.1);
          vec3 hor = vec3(0.09, 0.1, 0.16);
          vec3 bot = vec3(0.012, 0.01, 0.012);
          vec3 c = mix(hor, top, smoothstep(0.0, 0.7, y));
          c = mix(bot, c, smoothstep(-0.2, 0.05, y));
          // bright horizon line gives crisp rim reflections on water and crystal
          c += vec3(0.35, 0.4, 0.55) * exp(-abs(y - 0.02) * 60.0);
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    env.add(new THREE.Mesh(new THREE.SphereGeometry(50, 64, 32), skyMat));

    const addLight = (color, intensity, pos, size, shape = 'sphere') => {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
      const geo = shape === 'sphere' ? new THREE.SphereGeometry(size, 24, 12) : new THREE.PlaneGeometry(size[0], size[1]);
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(pos);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    // moon
    addLight('#dfe6ff', 40, new THREE.Vector3(-26, 32, 18), 2.2);
    // cool softboxes
    addLight('#9fb6ff', 2.2, new THREE.Vector3(30, 20, 10), [26, 10], 'plane');
    addLight('#b7c9ff', 1.4, new THREE.Vector3(-26, 14, 26), [20, 6], 'plane');
    // elemental glows on the horizon
    addLight('#ff7a2f', 3.0, new THREE.Vector3(-30, 4, 30), 5);
    addLight('#2aa9ff', 2.2, new THREE.Vector3(30, 5, -30), 6);
    addLight('#6fd66a', 1.2, new THREE.Vector3(-30, 6, -30), 5);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const rt = pmrem.fromScene(env, 0.03);
    pmrem.dispose();
    env.traverse((o) => {
      if (o.isMesh) {
        o.geometry.dispose();
        o.material.dispose();
      }
    });
    return rt.texture;
  }
}
