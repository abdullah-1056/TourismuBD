import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ADMIN_ROLES, adminRemovalPatch, buildPlacePayload, canAccessAdminSection, canManageProfile, hasAdminAccess, isSuperAdmin, providerTypeLabel, slugifyPlaceName, sortDestinationRows } from "../src/lib/admin.js";

const adminApp = readFileSync(new URL("../src/AdminApp.jsx", import.meta.url), "utf8");
const adminConfig = readFileSync(new URL("../vite.admin.config.js", import.meta.url), "utf8");
const adminCss = readFileSync(new URL("../src/admin.css", import.meta.url), "utf8");

test("Admin Users include the same eye-based profile details action as providers", () => {
  assert.match(adminApp, /function TravelerProfile/);
  assert.match(adminApp, /aria-label="View profile"/);
  assert.doesNotMatch(adminApp, /<span>View profile<\/span>/);
  assert.match(adminApp, /profilesSection \? <button onClick=\{\(\) => setTravelerProfile\(row\.profile \|\| row\)\}/);
  assert.match(adminApp, /resource\.table === "businesses" \? "View business owner details" : "View user details"/);
});

test("Admin Business accounts provide public and detail profile views", () => {
  assert.match(adminApp, /resource\.table === "businesses"/);
  assert.match(adminApp, /setTravelerProfile\(row\.profile \|\| row\)/);
  assert.match(adminApp, /View business owner details/);
  assert.match(adminApp, /profile\.role === "BUSINESS_OWNER" \? "business account"/);
});

test("Subscriptions separate provider records from business accounts", () => {
  assert.match(adminApp, /subscriptionSection: true/);
  assert.match(adminApp, /id: "business-subscriptions"/);
  assert.match(adminApp, /Provider subscriptions/);
  assert.match(adminApp, /Business accounts/);
  assert.match(adminApp, /aria-label="Subscription account types"/);
  assert.match(adminApp, /columns: \["owner_name", "service_name", "provider_type", "district", "monthly_fee_bdt", "status", "current_period_end"\]/);
  assert.match(adminApp, /target\.table === "provider_subscriptions"/);
  assert.match(adminApp, /provider_record: provider \? \{ \.\.\.provider, profile: providerProfile \} : null/);
  assert.match(adminApp, /providerSubscriptionSection && row\.provider_record/);
  assert.match(adminApp, /title="View Admin details" aria-label="View Admin details"/);
});

test("Admin bookings identify the service, provider, and traveler", () => {
  assert.match(adminApp, /columns: \["service_type", "service_name", "provider_name", "traveler_names", "booking_count", "latest_booking", "status"\]/);
  assert.match(adminApp, /target\.table === "bookings"/);
  assert.match(adminApp, /service_name: provider\?\.service_name \|\| provider\?\.display_name \|\| "Not added"/);
  assert.match(adminApp, /provider_name: providerProfile\?\.full_name \|\| provider\?\.display_name \|\| "Not provided"/);
  assert.match(adminApp, /traveler_name: travelerProfile\?\.full_name \|\| "Not provided"/);
  assert.match(adminApp, /const groupedBookings = new Map\(\)/);
  assert.match(adminApp, /traveler_names: \[\.\.\.travelerNames\]\.join\(", "\)/);
  assert.match(adminApp, /booking_count: bookingCount/);
  assert.match(adminApp, /bookingsSection && row\.provider_record/);
  assert.match(adminApp, /function BookingHistoryDialog/);
  assert.match(adminApp, /bookingEndDate\(booking\.start_date, booking\.duration_days\)/);
  assert.match(adminApp, /booking_records: bookings/);
  assert.match(adminApp, /target\.id === "bookings" \|\| target\.columns\.includes\("created_at"\)/);
  assert.doesNotMatch(adminApp, /window\.setInterval\(refreshBookings, 15000\)/);
});

test("Admin reports open a full details panel", () => {
  assert.match(adminApp, /function ReportDetailsDialog/);
  assert.match(adminApp, /label="Details" value=\{report\.details\} wide/);
  assert.match(adminApp, /label="Admin note" value=\{report\.admin_note\} wide/);
  assert.match(adminApp, /reportsSection \? <button onClick=\{\(\) => setReportDetails\(row\)\}/);
  assert.match(adminApp, /reportDetails \? <ReportDetailsDialog/);
});

test("Secondary Admin report counts are scoped to the reported account type", () => {
  assert.match(adminApp, /const reportsForCurrentAdmin = async/);
  assert.match(adminApp, /access\?\.role === "users_admin"/);
  assert.match(adminApp, /author\?\.role === "TRAVELER"/);
  assert.match(adminApp, /access\?\.role === "provider_admin"/);
  assert.match(adminApp, /!\["TRAVELER", "BUSINESS_OWNER", "SUPER_ADMIN"\]\.includes\(author.role\)/);
  assert.match(adminApp, /item\.resource === "reports" \? await reportsForCurrentAdmin\(visibleProfileRows\)/);
});

test("Secondary Admins can edit and resolve their assigned reports without deleting them", () => {
  assert.match(adminCss, /ops-secondary-admin\.ops-reports \.ops-row-actions > button\[aria-label="Delete record"\] \{ display: none; \}/);
  assert.doesNotMatch(adminCss, /ops-secondary-admin\.ops-reports \.ops-row-actions > button:not\(\[aria-label="View report details"\]\)/);
});

test("removed reported accounts can be activated again", () => {
  assert.match(adminApp, /id: "removed-accounts"/);
  assert.match(adminApp, /profileStatus: "SUSPENDED"/);
  assert.match(adminApp, /Activate accounts/);
  assert.match(adminApp, /restoring \? "Account restored to active use\."/);
  assert.match(adminConfig, /"status"\]\);/);
});

test("Admin blocks every account type into the activation list", () => {
  assert.match(adminApp, /remove: \{ status: "SUSPENDED" \}/);
  assert.match(adminApp, /setSection\("removed-accounts"\)/);
  assert.match(adminCss, /content: "Block"/);
  assert.match(adminApp, /resource\.table === "providers" \|\| resource\.businessSection/);
  assert.match(adminApp, /status: "SUSPENDED" \}\);/);
  assert.match(adminCss, /ops-provider-blocking/);
});

test("Admin has a bottom blocked accounts tab with account restoration", () => {
  assert.match(adminApp, /id: "blocked-accounts", label: "Blocked accounts"/);
  assert.match(adminApp, /blockedSection: true/);
  assert.match(adminApp, /columns: \["full_name", "email", "phone", "role", "district", "status", "updated_at"\]/);
  assert.match(adminApp, /Boolean\(resource\.activation\) \|\| resource\.id === "blocked-accounts"/);
});

test("blocked accounts no longer appear in active account tables", () => {
  assert.match(adminApp, /target\.id === "profiles"\) return \(target\.profileStatus \? row\.status === target\.profileStatus : row\.status !== "SUSPENDED"\)/);
  assert.match(adminApp, /target\.table === "providers" \|\| target\.table === "businesses"\) return target\.accountStatus \? row\.account_status === target\.accountStatus : row\.account_status !== "REMOVED"/);
});

test("activating an account restores its linked provider or business record", () => {
  assert.match(adminApp, /const restorePatch = \{ account_status: "ACTIVE", public_status: "PUBLISHED" \}/);
  assert.match(adminApp, /for \(const table of \["providers", "businesses"\]\)/);
  assert.match(adminApp, /filter: "user_id", value: row\.id/);
  assert.match(adminApp, /eq\("user_id", row\.id\)\.eq\("account_status", "REMOVED"\)/);
});

test("account blocking uses an in-page confirmation dialog", () => {
  assert.match(adminApp, /function AccountActionDialog/);
  assert.match(adminApp, /const \[accountAction, setAccountAction\] = useState\(null\)/);
  assert.match(adminApp, /const applyAccountAction = async \(row\)/);
  assert.match(adminApp, /const remove = \(row\) => \{/);
  assert.match(adminApp, /setAccountAction\(row\)/);
});

test("Admin keeps the selected section after a refresh", () => {
  assert.match(adminApp, /const ADMIN_SECTION_STORAGE_KEY = "tourismubd\.admin\.section"/);
  assert.match(adminApp, /function savedAdminSection\(\)/);
  assert.match(adminApp, /const saved = savedAdminSection\(\)/);
  assert.match(adminApp, /window\.sessionStorage\.setItem\(ADMIN_SECTION_STORAGE_KEY, section\)/);
});

test("Admin navigation works with browser Back and Forward", () => {
  assert.match(adminApp, /window\.history\.pushState\(\{ \.\.\.currentState, tourismubdAdminSection: nextSection \}/);
  assert.match(adminApp, /window\.addEventListener\("popstate", restoreSection\)/);
  assert.match(adminApp, /setSectionState\(event\.state\.tourismubdAdminSection\)/);
});

test("local Admin booking queries are newest first", () => {
  assert.match(adminConfig, /if \(table === "bookings"\) query\.set\("order", "created_at\.desc"\)/);
});

test("local Admin action buttons use the protected mutation service", () => {
  assert.match(adminApp, /const LOCAL_ADMIN_MUTABLE_TABLES = new Set/);
  assert.match(adminApp, /bypassAuth && LOCAL_ADMIN_MUTABLE_TABLES\.has\(resource\.table\)/);
  assert.match(adminConfig, /providers: new Set\(\["display_name", "service_name"/);
  assert.match(adminConfig, /provider_subscriptions: new Set\(\["status", "current_period_start"/);
  assert.match(adminConfig, /if \(!ADMIN_MUTABLE_TABLES\.has\(table\)\)/);
});

test("Admin delete actions use an in-app confirmation dialog", () => {
  assert.match(adminApp, /function DeleteRecordDialog/);
  assert.match(adminApp, /Delete permanently/);
  assert.match(adminApp, /setDeleting\(row\)/);
  assert.match(adminApp, /deleting \? <DeleteRecordDialog/);
  assert.doesNotMatch(adminApp, /Type DELETE to permanently remove this record/);
});

test("admin removal patches satisfy booking and report constraints", () => {
  const now = "2026-09-02T12:00:00.000Z";
  assert.deepEqual(adminRemovalPatch("cancel", "admin-id", now), {
    status: "CANCELLED",
    cancelled_by: "admin-id",
    cancelled_at: now,
    cancellation_reason: "Removed by Super Admin",
  });
  assert.deepEqual(adminRemovalPatch("resolve", "admin-id", now), {
    status: "RESOLVED",
    resolved_by: "admin-id",
    resolved_at: now,
    admin_note: "Resolved by Super Admin",
  });
});

test("admin access and self-lockout guards are strict", () => {
  assert.equal(hasAdminAccess({ role: "super_admin", is_active: true }), true);
  assert.equal(hasAdminAccess({ role: "users_admin", is_active: true }), true);
  assert.equal(hasAdminAccess({ role: "users_admin", is_active: false }), false);
  assert.equal(hasAdminAccess({ role: "TRAVELER", is_active: true }), false);
  assert.equal(isSuperAdmin({ role: "super_admin", is_active: true }), true);
  assert.equal(isSuperAdmin({ role: "users_admin", is_active: true }), false);
  assert.equal(canManageProfile("admin-a", "admin-a"), false);
  assert.equal(canManageProfile("admin-a", "admin-b"), true);
});

test("Secondary Admin navigation is limited to one module and Reports", () => {
  assert.deepEqual(ADMIN_ROLES, ["users_admin", "business_admin", "provider_admin", "subscription_admin", "booking_admin"]);
  const users = { role: "users_admin", is_active: true };
  const business = { role: "business_admin", is_active: true };
  const superAdmin = { role: "super_admin", is_active: true };
  assert.equal(canAccessAdminSection(users, "overview"), true);
  assert.equal(canAccessAdminSection(users, "reports"), true);
  assert.equal(canAccessAdminSection({ role: "provider_admin", is_active: true }, "reports"), true);
  assert.equal(canAccessAdminSection({ role: "business_admin", is_active: true }, "reports"), true);
  assert.equal(canAccessAdminSection({ role: "subscription_admin", is_active: true }, "reports"), false);
  assert.equal(canAccessAdminSection({ role: "booking_admin", is_active: true }, "reports"), false);
  assert.equal(canAccessAdminSection(users, "admin-management"), false);
  assert.equal(canAccessAdminSection(users, "profiles", { adminModule: "users" }), true);
  assert.equal(canAccessAdminSection(users, "providers", { adminModule: "providers" }), false);
  assert.equal(canAccessAdminSection(business, "businesses", { adminModule: "business" }), true);
  assert.equal(canAccessAdminSection(superAdmin, "admin-management"), true);
});

test("Admin Management is Super-Admin-only and uses server-side Admin functions", () => {
  assert.match(adminApp, /function AdminManagement/);
  assert.match(adminApp, /Admin Management/);
  assert.match(adminApp, /assign_secondary_admin/);
  assert.match(adminApp, /remove_secondary_admin/);
  assert.match(adminApp, /adminIsSuper \? <button className=\{section === "admin-management"/);
  assert.match(adminApp, /readOnly=\{!adminIsSuper\}/);
  assert.match(adminConfig, /"admin_accounts"/);
  assert.match(adminConfig, /"assign_secondary_admin", "remove_secondary_admin"/);
});

test("provider account types are readable in admin profiles", () => {
  assert.equal(providerTypeLabel("GUIDE"), "Tour Guide");
  assert.equal(providerTypeLabel("HOUSEBOAT_OWNER"), "Houseboat Owner");
  assert.equal(providerTypeLabel("RESORT_HOTEL_OWNER"), "Resort / Hotel Owner");
  assert.equal(providerTypeLabel("CUSTOM_PROVIDER"), "Custom Provider");
});

test("admin tourist place forms create normalized database payloads", () => {
  assert.equal(slugifyPlaceName("  New River & Hill View  "), "new-river-hill-view");
  assert.deepEqual(buildPlacePayload({
    district_id: "district-id",
    name: "New River View",
    slug: "new-river-view",
    upazila_or_area: "Town",
    category: "Viewpoint",
    latitude: "24.1234",
    longitude: "91.2345",
    short_description: "A new destination.",
    best_time: "Winter",
    how_to_reach: "Use the district road.",
    practical_tips: "Travel in daylight.",
    image_url: "",
    status: "PUBLISHED",
  }), {
    district_id: "district-id",
    name: "New River View",
    slug: "new-river-view",
    upazila_or_area: "Town",
    category: "Viewpoint",
    latitude: 24.1234,
    longitude: 91.2345,
    short_description: "A new destination.",
    best_time: "Winter",
    how_to_reach: "Use the district road.",
    practical_tips: "Travel in daylight.",
    image_url: null,
    status: "PUBLISHED",
  });
  assert.throws(() => buildPlacePayload({ district_id: "", name: "Missing district", latitude: 24, longitude: 91 }), /Choose a district/);
  assert.throws(() => buildPlacePayload({ district_id: "district-id", name: "Bad pin", latitude: "", longitude: 91 }), /latitude/);
});

test("admin destinations are arranged by division, district, and name", () => {
  const places = [
    { division_name: "Sylhet", district_name: "Sylhet", name: "Jaflong" },
    { division_name: "Dhaka", district_name: "Gazipur", name: "Bhawal" },
    { division_name: "Dhaka", district_name: "Dhaka", name: "Museum" },
  ];
  assert.deepEqual(sortDestinationRows(places, "places").map(({ name }) => name), ["Museum", "Bhawal", "Jaflong"]);
  const districts = [{ division: "Sylhet", name: "Sylhet" }, { division: "Dhaka", name: "Tangail" }, { division: "Dhaka", name: "Dhaka" }];
  assert.deepEqual(sortDestinationRows(districts, "districts").map(({ name }) => name), ["Dhaka", "Tangail", "Sylhet"]);
});

test("canAccessAdminSection centrally enforces blocked-accounts authorization", () => {
  assert.equal(canAccessAdminSection({ role: "super_admin", is_active: true }, "blocked-accounts"), true);
  assert.equal(canAccessAdminSection({ role: "users_admin", is_active: true }, "blocked-accounts"), true);
  assert.equal(canAccessAdminSection({ role: "provider_admin", is_active: true }, "blocked-accounts"), true);
  assert.equal(canAccessAdminSection({ role: "business_admin", is_active: true }, "blocked-accounts"), true);
  assert.equal(canAccessAdminSection({ role: "subscription_admin", is_active: true }, "blocked-accounts"), false);
  assert.equal(canAccessAdminSection({ role: "booking_admin", is_active: true }, "blocked-accounts"), false);
});

test("migration 110 grants contextual read-only business and profile policies to Booking Admin", () => {
  const migration110 = readFileSync(new URL("../supabase/migrations/110_booking_admin_business_read.sql", import.meta.url), "utf8");
  assert.match(migration110, /create policy businesses_booking_admin_select on public\.businesses for select to authenticated/);
  assert.match(migration110, /create policy profiles_booking_admin_select on public\.profiles for select to authenticated/);
  assert.match(migration110, /public\.can_access_admin_module\('bookings'\)/);
  assert.match(migration110, /exists \(select 1 from public\.businesses where user_id = profiles\.id\)/);
  assert.match(migration110, /exists \(select 1 from public\.providers where user_id = profiles\.id\)/);
  assert.match(migration110, /exists \(select 1 from public\.bookings where traveler_id = profiles\.id\)/);
  assert.doesNotMatch(migration110, /for (insert|update|delete|all)/i);
});

test("Subscription Admin can access Activate subscriptions under Subscriptions section", () => {
  assert.match(adminApp, /section === "frozen-subscriptions"\) \? <div className="ops-subscription-tabs"/);
  assert.match(adminApp, /canOpenSection\("frozen-subscriptions"\) \? <button role="tab" aria-selected=\{section === "frozen-subscriptions"\}/);
});

test("Booking Admin can perform authorized booking operations and view contextual information", () => {
  const bookingAdmin = { role: "booking_admin", is_active: true };
  assert.equal(canAccessAdminSection(bookingAdmin, "overview"), true);
  assert.equal(canAccessAdminSection(bookingAdmin, "bookings", { adminModule: "bookings" }), true);

  // Authorized booking cancellation in UI
  assert.match(adminApp, /onCancelBooking=\{adminIsSuper \|\| access\?\.role === "booking_admin" \? cancelBooking : null\}/);
  assert.match(adminApp, /cancellation_reason: "Cancelled by Booking Admin"/);

  // Contextual information viewing
  assert.match(adminApp, /bookingsSection && row\.provider_record \? <><PublicProfileLink provider=\{row\.provider_record\} \/><button onClick=\{\(\) => setProviderProfile\(row\.provider_record\)\} title="View provider details"/);
  assert.match(adminApp, /<button onClick=\{\(\) => setBookingHistory\(row\)\} title="View booking history"/);
});

test("Booking Admin cannot perform unauthorized account-management actions", () => {
  const bookingAdmin = { role: "booking_admin", is_active: true };

  // Blocked from foreign modules
  assert.equal(canAccessAdminSection(bookingAdmin, "profiles", { adminModule: "users" }), false);
  assert.equal(canAccessAdminSection(bookingAdmin, "providers", { adminModule: "providers" }), false);
  assert.equal(canAccessAdminSection(bookingAdmin, "businesses", { adminModule: "business" }), false);
  assert.equal(canAccessAdminSection(bookingAdmin, "subscriptions", { adminModule: "subscriptions" }), false);
  assert.equal(canAccessAdminSection(bookingAdmin, "reports", { adminModule: "reports" }), false);
  assert.equal(canAccessAdminSection(bookingAdmin, "blocked-accounts"), false);
  assert.equal(canAccessAdminSection(bookingAdmin, "admin-management"), false);

  // Blocked from account management controls in UI
  assert.match(adminApp, /const blockAccount = \(row\) => \{[\s\S]*?!adminIsSuper && !\["users_admin", "provider_admin", "business_admin"\]\.includes\(access\?\.role\)/);
  assert.match(adminApp, /canRemoveAccount=\{adminIsSuper \|\| \(access\?\.role === "users_admin"/);
  assert.match(adminApp, /canRemoveProvider=\{adminIsSuper \|\| access\?\.role === "provider_admin"\}/);
  assert.match(adminApp, /canRemoveBusiness=\{adminIsSuper \|\| access\?\.role === "business_admin"\}/);
  assert.match(adminApp, /canFreezeSubscription=\{adminIsSuper \|\| access\?\.role === "subscription_admin"\}/);
});

test("Super Admin retains full administrative access across all sections", () => {
  const superAdmin = { role: "super_admin", is_active: true };
  const sections = [
    ["overview", undefined],
    ["profiles", { adminModule: "users" }],
    ["providers", { adminModule: "providers" }],
    ["businesses", { adminModule: "business" }],
    ["subscriptions", { adminModule: "subscriptions" }],
    ["bookings", { adminModule: "bookings" }],
    ["reports", { adminModule: "reports" }],
    ["blocked-accounts", undefined],
    ["admin-management", undefined],
  ];

  for (const [sec, res] of sections) {
    assert.equal(canAccessAdminSection(superAdmin, sec, res), true, `Super Admin should access ${sec}`);
  }
});

test("Other specialized administrators retain their assigned scopes without privilege bleed", () => {
  const usersAdmin = { role: "users_admin", is_active: true };
  const providerAdmin = { role: "provider_admin", is_active: true };
  const businessAdmin = { role: "business_admin", is_active: true };
  const subscriptionAdmin = { role: "subscription_admin", is_active: true };

  // Users Admin
  assert.equal(canAccessAdminSection(usersAdmin, "profiles", { adminModule: "users" }), true);
  assert.equal(canAccessAdminSection(usersAdmin, "bookings", { adminModule: "bookings" }), false);
  assert.equal(canAccessAdminSection(usersAdmin, "businesses", { adminModule: "business" }), false);

  // Provider Admin
  assert.equal(canAccessAdminSection(providerAdmin, "providers", { adminModule: "providers" }), true);
  assert.equal(canAccessAdminSection(providerAdmin, "bookings", { adminModule: "bookings" }), false);
  assert.equal(canAccessAdminSection(providerAdmin, "profiles", { adminModule: "users" }), false);

  // Business Admin
  assert.equal(canAccessAdminSection(businessAdmin, "businesses", { adminModule: "business" }), true);
  assert.equal(canAccessAdminSection(businessAdmin, "bookings", { adminModule: "bookings" }), false);
  assert.equal(canAccessAdminSection(businessAdmin, "providers", { adminModule: "providers" }), false);

  // Subscription Admin
  assert.equal(canAccessAdminSection(subscriptionAdmin, "subscriptions", { adminModule: "subscriptions" }), true);
  assert.equal(canAccessAdminSection(subscriptionAdmin, "bookings", { adminModule: "bookings" }), false);
  assert.equal(canAccessAdminSection(subscriptionAdmin, "businesses", { adminModule: "business" }), false);
});


