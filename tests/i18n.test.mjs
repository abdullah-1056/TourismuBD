import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_LANGUAGE,
  DISTRICTS_BN,
  DIVISIONS_BN,
  SUPPORTED_LANGUAGES,
  formatCount,
  t,
  toBengaliNumber,
  translateArea,
  translateBestTimeRecommended,
  translateBestTimeWhy,
  translateCategory,
  translateCaution,
  translateDistrict,
  translateDivision,
  translateHowToReach,
  translatePlaceDescription,
  translatePlaceName,
} from "../src/lib/i18n.js";
import { districts } from "../src/data/tourism.js";

test("i18n module provides supported languages and defaults", () => {
  assert.equal(DEFAULT_LANGUAGE, "en");
  assert.equal(SUPPORTED_LANGUAGES.length, 2);
  assert.equal(SUPPORTED_LANGUAGES[0].code, "en");
  assert.equal(SUPPORTED_LANGUAGES[1].code, "bn");
});

test("t() returns expected strings in English and Bangla", () => {
  assert.equal(t("nav.places", "en"), "Places");
  assert.equal(t("nav.places", "bn"), "দর্শনীয় স্থান");

  assert.equal(t("map.filterWater", "en"), "🌊 Water Bodies");
  assert.equal(t("map.filterWater", "bn"), "🌊 জলাশয় ও নদী");

  assert.equal(t("map.filterMountain", "en"), "⛰️ Mountain & Hills");
  assert.equal(t("map.filterMountain", "bn"), "⛰️ পাহাড় ও পর্বত");

  assert.equal(t("placeCard.addToTrip", "en"), "Add to trip");
  assert.equal(t("placeCard.addToTrip", "bn"), "ভ্রমণে যোগ করুন");

  // Fallback for missing key returns key itself
  assert.equal(t("non.existent.key", "bn"), "non.existent.key");
});

test("translateDivision translates all 8 Bangladesh divisions to standard Bengali", () => {
  const divisions = ["Barishal", "Chattogram", "Dhaka", "Khulna", "Mymensingh", "Rajshahi", "Rangpur", "Sylhet"];
  for (const div of divisions) {
    const bnName = translateDivision(div, "bn");
    assert.ok(bnName && bnName !== div, `Division ${div} must have Bengali translation, got: ${bnName}`);
    assert.equal(DIVISIONS_BN[div], bnName);
    assert.equal(translateDivision(div, "en"), div);
  }
});

test("translateDistrict translates all 64 Bangladesh districts to standard Bengali", () => {
  assert.equal(districts.length, 64, "There must be 64 districts in tourism data");
  for (const dist of districts) {
    const slug = dist.slug || dist.id;
    const name = dist.name;
    const bnFromSlug = translateDistrict(slug, "bn");
    const bnFromName = translateDistrict(name, "bn");

    assert.ok(bnFromSlug, `District slug ${slug} must translate to Bengali`);
    assert.ok(bnFromName, `District name ${name} must translate to Bengali`);
    assert.notEqual(bnFromSlug, slug, `District slug ${slug} should not remain untranslated in Bengali`);
  }

  // Check specific notable districts
  assert.equal(translateDistrict("chattogram", "bn"), "চট্টগ্রাম");
  assert.equal(translateDistrict("coxs-bazar", "bn"), "কক্সবাজার");
  assert.equal(translateDistrict("dhaka", "bn"), "ঢাকা");
  assert.equal(translateDistrict("sylhet", "bn"), "সিলেট");
  assert.equal(translateDistrict("moulvibazar", "bn"), "মৌলভীবাজার");
  assert.equal(translateDistrict("bandarban", "bn"), "বান্দরবান");
});

test("translateCategory and translatePlaceName translate correctly", () => {
  assert.equal(translateCategory("Riverfront and waterway", "bn"), "নদী ও নৌপথ");
  assert.equal(translateCategory("Lake", "bn"), "লেক ও হ্রদ");
  assert.equal(translateCategory("Coast and nature", "bn"), "উপকূল ও প্রকৃতি");

  assert.equal(translatePlaceName("Patenga Sea Beach", "bn"), "পতেঙ্গা সমুদ্র সৈকত");
  assert.equal(translatePlaceName("Foy's Lake", "bn"), "ফয়েজ লেক");
  assert.equal(translatePlaceName("Ratargul Swamp Forest", "bn"), "রাতারগুল সোয়াম্প ফরেস্ট");
  assert.equal(translatePlaceName("Jaflong", "bn"), "জাফলং");
  assert.equal(translatePlaceName("Sundarbans", "bn"), "সুন্দরবন");

  // In English mode, keeps original name
  assert.equal(translatePlaceName("Patenga Sea Beach", "en"), "Patenga Sea Beach");
});

test("toBengaliNumber and formatCount format numbers properly in Bengali", () => {
  assert.equal(toBengaliNumber(0), "০");
  assert.equal(toBengaliNumber(123456789), "১২৩৪৫৬৭৮৯");
  assert.equal(toBengaliNumber(64), "৬৪");

  assert.equal(formatCount(15, "en", "places", "টি স্থান"), "15 places");
  assert.equal(formatCount(15, "bn", "places", "টি স্থান"), "১৫ টি স্থান");
});

test("travelMap translations exist for both English and Bangla", () => {
  assert.equal(t("travelMap.trackerBadge", "en"), "Bangladesh Travel Tracker");
  assert.equal(t("travelMap.trackerBadge", "bn"), "বাংলাদেশ ট্রাভেল ট্র্যাকার");

  assert.equal(t("travelMap.tickDistrictsTitle", "en"), "Tick the districts you have visited");
  assert.equal(t("travelMap.tickDistrictsTitle", "bn"), "ভ্রমণ করা জেলাগুলোতে টিক দিন");

  assert.equal(t("travelMap.resetMap", "en"), "Reset Map");
  assert.equal(t("travelMap.resetMap", "bn"), "মানচিত্র রিসেট");

  assert.equal(t("travelMap.all64", "en"), "All 64");
  assert.equal(t("travelMap.all64", "bn"), "সব ৬৪ জেলা");
});

test("waterChoices translations exist for both English and Bangla", () => {
  assert.equal(t("waterChoices.eyebrow", "en"), "Explore by water");
  assert.equal(t("waterChoices.eyebrow", "bn"), "জলপথে ভ্রমণ");
  assert.equal(t("waterChoices.houseboatTitle", "en"), "Find a Houseboat");
  assert.equal(t("waterChoices.houseboatTitle", "bn"), "হাউসবোট খুঁজুন");
  assert.equal(t("waterChoices.smallBoatTitle", "en"), "Rent a Small Boat");
  assert.equal(t("waterChoices.smallBoatTitle", "bn"), "ছোট নৌকা ভাড়া নিন");
});

test("translateArea, translatePlaceDescription, and travel advice translate to Bengali", () => {
  // Area translations
  assert.equal(translateArea("Cox's Bazar", "bn"), "কক্সবাজার");
  assert.equal(translateArea("Gowainghat", "bn"), "গোয়াইনঘাট");
  assert.equal(translateArea("Kuakata", "bn"), "কুয়াকাটা");
  assert.equal(translateArea("Gowainghat", "en"), "Gowainghat");

  // Place descriptions
  const samplePlace1 = {
    name: "Adinath Temple",
    district: "Cox's Bazar",
    shortDescription: "Adinath Temple is a listed visitor destination in Cox's Bazar.",
  };
  const descBn1 = translatePlaceDescription(samplePlace1, "bn");
  assert.equal(descBn1, "আদিনাথ মন্দির কক্সবাজার জেলার একটি অন্যতম জনপ্রিয় দর্শনীয় স্থান।");

  const samplePlace2 = {
    name: "Achranga Dighi",
    district: "Joypurhat",
    shortDescription: "Achranga Dighi is a listed visitor destination in Joypurhat.",
  };
  const descBn2 = translatePlaceDescription(samplePlace2, "bn");
  assert.equal(descBn2, "আঁচরঙ্গা দিঘি জয়পুরহাট জেলার একটি অন্যতম জনপ্রিয় দর্শনীয় স্থান।");

  // Recommended time, Why, Caution, How to reach
  assert.equal(translateBestTimeRecommended("November to March", "bn"), "নভেম্বর থেকে মার্চ");
  assert.equal(translateBestTimeRecommended("Year-round", "bn"), "সারা বছর");

  assert.equal(
    translateBestTimeWhy("Drier weather is generally more comfortable for local travel.", "bn"),
    "শীতকালীন শুষ্ক আবহাওয়া স্থানীয় ভ্রমণের জন্য সবচেয়ে আরামদায়ক।"
  );

  assert.equal(
    translateCaution("Confirm access and local conditions before travel.", "bn"),
    "যাত্রার পূর্বে স্থানীয় যোগাযোগ ব্যবস্থা ও বর্তমান পরিবেশের খোঁজ নিন।"
  );

  const sampleReach = {
    howToReach: "Travel from Cox's Bazar town using available local transport and confirm the final approach locally.",
  };
  assert.equal(
    translateHowToReach(sampleReach, "bn"),
    "কক্সবাজার জেলা শহর থেকে সিএনজি, বাস বা স্থানীয় বাহনযোগে যাওয়া যায়; শেষ পথের দিকনির্দেশনা স্থানীয়দের কাছ থেকে জেনে নিন।"
  );
});
