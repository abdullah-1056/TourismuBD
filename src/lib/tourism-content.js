import { useEffect, useState } from "react";
import {
  FALLBACK_IMAGE,
  FALLBACK_PLACE_COORDINATES,
  replacePublishedTourismData,
  getCustomPlaceImage,
  syncCustomMediaFromServer,
} from "../data/tourism.js";
import { ROAD_ACCESS_COORDINATES, VERIFIED_PLACE_COORDINATES } from "../data/place-coordinates.js";
import { districtPlaceId, RAJSHAHI_PLACE_COORDINATES, RAJSHAHI_PLACE_NOTES, RAJSHAHI_ROAD_ACCESS_COORDINATES } from "../data/rajshahi-coordinates.js";
import { BARISHAL_PLACE_COORDINATES, BARISHAL_PLACE_IDS, BARISHAL_PLACE_NOTES, BARISHAL_ROAD_ACCESS_COORDINATES } from "../data/barishal-coordinates.js";
import { KHULNA_PLACE_COORDINATES, KHULNA_PLACE_IDS, KHULNA_PLACE_NOTES, KHULNA_ROAD_ACCESS_COORDINATES } from "../data/khulna-coordinates.js";
import { kishoreganjPlaceDetails } from "../data/kishoreganj-access.js";
import { supabase } from "./supabase.js";

const bangladeshCenter = { lat: 23.685, lng: 90.3563 };

function mapPlace(row) {
  const districtId = row.districts?.slug || row.district_id;
  const districtKey = `${districtId}:${row.slug}`;
  const accessDetails = kishoreganjPlaceDetails(districtId, row.slug);
  const verifiedCoordinates = accessDetails?.coordinates || KHULNA_PLACE_COORDINATES[districtKey] || BARISHAL_PLACE_COORDINATES[districtKey] || RAJSHAHI_PLACE_COORDINATES[districtKey] || VERIFIED_PLACE_COORDINATES[row.slug];
  const fallbackCoordinates = FALLBACK_PLACE_COORDINATES[districtKey] || FALLBACK_PLACE_COORDINATES[row.slug] || bangladeshCenter;
  const hasStoredCoordinates = row.latitude != null && row.longitude != null;
  const item = {
    id: KHULNA_PLACE_IDS[districtKey] || BARISHAL_PLACE_IDS[districtKey] || districtPlaceId(districtId, row.slug),
    databaseId: row.id,
    districtId,
    district: row.districts?.name || "Bangladesh",
    name: row.name,
    slug: row.slug,
    aliases: [],
    area: row.upazila_or_area || "District area",
    category: row.category || "Tourist place",
    shortDescription: row.short_description || "Tourist place details will be added by TourismuBD.",
    image: row.image_url || getCustomPlaceImage(row.slug) || getCustomPlaceImage(row.id) || FALLBACK_IMAGE,
    bestTime: { recommended: row.best_time || "Check local conditions", why: "Plan according to seasonal access and weather.", caution: row.practical_tips || "Confirm local access before departure.", lastVerified: row.last_verified_at || null },
    howToReach: row.how_to_reach || "Travel details will be added by TourismuBD.",
    practicalTip: accessDetails?.practicalTip || KHULNA_PLACE_NOTES[districtKey] || BARISHAL_PLACE_NOTES[districtKey] || RAJSHAHI_PLACE_NOTES[districtKey] || row.practical_tips || "Confirm local access before departure.",
    coordinates: verifiedCoordinates || (hasStoredCoordinates ? { lat: Number(row.latitude), lng: Number(row.longitude) } : fallbackCoordinates),
    roadAccessCoordinates: accessDetails?.roadAccessCoordinates || KHULNA_ROAD_ACCESS_COORDINATES[districtKey] || BARISHAL_ROAD_ACCESS_COORDINATES[districtKey] || RAJSHAHI_ROAD_ACCESS_COORDINATES[districtKey] || ROAD_ACCESS_COORDINATES[row.slug] || null,
    roadAccessLabel: accessDetails?.roadAccessLabel,
    roadRoutingProfile: "shortest-astar",
    coordinatesAreApproximate: !verifiedCoordinates && !hasStoredCoordinates,
    status: "published",
  };
  let defaultImage = item.image;
  Object.defineProperty(item, "image", {
    get() {
      return getCustomPlaceImage(row.slug) || getCustomPlaceImage(row.id) || defaultImage;
    },
    set(val) {
      defaultImage = val;
    },
    configurable: true,
    enumerable: true,
  });
  return item;
}

export function usePublishedTourism() {
  const [version, rerender] = useState(0);

  useEffect(() => {
    let active = true;

    // Sync custom media from shared server file
    syncCustomMediaFromServer();

    const refreshPublishedTourism = () => {
      if (!supabase) return;
      Promise.all([
        supabase.from("districts").select("id,district_code,name,division,slug,display_order").eq("status", "PUBLISHED").order("display_order").order("name"),
        supabase.from("places").select("id,district_id,name,slug,upazila_or_area,category,latitude,longitude,short_description,best_time,how_to_reach,practical_tips,last_verified_at,image_url,districts!inner(name,slug)").eq("status", "PUBLISHED").order("name"),
      ]).then(([districtResult, placeResult]) => {
        if (!active || districtResult.error || placeResult.error || !districtResult.data?.length) return;
        replacePublishedTourismData(
          districtResult.data.map((row) => ({ id: row.slug, name: row.name, division: row.division, slug: row.slug, status: "published" })),
          placeResult.data.map(mapPlace),
        );
        rerender((value) => value + 1);
      }).catch(() => {});
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        syncCustomMediaFromServer();
        refreshPublishedTourism();
      }
    };

    refreshPublishedTourism();
    window.addEventListener("focus", refreshPublishedTourism);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    // Live update when admin saves any media locally or via broadcast
    const onMediaUpdated = () => {
      refreshPublishedTourism();
      rerender((v) => v + 1);
    };
    window.addEventListener("tourismubd-media-updated", onMediaUpdated);

    // Supabase Realtime subscription on places table
    let channel = null;
    if (supabase) {
      try {
        channel = supabase
          .channel("tourism-places-live-channel")
          .on("postgres_changes", { event: "*", schema: "public", table: "places" }, () => {
            refreshPublishedTourism();
          })
          .subscribe();
      } catch {}
    }

    return () => {
      active = false;
      window.removeEventListener("focus", refreshPublishedTourism);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("tourismubd-media-updated", onMediaUpdated);
      if (channel && supabase) {
        try { supabase.removeChannel(channel); } catch {}
      }
    };
  }, []);

  return version;
}
