import { createRenderer, attachRendererResize } from "@core/CreateRenderer";
import { createCamera } from "@core/CreateCamera";
import { createControls } from "@core/CreateControls";
import { createScene } from "@core/CreateScene";
import { setupEnvironment } from "@world/SetupEnvironment";
import { setupLights } from "@world/SetupLights";
import { createMiniWorld } from "@world/CreateMiniWorld";
import { createParticles } from "@world/CreateParticles";
import { createOctopus } from "@world/CreateOctopus";
import { createPostFx } from "@postfx/CreatePostFx";
import { startRenderLoop } from "@loop/StartRenderLoop";

const OCTOPUS_URL = "/OctopolisTry.glb";

/**
 * Orchestre tous les modules de la scène sous-marine.
 * Retourne l'API minimale (renderer, scene, camera) au cas où utile au dev.
 */
export const createApp = () => {
  const renderer = createRenderer();
  const scene = createScene();
  const camera = createCamera();
  const controls = createControls(camera, renderer.domElement);

  setupEnvironment(renderer, scene);
  setupLights(scene);

  const miniWorld = createMiniWorld();
  scene.add(miniWorld.group);

  const particles = createParticles();
  scene.add(particles.points);

  const postFx = createPostFx(renderer, scene, camera);

  attachRendererResize(renderer, camera, (width, height) => {
    postFx.setSize(width, height);
  });

  const updaters = [
    (delta) => controls.update(delta),
    (delta) => miniWorld.update(delta),
    (delta) => particles.update(delta),
  ];

  createOctopus({ url: OCTOPUS_URL }).then((octopus) => {
    if (!octopus.ok) {
      console.error("[Octopus] load failed:", octopus.error);
      return;
    }

    scene.add(octopus.root);
    updaters.push((delta) => octopus.update(delta));
  });

  startRenderLoop({
    renderer,
    composer: postFx.composer,
    updaters,
  });

  return { renderer, scene, camera };
};
