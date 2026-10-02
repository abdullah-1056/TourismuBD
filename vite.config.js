import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function localDevHealthPlugin() {
  return {
    name: "tourismubd-local-dev-health",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__tourismubd-health", (_request, response) => {
        response.setHeader("Content-Type", "text/plain");
        response.setHeader("Cache-Control", "no-store");
        response.end("TourismuBD");
      });
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react(), localDevHealthPlugin()],
  server: {
    host: "127.0.0.1",
    port: 5175,
    strictPort: true,
  },
});
