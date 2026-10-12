import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const ADMIN_TABLES = new Set([
  "profiles", "providers", "provider_verifications", "provider_subscriptions", "places", "place_relationships", "water_bodies",
  "businesses", "business_products", "admin_accounts",
  "guide_profiles", "houseboat_listings", "small_boat_listings", "bookings",
  "saved_trips", "reviews", "reports", "social_posts", "admin_actions",
]);
const ADMIN_MUTABLE_TABLES = new Set([
  "profiles", "providers", "businesses", "business_products", "places",
  "place_relationships", "water_bodies", "provider_subscriptions", "saved_trips",
  "bookings", "reviews", "reports", "social_posts",
]);
const ADMIN_EDITABLE_FIELDS = {
  profiles: new Set(["full_name", "email", "phone", "bio", "blood_group", "gender", "district", "working_place", "hobby", "present_address", "permanent_address", "avatar_url", "profile_photo_urls", "status", "is_blocked"]),
  providers: new Set(["display_name", "service_name", "bio", "photo_url", "contact_email", "contact_phone", "account_status", "public_status", "is_blocked"]),
  businesses: new Set(["business_name", "description", "district", "contact_email", "contact_phone", "account_status", "public_status", "is_blocked"]),
  business_products: new Set(["name", "description", "price_bdt", "stock_quantity", "image_url", "status"]),
  places: new Set(["district_id", "name", "slug", "upazila_or_area", "category", "latitude", "longitude", "short_description", "best_time", "how_to_reach", "practical_tips", "image_url", "status"]),
  place_relationships: new Set(["relationship_type", "travel_minutes"]),
  water_bodies: new Set(["name", "type", "is_sundarbans", "status"]),
  provider_subscriptions: new Set(["status", "current_period_start", "current_period_end", "grace_until", "last_payment_at", "admin_note"]),
  bookings: new Set(["status", "cancelled_by", "cancelled_at", "cancellation_reason"]),
  saved_trips: new Set(["name"]),
  reviews: new Set(["status"]),
  reports: new Set(["status", "admin_note", "resolved_by", "resolved_at", "social_post_id"]),
  social_posts: new Set(["is_hidden"]),
};
const FILTER_COLUMNS = new Set(["id", "provider_id", "user_id", "type", "role", "status"]);
const PUBLIC_PROFILE_SOURCE_FIELDS = "id,full_name,role,avatar_url,profile_photo_urls,bio,district,email,phone,blood_group,gender,working_place,hobby,present_address,permanent_address,followers_visible";

function localAdminDataPlugin(env) {
  const url = env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const admin = url && serviceKey ? { url: url.replace(/\/$/, ""), serviceKey } : null;
  const adminInviteRedirectUrl = () => {
    if (!env.ADMIN_INVITE_REDIRECT_URL) return undefined;
    try {
      const target = new URL(env.ADMIN_INVITE_REDIRECT_URL);
      target.searchParams.set("admin-invite", "1");
      return target.toString();
    } catch { return undefined; }
  };
  return {
    name: "tourismubd-local-admin-data",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const parsed = new URL(request.url || "/", "http://127.0.0.1:5176");
        if (parsed.pathname === "/__tourismubd-health") {
          response.setHeader("Content-Type", "text/plain");
          response.setHeader("Cache-Control", "no-store");
          return response.end("TourismuBD Admin");
        }
        const profilePreview = parsed.pathname === "/__tourismubd-admin/profile";
        const postMediaPreview = parsed.pathname === "/__tourismubd-admin/post-media";
        const adminRpc = parsed.pathname === "/__tourismubd-admin/rpc";
        const recoveryEmailCheck = parsed.pathname === "/__tourismubd-admin/recovery-email";
        if (!profilePreview && !postMediaPreview && !adminRpc && !recoveryEmailCheck && parsed.pathname !== "/__tourismubd-admin/data") return next();
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
        if (recoveryEmailCheck) {
          if (request.method !== "POST") {
            response.statusCode = 405;
            return response.end(JSON.stringify({ error: "This recovery request method is not supported." }));
          }
          const chunks = [];
          for await (const chunk of request) chunks.push(chunk);
          let email = "";
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
          } catch { /* The invalid-email response below is intentional. */ }
          if (!/^\S+@\S+\.\S+$/.test(email)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "Enter the active Super Admin email." }));
          }
          try {
            const query = new URLSearchParams({ select: "id", email: `ilike.${email}`, role: "eq.SUPER_ADMIN", status: "eq.ACTIVE", limit: "1" });
            const upstream = await fetch(`${admin.url}/rest/v1/profiles?${query}`, { headers: { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}` } });
            const result = await upstream.json().catch(() => null);
            if (!upstream.ok) {
              response.statusCode = upstream.status;
              return response.end(JSON.stringify({ error: result?.message || result?.error || "Supabase rejected the Super Admin lookup." }));
            }
            if (!Array.isArray(result) || !result.length) {
              response.statusCode = 400;
              return response.end(JSON.stringify({ error: "Enter the active Super Admin email." }));
            }
            return response.end(JSON.stringify({ data: { valid: true } }));
          } catch (error) {
            response.statusCode = 502;
            return response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Could not reach Supabase." }));
          }
        }
        if (adminRpc) {
          if (request.method !== "POST") {
            response.statusCode = 405;
            return response.end(JSON.stringify({ error: "This Admin request method is not supported." }));
          }
          const functionName = parsed.searchParams.get("function") || "";
          if (!["assign_secondary_admin", "remove_secondary_admin", "invite_secondary_admin"].includes(functionName)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "This Admin action is not available through local development access." }));
          }
          if (env.VITE_ADMIN_AUTH_BYPASS !== "true") {
            const authorization = request.headers.authorization;
            if (!authorization?.startsWith("Bearer ")) {
              response.statusCode = 401;
              return response.end(JSON.stringify({ error: "Sign in as the active Super Admin first." }));
            }
            const authUser = await fetch(`${admin.url}/auth/v1/user`, {
              headers: {
                apikey: env.VITE_SUPABASE_ANON_KEY || admin.serviceKey,
                Authorization: authorization,
              },
            });
            const user = await authUser.json().catch(() => null);
            if (!authUser.ok || !user?.id) {
              response.statusCode = 401;
              return response.end(JSON.stringify({ error: "Your Admin sign-in has expired. Sign in again." }));
            }
            const superAdminQuery = new URLSearchParams({ select: "id", id: `eq.${user.id}`, role: "eq.SUPER_ADMIN", status: "eq.ACTIVE", limit: "1" });
            const superAdmin = await fetch(`${admin.url}/rest/v1/profiles?${superAdminQuery}`, {
              headers: { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}` },
            });
            const superAdminRows = await superAdmin.json().catch(() => null);
            if (!superAdmin.ok || !Array.isArray(superAdminRows) || !superAdminRows.length) {
              response.statusCode = 403;
              return response.end(JSON.stringify({ error: "Only the active Super Admin can create Secondary Admin accounts." }));
            }
          }
          const chunks = [];
          for await (const chunk of request) chunks.push(chunk);
          let payload;
          try {
            payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            if (!payload || Array.isArray(payload) || typeof payload !== "object") throw new Error("Invalid payload");
          } catch {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "The Admin action payload must be valid JSON." }));
          }
          try {
            const callRpc = async (rpcName, args) => fetch(`${admin.url}/rest/v1/rpc/${rpcName}`, {
              method: "POST",
              headers: { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}`, "Content-Type": "application/json" },
              body: JSON.stringify(args),
            });
            if (functionName === "invite_secondary_admin") {
              const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
              const password = typeof payload.password === "string" ? payload.password : "";
              const role = typeof payload.role === "string" ? payload.role : "";
              if (!/^\S+@\S+\.\S+$/.test(email) || !["users_admin", "business_admin", "provider_admin", "subscription_admin", "booking_admin"].includes(role)) {
                response.statusCode = 400;
                return response.end(JSON.stringify({ error: "Provide a valid email and Admin role." }));
              }
              if (password && password.length < 12) {
                response.statusCode = 400;
                return response.end(JSON.stringify({ error: "Use a temporary password with at least 12 characters." }));
              }
              let hadPendingReservation = false;
              let existingAdminOnlyUser = null;
              if (password) {
                const profileQuery = new URLSearchParams({ select: "id,is_admin_only", email: `ilike.${email}`, limit: "1" });
                const profileCheck = await fetch(`${admin.url}/rest/v1/profiles?${profileQuery}`, {
                  headers: { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}` },
                });
                const profiles = await profileCheck.json().catch(() => null);
                if (!profileCheck.ok) {
                  response.statusCode = profileCheck.status;
                  return response.end(JSON.stringify({ error: profiles?.message || profiles?.error || "Supabase rejected the Admin email lookup." }));
                }
                const accountQuery = new URLSearchParams({ select: "id,user_id", email: `ilike.${email}`, limit: "1" });
                const accountCheck = await fetch(`${admin.url}/rest/v1/admin_accounts?${accountQuery}`, {
                  headers: { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}` },
                });
                const existingAccounts = await accountCheck.json().catch(() => null);
                if (!accountCheck.ok) {
                  response.statusCode = accountCheck.status;
                  return response.end(JSON.stringify({ error: existingAccounts?.message || existingAccounts?.error || "Supabase rejected the Admin account lookup." }));
                }
                hadPendingReservation = Array.isArray(existingAccounts) && existingAccounts.length > 0;
                if (Array.isArray(profiles) && profiles.length) {
                  if (!hadPendingReservation || !profiles[0].is_admin_only) {
                    response.statusCode = 409;
                    return response.end(JSON.stringify({ error: "This email belongs to a public TourismuBD account. Its password cannot be changed from Admin Management." }));
                  }
                  existingAdminOnlyUser = profiles[0];
                }
              }
              const assignment = await callRpc("assign_secondary_admin", { admin_email: email, admin_role: role, active: payload.active !== false });
              const assignmentResult = await assignment.json().catch(() => null);
              if (!assignment.ok) {
                response.statusCode = assignment.status;
                return response.end(JSON.stringify({ error: assignmentResult?.message || assignmentResult?.error || "Supabase rejected the Admin permission." }));
              }
              const inviteUrl = new URL(`${admin.url}/auth/v1/invite`);
              const markInvitationSent = () => callRpc("mark_secondary_admin_invitation_sent", {
                admin_account_id: assignmentResult,
              }).catch(() => null);
              if (password) {
                const credentialsUrl = existingAdminOnlyUser
                  ? `${admin.url}/auth/v1/admin/users/${encodeURIComponent(existingAdminOnlyUser.id)}`
                  : `${admin.url}/auth/v1/admin/users`;
                const created = await fetch(credentialsUrl, {
                  method: existingAdminOnlyUser ? "PUT" : "POST",
                  headers: { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}`, "Content-Type": "application/json" },
                  body: existingAdminOnlyUser
                    ? JSON.stringify({ password, email_confirm: true })
                    : JSON.stringify({ email, password, email_confirm: true, user_metadata: { admin_invitation: true } }),
                });
                const createdResult = await created.json().catch(() => null);
                if (!created.ok) {
                  if (!hadPendingReservation) await callRpc("remove_secondary_admin", { admin_account_id: assignmentResult }).catch(() => null);
                  const errorMessage = createdResult?.message || createdResult?.msg || createdResult?.error || "Could not create the Secondary Admin login.";
                  response.statusCode = /already (been )?(registered|exists)/i.test(errorMessage) ? 409 : created.status;
                  return response.end(JSON.stringify({ error: /already (been )?(registered|exists)/i.test(errorMessage) ? "This email already has a login. Use a different email for a new Secondary Admin login." : errorMessage }));
                }
                await markInvitationSent();
                return response.end(JSON.stringify({ data: { accountId: assignmentResult, credentials: "created" } }));
              }
              const inviteRedirectUrl = adminInviteRedirectUrl();
              if (inviteRedirectUrl) inviteUrl.searchParams.set("redirect_to", inviteRedirectUrl);
              const invite = await fetch(inviteUrl, {
                method: "POST",
                headers: { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ email, data: { admin_invitation: true } }),
              });
              const inviteText = await invite.text();
              let inviteResult = null;
              try { inviteResult = inviteText ? JSON.parse(inviteText) : null; } catch { /* Preserve a non-JSON Auth error below. */ }
              const invitationError = inviteResult?.message || inviteResult?.msg || inviteResult?.error || invite.statusText || inviteText.trim() || "Unknown error";
              if (!invite.ok && !/already (been )?(registered|exists)/i.test(invitationError)) {
                const generated = await fetch(`${admin.url}/auth/v1/admin/generate_link`, {
                  method: "POST",
                  headers: { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}`, "Content-Type": "application/json" },
                  body: JSON.stringify({ type: "invite", email, data: { admin_invitation: true }, ...(inviteRedirectUrl ? { redirect_to: inviteRedirectUrl } : {}) }),
                });
                const generatedResult = await generated.json().catch(() => null);
                const manualInviteUrl = generatedResult?.action_link || generatedResult?.properties?.action_link;
                if (generated.ok && manualInviteUrl) {
                  await markInvitationSent();
                  return response.end(JSON.stringify({ data: { accountId: assignmentResult, invitation: "manual", manualInviteUrl } }));
                }
                response.statusCode = invite.status;
                return response.end(JSON.stringify({ error: `Admin permission was saved, but the invitation email could not be sent: ${invitationError}` }));
              }
              if (invite.ok) await markInvitationSent();
              return response.end(JSON.stringify({ data: { accountId: assignmentResult, invitation: invite.ok ? "sent" : "existing" } }));
            }
            if (functionName === "remove_secondary_admin") {
              const adminAccountId = typeof payload.admin_account_id === "string" ? payload.admin_account_id : "";
              if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(adminAccountId)) {
                response.statusCode = 400;
                return response.end(JSON.stringify({ error: "A valid Secondary Admin account is required." }));
              }
              const accountQuery = new URLSearchParams({ select: "id,user_id", id: `eq.${adminAccountId}`, limit: "1" });
              const accountCheck = await fetch(`${admin.url}/rest/v1/admin_accounts?${accountQuery}`, {
                headers: { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}` },
              });
              const accounts = await accountCheck.json().catch(() => null);
              if (!accountCheck.ok) {
                response.statusCode = accountCheck.status;
                return response.end(JSON.stringify({ error: accounts?.message || accounts?.error || "Supabase rejected the Secondary Admin lookup." }));
              }
              const account = Array.isArray(accounts) ? accounts[0] : null;
              if (!account) {
                response.statusCode = 404;
                return response.end(JSON.stringify({ error: "Secondary Admin account not found." }));
              }
              if (account.user_id) {
                const profileQuery = new URLSearchParams({ select: "is_admin_only", id: `eq.${account.user_id}`, limit: "1" });
                const profileCheck = await fetch(`${admin.url}/rest/v1/profiles?${profileQuery}`, {
                  headers: { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}` },
                });
                const profiles = await profileCheck.json().catch(() => null);
                if (!profileCheck.ok) {
                  response.statusCode = profileCheck.status;
                  return response.end(JSON.stringify({ error: profiles?.message || profiles?.error || "Supabase rejected the Secondary Admin profile lookup." }));
                }
                if (Array.isArray(profiles) && profiles[0]?.is_admin_only) {
                  const deleted = await fetch(`${admin.url}/auth/v1/admin/users/${encodeURIComponent(account.user_id)}`, {
                    method: "DELETE",
                    headers: { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}` },
                  });
                  const deletedResult = await deleted.json().catch(() => null);
                  if (!deleted.ok) {
                    response.statusCode = deleted.status;
                    return response.end(JSON.stringify({ error: deletedResult?.message || deletedResult?.msg || deletedResult?.error || "Supabase could not delete the Secondary Admin login." }));
                  }
                  return response.end(JSON.stringify({ data: { deleted: "auth_identity" } }));
                }
              }
              const upstream = await callRpc("remove_secondary_admin", { admin_account_id: adminAccountId });
              const result = await upstream.json().catch(() => null);
              if (!upstream.ok) {
                response.statusCode = upstream.status;
                return response.end(JSON.stringify({ error: result?.message || result?.error || "Supabase rejected the Admin action." }));
              }
              return response.end(JSON.stringify({ data: { deleted: "admin_access" } }));
            }
            const upstream = await callRpc(functionName, payload);
            const result = await upstream.json().catch(() => null);
            if (!upstream.ok) {
              response.statusCode = upstream.status;
              return response.end(JSON.stringify({ error: result?.message || result?.error || "Supabase rejected the Admin action." }));
            }
            return response.end(JSON.stringify({ data: result }));
          } catch (error) {
            response.statusCode = 502;
            return response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Could not reach Supabase." }));
          }
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
        if (postMediaPreview) {
          const path = parsed.searchParams.get("path") || "";
          if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(path) || path.includes("..")) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "A valid timeline media path is required." }));
          }
          try {
            const objectPath = path.split("/").map(encodeURIComponent).join("/");
            const upstream = await fetch(`${admin.url}/storage/v1/object/sign/social-posts/${objectPath}`, {
              method: "POST",
              headers: { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({ expiresIn: 3600 }),
            });
            const result = await upstream.json().catch(() => null);
            if (!upstream.ok || !result?.signedURL) {
              response.statusCode = upstream.ok ? 502 : upstream.status;
              return response.end(JSON.stringify({ error: result?.message || result?.error || "Could not prepare the reported post media." }));
            }
            return response.end(JSON.stringify({ url: `${admin.url}/storage/v1${result.signedURL}` }));
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
        const query = new URLSearchParams({ select: table === "places" ? "*,districts(name,division,slug)" : "*", limit: String(limit) });
        if (table === "reports") query.set("order", "updated_at.desc");
        else if (table === "bookings") query.set("order", "created_at.desc");
        if (filter && value && FILTER_COLUMNS.has(filter)) query.set(filter, `eq.${value}`);
        if (ids.length) query.set("id", `in.(${ids.join(",")})`);
        try {
          const method = request.method || "GET";
          const headers = { apikey: admin.serviceKey, Authorization: `Bearer ${admin.serviceKey}` };
          let body;
          if (["PATCH", "POST", "DELETE"].includes(method)) {
            if (!ADMIN_MUTABLE_TABLES.has(table)) {
              response.statusCode = 405;
              return response.end(JSON.stringify({ error: "This Admin record cannot be changed through local development access." }));
            }
            const key = parsed.searchParams.get("key") || "id";
            const recordId = parsed.searchParams.get("recordId") || "";
            if (method !== "POST" && (key !== "id" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(recordId))) {
              response.statusCode = 400;
              return response.end(JSON.stringify({ error: "A valid Admin record key is required." }));
            }
            query.delete("limit");
            if (method !== "POST") query.set(key, `eq.${recordId}`);
            headers.Prefer = "return=representation";
            if (["PATCH", "POST"].includes(method)) {
              const chunks = [];
              for await (const chunk of request) chunks.push(chunk);
              try {
                const patch = JSON.parse(Buffer.concat(chunks).toString("utf8"));
                const allowed = ADMIN_EDITABLE_FIELDS[table] || new Set();
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
