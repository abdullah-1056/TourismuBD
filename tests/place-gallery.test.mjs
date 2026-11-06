import assert from "node:assert/strict";
import test from "node:test";
import { getPlaceGallery } from "../src/data/place-galleries.js";

test("getPlaceGallery returns 6 to 9 scenic photos with bilingual captions", () => {
  const testPlaces = [
    { id: "achranga-dighi", name: "Achranga Dighi", category: "Nature", natureType: "water_body" },
    { id: "jaflong", name: "Jaflong", category: "Nature", natureType: "river" },
    { id: "ratargul-swamp-forest", name: "Ratargul Swamp Forest", category: "Nature", natureType: "forest" },
    { id: "coxs-bazar-sea-beach", name: "Cox's Bazar Sea Beach", category: "Beach", natureType: "coast" },
    { id: "sundarbans", name: "Sundarbans", category: "Forest", natureType: "forest" },
    { id: "ahsan-manzil", name: "Ahsan Manzil", category: "Historical", natureType: "heritage" },
    { id: "unknown-hill-place", name: "Secret Hill Peak", category: "Mountain", natureType: "mountain" },
    { id: "unknown-tea-estate", name: "Random Tea Garden", category: "Nature", description: "Expansive green tea estate with misty rolling hills" },
    { id: "generic-place", name: "Generic Tourism Spot", category: "Nature" },
  ];

  for (const place of testPlaces) {
    const gallery = getPlaceGallery(place);
    assert.ok(Array.isArray(gallery), `Gallery for ${place.name} must be an array`);
    assert.ok(gallery.length >= 6 && gallery.length <= 9, `Gallery for ${place.name} must have between 6 and 9 items, got ${gallery.length}`);

    for (let i = 0; i < gallery.length; i++) {
      const item = gallery[i];
      assert.ok(typeof item.url === "string" && item.url.length > 0, `Item ${i} in ${place.name} must have a url`);
      assert.ok(typeof item.fallbackUrl === "string" && item.fallbackUrl.length > 0, `Item ${i} in ${place.name} must have a fallbackUrl`);
      assert.ok(typeof item.captionBn === "string" && item.captionBn.length > 0, `Item ${i} in ${place.name} must have captionBn`);
      assert.ok(typeof item.captionEn === "string" && item.captionEn.length > 0, `Item ${i} in ${place.name} must have captionEn`);
      assert.ok(typeof item.tagBn === "string" && item.tagBn.length > 0, `Item ${i} in ${place.name} must have tagBn`);
      assert.ok(typeof item.tagEn === "string" && item.tagEn.length > 0, `Item ${i} in ${place.name} must have tagEn`);
    }
  }
});

test("Achranga Dighi specific gallery contains water/dighi themed silent scenic shots", () => {
  const achranga = { id: "achranga-dighi", name: "Achranga Dighi", category: "Nature" };
  const gallery = getPlaceGallery(achranga);
  assert.equal(gallery.length, 8, "Achranga Dighi should have 8 curated scenic shots");
  assert.ok(gallery[0].captionBn.includes("আঁচরঙ্গা") || gallery[0].captionBn.includes("দিঘি") || gallery[0].captionBn.includes("দীঘি"));
  assert.ok(gallery[0].captionEn.includes("Achranga") || gallery[0].captionEn.includes("Dighi"));
});
