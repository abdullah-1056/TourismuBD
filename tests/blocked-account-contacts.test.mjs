import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/105_blocked_account_contacts.sql", import.meta.url), "utf8");
const adminApp = readFileSync(new URL("../src/AdminApp.jsx", import.meta.url), "utf8");

test("blocked email and phone contacts are privately captured for each account module", () => {
  assert.match(migration, /create table if not exists private\.blocked_signup_contacts/);
  assert.match(migration, /track_blocked_profile_contacts/);
  assert.match(migration, /track_blocked_provider_contacts/);
  assert.match(migration, /track_blocked_business_contacts/);
  assert.match(migration, /revoke all on private\.blocked_signup_contacts from public, anon, authenticated/);
  assert.match(migration, /contact_kind = 'email'/);
  assert.match(migration, /contact_kind = 'phone'/);
});

test("signup rejects either contact value from an active block and account restoration releases it", () => {
  assert.match(migration, /private\.is_blocked_signup_contact\(new\.email, signup_phone\)/);
  assert.match(migration, /blocked\.is_active and \([\s\S]*contact_kind = 'email'[\s\S]*or[\s\S]*contact_kind = 'phone'/);
  assert.match(migration, /set is_active = false, restored_at = now\(\)/);
  assert.match(migration, /This account cannot be created with the supplied contact details/);
});

test("Blocked accounts page is available to Super Admin and account-module admins", () => {
  assert.match(adminApp, /nextSection === "blocked-accounts"[\s\S]*users_admin", "provider_admin", "business_admin/);
  assert.match(adminApp, /access\?\.role === "provider_admin" \? \["providers"\]/);
  assert.match(adminApp, /access\?\.role === "business_admin" \? \["businesses"\]/);
  assert.match(adminApp, /_blocked_table: table/);
  assert.match(adminApp, /resource\.id === "blocked-accounts" \? row\._blocked_table : resource\.table/);
});
