import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { places, suggestedPlacesForDistrict } from "../src/data/tourism.js";
import { KHULNA_DISTRICT_IDS, KHULNA_PLACE_COORDINATES, KHULNA_ROAD_ACCESS_COORDINATES } from "../src/data/khulna-coordinates.js";
import { maxTripDaysForPlaceCount, planDistrictTour } from "../src/lib/route.js";
import { buildValhallaRoutingUrl, isCoordinateInsideBangladesh, loadRoadRoute, routeStaysInsideBangladesh } from "../src/lib/road-map.js";

await test("Khulna pins, scoped IDs, day limits and loaders stay consistent", () => {
  assert.equal(Object.keys(KHULNA_PLACE_COORDINATES).length, 67);
  assert.equal(KHULNA_DISTRICT_IDS.length, 10);
  assert.equal(new Set(places.map((place) => place.id)).size, places.length);
  for (const [district, count] of Object.entries({ khulna: 7, bagerhat: 10, satkhira: 8, jashore: 7, narail: 5, magura: 5, jhenaidah: 6, kushtia: 7, chuadanga: 6, meherpur: 6 })) {
    const destinations = suggestedPlacesForDistrict(district);
    assert.equal(destinations.length, count);
    assert.equal(new Set(destinations.map((place) => JSON.stringify(place.coordinates))).size, count);
    for (const place of destinations) {
      assert.deepEqual(place.coordinates, KHULNA_PLACE_COORDINATES[`${district}:${place.slug}`]);
      assert.equal(place.coordinatesAreApproximate, false);
      assert.equal(place.roadRoutingProfile, "shortest-astar");
      assert.ok(isCoordinateInsideBangladesh([place.coordinates.lng, place.coordinates.lat]), place.id);
    }
    assert.equal(planDistrictTour(district, count).dayPlans.length, count);
    assert.equal(maxTripDaysForPlaceCount(count), count);
    assert.throws(() => planDistrictTour(district, count + 1), RangeError);
  }
  for (const [key, coordinate] of Object.entries(KHULNA_ROAD_ACCESS_COORDINATES)) {
    assert.ok(isCoordinateInsideBangladesh([coordinate.lng, coordinate.lat]), key);
    const place = places.find((place) => `${place.districtId}:${place.slug}` === key);
    assert.deepEqual(place.roadAccessCoordinates, coordinate);
  }
  for (const place of places) assert.equal(place.roadRoutingProfile, "shortest-astar", place.id);
  assert.equal(places.find((place) => place.id === "mir-mosharraf-hossain-memorial").districtId, "rajbari");
  assert.equal(places.find((place) => place.id === "liberation-war-memorial-sites").districtId, "kurigram");
  const loader = readFileSync(new URL("../src/lib/tourism-content.js", import.meta.url), "utf8");
  assert.match(loader, /KHULNA_PLACE_COORDINATES\[districtKey\]/);
  assert.match(loader, /KHULNA_PLACE_IDS\[districtKey\]/);
  assert.match(loader, /KHULNA_ROAD_ACCESS_COORDINATES\[districtKey\]/);
  assert.match(loader, /roadRoutingProfile: "shortest-astar"/);
});

await test("migration 068 updates only Khulna's 67 district-scoped destination pins", () => {
  const sql = readFileSync(new URL("../supabase/migrations/068_khulna_division_place_coordinates.sql", import.meta.url), "utf8");
  assert.equal([...sql.matchAll(/::numeric, [-\d.]+::numeric\)/g)].length, 67);
  assert.match(sql, /mapped\.district_slug = district\.slug/);
  assert.match(sql, /place\.district_id = district\.id/);
  assert.match(sql, /place\.slug = mapped\.slug/);
  assert.doesNotMatch(sql, /'sylhet'|'rajbari'|'kurigram'/);
  for (const [key, coordinate] of Object.entries(KHULNA_PLACE_COORDINATES)) {
    const [district, slug] = key.split(":");
    assert.ok(sql.includes(`('${district}', '${slug}', ${coordinate.lat.toFixed(7)}::numeric, ${coordinate.lng.toFixed(7)}::numeric)`), key);
  }
});

const origin = { coordinates: { lat: 22.82, lng: 89.55 } };
const destination = places.find((place) => place.slug === "rupsha-bridge");
const safeGeometry = [[89.55, 22.82], [89.5838078, 22.7777187], [89.55, 22.82]];
const foreignGeometry = [[89.55, 22.82], [88.3, 23.5], [89.55, 22.82]];
const response = (routes) => ({ ok: true, json: async () => ({ code: "Ok", routes }) });
const candidate = (coordinates, distance) => ({ geometry: { coordinates }, distance, duration: 600 });
const cacheKey = "22.82000,89.55000|22.77772,89.58381|22.82000,89.55000|shortest-astar-v1";
const storageKey = "tourismubd-road-routes-v3";

await test("shortest A* uses distance costing without changing default Valhalla options", () => {
  const defaultOptions = JSON.parse(new URL(buildValhallaRoutingUrl([origin, destination])).searchParams.get("json"));
  assert.equal(defaultOptions.costing_options, undefined);
  assert.equal(defaultOptions.exclude_locations, undefined);
  const shortest = JSON.parse(new URL(buildValhallaRoutingUrl([origin, destination], undefined, { shortest: true, excludeLocations: [{ lat: 23.5, lon: 88.3 }] })).searchParams.get("json"));
  assert.deepEqual(shortest.costing_options.auto, { shortest: true, disable_hierarchy_pruning: true });
  assert.deepEqual(shortest.exclude_locations, [{ lat: 23.5, lon: 88.3 }]);
});

await test("shortest A* chooses the shortest safe candidate and isolates and revalidates its cache", async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  let cache = { [cacheKey.replace("|shortest-astar-v1", "")]: { coordinates: [[23.5, 88.3]], distanceKm: 1 } };
  globalThis.localStorage = { getItem: () => JSON.stringify(cache), setItem: (key, value) => { assert.equal(key, storageKey); cache = JSON.parse(value); } };
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls += 1;
    assert.match(url, /^https:\/\/valhalla1\.openstreetmap\.de\/route/);
    const options = JSON.parse(new URL(url).searchParams.get("json"));
    assert.equal(options.costing_options.auto.shortest, true);
    assert.equal(options.locations.length, 3);
    return response([candidate(foreignGeometry, 1000), candidate(safeGeometry, 18000), candidate(safeGeometry, 14000)]);
  };
  try {
    const route = await loadRoadRoute([origin, destination]);
    assert.equal(route.distanceKm, 14);
    assert.equal(route.routingEngine, "valhalla-astar");
    assert.equal(route.routingMetric, "distance");
    assert.equal(routeStaysInsideBangladesh(route.coordinates.map(([lat, lng]) => [lng, lat])), true);
    await loadRoadRoute([origin, destination]);
    assert.equal(calls, 1);
    cache[cacheKey].coordinates = [[NaN, NaN], [NaN, NaN]];
    await loadRoadRoute([origin, destination]);
    assert.equal(calls, 2);
    cache[cacheKey].coordinates = {};
    await loadRoadRoute([origin, destination]);
    assert.equal(calls, 3);
    cache[cacheKey].distanceKm = -1;
    await loadRoadRoute([origin, destination]);
    assert.equal(calls, 4);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalStorage;
  }
});

await test("foreign road excursions trigger hard-edge exclusions, never a fastest-route fallback", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url) => {
    const options = JSON.parse(new URL(url).searchParams.get("json"));
    requests.push(options);
    return response([candidate(requests.length === 1 ? foreignGeometry : safeGeometry, 14000)]);
  };
  try {
    await loadRoadRoute([origin, destination]);
    assert.equal(requests.length, 2);
    assert.ok(requests[1].exclude_locations.length > 0);
    assert.ok(requests[1].exclude_locations.every(({ lat, lon }) => !isCoordinateInsideBangladesh([lon, lat])));
    assert.ok(requests.every((options) => options.costing_options.auto.shortest));
  } finally { globalThis.fetch = originalFetch; }
});

await test("unavailable or foreign shortest routes are rejected; forest drives stop at the mainland", async () => {
  const originalFetch = globalThis.fetch;
  const forest = places.find((place) => place.id === "satkhira:sundarbans");
  assert.match(forest.practicalTip, /Road distance excludes boat travel/);
  let options;
  globalThis.fetch = async (url) => {
    options = JSON.parse(new URL(url).searchParams.get("json"));
    return response([candidate(foreignGeometry, 1000)]);
  };
  try {
    await assert.rejects(loadRoadRoute([origin, destination]), { code: "ROUTE_OUTSIDE_BANGLADESH" });
    await assert.rejects(loadRoadRoute([origin, { ...destination, coordinates: { lat: 23.5, lng: 88.3 } }]), { code: "ROUTE_OUTSIDE_BANGLADESH" });
    await assert.rejects(loadRoadRoute([origin, forest]), { code: "ROUTE_OUTSIDE_BANGLADESH" });
    assert.deepEqual(options.locations[1], { lat: forest.roadAccessCoordinates.lat, lon: forest.roadAccessCoordinates.lng });
    globalThis.fetch = async () => response([]);
    await assert.rejects(loadRoadRoute([origin, destination]), /No shortest-distance A\* road route/);
    globalThis.fetch = async () => response([candidate([[NaN, NaN], [NaN, NaN]], 1000), candidate(safeGeometry, null)]);
    await assert.rejects(loadRoadRoute([origin, destination]), /No shortest-distance A\* road route/);
  } finally { globalThis.fetch = originalFetch; }
});

await test("malformed border geometry fails closed", () => {
  for (const geometry of [null, [], [[NaN, NaN], [NaN, NaN]], [[Infinity, 22.82], [89.55, 22.82]], [null, [89.55, 22.82]], [[89.55], [89.55, 22.82]]]) {
    assert.equal(routeStaysInsideBangladesh(geometry), false);
  }
});

await test("long A* itineraries respect the ten-point limit without adding return detours", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  const waypoints = Array.from({ length: 11 }, (_, index) => ({
    coordinates: { lat: 22.82 + index * 0.001, lng: 89.55 }, roadRoutingProfile: "shortest-astar",
  }));
  globalThis.fetch = async (url) => {
    const options = JSON.parse(new URL(url).searchParams.get("json"));
    requests.push(options.locations);
    assert.ok(options.locations.length <= 10);
    return response([candidate(options.locations.map(({ lat, lon }) => [lon, lat]), 1000)]);
  };
  try {
    const route = await loadRoadRoute(waypoints);
    assert.equal(requests.length, 2);
    assert.deepEqual(requests[0].at(-1), requests[1][0]);
    assert.deepEqual(requests[1].at(-1), { lat: 22.82, lon: 89.55 });
    assert.equal(route.distanceKm, 2);
    assert.equal(route.coordinates.length, 13);
  } finally { globalThis.fetch = originalFetch; }
});
