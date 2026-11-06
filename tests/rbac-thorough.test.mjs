import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ADMIN_ROLES,
  ADMIN_ROLE_LABELS,
  canAccessAdminSection,
  hasAdminAccess,
  isSuperAdmin,
} from "../src/lib/admin.js";

// Load source files and migrations for static and structural verification
const adminApp = readFileSync(new URL("../src/AdminApp.jsx", import.meta.url), "utf8");
const adminLib = readFileSync(new URL("../src/lib/admin.js", import.meta.url), "utf8");
const migration085 = readFileSync(new URL("../supabase/migrations/085_secondary_admin_management.sql", import.meta.url), "utf8");
const migration110 = readFileSync(new URL("../supabase/migrations/110_booking_admin_business_read.sql", import.meta.url), "utf8");
const migration111 = readFileSync(new URL("../supabase/migrations/111_media_admin_role.sql", import.meta.url), "utf8");
const inviteFunction = readFileSync(new URL("../supabase/functions/invite-secondary-admin/index.ts", import.meta.url), "utf8");
const purgeFunction = readFileSync(new URL("../supabase/functions/purge-deactivated-accounts/index.ts", import.meta.url), "utf8");

const superAdmin = Object.freeze({ role: "super_admin", is_active: true });
const usersAdmin = Object.freeze({ role: "users_admin", is_active: true });
const providerAdmin = Object.freeze({ role: "provider_admin", is_active: true });
const businessAdmin = Object.freeze({ role: "business_admin", is_active: true });
const subscriptionAdmin = Object.freeze({ role: "subscription_admin", is_active: true });
const bookingAdmin = Object.freeze({ role: "booking_admin", is_active: true });
const mediaAdmin = Object.freeze({ role: "media_admin", is_active: true });

// -----------------------------------------------------------------------------
// 1. Super Admin Tests
// -----------------------------------------------------------------------------
test("1. Super Admin: Full administrative access across all sections and management features", () => {
  assert.equal(isSuperAdmin(superAdmin), true);
  assert.equal(hasAdminAccess(superAdmin), true);

  const allSections = [
    ["overview", undefined],
    ["profiles", { adminModule: "users" }],
    ["providers", { adminModule: "providers" }],
    ["businesses", { adminModule: "business" }],
    ["business-products", { adminModule: "business" }],
    ["subscriptions", { adminModule: "subscriptions" }],
    ["business-subscriptions", { adminModule: "subscriptions" }],
    ["bookings", { adminModule: "bookings" }],
    ["reports", { adminModule: "reports" }],
    ["blocked-accounts", undefined],
    ["admin-management", undefined],
    ["removed-accounts", { adminModule: "users" }],
    ["removed-providers", { adminModule: "providers" }],
    ["removed-businesses", { adminModule: "business" }],
    ["frozen-subscriptions", { adminModule: "subscriptions" }],
  ];

  for (const [section, resource] of allSections) {
    assert.equal(
      canAccessAdminSection(superAdmin, section, resource),
      true,
      `Super Admin must be authorized for section: ${section}`
    );
  }

  // Super Admin only UI controls
  assert.match(adminApp, /adminIsSuper \? <button className=\{section === "admin-management"/);
  assert.match(adminApp, /function AdminManagement/);
  assert.match(adminApp, /assign_secondary_admin/);
  assert.match(adminApp, /remove_secondary_admin/);

  // Backend policy grants full access
  assert.match(migration085, /create policy admin_accounts_super_admin_manage on public\.admin_accounts for all to authenticated\s+using \(public\.is_super_admin\(\)\) with check \(public\.is_super_admin\(\)\)/);
  assert.match(migration085, /create or replace function private\.require_super_admin_management\(\)/);
});

// -----------------------------------------------------------------------------
// 2. User Admin Tests
// -----------------------------------------------------------------------------
test("2. User Admin: Authorized user actions allowed; unauthorized modules rejected", () => {
  assert.equal(hasAdminAccess(usersAdmin), true);
  assert.equal(isSuperAdmin(usersAdmin), false);

  // Authorized sections
  assert.equal(canAccessAdminSection(usersAdmin, "overview"), true);
  assert.equal(canAccessAdminSection(usersAdmin, "profiles", { adminModule: "users" }), true);
  assert.equal(canAccessAdminSection(usersAdmin, "reports", { adminModule: "reports" }), true);
  assert.equal(canAccessAdminSection(usersAdmin, "blocked-accounts"), true);
  assert.equal(canAccessAdminSection(usersAdmin, "removed-accounts", { adminModule: "users" }), true);

  // Unauthorized sections
  const restrictedSections = [
    ["providers", { adminModule: "providers" }],
    ["businesses", { adminModule: "business" }],
    ["business-products", { adminModule: "business" }],
    ["subscriptions", { adminModule: "subscriptions" }],
    ["bookings", { adminModule: "bookings" }],
    ["admin-management", undefined],
    ["removed-providers", { adminModule: "providers" }],
    ["removed-businesses", { adminModule: "business" }],
    ["frozen-subscriptions", { adminModule: "subscriptions" }],
  ];
  for (const [section, resource] of restrictedSections) {
    assert.equal(
      canAccessAdminSection(usersAdmin, section, resource),
      false,
      `User Admin must be rejected from section: ${section}`
    );
  }

  // Backend RLS policies: Users Admin can select & update profiles, but not change role or Super Admin
  assert.match(migration085, /create policy profiles_users_admin_select on public\.profiles for select to authenticated\s+using \(public\.can_access_admin_module\('users'\)\)/);
  assert.match(migration085, /create policy profiles_users_admin_update on public\.profiles for update to authenticated\s+using \(public\.can_access_admin_module\('users'\)\) with check \(public\.can_access_admin_module\('users'\)\)/);
  assert.match(migration085, /if new\.status is distinct from old\.status and not public\.can_access_admin_module\('users'\) then/);
  assert.match(migration085, /if new\.role is distinct from old\.role then\s+raise exception 'Only SUPER_ADMIN may change account roles'/);
});

// -----------------------------------------------------------------------------
// 3. Provider Admin Tests
// -----------------------------------------------------------------------------
test("3. Provider Admin: Authorized provider actions allowed; unauthorized modules rejected", () => {
  assert.equal(hasAdminAccess(providerAdmin), true);
  assert.equal(isSuperAdmin(providerAdmin), false);

  // Authorized sections
  assert.equal(canAccessAdminSection(providerAdmin, "overview"), true);
  assert.equal(canAccessAdminSection(providerAdmin, "providers", { adminModule: "providers" }), true);
  assert.equal(canAccessAdminSection(providerAdmin, "reports", { adminModule: "reports" }), true);
  assert.equal(canAccessAdminSection(providerAdmin, "blocked-accounts"), true);
  assert.equal(canAccessAdminSection(providerAdmin, "removed-providers", { adminModule: "providers" }), true);

  // Unauthorized sections
  const restrictedSections = [
    ["profiles", { adminModule: "users" }],
    ["businesses", { adminModule: "business" }],
    ["business-products", { adminModule: "business" }],
    ["subscriptions", { adminModule: "subscriptions" }],
    ["bookings", { adminModule: "bookings" }],
    ["admin-management", undefined],
    ["removed-accounts", { adminModule: "users" }],
    ["removed-businesses", { adminModule: "business" }],
    ["frozen-subscriptions", { adminModule: "subscriptions" }],
  ];
  for (const [section, resource] of restrictedSections) {
    assert.equal(
      canAccessAdminSection(providerAdmin, section, resource),
      false,
      `Provider Admin must be rejected from section: ${section}`
    );
  }

  // Backend RLS: Provider Admin can manage providers, verification, listings
  assert.match(migration085, /create policy providers_provider_admin_manage on public\.providers for all to authenticated\s+using \(public\.can_access_admin_module\('providers'\)\) with check \(public\.can_access_admin_module\('providers'\)\)/);
  assert.match(migration085, /create policy provider_verifications_provider_admin_manage on public\.provider_verifications for all to authenticated/);
  assert.match(migration085, /create policy profiles_provider_admin_select on public\.profiles for select to authenticated\s+using \(public\.can_access_admin_module\('providers'\) and exists \(\s*select 1 from public\.providers where user_id = profiles\.id\s*\)\)/);
});

// -----------------------------------------------------------------------------
// 4. Business Admin Tests
// -----------------------------------------------------------------------------
test("4. Business Admin: Authorized business actions allowed; unauthorized modules rejected", () => {
  assert.equal(hasAdminAccess(businessAdmin), true);
  assert.equal(isSuperAdmin(businessAdmin), false);

  // Authorized sections
  assert.equal(canAccessAdminSection(businessAdmin, "overview"), true);
  assert.equal(canAccessAdminSection(businessAdmin, "businesses", { adminModule: "business" }), true);
  assert.equal(canAccessAdminSection(businessAdmin, "business-products", { adminModule: "business" }), true);
  assert.equal(canAccessAdminSection(businessAdmin, "reports", { adminModule: "reports" }), true);
  assert.equal(canAccessAdminSection(businessAdmin, "blocked-accounts"), true);
  assert.equal(canAccessAdminSection(businessAdmin, "removed-businesses", { adminModule: "business" }), true);

  // Unauthorized sections
  const restrictedSections = [
    ["profiles", { adminModule: "users" }],
    ["providers", { adminModule: "providers" }],
    ["subscriptions", { adminModule: "subscriptions" }],
    ["bookings", { adminModule: "bookings" }],
    ["admin-management", undefined],
    ["removed-accounts", { adminModule: "users" }],
    ["removed-providers", { adminModule: "providers" }],
    ["frozen-subscriptions", { adminModule: "subscriptions" }],
  ];
  for (const [section, resource] of restrictedSections) {
    assert.equal(
      canAccessAdminSection(businessAdmin, section, resource),
      false,
      `Business Admin must be rejected from section: ${section}`
    );
  }

  // Backend RLS: Business Admin can manage businesses and business products
  assert.match(migration085, /create policy businesses_business_admin_manage on public\.businesses for all to authenticated\s+using \(public\.can_access_admin_module\('business'\)\) with check \(public\.can_access_admin_module\('business'\)\)/);
  assert.match(migration085, /create policy business_products_business_admin_manage on public\.business_products for all to authenticated/);
  assert.match(migration085, /create policy profiles_business_admin_select on public\.profiles for select to authenticated\s+using \(public\.can_access_admin_module\('business'\) and exists \(\s*select 1 from public\.businesses where user_id = profiles\.id\s*\)\)/);
});

// -----------------------------------------------------------------------------
// 5. Subscription Admin Tests
// -----------------------------------------------------------------------------
test("5. Subscription Admin: Authorized subscription actions allowed; unauthorized modules rejected", () => {
  assert.equal(hasAdminAccess(subscriptionAdmin), true);
  assert.equal(isSuperAdmin(subscriptionAdmin), false);

  // Authorized sections
  assert.equal(canAccessAdminSection(subscriptionAdmin, "overview"), true);
  assert.equal(canAccessAdminSection(subscriptionAdmin, "subscriptions", { adminModule: "subscriptions" }), true);
  assert.equal(canAccessAdminSection(subscriptionAdmin, "frozen-subscriptions", { adminModule: "subscriptions" }), true);

  // Unauthorized sections (including reports and blocked accounts, matching Test 181 invariant)
  const restrictedSections = [
    ["profiles", { adminModule: "users" }],
    ["providers", { adminModule: "providers" }],
    ["businesses", { adminModule: "business" }],
    ["bookings", { adminModule: "bookings" }],
    ["reports", { adminModule: "reports" }],
    ["blocked-accounts", undefined],
    ["admin-management", undefined],
    ["removed-accounts", { adminModule: "users" }],
    ["removed-providers", { adminModule: "providers" }],
    ["removed-businesses", { adminModule: "business" }],
  ];
  for (const [section, resource] of restrictedSections) {
    assert.equal(
      canAccessAdminSection(subscriptionAdmin, section, resource),
      false,
      `Subscription Admin must be rejected from section: ${section}`
    );
  }

  // UI verification: Subscription Admin has Activate subscriptions tab inside Subscriptions workspace
  assert.match(adminApp, /section === "frozen-subscriptions"\) \? <div className="ops-subscription-tabs"/);
  assert.match(adminApp, /canOpenSection\("frozen-subscriptions"\) \? <button role="tab" aria-selected=\{section === "frozen-subscriptions"\}/);

  // Backend RLS: Subscription Admin manages provider subscriptions and selects providers/profiles
  assert.match(migration085, /create policy provider_subscriptions_subscription_admin_manage on public\.provider_subscriptions for all to authenticated\s+using \(public\.can_access_admin_module\('subscriptions'\)\) with check \(public\.can_access_admin_module\('subscriptions'\)\)/);
  assert.match(migration085, /create policy providers_subscription_admin_select on public\.providers for select to authenticated\s+using \(public\.can_access_admin_module\('subscriptions'\)\)/);
  assert.match(migration085, /create policy profiles_subscription_admin_select on public\.profiles for select to authenticated\s+using \(public\.can_access_admin_module\('subscriptions'\) and exists \(\s*select 1 from public\.providers where user_id = profiles\.id\s*\)\)/);
});

// -----------------------------------------------------------------------------
// 6. Booking Admin Tests
// -----------------------------------------------------------------------------
test("6. Booking Admin: Authorized booking actions allowed; contextual read granted; account management barred", () => {
  assert.equal(hasAdminAccess(bookingAdmin), true);
  assert.equal(isSuperAdmin(bookingAdmin), false);

  // Authorized sections
  assert.equal(canAccessAdminSection(bookingAdmin, "overview"), true);
  assert.equal(canAccessAdminSection(bookingAdmin, "bookings", { adminModule: "bookings" }), true);

  // Unauthorized sections
  const restrictedSections = [
    ["profiles", { adminModule: "users" }],
    ["providers", { adminModule: "providers" }],
    ["businesses", { adminModule: "business" }],
    ["subscriptions", { adminModule: "subscriptions" }],
    ["reports", { adminModule: "reports" }],
    ["blocked-accounts", undefined],
    ["admin-management", undefined],
    ["removed-accounts", { adminModule: "users" }],
    ["removed-providers", { adminModule: "providers" }],
    ["removed-businesses", { adminModule: "business" }],
    ["frozen-subscriptions", { adminModule: "subscriptions" }],
  ];
  for (const [section, resource] of restrictedSections) {
    assert.equal(
      canAccessAdminSection(bookingAdmin, section, resource),
      false,
      `Booking Admin must be rejected from section: ${section}`
    );
  }

  // UI Action permissions
  assert.match(adminApp, /onCancelBooking=\{adminIsSuper \|\| access\?\.role === "booking_admin" \? cancelBooking : null\}/);
  assert.match(adminApp, /cancellation_reason: "Cancelled by Booking Admin"/);
  assert.match(adminApp, /const blockAccount = \(row\) => \{[\s\S]*?!adminIsSuper && !\["users_admin", "provider_admin", "business_admin"\]\.includes\(access\?\.role\)/);
  assert.match(adminApp, /canRemoveAccount=\{adminIsSuper \|\| \(access\?\.role === "users_admin"/);
  assert.match(adminApp, /canRemoveProvider=\{adminIsSuper \|\| access\?\.role === "provider_admin"\}/);
  assert.match(adminApp, /canRemoveBusiness=\{adminIsSuper \|\| access\?\.role === "business_admin"\}/);
  assert.match(adminApp, /canFreezeSubscription=\{adminIsSuper \|\| access\?\.role === "subscription_admin"\}/);

  // Contextual read policies
  assert.match(migration085, /create policy bookings_booking_admin_manage on public\.bookings for all to authenticated\s+using \(public\.can_access_admin_module\('bookings'\)\) with check \(public\.can_access_admin_module\('bookings'\)\)/);
  assert.match(migration085, /create policy providers_booking_admin_select on public\.providers for select to authenticated\s+using \(public\.can_access_admin_module\('bookings'\)\)/);
  assert.match(migration110, /create policy businesses_booking_admin_select on public\.businesses for select to authenticated\s+using \(public\.can_access_admin_module\('bookings'\)\)/);
  assert.match(migration110, /create policy profiles_booking_admin_select on public\.profiles for select to authenticated/);
  assert.match(migration110, /exists \(select 1 from public\.businesses where user_id = profiles\.id\)/);
  assert.match(migration110, /exists \(select 1 from public\.providers where user_id = profiles\.id\)/);
  assert.match(migration110, /exists \(select 1 from public\.bookings where traveler_id = profiles\.id\)/);

  // Zero write/update/delete policies on businesses or profiles
  assert.doesNotMatch(migration110, /for (insert|update|delete|all)/i);
});

// -----------------------------------------------------------------------------
// 7. Security Tests: Direct URL, Inactive Access, Edge Functions & Privilege Escalation
// -----------------------------------------------------------------------------
test("7. Security: Direct URL rejection, inactive rejection, Edge Function protection, and privilege anti-escalation", () => {
  // Inactive admins have zero access
  assert.equal(hasAdminAccess({ role: "super_admin", is_active: false }), false);
  assert.equal(hasAdminAccess({ role: "booking_admin", is_active: false }), false);
  assert.equal(hasAdminAccess({ role: "users_admin", is_active: false }), false);
  assert.equal(canAccessAdminSection({ role: "super_admin", is_active: false }, "overview"), false);
  assert.equal(canAccessAdminSection({ role: "booking_admin", is_active: false }, "bookings", { adminModule: "bookings" }), false);

  // Unknown role or null access rejected
  assert.equal(hasAdminAccess(null), false);
  assert.equal(hasAdminAccess({ role: "traveler", is_active: true }), false);
  assert.equal(canAccessAdminSection({ role: "traveler", is_active: true }, "overview"), false);

  // Edge function invite-secondary-admin strictly gates Super Admin
  assert.match(inviteFunction, /requester\.rpc\("current_admin_access"\)/);
  assert.match(inviteFunction, /access\?\.\[0\]\?\.role !== "super_admin"/);
  assert.match(inviteFunction, /Only an active Super Admin can manage Secondary Admin accounts/);

  // Edge function purge-deactivated-accounts requires secret auth
  assert.match(purgeFunction, /auth:\s*"secret"/);

  // Database trigger protects against profile privilege escalation
  assert.match(migration085, /create or replace function public\.protect_profile_privileges\(\)/);
  assert.match(migration085, /if auth\.uid\(\) is not null and not public\.is_super_admin\(\) then\s+if new\.role is distinct from old\.role then\s+raise exception 'Only SUPER_ADMIN may change account roles'/);
  assert.match(migration085, /if new\.status is distinct from old\.status and not public\.can_access_admin_module\('users'\) then\s+raise exception 'Only Users Admins may change user account status'/);

  // Database triggers protect provider and business approval fields
  assert.match(migration085, /create or replace function public\.protect_provider_admin_fields\(\)/);
  assert.match(migration085, /auth\.uid\(\) is null or public\.is_super_admin\(\) or public\.can_access_admin_module\('providers'\)/);
  assert.match(migration085, /create or replace function public\.protect_business_admin_fields\(\)/);
  assert.match(migration085, /auth\.uid\(\) is null or public\.is_super_admin\(\) or public\.can_access_admin_module\('business'\)/);
});

// -----------------------------------------------------------------------------
// 8. Preservation Tests: Roles, Accounts, Workflows, and Architecture
// -----------------------------------------------------------------------------
test("8. Preservation: All six roles exist, database constraints intact, zero duplicate systems", () => {
  // All secondary roles defined in ADMIN_ROLES
  assert.deepEqual(
    [...ADMIN_ROLES].sort(),
    ["booking_admin", "business_admin", "media_admin", "provider_admin", "subscription_admin", "users_admin"]
  );

  // All roles have human-friendly display labels
  assert.equal(ADMIN_ROLE_LABELS.super_admin, "Super Admin");
  assert.equal(ADMIN_ROLE_LABELS.users_admin, "Users Admin");
  assert.equal(ADMIN_ROLE_LABELS.provider_admin, "Provider Admin");
  assert.equal(ADMIN_ROLE_LABELS.business_admin, "Business Admin");
  assert.equal(ADMIN_ROLE_LABELS.subscription_admin, "Subscription Admin");
  assert.equal(ADMIN_ROLE_LABELS.booking_admin, "Booking Admin");
  assert.equal(ADMIN_ROLE_LABELS.media_admin, "Media Admin");

  // Database admin_accounts table check constraint enforces the secondary roles
  assert.match(
    migration085,
    /'users_admin'[\s\S]*'business_admin'[\s\S]*'provider_admin'[\s\S]*'subscription_admin'[\s\S]*'booking_admin'/
  );

  // Migration 111 includes media_admin
  assert.match(
    migration111,
    /'media_admin'/
  );

  // can_access_admin_module handles all operational modules without external RBAC tables
  assert.match(migration085, /when module_name = 'users' then private\.current_admin_role\(\) = 'users_admin'/);
  assert.match(migration085, /when module_name = 'business' then private\.current_admin_role\(\) = 'business_admin'/);
  assert.match(migration085, /when module_name = 'providers' then private\.current_admin_role\(\) = 'provider_admin'/);
  assert.match(migration085, /when module_name = 'subscriptions' then private\.current_admin_role\(\) = 'subscription_admin'/);
  assert.match(migration085, /when module_name = 'bookings' then private\.current_admin_role\(\) = 'booking_admin'/);
  assert.match(migration111, /when module_name = 'media' then private\.current_admin_role\(\) = 'media_admin'/);

  // media_admin is strictly isolated to media
  assert.equal(canAccessAdminSection(mediaAdmin, "media", { adminModule: "media" }), true);
  assert.equal(canAccessAdminSection(mediaAdmin, "overview"), false);
  assert.equal(canAccessAdminSection(mediaAdmin, "profiles", { adminModule: "users" }), false);
  assert.equal(canAccessAdminSection(mediaAdmin, "providers", { adminModule: "providers" }), false);
  assert.equal(canAccessAdminSection(mediaAdmin, "businesses", { adminModule: "business" }), false);
  assert.equal(canAccessAdminSection(mediaAdmin, "subscriptions", { adminModule: "subscriptions" }), false);
  assert.equal(canAccessAdminSection(mediaAdmin, "bookings", { adminModule: "bookings" }), false);
  assert.equal(canAccessAdminSection(mediaAdmin, "reports", { adminModule: "reports" }), false);
  assert.equal(canAccessAdminSection(mediaAdmin, "blocked-accounts"), false);
  assert.equal(canAccessAdminSection(mediaAdmin, "admin-management"), false);
});
