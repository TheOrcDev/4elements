// The water itself, as the body shader and the shader of its mirror image both need it.
// Expects `uniform vec3 uLightDir` (unit direction moonlight travels under water).
export const MEDIUM_GLSL = /* glsl */ `
// Per metre. Red is absorbed first; a little blue goes too, which is what turns
// sea water teal instead of swimming-pool blue.
const vec3 ABSORB = vec3(0.400, 0.085, 0.105);
const vec3 SCATTER = vec3(0.012, 0.035, 0.040);
const vec3 EXTINCT = ABSORB + SCATTER;
// Light coming down from the surface fades faster than a straight beam (it is diffuse),
// and a good deal faster here than in a real sea: three metres have to read as "deep",
// bright under the surface and dark over the bed, from whichever side the column is seen.
const vec3 DOWNWELL = EXTINCT * 2.0;
// Radiance scattered toward the eye per metre and per unit of light. Far above what clear
// water does physically: it is what lets the column glow against the dusk.
const vec3 GLOW = vec3(0.009, 0.036, 0.038);
const vec3 SAND = vec3(0.60, 0.53, 0.42);

// Unpolarised Fresnel reflectance of a dielectric boundary. cosi = cosine of the angle of
// incidence, eta = n(incident side) / n(far side). 1 on total internal reflection.
float fresnelDielectric(float cosi, float eta) {
  float sin2t = eta * eta * (1.0 - cosi * cosi);
  if (sin2t >= 1.0) return 1.0;
  float cost = sqrt(1.0 - sin2t);
  float rs = (eta * cosi - cost) / (eta * cosi + cost);
  float rp = (cosi - eta * cost) / (cosi + eta * cost);
  return 0.5 * (rs * rs + rp * rp);
}

// Phase function for moonlight: mostly even, with a gentle forward lobe so the body and
// its shafts brighten a little when you look up-light (a strong one turns the column into
// a flat bright slab from that side).
float moonPhase(vec3 d) {
  const float g = 0.30;
  float c = dot(uLightDir, -d);
  return 0.70 + 0.30 * (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * c, 1.5);
}
`;
