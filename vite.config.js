import { resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

      server.middlewares.use("/__tourismubd-media-sync", async (request, response) => {
        response.setHeader("Content-Type", "application/json");
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Access-Control-Allow-Origin", "*");
        if (request.method === "OPTIONS") {
          response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          response.setHeader("Access-Control-Allow-Headers", "Content-Type");
          response.statusCode = 204;
          return response.end();
        }
        const mediaFilePath = resolve(import.meta.dirname, "public/data/custom-media.json");
        if (request.method === "GET") {
          let content = { places: {}, galleries: {}, banners: {}, water: {} };
          try {
            if (existsSync(mediaFilePath)) content = JSON.parse(readFileSync(mediaFilePath, "utf8"));
          } catch {}
          return response.end(JSON.stringify({ data: content }));
        }
        if (request.method === "POST") {
          const chunks = [];
          for await (const chunk of request) chunks.push(chunk);
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            let current = { places: {}, galleries: {}, banners: {}, water: {} };
            if (existsSync(mediaFilePath)) {
              try { current = JSON.parse(readFileSync(mediaFilePath, "utf8")); } catch {}
            }
            if (payload.type && payload.key && payload.value !== undefined) {
              if (!current[payload.type]) current[payload.type] = {};
              current[payload.type][payload.key] = payload.value;
            } else if (payload.customMedia) {
              current = { ...current, ...payload.customMedia };
            }
            mkdirSync(resolve(import.meta.dirname, "public/data"), { recursive: true });
            writeFileSync(mediaFilePath, JSON.stringify(current, null, 2), "utf8");
            return response.end(JSON.stringify({ data: { success: true, media: current } }));
          } catch (err) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: err.message || "Failed to save media." }));
          }
        }
        response.statusCode = 405;
        response.end(JSON.stringify({ error: "Method not allowed." }));
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
