import { z } from "zod";

const vector3Schema = z.tuple([z.number(), z.number(), z.number()]);
const colorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex color.");

const materialSchema = z
  .object({
    color: colorSchema.optional(),
    emissive: colorSchema.optional(),
    emissiveIntensity: z.number().min(0).max(20).optional(),
    opacity: z.number().min(0).max(1).optional(),
    roughness: z.number().min(0).max(1).optional(),
    metalness: z.number().min(0).max(1).optional(),
    transmission: z.number().min(0).max(1).optional(),
  })
  .strict();

const animationSchema = z
  .object({
    type: z.enum([
      "wind",
      "rotation",
      "bob",
      "sway",
      "particleDrift",
      "flameFlicker",
      "smokeRise",
      "wave",
      "ripple",
      "erosion",
      "crumble",
    ]),
    speed: z.number().optional(),
    strength: z.number().optional(),
    axis: z.enum(["x", "y", "z"]).optional(),
  })
  .strict();

const objectBaseSchema = z.object({
  id: z.string().min(1),
  position: vector3Schema.default([0, 0, 0]),
  rotation: vector3Schema.default([0, 0, 0]),
  scale: vector3Schema.default([1, 1, 1]),
  material: materialSchema.optional(),
  animations: z.array(animationSchema).default([]),
});

const boxSchema = objectBaseSchema
  .extend({
    type: z.literal("box"),
    size: vector3Schema.default([1, 1, 1]),
  })
  .strict();

const sphereSchema = objectBaseSchema
  .extend({
    type: z.literal("sphere"),
    radius: z.number().positive().default(1),
    segments: z.number().int().min(8).max(96).default(32),
  })
  .strict();

const planeSchema = objectBaseSchema
  .extend({
    type: z.literal("plane"),
    width: z.number().positive().default(8),
    height: z.number().positive().default(8),
  })
  .strict();

const textSchema = objectBaseSchema
  .extend({
    type: z.literal("text"),
    text: z.string().default("4 Elements"),
    fontSize: z.number().positive().default(0.35),
  })
  .strict();

const floorSchema = objectBaseSchema
  .extend({
    type: z.literal("floor"),
    width: z.number().positive().default(12),
    depth: z.number().positive().default(12),
  })
  .strict();

const wallSchema = objectBaseSchema
  .extend({
    type: z.literal("wall"),
    width: z.number().positive().default(6),
    height: z.number().positive().default(4),
  })
  .strict();

const windowSchema = objectBaseSchema
  .extend({
    type: z.literal("window"),
    width: z.number().positive().default(2),
    height: z.number().positive().default(3),
    frameColor: colorSchema.default("#d8cdb8"),
  })
  .strict();

const curtainSchema = objectBaseSchema
  .extend({
    type: z.literal("curtain"),
    width: z.number().positive().default(2),
    height: z.number().positive().default(3),
    segments: z.number().int().min(4).max(80).default(32),
    topAnchorPoints: z.number().int().min(2).max(32).default(8),
    fabricColor: colorSchema.default("#f1ead7"),
    opacity: z.number().min(0).max(1).default(0.68),
    windStrength: z.number().min(0).max(5).default(1),
    windDirection: vector3Schema.default([1, 0, 0]),
    gustFrequency: z.number().min(0).max(10).default(1.2),
    turbulence: z.number().min(0).max(5).default(0.7),
    damping: z.number().min(0).max(1).default(0.25),
    seed: z.number().int().default(1),
  })
  .strict();

const particleFieldSchema = objectBaseSchema
  .extend({
    type: z.literal("particleField"),
    count: z.number().int().min(1).max(2000).default(120),
    spread: vector3Schema.default([4, 4, 4]),
    size: z.number().positive().default(0.035),
    colorPalette: z.array(colorSchema).min(1).default(["#ffffff"]),
    drift: vector3Schema.default([0, 0.2, 0]),
    opacity: z.number().min(0).max(1).default(0.55),
    speed: z.number().min(0).max(8).default(1),
    seed: z.number().int().default(1),
  })
  .strict();

const flameSchema = objectBaseSchema
  .extend({
    type: z.literal("flame"),
    height: z.number().positive().default(2.2),
    radius: z.number().positive().default(0.65),
    colorCore: colorSchema.default("#fff3a3"),
    colorMid: colorSchema.default("#ff8c2b"),
    colorOuter: colorSchema.default("#cc2f1b"),
    flickerSpeed: z.number().min(0).max(10).default(2.5),
    lightIntensity: z.number().min(0).max(30).default(8),
  })
  .strict();

const smokeSchema = objectBaseSchema
  .extend({
    type: z.literal("smoke"),
    count: z.number().int().min(1).max(300).default(48),
    height: z.number().positive().default(3),
    radius: z.number().positive().default(1.1),
    opacity: z.number().min(0).max(1).default(0.22),
    seed: z.number().int().default(1),
  })
  .strict();

const windFieldSchema = objectBaseSchema
  .extend({
    type: z.literal("windField"),
    count: z.number().int().min(1).max(80).default(18),
    width: z.number().positive().default(4),
    height: z.number().positive().default(3),
    color: colorSchema.default("#cfeee6"),
    strength: z.number().min(0).max(5).default(1),
    seed: z.number().int().default(1),
  })
  .strict();

const terrainSchema = objectBaseSchema
  .extend({
    type: z.literal("terrain"),
    width: z.number().positive().default(8),
    depth: z.number().positive().default(8),
    segments: z.number().int().min(4).max(128).default(48),
    heightScale: z.number().min(0).max(5).default(0.8),
    seed: z.number().int().default(1),
  })
  .strict();

const rockSchema = objectBaseSchema
  .extend({
    type: z.literal("rock"),
    radius: z.number().positive().default(0.55),
    detail: z.number().int().min(0).max(2).default(0),
    seed: z.number().int().default(1),
  })
  .strict();

const crackSchema = objectBaseSchema
  .extend({
    type: z.literal("crack"),
    length: z.number().positive().default(3),
    branches: z.number().int().min(0).max(12).default(4),
    glowColor: colorSchema.default("#f1b35b"),
    seed: z.number().int().default(1),
  })
  .strict();

const waterSurfaceSchema = objectBaseSchema
  .extend({
    type: z.literal("waterSurface"),
    width: z.number().positive().default(7),
    depth: z.number().positive().default(7),
    segments: z.number().int().min(8).max(128).default(64),
    color: colorSchema.default("#4fb7bc"),
    opacity: z.number().min(0).max(1).default(0.58),
    waveStrength: z.number().min(0).max(2).default(0.18),
    waveSpeed: z.number().min(0).max(8).default(1.1),
  })
  .strict();

const waveRingSchema = objectBaseSchema
  .extend({
    type: z.literal("waveRing"),
    radius: z.number().positive().default(1),
    thickness: z.number().positive().default(0.018),
    color: colorSchema.default("#d9fff8"),
    speed: z.number().min(0).max(8).default(1),
  })
  .strict();

const foamSchema = objectBaseSchema
  .extend({
    type: z.literal("foam"),
    count: z.number().int().min(1).max(120).default(32),
    radius: z.number().positive().default(3.1),
    color: colorSchema.default("#edf8ef"),
    seed: z.number().int().default(1),
  })
  .strict();

const leafFieldSchema = objectBaseSchema
  .extend({
    type: z.literal("leafField"),
    count: z.number().int().min(1).max(300).default(42),
    spread: vector3Schema.default([4, 2.5, 2]),
    colorPalette: z.array(colorSchema).min(1).default(["#a9b55b", "#d8a84f"]),
    windStrength: z.number().min(0).max(5).default(1),
    seed: z.number().int().default(1),
  })
  .strict();

export const sceneObjectSchema = z.discriminatedUnion("type", [
  curtainSchema,
  windowSchema,
  floorSchema,
  wallSchema,
  boxSchema,
  sphereSchema,
  planeSchema,
  textSchema,
  particleFieldSchema,
  flameSchema,
  smokeSchema,
  windFieldSchema,
  terrainSchema,
  rockSchema,
  crackSchema,
  waterSurfaceSchema,
  waveRingSchema,
  foamSchema,
  leafFieldSchema,
]);

export const lightSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["ambient", "directional", "point", "spot"]),
    color: colorSchema.default("#ffffff"),
    intensity: z.number().min(0).max(50).default(1),
    position: vector3Schema.default([0, 4, 4]),
    target: vector3Schema.optional(),
  })
  .strict();

export const sceneSpecSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    metadata: z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
        element: z.enum(["Fire", "Air", "Earth", "Water"]),
        prompt: z.string().min(1),
        seed: z.number().int().default(1),
        description: z.string().optional(),
      })
      .strict(),
    camera: z
      .object({
        position: vector3Schema.default([4, 3, 6]),
        target: vector3Schema.default([0, 0.8, 0]),
        fov: z.number().min(20).max(90).default(45),
      })
      .strict(),
    environment: z
      .object({
        background: colorSchema.default("#101111"),
        fogColor: colorSchema.optional(),
        fogNear: z.number().positive().optional(),
        fogFar: z.number().positive().optional(),
      })
      .strict(),
    lights: z.array(lightSchema).default([]),
    objects: z.array(sceneObjectSchema).min(1),
    effects: z
      .array(
        z
          .object({
            type: z.enum(["bloomHint", "causticsHint", "heatDistortionHint"]),
            strength: z.number().min(0).max(5).default(1),
          })
          .strict()
      )
      .default([]),
  })
  .strict();

export type Vector3Tuple = z.infer<typeof vector3Schema>;
export type MaterialSpec = z.infer<typeof materialSchema>;
export type AnimationSpec = z.infer<typeof animationSchema>;
export type SceneObject = z.infer<typeof sceneObjectSchema>;
export type LightSpec = z.infer<typeof lightSchema>;
export type SceneSpec = z.infer<typeof sceneSpecSchema>;
