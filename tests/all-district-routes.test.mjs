import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { districts, DISTRICT_CENTER_COORDINATES, places, suggestedPlacesForDistrict } from "../src/data/tourism.js";
import { isCoordinateInsideBangladesh } from "../src/lib/road-map.js";
import { planDistrictTour } from "../src/lib/route.js";

await test("all 64 districts use verified Bangladesh-side shortest-distance routes", () => {
  assert.equal(districts.length, 64);
  assert.equal(new Set(districts.map(({ id }) => id)).size, 64);
  assert.equal(places.length, 519);

  for (const district of districts) {
    const destinations = suggestedPlacesForDistrict(district.id);
    assert.ok(destinations.length > 0, `${district.name} needs tourist places`);
    assert.equal(new Set(destinations.map(({ id }) => id)).size, destinations.length, `${district.name} IDs`);
    assert.equal(
      new Set(destinations.map(({ coordinates }) => `${coordinates.lat},${coordinates.lng}`)).size,
      destinations.length,
      `${district.name} coordinates`,
    );
    assert.ok(
      isCoordinateInsideBangladesh([DISTRICT_CENTER_COORDINATES[district.id].lng, DISTRICT_CENTER_COORDINATES[district.id].lat]),
      `${district.name} start`,
    );

    for (const destination of destinations) {
      const roadPoint = destination.roadAccessCoordinates || destination.coordinates;
      assert.equal(destination.coordinatesAreApproximate, false, destination.id);
      assert.equal(destination.roadRoutingProfile, "shortest-astar", destination.id);
      assert.ok(isCoordinateInsideBangladesh([roadPoint.lng, roadPoint.lat]), destination.id);
    }

    const tour = planDistrictTour(district.id, Math.min(12, destinations.length), {
      name: `${district.name} Town Center`,
      coordinates: DISTRICT_CENTER_COORDINATES[district.id],
    });
    assert.equal(tour.orderedPlaces.length, destinations.length, district.name);
  }
});

await test("database-loaded tourist places keep the all-district A* profile", () => {
  const loader = readFileSync(new URL("../src/lib/tourism-content.js", import.meta.url), "utf8");
  assert.match(loader, /roadRoutingProfile: "shortest-astar"/);
  assert.doesNotMatch(loader, /KHULNA_DISTRICT_IDS\.includes/);
});

await test("Lakma Rajbari uses the corrected Bangladesh-side coordinate", () => {
  const migration = readFileSync(new URL("../supabase/migrations/071_correct_lakma_rajbari_coordinate.sql", import.meta.url), "utf8");
  assert.match(migration, /district\.slug = 'joypurhat'/);
  assert.match(migration, /place\.slug = 'lakma-rajbari'/);
  assert.match(migration, /latitude = 25\.2050000/);
  assert.match(migration, /longitude = 88\.9500000/);
});
