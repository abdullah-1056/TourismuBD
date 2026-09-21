import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { kishoreganjPlaceDetails } from "../src/data/kishoreganj-access.js";
import { places, DISTRICT_CENTER_COORDINATES } from "../src/data/tourism.js";
import { formatRoadRouteStatus, isCoordinateInsideBangladesh, loadRoadRoute, resolveRouteWaypoints } from "../src/lib/road-map.js";

const canonical = kishoreganjPlaceDetails("kishoreganj", "president-abdul-hamid-haor-road");
assert.deepEqual(kishoreganjPlaceDetails("kishoreganj", "president-abdul-hamid-road-haor-road"), canonical);
assert.equal(kishoreganjPlaceDetails("sylhet", "president-abdul-hamid-road-haor-road"), null);
assert.equal(kishoreganjPlaceDetails("kishoreganj", "pagla-mosque"), null);
assert.ok(isCoordinateInsideBangladesh([canonical.coordinates.lng, canonical.coordinates.lat]));
const originalFetch = globalThis.fetch;
const origin = { name: "Kishoreganj Town Center", coordinates: DISTRICT_CENTER_COORDINATES.kishoreganj };
const requests = [];
globalThis.fetch = async (url) => {
  requests.push(url);
  const options = JSON.parse(new URL(url).searchParams.get("json"));
  assert.deepEqual(options.locations[1], { lat: 24.459319, lon: 90.9620408 });
  assert.equal(options.costing_options.auto.shortest, true);
  return { ok: true, json: async () => ({ code: "Ok", routes: [{
    geometry: { coordinates: [[90.78, 24.43], [90.9620408, 24.459319], [90.78, 24.43]] },
    distance: 45939.4, duration: 3267.4,
    legs: [{ distance: 21578.2, duration: 1440.7 }, { distance: 24361.2, duration: 1826.7 }],
  }] }) };
};
try {
  for (const slug of ["mithamain-haor", "austagram-haor", "president-abdul-hamid-haor-road"]) {
    const place = places.find((place) => place.slug === slug);
    assert.deepEqual(place.roadAccessCoordinates, canonical.roadAccessCoordinates);
    assert.equal(place.roadAccessLabel, "Balikhola");
    assert.equal(place.coordinatesAreApproximate, false);
    assert.match(place.practicalTip, /boat or seasonal ferry/);
    const route = await loadRoadRoute([origin, place]);
    assert.ok(Math.abs(route.outboundDistanceKm - 21.5782) < 1e-9);
    assert.ok(Math.abs(route.returnDistanceKm - 24.3612) < 1e-9);
    assert.match(formatRoadRouteStatus(route, true), /^21\.6 km one way · 24\.4 km return · 45\.9 km round trip/);
    assert.doesNotMatch(formatRoadRouteStatus(route, true), /23\.0 km one way/);
  }
  const alias = { name: "President Abdul Hamid Road / Haor Road", coordinatesAreApproximate: false, ...canonical };
  await resolveRouteWaypoints(origin, [alias]);
  assert.equal(requests.length, 3, "verified alias must not use a stale geocode cache");
} finally { globalThis.fetch = originalFetch; }
assert.equal(formatRoadRouteStatus({ distanceKm: 45.9, durationMinutes: 54 }, true), "45.9 km round trip · about 54 min");
assert.match(formatRoadRouteStatus({ distanceKm: 45.9, durationMinutes: 54 }, false, " · boat travel excluded"), /boat travel excluded$/);
const loader = readFileSync(new URL("../src/lib/tourism-content.js", import.meta.url), "utf8");
assert.match(loader, /kishoreganjPlaceDetails\(districtId, row\.slug\)/);
assert.match(loader, /accessDetails\?\.coordinates \|\|/);
assert.match(loader, /roadAccessLabel: accessDetails\?\.roadAccessLabel/);
const migration = readFileSync(new URL("../supabase/migrations/069_kishoreganj_haor_road_slug_coordinates.sql", import.meta.url), "utf8");
assert.match(migration, /district\.slug = 'kishoreganj'/);
assert.match(migration, /'president-abdul-hamid-road-haor-road'/);
assert.doesNotMatch(migration, /'sylhet'|'khulna'/);
