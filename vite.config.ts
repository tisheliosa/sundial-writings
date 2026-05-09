import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Project-site GitHub Pages: served at https://elisaho.github.io/sundial-writings/
// so the asset base must match the repo subpath.
export default defineConfig({
  plugins: [react()],
  base: "/sundial-writings/",
});
