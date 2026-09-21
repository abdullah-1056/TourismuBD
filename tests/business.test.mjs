import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { combineShopProducts, searchShopProducts } from "../src/lib/shop.js";

const roleMigration = readFileSync(new URL("../supabase/migrations/072_business_owner_role.sql", import.meta.url), "utf8");
const marketplaceMigration = readFileSync(new URL("../supabase/migrations/073_business_marketplace.sql", import.meta.url), "utf8");
const productPostMigration = readFileSync(new URL("../supabase/migrations/074_business_post_product_name.sql", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const admin = readFileSync(new URL("../src/AdminApp.jsx", import.meta.url), "utf8");
const adminServer = readFileSync(new URL("../vite.admin.config.js", import.meta.url), "utf8");

assert.match(roleMigration, /add value if not exists 'BUSINESS_OWNER'/);
assert.match(marketplaceMigration, /create table public\.businesses/);
assert.match(marketplaceMigration, /create table public\.business_products/);
assert.match(marketplaceMigration, /references public\.businesses\(id\) on delete cascade/);
assert.match(marketplaceMigration, /businesses_owner_insert/);
assert.match(marketplaceMigration, /before update on public\.businesses/);
assert.match(marketplaceMigration, /business_products_owner_manage/);
assert.match(marketplaceMigration, /grant select on public\.businesses, public\.business_products to anon, authenticated/);
assert.match(marketplaceMigration, /audit_business_products/);
assert.match(marketplaceMigration, /when 'BUSINESS_OWNER' then assigned_role := 'BUSINESS_OWNER'/);
assert.match(productPostMigration, /add column if not exists product_name text/);
assert.match(productPostMigration, /Business posts need a product name/);
assert.match(productPostMigration, /Only business accounts can name a product post/);
assert.match(app, /<option value="BUSINESS">Business<\/option>/);
assert.match(app, /function BusinessDashboard/);
assert.match(app, /function BusinessCatalogPage/);
assert.match(app, /const isBusiness = accountRole === "BUSINESS_OWNER"/);
assert.match(app, /isBusiness \? <button/);
assert.match(app, /onOpenBusinessCatalog\(\)/);
assert.match(app, /view === "business-catalog" && auth\.user \? <BusinessCatalogPage/);
assert.match(app, /function Marketplace/);
assert.match(app, /<PostPublisher user=\{user\} notify=\{notify\} businessPost/);
assert.match(app, /product_name: name/);
assert.match(app, /\.not\("product_name", "is", null\)/);
const sameNameProducts = combineShopProducts(
  [{ id: "listing-1", name: "Handmade bag", created_at: "2026-01-01", businesses: { business_name: "Shop A" } }],
  [{ id: "post-2", name: "Handmade bag", created_at: "2026-01-02", businesses: { business_name: "Shop B" } }],
);
assert.deepEqual(searchShopProducts(sameNameProducts, "handmade bag").map((product) => product.id), ["post-2", "listing-1"]);
assert.match(app, /\["shop", "Shop", ShoppingBag\]/);
assert.match(admin, /id: "businesses", label: "Business"/);
assert.match(admin, /id: "business-products", label: "Products"/);
assert.match(adminServer, /"businesses", "business_products"/);
assert.match(adminServer, /Local edits are only available for Business records/);
