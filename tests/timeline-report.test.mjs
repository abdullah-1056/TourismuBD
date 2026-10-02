import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("timeline reports require reasons and a written objection before submission", () => {
  assert.match(app, /function PostReportDialog/);
  assert.match(app, /What is your objection\?/);
  assert.match(app, /const POST_REPORT_REASONS = \[/);
  assert.match(app, /type="checkbox" checked=\{reasons\.includes\(reason\)\}/);
  assert.match(app, /Select at least one reason for this report\./);
  assert.match(app, /Write at least 10 characters/);
  assert.match(app, /aria-label="Objection details" required/);
  assert.match(app, /minLength="10" maxLength="2000"/);
  assert.match(app, /reason_categories: reasons, details: objection, social_post_id: post\.id/);
  assert.match(app, /Report reasons: \$\{reasons\.join\(" \| "\)\}/);
  assert.match(app, /update\(payload\)\.eq\("social_post_id", post\.id\)\.eq\("created_by", user\.id\)\.eq\("status", "OPEN"\)/);
  assert.match(app, /Your existing report was updated\./);
  assert.match(app, /setReportOpen\(true\)/);
  assert.doesNotMatch(app, /details: "Reported timeline update\."/);
});
