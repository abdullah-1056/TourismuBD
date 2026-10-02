import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/075_provider_service_names.sql", import.meta.url), "utf8");

assert.match(migration, /add column if not exists service_name text/);
assert.match(migration, /providers_service_name_length/);
assert.match(migration, /service_name text/);
assert.match(app, /name="providerName"/);
assert.match(app, /name="providerServiceName"/);
assert.match(app, /Provider name/);
assert.match(app, /Service name/);
assert.match(app, /full_name: providerName/);
assert.match(app, /service_name: providerServiceName \|\| null/);
assert.match(app, /public_provider_details"\)\.select\("service_name"\)\.eq\("user_id", person\.id\)/);
assert.match(app, /Service: \{serviceName\}/);
assert.match(app, /providerTitle = \(listing\) => listing\.service_name/);
