import assert from "node:assert/strict";
import test from "node:test";
import { districts, places, placesVersion, replacePublishedTourismData } from "../src/data/tourism.js";
import { isMountainPlace, isWaterBodyPlace } from "../src/lib/nature-helpers.js";

test("Chattogram district strictly filters to Chattogram water bodies and mountain spots", () => {
  const selectedDistrict = "chattogram";
  const targetDist = districts.find((d) => d.slug === selectedDistrict || d.id === selectedDistrict);
  assert.ok(targetDist, "Chattogram district must exist");

  const distSlug = (targetDist.slug || selectedDistrict).toLowerCase().trim();
  const distId = (targetDist.id || "").toLowerCase().trim();
  const distName = (targetDist.name || "").toLowerCase().trim();

  // Strict district isolation filtering
  const districtPlaces = places.filter((p) => {
    const pDistId = (p.districtId || "").toLowerCase().trim();
    const pDistName = (p.district || "").toLowerCase().trim();
    return pDistId === distSlug || (distId && pDistId === distId) || (distName && pDistName === distName);
  });

  assert.equal(districtPlaces.length, 15, "Chattogram must have exactly 15 verified places");

  // Filter to natural spots (water bodies and mountains)
  const natureSpots = districtPlaces.filter((p) => isWaterBodyPlace(p) || isMountainPlace(p));
  assert.equal(natureSpots.length, 11, "Chattogram must have exactly 11 natural spots");

  // Water bodies
  const waterBodies = districtPlaces.filter(isWaterBodyPlace);
  assert.equal(waterBodies.length, 7, "Chattogram must have exactly 7 water bodies");
  const waterNames = waterBodies.map((p) => p.name).sort();
  assert.deepEqual(waterNames, [
    "Banshbaria Sea Beach",
    "Foy's Lake",
    "Guliakhali Sea Beach",
    "Kattali Beach",
    "Khoiyachora Waterfall",
    "Patenga Sea Beach",
    "Sahasradhara Waterfall",
  ]);

  // Mountain & Hill spots
  const mountainSpots = districtPlaces.filter(isMountainPlace);
  assert.equal(mountainSpots.length, 4, "Chattogram must have exactly 4 mountain and hill spots");
  const mountainNames = mountainSpots.map((p) => p.name).sort();
  assert.deepEqual(mountainNames, [
    "Batali Hill",
    "DC Hill",
    "Napittachora Trail",
    "Sitakunda Eco Park",
  ]);

  // Assert that rivers from other districts NEVER appear in Chattogram
  for (const forbidden of ["Jamuna River", "Meghna River", "Padma River"]) {
    assert.equal(
      natureSpots.some((p) => p.name === forbidden),
      false,
      `Forbidden out-of-district river '${forbidden}' must not appear in Chattogram`,
    );
  }
});

test("Moulvibazar district strictly filters to Moulvibazar natural spots without out-of-district rivers", () => {
  const selectedDistrict = "moulvibazar";
  const targetDist = districts.find((d) => d.slug === selectedDistrict || d.id === selectedDistrict);
  assert.ok(targetDist, "Moulvibazar district must exist");

  const distSlug = (targetDist.slug || selectedDistrict).toLowerCase().trim();
  const distId = (targetDist.id || "").toLowerCase().trim();
  const distName = (targetDist.name || "").toLowerCase().trim();

  const districtPlaces = places.filter((p) => {
    const pDistId = (p.districtId || "").toLowerCase().trim();
    const pDistName = (p.district || "").toLowerCase().trim();
    return pDistId === distSlug || (distId && pDistId === distId) || (distName && pDistName === distName);
  });

  assert.equal(districtPlaces.length, 11, "Moulvibazar must have 11 verified destinations");

  // Every place in districtPlaces must belong strictly to Moulvibazar
  for (const p of districtPlaces) {
    assert.equal(p.districtId, "moulvibazar");
    assert.notEqual(p.name, "Jamuna River");
    assert.notEqual(p.name, "Meghna River");
    assert.notEqual(p.name, "Padma River");
  }

  const waterBodies = districtPlaces.filter(isWaterBodyPlace);
  assert.ok(waterBodies.length >= 5, "Moulvibazar must have its waterfalls, lakes, and haors identified as water bodies");
  const waterNames = waterBodies.map((p) => p.name);
  assert.ok(waterNames.includes("Madhabkunda Waterfall"));
  assert.ok(waterNames.includes("Madhabpur Lake"));
  assert.ok(waterNames.includes("Baikka Beel"));
  assert.ok(waterNames.includes("Ham Ham Waterfall"));
  assert.ok(waterNames.includes("Hakaluki Haor"));
});

test("placesVersion increments whenever replacePublishedTourismData is called", () => {
  const initialVersion = placesVersion;
  replacePublishedTourismData([...districts], [...places]);
  assert.equal(placesVersion, initialVersion + 1);
});

test("Newly added or updated water bodies and hills are dynamically recognized and isolated to their district", () => {
  // Simulate adding a new water body to Chattogram
  const newChattogramWaterBody = {
    id: "chattogram-karnafuli-waterfront",
    districtId: "chattogram",
    district: "Chattogram",
    name: "Karnafuli Riverfront Promenade",
    category: "Riverfront and waterway",
    area: "Sadarghat",
    shortDescription: "Scenic riverside promenade along the historic river.",
  };

  // Simulate adding a new hill/peak to Bandarban
  const newBandarbanPeak = {
    id: "bandarban-saka-hafong-summit",
    districtId: "bandarban",
    district: "Bandarban",
    name: "Saka Haphong Peak",
    category: "Mountain and trekking",
    area: "Thanchi",
    shortDescription: "Highest summit peak and ridge trek in Bangladesh.",
  };

  // Simulate adding a place with Bengali script
  const newSylhetJhorna = {
    id: "sylhet-songrampunji-jharna",
    districtId: "sylhet",
    district: "Sylhet",
    name: "সংগ্রামপুঞ্জি ঝরনা",
    category: "প্রাকৃতিক ঝর্ণা",
    area: "Jaflong",
    shortDescription: "মেঘালয় পাহাড়ের পাদদেশের মনোরম পাহাড়ি ঝর্ণা।",
  };

  assert.equal(isWaterBodyPlace(newChattogramWaterBody), true, "New riverfront must be recognized as a water body");
  assert.equal(isMountainPlace(newChattogramWaterBody), false, "Riverfront must not be classified as a mountain");

  assert.equal(isMountainPlace(newBandarbanPeak), true, "New peak trek must be recognized as a mountain spot");
  assert.equal(isWaterBodyPlace(newBandarbanPeak), false, "Peak trek must not be classified as a water body");

  assert.equal(isWaterBodyPlace(newSylhetJhorna), true, "Bengali script ঝরনা must be recognized as a water body");
  assert.equal(isMountainPlace(newSylhetJhorna), true, "Bengali script পাহাড় must also match mountain classification");
});

