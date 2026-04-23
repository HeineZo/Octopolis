import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SCENE_CONFIG } from "@config/SceneConfig";

/**
 * OrbitControls avec damping et cible recentrée sur le décor.
 */
export const createControls = (camera, domElement) => {
  const controls = new OrbitControls(camera, domElement);
  const { minDistance, maxDistance, maxPolarAngle } = SCENE_CONFIG.controls;

  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = minDistance;
  controls.maxDistance = maxDistance;
  controls.maxPolarAngle = maxPolarAngle;
  controls.target.copy(SCENE_CONFIG.camera.target);
  controls.update();

  return controls;
};
