import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import type { LightSpec, MaterialSpec, SceneObject, SceneSpec, Vector3Tuple } from "@elementbench/scene-schema";

export type RenderStats = {
  fps: number;
  triangles: number;
  objects: number;
};

export type SceneRendererProps = {
  spec: SceneSpec;
  onStats?: (stats: RenderStats) => void;
};

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
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
    transparent: material?.opacity !== undefined && material.opacity < 1
  };
}

function SceneEnvironment({ spec }: { spec: SceneSpec }) {
  const { scene } = useThree();
  React.useEffect(() => {
    scene.background = new THREE.Color(spec.environment.background);
    if (spec.environment.fogColor && spec.environment.fogNear && spec.environment.fogFar) {
      scene.fog = new THREE.Fog(spec.environment.fogColor, spec.environment.fogNear, spec.environment.fogFar);
    } else {
      scene.fog = null;
    }
  }, [scene, spec.environment]);
  return null;
}

function CameraRig({ spec }: { spec: SceneSpec }) {
  const { camera } = useThree();
  React.useEffect(() => {
    camera.position.set(...spec.camera.position);
    if ("fov" in camera) {
      camera.fov = spec.camera.fov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(vector(spec.camera.target));
  }, [camera, spec.camera]);
  return <OrbitControls makeDefault target={spec.camera.target} enableDamping dampingFactor={0.08} />;
}

function SceneStats({ onStats }: { onStats?: (stats: RenderStats) => void }) {
  const { scene } = useThree();
  const frameCount = React.useRef(0);
  const elapsed = React.useRef(0);
  useFrame((_, delta) => {
    if (!onStats) return;
    frameCount.current += 1;
    elapsed.current += delta;
    if (elapsed.current < 0.6) return;
    let triangles = 0;
    let objects = 0;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        objects += 1;
        const geometry = (child as THREE.Mesh).geometry;
        if (geometry?.index) triangles += geometry.index.count / 3;
        else if (geometry?.attributes.position) triangles += geometry.attributes.position.count / 3;
      }
    });
    onStats({
      fps: frameCount.current / elapsed.current,
      triangles: Math.round(triangles),
      objects
    });
    frameCount.current = 0;
    elapsed.current = 0;
  });
  return null;
}

function Light({ light }: { light: LightSpec }) {
  if (light.type === "ambient") {
    return <ambientLight color={light.color} intensity={light.intensity} />;
  }
  if (light.type === "directional") {
    return <directionalLight color={light.color} intensity={light.intensity} position={light.position} castShadow />;
  }
  if (light.type === "spot") {
    return <spotLight color={light.color} intensity={light.intensity} position={light.position} angle={0.5} penumbra={0.5} />;
  }
  return <pointLight color={light.color} intensity={light.intensity} position={light.position} distance={9} decay={1.7} />;
}

function AnimatedGroup({ object, children }: { object: SceneObject; children: React.ReactNode }) {
  const group = React.useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const current = group.current;
    if (!current) return;
    const time = clock.elapsedTime;
    current.rotation.set(...object.rotation);
    current.position.set(...object.position);
    for (const animation of object.animations) {
      if (animation.type === "rotation") {
        const axis = animation.axis ?? "y";
        current.rotation[axis] += time * (animation.speed ?? 0.25);
      }
      if (animation.type === "bob") {
        current.position.y += Math.sin(time * (animation.speed ?? 1)) * (animation.strength ?? 0.12);
      }
      if (animation.type === "sway") {
        current.rotation.z += Math.sin(time * (animation.speed ?? 1)) * (animation.strength ?? 0.08);
      }
    }
  });
  return (
    <group ref={group} position={object.position} rotation={object.rotation} scale={object.scale}>
      {children}
    </group>
  );
}

function FloorPrimitive({ object }: { object: Extract<SceneObject, { type: "floor" }> }) {
  return (
    <AnimatedGroup object={object}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[object.width, object.depth, 1, 1]} />
        <meshStandardMaterial {...materialProps(object.material)} />
      </mesh>
    </AnimatedGroup>
  );
}

function WallPrimitive({ object }: { object: Extract<SceneObject, { type: "wall" }> }) {
  return (
    <AnimatedGroup object={object}>
      <mesh receiveShadow>
        <planeGeometry args={[object.width, object.height, 1, 1]} />
        <meshStandardMaterial {...materialProps(object.material)} side={THREE.DoubleSide} />
      </mesh>
    </AnimatedGroup>
  );
}

function WindowPrimitive({ object }: { object: Extract<SceneObject, { type: "window" }> }) {
  const rail = 0.08;
  const frameMaterial = <meshStandardMaterial color={object.frameColor} roughness={0.58} />;
  return (
    <AnimatedGroup object={object}>
      <mesh position={[0, 0, -0.015]}>
        <planeGeometry args={[object.width * 0.9, object.height * 0.9]} />
        <meshStandardMaterial color="#9ed7e1" opacity={0.2} transparent roughness={0.1} metalness={0.05} />
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

function BasicPrimitive({ object }: { object: Extract<SceneObject, { type: "box" | "sphere" | "plane" | "text" }> }) {
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
  if (object.type === "sphere") {
    return (
      <AnimatedGroup object={object}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[object.radius, object.segments, object.segments]} />
          <meshStandardMaterial {...materialProps(object.material)} />
        </mesh>
      </AnimatedGroup>
    );
  }
  if (object.type === "text") {
    return (
      <AnimatedGroup object={object}>
        <Text fontSize={object.fontSize} color={object.material?.color ?? "#f4f0e8"} anchorX="center" anchorY="middle">
          {object.text}
        </Text>
      </AnimatedGroup>
    );
  }
  return (
    <AnimatedGroup object={object}>
      <mesh receiveShadow>
        <planeGeometry args={[object.width, object.height, 1, 1]} />
        <meshStandardMaterial {...materialProps(object.material)} side={THREE.DoubleSide} />
      </mesh>
    </AnimatedGroup>
  );
}

function CurtainPrimitive({ object }: { object: Extract<SceneObject, { type: "curtain" }> }) {
  const mesh = React.useRef<THREE.Mesh<THREE.PlaneGeometry>>(null);
  const initial = React.useMemo(() => {
    const geometry = new THREE.PlaneGeometry(object.width, object.height, object.segments, object.segments);
    return Float32Array.from(geometry.attributes.position.array);
  }, [object.width, object.height, object.segments]);

  useFrame(({ clock }) => {
    const current = mesh.current;
    if (!current) return;
    const positions = current.geometry.attributes.position;
    const time = clock.elapsedTime;
    for (let i = 0; i < positions.count; i += 1) {
      const x = initial[i * 3];
      const y = initial[i * 3 + 1];
      const z = initial[i * 3 + 2];
      const free = THREE.MathUtils.clamp((object.height / 2 - y) / object.height, 0, 1);
      const anchorFalloff = Math.pow(free, 1.45);
      const gust =
        Math.sin(time * object.gustFrequency + x * 3.1 + object.seed) +
        Math.sin(time * object.gustFrequency * 1.7 + y * 4.2 + object.seed * 0.37) * object.turbulence * 0.45;
      const fold = Math.sin((x / object.width + 0.5) * object.topAnchorPoints * Math.PI) * 0.05;
      const amplitude = object.windStrength * (1 - object.damping) * anchorFalloff;
      positions.setXYZ(
        i,
        x + object.windDirection[0] * gust * amplitude * 0.08,
        y + fold * anchorFalloff,
        z + object.windDirection[2] * gust * amplitude * 0.24 + Math.sin(time * 2 + x * 8) * 0.04 * anchorFalloff
      );
    }
    positions.needsUpdate = true;
    current.geometry.computeVertexNormals();
  });

  return (
    <AnimatedGroup object={object}>
      <mesh ref={mesh} castShadow>
        <planeGeometry args={[object.width, object.height, object.segments, object.segments]} />
        <meshStandardMaterial color={object.fabricColor} opacity={object.opacity} transparent side={THREE.DoubleSide} roughness={0.82} />
      </mesh>
    </AnimatedGroup>
  );
}

function ParticleFieldPrimitive({ object }: { object: Extract<SceneObject, { type: "particleField" }> }) {
  const random = React.useMemo(() => seededRandom(object.seed), [object.seed]);
  const seeds = React.useMemo(
    () =>
      Array.from({ length: object.count }, () => ({
        x: (random() - 0.5) * object.spread[0],
        y: (random() - 0.5) * object.spread[1],
        z: (random() - 0.5) * object.spread[2],
        phase: random() * Math.PI * 2
      })),
    [object.count, object.spread, random]
  );
  const geometry = React.useMemo(() => {
    const positions = new Float32Array(object.count * 3);
    seeds.forEach((particle, index) => {
      positions[index * 3] = particle.x;
      positions[index * 3 + 1] = particle.y;
      positions[index * 3 + 2] = particle.z;
    });
    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
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
        ((particle.x + driftX + object.spread[0] * 0.5) % object.spread[0]) - object.spread[0] * 0.5,
        ((particle.y + driftY + object.spread[1] * 0.5) % object.spread[1]) - object.spread[1] * 0.5,
        ((particle.z + driftZ + object.spread[2] * 0.5) % object.spread[2]) - object.spread[2] * 0.5
      );
    });
    positions.needsUpdate = true;
  });

  return (
    <AnimatedGroup object={object}>
      <points geometry={geometry}>
        <pointsMaterial
          size={object.size}
          color={object.colorPalette[0]}
          opacity={object.opacity}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </AnimatedGroup>
  );
}

function FlamePrimitive({ object }: { object: Extract<SceneObject, { type: "flame" }> }) {
  const group = React.useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const current = group.current;
    if (!current) return;
    const time = clock.elapsedTime * object.flickerSpeed;
    current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      const pulse = 1 + Math.sin(time + index * 1.7) * 0.08 + Math.sin(time * 2.1 + index) * 0.04;
      mesh.scale.setScalar(pulse);
      mesh.rotation.y = Math.sin(time * 0.35 + index) * 0.22;
    });
  });
  return (
    <AnimatedGroup object={object}>
      <group ref={group}>
        <mesh position={[0, object.height * 0.45, 0]}>
          <coneGeometry args={[object.radius, object.height, 32, 1, true]} />
          <meshBasicMaterial color={object.colorOuter} transparent opacity={0.34} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh position={[0, object.height * 0.42, 0]}>
          <coneGeometry args={[object.radius * 0.68, object.height * 0.82, 32, 1, true]} />
          <meshBasicMaterial color={object.colorMid} transparent opacity={0.62} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh position={[0, object.height * 0.34, 0]}>
          <coneGeometry args={[object.radius * 0.36, object.height * 0.55, 32, 1, true]} />
          <meshBasicMaterial color={object.colorCore} transparent opacity={0.78} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
      <pointLight color={object.colorMid} intensity={object.lightIntensity} distance={6} decay={1.8} position={[0, object.height * 0.5, 0]} />
    </AnimatedGroup>
  );
}

function SmokePrimitive({ object }: { object: Extract<SceneObject, { type: "smoke" }> }) {
  const mesh = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const random = React.useMemo(() => seededRandom(object.seed), [object.seed]);
  const particles = React.useMemo(
    () =>
      Array.from({ length: object.count }, () => ({
        angle: random() * Math.PI * 2,
        radius: random() * object.radius,
        y: random() * object.height,
        phase: random() * Math.PI * 2,
        scale: 0.16 + random() * 0.28
      })),
    [object.count, object.height, object.radius, random]
  );
  useFrame(({ clock }) => {
    const current = mesh.current;
    if (!current) return;
    const time = clock.elapsedTime * 0.18;
    particles.forEach((particle, index) => {
      const y = (particle.y + time * object.height) % object.height;
      const spread = 0.3 + y / object.height;
      dummy.position.set(
        Math.cos(particle.angle + time + particle.phase) * particle.radius * spread,
        y,
        Math.sin(particle.angle + time * 0.8 + particle.phase) * particle.radius * spread
      );
      dummy.scale.setScalar(particle.scale * (1 + y / object.height));
      dummy.updateMatrix();
      current.setMatrixAt(index, dummy.matrix);
    });
    current.instanceMatrix.needsUpdate = true;
  });
  return (
    <AnimatedGroup object={object}>
      <instancedMesh ref={mesh} args={[undefined, undefined, object.count]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial color="#a79f96" transparent opacity={object.opacity} depthWrite={false} />
      </instancedMesh>
    </AnimatedGroup>
  );
}

function WindFieldPrimitive({ object }: { object: Extract<SceneObject, { type: "windField" }> }) {
  const group = React.useRef<THREE.Group>(null);
  const random = React.useMemo(() => seededRandom(object.seed), [object.seed]);
  const lines = React.useMemo(
    () =>
      Array.from({ length: object.count }, () => {
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
        return { positions, offset };
      }),
    [object.count, object.height, object.width, random]
  );
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.x = Math.sin(clock.elapsedTime * object.strength) * 0.08;
  });
  return (
    <AnimatedGroup object={object}>
      <group ref={group}>
        {lines.map((line, index) => (
          <line key={index}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[line.positions, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color={object.color} transparent opacity={0.28 + (index % 3) * 0.12} />
          </line>
        ))}
      </group>
    </AnimatedGroup>
  );
}

function LeafFieldPrimitive({ object }: { object: Extract<SceneObject, { type: "leafField" }> }) {
  const leavesRef = React.useRef<Array<THREE.Mesh | null>>([]);
  const random = React.useMemo(() => seededRandom(object.seed), [object.seed]);
  const leaves = React.useMemo(
    () =>
      Array.from({ length: object.count }, () => ({
        x: (random() - 0.5) * object.spread[0],
        y: (random() - 0.5) * object.spread[1],
        z: (random() - 0.5) * object.spread[2],
        speed: 0.45 + random() * 0.9,
        phase: random() * Math.PI * 2,
        scale: 0.07 + random() * 0.08,
        color: object.colorPalette[Math.floor(random() * object.colorPalette.length)]
      })),
    [object.colorPalette, object.count, object.spread, random]
  );
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    leaves.forEach((leaf, index) => {
      const current = leavesRef.current[index];
      if (!current) return;
      const x = ((leaf.x + time * leaf.speed * object.windStrength + object.spread[0] * 0.5) % object.spread[0]) - object.spread[0] * 0.5;
      current.position.set(x, leaf.y + Math.sin(time * 1.7 + leaf.phase) * 0.22, leaf.z + Math.cos(time + leaf.phase) * 0.15);
      current.rotation.set(time * leaf.speed + leaf.phase, time * 1.6 + leaf.phase, Math.sin(time + leaf.phase));
      current.scale.set(leaf.scale * 1.8, leaf.scale, leaf.scale);
    });
  });
  return (
    <AnimatedGroup object={object}>
      {leaves.map((leaf, index) => (
        <mesh
          key={index}
          ref={(node) => {
            leavesRef.current[index] = node;
          }}
          position={[leaf.x, leaf.y, leaf.z]}
          scale={[leaf.scale * 1.8, leaf.scale, leaf.scale]}
        >
          <planeGeometry args={[1, 0.45]} />
          <meshBasicMaterial color={leaf.color} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </AnimatedGroup>
  );
}

function TerrainPrimitive({ object }: { object: Extract<SceneObject, { type: "terrain" }> }) {
  const geometry = React.useMemo(() => {
    const nextGeometry = new THREE.PlaneGeometry(object.width, object.depth, object.segments, object.segments);
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
  }, [object.depth, object.heightScale, object.seed, object.segments, object.width]);
  return (
    <AnimatedGroup object={object}>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
        <meshStandardMaterial {...materialProps(object.material)} />
      </mesh>
    </AnimatedGroup>
  );
}

function RockPrimitive({ object }: { object: Extract<SceneObject, { type: "rock" }> }) {
  const geometry = React.useMemo(() => {
    const nextGeometry = new THREE.DodecahedronGeometry(object.radius, object.detail);
    const positions = nextGeometry.attributes.position as THREE.BufferAttribute;
    const random = seededRandom(object.seed);
    for (let i = 0; i < positions.count; i += 1) {
      const factor = 0.82 + random() * 0.34;
      positions.setXYZ(i, positions.getX(i) * factor, positions.getY(i) * (0.7 + random() * 0.3), positions.getZ(i) * factor);
    }
    positions.needsUpdate = true;
    nextGeometry.computeVertexNormals();
    return nextGeometry;
  }, [object.detail, object.radius, object.seed]);
  return (
    <AnimatedGroup object={object}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial {...materialProps(object.material)} />
      </mesh>
    </AnimatedGroup>
  );
}

function CrackPrimitive({ object }: { object: Extract<SceneObject, { type: "crack" }> }) {
  const random = React.useMemo(() => seededRandom(object.seed), [object.seed]);
  const branches = React.useMemo(() => {
    const main = new Float32Array([-object.length / 2, 0, 0, object.length / 2, 0, 0]);
    const offshoots = Array.from({ length: object.branches }, () => {
      const start = (random() - 0.5) * object.length;
      const side = random() > 0.5 ? 1 : -1;
      const len = 0.35 + random() * 0.8;
      return new Float32Array([start, 0, 0, start + len * 0.45, side * len, 0]);
    });
    return [main, ...offshoots];
  }, [object.branches, object.length, random]);
  return (
    <AnimatedGroup object={object}>
      {branches.map((positions, index) => (
        <line key={index}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={object.glowColor} linewidth={2} transparent opacity={index === 0 ? 0.95 : 0.6} />
        </line>
      ))}
      <pointLight color={object.glowColor} intensity={2.6} distance={3.8} decay={1.8} position={[0, 0, 0.08]} />
    </AnimatedGroup>
  );
}

function WaterSurfacePrimitive({ object }: { object: Extract<SceneObject, { type: "waterSurface" }> }) {
  const mesh = React.useRef<THREE.Mesh<THREE.PlaneGeometry>>(null);
  const initial = React.useMemo(() => {
    const geometry = new THREE.PlaneGeometry(object.width, object.depth, object.segments, object.segments);
    return Float32Array.from(geometry.attributes.position.array);
  }, [object.depth, object.segments, object.width]);
  useFrame(({ clock }) => {
    const current = mesh.current;
    if (!current) return;
    const positions = current.geometry.attributes.position;
    const time = clock.elapsedTime * object.waveSpeed;
    for (let i = 0; i < positions.count; i += 1) {
      const x = initial[i * 3];
      const y = initial[i * 3 + 1];
      const distance = Math.sqrt(x * x + y * y);
      const wave = Math.sin(distance * 4.2 - time * 2.2) + Math.sin(x * 3.1 + time) * 0.45 + Math.cos(y * 2.8 - time * 1.3) * 0.35;
      positions.setXYZ(i, x, y, wave * object.waveStrength);
    }
    positions.needsUpdate = true;
    current.geometry.computeVertexNormals();
  });
  return (
    <AnimatedGroup object={object}>
      <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[object.width, object.depth, object.segments, object.segments]} />
        <meshStandardMaterial
          color={object.color}
          opacity={object.opacity}
          transparent
          roughness={object.material?.roughness ?? 0.12}
          metalness={object.material?.metalness ?? 0.04}
          side={THREE.DoubleSide}
        />
      </mesh>
    </AnimatedGroup>
  );
}

function WaveRingPrimitive({ object }: { object: Extract<SceneObject, { type: "waveRing" }> }) {
  const mesh = React.useRef<THREE.Mesh>(null);
  const material = React.useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const time = clock.elapsedTime * object.speed;
    const pulse = 1 + (time % 1.8) * 0.18;
    if (mesh.current) mesh.current.scale.setScalar(pulse);
    if (material.current) material.current.opacity = 0.55 - ((time % 1.8) / 1.8) * 0.32;
  });
  return (
    <AnimatedGroup object={object}>
      <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[object.radius, object.thickness, 8, 96]} />
        <meshBasicMaterial ref={material} color={object.color} transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </AnimatedGroup>
  );
}

function FoamPrimitive({ object }: { object: Extract<SceneObject, { type: "foam" }> }) {
  const mesh = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const random = React.useMemo(() => seededRandom(object.seed), [object.seed]);
  const bubbles = React.useMemo(
    () =>
      Array.from({ length: object.count }, () => ({
        angle: random() * Math.PI * 2,
        radius: object.radius * (0.86 + random() * 0.18),
        scale: 0.025 + random() * 0.05,
        phase: random() * Math.PI * 2
      })),
    [object.count, object.radius, random]
  );
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    bubbles.forEach((bubble, index) => {
      const angle = bubble.angle + Math.sin(clock.elapsedTime * 0.45 + bubble.phase) * 0.03;
      dummy.position.set(Math.cos(angle) * bubble.radius, 0, Math.sin(angle) * bubble.radius);
      dummy.rotation.set(Math.PI / 2, 0, angle);
      dummy.scale.setScalar(bubble.scale);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <AnimatedGroup object={object}>
      <instancedMesh ref={mesh} args={[undefined, undefined, object.count]}>
        <torusGeometry args={[1, 0.22, 6, 18]} />
        <meshBasicMaterial color={object.color} transparent opacity={0.7} depthWrite={false} />
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
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ position: spec.camera.position, fov: spec.camera.fov }}
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
