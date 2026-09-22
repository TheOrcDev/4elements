// Small helper around Material.onBeforeCompile that injects GLSL into built-in
// materials while keeping three's lighting, shadows and fog intact.

let uid = 0;

/**
 * @param {THREE.Material} material
 * @param {{
 *   uniforms?: Record<string, {value:any}>,
 *   vertexHeader?: string,
 *   fragmentHeader?: string,
 *   vertex?: Record<string,string>,   // chunk name -> replacement code
 *   fragment?: Record<string,string>,
 *   key?: string,
 * }} opts
 */
export function patchMaterial(material, opts) {
  const key = opts.key ?? `patched-${uid++}`;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, opts.uniforms ?? {});
    if (opts.vertexHeader) {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${opts.vertexHeader}`);
    }
    if (opts.fragmentHeader) {
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\n${opts.fragmentHeader}`);
    }
    for (const [chunk, code] of Object.entries(opts.vertex ?? {})) {
      shader.vertexShader = shader.vertexShader.replace(`#include <${chunk}>`, code);
    }
    for (const [chunk, code] of Object.entries(opts.fragment ?? {})) {
      shader.fragmentShader = shader.fragmentShader.replace(`#include <${chunk}>`, code);
    }
    material.userData.shader = shader;
  };
  // Every patch compiles to its own program.
  material.customProgramCacheKey = () => key;
  return material;
}
