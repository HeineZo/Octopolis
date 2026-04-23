import * as THREE from "three";
import { SCENE_CONFIG } from "@config/SceneConfig";

/**
 * Charge la texture equirectangulaire et génère une environment map
 * (PMREM) pour le PBR. N'écrase pas le background fog-ready.
 */
export const setupEnvironment = (renderer, scene) => {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const loader = new THREE.TextureLoader();

  loader.load(
    SCENE_CONFIG.background.texturePath,
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;

      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;

      texture.dispose();
      pmremGenerator.dispose();
    },
    undefined,
    () => {
      pmremGenerator.dispose();
    },
  );
};
