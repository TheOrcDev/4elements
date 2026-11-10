// What the wind carries: closed-form paths through the vortex's velocity field, and the
// light that falls on something small drifting along them.
//
// Every path is a pure function of a random seed and an age, so particles need no state and
// a streak or a ribbon is simply the same path evaluated at a range of ages.
//
// A speck's life has three legs:
//
//   inflow   a sink with swirl near the water. Radial speed Q / (r + b) and angular speed
//            K Q / (r + b)^2 integrate to r(a) = sqrt(B^2 - 2 Q a) - b and
//            theta = K ln(B / (r + b)): a logarithmic spiral that tightens and quickens
//            toward the foot. b softens the core so the speeds stay finite.
//   climb    up the funnel on a helix at a fixed number of wall radii from the axis. The turn
//            per metre climbed is the wall's (flow.js: airTwist), slower further out, so the
//            specks ride round with the features of the cloud next to them.
//   fling    near its own ceiling the speck stops climbing, is thrown outward and loses its
//            spin as its orbit widens.
//
// Needs FLOW_GLSL in front of it.

export const PATH_GLSL = /* glsl */ `
// (IN_Q, IN_B and IN_K, the constants of the sink, come from flow.js)
const float SPRAY_G = 5.0;    // m/s^2: spray is half carried by the wind, so it falls slowly

// Angular speed of the funnel wall at height y: updraft times the slope of airTwist.
float airSpin(float y) {
  float h = clamp(y / AIR_H, 0.0, 1.15);
  return AIR_UPDRAFT * AIR_TWIST * AIR_TWIST_K / AIR_H * exp(-AIR_TWIST_K * h);
}

// The constants of one speck's life, from its seed.
//   B       pick-up radius (plus the core softening)
//   orbit   distance from the axis while climbing, in wall radii
//   speed   climb speed, m/s
//   top     the height at which it is flung out
//   tIn     seconds spent spiralling in
void airSpeckSetup(vec4 seed, out float B, out float orbit, out float speed, out float top, out float tIn) {
  B = mix(1.0, 9.5, seed.x * seed.x) + IN_B;
  orbit = 1.12 + 1.7 * seed.y * seed.y;
  speed = mix(0.85, 1.9, fract(seed.z * 7.31));
  top = mix(5.0, AIR_H - 0.1, sqrt(fract(seed.w * 5.17)));
  tIn = (B * B - IN_B * IN_B) / (2.0 * IN_Q);
}

// Length of a speck's whole life cycle in seconds.
float airSpeckPeriod(vec4 seed) {
  float B, orbit, speed, top, tIn;
  airSpeckSetup(seed, B, orbit, speed, top, tIn);
  return tIn + top / speed + 3.6;
}

// Local position of a speck of the given age at the given time (the time only moves the
// centre line it circles). fade is 0 at birth and death; flung is the number of seconds
// since it began to be thrown out at the top.
vec3 airSpeck(vec4 seed, float age, float time, out float fade, out float flung) {
  float B, orbit, speed, top, tIn;
  airSpeckSetup(seed, B, orbit, speed, top, tIn);
  float period = tIn + top / speed + 3.6;
  float a = max(age, 0.0);

  // inflow
  float rIn = sqrt(max(B * B - 2.0 * IN_Q * a, IN_B * IN_B)) - IN_B;
  float theta = seed.w * TAU + IN_K * log(B / (rIn + IN_B));

  // climb: c eases from rest into a steady rise a little before the inflow ends
  float c = max(a - tIn + 0.8, 0.0);
  float x = speed * (c * c / (c + 0.8)) / top;
  float level = x < 0.7 ? x : 0.7 + 0.3 * tanh((x - 0.7) / 0.3);      // levels off at its ceiling
  float y0 = 0.04 + 0.32 * seed.y * fract(seed.x * 13.7);
  float y = y0 + top * level;
  float slip = pow(orbit, -1.2);                                      // further out, slower round
  theta += slip * AIR_UPDRAFT / speed * (airTwist(y) - airTwist(y0));

  // fling
  float te = max(c - 0.8 - 0.7 * top / speed, 0.0);
  flung = te;
  float rOut = mix(0.4, 1.4, fract(seed.x * 3.71)) * te * te / (te + 1.2);
  theta += slip * airSpin(y) * te / (1.0 + 0.35 * te);
  y -= 0.07 * te * te;

  float rho = orbit * airRadius(y) * (1.0 + 0.07 * sin(a * 1.9 + seed.x * 40.0)) + rIn + rOut;
  y += 0.05 * sin(a * 2.7 + seed.y * 50.0) * smoothstep(0.0, 1.0, y);
  // Far from the funnel the air does not know that the centre line is swaying.
  vec2 axis = airAxis(y, airFoot(time), airKink(time)) * exp(-(rIn + rOut) * 0.5);
  fade = smoothstep(0.0, 1.5, a) * (1.0 - smoothstep(period - 2.2, period - 0.2, a));
  return vec3(axis.x + rho * cos(theta), max(y, 0.02), axis.y - rho * sin(theta));
}

// A droplet torn off the film at the foot: thrown up and out, carried round, falling back.
float airSprayLife(vec4 seed) { return 2.0 * mix(1.0, 3.6, seed.x * seed.x) / SPRAY_G; }

vec3 airSpray(vec4 seed, float age, float time, out float fade) {
  float vy = mix(1.0, 3.6, seed.x * seed.x);
  float life = 2.0 * vy / SPRAY_G;
  float a = clamp(age, 0.0, life);
  vec2 foot = airFoot(time - age);                                    // where the foot stood when it left
  float rho = 0.3 + 0.5 * seed.y + mix(0.3, 1.5, fract(seed.y * 9.13)) * a;
  float theta = seed.w * TAU + mix(1.6, 3.2, fract(seed.x * 6.7)) * a / (1.0 + 0.7 * a);
  float y = vy * a - 0.5 * SPRAY_G * a * a;
  fade = smoothstep(0.0, 0.08, a) * (1.0 - smoothstep(life * 0.7, life, a));
  return vec3(foot.x + rho * cos(theta), max(y, 0.0) + 0.02, foot.y - rho * sin(theta));
}

// Henyey-Greenstein lobe scaled so that an isotropic scatterer returns 1.
float airPhase(float mu, float g) {
  float g2 = g * g;
  return (1.0 - g2) / pow(max(1.0 + g2 - 2.0 * g * mu, 1e-3), 1.5);
}

// Light scattered toward the eye by something small at local point p. toEye points from p to
// the camera; forward is how strongly it favours forward scattering (droplets glint against
// the afterglow, dust does not). origin is the element's world position.
vec3 airSmallLight(vec3 p, vec3 toEye, float forward, vec3 origin) {
  vec3 sunDir = normalize(uSunDir);
  vec3 moonDir = normalize(uMoonDir);
  vec2 q = p.xz - airAxis(p.y, airFoot(uTime), airKink(uTime));
  vec3 light = skyAmbient(vec3(0.0, 1.0, 0.0));
  light += uSunColor * (0.36 * airPhase(dot(-toEye, sunDir), forward) * exp(-1.5 * airChord(p, q, sunDir)));
  light += uMoonColor * (0.30 * airPhase(dot(-toEye, moonDir), forward * 0.5) * exp(-1.5 * airChord(p, q, moonDir))
                         * (1.0 - 0.8 * airCapCover(p, moonDir)));
  vec3 toFire = uFireLightPos - origin - p;
  light += uFireLightColor / (1.0 + dot(toFire, toFire));
  // (lightning, as the scene's convention has it: a point light scattered by something small;
  // held back a little at the height of a stroke, when for a frame the swarm would otherwise
  // hide the funnel it circles)
  vec3 toFlash = uFlash.xyz - origin - p;
  light += flashIntensity() / (4.0 * PI * (1.0 + dot(toFlash, toFlash)) * (1.0 + 0.15 * uFlash.w));
  return light;
}

// 1 when nothing of the cloud stands between local point p and the eye (also in local
// space), falling to 0 behind the funnel or the cloud. Particles are drawn after the
// volume and are not hidden by it, so they fade themselves.
float airSeen(vec3 p, vec3 eye) {
  vec3 toEye = eye - p;
  float dist = length(toEye);
  toEye /= max(dist, 1e-4);
  vec2 q = p.xz - airAxis(p.y, airFoot(uTime), airKink(uTime));
  return exp(-3.0 * airChord(p, q, toEye)) * (1.0 - airCloudHides(p, toEye, dist));
}
`;
