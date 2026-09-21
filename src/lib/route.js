import { places } from "../data/tourism.js";

const STARTING_POINTS = {
  "city-center": { name: "Sylhet City Center", coordinates: { lat: 24.895, lng: 91.869 } },
  airport: { name: "Osmani International Airport", coordinates: { lat: 24.963, lng: 91.867 } },
  "railway-station": { name: "Sylhet Railway Station", coordinates: { lat: 24.88, lng: 91.881 } },
  "bus-terminal": { name: "Kadamtali Bus Terminal", coordinates: { lat: 24.875, lng: 91.867 } },
};

const toRadians = (degrees) => (degrees * Math.PI) / 180;

function distanceKm(a, b) {
  const earthKm = 6371;
  const lat = toRadians(b.lat - a.lat);
  const lng = toRadians(b.lng - a.lng);
  const value = Math.sin(lat / 2) ** 2
    + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(lng / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function findNearbyPlaces(placeId, limit = 3) {
  const origin = places.find(({ id, databaseId }) => id === placeId || databaseId === placeId);
  if (!origin) throw new RangeError(`Unknown place: ${placeId}`);
  return places
    .filter(({ id }) => id !== origin.id)
    .map((candidate) => ({ candidate, distance: distanceKm(origin.coordinates, candidate.coordinates) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

function resolveStart(startingPoint) {
  if (typeof startingPoint === "string") {
    const known = STARTING_POINTS[startingPoint] ?? places.find(({ id }) => id === startingPoint);
    if (!known) throw new RangeError(`Unknown starting point: ${startingPoint}`);
    return known.coordinates ? { name: known.name, coordinates: known.coordinates } : known;
  }

  const coordinates = startingPoint?.coordinates ?? startingPoint;
  if (!Number.isFinite(coordinates?.lat) || !Number.isFinite(coordinates?.lng)) {
    throw new TypeError("Starting point must be a known ID or { lat, lng } coordinates");
  }
  return { ...startingPoint, name: startingPoint.name ?? "Custom starting point", coordinates };
}

function createLeg(origin, destination) {
  const km = distanceKm(origin.coordinates, destination.coordinates);
  return {
    from: origin.name,
    to: destination.name,
    distanceKm: Number(km.toFixed(1)),
    minutes: Math.round((km / 30) * 60),
  };
}

export function planRoute(selectedPlaceIds, startingPoint = "city-center") {
  if (!Array.isArray(selectedPlaceIds)) throw new TypeError("Selected places must be an array of IDs");
  const ids = [...new Set(selectedPlaceIds)];
  if (ids.length < 2) throw new RangeError("Select at least 2 places");

  const selected = ids.map((id) => places.find((item) => item.id === id || item.databaseId === id));
  const missing = ids.filter((_, index) => !selected[index]);
  if (missing.length) throw new RangeError(`Unknown place: ${missing.join(", ")}`);

  const start = resolveStart(startingPoint);
  let order;
  if (selected.length <= 5) {
    let best = { distance: Infinity, order: [] };
    function visit(current, remaining, currentOrder, distance) {
      if (!remaining.length) {
        if (distance < best.distance) best = { distance, order: currentOrder };
        return;
      }
      for (const next of remaining) {
        const nextDistance = distance + distanceKm(current.coordinates, next.coordinates);
        if (nextDistance >= best.distance) continue;
        visit(next, remaining.filter((item) => item !== next), [...currentOrder, next], nextDistance);
      }
    }
    visit(start, selected, [], 0);
    order = best.order;
  } else {
    const remaining = [...selected];
    order = [];
    let current = start;
    // ponytail: use a fast nearest-neighbor route above five places; replace with verified road legs when collected.
    while (remaining.length) {
      const next = remaining.reduce((best, candidate) => !best || distanceKm(current.coordinates, candidate.coordinates) < distanceKm(current.coordinates, best.coordinates) ? candidate : best, null);
      order.push(next);
      remaining.splice(remaining.indexOf(next), 1);
      current = next;
    }
  }

  const legs = order.map((destination, index) => createLeg(index ? order[index - 1] : start, destination));

  return {
    start,
    orderedPlaces: order,
    legs,
    totalDistanceKm: Number(legs.reduce((sum, leg) => sum + leg.distanceKm, 0).toFixed(1)),
    totalMinutes: legs.reduce((sum, leg) => sum + leg.minutes, 0),
  };
}

export function splitRouteIntoDays(orderedPlaces, days) {
  if (!Array.isArray(orderedPlaces) || !orderedPlaces.length) {
    throw new RangeError("A route needs at least one place");
  }
  if (!Number.isInteger(days) || days < 1) throw new RangeError("A trip needs at least 1 day");
  const maximumDays = maxTripDaysForPlaceCount(orderedPlaces.length);
  if (days > maximumDays) throw new RangeError(`${orderedPlaces.length} selected places allow at most ${maximumDays} ${maximumDays === 1 ? "day" : "days"}`);
  const baseSize = Math.floor(orderedPlaces.length / days);
  const extraStops = orderedPlaces.length % days;
  let cursor = 0;
  return Array.from({ length: days }, (_, index) => {
    const count = baseSize + (index < extraStops ? 1 : 0);
    return { day: index + 1, places: orderedPlaces.slice(cursor, cursor += count) };
  });
}

export function maxTripDaysForPlaceCount(placeCount) {
  if (!Number.isInteger(placeCount) || placeCount < 1) return 1;
  return placeCount === 2 ? 1 : placeCount;
}

export function planDailyRoute(route, days) {
  const dayPlans = splitRouteIntoDays(route.orderedPlaces, days);
  const legs = dayPlans.flatMap((plan) => {
    if (!plan.places.length) return [];
    const destinations = [...plan.places, route.start];
    return destinations.map((destination, index) => createLeg(index ? destinations[index - 1] : route.start, destination));
  });
  return {
    ...route,
    dayPlans,
    legs,
    totalDistanceKm: Number(legs.reduce((sum, leg) => sum + leg.distanceKm, 0).toFixed(1)),
    totalMinutes: legs.reduce((sum, leg) => sum + leg.minutes, 0),
  };
}

export function planDistrictTour(districtId, days, startingPoint = "city-center") {
  if (!Number.isInteger(days) || days < 1) throw new RangeError("A district tour needs at least 1 day");
  const districtPlaces = places.filter((place) => place.districtId === districtId);
  if (!districtPlaces.length) throw new RangeError("No published places are available for this district");
  const route = planRoute(districtPlaces.map((place) => place.id), startingPoint);
  return { ...planDailyRoute(route, days), kind: "district" };
}

export function validateBookingDuration(booking) {
  const providerType = booking?.providerType ?? booking?.provider_type;
  if (!["HOUSEBOAT", "HOUSEBOAT_OWNER", "SMALL_BOAT", "SMALL_BOAT_OWNER"].includes(providerType)) {
    return { valid: true, error: null };
  }

  const duration = booking.durationDays ?? booking.duration_days;
  if (!Number.isInteger(duration) || duration < 1) {
    return { valid: false, error: "Duration must be a whole number of at least 1 day." };
  }

  const area = booking.waterAreaSlug
    ?? booking.water_body_slug
    ?? booking.waterArea
    ?? booking.water_body_name
    ?? "";
  const isSmallBoat = providerType === "SMALL_BOAT" || providerType === "SMALL_BOAT_OWNER";
  if (isSmallBoat && String(area).toLowerCase().includes("sundarban") && duration !== 1) {
    return { valid: false, error: "Small Boat bookings in the Sundarbans must be exactly 1 day." };
  }

  return { valid: true, error: null };
}
