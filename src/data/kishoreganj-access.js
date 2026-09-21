import { VERIFIED_PLACE_COORDINATES } from "./place-coordinates.js";

// Mainland approach, not the full haor destination or a year-round bridge.
// https://vromonguide.com/place/balikhola-kishoreganj
// https://vromonguide.com/kishoreganj-haor-road
const balikhola = Object.freeze({ lat: 24.459319, lng: 90.9620408 });
const accessNote = "Drive to Balikhola departure area via Karimganj. Onward travel to the haor and Haor Road requires a local boat or seasonal ferry; confirm water levels and departures. Driving distance excludes the onward journey.";
const haorSlugs = new Set(["mithamain-haor", "austagram-haor", "president-abdul-hamid-haor-road"]);

export function kishoreganjPlaceDetails(districtId, slug) {
  if (districtId !== "kishoreganj") return null;
  const canonicalSlug = slug === "president-abdul-hamid-road-haor-road" ? "president-abdul-hamid-haor-road" : slug;
  if (!haorSlugs.has(canonicalSlug)) return null;
  return {
    coordinates: VERIFIED_PLACE_COORDINATES[canonicalSlug],
    roadAccessCoordinates: balikhola,
    roadAccessLabel: "Balikhola",
    practicalTip: accessNote,
  };
}
