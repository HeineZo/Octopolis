import * as THREE from "three";
import { SCENE_CONFIG } from "@config/SceneConfig";

/**
 * Caméra perspective positionnée pour voir la scène sous-marine en plongée légère.
 */
export const createCamera = () => {
  const { fov, near, far, position } = SCENE_CONFIG.camera;
  const aspect = window.innerWidth / window.innerHeight;

  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.copy(position);

  return camera;
};
