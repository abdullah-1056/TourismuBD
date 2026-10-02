import { loadEnv } from "vite";

const env = loadEnv("development", process.cwd(), "");
const email = String(process.argv[2] || env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
const url = String(env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Usage: npm run recover:super-admin -- admin@example.com");
if (!url || !serviceRoleKey) throw new Error("Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.");

const headers = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" };
const usersResponse = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`, { headers });
const usersPayload = await usersResponse.json().catch(() => null);
if (!usersResponse.ok) throw new Error(usersPayload?.message || "Could not check the private Super Admin identity.");
if (!usersPayload?.users?.some((user) => user.email?.toLowerCase() === email)) throw new Error(`No Authentication account exists for ${email}. Run the Super Admin bootstrap first.`);

const redirectTo = (() => {
  const target = new URL(env.ADMIN_INVITE_REDIRECT_URL || "http://127.0.0.1:5176/");
  target.searchParams.delete("admin-invite");
  target.searchParams.set("admin-recovery", "1");
  return target.toString();
})();
const linkResponse = await fetch(`${url}/auth/v1/admin/generate_link`, {
  method: "POST",
  headers,
  body: JSON.stringify({ type: "recovery", email, redirect_to: redirectTo }),
});
const linkPayload = await linkResponse.json().catch(() => null);
if (!linkResponse.ok) throw new Error(linkPayload?.message || "Could not create the one-time Super Admin recovery link.");
const recoveryLink = linkPayload?.action_link || linkPayload?.properties?.action_link;
if (!recoveryLink) throw new Error("Supabase did not return a recovery link.");
console.log(`One-time Super Admin password-recovery link for ${email}:\n${recoveryLink}`);
