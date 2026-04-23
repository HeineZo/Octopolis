import * as THREE from "three";
import { SCENE_CONFIG } from "@config/SceneConfig";

/**
 * Scène avec fog exponentiel (dispersion sous-marine) et background bleu profond.
 */
export const createScene = () => {
  const scene = new THREE.Scene();

  scene.background = SCENE_CONFIG.background.color.clone();
  scene.fog = new THREE.FogExp2(
    SCENE_CONFIG.fog.color.getHex(),
    SCENE_CONFIG.fog.density,
  );

  return scene;
};
