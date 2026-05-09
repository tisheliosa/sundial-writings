import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// For a user/organization GitHub Pages site (elisaho.github.io),
// assets must be served from the root path.
export default defineConfig({
  plugins: [react()],
  base: "/",
});
