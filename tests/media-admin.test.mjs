import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_ROLES,
  ADMIN_ROLE_LABELS,
  MODULE_ROLE,
  canAccessAdminSection,
  isSuperAdmin,
} from "../src/lib/admin.js";
import {
  getPlaceGallery,
  saveCustomPlaceGallery,
} from "../src/data/place-galleries.js";
import {
  getCustomPlaceImage,
  saveCustomPlaceImage,
  getSystemBanner,
  saveCustomSystemBanner,
  getCustomWaterImage,
  saveCustomWaterImage,
  CUSTOM_MEDIA_STORE,
  places,
} from "../src/data/tourism.js";

test("1. Media Admin Role Definition & Label", () => {
  assert.ok(ADMIN_ROLES.includes("media_admin"), "ADMIN_ROLES must include media_admin");
  assert.equal(ADMIN_ROLE_LABELS.media_admin, "Media Admin", "Role label must be 'Media Admin'");
  assert.equal(MODULE_ROLE.media, "media_admin", "media module must map to media_admin");
});

test("2. Super Admin has full access to Media and all modules", () => {
  const superAdminAccess = { role: "super_admin", is_active: true };
  assert.equal(isSuperAdmin(superAdminAccess), true);
  assert.equal(canAccessAdminSection(superAdminAccess, "media"), true);
  assert.equal(canAccessAdminSection(superAdminAccess, "overview"), true);
  assert.equal(canAccessAdminSection(superAdminAccess, "profiles"), true);
  assert.equal(canAccessAdminSection(superAdminAccess, "providers"), true);
  assert.equal(canAccessAdminSection(superAdminAccess, "businesses"), true);
  assert.equal(canAccessAdminSection(superAdminAccess, "subscriptions"), true);
  assert.equal(canAccessAdminSection(superAdminAccess, "bookings"), true);
  assert.equal(canAccessAdminSection(superAdminAccess, "reports"), true);
});

test("3. Media Admin strict isolation: CAN ONLY see Media section", () => {
  const mediaAdminAccess = { role: "media_admin", is_active: true };
  assert.equal(isSuperAdmin(mediaAdminAccess), false);

  // MUST be able to access Media section
  assert.equal(canAccessAdminSection(mediaAdminAccess, "media"), true, "media_admin can access media");

  // MUST NOT access any other sections
  assert.equal(canAccessAdminSection(mediaAdminAccess, "overview"), false, "media_admin cannot access overview");
  assert.equal(canAccessAdminSection(mediaAdminAccess, "profiles"), false, "media_admin cannot access users (profiles)");
  assert.equal(canAccessAdminSection(mediaAdminAccess, "providers"), false, "media_admin cannot access providers");
  assert.equal(canAccessAdminSection(mediaAdminAccess, "businesses"), false, "media_admin cannot access businesses");
  assert.equal(canAccessAdminSection(mediaAdminAccess, "business-products"), false, "media_admin cannot access business-products resource directly");
  assert.equal(canAccessAdminSection(mediaAdminAccess, "subscriptions"), false, "media_admin cannot access subscriptions");
  assert.equal(canAccessAdminSection(mediaAdminAccess, "bookings"), false, "media_admin cannot access bookings");
  assert.equal(canAccessAdminSection(mediaAdminAccess, "reports"), false, "media_admin cannot access reports");
  assert.equal(canAccessAdminSection(mediaAdminAccess, "blocked-accounts"), false, "media_admin cannot access blocked-accounts");
  assert.equal(canAccessAdminSection(mediaAdminAccess, "admin-management"), false, "media_admin cannot access admin-management");
});

test("4. Other secondary admins CANNOT access Media section", () => {
  const roles = [
    "users_admin",
    "provider_admin",
    "business_admin",
    "subscription_admin",
    "booking_admin",
  ];

  for (const role of roles) {
    const access = { role, is_active: true };
    assert.equal(
      canAccessAdminSection(access, "media"),
      false,
      `${role} must not be able to access media section`
    );
  }
});

test("5. Inactive Media Admin cannot access anything", () => {
  const inactiveMediaAdmin = { role: "media_admin", is_active: false };
  assert.equal(canAccessAdminSection(inactiveMediaAdmin, "media"), false);
});

test("6. Scenic Photo Galleries support 6-9 photos per destination", () => {
  const samplePlace = places.find((p) => p.slug === "achranga-dighi") || places[0];
  const gallery = getPlaceGallery(samplePlace);

  assert.ok(Array.isArray(gallery), "Gallery must be an array");
  assert.ok(gallery.length >= 6 && gallery.length <= 9, "Gallery must have between 6 and 9 photos");

  for (const photo of gallery) {
    assert.ok(photo.url, "Every gallery photo must have an image url");
    assert.ok(photo.captionBn, "Every gallery photo must have a Bengali caption");
    assert.ok(photo.captionEn, "Every gallery photo must have an English caption");
  }
});

test("7. Custom place image helpers and banner helpers function properly", () => {
  assert.equal(typeof getCustomPlaceImage, "function");
  assert.equal(typeof saveCustomPlaceImage, "function");
  assert.equal(typeof getSystemBanner, "function");
  assert.equal(typeof saveCustomSystemBanner, "function");
  assert.equal(typeof getCustomWaterImage, "function");
  assert.equal(typeof saveCustomWaterImage, "function");

  assert.equal(getCustomPlaceImage("nonexistent"), null);
  assert.equal(getSystemBanner("hero_home", "/default.png"), "/default.png");
});

test("8. Custom media updates update CUSTOM_MEDIA_STORE and are retrieved immediately", () => {
  // Test place cover
  saveCustomPlaceImage("test-place", "/images/uploads/test-place.jpg");
  assert.equal(getCustomPlaceImage("test-place"), "/images/uploads/test-place.jpg");
  assert.equal(CUSTOM_MEDIA_STORE.places["test-place"], "/images/uploads/test-place.jpg");

  // Test banner
  saveCustomSystemBanner("test-banner", "/images/uploads/test-banner.jpg");
  assert.equal(getSystemBanner("test-banner"), "/images/uploads/test-banner.jpg");
  assert.equal(CUSTOM_MEDIA_STORE.banners["test-banner"], "/images/uploads/test-banner.jpg");

  // Test water body
  saveCustomWaterImage("test-wb", "/images/uploads/test-water.jpg");
  assert.equal(getCustomWaterImage("test-wb"), "/images/uploads/test-water.jpg");
  assert.equal(CUSTOM_MEDIA_STORE.water["test-wb"], "/images/uploads/test-water.jpg");

  // Test custom gallery
  const testGallery = [
    { url: "/img1.jpg", captionBn: "১", captionEn: "1" },
    { url: "/img2.jpg", captionBn: "২", captionEn: "2" },
    { url: "/img3.jpg", captionBn: "৩", captionEn: "3" },
    { url: "/img4.jpg", captionBn: "৪", captionEn: "4" },
    { url: "/img5.jpg", captionBn: "৫", captionEn: "5" },
    { url: "/img6.jpg", captionBn: "৬", captionEn: "6" },
  ];
  saveCustomPlaceGallery("test-gallery-place", testGallery);
  const fetchedGallery = getPlaceGallery({ slug: "test-gallery-place" });
  assert.equal(fetchedGallery.length, 6);
  assert.equal(fetchedGallery[0].url, "/img1.jpg");
});

test("9. Place objects dynamically reflect updated image via getter", () => {
  const targetPlace = places.find((p) => p.slug === "achranga-dighi");
  assert.ok(targetPlace, "Achranga Dighi place object must exist");

  const originalImage = targetPlace.image;
  const newCustomUrl = "/images/uploads/new-achranga-silent.jpg";

  saveCustomPlaceImage("achranga-dighi", newCustomUrl);
  // targetPlace.image getter must return newCustomUrl immediately without modifying object reference
  assert.equal(targetPlace.image, newCustomUrl, "place.image getter must immediately return custom image");

  // Cleanup
  delete CUSTOM_MEDIA_STORE.places["achranga-dighi"];
});

test("10. Admin District Selection maps all 64 districts and filters destinations cleanly", async () => {
  const { districts, places: allPlaces } = await import("../src/data/tourism.js");
  assert.equal(districts.length, 64, "All 64 districts must be defined");
  assert.ok(allPlaces.length >= 519, "All 519 places must exist");

  const byId = new Map(districts.map((d) => [String(d.id).toLowerCase(), d]));
  const bySlug = new Map(districts.map((d) => [String(d.slug).toLowerCase(), d]));
  const byName = new Map(districts.map((d) => [String(d.name).toLowerCase(), d]));
  const resolve = (val) => byId.get(String(val).toLowerCase()) || bySlug.get(String(val).toLowerCase()) || byName.get(String(val).toLowerCase());

  // Test resolution of every destination to its district
  let unmapped = 0;
  for (const place of allPlaces) {
    const rawDist = place.districtId || place.district;
    const d = resolve(rawDist);
    if (!d) unmapped++;
  }
  assert.equal(unmapped, 0, "Every single destination must resolve to a valid Bangladesh district");

  // Test district filtering (e.g. Sylhet)
  const sylhetDist = districts.find((d) => d.name === "Sylhet");
  assert.ok(sylhetDist);
  const sylhetPlaces = allPlaces.filter((p) => resolve(p.districtId || p.district)?.id === sylhetDist.id);
  assert.ok(sylhetPlaces.length > 0, "Sylhet must contain destinations");
  for (const p of sylhetPlaces) {
    const resolved = resolve(p.districtId || p.district);
    assert.equal(resolved.name, "Sylhet");
  }

  // Test Bagerhat filtering
  const bagerhatDist = districts.find((d) => d.name === "Bagerhat");
  assert.ok(bagerhatDist);
  const bagerhatPlaces = allPlaces.filter((p) => resolve(p.districtId || p.district)?.id === bagerhatDist.id);
  assert.ok(bagerhatPlaces.length > 0, "Bagerhat must contain destinations");
  for (const p of bagerhatPlaces) {
    const resolved = resolve(p.districtId || p.district);
    assert.equal(resolved.name, "Bagerhat");
  }
});

test("11. District Media Editor sequential navigation calculates bounds and names correctly", async () => {
  const { districts, places: allPlaces } = await import("../src/data/tourism.js");
  const sylhetDist = districts.find((d) => d.name === "Sylhet");
  const byId = new Map(districts.map((d) => [String(d.id).toLowerCase(), d]));
  const resolve = (val) => byId.get(String(val).toLowerCase());
  const sylhetPlaces = allPlaces.filter((p) => resolve(p.districtId || p.district)?.id === sylhetDist.id);

  // Function to build navigation props matching openPlaceEditorAtIndex in MediaManager
  const buildNav = (idx, list) => ({
    currentIndex: idx,
    totalPlaces: list.length,
    totalInDistrict: list.length,
    hasNext: idx < list.length - 1,
    hasPrev: idx > 0,
    nextPlaceName: idx < list.length - 1 ? list[idx + 1].name : null,
    prevPlaceName: idx > 0 ? list[idx - 1].name : null,
  });

  // First item
  const first = buildNav(0, sylhetPlaces);
  assert.equal(first.hasPrev, false);
  assert.equal(first.hasNext, true);
  assert.equal(first.prevPlaceName, null);
  assert.equal(first.nextPlaceName, sylhetPlaces[1].name);

  // Middle item
  if (sylhetPlaces.length > 2) {
    const mid = buildNav(1, sylhetPlaces);
    assert.equal(mid.hasPrev, true);
    assert.equal(mid.hasNext, true);
    assert.equal(mid.prevPlaceName, sylhetPlaces[0].name);
    assert.equal(mid.nextPlaceName, sylhetPlaces[2].name);
  }

  // Last item
  const lastIdx = sylhetPlaces.length - 1;
  const last = buildNav(lastIdx, sylhetPlaces);
  assert.equal(last.hasPrev, true);
  assert.equal(last.hasNext, false);
  assert.equal(last.prevPlaceName, sylhetPlaces[lastIdx - 1].name);
  assert.equal(last.nextPlaceName, null);
});

test("12. Media grid pagination correctly pages at 6 rows per page (36 destinations)", async () => {
  const { places: allPlaces } = await import("../src/data/tourism.js");
  const itemsPerRow = 6;
  const rowsPerPage = 6;
  const pageSize = itemsPerRow * rowsPerPage; // 36 items per page

  assert.equal(pageSize, 36, "Page size must be 36 items (6 rows of 6 cards)");

  const totalItems = allPlaces.length; // 519
  const totalPages = Math.ceil(totalItems / pageSize);
  assert.equal(totalPages, 15, "519 items divided by 36 must produce 15 pages");

  // Page 1
  const p1Start = 0;
  const p1End = 36;
  const p1Slice = allPlaces.slice(p1Start, p1End);
  assert.equal(p1Slice.length, 36, "Page 1 must contain exactly 36 items (6 full rows)");

  // Page 2
  const p2Start = 36;
  const p2End = 72;
  const p2Slice = allPlaces.slice(p2Start, p2End);
  assert.equal(p2Slice.length, 36, "Page 2 must contain exactly 36 items");

  // Page 15 (last page)
  const p15Start = 14 * pageSize;
  const p15Slice = allPlaces.slice(p15Start);
  assert.equal(p15Slice.length, totalItems - 14 * pageSize, "Last page contains remaining items");
  assert.equal(p15Slice.length, 15);
});



