/**
 * Curated scenic photo galleries for Bangladesh destinations.
 * Each place gets 6 to 9 atmospheric photos showcasing the silent beauty of the location.
 */
import { CUSTOM_MEDIA_STORE, broadcastAndPersistMedia } from "./tourism.js";

// Universal local fallbacks available offline in public/images/gallery/
const LOCAL_WATER = [
  "/images/gallery/water-1.jpg",
  "/images/gallery/water-2.jpg",
  "/images/gallery/water-3.jpg",
  "/images/gallery/water-4.jpg",
  "/images/gallery/water-5.jpg",
  "/images/gallery/water-6.jpg",
  "/images/gallery/river-1.jpg",
  "/images/gallery/river-2.jpg",
];

const LOCAL_HILLS = [
  "/images/gallery/nature-1.jpg",
  "/images/gallery/river-2.jpg",
  "/images/gallery/forest-1.jpg",
  "/images/gallery/water-2.jpg",
  "/images/gallery/river-1.jpg",
  "/images/gallery/nature-1.jpg",
  "/images/gallery/water-5.jpg",
  "/images/gallery/forest-1.jpg",
];

const LOCAL_FOREST = [
  "/images/gallery/forest-1.jpg",
  "/images/gallery/water-1.jpg",
  "/images/gallery/nature-1.jpg",
  "/images/gallery/water-4.jpg",
  "/images/gallery/forest-1.jpg",
  "/images/gallery/water-3.jpg",
  "/images/gallery/river-1.jpg",
  "/images/gallery/water-5.jpg",
];

const LOCAL_HERITAGE = [
  "/images/gallery/heritage-1.jpg",
  "/images/gallery/heritage-2.jpg",
  "/images/gallery/water-5.jpg",
  "/images/gallery/nature-1.jpg",
  "/images/gallery/heritage-1.jpg",
  "/images/gallery/water-2.jpg",
  "/images/gallery/heritage-2.jpg",
  "/images/gallery/water-1.jpg",
];

const LOCAL_BEACH = [
  "/images/gallery/beach-1.jpg",
  "/images/gallery/water-3.jpg",
  "/images/gallery/water-5.jpg",
  "/images/gallery/water-6.jpg",
  "/images/gallery/beach-1.jpg",
  "/images/gallery/water-2.jpg",
  "/images/gallery/water-1.jpg",
  "/images/gallery/water-4.jpg",
];

// Specific curated galleries for notable destinations
const SPECIFIC_GALLERIES = {
  // Achranga Dighi (Joypurhat) - Exact place in user screenshot
  "achranga-dighi": [
    {
      url: "/images/gallery/water-1.jpg",
      fallbackUrl: "/images/gallery/water-1.jpg",
      captionBn: "আঁচরঙ্গা দিঘির শান্ত ও স্নিগ্ধ জলরাশি",
      captionEn: "Peaceful waters of Achranga Dighi",
      tagBn: "শান্ত জলরাশি",
      tagEn: "Calm Waters",
    },
    {
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-2.jpg",
      captionBn: "স্বচ্ছ পানিতে সবুজ গাছপালা ও আকাশের শান্ত প্রতিচ্ছবি",
      captionEn: "Tranquil reflections of trees across the glassy water",
      tagBn: "মনোরম প্রতিচ্ছবি",
      tagEn: "Reflections",
    },
    {
      url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-3.jpg",
      captionBn: "দিঘির পাড়ে বাঁধা নিঃশব্দ দেশি নৌকা",
      captionEn: "Quiet wooden boat resting near the dighi bank",
      tagBn: "দেশি নৌকা",
      tagEn: "Country Boat",
    },
    {
      url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-4.jpg",
      captionBn: "ভোরের মৃদু কুয়াশায় ঘেরা দিঘির চারপাশ ও নিস্তব্ধতা",
      captionEn: "Soft morning mist draping the quiet embankments",
      tagBn: "ভোরের কুয়াশা",
      tagEn: "Morning Mist",
    },
    {
      url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/forest-1.jpg",
      captionBn: "দিঘির চারপাশে ছায়াঘেরা প্রাচীন বৃক্ষরাজি",
      captionEn: "Lush leafy canopy framing the historical reservoir",
      tagBn: "ছায়াঘেরা বৃক্ষ",
      tagEn: "Green Canopy",
    },
    {
      url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-5.jpg",
      captionBn: "গোধূলি আলোয় দিঘির জলের রূপালী ঝিলিক",
      captionEn: "Golden hour shimmer across the serene water surface",
      tagBn: "গোধূলির আলো",
      tagEn: "Golden Hour",
    },
    {
      url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/nature-1.jpg",
      captionBn: "সবুজ পল্লিপ্রকৃতির মাঝে নিভৃত শান্তির অনুভূতি",
      captionEn: "Unbroken quietude nestled in the rural countryside",
      tagBn: "প্রকৃতির নিস্তব্ধতা",
      tagEn: "Silent Beauty",
    },
    {
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/river-1.jpg",
      captionBn: "সন্ধ্যা নামার মুখে শান্ত জলের দিগন্ত",
      captionEn: "Dusk gently falling over the ancient expanse",
      tagBn: "সন্ধ্যার নিস্তব্ধতা",
      tagEn: "Twilight Serenity",
    },
  ],

  // Jaflong
  "jaflong": [
    {
      url: "/images/jaflong-river.png",
      fallbackUrl: "/images/gallery/river-1.jpg",
      captionBn: "পিয়াইন নদী ও পাথুরে নদীগর্ভের স্বচ্ছ প্রবাহ",
      captionEn: "Clear currents flowing over the stone beds of Piyain River",
      tagBn: "স্বচ্ছ জলধারা",
      tagEn: "Clear Waters",
    },
    {
      url: "/images/gallery/river-2.jpg",
      fallbackUrl: "/images/gallery/river-2.jpg",
      captionBn: "সীমান্তে মেঘালয়ের সবুজ পাহাড়ের মনোরম দৃশ্য",
      captionEn: "Lush green hills rising along the horizon",
      tagBn: "পাহাড়ের রূপ",
      tagEn: "Mountain Horizon",
    },
    {
      url: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-1.jpg",
      captionBn: "পাহাড় থেকে নেমে আসা স্নিগ্ধ শীতল জল",
      captionEn: "Cool mountain waters cascading through the valley",
      tagBn: "পাহাড়ি ছড়া",
      tagEn: "Mountain Stream",
    },
    {
      url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-4.jpg",
      captionBn: "ভোরের কুয়াশা ও পাথুরে উপত্যকার নিস্তব্ধতা",
      captionEn: "Morning mist settling over the river valley",
      tagBn: "ভোরের নিস্তব্ধতা",
      tagEn: "Morning Solitude",
    },
    {
      url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-3.jpg",
      captionBn: "নদী তীরে থেমে থাকা স্থানীয়দের ছোট নৌকা",
      captionEn: "Traditional wooden boats anchored on the riverbank",
      tagBn: "নৌ-ভ্রমণ",
      tagEn: "Local Boats",
    },
    {
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-2.jpg",
      captionBn: "নদীর বুকে নীল আকাশ ও পাহাড়ের প্রতিচ্ছবি",
      captionEn: "Mirror-like reflections of skies and hills",
      tagBn: "প্রতিচ্ছবি",
      tagEn: "Reflections",
    },
    {
      url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/nature-1.jpg",
      captionBn: "জাফলং চা বাগান ও ছায়াঘেরা সবুজ প্রান্তর",
      captionEn: "Nearby tea gardens resting under shaded trees",
      tagBn: "চা বাগান",
      tagEn: "Tea Greens",
    },
    {
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-5.jpg",
      captionBn: "পড়ন্ত বিকেলে পিয়াইন নদীর সোনালী মোহনা",
      captionEn: "Golden sunset filtering over the river bend",
      tagBn: "সূর্যাস্তের রূপ",
      tagEn: "Sunset Vista",
    },
  ],

  // Ratargul Swamp Forest
  "ratargul-swamp-forest": [
    {
      url: "/images/sylhet-waterway.png",
      fallbackUrl: "/images/gallery/water-1.jpg",
      captionBn: "জলাবনের ভেতর শান্তভাবে ভেসে চলা ছোট দেশি নৌকা",
      captionEn: "Small wooden boat gliding through the freshwater swamp",
      tagBn: "জলাবন",
      tagEn: "Swamp Forest",
    },
    {
      url: "/images/gallery/water-2.jpg",
      fallbackUrl: "/images/gallery/water-2.jpg",
      captionBn: "পানিতে নিমজ্জিত করচ ও হিজল গাছের সবুজ ডালপালা",
      captionEn: "Submerged Koroch and Hijal trees creating a green maze",
      tagBn: "জলমগ্ন বৃক্ষ",
      tagEn: "Submerged Trees",
    },
    {
      url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/forest-1.jpg",
      captionBn: "সবুজ পাতার ফাঁক দিয়ে নেমে আসা স্নিগ্ধ রোদ",
      captionEn: "Filtered dappled sunlight piercing the dense canopy",
      tagBn: "সবুজ ক্যানোপি",
      tagEn: "Canopy Light",
    },
    {
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-4.jpg",
      captionBn: "জল ও বনের নীরব মিলনস্থল",
      captionEn: "Silent communion of pure water and living forest",
      tagBn: "নীরবতা",
      tagEn: "Tranquility",
    },
    {
      url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-3.jpg",
      captionBn: "স্বচ্ছ জলে পাতার নিখুঁত প্রতিফলন",
      captionEn: "Pristine mirror reflections on calm inland waterways",
      tagBn: "স্বচ্ছ জল",
      tagEn: "Clear Waterway",
    },
    {
      url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-5.jpg",
      captionBn: "কুয়াশাচ্ছন্ন ভোরে রাতারগুলের মায়াবী রূপ",
      captionEn: "Mystic atmosphere as morning mist hovers over the swamp",
      tagBn: "মায়াবী রূপ",
      tagEn: "Mystic Dawn",
    },
    {
      url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/nature-1.jpg",
      captionBn: "বনের বাইরে বিস্তৃত জলরাশি ও দিগন্ত",
      captionEn: "Open horizon where the swamp opens into water fields",
      tagBn: "উন্মুক্ত দিগন্ত",
      tagEn: "Open Waters",
    },
    {
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/river-1.jpg",
      captionBn: "সন্ধ্যায় ফিরে আসার শান্ত মুহূর্ত",
      captionEn: "Quiet dusk falling over the swamp waterways",
      tagBn: "সন্ধ্যা",
      tagEn: "Evening Silence",
    },
  ],

  // Cox's Bazar Sea Beach
  "coxs-bazar-sea-beach": [
    {
      url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/beach-1.jpg",
      captionBn: "বিশ্বের দীর্ঘতম সমুদ্র সৈকতের অন্তহীন জলরাশি",
      captionEn: "Endless golden shore of the world's longest natural sea beach",
      tagBn: "সৈকত",
      tagEn: "Golden Sands",
    },
    {
      url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-3.jpg",
      captionBn: "সৈকতে মাছ ধরার ঐতিহ্যবাহী রঙিন সাম্পান নৌকা",
      captionEn: "Traditional fishing sampans resting along the tide",
      tagBn: "সাম্পান",
      tagEn: "Sampan Boats",
    },
    {
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-5.jpg",
      captionBn: "বঙ্গোপসাগরের বুকে লালচে সোনালী সূর্যাস্ত",
      captionEn: "Breathtaking amber sunset over the Bay of Bengal",
      tagBn: "সূর্যাস্ত",
      tagEn: "Ocean Sunset",
    },
    {
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/beach-1.jpg",
      captionBn: "ভোরের প্রথম আলোয় নিঝুম বালুকাবেলা",
      captionEn: "Quiet morning breeze kissing the wet coastline",
      tagBn: "ভোরের আলো",
      tagEn: "Dawn Breeze",
    },
    {
      url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-6.jpg",
      captionBn: "ঢেউয়ের সাদা ফেনা ও সাগরের গর্জন",
      captionEn: "Gentle rhythmic surf breaking on smooth sands",
      tagBn: "সাগরের ঢেউ",
      tagEn: "Ocean Surf",
    },
    {
      url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/nature-1.jpg",
      captionBn: "হিমছড়ি ও ইনানীর পাহাড়ি ঝাউবনের ছায়া",
      captionEn: "Casuarina groves framing the marine drive hills",
      tagBn: "ঝাউবন",
      tagEn: "Casuarina Grove",
    },
    {
      url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-2.jpg",
      captionBn: "ইনানী সৈকতের প্রবাল ও শান্ত জলরাশি",
      captionEn: "Coral rock formations along serene coastal stretches",
      tagBn: "প্রবাল সৈকত",
      tagEn: "Coral Shore",
    },
    {
      url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-1.jpg",
      captionBn: "সন্ধ্যায় সাগরের অনন্ত নীরবতা",
      captionEn: "Infinite twilight falling across the horizon",
      tagBn: "অনন্ত রূপ",
      tagEn: "Twilight Horizon",
    },
  ],

  // Sundarbans
  "sundarbans": [
    {
      url: "/images/reme-kalenga-wildlife.png",
      fallbackUrl: "/images/gallery/forest-1.jpg",
      captionBn: "সুন্দরবনের সুবিশাল ম্যানগ্রোভ বন ও শান্ত খাল",
      captionEn: "Pristine mangrove waterways winding through the Sundarbans",
      tagBn: "ম্যানগ্রোভ",
      tagEn: "Mangrove Delta",
    },
    {
      url: "/images/gallery/water-1.jpg",
      fallbackUrl: "/images/gallery/water-1.jpg",
      captionBn: "বনের গভীরে জোয়ার-ভাটার শান্ত জলপ্রবাহ",
      captionEn: "Tidal creeks mirroring the sundari and golpata trees",
      tagBn: "বনের খাল",
      tagEn: "Tidal Creek",
    },
    {
      url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/forest-1.jpg",
      captionBn: "সকালবেলায় বনের মাঝে সূর্যের আলোর ঝিলিক",
      captionEn: "Dappled morning rays piercing the wild greenery",
      tagBn: "বনের ভোর",
      tagEn: "Morning Light",
    },
    {
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-2.jpg",
      captionBn: "হরবাড়িয়া খালের নিস্তব্ধ প্রতিচ্ছবি",
      captionEn: "Quiet reflections across protected coastal canals",
      tagBn: "নিস্তব্ধতা",
      tagEn: "Stillness",
    },
    {
      url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-3.jpg",
      captionBn: "বনের বুক চিরে ভেসে চলা পরিবেশবান্ধব ট্রলার",
      captionEn: "Eco-tourism vessel gliding silently across the delta",
      tagBn: "জলপথ",
      tagEn: "Forest Cruise",
    },
    {
      url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-4.jpg",
      captionBn: "কুয়াশাচ্ছন্ন নদীপথে বন্যপ্রাণীর উপস্থিতি",
      captionEn: "Quiet shores where deer and birds awaken at dawn",
      tagBn: "বন্যপ্রাণী",
      tagEn: "Wild Dawn",
    },
    {
      url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/nature-1.jpg",
      captionBn: "কটকা সমুদ্র সৈকতের শান্ত প্রাকৃতিক পরিবেশ",
      captionEn: "Untouched coastal beaches bordering the wild forest",
      tagBn: "কটকা সৈকত",
      tagEn: "Kotka Coast",
    },
    {
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: "/images/gallery/water-5.jpg",
      captionBn: "পশুর নদীর মোহনায় শান্ত সূর্যাস্ত",
      captionEn: "Serene dusk painting the Pasur river estuary",
      tagBn: "সূর্যাস্ত",
      tagEn: "Estuary Sunset",
    },
  ],
};

// Generic thematic galleries for all other places
function getThematicGallery(place) {
  const cat = (place.category || "").toLowerCase();
  const name = (place.name || "").toLowerCase();

  const isWater = /water|river|lake|dighi|haor|stream|swamp|marsh|wetland|pond/.test(cat + name);
  const isHill = /hill|mountain|peak|ridge|valley|viewpoint/.test(cat + name);
  const isCoast = /beach|sea|coast|island|bay|ocean/.test(cat + name);
  const isForest = /forest|safari|wildlife|park|tree|sanctuary|botanical/.test(cat + name);
  const isHeritage = /historic|heritage|temple|mosque|monument|palace|ruins|archaeological|fort|deul|rajbari/.test(cat + name);
  const isTea = /tea/.test(cat + name);

  if (isCoast) {
    return [
      { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_BEACH[0], captionBn: "উপকূলের বিস্তীর্ণ বালুকাবেলা ও শান্ত ঢেউ", captionEn: "Serene shoreline and soothing waves", tagBn: "উপকূল", tagEn: "Coastline" },
      { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_BEACH[1], captionBn: "সৈকতে বাঁধা স্থানীয় কাঠের নৌকা", captionEn: "Wooden fishing boats at low tide", tagBn: "নৌকা", tagEn: "Boats" },
      { url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_BEACH[2], captionBn: "সমুদ্রের দিগন্তে অপরূপ সূর্যাস্ত", captionEn: "Glorious sunset melting into the sea", tagBn: "সূর্যাস্ত", tagEn: "Sunset" },
      { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_BEACH[3], captionBn: "ভোরের আলোয় স্নিগ্ধ নীল জলরাশি", captionEn: "Clear blue waters under morning light", tagBn: "নীল জলরাশি", tagEn: "Blue Waters" },
      { url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_BEACH[4], captionBn: "সৈকতের কুয়াশাচ্ছন্ন স্নিগ্ধ রূপ", captionEn: "Mist hovering gently over the sands", tagBn: "স্নিগ্ধ রূপ", tagEn: "Misty Shore" },
      { url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_BEACH[5], captionBn: "সৈকত ঘেঁষে থাকা সবুজ ঝাউবীথি", captionEn: "Lush green trees sheltering the beach", tagBn: "সবুজ ঝাউবন", tagEn: "Green Canopy" },
      { url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_BEACH[6], captionBn: "সৈকতে প্রকৃতির আঁকা নকশা ও শান্ত পদচিহ্ন", captionEn: "Gentle ripples on the sandy shore", tagBn: "বালুকাবেলা", tagEn: "Sands" },
      { url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_BEACH[7], captionBn: "সন্ধ্যায় সাগরের নীরব বিস্তার", captionEn: "Peaceful coastal evening settling in", tagBn: "সন্ধ্যা", tagEn: "Evening Shore" },
    ];
  }

  if (isHill) {
    return [
      { url: "/images/gallery/nature-1.jpg", fallbackUrl: LOCAL_HILLS[0], captionBn: "সবুজ পাহাড়ের ঢেউ খেলানো প্রান্তর", captionEn: "Rolling green mountain ridges", tagBn: "পাহাড়", tagEn: "Hills" },
      { url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HILLS[1], captionBn: "পাহাড় চূড়ায় সকালের সোনালী রোদ", captionEn: "Golden morning sun touching mountain crests", tagBn: "ভোরের আলো", tagEn: "Morning Sun" },
      { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HILLS[2], captionBn: "মেঘের দেশে শান্ত পাহাড়ি পথ", captionEn: "Winding paths through misty hill ranges", tagBn: "মেঘের পথ", tagEn: "Cloud Trail" },
      { url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HILLS[3], captionBn: "কুয়াশার চাদরে ঢাকা দূর পাহাড়", captionEn: "Distant summits wrapped in gentle clouds", tagBn: "কুয়াশা", tagEn: "Mist" },
      { url: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HILLS[4], captionBn: "পাহাড়ি ঝর্ণা ও পাথুরে জলপ্রপাত", captionEn: "Fresh stream rushing through green boulders", tagBn: "ঝর্ণা", tagEn: "Cascade" },
      { url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HILLS[5], captionBn: "পাহাড়ের গায়ে ঘন সবুজ অরণ্য", captionEn: "Dense rainforest clothing the high slopes", tagBn: "সবুজ অরণ্য", tagEn: "Hill Forest" },
      { url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HILLS[6], captionBn: "শান্ত বিকেলে পাহাড়ি উপত্যকার দৃশ্য", captionEn: "Peaceful valley glowing in late afternoon", tagBn: "উপত্যকা", tagEn: "Valley" },
      { url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HILLS[7], captionBn: "সূর্যাস্তে পাহাড়ের অপরূপ রূপালী রেখা", captionEn: "Dusk painting the ridgelines in purple hues", tagBn: "সূর্যাস্ত", tagEn: "Dusk" },
    ];
  }

  if (isHeritage) {
    return [
      { url: "/images/gallery/heritage-1.jpg", fallbackUrl: LOCAL_HERITAGE[0], captionBn: "ঐতিহাসিক প্রাচীন স্থাপনা ও টেরাকোটা স্থাপত্য", captionEn: "Ancient heritage architecture and terracotta craftsmanship", tagBn: "ঐতিহ্য", tagEn: "Heritage" },
      { url: "/images/gallery/heritage-2.jpg", fallbackUrl: LOCAL_HERITAGE[1], captionBn: "শতাব্দীর স্মৃতিবিজড়িত শান্ত প্রাঙ্গণ", captionEn: "Centuries-old peaceful courtyards", tagBn: "স্থাপত্য", tagEn: "Architecture" },
      { url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HERITAGE[2], captionBn: "ঐতিহাসিক সৌধকে ঘিরে ছায়াঘেরা উদ্যান", captionEn: "Shaded green grounds around the historical site", tagBn: "উদ্যান", tagEn: "Grounds" },
      { url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HERITAGE[3], captionBn: "প্রাচীন ইটের শিল্পকর্মে বিকেলের সোনালী আলো", captionEn: "Warm late light falling on ancient brickwork", tagBn: "সোনালী আলো", tagEn: "Golden Light" },
      { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HERITAGE[4], captionBn: "ঐতিহাসিক স্থানের শান্ত পরিবেশ", captionEn: "Serene ambiance preserving timeless memory", tagBn: "নিস্তব্ধতা", tagEn: "Quietude" },
      { url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HERITAGE[5], captionBn: "ভোরের আলোয় স্থাপত্যের গম্ভীর রূপ", captionEn: "Dignified silhouette standing through ages", tagBn: "গম্ভীর রূপ", tagEn: "Timeless" },
      { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HERITAGE[6], captionBn: "স্থাপনার সংলগ্ন প্রাচীন দিঘি ও ঘাট", captionEn: "Heritage pond reflecting the monument", tagBn: "দিঘি ও ঘাট", tagEn: "Pond" },
      { url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HERITAGE[7], captionBn: "সন্ধ্যায় ইতিহাসের শান্ত নীরবতা", captionEn: "Tranquil evening settling over history", tagBn: "সন্ধ্যা", tagEn: "Twilight" },
    ];
  }

  if (isTea) {
    return [
      { url: "/images/sylhet-tea-estate.png", fallbackUrl: LOCAL_HILLS[0], captionBn: "বিস্তীর্ণ সবুজ চা বাগানের ঢেউ খেলানো রূপ", captionEn: "Endless rolling green tea terraces", tagBn: "চা বাগান", tagEn: "Tea Garden" },
      { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HILLS[1], captionBn: "ভোরের শিশিরস্নাত কচি চা পাতা", captionEn: "Morning dew resting on tender tea leaves", tagBn: "শিশিরভেজা পাতা", tagEn: "Morning Dew" },
      { url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HILLS[2], captionBn: "বাগানের ছায়া দেওয়া চিরসবুজ গাছ", captionEn: "Tall shade trees sheltering the tea bushes", tagBn: "ছায়াতরু", tagEn: "Shade Trees" },
      { url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HILLS[3], captionBn: "কুয়াশার ওড়নায় মোড়ানো শান্ত বাগান", captionEn: "Gentle morning mist rolling over the estate", tagBn: "কুয়াশা", tagEn: "Mist" },
      { url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HILLS[4], captionBn: "চা বাগানের মধ্য দিয়ে চলে যাওয়া সরু পথ", captionEn: "Quiet trails meandering through tea slopes", tagBn: "মেঠোপথ", tagEn: "Trails" },
      { url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HILLS[5], captionBn: "বাগানের পাশে নির্মল পাহাড়ি জলাশয়", captionEn: "Tranquil water pools bordering the tea hills", tagBn: "জলাশয়", tagEn: "Pool" },
      { url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HILLS[6], captionBn: "বিকেলের নরম আলোয় সবুজের স্নিগ্ধতা", captionEn: "Soothing greenery under late afternoon light", tagBn: "সবুজের সমারোহ", tagEn: "Green Serenity" },
      { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80", fallbackUrl: LOCAL_HILLS[7], captionBn: "সন্ধ্যায় চা বাগানের অপূর্ব নীরবতা", captionEn: "Peaceful quietude as dusk descends", tagBn: "সন্ধ্যা", tagEn: "Dusk" },
    ];
  }

  // Default: Pristine water body, lake, dighi, river & rural nature
  return [
    {
      url: place.image || "/images/gallery/water-1.jpg",
      fallbackUrl: LOCAL_WATER[0],
      captionBn: `${place.name}-এর শান্ত ও স্নিগ্ধ প্রাকৃতিক রূপ`,
      captionEn: `Serene scenic view of ${place.name}`,
      tagBn: "প্রাকৃতিক রূপ",
      tagEn: "Scenic Landscape",
    },
    {
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: LOCAL_WATER[1],
      captionBn: "স্বচ্ছ পানিতে সবুজ গাছপালা ও আকাশের শান্ত প্রতিচ্ছবি",
      captionEn: "Tranquil reflections of greenery across glassy waters",
      tagBn: "মনোরম প্রতিচ্ছবি",
      tagEn: "Reflections",
    },
    {
      url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: LOCAL_WATER[2],
      captionBn: "ঘাট ও পাড়ে বাঁধা নিঃশব্দ দেশি নৌকা",
      captionEn: "Quiet country boat resting along the peaceful bank",
      tagBn: "দেশি নৌকা",
      tagEn: "Country Boat",
    },
    {
      url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: LOCAL_WATER[3],
      captionBn: "ভোরের মৃদু কুয়াশায় ঘেরা শান্ত পরিবেশ ও নিস্তব্ধতা",
      captionEn: "Soft morning mist draping the quiet surroundings",
      tagBn: "ভোরের কুয়াশা",
      tagEn: "Morning Mist",
    },
    {
      url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: LOCAL_WATER[4],
      captionBn: "চারপাশে ছায়াঘেরা সবুজ বৃক্ষরাজি ও মুক্ত বাতাস",
      captionEn: "Lush trees and fresh breeze embracing the spot",
      tagBn: "ছায়াঘেরা বৃক্ষ",
      tagEn: "Green Canopy",
    },
    {
      url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: LOCAL_WATER[5],
      captionBn: "গোধূলি আলোয় প্রকৃতির রূপালী ঝিলিক",
      captionEn: "Golden hour shimmer across the serene landscape",
      tagBn: "গোধূলির আলো",
      tagEn: "Golden Hour",
    },
    {
      url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: LOCAL_WATER[6],
      captionBn: "সবুজ পল্লিপ্রকৃতির মাঝে নিভৃত শান্তির অনুভূতি",
      captionEn: "Unbroken quietude nestled in natural harmony",
      tagBn: "প্রকৃতির নিস্তব্ধতা",
      tagEn: "Silent Beauty",
    },
    {
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
      fallbackUrl: LOCAL_WATER[7],
      captionBn: "সন্ধ্যা নামার মুখে শান্ত রূপালী দিগন্ত",
      captionEn: "Dusk gently settling over the serene horizon",
      tagBn: "সন্ধ্যার নিস্তব্ধতা",
      tagEn: "Twilight Serenity",
    },
  ];
}

const THEMATIC_GALLERY_CACHE = new Map();

/**
 * Returns 6 to 9 curated scenic photos for any place object.
 */
export function getPlaceGallery(place) {
  if (!place) return [];

  const slug = place.slug || place.id;

  // 1. Check custom galleries from shared store
  if (slug && CUSTOM_MEDIA_STORE?.galleries?.[slug] && Array.isArray(CUSTOM_MEDIA_STORE.galleries[slug]) && CUSTOM_MEDIA_STORE.galleries[slug].length >= 6) {
    return CUSTOM_MEDIA_STORE.galleries[slug].slice(0, 9);
  }

  // 2. Check custom galleries saved by Admin in localStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("tourismubd_custom_galleries");
      if (raw) {
        const custom = JSON.parse(raw);
        if (slug && Array.isArray(custom?.[slug]) && custom[slug].length >= 6) {
          if (CUSTOM_MEDIA_STORE?.galleries) CUSTOM_MEDIA_STORE.galleries[slug] = custom[slug];
          return custom[slug].slice(0, 9);
        }
      }
    }
  } catch { /* Ignore storage access errors */ }

  // 3. If place has explicit custom gallery array
  if (Array.isArray(place.gallery) && place.gallery.length >= 6) {
    return place.gallery.slice(0, 9);
  }

  if (slug && SPECIFIC_GALLERIES[slug]) {
    return SPECIFIC_GALLERIES[slug];
  }

  if (slug && THEMATIC_GALLERY_CACHE.has(slug)) {
    return THEMATIC_GALLERY_CACHE.get(slug);
  }

  const generated = getThematicGallery(place);
  if (slug) {
    THEMATIC_GALLERY_CACHE.set(slug, generated);
  }
  return generated;
}

/**
 * Saves or updates custom scenic gallery photos for a place.
 */
export function saveCustomPlaceGallery(placeSlug, newGallery) {
  if (!placeSlug || !Array.isArray(newGallery)) return;
  THEMATIC_GALLERY_CACHE.delete(placeSlug);
  if (CUSTOM_MEDIA_STORE?.galleries) {
    CUSTOM_MEDIA_STORE.galleries[placeSlug] = newGallery;
  }
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("tourismubd_custom_galleries");
      const custom = raw ? JSON.parse(raw) : {};
      custom[placeSlug] = newGallery;
      window.localStorage.setItem("tourismubd_custom_galleries", JSON.stringify(custom));
    }
  } catch (err) {
    console.error("Failed to save custom gallery:", err);
  }
  broadcastAndPersistMedia("galleries", placeSlug, newGallery);
}

