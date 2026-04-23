import * as THREE from "three";
import { SCENE_CONFIG } from "@config/SceneConfig";
import { fbm } from "./NoiseDisplacement";
import { createRocks } from "./CreateRocks";
import { createCorals } from "./CreateCorals";
import { createAlgae } from "./CreateAlgae";

/**
 * Sphère terrain: on part d'une SphereGeometry lisse et on pousse chaque
 * vertex le long de sa propre normale (unit vector depuis le centre) par
 * une valeur de bruit FBM. Ça donne un relief "radial" qui reste cohérent
 * sur tout le globe (pas d'artefacts aux pôles contrairement à un axis=Y).
 */
const buildSphereTerrain = () => {
  const {
    radius,
    segments,
    color,
    reliefAmplitude,
    reliefFrequency,
    reliefOctaves,
  } = SCENE_CONFIG.miniWorld;

  const geometry = new THREE.SphereGeometry(radius, segments, segments);
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const len = Math.hypot(x, y, z) || 1;
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;

    const n = fbm(
      nx * reliefFrequency * radius,
      ny * reliefFrequency * radius,
      nz * reliefFrequency * radius,
      reliefOctaves,
    );
    const offset = n * reliefAmplitude;

    position.setXYZ(i, x + nx * offset, y + ny * offset, z + nz * offset);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0.02,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  mesh.name = "mini-world-terrain";
  return mesh;
};

/**
 * Assemble le mini-monde: terrain sphérique + rochers + coraux + algues.
 * Retourne {@link buildResult}-like avec un `group` à ajouter à la scène
 * et un `update(delta)` pour animer les algues.
 */
export const createMiniWorld = () => {
  const group = new THREE.Group();
  group.name = "mini-world";

  group.add(buildSphereTerrain());
  group.add(createRocks());
  group.add(createCorals());

  const algae = createAlgae();
  group.add(algae.group);

  const update = (delta) => {
    algae.update(delta);
  };

  return { group, update };
};
