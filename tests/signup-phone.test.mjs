import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/083_required_signup_phone.sql", import.meta.url), "utf8");
const blockedContactMigration = readFileSync(new URL("../supabase/migrations/084_blocked_contact_signup_guard.sql", import.meta.url), "utf8");

assert.doesNotMatch(app, /Phone number \(optional\)/);
assert.match(app, /Phone number<input name="phone" required type="tel"/);
assert.match(app, /\{mode === "signin" \? <button type="button" className="button secondary wide google-button"/);
assert.match(migration, /signup_phone is null or signup_phone !~ '\^\(\\\+880\|0\)1\[3-9\]\[0-9\]\{8\}\$'/);
assert.match(migration, /A valid Bangladesh phone number is required for every account/);
assert.match(blockedContactMigration, /blocked_profile\.status = 'SUSPENDED'/);
assert.match(blockedContactMigration, /lower\(blocked_profile\.email\) = lower\(new\.email\)/);
assert.match(blockedContactMigration, /normalized_signup_phone/);
assert.match(blockedContactMigration, /This account cannot be created with the supplied contact details/);
