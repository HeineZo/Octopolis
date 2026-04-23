import * as THREE from "three";
import { SCENE_CONFIG } from "@config/SceneConfig";
import { applyFbmDisplacement, fbm } from "./NoiseDisplacement";
import { placeOnSphereSurface, sampleSphereNormal } from "./SphereScatter";

/**
 * Génère une forme de rocher procédural (icosaèdre déformé FBM).
 */
const buildRockGeometry = (seed) => {
  const geometry = new THREE.IcosahedronGeometry(1, 4);

  applyFbmDisplacement(geometry, {
    frequency: 0.9,
    amplitude: 0.35,
    octaves: 5,
    seed,
  });

  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const offset = fbm(x * 2.1 + seed, y * 2.1 + seed, z * 2.1 + seed, 2) * 0.12;
    const len = Math.hypot(x, y, z) || 1;
    position.setXYZ(
      i,
      x + (x / len) * offset,
      y + (y / len) * offset,
      z + (z / len) * offset,
    );
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
};

const buildRockMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: SCENE_CONFIG.rocks.color,
    roughness: 0.92,
    metalness: 0.05,
    flatShading: true,
  });
};

/**
 * Disperse des rochers procéduraux uniques (3 variantes) sur la surface
 * du mini-monde. Chaque rocher est orienté selon la normale locale et
 * partiellement enterré (`buryRatio`) pour éviter qu'ils aient l'air
 * posés en l'air.
 */
export const createRocks = () => {
  const { count, minScale, maxScale, buryRatio } = SCENE_CONFIG.rocks;
  const { radius } = SCENE_CONFIG.miniWorld;

  const group = new THREE.Group();
  group.name = "rocks";

  const variants = [
    buildRockGeometry(1.37),
    buildRockGeometry(7.11),
    buildRockGeometry(42.03),
  ];
  const material = buildRockMaterial();

  for (let i = 0; i < count; i++) {
    const geometry = variants[i % variants.length];
    const mesh = new THREE.Mesh(geometry, material);

    const scale = minScale + Math.random() * (maxScale - minScale);
    mesh.scale.setScalar(scale);

    const normal = sampleSphereNormal();

    placeOnSphereSurface(mesh, {
      normal,
      radius,
      altitude: scale * (0.5 - buryRatio),
    });

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
};
