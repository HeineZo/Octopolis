import * as THREE from "three";

/**
 * Crée le WebGLRenderer configuré pour un rendu PBR réaliste
 * (tonemapping ACES, color space sRGB, ombres douces).
 */
export const createRenderer = () => {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(renderer.domElement);

  return renderer;
};

/**
 * Branche l'auto-resize du renderer + caméra sur l'event window.resize.
 */
export const attachRendererResize = (renderer, camera, onResize) => {
  const handleResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    if (onResize) onResize(width, height);
  };

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
};
