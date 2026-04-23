import * as THREE from "three";
import { SCENE_CONFIG } from "@config/SceneConfig";
import { placeOnSphereSurface, sampleSphereNormal } from "./SphereScatter";

/**
 * Construit une branche de corail récursive:
 * - un cylindre légèrement conique (tronc),
 * - une petite sphère "blob" au bout (tip),
 * - 1..N sous-branches inclinées qui démarrent près du sommet.
 *
 * Chaque branche est parentée à la précédente pour que l'inclinaison se
 * propage (système hiérarchique).
 */
const addBranch = ({
  parent,
  material,
  startY,
  radius,
  length,
  depth,
  maxDepth,
}) => {
  if (depth > maxDepth || length < 0.12) return;

  const geom = new THREE.CylinderGeometry(
    radius * 0.65,
    radius,
    length,
    8,
    1,
    false,
  );
  geom.translate(0, length / 2, 0);

  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = startY;

  const tiltX = (Math.random() - 0.5) * 0.9;
  const tiltZ = (Math.random() - 0.5) * 0.9;
  mesh.rotation.x = tiltX;
  mesh.rotation.z = tiltZ;
  parent.add(mesh);

  const tipGeom = new THREE.IcosahedronGeometry(radius * 1.35, 1);
  const tip = new THREE.Mesh(tipGeom, material);
  tip.castShadow = true;
  tip.receiveShadow = true;
  tip.position.y = length;
  mesh.add(tip);

  const childCount =
    depth < maxDepth - 1
      ? 2 + Math.floor(Math.random() * 2)
      : 1 + Math.floor(Math.random() * 2);

  for (let c = 0; c < childCount; c++) {
    addBranch({
      parent: mesh,
      material,
      startY: length * (0.55 + Math.random() * 0.4),
      radius: radius * (0.55 + Math.random() * 0.15),
      length: length * (0.5 + Math.random() * 0.35),
      depth: depth + 1,
      maxDepth,
    });
  }
};

const buildCoralInstance = () => {
  const { colors } = SCENE_CONFIG.corals;
  const color = colors[Math.floor(Math.random() * colors.length)];

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.05,
  });

  const instance = new THREE.Group();
  instance.name = "coral";

  addBranch({
    parent: instance,
    material,
    startY: 0,
    radius: 0.12 + Math.random() * 0.06,
    length: 0.75 + Math.random() * 0.5,
    depth: 0,
    maxDepth: 3,
  });

  return instance;
};

/**
 * Disperse des coraux branchés procéduraux à la surface du mini-monde.
 * Légèrement enterrés pour que la base ne flotte pas en cas de relief
 * concave.
 */
export const createCorals = () => {
  const { count, minScale, maxScale } = SCENE_CONFIG.corals;
  const { radius } = SCENE_CONFIG.miniWorld;

  const group = new THREE.Group();
  group.name = "corals";

  for (let i = 0; i < count; i++) {
    const coral = buildCoralInstance();

    const scale = minScale + Math.random() * (maxScale - minScale);
    coral.scale.setScalar(scale);

    const normal = sampleSphereNormal();
    placeOnSphereSurface(coral, {
      normal,
      radius,
      altitude: -0.12 * scale,
    });

    group.add(coral);
  }

  return group;
};
