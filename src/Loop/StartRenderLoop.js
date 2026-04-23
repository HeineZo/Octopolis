/**
 * Démarre la boucle d'animation: appelle chaque updater (delta en secondes)
 * puis rend via le composer (ou directement le renderer en fallback).
 */
export const startRenderLoop = ({ renderer, composer, updaters }) => {
  const clock = { last: performance.now() };

  const tick = (now) => {
    const delta = Math.min(0.1, (now - clock.last) / 1000);
    clock.last = now;

    for (const update of updaters) {
      update(delta, now);
    }

    if (composer) {
      composer.render(delta);
    }
  };

  renderer.setAnimationLoop(tick);
};
