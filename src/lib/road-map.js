import { BANGLADESH_BOUNDARY } from "../data/bangladesh-boundary.js";

const DEFAULT_GEOCODING_URL = "https://nominatim.openstreetmap.org/search";
const DEFAULT_ROUTING_URL = "https://router.project-osrm.org/route/v1/driving";
const FALLBACK_ROUTING_URL = "https://routing.openstreetmap.de/routed-car/route/v1/driving";
const VALHALLA_ROUTING_URL = "https://valhalla1.openstreetmap.de/route";
const GEOCODE_CACHE_KEY = "tourismubd-place-coordinates";
const ROUTE_CACHE_KEY = "tourismubd-road-routes-v3";
const MAX_CACHED_ROUTES = 80;
const MAX_CONCURRENT_ROUTE_REQUESTS = 3;
const MAX_BORDER_SAMPLE_STEP = 0.0015;
const MAX_ASTAR_LOCATIONS = 10;
export const ROUTE_OUTSIDE_BANGLADESH = "ROUTE_OUTSIDE_BANGLADESH";
const GOWAINGHAT_ROAD_JUNCTION = Object.freeze({
  name: "Gowainghat road junction",
  slug: "gowainghat-road-junction",
  coordinates: { lat: 25.093746, lng: 91.982712 },
});
const DINAJPUR_TOWN_ROAD_JUNCTION = Object.freeze({
  name: "Dinajpur town road junction",
  slug: "dinajpur-town-road-junction",
  coordinates: { lat: 25.63, lng: 88.65 },
});
const SAFE_ROUTE_CORRIDORS = Object.freeze({
  "bichanakandi:jaflong": [GOWAINGHAT_ROAD_JUNCTION],
  "hili-area:ramsagar-national-park": [DINAJPUR_TOWN_ROAD_JUNCTION],
});
const NORTHERN_SYLHET_BORDER_STOPS = new Set(["bichanakandi", "jaflong", "panthumai", "tamabil", "utma-chhara"]);
const pendingGeocodes = new Map();
let geocodeQueue = Promise.resolve();
const pendingRouteRequests = [];
let activeRouteRequests = 0;
let lastGeocodeAt = 0;
let lastValhallaAt = 0;
let valhallaQueue = Promise.resolve();

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchJsonWithRetry(url, options, { attempts = 3, delay = 700, failureMessage, timeoutMs = 0 }) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let timeoutId;
    try {
      let signal = options.signal;
      let timeoutPromise;
      if (!signal && timeoutMs && typeof globalThis.AbortController === "function") {
        const controller = new globalThis.AbortController();
        timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        signal = controller.signal;
      } else if (!signal && timeoutMs) {
        timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(failureMessage)), timeoutMs);
        });
      }
      const fetchRequest = fetch(url, { ...options, signal });
      const response = timeoutPromise ? await Promise.race([fetchRequest, timeoutPromise]) : await fetchRequest;
      if (!response.ok) throw new Error(failureMessage);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(delay * attempt);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw lastError;
}

const validCoordinates = (coordinates) => Number.isFinite(Number(coordinates?.lat)) && Number.isFinite(Number(coordinates?.lng));
const coordinateKey = (coordinates) => validCoordinates(coordinates) ? `${Number(coordinates.lat).toFixed(5)},${Number(coordinates.lng).toFixed(5)}` : "";

function readCoordinateCache() {
  if (typeof localStorage === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(GEOCODE_CACHE_KEY) || "{}"); } catch { return {}; }
}

function writeCoordinateCache(cache) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache)); } catch { /* Browser storage may be unavailable. */ }
}

function readRouteCache() {
  if (typeof localStorage === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(ROUTE_CACHE_KEY) || "{}"); } catch { return {}; }
}

function writeRouteCache(key, route) {
  if (typeof localStorage === "undefined") return;
  try {
    const entries = Object.entries({
      ...readRouteCache(),
      [key]: { ...route, cachedAt: Date.now() },
    })
      .sort(([, left], [, right]) => Number(right.cachedAt || 0) - Number(left.cachedAt || 0))
      .slice(0, MAX_CACHED_ROUTES);
    localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch { /* Browser storage may be unavailable. */ }
}

export function buildGeocodingUrl(query, endpoint = DEFAULT_GEOCODING_URL) {
  const url = new URL(endpoint);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", query);
  url.searchParams.set("countrycodes", "bd");
  url.searchParams.set("limit", "1");
  return url.toString();
}

export function buildRoutingUrl(waypoints, endpoint = DEFAULT_ROUTING_URL) {
  const coordinates = waypoints.map(({ coordinates }) => `${Number(coordinates.lng)},${Number(coordinates.lat)}`).join(";");
  return `${endpoint}/${coordinates}?overview=full&geometries=geojson&steps=false`;
}

export function buildValhallaRoutingUrl(waypoints, endpoint = VALHALLA_ROUTING_URL, options = {}) {
  const url = new URL(endpoint);
  url.searchParams.set("json", JSON.stringify({
    locations: waypoints.map(({ coordinates }) => ({ lat: Number(coordinates.lat), lon: Number(coordinates.lng) })),
    costing: "auto",
    ...(options.shortest ? { costing_options: { auto: { shortest: true, disable_hierarchy_pruning: true } } } : {}),
    ...(options.excludeLocations?.length ? { exclude_locations: options.excludeLocations } : {}),
    directions_type: "none",
    format: "osrm",
    shape_format: "geojson",
    units: "kilometers",
  }));
  return url.toString();
}

function routeWaypointKey(waypoint) {
  return waypoint.slug || waypoint.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "";
}

function routePairKey(origin, destination) {
  return [routeWaypointKey(origin), routeWaypointKey(destination)].sort().join(":");
}

function safeRouteCorridor(origin, destination) {
  const explicitCorridor = SAFE_ROUTE_CORRIDORS[routePairKey(origin, destination)];
  if (explicitCorridor) return explicitCorridor;
  if (NORTHERN_SYLHET_BORDER_STOPS.has(routeWaypointKey(origin))
    || NORTHERN_SYLHET_BORDER_STOPS.has(routeWaypointKey(destination))) {
    return [GOWAINGHAT_ROAD_JUNCTION];
  }
  return [];
}

export function expandSafeRouteWaypoints(waypoints) {
  const closedWaypoints = closeRouteWaypoints(waypoints);
  return closedWaypoints.flatMap((waypoint, index) => {
    const destination = closedWaypoints[index + 1];
    if (!destination) return [waypoint];
    return [waypoint, ...safeRouteCorridor(waypoint, destination)];
  });
}

export function closeRouteWaypoints(waypoints) {
  if (!waypoints.length) return [];
  return [...waypoints, waypoints[0]];
}

export function expandDistrictReturnWaypoints(waypoints) {
  const [start, ...stops] = waypoints;
  if (!start || !stops.length) return waypoints;
  return [start, ...stops.flatMap((stop) => [stop, start])];
}

function pointInRing([lng, lat], ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [currentLng, currentLat] = ring[index];
    const [previousLng, previousLat] = ring[previous];
    const intersects = (currentLat > lat) !== (previousLat > lat)
      && lng < ((previousLng - currentLng) * (lat - currentLat)) / (previousLat - currentLat) + currentLng;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function isCoordinateInsideBangladesh(coordinates) {
  return BANGLADESH_BOUNDARY.some((polygon) => pointInRing(coordinates, polygon[0])
    && !polygon.slice(1).some((hole) => pointInRing(coordinates, hole)));
}

export function routeStaysInsideBangladesh(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2
    || coordinates.some((point) => !Array.isArray(point) || point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1]))) return false;
  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const [startLng, startLat] = coordinates[index];
    const [endLng, endLat] = coordinates[index + 1];
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(endLng - startLng), Math.abs(endLat - startLat)) / MAX_BORDER_SAMPLE_STEP));
    for (let step = 0; step <= steps; step += 1) {
      const ratio = step / steps;
      if (!isCoordinateInsideBangladesh([
        startLng + ((endLng - startLng) * ratio),
        startLat + ((endLat - startLat) * ratio),
      ])) return false;
    }
  }
  return true;
}

function requestValhallaRoute(routingWaypoints, options = {}) {
  const request = valhallaQueue.then(async () => {
    const waitTime = Math.max(0, 1100 - (Date.now() - lastValhallaAt));
    if (waitTime) await wait(waitTime);
    lastValhallaAt = Date.now();
    return fetchJsonWithRetry(
      buildValhallaRoutingUrl(routingWaypoints, VALHALLA_ROUTING_URL, options),
      { headers: { Accept: "application/json" } },
      { attempts: options.shortest ? 2 : 1, timeoutMs: 9000, failureMessage: options.shortest ? "Shortest-distance A* road route lookup failed" : "Fallback road route lookup failed" },
    );
  });
  valhallaQueue = request.catch(() => undefined);
  return request;
}

function geocode(query) {
  const key = query.toLowerCase();
  const cache = readCoordinateCache();
  if (validCoordinates(cache[key])) return Promise.resolve(cache[key]);
  if (pendingGeocodes.has(key)) return pendingGeocodes.get(key);

  const request = geocodeQueue.then(async () => {
    const waitTime = Math.max(0, 1100 - (Date.now() - lastGeocodeAt));
    if (waitTime) await wait(waitTime);
    lastGeocodeAt = Date.now();
    const [match] = await fetchJsonWithRetry(
      buildGeocodingUrl(query),
      { headers: { Accept: "application/json", "Accept-Language": "en" } },
      { attempts: 2, delay: 1100, failureMessage: "Place lookup failed" },
    );
    if (!match) return null;
    const coordinates = { lat: Number(match.lat), lng: Number(match.lon) };
    if (!validCoordinates(coordinates)) return null;
    const nextCache = readCoordinateCache();
    nextCache[key] = coordinates;
    writeCoordinateCache(nextCache);
    return coordinates;
  });
  geocodeQueue = request.catch(() => undefined);
  const resolved = request.catch(() => null).finally(() => pendingGeocodes.delete(key));
  pendingGeocodes.set(key, resolved);
  return resolved;
}

export async function resolveRouteWaypoints(start, places) {
  const district = places[0]?.district || "Bangladesh";
  const waypoints = [start, ...places];
  const coordinateCounts = waypoints.reduce((counts, waypoint) => {
    const key = coordinateKey(waypoint.coordinates);
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map());

  return Promise.all(waypoints.map(async (waypoint, index) => {
    const fallback = validCoordinates(waypoint.coordinates) ? { lat: Number(waypoint.coordinates.lat), lng: Number(waypoint.coordinates.lng) } : null;
    const repeated = fallback && coordinateCounts.get(coordinateKey(fallback)) > 1;
    const needsLookup = !fallback || waypoint.coordinatesAreApproximate || repeated;
    if (!needsLookup) return { ...waypoint, coordinates: fallback, coordinatesAreApproximate: false };
    const query = waypoint.geocodeQuery || [waypoint.name, waypoint.area, waypoint.district || district, "Bangladesh"].filter(Boolean).join(", ");
    const resolved = await geocode(query);
    return {
      ...waypoint,
      coordinates: resolved || fallback,
      coordinatesAreApproximate: !resolved && waypoint.coordinatesAreApproximate !== false,
    };
  }));
}

function singleStopLegMetrics(route, routingWaypoints) {
  if (routingWaypoints.length !== 3 || !Array.isArray(route.legs) || route.legs.length !== 2) return {};
  if (route.legs.some((leg) => !Number.isFinite(leg.distance) || leg.distance < 0 || !Number.isFinite(leg.duration) || leg.duration < 0)) return {};
  return {
    outboundDistanceKm: route.legs[0].distance / 1000,
    returnDistanceKm: route.legs[1].distance / 1000,
    outboundDurationMinutes: route.legs[0].duration / 60,
    returnDurationMinutes: route.legs[1].duration / 60,
  };
}

export function formatRoadRouteStatus(route, singleStop, accessNote = "") {
  if (singleStop && Number.isFinite(route.outboundDistanceKm) && Number.isFinite(route.returnDistanceKm)
    && Number.isFinite(route.outboundDurationMinutes)) {
    return `${route.outboundDistanceKm.toFixed(1)} km one way · ${route.returnDistanceKm.toFixed(1)} km return · ${route.distanceKm.toFixed(1)} km round trip · about ${Math.max(1, Math.round(route.outboundDurationMinutes))} min outbound${accessNote}`;
  }
  return `${route.distanceKm.toFixed(1)} km round trip · about ${Math.max(1, Math.round(route.durationMinutes))} min${accessNote}`;
}

function validAStarCandidate(route) {
  const coordinates = route?.geometry?.coordinates;
  return Array.isArray(coordinates) && coordinates.length >= 2
    && coordinates.every((point) => Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]))
    && route.distance != null && Number.isFinite(Number(route.distance)) && Number(route.distance) >= 0
    && route.duration != null && Number.isFinite(Number(route.duration)) && Number(route.duration) >= 0;
}

function outsideRoadLocations(coordinates) {
  const locations = [];
  let wasOutside = false;
  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const [lng, lat] = coordinates[index];
    const [nextLng, nextLat] = coordinates[index + 1];
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(nextLng - lng), Math.abs(nextLat - lat)) / MAX_BORDER_SAMPLE_STEP));
    for (let step = 0; step <= steps; step += 1) {
      const point = [lng + (nextLng - lng) * step / steps, lat + (nextLat - lat) * step / steps];
      const outside = !isCoordinateInsideBangladesh(point);
      if (outside && !wasOutside) locations.push({ lat: point[1], lon: point[0] });
      wasOutside = outside;
    }
  }
  return locations;
}

async function requestShortestAStarCandidates(waypoints, options) {
  if (waypoints.length <= MAX_ASTAR_LOCATIONS) return requestValhallaRoute(waypoints, options);
  const combined = { geometry: { coordinates: [] }, distance: 0, duration: 0 };
  // Overlap endpoints to respect the public service limit without adding return legs.
  for (let index = 0; index < waypoints.length - 1; index += MAX_ASTAR_LOCATIONS - 1) {
    const chunk = waypoints.slice(index, index + MAX_ASTAR_LOCATIONS);
    const result = await requestValhallaRoute(chunk, options);
    const route = result.code === "Ok" && Array.isArray(result.routes) && result.routes.filter(validAStarCandidate)
      .sort((left, right) => Number(left.distance) - Number(right.distance))[0];
    if (!route) throw new Error("No shortest-distance A* road route was found");
    combined.geometry.coordinates.push(...route.geometry.coordinates);
    combined.distance += Number(route.distance);
    combined.duration += Number(route.duration);
  }
  return { code: "Ok", routes: [combined] };
}

async function requestShortestAStarRoadRoute(waypoints) {
  if (waypoints.some(({ coordinates }) => !isCoordinateInsideBangladesh([Number(coordinates.lng), Number(coordinates.lat)]))) {
    const error = new Error("Road access points must be inside Bangladesh");
    error.code = ROUTE_OUTSIDE_BANGLADESH;
    throw error;
  }
  const routingWaypoints = closeRouteWaypoints(waypoints);
  const cacheKey = `${routingWaypoints.map((waypoint) => coordinateKey(waypoint.coordinates)).join("|")}|shortest-astar-v1`;
  const cachedRoute = readRouteCache()[cacheKey];
  if (cachedRoute?.routingEngine === "valhalla-astar" && cachedRoute.routingMetric === "distance"
    && Number.isFinite(cachedRoute.distanceKm) && cachedRoute.distanceKm >= 0
    && Number.isFinite(cachedRoute.durationMinutes) && cachedRoute.durationMinutes >= 0
    && Array.isArray(cachedRoute.coordinates)
    && routeStaysInsideBangladesh(cachedRoute.coordinates.map((point) => Array.isArray(point) ? [point[1], point[0]] : point))) return cachedRoute;

  const excluded = new Map();
  // Valhalla runs A* on its real road graph. Hard-exclude foreign roads and
  // re-search; never substitute a fastest route when distance routing fails.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await requestShortestAStarCandidates(routingWaypoints, { shortest: true, excludeLocations: [...excluded.values()] });
    const candidates = (result.code === "Ok" && Array.isArray(result.routes) ? result.routes : [])
      .filter(validAStarCandidate)
      .sort((left, right) => Number(left.distance) - Number(right.distance));
    if (!candidates.length) throw new Error("No shortest-distance A* road route was found");
    const route = candidates.find((candidate) => routeStaysInsideBangladesh(candidate.geometry.coordinates));
    if (route) {
      const roadRoute = {
        coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distanceKm: Number(route.distance) / 1000,
        durationMinutes: Number(route.duration) / 60,
        routingEngine: "valhalla-astar",
        routingMetric: "distance",
        ...singleStopLegMetrics(route, routingWaypoints),
      };
      writeRouteCache(cacheKey, roadRoute);
      return roadRoute;
    }
    const previousSize = excluded.size;
    for (const location of outsideRoadLocations(candidates[0].geometry.coordinates)) {
      if (excluded.size >= 20) break;
      excluded.set(`${location.lat.toFixed(5)},${location.lon.toFixed(5)}`, location);
    }
    if (excluded.size === previousSize) break;
  }
  const error = new Error("A Bangladesh-only shortest-distance road route is unavailable for these stops");
  error.code = ROUTE_OUTSIDE_BANGLADESH;
  throw error;
}

async function requestRoadRoute(waypoints) {
  const roadWaypoints = waypoints.map((waypoint) => ({
    ...waypoint,
    coordinates: waypoint.roadAccessCoordinates || waypoint.coordinates,
  }));
  if (roadWaypoints.some((waypoint) => !validCoordinates(waypoint.coordinates))) throw new Error("Route coordinates are unavailable");
  if (waypoints.some((waypoint) => waypoint.roadRoutingProfile === "shortest-astar")) return requestShortestAStarRoadRoute(roadWaypoints);
  const routeOptions = [
    closeRouteWaypoints(roadWaypoints),
    expandSafeRouteWaypoints(roadWaypoints),
    expandSafeRouteWaypoints(expandDistrictReturnWaypoints(roadWaypoints).slice(0, -1)),
  ]
    .map((routingWaypoints) => ({
      routingWaypoints,
      cacheKey: routingWaypoints.map((waypoint) => coordinateKey(waypoint.coordinates)).join("|"),
    }))
    .filter((option, index, options) => options.findIndex((item) => item.cacheKey === option.cacheKey) === index);
  let lastError;
  const routeCache = readRouteCache();
  const cachedFallbackRoutes = [];
  for (const [index, { cacheKey }] of routeOptions.entries()) {
    const cachedRoute = routeCache[cacheKey];
    if (cachedRoute?.coordinates?.length
      && routeStaysInsideBangladesh(cachedRoute.coordinates.map(([lat, lng]) => [lng, lat]))) {
      if (index === 0) return cachedRoute;
      cachedFallbackRoutes.push(cachedRoute);
    }
  }
  for (const endpoint of [DEFAULT_ROUTING_URL, FALLBACK_ROUTING_URL]) {
    for (const { routingWaypoints, cacheKey } of routeOptions) {
      let result;
      try {
        result = await fetchJsonWithRetry(
          buildRoutingUrl(routingWaypoints, endpoint),
          { headers: { Accept: "application/json" } },
          { attempts: 1, timeoutMs: 6500, failureMessage: "Road route lookup failed" },
        );
      } catch (error) {
        lastError = error;
        break;
      }
      const route = result.routes?.[0];
      if (result.code !== "Ok" || !route?.geometry?.coordinates?.length) {
        lastError = new Error("No road route was found");
        continue;
      }
      if (!routeStaysInsideBangladesh(route.geometry.coordinates)) {
        lastError = new Error("The road route leaves Bangladesh");
        lastError.code = ROUTE_OUTSIDE_BANGLADESH;
        continue;
      }
      const roadRoute = {
        coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distanceKm: route.distance / 1000,
        durationMinutes: route.duration / 60,
        ...singleStopLegMetrics(route, routingWaypoints),
      };
      writeRouteCache(cacheKey, roadRoute);
      return roadRoute;
    }
  }
  for (const { routingWaypoints, cacheKey } of routeOptions) {
    let result;
    try {
      result = await requestValhallaRoute(routingWaypoints);
    } catch (error) {
      lastError = error;
      break;
    }
    const route = result.routes?.[0];
    const coordinates = route?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || !coordinates.length) {
      lastError = new Error("No fallback road route was found");
      continue;
    }
    if (!routeStaysInsideBangladesh(coordinates)) {
      lastError = new Error("The fallback road route leaves Bangladesh");
      lastError.code = ROUTE_OUTSIDE_BANGLADESH;
      continue;
    }
    const roadRoute = {
      coordinates: coordinates.map(([lng, lat]) => [lat, lng]),
      distanceKm: Number(route.distance) / 1000,
      durationMinutes: Number(route.duration) / 60,
      ...singleStopLegMetrics(route, routingWaypoints),
    };
    writeRouteCache(cacheKey, roadRoute);
    return roadRoute;
  }
  if (cachedFallbackRoutes.length) {
    return cachedFallbackRoutes.sort((left, right) => Number(left.distanceKm) - Number(right.distanceKm))[0];
  }
  throw lastError;
}

function runNextRouteRequest() {
  while (activeRouteRequests < MAX_CONCURRENT_ROUTE_REQUESTS && pendingRouteRequests.length) {
    const { waypoints, resolve, reject } = pendingRouteRequests.shift();
    activeRouteRequests += 1;
    requestRoadRoute(waypoints)
      .then(resolve, reject)
      .finally(() => {
        activeRouteRequests -= 1;
        runNextRouteRequest();
      });
  }
}

export function loadRoadRoute(waypoints) {
  return new Promise((resolve, reject) => {
    pendingRouteRequests.push({ waypoints, resolve, reject });
    runNextRouteRequest();
  });
}
