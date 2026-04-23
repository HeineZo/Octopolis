import * as THREE from "three";
import { SCENE_CONFIG } from "@config/SceneConfig";
import { applyFbmDisplacement } from "./NoiseDisplacement";

/**
 * Fond marin procédural: plan finement tesselé déformé par bruit FBM
 * avec un matériau PBR sableux (couleur + rugosité élevée).
 */
export const createSeabed = () => {
  const { size, segments, color, heightNoiseScale, heightAmplitude } =
    SCENE_CONFIG.seabed;

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  applyFbmDisplacement(geometry, {
    frequency: heightNoiseScale,
    amplitude: heightAmplitude,
    octaves: 4,
    axis: "y",
  });
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0.02,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -1.5;
  mesh.receiveShadow = true;
  mesh.name = "seabed";

  return mesh;
};
