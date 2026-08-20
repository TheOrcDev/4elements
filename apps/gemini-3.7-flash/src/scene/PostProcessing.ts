import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export class PostProcessingManager {
  public composer: EffectComposer;
  public bloomPass: UnrealBloomPass;
  private renderPass: RenderPass;
  private outputPass: OutputPass;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.composer = new EffectComposer(renderer);

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // Unreal Bloom Pass for glowing plasma embers, bioluminescence, and magical refractions
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.65,  // strength
      0.35,  // radius
      0.75   // threshold
    );
    this.composer.addPass(this.bloomPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  public setBloomStrength(strength: number) {
    this.bloomPass.strength = strength;
  }

  public setBloomThreshold(threshold: number) {
    this.bloomPass.threshold = threshold;
  }

  public setBloomRadius(radius: number) {
    this.bloomPass.radius = radius;
  }

  public setSize(width: number, height: number) {
    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width, height);
  }

  public render() {
    this.composer.render();
  }

  public dispose() {
    this.composer.dispose();
  }
}
