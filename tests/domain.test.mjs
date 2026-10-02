import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildGeocodingUrl, buildRoutingUrl, buildValhallaRoutingUrl, closeRouteWaypoints, expandDistrictReturnWaypoints, expandSafeRouteWaypoints, isCoordinateInsideBangladesh, loadRoadRoute, routeStaysInsideBangladesh } from "../src/lib/road-map.js";
import { findNearbyPlaces, maxTripDaysForPlaceCount, planDailyRoute, planDistrictTour, planRoute, splitRouteIntoDays, validateBookingDuration } from "../src/lib/route.js";
import { places, suggestedPlacesForDistrict } from "../src/data/tourism.js";
import { districtPlaceId, RAJSHAHI_PLACE_COORDINATES, RAJSHAHI_ROAD_ACCESS_COORDINATES } from "../src/data/rajshahi-coordinates.js";
import { BARISHAL_PLACE_COORDINATES, BARISHAL_ROAD_ACCESS_COORDINATES } from "../src/data/barishal-coordinates.js";

const route = planRoute(["lalakhal", "jaflong", "ratargul-swamp-forest"]);
assert.deepEqual(
  route.orderedPlaces.map(({ id }) => id),
  ["ratargul-swamp-forest", "jaflong", "lalakhal"],
);
assert.ok(route.totalDistanceKm > 0);
assert.ok(route.totalMinutes > 0);
assert.equal(findNearbyPlaces("malnichhara-tea-estate", 1)[0].id, "hazrat-shah-jalal-dargah");

assert.equal(validateBookingDuration({
  providerType: "SMALL_BOAT",
  waterArea: "Sundarbans",
  durationDays: 2,
}).valid, false);
assert.equal(validateBookingDuration({
  providerType: "SMALL_BOAT",
  waterArea: "Sundarbans",
  durationDays: 1,
}).valid, true);
assert.equal(validateBookingDuration({
  providerType: "HOUSEBOAT",
  waterArea: "Sundarbans",
  durationDays: 2,
}).valid, true);
assert.equal(validateBookingDuration({ providerType: "PARKING", durationDays: 1 }).valid, true);
assert.equal(suggestedPlacesForDistrict("sylhet").length, 12);
assert.equal(suggestedPlacesForDistrict("moulvibazar").length, 11);
assert.equal(suggestedPlacesForDistrict("habiganj").length, 7);
assert.equal(suggestedPlacesForDistrict("sunamganj").length, 9);
assert.equal(suggestedPlacesForDistrict("mymensingh").length, 9);
assert.equal(suggestedPlacesForDistrict("jamalpur").length, 7);
assert.equal(suggestedPlacesForDistrict("netrokona").length, 9);
assert.equal(suggestedPlacesForDistrict("sherpur").length, 8);
assert.equal(suggestedPlacesForDistrict("rangpur").length, 7);
assert.equal(suggestedPlacesForDistrict("dinajpur").length, 8);
assert.equal(suggestedPlacesForDistrict("panchagarh").length, 9);
assert.equal(suggestedPlacesForDistrict("thakurgaon").length, 6);
assert.equal(suggestedPlacesForDistrict("nilphamari").length, 6);
assert.equal(suggestedPlacesForDistrict("lalmonirhat").length, 6);
assert.equal(suggestedPlacesForDistrict("kurigram").length, 7);
assert.equal(suggestedPlacesForDistrict("gaibandha").length, 7);
assert.equal(suggestedPlacesForDistrict("dhaka").length, 18);
assert.equal(suggestedPlacesForDistrict("faridpur").length, 7);
assert.equal(suggestedPlacesForDistrict("gazipur").length, 7);
assert.equal(suggestedPlacesForDistrict("gopalganj").length, 7);
assert.equal(suggestedPlacesForDistrict("kishoreganj").length, 9);
assert.equal(suggestedPlacesForDistrict("madaripur").length, 6);
assert.equal(suggestedPlacesForDistrict("manikganj").length, 6);
assert.equal(suggestedPlacesForDistrict("munshiganj").length, 8);
assert.equal(suggestedPlacesForDistrict("narayanganj").length, 9);
assert.equal(suggestedPlacesForDistrict("narsingdi").length, 6);
assert.equal(suggestedPlacesForDistrict("rajbari").length, 6);
assert.equal(suggestedPlacesForDistrict("shariatpur").length, 6);
assert.equal(suggestedPlacesForDistrict("tangail").length, 8);
assert.equal(suggestedPlacesForDistrict("chattogram").length, 15);
assert.equal(suggestedPlacesForDistrict("coxs-bazar").length, 17);
assert.equal(suggestedPlacesForDistrict("bandarban").length, 16);
assert.equal(suggestedPlacesForDistrict("rangamati").length, 11);
assert.equal(suggestedPlacesForDistrict("khagrachhari").length, 9);
assert.equal(suggestedPlacesForDistrict("cumilla").length, 9);
assert.equal(suggestedPlacesForDistrict("brahmanbaria").length, 7);
assert.equal(suggestedPlacesForDistrict("chandpur").length, 7);
assert.equal(suggestedPlacesForDistrict("feni").length, 7);
assert.equal(suggestedPlacesForDistrict("lakshmipur").length, 6);
assert.equal(suggestedPlacesForDistrict("noakhali").length, 8);
assert.deepEqual(suggestedPlacesForDistrict("unknown"), []);

for (const slug of ["foy-s-lake", "boga-lake", "kaptai-lake", "muhuri-lake"]) {
  assert.equal(places.find((place) => place.slug === slug)?.category, "Lake", slug);
}

const legacyIdPlaces = suggestedPlacesForDistrict("sylhet").slice(0, 2);
legacyIdPlaces.forEach((place, index) => { place.databaseId = `legacy-database-id-${index}`; });
assert.deepEqual(
  new Set(planRoute(legacyIdPlaces.map((place) => place.databaseId)).orderedPlaces.map((place) => place.id)),
  new Set(legacyIdPlaces.map((place) => place.id)),
);
legacyIdPlaces.forEach((place) => { delete place.databaseId; });

const districtTour = planDistrictTour("sylhet", 2);
assert.equal(districtTour.orderedPlaces.length, 12);
assert.deepEqual(districtTour.dayPlans.map((plan) => plan.places.length), [6, 6]);
assert.deepEqual(planDistrictTour("sylhet", 1).dayPlans.map((plan) => plan.places.length), [12]);
assert.deepEqual(planDistrictTour("sylhet", 12).dayPlans.map((plan) => plan.places.length), [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
assert.equal(planDistrictTour("moulvibazar", 11).dayPlans.length, 11);
assert.equal(planDistrictTour("sunamganj", 9).dayPlans.length, 9);
assert.throws(() => planDistrictTour("moulvibazar", 12), /allow at most 11 days/);
assert.throws(() => planDistrictTour("sunamganj", 10), /allow at most 9 days/);
assert.throws(() => planDistrictTour("mymensingh", 10), /allow at most 9 days/);
assert.throws(() => planDistrictTour("jamalpur", 8), /allow at most 7 days/);
assert.throws(() => planDistrictTour("netrokona", 10), /allow at most 9 days/);
assert.throws(() => planDistrictTour("sherpur", 9), /allow at most 8 days/);
assert.equal(planDistrictTour("dhaka", 12).dayPlans.length, 12);
assert.throws(() => planDistrictTour("faridpur", 8), /allow at most 7 days/);
assert.throws(() => planDistrictTour("kishoreganj", 10), /allow at most 9 days/);
assert.throws(() => planDistrictTour("tangail", 9), /allow at most 8 days/);
assert.equal(planDistrictTour("chattogram", 12).dayPlans.length, 12);
assert.equal(planDistrictTour("coxs-bazar", 12).dayPlans.length, 12);
assert.equal(planDistrictTour("bandarban", 12).dayPlans.length, 12);
assert.throws(() => planDistrictTour("rangamati", 12), /allow at most 11 days/);
assert.throws(() => planDistrictTour("khagrachhari", 10), /allow at most 9 days/);
assert.throws(() => planDistrictTour("lakshmipur", 7), /allow at most 6 days/);
assert.throws(() => planDistrictTour("sylhet", 0), /at least 1 day/);
assert.equal(planRoute(suggestedPlacesForDistrict("sylhet").slice(0, 6).map((place) => place.id)).orderedPlaces.length, 6);

const ninePlaceRoute = planRoute(suggestedPlacesForDistrict("sylhet").slice(0, 9).map((place) => place.id));
assert.deepEqual(splitRouteIntoDays(ninePlaceRoute.orderedPlaces, 2).map((plan) => plan.places.length), [5, 4]);
assert.deepEqual(splitRouteIntoDays(ninePlaceRoute.orderedPlaces, 3).map((plan) => plan.places.length), [3, 3, 3]);
assert.equal(maxTripDaysForPlaceCount(2), 1);
assert.equal(maxTripDaysForPlaceCount(4), 4);
assert.throws(() => splitRouteIntoDays(route.orderedPlaces.slice(0, 2), 2), /allow at most 1 day/);
assert.throws(() => splitRouteIntoDays([...route.orderedPlaces, places.find((place) => place.id === "bichanakandi")], 5), /allow at most 4 days/);
const dailyRoute = planDailyRoute(route, 2);
assert.equal(dailyRoute.legs.at(-1).to, dailyRoute.start.name);
assert.ok(dailyRoute.totalDistanceKm > route.totalDistanceKm);
assert.match(buildGeocodingUrl("Bichanakandi, Bangladesh"), /nominatim\.openstreetmap\.org\/search/);
assert.match(buildRoutingUrl([{ coordinates: { lat: 24.9, lng: 91.8 } }, { coordinates: { lat: 25, lng: 92 } }]), /91\.8,24\.9;92,25/);
assert.match(buildValhallaRoutingUrl([{ coordinates: { lat: 24.9, lng: 91.8 } }, { coordinates: { lat: 25, lng: 92 } }]), /valhalla1\.openstreetmap\.de\/route/);
assert.match(decodeURIComponent(buildValhallaRoutingUrl([{ coordinates: { lat: 24.9, lng: 91.8 } }, { coordinates: { lat: 25, lng: 92 } }])), /"shape_format":"geojson"/);
assert.equal(places.find((place) => place.slug === "utma-chhara").coordinatesAreApproximate, false);
assert.equal(places.find((place) => place.slug === "tamabil").coordinatesAreApproximate, false);
for (const districtId of ["moulvibazar", "habiganj", "sunamganj"]) {
  const districtPlaces = places.filter((place) => place.districtId === districtId);
  assert.ok(districtPlaces.length > 0);
  assert.equal(districtPlaces.every((place) => place.coordinatesAreApproximate === false), true);
  assert.equal(new Set(districtPlaces.map((place) => `${place.coordinates.lat},${place.coordinates.lng}`)).size, districtPlaces.length);
  assert.equal(districtPlaces.every((place) => isCoordinateInsideBangladesh([place.coordinates.lng, place.coordinates.lat])), true);
}
for (const districtId of ["mymensingh", "jamalpur", "netrokona", "sherpur"]) {
  const districtPlaces = places.filter((place) => place.districtId === districtId);
  assert.ok(districtPlaces.length > 0);
  assert.equal(districtPlaces.every((place) => place.coordinatesAreApproximate === false), true);
  assert.equal(new Set(districtPlaces.map((place) => `${place.coordinates.lat},${place.coordinates.lng}`)).size, districtPlaces.length);
  assert.equal(districtPlaces.every((place) => isCoordinateInsideBangladesh([place.coordinates.lng, place.coordinates.lat])), true);
  assert.equal(districtPlaces.every((place) => place.districtCenterCoordinates.lng >= 89 && place.districtCenterCoordinates.lng <= 91.2), true);
}
for (const districtId of ["rangpur", "dinajpur", "panchagarh", "thakurgaon", "nilphamari", "lalmonirhat", "kurigram", "gaibandha"]) {
  const districtPlaces = places.filter((place) => place.districtId === districtId);
  assert.ok(districtPlaces.length > 0);
  assert.equal(districtPlaces.every((place) => place.coordinatesAreApproximate === false), true);
  assert.equal(new Set(districtPlaces.map((place) => `${place.coordinates.lat},${place.coordinates.lng}`)).size, districtPlaces.length);
  assert.equal(districtPlaces.every((place) => isCoordinateInsideBangladesh([place.coordinates.lng, place.coordinates.lat])), true);
  assert.equal(districtPlaces.every((place) => place.districtCenterCoordinates.lat >= 25 && place.districtCenterCoordinates.lat <= 26.5), true);
  assert.equal(districtPlaces.every((place) => place.districtCenterCoordinates.lng >= 88 && place.districtCenterCoordinates.lng <= 90), true);
}
for (const districtId of ["dhaka", "faridpur", "gazipur", "gopalganj", "kishoreganj", "madaripur", "manikganj", "munshiganj", "narayanganj", "narsingdi", "rajbari", "shariatpur", "tangail"]) {
  const districtPlaces = places.filter((place) => place.districtId === districtId);
  assert.ok(districtPlaces.length > 0);
  assert.equal(districtPlaces.every((place) => place.coordinatesAreApproximate === false), true);
  assert.equal(new Set(districtPlaces.map((place) => `${place.coordinates.lat},${place.coordinates.lng}`)).size, districtPlaces.length);
  assert.equal(districtPlaces.every((place) => isCoordinateInsideBangladesh([place.coordinates.lng, place.coordinates.lat])), true);
  assert.equal(districtPlaces.every((place) => place.districtCenterCoordinates.lat >= 22.8 && place.districtCenterCoordinates.lat <= 24.8), true);
  assert.equal(districtPlaces.every((place) => place.districtCenterCoordinates.lng >= 89.5 && place.districtCenterCoordinates.lng <= 91.2), true);
}
for (const districtId of ["chattogram", "coxs-bazar", "bandarban", "rangamati", "khagrachhari", "cumilla", "brahmanbaria", "chandpur", "feni", "lakshmipur", "noakhali"]) {
  const districtPlaces = places.filter((place) => place.districtId === districtId);
  assert.ok(districtPlaces.length > 0);
  assert.equal(districtPlaces.every((place) => place.coordinatesAreApproximate === false), true);
  assert.equal(new Set(districtPlaces.map((place) => `${place.coordinates.lat},${place.coordinates.lng}`)).size, districtPlaces.length);
  assert.equal(districtPlaces.every((place) => isCoordinateInsideBangladesh([place.coordinates.lng, place.coordinates.lat])), true);
  assert.equal(districtPlaces.every((place) => place.districtCenterCoordinates.lat >= 20.5 && place.districtCenterCoordinates.lat <= 24.1), true);
  assert.equal(districtPlaces.every((place) => place.districtCenterCoordinates.lng >= 90.5 && place.districtCenterCoordinates.lng <= 92.6), true);
}
assert.deepEqual(
  places.find((place) => place.slug === "lauchapra-picnic-spot").districtCenterCoordinates,
  { lat: 24.92701, lng: 89.948042 },
);
for (const slug of ["bichanakandi", "ham-ham-waterfall", "hakaluki-haor", "madhabkunda-waterfall", "panihata-tarani-hills", "tanguar-haor", "teliapara-memorial", "banglabandha-zero-point", "brahmaputra-jamuna-riverfront", "brahmaputra-river", "burimari-land-port", "dhepa-river", "river-chars", "river-islands-chars", "tin-bigha-corridor-area", "buriganga-river", "faridpur-riverfront", "belai-beel", "madhumati-river", "nikli-haor", "mithamain-haor", "austagram-haor", "arial-khan-river", "paturia-ghat", "aricha-ghat", "kaliganga-river-area", "mawa-padma-riverfront", "padma-bridge-viewpoint", "langalband", "meghna-river-narayanganj", "meghna-river-narsingdi", "goalanda-ghat", "daulatdia-riverfront", "padma-river-rajbari", "padma-river-shariatpur", "naria-riverbank", "jamuna-river-tangail", "guliakhali-sea-beach", "khoiyachora-waterfall", "napittachora-trail", "sahasradhara-waterfall", "maheshkhali-island", "adinath-temple", "sonadia-island", "naf-river", "st-martin-s-island", "chera-dwip", "shah-porir-dwip", "teknaf-wildlife-sanctuary", "boga-lake", "keokradong", "nafakhum-waterfall", "amiakhum-waterfall", "jadipai-waterfall", "tindu", "remakri", "rijuk-waterfall", "debotakhum", "dim-pahar", "kaptai-lake", "shuvolong-waterfall", "risang-richhang-waterfall", "mayung-kopal", "hatimura", "matai-pukhiri", "taiduchhara-waterfall", "titas-river", "anderson-canal", "chandpur-three-river-estuary", "meghna-river", "padma-meghna-dakatia-confluence", "chandpur-riverfront", "muhuri-lake", "feni-river", "ramgati-meghna-riverfront", "alexander-meghna-embankment", "nijhum-dwip", "nijhum-dwip-national-park", "hatiya-island", "meghna-estuary"]) {
  const destination = places.find((place) => place.slug === slug);
  assert.ok(destination.roadAccessCoordinates);
  assert.notDeepEqual(destination.roadAccessCoordinates, destination.coordinates);
  assert.equal(isCoordinateInsideBangladesh([destination.roadAccessCoordinates.lng, destination.roadAccessCoordinates.lat]), true);
}
const originalFetch = globalThis.fetch;
assert.equal(Object.keys(BARISHAL_PLACE_COORDINATES).length, 48);
for (const [districtId, count] of Object.entries({ barishal: 8, patuakhali: 10, bhola: 8, jhalokathi: 7, pirojpur: 7, barguna: 8 })) {
  const districtPlaces = suggestedPlacesForDistrict(districtId);
  assert.equal(districtPlaces.length, count);
  assert.equal(new Set(districtPlaces.map((place) => place.id)).size, count);
  assert.equal(new Set(districtPlaces.map((place) => `${place.coordinates.lat},${place.coordinates.lng}`)).size, count);
  for (const place of districtPlaces) {
    assert.deepEqual(place.coordinates, BARISHAL_PLACE_COORDINATES[`${districtId}:${place.slug}`]);
    assert.equal(places.filter((candidate) => candidate.id === place.id).length, 1);
    assert.equal(place.coordinatesAreApproximate, false);
    assert.ok(isCoordinateInsideBangladesh([place.coordinates.lng, place.coordinates.lat]), place.id);
  }
  const tour = planDistrictTour(districtId, count);
  assert.equal(tour.orderedPlaces.length, count);
  assert.ok(tour.orderedPlaces.every((place) => place.districtId === districtId));
  assert.equal(tour.dayPlans.length, count);
  assert.equal(maxTripDaysForPlaceCount(count), count);
  assert.throws(() => planDistrictTour(districtId, count + 1), RangeError);
}
for (const [key, coordinates] of Object.entries(BARISHAL_ROAD_ACCESS_COORDINATES)) {
  const [districtId, slug] = key.split(":");
  const destination = places.find((place) => place.districtId === districtId && place.slug === slug);
  assert.deepEqual(destination.roadAccessCoordinates, coordinates);
  assert.notDeepEqual(destination.coordinates, coordinates);
  assert.ok(isCoordinateInsideBangladesh([coordinates.lng, coordinates.lat]), key);
}
const bholaMeghna = places.find((place) => place.id === "bhola:meghna-river");
const chandpurMeghna = places.find((place) => place.id === "meghna-river");
assert.equal(chandpurMeghna.districtId, "chandpur");
assert.notDeepEqual(bholaMeghna.coordinates, chandpurMeghna.coordinates);
assert.equal(planRoute([bholaMeghna.id, "jacob-tower"]).orderedPlaces.length, 2);
for (const slug of ["fatrar-char", "monpura-island", "char-kukri-mukri-wildlife-sanctuary", "tarua-sea-beach", "dhal-char"]) {
  const destination = places.find((place) => place.slug === slug);
  assert.ok(destination.roadAccessCoordinates);
  assert.match(destination.practicalTip, /Road distance excludes the boat journey/);
}
assert.match(places.find((place) => place.slug === "sujabad-fort-area").practicalTip, /not a surveyed ruins pin/);
const bholaRoutingRequests = [];
globalThis.fetch = async (url) => {
  bholaRoutingRequests.push(url);
  return {
    ok: true,
    json: async () => ({
      code: "Ok",
      routes: [{ geometry: { coordinates: [[90.65, 22.69], [90.6639, 22.0172], [90.65, 22.69]] }, distance: 1000, duration: 600 }],
    }),
  };
};
try {
  await loadRoadRoute([
    { name: "Bhola Town Center", coordinates: { lat: 22.69, lng: 90.65 } },
    places.find((place) => place.slug === "tarua-sea-beach"),
  ]);
  assert.equal(bholaRoutingRequests.length, 1);
  assert.match(bholaRoutingRequests[0], /^https:\/\/valhalla1\.openstreetmap\.de\/route/);
  const options = JSON.parse(new URL(bholaRoutingRequests[0]).searchParams.get("json"));
  assert.deepEqual(options.locations, [
    { lat: 22.69, lon: 90.65 },
    { lat: 22.0172, lon: 90.6639 },
    { lat: 22.69, lon: 90.65 },
  ]);
  assert.equal(options.costing_options.auto.shortest, true);
} finally {
  globalThis.fetch = originalFetch;
}
assert.equal(Object.keys(RAJSHAHI_PLACE_COORDINATES).length, 61);
for (const [districtId, count] of Object.entries({ rajshahi: 10, bogura: 8, naogaon: 7, natore: 7, chapainawabganj: 9, pabna: 8, sirajganj: 6, joypurhat: 6 })) {
  const districtPlaces = suggestedPlacesForDistrict(districtId);
  assert.equal(districtPlaces.length, count);
  assert.equal(new Set(districtPlaces.map((place) => place.id)).size, count);
  assert.equal(new Set(districtPlaces.map((place) => `${place.coordinates.lat},${place.coordinates.lng}`)).size, count);
  for (const place of districtPlaces) {
    assert.deepEqual(place.coordinates, RAJSHAHI_PLACE_COORDINATES[`${districtId}:${place.slug}`]);
    const drivingPoint = place.roadAccessCoordinates || place.coordinates;
    assert.ok(isCoordinateInsideBangladesh([drivingPoint.lng, drivingPoint.lat]), place.id);
  }
  const tour = planDistrictTour(districtId, count);
  assert.equal(tour.orderedPlaces.length, count);
  assert.ok(tour.orderedPlaces.every((place) => place.districtId === districtId));
  assert.equal(tour.dayPlans.length, count);
  assert.equal(maxTripDaysForPlaceCount(count), count);
  assert.throws(() => planDistrictTour(districtId, count + 1), RangeError);
}
assert.equal(districtPlaceId("bogura", "karatoya-river"), "bogura:karatoya-river");
assert.equal(districtPlaceId("panchagarh", "karatoya-river"), "karatoya-river");
assert.deepEqual(places.find((place) => place.id === "karatoya-river").coordinates, { lat: 26.335882, lng: 88.547012 });
assert.notDeepEqual(places.find((place) => place.id === "bogura:karatoya-river").coordinates, places.find((place) => place.id === "karatoya-river").coordinates);
assert.equal(new Set(places.filter((place) => place.slug === "chalan-beel").map((place) => place.id)).size, 3);
assert.equal(new Set(places.filter((place) => place.slug === "mango-orchards").map((place) => place.id)).size, 2);
for (const [key, coordinates] of Object.entries(RAJSHAHI_ROAD_ACCESS_COORDINATES)) {
  assert.ok(isCoordinateInsideBangladesh([coordinates.lng, coordinates.lat]), key);
}
const routingRequests = [];
globalThis.fetch = async (url) => {
  routingRequests.push(url);
  return {
    ok: true,
    json: async () => ({
      code: "Ok",
      routes: [{ geometry: { coordinates: [[91.777, 24.482], [91.868993, 24.271401], [91.777, 24.482]] }, distance: 1000, duration: 600 }],
    }),
  };
};
try {
  const hamHam = places.find((place) => place.slug === "ham-ham-waterfall");
  await loadRoadRoute([{ name: "Moulvibazar Town Center", coordinates: { lat: 24.482, lng: 91.777 } }, hamHam]);
  assert.equal(routingRequests.length, 1);
  assert.match(routingRequests[0], /^https:\/\/valhalla1\.openstreetmap\.de\/route/);
  const options = JSON.parse(new URL(routingRequests[0]).searchParams.get("json"));
  assert.deepEqual(options.locations[1], { lat: 24.271401, lon: 91.868993 });
  assert.equal(options.costing_options.auto.shortest, true);
} finally {
  globalThis.fetch = originalFetch;
}

const thirdRouterRequests = [];
globalThis.fetch = async (url) => {
  thirdRouterRequests.push(url);
  if (!url.startsWith("https://valhalla1.openstreetmap.de")) return { ok: false };
  return {
    ok: true,
    json: async () => ({
      code: "Ok",
      routes: [{ geometry: { coordinates: [[91.65, 24.65], [91.67, 24.67], [91.65, 24.65]] }, distance: 2000, duration: 900 }],
    }),
  };
};
try {
  const thirdRouterRoute = await loadRoadRoute([
    { name: "Fallback start", coordinates: { lat: 24.65, lng: 91.65 } },
    { name: "Fallback stop", coordinates: { lat: 24.67, lng: 91.67 } },
  ]);
  assert.equal(thirdRouterRequests.length, 3);
  assert.match(thirdRouterRequests[2], /^https:\/\/valhalla1\.openstreetmap\.de\/route/);
  assert.equal(thirdRouterRoute.distanceKm, 2);
} finally {
  globalThis.fetch = originalFetch;
}

let simultaneousRouteRequests = 0;
let peakRouteRequests = 0;
globalThis.fetch = async (url) => {
  simultaneousRouteRequests += 1;
  peakRouteRequests = Math.max(peakRouteRequests, simultaneousRouteRequests);
  await new Promise((resolve) => setTimeout(resolve, 20));
  simultaneousRouteRequests -= 1;
  const coordinates = decodeURIComponent(url.split("/driving/")[1].split("?")[0])
    .split(";")
    .map((pair) => pair.split(",").map(Number));
  return {
    ok: true,
    json: async () => ({ code: "Ok", routes: [{ geometry: { coordinates }, distance: 1000, duration: 600 }] }),
  };
};
try {
  await Promise.all(Array.from({ length: 5 }, (_, index) => loadRoadRoute([
    { name: `Start ${index}`, coordinates: { lat: 24.82 + (index * 0.005), lng: 91.8 } },
    { name: `Stop ${index}`, coordinates: { lat: 24.84 + (index * 0.005), lng: 91.82 } },
  ])));
  assert.equal(peakRouteRequests, 3);
} finally {
  globalThis.fetch = originalFetch;
}

const routeStorage = new Map();
const originalLocalStorage = globalThis.localStorage;
globalThis.localStorage = {
  getItem: (key) => routeStorage.get(key) || null,
  setItem: (key, value) => routeStorage.set(key, value),
};
let cachedRouteFetches = 0;
globalThis.fetch = async (url) => {
  cachedRouteFetches += 1;
  const coordinates = decodeURIComponent(url.split("/driving/")[1].split("?")[0])
    .split(";")
    .map((pair) => pair.split(",").map(Number));
  return {
    ok: true,
    json: async () => ({ code: "Ok", routes: [{ geometry: { coordinates }, distance: 1200, duration: 720 }] }),
  };
};
const cachedWaypoints = [
  { name: "Cache start", coordinates: { lat: 24.75, lng: 91.7 } },
  { name: "Cache stop", coordinates: { lat: 24.77, lng: 91.72 } },
];
try {
  await loadRoadRoute(cachedWaypoints);
  globalThis.fetch = async () => { throw new Error("Router unavailable"); };
  const cachedRoadRoute = await loadRoadRoute(cachedWaypoints);
  assert.equal(cachedRouteFetches, 1);
  assert.equal(cachedRoadRoute.distanceKm, 1.2);
} finally {
  globalThis.fetch = originalFetch;
  if (originalLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalLocalStorage;
}
const panthumai = places.find((place) => place.slug === "panthumai");
assert.equal(panthumai.coordinatesAreApproximate, false);
assert.equal(isCoordinateInsideBangladesh([panthumai.coordinates.lng, panthumai.coordinates.lat]), true);
const borderWaypoints = expandSafeRouteWaypoints([
  { name: "Jaflong", slug: "jaflong", coordinates: { lat: 25.166, lng: 92.017 } },
  { name: "Bichanakandi", slug: "bichanakandi", coordinates: { lat: 25.171, lng: 91.887 } },
]);
assert.ok(borderWaypoints.some((waypoint) => waypoint.slug === "gowainghat-road-junction"));
assert.deepEqual(
  closeRouteWaypoints([
    { name: "Sylhet Town Center" },
    { name: "Bichanakandi" },
  ]).map((waypoint) => waypoint.name),
  ["Sylhet Town Center", "Bichanakandi", "Sylhet Town Center"],
);
const panthumaiWaypoints = expandSafeRouteWaypoints([
  { name: "Sylhet Town Center", coordinates: { lat: 24.899, lng: 91.868 } },
  panthumai,
]);
assert.ok(panthumaiWaypoints.some((waypoint) => waypoint.slug === "gowainghat-road-junction"));
const dinajpurBorderWaypoints = expandSafeRouteWaypoints([
  places.find((place) => place.slug === "hili-area"),
  places.find((place) => place.slug === "ramsagar-national-park"),
]);
assert.ok(dinajpurBorderWaypoints.some((waypoint) => waypoint.slug === "dinajpur-town-road-junction"));
const shortestRouteRequests = [];
globalThis.fetch = async (url) => {
  shortestRouteRequests.push(url);
  const options = JSON.parse(new URL(url).searchParams.get("json"));
  const coordinates = options.locations.map(({ lon, lat }) => [lon, lat]);
  return {
    ok: true,
    json: async () => ({ code: "Ok", routes: [{ geometry: { coordinates }, distance: 72200, duration: 5520 }] }),
  };
};
try {
  const bichanakandi = places.find((place) => place.slug === "bichanakandi");
  const shortestRoute = await loadRoadRoute([
    { name: "Sylhet Town Center", coordinates: { lat: 24.894, lng: 91.868 } },
    bichanakandi,
  ]);
  assert.equal(shortestRouteRequests.length, 1);
  const options = JSON.parse(new URL(shortestRouteRequests[0]).searchParams.get("json"));
  assert.deepEqual(options.locations[1], { lat: 25.148132, lon: 91.8887184 });
  assert.equal(options.costing_options.auto.shortest, true);
  assert.equal(shortestRoute.distanceKm, 72.2);
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(
  expandDistrictReturnWaypoints([
    { name: "Start" },
    { name: "Stop 1" },
    { name: "Stop 2" },
  ]).map((waypoint) => waypoint.name),
  ["Start", "Stop 1", "Start", "Stop 2", "Start"],
);
assert.equal(isCoordinateInsideBangladesh([91.868, 24.894]), true);
assert.equal(isCoordinateInsideBangladesh([91.883, 25.25]), false);
assert.equal(routeStaysInsideBangladesh([[91.868, 24.894], [91.98, 25.09]]), true);
assert.equal(routeStaysInsideBangladesh([[91.868, 24.894], [91.883, 25.25]]), false);
assert.equal(routeStaysInsideBangladesh([[91.75, 25.17], [92.08, 25.17]]), false);

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const tourismContent = readFileSync(new URL("../src/lib/tourism-content.js", import.meta.url), "utf8");
assert.match(tourismContent, /const districtId = row\.districts\?\.slug \|\| row\.district_id/);
assert.match(tourismContent, /id: KHULNA_PLACE_IDS\[districtKey\] \|\| BARISHAL_PLACE_IDS\[districtKey\] \|\| districtPlaceId\(districtId, row\.slug\)/);
assert.match(tourismContent, /BARISHAL_PLACE_COORDINATES\[districtKey\]/);
assert.match(tourismContent, /BARISHAL_ROAD_ACCESS_COORDINATES\[districtKey\]/);
assert.match(tourismContent, /RAJSHAHI_PLACE_COORDINATES\[districtKey\]/);
assert.match(tourismContent, /FALLBACK_PLACE_COORDINATES\[districtKey\]/);
assert.match(tourismContent, /id: row\.slug/);
assert.match(tourismContent, /databaseId: row\.id/);
assert.match(tourismContent, /from\("places"\)[\s\S]*\.eq\("status", "PUBLISHED"\)/);
assert.match(tourismContent, /window\.addEventListener\("focus", refreshPublishedTourism\)/);
assert.match(tourismContent, /document\.addEventListener\("visibilitychange", refreshWhenVisible\)/);
assert.match(app, /message !== "\{\}"/);
assert.match(app, /Supabase could not \$\{action\}/);
assert.match(app, /Your service requests/);
assert.match(app, /Booking requests/);
assert.match(app, /onOpenBookings/);
assert.match(app, /function ProviderBookingRequestsPage/);
assert.match(app, /view === "booking-requests"/);
assert.match(app, /View \$\{providerTitle\(listing\)\} profile/);
assert.match(app, /Rate providers/);
assert.match(app, /function TravelerRatingsPage/);
assert.match(app, /view === "provider-ratings"/);
assert.match(app, /function AccountAboutPage/);
assert.match(app, /view === "account-about"/);
assert.doesNotMatch(app, /openAboutSignal/);
assert.match(app, /onSaved=\{\(profile\) => \{[\s\S]{0,100}onBack\(\); \}\}/);
assert.match(app, /Confirm booking/);
assert.match(app, /Mark completed/);
assert.match(app, /Cancel booking/);
assert.match(app, /CANCELLED/);
assert.match(app, /CancelBookingDialog/);
assert.match(app, /provider_booking_requests/);
assert.doesNotMatch(app, /Your booking requests/);
assert.match(app, /<b>Updates<\/b>/);
assert.match(app, /from\("notifications"\)/);
assert.match(app, /Your provider ratings/);
assert.match(app, /Your rating/);
assert.match(app, /from\("reviews"\)\.insert/);
assert.match(app, /from\("traveler_review_requests"\)/);
assert.match(app, /error\.code === "23505"/);
assert.match(app, /function ProviderRating/);
assert.match(app, /<ProviderRating profile=\{listing\}/);
assert.match(app, /loadSavedTrips\(user\.id\)/);
assert.match(app, /saveTrip\(trip, user\.id\)/);
assert.match(app, /\[auth\.user\?\.id\]/);
assert.match(app, /pendingRatings/);
assert.match(app, /traveler_review_requests/);
assert.match(app, /owner-menu-rating-count/);
assert.match(app, /owner-menu-trigger-badge/);
assert.match(app, /closeOutside/);
assert.match(app, /notification-list/);
assert.match(app, /pendingBookings/);
assert.match(app, /provider_booking_requests/);
assert.match(app, /owner-menu-booking-count/);
assert.match(app, /function SignOutDialog/);
assert.match(app, /Yes, sign out/);
assert.match(app, /setSignOutOpen\(true\)/);
assert.doesNotMatch(app, /Direct messaging is not available yet\./);
assert.match(app, /function MessageDialog/);
assert.match(app, /function MessageCenter/);
assert.match(app, /selectedConversationId/);
assert.match(app, /new globalThis\.Map\(\)/);
assert.match(app, /message-conversation/);
assert.match(app, /message-compose/);
assert.match(app, /message-profile-link/);
assert.match(app, /openMessageProfile/);
assert.match(app, /backLabel="Back to messages"/);
assert.match(app, /function PostCard/);
assert.match(app, /function RouteDayMap/);
assert.match(app, /className="route-map-canvas"/);
assert.match(app, /Start \/ return/);
assert.match(app, /permanent: false/);
assert.match(app, /tile\.openstreetmap\.org/);
assert.match(app, /tile\.opentopomap\.org/);
assert.match(app, /new ResizeObserver/);
assert.match(app, /new globalThis\.IntersectionObserver/);
assert.match(app, /Selected route could not be built/);
assert.doesNotMatch(app, /Travel updates from people on TourismuBD/);
assert.doesNotMatch(app, /Timeline updates are shared publicly/);
assert.match(app, /social_post_engagement/);
assert.match(app, /social_post_likes/);
assert.match(app, /social_post_comments/);
assert.match(app, /className="post-actions"/);
assert.match(app, /aria-label="Comments"/);
assert.match(app, /aria-label="Share post"/);
assert.match(app, /navigator\.share/);
assert.match(app, /from\("direct_messages"\)\.insert/);
assert.match(app, /from\("direct_messages"\)\.select/);
assert.match(app, /sender_name,sender_provider_type,recipient_name,recipient_provider_type/);
assert.match(app, /PROVIDER_TYPE_LABELS\[person\.provider_type\] \|\| "Traveler"/);
assert.match(app, /user\?\.id !== person\.id/);
assert.match(app, /onOpenMessages/);
assert.match(app, /Messages<ChevronRight/);
assert.match(app, /viewRequiresAuthentication/);
assert.match(app, /protectedView \? <LoginRequired/);
assert.match(app, /!protectedView && view === "services"/);
assert.match(app, /!protectedView && view === "people"/);
assert.match(app, /!protectedView && view === "feed"/);

console.log("domain tests passed");
