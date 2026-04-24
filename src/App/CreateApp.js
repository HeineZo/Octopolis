import { createRenderer, attachRendererResize } from "@core/CreateRenderer";
import { createCamera } from "@core/CreateCamera";
import { createControls } from "@core/CreateControls";
import { createScene } from "@core/CreateScene";
import { setupEnvironment } from "@world/SetupEnvironment";
import { setupLights } from "@world/SetupLights";
import { createMiniWorld } from "@world/CreateMiniWorld";
import { createParticles } from "@world/CreateParticles";
import { createOctopus } from "@world/CreateOctopus";
import { createFishes } from "@world/CreateFishes";
import { createWaterSurface } from "@world/CreateWaterSurface";
import { createPostFx } from "@postfx/CreatePostFx";
import { startRenderLoop } from "@loop/StartRenderLoop";
import { createLoopingMusic } from "@audio/CreateLoopingMusic";
import { createCameraMoveSfx } from "@audio/CreateCameraMoveSfx";

const OCTOPUS_URL = "/models/Octopolis.glb";
const FISH_URLS = [
  "/models/clown_fish.glb",
  "/models/fish1.glb",
  "/models/fish2.glb",
  "/models/fish3_metalrough.glb",
  "/models/fish4.glb",
];

/**
 * Orchestre tous les modules de la scène sous-marine.
 */
export const createApp = () => {
  createLoopingMusic({
    src: "/audio/Le Grand Bleu.mp3",
    volume: 0.6,
    backgroundSrc: "/audio/background_audio.mp3",
    backgroundVolume: 0.22,
    title: "Activer la musique",
  }).start();

  const renderer = createRenderer();
  const scene = createScene();
  const camera = createCamera();
  const controls = createControls(camera, renderer.domElement);

  const cameraMoveSfx = createCameraMoveSfx({
    controls,
    src: encodeURI("/audio/Underwater - Sound effect.mp3"),
    volume: 0.4,
    fadeInMs: 220,
    fadeOutMs: 700,
    maxDurationMs: 2000,
  });

  setupEnvironment(renderer, scene);
  setupLights(scene);

  const miniWorld = createMiniWorld();
  scene.add(miniWorld.group);

  const particles = createParticles();
  scene.add(particles.points);

  const waterSurface = createWaterSurface();
  scene.add(waterSurface.mesh);

  const postFx = createPostFx(renderer, scene, camera);

  attachRendererResize(renderer, camera, (width, height) => {
    postFx.setSize(width, height);
  });

  const updaters = [
    (delta) => controls.update(delta),
    () => cameraMoveSfx.update(),
    (delta) => miniWorld.update(delta),
    (delta) => particles.update(delta),
    (delta) => waterSurface.update(delta),
  ];

  createOctopus({ url: OCTOPUS_URL }).then((octopus) => {
    if (!octopus.ok) {
      console.error("[Octopus] load failed:", octopus.error);
      return;
    }

    scene.add(octopus.root);
    updaters.push((delta) => octopus.update(delta));
  });

  createFishes({ urls: FISH_URLS }).then((fishes) => {
    if (!fishes.ok) {
      console.error("[Fishes] load failed:", fishes.error);
      return;
    }

    scene.add(fishes.group);
    updaters.push((delta) => fishes.update(delta));
  });

  startRenderLoop({
    renderer,
    composer: postFx.composer,
    updaters,
  });

  return { renderer, scene, camera };
};
