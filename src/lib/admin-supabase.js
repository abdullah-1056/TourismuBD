import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const adminSessionStorage = {
  getItem: (key) => window.sessionStorage.getItem(key),
  setItem: (key, value) => window.sessionStorage.setItem(key, value),
  removeItem: (key) => window.sessionStorage.removeItem(key),
};

// Keep each Admin tab signed in across refreshes without sharing identities across tabs.
export const supabase = url && anonKey
  ? createClient(url, anonKey, { auth: { storage: adminSessionStorage, persistSession: true, detectSessionInUrl: true, autoRefreshToken: true, storageKey: "tourismubd-admin-auth" } })
  : null;
