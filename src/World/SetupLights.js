import * as THREE from "three";
import { SCENE_CONFIG } from "@config/SceneConfig";

/**
 * Setup lumière 3 points sous-marine:
 * - Key light directionnelle bleutée qui vient de la surface
 * - Ambient froid pour le fill global
 * - Hemisphere light pour différencier sol/surface
 */
export const setupLights = (scene) => {
  const {
    ambientColor,
    ambientIntensity,
    directionalColor,
    directionalIntensity,
    directionalPosition,
    fillColor,
    fillIntensity,
  } = SCENE_CONFIG.lights;

  const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(
    directionalColor,
    directionalIntensity,
  );
  keyLight.position.copy(directionalPosition);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 50;
  keyLight.shadow.camera.left = -20;
  keyLight.shadow.camera.right = 20;
  keyLight.shadow.camera.top = 20;
  keyLight.shadow.camera.bottom = -20;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  const hemi = new THREE.HemisphereLight(directionalColor, fillColor, fillIntensity);
  hemi.position.set(0, 10, 0);
  scene.add(hemi);

  return { ambient, keyLight, hemi };
};
