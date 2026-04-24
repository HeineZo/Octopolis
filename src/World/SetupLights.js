import * as THREE from "three";
import { SCENE_CONFIG } from "@config/SceneConfig";

/**
 * Setup lumière sous-marine
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
    sunset,
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

  const sunsetLight = new THREE.DirectionalLight(
    sunset.color,
    sunset.intensity,
  );
  sunsetLight.position.copy(sunset.position);
  sunsetLight.castShadow = true;
  sunsetLight.shadow.mapSize.set(2048, 2048);
  sunsetLight.shadow.camera.near = 0.5;
  sunsetLight.shadow.camera.far = 120;
  sunsetLight.shadow.camera.left = -40;
  sunsetLight.shadow.camera.right = 40;
  sunsetLight.shadow.camera.top = 40;
  sunsetLight.shadow.camera.bottom = -40;
  sunsetLight.shadow.bias = -0.0005;
  scene.add(sunsetLight);

  const rimLight = new THREE.DirectionalLight(
    sunset.rimColor,
    sunset.rimIntensity,
  );
  rimLight.position.copy(sunset.rimPosition);
  scene.add(rimLight);

  const hemi = new THREE.HemisphereLight(
    sunset.color,
    sunset.groundGlowColor,
    fillIntensity + sunset.groundGlowIntensity,
  );
  hemi.position.set(0, 10, 0);
  scene.add(hemi);

  const fillHemi = new THREE.HemisphereLight(
    directionalColor,
    fillColor,
    fillIntensity * 0.5,
  );
  fillHemi.position.set(0, -5, 0);
  scene.add(fillHemi);

  return { ambient, keyLight, sunsetLight, rimLight, hemi, fillHemi };
};
