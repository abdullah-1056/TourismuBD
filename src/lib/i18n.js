/**
 * TourismuBD Internationalization (i18n) Engine
 * Supports English ('en') and Bengali ('bn') across the entire platform.
 */

import { PLACES_BN as ALL_PLACES_BN } from "../data/places-bn.js";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", short: "EN", native: "English" },
  { code: "bn", label: "Bangla", short: "বাং", native: "বাংলা" },
];

export const DEFAULT_LANGUAGE = "en";
export const LANGUAGE_STORAGE_KEY = "tourismubd.lang";

export const DIVISIONS_BN = {
  All: "সকল",
  Barishal: "বরিশাল",
  Chattogram: "চট্টগ্রাম",
  Dhaka: "ঢাকা",
  Khulna: "খুলনা",
  Mymensingh: "ময়মনসিংহ",
  Rajshahi: "রাজশাহী",
  Rangpur: "রংপুর",
  Sylhet: "সিলেট",
};

export const DISTRICTS_BN = {
  barguna: "বরগুনা",
  barishal: "বরিশাল",
  bhola: "ভোলা",
  jhalokati: "ঝালকাঠি",
  jhalokathi: "ঝালকাঠি",
  patuakhali: "পটুয়াখালী",
  pirojpur: "পিরোজপুর",
  bandarban: "বান্দরবান",
  brahmanbaria: "ব্রাহ্মণবাড়িয়া",
  chandpur: "চাঁদপুর",
  chattogram: "চট্টগ্রাম",
  chittagong: "চট্টগ্রাম",
  cumilla: "কুমিল্লা",
  comilla: "কুমিল্লা",
  "coxs-bazar": "কক্সবাজার",
  "cox-s-bazar": "কক্সবাজার",
  "cox's-bazar": "কক্সবাজার",
  coxsbazar: "কক্সবাজার",
  feni: "ফেনী",
  khagrachhari: "খাগড়াছড়ি",
  lakshmipur: "লক্ষ্মীপুর",
  noakhali: "নোয়াখালী",
  rangamati: "রাঙ্গামাটি",
  dhaka: "ঢাকা",
  faridpur: "ফরিদপুর",
  gazipur: "গাজীপুর",
  gopalganj: "গোপালগঞ্জ",
  kishoreganj: "কিশোরগঞ্জ",
  madaripur: "মাদারীপুর",
  manikganj: "মানিকগঞ্জ",
  munshiganj: "মুন্সীগঞ্জ",
  narayanganj: "নারায়ণগঞ্জ",
  narsingdi: "নরসিংদী",
  rajbari: "রাজবাড়ী",
  shariatpur: "শরীয়তপুর",
  tangail: "টাঙ্গাইল",
  bagerhat: "বাগেরহাট",
  chuadanga: "চুয়াডাঙ্গা",
  jashore: "যশোর",
  jhenaidah: "ঝিনাইদহ",
  khulna: "খুলনা",
  kushtia: "কুষ্টিয়া",
  magura: "মাগুরা",
  meherpur: "মেহেরপুর",
  narail: "নড়াইল",
  satkhira: "সাতক্ষীরা",
  jamalpur: "জামালপুর",
  mymensingh: "ময়মনসিংহ",
  netrokona: "নেত্রকোনা",
  sherpur: "শেরপুর",
  bogura: "বগুড়া",
  chapainawabganj: "চাঁপাইনবাবগঞ্জ",
  joypurhat: "জয়পুরহাট",
  naogaon: "নওগাঁ",
  natore: "নাটোর",
  pabna: "পাবনা",
  rajshahi: "রাজশাহী",
  sirajganj: "সিরাজগঞ্জ",
  dinajpur: "দিনাজপুর",
  gaibandha: "গাইবান্ধা",
  kurigram: "কুড়িগ্রাম",
  lalmonirhat: "লালমনিরহাট",
  nilphamari: "নীলফামারী",
  panchagarh: "পঞ্চগড়",
  rangpur: "রংপুর",
  thakurgaon: "ঠাকুরগাঁও",
  habiganj: "হবিগঞ্জ",
  moulvibazar: "মৌলভীবাজার",
  sunamganj: "সুনামগঞ্জ",
  sylhet: "সিলেট",
};

export const CATEGORIES_BN = {
  All: "সকল",
  "Archaeological site": "প্রত্নতাত্ত্বিক স্থান",
  "Architecture and civic landmark": "স্থাপত্য ও নাগরিক নিদর্শন",
  "Architecture and historic site": "স্থাপত্য ও ঐতিহাসিক স্থান",
  "Border landscape": "সীমান্ত ও প্রাকৃতিক দৃশ্য",
  "Coast and nature": "উপকূল ও প্রকৃতি",
  "Countryside": "গ্রাম ও গ্রামীণ প্রকৃতি",
  "Cultural heritage": "সাংস্কৃতিক ঐতিহ্য",
  "Eco park": "ইকোপার্ক",
  "Forest": "বন ও অরণ্য",
  "Forest waterway": "জলাবন ও নৌপথ",
  "Garden": "বাগান ও উদ্যান",
  "Garden and landscape": "বাগান ও মনোরম দৃশ্য",
  "Hills and landscape": "পাহাড় ও মনোরম দৃশ্য",
  "Historic and cultural site": "ঐতিহাসিক ও সাংস্কৃতিক স্থান",
  "Historic site": "ঐতিহাসিক স্থান",
  "Lake": "লেক ও হ্রদ",
  "Lakeside and border landscape": "হ্রদ ও সীমান্ত দৃশ্য",
  "Landscape and river": "নদী ও মনোরম দৃশ্য",
  "Landscape and seasonal garden": "মনোরম দৃশ্য ও মৌসুমি বাগান",
  "Major Distributary": "প্রধান শাখা নদী",
  "Major River": "প্রধান নদী",
  "Memorial and historic site": "স্মৃতিসৌধ ও ঐতিহাসিক স্থান",
  "Mountain and trekking": "পাহাড় ও ট্রেকিং",
  "Museum and cultural heritage": "জাদুঘর ও সাংস্কৃতিক ঐতিহ্য",
  "Museum and historic site": "জাদুঘর ও ঐতিহাসিক স্থান",
  "National park": "জাতীয় উদ্যান",
  "Nature and landscape": "প্রকৃতি ও মনোরম দৃশ্য",
  "Park": "পার্ক",
  "Park and historic site": "পার্ক ও ঐতিহাসিক স্থান",
  "Park and landscape": "পার্ক ও মনোরম দৃশ্য",
  "Park and nature": "পার্ক ও প্রকৃতি",
  "Picnic spot": "পিকনিক স্পট",
  "Religious and historic site": "ধর্মীয় ও ঐতিহাসিক স্থান",
  "Religious and riverfront site": "ধর্মীয় ও নদী তীরবর্তী স্থান",
  "River": "নদী",
  "River and hills": "নদী ও পাহাড়",
  "Riverfront": "নদীর তীর",
  "Riverfront and transport landmark": "নদীর ঘাট ও পরিবহন নিদর্শন",
  "Riverfront and waterway": "নদী ও নৌপথ",
  "Safari park": "সাফারি পার্ক",
  "Scenic road": "মনোরম সড়ক ও দৃশ্য",
  "Stone bed and stream": "পাথুরে নদী ও পাহাড়ি ঝিরি",
  "Tea landscape": "চা বাগান ও উপত্যকা",
  "Technology and civic landmark": "প্রযুক্তি ও নাগরিক নিদর্শন",
  "Tourist place": "দর্শনীয় স্থান",
  "Town and cultural area": "শহর ও সাংস্কৃতিক এলাকা",
  "University campus": "বিশ্ববিদ্যালয় ক্যাম্পাস",
  "Viewpoint": "ভিউ পয়েন্ট ও পর্যবেক্ষণ স্থান",
  "Village and waterfall viewpoint": "গ্রাম ও জলপ্রপাত ভিউপয়েন্ট",
  "Waterfall": "ঝর্ণা ও জলপ্রপাত",
  "Waterfall and stream": "ঝর্ণা ও পাহাড়ি ঝিরি",
  "Wetland": "হাওর ও জলাভূমি",
  "Wildlife sanctuary": "বন্যপ্রাণী অভয়ারণ্য",
};

export const PLACES_BN = {
  ...ALL_PLACES_BN,
  "Patenga Sea Beach": "পতেঙ্গা সমুদ্র সৈকত",
  "Foy's Lake": "ফয়েজ লেক",
  "Guliakhali Sea Beach": "গুলিয়াখালী সমুদ্র সৈকত",
  "Banshbaria Sea Beach": "বাঁশবাড়িয়া সমুদ্র সৈকত",
  "Kattali Beach": "কাট্টলী সমুদ্র সৈকত",
  "Khoiyachora Waterfall": "খৈয়াছড়া ঝর্ণা",
  "Sahasradhara Waterfall": "সহস্রধারা ঝর্ণা",
  "Batali Hill": "বাটালী পাহাড়",
  "DC Hill": "ডিসি হিল",
  "Napittachora Trail": "নাপিত্তাছড়া ট্রেইল",
  "Sitakunda Eco Park": "সীতাকুণ্ড ইকোপার্ক",
  "Chandranath Temple": "চন্দ্রনাথ মন্দির",
  "Chattogram War Cemetery": "চট্টগ্রাম ওয়ার সিমেট্রি",
  "Ethnological Museum": "নৃবিজ্ঞান জাদুঘর",
  "CRB": "সিআরবি (সেন্ট্রাল রেলওয়ে বিল্ডিং)",
  "Cox's Bazar Beach": "কক্সবাজার সমুদ্র সৈকত",
  "Inani Beach": "ইনানী সমুদ্র সৈকত",
  "Himchari": "হিমছড়ি",
  "Saint Martin's Island": "সেন্ট মার্টিন দ্বীপ",
  "Chhera Dwip": "ছেঁড়া দ্বীপ",
  "Sajek Valley": "সাজেক ভ্যালি",
  "Nilgiri": "নীলগিরি",
  "Nafakhum Waterfall": "নাফাখুম জলপ্রপাত",
  "Amiakhum Waterfall": "আমিয়াখুম জলপ্রপাত",
  "Boga Lake": "বগা লেক",
  "Keokradong": "কেওক্রাডং",
  "Tazing Dong": "তাজিংডং",
  "Ratargul Swamp Forest": "রাতারগুল সোয়াম্প ফরেস্ট",
  "Jaflong": "জাফলং",
  "Bisnakandi": "বিছনাকান্দি",
  "Bichanakandi": "বিছানাকান্দি",
  "Bholaganj Sada Pathor": "ভোলাগঞ্জ সাদা পাথর",
  "Lalakhal": "লালাখাল",
  "Pantomai Waterfall": "পান্থুমাই ঝর্ণা",
  "Pangthumai": "পান্থুমাই ঝর্ণা",
  "Madhabkunda Waterfall": "মাধবকুন্ড জলপ্রপাত",
  "Madhabpur Lake": "মাধবপুর লেক",
  "Baikka Beel": "বাইক্কা বিল",
  "Hakaluki Haor": "হাকালুকি হাওর",
  "Ham Ham Waterfall": "হামহাম জলপ্রপাত",
  "Hum Hum Waterfall": "হামহাম জলপ্রপাত",
  "Lawachara National Park": "লাউয়াছড়া জাতীয় উদ্যান",
  "Tanguar Haor": "টাঙ্গুয়ার হাওর",
  "Shimul Bagan": "শিমুল বাগান",
  "Barekkot": "বারেক টিলা",
  "Barikka Tila": "বারেক টিলা",
  "Jadukata River": "যাদুকাটা নদী",
  "Sundarbans": "সুন্দরবন",
  "Kotka Beach": "কটকা সমুদ্র সৈকত",
  "Karamjal": "করমজল",
  "Hiron Point": "হিরণ পয়েন্ট",
  "Dublar Char": "দুবলার চর",
  "Kuakata Sea Beach": "কুয়াকাটা সমুদ্র সৈকত",
  "Gongamati Sea Beach": "গঙ্গামতি সৈকত",
  "Gangamati Beach": "গঙ্গামতি সৈকত",
  "Fatrar Char": "ফাতরার চর",
  "Lalbagh Fort": "লালবাগ কেল্লা",
  "Ahsan Manzil": "আহসান মঞ্জিল",
  "National Parliament House": "জাতীয় সংসদ ভবন",
  "Bangladesh National Parliament": "জাতীয় সংসদ ভবন",
  "Suhrawardy Udyan": "সোহরাওয়ার্দী উদ্যান",
  "Someshwari River": "সোমেশ্বরী নদী",
  "Birishiri": "বিরিশিরি",
  "Susang Durgapur": "সুসং দুর্গাপুর",
  "Bijoypur China Clay Hills": "বিজয়পুর চীনামাটির পাহাড়",
  "Padma River": "পদ্মা নদী",
  "Meghna River": "মেঘনা নদী",
  "Jamuna River": "যমুনা নদী",
  "Karnafuli River": "কর্ণফুলী নদী",
  "Brahmaputra River": "ব্রহ্মপুত্র নদী",
  "Surma River": "সুরমা নদী",
  "Kushiyara River": "কুশিয়ারা নদী",
  "Teesta River": "তিস্তা নদী",
  "Rupsha River": "রূপসা নদী",
};

export const TRANSLATIONS = {
  en: {
    // Navigation
    nav: {
      timeline: "Timeline",
      discover: "Discover",
      places: "Places",
      travelMap: "Travel map",
      myTrip: "My trip",
      services: "Local services",
      people: "People",
      shop: "Shop",
      account: "Account",
      signIn: "Sign in",
      signOut: "Sign out",
      toggleNav: "Toggle navigation",
    },
    // Common
    common: {
      all: "All",
      search: "Search",
      loading: "Loading...",
      back: "Back",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      close: "Close",
      confirm: "Confirm",
      language: "Language",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      share: "Share",
      more: "See more",
      less: "See less",
      error: "Error",
      success: "Success",
      verified: "Verified",
      day: "day",
      days: "days",
      traveler: "traveler",
      travelers: "travelers",
      km: "km",
      hrs: "hrs",
      mins: "mins",
    },
    // Hero Section
    hero: {
      eyebrow: "Plan less. See more.",
      titleLine1: "Bangladesh,",
      titleLine2: "in a practical order.",
      subtitle: "Find a place, add what is nearby, and get a route that cuts needless backtracking.",
      searchPlaceholder: "Try Ratargul or Jaflong",
      searchAction: "Search places",
      heroRouteStart: "SYLHET CITY",
      heroRouteMid: "RATARGUL",
      heroRouteEnd: "JAFLONG",
    },
    // Quick Actions
    quickActions: {
      findPlaceTitle: "Find a place",
      findPlaceSub: "Start with one destination",
      planTripTitle: "Plan an itinerary",
      planTripSub: "Get an efficient route",
      expertsTitle: "Local experts",
      expertsSub: "Guides, stays, and drivers",
    },
    // Home Sections
    home: {
      regionsEyebrow: "Explore by region",
      regionsTitle: "Popular starting points",
      trendingEyebrow: "Trending places",
      trendingTitle: "Featured spots across Bangladesh",
      seeAll: "See all places",
    },
    // Water Choices
    waterChoices: {
      eyebrow: "Explore by water",
      title: "Two choices, in every district.",
      houseboatTitle: "Find a Houseboat",
      houseboatDesc: "Multi-day stays, subject to provider availability.",
      smallBoatTitle: "Rent a Small Boat",
      smallBoatDesc: "Short water trips with local operators.",
    },
    // Explore Page
    explore: {
      eyebrow: "Destinations across Bangladesh",
      title: "Find your next stop",
      searchPlaceholder: "Search by place, area, or category",
      placesCount: "places",
      noMatchTitle: "No place matches that search.",
      noMatchSubtitle: "Try a place name, area, or a broader category.",
    },
    // Place Card
    placeCard: {
      inMyTrip: "In my trip",
      addToTrip: "Add to trip",
      openPlace: "View details",
    },
    // Place Detail
    placeDetail: {
      bestTimeToVisit: "Best time to visit",
      whyVisit: "Why visit",
      howToReach: "How to reach",
      practicalTips: "Practical tips & cautions",
      coordinates: "Coordinates",
      district: "District",
      division: "Division",
      area: "Area",
      planRouteFromHere: "Plan route from here",
      verifiedBy: "Verified by TourismuBD local scouts",
    },
    // Map Feature & Modal
    map: {
      floatingLabel: "MAP",
      modalTitle: "Explore Bangladesh",
      modalSubtitle: "Explore Bangladesh Water Bodies & Mountain Spots",
      searchPlaceholder: "Search water bodies, hills, districts...",
      allDivisions: "All",
      allDistricts: "All 64 Districts",
      filterWater: "🌊 Water Bodies",
      filterMountain: "⛰️ Mountain & Hills",
      filterAll: "All Natural Spots",
      badgeWater: "🌊 Water Body",
      badgeMountain: "⛰️ Mountain Spot",
      badgeGeneral: "Heritage / Scenic Spot",
      placesCount: "places",
      placesFound: "places found",
      openItinerary: "Open itinerary",
      emptyTitle: "No destinations found",
      emptySubtitle: "Try selecting another district or resetting your search filter.",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
    },
    // Travel Map Page
    travelMap: {
      backToExplore: "Back to Explore",
      title: "Interactive Bangladesh Travel Map",
      subtitle: "Accurate shortest-distance road routing across all 64 districts",
      selectDistrictPrompt: "Select a district to view routes & spots",
      planYourTrip: "Plan your trip",
      openTrip: "Open trip planner",
      trackerBadge: "Bangladesh Travel Tracker",
      trackerTitle: "Interactive Visited Districts Map",
      resetMap: "Reset Map",
      resetMapTitle: "Reset zoom to full Bangladesh map",
      sample: "Sample",
      sampleTitle: "Reset to 15 sample districts",
      clear: "Clear",
      clearTitle: "Clear all districts",
      all64: "All 64",
      all64Title: "Mark all 64 districts visited",
      saveImage: "Save Image",
      saving: "Saving...",
      saveImageTitle: "Save map as high-res PNG image",
      planTrip: "Plan Trip",
      tickDistrictsTab: "Tick Districts",
      travelMapTab: "Travel Map",
      seen: "seen",
      tickDistrictsTitle: "Tick the districts you have visited",
      searchPlaceholder: "Type a district name",
      filterLabel: "Filter districts by name",
      districtsVisited: "districts visited",
      unselectDivision: "Unselect division",
      wholeDivision: "Whole division",
      noDistrictMatching: "No district matching",
      clearSearch: "Clear search filter",
      rightHeaderTitle: "Your Bangladesh travel map: colour the districts you have visited",
      districtsSeen: "districts seen",
      ofBangladeshExplored: "of Bangladesh explored",
      uncheck: "Uncheck",
      uncheckTitle: "Uncheck all visited districts",
      resetMapButton: "Reset map",
      visited: "Visited",
      unvisited: "Unvisited",
      rivers: "Rivers (Light Blue)",
      legendTip: "💡 Tip: Click any district directly on the map to colour it!",
      majorRiver: "🌊 Major River of Bangladesh",
      clickToMark: "○ Click to mark visited",
      visitedClickUncheck: "✓ Visited (Click to uncheck)",
      divisionSuffix: "Division",
    },
    // Trip Planner
    trip: {
      eyebrow: "Route & Itinerary",
      title: "Trip planner",
      startingPoint: "Starting point",
      townCenter: "Town center",
      duration: "Duration",
      generateRoute: "Build optimized itinerary",
      clearTrip: "Clear trip",
      emptyTitle: "Your trip list is empty",
      emptySubtitle: "Browse places and click 'Add to trip' to start planning.",
      browsePlaces: "Browse places",
      openTravelMap: "View interactive travel map",
      day: "Day",
      totalDistance: "Total distance",
      dayItinerary: "Day-by-day plan",
    },
    // Services
    services: {
      eyebrow: "Local travel support",
      title: "Verified services across Bangladesh",
      guides: "Tour Guides",
      rentals: "Vehicles & Rentals",
      stays: "Hotels & Stays",
      requestBooking: "Request booking",
      contact: "Contact provider",
      emptyTitle: "No service providers found",
      emptySubtitle: "Providers for this district or category will appear here soon.",
    },
    // People & Community
    people: {
      eyebrow: "Community",
      title: "Travelers & Local Hosts",
      searchPlaceholder: "Search by name, district, or role...",
      follow: "Follow",
      following: "Following",
      message: "Message",
    },
    feed: {
      eyebrow: "Community timeline",
      title: "Traveler stories & updates",
      postPlaceholder: "Share your travel experience, photos, or ask for local tips...",
      postAction: "Post update",
      reportPost: "Report post",
      comments: "Comments",
    },
    // Shop
    shop: {
      eyebrow: "Local marketplace",
      title: "Authentic specialties across Bangladesh",
      searchPlaceholder: "Search local foods, crafts, souvenirs...",
    },
    // Account & Auth
    account: {
      menuTitle: "Account menu",
      settings: "Settings",
      about: "About",
      theme: "Theme",
      language: "Language",
      messages: "Messages",
      bookings: "Booking requests",
      rateProviders: "Rate providers",
      manageShop: "Manage shop",
      deactivate: "Deactivate account",
      signOut: "Sign out",
      signIn: "Sign in",
      signUp: "Create account",
    },
    // Footer
    footer: {
      tagline: "TourismuBD · Practical, verified travel across all 64 districts of Bangladesh.",
      rights: "All rights reserved.",
      builtFor: "Built for travelers discovering Bangladesh.",
    },
  },

  bn: {
    // Navigation
    nav: {
      timeline: "টাইমলাইন",
      discover: "আবিষ্কার",
      places: "দর্শনীয় স্থান",
      travelMap: "ভ্রমণ মানচিত্র",
      myTrip: "আমার ভ্রমণ",
      services: "স্থানীয় সেবা",
      people: "ভ্রমণকারী ও গাইড",
      shop: "বাজার",
      account: "অ্যাকাউন্ট",
      signIn: "সাইন ইন",
      signOut: "সাইন আউট",
      toggleNav: "মেনু খুলুন/বন্ধ করুন",
    },
    // Common
    common: {
      all: "সকল",
      search: "অনুসন্ধান",
      loading: "লোড হচ্ছে...",
      back: "ফিরে যান",
      save: "সংরক্ষণ",
      cancel: "বাতিল",
      delete: "মুছে ফেলুন",
      close: "বন্ধ করুন",
      confirm: "নিশ্চিত করুন",
      language: "ভাষা",
      theme: "থিম",
      light: "লাইট",
      dark: "ডার্ক",
      share: "শেয়ার",
      more: "আরও দেখুন",
      less: "সংক্ষেপ করুন",
      error: "ত্রুটি",
      success: "সফল",
      verified: "যাচাইকৃত",
      day: "দিন",
      days: "দিন",
      traveler: "ভ্রমণকারী",
      travelers: "ভ্রমণকারী",
      km: "কি.মি.",
      hrs: "ঘণ্টা",
      mins: "মিনিট",
    },
    // Hero Section
    hero: {
      eyebrow: "কম সময়ে সেরা ভ্রমণ।",
      titleLine1: "বাংলাদেশ,",
      titleLine2: "পরিকল্পিত ও সহজ পথে।",
      subtitle: "স্থান খুঁজুন, আশেপাশের জায়গা যোগ করুন এবং অযথা ঘোরাঘুরি ছাড়াই সেরা পথ পান।",
      searchPlaceholder: "রাতারগুল বা জাফলং লিখে খুঁজুন...",
      searchAction: "স্থান অনুসন্ধান",
      heroRouteStart: "সিলেট শহর",
      heroRouteMid: "রাতারগুল",
      heroRouteEnd: "জাফলং",
    },
    // Quick Actions
    quickActions: {
      findPlaceTitle: "স্থান খুঁজুন",
      findPlaceSub: "একটি গন্তব্য দিয়ে শুরু করুন",
      planTripTitle: "ভ্রমণ পরিকল্পনা",
      planTripSub: "সহজ ভ্রমণ পথ তৈরি করুন",
      expertsTitle: "স্থানীয় গাইড ও সেবা",
      expertsSub: "গাইড, হোটেল ও পরিবহন",
    },
    // Home Sections
    home: {
      regionsEyebrow: "অঞ্চল অনুযায়ী দর্শনীয় স্থান",
      regionsTitle: "জনপ্রিয় ভ্রমণ এলাকা",
      trendingEyebrow: "জনপ্রিয় স্থানসমূহ",
      trendingTitle: "বাংলাদেশের জনপ্রিয় দর্শনীয় স্থান",
      seeAll: "সব স্থান দেখুন",
    },
    // Water Choices
    waterChoices: {
      eyebrow: "জলপথে ভ্রমণ",
      title: "প্রতিটি জেলায় ভ্রমণের দুটি মাধ্যম।",
      houseboatTitle: "হাউসবোট খুঁজুন",
      houseboatDesc: "কয়েকদিনের নৌ-ভ্রমণ ও অবস্থান, প্রাপ্যতা সাপেক্ষে।",
      smallBoatTitle: "ছোট নৌকা ভাড়া নিন",
      smallBoatDesc: "স্থানীয় মাঝিদের সাথে ছোট নৌ-ভ্রমণ।",
    },
    // Explore Page
    explore: {
      eyebrow: "বাংলাদেশের দর্শনীয় স্থানসমূহ",
      title: "আপনার পরবর্তী গন্তব্য খুঁজুন",
      searchPlaceholder: "স্থান, এলাকা বা ক্যাটাগরি দিয়ে অনুসন্ধান করুন...",
      placesCount: "টি স্থান",
      noMatchTitle: "অনুসন্ধানের সাথে কোনো স্থান মিলেনি।",
      noMatchSubtitle: "স্থানের নাম, এলাকা বা অন্য ক্যাটাগরি দিয়ে চেষ্টা করুন।",
    },
    // Place Card
    placeCard: {
      inMyTrip: "ভ্রমণে যুক্ত আছে",
      addToTrip: "ভ্রমণে যোগ করুন",
      openPlace: "বিস্তারিত দেখুন",
    },
    // Place Detail
    placeDetail: {
      bestTimeToVisit: "ভ্রমণের সেরা সময়",
      whyVisit: "কেন যাবেন",
      howToReach: "যাওয়ার উপায়",
      practicalTips: "জরুরি পরামর্শ ও সতর্কতা",
      coordinates: "ভৌগোলিক স্থানাঙ্ক",
      district: "জেলা",
      division: "বিভাগ",
      area: "এলাকা",
      planRouteFromHere: "এখান থেকে ভ্রমণ পথ তৈরি করুন",
      verifiedBy: "TourismuBD স্থানীয় স্কাউটদের দ্বারা যাচাইকৃত",
    },
    // Map Feature & Modal
    map: {
      floatingLabel: "মানচিত্র",
      modalTitle: "বাংলাদেশ অন্বেষণ করুন",
      modalSubtitle: "বাংলাদেশের জলাশয় ও পাহাড়ি স্থানসমূহ অন্বেষণ করুন",
      searchPlaceholder: "জলাশয়, পাহাড় বা জেলা অনুসন্ধান করুন...",
      allDivisions: "সকল বিভাগ",
      allDistricts: "সকল ৬৪ জেলা",
      filterWater: "🌊 জলাশয় ও নদী",
      filterMountain: "⛰️ পাহাড় ও পর্বত",
      filterAll: "সকল প্রাকৃতিক স্থান",
      badgeWater: "🌊 জলাশয়",
      badgeMountain: "⛰️ পাহাড়ি স্থান",
      badgeGeneral: "ঐতিহাসিক / প্রাকৃতিক স্থান",
      placesCount: "টি স্থান",
      placesFound: "টি স্থান পাওয়া গেছে",
      openItinerary: "ভ্রমণ পরিকল্পনা খুলুন",
      emptyTitle: "কোনো দর্শনীয় স্থান পাওয়া যায়নি",
      emptySubtitle: "অন্য কোনো জেলা নির্বাচন করুন বা ফিল্টার পরিবর্তন করুন।",
      zoomIn: "জুম ইন",
      zoomOut: "জুম আউট",
    },
    // Travel Map Page
    travelMap: {
      backToExplore: "ফিরে যান",
      title: "ইন্টারেক্টিভ বাংলাদেশ ভ্রমণ মানচিত্র",
      subtitle: "৬৪ জেলার নিখুঁত ও সংক্ষিপ্ততম সড়ক ভ্রমণ পথ",
      selectDistrictPrompt: "রুট ও স্থান দেখতে একটি জেলা নির্বাচন করুন",
      planYourTrip: "ভ্রমণ পরিকল্পনা করুন",
      openTrip: "ভ্রমণ পরিকল্পনাকারী খুলুন",
      trackerBadge: "বাংলাদেশ ট্রাভেল ট্র্যাকার",
      trackerTitle: "ইন্টারেক্টিভ ভ্রমণ করা জেলার মানচিত্র",
      resetMap: "মানচিত্র রিসেট",
      resetMapTitle: "পুরো বাংলাদেশ মানচিত্রে ফিরে যান",
      sample: "নমুনা জেলা",
      sampleTitle: "১৫টি নমুনা জেলায় রিসেট করুন",
      clear: "সব মুছুন",
      clearTitle: "সব জেলা নির্বাচন বাতিল করুন",
      all64: "সব ৬৪ জেলা",
      all64Title: "সব ৬৪টি জেলা ভ্রমণ চিহ্নিত করুন",
      saveImage: "ছবি সংরক্ষণ",
      saving: "সংরক্ষণ হচ্ছে...",
      saveImageTitle: "হাই-রেজোলিউশন পিএনজি ছবি হিসেবে সংরক্ষণ করুন",
      planTrip: "ভ্রমণ পরিকল্পনা",
      tickDistrictsTab: "জেলায় টিক দিন",
      travelMapTab: "ভ্রমণ মানচিত্র",
      seen: "ভ্রমণ সম্পন্ন",
      tickDistrictsTitle: "ভ্রমণ করা জেলাগুলোতে টিক দিন",
      searchPlaceholder: "জেলার নাম লিখুন...",
      filterLabel: "নাম দিয়ে জেলা খুঁজুন",
      districtsVisited: "টি জেলা ভ্রমণ করা হয়েছে",
      unselectDivision: "বিভাগ বাতিল করুন",
      wholeDivision: "পুরো বিভাগ",
      noDistrictMatching: "কোনো জেলা মেলেনি",
      clearSearch: "অনুসন্ধান ফিল্টার মুছুন",
      rightHeaderTitle: "আপনার বাংলাদেশ ভ্রমণ মানচিত্র: ভ্রমণ করা জেলাগুলো রঙ করুন",
      districtsSeen: "টি জেলা দেখা হয়েছে",
      ofBangladeshExplored: "বাংলাদেশ ভ্রমণ সম্পন্ন",
      uncheck: "আনচেক",
      uncheckTitle: "সব নির্বাচিত জেলা আনচেক করুন",
      resetMapButton: "মানচিত্র রিসেট",
      visited: "ভ্রমণ সম্পন্ন",
      unvisited: "ভ্রমণ বাকি",
      rivers: "নদী (হালকা নীল)",
      legendTip: "💡 টিপ: মানচিত্রে যেকোনো জেলায় ক্লিক করে রঙ করুন!",
      majorRiver: "🌊 বাংলাদেশের প্রধান নদী",
      clickToMark: "○ ভ্রমণ চিহ্নিত করতে ক্লিক করুন",
      visitedClickUncheck: "✓ ভ্রমণ সম্পন্ন (আনচেক করতে ক্লিক করুন)",
      divisionSuffix: "বিভাগ",
    },
    // Trip Planner
    trip: {
      eyebrow: "রুট ও ভ্রমণ পরিকল্পনা",
      title: "ভ্রমণ পরিকল্পনাকারী",
      startingPoint: "যাত্রার শুরু",
      townCenter: "শহরের কেন্দ্র",
      duration: "ভ্রমণের সময়সীমা",
      generateRoute: "ভ্রমণ পরিকল্পনা তৈরি করুন",
      clearTrip: "তালিকা মুছুন",
      emptyTitle: "আপনার ভ্রমণ তালিকা খালি",
      emptySubtitle: "স্থান ঘুরে দেখুন এবং 'ভ্রমণে যোগ করুন' বাটনে চাপ দিয়ে পরিকল্পনা শুরু করুন।",
      browsePlaces: "স্থানসমূহ দেখুন",
      openTravelMap: "ইন্টারেক্টিভ ভ্রমণ মানচিত্র দেখুন",
      day: "দিন",
      totalDistance: "মোট দূরত্ব",
      dayItinerary: "প্রতিদিনের পরিকল্পনা",
    },
    // Services
    services: {
      eyebrow: "স্থানীয় ভ্রমণ সহায়তা",
      title: "বাংলাদেশের নির্ভরযোগ্য স্থানীয় সেবাসমূহ",
      guides: "ট্যুর গাইড",
      rentals: "গাড়ি ও বাহন ভাড়া",
      stays: "হোটেল ও রিসোর্ট",
      requestBooking: "বুকিং অনুরোধ পাঠান",
      contact: "যোগাযোগ করুন",
      emptyTitle: "কোনো সেবা প্রদানকারী পাওয়া যায়নি",
      emptySubtitle: "এই জেলা বা ক্যাটাগরির জন্য শীঘ্রই সেবা প্রদানকারী যুক্ত হবে।",
    },
    // People & Community
    people: {
      eyebrow: "ভ্রমণকারী কমিউনিটি",
      title: "ভ্রমণকারী ও স্থানীয় ব্যক্তিবর্গ",
      searchPlaceholder: "নাম, জেলা বা ভূমিকা দিয়ে খুঁজুন...",
      follow: "অনুসরণ করুন",
      following: "অনুসরণ করছেন",
      message: "বার্তা পাঠান",
    },
    feed: {
      eyebrow: "কমিউনিটি টাইমলাইন",
      title: "ভ্রমণকারীদের গল্প ও অভিজ্ঞতা",
      postPlaceholder: "আপনার ভ্রমণের গল্প বা অভিজ্ঞতা শেয়ার করুন...",
      postAction: "পোস্ট করুন",
      reportPost: "অভিযোগ জানান",
      comments: "মন্তব্য",
    },
    // Shop
    shop: {
      eyebrow: "স্থানীয় বাজার",
      title: "বাংলাদেশের ঐতিহ্যবাহী খাঁটি পণ্যসমগ্র",
      searchPlaceholder: "পণ্য, খাবার বা হস্তশিল্প খুঁজুন...",
    },
    // Account & Auth
    account: {
      menuTitle: "অ্যাকাউন্ট মেনু",
      settings: "সেটিংস",
      about: "পরিচিতি",
      theme: "থিম",
      language: "ভাষা",
      messages: "বার্তা",
      bookings: "বুকিং অনুরোধ",
      rateProviders: "রেটিং দিন",
      manageShop: "দোকান পরিচালনা",
      deactivate: "অ্যাকাউন্ট নিষ্ক্রিয় করুন",
      signOut: "সাইন আউট",
      signIn: "সাইন ইন",
      signUp: "অ্যাকাউন্ট তৈরি করুন",
    },
    // Footer
    footer: {
      tagline: "TourismuBD · বাংলাদেশের ৬৪ জেলায় বাস্তবসম্মত ও নির্ভরযোগ্য ভ্রমণ সহায়িকা।",
      rights: "সর্বস্বত্ব সংরক্ষিত।",
      builtFor: "বাংলাদেশ আবিষ্কারের উদ্দেশ্যে ভ্রমণকারীদের জন্য নির্মিত।",
    },
  },
};

/**
 * Format numbers into Bengali script digits when in Bangla language mode
 */
export function toBengaliNumber(num) {
  if (num === null || num === undefined) return "";
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (digit) => bnDigits[Number(digit)]);
}

/**
 * Universal translation getter by dot-separated path (e.g. 'nav.places')
 */
export function t(key, lang = DEFAULT_LANGUAGE, params = {}) {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const parts = key.split(".");
  let result = dictionary;
  for (const part of parts) {
    if (result && typeof result === "object" && part in result) {
      result = result[part];
    } else {
      // Fallback to English
      let fallback = TRANSLATIONS.en;
      for (const fallbackPart of parts) {
        if (fallback && typeof fallback === "object" && fallbackPart in fallback) {
          fallback = fallback[fallbackPart];
        } else {
          fallback = key;
          break;
        }
      }
      result = fallback;
      break;
    }
  }

  if (typeof result === "string" && params) {
    return result.replace(/\{(\w+)\}/g, (_, match) => params[match] ?? `{${match}}`);
  }
  return result || key;
}

/**
 * Translate Area names
 */
export const AREAS_BN = {
  "Agargaon": "আগারগাঁও",
  "Airport Road, Sylhet city": "বিমানবন্দর সড়ক, সিলেট শহর",
  "Armanitola, Old Dhaka": "আরমানিটোলা, পুরান ঢাকা",
  "Austagram": "অষ্টগ্রাম",
  "Bagerhat": "বাগেরহাট",
  "Bakshiganj": "বকশীগঞ্জ",
  "Baliakandi": "বালিয়াকান্দি",
  "Bandarban": "বান্দরবান",
  "Baniachang": "বানিয়াচং",
  "Barguna": "বরগুনা",
  "Barishal": "বরিশাল",
  "Barlekha": "বড়লেখা",
  "Belabo": "বেলাবো",
  "Bhola": "ভোলা",
  "Bikrampur": "বিক্রমপুর",
  "Bogura": "বগুড়া",
  "Brahmanbaria": "ব্রাহ্মণবাড়িয়া",
  "Chandpur": "চাঁদপুর",
  "Chapainawabganj": "চাঁপাইনবাবগঞ্জ",
  "Chattogram": "চট্টগ্রাম",
  "Chuadanga": "চুয়াডাঙ্গা",
  "Chunarughat": "চুনারুঘাট",
  "Cox's Bazar": "কক্সবাজার",
  "Cumilla": "কুমিল্লা",
  "Dargah Mahalla, Sylhet city": "দরগাহ মহল্লা, সিলেট শহর",
  "Delduar": "দেলদুয়ার",
  "Dhaka": "ঢাকা",
  "Dhaka University": "ঢাকা বিশ্ববিদ্যালয়",
  "Dhaka University area": "ঢাকা বিশ্ববিদ্যালয় এলাকা",
  "Dhanbari": "ধনবাড়ী",
  "Dinajpur": "দিনাজপুর",
  "Durgapur": "দুর্গাপুর",
  "Faridpur": "ফরিদপুর",
  "Faridpur town": "ফরিদপুর শহর",
  "Feni": "ফেনী",
  "Gaibandha": "গাইবান্ধা",
  "Gazipur": "গাজীপুর",
  "Gerda, Faridpur": "গেরদা, ফরিদপুর",
  "Goalanda": "গোয়ালন্দ",
  "Gopalganj": "গোপালগঞ্জ",
  "Gowainghat": "গোয়াইনঘাট",
  "Habiganj": "হবিগঞ্জ",
  "Jaintiapur": "জৈন্তাপুর",
  "Jamalpur": "জামালপুর",
  "Jashore": "যশোর",
  "Jhalokathi": "ঝালকাঠি",
  "Jhenaidah": "ঝিনাইদহ",
  "Jhenaigati": "ঝিনাইগাতী",
  "Joydebpur": "জয়দেবপুর",
  "Joypurhat": "জয়পুরহাট",
  "Kaliakair": "কালিয়াকৈর",
  "Kaliganj": "কালীগঞ্জ",
  "Kamalganj": "কমলগঞ্জ",
  "Kanaipur, Faridpur": "কানাইপুর, ফরিদপুর",
  "Karimganj": "করিমগঞ্জ",
  "Kashiani": "কাশিয়ানী",
  "Khadimnagar": "খাদিম নগর",
  "Khagrachhari": "খাগড়াছড়ি",
  "Khulna": "খুলনা",
  "Kishoreganj": "কিশোরগঞ্জ",
  "Kumartuli, Old Dhaka": "কুমারটুলী, পুরান ঢাকা",
  "Kuakata": "কুয়াকাটা",
  "Kurigram": "কুড়িগ্রাম",
  "Kushtia": "কুষ্টিয়া",
  "Lakshmipur": "লক্ষ্মীপুর",
  "Lalmonirhat": "লালমনিরহাট",
  "Louhajang": "লৌহজং",
  "Madaripur": "মাদারীপুর",
  "Madhabpur": "মাধবপুর",
  "Madhupur": "মধুপুর",
  "Magura": "মাগুরা",
  "Manikganj": "মানিকগঞ্জ",
  "Mathurapur, Faridpur": "মথুরাপুর, ফরিদপুর",
  "Mawa": "মাওয়া",
  "Meherpur": "মেহেরপুর",
  "Mirzapur": "মির্জাপুর",
  "Mithamain": "মিঠামইন",
  "Mohammadpur": "মোহাম্মদপুর",
  "Moulvibazar": "মৌলভীবাজার",
  "Muktagacha": "মুক্তাগাছা",
  "Munshiganj": "মুন্সীগঞ্জ",
  "Mymensingh city": "ময়মনসিংহ শহর",
  "Nagarpur": "নাগরপুর",
  "Nalitabari": "নালিতাবাড়ী",
  "Naogaon": "নওগাঁ",
  "Narail": "নড়াইল",
  "Narayanganj": "নারায়ণগঞ্জ",
  "Naria": "নড়িয়া",
  "Narsingdi": "নরসিংদী",
  "Natore": "নাটোর",
  "Netrokona": "নেত্রকোণা",
  "Nikli": "নিকলী",
  "Nilphamari": "নীলফামারী",
  "Noakhali": "নোয়াখালী",
  "Old Dhaka": "পুরান ঢাকা",
  "Pabna": "পাবনা",
  "Pakundia": "পাকুন্দিয়া",
  "Panchagarh": "পঞ্চগড়",
  "Patuakhali": "পটুয়াখালী",
  "Pirojpur": "পিরোজপুর",
  "Pirujali": "পিরুজালী",
  "Raipura": "রায়পুরা",
  "Rajbari": "রাজবাড়ী",
  "Rajshahi": "রাজশাহী",
  "Ramna": "রমনা",
  "Rangamati": "রাঙ্গামাটি",
  "Rangpur": "রংপুর",
  "Rupganj": "রূপগঞ্জ",
  "Satkhira": "সাতক্ষীরা",
  "Satoir, Faridpur": "সাতৈর, ফরিদপুর",
  "Saturia": "সাটুরিয়া",
  "Savar": "সাভার",
  "Shah Paran": "শাহ পরান",
  "Shahbag": "শাহবাগ",
  "Shariatpur": "শরীয়তপুর",
  "Sher-e-Bangla Nagar": "শেরেবাংলা নগর",
  "Sherpur": "শেরপুর",
  "Shibalaya": "শিবালয়",
  "Sirajganj": "সিরাজগঞ্জ",
  "Sonargaon": "সোনারগাঁও",
  "Sreemangal": "শ্রীমঙ্গল",
  "Sreepur": "শ্রীপুর",
  "Sunamganj": "সুনামগঞ্জ",
  "Sunamganj town": "সুনামগঞ্জ শহর",
  "Sylhet": "সিলেট",
  "Tahirpur": "তাহিরপুর",
  "Tangail": "টাঙ্গাইল",
  "Thakurgaon": "ঠাকুরগাঁও",
  "Tongibari": "টঙ্গিবাড়ী",
  "Tungipara": "টুঙ্গিপাড়া",
  "West Jaflong, Gowainghat": "পশ্চিম জাফলং, গোয়াইনঘাট"
};

/**
 * Translate District name
 */
export function translateDistrict(district, lang = DEFAULT_LANGUAGE) {
  if (!district) return "";
  if (lang !== "bn") return district;
  const clean = String(district).trim();
  const normalized = clean.toLowerCase().replace(/[']/g, "").replace(/[\s_]+/g, "-");
  const hyphenated = clean.toLowerCase().replace(/['\s_]+/g, "-");
  return DISTRICTS_BN[normalized] || DISTRICTS_BN[hyphenated] || DISTRICTS_BN[clean] || clean;
}

/**
 * Translate Area / Upazila name
 */
export function translateArea(area, lang = DEFAULT_LANGUAGE) {
  if (!area) return "";
  if (lang !== "bn") return area;
  const clean = String(area).trim();
  return AREAS_BN[clean] || translateDistrict(clean, "bn") || clean;
}

/**
 * Translate Division name
 */
export function translateDivision(division, lang = DEFAULT_LANGUAGE) {
  if (!division) return "";
  if (lang !== "bn") return division;
  return DIVISIONS_BN[division] || division;
}

/**
 * Translate Category
 */
export function translateCategory(category, lang = DEFAULT_LANGUAGE) {
  if (!category) return "";
  if (lang !== "bn") return category;
  return CATEGORIES_BN[category] || category;
}

/**
 * Translate Place Name if known, otherwise returns original name
 */
export function translatePlaceName(placeOrName, lang = DEFAULT_LANGUAGE) {
  const name = typeof placeOrName === "object" && placeOrName ? placeOrName.name : placeOrName;
  if (!name) return "";
  if (lang !== "bn") return name;
  return PLACES_BN[name] || (typeof placeOrName === "object" && (PLACES_BN[placeOrName.slug] || PLACES_BN[placeOrName.id])) || name;
}

/**
 * Format count with number in current language
 */
export function formatCount(count, lang = DEFAULT_LANGUAGE, enSuffix = "", bnSuffix = "") {
  const formattedNum = lang === "bn" ? toBengaliNumber(count) : count;
  if (lang === "bn") {
    return `${formattedNum} ${bnSuffix}`.trim();
  }
  return `${formattedNum} ${enSuffix}`.trim();
}

/**
 * Translate Place Short Description
 */
export function translatePlaceDescription(place, lang = DEFAULT_LANGUAGE) {
  if (!place) return "";
  const desc = typeof place === "string" ? place : (place.shortDescription || place.description || "");
  if (lang !== "bn") return desc;

  // 1. Template: `${name} is a listed visitor destination in ${district}.`
  const matchWithPlace = desc.match(/^(.+?)\s+is a listed visitor destination in\s+([^.]+)\.?$/i);
  if (matchWithPlace) {
    const placeNameBn = translatePlaceName(typeof place === "object" ? place : matchWithPlace[1].trim(), "bn");
    const districtBn = translateDistrict(matchWithPlace[2].trim(), "bn");
    return `${placeNameBn} ${districtBn} জেলার একটি অন্যতম জনপ্রিয় দর্শনীয় স্থান।`;
  }

  // 2. Template: `A listed visitor destination in ${district}.`
  const matchListed = desc.match(/^A listed visitor destination in\s+([^.]+)\.?$/i);
  if (matchListed) {
    const districtBn = translateDistrict(matchListed[1].trim(), "bn");
    const placeNameBn = typeof place === "object" ? translatePlaceName(place, "bn") : "";
    return placeNameBn ? `${placeNameBn} ${districtBn} জেলার একটি অন্যতম দর্শনীয় স্থান।` : `${districtBn} জেলার একটি অন্যতম দর্শনীয় স্থান।`;
  }

  // 3. Custom curated phrases
  if (desc.includes("freshwater swamp forest")) {
    return "পানি বাড়লে ছোট স্থানীয় নৌকায় ঘুরে দেখার মতো একটি অপরূপ মিঠাপানির জলাবন।";
  }
  if (desc.includes("Piyain River")) {
    return "পিয়াইন নদী, পাথুরে নদীগর্ভ এবং খাসিয়া পাহাড়ের মনোরম দৃশ্যের জন্য পরিচিত সীমান্ত এলাকা।";
  }
  if (desc.includes("Sari River")) {
    return "শারি নদী করিডোরের একটি নদী গন্তব্য, যা স্বচ্ছ নীল জল, নৌকা ভ্রমণ এবং পাহাড়ি দৃশ্যের জন্য সমাদৃত।";
  }
  if (desc.includes("borderland stone bed")) {
    return "মেঘালয় পাহাড়ের পাদদেশে স্বচ্ছ জল ও পাথুরে নদীগর্ভের একটি জনপ্রিয় সীমান্ত পর্যটন কেন্দ্র।";
  }
  if (desc.includes("waterfall descending from Meghalaya")) {
    return "একটি সীমান্তবর্তী গ্রাম যেখান থেকে মেঘালয় থেকে নেমে আসা অপরূপ জলপ্রপাতের দৃশ্য উপভোগ করা যায়।";
  }
  if (desc.includes("Khadimnagar") || desc.includes("protected evergreen forest")) {
    return "সিলেট শহরের কাছে একটি সংরক্ষিত চিরসবুজ বন, যেখানে ট্র্যাকিং ও শান্ত প্রাকৃতিক পরিবেশ রয়েছে।";
  }
  if (desc.includes("Hazrat Shah Jalal")) {
    return "সুফি সাধক হযরত শাহজালাল (রহ.)-এর মাজার কমপ্লেক্স, যা সিলেটের অন্যতম প্রধান ঐতিহ্যবাহী স্থান।";
  }
  if (desc.includes("Shah Paran")) {
    return "সিলেট শহরের পূর্ব প্রান্তে অবস্থিত সুফি সাধক হযরত শাহ পরান (রহ.)-এর পাহাড়চূড়ার ঐতিহাসিক মাজার।";
  }
  if (desc.includes("Malnichhara")) {
    return "সিলেট শহরের উপকণ্ঠে অবস্থিত উপমহাদেশের প্রাচীনতম চা বাগান, যা ঢেউ খেলানো সবুজ প্রকৃতির জন্য পরিচিত।";
  }
  if (desc.includes("Lakkatura")) {
    return "সিলেট শহরের কাছে একটি মনোরম চা বাগান, যা বিস্তৃত সবুজ ঢালু পাহাড় ও সহজ যাতায়াতের জন্য পরিচিত।";
  }
  if (desc.includes("Mathurapur Deul")) {
    return "ফরিদপুর অঞ্চলের একটি প্রাচীন ঐতিহাসিক দেউল, যা ঐতিহ্যপ্রেমীদের কাছে জনপ্রিয়।";
  }
  if (desc.includes("Satoir")) {
    return "সাতৈরে অবস্থিত একটি ঐতিহ্যবাহী প্রাচীন শাহী মসজিদ।";
  }
  if (desc.includes("Gerda")) {
    return "ফরিদপুরের গেরদায় অবস্থিত একটি প্রাচীন ঐতিহাসিক মসজিদ।";
  }
  if (desc.includes("Faridpur Riverfront")) {
    return "ফরিদপুর শহরের পাশে মনোরম নদী তীরের একটি শান্ত দর্শনীয় স্থান।";
  }
  if (desc.includes("Sheikh Rasel Shishu Park")) {
    return "ফরিদপুর শহরে অবস্থিত পরিবার ও শিশুদের জন্য মনোরম বিনোদন পার্ক।";
  }
  if (desc.includes("Kanaipur")) {
    return "কানাইপুরে অবস্থিত ঐতিহাসিক প্রাচীন জমিদার বাড়ি।";
  }
  if (desc.includes("Jasimuddin")) {
    return "পল্লীকবি জসীমউদদীনের স্মৃতিবিজড়িত ঐতিহাসিক বসতবাড়ি ও সংগ্রহশালা।";
  }

  if (typeof place === "object" && place.district) {
    const placeNameBn = translatePlaceName(place, "bn");
    const districtBn = translateDistrict(place.district, "bn");
    return `${placeNameBn} ${districtBn} জেলার একটি আকর্ষণীয় ভ্রমণ স্থান।`;
  }

  return desc;
}

export const RECOMMENDED_BN = {
  "November to March": "নভেম্বর থেকে মার্চ",
  "Monsoon and early post-monsoon": "বর্ষা ও শরৎকাল",
  "October to March": "অক্টোবর থেকে মার্চ",
  "June to September": "জুন থেকে সেপ্টেম্বর",
  "Year-round": "সারা বছর",
  "November – March": "নভেম্বর – মার্চ",
};

/**
 * Translate Recommended Time
 */
export function translateBestTimeRecommended(recommended, lang = DEFAULT_LANGUAGE) {
  if (!recommended) return "";
  if (lang !== "bn") return recommended;
  return RECOMMENDED_BN[recommended] || recommended;
}

export const HOW_TO_REACH_BN = {
  "Travel from Sylhet city toward Gowainghat, then use the local Ratargul access road and boat point.":
    "সিলেট শহর থেকে গোয়াইনঘাটগামী সড়ক ধরে রাতারগুল পৌঁছান এবং সেখান থেকে ট্রলার বা দেশি নৌকা নিন।",
  "Use the Sylhet-Jaflong road from Sylhet city by bus, reserved car, or local transport.":
    "সিলেট শহর থেকে বাস, মাইক্রোবাস বা সিএনজি যোগে সিলেট-জাফলং মহাসড়ক দিয়ে সরাসরি পৌঁছানো যায়।",
  "Travel from Sylhet city toward Sarighat on the Jaflong road, then continue to a local Lalakhal boat point.":
    "সিলেট শহর থেকে জাফলং রোডের সারিঘাট যান, সেখান থেকে লালাখাল নৌঘাট হয়ে নৌকায় পৌঁছান।",
  "Travel from Sylhet city toward Hadarpar, then continue by local boat or available road transport.":
    "সিলেট শহর থেকে হাদারপাড় বাজার যান এবং সেখান থেকে ট্রলার বা নৌকাযোগে বিছনাকান্দি পৌঁছান।",
  "Travel from Sylhet city toward Gowainghat and continue by local road transport to Panthumai village.":
    "সিলেট শহর থেকে গোয়াইনঘাট হয়ে স্থানীয় বাহনে সরাসরি পান্থুমাই মায়াবতী ঝর্ণা সংলগ্ন গ্রামে যান।",
  "Travel east from Sylhet city toward Khadimnagar by reserved or local road transport.":
    "সিলেট শহরের পূর্ব দিকে খাদিমপাড়া হয়ে স্থানীয় বাহনে খাদিম নগর জাতীয় উদ্যানে পৌঁছানো যায়।",
  "Use a rickshaw, CNG auto-rickshaw, or walk from central Sylhet to Dargah Gate.":
    "সিলেট শহরের যেকোনো স্থান থেকে রিকশা, সিএনজি বা হেঁটে সহজেই দরগাহ গেটে পৌঁছানো যায়।",
  "Travel east from Sylhet city on the Tamabil road and take local access to the shrine complex.":
    "সিলেট শহর থেকে তামাবিল রোড ধরে পূর্ব দিকে কিছুটা এগিয়ে হযরত শাহ পরান (রহ.) মাজারে পৌঁছান।",
  "Travel from central Sylhet toward Airport Road by rickshaw, CNG auto-rickshaw, or reserved car.":
    "সিলেট শহরের কেন্দ্রস্থল থেকে এয়ারপোর্ট রোড ধরে রিকশা বা সিএনজি যোগে মালনীছড়া চা বাগানে যাওয়া যায়।",
  "Follow Airport Road north from central Sylhet using local or reserved transport.":
    "সিলেট শহর থেকে বিমানবন্দর সড়ক ধরে উত্তরে এগিয়ে লাক্কাতুড়া চা বাগানে পৌঁছানো যায়।",
  "Travel from Faridpur town using local road transport and confirm the final approach locally.":
    "ফরিদপুর শহর থেকে স্থানীয় সড়ক বাহন (সিএনজি/অটোরিকশা) যোগে সহজে পৌঁছানো যায়।",
  "Travel from Faridpur town by local road transport toward Satoir.":
    "ফরিদপুর শহর থেকে সাতৈরগামী স্থানীয় বাহন যোগে ঐতিহাসিক সাতৈর শাহী মসজিদে যান।",
  "Use local transport from Faridpur town toward Gerda.":
    "ফরিদপুর শহর থেকে অটোরিকশা বা সিএনজি যোগে গেরদা গ্রামে অবস্থিত মসজিদে যান।",
  "Travel by rickshaw, CNG, or local transport from central Faridpur.":
    "ফরিদপুর শহরের কেন্দ্র থেকে রিকশা বা সিএনজি যোগে সরাসরি ফরিদপুর রিভারফ্রন্টে যাওয়া যায়।",
  "Use local transport from central Faridpur.":
    "ফরিদপুর শহরের কেন্দ্র থেকে রিকশা বা ব্যাটারিচালিত অটোরিকশায় শেখ রাসেল শিশু পার্কে যান।",
  "Travel from Faridpur town toward Kanaipur by local road transport.":
    "ফরিদপুর শহর থেকে ঢাকা-খুলনা মহাসড়ক ধরে কানাইপুর জমিদার বাড়িতে পৌঁছান।",
  "Travel from Faridpur town using local transport and confirm the exact visitor point locally.":
    "ফরিদপুর শহর থেকে অটোরিকশা বা সিএনজি যোগে অম্বিকাপুরে অবস্থিত কবি জসীমউদ্দীনের বাড়িতে যান।"
};

/**
 * Translate How To Reach
 */
export function translateHowToReach(place, lang = DEFAULT_LANGUAGE) {
  if (!place) return "";
  const text = typeof place === "string" ? place : (place.howToReach || "");
  if (lang !== "bn") return text;
  if (HOW_TO_REACH_BN[text]) return HOW_TO_REACH_BN[text];

  const match = text.match(/^Travel from\s+(.+?)\s+town using available local transport and confirm the final approach locally\.?$/i);
  if (match) {
    const districtBn = translateDistrict(match[1].trim(), "bn");
    return `${districtBn} জেলা শহর থেকে সিএনজি, বাস বা স্থানীয় বাহনযোগে যাওয়া যায়; শেষ পথের দিকনির্দেশনা স্থানীয়দের কাছ থেকে জেনে নিন।`;
  }
  if (text.includes("Sylhet") && text.includes("local transport")) {
    return "সিলেট শহর থেকে সিএনজি, অটোরিকশা বা মাইক্রোবাসে সহজেই যাতায়াত করা যায়।";
  }
  return text;
}

export const WHYS_BN = {
  "Higher water levels make the forest waterways easier to explore by boat.": "পানির উচ্চতা বেশি থাকলে নৌকায় করে বনের ভেতর ঘুরে দেখা সহজ ও উপভোগ্য হয়।",
  "Clearer weather is comfortable for riverbank walks and day trips.": "পরিষ্কার রৌদ্রোজ্জ্বল আবহাওয়া নদী তীরে হাঁটা ও ডে-ট্যুরের জন্য আরামদায়ক।",
  "Drier weather usually provides calmer day-trip conditions.": "শুষ্ক আবহাওয়ায় শান্ত ও নিরাপদ পরিবেশে ডে-ট্যুর উপভোগ করা যায়।",
  "Monsoon water brings the streams and surrounding landscape to life.": "বর্ষার পানি পাহাড়ি ছড়া ও চারপাশের প্রাকৃতিক দৃশ্যকে সতেজ ও প্রাণবন্ত করে তোলে।",
  "Monsoon rainfall gives the waterfall its strongest flow.": "বর্ষার বৃষ্টিতে জলপ্রপাত তার পূর্ণ যৌবন ও তীব্র স্রোত ফিরে পায়।",
  "Cooler, drier weather is more comfortable for walking forest trails.": "শীতল ও শুষ্ক আবহাওয়া বনের ট্রেইলে হাঁটার জন্য অত্যন্ত আরামদায়ক।",
  "The city-centre site is accessible in every season.": "শহরের কেন্দ্রস্থলে অবস্থিত হওয়ায় বছরের যেকোনো ঋতুতেই সহজে ভ্রমণ করা যায়।",
  "Road access from Sylhet city makes it a practical visit in any season.": "শহর থেকে সহজ সড়ক যোগাযোগের কারণে যেকোনো মৌসুমে ভ্রমণ করা সুবিধাজনক।",
  "Cooler, drier weather is pleasant for viewing the tea landscape.": "শীতল ও শুষ্ক আবহাওয়ায় বিস্তৃত সবুজ চা বাগানের সৌন্দর্য সবচেয়ে সুন্দরভাবে উপভোগ করা যায়।",
  "Milder weather makes roadside viewing and short visits more comfortable.": "নাতিশীতোষ্ণ আবহাওয়ায় পথ চলতে চলতে মনোরম পরিবেশ উপভোগ করা সহজ হয়।",
  "Drier weather is generally more comfortable for local travel.": "শীতকালীন শুষ্ক আবহাওয়া স্থানীয় ভ্রমণের জন্য সবচেয়ে আরামদায়ক।"
};

/**
 * Translate Best Time Why
 */
export function translateBestTimeWhy(place, lang = DEFAULT_LANGUAGE) {
  if (!place) return "";
  const text = typeof place === "string" ? place : (place.bestTime?.why || "");
  if (lang !== "bn") return text;
  return WHYS_BN[text] || text;
}

export const CAUTIONS_BN = {
  "Water depth, boat access, and conditions change with rainfall.": "বৃষ্টিপাতের উপর পানির গভীরতা ও নৌকা চলাচলের সুবিধা নির্ভর করে।",
  "Monsoon currents can be strong and river conditions can change quickly.": "বর্ষাকালে নদীর স্রোত তীব্র হতে পারে এবং নদীর পরিস্থিতি দ্রুত পরিবর্তিত হতে পারে।",
  "Water colour and boat conditions vary by season and rainfall.": "ঋতু ও বৃষ্টির উপর নির্ভর করে পানির রঙ এবং নৌকা চলাচলের অবস্থা পরিবর্তিত হয়।",
  "Rocks are slippery and currents can rise after heavy rain.": "ভারী বৃষ্টির পর পাথর পিচ্ছিল হতে পারে এবং পাহাড়ি ঢল নামতে পারে।",
  "The waterfall is across the international border; remain on the Bangladesh side.": "ঝর্ণাটি আন্তর্জাতিক সীমান্তের ওপারে অবস্থিত; সর্বাবস্থায় বাংলাদেশ সীমানার ভেতরে থাকুন।",
  "Trail conditions may be muddy during rain; follow local forest guidance.": "বৃষ্টির দিনে বনের ট্রেইল কাদাময় হতে পারে; স্থানীয় বন বিভাগের নির্দেশনা মেনে চলুন।",
  "It can be crowded during religious occasions and weekly peak periods.": "ধর্মীয় উৎসব ও ছুটির দিনগুলোতে দর্শনার্থীদের ভিড় বেশি হতে পারে।",
  "Steps and sloped paths may be difficult for some visitors.": "সিঁড়ি ও খাড়া পাহাড়ি পথ কিছু দর্শনার্থীর জন্য কষ্টসাধ্য হতে পারে।",
  "This is a working estate; visitor access can be restricted.": "এটি একটি কর্মব্যস্ত চা বাগান; নির্দিষ্ট কিছু অংশে দর্শনার্থী প্রবেশ সীমিত হতে পারে।",
  "Access beyond public roads depends on estate permission.": "প্রধান সড়কের বাইরে বাগানের অভ্যন্তরীণ অংশে প্রবেশের জন্য কর্তৃপক্ষের অনুমতির প্রয়োজন হতে পারে।",
  "Confirm access and local conditions before travel.": "যাত্রার পূর্বে স্থানীয় যোগাযোগ ব্যবস্থা ও বর্তমান পরিবেশের খোঁজ নিন।",
  "Check current access, weather, and opening information before visiting.": "ভ্রমণের আগে যাতায়াত পথ, আবহাওয়া এবং খোলার সময়সূচী জেনে নিন。"
};

/**
 * Translate Caution / Practical Tip
 */
export function translateCaution(place, lang = DEFAULT_LANGUAGE) {
  if (!place) return "";
  const text = typeof place === "string" ? place : (place.bestTime?.caution || place.practicalTip || "");
  if (lang !== "bn") return text;
  if (CAUTIONS_BN[text]) return CAUTIONS_BN[text];

  if (text.startsWith("Driving ends at the road-accessible boat departure area.")) {
    return "সড়কপথের সমাপ্তি নৌকা ঘাটে। স্থানীয় নৌকার ব্যবস্থা করুন এবং আবহাওয়া, জোয়ার-ভাটার তথ্য নিশ্চিত করুন।";
  }
  if (text.startsWith("Driving ends at the mainland boat departure area.")) {
    return "সড়কপথের সমাপ্তি মূল ভূখণ্ডের নৌকা ঘাটে। অনুমতিপ্রাপ্ত নৌ-ভ্রমণের ব্যবস্থা করুন এবং বন বিভাগের অনুমতি, জোয়ার-ভাটা ও আবহাওয়া নিশ্চিত করুন।";
  }
  if (text.includes("Confirm permission before visiting")) {
    return "ভ্রমণের পূর্বে সংশ্লিষ্ট কর্তৃপক্ষের অনুমতি নিশ্চিত করুন।";
  }
  if (text.includes("Representative visitor area, not a surveyed monument entrance")) {
    return "এটি একটি প্রতীকী দর্শনার্থী এলাকা; ভ্রমণের পূর্বে স্থানীয়দের থেকে সঠিক প্রবেশপথ ও দিকনির্দেশনা জেনে নিন।";
  }
  if (text.includes("Representative river visitor location")) {
    return "মনোরম নদী তীর এলাকা; নদী তীরে নিরাপদে চলাচলের বিষয়ে স্থানীয়দের পরামর্শ নিন।";
  }
  return text;
}

