import * as THREE from "three";
import { SCENE_CONFIG } from "@config/SceneConfig";
import { fbm } from "./NoiseDisplacement";

const LOCAL_UP = new THREE.Vector3(0, 1, 0);

/**
 * Échantillonne un point uniforme sur la sphère unité.
 * Utilise la méthode de l'inverse du cosinus pour une distribution uniforme
 * (sinon on concentre les points aux pôles).
 */
export const sampleSphereNormal = (rand = Math.random) => {
  const u = rand();
  const v = rand();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);

  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    sinPhi * Math.cos(theta),
    sinPhi * Math.sin(theta),
    Math.cos(phi),
  );
};

/**
 * Retourne le relief (positif/négatif) du mini-monde à la position donnée
 * par une normale unitaire. Doit rester cohérent avec le displacement
 * appliqué dans {@link createMiniWorld}.
 */
export const sampleMiniWorldRelief = (normal) => {
  const { radius, reliefAmplitude, reliefFrequency, reliefOctaves } =
    SCENE_CONFIG.miniWorld;

  const n = fbm(
    normal.x * reliefFrequency * radius,
    normal.y * reliefFrequency * radius,
    normal.z * reliefFrequency * radius,
    reliefOctaves,
  );

  return n * reliefAmplitude;
};

/**
 * Place un objet sur la surface du mini-monde le long de la normale donnée.
 * - sa base (y=0 local) se retrouve sur le sol (en tenant compte du relief),
 * - son axe +Y local pointe vers l'extérieur du globe,
 * - un spin aléatoire autour de la normale évite les alignements répétés.
 */
export const placeOnSphereSurface = (
  object,
  { normal, radius, altitude = 0, spin = Math.random() * Math.PI * 2 },
) => {
  const relief = sampleMiniWorldRelief(normal);
  const distance = radius + relief + altitude;

  object.position.copy(normal).multiplyScalar(distance);

  const orient = new THREE.Quaternion().setFromUnitVectors(LOCAL_UP, normal);
  const spinQ = new THREE.Quaternion().setFromAxisAngle(LOCAL_UP, spin);

  object.quaternion.copy(orient).multiply(spinQ);

  return object;
};
