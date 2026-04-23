import * as THREE from "three";
import { SCENE_CONFIG } from "@config/SceneConfig";

/**
 * Construit une texture ronde adoucie pour les points (particules).
 */
const createParticleTexture = () => {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.6)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

/**
 * Nuage de plancton/poussière pour densifier l'ambiance sous-marine.
 * Retourne { points, update(deltaSec) } pour permettre un micro-mouvement.
 */
export const createParticles = () => {
  const { count, areaSize, height, baseSize, color } = SCENE_CONFIG.particles;

  const positions = new Float32Array(count * 3);
  const drift = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * areaSize;
    positions[i * 3 + 1] = Math.random() * height - 1;
    positions[i * 3 + 2] = (Math.random() - 0.5) * areaSize;

    drift[i * 3 + 0] = (Math.random() - 0.5) * 0.05;
    drift[i * 3 + 1] = 0.02 + Math.random() * 0.04;
    drift[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color,
    size: baseSize,
    map: createParticleTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  points.name = "particles";

  const update = (deltaSec) => {
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] += drift[i * 3 + 0] * deltaSec;
      pos[i * 3 + 1] += drift[i * 3 + 1] * deltaSec;
      pos[i * 3 + 2] += drift[i * 3 + 2] * deltaSec;

      if (pos[i * 3 + 1] > height - 1) {
        pos[i * 3 + 1] = -1;
      }
    }
    geometry.attributes.position.needsUpdate = true;
  };

  return { points, update };
};
