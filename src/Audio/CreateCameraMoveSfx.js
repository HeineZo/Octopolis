/**
 * @typedef {Object} CameraMoveSfxOptions
 * @property {import("three/examples/jsm/controls/OrbitControls.js").OrbitControls} controls
 * @property {string} src
 * @property {number} volume
 * @property {number} fadeInMs
 * @property {number} fadeOutMs
 * @property {number} maxDurationMs
 */

/**
 * SFX de mouvement caméra
 * @param {CameraMoveSfxOptions} options
 */
export const createCameraMoveSfx = (options) => {
  const { controls, src, volume, fadeInMs, fadeOutMs, maxDurationMs } = options;

  if (!controls || typeof controls.addEventListener !== "function") {
    console.warn(
      "[CameraMoveSfx] missing `controls` (OrbitControls). Did you pass `{ controls }`?",
    );
    return {
      audio: new Audio(src ?? ""),
      update: () => {},
      dispose: () => {},
    };
  }

  const audio = new Audio(src);
  audio.preload = "auto";
  audio.loop = false;
  audio.volume = 0;

  /** @type {number | null} */
  let fadeIntervalId = null;
  /** @type {number | null} */
  let startTimeoutId = null;
  /** @type {number | null} */
  let stopTimeoutId = null;

  /** @type {boolean} */
  let isPlaying = false;

  const clearTimers = () => {
    if (fadeIntervalId !== null) {
      window.clearInterval(fadeIntervalId);
      fadeIntervalId = null;
    }
    if (startTimeoutId !== null) {
      window.clearTimeout(startTimeoutId);
      startTimeoutId = null;
    }
    if (stopTimeoutId !== null) {
      window.clearTimeout(stopTimeoutId);
      stopTimeoutId = null;
    }
  };

  const hardStop = () => {
    clearTimers();
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0;
    isPlaying = false;
  };

  /**
   * @param {number} from
   * @param {number} to
   * @param {number} durationMs
   * @param {() => void} [onDone]
   */
  const fadeVolume = (from, to, durationMs, onDone) => {
    if (durationMs <= 0) {
      audio.volume = to;
      onDone?.();
      return;
    }

    if (fadeIntervalId !== null) {
      window.clearInterval(fadeIntervalId);
      fadeIntervalId = null;
    }

    const startMs = performance.now();
    audio.volume = from;

    fadeIntervalId = window.setInterval(() => {
      const nowMs = performance.now();
      const t = Math.min(1, (nowMs - startMs) / durationMs);
      audio.volume = from + (to - from) * t;

      if (t >= 1) {
        if (fadeIntervalId !== null) {
          window.clearInterval(fadeIntervalId);
          fadeIntervalId = null;
        }
        onDone?.();
      }
    }, 16);
  };

  const scheduleHardCap = () => {
    const clampedMaxDurationMs = Math.max(0, maxDurationMs);
    const clampedFadeOutMs = Math.max(0, fadeOutMs);

    const fadeOutStartMs = Math.max(0, clampedMaxDurationMs - clampedFadeOutMs);

    startTimeoutId = window.setTimeout(() => {
      fadeVolume(audio.volume, 0, clampedFadeOutMs);
    }, fadeOutStartMs);

    stopTimeoutId = window.setTimeout(() => {
      hardStop();
    }, clampedMaxDurationMs);
  };

  const playFromStart = async () => {
    hardStop();

    isPlaying = true;
    audio.currentTime = 0;
    audio.volume = 0;

    try {
      await audio.play();
    } catch (error) {
      isPlaying = false;
      console.warn("[CameraMoveSfx] play blocked:", error);
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }

    fadeVolume(0, volume, Math.max(0, fadeInMs));
    scheduleHardCap();
    return { ok: true, value: undefined };
  };

  const fadeOutAndStop = () => {
    if (!isPlaying) return;

    clearTimers();
    fadeVolume(audio.volume, 0, Math.max(0, fadeOutMs), () => {
      hardStop();
    });
  };

  const onStart = () => {
    void playFromStart();
  };

  const onEnd = () => {
    fadeOutAndStop();
  };

  controls.addEventListener("start", onStart);
  controls.addEventListener("end", onEnd);

  return {
    audio,
    update: () => {},
    dispose: () => {
      hardStop();
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
    },
  };
};
