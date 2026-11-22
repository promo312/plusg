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
  // assetsInlineLimit 0: the sample files must be real files fetched from our own origin.
  build: { outDir: "../dist", emptyOutDir: true, assetsInlineLimit: 0 },
  server: { fs: { allow: [".."] } },
});
