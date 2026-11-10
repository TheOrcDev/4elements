import * as THREE from 'three';

// The moonlight falls from 38 degrees up, which models the elements well and keeps their
// shadows short. The camera never looks that high (it cannot tilt above the horizon), so the
// moon one can actually see is drawn where a full moon opposite an afterglow really stands:
// low over the horizon, on the bearing the light comes from.
const MOON_LIGHT_DIR = new THREE.Vector3(-0.46, 0.62, 0.635).normalize();
const MOON_DISC_ELEVATION = 5.2 * Math.PI / 180;
const MOON_DISC_DIR = new THREE.Vector3(MOON_LIGHT_DIR.x, 0, MOON_LIGHT_DIR.z).normalize()
  .multiplyScalar(Math.cos(MOON_DISC_ELEVATION)).setY(Math.sin(MOON_DISC_ELEVATION));

// Uniform objects shared by reference across every custom material in the scene.
// Spread them into a material (`uniforms: { ...shared, uMine: { value: 1 } }`) and
// the pipeline keeps the values current for each render pass. Never clone a material
// that uses them: cloning copies the uniform objects and breaks the link.
export const shared = {
  uTime: { value: 0 },
  uDeltaTime: { value: 1 / 60 },
  uFrame: { value: 0 },

  // Per-pass state, written by the pipeline before each scene render.
  uResolution: { value: new THREE.Vector2(1, 1) },
  uSceneColor: { value: null },
  uSceneDepth: { value: null },
  uCameraNear: { value: 0.3 },
  uCameraFar: { value: 6000 },
  uProjectionMatrixInverse: { value: new THREE.Matrix4() },
  uCameraWorldMatrix: { value: new THREE.Matrix4() },
  uIsMirrorPass: { value: 0 },
  uQuality: { value: 1 },

  // Sky and key lights. Directions point from the scene toward the light.
  uSunDir: { value: new THREE.Vector3(0.84, -0.07, -0.54).normalize() },
  uSunColor: { value: new THREE.Vector3(1.0, 0.52, 0.26) },
  uMoonDir: { value: MOON_LIGHT_DIR },
  uMoonColor: { value: new THREE.Vector3(0.55, 0.68, 1.0) },
  // Where the moon's disc is seen in the sky (see above). Light it from uMoonDir, look for it here.
  uMoonDiscDir: { value: MOON_DISC_DIR },

  // Cross-element lighting. The fire element writes its flickering light here,
  // the air element writes lightning flashes (xyz = world position, w = intensity).
  uFireLightPos: { value: new THREE.Vector3(0, 2.2, -10) },
  uFireLightColor: { value: new THREE.Vector3(0, 0, 0) },
  uFlash: { value: new THREE.Vector4(10, 9, 0, 0) },

  // Shared resources, filled in by the core at start-up.
  uNoise3D: { value: null },
  uEnvCube: { value: null },
  uRippleTex: { value: null },
  uRippleDomain: { value: 96 },
};
