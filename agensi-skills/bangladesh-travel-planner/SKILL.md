---
name: bangladesh-travel-planner
description: >
  Build travel discovery and route planning features for Bangladesh.
  Covers all 8 divisions, 64 districts, 400+ verified destinations with
  GPS coordinates, Valhalla/OSRM road routing with boundary safety,
  multi-day itinerary generation, water tourism rules, seasonal guidance,
  and the domain knowledge AI agents normally hallucinate about Bangladesh travel.
version: 1.0.0
author: Abdullah
tags:
  - travel
  - routing
  - bangladesh
  - itinerary
  - geospatial
  - leaflet
  - openstreetmap
  - valhalla
  - tourism
---

# Bangladesh Travel Planner — Agent Skill

An expert-grade skill that teaches AI coding agents how to build **travel discovery and practical route planning** features for Bangladesh. Distilled from [TourismuBD](https://github.com/), a production travel app covering all 64 districts.

> **Who this is for:** Developers building travel apps, tour platforms, logistics tools, or any location-aware product that touches Bangladesh geography. Works with Claude Code, Cursor, Copilot, Codex CLI, Gemini CLI, and any agent that reads SKILL.md.

---

## 1. Geographic Data Model

### 1.1 Administrative Hierarchy

Bangladesh has exactly **8 divisions → 64 districts**. Never invent new ones.

```
Division (8)
  └── District (64)
        └── Place (tourist destination)
              └── Water Body / Tourism Area (optional)
```

### 1.2 The Eight Divisions and Their Districts

| Division | Districts |
|---|---|
| **Dhaka** | Dhaka, Faridpur, Gazipur, Gopalganj, Kishoreganj, Madaripur, Manikganj, Munshiganj, Narayanganj, Narsingdi, Rajbari, Shariatpur, Tangail |
| **Chattogram** | Chattogram, Cox's Bazar, Bandarban, Rangamati, Khagrachhari, Cumilla, Brahmanbaria, Chandpur, Feni, Lakshmipur, Noakhali |
| **Sylhet** | Sylhet, Moulvibazar, Habiganj, Sunamganj |
| **Khulna** | Khulna, Bagerhat, Satkhira, Jashore, Narail, Magura, Jhenaidah, Kushtia, Chuadanga, Meherpur |
| **Rajshahi** | Rajshahi, Bogura, Naogaon, Natore, Chapainawabganj, Pabna, Sirajganj, Joypurhat |
| **Rangpur** | Rangpur, Dinajpur, Panchagarh, Thakurgaon, Nilphamari, Lalmonirhat, Kurigram, Gaibandha |
| **Barishal** | Barishal, Patuakhali, Bhola, Jhalokathi, Pirojpur, Barguna |
| **Mymensingh** | Mymensingh, Jamalpur, Netrokona, Sherpur |

### 1.3 Place Data Schema

Every tourist destination is modeled as a canonical `Place`:

```javascript
{
  id: "sylhet:ratargul-swamp-forest",   // district:slug
  districtId: "sylhet",
  district: "Sylhet",
  name: "Ratargul Swamp Forest",
  slug: "ratargul-swamp-forest",
  area: "Gowainghat",                    // upazila or locality
  category: "Swamp forest",
  coordinates: { lat: 25.001, lng: 91.978 },
  roadAccessCoordinates: null,           // separate approach point if needed
  roadRoutingProfile: "shortest-astar",
  coordinatesAreApproximate: false,
  shortDescription: "...",
  bestTime: {
    recommended: "November to March",
    why: "Water levels allow boat access without flooding risk.",
    caution: "Closed during monsoon peak. Confirm access locally.",
    lastVerified: "2026-09-15"
  },
  howToReach: "From Sylhet city, travel to Gowainghat...",
  practicalTip: "Hire a boat at the forest entry gate...",
  status: "published"
}
```

### 1.4 Critical Rule: Road Access vs. Destination Coordinates

Many Bangladesh destinations are **not on a road**. The destination coordinates and the nearest drivable point can differ significantly.

```javascript
// Example: Kishoreganj's haor destinations
// The haor itself is at the destination coordinates,
// but the road ends at Balikhola — you take a boat from there.
{
  coordinates: { lat: 24.518, lng: 90.962 },        // Mithamain Haor
  roadAccessCoordinates: { lat: 24.459, lng: 90.962 }, // Balikhola departure
  roadAccessLabel: "Balikhola",
  practicalTip: "Drive to Balikhola. Onward travel requires a local boat."
}
```

**Always use `roadAccessCoordinates` for road routing when present.** Use `coordinates` only for map display and straight-line distance.

Similarly, Sundarbans destinations route to **Mongla** or **Burigoalini** departure points, not into the forest.

---

## 2. Route Planning Architecture

### 2.1 Itinerary Optimization Algorithm

For small trips (≤5 places): use **exact permutation search** (brute-force TSP).

```javascript
// Exact solution for ≤5 stops — try every order, pick shortest
function planRoute(selectedPlaces, startingPoint) {
  const start = resolveStart(startingPoint);
  if (selectedPlaces.length <= 5) {
    // Exhaustive permutation with branch-and-bound pruning
    let best = { distance: Infinity, order: [] };
    function visit(current, remaining, order, distance) {
      if (!remaining.length) {
        if (distance < best.distance) best = { distance, order };
        return;
      }
      for (const next of remaining) {
        const d = distance + haversineKm(current, next);
        if (d >= best.distance) continue; // prune
        visit(next, remaining.filter(p => p !== next), [...order, next], d);
      }
    }
    visit(start, selectedPlaces, [], 0);
    return best.order;
  }
  // For 6+ stops: nearest-neighbor heuristic
  // ...
}
```

For larger trips (6+ places): use **nearest-neighbor heuristic**.

### 2.2 Multi-Day Trip Splitting

```javascript
function splitRouteIntoDays(orderedPlaces, days) {
  const baseSize = Math.floor(orderedPlaces.length / days);
  const extra = orderedPlaces.length % days;
  let cursor = 0;
  return Array.from({ length: days }, (_, i) => {
    const count = baseSize + (i < extra ? 1 : 0);
    return {
      day: i + 1,
      places: orderedPlaces.slice(cursor, cursor += count)
    };
  });
}
```

**Rules:**
- Minimum 2 places to plan a route
- Maximum days = number of places (except 2 places = 1 day max)
- Each day returns to the starting point

### 2.3 Starting Points

The agent should know common starting points per district. Example for Sylhet:

| ID | Name | Lat | Lng |
|---|---|---|---|
| `city-center` | Sylhet City Center | 24.895 | 91.869 |
| `airport` | Osmani International Airport | 24.963 | 91.867 |
| `railway-station` | Sylhet Railway Station | 24.880 | 91.881 |
| `bus-terminal` | Kadamtali Bus Terminal | 24.875 | 91.867 |

For other districts, default to the district's town center coordinates. The user may also supply custom `{ lat, lng }` coordinates.

---

## 3. Road Routing with Boundary Safety

### 3.1 Multi-Engine Routing Strategy

Bangladesh sits between India and Myanmar. Routes between border-area destinations often cross international borders on the road graph. This is the #1 source of broken routes.

**Routing engine priority:**
1. **OSRM** (primary): `router.project-osrm.org/route/v1/driving`
2. **OSRM fallback**: `routing.openstreetmap.de/routed-car/route/v1/driving`
3. **Valhalla A*** (for shortest-distance): `valhalla1.openstreetmap.de/route`

### 3.2 Bangladesh Boundary Validation (CRITICAL)

Every computed road route **MUST** be verified to stay inside Bangladesh's national boundary before displaying it to the user.

```javascript
function routeStaysInsideBangladesh(coordinates) {
  const STEP = 0.0015; // sample every ~150m
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [sLng, sLat] = coordinates[i];
    const [eLng, eLat] = coordinates[i + 1];
    const steps = Math.max(1, Math.ceil(
      Math.max(Math.abs(eLng - sLng), Math.abs(eLat - sLat)) / STEP
    ));
    for (let s = 0; s <= steps; s++) {
      const ratio = s / steps;
      const point = [
        sLng + (eLng - sLng) * ratio,
        sLat + (eLat - sLat) * ratio
      ];
      if (!isInsideBangladesh(point)) return false;
    }
  }
  return true;
}
```

**When a route leaves Bangladesh:**
1. Identify the foreign-road coordinates with `outsideRoadLocations()`
2. Add them to Valhalla's `exclude_locations` list
3. Re-request with shortest-distance A* costing (`shortest: true`)
4. Retry up to 3 times with progressive exclusions (max 20 exclusion points)
5. If no Bangladesh-only route exists, **report honestly** — never substitute a fastest route or draw a straight line

### 3.3 Safe Route Corridors

Certain pairs of border destinations require **mandatory intermediate waypoints** to prevent cross-border routing:

```javascript
const SAFE_ROUTE_CORRIDORS = {
  "bichanakandi:jaflong":     [{ lat: 25.094, lng: 91.983 }], // Gowainghat junction
  "hili-area:ramsagar-national-park": [{ lat: 25.63, lng: 88.65 }],  // Dinajpur town
};

// All northern Sylhet border stops route through Gowainghat:
const NORTHERN_BORDER_STOPS = [
  "bichanakandi", "jaflong", "panthumai", "tamabil", "utma-chhara"
];
```

### 3.4 Valhalla Shortest-Distance A* Configuration

For the Khulna division and other spread-out regions, use Valhalla's A* with **shortest-distance costing**, not fastest-time:

```javascript
{
  locations: waypoints.map(w => ({ lat: w.lat, lon: w.lng })),
  costing: "auto",
  costing_options: { auto: { shortest: true, disable_hierarchy_pruning: true } },
  directions_type: "none",
  format: "osrm",
  shape_format: "geojson",
  units: "kilometers"
}
```

### 3.5 Multi-Stop Chunking (10-Point Limit)

Public Valhalla and OSRM services limit requests to **10 waypoints**. For longer routes:

```javascript
// Overlap endpoints between chunks to avoid duplicate legs
for (let i = 0; i < waypoints.length - 1; i += MAX_LOCATIONS - 1) {
  const chunk = waypoints.slice(i, i + MAX_LOCATIONS);
  const result = await requestRoute(chunk);
  combined.coordinates.push(...result.coordinates);
  combined.distance += result.distance;
}
```

---

## 4. Water Tourism Rules

### 4.1 Provider Types

| Provider Type | Monthly Subscription (৳) |
|---|---|
| Tour Guide | ৳10 |
| Houseboat Owner | ৳100 |
| Small Boat Owner | ৳50 |
| Resort/Hotel Owner | ৳100 |
| Car/Transport Owner | ৳50 |
| Parking Owner | ৳30 |
| Tour Agency | ৳70 |

### 4.2 Duration Rules

- **Houseboat**: Traveler-selectable duration nationwide. No district exceptions.
- **Small Boat**: Traveler-selectable duration nationwide, **EXCEPT Sundarbans = exactly 1 day**.

```javascript
function validateBookingDuration(booking) {
  const isSmallBoat = ["SMALL_BOAT", "SMALL_BOAT_OWNER"].includes(booking.providerType);
  const isSundarbans = booking.waterArea?.toLowerCase().includes("sundarban");
  
  if (isSmallBoat && isSundarbans && booking.durationDays !== 1) {
    return { valid: false, error: "Small Boat bookings in the Sundarbans must be exactly 1 day." };
  }
  return { valid: true };
}
```

### 4.3 Initial Water Tourism Markets

| District | Water Body | Expected Pattern |
|---|---|---|
| Sunamganj | Tanguar Haor | Houseboats + Small Boats |
| Kishoreganj | Nikli Haor | Small Boats (Houseboat visible) |
| Rangamati | Kaptai Lake | Houseboats + Small Boats |
| Chandpur | Padma-Meghna-Dakatia confluence | Small Boats / day trips |
| Khulna/Bagerhat | Sundarbans waterways | Water tours, Small Boat 1-day rule |
| Natore | Chalan Beel / Halti Beel | Small Boats, seasonal |

### 4.4 UI Rule

Every district page must show BOTH water options. Never hide one based on district. If no providers exist, show:

```
No verified Houseboats are available here yet.
```

---

## 5. Place Classification

### 5.1 Water Body Detection

```javascript
function isWaterBodyPlace(place) {
  const text = `${place.category} ${place.name} ${place.area}`.toLowerCase();
  return /\b(river|haor|lake|beel|waterfall|falls|beach|coast|ghat|
    island|char|wetland|swamp|dighi|chhara|port|estuary)\b/i.test(text);
}
```

### 5.2 Mountain/Hill Detection

```javascript
function isMountainPlace(place) {
  const text = `${place.category} ${place.name} ${place.area}`.toLowerCase();
  return /\b(hill|mountain|pahar|peak|ridge|valley|viewpoint|
    tila|cave|cliff|plateau|gorge|tea garden|tea estate)\b/i.test(text);
}
```

---

## 6. Haversine Distance (Straight-Line)

```javascript
function distanceKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat))
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
```

**Estimated driving time** (when no road routing available): `(distanceKm / 30) * 60` minutes (30 km/h average accounts for Bangladesh road conditions).

---

## 7. Seasonal Guidance

### 7.1 General Rule

| Season | Months | Notes |
|---|---|---|
| **Dry / Winter** | November – February | Best travel season nationwide |
| **Pre-monsoon** | March – May | Hot. Hill areas still accessible |
| **Monsoon** | June – September | Flooding. Many places inaccessible |
| **Post-monsoon** | October | Transitional, haors still full |

### 7.2 Exceptions

- **Haor areas** (Sunamganj, Kishoreganj, Netrokona): Best in monsoon/post-monsoon when water is high — boats run, landscapes peak. Dry season = dry mud.
- **Sundarbans**: Best November – February. Closed during cyclone season.
- **Hill Tracts** (Bandarban, Rangamati, Khagrachhari): Avoid June – September (landslide risk).
- **Tea gardens** (Sylhet, Moulvibazar): Year-round, but cleanest views November – March.
- **Cox's Bazar / Beach**: November – March for swimming. Monsoon = rough seas.

---

## 8. Geocoding Strategy

### 8.1 Nominatim (OpenStreetMap)

```javascript
function buildGeocodingUrl(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", query);
  url.searchParams.set("countrycodes", "bd"); // restrict to Bangladesh
  url.searchParams.set("limit", "1");
  return url.toString();
}
```

### 8.2 Rate Limiting

- **Nominatim**: 1 request per 1.1 seconds (strict)
- **Valhalla**: 1 request per 1.1 seconds
- **OSRM**: 3 concurrent requests max

### 8.3 Geocoding Query Construction

```javascript
const query = [
  place.name,
  place.area,
  place.district,
  "Bangladesh"
].filter(Boolean).join(", ");
```

Always append "Bangladesh" to prevent cross-border geocoding matches.

---

## 9. Caching Strategy

- **Geocode cache**: Browser localStorage, keyed by lowercase query string
- **Route cache**: Browser localStorage, max 80 entries, LRU eviction
- **Cache key**: Pipe-delimited coordinate keys at 5 decimal places
- Cached routes must be re-validated against the boundary check before use

---

## 10. Leaflet / Map Integration

### 10.1 Map Center

```javascript
const BANGLADESH_CENTER = [23.685, 90.3563];
const DEFAULT_ZOOM = 8; // shows most of Bangladesh
```

### 10.2 Tile Source

Use OpenStreetMap tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

### 10.3 Key UX Patterns

- Division filter bar: `["All", "Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi", "Barishal", "Rangpur", "Mymensingh"]`
- District-visited tracker (persisted in localStorage)
- Nearby Places discovery (3 nearest by Haversine)
- Route polyline with boundary validation
- Separate visual treatment for water vs road legs

---

## 11. Supabase / Database Schema

### 11.1 Core Tables

```sql
-- Districts table
CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_code TEXT UNIQUE,
  name TEXT NOT NULL,
  division TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PUBLISHED'
);

-- Places table
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID REFERENCES districts(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  upazila_or_area TEXT,
  category TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  short_description TEXT,
  best_time TEXT,
  how_to_reach TEXT,
  practical_tips TEXT,
  image_url TEXT,
  last_verified_at TIMESTAMPTZ,
  status TEXT DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (district_id, slug)
);
```

### 11.2 Real-Time Updates

Subscribe to place changes with Supabase Realtime:

```javascript
supabase
  .channel("tourism-places-live")
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "places"
  }, () => refreshTourismData())
  .subscribe();
```

---

## 12. Common Pitfalls the Agent Must Avoid

| Pitfall | Correct Behavior |
|---|---|
| ❌ Routing through India between Sylhet border destinations | ✅ Force Gowainghat junction waypoint |
| ❌ Using destination coordinates for routing to island/haor/forest places | ✅ Use `roadAccessCoordinates` for road routing |
| ❌ Claiming route is "optimal" or "shortest" | ✅ Say "practical recommended route" |
| ❌ Hiding water tourism options when no providers exist | ✅ Always show both options with empty state |
| ❌ Allowing multi-day Small Boat in Sundarbans | ✅ Enforce exactly 1 day |
| ❌ Using fastest-time routing for spread-out regions | ✅ Use shortest-distance A* costing |
| ❌ Displaying a route that exits Bangladesh | ✅ Validate every segment, exclude foreign roads |
| ❌ Sending >10 waypoints to Valhalla/OSRM | ✅ Chunk with overlapping endpoints |
| ❌ Flooding Nominatim with concurrent requests | ✅ Sequential queue, 1.1s minimum gap |
| ❌ Inventing a 65th district or 9th division | ✅ Exactly 8 divisions, 64 districts |
| ❌ Recommending Sundarbans in cyclone season | ✅ November – February only |
| ❌ Recommending haor visit in dry season | ✅ Monsoon / post-monsoon for water, verify access |

---

## 13. Quick Reference: Key Coordinates

### Major Transport Hubs

| Hub | Lat | Lng |
|---|---|---|
| Dhaka (Shahjalal Airport) | 23.843 | 90.398 |
| Chattogram (Shah Amanat Airport) | 22.250 | 91.813 |
| Sylhet (Osmani Airport) | 24.963 | 91.867 |
| Cox's Bazar Airport | 21.452 | 91.964 |
| Khulna Railway Station | 22.810 | 89.556 |
| Rajshahi Railway Station | 24.374 | 88.583 |

### District Center Coordinates

See the `data/district-centers.json` reference file for all 64 district center coordinates.

---

## 14. Tech Stack Recommendations

| Layer | Recommended |
|---|---|
| Map rendering | Leaflet + OpenStreetMap tiles |
| Geocoding | Nominatim (countrycodes=bd) |
| Road routing | OSRM + Valhalla A* fallback |
| Backend | Supabase (Postgres + Realtime + Auth + Storage) |
| Frontend | React / Vite (or any SPA framework) |
| Boundary data | GeoJSON polygon of Bangladesh |
| Coordinate format | `{ lat, lng }` everywhere |

---

*Built with real routing experience from TourismuBD — a production travel app for Bangladesh.*
*© Abdullah. Licensed for use as an AI agent skill.*
