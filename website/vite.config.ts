import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Standalone marketing site. Talks to the desk app only via VITE_API_BASE. */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
