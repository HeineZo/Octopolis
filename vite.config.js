import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@app": fileURLToPath(new URL("./src/App", import.meta.url)),
      "@audio": fileURLToPath(new URL("./src/Audio", import.meta.url)),
      "@core": fileURLToPath(new URL("./src/Core", import.meta.url)),
      "@world": fileURLToPath(new URL("./src/World", import.meta.url)),
      "@postfx": fileURLToPath(new URL("./src/PostFx", import.meta.url)),
      "@loop": fileURLToPath(new URL("./src/Loop", import.meta.url)),
      "@config": fileURLToPath(new URL("./src/Config", import.meta.url)),
    },
  },
});
