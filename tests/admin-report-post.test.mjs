import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminApp = readFileSync(new URL("../src/AdminApp.jsx", import.meta.url), "utf8");
const adminConfig = readFileSync(new URL("../vite.admin.config.js", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/077_admin_reported_post_details.sql", import.meta.url), "utf8");
const actionMigration = readFileSync(new URL("../supabase/migrations/078_admin_report_actions.sql", import.meta.url), "utf8");
const reportReasonsMigration = readFileSync(new URL("../supabase/migrations/079_report_reason_categories.sql", import.meta.url), "utf8");
const reportMediaMigration = readFileSync(new URL("../supabase/migrations/080_admin_reported_post_media.sql", import.meta.url), "utf8");
const appJsx = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const reopenReportsMigration = readFileSync(new URL("../supabase/migrations/106_reopen_timeline_reports.sql", import.meta.url), "utf8");

test("Admin Reports identify the reported timeline post and its owner", () => {
  assert.match(adminApp, /"reported_post_owner", "reported_post_owner_id", "reported_post"/);
  assert.match(adminApp, /target\.table === "reports"/);
  assert.match(adminApp, /loadLocalAdminTable\("social_posts"/);
  assert.match(adminApp, /reported_post_owner: post \? owner\?\.full_name \|\| "Unknown member"/);
  assert.match(adminApp, /label="Reported post owner ID" value=\{report\.reported_post_owner_id\}/);
  assert.match(adminApp, /label="Reported post" value=\{report\.reported_post\} wide/);
  assert.match(adminApp, /reported_post_owner_profile: owner/);
  assert.match(adminConfig, /"reports", "social_posts", "admin_actions"/);
  assert.match(migration, /create policy social_posts_super_admin_select/);
  assert.match(migration, /using \(public\.is_super_admin\(\)\)/);
});

test("Updated timeline reports appear first when the Admin returns to Reports", () => {
  assert.match(adminApp, /columns: \["category", "reason_categories", "status", "reported_post_owner", "reported_post_owner_id", "reported_post", "updated_at"\]/);
  assert.match(adminApp, /target\.id === "reports"\) request = request\.order\("updated_at", \{ ascending: false \}\)/);
  assert.match(adminApp, /window\.addEventListener\("focus", refreshReports\)/);
  assert.match(adminApp, /label="Last updated" value=\{report\.updated_at/);
  assert.match(adminConfig, /table === "reports"\) query\.set\("order", "updated_at\.desc"\)/);
});

test("Admin can investigate the reported post owner and take action", () => {
  assert.match(adminApp, /View account details/);
  assert.match(adminApp, /Delete post/);
  assert.match(adminApp, /Remove account/);
  assert.match(adminApp, /Link to timeline post/);
  assert.match(adminApp, /const linkReportedPost/);
  assert.match(adminApp, /social_post_id: postId\.trim\(\)/);
  assert.match(adminApp, /onClick=\{\(\) => onViewProfile\(report\.reported_post_owner_profile\)\}/);
  assert.match(adminApp, /const deleteReportedPost/);
  assert.match(adminApp, /const removeReportedPostOwner/);
  assert.match(adminApp, /function ReportAccountRemovalDialog/);
  assert.match(adminApp, /const \[reportAccountAction, setReportAccountAction\] = useState\(null\)/);
  assert.match(adminApp, /const suspendReportedPostOwner = async \(report\)/);
  assert.match(adminApp, /setReportAccountAction\(report\)/);
  assert.match(adminApp, /status: "SUSPENDED"/);
  assert.match(adminApp, /mutateLocalAdminTable\("reports", "PATCH", "id", report\.id, adminRemovalPatch\("resolve", user\.id\)\)/);
  assert.match(adminApp, /resource.id === "reports"\) return removeReportedPostOwner\(row\)/);
  assert.match(adminApp, /setSection\("removed-accounts"\)/);
  assert.match(adminConfig, /const ADMIN_MUTABLE_TABLES = new Set/);
  assert.match(adminConfig, /"profiles", "providers", "businesses", "business_products", "places"/);
  assert.match(adminConfig, /"reviews", "reports", "social_posts"/);
  assert.match(actionMigration, /create policy social_posts_super_admin_delete/);
  assert.match(actionMigration, /using \(public\.is_super_admin\(\)\)/);
});

test("Admin can open the complete reported timeline post", () => {
  assert.match(adminApp, /function ReportedPostDialog/);
  assert.match(adminApp, /View reported post/);
  assert.match(adminApp, /onClick=\{\(\) => onViewPost\(report\)\}/);
  assert.match(adminApp, /reported_post_record: post \? \{ \.\.\.post, media_url:/);
  assert.match(adminApp, /createSignedUrl\(path, 3600\)/);
  assert.match(adminConfig, /__tourismubd-admin\/post-media/);
  assert.match(reportMediaMigration, /create policy social_posts_super_admin_media_read/);
  assert.match(reportMediaMigration, /bucket_id = 'social-posts'/);
});

test("Admin can see every reason selected for a timeline report", () => {
  assert.match(adminApp, /"category", "reason_categories", "status", "reported_post_owner"/);
  assert.match(adminApp, /function reportReasons\(report\)/);
  assert.match(adminApp, /const selectedReasons = reportReasons\(report\)/);
  assert.match(adminApp, /type="checkbox" checked readOnly/);
  assert.match(adminApp, /submitted before reason selection was added/);
  assert.match(reportReasonsMigration, /add column if not exists reason_categories text\[\]/);
  assert.match(reportReasonsMigration, /Spam or scam/);
  assert.match(reportReasonsMigration, /Other inappropriate content/);
});

test("Reported post removal goes to Activate accounts and Block goes to Blocked accounts", () => {
  // Remove from active use button on report row and modal
  assert.match(adminApp, /title=\{self \? "You cannot suspend yourself" : "Remove from active use"\}/);
  assert.match(adminApp, /title="Remove from active use" onClick=\{\(\) => onRemoveAccount\(report, "account"\)\}/);
  assert.match(adminApp, /setSection\("removed-accounts"\)/);
  // Activate accounts has Block button that transitions to Blocked accounts
  assert.match(adminApp, /resource\.activation \? <button className="danger ops-block-button" onClick=\{\(\) => blockAccount\(row\)\}/);
  assert.match(adminApp, /const blockAccount = \(row\) => \{/);
  assert.match(adminApp, /isExplicitBlock[\s\S]*setSection\("blocked-accounts"\)/);
  // Activate accounts must display all suspended roles, not only travelers
  assert.doesNotMatch(adminApp, /id: "removed-accounts"[\s\S]*?profileRole:\s*"TRAVELER"/);
  assert.match(adminApp, /eq\("user_id", report\.reported_post_owner_id\)/);
  assert.match(adminApp, /table === "profiles" && \(row\.is_admin_only \|\| \(!adminIsSuper && row\.role !== "TRAVELER"\)/);
  // Resolved reports are removed from default Reports list and removed accounts sort newest first
  assert.match(adminApp, /const \[reportStatusFilter, setReportStatusFilter\] = useState\("OPEN"\)/);
  assert.match(adminApp, /target\.id === "removed-accounts"/);
});

test("Reports submitted by any account against timeline posts show in admin panel report tab", () => {
  // App submits OPEN status and reopens resolved reports if filed again
  assert.match(appJsx, /const reportPayload = \{ created_by: user\.id, category: "OTHER", reason_categories: reasons, details: objection, social_post_id: post\.id, status: "OPEN" \};/);
  assert.match(appJsx, /const reopenPayload = \{[\s\S]*status: "OPEN"[\s\S]*admin_note: null/);
  // Database migration allows members of any role to report and reopen, and lets admins view timeline reports
  assert.match(reopenReportsMigration, /function private\.can_report_social_post/);
  assert.match(reopenReportsMigration, /create policy reports_owner_insert on public\.reports for insert/);
  assert.match(reopenReportsMigration, /create policy reports_owner_update on public\.reports for update/);
  assert.match(reopenReportsMigration, /create unique index if not exists reports_social_post_reporter_idx[\s\S]*where social_post_id is not null and status = 'OPEN'/);
  assert.match(reopenReportsMigration, /function public\.can_view_report/);
  assert.match(reopenReportsMigration, /report_social_post_id is not null then true/);
  // Admin panel includes timeline post reports regardless of post author role and listens to realtime changes
  assert.match(adminApp, /if \(report\.social_post_id\) return true;/);
  assert.match(adminApp, /channel\("admin-reports-live"\)/);
  assert.match(adminApp, /on\("postgres_changes", \{ event: "\*", schema: "public", table: "reports" \}/);
});

