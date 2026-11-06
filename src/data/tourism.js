import { ROAD_ACCESS_COORDINATES, VERIFIED_PLACE_COORDINATES } from "./place-coordinates.js";
import { districtPlaceId, RAJSHAHI_PLACE_COORDINATES, RAJSHAHI_PLACE_NOTES, RAJSHAHI_ROAD_ACCESS_COORDINATES } from "./rajshahi-coordinates.js";
import { BARISHAL_PLACE_COORDINATES, BARISHAL_PLACE_IDS, BARISHAL_PLACE_NOTES, BARISHAL_ROAD_ACCESS_COORDINATES } from "./barishal-coordinates.js";
import { KHULNA_PLACE_COORDINATES, KHULNA_PLACE_IDS, KHULNA_PLACE_NOTES, KHULNA_ROAD_ACCESS_COORDINATES } from "./khulna-coordinates.js";
import { kishoreganjPlaceDetails } from "./kishoreganj-access.js";

const imageBasePath = import.meta.env?.BASE_URL || "/";
const imagePath = (name) => `${imageBasePath}images/${name}`;
export const FALLBACK_IMAGE = imagePath("sylhet-waterway.png");

export const districts = [
  {
    id: "sylhet",
    name: "Sylhet",
    division: "Sylhet",
    slug: "sylhet",
    status: "published",
  },
  {
    id: "faridpur",
    name: "Faridpur",
    division: "Dhaka",
    slug: "faridpur",
    status: "published",
  },
  { id: "dhaka", name: "Dhaka", division: "Dhaka", slug: "dhaka", status: "published" },
  { id: "gazipur", name: "Gazipur", division: "Dhaka", slug: "gazipur", status: "published" },
  { id: "gopalganj", name: "Gopalganj", division: "Dhaka", slug: "gopalganj", status: "published" },
  { id: "kishoreganj", name: "Kishoreganj", division: "Dhaka", slug: "kishoreganj", status: "published" },
  { id: "madaripur", name: "Madaripur", division: "Dhaka", slug: "madaripur", status: "published" },
  { id: "manikganj", name: "Manikganj", division: "Dhaka", slug: "manikganj", status: "published" },
  { id: "munshiganj", name: "Munshiganj", division: "Dhaka", slug: "munshiganj", status: "published" },
  { id: "narayanganj", name: "Narayanganj", division: "Dhaka", slug: "narayanganj", status: "published" },
  { id: "narsingdi", name: "Narsingdi", division: "Dhaka", slug: "narsingdi", status: "published" },
  { id: "rajbari", name: "Rajbari", division: "Dhaka", slug: "rajbari", status: "published" },
  { id: "shariatpur", name: "Shariatpur", division: "Dhaka", slug: "shariatpur", status: "published" },
  { id: "tangail", name: "Tangail", division: "Dhaka", slug: "tangail", status: "published" },
  { id: "rangpur", name: "Rangpur", division: "Rangpur", slug: "rangpur", status: "published" },
  { id: "dinajpur", name: "Dinajpur", division: "Rangpur", slug: "dinajpur", status: "published" },
  { id: "panchagarh", name: "Panchagarh", division: "Rangpur", slug: "panchagarh", status: "published" },
  { id: "thakurgaon", name: "Thakurgaon", division: "Rangpur", slug: "thakurgaon", status: "published" },
  { id: "nilphamari", name: "Nilphamari", division: "Rangpur", slug: "nilphamari", status: "published" },
  { id: "lalmonirhat", name: "Lalmonirhat", division: "Rangpur", slug: "lalmonirhat", status: "published" },
  { id: "kurigram", name: "Kurigram", division: "Rangpur", slug: "kurigram", status: "published" },
  { id: "gaibandha", name: "Gaibandha", division: "Rangpur", slug: "gaibandha", status: "published" },
  { id: "barishal", name: "Barishal", division: "Barishal", slug: "barishal", status: "published" },
  { id: "patuakhali", name: "Patuakhali", division: "Barishal", slug: "patuakhali", status: "published" },
  { id: "bhola", name: "Bhola", division: "Barishal", slug: "bhola", status: "published" },
  { id: "jhalokathi", name: "Jhalokathi", division: "Barishal", slug: "jhalokathi", status: "published" },
  { id: "pirojpur", name: "Pirojpur", division: "Barishal", slug: "pirojpur", status: "published" },
  { id: "barguna", name: "Barguna", division: "Barishal", slug: "barguna", status: "published" },
  { id: "rajshahi", name: "Rajshahi", division: "Rajshahi", slug: "rajshahi", status: "published" },
  { id: "bogura", name: "Bogura", division: "Rajshahi", slug: "bogura", status: "published" },
  { id: "naogaon", name: "Naogaon", division: "Rajshahi", slug: "naogaon", status: "published" },
  { id: "natore", name: "Natore", division: "Rajshahi", slug: "natore", status: "published" },
  { id: "chapainawabganj", name: "Chapainawabganj", division: "Rajshahi", slug: "chapainawabganj", status: "published" },
  { id: "pabna", name: "Pabna", division: "Rajshahi", slug: "pabna", status: "published" },
  { id: "sirajganj", name: "Sirajganj", division: "Rajshahi", slug: "sirajganj", status: "published" },
  { id: "joypurhat", name: "Joypurhat", division: "Rajshahi", slug: "joypurhat", status: "published" },
  { id: "chattogram", name: "Chattogram", division: "Chattogram", slug: "chattogram", status: "published" },
  { id: "coxs-bazar", name: "Cox's Bazar", division: "Chattogram", slug: "coxs-bazar", status: "published" },
  { id: "bandarban", name: "Bandarban", division: "Chattogram", slug: "bandarban", status: "published" },
  { id: "rangamati", name: "Rangamati", division: "Chattogram", slug: "rangamati", status: "published" },
  { id: "khagrachhari", name: "Khagrachhari", division: "Chattogram", slug: "khagrachhari", status: "published" },
  { id: "cumilla", name: "Cumilla", division: "Chattogram", slug: "cumilla", status: "published" },
  { id: "brahmanbaria", name: "Brahmanbaria", division: "Chattogram", slug: "brahmanbaria", status: "published" },
  { id: "chandpur", name: "Chandpur", division: "Chattogram", slug: "chandpur", status: "published" },
  { id: "feni", name: "Feni", division: "Chattogram", slug: "feni", status: "published" },
  { id: "lakshmipur", name: "Lakshmipur", division: "Chattogram", slug: "lakshmipur", status: "published" },
  { id: "noakhali", name: "Noakhali", division: "Chattogram", slug: "noakhali", status: "published" },
  { id: "khulna", name: "Khulna", division: "Khulna", slug: "khulna", status: "published" },
  { id: "bagerhat", name: "Bagerhat", division: "Khulna", slug: "bagerhat", status: "published" },
  { id: "satkhira", name: "Satkhira", division: "Khulna", slug: "satkhira", status: "published" },
  { id: "jashore", name: "Jashore", division: "Khulna", slug: "jashore", status: "published" },
  { id: "narail", name: "Narail", division: "Khulna", slug: "narail", status: "published" },
  { id: "magura", name: "Magura", division: "Khulna", slug: "magura", status: "published" },
  { id: "jhenaidah", name: "Jhenaidah", division: "Khulna", slug: "jhenaidah", status: "published" },
  { id: "kushtia", name: "Kushtia", division: "Khulna", slug: "kushtia", status: "published" },
  { id: "chuadanga", name: "Chuadanga", division: "Khulna", slug: "chuadanga", status: "published" },
  { id: "meherpur", name: "Meherpur", division: "Khulna", slug: "meherpur", status: "published" },
  { id: "moulvibazar", name: "Moulvibazar", division: "Sylhet", slug: "moulvibazar", status: "published" },
  { id: "habiganj", name: "Habiganj", division: "Sylhet", slug: "habiganj", status: "published" },
  { id: "sunamganj", name: "Sunamganj", division: "Sylhet", slug: "sunamganj", status: "published" },
  { id: "mymensingh", name: "Mymensingh", division: "Mymensingh", slug: "mymensingh", status: "published" },
  { id: "jamalpur", name: "Jamalpur", division: "Mymensingh", slug: "jamalpur", status: "published" },
  { id: "netrokona", name: "Netrokona", division: "Mymensingh", slug: "netrokona", status: "published" },
  { id: "sherpur", name: "Sherpur", division: "Mymensingh", slug: "sherpur", status: "published" },
];

export let placesVersion = 0;

export const CUSTOM_MEDIA_STORE = {
  places: {},
  galleries: {},
  banners: {},
  water: {},
};

if (typeof window !== "undefined" && window.localStorage) {
  try {
    const rawPlaces = window.localStorage.getItem("tourismubd_custom_place_images");
    if (rawPlaces) CUSTOM_MEDIA_STORE.places = { ...CUSTOM_MEDIA_STORE.places, ...JSON.parse(rawPlaces) };
    const rawBanners = window.localStorage.getItem("tourismubd_custom_banners");
    if (rawBanners) CUSTOM_MEDIA_STORE.banners = { ...CUSTOM_MEDIA_STORE.banners, ...JSON.parse(rawBanners) };
    const rawWater = window.localStorage.getItem("tourismubd_custom_water_images");
    if (rawWater) CUSTOM_MEDIA_STORE.water = { ...CUSTOM_MEDIA_STORE.water, ...JSON.parse(rawWater) };
    const rawGalleries = window.localStorage.getItem("tourismubd_custom_galleries");
    if (rawGalleries) CUSTOM_MEDIA_STORE.galleries = { ...CUSTOM_MEDIA_STORE.galleries, ...JSON.parse(rawGalleries) };
  } catch {}
}

let mediaChannel = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    mediaChannel = new BroadcastChannel("tourismubd_media_channel");
    mediaChannel.onmessage = (event) => {
      const { type, key, value, all } = event.data || {};
      if (all) {
        if (all.places) Object.assign(CUSTOM_MEDIA_STORE.places, all.places);
        if (all.galleries) Object.assign(CUSTOM_MEDIA_STORE.galleries, all.galleries);
        if (all.banners) Object.assign(CUSTOM_MEDIA_STORE.banners, all.banners);
        if (all.water) Object.assign(CUSTOM_MEDIA_STORE.water, all.water);
      } else if (type && key && value !== undefined) {
        if (!CUSTOM_MEDIA_STORE[type]) CUSTOM_MEDIA_STORE[type] = {};
        CUSTOM_MEDIA_STORE[type][key] = value;
      }
      placesVersion += 1;
      window.dispatchEvent(new CustomEvent("tourismubd-media-updated", { detail: event.data }));
      if (type === "banners") {
        window.dispatchEvent(new CustomEvent("tourismubd-banner-updated", { detail: { id: key, imageUrl: value } }));
      }
    };
  } catch {}
}

export async function syncCustomMediaFromServer() {
  if (typeof window === "undefined" || !window.fetch) return;
  try {
    const res = await fetch("/data/custom-media.json?t=" + Date.now());
    if (res.ok) {
      const json = await res.json();
      if (json && typeof json === "object") {
        let changed = false;
        if (json.places && Object.keys(json.places).length) {
          Object.assign(CUSTOM_MEDIA_STORE.places, json.places);
          changed = true;
        }
        if (json.galleries && Object.keys(json.galleries).length) {
          Object.assign(CUSTOM_MEDIA_STORE.galleries, json.galleries);
          changed = true;
        }
        if (json.banners && Object.keys(json.banners).length) {
          Object.assign(CUSTOM_MEDIA_STORE.banners, json.banners);
          changed = true;
        }
        if (json.water && Object.keys(json.water).length) {
          Object.assign(CUSTOM_MEDIA_STORE.water, json.water);
          changed = true;
        }
        if (changed) {
          placesVersion += 1;
          window.dispatchEvent(new CustomEvent("tourismubd-media-updated", { detail: json }));
        }
      }
    }
  } catch {}
}

if (typeof window !== "undefined") {
  syncCustomMediaFromServer();
}

export function broadcastAndPersistMedia(type, key, value) {
  if (!CUSTOM_MEDIA_STORE[type]) CUSTOM_MEDIA_STORE[type] = {};
  CUSTOM_MEDIA_STORE[type][key] = value;
  placesVersion += 1;

  if (typeof window === "undefined") return;

  if (mediaChannel) {
    try {
      mediaChannel.postMessage({ type, key, value });
    } catch {}
  }

  window.dispatchEvent(new CustomEvent("tourismubd-media-updated", { detail: { type, key, value } }));

  const endpoints = ["/__tourismubd-admin/media-sync", "/__tourismubd-media-sync"];
  endpoints.forEach((ep) => {
    fetch(ep, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, key, value }),
    }).catch(() => {});
  });
}

export function getCustomPlaceImage(placeSlugOrId) {
  if (!placeSlugOrId) return null;
  if (CUSTOM_MEDIA_STORE.places[placeSlugOrId]) {
    return CUSTOM_MEDIA_STORE.places[placeSlugOrId];
  }
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("tourismubd_custom_place_images");
      if (raw) {
        const custom = JSON.parse(raw);
        if (custom[placeSlugOrId]) {
          CUSTOM_MEDIA_STORE.places[placeSlugOrId] = custom[placeSlugOrId];
          return custom[placeSlugOrId];
        }
      }
    }
  } catch {}
  return null;
}

export function saveCustomPlaceImage(placeSlugOrId, imageUrl) {
  if (!placeSlugOrId || !imageUrl) return;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("tourismubd_custom_place_images");
      const custom = raw ? JSON.parse(raw) : {};
      custom[placeSlugOrId] = imageUrl;
      window.localStorage.setItem("tourismubd_custom_place_images", JSON.stringify(custom));
    }
  } catch (err) {
    console.error("Failed to save custom place image:", err);
  }
  broadcastAndPersistMedia("places", placeSlugOrId, imageUrl);
}

export function getSystemBanner(id, fallback = FALLBACK_IMAGE) {
  if (!id) return fallback;
  if (CUSTOM_MEDIA_STORE.banners[id]) {
    return CUSTOM_MEDIA_STORE.banners[id];
  }
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("tourismubd_custom_banners");
      if (raw) {
        const custom = JSON.parse(raw);
        if (custom[id]) {
          CUSTOM_MEDIA_STORE.banners[id] = custom[id];
          return custom[id];
        }
      }
    }
  } catch {}
  return fallback;
}

export function saveCustomSystemBanner(id, imageUrl) {
  if (!id || !imageUrl) return;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("tourismubd_custom_banners");
      const custom = raw ? JSON.parse(raw) : {};
      custom[id] = imageUrl;
      window.localStorage.setItem("tourismubd_custom_banners", JSON.stringify(custom));
      window.dispatchEvent(new CustomEvent("tourismubd-banner-updated", { detail: { id, imageUrl } }));
    }
  } catch (err) {
    console.error("Failed to save system banner:", err);
  }
  broadcastAndPersistMedia("banners", id, imageUrl);
}

export function getCustomWaterImage(id, fallback = "/images/gallery/water-1.jpg") {
  if (!id) return fallback;
  if (CUSTOM_MEDIA_STORE.water[id]) return CUSTOM_MEDIA_STORE.water[id];
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("tourismubd_custom_water_images");
      if (raw) {
        const custom = JSON.parse(raw);
        if (custom[id]) {
          CUSTOM_MEDIA_STORE.water[id] = custom[id];
          return custom[id];
        }
      }
    }
  } catch {}
  return fallback;
}

export function saveCustomWaterImage(id, imageUrl) {
  if (!id || !imageUrl) return;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("tourismubd_custom_water_images");
      const custom = raw ? JSON.parse(raw) : {};
      custom[id] = imageUrl;
      window.localStorage.setItem("tourismubd_custom_water_images", JSON.stringify(custom));
    }
  } catch {}
  broadcastAndPersistMedia("water", id, imageUrl);
}

const place = (data) => {
  const districtKey = `${data.districtId || "sylhet"}:${data.slug}`;
  const accessDetails = kishoreganjPlaceDetails(data.districtId, data.slug);
  const verifiedCoordinates = accessDetails?.coordinates || KHULNA_PLACE_COORDINATES[districtKey] || BARISHAL_PLACE_COORDINATES[districtKey] || RAJSHAHI_PLACE_COORDINATES[districtKey] || VERIFIED_PLACE_COORDINATES[data.slug];
  const item = {
    districtId: "sylhet",
    district: "Sylhet",
    status: "published",
    image: data.image || FALLBACK_IMAGE,
    ...data,
    id: KHULNA_PLACE_IDS[districtKey] || BARISHAL_PLACE_IDS[districtKey] || districtPlaceId(data.districtId || "sylhet", data.slug),
    practicalTip: accessDetails?.practicalTip || KHULNA_PLACE_NOTES[districtKey] || BARISHAL_PLACE_NOTES[districtKey] || RAJSHAHI_PLACE_NOTES[districtKey] || data.practicalTip,
    districtCenterCoordinates: data.districtCenterCoordinates || data.coordinates,
    coordinates: verifiedCoordinates || data.coordinates,
    roadAccessCoordinates: accessDetails?.roadAccessCoordinates || KHULNA_ROAD_ACCESS_COORDINATES[districtKey] || BARISHAL_ROAD_ACCESS_COORDINATES[districtKey] || RAJSHAHI_ROAD_ACCESS_COORDINATES[districtKey] || ROAD_ACCESS_COORDINATES[data.slug] || null,
    roadAccessLabel: accessDetails?.roadAccessLabel,
    roadRoutingProfile: "shortest-astar",
    coordinatesAreApproximate: verifiedCoordinates ? false : (data.coordinatesAreApproximate ?? true),
  };
  let defaultImage = item.image;
  Object.defineProperty(item, "image", {
    get() {
      const custom = getCustomPlaceImage(data.slug) || getCustomPlaceImage(item.id);
      return custom || defaultImage;
    },
    set(val) {
      defaultImage = val;
    },
    configurable: true,
    enumerable: true,
  });
  return item;
};

const mymensinghDivisionPlaces = [
  ["mymensingh", "Mymensingh", 24.747, 90.42, "Shashi Lodge", "shashi-lodge", "Mymensingh city", "Historic site"],
  ["mymensingh", "Mymensingh", 24.747, 90.42, "Zainul Abedin Museum", "zainul-abedin-museum", "Mymensingh city", "Museum and cultural heritage"],
  ["mymensingh", "Mymensingh", 24.747, 90.42, "Muktagacha Zamindar Bari", "muktagacha-zamindar-bari", "Muktagacha", "Historic site"],
  ["mymensingh", "Mymensingh", 24.747, 90.42, "Alexander Castle", "alexander-castle", "Mymensingh city", "Historic site"],
  ["mymensingh", "Mymensingh", 24.747, 90.42, "Bangladesh Agricultural University campus", "bangladesh-agricultural-university-campus", "Mymensingh city", "University campus"],
  ["mymensingh", "Mymensingh", 24.747, 90.42, "Botanical Garden", "mymensingh-botanical-garden", "Mymensingh city", "Garden"],
  ["mymensingh", "Mymensingh", 24.747, 90.42, "Brahmaputra Riverfront", "mymensingh-brahmaputra-riverfront", "Mymensingh city", "Riverfront"],
  ["mymensingh", "Mymensingh", 24.747, 90.42, "Silver Palace", "silver-palace", "Mymensingh city", "Historic site"],
  ["mymensingh", "Mymensingh", 24.747, 90.42, "Bipin Park", "bipin-park", "Mymensingh city", "Park"],
  ["jamalpur", "Jamalpur", 24.92701, 89.948042, "Lauchapra Picnic Spot", "lauchapra-picnic-spot", "Jamalpur", "Picnic spot"],
  ["jamalpur", "Jamalpur", 24.92701, 89.948042, "Hazrat Shah Jamal Shrine", "hazrat-shah-jamal-shrine", "Jamalpur", "Religious and historic site"],
  ["jamalpur", "Jamalpur", 24.92701, 89.948042, "Doyamoyee Temple", "doyamoyee-temple", "Jamalpur", "Religious and historic site"],
  ["jamalpur", "Jamalpur", 24.92701, 89.948042, "Jamuna River", "jamuna-river-jamalpur", "Jamalpur", "River"],
  ["jamalpur", "Jamalpur", 24.92701, 89.948042, "Brahmaputra River", "brahmaputra-river-jamalpur", "Jamalpur", "River"],
  ["jamalpur", "Jamalpur", 24.92701, 89.948042, "Gandhi Ashram-related local heritage sites", "gandhi-ashram-heritage-sites", "Jamalpur", "Cultural heritage"],
  ["jamalpur", "Jamalpur", 24.92701, 89.948042, "Bakshiganj hill-border countryside", "bakshiganj-hill-border-countryside", "Bakshiganj", "Countryside"],
  ["netrokona", "Netrokona", 24.883, 90.733, "Birishiri", "birishiri", "Durgapur", "Landscape and river"],
  ["netrokona", "Netrokona", 24.883, 90.733, "Susang Durgapur", "susang-durgapur", "Durgapur", "Historic and cultural site"],
  ["netrokona", "Netrokona", 24.883, 90.733, "Someshwari River", "someshwari-river", "Durgapur", "River"],
  ["netrokona", "Netrokona", 24.883, 90.733, "Bijoypur China Clay Hills", "bijoypur-china-clay-hills", "Durgapur", "Hills and landscape"],
  ["netrokona", "Netrokona", 24.883, 90.733, "Garo Hills", "garo-hills-netrokona", "Netrokona", "Hills and landscape"],
  ["netrokona", "Netrokona", 24.883, 90.733, "Kamala Rani Dighi", "kamala-rani-dighi", "Netrokona", "Historic site"],
  ["netrokona", "Netrokona", 24.883, 90.733, "Susang Zamindar Palace ruins", "susang-zamindar-palace-ruins", "Durgapur", "Historic site"],
  ["netrokona", "Netrokona", 24.883, 90.733, "Durgapur Cultural Academy", "durgapur-cultural-academy", "Durgapur", "Cultural heritage"],
  ["netrokona", "Netrokona", 24.883, 90.733, "Haor areas", "netrokona-haor-areas", "Netrokona", "Wetland"],
  ["sherpur", "Sherpur", 25.02, 90.015, "Gajni Abakash", "gajni-abakash", "Jhenaigati", "Park and landscape"],
  ["sherpur", "Sherpur", 25.02, 90.015, "Madhutila Eco Park", "madhutila-eco-park", "Nalitabari", "Eco park"],
  ["sherpur", "Sherpur", 25.02, 90.015, "Panihata-Tarani Hills", "panihata-tarani-hills", "Sherpur", "Hills and landscape"],
  ["sherpur", "Sherpur", 25.02, 90.015, "Raja Pahar", "raja-pahar", "Sherpur", "Hills and landscape"],
  ["sherpur", "Sherpur", 25.02, 90.015, "Nalitabari hills", "nalitabari-hills", "Nalitabari", "Hills and landscape"],
  ["sherpur", "Sherpur", 25.02, 90.015, "Garo Hills", "garo-hills-sherpur", "Sherpur", "Hills and landscape"],
  ["sherpur", "Sherpur", 25.02, 90.015, "Border viewpoints", "sherpur-border-viewpoints", "Sherpur", "Viewpoint"],
  ["sherpur", "Sherpur", 25.02, 90.015, "Maharashi River area", "maharashi-river-area", "Sherpur", "River"],
].map(([districtId, district, lat, lng, name, slug, area, category]) => place({
  districtId,
  district,
  name,
  slug,
  area,
  category,
  aliases: [],
  shortDescription: `${name} is a listed visitor destination in ${district}.`,
  bestTime: { recommended: "November to March", why: "Drier weather is generally more comfortable for local travel.", caution: "Confirm access and local conditions before travel.", lastVerified: null },
  howToReach: `Travel from ${district} town using available local transport and confirm the final approach locally.`,
  practicalTip: "Check current access, weather, and opening information before visiting.",
  coordinates: { lat, lng },
}));

const sylhetDivisionImages = {
  sreemangal: imagePath("bangladesh-destinations-collage.png"),
  "rema-kalenga-wildlife-sanctuary": imagePath("reme-kalenga-wildlife.png"),
};

const dhakaDivisionPlaces = [
  ["dhaka", "Dhaka", 23.81, 90.41, "Lalbagh Fort", "lalbagh-fort", "Old Dhaka", "Historic site"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Ahsan Manzil", "ahsan-manzil", "Kumartuli, Old Dhaka", "Museum and historic site"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Bangladesh National Parliament", "bangladesh-national-parliament", "Sher-e-Bangla Nagar", "Architecture and civic landmark"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Bangladesh National Museum", "bangladesh-national-museum", "Shahbag", "Museum and cultural heritage"],
  ["dhaka", "Dhaka", 23.81, 90.41, "National Martyrs' Memorial, Savar", "national-martyrs-memorial-savar", "Savar", "Memorial and historic site"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Central Shaheed Minar", "central-shaheed-minar", "Dhaka University area", "Memorial and historic site"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Dhakeshwari National Temple", "dhakeshwari-national-temple", "Old Dhaka", "Religious and historic site"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Star Mosque", "star-mosque", "Armanitola, Old Dhaka", "Religious and historic site"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Armenian Church", "armenian-church", "Armanitola, Old Dhaka", "Religious and historic site"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Curzon Hall", "curzon-hall", "Dhaka University", "Architecture and historic site"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Bahadur Shah Park", "bahadur-shah-park", "Old Dhaka", "Park and historic site"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Liberation War Museum", "liberation-war-museum", "Agargaon", "Museum and cultural heritage"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Sadarghat", "sadarghat", "Old Dhaka", "Riverfront and transport landmark"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Buriganga River", "buriganga-river", "Dhaka", "River"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Ramna Park", "ramna-park", "Ramna", "Park"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Rose Garden Palace", "rose-garden-palace", "Old Dhaka", "Historic site"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Sat Gambuj Mosque", "sat-gambuj-mosque-dhaka", "Mohammadpur", "Religious and historic site"],
  ["dhaka", "Dhaka", 23.81, 90.41, "Baitul Mukarram National Mosque", "baitul-mukarram-national-mosque", "Dhaka", "Religious and historic site"],
  ["gazipur", "Gazipur", 23.999, 90.42, "Bhawal National Park", "bhawal-national-park", "Gazipur", "National park"],
  ["gazipur", "Gazipur", 23.999, 90.42, "Gazipur Safari Park", "gazipur-safari-park", "Sreepur", "Safari park"],
  ["gazipur", "Gazipur", 23.999, 90.42, "Nuhash Palli", "nuhash-palli", "Pirujali", "Cultural heritage"],
  ["gazipur", "Gazipur", 23.999, 90.42, "Bhawal Rajbari", "bhawal-rajbari", "Joydebpur", "Historic site"],
  ["gazipur", "Gazipur", 23.999, 90.42, "Bangabandhu Hi-Tech City area", "bangabandhu-hi-tech-city-area", "Kaliakair", "Technology and civic landmark"],
  ["gazipur", "Gazipur", 23.999, 90.42, "Belai Beel", "belai-beel", "Gazipur", "Wetland"],
  ["gazipur", "Gazipur", 23.999, 90.42, "St. Nicholas Church, Kaliganj", "st-nicholas-church-kaliganj", "Kaliganj", "Religious and historic site"],
  ["gopalganj", "Gopalganj", 23.01, 89.83, "Tungipara historic complex", "tungipara-historic-complex", "Tungipara", "Historic site"],
  ["gopalganj", "Gopalganj", 23.01, 89.83, "Orakandi Thakur Bari", "orakandi-thakur-bari", "Kashiani", "Religious and historic site"],
  ["gopalganj", "Gopalganj", 23.01, 89.83, "Ulpur Zamindar Bari", "ulpur-zamindar-bari", "Gopalganj", "Historic site"],
  ["gopalganj", "Gopalganj", 23.01, 89.83, "Court Mosque", "court-mosque-gopalganj", "Gopalganj", "Religious and historic site"],
  ["gopalganj", "Gopalganj", 23.01, 89.83, "Madhumati River", "madhumati-river", "Gopalganj", "River"],
  ["gopalganj", "Gopalganj", 23.01, 89.83, "Sheikh Russell Shishu Park", "sheikh-russell-shishu-park-gopalganj", "Gopalganj", "Park"],
  ["gopalganj", "Gopalganj", 23.01, 89.83, "Bangabandhu Mausoleum Complex", "bangabandhu-mausoleum-complex", "Tungipara", "Memorial and historic site"],
  ["kishoreganj", "Kishoreganj", 24.43, 90.78, "Nikli Haor", "nikli-haor", "Nikli", "Wetland"],
  ["kishoreganj", "Kishoreganj", 24.43, 90.78, "Mithamain Haor", "mithamain-haor", "Mithamain", "Wetland"],
  ["kishoreganj", "Kishoreganj", 24.43, 90.78, "Austagram Haor", "austagram-haor", "Austagram", "Wetland"],
  ["kishoreganj", "Kishoreganj", 24.43, 90.78, "Sholakia Eidgah", "sholakia-eidgah", "Kishoreganj", "Religious and historic site"],
  ["kishoreganj", "Kishoreganj", 24.43, 90.78, "Pagla Mosque", "pagla-mosque", "Kishoreganj", "Religious and historic site"],
  ["kishoreganj", "Kishoreganj", 24.43, 90.78, "Jangalbari Fort", "jangalbari-fort", "Karimganj", "Historic site"],
  ["kishoreganj", "Kishoreganj", 24.43, 90.78, "Egarosindur Fort", "egarosindur-fort", "Pakundia", "Historic site"],
  ["kishoreganj", "Kishoreganj", 24.43, 90.78, "Chandrabati Temple", "chandrabati-temple", "Kishoreganj", "Religious and historic site"],
  ["kishoreganj", "Kishoreganj", 24.43, 90.78, "President Abdul Hamid Road / Haor Road", "president-abdul-hamid-haor-road", "Mithamain", "Scenic road"],
  ["madaripur", "Madaripur", 23.17, 90.21, "Shakuni Lake", "shakuni-lake", "Madaripur", "Lake"],
  ["madaripur", "Madaripur", 23.17, 90.21, "Raja Ram Temple", "raja-ram-temple", "Madaripur", "Religious and historic site"],
  ["madaripur", "Madaripur", 23.17, 90.21, "Auliapur Neelkuthi", "auliapur-neelkuthi", "Madaripur", "Historic site"],
  ["madaripur", "Madaripur", 23.17, 90.21, "Senapati Dighi", "senapati-dighi", "Madaripur", "Historic site"],
  ["madaripur", "Madaripur", 23.17, 90.21, "Arial Khan River", "arial-khan-river", "Madaripur", "River"],
  ["madaripur", "Madaripur", 23.17, 90.21, "Hazrat Shah Madar area", "hazrat-shah-madar-area", "Madaripur", "Religious and historic site"],
  ["manikganj", "Manikganj", 23.86, 90, "Baliati Palace", "baliati-palace", "Saturia", "Historic site"],
  ["manikganj", "Manikganj", 23.86, 90, "Teota Zamindar Bari", "teota-zamindar-bari", "Shibalaya", "Historic site"],
  ["manikganj", "Manikganj", 23.86, 90, "Betila Zamindar Bari", "betila-zamindar-bari", "Manikganj", "Historic site"],
  ["manikganj", "Manikganj", 23.86, 90, "Paturia Ghat", "paturia-ghat", "Shibalaya", "Riverfront and transport landmark"],
  ["manikganj", "Manikganj", 23.86, 90, "Aricha Ghat", "aricha-ghat", "Shibalaya", "Riverfront and transport landmark"],
  ["manikganj", "Manikganj", 23.86, 90, "Kaliganga River area", "kaliganga-river-area", "Manikganj", "River"],
  ["munshiganj", "Munshiganj", 23.54, 90.53, "Idrakpur Fort", "idrakpur-fort", "Munshiganj", "Historic site"],
  ["munshiganj", "Munshiganj", 23.54, 90.53, "Nateshwar Buddhist Archaeological Site", "nateshwar-buddhist-archaeological-site", "Tongibari", "Archaeological site"],
  ["munshiganj", "Munshiganj", 23.54, 90.53, "Baba Adam Mosque", "baba-adam-mosque", "Munshiganj", "Religious and historic site"],
  ["munshiganj", "Munshiganj", 23.54, 90.53, "Sonarang Twin Temples", "sonarang-twin-temples", "Tongibari", "Religious and historic site"],
  ["munshiganj", "Munshiganj", 23.54, 90.53, "Atish Dipankar birthplace", "atish-dipankar-birthplace", "Bikrampur", "Cultural heritage"],
  ["munshiganj", "Munshiganj", 23.54, 90.53, "Mawa Padma Riverfront", "mawa-padma-riverfront", "Louhajang", "Riverfront"],
  ["munshiganj", "Munshiganj", 23.54, 90.53, "Padma Bridge viewpoint", "padma-bridge-viewpoint", "Mawa", "Viewpoint"],
  ["munshiganj", "Munshiganj", 23.54, 90.53, "Bikrampur archaeological sites", "bikrampur-archaeological-sites", "Bikrampur", "Archaeological site"],
  ["narayanganj", "Narayanganj", 23.62, 90.5, "Panam City", "panam-city", "Sonargaon", "Historic site"],
  ["narayanganj", "Narayanganj", 23.62, 90.5, "Bangladesh Folk Art & Craft Museum", "bangladesh-folk-art-craft-museum", "Sonargaon", "Museum and cultural heritage"],
  ["narayanganj", "Narayanganj", 23.62, 90.5, "Goaldi Mosque", "goaldi-mosque", "Sonargaon", "Religious and historic site"],
  ["narayanganj", "Narayanganj", 23.62, 90.5, "Sonakanda Fort", "sonakanda-fort", "Narayanganj", "Historic site"],
  ["narayanganj", "Narayanganj", 23.62, 90.5, "Hajiganj Fort", "hajiganj-fort", "Narayanganj", "Historic site"],
  ["narayanganj", "Narayanganj", 23.62, 90.5, "Murapara Zamindar Palace", "murapara-zamindar-palace", "Rupganj", "Historic site"],
  ["narayanganj", "Narayanganj", 23.62, 90.5, "Langalband", "langalband", "Narayanganj", "Religious and riverfront site"],
  ["narayanganj", "Narayanganj", 23.62, 90.5, "Meghna River", "meghna-river-narayanganj", "Narayanganj", "River"],
  ["narayanganj", "Narayanganj", 23.62, 90.5, "Sonargaon historic area", "sonargaon-historic-area", "Sonargaon", "Historic and cultural site"],
  ["narsingdi", "Narsingdi", 23.92, 90.72, "Wari-Bateshwar Archaeological Site", "wari-bateshwar-archaeological-site", "Belabo", "Archaeological site"],
  ["narsingdi", "Narsingdi", 23.92, 90.72, "Balapur Zamindar Bari", "balapur-zamindar-bari", "Narsingdi", "Historic site"],
  ["narsingdi", "Narsingdi", 23.92, 90.72, "Meghna River", "meghna-river-narsingdi", "Narsingdi", "River"],
  ["narsingdi", "Narsingdi", 23.92, 90.72, "Dream Holiday Park", "dream-holiday-park", "Narsingdi", "Park"],
  ["narsingdi", "Narsingdi", 23.92, 90.72, "Bir Shrestha Matiur Rahman Memorial area", "bir-shrestha-matiur-rahman-memorial-area", "Raipura", "Memorial and historic site"],
  ["narsingdi", "Narsingdi", 23.92, 90.72, "Lakshman Saha Zamindar Bari", "lakshman-saha-zamindar-bari", "Narsingdi", "Historic site"],
  ["rajbari", "Rajbari", 23.76, 89.64, "Goalanda Ghat", "goalanda-ghat", "Goalanda", "Riverfront and transport landmark"],
  ["rajbari", "Rajbari", 23.76, 89.64, "Daulatdia Riverfront", "daulatdia-riverfront", "Goalanda", "Riverfront"],
  ["rajbari", "Rajbari", 23.76, 89.64, "Mir Mosharraf Hossain Memorial", "mir-mosharraf-hossain-memorial", "Baliakandi", "Memorial and historic site"],
  ["rajbari", "Rajbari", 23.76, 89.64, "Padma River", "padma-river-rajbari", "Rajbari", "River"],
  ["rajbari", "Rajbari", 23.76, 89.64, "Rajbari historic railway area", "rajbari-historic-railway-area", "Rajbari", "Historic site"],
  ["rajbari", "Rajbari", 23.76, 89.64, "Jor Bangla Temple", "jor-bangla-temple-rajbari", "Rajbari", "Religious and historic site"],
  ["shariatpur", "Shariatpur", 23.24, 90.43, "Dhanuka Manasa Bari", "dhanuka-manasa-bari", "Shariatpur", "Historic site"],
  ["shariatpur", "Shariatpur", 23.24, 90.43, "Sureshwar Darbar Sharif", "sureshwar-darbar-sharif", "Naria", "Religious and historic site"],
  ["shariatpur", "Shariatpur", 23.24, 90.43, "Kartikpur Zamindar Bari", "kartikpur-zamindar-bari", "Shariatpur", "Historic site"],
  ["shariatpur", "Shariatpur", 23.24, 90.43, "Padma River", "padma-river-shariatpur", "Shariatpur", "River"],
  ["shariatpur", "Shariatpur", 23.24, 90.43, "Naria riverbank", "naria-riverbank", "Naria", "Riverfront"],
  ["shariatpur", "Shariatpur", 23.24, 90.43, "Dhanuka historic area", "dhanuka-historic-area", "Shariatpur", "Historic and cultural site"],
  ["tangail", "Tangail", 24.25, 89.92, "Mahera Zamindar Bari", "mahera-zamindar-bari", "Mirzapur", "Historic site"],
  ["tangail", "Tangail", 24.25, 89.92, "Atia Mosque", "atia-mosque", "Delduar", "Religious and historic site"],
  ["tangail", "Tangail", 24.25, 89.92, "Madhupur National Park", "madhupur-national-park", "Madhupur", "National park"],
  ["tangail", "Tangail", 24.25, 89.92, "Dhanbari Nawab Palace", "dhanbari-nawab-palace", "Dhanbari", "Historic site"],
  ["tangail", "Tangail", 24.25, 89.92, "Pirgacha Rubber Garden", "pirgacha-rubber-garden", "Madhupur", "Garden and landscape"],
  ["tangail", "Tangail", 24.25, 89.92, "Jamuna River", "jamuna-river-tangail", "Tangail", "River"],
  ["tangail", "Tangail", 24.25, 89.92, "Elenga", "elenga", "Tangail", "Town and cultural area"],
  ["tangail", "Tangail", 24.25, 89.92, "Pakutia Zamindar Bari", "pakutia-zamindar-bari", "Nagarpur", "Historic site"],
].map(([districtId, district, lat, lng, name, slug, area, category]) => place({
  districtId,
  district,
  name,
  slug,
  area,
  category,
  aliases: [],
  shortDescription: `${name} is a listed visitor destination in ${district}.`,
  bestTime: { recommended: "November to March", why: "Drier weather is generally more comfortable for local travel.", caution: "Confirm access and local conditions before travel.", lastVerified: null },
  howToReach: `Travel from ${district} town using available local transport and confirm the final approach locally.`,
  practicalTip: "Check current access, weather, and opening information before visiting.",
  coordinates: { lat, lng },
}));

const rangpurCategory = (name) => {
  if (/River|river|Ghat|Port|Bridge|Barrage/.test(name)) return "Riverfront and waterway";
  if (/Park|Zoo|Safari/.test(name)) return "Park and nature";
  if (/Mosque|Temple|Church/.test(name)) return "Religious and historic site";
  if (/Palace|Rajbari|Bari|Archaeological|Vihara|Memorial/.test(name)) return "Historic site";
  return "Tourist place";
};

const rangpurDivisionPlaces = [
  ["rangpur", "Rangpur", 25.75, 89.25, "Tajhat Palace|Begum Rokeya Memorial, Pairaband|Carmichael College|Rangpur Zoo|Town Hall|Ghaghat River|Keramotia Mosque"],
  ["dinajpur", "Dinajpur", 25.63, 88.65, "Kantajew Temple|Ramsagar National Park|Nayabad Mosque|Dinajpur Rajbari|Swapnapuri|Sitakot Vihara|Dhepa River|Hili area"],
  ["panchagarh", "Panchagarh", 26.33, 88.56, "Tetulia|Kanchenjunga viewpoint|Banglabandha Zero Point|Tea Gardens|Rocks Museum|Bhitargarh Archaeological Site|Maharaja Dighi|Karatoya River|Tetulia Dak Bungalow area"],
  ["thakurgaon", "Thakurgaon", 26.03, 88.46, "Haripur Rajbari|Tangon Barrage|Nekmarad archaeological area|Ranishankail Zamindar Bari|Kulik/Tangon river areas|Ancient temples and zamindar sites"],
  ["nilphamari", "Nilphamari", 25.93, 88.86, "Nilsagar|Chini Mosque, Saidpur|Saidpur Railway Workshop|Teesta Barrage/Dalia area|Saidpur historic town|Teesta River"],
  ["lalmonirhat", "Lalmonirhat", 25.92, 89.45, "Teesta Barrage area|Kakina Zamindar Bari|Tushbhandar Zamindar Bari|Burimari Land Port|Teesta Railway Bridge|Tin Bigha Corridor area"],
  ["kurigram", "Kurigram", 25.81, 89.64, "Chilmari River Port|Brahmaputra River|Dharla Bridge|Sonahat Land Port|River islands/chars|Chandamari Mosque|Liberation War memorial sites"],
  ["gaibandha", "Gaibandha", 25.33, 89.54, "Friendship Centre|Balashi Ghat|Brahmaputra/Jamuna riverfront|Bardhan Kuthi|Naldanga Zamindar heritage|Vobaniganj historic areas|River chars"],
].flatMap(([districtId, district, lat, lng, names]) => names.split("|").map((name) => place({
  districtId,
  district,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  area: district,
  category: rangpurCategory(name),
  aliases: [],
  shortDescription: `${name} is a listed visitor destination in ${district}.`,
  bestTime: { recommended: "November to March", why: "Drier weather is generally more comfortable for local travel.", caution: "Confirm access and local conditions before travel.", lastVerified: null },
  howToReach: `Travel from ${district} town using available local transport and confirm the final approach locally.`,
  practicalTip: "Check current access, weather, and opening information before visiting.",
  coordinates: { lat, lng },
})));

const barishalCategory = (name) => {
  if (/Beach|Sea|Char|coastal|Forest/.test(name)) return "Coast and nature";
  if (/River|Channel|Bridge/.test(name)) return "Riverfront and waterway";
  if (/Mosque|Temple|Church/.test(name)) return "Religious and historic site";
  if (/Bari|Fort|heritage/.test(name)) return "Historic site";
  return "Tourist place";
};

const barishalDivisionPlaces = [
  ["barishal", "Barishal", 22.7, 90.37, "Oxford Mission Church|Durga Sagar|Satla Water Lily Beel|Guthia/Baitul Aman Jame Mosque|Korapur Mia Bari Mosque|Qasba Mosque|Kirtankhola River|Bell's Park"],
  ["patuakhali", "Patuakhali", 22.36, 90.33, "Kuakata Sea Beach|Gangamati Beach|Gangamati Reserved Forest|Lebur Char|Fatrar Char|Rakhine Palli|Kuakata Buddhist Temple|Misripara Buddhist Temple|Kuakata Well|Payra Port area"],
  ["bhola", "Bhola", 22.69, 90.65, "Monpura Island|Char Kukri-Mukri Wildlife Sanctuary|Tarua Sea Beach|Dhal Char|Char Fasson|Jacob Tower|Meghna River|Tetulia River"],
  ["jhalokathi", "Jhalokathi", 22.64, 90.2, "Bhimruli Floating Guava Market|Gabkhan Channel|Gabkhan Bridge|Kirtipasha Zamindar Bari|Sujabad Fort area|Sugandha River|Floating markets"],
  ["pirojpur", "Pirojpur", 22.58, 89.98, "Kuriana Floating Market|Swarupkathi|Floating guava gardens|Momin Mosque|Rayerkathi Zamindar Bari|Baleshwar River|Sandha River"],
  ["barguna", "Barguna", 22.16, 90.13, "Tengragiri Eco Park|Sonakata Eco Park|Haringhata Forest|Laldia Beach|Patharghata|Bishkhali River|Taltali coastal forest|Sonakata Beach"],
].flatMap(([districtId, district, lat, lng, names]) => names.split("|").map((name) => place({
  districtId,
  district,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  area: district,
  category: barishalCategory(name),
  aliases: [],
  shortDescription: `${name} is a listed visitor destination in ${district}.`,
  bestTime: { recommended: "November to March", why: "Drier weather is generally more comfortable for local travel.", caution: "Confirm access and local conditions before travel.", lastVerified: null },
  howToReach: `Travel from ${district} town using available local transport and confirm the final approach locally.`,
  practicalTip: "Check current access, weather, and opening information before visiting.",
  coordinates: { lat, lng },
})));

const rajshahiDivisionPlaces = [
  ["rajshahi", "Rajshahi", 24.37, 88.6, "Puthia Temple Complex|Puthia Rajbari|Varendra Research Museum|Bagha Mosque|Padma Riverfront|T-Band|Rajshahi University campus|Shah Makhdum Shrine|Charghat river area|Mango orchards"],
  ["bogura", "Bogura", 24.85, 89.37, "Mahasthangarh|Gokul Medh|Vasu Vihara|Mahasthan Archaeological Museum|Govinda Bhita|Khodar Pathar Bhita|Parshuram Palace site|Karatoya River"],
  ["naogaon", "Naogaon", 24.8, 88.93, "Somapura Mahavihara, Paharpur|Paharpur Museum|Kusumba Mosque|Jagaddala Mahavihara|Altadighi National Park|Dubalhati Rajbari|Balihar Rajbari"],
  ["natore", "Natore", 24.42, 89.0, "Natore Rajbari|Rani Bhabani Palace|Uttara Ganabhaban|Chalan Beel|Dayarampur Rajbari|Halti Beel|Dighapatia Rajbari"],
  ["chapainawabganj", "Chapainawabganj", 24.6, 88.27, "Choto Sona Mosque|Tahkhana Complex|Darasbari Mosque|Darasbari Madrasa|Khania Dighi Mosque|Shah Niamatullah Shrine|Kotwali Darwaza|Mango orchards|Mahananda River"],
  ["pabna", "Pabna", 24.0, 89.24, "Hardinge Bridge|Lalon Shah Bridge|Pakshi|Jor Bangla Temple|Hemayetpur Satsang Ashram|Chalan Beel|Padma River|Pakshi Railway heritage area"],
  ["sirajganj", "Sirajganj", 24.45, 89.7, "Rabindranath Tagore Kacharibari, Shahjadpur|Hatikumrul Navaratna Temple|Jamuna River|Bangabandhu Bridge riverfront|Chalan Beel|Shahjadpur heritage area"],
  ["joypurhat", "Joypurhat", 25.1, 89.02, "Lakma Rajbari|Achranga Dighi|Nandail Dighi|Hinda-Kasba Shahi Mosque|Pagla Dewan Killing Field/Memorial|Panchbibi historical area"],
].flatMap(([districtId, district, lat, lng, names]) => names.split("|").map((name) => place({
  districtId,
  district,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  area: district,
  category: /River|river|Beel|Band|Bridge/.test(name) ? "Riverfront and waterway" : /Mosque|Temple|Shrine/.test(name) ? "Religious and historic site" : /Rajbari|Palace|Archaeological|Mahavihara|Museum|heritage|Memorial/.test(name) ? "Historic site" : /Park/.test(name) ? "Park and nature" : "Tourist place",
  aliases: [], shortDescription: `${name} is a listed visitor destination in ${district}.`,
  bestTime: { recommended: "November to March", why: "Drier weather is generally more comfortable for local travel.", caution: "Confirm access and local conditions before travel.", lastVerified: null },
  howToReach: `Travel from ${district} town using available local transport and confirm the final approach locally.`, practicalTip: "Check current access, weather, and opening information before visiting.", coordinates: { lat, lng },
})));

const chattogramDivisionPlaces = [
  ["chattogram", "Chattogram", 22.36, 91.8, "Patenga Sea Beach|Foy's Lake|Chandranath Temple|Sitakunda Eco Park|Guliakhali Sea Beach|Banshbaria Sea Beach|Batali Hill|Chattogram War Cemetery|Ethnological Museum|DC Hill|CRB|Kattali Beach|Khoiyachora Waterfall|Napittachora Trail|Sahasradhara Waterfall"],
  ["coxs-bazar", "Cox's Bazar", 21.43, 92.0, "Cox's Bazar Sea Beach|Kolatoli Beach|Laboni Beach|Sugandha Beach|Inani Beach|Himchari National Park|Marine Drive|Ramu Buddhist temples|Maheshkhali Island|Adinath Temple|Sonadia Island|Teknaf|Naf River|St. Martin's Island|Chera Dwip|Shah Porir Dwip|Teknaf Wildlife Sanctuary"],
  ["bandarban", "Bandarban", 22.2, 92.22, "Nilgiri|Nilachal|Chimbuk Hill|Boga Lake|Keokradong|Nafakhum Waterfall|Amiakhum Waterfall|Jadipai Waterfall|Shoilo Propat|Buddha Dhatu Jadi|Sangu River|Tindu|Remakri|Rijuk Waterfall|Debotakhum|Dim Pahar"],
  ["rangamati", "Rangamati", 22.65, 92.18, "Kaptai Lake|Hanging Bridge|Shuvolong Waterfall|Rajban Vihara|Kaptai National Park|Polwel Park|Tribal Cultural Institute|Chakma Rajbari|Sajek Valley|Konglak Hill|Ruilui Para"],
  ["khagrachhari", "Khagrachhari", 23.12, 91.98, "Alutila Cave|Risang/Richhang Waterfall|Alutila Tourist Centre|Horticulture Heritage Park|Mayung Kopal|Hatimura|Matai Pukhiri|Dighinala hills|Taiduchhara Waterfall"],
  ["cumilla", "Cumilla", 23.46, 91.18, "Shalban Vihara|Mainamati Museum|Mainamati War Cemetery|Rupban Mura|Itakhola Mura|Kotila Mura|Lalmai Hills|Dharmasagar|Bangladesh Academy for Rural Development area"],
  ["brahmanbaria", "Brahmanbaria", 23.96, 91.11, "Kal Bhairab Temple|Titas River|Kullapathar Martyrs' Cemetery|Akhaura historic area|Anderson Canal|Birampur/Brahmanbaria heritage sites|Kasba war-history locations"],
  ["chandpur", "Chandpur", 23.23, 90.67, "Chandpur Three-River Estuary|Boro Station/Mohona|Meghna River|Padma-Meghna-Dakatia confluence|Haziganj Boro Mosque|Rupsha Zamindar Bari|Chandpur riverfront"],
  ["feni", "Feni", 22.93, 91.4, "Muhuri Irrigation Project|Muhuri Lake|Rajajhir Dighi|Bijoy Singh Dighi|Shamsher Ghazi historical sites|Feni River|Sonagazi coastal area"],
  ["lakshmipur", "Lakshmipur", 22.94, 90.84, "Dalal Bazar Zamindar Bari|Tita Khan Mosque|Khowasagar Dighi|Ramgati Meghna Riverfront|Alexander Meghna embankment|Char Alexander"],
  ["noakhali", "Noakhali", 22.82, 91.1, "Nijhum Dwip|Nijhum Dwip National Park|Hatiya Island|Musapur Closure|Bajra Shahi Mosque|Gandhi Ashram|Birshreshtha Ruhul Amin Memorial Museum|Meghna estuary"],
].flatMap(([districtId, district, lat, lng, names]) => names.split("|").map((name) => place({
  districtId, district, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), area: district,
  category: /Beach|Sea|Island|Dwip|coastal|estuary/.test(name) ? "Coast and nature" : /Lake/.test(name) ? "Lake" : /River|Waterfall|Waterfall|Canal|confluence|Mohona/.test(name) ? "Riverfront and waterway" : /Temple|Mosque|Vihara|Buddha/.test(name) ? "Religious and historic site" : /Cemetery|Museum|Rajbari|heritage|Ashram|Vihara|Mura/.test(name) ? "Historic site" : /Park|Hill|Cave|Trail|Pahar/.test(name) ? "Nature and landscape" : "Tourist place",
  aliases: [], shortDescription: `${name} is a listed visitor destination in ${district}.`, bestTime: { recommended: "November to March", why: "Drier weather is generally more comfortable for local travel.", caution: "Confirm access and local conditions before travel.", lastVerified: null }, howToReach: `Travel from ${district} town using available local transport and confirm the final approach locally.`, practicalTip: "Check current access, weather, and opening information before visiting.", coordinates: { lat, lng },
})));

const khulnaDivisionPlaces = [
  ["khulna", "Khulna", 22.82, 89.55, "Rupsha River|Rupsha Bridge|Gallamari Memorial|Dakshindihi — Tagore family heritage|Pithabhog — Tagore ancestral site|Khulna Divisional Museum|Sundarbans gateway areas"],
  ["bagerhat", "Bagerhat", 22.66, 89.79, "Sixty Dome Mosque|Khan Jahan Ali Mausoleum|Nine Dome Mosque|Singair Mosque|Bagerhat Museum|Ghora Dighi|Mongla|Karamjal Wildlife Centre|Sundarbans|Dhangmari area"],
  ["satkhira", "Satkhira", 22.72, 89.08, "Sundarbans|Burigoalini|Munshiganj Sundarbans gateway|Mandarbaria Sea Beach|Jeshoreshwari Kali Temple|Nalta Sharif|Akashlina Eco Tourism Centre|Kalagachhia Eco Tourism area"],
  ["jashore", "Jashore", 23.16, 89.21, "Sagardari|Michael Madhusudan Dutt Memorial|Godkhali Flower Fields|Chanchra Shiva Temple|Jess Garden Park|Jessore Collectorate heritage area|Bhairab River"],
  ["narail", "Narail", 23.17, 89.51, "SM Sultan Memorial Complex|Chitra River|Birshreshtha Noor Mohammad Memorial|Victoria College heritage area|Arunima countryside area"],
  ["magura", "Magura", 23.49, 89.42, "Raja Sitaram Ray Palace ruins|Mohammadpur historic area|Siddheshwari Math|Nabaganga River|Atharokhada archaeological/historic sites"],
  ["jhenaidah", "Jhenaidah", 23.54, 89.17, "Barobazar Archaeological Sites|Naldanga Temple Complex|Pagla Kanai Shrine|Dhol Samudra Dighi|K.P. Basu ancestral house|Shailkupa Ram Gopal Temple"],
  ["kushtia", "Kushtia", 23.9, 89.12, "Lalon Shah Shrine|Shilaidaha Kuthibari|Kangal Harinath Museum|Mir Mosharraf Hossain Memorial|Gorai River|Tagore heritage area|Lalon Academy"],
  ["chuadanga", "Chuadanga", 23.64, 88.84, "Karpasdanga Neelkuthi|Kazi Nazrul memorial sites at Karpasdanga|Carew & Co. historic industrial area, Darshana|Darshana railway heritage|Mathabhanga River|Liberation War memorial sites"],
  ["meherpur", "Meherpur", 23.76, 88.63, "Mujibnagar Memorial Complex|Mujibnagar Mango Grove|Amjhupi Neelkuthi|Bhatpara Neelkuthi|Meherpur historic sites|Bhairab River"],
].flatMap(([districtId, district, lat, lng, names]) => names.split("|").map((name) => place({
  districtId, district, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), area: district,
  category: /Sundarbans|Wildlife|Beach|Flower|countryside/.test(name) ? "Nature and landscape" : /River|Bridge|Dighi/.test(name) ? "Riverfront and waterway" : /Mosque|Temple|Shrine|Math/.test(name) ? "Religious and historic site" : /Memorial|Museum|heritage|Kuthibari|Neelkuthi|Archaeological|Palace|house/.test(name) ? "Historic site" : "Tourist place",
  aliases: [], shortDescription: `${name} is a listed visitor destination in ${district}.`, bestTime: { recommended: "November to March", why: "Drier weather is generally more comfortable for local travel.", caution: "Confirm access and local conditions before travel.", lastVerified: null }, howToReach: `Travel from ${district} town using available local transport and confirm the final approach locally.`, practicalTip: "Check current access, weather, and opening information before visiting.", coordinates: { lat, lng },
})));

const sylhetDivisionPlaces = [
  ["sylhet", "Sylhet", 24.894, 91.868, "Tamabil", "tamabil", "Gowainghat", "Border landscape"],
  ["sylhet", "Sylhet", 24.894, 91.868, "Utma Chhara", "utma-chhara", "Sylhet", "Waterfall and stream"],
  ["moulvibazar", "Moulvibazar", 24.482, 91.777, "Sreemangal", "sreemangal", "Sreemangal", "Tea landscape"],
  ["moulvibazar", "Moulvibazar", 24.482, 91.777, "Lawachara National Park", "lawachara-national-park", "Kamalganj", "National park"],
  ["moulvibazar", "Moulvibazar", 24.482, 91.777, "Madhabkunda Waterfall", "madhabkunda-waterfall", "Barlekha", "Waterfall"],
  ["moulvibazar", "Moulvibazar", 24.482, 91.777, "Madhabpur Lake", "madhabpur-lake", "Kamalganj", "Lake"],
  ["moulvibazar", "Moulvibazar", 24.482, 91.777, "Baikka Beel", "baikka-beel", "Sreemangal", "Wetland"],
  ["moulvibazar", "Moulvibazar", 24.482, 91.777, "Ham Ham Waterfall", "ham-ham-waterfall", "Kamalganj", "Waterfall"],
  ["moulvibazar", "Moulvibazar", 24.482, 91.777, "Hakaluki Haor", "hakaluki-haor", "Moulvibazar", "Wetland"],
  ["moulvibazar", "Moulvibazar", 24.482, 91.777, "Tea gardens", "moulvibazar-tea-gardens", "Moulvibazar", "Tea landscape"],
  ["moulvibazar", "Moulvibazar", 24.482, 91.777, "Manipuri villages", "manipuri-villages", "Kamalganj", "Cultural heritage"],
  ["moulvibazar", "Moulvibazar", 24.482, 91.777, "Adampur Forest", "adampur-forest", "Kamalganj", "Forest"],
  ["moulvibazar", "Moulvibazar", 24.482, 91.777, "Madhabpur tea estate", "madhabpur-tea-estate", "Kamalganj", "Tea landscape"],
  ["habiganj", "Habiganj", 24.374, 91.415, "Satchari National Park", "satchari-national-park", "Chunarughat", "National park"],
  ["habiganj", "Habiganj", 24.374, 91.415, "Rema-Kalenga Wildlife Sanctuary", "rema-kalenga-wildlife-sanctuary", "Chunarughat", "Wildlife sanctuary"],
  ["habiganj", "Habiganj", 24.374, 91.415, "Teliapara Memorial", "teliapara-memorial", "Madhabpur", "Historic site"],
  ["habiganj", "Habiganj", 24.374, 91.415, "Bithangal Akhra", "bithangal-akhra", "Habiganj", "Cultural heritage"],
  ["habiganj", "Habiganj", 24.374, 91.415, "Baniachang", "baniachang", "Baniachang", "Historic and cultural site"],
  ["habiganj", "Habiganj", 24.374, 91.415, "Habiganj tea gardens", "habiganj-tea-gardens", "Habiganj", "Tea landscape"],
  ["habiganj", "Habiganj", 24.374, 91.415, "Khowai River", "khowai-river", "Habiganj", "River"],
  ["sunamganj", "Sunamganj", 25.065, 91.395, "Tanguar Haor", "tanguar-haor", "Tahirpur", "Wetland"],
  ["sunamganj", "Sunamganj", 25.065, 91.395, "Niladri Lake", "niladri-lake", "Tahirpur", "Lake"],
  ["sunamganj", "Sunamganj", 25.065, 91.395, "Jadukata River", "jadukata-river", "Tahirpur", "River"],
  ["sunamganj", "Sunamganj", 25.065, 91.395, "Shimul Bagan", "shimul-bagan", "Tahirpur", "Landscape and seasonal garden"],
  ["sunamganj", "Sunamganj", 25.065, 91.395, "Barikka Tila", "barikka-tila", "Tahirpur", "Hills and landscape"],
  ["sunamganj", "Sunamganj", 25.065, 91.395, "Tekerghat", "tekerghat", "Tahirpur", "Lakeside and border landscape"],
  ["sunamganj", "Sunamganj", 25.065, 91.395, "Hason Raja Museum", "hason-raja-museum", "Sunamganj town", "Museum and cultural heritage"],
  ["sunamganj", "Sunamganj", 25.065, 91.395, "Lakma Chhara", "lakma-chhara", "Sunamganj", "Waterfall and stream"],
  ["sunamganj", "Sunamganj", 25.065, 91.395, "Meghalaya foothill viewpoints", "meghalaya-foothill-viewpoints", "Tahirpur", "Viewpoint"],
].map(([districtId, district, lat, lng, name, slug, area, category]) => place({
  districtId,
  district,
  name,
  slug,
  area,
  category,
  image: sylhetDivisionImages[slug] || FALLBACK_IMAGE,
  aliases: [],
  shortDescription: `${name} is a listed visitor destination in ${district}.`,
  bestTime: { recommended: "November to March", why: "Drier weather is generally more comfortable for local travel.", caution: "Confirm access and local conditions before travel.", lastVerified: null },
  howToReach: `Travel from ${district} town using available local transport and confirm the final approach locally.`,
  practicalTip: "Check current access, weather, and opening information before visiting.",
  coordinates: { lat, lng },
}));

export const places = [
  place({
    id: "ratargul-swamp-forest",
    image: imagePath("sylhet-division-landscapes.png"),
    name: "Ratargul Swamp Forest",
    slug: "ratargul-swamp-forest",
    aliases: ["Ratargul", "Ratargul Swamp Forest"],
    area: "Gowainghat",
    category: "Forest waterway",
    shortDescription: "A freshwater swamp forest explored by small local boats when water levels allow.",
    bestTime: {
      recommended: "Monsoon and early post-monsoon",
      why: "Higher water levels make the forest waterways easier to explore by boat.",
      caution: "Water depth, boat access, and conditions change with rainfall.",
      lastVerified: null,
    },
    howToReach: "Travel from Sylhet city toward Gowainghat, then use the local Ratargul access road and boat point.",
    practicalTip: "Confirm water level and boat availability locally before leaving Sylhet city.",
    coordinates: { lat: 25.001, lng: 91.978 },
  }),
  place({
    id: "jaflong",
    image: imagePath("jaflong-river.png"),
    name: "Jaflong",
    slug: "jaflong",
    aliases: ["Jaflong Zero Point"],
    area: "Gowainghat",
    category: "River and hills",
    shortDescription: "A border-side landscape known for the Piyain River, stone beds, and views toward the Khasi hills.",
    bestTime: {
      recommended: "October to March",
      why: "Clearer weather is comfortable for riverbank walks and day trips.",
      caution: "Monsoon currents can be strong and river conditions can change quickly.",
      lastVerified: null,
    },
    howToReach: "Use the Sylhet-Jaflong road from Sylhet city by bus, reserved car, or local transport.",
    practicalTip: "Start early; the road is busy on weekends and public holidays.",
    coordinates: { lat: 25.166, lng: 92.017 },
  }),
  place({
    id: "lalakhal",
    name: "Lalakhal",
    slug: "lalakhal",
    aliases: ["Lala Khal", "Sari River"],
    area: "Jaintiapur",
    category: "River",
    shortDescription: "A river destination on the Sari River corridor, visited for boat rides and surrounding hill views.",
    bestTime: {
      recommended: "November to March",
      why: "Drier weather usually provides calmer day-trip conditions.",
      caution: "Water colour and boat conditions vary by season and rainfall.",
      lastVerified: null,
    },
    howToReach: "Travel from Sylhet city toward Sarighat on the Jaflong road, then continue to a local Lalakhal boat point.",
    practicalTip: "Agree on the boat route, duration, and fare before departure.",
    coordinates: { lat: 25.105, lng: 92.171 },
  }),
  place({
    id: "bichanakandi",
    name: "Bichanakandi",
    slug: "bichanakandi",
    aliases: ["Bisnakandi", "Bichnakandi"],
    area: "Gowainghat",
    category: "Stone bed and stream",
    shortDescription: "A borderland stone bed where hill streams meet beside views of the Meghalaya foothills.",
    bestTime: {
      recommended: "June to September",
      why: "Monsoon water brings the streams and surrounding landscape to life.",
      caution: "Rocks are slippery and currents can rise after heavy rain.",
      lastVerified: null,
    },
    howToReach: "Travel from Sylhet city toward Hadarpar, then continue by local boat or available road transport.",
    practicalTip: "Wear footwear with grip and check the return transport schedule before exploring.",
    coordinates: { lat: 25.171, lng: 91.887 },
  }),
  place({
    id: "panthumai",
    name: "Pangthumai",
    slug: "panthumai",
    aliases: ["Panthumai", "Panthumai Waterfall Viewpoint", "Panthumai Jhorna"],
    area: "West Jaflong, Gowainghat",
    category: "Village and waterfall viewpoint",
    shortDescription: "A border village offering a Bangladesh-side view of a waterfall descending from Meghalaya.",
    bestTime: {
      recommended: "June to September",
      why: "Monsoon rainfall gives the waterfall its strongest flow.",
      caution: "The waterfall is across the international border; remain on the Bangladesh side.",
      lastVerified: null,
    },
    howToReach: "Travel from Sylhet city toward Gowainghat and continue by local road transport to Panthumai village.",
    practicalTip: "Respect border instructions and avoid entering restricted water or land areas.",
    coordinates: { lat: 25.1760963, lng: 91.9566475 },
  }),
  place({
    id: "khadimnagar-national-park",
    name: "Khadimnagar National Park",
    slug: "khadimnagar-national-park",
    aliases: ["Khadim Nagar National Park"],
    area: "Khadimnagar",
    category: "National park",
    shortDescription: "A protected evergreen forest near Sylhet city with walking trails and quiet woodland scenery.",
    bestTime: {
      recommended: "October to March",
      why: "Cooler, drier weather is more comfortable for walking forest trails.",
      caution: "Trail conditions may be muddy during rain; follow local forest guidance.",
      lastVerified: null,
    },
    howToReach: "Travel east from Sylhet city toward Khadimnagar by reserved or local road transport.",
    practicalTip: "Visit in daylight and check current entry guidance at the forest office.",
    coordinates: { lat: 24.964, lng: 91.998 },
  }),
  place({
    id: "hazrat-shah-jalal-dargah",
    name: "Shrine of Hazrat Shah Jalal",
    slug: "hazrat-shah-jalal-dargah",
    aliases: ["Hazrat Shah Jalal Dargah", "Shahjalal Dargah", "Dargah Gate"],
    area: "Dargah Mahalla, Sylhet city",
    category: "Religious and historic site",
    shortDescription: "The shrine complex of Sufi saint Hazrat Shah Jalal, one of Sylhet city's best-known landmarks.",
    bestTime: {
      recommended: "Year-round",
      why: "The city-centre site is accessible in every season.",
      caution: "It can be crowded during religious occasions and weekly peak periods.",
      lastVerified: null,
    },
    howToReach: "Use a rickshaw, CNG auto-rickshaw, or walk from central Sylhet to Dargah Gate.",
    practicalTip: "Dress respectfully and follow the separate access and photography rules posted on site.",
    coordinates: { lat: 24.899, lng: 91.868 },
  }),
  place({
    id: "hazrat-shah-paran-dargah",
    name: "Shrine of Shah Paran",
    slug: "hazrat-shah-paran-dargah",
    aliases: ["Hazrat Shah Paran Dargah", "Shah Paran Mazar", "Shahporan Dargah"],
    area: "Shah Paran",
    category: "Religious and historic site",
    shortDescription: "A hilltop shrine complex associated with Sufi saint Hazrat Shah Paran on the eastern side of Sylhet city.",
    bestTime: {
      recommended: "Year-round",
      why: "Road access from Sylhet city makes it a practical visit in any season.",
      caution: "Steps and sloped paths may be difficult for some visitors.",
      lastVerified: null,
    },
    howToReach: "Travel east from Sylhet city on the Tamabil road and take local access to the shrine complex.",
    practicalTip: "Dress respectfully and allow extra time during busy religious periods.",
    coordinates: { lat: 24.897, lng: 91.933 },
  }),
  place({
    id: "malnichhara-tea-estate",
    image: imagePath("sylhet-tea-estate.png"),
    name: "Malnichhara Tea Garden",
    slug: "malnichhara-tea-estate",
    aliases: ["Malnichhara Tea Estate", "Malnicherra Tea Estate", "Malni Chhara Tea Garden"],
    area: "Airport Road, Sylhet city",
    category: "Tea landscape",
    shortDescription: "A historic tea estate on the edge of Sylhet city, known for its rolling tea-garden landscape.",
    bestTime: {
      recommended: "October to March",
      why: "Cooler, drier weather is pleasant for viewing the tea landscape.",
      caution: "This is a working estate; visitor access can be restricted.",
      lastVerified: null,
    },
    howToReach: "Travel from central Sylhet toward Airport Road by rickshaw, CNG auto-rickshaw, or reserved car.",
    practicalTip: "Ask for permission before entering estate roads or photographing workers.",
    coordinates: { lat: 24.921, lng: 91.856 },
  }),
  place({
    id: "lakkatura-tea-garden",
    image: imagePath("sylhet-tea-estate.png"),
    name: "Lakkatura Tea Garden",
    slug: "lakkatura-tea-garden",
    aliases: ["Lakkatura Tea Estate", "Lakkatura Tea Garden"],
    area: "Airport Road, Sylhet city",
    category: "Tea landscape",
    shortDescription: "A working tea garden close to Sylhet city, valued for broad green slopes and an easy city-side location.",
    bestTime: {
      recommended: "October to March",
      why: "Milder weather makes roadside viewing and short visits more comfortable.",
      caution: "Access beyond public roads depends on estate permission.",
      lastVerified: null,
    },
    howToReach: "Follow Airport Road north from central Sylhet using local or reserved transport.",
    practicalTip: "Keep to public access areas unless estate staff explicitly permit entry.",
    coordinates: { lat: 24.933, lng: 91.883 },
  }),
  place({
    id: "mathurapur-deul",
    districtId: "faridpur",
    district: "Faridpur",
    name: "Mathurapur Deul",
    slug: "mathurapur-deul",
    aliases: ["Mathurapur Temple"],
    area: "Mathurapur, Faridpur",
    category: "Historic site",
    shortDescription: "A historic deul in the Faridpur area, included as a heritage stop for local visitors.",
    howToReach: "Travel from Faridpur town using local road transport and confirm the final approach locally.",
    practicalTip: "Check current access conditions before travel.",
    coordinates: { lat: 23.607, lng: 89.842 },
  }),
  place({
    id: "satoir-shahi-jame-mosque",
    districtId: "faridpur",
    district: "Faridpur",
    name: "Satoir Shahi Jame Mosque",
    slug: "satoir-shahi-jame-mosque",
    aliases: ["Satoir Shahi Jame Masjid"],
    area: "Satoir, Faridpur",
    category: "Religious and historic site",
    shortDescription: "A notable mosque in Satoir, added for visitors interested in Faridpur's religious heritage.",
    howToReach: "Travel from Faridpur town by local road transport toward Satoir.",
    practicalTip: "Dress respectfully and follow local mosque access guidance.",
    coordinates: { lat: 23.607, lng: 89.842 },
  }),
  place({
    id: "gerda-mosque",
    districtId: "faridpur",
    district: "Faridpur",
    name: "Gerda Mosque",
    slug: "gerda-mosque",
    aliases: ["Gerda Masjid"],
    area: "Gerda, Faridpur",
    category: "Religious and historic site",
    shortDescription: "A mosque in Gerda that can be included in a Faridpur heritage visit.",
    howToReach: "Use local transport from Faridpur town toward Gerda.",
    practicalTip: "Respect prayer times and local photography rules.",
    coordinates: { lat: 23.607, lng: 89.842 },
  }),
  place({
    id: "faridpur-riverfront",
    districtId: "faridpur",
    district: "Faridpur",
    name: "Faridpur Riverfront",
    slug: "faridpur-riverfront",
    aliases: ["Faridpur River Front"],
    area: "Faridpur town",
    category: "Riverfront",
    shortDescription: "A riverfront stop in Faridpur for a relaxed town-side visit.",
    howToReach: "Travel by rickshaw, CNG, or local transport from central Faridpur.",
    practicalTip: "Visit in daylight and check local weather before going.",
    coordinates: { lat: 23.607, lng: 89.842 },
  }),
  place({
    id: "sheikh-rasel-shishu-park",
    districtId: "faridpur",
    district: "Faridpur",
    name: "Sheikh Rasel Shishu Park",
    slug: "sheikh-rasel-shishu-park",
    aliases: ["Sheikh Russel Shishu Park"],
    area: "Faridpur town",
    category: "Park",
    shortDescription: "A family-oriented park in Faridpur town.",
    howToReach: "Use local transport from central Faridpur.",
    practicalTip: "Check opening hours before visiting.",
    coordinates: { lat: 23.607, lng: 89.842 },
  }),
  place({
    id: "kanaipur-zamindar-bari",
    districtId: "faridpur",
    district: "Faridpur",
    name: "Kanaipur Zamindar Bari",
    slug: "kanaipur-zamindar-bari",
    aliases: ["Kanaipur Zamindar House"],
    area: "Kanaipur, Faridpur",
    category: "Historic site",
    shortDescription: "A zamindar-bari area in Kanaipur, included as a Faridpur heritage stop.",
    howToReach: "Travel from Faridpur town toward Kanaipur by local road transport.",
    practicalTip: "Ask locally about entry access before visiting the property.",
    coordinates: { lat: 23.607, lng: 89.842 },
  }),
  place({
    id: "jasimuddin-house-museum-area",
    districtId: "faridpur",
    district: "Faridpur",
    name: "Jasimuddin's House/Museum area",
    slug: "jasimuddin-house-museum-area",
    aliases: ["Jasimuddin House", "Jasimuddin Museum"],
    area: "Faridpur",
    category: "Cultural heritage",
    shortDescription: "An area associated with poet Jasimuddin, included for visitors interested in Faridpur's cultural heritage.",
    howToReach: "Travel from Faridpur town using local transport and confirm the exact visitor point locally.",
    practicalTip: "Confirm visitor access and opening information before travel.",
    coordinates: { lat: 23.607, lng: 89.842 },
  }),
  ...dhakaDivisionPlaces,
  ...rangpurDivisionPlaces,
  ...barishalDivisionPlaces,
  ...rajshahiDivisionPlaces,
  ...chattogramDivisionPlaces,
  ...khulnaDivisionPlaces,
  ...sylhetDivisionPlaces,
  ...mymensinghDivisionPlaces,
];

function mostCommonCoordinates(items) {
  const counts = new globalThis.Map();
  items.forEach((item) => {
    const coordinates = item.districtCenterCoordinates || item.coordinates;
    if (!coordinates) return;
    const key = `${coordinates.lat},${coordinates.lng}`;
    const current = counts.get(key) || { coordinates, count: 0 };
    current.count += 1;
    counts.set(key, current);
  });
  return [...counts.values()].sort((left, right) => right.count - left.count)[0]?.coordinates;
}

export const DISTRICT_CENTER_COORDINATES = Object.freeze(Object.fromEntries(
  districts.map((district) => [district.slug, mostCommonCoordinates(places.filter((item) => item.districtId === district.id))]),
));

export const FALLBACK_PLACE_COORDINATES = Object.freeze(Object.fromEntries(
  places.flatMap((item) => [[item.slug, item.coordinates], [`${item.districtId}:${item.slug}`, item.coordinates]]),
));

export const suggestedPlacesForDistrict = (districtId) => places.filter((place) => place.districtId === districtId);

export function replacePublishedTourismData(nextDistricts, nextPlaces) {
  districts.splice(0, districts.length, ...nextDistricts);
  places.splice(0, places.length, ...nextPlaces);
  placesVersion += 1;
}

// Real marketplace inventory is intentionally empty until providers are verified.
export const guides = [];
export const waterListings = [];

export const curatedItineraries = [
  {
    id: "sylhet-1-day-city",
    districtId: "sylhet",
    durationDays: 1,
    name: "Sylhet City Essentials",
    start: "city-center",
    days: [[
      "hazrat-shah-jalal-dargah",
      "malnichhara-tea-estate",
      "lakkatura-tea-garden",
      "hazrat-shah-paran-dargah",
    ]],
  },
  {
    id: "sylhet-2-day-highlights",
    districtId: "sylhet",
    durationDays: 2,
    name: "Sylhet Water and Hills",
    start: "city-center",
    days: [
      ["ratargul-swamp-forest", "bichanakandi"],
      ["jaflong", "lalakhal"],
    ],
  },
  {
    id: "sylhet-3-day-highlights",
    districtId: "sylhet",
    durationDays: 3,
    name: "Sylhet District Highlights",
    start: "city-center",
    days: [
      ["hazrat-shah-jalal-dargah", "malnichhara-tea-estate", "hazrat-shah-paran-dargah"],
      ["ratargul-swamp-forest", "bichanakandi"],
      ["jaflong", "lalakhal", "khadimnagar-national-park"],
    ],
  },
];
