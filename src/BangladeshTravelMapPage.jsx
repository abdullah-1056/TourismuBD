import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  MapPin,
  Maximize2,
  RefreshCw,
  Route,
  Search,
  Share2,
  Sparkles,
  SquareX,
  X,
} from "lucide-react";
import {
  BANGLADESH_DISTRICT_PATHS,
  BANGLADESH_MAP_VIEWBOX,
} from "./data/bangladesh-district-paths.js";
import { BANGLADESH_DIVISION_PERIMETERS } from "./data/bangladesh-division-perimeters.js";
import {
  BANGLADESH_OVER_RIVERS,
  BANGLADESH_RIVER_LABELS,
  BANGLADESH_UNDER_RIVERS,
} from "./data/bangladesh-rivers.js";
import { bangladeshDistricts } from "./data/bangladesh-districts.js";
import { LanguageSwitcher, useLanguage } from "./lib/LanguageContext.jsx";

// The 15 initial districts seen in the reference screenshot
const INITIAL_VISITED_DISTRICTS = [
  "panchagarh",
  "thakurgaon",
  "pabna",
  "kushtia",
  "rajbari",
  "gazipur",
  "cumilla",
  "feni",
  "noakhali",
  "bhola",
  "chattogram",
  "bandarban",
  "coxs-bazar",
  "khagrachhari",
  "rangamati",
];

// Division ordering matching reference design
const DIVISION_ORDER = [
  "Rangpur",
  "Rajshahi",
  "Mymensingh",
  "Sylhet",
  "Dhaka",
  "Chattogram",
  "Khulna",
  "Barishal",
];

const LOCAL_STORAGE_KEY = "tourismubd.visited-districts";
const FULL_VIEWBOX = { x: 0, y: 0, w: 1560, h: 2150 };

export function BangladeshTravelMapPage({ onBack, onOpenTrip, notify }) {
  const { t, lang, translateDistrict, translateDivision, toBengaliNumber } = useLanguage();
  // Visited districts set (persisted in localStorage)
  const [visited, setVisited] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return new Set(parsed);
        }
      } catch {
        // Fallback to default initial 15
      }
    }
    return new Set(INITIAL_VISITED_DISTRICTS);
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [hoveredRiver, setHoveredRiver] = useState(null);
  const [mobileTab, setMobileTab] = useState("both"); // "list" | "map" | "both"
  const [isExporting, setIsExporting] = useState(false);
  const [currentViewBox, setCurrentViewBox] = useState(FULL_VIEWBOX);
  const viewBoxRef = useRef(FULL_VIEWBOX);
  const svgRef = useRef(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(visited)));
    } catch {
      // Storage error ignored
    }
  }, [visited]);

  // Group districts by division
  const divisionsData = useMemo(() => {
    const grouped = {};
    for (const div of DIVISION_ORDER) {
      grouped[div] = [];
    }

    for (const d of bangladeshDistricts) {
      const divName = d.division;
      if (!grouped[divName]) grouped[divName] = [];
      grouped[divName].push(d);
    }

    // Sort districts alphabetically inside each division
    for (const div of Object.keys(grouped)) {
      grouped[div].sort((a, b) => a.name.localeCompare(b.name));
    }

    return DIVISION_ORDER.map((divName) => {
      const allInDiv = grouped[divName] || [];
      const visitedInDiv = allInDiv.filter((d) => visited.has(d.code));
      return {
        name: divName,
        total: allInDiv.length,
        visitedCount: visitedInDiv.length,
        districts: allInDiv,
      };
    });
  }, [visited]);

  // Filtered divisions by search query
  const filteredDivisions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return divisionsData;

    return divisionsData
      .map((div) => {
        const matchingDistricts = div.districts.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.division.toLowerCase().includes(q) ||
            d.code.toLowerCase().includes(q) ||
            translateDistrict(d.name).toLowerCase().includes(q) ||
            translateDivision(d.division).toLowerCase().includes(q)
        );
        return {
          ...div,
          districts: matchingDistricts,
        };
      })
      .filter((div) => div.districts.length > 0);
  }, [divisionsData, searchQuery, translateDistrict, translateDivision]);

  // Fast map lookup for path & centroid
  const pathMap = useMemo(() => {
    const map = new Map();
    for (const p of BANGLADESH_DISTRICT_PATHS) {
      map.set(p.code, p);
    }
    return map;
  }, []);

  // Dynamic padded bounding box for each division to zoom into
  const divisionViewBoxes = useMemo(() => {
    const map = {};
    for (const divName of DIVISION_ORDER) {
      const list = BANGLADESH_DISTRICT_PATHS.filter((d) => d.division === divName);
      if (!list.length) continue;
      const minX = Math.min(...list.map((d) => d.bbox.x));
      const minY = Math.min(...list.map((d) => d.bbox.y));
      const maxX = Math.max(...list.map((d) => d.bbox.x + d.bbox.width));
      const maxY = Math.max(...list.map((d) => d.bbox.y + d.bbox.height));
      const rawW = maxX - minX;
      const rawH = maxY - minY;
      const padX = Math.max(70, Math.round(rawW * 0.12));
      const padY = Math.max(70, Math.round(rawH * 0.12));
      map[divName] = {
        x: Math.round(minX - padX),
        y: Math.round(minY - padY),
        w: Math.round(rawW + padX * 2),
        h: Math.round(rawH + padY * 2),
      };
    }
    return map;
  }, []);

  // Smooth cinematic 60fps pan/zoom camera transition between divisions and full map
  useEffect(() => {
    const target =
      selectedDivision && divisionViewBoxes[selectedDivision]
        ? divisionViewBoxes[selectedDivision]
        : FULL_VIEWBOX;

    const start = { ...viewBoxRef.current };
    const startTime = performance.now();
    const duration = 650; // ms transition

    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let animId;
    const frame = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(progress);

      const nextBox = {
        x: Math.round(start.x + (target.x - start.x) * eased),
        y: Math.round(start.y + (target.y - start.y) * eased),
        w: Math.round(start.w + (target.w - start.w) * eased),
        h: Math.round(start.h + (target.h - start.h) * eased),
      };

      viewBoxRef.current = nextBox;
      setCurrentViewBox(nextBox);

      if (progress < 1) {
        animId = requestAnimationFrame(frame);
      }
    };

    animId = requestAnimationFrame(frame);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [selectedDivision, divisionViewBoxes]);

  // Toggle single district
  const toggleDistrict = useCallback((code) => {
    setVisited((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);

  // Toggle whole division
  const toggleWholeDivision = useCallback(
    (divName) => {
      const divObj = divisionsData.find((d) => d.name === divName);
      if (!divObj) return;

      const divCodes = divObj.districts.map((d) => d.code);
      const allSelected = divCodes.every((code) => visited.has(code));

      setVisited((prev) => {
        const next = new Set(prev);
        if (allSelected) {
          // Unselect all in this division
          for (const code of divCodes) next.delete(code);
        } else {
          // Select all in this division
          for (const code of divCodes) next.add(code);
        }
        return next;
      });
    },
    [divisionsData, visited]
  );

  // Toggle active division accordion (clicking opens one and closes the previous one)
  const handleSelectDivision = useCallback((divName) => {
    setSelectedDivision((current) => (current === divName ? null : divName));
  }, []);

  // Reset map view to full Bangladesh (zoom out & clear active division)
  const handleResetMap = useCallback(() => {
    setSelectedDivision(null);
    notify?.("Reset map zoom to full Bangladesh.");
  }, [notify]);

  // Clear all
  const clearAll = useCallback(() => {
    setVisited(new Set());
    notify?.("Cleared all visited districts.");
  }, [notify]);

  // Select all 64
  const selectAll = useCallback(() => {
    setVisited(new Set(bangladeshDistricts.map((d) => d.code)));
    notify?.("Marked all 64 districts as visited! 🇧🇩");
  }, [notify]);

  // Reset to initial 15
  const resetToDefault = useCallback(() => {
    setVisited(new Set(INITIAL_VISITED_DISTRICTS));
    notify?.("Reset travel map to sample visited districts.");
  }, [notify]);

  // Download map as PNG
  const downloadMapImage = async () => {
    if (!svgRef.current) return;
    try {
      setIsExporting(true);
      const svgEl = svgRef.current;
      const cloneSvg = svgEl.cloneNode(true);
      cloneSvg.setAttribute("viewBox", BANGLADESH_MAP_VIEWBOX);
      const svgData = new XMLSerializer().serializeToString(cloneSvg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1560;
        canvas.height = 2150;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);

        URL.revokeObjectURL(blobURL);
        const imgURL = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `my-bangladesh-travel-map-${visited.size}-districts.png`;
        downloadLink.href = imgURL;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setIsExporting(false);
        notify?.("Downloaded travel map image!");
      };
      image.src = blobURL;
    } catch {
      setIsExporting(false);
      notify?.("Could not download map image. Please try again.");
    }
  };

  const visitedCount = visited.size;
  const percentage = Math.round((visitedCount / 64) * 100);

  return (
    <main className="bd-travel-page">
      {/* Top Banner Navigation & Quick Stats */}
      <div className="bd-travel-top-bar page-shell">
        <div className="bd-travel-breadcrumbs">
          {onBack ? (
            <button
              type="button"
              className="bd-travel-back-btn"
              onClick={onBack}
              aria-label={t("common.back")}
            >
              <ArrowLeft size={18} />
              <span>{t("common.back")}</span>
            </button>
          ) : null}
          <div className="bd-travel-header-info">
            <span className="bd-travel-pill-tag">
              <Sparkles size={14} /> {t("travelMap.trackerBadge")}
            </span>
            <h1>{t("travelMap.trackerTitle")}</h1>
          </div>
        </div>

        <div className="bd-travel-top-actions">
          <LanguageSwitcher />
          <button
            type="button"
            className={`button secondary bd-tool-btn ${selectedDivision ? "is-highlighted" : ""}`}
            onClick={handleResetMap}
            title={t("travelMap.resetMapTitle")}
          >
            <Maximize2 size={15} /> {t("travelMap.resetMap")}
          </button>
          <button
            type="button"
            className="button secondary bd-tool-btn"
            onClick={resetToDefault}
            title={t("travelMap.sampleTitle")}
          >
            <RefreshCw size={15} /> {t("travelMap.sample")}
          </button>
          <button
            type="button"
            className="button secondary bd-tool-btn"
            onClick={clearAll}
            title={t("travelMap.clearTitle")}
          >
            <X size={15} /> {t("travelMap.clear")}
          </button>
          <button
            type="button"
            className="button secondary bd-tool-btn"
            onClick={selectAll}
            title={t("travelMap.all64Title")}
          >
            <Check size={15} /> {t("travelMap.all64")}
          </button>
          <button
            type="button"
            className="button primary bd-tool-btn"
            onClick={downloadMapImage}
            disabled={isExporting}
            title={t("travelMap.saveImageTitle")}
          >
            <Download size={15} /> {isExporting ? t("travelMap.saving") : t("travelMap.saveImage")}
          </button>
          {onOpenTrip ? (
            <button
              type="button"
              className="button secondary bd-tool-btn bd-plan-trip-nav-btn"
              onClick={onOpenTrip}
            >
              <Route size={15} /> {t("travelMap.planTrip")}
            </button>
          ) : null}
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="bd-travel-mobile-tabs page-shell">
        <button
          type="button"
          className={mobileTab === "list" || mobileTab === "both" ? "active" : ""}
          onClick={() => setMobileTab("list")}
        >
          {t("travelMap.tickDistrictsTab")} ({toBengaliNumber(visitedCount)}/{toBengaliNumber(64)})
        </button>
        <button
          type="button"
          className={mobileTab === "map" ? "active" : ""}
          onClick={() => setMobileTab("map")}
        >
          {t("travelMap.travelMapTab")} ({toBengaliNumber(visitedCount)} {t("travelMap.seen")})
        </button>
      </div>

      {/* Main 2-Column Container */}
      <div className="bd-travel-container page-shell">
        {/* LEFT COLUMN: Tick the districts you have visited */}
        <section
          className={`bd-travel-left-card ${mobileTab === "map" ? "mobile-hidden" : ""}`}
          aria-labelledby="tick-districts-title"
        >
          <div className="bd-travel-left-header">
            <h2 id="tick-districts-title">{t("travelMap.tickDistrictsTitle")}</h2>
            <span className="bd-visited-badge" aria-label={`${visitedCount} of 64 districts visited`}>
              {toBengaliNumber(visitedCount)}/{toBengaliNumber(64)}
            </span>
          </div>

          {/* Search Input */}
          <div className="bd-travel-search-wrap">
            <label className="bd-travel-search-label" htmlFor="district-search-input">
              <Search size={18} className="bd-search-icon" aria-hidden="true" />
              <input
                id="district-search-input"
                type="search"
                className="bd-travel-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("travelMap.searchPlaceholder")}
                aria-label={t("travelMap.filterLabel")}
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="bd-travel-clear-search"
                  onClick={() => setSearchQuery("")}
                  aria-label={t("travelMap.clearSearch")}
                >
                  <X size={15} />
                </button>
              ) : null}
            </label>
          </div>

          {/* Divisions and Districts Accordion List (8 divisions, one open at a time) */}
          <div className="bd-divisions-list bd-division-accordion-list" role="region" aria-label="Districts grouped by division">
            {filteredDivisions.length ? (
              filteredDivisions.map((division) => {
                const isOpen = searchQuery.trim() ? true : selectedDivision === division.name;

                return (
                  <div
                    key={division.name}
                    className={`bd-division-accordion-item ${isOpen ? "is-expanded" : ""}`}
                  >
                    <button
                      type="button"
                      className={`bd-division-trigger ${isOpen ? "active" : ""}`}
                      onClick={() => handleSelectDivision(division.name)}
                      aria-expanded={isOpen}
                      aria-controls={`division-panel-${division.name}`}
                    >
                      <div className="bd-division-trigger-left">
                        <span className="bd-division-chevron" aria-hidden="true">
                          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <span className="bd-division-name-text">{translateDivision(division.name)}</span>
                      </div>
                      <div className="bd-division-trigger-right">
                        <span
                          className={`bd-division-badge ${
                            division.visitedCount === division.total
                              ? "all-visited"
                              : division.visitedCount > 0
                              ? "has-visited"
                              : "none-visited"
                          }`}
                        >
                          {toBengaliNumber(division.visitedCount)}/{toBengaliNumber(division.total)}
                        </span>
                      </div>
                    </button>

                    {isOpen ? (
                      <div
                        id={`division-panel-${division.name}`}
                        className="bd-division-expanded-panel"
                        role="region"
                        aria-label={`${division.name} division districts`}
                      >
                        <div className="bd-division-panel-toolbar">
                          <span className="bd-division-summary-text">
                            {toBengaliNumber(division.visitedCount)} / {toBengaliNumber(division.total)} {t("travelMap.districtsVisited")}
                          </span>
                          <button
                            type="button"
                            className="bd-whole-division-link"
                            onClick={() => toggleWholeDivision(division.name)}
                            aria-label={`Toggle all districts in ${division.name}`}
                          >
                            {division.visitedCount === division.total
                              ? t("travelMap.unselectDivision")
                              : t("travelMap.wholeDivision")}
                          </button>
                        </div>

                        {/* Pills */}
                        <div className="bd-district-pills-wrap">
                          {division.districts.map((district) => {
                            const isVisited = visited.has(district.code);
                            return (
                              <button
                                key={district.code}
                                type="button"
                                className={`bd-district-pill ${isVisited ? "visited" : "unvisited"}`}
                                onClick={() => toggleDistrict(district.code)}
                                onMouseEnter={() => setHoveredDistrict(district)}
                                onMouseLeave={() => setHoveredDistrict(null)}
                                aria-pressed={isVisited}
                                title={`${translateDistrict(district.name)} (${translateDivision(district.division)})`}
                              >
                                {isVisited ? (
                                  <span className="bd-check-mark">
                                    <Check size={14} strokeWidth={3} />
                                  </span>
                                ) : null}
                                <span className="bd-pill-name">{translateDistrict(district.name)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="bd-travel-empty-search">
                <Search size={24} />
                <p>{t("travelMap.noDistrictMatching")} &ldquo;{searchQuery}&rdquo;</p>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setSearchQuery("")}
                >
                  {t("travelMap.clearSearch")}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Your Bangladesh travel map: colour the districts you have visited */}
        <section
          className={`bd-travel-right-card ${mobileTab === "list" ? "mobile-hidden" : ""}`}
          aria-labelledby="map-title"
        >
          <div className="bd-travel-right-header">
            <div>
              <h2 id="map-title">
                {t("travelMap.rightHeaderTitle")}
              </h2>
              <p className="bd-districts-seen-sub">
                <b>{toBengaliNumber(visitedCount)} {t("travelMap.districtsSeen")}</b>{" "}
                <span className="bd-seen-pct">({toBengaliNumber(percentage)}% {t("travelMap.ofBangladeshExplored")})</span>
              </p>
            </div>
            <div className="bd-right-header-actions">
              <button
                type="button"
                className="button secondary bd-right-uncheck-btn"
                onClick={clearAll}
                disabled={visitedCount === 0}
                title={t("travelMap.uncheckTitle")}
                aria-label={t("travelMap.uncheckTitle")}
              >
                <SquareX size={16} aria-hidden="true" />
                <span>{t("travelMap.uncheck")}</span>
              </button>
              <button
                type="button"
                className={`button secondary bd-right-reset-map-btn ${selectedDivision ? "is-zoomed" : ""}`}
                onClick={handleResetMap}
                title={t("travelMap.resetMapTitle")}
              >
                <Maximize2 size={16} />
                <span>{t("travelMap.resetMapButton")}</span>
              </button>
            </div>
          </div>

          {/* Interactive SVG Bangladesh Map */}
          <div
            className="bd-map-canvas-container"
            onMouseLeave={() => {
              setHoveredDistrict(null);
              setHoveredRiver(null);
            }}
          >

            <svg
              ref={svgRef}
              viewBox={`${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.w} ${currentViewBox.h}`}
              className={`bd-travel-svg-map ${selectedDivision ? "has-division-focus" : ""}`}
              role="img"
              aria-label="Interactive map of Bangladesh districts and rivers"
            >
              <defs>
                {/* Subtle drop shadow filter for text labels */}
                <filter id="labelShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="rgba(0,0,0,0.6)" />
                </filter>
                {/* River water gradient */}
                <linearGradient id="riverWaterGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>

              {/* UNDER-LAYER RIVERS: Fills natural river channels and coastal delta waterways with light blue (#38bdf8) */}
              <g className="bd-svg-under-rivers-group" pointerEvents="none" aria-hidden="true">
                {BANGLADESH_UNDER_RIVERS.map((river) => (
                  <path
                    key={river.id}
                    id={`river-${river.id}`}
                    d={river.path}
                    className={`bd-svg-under-river ${river.isPolygon ? "bd-svg-water-polygon" : ""}`}
                    fill={river.isPolygon ? river.fill || river.color : "none"}
                    stroke={river.color}
                    strokeWidth={river.isPolygon ? 1 : river.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </g>

              {/* District Paths */}
              <g className="bd-svg-districts-group">
                {BANGLADESH_DISTRICT_PATHS.map((item) => {
                  const isVisited = visited.has(item.code);
                  const isHovered = hoveredDistrict?.code === item.code;
                  const inFocusedDivision = selectedDivision === item.division;

                  return (
                    <path
                      key={item.code}
                      id={`map-district-${item.code}`}
                      d={item.path}
                      className={`bd-svg-district-path ${
                        isVisited ? "district-visited" : "district-unvisited"
                      } ${isHovered ? "district-hovered" : ""} ${
                        inFocusedDivision ? "in-focused-division" : ""
                      }`}
                      onClick={() => {
                        toggleDistrict(item.code);
                        setSelectedDivision(item.division);
                      }}
                      onMouseEnter={() => setHoveredDistrict(item)}
                      onMouseLeave={() => setHoveredDistrict(null)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${item.name} district, ${item.division} division. ${
                        isVisited ? "Visited" : "Not visited"
                      }`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleDistrict(item.code);
                          setSelectedDivision(item.division);
                        }
                      }}
                    />
                  );
                })}
              </g>

              {/* OVER-LAYER RIVERS: Jamuna, Upper Meghna, Karnaphuli with light blue water and crisp white protective casing */}
              <g className="bd-svg-over-rivers-group" aria-hidden="true">
                {BANGLADESH_OVER_RIVERS.map((river) => (
                  <g
                    key={river.id}
                    className="bd-svg-over-river-item"
                    onMouseEnter={() => setHoveredRiver(river)}
                    onMouseLeave={() => setHoveredRiver(null)}
                  >
                    {/* Protective halo casing against district fills */}
                    <path
                      d={river.path}
                      stroke="#ffffff"
                      strokeWidth={river.width + 4.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      opacity={0.88}
                      pointerEvents="none"
                    />
                    <path
                      d={river.path}
                      stroke="#0284c7"
                      strokeWidth={river.width + 1}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      opacity={0.25}
                      pointerEvents="none"
                    />
                    {/* Main light blue river stream */}
                    <path
                      d={river.path}
                      className="bd-svg-over-river-line"
                      stroke={river.color}
                      strokeWidth={river.width}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      pointerEvents="stroke"
                    />
                  </g>
                ))}
              </g>

              {/* Division Outer Boundary (Thin light orange perimeter around selected division ONLY, zero district lines inside) */}
              {selectedDivision && BANGLADESH_DIVISION_PERIMETERS[selectedDivision] ? (
                <g className="bd-division-outer-boundary" pointerEvents="none" aria-hidden="true">
                  {/* Outer soft light orange subtle glow */}
                  <path
                    key={`div-glow-${selectedDivision}`}
                    d={BANGLADESH_DIVISION_PERIMETERS[selectedDivision]}
                    fill="none"
                    stroke="#fdba74"
                    strokeWidth={5.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={0.35}
                  />
                  {/* Thin crisp light orange division border */}
                  <path
                    key={`div-border-${selectedDivision}`}
                    d={BANGLADESH_DIVISION_PERIMETERS[selectedDivision]}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={2.8}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </g>
              ) : null}

              {/* District Labels (Visited districts, plus focused division district labels when zoomed) */}
              <g className="bd-svg-labels-group" pointerEvents="none" aria-hidden="true">
                {BANGLADESH_DISTRICT_PATHS.map((item) => {
                  const isVisited = visited.has(item.code);
                  const inFocusedDivision = selectedDivision === item.division;

                  // Show label if visited, or if in the focused division
                  if (!isVisited && !inFocusedDivision) return null;

                  // Adjust font size based on bounding box width
                  const baseFontSize =
                    item.bbox.width < 90 || item.bbox.height < 90
                      ? 19
                      : item.bbox.width < 140
                      ? 22
                      : 25;

                  const fontSize = selectedDivision
                    ? Math.max(16, Math.round(baseFontSize * 0.88))
                    : baseFontSize;

                  return (
                    <text
                      key={`label-${item.code}`}
                      x={item.cx}
                      y={item.cy}
                      className={`bd-svg-district-label ${
                        isVisited ? "label-visited" : "label-unvisited"
                      } ${inFocusedDivision ? "label-focused" : ""}`}
                      style={{ fontSize: `${fontSize}px` }}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {lang === "bn" ? translateDistrict(item.name) : item.name}
                    </text>
                  );
                })}
              </g>

              {/* River Labels: elegant light-blue river titles identifying major waterways */}
              <g className="bd-svg-river-labels-group" pointerEvents="none" aria-hidden="true">
                {BANGLADESH_RIVER_LABELS.map((label) => (
                  <text
                    key={label.id}
                    x={label.x}
                    y={label.y}
                    transform={`rotate(${label.rotate}, ${label.x}, ${label.y})`}
                    className="bd-svg-river-label"
                    style={{ fontSize: `${label.fontSize}px` }}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {lang === "bn" ? (label.bengali || label.text) : label.text}
                  </text>
                ))}
              </g>
            </svg>

            {/* Hover Info Card for Districts (Fixed to Top-Right Corner) */}
            {hoveredDistrict && !hoveredRiver ? (
              <div
                className="bd-map-tooltip"
                role="tooltip"
              >
                <b>{translateDistrict(hoveredDistrict.name)}</b>
                <span>{translateDivision(hoveredDistrict.division)} {t("travelMap.divisionSuffix")}</span>
                <small className={visited.has(hoveredDistrict.code) ? "is-visited" : ""}>
                  {visited.has(hoveredDistrict.code)
                    ? t("travelMap.visitedClickUncheck")
                    : t("travelMap.clickToMark")}
                </small>
              </div>
            ) : null}

            {/* Hover Info Card for Rivers (Fixed to Top-Right Corner) */}
            {hoveredRiver ? (
              <div
                className="bd-map-tooltip bd-river-tooltip"
                role="tooltip"
              >
                <b>{lang === "bn" ? (hoveredRiver.bengali || hoveredRiver.name) : hoveredRiver.name}</b>
                <span className="bd-river-bengali">{lang === "bn" ? hoveredRiver.name : hoveredRiver.bengali}</span>
                <small className="is-river">{t("travelMap.majorRiver")}</small>
              </div>
            ) : null}

            {/* Interactive hint footer */}
            <div className="bd-map-legend-footer">
              <span className="bd-legend-item">
                <span className="bd-legend-swatch visited" /> {t("travelMap.visited")} ({toBengaliNumber(visitedCount)})
              </span>
              <span className="bd-legend-item">
                <span className="bd-legend-swatch unvisited" /> {t("travelMap.unvisited")} ({toBengaliNumber(64 - visitedCount)})
              </span>
              <span className="bd-legend-item">
                <span className="bd-legend-swatch river" /> {t("travelMap.rivers")}
              </span>
              <span className="bd-legend-hint">
                {t("travelMap.legendTip")}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
