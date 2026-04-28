# Scene Generation Prompt

Copy the block below and paste it as the **system prompt** (or first message) into any model you want to benchmark. Replace `<your-model-id>` with the model's identifier slug (e.g. `gemini-2.5`, `grok-3`, `mistral-large`).

The model will output four JSON blocks — one per element. Drop each file into `examples/elements/<element>/<your-model-id>.json`, then follow the steps in [CONTRIBUTING.md](../CONTRIBUTING.md) to register them.

---

## Prompt (copy everything between the lines)

---

You are generating four scene specs for **4elements**, a deterministic React Three Fiber benchmark that renders Zod-validated JSON scene specs.

# Your model ID

Your `metadata.id` for each scene must follow the pattern `"<your-model-id>-<element>"`, e.g. `"gemini-2.5-fire"`. Replace `<your-model-id>` with your actual model slug before outputting.

# Deliverable

Output **exactly four fenced JSON code blocks**, in this order:

1. `// Fire`
2. `// Air`
3. `// Earth`
4. `// Water`

Each block must be a single JSON object that validates against the schema below. Output **only** the four code blocks — no prose, no commentary.

# Element prompts (copy verbatim into `metadata.prompt`)

- **Fire**: "Create an interactive 3D fire scene: a small ritual flame burning above dark stone, with glowing embers, warm light, rising sparks, subtle smoke, and animated flicker."
- **Air**: "Create an interactive 3D air scene: a pale curtain and loose leaves moving in visible wind beside an open window, with soft dust trails showing the airflow."
- **Earth**: "Create an interactive 3D earth scene: layered terrain with rocks, soil, moss, and a slow fracture revealing glowing minerals beneath the surface."
- **Water**: "Create an interactive 3D water scene: a clear pool with animated ripples, reflective highlights, floating droplets, foam at the edges, and soft blue-green caustic light."

# Schema

```ts
type Vec3 = [number, number, number];
type Color = `#${string}`; // 3 or 6 hex digits only

interface Material {
  color?: Color;
  emissive?: Color;
  emissiveIntensity?: number;   // 0..20
  opacity?: number;             // 0..1
  roughness?: number;           // 0..1
  metalness?: number;           // 0..1
  transmission?: number;        // 0..1
}

interface Animation {
  type: "wind" | "rotation" | "bob" | "sway" | "particleDrift"
      | "flameFlicker" | "smokeRise" | "wave" | "ripple"
      | "erosion" | "crumble";
  speed?: number;
  strength?: number;
  axis?: "x" | "y" | "z";
}

interface ObjectBase {
  id: string;
  position?: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
  material?: Material;
  animations?: Animation[];
}

type SceneObject =
  | (ObjectBase & { type: "box"; size?: Vec3 })
  | (ObjectBase & { type: "sphere"; radius?: number; segments?: number /* 8..96 */ })
  | (ObjectBase & { type: "plane"; width?: number; height?: number })
  | (ObjectBase & { type: "text"; text?: string; fontSize?: number })
  | (ObjectBase & { type: "floor"; width?: number; depth?: number })
  | (ObjectBase & { type: "wall"; width?: number; height?: number })
  | (ObjectBase & { type: "window"; width?: number; height?: number; frameColor?: Color })
  | (ObjectBase & {
      type: "curtain"; width?: number; height?: number;
      segments?: number /* 4..80 */; topAnchorPoints?: number /* 2..32 */;
      fabricColor?: Color; opacity?: number;
      windStrength?: number /* 0..5 */; windDirection?: Vec3;
      gustFrequency?: number /* 0..10 */; turbulence?: number /* 0..5 */;
      damping?: number /* 0..1 */; seed?: number;
    })
  | (ObjectBase & {
      type: "particleField";
      count?: number /* 1..2000 */; spread?: Vec3; size?: number;
      colorPalette?: Color[]; drift?: Vec3;
      opacity?: number; speed?: number /* 0..8 */; seed?: number;
    })
  | (ObjectBase & {
      type: "flame"; height?: number; radius?: number;
      colorCore?: Color; colorMid?: Color; colorOuter?: Color;
      flickerSpeed?: number /* 0..10 */; lightIntensity?: number /* 0..30 */;
    })
  | (ObjectBase & {
      type: "smoke";
      count?: number /* 1..300 */; height?: number; radius?: number;
      opacity?: number; seed?: number;
    })
  | (ObjectBase & {
      type: "windField";
      count?: number /* 1..80 */; width?: number; height?: number;
      color?: Color; strength?: number /* 0..5 */; seed?: number;
    })
  | (ObjectBase & {
      type: "terrain";
      width?: number; depth?: number;
      segments?: number /* 4..128 */; heightScale?: number /* 0..5 */; seed?: number;
    })
  | (ObjectBase & { type: "rock"; radius?: number; detail?: number /* 0..2 */; seed?: number })
  | (ObjectBase & {
      type: "crack"; length?: number; branches?: number /* 0..12 */;
      glowColor?: Color; seed?: number;
    })
  | (ObjectBase & {
      type: "waterSurface";
      width?: number; depth?: number; segments?: number /* 8..128 */;
      color?: Color; opacity?: number;
      waveStrength?: number /* 0..2 */; waveSpeed?: number /* 0..8 */;
    })
  | (ObjectBase & {
      type: "waveRing"; radius?: number; thickness?: number;
      color?: Color; speed?: number /* 0..8 */;
    })
  | (ObjectBase & {
      type: "foam"; count?: number /* 1..120 */; radius?: number;
      color?: Color; seed?: number;
    })
  | (ObjectBase & {
      type: "leafField"; count?: number /* 1..300 */; spread?: Vec3;
      colorPalette?: Color[]; windStrength?: number /* 0..5 */; seed?: number;
    });

interface Light {
  id: string;
  type: "ambient" | "directional" | "point" | "spot";
  color?: Color;
  intensity?: number; // 0..50
  position?: Vec3;
  target?: Vec3;
}

interface SceneSpec {
  schemaVersion: "1.0";
  metadata: {
    id: string;
    name: string;
    element: "Fire" | "Air" | "Earth" | "Water";
    prompt: string;
    seed: number;
    description?: string;
  };
  camera: { position?: Vec3; target?: Vec3; fov?: number /* 20..90 */ };
  environment: {
    background: Color;
    fogColor?: Color; fogNear?: number; fogFar?: number;
  };
  lights: Light[];
  objects: SceneObject[];
  effects: { type: "bloomHint" | "causticsHint" | "heatDistortionHint"; strength?: number /* 0..5 */ }[];
}
```

# Hard rules

1. Use the exact element prompt strings above for `metadata.prompt`.
2. `metadata.id` must follow the pattern `"<your-model-id>-fire"`, `"<your-model-id>-air"`, etc.
3. `metadata.element` must match the scene (`"Fire"`, `"Air"`, `"Earth"`, `"Water"`).
4. Every object `id` is unique within its scene.
5. No extra fields beyond what the schema lists. No comments inside JSON.
6. Integers where required (counts, segments, branches, seeds). Bounds are inclusive.
7. Color strings must match `#RGB` or `#RRGGBB` hex format.
8. Each scene's required element must be unmistakably present:
   - Fire → at least one `flame`
   - Air → at least one `curtain` and one `leafField`
   - Earth → at least one `terrain`, one `crack`, and at least two `rock` objects
   - Water → at least one `waterSurface` and at least one `waveRing`
9. Total particles across a scene (particleField count + smoke count + foam count + leafField count + windField count) should stay under 600.
10. 2–4 lights per scene, including exactly one `ambient`.

---
