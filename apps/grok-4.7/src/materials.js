import * as THREE from "three";

export function shaderMaterial({
  uniforms,
  vertex,
  fragment,
  side = THREE.FrontSide,
  blend = "over",
  depthTest = true,
}) {
  const additive = blend === "add";
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: blend !== "opaque",
    depthWrite: blend === "opaque",
    depthTest,
    side,
    blending: additive || blend === "over" ? THREE.CustomBlending : THREE.NormalBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: additive ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: additive ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor,
  });
}
