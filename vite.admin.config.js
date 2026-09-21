import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const ADMIN_TABLES = new Set([
  "profiles", "providers", "provider_verifications", "provider_subscriptions",
  "businesses", "business_products",
  "guide_profiles", "houseboat_listings", "small_boat_listings", "bookings",
  "saved_trips", "reviews", "reports", "admin_actions",
]);
const FILTER_COLUMNS = new Set(["id", "provider_id", "user_id", "type", "role"]);
const PUBLIC_PROFILE_SOURCE_FIELDS = "id,full_name,role,avatar_url,profile_photo_urls,bio,district,email,phone,blood_group,gender,working_place,hobby,present_address,permanent_address,followers_visible";

function localAdminDataPlugin(env) {
  const url = env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const admin = url && serviceKey ? { url: url.replace(/\/$/, ""), serviceKey } : null;
  return {
    name: "tourismubd-local-admin-data",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const parsed = new URL(request.url || "/", "http://127.0.0.1:5176");
        const profilePreview = parsed.pathname === "/__tourismubd-admin/profile";
        if (!profilePreview && parsed.pathname !== "/__tourismubd-admin/data") return next();
        response.setHeader("Content-Type", "application/json");
        response.setHeader("Cache-Control", "no-store");
        const origin = request.headers.origin;
        const allowedOrigins = profilePreview
          ? ["http://127.0.0.1:5175", "http://localhost:5175", "http://127.0.0.1:5176", "http://localhost:5176"]
          : ["http://127.0.0.1:5176", "http://localhost:5176"];
        if (origin && !allowedOrigins.includes(origin)) {
          response.statusCode = 403;
          return response.end(JSON.stringify({ error: "Local Admin requests must come from the Admin origin." }));
        }
        if (profilePreview && origin) response.setHeader("Access-Control-Allow-Origin", origin);
        if (!admin) {
          response.statusCode = 503;
          return response.end(JSON.stringify({ error: "Add SUPABASE_SERVICE_ROLE_KEY to .env, then restart the Admin server to load protected provider accounts." }));
        }
        if (profilePreview) {
          const id = parsed.searchParams.get("id") || "";
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "A valid profile ID is required." }));
          }
          const query = new URLSearchParams({ select: PUBLIC_PROFILE_SOURCE_FIELDS, id: `eq.${id}`, limit: "1" });
          try {
            const upstream = await fetch(`${admin.url}/rest/v1/profiles?${query}`, {
              headers: { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}` },
            });
            const result = await upstream.json().catch(() => null);
            if (!upstream.ok) {
              response.statusCode = upstream.status;
              return response.end(JSON.stringify({ error: result?.message || result?.error || "Supabase rejected the Admin profile request." }));
            }
            const profile = Array.isArray(result) ? result[0] || null : null;
            return response.end(JSON.stringify({ data: profile ? { ...profile, follower_count: 0, rating_average: null, rating_count: 0 } : null }));
          } catch (error) {
            response.statusCode = 502;
            return response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Could not reach Supabase." }));
          }
        }
        const table = parsed.searchParams.get("table") || "";
        if (!ADMIN_TABLES.has(table)) {
          response.statusCode = 400;
          return response.end(JSON.stringify({ error: "This Admin resource is not available through local development access." }));
        }
        const limit = Math.min(Math.max(Number(parsed.searchParams.get("limit")) || 100, 1), 1000);
        const filter = parsed.searchParams.get("filter");
        const value = parsed.searchParams.get("value");
        const ids = (parsed.searchParams.get("ids") || "").split(",").filter(Boolean).slice(0, 500);
        const query = new URLSearchParams({ select: "*", limit: String(limit) });
        if (filter && value && FILTER_COLUMNS.has(filter)) query.set(filter, `eq.${value}`);
        if (ids.length) query.set("id", `in.(${ids.join(",")})`);
        try {
          const method = request.method || "GET";
          const headers = { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}` };
          let body;
          if (["PATCH", "DELETE"].includes(method)) {
            if (!["businesses", "business_products"].includes(table)) {
              response.statusCode = 405;
              return response.end(JSON.stringify({ error: "Local edits are only available for Business records." }));
            }
            const key = parsed.searchParams.get("key") || "id";
            const recordId = parsed.searchParams.get("recordId") || "";
            if (key !== "id" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(recordId)) {
              response.statusCode = 400;
              return response.end(JSON.stringify({ error: "A valid Admin record key is required." }));
            }
            query.delete("limit");
            query.set(key, `eq.${recordId}`);
            headers.Prefer = "return=representation";
            if (method === "PATCH") {
              const chunks = [];
              for await (const chunk of request) chunks.push(chunk);
              try {
                const patch = JSON.parse(Buffer.concat(chunks).toString("utf8"));
                const allowed = table === "businesses"
                  ? new Set(["business_name", "description", "district", "contact_email", "contact_phone", "account_status", "public_status"])
                  : new Set(["name", "description", "price_bdt", "stock_quantity", "image_url", "status"]);
                if (!patch || Array.isArray(patch) || typeof patch !== "object" || Object.keys(patch).some((field) => !allowed.has(field))) throw new Error("Invalid Admin fields");
                body = JSON.stringify(patch);
              }
              catch {
                response.statusCode = 400;
                return response.end(JSON.stringify({ error: "The Admin update payload must be valid JSON." }));
              }
              headers["Content-Type"] = "application/json";
            }
          } else if (method !== "GET") {
            response.statusCode = 405;
            return response.end(JSON.stringify({ error: "This Admin request method is not supported." }));
          }
          const upstream = await fetch(`${admin.url}/rest/v1/${table}?${query}`, { method, headers, body });
          const result = await upstream.json().catch(() => null);
          if (!upstream.ok) {
            response.statusCode = upstream.status;
            return response.end(JSON.stringify({ error: result?.message || result?.error || "Supabase rejected the Admin data request." }));
          }
          response.end(JSON.stringify({ data: Array.isArray(result) ? result : [] }));
        } catch (error) {
          response.statusCode = 502;
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Could not reach Supabase." }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "");
  return {
    root: "admin",
    envDir: resolve(import.meta.dirname),
    plugins: [react(), localAdminDataPlugin(env)],
    server: { host: "127.0.0.1", port: 5176, strictPort: true, fs: { allow: [resolve(import.meta.dirname)] } },
    build: {
      outDir: "../dist-admin",
      emptyOutDir: true,
      rollupOptions: { input: resolve(import.meta.dirname, "admin/index.html") },
    },
  };
});
