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

