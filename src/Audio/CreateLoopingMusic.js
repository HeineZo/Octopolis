/**
 * Démarre une musique en boucle. Si l'autoplay est bloqué, affiche un petit
 * bouton "Activer le son" qui lance la lecture sur interaction utilisateur.
 */
export const createLoopingMusic = ({
  src,
  volume,
  title,
} = {}) => {
  const audio = new Audio(src);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = typeof volume === "number" ? volume : 0.4;

  /** @type {HTMLButtonElement | null} */
  let overlayButton = null;

  const removeOverlay = () => {
    if (!overlayButton) return;
    overlayButton.remove();
    overlayButton = null;
  };

  const ensureOverlay = () => {
    if (overlayButton) return overlayButton;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = title ?? "Activer le son";
    button.setAttribute("aria-label", title ?? "Activer le son");

    Object.assign(button.style, {
      position: "fixed",
      left: "16px",
      bottom: "16px",
      zIndex: "9999",
      padding: "10px 12px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,0.25)",
      background: "rgba(0,0,0,0.55)",
      color: "white",
      font: "600 14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      cursor: "pointer",
      backdropFilter: "blur(8px)",
    });

    button.addEventListener("click", async () => {
      try {
        await audio.play();
        removeOverlay();
      } catch (error) {
        console.warn("[Music] play still blocked:", error);
      }
    });

    document.body.appendChild(button);
    overlayButton = button;
    return button;
  };

  const start = async () => {
    try {
      await audio.play();
      removeOverlay();
      return { ok: true, value: undefined };
    } catch (error) {
      ensureOverlay();
      return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const stop = () => {
    audio.pause();
    audio.currentTime = 0;
    removeOverlay();
  };

  const setVolume = (nextVolume) => {
    audio.volume = nextVolume;
  };

  return {
    audio,
    start,
    stop,
    setVolume,
  };
};

