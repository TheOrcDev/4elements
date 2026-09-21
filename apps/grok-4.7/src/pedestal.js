import * as THREE from "three";

export function createPedestal(accent) {
  const group = new THREE.Group();

  const stone = new THREE.MeshStandardMaterial({
    color: 0x14161c,
    metalness: 0.58,
    roughness: 0.34,
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.02, 2.26, 0.48, 6), stone);
  plinth.position.y = 0.24;

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.74, 0.16, 6), stone);
  cap.position.y = 0.54;

  const trim = new THREE.Mesh(
    new THREE.TorusGeometry(1.62, 0.016, 10, 48),
    new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 0.55,
      metalness: 0.85,
      roughness: 0.22,
    }),
  );
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 0.63;

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(2.45, 48),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;

  group.add(plinth, cap, trim, shadow);
  return group;
}
