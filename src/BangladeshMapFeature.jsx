import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Compass, MapPin, Route, Search, X } from "lucide-react";
import {
  DISTRICT_CENTER_COORDINATES,
  districts,
  places,
  placesVersion,
  suggestedPlacesForDistrict,
} from "./data/tourism.js";
import { usePublishedTourism } from "./lib/tourism-content.js";

// Accurate vector silhouette outline of Bangladesh
export const BANGLADESH_SVG_PATH =
  "M 20.2,35.1 L 21.3,35.9 L 21.7,37.2 L 23,37.7 L 24.2,38.1 L 25.5,38.9 L 27.2,39.7 L 28.4,39.9 L 29.5,40.4 L 29,41.8 L 29.4,43 L 29.5,44.3 L 28.7,45.2 L 27.5,45.3 L 27.2,46.5 L 27.3,47.7 L 27.8,48.8 L 29,49.8 L 30.3,50 L 29.7,51.1 L 29.6,52.5 L 30.1,53.6 L 31.4,53.5 L 32.6,53.7 L 31.8,54.8 L 31.3,56 L 31.5,57.2 L 32.3,58.2 L 31.8,59.3 L 32.4,60.4 L 32.1,61.6 L 32.5,62.9 L 32.7,64.2 L 33.2,65.4 L 33.8,66.7 L 33.4,67.9 L 33.9,69.3 L 33.2,70.3 L 33.2,71.7 L 33.9,72.9 L 35,74.7 L 35.2,76.4 L 37.1,76.7 L 55.4,76.4 L 69,78.8 L 69.1,80.3 L 71,82.9 L 71.7,84.4 L 72.6,85.9 L 72.5,87.1 L 73,88.8 L 74,89.7 L 75.4,90 L 76.4,89.1 L 76.6,87.6 L 75.5,86 L 75.5,84.5 L 75,83.1 L 74.5,81.8 L 74,80.4 L 73.8,79.2 L 73.7,77.8 L 74.6,76.8 L 75.5,76 L 76.7,76.8 L 77.9,77 L 78.6,78.1 L 79.8,78.3 L 79.4,77 L 79.1,75.7 L 78.9,74.5 L 78.9,73.2 L 78.9,72 L 79.2,70.8 L 78.9,69.6 L 78.8,68.4 L 78.9,67 L 78.6,65.8 L 78.4,64.6 L 78.2,63.4 L 78,62.2 L 77.8,61 L 77.7,59.8 L 77,58.8 L 76.5,57.5 L 76,56.4 L 75.9,55.2 L 75.7,54 L 76.1,52.8 L 75.9,51.6 L 75.3,50.5 L 75.1,49.3 L 74.6,48.2 L 73.7,47.4 L 72.4,47.6 L 71.2,47.8 L 70.5,48.8 L 70.7,50 L 69.8,50.8 L 69,51.7 L 68.1,52.6 L 68.4,53.8 L 68.8,55 L 68.3,56.1 L 67.2,56.6 L 66,57 L 65.4,55.9 L 64.8,54.8 L 64.4,53.6 L 63.2,53.7 L 63.4,54.9 L 62.5,53.4 L 62.2,52.1 L 61.8,50.9 L 61.2,49.8 L 60.5,48.8 L 61.1,47.6 L 61.3,46.4 L 61.4,45.2 L 62,43.9 L 63.2,43.9 L 63.2,42.6 L 64.4,42.4 L 65.7,42.7 L 66.6,41.6 L 67.8,41.8 L 67.9,40.6 L 69.1,40.9 L 69.8,41.9 L 70.3,40.8 L 70.2,39.6 L 71.1,38.6 L 72.3,38.9 L 73.3,38.2 L 73.1,37 L 74.2,36.1 L 74.5,34.9 L 74.9,33.7 L 74.2,32.7 L 75.3,32.2 L 76.6,32.8 L 77.5,31.9 L 76.6,31 L 75.5,30.2 L 74.1,29.6 L 73,29.1 L 71.9,28.5 L 70.7,28.7 L 69.5,28.6 L 68.3,28.8 L 66.8,29.1 L 65.6,28.8 L 64.4,29.2 L 63.3,28.7 L 62,28.5 L 60.5,28.4 L 59.3,28.3 L 57.9,28.7 L 56.6,28.9 L 55.4,28.6 L 54.2,28.7 L 53,28.6 L 51.8,28.8 L 50.3,28.8 L 49,28.3 L 47.8,28 L 46.6,27.8 L 45.4,27.3 L 44.1,27.2 L 43.3,26.3 L 43.6,25.1 L 43.9,23.9 L 44.1,22.7 L 43.4,21.6 L 43.5,20.1 L 44.2,18.8 L 43.2,18.1 L 42.9,16.9 L 42,16 L 40.9,15.2 L 40.5,16.4 L 40.5,17.6 L 39.7,18.5 L 38.6,18 L 37.4,18 L 36.4,17.3 L 35.5,16.5 L 34.6,15.6 L 34.1,14.5 L 34,13.2 L 32.9,12.7 L 31.6,12.9 L 32.3,13.9 L 33.4,14.5 L 32.3,15 L 31.1,14.6 L 29.8,14.3 L 28.6,14.8 L 29.6,14 L 28.8,13.1 L 28,12.1 L 26.8,12 L 25.9,11.1 L 25.3,10 L 24.7,11.1 L 24.6,12.4 L 25.9,12.2 L 26.6,13.2 L 25.4,13.8 L 24.5,14.7 L 23.7,15.6 L 22.6,16.1 L 22.5,17.3 L 21.7,18.2 L 21.2,19.3 L 21.5,20.5 L 22.8,20.8 L 24.1,21.3 L 25.1,22 L 25.9,22.9 L 26.6,23.9 L 27.7,24.4 L 28.9,24.8 L 30,24.3 L 30.7,25.3 L 31.2,26.4 L 32.3,27 L 32.1,28.3 L 30.9,28.3 L 29.7,28.6 L 28.3,28.2 L 27.1,28.4 L 25.8,28.4 L 26,29.9 L 25.4,31 L 24.7,32.1 L 23.5,32.3 L 22.7,31.4 L 22.1,32.5 L 21.4,33.7 L 20.2,35.1 Z";

const BANGLADESH_CENTER = [23.685, 90.3563];
const DIVISIONS = ["All", "Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi", "Barishal", "Rangpur", "Mymensingh"];

/**
 * Hyper-realistic, multilayer fluid water wave inside the circular floating glass orb.
 */
function WaterWaveInside({ isTrip = false }) {
  const gradientId = isTrip ? "tripWaterGrad" : "mapWaterGrad";
  const crestGradId = isTrip ? "tripCrestGrad" : "mapCrestGrad";

  return (
    <div className="bd-water-wave-wrap" aria-hidden="true">
      {/* Deep undertow wave */}
      <div className={`bd-water-wave-layer bd-wave-layer-deep ${isTrip ? "bd-trip-deep" : ""}`}>
        <svg viewBox="0 0 240 60" preserveAspectRatio="none" className="bd-water-wave-svg">
          <path
            d="M 0,22 C 35,14 75,30 120,22 C 165,14 205,30 240,22 L 240,60 L 0,60 Z"
            fill={isTrip ? "rgba(14, 116, 144, 0.45)" : "rgba(13, 78, 70, 0.45)"}
          />
        </svg>
      </div>

      {/* Mid rolling wave with volumetric depth */}
      <div className={`bd-water-wave-layer bd-wave-layer-mid ${isTrip ? "bd-trip-mid" : ""}`}>
        <svg viewBox="0 0 240 60" preserveAspectRatio="none" className="bd-water-wave-svg">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isTrip ? "#38bdf8" : "#2dd4bf"} stopOpacity="0.75" />
              <stop offset="55%" stopColor={isTrip ? "#0284c7" : "#087f70"} stopOpacity="0.85" />
              <stop offset="100%" stopColor={isTrip ? "#075985" : "#055b50"} stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <path
            d="M 0,26 C 40,16 80,36 120,26 C 160,16 200,36 240,26 L 240,60 L 0,60 Z"
            fill={`url(#${gradientId})`}
          />
        </svg>
      </div>

      {/* Surface wave with sparkling specular crest highlight */}
      <div className={`bd-water-wave-layer bd-wave-layer-front ${isTrip ? "bd-trip-front" : ""}`}>
        <svg viewBox="0 0 240 60" preserveAspectRatio="none" className="bd-water-wave-svg">
          <defs>
            <linearGradient id={crestGradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="25%" stopColor="rgba(255,255,255,0.85)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="75%" stopColor="rgba(255,255,255,0.85)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
            </linearGradient>
          </defs>
          <path
            d="M 0,31 C 45,41 75,21 120,31 C 165,41 195,21 240,31 L 240,60 L 0,60 Z"
            fill={isTrip ? "rgba(14, 165, 233, 0.42)" : "rgba(20, 184, 166, 0.45)"}
          />
          <path
            d="M 0,31 C 45,41 75,21 120,31 C 165,41 195,21 240,31"
            fill="none"
            stroke={`url(#${crestGradId})`}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * Circular, movable (draggable) floating button with green Bangladesh map.
 * Usable by anyone without login.
 */
export function BangladeshMapFloatingButton({ onOpen }) {
  const { t, lang } = useLanguage();
  const [position, setPosition] = useState(() => {
    if (typeof window !== "undefined") {
      const maxX = Math.max(16, window.innerWidth - 80);
      const maxY = Math.max(16, window.innerHeight - 150);
      return { x: maxX, y: maxY };
    }
    return { x: 20, y: 120 };
  });

  const [isMoving, setIsMoving] = useState(false);
  const [waveTrails, setWaveTrails] = useState([]);
  const lastWavePosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });
  const hasMovedRef = useRef(false);
  const movingTimerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = Math.max(16, window.innerWidth - 76);
        const maxY = Math.max(16, window.innerHeight - 76);
        return {
          x: Math.min(Math.max(16, prev.x), maxX),
          y: Math.min(Math.max(16, prev.y), maxY),
        };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const addWaveTrail = (x, y) => {
    const id = Date.now() + Math.random();
    setWaveTrails((prev) => [...prev.slice(-3), { id, x, y }]);
    setTimeout(() => {
      setWaveTrails((prev) => prev.filter((w) => w.id !== id));
    }, 1100);
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y,
    };
    lastWavePosRef.current = { x: position.x, y: position.y };
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignored if unsupported
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    if (Math.hypot(dx, dy) > 4) {
      hasMovedRef.current = true;
      setIsMoving(true);
      clearTimeout(movingTimerRef.current);
      movingTimerRef.current = setTimeout(() => {
        setIsMoving(false);
      }, 350);
    }
    const maxX = Math.max(16, window.innerWidth - 76);
    const maxY = Math.max(16, window.innerHeight - 76);
    const nextX = Math.min(Math.max(16, dragStartRef.current.initX + dx), maxX);
    const nextY = Math.min(Math.max(16, dragStartRef.current.initY + dy), maxY);
    setPosition({ x: nextX, y: nextY });

    // Spawn realistic water ripples as the button glides across the screen
    const distSinceLastWave = Math.hypot(
      nextX - lastWavePosRef.current.x,
      nextY - lastWavePosRef.current.y,
    );
    if (distSinceLastWave > 45) {
      lastWavePosRef.current = { x: nextX, y: nextY };
      addWaveTrail(nextX + 30, nextY + 30);
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setTimeout(() => setIsMoving(false), 300);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    onOpen();
  };

  return (
    <>
      {/* Cute trailing water ripples */}
      {waveTrails.map((wave) => (
        <span
          key={wave.id}
          className="bd-cute-wave-trail"
          style={{
            left: `${wave.x}px`,
            top: `${wave.y}px`,
          }}
        />
      ))}

      <button
        type="button"
        className={`bd-map-floating-btn ${isMoving ? "moving" : ""}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          isDraggingRef.current = false;
          setIsMoving(false);
        }}
        onClick={handleClick}
        title={lang === "bn" ? "বাংলাদেশের নদী, হ্রদ ও পাহাড়ি স্থান ঘুরে দেখুন (টেনে সরাতে পারেন, ক্লিক করে খুলুন)" : "Explore Bangladesh Water Bodies & Mountain Spots (Drag to move, click to open)"}
        aria-label={lang === "bn" ? "বাংলাদেশের নদী, হ্রদ ও পাহাড়ি স্থান ঘুরে দেখুন" : "Explore Bangladesh Water Bodies & Mountain Spots"}
      >
        {/* Gentle ambient water wave ring around button */}
        <span className="bd-wave-ambient-ring" aria-hidden="true" />

        {/* Continuous cute wave rings around the button while moving */}
        {isMoving ? (
          <>
            <span className="bd-wave-ring bd-wave-ring-1" />
            <span className="bd-wave-ring bd-wave-ring-2" />
            <span className="bd-wave-ring bd-wave-ring-3" />
          </>
        ) : null}

        {/* Realistic liquid water wave inside button */}
        <WaterWaveInside />

        {/* Realistic glass top reflection shine */}
        <span className="bd-glass-shine" />

        <span className="bd-map-icon-shell">
          <svg viewBox="0 0 100 100" className="bd-map-svg" aria-hidden="true">
            <path
              d={BANGLADESH_SVG_PATH}
              fill="#087f70"
              stroke="#055b50"
              strokeWidth="1.2"
            />
          </svg>
        </span>
        <span className="bd-map-floating-label">{t("map.floatingLabel")}</span>
      </button>
    </>
  );
}


import { isMountainPlace, isWaterBodyPlace } from "./lib/nature-helpers.js";
import { LanguageSwitcher, useLanguage } from "./lib/LanguageContext.jsx";
export { isMountainPlace, isWaterBodyPlace };

/**
 * Interactive Bangladesh Map modal showing 64 districts & tourist spots.
 * Usable by anyone without login.
 */
export function BangladeshMapModal({ onClose, openPlace, onOpenTrip }) {
  const { t, lang, translateDistrict, translateDivision, translateCategory, translatePlaceName, translateArea, translatePlaceDescription, toBengaliNumber, formatCount } = useLanguage();
  const tourismVersion = usePublishedTourism();
  const dialogRef = useRef(null);
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const placeMarkersMapRef = useRef(new Map());
  const handleSelectDistrictRef = useRef(null);
  const modalCardRef = useRef(null);
  const placesScrollRef = useRef(null);

  const [selectedDivision, setSelectedDivision] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [natureFilter, setNatureFilter] = useState("water"); // "water" | "mountain" | "all"
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileTab, setMobileTab] = useState("map"); // "map" or "places"

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    return () => {
      if (dialog && dialog.open) dialog.close();
    };
  }, []);

  const handleSelectDistrict = (slug) => {
    if (!slug) {
      setSelectedDistrict("");
      setNatureFilter("water");
      return;
    }
    const dist = districts.find((d) => d.slug === slug || d.id === slug);
    setSelectedDistrict(slug);
    setSearchQuery(""); // Clear search so the selected district's destinations are shown without leftover queries

    if (dist?.division) {
      setSelectedDivision(dist.division);
    }

    // Check if this district has verified water bodies; default to "water" if it does, else "all"
    const distSlug = (dist?.slug || slug).toLowerCase().trim();
    const distId = (dist?.id || "").toLowerCase().trim();
    const distName = (dist?.name || "").toLowerCase().trim();
    const hasWaterBodies = places.some((p) => {
      const pId = (p.districtId || "").toLowerCase().trim();
      const pName = (p.district || "").toLowerCase().trim();
      const inDistrict = pId === distSlug || (distId && pId === distId) || (distName && pName === distName);
      return inDistrict && isWaterBodyPlace(p);
    });

    setNatureFilter(hasWaterBodies ? "water" : "all");

    const coords = DISTRICT_CENTER_COORDINATES[slug];
    if (leafletMapRef.current && coords?.lat && coords?.lng) {
      leafletMapRef.current.flyTo([coords.lat, coords.lng], 10, { duration: 0.8 });
    }
  };
  handleSelectDistrictRef.current = handleSelectDistrict;

  // Global window listener for bulletproof inline click triggers from marker buttons
  useEffect(() => {
    window.__bdSelectDistrict = (slug, event) => {
      if (event) {
        try {
          event.preventDefault();
          event.stopPropagation();
        } catch {
          // Ignored
        }
      }
      handleSelectDistrictRef.current?.(slug);
    };
    return () => {
      delete window.__bdSelectDistrict;
    };
  }, []);

  // Filtered districts based on division and query
  const filteredDistricts = useMemo(() => {
    return districts.filter((d) => {
      const matchDivision = selectedDivision === "All" || d.division === selectedDivision;
      const matchQuery = !searchQuery.trim() || d.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDivision && matchQuery;
    });
  }, [selectedDivision, searchQuery, districts.length, tourismVersion]);

  // Base list of places with STRICT district isolation
  const districtFilteredPlaces = useMemo(() => {
    let list = [...places];

    // Priority 1: When a district is selected, ONLY destinations strictly belonging to that district can pass through
    if (selectedDistrict) {
      const targetDist = districts.find((d) => d.slug === selectedDistrict || d.id === selectedDistrict);
      const distSlug = (targetDist?.slug || selectedDistrict).toLowerCase().trim();
      const distId = (targetDist?.id || "").toLowerCase().trim();
      const distName = (targetDist?.name || "").toLowerCase().trim();

      list = list.filter((p) => {
        const pDistId = (p.districtId || "").toLowerCase().trim();
        const pDistName = (p.district || "").toLowerCase().trim();
        return (
          pDistId === distSlug ||
          (distId && pDistId === distId) ||
          (distName && pDistName === distName)
        );
      });
    } else if (selectedDivision !== "All") {
      const divDistricts = districts.filter((d) => d.division === selectedDivision);
      const districtKeys = new Set(
        divDistricts.flatMap((d) => [d.id, d.slug, d.name?.toLowerCase()].filter(Boolean))
      );
      list = list.filter((p) => {
        const pDistId = (p.districtId || "").toLowerCase().trim();
        const pDistName = (p.district || "").toLowerCase().trim();
        return districtKeys.has(pDistId) || (pDistName && districtKeys.has(pDistName));
      });
    }

    // Priority 2: Filter by search query within the selected scope
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.district?.toLowerCase().includes(q) ||
          p.area?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q),
      );
    }

    // Priority 3: Strictly filter to natural spots (Water Bodies and Mountain / Hill spots)
    const natureOnly = list.filter((p) => isWaterBodyPlace(p) || isMountainPlace(p));

    return natureOnly.sort((a, b) => {
      const scoreA = (isWaterBodyPlace(a) ? 2 : 0) + (isMountainPlace(a) ? 1 : 0);
      const scoreB = (isWaterBodyPlace(b) ? 2 : 0) + (isMountainPlace(b) ? 1 : 0);
      return scoreB - scoreA;
    });
  }, [searchQuery, selectedDistrict, selectedDivision, places, tourismVersion, placesVersion, places.length, districts.length]);

  // Reset places list scroll to top whenever district or nature filter changes
  useEffect(() => {
    if (placesScrollRef.current) {
      placesScrollRef.current.scrollTop = 0;
    }
  }, [selectedDistrict, natureFilter]);

  // Counts for the active nature filter pills
  const natureCounts = useMemo(() => {
    let water = 0;
    let mountain = 0;
    for (const p of districtFilteredPlaces) {
      if (isWaterBodyPlace(p)) water++;
      if (isMountainPlace(p)) mountain++;
    }
    return { all: districtFilteredPlaces.length, water, mountain };
  }, [districtFilteredPlaces]);

  // Apply nature filter
  const displayedPlaces = useMemo(() => {
    if (natureFilter === "water") {
      return districtFilteredPlaces.filter(isWaterBodyPlace);
    }
    if (natureFilter === "mountain") {
      return districtFilteredPlaces.filter(isMountainPlace);
    }
    return districtFilteredPlaces;
  }, [districtFilteredPlaces, natureFilter]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return undefined;
    let active = true;

    try {
      if (mapContainerRef.current._leaflet_id) {
        mapContainerRef.current._leaflet_id = null;
      }
      leafletMapRef.current?.remove();
    } catch {
      // Ignored
    }

    const map = L.map(mapContainerRef.current, {
      center: BANGLADESH_CENTER,
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      scrollWheelZoom: true,
      zoomControl: true,
      attributionControl: true,
    });
    leafletMapRef.current = map;

    const primaryTileUrl = import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
    const osmAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    L.tileLayer(primaryTileUrl, {
      maxZoom: 19,
      attribution: osmAttribution,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Delegated container click handler for instant, bulletproof district selection
    const container = map.getContainer();
    const handleContainerClick = (e) => {
      const btn = e.target.closest("[data-district]");
      if (btn) {
        const slug = btn.getAttribute("data-district");
        if (slug) {
          e.preventDefault();
          e.stopPropagation();
          handleSelectDistrict(slug);
        }
      }
    };
    container.addEventListener("click", handleContainerClick);

    // Invalidate size once modal is visible
    requestAnimationFrame(() => {
      if (active && leafletMapRef.current === map) {
        map.invalidateSize();
      }
    });
    const timer = setTimeout(() => {
      if (active && leafletMapRef.current === map) {
        map.invalidateSize();
      }
    }, 250);

    return () => {
      active = false;
      container.removeEventListener("click", handleContainerClick);
      clearTimeout(timer);
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Sync Markers when filters or selection changes
  useEffect(() => {
    const map = leafletMapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    placeMarkersMapRef.current.clear();

    // 1. If a district is selected, show tourist place pins for that district
    if (selectedDistrict) {
      const targetDist = districts.find((d) => d.slug === selectedDistrict || d.id === selectedDistrict);
      const distName = targetDist?.name?.toLowerCase();
      const distSlug = targetDist?.slug || selectedDistrict;
      const distId = targetDist?.id;

      const districtPlaces = places.filter(
        (p) =>
          (isWaterBodyPlace(p) || isMountainPlace(p)) &&
          ((p.districtId && (p.districtId === distSlug || p.districtId === distId)) ||
            (distName && p.district?.toLowerCase() === distName)),
      );

      const filteredPins = districtPlaces.filter((place) => {
        if (natureFilter === "water") return isWaterBodyPlace(place);
        if (natureFilter === "mountain") return isMountainPlace(place);
        return true;
      });

      filteredPins.forEach((place) => {
        if (!place.coordinates?.lat || !place.coordinates?.lng) return;

        const isWater = isWaterBodyPlace(place);
        const isMountain = isMountainPlace(place);
        const pinClass = isWater ? "is-water" : "is-mountain";
        const categoryLabel = translateCategory(place.category);
        const popupTag = isWater
          ? `🌊 ${categoryLabel || (lang === "bn" ? "নদী ও জলাশয়" : "Water Body")}`
          : `⛰️ ${categoryLabel || (lang === "bn" ? "পাহাড়" : "Mountain Spot")}`;
        const displayName = translatePlaceName(place);
        const displayDistrict = translateDistrict(place.district);

        const placeIcon = L.divIcon({
          className: "bd-leaflet-marker-shell bd-place-icon-shell",
          html: `<span class="bd-place-marker ${pinClass}" title="${displayName}"></span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([place.coordinates.lat, place.coordinates.lng], {
          icon: placeIcon,
          zIndexOffset: 800,
        }).addTo(layer);

        placeMarkersMapRef.current.set(place.id || place.slug, marker);

        const displayArea = translateArea ? translateArea(place.area) : place.area;
        const displayDesc = translatePlaceDescription ? translatePlaceDescription(place) : (place.shortDescription || "");
        const locationText = displayArea && displayDistrict && displayArea.trim().toLowerCase() === displayDistrict.trim().toLowerCase()
          ? displayDistrict
          : (displayArea ? `${displayArea}, ${displayDistrict}` : displayDistrict);

        const popupContent = document.createElement("div");
        popupContent.className = "bd-place-map-popup";
        popupContent.innerHTML = `
          ${place.image ? `<img src="${place.image}" alt="${displayName}" class="bd-popup-img" />` : ""}
          <div class="bd-popup-body">
            <span class="bd-popup-tag">${popupTag}</span>
            <h4 class="bd-popup-title">${displayName}</h4>
            <p class="bd-popup-area">${locationText}</p>
            <p class="bd-popup-desc">${displayDesc ? (displayDesc.slice(0, 110) + (displayDesc.length > 110 ? "..." : "")) : ""}</p>
            <button type="button" class="bd-popup-detail-btn">${lang === "bn" ? "বিস্তারিত দেখুন" : "View full details"} &rarr;</button>
          </div>
        `;

        const btn = popupContent.querySelector(".bd-popup-detail-btn");
        if (btn) {
          btn.addEventListener("click", () => {
            onClose();
            openPlace(place);
          });
        }

        marker.bindPopup(popupContent, { maxWidth: 260, minWidth: 200 });
      });
    }

    // 2. Render district markers (both in overview mode AND when a district is selected)
    // This allows the user to click any district at any time!
    const bounds = L.latLngBounds([]);
    const districtsToRender = selectedDistrict ? districts : filteredDistricts;

    districtsToRender.forEach((d) => {
      const coords = DISTRICT_CENTER_COORDINATES[d.slug];
      if (!coords?.lat || !coords?.lng) return;

      if (!selectedDistrict && selectedDivision !== "All") {
        bounds.extend([coords.lat, coords.lng]);
      }

      const isSelected = d.slug === selectedDistrict;
      const count = places.filter(
        (p) =>
          (isWaterBodyPlace(p) || isMountainPlace(p)) &&
          (p.districtId === d.slug || p.districtId === d.id),
      ).length;

      const districtName = translateDistrict(d.name);
      const districtDivision = translateDivision(d.division);
      const hoverTitle = lang === "bn"
        ? `${districtName} (${districtDivision}) - ${toBengaliNumber(count)}টি নদী ও পাহাড়ি স্থান দেখতে চাপুন`
        : `${d.name} (${d.division}) - Click to view ${count} water & mountain spots`;

      const districtIcon = L.divIcon({
        className: "bd-leaflet-marker-shell bd-district-icon-shell",
        html: `
          <button
            type="button"
            class="bd-district-marker ${isSelected ? "active" : ""}"
            data-district="${d.slug}"
            onpointerdown="event.stopPropagation();"
            onmousedown="event.stopPropagation();"
            onclick="window.__bdSelectDistrict && window.__bdSelectDistrict('${d.slug}', event);"
            title="${hoverTitle}"
          >
            <b>${districtName}</b>
            ${isSelected ? `<span class="bd-district-marker-count">(${toBengaliNumber(count)})</span>` : ""}
          </button>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([coords.lat, coords.lng], {
        icon: districtIcon,
        zIndexOffset: isSelected ? 1200 : 200,
      }).addTo(layer);

      marker.on("click", (e) => {
        if (e && e.originalEvent) {
          e.originalEvent.stopPropagation();
        }
        handleSelectDistrict(d.slug);
      });
    });

    if (!selectedDistrict && filteredDistricts.length > 0 && selectedDivision !== "All" && bounds.isValid()) {
      map.flyToBounds(bounds, { padding: [30, 30], maxZoom: 9, duration: 0.8 });
    }
  }, [selectedDistrict, selectedDivision, filteredDistricts, natureFilter, onClose, openPlace, lang, translateCategory, translateDistrict, translateDivision, translatePlaceName, toBengaliNumber]);

  const handleReset = () => {
    setSelectedDivision("All");
    setSelectedDistrict("");
    setSearchQuery("");
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo(BANGLADESH_CENTER, 7, { duration: 0.8 });
    }
  };

  const handleSelectPlaceOnMap = (place) => {
    if (!leafletMapRef.current || !place.coordinates?.lat || !place.coordinates?.lng) {
      openPlace(place);
      onClose();
      return;
    }
    const dist = districts.find(
      (d) => d.slug === place.districtId || d.id === place.districtId || d.name === place.district,
    );
    if (dist && dist.slug !== selectedDistrict) {
      handleSelectDistrict(dist.slug);
    }
    leafletMapRef.current.flyTo([place.coordinates.lat, place.coordinates.lng], 12, { duration: 0.8 });
    const placeMarker = placeMarkersMapRef.current.get(place.id || place.slug);
    if (placeMarker) {
      placeMarker.openPopup();
    }
    setMobileTab("map");
  };

  return (
    <dialog
      className="provider-dialog bd-map-dialog"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >


      <div className="bd-map-modal" ref={modalCardRef} onMouseDown={(event) => event.stopPropagation()}>
        {/* Header */}
        <div className="bd-map-modal-header">
          <div className="bd-map-title-row">
            <span className="bd-map-header-icon" aria-hidden="true">
              <svg viewBox="0 0 100 100" className="bd-map-svg" width="30" height="30">
                <path d={BANGLADESH_SVG_PATH} fill="#087f70" stroke="#055b50" strokeWidth="1.2" />
              </svg>
            </span>
            <div>
              <h2>{t("map.modalTitle")}</h2>
              <p>{t("map.modalSubtitle")}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LanguageSwitcher />
            <button
              type="button"
              className="button secondary bd-header-travel-map-btn"
              onClick={() => {
                onClose();
                onOpenTrip?.();
              }}
              title={lang === "bn" ? "৬৪ জেলার ভ্রমণ মানচিত্র খুলুন" : "Open 64-District Visited Travel Map"}
              style={{ padding: "6px 12px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "8px" }}
            >
              <Route size={15} /> {t("nav.travelMap")}
            </button>
            <button type="button" className="icon-button close" onClick={onClose} aria-label={t("common.close")}>
              <X />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bd-map-toolbar">
          <div className="bd-map-search-row">
            <label className="bd-map-search-box">
              <Search />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("map.searchPlaceholder")}
                aria-label={t("common.search")}
              />
              {searchQuery ? (
                <button type="button" onClick={() => setSearchQuery("")} className="bd-map-clear-btn" aria-label={t("common.cancel")}>
                  &times;
                </button>
              ) : null}
            </label>

            <select
              className="bd-district-select"
              value={selectedDistrict}
              onChange={(e) => handleSelectDistrict(e.target.value)}
              aria-label={t("map.allDistricts")}
            >
              <option value="">-- {t("map.allDistricts")} --</option>
              {districts.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {translateDistrict(d.name)} ({translateDivision(d.division)})
                </option>
              ))}
            </select>

            <button type="button" className="button secondary bd-reset-btn" onClick={handleReset}>
              <Compass /> {t("common.back")}
            </button>
          </div>

          {/* Division Pills */}
          <div className="bd-division-pills" role="tablist" aria-label="Bangladesh Divisions">
            {DIVISIONS.map((div) => (
              <button
                type="button"
                key={div}
                role="tab"
                aria-selected={selectedDivision === div}
                className={`bd-div-pill ${selectedDivision === div ? "active" : ""}`}
                onClick={() => {
                  setSelectedDivision(div);
                  setSelectedDistrict("");
                  if (div === "All" && leafletMapRef.current) {
                    leafletMapRef.current.flyTo(BANGLADESH_CENTER, 7, { duration: 0.8 });
                  }
                }}
              >
                {translateDivision(div)}
              </button>
            ))}
          </div>

          {/* Mobile Tab Switcher */}
          <div className="bd-mobile-tabs">
            <button
              type="button"
              className={mobileTab === "map" ? "active" : ""}
              onClick={() => setMobileTab("map")}
            >
              {lang === "bn" ? "ইন্টারেক্টিভ মানচিত্র" : "Interactive Map"}
            </button>
            <button
              type="button"
              className={mobileTab === "places" ? "active" : ""}
              onClick={() => setMobileTab("places")}
            >
              {t("nav.places")} ({toBengaliNumber(displayedPlaces.length)})
            </button>
          </div>
        </div>

        {/* Main Content: Map + Places Drawer */}
        <div className="bd-map-content">
          <div className={`bd-map-canvas-wrap ${mobileTab !== "map" ? "mobile-hidden" : ""}`}>
            <div ref={mapContainerRef} className="bd-leaflet-map-canvas" />
            <div className="bd-map-tip">
              <MapPin />
              <span>
                {selectedDistrict
                  ? (lang === "bn"
                      ? `${translateDistrict(districts.find((d) => d.slug === selectedDistrict || d.id === selectedDistrict)?.name || "জেলা")}-র দর্শনীয় স্থান দেখানো হচ্ছে • পরিবর্তন করতে অন্য জেলায় চাপুন`
                      : `Showing ${translateDistrict(districts.find((d) => d.slug === selectedDistrict || d.id === selectedDistrict)?.name || "district")} attractions • Click another district to switch`)
                  : (lang === "bn"
                      ? "পর্যটন আকর্ষণ দেখতে মানচিত্রে যেকোনো জেলার নামে চাপুন"
                      : "Click any district name on the map to view its tourist attractions")}
              </span>
            </div>
          </div>

          {/* Places Sidebar */}
          <aside className={`bd-map-places-sidebar ${mobileTab !== "places" ? "mobile-hidden" : ""}`}>
            <div className="bd-sidebar-header">
              <div>
                <h3>
                  {selectedDistrict
                    ? `${translateDistrict(districts.find((d) => d.slug === selectedDistrict || d.id === selectedDistrict)?.name || "District")} ${t("nav.places")}`
                    : selectedDivision !== "All"
                      ? `${translateDivision(selectedDivision)} ${t("nav.places")}`
                      : t("home.trendingEyebrow")}
                </h3>
                {selectedDistrict ? (
                  <button
                    type="button"
                    className="bd-sidebar-clear-district"
                    onClick={() => {
                      setSelectedDistrict("");
                      setNatureFilter("water");
                      if (leafletMapRef.current) {
                        leafletMapRef.current.flyTo(BANGLADESH_CENTER, 7, { duration: 0.8 });
                      }
                    }}
                    title={t("map.allDistricts")}
                  >
                    &larr; {t("map.allDistricts")}
                  </button>
                ) : null}
              </div>
              <span className="bd-places-count">{formatCount(displayedPlaces.length, t("map.placesCount"), t("map.placesCount"))}</span>
            </div>

            {/* Quick Nature Filter Pills */}
            {(natureCounts.water > 0 || natureCounts.mountain > 0) && (
              <div className="bd-sidebar-nature-pills" role="group" aria-label={lang === "bn" ? "প্রকৃতির ধরন অনুযায়ী ফিল্টার করুন" : "Filter places by natural type"}>
                {natureCounts.water > 0 && (
                  <button
                    type="button"
                    className={`bd-nature-pill ${natureFilter === "water" ? "active" : ""}`}
                    onClick={() => setNatureFilter(natureFilter === "water" ? "all" : "water")}
                  >
                    {t("map.filterWater")} <span className="bd-nature-pill-badge">{toBengaliNumber(natureCounts.water)}</span>
                  </button>
                )}
                {natureCounts.mountain > 0 && (
                  <button
                    type="button"
                    className={`bd-nature-pill ${natureFilter === "mountain" ? "active" : ""}`}
                    onClick={() => setNatureFilter(natureFilter === "mountain" ? "all" : "mountain")}
                  >
                    {t("map.filterMountain")} <span className="bd-nature-pill-badge">{toBengaliNumber(natureCounts.mountain)}</span>
                  </button>
                )}
                <button
                  type="button"
                  className={`bd-nature-pill ${natureFilter === "all" ? "active" : ""}`}
                  onClick={() => setNatureFilter("all")}
                >
                  {t("map.filterAll")} <span className="bd-nature-pill-badge">{toBengaliNumber(natureCounts.all)}</span>
                </button>
              </div>
            )}

            <div
              className="bd-places-scroll-list"
              ref={placesScrollRef}
              key={`${selectedDistrict || "all"}-${selectedDivision}-${natureFilter}`}
            >
              {displayedPlaces.length === 0 ? (
                <div className="bd-places-empty">
                  <p>{t("map.emptySubtitle")}</p>
                  <button type="button" className="button secondary" onClick={handleReset}>
                    {t("common.back")}
                  </button>
                </div>
              ) : (
                displayedPlaces.map((place) => {
                  const isWater = isWaterBodyPlace(place);
                  const isMountain = isMountainPlace(place);
                  const showAsMountain = natureFilter === "mountain" ? true : natureFilter === "water" ? false : isMountain && !isWater;
                  const badgeClass = showAsMountain ? "mountain-badge" : "water-badge";
                  const displayCategory = translateCategory(place.category);
                  const badgeLabel = showAsMountain
                    ? `${t("map.badgeMountain")} • ${displayCategory || "Hills/Valley"}`
                    : `${t("map.badgeWater")} • ${displayCategory || "River/Lake"}`;
                  const displayName = translatePlaceName(place);
                  const displayDistrict = translateDistrict(place.district);
                  const displayArea = translateArea ? translateArea(place.area) : place.area;
                  const locationText = displayArea && displayDistrict && displayArea.trim().toLowerCase() === displayDistrict.trim().toLowerCase()
                    ? displayDistrict
                    : (displayArea ? `${displayArea}, ${displayDistrict}` : displayDistrict);

                  return (
                    <article key={place.id || place.slug} className="bd-place-item-card">
                      <img
                        src={place.image}
                        alt={displayName}
                        className="bd-place-thumb"
                        loading="lazy"
                      />
                      <div className="bd-place-details">
                        <span className={`bd-place-badge ${badgeClass}`}>{badgeLabel}</span>
                        <h4>{displayName}</h4>
                        <p className="bd-place-loc">{locationText}</p>
                        <div className="bd-place-actions">
                          <button
                            type="button"
                            className="bd-pin-jump-btn"
                            onClick={() => handleSelectPlaceOnMap(place)}
                            title={lang === "bn" ? "মানচিত্রে দেখুন" : "Show on map"}
                          >
                            <MapPin /> {lang === "bn" ? "মানচিত্রে দেখুন" : t("common.search")}
                          </button>
                          <button
                            type="button"
                            className="bd-view-detail-btn"
                            onClick={() => {
                              onClose();
                              openPlace(place);
                            }}
                          >
                            {t("placeCard.openPlace")} &rarr;
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </aside>
        </div>

        {/* Modal Footer */}
        <div className="bd-map-modal-footer">
          <span>{lang === "bn" ? "৮টি বিভাগ • ৬৪টি জেলা • ২০০+ নদী, হ্রদ ও পাহাড়ি গন্তব্য" : "8 Divisions • 64 Districts • 200+ Water Bodies & Mountain Destinations"}</span>
          <button type="button" className="button secondary" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
