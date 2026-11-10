import { GLSL_UNIFORMS, GLSL_COMMON, GLSL_FRAG } from './common.glsl.js';
import { GLSL_NOISE } from './noise.glsl.js';

export { GLSL_UNIFORMS, GLSL_COMMON, GLSL_FRAG, GLSL_NOISE };

/** Everything a vertex shader can use: uniforms, maths, sky, intersections, noise. */
export const VERT_PRELUDE = `${GLSL_UNIFORMS}\n${GLSL_COMMON}\n${GLSL_NOISE}\n`;

/** VERT_PRELUDE plus the fragment-only screen and depth helpers. */
export const FRAG_PRELUDE = `${VERT_PRELUDE}${GLSL_FRAG}\n`;
