// Procedural stars, shared by the sky dome and by the water film (which reflects them
// analytically so they stay pin-sharp instead of going through the half-resolution mirror).
// Needs GLSL_UNIFORMS, GLSL_COMMON and GLSL_NOISE. Fragment only (uses fwidth).
export const GLSL_STARS = /* glsl */ `
vec3 starLayer(vec3 d, float scale, float density, float gain) {
  vec3 p = d * scale;
  float px = min(length(fwidth(p)) * 0.75, 0.3);   // one pixel, in cell units
  vec3 ip = floor(p), fp = fract(p);
  vec3 h = hash33(ip);
  vec3 pos = 0.5 + (hash33(ip + 71.3) - 0.5) * 0.6;
  float mag = h.y * h.y;
  float radius = px * mix(0.85, 1.9, mag);
  float core = smoothstep(radius, radius * 0.25, length(fp - pos));
  float twinkle = 0.72 + 0.28 * sin(uTime * (1.2 + h.z * 3.5) + h.x * 50.0);
  vec3 tint = mix(vec3(0.72, 0.84, 1.0), vec3(1.0, 0.84, 0.66), smoothstep(0.55, 1.0, h.z));
  return tint * core * step(1.0 - density, h.x) * twinkle * gain * mix(0.3, 2.4, mag);
}

// du: unit direction with y >= 0. Returns the stars and the Milky Way, already faded
// toward the horizon. Multiply by how clear the sky is in that direction.
vec3 nightStars(vec3 du) {
  vec3 bandN = normalize(vec3(0.42, 0.36, 0.83));
  float band = exp(-sq(dot(du, bandN) / 0.20));
  float dust = noiseTex(du * 0.9 + 0.3).r * 1.25;
  vec3 s = starLayer(du, 110.0, 0.085 + band * 0.10, 1.9)
         + starLayer(du.zxy + 3.7, 210.0, 0.13 + band * 0.22, 0.85);
  s += vec3(0.022, 0.027, 0.045) * band * smoothstep(0.30, 0.75, dust) * 1.6;
  return s * smoothstep(0.02, 0.32, du.y);
}
`;
