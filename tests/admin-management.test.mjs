import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/085_secondary_admin_management.sql", import.meta.url), "utf8");
const invitationMigration = readFileSync(new URL("../supabase/migrations/086_secondary_admin_email_invites.sql", import.meta.url), "utf8");
const adminOnlyInvitationMigration = readFileSync(new URL("../supabase/migrations/087_admin_only_email_invitations.sql", import.meta.url), "utf8");
const accessFixMigration = readFileSync(new URL("../supabase/migrations/088_fix_secondary_admin_access.sql", import.meta.url), "utf8");
const superAdminMigration = readFileSync(new URL("../supabase/migrations/089_unique_admin_only_super_admin.sql", import.meta.url), "utf8");
const privateSuperAdminMigration = readFileSync(new URL("../supabase/migrations/090_private_super_admin_bootstrap.sql", import.meta.url), "utf8");
const secondaryAdminLoginTrackingMigration = readFileSync(new URL("../supabase/migrations/091_secondary_admin_login_tracking.sql", import.meta.url), "utf8");
const usersAdminVisibilityMigration = readFileSync(new URL("../supabase/migrations/092_users_admin_public_profiles_only.sql", import.meta.url), "utf8");
const usersAdminPermissionFixMigration = readFileSync(new URL("../supabase/migrations/093_fix_users_admin_policy_permission.sql", import.meta.url), "utf8");
const secondaryAdminRoleAccessMigration = readFileSync(new URL("../supabase/migrations/094_restore_secondary_admin_role_access.sql", import.meta.url), "utf8");
const targetedReportVisibilityMigration = readFileSync(new URL("../supabase/migrations/095_targeted_report_visibility.sql", import.meta.url), "utf8");
const secondaryAdminReportUpdatesMigration = readFileSync(new URL("../supabase/migrations/096_secondary_admin_report_updates.sql", import.meta.url), "utf8");
const recoveryScript = readFileSync(new URL("../scripts/recover-super-admin.mjs", import.meta.url), "utf8");
const adminSupabase = readFileSync(new URL("../src/lib/admin-supabase.js", import.meta.url), "utf8");
const adminApp = readFileSync(new URL("../src/AdminApp.jsx", import.meta.url), "utf8");
const adminEntry = readFileSync(new URL("../admin/main.jsx", import.meta.url), "utf8");
const adminConfig = readFileSync(new URL("../vite.admin.config.js", import.meta.url), "utf8");
const invitationFunction = readFileSync(new URL("../supabase/functions/invite-secondary-admin/index.ts", import.meta.url), "utf8");

test("Secondary Admin assignments are individual accounts, not unique roles", () => {
  assert.match(migration, /create table if not exists public\.admin_accounts/);
  assert.match(migration, /user_id uuid not null unique/);
  assert.match(migration, /on public\.admin_accounts \(lower\(email\)\)/);
  assert.match(migration, /'users_admin'[\s\S]*'business_admin'[\s\S]*'provider_admin'[\s\S]*'subscription_admin'[\s\S]*'booking_admin'/);
  assert.doesNotMatch(migration, /unique\s*\(role\)/i);
});

test("Only Super Admins can manage Secondary Admin accounts", () => {
  assert.match(migration, /function private\.require_super_admin_management\(\)/);
  assert.match(migration, /private\.current_admin_role\(\) <> 'super_admin'/);
  assert.match(migration, /create policy admin_accounts_super_admin_manage/);
  assert.match(migration, /function public\.assign_secondary_admin/);
  assert.match(migration, /function public\.remove_secondary_admin/);
  assert.match(migration, /A Super Admin cannot be managed as a Secondary Admin/);
});

test("Admin Management keeps action errors visible on its own screen", () => {
  assert.match(adminApp, /const \[feedback, setFeedback\] = useState\(""\)/);
  assert.match(adminApp, /function AdminManagement[\s\S]*showError/);
  assert.match(adminApp, /ops-alert ops-admin-alert/);
});

test("Super Admins can reserve an Admin role before the email creates an account", () => {
  assert.match(invitationMigration, /alter column user_id drop not null/);
  assert.doesNotMatch(invitationMigration, /must first create a TourismuBD account/);
  assert.match(invitationMigration, /where user_id is null[\s\S]*lower\(email\) = lower\(new\.email\)/);
  assert.match(adminApp, /New Admins receive an Admin-only login/);
  assert.match(adminApp, /PENDING SIGN-UP/);
});

test("Admin-only invitations create a secure login without public visibility", () => {
  assert.match(adminOnlyInvitationMigration, /is_admin_only boolean not null default false/);
  assert.match(adminOnlyInvitationMigration, /is_admin_invitation boolean := new\.email is not null and exists/);
  assert.match(adminOnlyInvitationMigration, /and not u\.is_admin_only/);
  assert.match(adminOnlyInvitationMigration, /author_is_admin_only/);
  assert.match(adminOnlyInvitationMigration, /Only SUPER_ADMIN may change Admin-only visibility/);
  assert.match(adminOnlyInvitationMigration, /drop view if exists public\.public_provider_details/);
  assert.match(adminOnlyInvitationMigration, /service_name text, bio text/);
  assert.match(adminApp, /invite-secondary-admin/);
  assert.match(adminConfig, /invite_secondary_admin/);
  assert.match(adminConfig, /generate_link/);
  assert.match(adminApp, /function AdminPasswordSetup/);
  assert.match(adminApp, /admin-invite/);
  assert.match(adminApp, /Set password and continue/);
  assert.match(invitationFunction, /inviteUserByEmail/);
  assert.match(invitationFunction, /generateLink/);
  assert.match(invitationFunction, /admin-invite/);
  assert.match(adminApp, /Admin setup link/);
  assert.match(invitationFunction, /current_admin_access/);
  assert.match(invitationFunction, /role !== "super_admin"/);
});

test("Database policies restrict each Secondary Admin module and Reports to their assigned work", () => {
  for (const policy of [
    "profiles_users_admin_select",
    "businesses_business_admin_manage",
    "providers_provider_admin_manage",
    "provider_subscriptions_subscription_admin_manage",
    "bookings_booking_admin_manage",
  ]) assert.match(migration, new RegExp(`create policy ${policy}`));
  assert.doesNotMatch(migration, /reports_secondary_admin_(update|delete|manage)/);
  assert.match(migration, /social_posts_reports_admin_select/);
  assert.match(secondaryAdminReportUpdatesMigration, /create policy reports_targeted_admin_update on public\.reports for update/);
  assert.match(secondaryAdminReportUpdatesMigration, /public\.can_view_report\(social_post_id, provider_id\)/);
  assert.doesNotMatch(secondaryAdminReportUpdatesMigration, /for delete/i);
});

test("Reports are visible only to the Admin responsible for the reported account", () => {
  assert.match(targetedReportVisibilityMigration, /function public\.can_view_report\(/);
  assert.match(targetedReportVisibilityMigration, /current_admin_role\(\) = 'users_admin'/);
  assert.match(targetedReportVisibilityMigration, /report_provider_id is null/);
  assert.match(targetedReportVisibilityMigration, /author\.role = 'TRAVELER'/);
  assert.match(targetedReportVisibilityMigration, /current_admin_role\(\) = 'provider_admin'/);
  assert.match(targetedReportVisibilityMigration, /join public\.providers provider on provider\.user_id = post\.author_id/);
  assert.match(targetedReportVisibilityMigration, /author\.role <> 'TRAVELER'/);
  assert.match(targetedReportVisibilityMigration, /create policy reports_targeted_admin_select on public\.reports for select/);
  assert.match(targetedReportVisibilityMigration, /social_posts_targeted_reports_admin_select/);
  assert.match(targetedReportVisibilityMigration, /profiles_targeted_reports_admin_select/);
});

test("Admin authorization does not poll the page every 15 seconds", () => {
  assert.doesNotMatch(adminApp, /setInterval\(validate, 15000\)/);
  assert.match(adminApp, /supabase\.rpc\("current_admin_access"\)/);
});

test("Admin authentication bypass is disabled unless explicitly enabled", () => {
  assert.match(adminApp, /VITE_ADMIN_AUTH_BYPASS === "true"/);
  assert.doesNotMatch(adminApp, /VITE_ADMIN_AUTH_BYPASS !== "false"/);
});

test("Admin sessions require a password again after reopening the panel", () => {
  assert.match(adminApp, /\.\/lib\/admin-supabase\.js/);
  assert.match(adminSupabase, /persistSession: false/);
  assert.match(adminSupabase, /autoRefreshToken: false/);
});

test("A Super Admin can change their password only after confirming the current password", () => {
  assert.match(adminApp, /function AdminPasswordChangeDialog/);
  assert.match(adminApp, /signInWithPassword\(\{ email, password: currentPassword \}\)/);
  assert.match(adminApp, /updateUser\(\{ password \}\)/);
  assert.match(adminApp, /passwordDialogOpen/);
  assert.match(adminApp, /title="Change password"/);
});

test("Forgotten Admin passwords use a recovery link and require a new password", () => {
  assert.match(adminApp, /function AdminPasswordRecoveryRequest/);
  assert.match(adminApp, /resetPasswordForEmail\(email, \{ redirectTo: adminPasswordRecoveryUrl\(\) \}\)/);
  assert.match(adminApp, /admin-recovery/);
  assert.match(adminApp, /event === "PASSWORD_RECOVERY"/);
  assert.match(adminApp, /This password-recovery link has expired or was already used/);
  assert.match(adminApp, /function AdminPasswordRecovery/);
  assert.match(adminApp, /Set new password/);
  assert.match(adminApp, /Forgot password\?/);
  assert.match(adminApp, /function validateRecoveryEmail/);
  assert.match(adminApp, /Enter the active Super Admin email/);
  assert.match(adminConfig, /__tourismubd-admin\/recovery-email/);
  assert.match(adminConfig, /role: "eq\.SUPER_ADMIN"/);
  assert.match(adminApp, /function adminAuthErrorMessage/);
  assert.match(adminApp, /Configure SMTP in Authentication > SMTP Settings/);
  assert.match(recoveryScript, /type: "recovery"/);
  assert.match(recoveryScript, /admin-recovery/);
  assert.match(recoveryScript, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("Secondary Admin access returns the assigned app role, not PostgreSQL current_role", () => {
  assert.match(migration, /select access\.admin_role, true/);
  assert.match(accessFixMigration, /select access\.admin_role, true/);
  assert.doesNotMatch(accessFixMigration, /select current_role, current_role is not null/);
});

test("The Super Admin is an Admin-only account and remains unique", () => {
  assert.match(superAdminMigration, /lower\(email\) = 'mdabdullah200211@gmail\.com'/);
  assert.match(superAdminMigration, /role = 'SUPER_ADMIN'/);
  assert.match(superAdminMigration, /is_admin_only = true/);
  assert.match(superAdminMigration, /create unique index if not exists profiles_one_active_super_admin_idx/);
  assert.match(superAdminMigration, /where role = 'SUPER_ADMIN' and status = 'ACTIVE'/);
  assert.match(superAdminMigration, /select access\.admin_role, true/);
});

test("A private Super Admin can be bootstrapped without a public account", () => {
  assert.match(privateSuperAdminMigration, /create table if not exists private\.super_admin_invitations/);
  assert.match(privateSuperAdminMigration, /assigned_role := 'SUPER_ADMIN'/);
  assert.match(privateSuperAdminMigration, /is_admin_only\)/);
  assert.match(privateSuperAdminMigration, /prepare_super_admin_invitation/);
  assert.match(privateSuperAdminMigration, /activate_super_admin_identity/);
  assert.match(privateSuperAdminMigration, /profiles_one_active_super_admin_idx/);
});

test("Secondary Admin email and login state are tracked without storing passwords", () => {
  assert.match(secondaryAdminLoginTrackingMigration, /add column if not exists invitation_sent_at timestamptz/);
  assert.match(secondaryAdminLoginTrackingMigration, /function public\.mark_secondary_admin_invitation_sent/);
  assert.match(secondaryAdminLoginTrackingMigration, /function public\.list_secondary_admin_login_status/);
  assert.match(secondaryAdminLoginTrackingMigration, /PENDING_PASSWORD_SETUP/);
  assert.match(secondaryAdminLoginTrackingMigration, /Supabase Auth stores only a[\s\S]*password hash/);
  assert.doesNotMatch(secondaryAdminLoginTrackingMigration, /add column if not exists password/i);
  assert.match(invitationFunction, /mark_secondary_admin_invitation_sent/);
  assert.match(adminConfig, /mark_secondary_admin_invitation_sent/);
});

test("A Super Admin can create a Secondary Admin login with a temporary password", () => {
  assert.match(adminApp, /Temporary password/);
  assert.match(adminApp, /Confirm temporary password/);
  assert.match(adminApp, /password: form\.password/);
  assert.match(adminApp, /temporary passwords do not match/);
  assert.match(invitationFunction, /admin\.auth\.admin\.createUser/);
  assert.match(invitationFunction, /admin\.auth\.admin\.updateUserById/);
  assert.match(invitationFunction, /email_confirm: true/);
  assert.match(invitationFunction, /password\.length < 12/);
  assert.match(adminConfig, /auth\/v1\/admin\/users/);
  assert.match(adminConfig, /Its password cannot be changed from Admin Management/);
  assert.match(adminConfig, /password\.length < 12/);
  assert.match(adminApp, /import\.meta\.env\.DEV\) return callLocalAdminRpc\("invite_secondary_admin"/);
  assert.match(adminApp, /requireSuperAdmin: !bypassAuth/);
  assert.match(adminConfig, /Only the active Super Admin can create Secondary Admin accounts/);
  assert.match(adminConfig, /auth\/v1\/user/);
  assert.doesNotMatch(invitationFunction, /console\.error\([^)]*password/i);
});

test("Removing an Admin-only Secondary Admin deletes its Supabase identity", () => {
  assert.match(adminApp, /function removeSecondaryAdmin/);
  assert.match(adminApp, /action: "remove", adminAccountId/);
  assert.match(adminApp, /Admin-only Secondary Admin logins are permanently deleted from Supabase/);
  assert.match(invitationFunction, /action === "remove"/);
  assert.match(invitationFunction, /admin\.auth\.admin\.deleteUser/);
  assert.match(invitationFunction, /deleted: "auth_identity"/);
  assert.match(invitationFunction, /deleted: "admin_access"/);
  assert.match(adminConfig, /auth\/v1\/admin\/users\/\$\{encodeURIComponent\(account\.user_id\)\}/);
  assert.match(adminConfig, /deleted: "auth_identity"/);
});

test("Users Admins see only public traveler accounts", () => {
  assert.match(adminApp, /publicProfilesOnly: true/);
  assert.match(adminApp, /request = request\.eq\("is_admin_only", false\)/);
  assert.match(adminApp, /rows\.filter\(\(row\) => !row\.is_admin_only\)/);
  assert.match(usersAdminVisibilityMigration, /drop policy if exists profiles_users_admin_select/);
  assert.match(usersAdminVisibilityMigration, /role = 'TRAVELER'[\s\S]*and not is_admin_only/);
  assert.match(usersAdminVisibilityMigration, /profiles_users_admin_update/);
  assert.match(usersAdminPermissionFixMigration, /public\.can_access_admin_module\('users'\)/);
  assert.doesNotMatch(usersAdminPermissionFixMigration, /private\.current_admin_role/);
  assert.match(secondaryAdminRoleAccessMigration, /grant execute on function private\.current_admin_role\(\) to authenticated, service_role/);
});

test("Every Secondary Admin overview has only its permitted workload count", () => {
  assert.match(adminApp, /label: "Users"[\s\S]*resource: "profiles"/);
  assert.match(adminApp, /label: "Providers"[\s\S]*resource: "providers"/);
  assert.match(adminApp, /label: "Businesses"[\s\S]*resource: "businesses"/);
  assert.match(adminApp, /label: "Subscriptions"[\s\S]*resource: "subscriptions"/);
  assert.match(adminApp, /label: "Bookings"[\s\S]*resource: "bookings"/);
  assert.match(adminApp, /SUMMARY\.filter\(\(item\) => canOpenSection\(item\.resource\)\)/);
});

test("Secondary Admin workspaces use the shared panel while showing complete domain records", () => {
  assert.match(adminApp, /id: "profiles"[\s\S]*columns: \["full_name", "email", "phone", "district", "role", "status", "updated_at"\]/);
  assert.match(adminApp, /id: "businesses"[\s\S]*columns: \["owner_name", "business_name", "district", "contact_email", "contact_phone", "account_status", "public_status"\]/);
  assert.match(adminApp, /id: "business-products"[\s\S]*adminModule: "business"/);
  assert.match(adminApp, /const visibleSidebarResources = SIDEBAR_RESOURCES\.filter\(\(item\) => canOpenSection\(item\.id\)\)/);
});

test("Each operational Admin has an activation tab for only its managed records", () => {
  assert.match(adminApp, /id: "removed-accounts"[\s\S]*adminModule: "users"[\s\S]*activation: true/);
  assert.match(adminApp, /id: "removed-providers"[\s\S]*adminModule: "providers"[\s\S]*accountStatus: "REMOVED"/);
  assert.match(adminApp, /id: "removed-businesses"[\s\S]*adminModule: "business"[\s\S]*accountStatus: "REMOVED"/);
  assert.match(adminApp, /id: "frozen-subscriptions"[\s\S]*adminModule: "subscriptions"[\s\S]*subscriptionStatus: "FROZEN"/);
  assert.match(adminApp, /const visibleActivationResources = RESOURCES\.filter\(\(item\) => item\.activation && canOpenSection\(item\.id\)\)/);
  assert.match(adminApp, /restoring && resource\.table === "profiles"/);
});

test("Admin rendering errors show recovery UI instead of a blank page", () => {
  assert.match(adminEntry, /import AppErrorBoundary from "\.\.\/src\/AppErrorBoundary\.jsx"/);
  assert.match(adminEntry, /<AppErrorBoundary appName="TourismuBD Admin" restartCommand="npm run dev:admin">/);
});
