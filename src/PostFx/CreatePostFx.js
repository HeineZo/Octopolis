import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { SCENE_CONFIG } from "@config/SceneConfig";

/**
 * Composer avec RenderPass + UnrealBloomPass léger + OutputPass
 * (gère color space + tonemapping final).
 */
export const createPostFx = (renderer, scene, camera) => {
  const { bloomStrength, bloomRadius, bloomThreshold, exposure } =
    SCENE_CONFIG.postFx;

  renderer.toneMappingExposure = exposure;

  const composer = new EffectComposer(renderer);
  composer.setSize(window.innerWidth, window.innerHeight);

  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    bloomStrength,
    bloomRadius,
    bloomThreshold,
  );
  composer.addPass(bloom);

  composer.addPass(new OutputPass());

  const setSize = (width, height) => {
    composer.setSize(width, height);
    bloom.setSize(width, height);
  };

  return { composer, setSize };
};
