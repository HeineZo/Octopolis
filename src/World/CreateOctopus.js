import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SCENE_CONFIG } from "@config/SceneConfig";

/**
 * Contrat renvoyé par {@link createOctopus}.
 * - `root` est toujours présent: soit le modèle chargé, soit un `Group` vide en cas d'échec.
 * - `update(delta)` est toujours sûr à appeler (no-op si pas d'animations).
 */
const buildResult = ({ ok, root, mixer, actionsByName, error }) => ({
  ok,
  root,
  mixer,
  actionsByName,
  error,
  update: (delta) => {
    if (mixer) mixer.update(delta * SCENE_CONFIG.octopus.animation.speed);
  },
});

const prepareOctopusMesh = (root) => {
  root.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

const moveOctopusAboveMiniWorld = (root) => {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);

  const halfHeight = size.y * 0.5;
  const minY =
    SCENE_CONFIG.miniWorld.radius +
    halfHeight +
    SCENE_CONFIG.octopus.spawn.clearance;

  if (root.position.y < minY) root.position.y = minY;
};

/**
 * Charge un GLB et prépare son {@link THREE.AnimationMixer} en jouant
 * automatiquement la première animation trouvée (si dispo).
 *
 * Renvoie un résultat "Result-like" pour éviter d'injecter des exceptions
 * dans la boucle de rendu côté caller.
 */
export const createOctopus = async ({ url }) => {
  const loader = new GLTFLoader();

  try {
    const gltf = await loader.loadAsync(url);

    const root = gltf.scene;
    root.name = "octopus";
    root.position.copy(SCENE_CONFIG.octopus.spawn.position);
    prepareOctopusMesh(root);
    moveOctopusAboveMiniWorld(root);

    const clips = gltf.animations ?? [];

    if (clips.length === 0) {
      return buildResult({
        ok: true,
        root,
        mixer: undefined,
        actionsByName: {},
        error: undefined,
      });
    }

    const mixer = new THREE.AnimationMixer(root);

    const actionsByName = {};
    for (const clip of clips) {
      actionsByName[clip.name] = mixer.clipAction(clip);
    }

    const firstClip = clips[0];
    // Loop infinie boomerang
    const firstAction = actionsByName[firstClip.name];
    firstAction.setLoop(THREE.LoopPingPong, Infinity);
    firstAction.clampWhenFinished = false;
    firstAction.reset().play();

    return buildResult({
      ok: true,
      root,
      mixer,
      actionsByName,
      error: undefined,
    });
  } catch (error) {
    const fallback = new THREE.Group();
    fallback.name = "octopus-fallback";

    return buildResult({
      ok: false,
      root: fallback,
      mixer: undefined,
      actionsByName: {},
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};
