import * as THREE from 'three';
import { createRockPair } from './looseRocks.js';

// The belt: broken fragments in slow orbit around the monolith, from boulders to pebbles.
// Each follows its own slightly eccentric ellipse in a plane close to the belt's tilted
// plane and tumbles about its own axis. Positions are closed-form functions of time, so
// the belt can be jumped to any moment and costs a few dozen matrix composes per frame.

const TILT = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0.94, 0, 0.34).normalize(), 0.27);
const MAX_RADIUS = 4.5;                   // of the widest orbit at its apoapsis, with the largest block on it

export class Belt {
  /** shapes: from buildRockShapes. material: the 'belt' rock material. centreHeight: of the belt's centre above the film. */
  constructor(ctx, shapes, material, centreHeight) {
    this.group = new THREE.Group();
    this.centreHeight = centreHeight;
    const rng = ctx.rng(911);
    const BOUNDS = new THREE.Sphere(new THREE.Vector3(0, centreHeight, 0), MAX_RADIUS + 0.4);
    // level of detail near and far, how many, size range in metres. The smallest are not
    // worth a lighter shape, a reflection or a shadow.
    const classes = [
      { level: 'high', far: 'low', count: 7, min: 0.20, max: 0.36 },
      { level: 'mid', far: 'tiny', count: 20, min: 0.085, max: 0.17 },
      { level: 'tiny', far: 'tiny', count: 42, min: 0.028, max: 0.07, small: true },
    ];
    this.sets = [];
    for (const cls of classes) {
      const perShape = shapes[cls.level].map(() => []);
      for (let i = 0; i < cls.count; i++) {
        const z = rng() * 2 - 1, a = rng() * Math.PI * 2, r = Math.sqrt(1 - z * z);
        const semiMajor = 2.55 + 1.35 * Math.pow(rng(), 1.3);
        perShape[i % perShape.length].push({
          seed: 20 + rng() * 70,
          size: cls.min + (cls.max - cls.min) * rng() * rng(),
          moss: rng() < 0.25 ? 0.6 : 0,
          semiMajor,
          eccentricity: 0.02 + 0.12 * rng(),
          periapsis: rng() * Math.PI * 2,
          phase: rng() * Math.PI * 2,
          // Kepler's third law, scaled so the nearest fragments take about a minute and a half per lap.
          rate: 0.07 * Math.pow(2.8 / semiMajor, 1.5) * (0.9 + 0.2 * rng()),
          // Each orbit is tipped a few degrees out of the belt's plane about its own node line.
          node: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), (rng() - 0.5) * 0.22),
          spinAxis: new THREE.Vector3(r * Math.cos(a), z, r * Math.sin(a)),
          spinRate: (0.06 + 0.35 * rng()) * (rng() < 0.5 ? -1 : 1) * (cls.level === 'high' ? 0.5 : 1),
          attitude: new THREE.Quaternion().setFromEuler(new THREE.Euler(rng() * 6.28, rng() * 6.28, rng() * 6.28)),
        });
      }
      perShape.forEach((rocks, s) => {
        if (rocks.length === 0) return;
        const pair = createRockPair(ctx.LAYERS, shapes[cls.level][s], shapes[cls.far][s], material, rocks, {
          castShadow: !cls.small, mirrored: !cls.small,
        });
        pair.near.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        // Instances roam, so the meshes are culled by a sphere that holds the whole belt.
        for (const mesh of pair.meshes) mesh.boundingSphere = BOUNDS;
        this.group.add(...pair.meshes);
        this.sets.push({ pair, rocks, matrices: pair.near.instanceMatrix });
      });
    }
    this._p = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._spin = new THREE.Quaternion();
    this._s = new THREE.Vector3();
    this._m = new THREE.Matrix4();
  }

  /** far: true once the camera is across the ring. */
  setFar(far) { for (const set of this.sets) set.pair.setFar(far); }

  /** t: seconds. bob: the monolith's current vertical offset, which the belt follows in part. */
  update(t, bob) {
    const p = this._p, q = this._q, s = this._s, m = this._m;
    for (let k = 0; k < this.sets.length; k++) {
      const set = this.sets[k];
      const array = set.matrices.array;
      for (let i = 0; i < set.rocks.length; i++) {
        const rock = set.rocks[i];
        // Mean anomaly -> true anomaly, to first order in the eccentricity.
        const mean = rock.phase + rock.rate * t;
        const nu = mean + 2 * rock.eccentricity * Math.sin(mean);
        const radius = rock.semiMajor * (1 - rock.eccentricity * rock.eccentricity) / (1 + rock.eccentricity * Math.cos(nu));
        const angle = nu + rock.periapsis;
        p.set(radius * Math.cos(angle), 0, radius * Math.sin(angle)).applyQuaternion(rock.node).applyQuaternion(TILT);
        p.y += this.centreHeight + bob * 0.6;
        q.copy(rock.attitude).premultiply(this._spin.setFromAxisAngle(rock.spinAxis, rock.spinRate * t));
        m.compose(p, q, s.setScalar(rock.size));
        m.toArray(array, i * 16);
      }
      set.matrices.needsUpdate = true;
    }
  }
}
