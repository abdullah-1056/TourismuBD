import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { adminRemovalPatch, buildPlacePayload, canManageProfile, hasAdminAccess, providerTypeLabel, slugifyPlaceName, sortDestinationRows } from "../src/lib/admin.js";

const adminApp = readFileSync(new URL("../src/AdminApp.jsx", import.meta.url), "utf8");

test("Admin Users include the same eye-based profile details action as providers", () => {
  assert.match(adminApp, /function TravelerProfile/);
  assert.match(adminApp, /profilesSection \? <button onClick=\{\(\) => setTravelerProfile\(row\.profile \|\| row\)\}/);
  assert.match(adminApp, /resource\.table === "businesses" \? "View business owner details" : "View user details"/);
});

test("Admin Business accounts provide public and detail profile views", () => {
  assert.match(adminApp, /resource\.table === "businesses"/);
  assert.match(adminApp, /setTravelerProfile\(row\.profile \|\| row\)/);
  assert.match(adminApp, /View business owner details/);
  assert.match(adminApp, /profile\.role === "BUSINESS_OWNER" \? "business account"/);
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
  assert.equal(hasAdminAccess({ role: "SUPER_ADMIN", status: "ACTIVE" }), true);
  assert.equal(hasAdminAccess({ role: "SUPER_ADMIN", status: "SUSPENDED" }), false);
  assert.equal(hasAdminAccess({ role: "TRAVELER", status: "ACTIVE" }), false);
  assert.equal(canManageProfile("admin-a", "admin-a"), false);
  assert.equal(canManageProfile("admin-a", "admin-b"), true);
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
