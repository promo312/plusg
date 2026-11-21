import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

// base "./" keeps asset URLs relative so the static build works from any
// path, including a GitHub Pages project site (https://user.github.io/plusg/).
export default defineConfig({
  root,
  base: "./",
  plugins: [react()],
  build: { outDir: "../dist", emptyOutDir: true },
});
