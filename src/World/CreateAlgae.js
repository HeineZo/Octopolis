import * as THREE from "three";
import { SCENE_CONFIG } from "@config/SceneConfig";
import { placeOnSphereSurface, sampleSphereNormal } from "./SphereScatter";

/**
 * Matériau "kelp" partagé par toutes les algues. Le sway est fait
 * côté GPU via {@link THREE.Material.onBeforeCompile} pour rester
 * performant (pas de recopie de position par frame côté CPU).
 *
 * Le phase varie par instance grâce à `modelMatrix` (position monde),
 * comme ça toutes les algues ne bougent pas à l'unisson.
 */
const buildAlgaeMaterial = () => {
  const { color, swaySpeed, swayAmplitude, maxHeight } = SCENE_CONFIG.algae;

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const uniforms = {
    uTime: { value: 0 },
    uSwaySpeed: { value: swaySpeed },
    uSwayAmp: { value: swayAmplitude },
    uMaxHeight: { value: maxHeight },
  };

  material.userData.uniforms = uniforms;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uSwaySpeed = uniforms.uSwaySpeed;
    shader.uniforms.uSwayAmp = uniforms.uSwayAmp;
    shader.uniforms.uMaxHeight = uniforms.uMaxHeight;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uTime;
         uniform float uSwaySpeed;
         uniform float uSwayAmp;
         uniform float uMaxHeight;`,
      )
      .replace(
        "#include <begin_vertex>",
        `vec3 transformed = vec3( position );
         vec3 worldOrigin = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
         float h = clamp(position.y / uMaxHeight, 0.0, 1.0);
         float bendFactor = h * h;
         float phase = worldOrigin.x * 0.6 + worldOrigin.z * 0.4;
         transformed.x += sin(uTime * uSwaySpeed + phase) * uSwayAmp * bendFactor * uMaxHeight;
         transformed.z += cos(uTime * uSwaySpeed * 0.8 + phase * 1.3) * uSwayAmp * 0.6 * bendFactor * uMaxHeight;`,
      );
  };

  return material;
};

/**
 * Génère une géométrie d'algue (kelp-like): cylindre fin effilé vers le
 * haut avec assez de segments en hauteur pour que le sway GPU soit lisse.
 */
const buildAlgaeGeometry = (height) => {
  const { baseRadius, tipRadius } = SCENE_CONFIG.algae;
  const geometry = new THREE.CylinderGeometry(
    tipRadius,
    baseRadius,
    height,
    6,
    14,
    false,
  );
  geometry.translate(0, height / 2, 0);
  return geometry;
};

/**
 * Disperse des "algues" animées sur la surface du mini-monde.
 * Retourne `{ group, update(delta) }`: l'update fait seulement avancer
 * l'uniforme de temps partagé par le matériau.
 */
export const createAlgae = () => {
  const { count, minHeight, maxHeight } = SCENE_CONFIG.algae;
  const { radius } = SCENE_CONFIG.miniWorld;

  const group = new THREE.Group();
  group.name = "algae";

  const material = buildAlgaeMaterial();

  for (let i = 0; i < count; i++) {
    const height = minHeight + Math.random() * (maxHeight - minHeight);
    const geometry = buildAlgaeGeometry(height);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const normal = sampleSphereNormal();
    placeOnSphereSurface(mesh, {
      normal,
      radius,
      altitude: -0.08,
    });

    group.add(mesh);
  }

  const update = (delta) => {
    material.userData.uniforms.uTime.value += delta;
  };

  return { group, update };
};
