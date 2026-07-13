import type {
  LightSpec,
  MaterialSpec,
  SceneObject,
  SceneSpec,
  Vector3Tuple,
} from "@4elements/scene-schema";
import { OrbitControls, Text } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
// biome-ignore lint/performance/noNamespaceImport: Three.js classes and constants are used broadly across renderer primitives.
import * as THREE from "three";

const FIRE_VOLUME_VERTEX_SHADER = `
  varying vec3 vLocalPosition;

  void main() {
    vLocalPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FIRE_VOLUME_FRAGMENT_SHADER = `
  precision highp float;

  uniform vec3 uCameraLocal;
  uniform vec3 uColorCore;
  uniform vec3 uColorMid;
  uniform vec3 uColorOuter;
  uniform float uHeight;
  uniform float uOpacity;
  uniform float uRadius;
  uniform float uSeed;
  uniform float uTime;
  uniform float uTurbulence;
  uniform vec2 uWind;

  varying vec3 vLocalPosition;

  float hash3(vec3 point) {
    point = fract(point * 0.1031);
    point += dot(point, point.yzx + 33.33);
    return fract((point.x + point.y) * point.z);
  }

  float valueNoise(vec3 point) {
    vec3 cell = floor(point);
    vec3 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);

    float n000 = hash3(cell + vec3(0.0, 0.0, 0.0));
    float n100 = hash3(cell + vec3(1.0, 0.0, 0.0));
    float n010 = hash3(cell + vec3(0.0, 1.0, 0.0));
    float n110 = hash3(cell + vec3(1.0, 1.0, 0.0));
    float n001 = hash3(cell + vec3(0.0, 0.0, 1.0));
    float n101 = hash3(cell + vec3(1.0, 0.0, 1.0));
    float n011 = hash3(cell + vec3(0.0, 1.0, 1.0));
    float n111 = hash3(cell + vec3(1.0, 1.0, 1.0));

    float lowA = mix(n000, n100, local.x);
    float lowB = mix(n010, n110, local.x);
    float highA = mix(n001, n101, local.x);
    float highB = mix(n011, n111, local.x);
    float low = mix(lowA, lowB, local.y);
    float high = mix(highA, highB, local.y);
    return mix(low, high, local.z);
  }

  float flameNoise(vec3 point) {
    float value = 0.0;
    float amplitude = 0.56;
    for (int octave = 0; octave < 3; octave += 1) {
      value += valueNoise(point) * amplitude;
      point = point * 2.03 + vec3(13.7, 7.9, 11.3);
      amplitude *= 0.5;
    }
    return value;
  }

  vec2 intersectBox(vec3 origin, vec3 direction, vec3 bounds) {
    vec3 inverseDirection = 1.0 / direction;
    vec3 nearPlane = (-bounds - origin) * inverseDirection;
    vec3 farPlane = (bounds - origin) * inverseDirection;
    vec3 smaller = min(nearPlane, farPlane);
    vec3 larger = max(nearPlane, farPlane);
    float nearDistance = max(max(smaller.x, smaller.y), smaller.z);
    float farDistance = min(min(larger.x, larger.y), larger.z);
    return vec2(nearDistance, farDistance);
  }

  float flameDensity(vec3 position) {
    float height = clamp(position.y / uHeight + 0.5, 0.0, 1.0);
    float baseFade = smoothstep(0.0, 0.055, height);
    float tipFade = 1.0 - smoothstep(0.9, 1.0, height);
    float taper = mix(1.08, 0.045, pow(height, 0.72));
    vec2 centered = position.xz / uRadius;
    centered -= uWind * height * height * 2.5;
    centered.x -= sin(uTime * 0.86 + height * 7.4 + uSeed) * height * 0.12;
    centered.y -= cos(uTime * 0.63 + height * 5.8 + uSeed) * height * 0.075;

    vec3 noisePosition = vec3(
      centered.x * 1.9,
      height * 4.4 - uTime * 1.35,
      centered.y * 1.9
    );
    noisePosition += vec3(uSeed * 0.017, 0.0, uSeed * 0.013);
    float broadNoise = flameNoise(noisePosition);
    float detailNoise = valueNoise(
      noisePosition * 2.15 + vec3(9.2, -uTime * 0.5, 5.7)
    );
    float warpStrength = (0.045 + uTurbulence * 0.035) * height;
    centered +=
      vec2(broadNoise - 0.5, detailNoise - 0.5) * warpStrength;

    float radialDistance = length(centered);
    float mainBody = 1.0 - smoothstep(taper * 0.28, taper, radialDistance);
    float split = smoothstep(0.24, 0.48, height);

    vec2 leftCenter = vec2(
      -0.34 + sin(uTime * 1.07 + height * 4.9 + uSeed) * 0.09,
      0.035
    );
    float leftTaper = mix(0.48, 0.05, smoothstep(0.2, 0.94, height));
    float leftBody = 1.0 - smoothstep(
      leftTaper * 0.24,
      leftTaper,
      length(centered - leftCenter)
    );
    leftBody *= smoothstep(0.17, 0.34, height);
    leftBody *= 1.0 - smoothstep(0.78, 0.96, height);

    vec2 rightCenter = vec2(
      0.31 + cos(uTime * 1.21 + height * 5.6 + uSeed) * 0.08,
      -0.06
    );
    float rightTaper = mix(0.42, 0.04, smoothstep(0.2, 0.76, height));
    float rightBody = 1.0 - smoothstep(
      rightTaper * 0.24,
      rightTaper,
      length(centered - rightCenter)
    );
    rightBody *= smoothstep(0.14, 0.31, height);
    rightBody *= 1.0 - smoothstep(0.62, 0.82, height);

    float body = max(
      mainBody * (1.0 - split * 0.32),
      max(leftBody * 0.9, rightBody * 0.84)
    );
    float breakup = smoothstep(
      0.19,
      0.69,
      broadNoise * 0.55 + detailNoise * 0.31 + body * 0.62 - height * 0.08
    );
    float lick = 0.82 + sin(
      centered.x * 4.8 + centered.y * 3.7 + uTime * 2.1 + broadNoise * 5.0
    ) * 0.18 * height;
    float turbulentBody = body * (0.38 + breakup * 0.78) * lick;

    float hotBase = exp(-radialDistance * radialDistance * 5.2);
    hotBase *= 1.0 - smoothstep(0.02, 0.24, height);
    return clamp((turbulentBody + hotBase * 0.92) * baseFade * tipFade, 0.0, 1.5);
  }

  void main() {
    vec3 rayDirection = normalize(vLocalPosition - uCameraLocal);
    vec3 bounds = vec3(uRadius * 1.2, uHeight * 0.5, uRadius * 1.2);
    vec2 hit = intersectBox(uCameraLocal, rayDirection, bounds);
    if (hit.x > hit.y || hit.y < 0.0) {
      discard;
    }

    float rayStart = max(hit.x, 0.0);
    float rayLength = hit.y - rayStart;
    float stepLength = rayLength / 36.0;
    float jitter = hash3(vec3(gl_FragCoord.xy, uSeed)) * stepLength;
    vec3 accumulatedColor = vec3(0.0);
    float accumulatedAlpha = 0.0;

    for (int stepIndex = 0; stepIndex < 36; stepIndex += 1) {
      float distanceAlongRay = rayStart + jitter + float(stepIndex) * stepLength;
      vec3 samplePosition = uCameraLocal + rayDirection * distanceAlongRay;
      float density = flameDensity(samplePosition);
      float height = clamp(samplePosition.y / uHeight + 0.5, 0.0, 1.0);
      float radialDistance = length(samplePosition.xz / uRadius);

      vec3 verticalColor = mix(uColorCore, uColorMid, smoothstep(0.08, 0.44, height));
      verticalColor = mix(verticalColor, uColorOuter, smoothstep(0.46, 0.96, height));
      float heat = clamp(density * 1.35 + (1.0 - height) * 0.42 - radialDistance * 0.12, 0.0, 1.0);
      vec3 sampleColor = mix(uColorOuter, verticalColor, smoothstep(0.08, 0.62, density));
      sampleColor = mix(sampleColor, uColorCore, heat * heat * 0.38);
      sampleColor *= 0.8 + density * 0.82;

      float sampleAlpha = density * uOpacity * 0.095;
      sampleAlpha *= 1.0 - accumulatedAlpha;
      accumulatedColor += sampleColor * sampleAlpha;
      accumulatedAlpha += sampleAlpha;

      if (accumulatedAlpha > 0.97) {
        break;
      }
    }

    if (accumulatedAlpha < 0.015) {
      discard;
    }
    gl_FragColor = vec4(accumulatedColor, accumulatedAlpha);
  }
`;

const GUST_POINT_COUNT = 9;

export interface RenderStats {
  fps: number;
  objects: number;
  triangles: number;
}

export interface SceneRendererProps {
  onStats?: (stats: RenderStats) => void;
  spec: SceneSpec;
}

function seededRandom(seed: number) {
  let value = seed % 2_147_483_647;
  if (value <= 0) {
    value += 2_147_483_646;
  }
  return () => {
    value = (value * 16_807) % 2_147_483_647;
    return (value - 1) / 2_147_483_646;
  };
}

function vector(value: Vector3Tuple) {
  return new THREE.Vector3(value[0], value[1], value[2]);
}

function materialProps(material?: MaterialSpec) {
  return {
    color: material?.color ?? "#cccccc",
    emissive: material?.emissive ?? "#000000",
    emissiveIntensity: material?.emissiveIntensity ?? 0,
    opacity: material?.opacity ?? 1,
    roughness: material?.roughness ?? 0.7,
    metalness: material?.metalness ?? 0,
    transparent: material?.opacity !== undefined && material.opacity < 1,
  };
}

function SceneEnvironment({ spec }: { spec: SceneSpec }) {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color(spec.environment.background);
    if (
      spec.environment.fogColor &&
      spec.environment.fogNear &&
      spec.environment.fogFar
    ) {
      scene.fog = new THREE.Fog(
        spec.environment.fogColor,
        spec.environment.fogNear,
        spec.environment.fogFar
      );
    } else {
      scene.fog = null;
    }
  }, [scene, spec.environment]);
  return null;
}

function CameraRig({ spec }: { spec: SceneSpec }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...spec.camera.position);
    if ("fov" in camera) {
      camera.fov = spec.camera.fov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(vector(spec.camera.target));
  }, [camera, spec.camera]);
  return (
    <OrbitControls
      dampingFactor={0.08}
      enableDamping
      makeDefault
      target={spec.camera.target}
    />
  );
}

function SceneStats({ onStats }: { onStats?: (stats: RenderStats) => void }) {
  const { scene } = useThree();
  const frameCount = useRef(0);
  const sampleStartedAt = useRef<number | null>(null);
  useFrame(() => {
    if (!onStats) {
      return;
    }
    const now = performance.now();
    if (sampleStartedAt.current === null) {
      sampleStartedAt.current = now;
      return;
    }
    frameCount.current += 1;
    const elapsedMs = now - sampleStartedAt.current;
    if (elapsedMs < 500) {
      return;
    }
    let triangles = 0;
    let objects = 0;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        objects += 1;
        const geometry = (child as THREE.Mesh).geometry;
        if (geometry?.index) {
          triangles += geometry.index.count / 3;
        } else if (geometry?.attributes.position) {
          triangles += geometry.attributes.position.count / 3;
        }
      }
    });
    onStats({
      fps: (frameCount.current * 1000) / elapsedMs,
      triangles: Math.round(triangles),
      objects,
    });
    frameCount.current = 0;
    sampleStartedAt.current = now;
  });
  return null;
}

function Light({ light }: { light: LightSpec }) {
  if (light.type === "ambient") {
    return <ambientLight color={light.color} intensity={light.intensity} />;
  }
  if (light.type === "directional") {
    return (
      <directionalLight
        castShadow
        color={light.color}
        intensity={light.intensity}
        position={light.position}
      />
    );
  }
  if (light.type === "spot") {
    return (
      <spotLight
        angle={0.5}
        color={light.color}
        intensity={light.intensity}
        penumbra={0.5}
        position={light.position}
      />
    );
  }
  return (
    <pointLight
      color={light.color}
      decay={1.7}
      distance={9}
      intensity={light.intensity}
      position={light.position}
    />
  );
}

function AnimatedGroup({
  object,
  children,
}: {
  object: SceneObject;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const current = group.current;
    if (!current) {
      return;
    }
    const time = clock.elapsedTime;
    current.rotation.set(...object.rotation);
    current.position.set(...object.position);
    for (const animation of object.animations) {
      if (animation.type === "rotation") {
        const axis = animation.axis ?? "y";
        current.rotation[axis] += time * (animation.speed ?? 0.25);
      }
      if (animation.type === "bob") {
        current.position.y +=
          Math.sin(time * (animation.speed ?? 1)) *
          (animation.strength ?? 0.12);
      }
      if (animation.type === "sway") {
        current.rotation.z +=
          Math.sin(time * (animation.speed ?? 1)) *
          (animation.strength ?? 0.08);
      }
    }
  });
  return (
    <group
      position={object.position}
      ref={group}
      rotation={object.rotation}
      scale={object.scale}
    >
      {children}
    </group>
  );
}

function FloorPrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "floor" }>;
}) {
  return (
    <AnimatedGroup object={object}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[object.width, object.depth, 1, 1]} />
        <meshStandardMaterial {...materialProps(object.material)} />
      </mesh>
    </AnimatedGroup>
  );
}

function WallPrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "wall" }>;
}) {
  return (
    <AnimatedGroup object={object}>
      <mesh receiveShadow>
        <planeGeometry args={[object.width, object.height, 1, 1]} />
        <meshStandardMaterial
          {...materialProps(object.material)}
          side={THREE.DoubleSide}
        />
      </mesh>
    </AnimatedGroup>
  );
}

function WindowPrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "window" }>;
}) {
  const rail = 0.08;
  const frameMaterial = (
    <meshStandardMaterial color={object.frameColor} roughness={0.58} />
  );
  return (
    <AnimatedGroup object={object}>
      <mesh position={[0, 0, -0.015]}>
        <planeGeometry args={[object.width * 0.9, object.height * 0.9]} />
        <meshStandardMaterial
          color="#9ed7e1"
          metalness={0.05}
          opacity={0.2}
          roughness={0.1}
          transparent
        />
      </mesh>
      <mesh position={[0, object.height / 2, 0]}>
        <boxGeometry args={[object.width + rail, rail, rail]} />
        {frameMaterial}
      </mesh>
      <mesh position={[0, -object.height / 2, 0]}>
        <boxGeometry args={[object.width + rail, rail, rail]} />
        {frameMaterial}
      </mesh>
      <mesh position={[-object.width / 2, 0, 0]}>
        <boxGeometry args={[rail, object.height + rail, rail]} />
        {frameMaterial}
      </mesh>
      <mesh position={[object.width / 2, 0, 0]}>
        <boxGeometry args={[rail, object.height + rail, rail]} />
        {frameMaterial}
      </mesh>
      <mesh>
        <boxGeometry args={[rail, object.height, rail]} />
        {frameMaterial}
      </mesh>
      <mesh>
        <boxGeometry args={[object.width, rail, rail]} />
        {frameMaterial}
      </mesh>
    </AnimatedGroup>
  );
}

function BasicPrimitive({
  object,
}: {
  object: Extract<
    SceneObject,
    { type: "box" | "cylinder" | "sphere" | "plane" | "text" }
  >;
}) {
  if (object.type === "box") {
    return (
      <AnimatedGroup object={object}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={object.size} />
          <meshStandardMaterial {...materialProps(object.material)} />
        </mesh>
      </AnimatedGroup>
    );
  }
  if (object.type === "cylinder") {
    return (
      <AnimatedGroup object={object}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry
            args={[
              object.radiusTop,
              object.radiusBottom,
              object.height,
              object.radialSegments,
            ]}
          />
          <meshStandardMaterial {...materialProps(object.material)} />
        </mesh>
      </AnimatedGroup>
    );
  }
  if (object.type === "sphere") {
    return (
      <AnimatedGroup object={object}>
        <mesh castShadow receiveShadow>
          <sphereGeometry
            args={[object.radius, object.segments, object.segments]}
          />
          <meshStandardMaterial {...materialProps(object.material)} />
        </mesh>
      </AnimatedGroup>
    );
  }
  if (object.type === "text") {
    return (
      <AnimatedGroup object={object}>
        <Text
          anchorX="center"
          anchorY="middle"
          color={object.material?.color ?? "#f4f0e8"}
          fontSize={object.fontSize}
        >
          {object.text}
        </Text>
      </AnimatedGroup>
    );
  }
  return (
    <AnimatedGroup object={object}>
      <mesh receiveShadow>
        <planeGeometry args={[object.width, object.height, 1, 1]} />
        <meshStandardMaterial
          {...materialProps(object.material)}
          side={THREE.DoubleSide}
        />
      </mesh>
    </AnimatedGroup>
  );
}

function CurtainPrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "curtain" }>;
}) {
  const mesh = useRef<THREE.Mesh<THREE.PlaneGeometry>>(null);
  const initial = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(
      object.width,
      object.height,
      object.segments,
      object.segments
    );
    return Float32Array.from(geometry.attributes.position.array);
  }, [object.width, object.height, object.segments]);

  useFrame(({ clock }) => {
    const current = mesh.current;
    if (!current) {
      return;
    }
    const positions = current.geometry.attributes.position;
    const time = clock.elapsedTime;
    for (let i = 0; i < positions.count; i += 1) {
      const x = initial[i * 3];
      const y = initial[i * 3 + 1];
      const z = initial[i * 3 + 2];
      const free = THREE.MathUtils.clamp(
        (object.height / 2 - y) / object.height,
        0,
        1
      );
      const anchorFalloff = free ** 1.45;
      const gust =
        Math.sin(time * object.gustFrequency + x * 3.1 + object.seed) +
        Math.sin(
          time * object.gustFrequency * 1.7 + y * 4.2 + object.seed * 0.37
        ) *
          object.turbulence *
          0.45;
      const fold =
        Math.sin((x / object.width + 0.5) * object.topAnchorPoints * Math.PI) *
        0.05;
      const amplitude =
        object.windStrength * (1 - object.damping) * anchorFalloff;
      positions.setXYZ(
        i,
        x + object.windDirection[0] * gust * amplitude * 0.08,
        y + fold * anchorFalloff,
        z +
          object.windDirection[2] * gust * amplitude * 0.24 +
          Math.sin(time * 2 + x * 8) * 0.04 * anchorFalloff
      );
    }
    positions.needsUpdate = true;
    current.geometry.computeVertexNormals();
  });

  return (
    <AnimatedGroup object={object}>
      <mesh castShadow ref={mesh}>
        <planeGeometry
          args={[object.width, object.height, object.segments, object.segments]}
        />
        <meshStandardMaterial
          color={object.fabricColor}
          opacity={object.opacity}
          roughness={0.82}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
    </AnimatedGroup>
  );
}

function ParticleFieldPrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "particleField" }>;
}) {
  const random = useMemo(() => seededRandom(object.seed), [object.seed]);
  const seeds = useMemo(
    () =>
      Array.from({ length: object.count }, () => ({
        x: (random() - 0.5) * object.spread[0],
        y: (random() - 0.5) * object.spread[1],
        z: (random() - 0.5) * object.spread[2],
        phase: random() * Math.PI * 2,
      })),
    [object.count, object.spread, random]
  );
  const geometry = useMemo(() => {
    const positions = new Float32Array(object.count * 3);
    seeds.forEach((particle, index) => {
      positions[index * 3] = particle.x;
      positions[index * 3 + 1] = particle.y;
      positions[index * 3 + 2] = particle.z;
    });
    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    return nextGeometry;
  }, [object.count, seeds]);

  useFrame(({ clock }) => {
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    const time = clock.elapsedTime * object.speed;
    seeds.forEach((particle, index) => {
      const cycle = (time + particle.phase) % 1;
      const driftX = object.drift[0] * time;
      const driftY = object.drift[1] * cycle * object.spread[1];
      const driftZ = object.drift[2] * time;
      positions.setXYZ(
        index,
        ((particle.x + driftX + object.spread[0] * 0.5) % object.spread[0]) -
          object.spread[0] * 0.5,
        ((particle.y + driftY + object.spread[1] * 0.5) % object.spread[1]) -
          object.spread[1] * 0.5,
        ((particle.z + driftZ + object.spread[2] * 0.5) % object.spread[2]) -
          object.spread[2] * 0.5
      );
    });
    positions.needsUpdate = true;
  });

  return (
    <AnimatedGroup object={object}>
      <points geometry={geometry}>
        <pointsMaterial
          blending={THREE.AdditiveBlending}
          color={object.colorPalette[0]}
          depthWrite={false}
          opacity={object.opacity}
          size={object.size}
          transparent
        />
      </points>
    </AnimatedGroup>
  );
}

function FlamePrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "flame" }>;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const current = group.current;
    if (!current) {
      return;
    }
    const time = clock.elapsedTime * object.flickerSpeed;
    current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      const pulse =
        1 +
        Math.sin(time + index * 1.7) * 0.08 +
        Math.sin(time * 2.1 + index) * 0.04;
      mesh.scale.setScalar(pulse);
      mesh.rotation.y = Math.sin(time * 0.35 + index) * 0.22;
    });
  });
  return (
    <AnimatedGroup object={object}>
      <group ref={group}>
        <mesh position={[0, object.height * 0.45, 0]}>
          <coneGeometry args={[object.radius, object.height, 32, 1, true]} />
          <meshBasicMaterial
            blending={THREE.AdditiveBlending}
            color={object.colorOuter}
            depthWrite={false}
            opacity={0.34}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
        <mesh position={[0, object.height * 0.42, 0]}>
          <coneGeometry
            args={[object.radius * 0.68, object.height * 0.82, 32, 1, true]}
          />
          <meshBasicMaterial
            blending={THREE.AdditiveBlending}
            color={object.colorMid}
            depthWrite={false}
            opacity={0.62}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
        <mesh position={[0, object.height * 0.34, 0]}>
          <coneGeometry
            args={[object.radius * 0.36, object.height * 0.55, 32, 1, true]}
          />
          <meshBasicMaterial
            blending={THREE.AdditiveBlending}
            color={object.colorCore}
            depthWrite={false}
            opacity={0.78}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
      </group>
      <pointLight
        color={object.colorMid}
        decay={1.8}
        distance={6}
        intensity={object.lightIntensity}
        position={[0, object.height * 0.5, 0]}
      />
    </AnimatedGroup>
  );
}

function FireVolumePrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "fireVolume" }>;
}) {
  const volumeMesh = useRef<THREE.Mesh>(null);
  const sparkMesh = useRef<THREE.InstancedMesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cameraLocal = useMemo(() => new THREE.Vector3(), []);
  const { camera } = useThree();
  const uniforms = useMemo(
    () => ({
      uCameraLocal: { value: new THREE.Vector3() },
      uColorCore: { value: new THREE.Color(object.colorCore) },
      uColorMid: { value: new THREE.Color(object.colorMid) },
      uColorOuter: { value: new THREE.Color(object.colorOuter) },
      uHeight: { value: object.height },
      uOpacity: { value: object.opacity },
      uRadius: { value: object.radius },
      uSeed: { value: object.seed },
      uTime: { value: 0 },
      uTurbulence: { value: object.turbulence },
      uWind: { value: new THREE.Vector2(object.wind[0], object.wind[2]) },
    }),
    [
      object.colorCore,
      object.colorMid,
      object.colorOuter,
      object.height,
      object.opacity,
      object.radius,
      object.seed,
      object.turbulence,
      object.wind,
    ]
  );
  const sparks = useMemo(() => {
    const random = seededRandom(object.seed + 97);
    return Array.from({ length: object.sparkCount }, () => ({
      x: (random() - 0.5) * object.radius * 1.45,
      z: (random() - 0.5) * object.radius * 1.45,
      phase: random(),
      speed: 0.34 + random() * 0.72,
      size: 0.012 + random() * 0.025,
      life: 0.46 + random() * 0.3,
    }));
  }, [object.radius, object.seed, object.sparkCount]);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const currentVolume = volumeMesh.current;
    if (currentVolume) {
      uniforms.uTime.value = time * object.flickerSpeed;
      currentVolume.updateWorldMatrix(true, false);
      cameraLocal.copy(camera.position);
      currentVolume.worldToLocal(cameraLocal);
      uniforms.uCameraLocal.value.copy(cameraLocal);
    }

    const currentSparks = sparkMesh.current;
    if (currentSparks) {
      for (const [index, spark] of sparks.entries()) {
        const cycle = (time * spark.speed + spark.phase) % 1;
        const remaining = 1 - cycle;
        const spiral = time * 2.1 + spark.phase * Math.PI * 2;
        dummy.position.set(
          spark.x * remaining +
            object.wind[0] * cycle * object.height * 1.8 +
            Math.sin(spiral) * object.radius * cycle * 0.18,
          0.12 + cycle * object.height * 1.18,
          spark.z * remaining +
            object.wind[2] * cycle * object.height * 1.8 +
            Math.cos(spiral * 0.83) * object.radius * cycle * 0.16
        );
        const appear = THREE.MathUtils.smoothstep(cycle, 0.02, 0.1);
        const disappear =
          1 -
          THREE.MathUtils.smoothstep(
            cycle,
            spark.life,
            Math.min(spark.life + 0.18, 1)
          );
        const scale =
          spark.size * (0.36 + remaining * 0.9) * appear * disappear;
        dummy.scale.set(scale, scale * 1.45, scale);
        dummy.rotation.set(spiral, spiral * 0.7, 0);
        dummy.updateMatrix();
        currentSparks.setMatrixAt(index, dummy.matrix);
      }
      currentSparks.instanceMatrix.needsUpdate = true;
    }

    if (light.current) {
      const pulse =
        0.9 + Math.sin(time * 7.1) * 0.065 + Math.sin(time * 11.7) * 0.035;
      light.current.intensity = object.lightIntensity * pulse;
    }
  });

  return (
    <AnimatedGroup object={object}>
      <mesh
        position={[0, object.height * 0.5, 0]}
        ref={volumeMesh}
        renderOrder={4}
      >
        <boxGeometry
          args={[object.radius * 2.4, object.height, object.radius * 2.4]}
        />
        <shaderMaterial
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fragmentShader={FIRE_VOLUME_FRAGMENT_SHADER}
          premultipliedAlpha
          side={THREE.BackSide}
          toneMapped={false}
          transparent
          uniforms={uniforms}
          vertexShader={FIRE_VOLUME_VERTEX_SHADER}
        />
      </mesh>
      {object.sparkCount > 0 ? (
        <instancedMesh
          args={[undefined, undefined, object.sparkCount]}
          ref={sparkMesh}
          renderOrder={5}
        >
          <sphereGeometry args={[1, 6, 4]} />
          <meshBasicMaterial
            blending={THREE.AdditiveBlending}
            color={object.colorMid}
            depthWrite={false}
            opacity={0.9}
            toneMapped={false}
            transparent
          />
        </instancedMesh>
      ) : null}
      <pointLight
        color={object.colorMid}
        decay={1.7}
        distance={7}
        intensity={object.lightIntensity}
        position={[0, object.height * 0.42, 0]}
        ref={light}
      />
    </AnimatedGroup>
  );
}

function SmokePrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "smoke" }>;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const random = useMemo(() => seededRandom(object.seed), [object.seed]);
  const particles = useMemo(
    () =>
      Array.from({ length: object.count }, () => ({
        angle: random() * Math.PI * 2,
        radius: random() * object.radius,
        y: random() * object.height,
        phase: random() * Math.PI * 2,
        scale: 0.16 + random() * 0.28,
      })),
    [object.count, object.height, object.radius, random]
  );
  useFrame(({ clock }) => {
    const current = mesh.current;
    if (!current) {
      return;
    }
    const time = clock.elapsedTime * 0.18;
    particles.forEach((particle, index) => {
      const y = (particle.y + time * object.height) % object.height;
      const spread = 0.3 + y / object.height;
      dummy.position.set(
        Math.cos(particle.angle + time + particle.phase) *
          particle.radius *
          spread,
        y,
        Math.sin(particle.angle + time * 0.8 + particle.phase) *
          particle.radius *
          spread
      );
      dummy.scale.setScalar(particle.scale * (1 + y / object.height));
      dummy.updateMatrix();
      current.setMatrixAt(index, dummy.matrix);
    });
    current.instanceMatrix.needsUpdate = true;
  });
  return (
    <AnimatedGroup object={object}>
      <instancedMesh args={[undefined, undefined, object.count]} ref={mesh}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial
          color="#a79f96"
          depthWrite={false}
          opacity={object.opacity}
          transparent
        />
      </instancedMesh>
    </AnimatedGroup>
  );
}

function LinearWindFieldPrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "windField" }>;
}) {
  const group = useRef<THREE.Group>(null);
  const random = useMemo(() => seededRandom(object.seed), [object.seed]);
  const lines = useMemo(
    () =>
      Array.from({ length: object.count }, (_, index) => {
        const y = (random() - 0.5) * object.height;
        const z = (random() - 0.5) * 1.2;
        const offset = random() * object.width;
        const positions = new Float32Array(18);
        for (let i = 0; i < 6; i += 1) {
          const x = (i / 5 - 0.5) * object.width;
          positions[i * 3] = x;
          positions[i * 3 + 1] = y + Math.sin(i * 1.25 + offset) * 0.12;
          positions[i * 3 + 2] = z + Math.cos(i * 1.45 + offset) * 0.08;
        }
        return { key: `${object.id}-wind-${index}`, positions, offset };
      }),
    [object.count, object.height, object.id, object.width, random]
  );
  useFrame(({ clock }) => {
    if (!group.current) {
      return;
    }
    group.current.position.x =
      Math.sin(clock.elapsedTime * object.strength) * 0.08;
  });
  return (
    <AnimatedGroup object={object}>
      <group ref={group}>
        {lines.map((line, index) => (
          <line key={line.key}>
            <bufferGeometry>
              <bufferAttribute
                args={[line.positions, 3]}
                attach="attributes-position"
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={object.color}
              opacity={0.28 + (index % 3) * 0.12}
              transparent
            />
          </line>
        ))}
      </group>
    </AnimatedGroup>
  );
}

function GustWindFieldPrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "windField" }>;
}) {
  const positionAttributes = useRef<Array<THREE.BufferAttribute | null>>([]);
  const boundingSphere = useMemo(
    () =>
      new THREE.Sphere(
        new THREE.Vector3(),
        Math.hypot(object.width * 0.75, object.height, 1.5)
      ),
    [object.height, object.width]
  );
  const gusts = useMemo(() => {
    const random = seededRandom(object.seed);
    return Array.from({ length: object.count }, (_, index) => ({
      key: `${object.id}-gust-${index}`,
      y: (random() - 0.5) * object.height,
      z: (random() - 0.5) * 1.25,
      phase: random() * object.width,
      speed: 0.48 + random() * 0.78,
      length: object.width * (0.13 + random() * 0.14),
      lift: (random() - 0.5) * 0.28,
      positions: new Float32Array(GUST_POINT_COUNT * 3),
    }));
  }, [object.count, object.height, object.id, object.seed, object.width]);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime * object.strength;
    for (const [gustIndex, gust] of gusts.entries()) {
      const positions = positionAttributes.current[gustIndex];
      if (!positions) {
        continue;
      }
      const travel = object.width + gust.length * 2;
      const head =
        ((time * gust.speed + gust.phase) % travel) -
        object.width * 0.5 -
        gust.length;
      for (let pointIndex = 0; pointIndex < GUST_POINT_COUNT; pointIndex += 1) {
        const progress = pointIndex / (GUST_POINT_COUNT - 1);
        const x = head - gust.length * (1 - progress);
        const curl = Math.sin(progress * Math.PI);
        positions.setXYZ(
          pointIndex,
          x,
          gust.y +
            Math.sin(x * 0.72 + time * 1.25 + gust.phase) * 0.1 +
            curl * gust.lift,
          gust.z +
            Math.cos(x * 0.58 - time * 0.9 + gust.phase) * 0.08 +
            curl * 0.12
        );
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <AnimatedGroup object={object}>
      {gusts.map((gust, index) => (
        <line key={gust.key}>
          <bufferGeometry boundingSphere={boundingSphere}>
            <bufferAttribute
              args={[gust.positions, 3]}
              attach="attributes-position"
              ref={(attribute) => {
                positionAttributes.current[index] = attribute;
              }}
              usage={THREE.DynamicDrawUsage}
            />
          </bufferGeometry>
          <lineBasicMaterial
            blending={THREE.AdditiveBlending}
            color={object.color}
            depthWrite={false}
            opacity={0.32 + (index % 4) * 0.08}
            transparent
          />
        </line>
      ))}
    </AnimatedGroup>
  );
}

function WindFieldPrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "windField" }>;
}) {
  if (object.style === "gusts") {
    return <GustWindFieldPrimitive object={object} />;
  }
  return <LinearWindFieldPrimitive object={object} />;
}

function LeafFieldPrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "leafField" }>;
}) {
  const leavesRef = useRef<Array<THREE.Mesh | null>>([]);
  const random = useMemo(() => seededRandom(object.seed), [object.seed]);
  const leaves = useMemo(
    () =>
      Array.from({ length: object.count }, (_, index) => ({
        key: `${object.id}-leaf-${index}`,
        x: (random() - 0.5) * object.spread[0],
        y: (random() - 0.5) * object.spread[1],
        z: (random() - 0.5) * object.spread[2],
        speed: 0.45 + random() * 0.9,
        phase: random() * Math.PI * 2,
        scale: 0.07 + random() * 0.08,
        color:
          object.colorPalette[
            Math.floor(random() * object.colorPalette.length)
          ],
      })),
    [object.colorPalette, object.count, object.id, object.spread, random]
  );
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    leaves.forEach((leaf, index) => {
      const current = leavesRef.current[index];
      if (!current) {
        return;
      }
      const x =
        ((leaf.x +
          time * leaf.speed * object.windStrength +
          object.spread[0] * 0.5) %
          object.spread[0]) -
        object.spread[0] * 0.5;
      current.position.set(
        x,
        leaf.y + Math.sin(time * 1.7 + leaf.phase) * 0.22,
        leaf.z + Math.cos(time + leaf.phase) * 0.15
      );
      current.rotation.set(
        time * leaf.speed + leaf.phase,
        time * 1.6 + leaf.phase,
        Math.sin(time + leaf.phase)
      );
      current.scale.set(leaf.scale * 1.8, leaf.scale, leaf.scale);
    });
  });
  return (
    <AnimatedGroup object={object}>
      {leaves.map((leaf, index) => (
        <mesh
          key={leaf.key}
          position={[leaf.x, leaf.y, leaf.z]}
          ref={(node) => {
            leavesRef.current[index] = node;
          }}
          scale={[leaf.scale * 1.8, leaf.scale, leaf.scale]}
        >
          <planeGeometry args={[1, 0.45]} />
          <meshBasicMaterial color={leaf.color} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </AnimatedGroup>
  );
}

function TerrainPrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "terrain" }>;
}) {
  const geometry = useMemo(() => {
    const nextGeometry = new THREE.PlaneGeometry(
      object.width,
      object.depth,
      object.segments,
      object.segments
    );
    const positions = nextGeometry.attributes.position as THREE.BufferAttribute;
    const random = seededRandom(object.seed);
    const ridgeA = random() * Math.PI * 2;
    const ridgeB = random() * Math.PI * 2;
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const distance = Math.sqrt(x * x + y * y);
      const height =
        Math.sin(x * 1.6 + ridgeA) * 0.18 +
        Math.cos(y * 1.2 + ridgeB) * 0.16 +
        Math.sin(distance * 2.7) * 0.12 -
        distance * 0.025;
      positions.setZ(i, height * object.heightScale);
    }
    positions.needsUpdate = true;
    nextGeometry.computeVertexNormals();
    return nextGeometry;
  }, [
    object.depth,
    object.heightScale,
    object.seed,
    object.segments,
    object.width,
  ]);
  return (
    <AnimatedGroup object={object}>
      <mesh
        castShadow
        geometry={geometry}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial {...materialProps(object.material)} />
      </mesh>
    </AnimatedGroup>
  );
}

function RockPrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "rock" }>;
}) {
  const geometry = useMemo(() => {
    const nextGeometry = new THREE.DodecahedronGeometry(
      object.radius,
      object.detail
    );
    const positions = nextGeometry.attributes.position as THREE.BufferAttribute;
    const random = seededRandom(object.seed);
    for (let i = 0; i < positions.count; i += 1) {
      const factor = 0.82 + random() * 0.34;
      positions.setXYZ(
        i,
        positions.getX(i) * factor,
        positions.getY(i) * (0.7 + random() * 0.3),
        positions.getZ(i) * factor
      );
    }
    positions.needsUpdate = true;
    nextGeometry.computeVertexNormals();
    return nextGeometry;
  }, [object.detail, object.radius, object.seed]);
  return (
    <AnimatedGroup object={object}>
      <mesh castShadow geometry={geometry} receiveShadow>
        <meshStandardMaterial {...materialProps(object.material)} />
      </mesh>
    </AnimatedGroup>
  );
}

function CrackPrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "crack" }>;
}) {
  const random = useMemo(() => seededRandom(object.seed), [object.seed]);
  const branches = useMemo(() => {
    const main = new Float32Array([
      -object.length / 2,
      0,
      0,
      object.length / 2,
      0,
      0,
    ]);
    const offshoots = Array.from({ length: object.branches }, (_, index) => {
      const start = (random() - 0.5) * object.length;
      const side = random() > 0.5 ? 1 : -1;
      const len = 0.35 + random() * 0.8;
      return {
        key: `${object.id}-branch-${index}`,
        positions: new Float32Array([
          start,
          0,
          0,
          start + len * 0.45,
          side * len,
          0,
        ]),
      };
    });
    return [{ key: `${object.id}-main`, positions: main }, ...offshoots];
  }, [object.branches, object.id, object.length, random]);
  return (
    <AnimatedGroup object={object}>
      {branches.map((branch, index) => (
        <line key={branch.key}>
          <bufferGeometry>
            <bufferAttribute
              args={[branch.positions, 3]}
              attach="attributes-position"
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={object.glowColor}
            linewidth={2}
            opacity={index === 0 ? 0.95 : 0.6}
            transparent
          />
        </line>
      ))}
      <pointLight
        color={object.glowColor}
        decay={1.8}
        distance={3.8}
        intensity={2.6}
        position={[0, 0, 0.08]}
      />
    </AnimatedGroup>
  );
}

function WaterSurfacePrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "waterSurface" }>;
}) {
  const mesh = useRef<THREE.Mesh<THREE.PlaneGeometry>>(null);
  const initial = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(
      object.width,
      object.depth,
      object.segments,
      object.segments
    );
    return Float32Array.from(geometry.attributes.position.array);
  }, [object.depth, object.segments, object.width]);
  useFrame(({ clock }) => {
    const current = mesh.current;
    if (!current) {
      return;
    }
    const positions = current.geometry.attributes.position;
    const time = clock.elapsedTime * object.waveSpeed;
    for (let i = 0; i < positions.count; i += 1) {
      const x = initial[i * 3];
      const y = initial[i * 3 + 1];
      const distance = Math.sqrt(x * x + y * y);
      const wave =
        Math.sin(distance * 4.2 - time * 2.2) +
        Math.sin(x * 3.1 + time) * 0.45 +
        Math.cos(y * 2.8 - time * 1.3) * 0.35;
      positions.setXYZ(i, x, y, wave * object.waveStrength);
    }
    positions.needsUpdate = true;
    current.geometry.computeVertexNormals();
  });
  return (
    <AnimatedGroup object={object}>
      <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry
          args={[object.width, object.depth, object.segments, object.segments]}
        />
        <meshStandardMaterial
          color={object.color}
          metalness={object.material?.metalness ?? 0.04}
          opacity={object.opacity}
          roughness={object.material?.roughness ?? 0.12}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
    </AnimatedGroup>
  );
}

function WaveRingPrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "waveRing" }>;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const time = clock.elapsedTime * object.speed;
    const pulse = 1 + (time % 1.8) * 0.18;
    if (mesh.current) {
      mesh.current.scale.setScalar(pulse);
    }
    if (material.current) {
      material.current.opacity = 0.55 - ((time % 1.8) / 1.8) * 0.32;
    }
  });
  return (
    <AnimatedGroup object={object}>
      <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[object.radius, object.thickness, 8, 96]} />
        <meshBasicMaterial
          color={object.color}
          depthWrite={false}
          opacity={0.55}
          ref={material}
          transparent
        />
      </mesh>
    </AnimatedGroup>
  );
}

function FoamPrimitive({
  object,
}: {
  object: Extract<SceneObject, { type: "foam" }>;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const random = useMemo(() => seededRandom(object.seed), [object.seed]);
  const bubbles = useMemo(
    () =>
      Array.from({ length: object.count }, () => ({
        angle: random() * Math.PI * 2,
        radius: object.radius * (0.86 + random() * 0.18),
        scale: 0.025 + random() * 0.05,
        phase: random() * Math.PI * 2,
      })),
    [object.count, object.radius, random]
  );
  useFrame(({ clock }) => {
    if (!mesh.current) {
      return;
    }
    bubbles.forEach((bubble, index) => {
      const angle =
        bubble.angle + Math.sin(clock.elapsedTime * 0.45 + bubble.phase) * 0.03;
      dummy.position.set(
        Math.cos(angle) * bubble.radius,
        0,
        Math.sin(angle) * bubble.radius
      );
      dummy.rotation.set(Math.PI / 2, 0, angle);
      dummy.scale.setScalar(bubble.scale);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <AnimatedGroup object={object}>
      <instancedMesh args={[undefined, undefined, object.count]} ref={mesh}>
        <torusGeometry args={[1, 0.22, 6, 18]} />
        <meshBasicMaterial
          color={object.color}
          depthWrite={false}
          opacity={0.7}
          transparent
        />
      </instancedMesh>
    </AnimatedGroup>
  );
}

function SceneObjectRenderer({ object }: { object: SceneObject }) {
  switch (object.type) {
    case "floor":
      return <FloorPrimitive object={object} />;
    case "wall":
      return <WallPrimitive object={object} />;
    case "window":
      return <WindowPrimitive object={object} />;
    case "curtain":
      return <CurtainPrimitive object={object} />;
    case "particleField":
      return <ParticleFieldPrimitive object={object} />;
    case "flame":
      return <FlamePrimitive object={object} />;
    case "fireVolume":
      return <FireVolumePrimitive object={object} />;
    case "smoke":
      return <SmokePrimitive object={object} />;
    case "windField":
      return <WindFieldPrimitive object={object} />;
    case "leafField":
      return <LeafFieldPrimitive object={object} />;
    case "terrain":
      return <TerrainPrimitive object={object} />;
    case "rock":
      return <RockPrimitive object={object} />;
    case "crack":
      return <CrackPrimitive object={object} />;
    case "waterSurface":
      return <WaterSurfacePrimitive object={object} />;
    case "waveRing":
      return <WaveRingPrimitive object={object} />;
    case "foam":
      return <FoamPrimitive object={object} />;
    default:
      return <BasicPrimitive object={object} />;
  }
}

export function SceneRenderer({ spec, onStats }: SceneRendererProps) {
  return (
    <Canvas
      camera={{ position: spec.camera.position, fov: spec.camera.fov }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      shadows
    >
      <SceneEnvironment spec={spec} />
      <CameraRig spec={spec} />
      <SceneStats onStats={onStats} />
      {spec.lights.map((light) => (
        <Light key={light.id} light={light} />
      ))}
      {spec.objects.map((object) => (
        <SceneObjectRenderer key={object.id} object={object} />
      ))}
    </Canvas>
  );
}
