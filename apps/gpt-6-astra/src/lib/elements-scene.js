import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import {
  mergeVertices,
  mergeGeometries,
} from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const noiseGLSL = `
float hash(vec3 p) { p=fract(p*.3183099+vec3(.11,.27,.37)); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise3(vec3 p) {
  vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p) { return noise3(p)*.57 + noise3(p*2.07+2.3)*.28 + noise3(p*4.13-1.7)*.15; }
`;
const basicVertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
function seededRandom(seed = 42) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function createFire() {
  const group = new THREE.Group();
  const uniforms = {
    uTime: { value: 0 },
    uIntensity: { value: 1 },
    uCamera: { value: new THREE.Vector3() },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    vertexShader: `varying vec3 vLocal;void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `
      varying vec3 vLocal; uniform vec3 uCamera; uniform float uTime,uIntensity;
      ${noiseGLSL}
      void main(){
        vec3 ro=uCamera, rd=normalize(vLocal-ro);
        vec3 inv=1./rd; vec3 t0=(vec3(-1.3,-1.3,-1.3)-ro)*inv; vec3 t1=(vec3(1.3,1.9,1.3)-ro)*inv;
        vec3 tmin=min(t0,t1),tmax=max(t0,t1);
        float near=max(max(tmin.x,tmin.y),tmin.z),far=min(min(tmax.x,tmax.y),tmax.z);
        if(near>far) discard;
        float stepSize=(far-max(near,0.))/64.; vec4 sum=vec4(0.);
        for(int i=0;i<64;i++){
          vec3 p=ro+rd*(max(near,0.)+(float(i)+.5)*stepSize);
          float h=(p.y+1.03)/2.65;
          vec2 center=vec2(sin(p.y*3.5-uTime*2.3),cos(p.y*2.8-uTime*1.7))*.15*h;
          float radius=(.72*(1.-h)+.09)*smoothstep(-.08,.14,h);
          if(h<0.||h>1.06||length(p.xz-center)>radius+.6)continue;
          vec3 q=p*vec3(4.2,3.2,4.2)-vec3(0.,uTime*3.2,0.);
          float turbulent=fbm(q+vec3(noise3(q*.7),0.,0.)*1.5);
          float angular=atan(p.z-center.y,p.x-center.x);
          float tongues=sin(angular*3.+h*7.-uTime*1.8)*.10*h;
          float d=radius-length(p.xz-center)+(turbulent-.49)*1.02+tongues;
          float density=smoothstep(-.015,.18,d)*(1.-smoothstep(.75,1.05,h))*smoothstep(0.,.09,h);
          float core=clamp(d*1.8-(1.-turbulent)*.08,0.,1.);
          vec3 color=mix(vec3(1.2,.055,.003),vec3(2.5,.50,.018),smoothstep(0.,.6,core));
          color=mix(color,vec3(3.2,1.8,.34),smoothstep(.52,1.,core));
          float alpha=1.-exp(-density*stepSize*5.4);
          sum.rgb+=(1.-sum.a)*color*alpha*(.8+.2*uIntensity);
          sum.a+=(1.-sum.a)*alpha;
          if(sum.a>.985)break;
        }
        gl_FragColor=vec4(sum.rgb,max(sum.a,0.));
      }`,
  });
  const volume = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 3.2, 2.6).translate(0, 0.3, 0),
    material,
  );
  group.add(volume);
  const rng = seededRandom(87),
    count = 430;
  const positions = new Float32Array(count * 3),
    seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    seeds.set([rng(), rng(), rng(), rng()], i * 4);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  const sparks = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec4 aSeed;uniform float uTime,uIntensity;varying float vLife;varying float vSeed;
      void main(){float life=fract(aSeed.x+uTime*(.11+aSeed.z*.13));float a=aSeed.y*6.283+uTime*.3;
      float r=(.3+aSeed.z*.55)*(1.+life*.7);vec3 p=vec3(cos(a)*r+sin(life*9.+a)*life*.22,-1.05+life*3.4,sin(a)*r);
      vLife=sin(life*3.14159);vSeed=aSeed.w;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp((1.1+aSeed.w*2.)*uIntensity*20./-mv.z,1.,5.);}`,
      fragmentShader: `varying float vLife;varying float vSeed;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.04,d)*vLife;gl_FragColor=vec4(mix(vec3(2.,.35,.015),vec3(4.,1.4,.13),vSeed),a*.8);}`,
    }),
  );
  sparks.frustumCulled = false;
  group.add(sparks);
  return {
    group,
    update(time, intensity, camera) {
      uniforms.uTime.value = time;
      uniforms.uIntensity.value = intensity;
      volume.updateWorldMatrix(true, false);
      uniforms.uCamera.value.copy(camera.position);
      volume.worldToLocal(uniforms.uCamera.value);
    },
  };
}

function createAir() {
  const group = new THREE.Group();
  const uniforms = { uTime: { value: 0 }, uIntensity: { value: 1 } };
  const rng = seededRandom(120);
  for (let j = 0; j < 42; j++) {
    const segments = 160,
      positions = [],
      uvs = [],
      indices = [];
    const soft = j >= 28;
    const phase = rng() * TAU,
      turns = 1.6 + rng() * 2.2,
      offset = rng(),
      width = soft ? 0.12 + rng() * 0.13 : 0.009 + rng() * 0.014;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments,
        y = (t - 0.5) * 2.7;
      const r =
        0.18 +
        Math.pow(t, 0.7) * 0.9 +
        0.12 * Math.sin(t * 7 + phase) +
        offset * 0.14;
      const angle = t * TAU * turns + phase;
      for (let side = 0; side < 2; side++) {
        positions.push(
          Math.cos(angle) * r,
          y + (side - 0.5) * width,
          Math.sin(angle) * r,
        );
        uvs.push(t, side);
      }
      if (i < segments) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        ...uniforms,
        uPhase: { value: phase },
        uSoft: { value: soft ? 1 : 0 },
        uBrightness: {
          value: soft ? 0.16 + rng() * 0.15 : 0.22 + rng() * 0.65,
        },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv;uniform float uTime,uPhase;void main(){vUv=uv;vec3 p=position;float a=uTime*(.38+uPhase*.02);p.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*p.xz;p.x+=sin(p.y*2.+uTime)*.09;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader: `varying vec2 vUv;uniform float uTime,uPhase,uIntensity,uBrightness,uSoft;${noiseGLSL}
      void main(){
        float streak=pow(.5+.5*sin(vUv.x*16.-uTime*2.8+uPhase),5.);
        float ends=pow(max(0.,sin(clamp(vUv.x,0.,1.)*3.14159265)),.7);float edge=pow(max(0.,sin(vUv.y*3.14159)),1.4);
        float mist=fbm(vec3(vUv.x*27.-uTime*.8,vUv.y*2.,uPhase));
        float alpha=ends*edge*(.12+streak*.8)*uBrightness*mix(1.,mist,uSoft);
        gl_FragColor=vec4(vec3(.72,.86,.98)*(1.+streak*.8)*uIntensity,alpha);
      }`,
    });
    group.add(new THREE.Mesh(geometry, material));
  }
  const count = 900,
    values = new Float32Array(count * 3),
    seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) seeds.set([rng(), rng(), rng()], i * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(values, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
  const particles = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec3 aSeed;uniform float uTime;varying float vAlpha;void main(){float t=fract(aSeed.x+uTime*.095);float r=.17+t*.97+aSeed.z*.13;float angle=aSeed.y*6.283+t*18.-uTime;vec3 p=vec3(cos(angle)*r,(t-.5)*2.7,sin(angle)*r);vAlpha=sin(t*3.14159)*(.1+aSeed.z*.45);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(12./-mv.z,1.,2.5);}`,
      fragmentShader: `varying float vAlpha;void main(){gl_FragColor=vec4(.8,.92,1.,smoothstep(.5,.1,length(gl_PointCoord-.5))*vAlpha);}`,
    }),
  );
  particles.frustumCulled = false;
  group.add(particles);
  group.rotation.z = -0.09;
  return {
    group,
    update(time, intensity) {
      uniforms.uTime.value = time;
      uniforms.uIntensity.value = intensity;
    },
  };
}

function createWater() {
  const group = new THREE.Group();
  const uniforms = { uTime: { value: 0 }, uIntensity: { value: 1 } };
  const wave = `uniform float uTime,uIntensity;
    float displacement(vec3 p){return (sin(p.x*6.+uTime*1.6)*sin(p.y*5.-uTime)*.028+sin(p.z*8.+p.x*3.-uTime*1.7)*.014+sin(p.y*21.+p.z*13.+uTime*2.)*sin(p.x*18.-uTime)*.004)*uIntensity;}
    vec3 displace(vec3 p){return p+normalize(p)*displacement(p);}`;
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xc2eeff,
    roughness: 0.025,
    metalness: 0,
    transmission: 0.98,
    thickness: 1.8,
    ior: 1.333,
    envMapIntensity: 1.25,
    attenuationColor: new THREE.Color(0x67c8ed),
    attenuationDistance: 4.5,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = wave + '\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <beginnormal_vertex>',
        `
      vec3 axis=abs(normal.y)<.99?vec3(0.,1.,0.):vec3(1.,0.,0.);
      vec3 tangent=normalize(cross(axis,normal));vec3 bitangent=cross(normal,tangent);
      vec3 p0=displace(position);vec3 p1=displace(position+tangent*.012);vec3 p2=displace(position+bitangent*.012);
      vec3 objectNormal=normalize(cross(p1-p0,p2-p0));
      #ifdef USE_TANGENT
        vec3 objectTangent=vec3(tangent.xyz);
      #endif
    `,
      )
      .replace(
        '#include <begin_vertex>',
        'vec3 transformed=displace(position);',
      );
  };
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.02, 128, 96), material);
  group.add(orb);
  // The clear surface needs something to refract. A subdued caustic light field
  // behind it supplies depth and blue transmitted light without opaque paint.
  const caustics = new THREE.Mesh(
    new THREE.CircleGeometry(0.98, 80),
    new THREE.ShaderMaterial({
      uniforms,
      depthWrite: true,
      vertexShader: basicVertex,
      fragmentShader: `varying vec2 vUv;uniform float uTime;${noiseGLSL}
      void main(){
        vec2 p=(vUv-.5)*2.;float t=uTime*.35;
        vec2 q=p*6.+vec2(sin(p.y*4.+t),cos(p.x*4.-t))*.6;
        float caustic=pow(1.-abs(sin(q.x+sin(q.y+t))*cos(q.y+sin(q.x-t))),12.);
        float caustic2=pow(1.-abs(sin(q.x*1.6+t)*cos(q.y*1.3-t)),18.);
        float fade=1.-smoothstep(.45,1.,length(p));
        vec3 color=vec3(.001,.044,.092)+(caustic*.6+caustic2*.25)*vec3(.015,.20,.28);
        gl_FragColor=vec4(mix(vec3(.00335,.00402,.00402),color,fade),1.);
      }`,
    }),
  );
  group.add(caustics);
  const localView = new THREE.Vector3(),
    facing = new THREE.Vector3(0, 0, 1);
  const rng = seededRandom(81),
    droplets = [];
  const dropMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb0e6ff,
    roughness: 0.025,
    metalness: 0,
    transmission: 0.95,
    thickness: 0.08,
    ior: 1.333,
    envMapIntensity: 1.5,
  });
  for (let i = 0; i < 24; i++) {
    const size = 0.018 + rng() ** 2 * 0.09;
    const drop = new THREE.Mesh(
      new THREE.SphereGeometry(size, 20, 14),
      dropMaterial,
    );
    const angle = rng() * TAU,
      radius = 1.22 + rng() * 0.33,
      elevation = (rng() - 0.5) * 1.9;
    group.add(drop);
    droplets.push({
      drop,
      angle,
      radius,
      elevation,
      speed: 0.1 + rng() * 0.16,
    });
  }
  // Partial streams of liquid wrap around the surface, breaking into droplets.
  for (let j = 0; j < 2; j++) {
    const points = [];
    for (let i = 0; i < 170; i++) {
      const a = (i / 169) * TAU * 0.74 + j * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(a) * 1.23,
          Math.sin(a * 2 + j) * 0.13,
          Math.sin(a) * 1.23,
        ),
      );
    }
    const ring = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        180,
        0.017,
        6,
        false,
      ),
      dropMaterial,
    );
    ring.rotation.set(0.45 + j * 0.5, 0.2, 0.2 + j * 0.4);
    group.add(ring);
  }
  return {
    group,
    update(time, intensity, camera) {
      uniforms.uTime.value = time;
      uniforms.uIntensity.value = intensity;
      localView.copy(camera.position);
      group.worldToLocal(localView);
      localView.normalize();
      caustics.position.copy(localView).multiplyScalar(-1.12);
      caustics.quaternion.setFromUnitVectors(facing, localView);
      orb.rotation.y = time * 0.065;
      orb.rotation.z = Math.sin(time * 0.2) * 0.04;
      droplets.forEach(({ drop, angle, radius, elevation, speed }) => {
        drop.position.set(
          Math.cos(angle + time * speed) * radius,
          elevation + Math.sin(time + angle) * 0.075,
          Math.sin(angle + time * speed) * radius,
        );
      });
    },
  };
}

function createEarth() {
  const group = new THREE.Group(),
    rock = new THREE.Group();
  group.add(rock);
  const rng = seededRandom(384),
    simplex = new SimplexNoise({ random: rng });
  const noise = (x, y, z) => simplex.noise3d(x, y, z);
  function rockyGeometry(radius, detail) {
    const geometry = new THREE.IcosahedronGeometry(radius, detail),
      position = geometry.attributes.position,
      colors = new Float32Array(position.count * 3);
    const point = new THREE.Vector3(),
      color = new THREE.Color();
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i).normalize();
      const { x, y, z } = point;
      const broad = noise(x * 2.6, y * 2.6, z * 2.6),
        ridge = 1 - Math.abs(noise(x * 6, y * 6, z * 6));
      const fine = noise(x * 16, y * 16, z * 16),
        micro = noise(x * 36, y * 36, z * 36);
      const r =
        radius *
        (1 + broad * 0.17 + ridge * 0.1 + fine * 0.018 + micro * 0.003);
      position.setXYZ(i, x * r, y * r * 0.92, z * r);
      const moss = noise(x * 3.5 + 4, y * 3.5, z * 3.5);
      color.setRGB(
        0.038 + ridge * 0.04 + fine * 0.01,
        0.029 + ridge * 0.036 + fine * 0.006,
        0.017 + ridge * 0.026,
      );
      const mossCoverage =
        THREE.MathUtils.smoothstep(moss, -0.02, 0.3) *
        THREE.MathUtils.smoothstep(y, -0.55, 0.15);
      color.lerp(
        new THREE.Color(
          0.032 + ridge * 0.025,
          0.063 + ridge * 0.056,
          0.012 + ridge * 0.016,
        ),
        mossCoverage,
      );
      if (fine > 0.5) color.lerp(new THREE.Color(0.15, 0.14, 0.1), 0.25);
      color.toArray(colors, i * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    // Weld shared corners before computing normals: mineral detail belongs in
    // the surface, rather than making every triangle look like a separate shard.
    geometry.deleteAttribute('normal');
    geometry.deleteAttribute('uv');
    const welded = mergeVertices(geometry, 0.0001);
    geometry.dispose();
    welded.computeVertexNormals();
    return welded;
  }
  const material = new THREE.MeshStandardMaterial({
    color: 0xb0aa90,
    vertexColors: true,
    roughness: 0.94,
    metalness: 0.035,
    envMapIntensity: 0.35,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = 'varying vec3 vRockPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvRockPosition=position;',
    );
    shader.fragmentShader =
      'varying vec3 vRockPosition;\n' + noiseGLSL + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      float grain=noise3(vRockPosition*95.);
      float seam=abs(fbm(vRockPosition*7.)-.5);
      float strata=sin(vRockPosition.y*34.+fbm(vRockPosition*4.)*12.);
      diffuseColor.rgb *= (.7+grain*.6)*(.57+.43*smoothstep(.018,.065,seam))*(.88+.12*strata);
    `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
      float grainHeight=noise3(vRockPosition*85.)*.009;
      vec3 surfaceX=dFdx(-vViewPosition),surfaceY=dFdy(-vViewPosition);
      vec3 r1=cross(surfaceY,normal),r2=cross(normal,surfaceX);
      float determinant=dot(surfaceX,r1);
      normal=normalize(abs(determinant)*normal-sign(determinant)*(dFdx(grainHeight)*r1+dFdy(grainHeight)*r2));
    `,
    );
  };
  const core = new THREE.Mesh(rockyGeometry(0.96, 42), material);
  rock.add(core);
  // Real faceted mineral outcrops sit on the rock surface.
  const crystalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x789b48,
    emissive: 0x26380e,
    emissiveIntensity: 0.1,
    roughness: 0.22,
    metalness: 0.12,
    clearcoat: 0.7,
    envMapIntensity: 0.65,
    flatShading: true,
  });
  const crystalShaft = new THREE.CylinderGeometry(0.65, 1, 2.4, 6).translate(
    0,
    0.3,
    0,
  );
  const crystalTip = new THREE.ConeGeometry(0.65, 1.1, 6).translate(0, 2.05, 0);
  const crystalGeometry = mergeGeometries([crystalShaft, crystalTip]);
  crystalShaft.dispose();
  crystalTip.dispose();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 17; i++) {
    const n = new THREE.Vector3(
      rng() - 0.5,
      rng() * 0.8 + 0.1,
      rng() - 0.5,
    ).normalize();
    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
    crystal.scale.set(
      0.035 + rng() * 0.026,
      0.045 + rng() * 0.05,
      0.035 + rng() * 0.026,
    );
    crystal.position.copy(n).multiplyScalar(1.04);
    crystal.quaternion.setFromUnitVectors(up, n);
    rock.add(crystal);
  }
  const satellites = [];
  for (let i = 0; i < 20; i++) {
    const mesh = new THREE.Mesh(
      rockyGeometry(0.035 + rng() ** 2 * 0.13, 2),
      material,
    );
    const angle = rng() * TAU,
      radius = 1.3 + rng() * 0.28,
      y = (rng() - 0.5) * 1.6;
    mesh.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    group.add(mesh);
    satellites.push({ mesh, angle, radius, y });
  }
  return {
    group,
    update(time) {
      rock.rotation.y = time * 0.09;
      rock.rotation.z = 0.12;
      satellites.forEach(({ mesh, angle, radius, y }, i) => {
        const a = angle + time * 0.055;
        mesh.position.set(
          Math.cos(a) * radius,
          y + Math.sin(time * 0.6 + i) * 0.09,
          Math.sin(a) * radius,
        );
        mesh.rotation.x = time * 0.08 + i;
      });
    },
  };
}

function createPlinth(color) {
  const group = new THREE.Group();
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 4),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: basicVertex,
      fragmentShader:
        'varying vec2 vUv;uniform vec3 uColor;void main(){float r=length(vUv-.5)*2.;float glow=exp(-r*r*10.)*.12;gl_FragColor=vec4(uColor,glow);}',
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -1.48;
  group.add(glow);
  for (const radius of [1.12, 1.23]) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius, radius + 0.004, 128),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: radius < 1.2 ? 0.18 : 0.07,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.47;
    group.add(ring);
  }
  return group;
}

/** Create the shared renderer. The controller owns and disposes all GPU resources. */
export function createElementsScene(container, callbacks) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0d0d');
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.transmissionResolutionScale = 0.5;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute(
    'aria-label',
    'Four live 3D elements: flame, wind vortex, liquid water sphere and floating mineral rock.',
  );
  container.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(
    32,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  );
  const environmentScene = new RoomEnvironment(),
    pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(environmentScene, 0.035);
  scene.environment = environment.texture;
  environmentScene.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xd8e7f2, 0x393323, 0.75));
  const key = new THREE.DirectionalLight(0xffe6c3, 1.7);
  key.position.set(-3, 5, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbacde8, 1.6);
  rim.position.set(4, 2, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xc5d6bd, 0.4);
  fill.position.set(1, -1, 4);
  scene.add(fill);
  const renderTarget = new THREE.WebGLRenderTarget(
    container.clientWidth,
    container.clientHeight,
    { type: THREE.HalfFloatType, samples: 4 },
  );
  const composer = new EffectComposer(renderer, renderTarget);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.24,
    0.35,
    1.4,
  );
  composer.addPass(bloom);
  const output = new OutputPass();
  composer.addPass(output);
  const elements = [createFire(), createAir(), createWater(), createEarth()];
  const colors = [0xff6c1e, 0xaabfcc, 0x237bdc, 0x91aa53];
  const hubs = elements.map((element, i) => {
    const hub = new THREE.Group();
    hub.add(element.group, createPlinth(colors[i]));
    scene.add(hub);
    return hub;
  });
  const ambientGeo = new THREE.BufferGeometry(),
    ambientPositions = new Float32Array(190 * 3),
    rng = seededRandom(712);
  for (let i = 0; i < 190; i++)
    ambientPositions.set(
      [(rng() - 0.5) * 17, (rng() - 0.5) * 7, -1 - rng() * 5],
      i * 3,
    );
  ambientGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(ambientPositions, 3),
  );
  const ambient = new THREE.Points(
    ambientGeo,
    new THREE.PointsMaterial({
      size: 0.009,
      color: 0xaeb6a0,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }),
  );
  scene.add(ambient);
  let focused = -1,
    paused = false,
    intensity = 1,
    time = 5,
    destroyed = false,
    frame = 0,
    last = performance.now(),
    frames = 0,
    fpsStart = last;
  let zoom = 1,
    mobile = false,
    worldWidth = 14.0,
    dragging = false,
    dragDistance = 0,
    downX = 0,
    downY = 0,
    lastX = 0,
    lastY = 0;
  let yaw = 0,
    pitch = 0,
    targetYaw = 0,
    targetPitch = 0,
    invalidated = true;
  const targetPosition = new THREE.Vector3();
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  const clickTargets = hubs.map((hub, i) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.25, 12, 8),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hub.add(mesh);
    mesh.userData.elementIndex = i;
    return mesh;
  });
  function resize() {
    invalidated = true;
    const width = container.clientWidth,
      height = container.clientHeight;
    if (!width || !height) return;
    mobile = width < 620;
    worldWidth = mobile ? 6.7 : 14;
    camera.aspect = width / height;
    renderer.setSize(width, height);
    composer.setSize(width, height);
    camera.updateProjectionMatrix();
  }
  function setFocused(index) {
    focused = index;
    zoom = 1;
    targetYaw = 0;
    targetPitch = 0;
    invalidated = true;
  }
  function down(event) {
    if (event.button !== 0) return;
    dragging = true;
    dragDistance = 0;
    lastX = downX = event.clientX;
    lastY = downY = event.clientY;
    renderer.domElement.setPointerCapture(event.pointerId);
  }
  function move(event) {
    if (!dragging) return;
    invalidated = true;
    const dx = event.clientX - lastX,
      dy = event.clientY - lastY;
    dragDistance = Math.hypot(event.clientX - downX, event.clientY - downY);
    targetYaw += dx * 0.008;
    targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.005, -0.65, 0.65);
    lastX = event.clientX;
    lastY = event.clientY;
  }
  function up(event) {
    if (!dragging) return;
    dragging = false;
    if (renderer.domElement.hasPointerCapture(event.pointerId))
      renderer.domElement.releasePointerCapture(event.pointerId);
    if (dragDistance > 6 || focused >= 0) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(clickTargets);
    if (hits.length) {
      const index = hits[0].object.userData.elementIndex;
      setFocused(index);
      callbacks.onSelect(index);
    }
  }
  function wheel(event) {
    event.preventDefault();
    zoom = THREE.MathUtils.clamp(
      zoom * Math.exp(-event.deltaY * 0.0006),
      0.78,
      1.5,
    );
    invalidated = true;
  }
  function cancelDrag() {
    dragging = false;
  }
  function contextLost(event) {
    event.preventDefault();
    callbacks.onError(
      'The browser paused its graphics context. Reload to restore the elements.',
    );
  }
  renderer.domElement.addEventListener('pointerdown', down);
  renderer.domElement.addEventListener('pointermove', move);
  renderer.domElement.addEventListener('pointerup', up);
  renderer.domElement.addEventListener('pointercancel', cancelDrag);
  renderer.domElement.addEventListener('wheel', wheel, { passive: false });
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  // Initialize positions before the first frame, avoiding an overlapping entrance flash.
  hubs.forEach((hub, i) => {
    hub.position.set(
      mobile ? ((i % 2) - 0.5) * 3.2 : (i - 1.5) * 3.25,
      mobile ? (i < 2 ? 1.8 : -1.65) : 0.08,
      0,
    );
    hub.scale.setScalar(mobile ? 0.85 : 1);
  });
  let announced = false;
  function render(now) {
    if (destroyed) return;
    frame = requestAnimationFrame(render);
    const delta = Math.min((now - last) / 1000, 0.045);
    last = now;
    if (document.hidden) return;
    if (paused && !invalidated) return;
    if (!paused) time += delta * (0.55 + intensity * 0.45);
    const lerp = 1 - Math.exp(-delta * 6);
    yaw = THREE.MathUtils.lerp(yaw, targetYaw, lerp);
    pitch = THREE.MathUtils.lerp(pitch, targetPitch, lerp);
    invalidated =
      Math.abs(yaw - targetYaw) + Math.abs(pitch - targetPitch) > 0.0001;
    const distance =
      worldWidth /
      (2 * Math.tan(THREE.MathUtils.degToRad(16)) * camera.aspect) /
      zoom;
    camera.position.set(0, distance * 0.1, distance);
    camera.lookAt(0, 0, 0);
    elements.forEach((element, i) => {
      let x = mobile ? ((i % 2) - 0.5) * 3.2 : (i - 1.5) * 3.25;
      let y = mobile ? (i < 2 ? 1.8 : -1.65) : 0.08;
      let scale = mobile ? 0.85 : 1;
      if (focused >= 0) {
        x = mobile ? 0 : 2.1;
        y = mobile ? 0.8 : 0.05;
        scale =
          focused === i
            ? mobile
              ? 1.16
              : Math.min(1.48, 3.6 / camera.aspect)
            : 0.001;
      }
      targetPosition.set(x, y, 0);
      hubs[i].position.lerp(targetPosition, lerp);
      const nextScale = THREE.MathUtils.lerp(hubs[i].scale.x, scale, lerp);
      hubs[i].scale.setScalar(nextScale);
      if (
        hubs[i].position.distanceToSquared(targetPosition) > 0.00001 ||
        Math.abs(nextScale - scale) > 0.0001
      )
        invalidated = true;
      hubs[i].visible = nextScale > 0.005;
      element.group.rotation.y = yaw;
      element.group.rotation.x = pitch;
      if (hubs[i].visible) element.update(time, intensity, camera);
    });
    ambient.rotation.z = time * 0.003;
    composer.render();
    if (!announced) {
      announced = true;
      callbacks.onReady();
    }
    frames++;
    if (now - fpsStart > 1200) {
      const fps = Math.round((frames * 1000) / (now - fpsStart));
      callbacks.onFps(fps);
      frames = 0;
      fpsStart = now;
    }
  }
  frame = requestAnimationFrame(render);
  return {
    setFocused,
    setPaused(value) {
      paused = value;
      invalidated = true;
      frames = 0;
      fpsStart = performance.now();
    },
    setIntensity(value) {
      intensity = value;
      bloom.strength = 0.16 + value * 0.08;
      invalidated = true;
    },
    reset() {
      setFocused(-1);
      intensity = 1;
      bloom.strength = 0.24;
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', up);
      renderer.domElement.removeEventListener('pointercancel', cancelDrag);
      renderer.domElement.removeEventListener('wheel', wheel);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      const geometries = new Set(),
        materials = new Set();
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) {
          const list = Array.isArray(object.material)
            ? object.material
            : [object.material];
          list.forEach((material) => materials.add(material));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      bloom.dispose();
      output.dispose();
      composer.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
