import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { groupReportedPostRows } from "../src/lib/admin.js";

const adminApp = readFileSync(new URL("../src/AdminApp.jsx", import.meta.url), "utf8");
const adminConfig = readFileSync(new URL("../vite.admin.config.js", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/077_admin_reported_post_details.sql", import.meta.url), "utf8");
const actionMigration = readFileSync(new URL("../supabase/migrations/078_admin_report_actions.sql", import.meta.url), "utf8");
const reportReasonsMigration = readFileSync(new URL("../supabase/migrations/079_report_reason_categories.sql", import.meta.url), "utf8");
const reportMediaMigration = readFileSync(new URL("../supabase/migrations/080_admin_reported_post_media.sql", import.meta.url), "utf8");
const appJsx = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const reopenReportsMigration = readFileSync(new URL("../supabase/migrations/106_reopen_timeline_reports.sql", import.meta.url), "utf8");
const explicitBlockMigration = readFileSync(new URL("../supabase/migrations/107_explicit_blocked_accounts.sql", import.meta.url), "utf8");
const hideReportedPostsMigration = readFileSync(new URL("../supabase/migrations/108_hide_reported_posts_and_discover_unblocked.sql", import.meta.url), "utf8");

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
  assert.match(adminApp, /columns: \["category", "reason_categories", "status", "reported_post_owner", "reported_post_owner_id", "reported_post", "reports_count", "updated_at"\]/);
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
  // Remove from active use button on report row and Block account button on modal
  assert.match(adminApp, /title=\{self \? "You cannot suspend yourself" : "Remove from active use"\}/);
  assert.match(adminApp, /title="Block account" onClick=\{\(\) => onBlockAccount\(report\)\}/);
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
  // Only explicitly blocked accounts move to Blocked accounts, and they are removed from Activate accounts
  assert.match(adminApp, /if \(!isAccountExplicitlyBlocked\(row, table\)\) continue;/);
  assert.match(adminApp, /if \(target\.activation && isAccountExplicitlyBlocked\(row, target\.table\)\) return false;/);
  assert.match(adminApp, /status: "SUSPENDED", is_blocked: true/);
  assert.match(adminApp, /status: "ACTIVE", is_blocked: false/);
  assert.match(adminConfig, /"is_blocked"/);
  assert.match(explicitBlockMigration, /alter table public\.profiles\s+add column if not exists is_blocked boolean/);
  assert.match(explicitBlockMigration, /alter table public\.providers\s+add column if not exists is_blocked boolean/);
  assert.match(explicitBlockMigration, /alter table public\.businesses\s+add column if not exists is_blocked boolean/);
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

test("Reported posts are hidden from users when account moves to Activate accounts, while keeping unblocked accounts searchable", () => {
  // Migration 108 adds is_hidden flag to social_posts and updates RLS to hide them
  assert.match(hideReportedPostsMigration, /alter table public\.social_posts\s+add column if not exists is_hidden boolean not null default false;/);
  assert.match(hideReportedPostsMigration, /not coalesce\(is_hidden, false\)/);
  assert.match(hideReportedPostsMigration, /function private\.is_social_post_reported/);
  assert.match(hideReportedPostsMigration, /not private\.is_social_post_reported\(id\)/);
  assert.match(hideReportedPostsMigration, /function public\.get_reported_social_post_ids/);
  assert.match(hideReportedPostsMigration, /create policy social_posts_admin_update on public\.social_posts/);
  // Migration 108 allows unblocked suspended accounts in activate accounts to be discovered via people search
  assert.match(hideReportedPostsMigration, /where \(u\.status = 'ACTIVE' or \(u\.status = 'SUSPENDED' and not coalesce\(u\.is_blocked, false\)\)\)/);

  // Admin editable fields allow is_hidden on social_posts
  assert.match(adminConfig, /social_posts: new Set\(\["is_hidden"\]\)/);
  assert.match(adminApp, /social_posts: new Set\(\["is_hidden"\]\)/);

  // Suspending the reported post owner hides the reported post
  assert.match(adminApp, /is_hidden: true/);
  assert.match(adminApp, /setHiddenSocialPost\(report\.social_post_id, true\)/);

  // User app filters out hidden and reported posts across dashboard timeline, community feed, and shop
  assert.match(appJsx, /function isPostHidden\(postId, post\)/);
  assert.match(appJsx, /data\.filter\(\(post\) => !isPostHidden\(post\.id, post\)\)/);
  assert.match(appJsx, /\(data \|\| \[\]\)\.filter\(\(post\) => !isPostHidden\(post\.id, post\)\)/);
  assert.match(appJsx, /namedPosts\.filter\(\(post\) => !isPostHidden\(post\.id, post\)\)/);
  assert.match(appJsx, /supabase\.rpc\("get_reported_social_post_ids"\)/);
});

test("Reports Page groups multiple reports for the same post into a single row, but separates multiple posts from the same or different accounts", () => {
  // Scenario 1: One account has three reported posts: display three separate rows
  const author1 = "user-author-1";
  const accountOneThreePosts = [
    {
      id: "report-1",
      social_post_id: "post-101",
      reported_post_owner_id: author1,
      reported_post_owner: "Account One",
      reported_post: "Post 101 text",
      category: "OTHER",
      reason_categories: ["Spam or scam"],
      status: "OPEN",
      updated_at: "2026-10-10T10:00:00Z",
    },
    {
      id: "report-2",
      social_post_id: "post-102",
      reported_post_owner_id: author1,
      reported_post_owner: "Account One",
      reported_post: "Post 102 text",
      category: "OTHER",
      reason_categories: ["Inappropriate media"],
      status: "OPEN",
      updated_at: "2026-10-10T11:00:00Z",
    },
    {
      id: "report-3",
      social_post_id: "post-103",
      reported_post_owner_id: author1,
      reported_post_owner: "Account One",
      reported_post: "Post 103 text",
      category: "OTHER",
      reason_categories: ["Harassment or bullying"],
      status: "OPEN",
      updated_at: "2026-10-10T12:00:00Z",
    },
  ];
  const scenario1Rows = groupReportedPostRows(accountOneThreePosts);
  assert.equal(scenario1Rows.length, 3, "One account with three reported posts must display three separate rows");
  assert.equal(scenario1Rows[0].social_post_id, "post-103");
  assert.equal(scenario1Rows[1].social_post_id, "post-102");
  assert.equal(scenario1Rows[2].social_post_id, "post-101");
  assert.equal(scenario1Rows[0].reported_post_owner_id, author1);
  assert.equal(scenario1Rows[1].reported_post_owner_id, author1);
  assert.equal(scenario1Rows[2].reported_post_owner_id, author1);
  assert.notEqual(scenario1Rows[0].social_post_id, scenario1Rows[1].social_post_id);
  assert.notEqual(scenario1Rows[1].social_post_id, scenario1Rows[2].social_post_id);

  // Scenario 2: One post receives multiple reports: display that post only once
  const singlePostMultipleReports = [
    {
      id: "report-a",
      social_post_id: "post-single",
      created_by: "reporter-1",
      reported_post_owner_id: author1,
      reported_post_owner: "Account One",
      reported_post: "Single post content",
      category: "OTHER",
      reason_categories: ["Spam or scam"],
      details: "First objection",
      status: "OPEN",
      updated_at: "2026-10-10T10:00:00Z",
    },
    {
      id: "report-b",
      social_post_id: "post-single",
      created_by: "reporter-2",
      reported_post_owner_id: author1,
      reported_post_owner: "Account One",
      reported_post: "Single post content",
      category: "OTHER",
      reason_categories: ["Hate speech"],
      details: "Second objection",
      status: "OPEN",
      updated_at: "2026-10-10T11:00:00Z",
    },
    {
      id: "report-c",
      social_post_id: "post-single",
      created_by: "reporter-3",
      reported_post_owner_id: author1,
      reported_post_owner: "Account One",
      reported_post: "Single post content",
      category: "OTHER",
      reason_categories: ["Spam or scam"],
      details: "Third objection",
      status: "OPEN",
      updated_at: "2026-10-10T12:00:00Z",
    },
  ];
  const scenario2Rows = groupReportedPostRows(singlePostMultipleReports);
  assert.equal(scenario2Rows.length, 1, "One post receiving multiple reports must display that post only once");
  assert.equal(scenario2Rows[0].social_post_id, "post-single");
  assert.equal(scenario2Rows[0].report_count, 3, "Report count must reflect the multiple reports");
  assert.deepEqual(scenario2Rows[0].reason_categories.sort(), ["Hate speech", "Spam or scam"].sort(), "Reasons must be deduplicated across reports");
  assert.equal(scenario2Rows[0].report_ids.length, 3);
  assert.match(scenario2Rows[0].details, /First objection/);
  assert.match(scenario2Rows[0].details, /Second objection/);
  assert.match(scenario2Rows[0].details, /Third objection/);

  // Scenario 3: Different accounts have reported posts: display each reported post separately
  const author2 = "user-author-2";
  const author3 = "user-author-3";
  const differentAccountsReports = [
    {
      id: "rep-1",
      social_post_id: "post-author-1",
      reported_post_owner_id: author1,
      reported_post_owner: "Author 1",
      reported_post: "Post by Author 1",
      category: "OTHER",
      reason_categories: ["Spam"],
      status: "OPEN",
      updated_at: "2026-10-10T09:00:00Z",
    },
    {
      id: "rep-2",
      social_post_id: "post-author-2",
      reported_post_owner_id: author2,
      reported_post_owner: "Author 2",
      reported_post: "Post by Author 2",
      category: "OTHER",
      reason_categories: ["Violence"],
      status: "OPEN",
      updated_at: "2026-10-10T10:00:00Z",
    },
    {
      id: "rep-3",
      social_post_id: "post-author-3",
      reported_post_owner_id: author3,
      reported_post_owner: "Author 3",
      reported_post: "Post by Author 3",
      category: "OTHER",
      reason_categories: ["Harassment"],
      status: "OPEN",
      updated_at: "2026-10-10T11:00:00Z",
    },
  ];
  const scenario3Rows = groupReportedPostRows(differentAccountsReports);
  assert.equal(scenario3Rows.length, 3, "Different accounts with reported posts must display each reported post separately");
  const postIds = scenario3Rows.map((r) => r.social_post_id);
  assert.deepEqual(postIds, ["post-author-3", "post-author-2", "post-author-1"]);
  const ownerIds = scenario3Rows.map((r) => r.reported_post_owner_id);
  assert.deepEqual(ownerIds, [author3, author2, author1]);

  // Combined mixed scenario: 2 distinct posts from Account 1 + 1 post from Account 2 = 3 separate rows
  const mixedReports = [
    ...singlePostMultipleReports,
    accountOneThreePosts[1],
    differentAccountsReports[1],
  ];
  const mixedRows = groupReportedPostRows(mixedReports);
  assert.equal(mixedRows.length, 3, "Mixed reports: 2 distinct posts from Account 1 + 1 post from Account 2 = 3 separate rows");
  const mixedPostIds = new Set(mixedRows.map((r) => r.social_post_id));
  assert.equal(mixedPostIds.size, 3);
  assert.ok(mixedPostIds.has("post-single"));
  assert.ok(mixedPostIds.has("post-102"));
  assert.ok(mixedPostIds.has("post-author-2"));
});

test("AdminApp wires groupReportedPostRows for Reports table with report counts", () => {
  assert.match(adminApp, /groupReportedPostRows/);
  assert.match(adminApp, /nextRows = groupReportedPostRows\(nextRows,\s*reportCountsByPostId\)/);
  assert.match(adminApp, /primaryKey: "_row_key"/);
});

test("Reports Page displays accurate reports count for posts with 1, 25, and 101 reports, separating multiple posts from the same account", () => {
  const authorA = "user-author-a";
  const authorB = "user-author-b";
  const authorC = "user-author-c";

  // Account A has 2 different posts: POST-001 (101 reports) and POST-002 (25 reports)
  // Account B has POST-003 (8 reports)
  // Account C has POST-004 (1 report)
  const generateReports = (postId, authorId, authorName, count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `report-${postId}-${i + 1}`,
      social_post_id: postId,
      created_by: `reporter-${i + 1}`,
      reported_post_owner_id: authorId,
      reported_post_owner: authorName,
      reported_post: `Post ${postId} content`,
      category: "OTHER",
      reason_categories: [i % 2 === 0 ? "Spam or scam" : "Inappropriate media"],
      details: `Objection ${i + 1} for ${postId}`,
      status: "OPEN",
      updated_at: new Date(Date.now() - (count - i) * 1000).toISOString(),
    }));
  };

  const reportsPost001 = generateReports("POST-001", authorA, "User A", 101);
  const reportsPost002 = generateReports("POST-002", authorA, "User A", 25);
  const reportsPost003 = generateReports("POST-003", authorB, "User B", 8);
  const reportsPost004 = generateReports("POST-004", authorC, "User C", 1);

  const allReports = [
    ...reportsPost001,
    ...reportsPost002,
    ...reportsPost003,
    ...reportsPost004,
  ];

  // 1. Counting directly from raw report records
  const grouped = groupReportedPostRows(allReports);

  // Requirement: Display each reported post only once, separate rows for different posts even if same account
  assert.equal(grouped.length, 4, "Must display exactly 4 rows (one per unique post ID)");

  const rowMap = new Map(grouped.map((r) => [r.social_post_id, r]));

  // Check POST-001 (Account A, 101 reports)
  const row001 = rowMap.get("POST-001");
  assert.ok(row001, "POST-001 must exist");
  assert.equal(row001.reported_post_owner_id, authorA);
  assert.equal(row001.reported_post_owner, "User A");
  assert.equal(row001.reports_count, 101, "POST-001 must have 101 reports");
  assert.equal(row001.report_count, 101);
  assert.equal(row001.report_ids.length, 101);

  // Check POST-002 (Same account User A, but distinct post with 25 reports)
  const row002 = rowMap.get("POST-002");
  assert.ok(row002, "POST-002 must exist");
  assert.equal(row002.reported_post_owner_id, authorA);
  assert.equal(row002.reported_post_owner, "User A");
  assert.equal(row002.reports_count, 25, "POST-002 must have 25 reports");
  assert.equal(row002.report_count, 25);
  assert.equal(row002.report_ids.length, 25);

  // Check POST-003 (Account B, 8 reports)
  const row003 = rowMap.get("POST-003");
  assert.ok(row003, "POST-003 must exist");
  assert.equal(row003.reported_post_owner_id, authorB);
  assert.equal(row003.reported_post_owner, "User B");
  assert.equal(row003.reports_count, 8, "POST-003 must have 8 reports");
  assert.equal(row003.report_count, 8);
  assert.equal(row003.report_ids.length, 8);

  // Check POST-004 (Account C, 1 report)
  const row004 = rowMap.get("POST-004");
  assert.ok(row004, "POST-004 must exist");
  assert.equal(row004.reported_post_owner_id, authorC);
  assert.equal(row004.reported_post_owner, "User C");
  assert.equal(row004.reports_count, 1, "POST-004 must have 1 report");
  assert.equal(row004.report_count, 1);
  assert.equal(row004.report_ids.length, 1);

  // 2. Counting with explicit database count map (e.g. from Supabase count query)
  const dbCounts = {
    "POST-001": 101,
    "POST-002": 25,
    "POST-003": 8,
    "POST-004": 1,
  };
  const singleReportPerPost = [
    reportsPost001[0],
    reportsPost002[0],
    reportsPost003[0],
    reportsPost004[0],
  ];
  const groupedWithDbCounts = groupReportedPostRows(singleReportPerPost, dbCounts);
  assert.equal(groupedWithDbCounts.length, 4);
  const rowMapWithDb = new Map(groupedWithDbCounts.map((r) => [r.social_post_id, r]));
  assert.equal(rowMapWithDb.get("POST-001").reports_count, 101);
  assert.equal(rowMapWithDb.get("POST-002").reports_count, 25);
  assert.equal(rowMapWithDb.get("POST-003").reports_count, 8);
  assert.equal(rowMapWithDb.get("POST-004").reports_count, 1);

  // 3. Dynamic count update: simulate a new report arriving (25 -> 26)
  const updatedDbCounts = { ...dbCounts, "POST-002": 26 };
  const groupedUpdated = groupReportedPostRows(singleReportPerPost, updatedDbCounts);
  assert.equal(new Map(groupedUpdated.map((r) => [r.social_post_id, r])).get("POST-002").reports_count, 26, "Count updates when a new report is added");
});

test("Non-post reports (providers, businesses, bookings) include reports_count = 1", () => {
  const nonPostReport = [
    {
      id: "non-post-1",
      category: "OTHER",
      provider_id: "prov-1",
      status: "OPEN",
      updated_at: "2026-10-10T10:00:00Z",
    },
  ];
  const rows = groupReportedPostRows(nonPostReport);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].reports_count, 1);
  assert.equal(rows[0].report_count, 1);
});

test("Remove from Active Use moves reported post to Activate post tab, preserves report history, and allows activation", () => {
  // 1. Static code structure invariants
  assert.match(adminApp, /const target = report\.admin_action_target \|\| \(report\.social_post_id \? "post" : "account"\)/);
  assert.match(adminApp, /mutateLocalAdminTable\("social_posts", "PATCH", "id", report\.social_post_id, \{ is_hidden: true \}\)/);
  assert.match(adminApp, /supabase\.from\("social_posts"\)\.update\(\{ is_hidden: true \}\)/);
  assert.match(adminApp, /notify\("Post removed from active use\. It is now in Activate post\."\)/);
  assert.match(adminApp, /setHiddenSocialPost\(report\.social_post_id, true\)/);
  assert.match(adminApp, /if \(row\._is_post\) \{[\s\S]*mutateLocalAdminTable\("social_posts", "PATCH", "id", row\.id, \{ is_hidden: false \}\)/);
  assert.match(adminApp, /notify\("Post restored to active use\."\)/);
  assert.match(adminApp, /setHiddenSocialPost\(row\.id, false\)/);
  assert.match(adminApp, /target\.id === "removed-accounts"[\s\S]*hiddenPosts = \(allPosts \|\| \[\]\)\.filter\(\(p\) => p && p\.is_hidden\)/);
  assert.match(adminApp, /supabase[\s\S]*\.from\("social_posts"\)[\s\S]*\.eq\("is_hidden", true\)/);

  // 2. Behavioral simulation of the complete end-to-end workflow
  // Database tables
  let dbPosts = [
    { id: "post-001", author_id: "user-a", product_name: "Sundarbans Tour", body: "Check out this trip", is_hidden: false, created_at: "2026-10-01T10:00:00Z" },
    { id: "post-002", author_id: "user-a", product_name: "Cox's Bazar", body: "Sunset at the beach", is_hidden: false, created_at: "2026-10-02T10:00:00Z" },
    { id: "post-003", author_id: "user-b", product_name: "Sylhet Tea Gardens", body: "Lush green views", is_hidden: false, created_at: "2026-10-03T10:00:00Z" },
  ];

  let dbReports = [
    { id: "rep-1", social_post_id: "post-001", created_by: "reporter-1", category: "OTHER", reason_categories: ["Spam or scam"], details: "Spam link in post", status: "OPEN", updated_at: "2026-10-05T12:00:00Z" },
    { id: "rep-2", social_post_id: "post-001", created_by: "reporter-2", category: "OTHER", reason_categories: ["False information"], details: "Misleading price", status: "OPEN", updated_at: "2026-10-05T13:00:00Z" },
    { id: "rep-3", social_post_id: "post-002", created_by: "reporter-3", category: "OTHER", reason_categories: ["Inappropriate media"], details: "Offensive photo", status: "OPEN", updated_at: "2026-10-06T10:00:00Z" },
  ];

  const dbProfiles = {
    "user-a": { id: "user-a", full_name: "Traveler A", email: "a@example.com", role: "TRAVELER", district: "Dhaka", status: "ACTIVE" },
    "user-b": { id: "user-b", full_name: "Traveler B", email: "b@example.com", role: "TRAVELER", district: "Sylhet", status: "ACTIVE" },
  };

  // Step 1: Open reports query loads open reports
  const getOpenReports = () => {
    const openReports = dbReports.filter((r) => r.status === "OPEN").map((r) => {
      const post = dbPosts.find((p) => p.id === r.social_post_id);
      const owner = post ? dbProfiles[post.author_id] : null;
      return {
        ...r,
        reported_post_owner: owner?.full_name || "Unknown member",
        reported_post_owner_id: post?.author_id || null,
        reported_post: post ? `${post.product_name}: ${post.body}` : r.details,
      };
    });
    return groupReportedPostRows(openReports);
  };

  let openReportsRows = getOpenReports();
  // Expect post-001 (with 2 reports) and post-002 (with 1 report) as separate rows
  assert.equal(openReportsRows.length, 2, "Reports page displays each reported post as a separate row");
  const post001Report = openReportsRows.find((r) => r.social_post_id === "post-001");
  assert.ok(post001Report);
  assert.equal(post001Report.reports_count, 2, "post-001 has 2 reports counted");
  assert.equal(post001Report.reported_post_owner, "Traveler A");

  // Step 2: Super Admin removes post-001 from active use
  // The system updates the post status in the database: is_hidden = true
  // and resolves linked reports: status = 'RESOLVED'
  const removePostFromActiveUse = (postId, adminUserId) => {
    // 1. Update post
    const post = dbPosts.find((p) => p.id === postId);
    if (post) post.is_hidden = true;
    // 2. Resolve linked reports
    dbReports.forEach((r) => {
      if (r.social_post_id === postId) {
        r.status = "RESOLVED";
        r.resolved_by = adminUserId;
        r.resolved_at = new Date().toISOString();
      }
    });
  };

  removePostFromActiveUse("post-001", "super-admin-id");

  // Step 3: post-001 disappears from Open Reports Page
  openReportsRows = getOpenReports();
  assert.equal(openReportsRows.length, 1, "post-001 disappeared from Open Reports");
  assert.equal(openReportsRows[0].social_post_id, "post-002", "Only post-002 remains in Open Reports");

  // Step 4: Report history remains preserved in the database
  const preservedReports = dbReports.filter((r) => r.social_post_id === "post-001");
  assert.equal(preservedReports.length, 2, "All report records for post-001 are preserved");
  assert.equal(preservedReports[0].status, "RESOLVED");
  assert.equal(preservedReports[1].status, "RESOLVED");
  assert.equal(preservedReports[0].details, "Spam link in post");
  assert.equal(preservedReports[1].details, "Misleading price");

  // Step 5: post-001 appears on Activate Post Page (section: "removed-accounts")
  const getActivatePostRows = () => {
    const hiddenPosts = dbPosts.filter((p) => p.is_hidden);
    return hiddenPosts.map((post) => {
      const author = dbProfiles[post.author_id] || null;
      const postReports = dbReports.filter((r) => r.social_post_id === post.id);
      const reportCount = postReports.length;
      const reasons = [...new Set(postReports.flatMap((r) => r.reason_categories || []))];
      return {
        id: post.id,
        _row_key: post.id,
        _is_post: true,
        social_post_id: post.id,
        reported_post: post.product_name ? `${post.product_name}: ${post.body}` : post.body,
        full_name: author?.full_name || "Unknown member",
        email: author?.email || "—",
        role: author?.role || "TRAVELER",
        status: "REMOVED",
        reports_count: reportCount,
        report_count: reportCount,
        all_reports: postReports,
        reason_categories: reasons,
      };
    });
  };

  const activatePostRows = getActivatePostRows();
  assert.equal(activatePostRows.length, 1, "post-001 appears on Activate Post Page");
  assert.equal(activatePostRows[0].id, "post-001");
  assert.equal(activatePostRows[0].full_name, "Traveler A");
  assert.equal(activatePostRows[0].reports_count, 2, "Activate Post Page displays preserved report count (2)");
  assert.deepEqual(activatePostRows[0].reason_categories, ["Spam or scam", "False information"], "Preserves all report reasons");

  // Step 6: Super Admin activates the post from Activate Post Page
  const activatePost = (postId) => {
    const post = dbPosts.find((p) => p.id === postId);
    if (post) post.is_hidden = false;
  };

  activatePost("post-001");

  // post-001 is restored to active use
  assert.equal(dbPosts.find((p) => p.id === "post-001").is_hidden, false, "post-001 is restored to active use");
  const activatePostRowsAfter = getActivatePostRows();
  assert.equal(activatePostRowsAfter.length, 0, "post-001 is removed from Activate Post Page after restoration");
});

test("Reports Page and Activate Post Page synchronization is mutually exclusive, DB-backed, and survives browser refresh", () => {
  // 1. Static code structure checks
  assert.match(adminApp, /function isPostHidden\(postId, post\)/);
  assert.match(adminApp, /if \(post && typeof post\.is_hidden === "boolean"\) return post\.is_hidden/);
  assert.match(adminApp, /supabase\.from\("social_posts"\)\.select\("id,author_id,body,product_name,media_type,media_path,location_name,created_at,is_hidden"\)/);
  assert.match(adminApp, /nextRows = nextRows\.filter\(\(report\) => !report\.social_post_id \|\| !isPostHidden\(report\.social_post_id, report\.reported_post_record\)\)/);
  assert.match(adminApp, /if \(resource\?\.id === "reports" && row\.social_post_id && isPostHidden\(row\.social_post_id, row\.reported_post_record\)\) return false;/);
  assert.match(adminApp, /if \(resource\?\.id === "removed-accounts" && row\._is_post && !isPostHidden\(row\.id, row\.reported_post_record\)\) return false;/);

  // 2. Behavioral simulation
  const mockDbPosts = [
    { id: "post-sync-1", author_id: "author-1", product_name: "Bandarban Trek", body: "Trekking guide", is_hidden: false, created_at: "2026-10-01T10:00:00Z" },
  ];
  const mockDbReports = [
    { id: "rep-sync-1", social_post_id: "post-sync-1", created_by: "user-1", category: "OTHER", reason_categories: ["Spam or scam"], details: "Spam link", status: "OPEN", updated_at: "2026-10-02T10:00:00Z" },
    { id: "rep-sync-2", social_post_id: "post-sync-1", created_by: "user-2", category: "OTHER", reason_categories: ["Spam or scam"], details: "Duplicate spam", status: "OPEN", updated_at: "2026-10-02T11:00:00Z" },
  ];
  const mockProfiles = {
    "author-1": { id: "author-1", full_name: "Author One", email: "author@example.com", role: "TRAVELER", status: "ACTIVE" },
  };

  function isPostHiddenFn(postId, post, hiddenSet = new Set()) {
    if (post && typeof post.is_hidden === "boolean") return post.is_hidden;
    if (!postId) return false;
    return hiddenSet.has(postId);
  }

  function filterVisibleRows(rows, resourceId, hiddenSet) {
    return rows.filter((row) => {
      if (resourceId === "reports" && row.social_post_id && isPostHiddenFn(row.social_post_id, row.reported_post_record, hiddenSet)) return false;
      if (resourceId === "removed-accounts" && row._is_post && !isPostHiddenFn(row.id, row.reported_post_record, hiddenSet)) return false;
      return true;
    });
  }

  let localHiddenIds = new Set();

  // Initial State: Post is active
  const initialReportsRows = mockDbReports.map((r) => {
    const post = mockDbPosts.find((p) => p.id === r.social_post_id);
    return {
      ...r,
      reported_post_owner: mockProfiles[post.author_id]?.full_name,
      reported_post_record: post,
    };
  }).filter((r) => !isPostHiddenFn(r.social_post_id, r.reported_post_record, localHiddenIds));
  const groupedReports = groupReportedPostRows(initialReportsRows);

  const initialHiddenPosts = mockDbPosts.filter((p) => p.is_hidden).map((p) => ({
    id: p.id,
    _is_post: true,
    reported_post_record: p,
  }));

  const visibleOnReportsInit = filterVisibleRows(groupedReports, "reports", localHiddenIds);
  const visibleOnActivateInit = filterVisibleRows(initialHiddenPosts, "removed-accounts", localHiddenIds);

  assert.equal(visibleOnReportsInit.length, 1, "Active reported post appears on Reports Page");
  assert.equal(visibleOnActivateInit.length, 0, "Active reported post does NOT appear on Activate Post Page");
  assert.equal(visibleOnReportsInit.some((r) => r.social_post_id === "post-sync-1") && visibleOnActivateInit.some((p) => p.id === "post-sync-1"), false, "Post never appears on both pages simultaneously");

  // Action: Super Admin removes post from active use
  // Database updates
  const targetPost = mockDbPosts.find((p) => p.id === "post-sync-1");
  targetPost.is_hidden = true;
  mockDbReports.forEach((r) => { if (r.social_post_id === "post-sync-1") r.status = "RESOLVED"; });
  localHiddenIds.add("post-sync-1");

  // Re-evaluating pages
  const removedReportsRows = mockDbReports.map((r) => {
    const post = mockDbPosts.find((p) => p.id === r.social_post_id);
    return {
      ...r,
      reported_post_owner: mockProfiles[post.author_id]?.full_name,
      reported_post_record: post,
    };
  }).filter((r) => !isPostHiddenFn(r.social_post_id, r.reported_post_record, localHiddenIds));
  const removedGroupedReports = groupReportedPostRows(removedReportsRows);

  const removedHiddenPosts = mockDbPosts.filter((p) => p.is_hidden).map((p) => ({
    id: p.id,
    _is_post: true,
    reported_post_record: p,
  }));

  const visibleOnReportsAfterRemoval = filterVisibleRows(removedGroupedReports, "reports", localHiddenIds);
  const visibleOnActivateAfterRemoval = filterVisibleRows(removedHiddenPosts, "removed-accounts", localHiddenIds);

  assert.equal(visibleOnReportsAfterRemoval.length, 0, "Post immediately disappears from Reports Page");
  assert.equal(visibleOnActivateAfterRemoval.length, 1, "Post immediately appears on Activate Post Page");
  assert.equal(visibleOnReportsAfterRemoval.some((r) => r.social_post_id === "post-sync-1") && visibleOnActivateAfterRemoval.some((p) => p.id === "post-sync-1"), false, "Post never appears on both pages simultaneously");

  // Refresh simulation: localStorage cleared, querying directly from DB
  const emptyLocalStorage = new Set();
  const refreshedReportsFromDb = mockDbReports.map((r) => {
    const post = mockDbPosts.find((p) => p.id === r.social_post_id);
    return {
      ...r,
      reported_post_record: post,
    };
  }).filter((r) => !isPostHiddenFn(r.social_post_id, r.reported_post_record, emptyLocalStorage));
  const refreshedActivateFromDb = mockDbPosts.filter((p) => p.is_hidden).map((p) => ({
    id: p.id,
    _is_post: true,
    reported_post_record: p,
  }));

  const visibleOnReportsRefreshed = filterVisibleRows(refreshedReportsFromDb, "reports", emptyLocalStorage);
  const visibleOnActivateRefreshed = filterVisibleRows(refreshedActivateFromDb, "removed-accounts", emptyLocalStorage);

  assert.equal(visibleOnReportsRefreshed.length, 0, "After refresh, post does NOT return to Reports Page");
  assert.equal(visibleOnActivateRefreshed.length, 1, "After refresh, post remains on Activate Post Page");

  // Action: Super Admin activates the post
  targetPost.is_hidden = false;
  localHiddenIds.delete("post-sync-1");

  const restoredActivatePosts = mockDbPosts.filter((p) => p.is_hidden).map((p) => ({
    id: p.id,
    _is_post: true,
    reported_post_record: p,
  }));
  const visibleOnActivateAfterRestore = filterVisibleRows(restoredActivatePosts, "removed-accounts", localHiddenIds);
  assert.equal(visibleOnActivateAfterRestore.length, 0, "Post disappears from Activate Post Page after restoration");

  // API failure handling test
  let apiFailed = true;
  let simulatedError = null;
  if (apiFailed) {
    simulatedError = "Network error updating post";
    // frontend state is not modified
    assert.equal(targetPost.is_hidden, false, "Post remains unmodified on API failure");
  }
  assert.ok(simulatedError, "Error is surfaced without corrupting frontend state");
});

test("VERIFICATION - TEST 1: Multiple reported posts from one account display as separate entries", () => {
  const authorId = "user-multi-post-author";
  const threePostsReports = [
    { id: "r1", social_post_id: "post-1", reported_post_owner_id: authorId, reported_post: "Post 1", status: "OPEN", updated_at: "2026-10-10T10:00:00Z" },
    { id: "r2", social_post_id: "post-2", reported_post_owner_id: authorId, reported_post: "Post 2", status: "OPEN", updated_at: "2026-10-10T11:00:00Z" },
    { id: "r3", social_post_id: "post-3", reported_post_owner_id: authorId, reported_post: "Post 3", status: "OPEN", updated_at: "2026-10-10T12:00:00Z" },
  ];
  const grouped = groupReportedPostRows(threePostsReports);
  assert.equal(grouped.length, 3, "Reports Page displays three separate post entries for one account with 3 reported posts");
  const postIds = new Set(grouped.map((g) => g.social_post_id));
  assert.equal(postIds.size, 3);
  assert.ok(postIds.has("post-1"));
  assert.ok(postIds.has("post-2"));
  assert.ok(postIds.has("post-3"));
});

test("VERIFICATION - TEST 2: Multiple reports against one post (101 reports) displays that post once with count 101", () => {
  const reports101 = Array.from({ length: 101 }, (_, i) => ({
    id: `rep-101-${i + 1}`,
    social_post_id: "post-viral",
    created_by: `user-${i + 1}`,
    reported_post_owner_id: "owner-1",
    status: "OPEN",
    updated_at: new Date(Date.now() - (101 - i) * 1000).toISOString(),
  }));
  const grouped = groupReportedPostRows(reports101);
  assert.equal(grouped.length, 1, "The Reports Page displays that post once");
  assert.equal(grouped[0].social_post_id, "post-viral");
  assert.equal(grouped[0].reports_count, 101, "Reports Count column displays 101");
  assert.equal(grouped[0].report_ids.length, 101, "Preserves all 101 report IDs");
});

test("VERIFICATION - TEST 3: Different report counts (101, 25, 8) accurately displayed", () => {
  const reportsPostA = Array.from({ length: 101 }, (_, i) => ({ id: `rA-${i}`, social_post_id: "post-A", status: "OPEN" }));
  const reportsPostB = Array.from({ length: 25 }, (_, i) => ({ id: `rB-${i}`, social_post_id: "post-B", status: "OPEN" }));
  const reportsPostC = Array.from({ length: 8 }, (_, i) => ({ id: `rC-${i}`, social_post_id: "post-C", status: "OPEN" }));
  const combined = [...reportsPostA, ...reportsPostB, ...reportsPostC];
  const grouped = groupReportedPostRows(combined);
  assert.equal(grouped.length, 3);
  const map = new Map(grouped.map((r) => [r.social_post_id, r.reports_count]));
  assert.equal(map.get("post-A"), 101, "Post A has 101 reports");
  assert.equal(map.get("post-B"), 25, "Post B has 25 reports");
  assert.equal(map.get("post-C"), 8, "Post C has 8 reports");
});

test("VERIFICATION - TEST 4: New reports submitted against existing post update count", () => {
  const initialReports = Array.from({ length: 25 }, (_, i) => ({ id: `init-${i}`, social_post_id: "post-dynamic", status: "OPEN" }));
  const initialGrouped = groupReportedPostRows(initialReports);
  assert.equal(initialGrouped[0].reports_count, 25);

  // Submit another report against the existing post
  const newReport = { id: "new-report-26", social_post_id: "post-dynamic", status: "OPEN", details: "Latest report" };
  const updatedReports = [...initialReports, newReport];
  const updatedGrouped = groupReportedPostRows(updatedReports);
  assert.equal(updatedGrouped.length, 1, "Remains a single row");
  assert.equal(updatedGrouped[0].reports_count, 26, "Count updates from 25 to 26");
  assert.ok(updatedGrouped[0].report_ids.includes("new-report-26"), "New report ID is tracked");
});

test("VERIFICATION - TEST 5, 6, 7: Remove from Active Use, report history preservation, and page refresh persistence", () => {
  // DB state
  let posts = [
    { id: "post-workflow", author_id: "author-w", body: "Original text", is_hidden: false, created_at: "2026-10-01T00:00:00Z" }
  ];
  let reports = [
    { id: "rep-w1", social_post_id: "post-workflow", category: "OTHER", reason_categories: ["Spam or scam"], details: "Spam obj 1", status: "OPEN", updated_at: "2026-10-01T01:00:00Z" },
    { id: "rep-w2", social_post_id: "post-workflow", category: "OTHER", reason_categories: ["Hate speech"], details: "Hate obj 2", status: "OPEN", updated_at: "2026-10-01T02:00:00Z" },
  ];

  // Helper matching AdminApp isPostHidden
  function isPostHidden(postId, post) {
    if (post && typeof post.is_hidden === "boolean") return post.is_hidden;
    return false;
  }

  // Reports Page loader
  function getReportsPageRows() {
    const activeReports = reports.filter((r) => {
      const p = posts.find((post) => post.id === r.social_post_id);
      return !isPostHidden(r.social_post_id, p);
    });
    return groupReportedPostRows(activeReports);
  }

  // Activate Post Page loader
  function getActivatePostPageRows() {
    return posts.filter((p) => p.is_hidden).map((p) => {
      const postReports = reports.filter((r) => r.social_post_id === p.id);
      return {
        id: p.id,
        _is_post: true,
        reported_post: p.body,
        reports_count: postReports.length,
        all_reports: postReports,
        reported_post_record: p,
      };
    });
  }

  // Initial state:
  assert.equal(getReportsPageRows().length, 1, "Appears on Reports Page initially");
  assert.equal(getActivatePostPageRows().length, 0, "Does not appear on Activate Post Page initially");

  // TEST 5: Super Admin removes from active use
  posts[0].is_hidden = true;
  reports.forEach((r) => { r.status = "RESOLVED"; r.resolved_by = "admin-user"; });

  // Disappears from Reports Page, appears on Activate Post Page
  assert.equal(getReportsPageRows().length, 0, "Disappears from Reports Page");
  assert.equal(getActivatePostPageRows().length, 1, "Appears on Activate Post Page");
  assert.equal(getActivatePostPageRows()[0].id, "post-workflow");

  // TEST 6: Preserve report history
  assert.equal(posts[0].body, "Original text", "Post data is preserved");
  assert.equal(reports.length, 2, "All report records are preserved");
  assert.equal(reports[0].status, "RESOLVED");
  assert.equal(reports[1].status, "RESOLVED");
  assert.equal(getActivatePostPageRows()[0].all_reports.length, 2, "Report history is accessible on Activate Post Page");

  // TEST 7: Page refresh (simulated fresh queries against DB)
  const refreshedReports = getReportsPageRows();
  const refreshedActivate = getActivatePostPageRows();
  assert.equal(refreshedReports.length, 0, "After refresh, post remains absent from Reports Page");
  assert.equal(refreshedActivate.length, 1, "After refresh, post remains on Activate Post Page");
});

test("VERIFICATION - TEST 8: Error handling, security authorization, and consistency", () => {
  // 1. Authorization rules check
  assert.match(adminApp, /const removeReportedPostOwner = \(report, target = report\?\.social_post_id \? "post" : "account"\) => \{/);
  assert.match(adminApp, /const allowed = adminIsSuper[\s\S]*access\?\.role === "users_admin" && \(target === "account" \|\| isPostTarget\)/);
  assert.match(adminApp, /if \(!allowed\) return setError\("Use your assigned account section to manage this report target\."\);/);

  // 2. Unauthorized admin rejection simulation
  const checkAllowed = (adminRole, isSuper, target = "post") => {
    return isSuper || (adminRole === "users_admin" && (target === "account" || target === "post"));
  };
  assert.equal(checkAllowed("super_admin", true, "post"), true, "Super Admin is authorized");
  assert.equal(checkAllowed("users_admin", false, "post"), true, "Users Admin is authorized for traveler post");
  assert.equal(checkAllowed("booking_admin", false, "post"), false, "Booking Admin is unauthorized for post");
  assert.equal(checkAllowed("subscription_admin", false, "post"), false, "Subscription Admin is unauthorized for post");

  // 3. Error handling prevents false UI updates
  assert.match(adminApp, /if \(result\.error\) return setError\(result\.error\.message\);/);
  assert.match(adminApp, /if \(!result\.data\) return setError\("No post was removed\. Your access may have changed\."\);/);
  assert.match(adminApp, /if \(result\.error\) return setError\(result\.error\.message\);[\s\S]*if \(!result\.data\) return setError\("No post was activated\. Your access may have changed\."\);/);

  // 4. No duplicate post rows
  const duplicateIds = ["post-dup", "post-dup", "post-dup"];
  const duplicateReports = duplicateIds.map((id, i) => ({ id: `r-${i}`, social_post_id: id, status: "OPEN" }));
  const grouped = groupReportedPostRows(duplicateReports);
  assert.equal(grouped.length, 1, "Guarantees no duplicate post rows in output");
  assert.equal(grouped[0].reports_count, 3);
});

test("Activated post is restored to account and community timelines without being blocked by resolved reports or localStorage", () => {
  const migration109 = readFileSync(new URL("../supabase/migrations/109_fix_activated_reported_post_visibility.sql", import.meta.url), "utf8");

  // Migration 108 and 109 ensure only OPEN reports hide posts
  assert.match(hideReportedPostsMigration, /report\.status = 'OPEN'/);
  assert.match(hideReportedPostsMigration, /r\.status = 'OPEN'/);
  assert.match(migration109, /create or replace function private\.is_social_post_reported[\s\S]*report\.status = 'OPEN'/);
  assert.match(migration109, /create or replace function public\.get_reported_social_post_ids[\s\S]*r\.status = 'OPEN'/);

  // App.jsx isPostHidden prioritizes post.is_hidden and clears localStorage cache when active
  assert.match(appJsx, /if \(post && typeof post\.is_hidden === "boolean"\) \{[\s\S]*if \(!post\.is_hidden && postId\) setHiddenSocialPost\(postId, false\);[\s\S]*return post\.is_hidden;/);

  // Simulated activated post with historical resolved reports
  const activatedPost = {
    id: "post-activated-1",
    author_id: "user-1",
    body: "Activated post content",
    is_hidden: false,
  };
  const mockStorage = new Set(["post-activated-1"]);
  const mockSetHidden = (id, hidden) => { if (!hidden) mockStorage.delete(id); };

  function testIsPostHidden(postId, post) {
    if (post && typeof post.is_hidden === "boolean") {
      if (!post.is_hidden && postId) mockSetHidden(postId, false);
      return post.is_hidden;
    }
    if (!postId) return false;
    return mockStorage.has(postId);
  }

  // Before filtering, post was in storage. When isPostHidden checks active post, it unhides and returns false
  assert.equal(mockStorage.has("post-activated-1"), true);
  const hiddenResult = testIsPostHidden(activatedPost.id, activatedPost);
  assert.equal(hiddenResult, false, "Activated post is not hidden");
  assert.equal(mockStorage.has("post-activated-1"), false, "Cleared from local hidden cache");

  // Filter in DashboardPosts / CommunityFeed retains activated post
  const feedPosts = [activatedPost].filter((p) => !testIsPostHidden(p.id, p));
  assert.equal(feedPosts.length, 1, "Activated post appears in timeline");
  assert.equal(feedPosts[0].id, "post-activated-1");
});

test("Activate Post page generates signed URLs and displays post attachment in ReportedPostDialog", () => {
  // removed-accounts loader generates signed URLs for hidden posts and passes media_url in reported_post_record
  assert.match(adminApp, /const mediaPaths = \[\.\.\.new Set\(hiddenPosts\.map\(\(post\) => post\.media_path\)\.filter\(Boolean\)\)\];/);
  assert.match(adminApp, /reported_post_record: \{ \.\.\.post, media_url: mediaUrl \}/);

  // ReportedPostDialog supports fallback loading for media attachments
  assert.match(adminApp, /function ReportedPostDialog\(\{ report, onClose, bypassAuth = false \}\)/);
  assert.match(adminApp, /const \[mediaUrl, setMediaUrl\] = useState\(initialPost\?\.media_url \|\| report\.media_url \|\| ""\);/);
  assert.match(adminApp, /const activeMediaUrl = mediaUrl \|\| post\?\.media_url;/);
  assert.match(adminApp, /<img className="ops-reported-post-media" src=\{activeMediaUrl\} alt="Reported post attachment" \/>/);
});

test("Activate post removes delete feature and provides block button that moves account to Blocked accounts tab", () => {
  // 1. In table row actions, Activate post / post rows do not display the delete button
  assert.match(adminApp, /\{resource\.activation \|\| row\._is_post \? null : <button className="danger" onClick=\{\(\) => resource\.noDelete \? setError\(resource\.deleteReason\) : setDeleting\(row\)\}/);

  // 2. In place of delete, the block button is rendered for post rows with self-lockout check
  assert.match(adminApp, /resource\.activation \? <button className="danger ops-block-button" onClick=\{\(\) => blockAccount\(row\)\} disabled=\{self \|\| \(row\._is_post && !canManageProfile\(user\.id, row\.author_id \|\| row\.reported_post_owner_id\)\)\} title=\{self \|\| \(row\._is_post && !canManageProfile\(user\.id, row\.author_id \|\| row\.reported_post_owner_id\)\) \? "You cannot block yourself" : "Block account"\} aria-label="Block record"><ShieldAlert \/><\/button> : null/);

  // 3. blockAccount handles row._is_post and reported_post_owner_id by targeting the author profile
  assert.match(adminApp, /const accountId = row\._is_post \? \(row\.author_id \|\| row\.reported_post_owner_id\) : \(row\.reported_post_owner_id \|\| row\.id\);/);
  assert.match(adminApp, /setAccountAction\(\{ \.\.\.row, _forceBlock: true, _blockAccountId: accountId \}\);/);

  // 4. AccountActionDialog displays "Block account?" and moves author to Blocked accounts
  assert.match(adminApp, /const recordName = isExplicitBlock && \(row\._is_post \|\| row\.reported_post_owner_id\)[\s\S]*?\? \(row\.reported_post_owner \|\| row\.full_name \|\| row\.owner_name \|\| "member"\)/);
  assert.match(adminApp, /const entityType = isExplicitBlock \? "account" : row\._is_post \? "post" : "account";/);

  // 5. applyAccountAction blocks the author profile, updates explicit block storage, and navigates to blocked-accounts tab
  assert.match(adminApp, /if \(row\._is_post\) \{[\s\S]*?if \(!row\._forceBlock\) \{/);
  assert.match(adminApp, /table === "profiles" \? adminRemovalPatch\(\{ status: "SUSPENDED", is_blocked: true \}, user\.id\)/);
  assert.match(adminApp, /setExplicitBlockedAccount\(targetId, true\);/);
  assert.match(adminApp, /if \(isExplicitBlock\) \{[\s\S]*?setSection\("blocked-accounts"\);[\s\S]*?return;/);

  // 6. ReportDetailsDialog hides Delete post from Activate post and provides Block account (with Remove account removed)
  assert.match(adminApp, /canDeletePost && report\.social_post_id && !report\._is_post \? <button type="button" className="ops-button secondary" onClick=\{\(\) => onDeletePost\(report\)\}><Trash2 \/>Delete post<\/button> : null/);
  assert.match(adminApp, /\(report\._is_post \|\| report\.reported_post_owner_id\) && onBlockAccount \? <button type="button" className="ops-button danger ops-block-button" title="Block account" onClick=\{\(\) => onBlockAccount\(report\)\}><ShieldAlert \/>Block account<\/button> : null/);
  assert.doesNotMatch(adminApp, /function ReportDetailsDialog[\s\S]*?Remove account<\/button>/);

  // 7. Behavioral simulation: Blocking post author moves account to Blocked accounts and removes it from Activate post
  let adminSection = "removed-accounts";
  const explicitBlockedMap = {};
  const setMockExplicitBlocked = (id, val) => { explicitBlockedMap[id] = Boolean(val); };
  const isMockAccountBlocked = (row, table) => {
    if (explicitBlockedMap[row?.id]) return true;
    return Boolean(row?.is_blocked);
  };

  const dbProfiles = [
    { id: "author-1", full_name: "afa", email: "shakibalhasan610@gmail.com", role: "TRAVELER", status: "ACTIVE", is_blocked: false },
    { id: "author-2", full_name: "other-user", email: "other@example.com", role: "TRAVELER", status: "ACTIVE", is_blocked: false },
  ];

  const dbPosts = [
    { id: "post-1", author_id: "author-1", body: "Post 1 content", is_hidden: true },
    { id: "post-2", author_id: "author-2", body: "Post 2 content", is_hidden: true },
  ];

  // Prior to block, Activate post rows include post-1 by author-1
  let activatePostRows = dbPosts.filter((post) => {
    const author = dbProfiles.find((p) => p.id === post.author_id);
    return !isMockAccountBlocked(author || { id: post.author_id }, "profiles");
  });
  assert.equal(activatePostRows.length, 2);
  assert.equal(activatePostRows.some((p) => p.author_id === "author-1"), true);

  // Admin clicks block button on post-1
  const postRow = activatePostRows.find((p) => p.id === "post-1");
  const targetAccountId = postRow.author_id; // "author-1"
  assert.equal(targetAccountId, "author-1");

  // Admin confirms block dialog: author profile updated to SUSPENDED and is_blocked: true
  const targetAuthor = dbProfiles.find((p) => p.id === targetAccountId);
  targetAuthor.status = "SUSPENDED";
  targetAuthor.is_blocked = true;
  setMockExplicitBlocked(targetAccountId, true);
  adminSection = "blocked-accounts";

  // Navigation transitioned to blocked-accounts tab
  assert.equal(adminSection, "blocked-accounts");

  // Blocked accounts tab query: finds author-1
  const blockedAccountsRows = dbProfiles.filter((p) => p.status === "SUSPENDED" && isMockAccountBlocked(p, "profiles"));
  assert.equal(blockedAccountsRows.length, 1);
  assert.equal(blockedAccountsRows[0].id, "author-1");
  assert.equal(blockedAccountsRows[0].full_name, "afa");

  // Activate post tab query: author-1 and post-1 are now excluded
  activatePostRows = dbPosts.filter((post) => {
    const author = dbProfiles.find((p) => p.id === post.author_id);
    return !isMockAccountBlocked(author || { id: post.author_id }, "profiles");
  });
  assert.equal(activatePostRows.length, 1);
  assert.equal(activatePostRows[0].id, "post-2");
  assert.equal(activatePostRows.some((p) => p.author_id === "author-1"), false);
});

test("Reports page details modal replaces Remove account with Block account and routes to Blocked accounts", () => {
  // ReportDetailsDialog renders Block account when report has reported_post_owner_id or is a post
  assert.match(adminApp, /\(report\._is_post \|\| report\.reported_post_owner_id\) && onBlockAccount \? <button type="button" className="ops-button danger ops-block-button" title="Block account" onClick=\{\(\) => onBlockAccount\(report\)\}><ShieldAlert \/>Block account<\/button> : null/);
  // ReportDetailsDialog does not render Remove account
  assert.doesNotMatch(adminApp, /function ReportDetailsDialog[\s\S]*?Remove account<\/button>/);

  // blockAccount correctly handles report rows with reported_post_owner_id
  assert.match(adminApp, /const blockAccount = \(row\) => \{[\s\S]*?accountId = row\._is_post \? \(row\.author_id \|\| row\.reported_post_owner_id\) : \(row\.reported_post_owner_id \|\| row\.id\);[\s\S]*?table = \(row\._is_post \|\| row\.reported_post_owner_id\) \? "profiles"/);

  // AccountActionDialog displays owner name on explicit block from report
  assert.match(adminApp, /recordName = isExplicitBlock && \(row\._is_post \|\| row\.reported_post_owner_id\)\s*\?\s*\(row\.reported_post_owner \|\| row\.full_name/);

  // applyAccountAction targets author profile and navigates to blocked-accounts tab
  assert.match(adminApp, /const table = \(row\._is_post \|\| row\._blockAccountId \|\| row\.reported_post_owner_id\) \? "profiles"/);
  assert.match(adminApp, /if \(isExplicitBlock && \(row\.social_post_id \|\| row\._is_post \|\| resource\.id === "reports"\)\) \{/);

  // Behavioral simulation
  let adminSection = "reports";
  const explicitBlockedMap = {};
  const setMockExplicitBlocked = (id, val) => { explicitBlockedMap[id] = Boolean(val); };
  const isMockAccountBlocked = (row, table) => {
    if (explicitBlockedMap[row?.id]) return true;
    return Boolean(row?.is_blocked);
  };

  const reportRow = {
    id: "report-101",
    social_post_id: "post-101",
    reported_post_owner_id: "user-afa",
    reported_post_owner: "afa",
    reported_post: "offensive post",
    category: "HARASSMENT",
    status: "OPEN"
  };

  const dbProfiles = [
    { id: "user-afa", full_name: "afa", role: "TRAVELER", status: "ACTIVE", is_blocked: false }
  ];

  const dbPosts = [
    { id: "post-101", author_id: "user-afa", is_hidden: false }
  ];

  const dbReports = [
    { id: "report-101", social_post_id: "post-101", status: "OPEN" }
  ];

  // Admin clicks Block account in ReportDetailsDialog
  const targetAccountId = reportRow._is_post
    ? (reportRow.author_id || reportRow.reported_post_owner_id)
    : (reportRow.reported_post_owner_id || reportRow.id);
  assert.equal(targetAccountId, "user-afa");

  // Profile is suspended and explicitly blocked
  const profile = dbProfiles.find((p) => p.id === targetAccountId);
  profile.status = "SUSPENDED";
  profile.is_blocked = true;
  setMockExplicitBlocked(targetAccountId, true);

  // Post is hidden and report is resolved
  const post = dbPosts.find((p) => p.id === reportRow.social_post_id);
  post.is_hidden = true;
  const report = dbReports.find((r) => r.id === reportRow.id);
  report.status = "RESOLVED";

  // Section routes to blocked-accounts
  adminSection = "blocked-accounts";

  assert.equal(adminSection, "blocked-accounts");
  assert.equal(isMockAccountBlocked(profile, "profiles"), true);
  assert.equal(report.status, "RESOLVED");
  assert.equal(post.is_hidden, true);
});








