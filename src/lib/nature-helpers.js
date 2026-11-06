/**
 * Classification helpers for Water Bodies and Mountain / Hill spots
 */

export function isWaterBodyPlace(place) {
  if (!place) return false;
  const text = `${place.category || ""} ${place.name || ""} ${place.area || ""} ${place.shortDescription || ""} ${place.description || ""}`.toLowerCase();
  return (
    /\b(river|rivers|water|waterbody|waterbodies|waterway|waterways|waterfront|riverfront|haor|lake|lakes|beel|bil|waterfall|waterfalls|falls|fountain|spring|jharna|jhorna|beach|beaches|coast|coastal|ghat|sea|stream|streams|creek|cascade|island|islands|char|dwip|dip|confluence|wetland|wetlands|swamp|marsh|dighi|sagar|shagor|pukur|pond|canal|canals|khal|khari|chhara|chara|port|bay|estuary|reservoir|dam|ocean)\b/i.test(text) ||
    /(নদী|হাওর|লেক|বিল|ঝর্ণা|ঝরনা|সৈকত|সাগর|দীঘি|দিঘি|ঘাট|জলাশয়|দ্বীপ|চর|মোহনা|খাল|পুকুর)/.test(text)
  );
}

export function isMountainPlace(place) {
  if (!place) return false;
  const text = `${place.category || ""} ${place.name || ""} ${place.area || ""} ${place.shortDescription || ""} ${place.description || ""}`.toLowerCase();
  return (
    /\b(hill|hills|hillock|mountain|mountains|pahar|pahad|peak|peaks|ridge|valley|valleys|viewpoint|tila|teela|cave|caves|guha|cliff|cliffs|pass|plateau|highland|highlands|gorge|canyon|rock|rocks|crag|trek|trail|summit|slope|tea garden|tea gardens|tea estate|tea landscape|nature and landscape|border landscape|hills and landscape)\b/i.test(text) ||
    /(পাহাড়|পাহাড়|পর্বত|চূড়া|চূড়া|টিলা|উপত্যকা|গুহা|শৈল)/.test(text)
  );
}

