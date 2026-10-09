import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const adminSessionStorage = {
  getItem: (key) => {
    try {
      return typeof window !== "undefined" ? window.sessionStorage?.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== "undefined") window.sessionStorage?.setItem(key, value);
    } catch { /* Storage might be disabled. */ }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== "undefined") window.sessionStorage?.removeItem(key);
    } catch { /* Storage might be disabled. */ }
  },
};

// Keep each Admin tab signed in across refreshes without sharing identities across tabs.
// Reopening the panel in a new tab requires signing in again (persistSession: false outside current tab).
// Headless test defaults: persistSession: false, autoRefreshToken: false.
const isBrowser = typeof window !== "undefined";
export const supabase = url && anonKey
  ? createClient(url, anonKey, { auth: { storage: adminSessionStorage, persistSession: isBrowser, detectSessionInUrl: true, autoRefreshToken: isBrowser, storageKey: "tourismubd-admin-auth" } })
  : null;
