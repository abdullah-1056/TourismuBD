import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Binoculars,
  Sailboat,
  CalendarDays,
  Camera,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  CircleParking,
  Clock3,
  Compass,
  Sparkles,
  Maximize2,
  Flag,
  Heart,
  Hotel,
  Map,
  MapPin,
  MapPinned,
  LogOut,
  Menu,
  MessageSquare,
  MessageCircle,
  MoreHorizontal,
  Mountain,
  Moon,
  Plus,
  Route,
  Search,
  Send,
  Share2,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  Trash2,
  Pencil,
  Package,
  ShoppingBag,
  Store,
  UserRoundX,
  UserCheck,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import {
  curatedItineraries,
  DISTRICT_CENTER_COORDINATES,
  districts,
  guides,
  places,
  placesVersion,
  suggestedPlacesForDistrict,
  waterListings,
  getSystemBanner,
} from "./data/tourism.js";
import { formatRoadRouteStatus, loadRoadRoute, resolveRouteWaypoints, ROUTE_OUTSIDE_BANGLADESH, routeStaysInsideBangladesh } from "./lib/road-map.js";
import { findNearbyPlaces, maxTripDaysForPlaceCount, planDailyRoute, planDistrictTour, planRoute } from "./lib/route.js";
import { loadSavedTrips, saveTrip, loadUserOrders, saveUserOrder, cancelUserOrder, loadSeenOrderIds, saveSeenOrderIds } from "./lib/storage.js";
import { combineShopProducts, searchShopProducts } from "./lib/shop.js";
import { supabase } from "./lib/supabase.js";
import { usePublishedTourism } from "./lib/tourism-content.js";
import { viewRequiresAuthentication } from "./lib/access.js";
import { BangladeshMapFloatingButton, BangladeshMapModal } from "./BangladeshMapFeature.jsx";
import { BangladeshTravelMapPage } from "./BangladeshTravelMapPage.jsx";
import { LanguageSwitcher, useLanguage } from "./lib/LanguageContext.jsx";
import { getPlaceGallery } from "./data/place-galleries.js";

const NAV = [
  ["feed", "Timeline", MessageSquare],
  ["home", "Discover", Compass],
  ["explore", "Places", MapPin],
  ["travel-map", "Travel map", MapPinned],
  ["trip", "My trip", Route],
  ["services", "Local services", UsersRound],
  ["people", "People", Search],
  ["shop", "Shop", ShoppingBag],
];

const POST_REPORT_REASONS = [
  "Spam or scam",
  "Harassment or bullying",
  "Insulting or demeaning a person",
  "Hate speech",
  "Religious hate or disrespect",
  "Discrimination",
  "Violence or threats",
  "Adult or sexually explicit content",
  "Nudity or sexual content",
  "Self-harm or suicide",
  "False or misleading information",
  "Illegal activity",
  "Impersonation",
  "Privacy violation",
  "Copyright or intellectual property violation",
  "Other inappropriate content",
];

const SERVICE_META = {
  GUIDE: { label: "Guides", providerType: "GUIDE", icon: CircleUserRound },
  HOUSEBOAT: { label: "Houseboats", providerType: "HOUSEBOAT_OWNER", icon: Sailboat },
  SMALL_BOAT: { label: "Small boats", providerType: "SMALL_BOAT_OWNER", icon: Sailboat },
  RESORT_HOTEL: { label: "Resorts & hotels", providerType: "RESORT_HOTEL_OWNER", icon: Hotel },
  CAR_TRANSPORT: { label: "Car & transport", providerType: "CAR_TRANSPORT_OWNER", icon: CarFront },
  PARKING: { label: "Parking", providerType: "PARKING_OWNER", icon: CircleParking },
  TOUR_AGENCY: { label: "Area tours", providerType: "TOUR_AGENCY_ORGANIZATION", icon: MapPinned },
};

const PROVIDER_ROLES = [
  ["TOUR_GUIDE", "Tour Guide"], ["HOUSEBOAT_OWNER", "Houseboat Owner"], ["SMALL_BOAT_OWNER", "Small Boat Owner"],
  ["RESORT_HOTEL_OWNER", "Resort / Hotel Owner"], ["CAR_TRANSPORT_OWNER", "Car / Transport Owner"], ["PARKING_OWNER", "Parking Owner"], ["TOUR_AGENCY", "Tour Agency / Area Tour"],
];

const PROVIDER_TYPE_LABELS = { GUIDE: "Tour Guide", BUSINESS_OWNER: "Business", TOUR_AGENCY_ORGANIZATION: "Tour Agency / Area Tour", ...Object.fromEntries(PROVIDER_ROLES.map(([role, label]) => [role, label])) };
const PROVIDER_ROLE_LABELS_BN = {
  TOUR_GUIDE: "ট্যুর গাইড",
  HOUSEBOAT_OWNER: "হাউসবোটের মালিক",
  SMALL_BOAT_OWNER: "ছোট ট্রলার / নৌকার মালিক",
  RESORT_HOTEL_OWNER: "রিসোর্ট / হোটেল মালিক",
  CAR_TRANSPORT_OWNER: "গাড়ি / বাহন সেবা মালিক",
  PARKING_OWNER: "পার্কিং মালিক",
  TOUR_AGENCY: "ট্যুর এজেন্সি / লোকাল ট্যুর",
};
const DETAIL_FIELD_LABELS_BN = {
  District: "জেলা",
  Email: "ইমেইল",
  "Phone number": "ফোন নম্বর",
  "Blood group": "রক্তের গ্রুপ",
  Gender: "লিঙ্গ",
  "Working place": "কর্মস্থল",
  Hobby: "শখ",
  "Present address": "বর্তমান ঠিকানা",
  "Permanent address": "স্থায়ী ঠিকানা",
};
const PROFILE_FIELDS = "full_name,email,phone,phone_visible,avatar_url,profile_photo_urls,bio,district,blood_group,gender,present_address,permanent_address,working_place,hobby,phone_edit_count,email_edit_count,followers_visible";
const LEGACY_PROFILE_FIELDS = "full_name,email,phone,phone_visible,avatar_url";
const PUBLIC_PERSON_FIELDS = "id,full_name,role,avatar_url,profile_photo_urls,bio,district,email,phone,blood_group,gender,working_place,hobby,present_address,permanent_address,follower_count,followers_visible,rating_average,rating_count";
const fallbackImage = `${import.meta.env.BASE_URL}images/sylhet-waterway.png`;
const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL || (import.meta.env.DEV ? "http://127.0.0.1:5176" : "");
const PROFILE_DETAILS_DEFAULTS = { profile_photo_urls: [], bio: "", district: "", blood_group: "", gender: "", present_address: "", permanent_address: "", working_place: "", hobby: "", phone_edit_count: 0, email_edit_count: 0, followers_visible: true };
const PROFILE_DETAIL_FIELDS = [["District", "district"], ["Email", "email"], ["Phone number", "phone"], ["Blood group", "blood_group"], ["Gender", "gender"], ["Working place", "working_place"], ["Hobby", "hobby"], ["Present address", "present_address"], ["Permanent address", "permanent_address"]];
const RESTORABLE_VIEWS = new Set(["home", "feed", "explore", "travel-map", "trip", "services", "people", "shop", "provider", "booking-requests", "traveler", "business", "business-catalog", "account-about", "provider-ratings"]);
const HIDDEN_POSTS_STORAGE_KEY = "tourismubd.hidden_social_posts";

function getHiddenPostIds() {
  try {
    const raw = window.localStorage.getItem(HIDDEN_POSTS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function setHiddenSocialPost(postId, hidden = true) {
  if (!postId) return;
  try {
    const existing = getHiddenPostIds();
    if (hidden) existing.add(postId);
    else existing.delete(postId);
    window.localStorage.setItem(HIDDEN_POSTS_STORAGE_KEY, JSON.stringify(Array.from(existing)));
  } catch { /* ignore storage errors */ }
}

function isPostHidden(postId, post) {
  if (post && typeof post.is_hidden === "boolean") {
    if (!post.is_hidden && postId) setHiddenSocialPost(postId, false);
    return post.is_hidden;
  }
  if (!postId) return false;
  return getHiddenPostIds().has(postId);
}

function viewFromLocation() {
  const view = new URLSearchParams(window.location.search).get("view");
  return RESTORABLE_VIEWS.has(view) ? view : "home";
}

function updateBrowserView(view, replace = false) {
  if (!RESTORABLE_VIEWS.has(view)) return;
  const url = new URL(window.location.href);
  if (view === "home") url.searchParams.delete("view");
  else url.searchParams.set("view", view);
  window.history[replace ? "replaceState" : "pushState"]({ ...window.history.state, tourismuBDView: view }, "", url);
}

function useSessionState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.sessionStorage.getItem(key);
      return saved === null ? initialValue : JSON.parse(saved);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try { window.sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Session storage can be unavailable. */ }
  }, [key, value]);

  return [value, setValue];
}

async function loadProfile(userId, extraFields = "") {
  const result = await supabase.from("profiles").select(`${PROFILE_FIELDS}${extraFields}`).eq("id", userId).maybeSingle();
  if (!result.error || !/profiles\.(profile_photo_urls|bio|district|blood_group|gender|present_address|permanent_address|working_place|hobby|phone_edit_count|email_edit_count|followers_visible)/.test(result.error.message)) return { ...result, detailsAvailable: true };
  const legacyResult = await supabase.from("profiles").select(`${LEGACY_PROFILE_FIELDS}${extraFields}`).eq("id", userId).maybeSingle();
  return { ...legacyResult, data: legacyResult.data ? { ...PROFILE_DETAILS_DEFAULTS, ...legacyResult.data } : null, detailsAvailable: false };
}

function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const source = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => { URL.revokeObjectURL(source); resolve(video.duration); };
    video.onerror = () => { URL.revokeObjectURL(source); reject(new Error("The selected video could not be read.")); };
    video.src = source;
  });
}

function authErrorMessage(error, action) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  if (message && message !== "{}") return message;
  return `Supabase could not ${action}${error?.status ? ` (error ${error.status})` : ""}. Open Authentication > Logs and check the newest event.`;
}

function missingProductNameColumn(error) {
  return Boolean(error && /product_name/i.test(error.message) && /does not exist|schema cache|could not find/i.test(error.message));
}

function useAuth() {
  const [auth, setAuth] = useState({ user: null });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      if (
        hash.includes("type=recovery") ||
        search.includes("type=recovery") ||
        search.includes("admin-recovery=1") ||
        hash.includes("otp_expired") ||
        hash.includes("error_code=otp_expired") ||
        hash.includes("invalid+or+has+expired") ||
        (hash.includes("error=access_denied") && hash.includes("error_description="))
      ) {
        const adminUrl = import.meta.env.VITE_ADMIN_APP_URL || import.meta.env.VITE_ADMIN_URL || (import.meta.env.DEV ? "http://127.0.0.1:5176" : "");
        if (adminUrl) {
          const target = new URL(adminUrl, window.location.origin);
          target.searchParams.set("admin-recovery", "1");
          window.location.replace(`${target.toString()}${hash}`);
          return;
        }
      }
    }

    if (!supabase) return;
    let active = true;
    const refresh = async (session) => {
      if (active) setAuth({ user: session?.user || null });
    };
    supabase.auth.getSession().then(({ data }) => refresh(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        const adminUrl = import.meta.env.VITE_ADMIN_APP_URL || import.meta.env.VITE_ADMIN_URL || (import.meta.env.DEV ? "http://127.0.0.1:5176" : "");
        if (adminUrl) {
          const target = new URL(adminUrl, window.location.origin);
          target.searchParams.set("admin-recovery", "1");
          window.location.replace(`${target.toString()}${window.location.hash}`);
          return;
        }
      }
      refresh(session);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  return auth;
}

function AuthDialog({ onClose, notify, onAuthenticated }) {
  const { lang } = useLanguage();
  const dialogRef = useRef(null);
  const [mode, setMode] = useState("signin");
  const [accountKind, setAccountKind] = useState("TRAVELER");
  const [providerRole, setProviderRole] = useState("TOUR_GUIDE");
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.open && dialog.close();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const values = new FormData(event.currentTarget);
    const email = values.get("email");
    const password = values.get("password");
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: values.get("fullName"), role: accountKind === "TRAVELER" ? "TRAVELER" : accountKind === "BUSINESS" ? "BUSINESS_OWNER" : providerRole, provider_type: accountKind === "PROVIDER" ? providerRole : null, business_name: accountKind === "BUSINESS" ? values.get("businessName") : null, district: accountKind === "BUSINESS" ? values.get("district") : null, phone: values.get("phone") || null } },
        });
    if (result.error) return setError(authErrorMessage(result.error, mode === "signin" ? "sign you in" : "create the account"));
    notify(mode === "signin" ? (lang === "bn" ? "সাইন ইন সফল হয়েছে।" : "Signed in.") : (lang === "bn" ? "অ্যাকাউন্ট তৈরি হয়েছে। নিশ্চিতকরণ প্রয়োজন হলে ইমেইল চেক করুন।" : "Account created. Check your email if confirmation is required."));
    if (result.data.session && result.data.user) await onAuthenticated(result.data.user);
    onClose();
  };

  const google = async () => {
    const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (oauthError) setError(authErrorMessage(oauthError, "start Google sign-in"));
  };

  return (
    <dialog ref={dialogRef} className="provider-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal auth-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} aria-labelledby="auth-title">
        <button type="button" className="icon-button close" onClick={onClose} aria-label={lang === "bn" ? "বন্ধ করুন" : "Close"}><X /></button>
        <p className="eyebrow">{lang === "bn" ? "TourismuBD অ্যাকাউন্ট" : "TourismuBD account"}</p>
        <h2 id="auth-title">{mode === "signin" ? (lang === "bn" ? "স্বাগতম" : "Welcome back") : (lang === "bn" ? "নতুন অ্যাকাউন্ট তৈরি" : "Create an account")}</h2>
        <div className="segmented auth-switch"><button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>{lang === "bn" ? "সাইন ইন" : "Sign in"}</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>{lang === "bn" ? "অ্যাকাউন্ট তৈরি" : "Create account"}</button></div>
        {mode === "signup" ? <><label>{lang === "bn" ? "পুরো নাম" : "Full name"}<input name="fullName" required autoComplete="name" /></label><label>{lang === "bn" ? "অ্যাকাউন্টের ধরন" : "Account type"}<select value={accountKind} onChange={(event) => setAccountKind(event.target.value)}><option value="TRAVELER">{lang === "bn" ? "ভ্রমণকারী" : "Traveler"}</option><option value="PROVIDER">{lang === "bn" ? "সেবা প্রদানকারী" : "Provider"}</option><option value="BUSINESS">{lang === "bn" ? "উদ্যোক্তা / ব্যবসা" : "Business"}</option>{/* <option value="BUSINESS">Business</option> */}</select></label>{accountKind === "PROVIDER" ? <><label>{lang === "bn" ? "সেবার ধরন" : "Provider type"}<select value={providerRole} onChange={(event) => setProviderRole(event.target.value)}>{PROVIDER_ROLES.map(([value, label]) => <option value={value} key={value}>{lang === "bn" ? (PROVIDER_ROLE_LABELS_BN[value] || label) : label}</option>)}</select></label><label>{lang === "bn" ? "ফোন নম্বর" : "Phone number"}<input name="phone" required type="tel" inputMode="tel" placeholder="01XXXXXXXXX" pattern="(\\+880|0)1[3-9][0-9]{8}" />{/* Phone number<input name="phone" required type="tel" */}</label></> : accountKind === "BUSINESS" ? <><label>{lang === "bn" ? "প্রতিষ্ঠানের নাম" : "Business name"}<input name="businessName" required minLength="2" maxLength="120" placeholder={lang === "bn" ? "আপনার দোকান বা ব্র্যান্ডের নাম" : "Your shop or brand name"} /></label><label>{lang === "bn" ? "জেলা" : "District"}<input name="district" placeholder={lang === "bn" ? "প্রতিষ্ঠানের জেলা" : "Business district"} /></label><label>{lang === "bn" ? "ফোন নম্বর" : "Phone number"}<input name="phone" required type="tel" inputMode="tel" placeholder="01XXXXXXXXX" pattern="(\\+880|0)1[3-9][0-9]{8}" />{/* Phone number<input name="phone" required type="tel" */}</label></> : <label>{lang === "bn" ? "ফোন নম্বর" : "Phone number"}<input name="phone" required type="tel" inputMode="tel" placeholder="01XXXXXXXXX" pattern="(\\+880|0)1[3-9][0-9]{8}" />{/* Phone number<input name="phone" required type="tel" */}</label>}</> : null}
        <label>{lang === "bn" ? "ইমেইল" : "Email"}<input name="email" required type="email" autoComplete="email" /></label>
        <label>{lang === "bn" ? "পাসওয়ার্ড" : "Password"}<input name="password" required type="password" minLength="8" autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="button primary wide">{mode === "signin" ? (lang === "bn" ? "সাইন ইন" : "Sign in") : (lang === "bn" ? "অ্যাকাউন্ট তৈরি করুন" : "Create account")}</button>
        {mode === "signin" ? <button type="button" className="button secondary wide google-button" onClick={google}>{lang === "bn" ? "গুগল দিয়ে চালিয়ে যান" : "Continue with Google"}</button> : null}
      </form>
    </dialog>
  );
}

function DeactivateAccountDialog({ onClose, onConfirm }) {
  const { lang } = useLanguage();
  const dialogRef = useRef(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.open && dialog.close();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const message = await onConfirm(new FormData(event.currentTarget).get("password"));
    setSubmitting(false);
    if (message) setError(message);
  };

  return <dialog ref={dialogRef} className="provider-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} aria-labelledby="deactivate-title">
      <button type="button" className="icon-button close" onClick={onClose} aria-label={lang === "bn" ? "বন্ধ করুন" : "Close"}><X /></button>
      <p className="eyebrow">{lang === "bn" ? "অ্যাকাউন্ট নিরাপত্তা" : "Account security"}</p>
      <h2 id="deactivate-title">{lang === "bn" ? "অ্যাকাউন্ট নিষ্ক্রিয় করুন" : "Deactivate account"}</h2>
      <p>{lang === "bn" ? "পুনরায় সাইন ইন না করলে ৩ মাস পর আপনার অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলা হবে।" : "Your account will be permanently deleted after three months unless you sign in again."}</p>
      <label>{lang === "bn" ? "পাসওয়ার্ড" : "Password"}<input name="password" type="password" required autoComplete="current-password" autoFocus /></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button primary wide" disabled={submitting}>{submitting ? (lang === "bn" ? "পাসওয়ার্ড যাচাই করা হচ্ছে..." : "Checking password...") : (lang === "bn" ? "অ্যাকাউন্ট নিষ্ক্রিয় করুন" : "Deactivate account")}</button>
      <button type="button" className="button secondary wide deactivation-cancel" onClick={onClose} disabled={submitting}>{lang === "bn" ? "বাতিল" : "Cancel"}</button>
    </form>
  </dialog>;
}

function SignOutDialog({ onClose, onConfirm }) {
  const { lang } = useLanguage();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.open && dialog.close();
  }, []);

  return <dialog ref={dialogRef} className="provider-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal signout-modal" onMouseDown={(event) => event.stopPropagation()} aria-labelledby="signout-title">
      <button type="button" className="icon-button close" onClick={onClose} aria-label={lang === "bn" ? "বন্ধ করুন" : "Close"}><X /></button>
      <p className="eyebrow">{lang === "bn" ? "অ্যাকাউন্ট" : "Account"}</p>
      <h2 id="signout-title">{lang === "bn" ? "সাইন আউট করবেন?" : "Sign out?"}</h2>
      <p>{lang === "bn" ? "অ্যাকাউন্ট ব্যবস্থাপনার জন্য আপনাকে পুনরায় সাইন ইন করতে হবে।" : "You will need to sign in again to manage your account."}</p>
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>{lang === "bn" ? "না" : "No"}</button><button type="button" className="button primary" onClick={onConfirm}>{lang === "bn" ? "হ্যাঁ, সাইন আউট করুন" : "Yes, sign out"}</button></div>
    </section>
  </dialog>;
}

function ProfileDetailsForm({ user, profile, provider, notify, onSaved }) {
  const { lang, translateDistrict } = useLanguage();
  const save = async (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const email = values.get("email").trim();
    const phone = values.get("phone").trim();
    const providerName = values.get("providerName")?.trim();
    const providerServiceName = values.get("providerServiceName")?.trim();
    if (!email || !phone) return notify(lang === "bn" ? "ইমেইল এবং ফোন নম্বর আবশ্যক।" : "Email and phone number are required.");
    if (provider && (!providerName || providerName.length < 2)) return notify(lang === "bn" ? "কমপক্ষে দুই অক্ষরের একটি নাম লিখুন।" : "Add a provider name with at least two characters.");
    const emailChanged = email !== (profile.email || user.email || "");
    const phoneChanged = phone !== (profile.phone || "");
    if (emailChanged && profile.email_edit_count >= 3) return notify(lang === "bn" ? "ইমেইল কেবল ৩ বার পরিবর্তন করা যাবে।" : "Email can only be changed three times.");
    if (phoneChanged && profile.phone_edit_count >= 3) return notify(lang === "bn" ? "ফোন নম্বর কেবল ৩ বার পরিবর্তন করা যাবে।" : "Phone number can only be changed three times.");
    if (emailChanged) {
      const { error: authError } = await supabase.auth.updateUser({ email });
      if (authError) return notify(authErrorMessage(authError, "update your email"));
    }
    const payload = { email, phone, avatar_url: profile.avatar_url || null, followers_visible: values.get("followers_visible") === "on", ...(provider ? { full_name: providerName } : {}), ...Object.fromEntries(["bio", "district", "blood_group", "gender", "present_address", "permanent_address", "working_place", "hobby"].map((name) => [name, values.get(name) || null])) };
    const { data, error } = await supabase.from("profiles").update(payload).eq("id", user.id).select(PROFILE_FIELDS).single();
    if (error) return notify(error.message);
    if (provider) {
      const { error: providerError } = await supabase.from("providers").update({ service_name: providerServiceName || null, bio: payload.bio, photo_url: payload.avatar_url, contact_email: email, contact_phone: phone }).eq("user_id", user.id);
      if (providerError) return notify(providerError.message);
    }
    onSaved(data);
    notify(lang === "bn" ? "প্রোফাইল বিবরণ সংরক্ষিত হয়েছে।" : "Profile details saved.");
  };

  return <form className="profile-editor" onSubmit={save}>
    <h2>{lang === "bn" ? "পরিচিতি ও বিবরণ" : "About"}</h2>
    {provider ? <><label>{lang === "bn" ? "সেবা প্রদানকারীর নাম" : "Provider name"}<input name="providerName" required minLength="2" maxLength="120" defaultValue={profile.full_name || ""} placeholder={lang === "bn" ? "আপনার নাম বা পরিচিতি" : "Your name or provider identity"} /></label><label>{lang === "bn" ? "সেবার নাম" : "Service name"}<input name="providerServiceName" minLength="2" maxLength="120" defaultValue={provider.service_name || ""} placeholder={lang === "bn" ? "হোটেল, গাইড সার্ভিস, পরিবহন বা ট্রাভেল এজেন্সি" : "Hotel, guide service, transport company, or agency"} /></label></> : null}
    <label>{lang === "bn" ? "ইমেইল" : "Email"}<input name="email" required type="email" defaultValue={profile.email || user.email || ""} /></label>
    <label>{lang === "bn" ? "ফোন নম্বর" : "Phone number"}<input name="phone" required type="tel" inputMode="tel" pattern="(\\+880|0)1[3-9][0-9]{8}" defaultValue={profile.phone || ""} placeholder="01XXXXXXXXX" /></label>
    <label className="profile-editor-wide">{lang === "bn" ? "সংক্ষিপ্ত বিবরণ" : "Bio"}<textarea name="bio" rows="4" defaultValue={profile.bio || ""} placeholder={lang === "bn" ? "ভ্রমণকারীদের নিজের সম্পর্কে কিছু বলুন..." : "Tell travelers a little about yourself."} /></label>
    <label>{lang === "bn" ? "রক্তের গ্রুপ" : "Blood group"}<select name="blood_group" defaultValue={profile.blood_group || ""}><option value="">{lang === "bn" ? "যোগ করা হয়নি" : "Not added"}</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => <option key={group}>{group}</option>)}</select></label>
    <label>{lang === "bn" ? "লিঙ্গ" : "Gender"}<select name="gender" defaultValue={profile.gender || ""}><option value="">{lang === "bn" ? "প্রকাশে অনিচ্ছুক" : "Prefer not to say"}</option><option value="Female">{lang === "bn" ? "মহিলা" : "Female"}</option><option value="Male">{lang === "bn" ? "পুরুষ" : "Male"}</option><option value="Non-binary">{lang === "bn" ? "অন্যান্য" : "Non-binary"}</option></select></label>
    <label>{lang === "bn" ? "জেলা" : "District"}<select name="district" defaultValue={profile.district || ""}><option value="">{lang === "bn" ? "যোগ করা হয়নি" : "Not added"}</option>{districts.map((item) => <option key={item.slug} value={item.name}>{translateDistrict(item.name)}</option>)}</select></label>
    <label>{lang === "bn" ? "কর্মস্থল (প্রতিষ্ঠান)" : "Working place (company)"}<input name="working_place" defaultValue={profile.working_place || ""} placeholder={lang === "bn" ? "কোম্পানি বা প্রতিষ্ঠান" : "Company or organization"} /></label>
    <label>{lang === "bn" ? "শখ" : "Hobby"}<input name="hobby" defaultValue={profile.hobby || ""} placeholder={lang === "bn" ? "ফটোগ্রাফি, ট্রেকিং, ভ্রমণ ইত্যাদি" : "Photography, hiking, etc."} /></label>
    <label className="profile-editor-wide">{lang === "bn" ? "বর্তমান ঠিকানা" : "Present address"}<textarea name="present_address" rows="3" defaultValue={profile.present_address || ""} /></label>
    <label className="profile-editor-wide">{lang === "bn" ? "স্থায়ী ঠিকানা" : "Permanent address"}<textarea name="permanent_address" rows="3" defaultValue={profile.permanent_address || ""} /></label>
    <label className="profile-editor-wide check-label"><input name="followers_visible" type="checkbox" defaultChecked={profile.followers_visible !== false} />{lang === "bn" ? "আমার পাবলিক প্রোফাইলে অনুসারী সংখ্যা দেখান" : "Show my follower total on my public profile"}</label>
    <button className="button primary profile-editor-wide">{lang === "bn" ? "প্রোফাইল সংরক্ষণ করুন" : "Save profile"}</button>
  </form>;
}

function ProfileBio({ profile, fallback }) {
  const { lang, translateDistrict } = useLanguage();
  const details = PROFILE_DETAIL_FIELDS.map(([label, field]) => [
    lang === "bn" ? (DETAIL_FIELD_LABELS_BN[label] || label) : label,
    field === "district" ? translateDistrict(profile[field]) : profile[field],
  ]).filter(([, value]) => value);

  return <div className="profile-bio">
    <p>{profile.bio || fallback}</p>
    <details>
      <summary>{lang === "bn" ? "আরও দেখুন..." : "See more..."}</summary>
      {details.length ? <dl>{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p className="profile-bio-empty">{lang === "bn" ? "এখনো কোনো প্রোফাইল বিবরণ যোগ করা হয়নি।" : "No profile details added yet."}</p>}
    </details>
  </div>;
}

function PublicProfileDetails({ profile }) {
  const { lang, translateDistrict, toBengaliNumber } = useLanguage();
  const details = PROFILE_DETAIL_FIELDS.map(([label, field]) => [
    lang === "bn" ? (DETAIL_FIELD_LABELS_BN[label] || label) : label,
    field === "district" ? translateDistrict(profile[field]) : profile[field],
  ]).filter(([, value]) => value);
  const ratingCount = Number(profile.rating_count);
  const ratingAverage = Number(profile.rating_average);
  const hasRatingData = Number.isFinite(ratingCount);
  if (!details.length && !hasRatingData) return null;
  return <details className="public-profile-details"><summary>{lang === "bn" ? "আরও দেখুন..." : "See more..."}</summary><dl>{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}{hasRatingData ? <div className="provider-rating"><dt>{lang === "bn" ? "রেটিং" : "Provider rating"}</dt><dd><Star aria-hidden="true" /><b>{ratingCount ? (lang === "bn" ? toBengaliNumber(ratingAverage.toFixed(1)) : ratingAverage.toFixed(1)) : (lang === "bn" ? "এখনো কোনো রেটিং নেই" : "No ratings yet")}</b>{ratingCount ? <span>{toBengaliNumber(ratingCount)} {lang === "bn" ? "টি রেটিং" : (ratingCount === 1 ? "rating" : "ratings")}</span> : null}</dd></div> : null}</dl></details>;
}

function ProviderRating({ profile, className = "", isProvider = true }) {
  const { lang, toBengaliNumber } = useLanguage();
  const ratingCount = Number(profile.rating_count);
  const ratingAverage = Number(profile.rating_average);
  if (!isProvider || !Number.isFinite(ratingCount)) return null;
  return <p className={`provider-rating-summary ${className}`}><Star aria-hidden="true" /><b>{ratingCount ? (lang === "bn" ? toBengaliNumber(ratingAverage.toFixed(1)) : ratingAverage.toFixed(1)) : (lang === "bn" ? "এখনো কোনো রেটিং নেই" : "No ratings yet")}</b>{ratingCount ? <span>{toBengaliNumber(ratingCount)} {lang === "bn" ? "টি রেটিং" : (ratingCount === 1 ? "rating" : "ratings")}</span> : null}</p>;
}

function FollowerCount({ count = 0 }) {
  const { lang, toBengaliNumber } = useLanguage();
  return <p className="follower-count"><UsersRound />{toBengaliNumber(count)} {lang === "bn" ? "জন অনুসারী" : (count === 1 ? "follower" : "followers")}</p>;
}

function DashboardFollowerCount({ userId }) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let active = true;
    supabase.from("public_people").select("follower_count").eq("id", userId).maybeSingle().then(({ data }) => {
      if (active && data) setCount(data.follower_count || 0);
    });
    return () => { active = false; };
  }, [userId]);

  return count === null ? null : <FollowerCount count={count} />;
}

function FollowButton({ user, profileId, notify, onChanged }) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(Boolean(user && user.id !== profileId));

  useEffect(() => {
    if (!user || user.id === profileId) return setLoading(false);
    let active = true;
    supabase.from("profile_follows").select("follower_id").eq("follower_id", user.id).eq("following_id", profileId).maybeSingle().then(({ data, error }) => {
      if (!active) return;
      if (error) notify(error.message);
      setFollowing(Boolean(data));
      setLoading(false);
    });
    return () => { active = false; };
  }, [user?.id, profileId]);

  if (!user || user.id === profileId) return null;
  const { lang, toBengaliNumber } = useLanguage();
  const toggle = async () => {
    setLoading(true);
    const result = following
      ? await supabase.from("profile_follows").delete().eq("follower_id", user.id).eq("following_id", profileId)
      : await supabase.from("profile_follows").insert({ follower_id: user.id, following_id: profileId });
    if (result.error) { notify(result.error.message); setLoading(false); return; }
    setFollowing((current) => !current);
    setLoading(false);
    onChanged?.(following ? -1 : 1);
  };

  return <button type="button" className={following ? "button secondary follow-button" : "button primary follow-button"} onClick={toggle} disabled={loading}>{following ? <UserCheck /> : <UserPlus />}{loading ? (lang === "bn" ? "অপেক্ষা করুন..." : "Loading") : following ? (lang === "bn" ? "অনুসরণ করছেন" : "Following") : (lang === "bn" ? "অনুসরণ করুন" : "Follow")}</button>;
}

function PostComposer({ user, notify, onPublished, businessPost = false }) {
  const { lang, translatePlaceName, translateDistrict, translateArea } = useLanguage();
  const [body, setBody] = useState("");
  const [productName, setProductName] = useState("");
  const [media, setMedia] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [showLocationName, setShowLocationName] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [posting, setPosting] = useState(false);
  const locationSuggestions = locationName.trim() ? places.filter((place) => [place.name, translatePlaceName(place), ...(place.aliases || []), place.area, translateArea(place.area), place.district, translateDistrict(place.district)].some((value) => value.toLowerCase().split(/\s+/).some((word) => word.startsWith(locationName.trim().toLowerCase())))) : [];

  const addLocation = () => setShowLocationName(true);

  const publish = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const text = body.trim();
    const name = productName.trim();
    if (businessPost && name.length < 2) return notify(lang === "bn" ? "পোস্ট করার আগে একটি পণ্যের নাম দিন।" : "Add a product name before publishing.");
    if (!text || !media) return notify(lang === "bn" ? "পোস্ট করতে বিবরণ এবং একটি ছবি বা ভিডিও দিন।" : "Add text and one picture or video to publish.");
    const isImage = ["image/jpeg", "image/png", "image/webp"].includes(media.type);
    const isVideo = ["video/mp4", "video/webm", "video/quicktime"].includes(media.type);
    if ((!isImage && !isVideo) || media.size > (isImage ? 10 : 100) * 1024 * 1024) return notify(isImage ? (lang === "bn" ? "ছবি JPG, PNG, বা WebP ফরম্যাটে ১০ মেগাবাইটের মধ্যে হতে হবে।" : "Pictures must be JPG, PNG, or WebP up to 10 MB.") : (lang === "bn" ? "ভিডিও MP4, WebM, বা MOV ফরম্যাটে ১০০ মেগাবাইটের মধ্যে হতে হবে।" : "Videos must be MP4, WebM, or MOV up to 100 MB."));
    setPosting(true);
    try {
      const audienceSetting = await supabase.from("profiles").select("post_audience").eq("id", user.id).single();
      if (audienceSetting.error) return notify("Run 023_post_audience.sql in Supabase before publishing posts.");
      let duration = null;
      if (isVideo) {
        duration = await getVideoDuration(media);
        if (duration < 30 || duration > 300) return notify(lang === "bn" ? "ভিডিও ৩০-৬০ সেকেন্ড অথবা ১-৫ মিনিটের হতে হবে।" : "Videos must be 30-60 seconds or 1-5 minutes long.");
      }
      const path = `${user.id}/${crypto.randomUUID()}-${media.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const upload = await supabase.storage.from("social-posts").upload(path, media, { contentType: media.type });
      if (upload.error) return notify(upload.error.message);
      const post = await supabase.from("social_posts").insert({ author_id: user.id, body: text, ...(businessPost ? { product_name: name } : {}), media_type: isImage ? "IMAGE" : "VIDEO", media_path: upload.data.path, video_duration_seconds: duration ? Math.round(duration) : null, audience: businessPost ? "PUBLIC" : audienceSetting.data.post_audience, location_latitude: location?.latitude ?? null, location_longitude: location?.longitude ?? null, location_accuracy_meters: location?.accuracy ?? null, location_name: locationName.trim() || null });
      if (post.error) {
        await supabase.storage.from("social-posts").remove([upload.data.path]);
        return notify(/product_name|schema cache/i.test(post.error.message) ? "Run 074_business_post_product_name.sql in Supabase before publishing product posts." : post.error.message);
      }
      setBody("");
      setProductName("");
      setMedia(null);
      setLocation(null);
      setLocationName("");
      setShowLocationName(false);
      setLocationFocused(false);
      form.reset();
      notify(lang === "bn" ? "পোস্ট প্রকাশিত হয়েছে।" : "Post published.");
      onPublished?.();
    } catch (error) {
      notify(error?.message || (lang === "bn" ? "পোস্ট প্রকাশ করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।" : "Post could not be published. Check your connection and try again."));
    } finally {
      setPosting(false);
    }
  };

  return <form className="post-composer" onSubmit={publish}>
    <div><p className="eyebrow">{lang === "bn" ? "নতুন আপডেট" : "Share an update"}</p><h2>{lang === "bn" ? "TourismuBD কমিউনিটির সাথে শেয়ার করুন।" : "Post for the TourismuBD community."}</h2></div>
    {businessPost ? <label className="post-product-field">{lang === "bn" ? "পণ্যের নাম" : "Product name"}<input value={productName} onChange={(event) => setProductName(event.target.value)} required minLength="2" maxLength="140" placeholder={lang === "bn" ? "এই পোস্টের পণ্যের নাম লিখুন" : "Name the product in this post"} /></label> : null}
    <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength="2000" rows="4" placeholder={lang === "bn" ? "আপনার ভ্রমণ অভিজ্ঞতা সম্পর্কে লিখুন..." : "Write about your travel experience..."} />
    <div className="post-composer-actions"><div className="post-composer-tools"><label className="post-file"><Camera /><span>{media ? media.name : (lang === "bn" ? "ছবি বা ভিডিও যোগ করুন" : "Add picture or video")}</span><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" onChange={(event) => setMedia(event.target.files?.[0] || null)} /></label><button type="button" className="button secondary post-location-button" onClick={addLocation}><MapPin />{locationName ? (lang === "bn" ? "স্থান যুক্ত হয়েছে" : "Location added") : (lang === "bn" ? "স্থান যোগ করুন" : "Add location")}</button></div><button className="button primary" disabled={posting}><Send />{posting ? (lang === "bn" ? "পোস্ট হচ্ছে..." : "Publishing") : (lang === "bn" ? "পোস্ট করুন" : "Publish")}</button></div>
    {showLocationName ? <div className="post-location-name"><MapPin /><input value={locationName} onChange={(event) => { setLocationName(event.target.value); setLocation(null); }} onFocus={() => setLocationFocused(true)} onBlur={() => window.setTimeout(() => setLocationFocused(false), 120)} maxLength="120" placeholder={lang === "bn" ? "স্থানের নাম লিখুন..." : "Type a location name"} aria-label={lang === "bn" ? "স্থানের নাম" : "Location name"} />{locationFocused && locationSuggestions.length ? <div className="post-location-suggestions" role="listbox">{locationSuggestions.map((place) => {
      const pName = translatePlaceName(place);
      const pDist = translateDistrict(place.district);
      const pArea = translateArea(place.area);
      const pLoc = pArea && pDist && pArea.trim().toLowerCase() === pDist.trim().toLowerCase() ? pDist : (pArea ? `${pArea}, ${pDist}` : pDist);
      return <button type="button" key={place.id} onMouseDown={(event) => event.preventDefault()} onClick={() => { setLocationName(pName); setLocation({ latitude: place.coordinates.lat, longitude: place.coordinates.lng, accuracy: null }); setLocationFocused(false); }}><b>{pName}</b><small>{pLoc}</small></button>;
    })}</div> : null}</div> : null}
    <p className="form-note">{lang === "bn" ? "ছবির সাথে বিবরণ দিন। ভিডিও: ৩০-৬০ সেকেন্ড বা ১-৫ মিনিট।" : "Pictures need text. Videos: 30-60 seconds or 1-5 minutes."}</p>
  </form>;
}

function PostPublisher({ user, notify, onPublished, businessPost = false }) {
  const { lang } = useLanguage();
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open) dialog.showModal();
    return () => dialog?.open && dialog.close();
  }, [open]);

  return <>
    <button type="button" className="button primary create-post-button" onClick={() => setOpen(true)}><Send />{lang === "bn" ? "নতুন পোস্ট" : "Create post"}</button>
    {open ? <dialog ref={dialogRef} className="provider-dialog post-dialog" onCancel={(event) => { event.preventDefault(); close(); }} onMouseDown={(event) => event.target === event.currentTarget && close()}><section className="post-composer-modal" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="icon-button close" onClick={close} aria-label={lang === "bn" ? "বন্ধ করুন" : "Close post editor"}><X /></button><PostComposer user={user} notify={notify} businessPost={businessPost} onPublished={() => { close(); onPublished?.(); }} /></section></dialog> : null}
  </>;
}

async function addPostEngagement(posts) {
  if (!posts.length) return posts;
  const { data, error } = await supabase.from("social_post_engagement").select("post_id,like_count,comment_count,liked_by_me").in("post_id", posts.map((post) => post.id));
  if (error) return posts.map((post) => ({ ...post, like_count: 0, comment_count: 0, liked_by_me: false }));
  const engagement = Object.fromEntries((data || []).map((item) => [item.post_id, item]));
  return posts.map((post) => ({ ...post, like_count: engagement[post.id]?.like_count || 0, comment_count: engagement[post.id]?.comment_count || 0, liked_by_me: Boolean(engagement[post.id]?.liked_by_me) }));
}

const POST_REPORT_REASONS_BN = {
  "Spam or scam": "স্প্যাম বা প্রতারণা",
  "Harassment or bullying": "হয়রানি বা উত্যক্ত করা",
  "Insulting or demeaning a person": "কাউকে অপমান বা হেয় করা",
  "Hate speech": "ঘৃণাসূচক বক্তব্য",
  "Religious hate or disrespect": "ধর্মীয় অবমাননা বা বিদ্বেষ",
  "Discrimination": "বৈষম্যমূলক আচরণ",
  "Violence or threats": "সহিংসতা বা হুমকি",
  "Adult or sexually explicit content": "প্রাপ্তবয়স্কদের অনুপযুক্ত বিষয়বস্তু",
  "Nudity or sexual content": "নগ্নতা বা যৌন উত্তেজক বিষয়বস্তু",
  "Self-harm or suicide": "আত্মহত্যা বা আত্মঘাতী বিষয়বস্তু",
  "False or misleading information": "ভুল বা বিভ্রান্তিকর তথ্য",
  "Illegal activity": "অবৈধ কর্মকাণ্ড",
  "Impersonation": "অন্যের পরিচয় নকল করা",
  "Privacy violation": "ব্যক্তিগত গোপনীয়তা লঙ্ঘন",
  "Copyright or intellectual property violation": "কপিরাইট বা মেধা সম্পত্তি লঙ্ঘন",
  "Other inappropriate content": "অন্যান্য অনুপযুক্ত বিষয়বস্তু",
};

function PostReportDialog({ post, onClose, onSubmit, saving }) {
  const { lang, toBengaliNumber } = useLanguage();
  const dialogRef = useRef(null);
  const [details, setDetails] = useState("");
  const [reasons, setReasons] = useState([]);
  const objectionLength = details.trim().length;
  useEffect(() => { dialogRef.current?.showModal(); }, []);
  const toggleReason = (reason) => setReasons((selected) => selected.includes(reason) ? selected.filter((item) => item !== reason) : [...selected, reason]);
  const submit = async (event) => {
    event.preventDefault();
    if (await onSubmit({ details, reasons })) onClose();
  };
  return <dialog ref={dialogRef} className="provider-dialog post-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="post-report-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
      <button type="button" className="icon-button close" onClick={onClose} aria-label={lang === "bn" ? "বন্ধ করুন" : "Close report form"}><X /></button>
      <p className="eyebrow">{lang === "bn" ? "পোস্ট সম্পর্কে অভিযোগ" : "Report timeline update"}</p>
      <h2>{lang === "bn" ? "আপনার অভিযোগ কী?" : "What is your objection?"}</h2>
      <p>{lang === "bn" ? "প্রযোজ্য কারণগুলো নির্বাচন করুন এবং পর্যালোচনা করার কারণ ব্যাখ্যা করুন। আপনার রিপোর্টটি গোপনে অ্যাডমিনের কাছে পাঠানো হবে।" : "Select every reason that applies, then explain why this post should be reviewed. Your report is sent privately to TourismuBD Admin."}</p>
      <fieldset className="post-report-reasons"><legend>{lang === "bn" ? "রিপোর্টের কারণসমূহ" : "Report reasons"}</legend><div>{POST_REPORT_REASONS.map((reason) => <label key={reason}><input type="checkbox" checked={reasons.includes(reason)} onChange={() => toggleReason(reason)} />{lang === "bn" ? (POST_REPORT_REASONS_BN[reason] || reason) : reason}</label>)}</div></fieldset>
      <label>{lang === "bn" ? "অভিযোগের বিস্তারিত" : "Objection details"}<textarea value={details} onChange={(event) => setDetails(event.target.value)} minLength="10" maxLength="2000" rows="6" placeholder={lang === "bn" ? "আপনার অভিযোগের কারণ বিস্তারিত লিখুন..." : "Write the reason for your report..."} aria-label={lang === "bn" ? "অভিযোগের বিস্তারিত" : "Objection details"} required autoFocus />{/* aria-label="Objection details" required */}</label>
      <p className="post-report-requirements">{reasons.length ? (lang === "bn" ? `${toBengaliNumber(reasons.length)}টি কারণ নির্বাচিত।` : `${reasons.length} reason${reasons.length === 1 ? "" : "s"} selected.`) : (lang === "bn" ? "কমপক্ষে একটি কারণ নির্বাচন করুন।" : "Select at least one reason for this report.")} {/* Select at least one reason for this report. */}{lang === "bn" ? `কমপক্ষে ১০টি অক্ষর লিখুন (${toBengaliNumber(Math.min(objectionLength, 10))}/১০)` : `Write at least 10 characters (${Math.min(objectionLength, 10)}/10).`}</p>
      <div className="post-report-actions"><button type="button" className="button secondary" onClick={onClose}>{lang === "bn" ? "বাতিল" : "Cancel"}</button><button className="button primary" disabled={saving || !reasons.length || objectionLength < 10}><Flag />{saving ? (lang === "bn" ? "জমা হচ্ছে..." : "Submitting...") : (lang === "bn" ? "অভিযোগ জমা দিন" : "Submit report")}</button></div>
      <small>{lang === "bn" ? `${post.author.full_name || "এই সদস্য"}-এর পোস্টের বিরুদ্ধে অভিযোগ।` : `Reporting a post by ${post.author.full_name || "this member"}.`}</small>
    </form>
  </dialog>;
}

function PostCard({ post, user, notify, onUpdated, onDeleted }) {
  const { lang, toBengaliNumber } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(post.body);
  const [productName, setProductName] = useState(post.product_name || "");
  const [liked, setLiked] = useState(Boolean(post.liked_by_me));
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [savingReaction, setSavingReaction] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const isOwner = user?.id === post.author_id;
  const locationUrl = post.location_latitude != null && post.location_longitude != null ? `https://www.google.com/maps?q=${post.location_latitude},${post.location_longitude}` : null;
  const locationText = post.location_name || (lang === "bn" ? "পোস্টের অবস্থান দেখুন" : "View post location");
  const engagementError = (error) => notify(/social_post_(likes|comments)/.test(error.message) ? "Run 055_social_post_engagement.sql in Supabase first." : error.message);

  const saveEdit = async (event) => {
    event.preventDefault();
    const nextBody = body.trim();
    if (!nextBody) return notify(lang === "bn" ? "পোস্টে বিবরণ আবশ্যক।" : "An update needs text.");
    const nextName = productName.trim();
    if (post.product_name && nextName.length < 2) return notify(lang === "bn" ? "সংরক্ষণের আগে পণ্যের নাম লিখুন।" : "Add a product name before saving.");
    const { data, error } = await supabase.from("social_posts").update({ body: nextBody, ...(post.product_name ? { product_name: nextName } : {}) }).eq("id", post.id).select(post.product_name ? "body,product_name" : "body").single();
    if (error) return notify(error.message);
    onUpdated?.({ ...post, body: data.body, product_name: data.product_name });
    setEditing(false);
    setMenuOpen(false);
    notify(lang === "bn" ? "পোস্ট আপডেট সংরক্ষিত হয়েছে।" : "Timeline update edited.");
  };
  const deletePost = async () => {
    if (!window.confirm(lang === "bn" ? "এই পোস্টটি মুছে ফেলতে চান?" : "Delete this timeline update?")) return;
    const { error } = await supabase.from("social_posts").delete().eq("id", post.id);
    if (error) return notify(error.message);
    await supabase.storage.from("social-posts").remove([post.media_path]);
    onDeleted?.(post.id);
    notify(lang === "bn" ? "পোস্ট মুছে ফেলা হয়েছে।" : "Timeline update deleted.");
  };
  const reportPost = async ({ details, reasons }) => {
    const objection = details.trim();
    if (!reasons.length) { notify(lang === "bn" ? "রিপোর্টের জন্য কমপক্ষে একটি কারণ নির্বাচন করুন।" : "Select at least one reason for this report."); return false; }
    if (objection.length < 10) { notify(lang === "bn" ? "অভিযোগ ব্যাখ্যা করে কমপক্ষে ১০টি অক্ষর লিখুন।" : "Write at least 10 characters explaining your objection."); return false; }
    setSavingReport(true);
    const reportPayload = { created_by: user.id, category: "OTHER", reason_categories: reasons, details: objection, social_post_id: post.id, status: "OPEN" };
    const legacyPayload = { created_by: user.id, category: "OTHER", details: `Report reasons: ${reasons.join(" | ")}\n\n${objection}`, social_post_id: post.id, status: "OPEN" };
    let payload = reportPayload;
    let { error } = await supabase.from("reports").insert(payload);
    if (error && /reason_categories/i.test(error.message || "")) {
      payload = legacyPayload;
      ({ error } = await supabase.from("reports").insert(payload));
    }
    let updated = false;
    if (error?.code === "23505") {
      let updateResult = await supabase.from("reports").update(payload).eq("social_post_id", post.id).eq("created_by", user.id).eq("status", "OPEN").select("id");
      if (updateResult.error && payload === reportPayload && /reason_categories/i.test(updateResult.error.message || "")) {
        payload = legacyPayload;
        updateResult = await supabase.from("reports").update(payload).eq("social_post_id", post.id).eq("created_by", user.id).eq("status", "OPEN").select("id");
      }
      error = updateResult.error;
      if (!error && updateResult.data?.length) {
        updated = true;
      } else if (!error) {
        const reopenPayload = {
          ...payload,
          status: "OPEN",
          admin_note: null,
          resolved_by: null,
          resolved_at: null,
          updated_at: new Date().toISOString(),
        };
        let reopenResult = await supabase.from("reports").update(reopenPayload).eq("social_post_id", post.id).eq("created_by", user.id).select("id");
        if (reopenResult.error && payload === reportPayload && /reason_categories/i.test(reopenResult.error.message || "")) {
          const legacyReopen = { ...legacyPayload, status: "OPEN", admin_note: null, resolved_by: null, resolved_at: null, updated_at: new Date().toISOString() };
          reopenResult = await supabase.from("reports").update(legacyReopen).eq("social_post_id", post.id).eq("created_by", user.id).select("id");
        }
        error = reopenResult.error;
        updated = !error && Boolean(reopenResult.data?.length);
      }
    }
    setSavingReport(false);
    if (error) { notify(error.code === "23505" ? (lang === "bn" ? "আপনি ইতিমধ্যে এই পোস্টের বিরুদ্ধে রিপোর্ট করেছেন।" : "You already reported this update.") : error.message); return false; }
    setHiddenSocialPost(post.id, true);
    setMenuOpen(false);
    notify(updated ? (lang === "bn" ? "আপনার পূর্বের রিপোর্ট আপডেট করা হয়েছে।" : "Your existing report was updated.") : (lang === "bn" ? "পোস্টের বিরুদ্ধে রিপোর্ট জমা হয়েছে।" : "Timeline update reported."));
    return true;
  };

  const toggleLike = async () => {
    if (!user || savingReaction) return;
    setSavingReaction(true);
    const { error } = liked
      ? await supabase.from("social_post_likes").delete().eq("post_id", post.id).eq("user_id", user.id)
      : await supabase.from("social_post_likes").insert({ post_id: post.id, user_id: user.id });
    setSavingReaction(false);
    if (error) return engagementError(error);
    setLiked((current) => !current);
    setLikeCount((count) => Math.max(0, count + (liked ? -1 : 1)));
  };

  const loadComments = async () => {
    setCommentsLoading(true);
    const commentsResult = await supabase.from("social_post_comments").select("id,author_id,body,created_at").eq("post_id", post.id).order("created_at").limit(100);
    if (commentsResult.error) { setCommentsLoading(false); return engagementError(commentsResult.error); }
    const authorIds = [...new Set((commentsResult.data || []).map((comment) => comment.author_id))];
    const peopleResult = authorIds.length ? await supabase.from("public_people").select("id,full_name,avatar_url").in("id", authorIds) : { data: [] };
    if (peopleResult.error) { setCommentsLoading(false); return notify(peopleResult.error.message); }
    const authors = Object.fromEntries((peopleResult.data || []).map((person) => [person.id, person]));
    setComments((commentsResult.data || []).map((comment) => ({ ...comment, author: authors[comment.author_id] })));
    setCommentsLoaded(true);
    setCommentsLoading(false);
  };

  const toggleComments = async () => {
    const opening = !commentsOpen;
    setCommentsOpen(opening);
    if (opening && !commentsLoaded) await loadComments();
  };

  const addComment = async (event) => {
    event.preventDefault();
    const nextComment = commentBody.trim();
    if (!nextComment || savingComment) return;
    setSavingComment(true);
    const { error } = await supabase.from("social_post_comments").insert({ post_id: post.id, author_id: user.id, body: nextComment });
    setSavingComment(false);
    if (error) return engagementError(error);
    setCommentBody("");
    setCommentCount((count) => count + 1);
    await loadComments();
  };

  const sharePost = async () => {
    const shareData = { title: "TourismuBD post", text: `${post.author.full_name || (lang === "bn" ? "TourismuBD সদস্য" : "TourismuBD member")}: ${post.body}`, url: window.location.origin };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        notify(lang === "bn" ? "পোস্ট লিংক কপি হয়েছে। আপনি এটি শেয়ার করতে পারেন।" : "Post copied. You can share it anywhere.");
      }
    } catch (error) {
      if (error.name !== "AbortError") notify(lang === "bn" ? "এই পোস্টটি শেয়ার করা যায়নি।" : "This post could not be shared.");
    }
  };

  const authorRoleLabel = lang === "bn" ? (PROVIDER_ROLE_LABELS_BN[post.author.role] || (post.author.role === "TRAVELER" ? "ভ্রমণকারী" : (post.author.role === "BUSINESS_OWNER" ? "উদ্যোক্তা" : "সদস্য"))) : (PROVIDER_TYPE_LABELS[post.author.role] || "Traveler");

  return <><article className="community-post">
    <div className="post-card-head"><div className="post-author"><span>{post.author.avatar_url ? <img src={post.author.avatar_url} alt="" /> : <CircleUserRound />}</span><div><b>{post.author.full_name || (lang === "bn" ? "TourismuBD সদস্য" : "TourismuBD member")}</b><small>{authorRoleLabel} · {new Date(post.created_at).toLocaleDateString()}</small></div></div>{user ? <div className="post-menu"><button type="button" className="icon-button" onClick={() => setMenuOpen((open) => !open)} aria-label={lang === "bn" ? "পোস্ট মেনু" : "Timeline options"} aria-expanded={menuOpen}><MoreHorizontal /></button>{menuOpen ? <div className="post-menu-popover" role="menu">{isOwner ? <><button type="button" onClick={() => { setEditing(true); setMenuOpen(false); }}><Pencil />{lang === "bn" ? "সম্পাদনা" : "Edit"}</button><button type="button" className="danger" onClick={deletePost}><Trash2 />{lang === "bn" ? "মুছুন" : "Delete"}</button></> : <button type="button" onClick={() => { setMenuOpen(false); setReportOpen(true); }}><Flag />{lang === "bn" ? "অভিযোগ" : "Report"}</button>}</div> : null}</div> : null}</div>
    {editing ? <form className="post-edit" onSubmit={saveEdit}>{post.product_name ? <label className="post-product-field">{lang === "bn" ? "পণ্যের নাম" : "Product name"}<input value={productName} onChange={(event) => setProductName(event.target.value)} required minLength="2" maxLength="140" /></label> : null}<textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength="2000" /><div><button type="button" className="button secondary" onClick={() => { setBody(post.body); setProductName(post.product_name || ""); setEditing(false); }}>{lang === "bn" ? "বাতিল" : "Cancel"}</button><button className="button primary">{lang === "bn" ? "সংরক্ষণ" : "Save"}</button></div></form> : <>{post.product_name ? <h3 className="post-product-title">{post.product_name}</h3> : null}<p>{post.body}</p></>}
    {locationUrl ? <a className="post-location" href={locationUrl} target="_blank" rel="noreferrer"><MapPin />{locationText}</a> : post.location_name ? <span className="post-location"><MapPin />{locationText}</span> : null}
    {post.media_type === "VIDEO" ? <video controls preload="metadata" src={post.media_url} /> : <img src={post.media_url} alt="Post attachment" />}
    <div className="post-actions"><button type="button" className={liked ? "active" : ""} onClick={toggleLike} disabled={savingReaction} aria-label={liked ? (lang === "bn" ? "পছন্দ প্রত্যাহার" : "Unlike post") : (lang === "bn" ? "পছন্দ করুন" : "Like post")} aria-pressed={liked} title={liked ? (lang === "bn" ? "পছন্দ প্রত্যাহার" : "Unlike") : (lang === "bn" ? "পছন্দ" : "Like")}><Heart />{likeCount ? <span>{toBengaliNumber(likeCount)}</span> : null}</button><button type="button" onClick={toggleComments} aria-label={lang === "bn" ? "মন্তব্য" : "Comments"} aria-expanded={commentsOpen} title={lang === "bn" ? "মন্তব্য" : "Comments"}>{/* aria-label="Comments" */}<MessageCircle />{commentCount ? <span>{toBengaliNumber(commentCount)}</span> : null}</button><button type="button" onClick={sharePost} aria-label={lang === "bn" ? "শেয়ার করুন" : "Share post"} title={lang === "bn" ? "শেয়ার" : "Share"}>{/* aria-label="Share post" */}<Share2 /></button></div>
    {commentsOpen ? <section className="post-comments" aria-label="Post comments">{commentsLoading ? <p className="people-note">{lang === "bn" ? "মন্তব্য লোড হচ্ছে..." : "Loading comments..."}</p> : null}{!commentsLoading && !comments.length ? <p className="people-note">{lang === "bn" ? "এখনো কোনো মন্তব্য নেই।" : "No comments yet."}</p> : null}<div className="post-comment-list">{comments.map((comment) => <article className="post-comment" key={comment.id}><span>{comment.author?.avatar_url ? <img src={comment.author.avatar_url} alt="" /> : <CircleUserRound />}</span><div><b>{comment.author?.full_name || (lang === "bn" ? "TourismuBD সদস্য" : "TourismuBD member")}</b><small>{new Date(comment.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small><p>{comment.body}</p></div></article>)}</div><form className="post-comment-form" onSubmit={addComment}><textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} maxLength="1000" rows="2" placeholder={lang === "bn" ? "একটি মন্তব্য লিখুন..." : "Write a comment"} aria-label={lang === "bn" ? "একটি মন্তব্য লিখুন" : "Write a comment"} /><button className="button primary" disabled={!commentBody.trim() || savingComment}><Send />{savingComment ? (lang === "bn" ? "পোস্ট হচ্ছে..." : "Posting") : (lang === "bn" ? "মন্তব্য করুন" : "Post")}</button></form></section> : null}
  </article>{reportOpen ? <PostReportDialog post={post} saving={savingReport} onClose={() => setReportOpen(false)} onSubmit={reportPost} /> : null}</>;
}

function DashboardPosts({ user, authorId = user?.id, profile, provider, refreshKey, title = "My timeline", notify }) {
  const { lang } = useLanguage();
  const [state, setState] = useState({ loading: true, posts: [], error: "" });

  useEffect(() => {
    if (!user || !authorId) { setState({ loading: false, posts: [], error: "" }); return; }
    let active = true;
    supabase.from("social_posts").select("id,author_id,body,product_name,media_type,media_path,location_latitude,location_longitude,location_name,created_at,is_hidden").eq("author_id", authorId).order("created_at", { ascending: false }).then(async (result) => {
      let { data, error } = result;
      if (error && /is_hidden/i.test(error.message)) {
        const retry = await supabase.from("social_posts").select("id,author_id,body,product_name,media_type,media_path,location_latitude,location_longitude,location_name,created_at").eq("author_id", authorId).order("created_at", { ascending: false });
        data = retry.data;
        error = retry.error;
      }
      if (missingProductNameColumn(error)) {
        const fallback = await supabase.from("social_posts").select("id,author_id,body,media_type,media_path,location_latitude,location_longitude,location_name,created_at").eq("author_id", authorId).order("created_at", { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }
      if (error) { if (active) setState({ loading: false, posts: [], error: error.message }); return; }
      if (!data?.length) { if (active) setState({ loading: false, posts: [], error: "" }); return; }
      const media = await supabase.storage.from("social-posts").createSignedUrls(data.map((post) => post.media_path), 3600);
      if (!active) return;
      if (media.error) return setState({ loading: false, posts: [], error: media.error.message });
      const mediaUrls = Object.fromEntries((media.data || []).map((item) => [item.path, item.signedUrl]));
      const posts = data.filter((post) => !isPostHidden(post.id, post)).map((post) => ({ ...post, author: { full_name: provider?.display_name || profile.full_name, role: profile.role, avatar_url: profile.avatar_url || provider?.photo_url }, media_url: mediaUrls[post.media_path] })).filter((post) => post.media_url);
      const postsWithEngagement = await addPostEngagement(posts);
      if (active) setState({ loading: false, posts: postsWithEngagement, error: "" });
    });
    return () => { active = false; };
  }, [user?.id, authorId, refreshKey]);

  if (!user) return null;
  const updatePost = (nextPost) => setState((current) => ({ ...current, posts: current.posts.map((post) => post.id === nextPost.id ? nextPost : post) }));
  const removePost = (postId) => setState((current) => ({ ...current, posts: current.posts.filter((post) => post.id !== postId) }));
  const displayTitle = title === "My timeline" ? (lang === "bn" ? "আমার টাইমলাইন" : "My timeline") : (title === "Timeline" ? (lang === "bn" ? "টাইমলাইন" : "Timeline") : title);

  return <section className="dashboard-posts"><h2>{displayTitle}</h2>{state.loading ? <p className="people-note">{lang === "bn" ? "টাইমলাইন লোড হচ্ছে..." : "Loading timeline..."}</p> : null}{state.error ? <p className="form-error">{state.error}</p> : null}{!state.loading && !state.error && !state.posts.length ? <p className="people-note">{title === "My timeline" ? (lang === "bn" ? "আপনি এখনো কোনো পোস্ট প্রকাশ করেননি।" : "You have not published an update yet.") : (lang === "bn" ? "আপনার জন্য কোনো টাইমলাইন পোস্ট উপলব্ধ নেই।" : "No timeline updates are available for you.")}</p> : null}<div className="post-feed">{state.posts.map((post) => <PostCard key={post.id} post={post} user={user} notify={notify} onUpdated={updatePost} onDeleted={removePost} />)}</div></section>;
}

function CommunityFeed({ user, notify }) {
  const [state, setState] = useState({ loading: true, posts: [], error: "" });

  useEffect(() => {
    if (!user) return setState({ loading: false, posts: [], error: "Sign in to view posts." });
    let active = true;
    supabase.from("social_posts").select("id,author_id,body,product_name,media_type,media_path,video_duration_seconds,location_latitude,location_longitude,location_name,created_at,is_hidden").order("created_at", { ascending: false }).limit(50).then(async (result) => {
      let { data, error } = result;
      if (error && /is_hidden/i.test(error.message)) {
        const retry = await supabase.from("social_posts").select("id,author_id,body,product_name,media_type,media_path,video_duration_seconds,location_latitude,location_longitude,location_name,created_at").order("created_at", { ascending: false }).limit(50);
        data = retry.data;
        error = retry.error;
      }
      if (missingProductNameColumn(error)) {
        const fallback = await supabase.from("social_posts").select("id,author_id,body,media_type,media_path,video_duration_seconds,location_latitude,location_longitude,location_name,created_at").order("created_at", { ascending: false }).limit(50);
        data = fallback.data;
        error = fallback.error;
      }
      if (error) { if (active) setState({ loading: false, posts: [], error: error.message }); return; }
      const ids = [...new Set((data || []).map((post) => post.author_id))];
      const [people, media] = await Promise.all([
        ids.length ? supabase.from("public_people").select("id,full_name,role,avatar_url").in("id", ids) : { data: [] },
        data?.length ? supabase.storage.from("social-posts").createSignedUrls(data.map((post) => post.media_path), 3600) : { data: [] },
      ]);
      if (!active) return;
      if (people.error) return setState({ loading: false, posts: [], error: people.error.message });
      const authors = Object.fromEntries((people.data || []).map((person) => [person.id, person]));
      const mediaUrls = Object.fromEntries((media.data || []).map((item) => [item.path, item.signedUrl]));
      const posts = (data || []).filter((post) => !isPostHidden(post.id, post)).map((post) => ({ ...post, author: authors[post.author_id] || { full_name: "TourismuBD member", role: "TRAVELER" }, media_url: mediaUrls[post.media_path] })).filter((post) => post.author && post.media_url);
      const postsWithEngagement = await addPostEngagement(posts);
      if (active) setState({ loading: false, posts: postsWithEngagement, error: media.error?.message || "" });
    });
    return () => { active = false; };
  }, [user?.id]);

  const { lang } = useLanguage();
  return <main className="page-shell page-top feed-page">
    <div className="page-title"><p className="eyebrow">{lang === "bn" ? "কমিউনিটি টাইমলাইন" : "Community timeline"}</p></div>
    {state.loading ? <p className="people-note">{lang === "bn" ? "পোস্ট লোড হচ্ছে..." : "Loading posts..."}</p> : null}
    {state.error ? <p className="people-note">{state.error}</p> : null}
    {!state.loading && !state.error && !state.posts.length ? <p className="people-note">{lang === "bn" ? "এখনো কোনো টাইমলাইন পোস্ট উপলব্ধ নেই।" : "No timeline updates are available yet."}</p> : null}
    <div className="post-feed">{state.posts.map((post) => <PostCard key={post.id} post={post} user={user} notify={notify} onUpdated={(nextPost) => setState((current) => ({ ...current, posts: current.posts.map((post) => post.id === nextPost.id ? nextPost : post) }))} onDeleted={(postId) => setState((current) => ({ ...current, posts: current.posts.filter((post) => post.id !== postId) }))} />)}</div>
  </main>;
}

function ProfilePhotoEditorDialog({ user, profile, provider, notify, onSaved, onClose }) {
  const { lang } = useLanguage();
  const dialogRef = useRef(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.open && dialog.close();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const image = new FormData(event.currentTarget).get("profilePhoto");
    if (!image?.size || !["image/jpeg", "image/png", "image/webp"].includes(image.type) || image.size > 5 * 1024 * 1024) return setError(lang === "bn" ? "৫ মেগাবাইটের মধ্যে JPG, PNG, বা WebP ছবি ব্যবহার করুন।" : "Use a JPG, PNG, or WebP image up to 5 MB.");
    setError("");
    setSubmitting(true);
    const upload = await supabase.storage.from("profile-photos").upload(`${user.id}/avatar`, image, { upsert: true, contentType: image.type });
    if (upload.error) { setSubmitting(false); return setError(upload.error.message); }
    const avatarUrl = `${supabase.storage.from("profile-photos").getPublicUrl(upload.data.path).data.publicUrl}?v=${Date.now()}`;
    const photoUrls = [avatarUrl, ...(profile.profile_photo_urls || []).filter((url) => url !== avatarUrl)].slice(0, 7);
    const { data, error: profileError } = await supabase.from("profiles").update({ avatar_url: avatarUrl, profile_photo_urls: photoUrls }).eq("id", user.id).select(PROFILE_FIELDS).single();
    if (profileError) { setSubmitting(false); return setError(profileError.message); }
    if (provider) {
      const { error: providerError } = await supabase.from("providers").update({ photo_url: avatarUrl }).eq("user_id", user.id);
      if (providerError) { setSubmitting(false); return setError(providerError.message); }
    }
    onSaved(data);
    notify(lang === "bn" ? "প্রোফাইল ছবি সংরক্ষিত হয়েছে।" : "Profile picture saved.");
    onClose();
  };

  return <dialog ref={dialogRef} className="provider-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="modal profile-photo-editor" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} aria-labelledby="profile-photo-title">
      <button type="button" className="icon-button close" onClick={onClose} aria-label={lang === "bn" ? "বন্ধ করুন" : "Close"}><X /></button>
      <p className="eyebrow">{lang === "bn" ? "প্রোফাইল" : "Profile"}</p>
      <h2 id="profile-photo-title">{lang === "bn" ? "প্রোফাইল ছবি" : "Profile picture"}</h2>
      <label>{lang === "bn" ? "ছবি নির্বাচন করুন" : "Choose image"}<input name="profilePhoto" type="file" required accept="image/jpeg,image/png,image/webp" /></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button primary wide" disabled={submitting}>{submitting ? (lang === "bn" ? "আপলোড হচ্ছে..." : "Uploading...") : (lang === "bn" ? "ছবি সংরক্ষণ করুন" : "Save picture")}</button>
    </form>
  </dialog>;
}

function ProfileAvatar({ user, profile, provider, notify, onSaved }) {
  const { lang } = useLanguage();
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const photos = (profile.profile_photo_urls || []).filter(Boolean);
  const [photoIndex, setPhotoIndex] = useState(0);
  const close = () => setOpen(false);

  useEffect(() => {
    setPhotoIndex(0);
    if (photos.length < 2) return undefined;
    const timer = window.setInterval(() => setPhotoIndex((index) => (index + 1) % photos.length), 60000);
    return () => window.clearInterval(timer);
  }, [photos.length, photos.join("|")]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open) dialog.showModal();
    return () => dialog?.open && dialog.close();
  }, [open]);

  const avatarUrl = photos[photoIndex] || profile.avatar_url;
  const alt = `${profile.full_name || (lang === "bn" ? "অ্যাকাউন্ট" : "Account")} profile`;
  return <>
    <span className="dashboard-avatar-wrap">{avatarUrl ? <button type="button" className="dashboard-avatar" onClick={() => setOpen(true)} aria-label={lang === "bn" ? "প্রোফাইল ছবি দেখুন" : "View profile picture"}><img src={avatarUrl} alt={alt} /></button> : <span className="dashboard-avatar"><CircleUserRound /></span>}<button type="button" className="profile-photo-edit" onClick={() => setEditing(true)} aria-label={lang === "bn" ? "প্রোফাইল ছবি পরিবর্তন করুন" : "Change profile picture"} title={lang === "bn" ? "প্রোফাইল ছবি পরিবর্তন করুন" : "Change profile picture"}><Camera /></button></span>
    {open ? <dialog ref={dialogRef} className="profile-photo-dialog" onCancel={(event) => { event.preventDefault(); close(); }} onMouseDown={(event) => event.target === event.currentTarget && close()}><button type="button" className="profile-photo-full" onClick={close} aria-label={lang === "bn" ? "বন্ধ করুন" : "Close profile picture"}><img src={avatarUrl} alt={alt} /></button></dialog> : null}
    {editing ? <ProfilePhotoEditorDialog user={user} profile={profile} provider={provider} notify={notify} onSaved={onSaved} onClose={() => setEditing(false)} /> : null}
  </>;
}

function ProfilePhotoGallery({ user, profile, provider, notify, onSaved }) {
  const { lang, toBengaliNumber } = useLanguage();
  const dialogRef = useRef(null);
  const [uploading, setUploading] = useState(-1);
  const [deleting, setDeleting] = useState(-1);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const photos = profile.profile_photo_urls || [];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selectedPhoto) dialog.showModal();
    return () => dialog?.open && dialog.close();
  }, [selectedPhoto]);

  const upload = async (event, slot) => {
    const image = event.target.files?.[0];
    if (!image) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type) || image.size > 5 * 1024 * 1024) return notify(lang === "bn" ? "৫ মেগাবাইটের মধ্যে JPG, PNG, বা WebP ছবি ব্যবহার করুন।" : "Use a JPG, PNG, or WebP image up to 5 MB.");
    setUploading(slot);
    const path = `${user.id}/gallery-${slot}`;
    const result = await supabase.storage.from("profile-photos").upload(path, image, { upsert: true, contentType: image.type });
    if (result.error) { setUploading(-1); return notify(result.error.message); }
    const url = `${supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
    const nextPhotos = Array.from({ length: 7 }, (_, index) => index === slot ? url : photos[index] || null);
    const primaryPhoto = nextPhotos.find(Boolean) || profile.avatar_url;
    const { data, error } = await supabase.from("profiles").update({ avatar_url: primaryPhoto, profile_photo_urls: nextPhotos }).eq("id", user.id).select(PROFILE_FIELDS).single();
    setUploading(-1);
    if (error) return notify(error.message);
    if (provider) {
      const { error: providerError } = await supabase.from("providers").update({ photo_url: primaryPhoto }).eq("user_id", user.id);
      if (providerError) return notify(providerError.message);
    }
    onSaved(data);
    notify(lang === "bn" ? "প্রোফাইল ছবি সংরক্ষিত হয়েছে।" : "Profile picture saved.");
  };

  const deletePhoto = async (slot) => {
    const photo = photos[slot];
    if (!photo || !window.confirm(lang === "bn" ? "এই প্রোফাইল ছবিটি স্থায়ীভাবে মুছে ফেলতে চান?" : "Delete this profile picture permanently?")) return;
    setDeleting(slot);
    const nextPhotos = [...photos];
    nextPhotos[slot] = null;
    const primaryPhoto = nextPhotos.find(Boolean) || null;
    const { data, error } = await supabase.from("profiles").update({ avatar_url: primaryPhoto, profile_photo_urls: nextPhotos }).eq("id", user.id).select(PROFILE_FIELDS).single();
    if (error) { setDeleting(-1); return notify(error.message); }
    if (provider) {
      const { error: providerError } = await supabase.from("providers").update({ photo_url: primaryPhoto }).eq("user_id", user.id);
      if (providerError) { setDeleting(-1); return notify(providerError.message); }
    }
    const file = photo.match(new RegExp(`/${user.id}/(avatar|gallery-[0-6])(?:\\?|$)`));
    if (file) {
      const { error: storageError } = await supabase.storage.from("profile-photos").remove([`${user.id}/${file[1]}`]);
      if (storageError) { setDeleting(-1); onSaved(data); return notify(lang === "bn" ? "ছবি প্রোফাইল থেকে অপসারিত হয়েছে কিন্তু স্টোরেজ ক্লিনআপ ব্যর্থ হয়েছে।" : "Picture removed from your profile, but storage cleanup failed."); }
    }
    setDeleting(-1);
    if (selectedPhoto === photo) setSelectedPhoto(null);
    onSaved(data);
    notify(lang === "bn" ? "প্রোফাইল ছবি মুছে ফেলা হয়েছে।" : "Profile picture deleted.");
  };

  return <><section className="profile-picture-gallery" aria-label={lang === "bn" ? "প্রোফাইল ছবিসমূহ" : "Profile pictures"}><div className="profile-picture-slots">{Array.from({ length: 7 }, (_, slot) => <div className="profile-picture-slot" key={slot}>{photos[slot] ? <><button type="button" className="profile-picture-preview" onClick={() => setSelectedPhoto(photos[slot])} aria-label={`View profile picture ${slot + 1}`}><img src={photos[slot]} alt={`Profile picture ${slot + 1}`} /></button><label className="profile-picture-upload-icon" title={lang === "bn" ? "ছবি পরিবর্তন করুন" : "Replace picture"}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event, slot)} disabled={uploading === slot || deleting === slot} /><Camera /></label><button type="button" className="profile-picture-delete" onClick={() => deletePhoto(slot)} disabled={deleting === slot} aria-label={`Delete profile picture ${slot + 1}`} title={lang === "bn" ? "ছবি মুছুন" : "Delete picture"}><Trash2 /></button></> : <label className="profile-picture-empty"><Camera /><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event, slot)} disabled={uploading === slot} /></label>}</div>)}</div></section>{selectedPhoto ? <dialog ref={dialogRef} className="profile-photo-dialog" onCancel={(event) => { event.preventDefault(); setSelectedPhoto(null); }} onMouseDown={(event) => event.target === event.currentTarget && setSelectedPhoto(null)}><button type="button" className="profile-photo-full" onClick={() => setSelectedPhoto(null)} aria-label={lang === "bn" ? "বন্ধ করুন" : "Close profile picture"}><img src={selectedPhoto} alt="Profile picture" /></button></dialog> : null}</>;
}

function PostAudienceSettings({ user, notify }) {
  const [audience, setAudience] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.from("profiles").select("post_audience").eq("id", user.id).single().then(({ data, error }) => {
      if (!active) return;
      if (error) notify("Run 023_post_audience.sql in Supabase to set post visibility.");
      else setAudience(data.post_audience);
    });
    return () => { active = false; };
  }, [user.id, notify]);

  const selectAudience = async (nextAudience) => {
    if (!nextAudience || nextAudience === audience) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ post_audience: nextAudience }).eq("id", user.id);
    setSaving(false);
    if (error) return notify(error.message);
    setAudience(nextAudience);
    notify(`New posts will be visible to ${nextAudience === "PUBLIC" ? "everyone" : "followers"}.`);
  };

  const { lang } = useLanguage();
  return <div className="owner-menu-audience"><span>{lang === "bn" ? "পোস্ট দেখার পরিধি" : "Post audience"}</span><div role="group" aria-label="Post audience"><button type="button" className={audience === "PUBLIC" ? "active" : ""} onClick={() => selectAudience("PUBLIC")} disabled={saving}>{lang === "bn" ? "সবার জন্য উন্মুক্ত" : "Public"}</button><button type="button" className={audience === "FOLLOWERS" ? "active" : ""} onClick={() => selectAudience("FOLLOWERS")} disabled={saving}>{lang === "bn" ? "অনুসারীদের জন্য" : "Followers"}</button></div></div>;
}

function OwnerMenu({ user, onDeactivate, onSignOut, onOpenAbout, onOpenBookings, onOpenRatings, onOpenMessages, onOpenBusinessCatalog, notify, className = "", theme, onThemeChange }) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [postsOpen, setPostsOpen] = useState(false);
  const [accountRole, setAccountRole] = useState(user.user_metadata?.role || "TRAVELER");
  const [pendingRatings, setPendingRatings] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const isTraveler = accountRole === "TRAVELER";
  const isProvider = PROVIDER_ROLES.some(([role]) => role === accountRole);
  const isBusiness = accountRole === "BUSINESS_OWNER";

  useEffect(() => {
    let active = true;
    supabase.from("profiles").select("role").eq("id", user.id).single().then(({ data }) => {
      if (active && data?.role) setAccountRole(data.role);
    });
    return () => { active = false; };
  }, [user.id]);

  useEffect(() => {
    if (!isTraveler) {
      setPendingRatings(0);
      return undefined;
    }
    let active = true;
    const loadPendingRatings = async () => {
      const { count } = await supabase.from("traveler_review_requests").select("id", { count: "exact", head: true }).is("rating", null);
      if (active) setPendingRatings(count || 0);
    };
    loadPendingRatings();
    const interval = window.setInterval(loadPendingRatings, 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, [user.id, isTraveler]);

  useEffect(() => {
    if (!isProvider) {
      setPendingBookings(0);
      return undefined;
    }
    let active = true;
    const loadPendingBookings = async () => {
      const { count } = await supabase.from("provider_booking_requests").select("id", { count: "exact", head: true }).eq("status", "PENDING");
      if (active) setPendingBookings(count || 0);
    };
    loadPendingBookings();
    const interval = window.setInterval(loadPendingBookings, 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, [user.id, isProvider]);

  const pendingMenuCount = isTraveler ? pendingRatings : isProvider ? pendingBookings : 0;
  const pendingMenuLabel = isTraveler ? "ratings" : "booking requests";
  const { t, lang, setLang } = useLanguage();

  return <>
    <button type="button" className={`icon-button owner-menu-trigger ${className}`} onClick={() => setOpen(true)} aria-label={pendingMenuCount ? `Open account menu, ${pendingMenuCount} ${pendingMenuLabel} pending` : "Open account menu"} aria-expanded={open} title="Open account menu"><Menu />{pendingMenuCount ? <span className="owner-menu-trigger-badge">{pendingMenuCount > 9 ? "9+" : pendingMenuCount}</span> : null}</button>
    {open ? <><button type="button" className="owner-menu-backdrop" onClick={() => setOpen(false)} aria-label="Close account menu" /><aside className="owner-menu" role="dialog" aria-modal="true" aria-label="Account menu">
      <div className="owner-menu-head"><b>{t("account.menuTitle")}</b><button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close account menu" title="Close account menu"><X /></button></div>
      <button type="button" className="owner-menu-settings" onClick={() => setSettingsOpen((visible) => !visible)} aria-expanded={settingsOpen}><Settings />{t("account.settings")}<ChevronRight /></button>
      {settingsOpen ? <div className="owner-menu-settings-content"><button type="button" className="owner-menu-about" onClick={() => { setOpen(false); onOpenAbout(); }}><CircleUserRound />{t("account.about")}<ChevronRight /></button>{isTraveler ? <><button type="button" className="owner-menu-about owner-menu-rating-option" onClick={() => { setOpen(false); onOpenRatings(); }} aria-label={pendingRatings ? `Rate providers, ${pendingRatings} pending` : "Rate providers"}><Star />{t("account.rateProviders")}{pendingRatings ? <span className="owner-menu-rating-count">{pendingRatings > 9 ? "9+" : pendingRatings}</span> : null}<ChevronRight /></button><button type="button" className="owner-menu-about" onClick={() => setPostsOpen((visible) => !visible)} aria-expanded={postsOpen}><Send />{t("nav.timeline")}<ChevronRight /></button>{postsOpen ? <PostAudienceSettings user={user} notify={notify} /> : null}</> : null}<div className="owner-menu-theme"><span>{t("common.theme")}</span><div role="group" aria-label="Color theme"><button type="button" className={theme === "light" ? "active" : ""} onClick={() => onThemeChange("light")} aria-pressed={theme === "light"}><Sun />{t("common.light")}</button><button type="button" className={theme === "dark" ? "active" : ""} onClick={() => onThemeChange("dark")} aria-pressed={theme === "dark"}><Moon />{t("common.dark")}</button></div></div><div className="owner-menu-theme"><span>{t("common.language")}</span><div role="group" aria-label="Language selection"><button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")} aria-pressed={lang === "en"}>English</button><button type="button" className={lang === "bn" ? "active" : ""} onClick={() => setLang("bn")} aria-pressed={lang === "bn"}>বাংলা</button></div></div></div> : null}
      {isBusiness ? <button type="button" className="owner-menu-about" onClick={() => { setOpen(false); onOpenBusinessCatalog(); }}><Store />{t("account.manageShop")}<ChevronRight /></button> : null}
      <button type="button" className="owner-menu-about" onClick={() => { setOpen(false); onOpenMessages(); }}><MessageSquare />{t("account.messages")}{/* Messages<ChevronRight */}<ChevronRight /></button>
      <button type="button" className="owner-menu-deactivate" onClick={() => { setOpen(false); onDeactivate(); }}>{t("account.deactivate")}<UserRoundX /></button>
      <button type="button" className="owner-menu-signout" onClick={() => { setOpen(false); onSignOut(); }}>{t("account.signOut")}<LogOut /></button>
    </aside></> : null}
  </>;
}

function CancelBookingDialog({ booking, onClose, onConfirm }) {
  const { lang } = useLanguage();
  const dialogRef = useRef(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.open && dialog.close();
  }, []);

  const cancelBooking = async (event) => {
    event.preventDefault();
    setCancelling(true);
    if (await onConfirm()) onClose();
    else setCancelling(false);
  };

  const displayName = booking.traveler_name || booking.providers?.service_name || booking.providers?.display_name || (lang === "bn" ? "এই সেবা" : "this service");

  return <dialog ref={dialogRef} className="provider-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="modal booking-cancel-modal" onSubmit={cancelBooking} onMouseDown={(event) => event.stopPropagation()} aria-labelledby="cancel-booking-title">
      <button type="button" className="icon-button close" onClick={onClose} aria-label={lang === "bn" ? "বন্ধ করুন" : "Close"}><X /></button>
      <p className="eyebrow">{lang === "bn" ? "বুকিং বাতিল" : "Cancel booking"}</p>
      <h2 id="cancel-booking-title">{lang === "bn" ? `${displayName}-এর অনুরোধ বাতিল করবেন?` : `Cancel request for ${displayName}?`}</h2>
      <p>{lang === "bn" ? "বুকিংটি বাতিল হিসেবে চিহ্নিত হবে।" : "The booking will be marked as cancelled."}</p>
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>{lang === "bn" ? "বুকিং রাখুন" : "Keep booking"}</button><button className="button booking-cancel-confirm" disabled={cancelling}>{cancelling ? (lang === "bn" ? "বাতিল হচ্ছে..." : "Cancelling...") : (lang === "bn" ? "অনুরোধ বাতিল করুন" : "Cancel request")}</button></div>
    </form>
  </dialog>;
}

function bookingStatusLabel(status, lang) {
  if (lang !== "bn") return (status || "pending").toLowerCase();
  const map = { pending: "অপেক্ষমাণ", confirmed: "নিশ্চিত", completed: "সম্পন্ন", cancelled: "বাতিল" };
  return map[(status || "pending").toLowerCase()] || (status || "pending").toLowerCase();
}

function RatingDialog({ booking, onClose, onSubmit }) {
  const { lang } = useLanguage();
  const dialogRef = useRef(null);
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.open && dialog.close();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    if (await onSubmit(booking, rating)) onClose();
    else setSubmitting(false);
  };

  const displayName = booking?.provider_name || booking?.providers?.service_name || booking?.providers?.display_name || (lang === "bn" ? "সেবা প্রদানকারী" : "provider");

  return <dialog ref={dialogRef} className="provider-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="modal rating-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} aria-labelledby="rating-title">
      <button type="button" className="icon-button close" onClick={onClose} aria-label={lang === "bn" ? "বন্ধ করুন" : "Close"}><X /></button>
      <p className="eyebrow">{lang === "bn" ? "সম্পন্ন বুকিং" : "Completed booking"}</p>
      <h2 id="rating-title">{lang === "bn" ? `${displayName}-কে রেটিং দিন` : `Rate ${displayName}`}</h2>
      <p>{lang === "bn" ? "আপনার অভিজ্ঞতা কেমন ছিল? আপনার দেওয়া রেটিং এই প্রোভাইডারের পাবলিক প্রোফাইলে প্রদর্শিত হবে।" : "How was your experience? Your rating will be visible on this provider's public profile."}</p>
      <div className="rating-picker" role="group" aria-label="Choose a rating from 1 to 5 stars">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} className={rating >= value ? "active" : ""} onClick={() => setRating(value)} aria-label={`${value} star${value === 1 ? "" : "s"}`} aria-pressed={rating === value}><Star /></button>)}</div>
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>{lang === "bn" ? "এখন নয়" : "Not now"}</button><button className="button primary" disabled={!rating || submitting}>{submitting ? (lang === "bn" ? "জমা হচ্ছে..." : "Submitting...") : (lang === "bn" ? "রেটিং জমা দিন" : "Submit rating")}</button></div>
    </form>
  </dialog>;
}

function useUserOrders(user) {
  const [orders, setOrders] = useState(() => (user?.id ? loadUserOrders(user.id) : []));
  const [providerBookings, setProviderBookings] = useState([]);
  const [travelerBookings, setTravelerBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [seenIds, setSeenIds] = useState(() => (user?.id ? loadSeenOrderIds(user.id) : null));

  useEffect(() => {
    if (!user?.id) {
      setOrders([]);
      setProviderBookings([]);
      setTravelerBookings([]);
      setSeenIds(null);
      return;
    }
    let active = true;
    const local = loadUserOrders(user.id);
    if (active) setOrders(local);

    if (supabase) {
      setLoading(true);
      Promise.allSettled([
        supabase
          .from("provider_booking_requests")
          .select("id,traveler_id,traveler_name,traveler_avatar_url,service_type,start_date,duration_days,traveler_count,status,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select("id,provider_id,service_type,start_date,duration_days,traveler_count,status,created_at,providers(display_name,service_name,type,contact_phone,contact_email),reviews(id,rating,created_at)")
          .eq("traveler_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("product_orders")
          .select("*")
          .order("created_at", { ascending: false }),
      ]).then(([pRes, tRes, oRes]) => {
        if (!active) return;
        setLoading(false);
        if (pRes.status === "fulfilled" && !pRes.value.error && Array.isArray(pRes.value.data)) {
          setProviderBookings(pRes.value.data);
        }
        if (tRes.status === "fulfilled" && !tRes.value.error && Array.isArray(tRes.value.data)) {
          setTravelerBookings(tRes.value.data);
        }
        if (oRes.status === "fulfilled" && !oRes.value.error && Array.isArray(oRes.value.data)) {
          setOrders(oRes.value.data.length ? oRes.value.data : local);
        }
      });
    }

    return () => {
      active = false;
    };
  }, [user?.id, refreshKey]);

  const allItemIds = useMemo(() => [
    ...providerBookings.map((b) => b.id),
    ...travelerBookings.map((b) => b.id),
    ...orders.map((o) => o.id),
  ].filter(Boolean), [providerBookings, travelerBookings, orders]);

  useEffect(() => {
    if (!user?.id) return;
    if (seenIds === null && allItemIds.length > 0) {
      saveSeenOrderIds(user.id, allItemIds);
      setSeenIds(new Set(allItemIds));
    }
  }, [user?.id, seenIds, allItemIds]);

  const markOrdersSeen = useCallback(() => {
    if (!user?.id) return;
    const currentIds = [
      ...providerBookings.map((b) => b.id),
      ...travelerBookings.map((b) => b.id),
      ...orders.map((o) => o.id),
    ].filter(Boolean);
    saveSeenOrderIds(user.id, currentIds);
    setSeenIds(new Set(currentIds));
  }, [user?.id, providerBookings, travelerBookings, orders]);

  const cancelOrder = async (orderId) => {
    cancelUserOrder(orderId, user?.id);
    if (supabase) {
      try {
        await supabase.from("product_orders").update({ status: "CANCELLED" }).eq("id", orderId);
      } catch {}
    }
    setOrders((current) => current.map((ord) => (ord.id === orderId ? { ...ord, status: "CANCELLED" } : ord)));
    setRefreshKey((v) => v + 1);
  };

  const updateOrderStatus = async (orderId, status) => {
    if (supabase) {
      try {
        await supabase.from("product_orders").update({ status }).eq("id", orderId);
      } catch {}
    }
    setOrders((current) => current.map((ord) => (ord.id === orderId ? { ...ord, status } : ord)));
    setRefreshKey((v) => v + 1);
  };

  const updateBookingStatus = async (bookingId, status) => {
    if (!supabase) return;
    const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
    if (!error) {
      setRefreshKey((v) => v + 1);
    }
    return error;
  };

  const submitBookingRating = async (booking, rating) => {
    if (!supabase) return { error: new Error("Supabase not connected") };
    if (booking.status === "CONFIRMED") {
      const { error: statusErr } = await supabase.from("bookings").update({ status: "COMPLETED" }).eq("id", booking.id);
      if (statusErr) return { error: statusErr };
    }
    const { error } = await supabase.from("reviews").insert({ booking_id: booking.id, traveler_id: user?.id, rating });
    if (!error || error.code === "23505") {
      setRefreshKey((v) => v + 1);
    }
    return { error };
  };

  const totalCount = providerBookings.length + travelerBookings.length + orders.length;
  const pendingCount =
    providerBookings.filter((b) => b.status === "PENDING").length +
    travelerBookings.filter((b) => b.status === "PENDING").length +
    orders.filter((o) => (o.status || "PENDING") === "PENDING").length;

  const unseenCount = seenIds === null ? 0 : allItemIds.filter((id) => !seenIds.has(id)).length;

  return {
    orders,
    providerBookings,
    travelerBookings,
    totalCount,
    pendingCount,
    unseenCount,
    markOrdersSeen,
    loading,
    cancelOrder,
    updateOrderStatus,
    updateBookingStatus,
    submitBookingRating,
    refreshOrders: () => setRefreshKey((v) => v + 1),
  };
}



function ProviderDashboard({ user, notify, onOpenOrders }) {
  const { lang, toBengaliNumber } = useLanguage();
  const [state, setState] = useState({ loading: true, profile: null, provider: null, rating: null, error: "", detailsAvailable: true });
  const [postVersion, setPostVersion] = useState(0);
  const { totalCount, unseenCount, markOrdersSeen } = useUserOrders(user);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadProfile(user.id, ",role,status"),
      supabase.from("providers").select("id,type,display_name,service_name,contact_email,contact_phone,bio").eq("user_id", user.id).maybeSingle(),
      supabase.from("public_provider_details").select("rating_average,rating_count").eq("user_id", user.id).maybeSingle(),
    ]).then(([profileResult, providerResult, ratingResult]) => {
      if (!active) return;
      setState({ loading: false, profile: profileResult.data, provider: providerResult.data, rating: ratingResult.data, error: profileResult.error?.message || providerResult.error?.message || ratingResult.error?.message || "", detailsAvailable: profileResult.detailsAvailable });
    });
    return () => { active = false; };
  }, [user.id]);

  if (state.loading) return <main className="page-shell page-top provider-dashboard"><p>{lang === "bn" ? "প্রোভাইডার অ্যাকাউন্ট লোড হচ্ছে..." : "Loading your provider account..."}</p></main>;
  if (state.error) return <main className="page-shell page-top provider-dashboard"><p className="form-error">{state.error}</p></main>;

  const { profile, provider, rating } = state;
  return <main className="page-shell page-top provider-dashboard">
    <div className="page-title dashboard-title"><ProfileAvatar user={user} profile={profile || {}} provider={provider} notify={notify} onSaved={(nextProfile) => setState((current) => ({ ...current, profile: nextProfile }))} /><div><p className="eyebrow">{lang === "bn" ? "হ্যালো," : "Hello,"}</p><h1 className="dashboard-greeting">{profile?.full_name || provider?.display_name || (lang === "bn" ? "সেবা প্রদানকারী" : "provider")}</h1><ProviderRating profile={rating || {}} /><ProfileBio profile={{ ...profile, bio: profile?.bio || provider?.bio }} fallback={lang === "bn" ? "নিচে আপনার পরিচিতি যোগ করুন।" : "Add your bio below."} /><DashboardFollowerCount userId={user.id} /></div><div className="dashboard-post-action"><button type="button" className="button secondary create-post-button dashboard-order-btn" onClick={() => { markOrdersSeen(); onOpenOrders?.(); }} title={lang === "bn" ? "আমার অর্ডারসমূহ" : "My orders"}><ShoppingBag size={17} /><span>{lang === "bn" ? "আমার অর্ডার" : "My order"}</span>{unseenCount ? <span className="owner-menu-booking-count">{toBengaliNumber(unseenCount)}</span> : null}</button><PostPublisher user={user} notify={notify} onPublished={() => setPostVersion((version) => version + 1)} /></div></div>
    {provider ? <section className="provider-dashboard-panel" aria-label={lang === "bn" ? "প্রোভাইডার অ্যাকাউন্টের বিবরণ" : "Provider account details"}>
      <div><span>{lang === "bn" ? "সেবার ধরন" : "Provider type"}</span><b>{lang === "bn" ? (PROVIDER_ROLE_LABELS_BN[profile?.role] || provider.type) : (PROVIDER_TYPE_LABELS[profile?.role] || provider.type)}</b></div>
      <div><span>{lang === "bn" ? "সার্ভিসের নাম" : "Service name"}</span>{/* Service name */}<b>{provider.service_name || (lang === "bn" ? "যুক্ত করা হয়নি" : "Not added")}</b></div>
    </section> : <p className="form-error">{lang === "bn" ? "আপনার প্রোভাইডার সেটআপ অসম্পূর্ণ। একবার প্রোভাইডার মাইগ্রেশন চালিয়ে পেজটি পুনরায় খুলুন।" : "Your provider setup is incomplete. Run the provider migration once, then reopen this page."}</p>}
    {profile ? <ProfilePhotoGallery user={user} profile={profile} provider={provider} notify={notify} onSaved={(nextProfile) => setState((current) => ({ ...current, profile: nextProfile }))} /> : null}
    {profile ? <DashboardPosts user={user} profile={profile} provider={provider} refreshKey={postVersion} notify={notify} /> : null}
  </main>;
}

function ProviderBookingRequestsPage({ user, notify, onBack }) {
  const { lang, toBengaliNumber } = useLanguage();
  const {
    orders,
    providerBookings,
    travelerBookings,
    loading,
    cancelOrder,
    updateOrderStatus,
    updateBookingStatus,
    submitBookingRating,
    markOrdersSeen,
  } = useUserOrders(user);

  useEffect(() => {
    markOrdersSeen();
  }, [markOrdersSeen]);

  const bookingsCount = (providerBookings?.length || 0) + (travelerBookings?.length || 0);
  const productsCount = orders?.length || 0;
  const [activeTab, setActiveTab] = useState(() => (bookingsCount > 0 ? "bookings" : productsCount > 0 ? "products" : "bookings"));
  const [updatingId, setUpdatingId] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [ratingBooking, setRatingBooking] = useState(null);

  const handleStatusChange = async (booking, status) => {
    setUpdatingId(booking.id);
    const err = await updateBookingStatus(booking.id, status);
    setUpdatingId(null);
    if (err) {
      notify?.(err.message);
      return;
    }
    notify?.(
      status === "CONFIRMED"
        ? (lang === "bn" ? "বুকিং নিশ্চিত হয়েছে।" : "Booking confirmed.")
        : status === "CANCELLED"
        ? (lang === "bn" ? "বুকিং বাতিল হয়েছে।" : "Booking cancelled.")
        : (lang === "bn" ? "বুকিং সম্পন্ন চিহ্নিত হয়েছে।" : "Booking marked completed.")
    );
  };

  const handleRatingSubmit = async (booking, rating) => {
    const res = await submitBookingRating(booking, rating);
    if (res?.error) {
      if (res.error.code === "23505") {
        notify?.(lang === "bn" ? "আপনি ইতোমধ্যে এই প্রোভাইডারকে রেটিং দিয়েছেন।" : "You already rated this provider.");
        return true;
      }
      notify?.(res.error.message);
      return false;
    }
    notify?.(lang === "bn" ? "আপনার প্রোভাইডার রেটিং জমা হয়েছে।" : "Your provider rating was submitted.");
    return true;
  };

  return (
    <main className="page-shell page-top provider-booking-requests-page">
      <button type="button" className="back-button" onClick={onBack}>
        <ArrowLeft />
        {lang === "bn" ? "ড্যাশবোর্ডে ফিরে যান" : "Back to dashboard"}
      </button>

      <div className="my-orders-tabs" role="tablist" style={{ margin: "20px auto 0", maxWidth: 760 }}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "bookings"}
          className={`my-orders-tab ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          <CalendarDays size={16} />
          <span>{lang === "bn" ? "সেবা বুকিং" : "Service bookings"}</span>
          {bookingsCount ? (
            <span className="my-orders-tab-count">{toBengaliNumber(bookingsCount)}</span>
          ) : null}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "products"}
          className={`my-orders-tab ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <ShoppingBag size={16} />
          <span>{lang === "bn" ? "পণ্যের অর্ডার" : "Product orders"}</span>
          {productsCount ? (
            <span className="my-orders-tab-count">{toBengaliNumber(productsCount)}</span>
          ) : null}
        </button>
      </div>

      {activeTab === "bookings" ? (
        <section className="provider-bookings" aria-labelledby="provider-bookings-title" style={{ marginTop: 24 }}>
          <div className="provider-bookings-heading">
            <div>
              <p className="eyebrow">{lang === "bn" ? "বুকিং অনুরোধ" : "Booking requests"}</p>
              <h2 id="provider-bookings-title">{lang === "bn" ? "আপনার সেবার অনুরোধসমূহ" : "Your service requests"}</h2>
            </div>
          </div>
          {loading ? <p className="form-note">{lang === "bn" ? "বুকিং অনুরোধ লোড হচ্ছে..." : "Loading booking requests..."}</p> : null}
          {!loading && providerBookings.length === 0 && travelerBookings.length === 0 ? (
            <p className="booking-empty">{lang === "bn" ? "ভ্রমণকারীদের নতুন বুকিং অনুরোধ এখানে প্রদর্শিত হবে।" : "New traveler booking requests will appear here."}</p>
          ) : null}
          {providerBookings.length > 0 ? (
            <div className="booking-list">
              {providerBookings.map((booking) => (
                <article className="booking-card" key={booking.id}>
                  <div>
                    <p className="eyebrow">{SERVICE_META[booking.service_type]?.label || booking.service_type}</p>
                    <div className="booking-requester">
                      <span>{booking.traveler_avatar_url ? <img src={booking.traveler_avatar_url} alt="" /> : <CircleUserRound />}</span>
                      <h3>{booking.traveler_name}</h3>
                    </div>
                    <p>
                      {new Date(`${booking.start_date}T12:00:00`).toLocaleDateString(lang === "bn" ? "bn-BD" : undefined, { day: "numeric", month: "short", year: "numeric" })} · {toBengaliNumber(booking.duration_days)} {lang === "bn" ? "দিন" : (booking.duration_days === 1 ? "day" : "days")} · {toBengaliNumber(booking.traveler_count)} {lang === "bn" ? "জন ভ্রমণকারী" : (booking.traveler_count === 1 ? "traveler" : "travelers")}
                    </p>
                  </div>
                  <div className="booking-card-action">
                    <span className={`booking-status ${(booking.status || "pending").toLowerCase()}`}>
                      {bookingStatusLabel(booking.status, lang)}
                    </span>
                    {booking.status === "PENDING" ? (
                      <button
                        type="button"
                        className="button primary"
                        onClick={() => handleStatusChange(booking, "CONFIRMED")}
                        disabled={updatingId === booking.id}
                      >
                        {updatingId === booking.id ? (lang === "bn" ? "নিশ্চিত হচ্ছে..." : "Confirming...") : (lang === "bn" ? "বুকিং নিশ্চিত করুন" : "Confirm booking")}
                      </button>
                    ) : null}
                    {booking.status === "CONFIRMED" ? (
                      <button
                        type="button"
                        className="button primary"
                        onClick={() => handleStatusChange(booking, "COMPLETED")}
                        disabled={updatingId === booking.id}
                      >
                        {updatingId === booking.id ? (lang === "bn" ? "আপডেট হচ্ছে..." : "Updating...") : (lang === "bn" ? "সম্পন্ন চিহ্নিত করুন" : "Mark completed")}
                      </button>
                    ) : null}
                    {["PENDING", "CONFIRMED"].includes(booking.status) ? (
                      <button
                        type="button"
                        className="button secondary booking-cancel"
                        onClick={() => setCancellingBooking(booking)}
                        disabled={updatingId === booking.id}
                      >
                        {lang === "bn" ? "বুকিং বাতিল করুন" : "Cancel booking"}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : travelerBookings.length > 0 ? (
            <div className="booking-list">
              {travelerBookings.map((booking) => {
                const userReview = Array.isArray(booking.reviews) ? booking.reviews[0] : booking.reviews;
                const reviewRating = userReview?.rating;
                return (
                  <article className="booking-card" key={booking.id}>
                    <div>
                      <p className="eyebrow">{SERVICE_META[booking.service_type]?.label || booking.service_type}</p>
                      <h3>{booking.providers?.service_name || booking.providers?.display_name || (lang === "bn" ? "সেবা প্রদানকারী" : "Service provider")}</h3>
                      <p>
                        {new Date(`${booking.start_date}T12:00:00`).toLocaleDateString(lang === "bn" ? "bn-BD" : undefined, { day: "numeric", month: "short", year: "numeric" })} · {toBengaliNumber(booking.duration_days)} {lang === "bn" ? "দিন" : (booking.duration_days === 1 ? "day" : "days")} · {toBengaliNumber(booking.traveler_count)} {lang === "bn" ? "জন ভ্রমণকারী" : (booking.traveler_count === 1 ? "traveler" : "travelers")}
                      </p>
                      {["CONFIRMED", "COMPLETED"].includes(booking.status) && booking.providers?.contact_phone ? (
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
                          <b>{lang === "bn" ? "যোগাযোগ" : "Contact"}:</b> <a href={`tel:${booking.providers.contact_phone}`}>{booking.providers.contact_phone}</a>
                        </p>
                      ) : null}
                    </div>
                    <div className="booking-card-action">
                      <span className={`booking-status ${(booking.status || "pending").toLowerCase()}`}>
                        {bookingStatusLabel(booking.status, lang)}
                      </span>
                      {booking.status === "PENDING" ? (
                        <button
                          type="button"
                          className="button secondary booking-cancel"
                          onClick={() => setCancellingBooking(booking)}
                          disabled={updatingId === booking.id}
                        >
                          {lang === "bn" ? "অনুরোধ বাতিল করুন" : "Cancel request"}
                        </button>
                      ) : null}
                      {booking.status === "CONFIRMED" ? (
                        <>
                          <button
                            type="button"
                            className="button primary"
                            onClick={async () => {
                              await handleStatusChange(booking, "COMPLETED");
                              setRatingBooking(booking);
                            }}
                            disabled={updatingId === booking.id}
                          >
                            <Check size={16} />
                            {updatingId === booking.id ? (lang === "bn" ? "আপডেট হচ্ছে..." : "Updating...") : (lang === "bn" ? "ট্যুর সম্পন্ন চিহ্নিত করুন" : "Mark completed")}
                          </button>
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => setRatingBooking(booking)}
                            disabled={updatingId === booking.id}
                          >
                            <Star size={16} />
                            {lang === "bn" ? "রেটিং দিন" : "Rate provider"}
                          </button>
                          <button
                            type="button"
                            className="button secondary booking-cancel"
                            onClick={() => setCancellingBooking(booking)}
                            disabled={updatingId === booking.id}
                          >
                            {lang === "bn" ? "বুকিং বাতিল করুন" : "Cancel booking"}
                          </button>
                        </>
                      ) : null}
                      {booking.status === "COMPLETED" ? (
                        reviewRating ? (
                          <p className="traveler-rating">
                            <Star />
                            <b>{toBengaliNumber(reviewRating)}.0</b>
                            <span>{lang === "bn" ? "আপনার রেটিং" : "Your rating"}</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            className="button primary"
                            onClick={() => setRatingBooking(booking)}
                          >
                            <Star size={16} />
                            {lang === "bn" ? "রেটিং দিন" : "Rate provider"}
                          </button>
                        )
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : (
        <section className="provider-bookings" aria-labelledby="provider-orders-title" style={{ marginTop: 24 }}>
          <div className="provider-bookings-heading">
            <div>
              <p className="eyebrow">{lang === "bn" ? "মার্কেটপ্লেস অর্ডার" : "Marketplace orders"}</p>
              <h2 id="provider-orders-title">{lang === "bn" ? "আপনার পণ্যের অর্ডারসমূহ" : "Your product orders"}</h2>
            </div>
          </div>
          {orders && orders.length ? (
            <div className="my-orders-list">
              {orders.map((order) => (
                <article className="my-order-item" key={order.id}>
                  <div className="my-order-head">
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18 }}>{order.product_name}</h3>
                      <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: 13 }}>
                        {order.business_name ? `${order.business_name} · ` : ""}{new Date(order.created_at || order.createdAt).toLocaleDateString(lang === "bn" ? "bn-BD" : undefined, { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className={`my-order-status ${(order.status || "pending").toLowerCase()}`}>
                      {order.status === "CONFIRMED" ? (lang === "bn" ? "নিশ্চিত" : "Confirmed")
                        : order.status === "SHIPPED" ? (lang === "bn" ? "পাঠানো হয়েছে" : "Shipped")
                        : order.status === "DELIVERED" ? (lang === "bn" ? "সরবরাহকৃত" : "Delivered")
                        : order.status === "CANCELLED" ? (lang === "bn" ? "বাতিল" : "Cancelled")
                        : (lang === "bn" ? "অপেক্ষমাণ" : "Pending")}
                    </span>
                  </div>
                  <div className="my-order-details">
                    <span>{lang === "bn" ? "পরিমাণ" : "Qty"}: {toBengaliNumber(order.quantity)}</span>
                    <span>{lang === "bn" ? "মোট" : "Total"}: <b>৳{toBengaliNumber((order.total_price || (order.product_price * order.quantity) || 0).toLocaleString())}</b></span>
                  </div>
                  {order.delivery_address ? (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      <b>{lang === "bn" ? "ঠিকানা" : "Address"}:</b> {order.delivery_address}
                    </p>
                  ) : null}
                  {order.user_id !== user?.id && order.contact_phone ? (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      <b>{lang === "bn" ? "ক্রেতার ফোন" : "Customer phone"}:</b> <a href={`tel:${order.contact_phone}`}>{order.contact_phone}</a>
                    </p>
                  ) : order.business_contact ? (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      <b>{lang === "bn" ? "বিক্রেতার যোগাযোগ" : "Seller contact"}:</b> <a href={`tel:${order.business_contact}`}>{order.business_contact}</a>
                    </p>
                  ) : null}
                  {order.note ? (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      <b>{lang === "bn" ? "নোট" : "Note"}:</b> {order.note}
                    </p>
                  ) : null}
                  {order.user_id !== user?.id ? (
                    <div style={{ marginTop: 6, display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      {order.status === "PENDING" || !order.status ? (
                        <>
                          <button type="button" className="button primary" style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => updateOrderStatus?.(order.id, "CONFIRMED")}>
                            {lang === "bn" ? "অর্ডার নিশ্চিত করুন" : "Confirm order"}
                          </button>
                          <button type="button" className="button secondary danger" style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => updateOrderStatus?.(order.id, "CANCELLED")}>
                            {lang === "bn" ? "অর্ডার বাতিল করুন" : "Cancel order"}
                          </button>
                        </>
                      ) : null}
                      {order.status === "CONFIRMED" ? (
                        <button type="button" className="button primary" style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => updateOrderStatus?.(order.id, "SHIPPED")}>
                          {lang === "bn" ? "পাঠানো হয়েছে চিহ্নিত করুন" : "Mark shipped"}
                        </button>
                      ) : null}
                      {order.status === "SHIPPED" ? (
                        <button type="button" className="button primary" style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => updateOrderStatus?.(order.id, "DELIVERED")}>
                          {lang === "bn" ? "সরবরাহকৃত চিহ্নিত করুন" : "Mark delivered"}
                        </button>
                      ) : null}
                    </div>
                  ) : order.status === "PENDING" || !order.status ? (
                    <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
                      <button type="button" className="button secondary danger" style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => cancelOrder(order.id)}>
                        {lang === "bn" ? "অর্ডার বাতিল করুন" : "Cancel order"}
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="business-empty" style={{ margin: "20px 0" }}>
              <ShoppingBag />
              <p>{lang === "bn" ? "আপনার এখনো কোনো পণ্যের অর্ডার নেই।" : "You have not placed any product orders yet."}</p>
            </div>
          )}
        </section>
      )}

      {cancellingBooking ? (
        <CancelBookingDialog
          booking={cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          onConfirm={async () => {
            await handleStatusChange(cancellingBooking, "CANCELLED");
            setCancellingBooking(null);
            return true;
          }}
        />
      ) : null}

      {ratingBooking ? (
        <RatingDialog
          booking={ratingBooking}
          onClose={() => setRatingBooking(null)}
          onSubmit={handleRatingSubmit}
        />
      ) : null}
    </main>
  );
}

function ProviderBookings({ provider, notify }) {
  const { lang, toBengaliNumber } = useLanguage();
  const [state, setState] = useState({ loading: true, bookings: [], error: "" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);

  useEffect(() => {
    let active = true;
    const loadBookings = async () => {
      setState((current) => ({ ...current, loading: true, error: "" }));
      const { data: bookings, error } = await supabase.from("provider_booking_requests").select("id,traveler_id,traveler_name,traveler_avatar_url,service_type,start_date,duration_days,traveler_count,status,created_at").order("created_at", { ascending: false });
      if (!active) return;
      if (error) return setState({ loading: false, bookings: [], error: error.message });
      setState({ loading: false, error: "", bookings: bookings || [] });
    };
    loadBookings();
    return () => { active = false; };
  }, [provider.id, refreshKey]);

  const updateStatus = async (booking, status) => {
    setUpdatingId(booking.id);
    const { error } = await supabase.from("bookings").update({ status }).eq("id", booking.id);
    setUpdatingId(null);
    if (error) { notify(error.message); return false; }
    setRefreshKey((value) => value + 1);
    notify(status === "CONFIRMED" ? (lang === "bn" ? "বুকিং নিশ্চিত হয়েছে।" : "Booking confirmed.") : status === "CANCELLED" ? (lang === "bn" ? "বুকিং বাতিল হয়েছে।" : "Booking cancelled.") : (lang === "bn" ? "বুকিং সম্পন্ন চিহ্নিত হয়েছে।" : "Booking marked completed."));
    return true;
  };

  const bookingStatusLabel = (status) => {
    if (lang !== "bn") return status.toLowerCase();
    const map = { pending: "অপেক্ষমাণ", confirmed: "নিশ্চিত", completed: "সম্পন্ন", cancelled: "বাতিল" };
    return map[status.toLowerCase()] || status.toLowerCase();
  };

  return <section className="provider-bookings" aria-labelledby="provider-bookings-title">
    <div className="provider-bookings-heading"><div><p className="eyebrow">{lang === "bn" ? "বুকিং অনুরোধ" : "Booking requests"}{/* Booking requests */}</p><h2 id="provider-bookings-title">{lang === "bn" ? "আপনার সেবার অনুরোধসমূহ" : "Your service requests"}{/* Your service requests */}</h2></div></div>
    {state.loading ? <p className="form-note">{lang === "bn" ? "বুকিং অনুরোধ লোড হচ্ছে..." : "Loading booking requests..."}</p> : null}
    {state.error ? <p className="form-error">{state.error}</p> : null}
    {!state.loading && !state.error && !state.bookings.length ? <p className="booking-empty">{lang === "bn" ? "ভ্রমণকারীদের নতুন বুকিং অনুরোধ এখানে প্রদর্শিত হবে।" : "New traveler booking requests will appear here."}</p> : null}
    <div className="booking-list">{state.bookings.map((booking) => <article className="booking-card" key={booking.id}>
      <div><p className="eyebrow">{SERVICE_META[booking.service_type]?.label || booking.service_type}</p><div className="booking-requester"><span>{booking.traveler_avatar_url ? <img src={booking.traveler_avatar_url} alt="" /> : <CircleUserRound />}</span><h3>{booking.traveler_name}</h3></div><p>{new Date(`${booking.start_date}T12:00:00`).toLocaleDateString(lang === "bn" ? "bn-BD" : undefined, { day: "numeric", month: "short", year: "numeric" })} · {toBengaliNumber(booking.duration_days)} {lang === "bn" ? "দিন" : (booking.duration_days === 1 ? "day" : "days")} · {toBengaliNumber(booking.traveler_count)} {lang === "bn" ? "জন ভ্রমণকারী" : (booking.traveler_count === 1 ? "traveler" : "travelers")}</p></div>
      <div className="booking-card-action"><span className={`booking-status ${booking.status.toLowerCase()}`}>{bookingStatusLabel(booking.status)}</span>{booking.status === "PENDING" ? <button type="button" className="button primary" onClick={() => updateStatus(booking, "CONFIRMED")} disabled={updatingId === booking.id}>{updatingId === booking.id ? (lang === "bn" ? "নিশ্চিত হচ্ছে..." : "Confirming...") : (lang === "bn" ? "বুকিং নিশ্চিত করুন" : "Confirm booking")}{/* Confirm booking */}</button> : null}{booking.status === "CONFIRMED" ? <button type="button" className="button primary" onClick={() => updateStatus(booking, "COMPLETED")} disabled={updatingId === booking.id}>{updatingId === booking.id ? (lang === "bn" ? "আপডেট হচ্ছে..." : "Updating...") : (lang === "bn" ? "সম্পন্ন চিহ্নিত করুন" : "Mark completed")}{/* Mark completed */}</button> : null}{["PENDING", "CONFIRMED"].includes(booking.status) ? <button type="button" className="button secondary booking-cancel" onClick={() => setCancellingBooking(booking)} disabled={updatingId === booking.id}>{lang === "bn" ? "বুকিং বাতিল করুন" : "Cancel booking"}{/* Cancel booking */}</button> : null}</div>
    </article>)}</div>
    {cancellingBooking ? <CancelBookingDialog booking={cancellingBooking} onClose={() => setCancellingBooking(null)} onConfirm={() => updateStatus(cancellingBooking, "CANCELLED")} /> : null}
  </section>;
}

function TravelerDashboard({ user, notify, onOpenOrders }) {
  const { lang, toBengaliNumber } = useLanguage();
  const [state, setState] = useState({ loading: true, profile: null, error: "", detailsAvailable: true });
  const [tripCount] = useState(() => loadSavedTrips(user.id).length);
  const [postVersion, setPostVersion] = useState(0);
  const { totalCount, unseenCount, markOrdersSeen } = useUserOrders(user);
  const fallbackProfile = { full_name: user.user_metadata?.full_name || "", email: user.email, phone: user.user_metadata?.phone || "", phone_visible: false, ...PROFILE_DETAILS_DEFAULTS };

  useEffect(() => {
    let active = true;
    loadProfile(user.id).then(({ data, detailsAvailable }) => {
      if (active) setState({ loading: false, profile: data || fallbackProfile, error: "", detailsAvailable });
    });
    return () => { active = false; };
  }, [user.id]);

  if (state.loading) return <main className="page-shell page-top traveler-dashboard"><p>{lang === "bn" ? "ভ্রমণকারী অ্যাকাউন্ট লোড হচ্ছে..." : "Loading your traveler account..."}</p></main>;
  const { profile } = state;
  return <main className="page-shell page-top traveler-dashboard">
    <div className="page-title dashboard-title"><ProfileAvatar user={user} profile={profile} notify={notify} onSaved={(nextProfile) => setState((current) => ({ ...current, profile: nextProfile }))} /><div><p className="eyebrow">{lang === "bn" ? "হ্যালো," : "Hello,"}</p><h1 className="dashboard-greeting">{profile.full_name || (lang === "bn" ? "ভ্রমণকারী" : "traveler")}</h1><ProfileBio profile={profile} fallback={lang === "bn" ? "আপনার TourismuBD অ্যাকাউন্ট এবং সংরক্ষিত ভ্রমণের পরিকল্পনা।" : "Your TourismuBD account and saved trip plans."} /><DashboardFollowerCount userId={user.id} /></div><div className="dashboard-post-action"><button type="button" className="button secondary create-post-button dashboard-order-btn" onClick={() => { markOrdersSeen(); onOpenOrders?.(); }} title={lang === "bn" ? "আমার অর্ডারসমূহ" : "My orders"}><ShoppingBag size={17} /><span>{lang === "bn" ? "আমার অর্ডার" : "My order"}</span>{unseenCount ? <span className="owner-menu-booking-count">{toBengaliNumber(unseenCount)}</span> : null}</button><PostPublisher user={user} notify={notify} onPublished={() => setPostVersion((version) => version + 1)} /></div></div>
    <section className="provider-dashboard-panel" aria-label={lang === "bn" ? "ভ্রমণকারী অ্যাকাউন্টের বিবরণ" : "Traveler account details"}>
      <div><span>{lang === "bn" ? "সংরক্ষিত ভ্রমণ পরিকল্পনা" : "Saved itineraries"}</span><b>{toBengaliNumber(tripCount)}</b></div>
      <div><span>{lang === "bn" ? "আমার অর্ডারসমূহ" : "My orders"}</span><b><button type="button" className="link-button" onClick={() => { markOrdersSeen(); onOpenOrders?.(); }} style={{ fontWeight: 700, color: "var(--river-dark)" }}>{toBengaliNumber(totalCount)} {lang === "bn" ? "টি আইটেম" : "items"}</button></b></div>
    </section>
    <ProfilePhotoGallery user={user} profile={profile} notify={notify} onSaved={(nextProfile) => setState((current) => ({ ...current, profile: nextProfile }))} />
    <DashboardPosts user={user} profile={profile} refreshKey={postVersion} notify={notify} />
  </main>;
}

function BusinessDashboard({ user, notify, onOpenOrders }) {
  const { lang, toBengaliNumber } = useLanguage();
  const [state, setState] = useState({ loading: true, profile: null, business: null, error: "" });
  const [postVersion, setPostVersion] = useState(0);
  const { totalCount, unseenCount, markOrdersSeen } = useUserOrders(user);
  const fallbackProfile = { full_name: user.user_metadata?.full_name || "", email: user.email, phone: user.user_metadata?.phone || "", phone_visible: false, ...PROFILE_DETAILS_DEFAULTS };

  useEffect(() => {
    let active = true;
    Promise.all([
      loadProfile(user.id, ",role"),
      supabase.from("businesses").select("business_name").eq("user_id", user.id).maybeSingle(),
    ]).then(([profileResult, businessResult]) => {
      if (active) setState({ loading: false, profile: profileResult.data || fallbackProfile, business: businessResult.data, error: profileResult.error?.message || "" });
    });
    return () => { active = false; };
  }, [user.id]);

  if (state.loading) return <main className="page-shell page-top provider-dashboard"><p>{lang === "bn" ? "উদ্যোক্তা অ্যাকাউন্ট লোড হচ্ছে..." : "Loading your business account..."}</p></main>;
  if (state.error) return <main className="page-shell page-top provider-dashboard"><p className="form-error">{state.error}</p></main>;

  const { profile, business } = state;
  return <main className="page-shell page-top provider-dashboard business-profile-dashboard">
    <div className="page-title dashboard-title"><ProfileAvatar user={user} profile={profile} notify={notify} onSaved={(nextProfile) => setState((current) => ({ ...current, profile: nextProfile }))} /><div><p className="eyebrow">{lang === "bn" ? "হ্যালো," : "Hello,"}</p><h1 className="dashboard-greeting">{profile.full_name || (lang === "bn" ? "উদ্যোক্তা" : "business owner")}</h1><ProfileBio profile={profile} fallback={lang === "bn" ? "অ্যাকাউন্ট সেটিংসে আপনার পরিচিতি যোগ করুন।" : "Add your bio in account settings."} /><DashboardFollowerCount userId={user.id} /></div><div className="dashboard-post-action"><button type="button" className="button secondary create-post-button dashboard-order-btn" onClick={() => { markOrdersSeen(); onOpenOrders?.(); }} title={lang === "bn" ? "আমার অর্ডারসমূহ" : "My orders"}><ShoppingBag size={17} /><span>{lang === "bn" ? "আমার অর্ডার" : "My order"}</span>{unseenCount ? <span className="owner-menu-booking-count">{toBengaliNumber(unseenCount)}</span> : null}</button><PostPublisher user={user} notify={notify} businessPost onPublished={() => setPostVersion((version) => version + 1)} /></div></div>
    <section className="provider-dashboard-panel" aria-label={lang === "bn" ? "উদ্যোক্তা অ্যাকাউন্টের বিবরণ" : "Business account details"}>
      <div><span>{lang === "bn" ? "ব্যবসা / উদ্যোগ" : "Business"}</span><b>{business?.business_name || (lang === "bn" ? "উদ্যোক্তা অ্যাকাউন্ট" : "Business account")}</b></div>
      <div><span>{lang === "bn" ? "আমার অর্ডারসমূহ" : "My orders"}</span><b><button type="button" className="link-button" onClick={() => { markOrdersSeen(); onOpenOrders?.(); }} style={{ fontWeight: 700, color: "var(--river-dark)" }}>{toBengaliNumber(totalCount)} {lang === "bn" ? "টি আইটেম" : "items"}</button></b></div>
    </section>
    <ProfilePhotoGallery user={user} profile={profile} notify={notify} onSaved={(nextProfile) => setState((current) => ({ ...current, profile: nextProfile }))} />
    <DashboardPosts user={user} profile={profile} refreshKey={postVersion} notify={notify} />
  </main>;
}

function BusinessCatalogPage({ user, notify, onBack }) {
  const { lang, toBengaliNumber } = useLanguage();
  const [state, setState] = useState({ loading: true, business: null, products: [], error: "" });
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const productFormRef = useRef(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const businessResult = await supabase.from("businesses").select("id,user_id,business_name,description,district,contact_email,contact_phone,account_status,public_status").eq("user_id", user.id).maybeSingle();
      if (!active) return;
      if (businessResult.error) return setState({ loading: false, business: null, products: [], error: /businesses.*schema cache|relation .*businesses.*does not exist/i.test(businessResult.error.message) ? "Business accounts are not set up yet. Run Supabase migrations 072 and 073 in order." : businessResult.error.message });
      if (!businessResult.data) return setState({ loading: false, business: null, products: [], error: "Your business setup is incomplete. Run migrations 072 and 073, then create the account again." });
      const productResult = await supabase.from("business_products").select("id,name,description,price_bdt,stock_quantity,image_url,status,created_at").eq("business_id", businessResult.data.id).order("created_at", { ascending: false });
      if (!active) return;
      setState({ loading: false, business: businessResult.data, products: productResult.data || [], error: productResult.error?.message || "" });
    };
    load();
    return () => { active = false; };
  }, [refreshKey, user.id]);

  const saveBusiness = async (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setSavingBusiness(true);
    const { data, error } = await supabase.from("businesses").update({
      business_name: values.get("businessName"),
      description: values.get("description") || null,
      district: values.get("district") || null,
      contact_phone: values.get("phone") || null,
      contact_email: values.get("contactEmail") || null,
    }).eq("id", state.business.id).select("id").maybeSingle();
    setSavingBusiness(false);
    if (error || !data) return notify(error?.message || (lang === "bn" ? "ব্যবসার বিবরণ আপডেট করা যায়নি।" : "The business details could not be updated."));
    notify(lang === "bn" ? "ব্যবসার বিবরণ সংরক্ষিত হয়েছে।" : "Business details saved.");
    setRefreshKey((value) => value + 1);
  };

  const addProduct = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSavingProduct(true);
    const payload = {
      name: values.get("name"),
      description: values.get("description") || null,
      price_bdt: Number(values.get("price")),
      stock_quantity: Number(values.get("stock")),
      image_url: values.get("imageUrl") || null,
    };
    const { error } = editingProduct
      ? await supabase.from("business_products").update(payload).eq("id", editingProduct.id)
      : await supabase.from("business_products").insert({ ...payload, business_id: state.business.id, status: "PUBLISHED" });
    setSavingProduct(false);
    if (error) return notify(error.message);
    form.reset();
    notify(editingProduct ? (lang === "bn" ? "পণ্য আপডেট হয়েছে।" : "Product updated.") : (lang === "bn" ? "শপে পণ্য প্রকাশ করা হয়েছে।" : "Product published in the Shop."));
    setEditingProduct(null);
    setRefreshKey((value) => value + 1);
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    window.setTimeout(() => productFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const setProductStatus = async (product) => {
    const status = product.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";
    const { error } = await supabase.from("business_products").update({ status }).eq("id", product.id);
    if (error) return notify(error.message);
    notify(status === "PUBLISHED" ? (lang === "bn" ? "পণ্য শপে প্রকাশিত হয়েছে।" : "Product published.") : (lang === "bn" ? "পণ্য শপ থেকে লুকানো হয়েছে।" : "Product hidden from the Shop."));
    setRefreshKey((value) => value + 1);
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(lang === "bn" ? `${product.name} মুছে ফেলতে চান?` : `Delete ${product.name}?`)) return;
    const { error } = await supabase.from("business_products").delete().eq("id", product.id);
    if (error) return notify(error.message);
    notify(lang === "bn" ? "পণ্য মুছে ফেলা হয়েছে।" : "Product deleted.");
    setRefreshKey((value) => value + 1);
  };

  if (state.loading) return <main className="page-shell page-top business-dashboard"><p>{lang === "bn" ? "উদ্যোক্তা অ্যাকাউন্ট লোড হচ্ছে..." : "Loading your business..."}</p></main>;
  if (state.error) return <main className="page-shell page-top business-dashboard"><p className="form-error">{state.error}</p></main>;
  const { business, products } = state;
  return <main className="page-shell page-top business-dashboard">
    <button type="button" className="back-button" onClick={onBack}><ArrowLeft />{lang === "bn" ? "অ্যাকাউন্টে ফিরে যান" : "Back to account"}</button>
    <div className="page-title business-heading"><p className="eyebrow">{lang === "bn" ? "উদ্যোক্তা অ্যাকাউন্ট" : "Business account"}</p><h1>{business.business_name}</h1><p>{lang === "bn" ? "আপনার পাবলিক শপের বিবরণ এবং পণ্য ক্যাটালগ পরিচালনা করুন।" : "Manage your public shop details and product catalog."}</p></div>
    <div className="business-layout">
      <section className="business-panel" aria-labelledby="business-details-title">
        <div className="business-panel-head"><Store /><div><p className="eyebrow">{lang === "bn" ? "শপ প্রোফাইল" : "Shop profile"}</p><h2 id="business-details-title">{lang === "bn" ? "ব্যবসার বিবরণ" : "Business details"}</h2></div></div>
        <form className="business-form" key={`business-${refreshKey}`} onSubmit={saveBusiness}>
          <label>{lang === "bn" ? "প্রতিষ্ঠানের নাম" : "Business name"}<input name="businessName" required minLength="2" maxLength="120" defaultValue={business.business_name} /></label>
          <label>{lang === "bn" ? "জেলা" : "District"}<input name="district" defaultValue={business.district || ""} /></label>
          <label>{lang === "bn" ? "যোগাযোগের ইমেইল" : "Contact email"}<input name="contactEmail" type="email" defaultValue={business.contact_email || user.email || ""} /></label>
          <label>{lang === "bn" ? "ফোন নম্বর" : "Phone number"}<input name="phone" type="tel" defaultValue={business.contact_phone || ""} /></label>
          <label className="wide">{lang === "bn" ? "বিবরণ" : "Description"}<textarea name="description" rows="4" defaultValue={business.description || ""} placeholder={lang === "bn" ? "ক্রেতাদের জানান আপনার ব্যবসা কী কী পণ্য বিক্রি করে।" : "Tell shoppers what your business sells."} /></label>
          <button className="button primary" disabled={savingBusiness}>{savingBusiness ? (lang === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (lang === "bn" ? "ব্যবসা সংরক্ষণ করুন" : "Save business")}</button>
        </form>
      </section>
      <section className="business-panel" aria-labelledby="add-product-title">
        <div className="business-panel-head" id="business-product-form-head" ref={productFormRef}><Package /><div><p className="eyebrow">{lang === "bn" ? "ক্যাটালগ" : "Catalog"}</p><h2 id="add-product-title">{editingProduct ? (lang === "bn" ? "পণ্য সম্পাদনা" : "Edit product") : (lang === "bn" ? "নতুন পণ্য যোগ করুন" : "Add a product")}</h2></div></div>
        <form className="business-form" key={editingProduct?.id || "new"} onSubmit={addProduct}>
          <label>{lang === "bn" ? "পণ্যের নাম" : "Product name"}<input name="name" required minLength="2" maxLength="140" defaultValue={editingProduct?.name || ""} /></label>
          <label>{lang === "bn" ? "মূল্য (টাকা)" : "Price (BDT)"}<input name="price" required type="number" min="0" step="0.01" defaultValue={editingProduct?.price_bdt ?? ""} /></label>
          <label>{lang === "bn" ? "মজুত সংখ্যা" : "Stock quantity"}<input name="stock" required type="number" min="0" step="1" defaultValue={editingProduct?.stock_quantity ?? 1} /></label>
          <label>{lang === "bn" ? "ছবির লিংক (URL)" : "Image URL"}<input name="imageUrl" type="url" placeholder="https://example.com/product.jpg" defaultValue={editingProduct?.image_url || ""} /></label>
          <label className="wide">{lang === "bn" ? "বিবরণ" : "Description"}<textarea name="description" rows="4" placeholder={lang === "bn" ? "পণ্যের বিবরণ, সাইজ, উপাদান বা ডেলিভারি তথ্য।" : "Product details, size, material, or delivery information."} defaultValue={editingProduct?.description || ""} /></label>
          <button className="button primary" disabled={savingProduct}>{editingProduct ? <Pencil /> : <Plus />}{savingProduct ? (lang === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving...") : editingProduct ? (lang === "bn" ? "পণ্য সংরক্ষণ করুন" : "Save product") : (lang === "bn" ? "পণ্য প্রকাশ করুন" : "Publish product")}</button>
          {editingProduct ? <button type="button" className="button secondary" onClick={() => setEditingProduct(null)}>{lang === "bn" ? "বাতিল" : "Cancel"}</button> : null}
        </form>
      </section>
    </div>
    <section className="business-products" aria-labelledby="your-products-title">
      <div className="section-head"><div><p className="eyebrow">{lang === "bn" ? "আপনার ক্যাটালগ" : "Your catalog"}</p><h2 id="your-products-title">{lang === "bn" ? "পণ্যসমূহ" : "Products"}</h2></div><span>{toBengaliNumber(products.length)} {lang === "bn" ? "টি তালিকাভুক্ত" : "listed"}</span></div>
      {!products.length ? <div className="business-empty"><Package /><p>{lang === "bn" ? "TourismuBD শপে বিক্রি শুরু করতে আপনার প্রথম পণ্যটি যোগ করুন।" : "Add your first product to start selling in the TourismuBD Shop."}</p></div> : <div className="business-product-grid">{products.map((product) => <article className="business-product-card" key={product.id}>
        <div className="business-product-media">{product.image_url ? <img src={product.image_url} alt={product.name} /> : <Package />}</div>
        <div className="business-product-copy"><div className="business-product-title"><h3>{product.name}</h3><span className={`business-status ${product.status.toLowerCase()}`}>{product.status.toLowerCase() === "published" ? (lang === "bn" ? "প্রকাশিত" : "published") : (lang === "bn" ? "লুকানো" : "hidden")}</span></div><p>{product.description || (lang === "bn" ? "কোনো বিবরণ দেওয়া হয়নি।" : "No description provided.")}</p><div className="business-product-meta"><b>৳{lang === "bn" ? toBengaliNumber(Number(product.price_bdt).toLocaleString("en-US")) : Number(product.price_bdt).toLocaleString()}</b><span>{product.stock_quantity > 0 ? (lang === "bn" ? `${toBengaliNumber(product.stock_quantity)}টি মজুত` : `${product.stock_quantity} in stock`) : (lang === "bn" ? "স্টক শেষ" : "Out of stock")}</span></div><div className="business-product-actions"><button type="button" className="icon-button" onClick={() => editProduct(product)} aria-label={lang === "bn" ? `${product.name} সম্পাদনা করুন` : `Edit ${product.name}`} title={lang === "bn" ? "পণ্য সম্পাদনা" : "Edit product"}><Pencil /></button><button type="button" className="button secondary" onClick={() => setProductStatus(product)}>{product.status === "PUBLISHED" ? (lang === "bn" ? "লুকান" : "Hide") : (lang === "bn" ? "প্রকাশ করুন" : "Publish")}</button><button type="button" className="icon-button danger" onClick={() => deleteProduct(product)} aria-label={lang === "bn" ? `${product.name} মুছুন` : `Delete ${product.name}`} title={lang === "bn" ? "পণ্য মুছুন" : "Delete product"}><Trash2 /></button></div></div>
      </article>)}</div>}
    </section>
  </main>;
}

function PlaceOrderDialog({ product, onClose, onSubmit, user }) {
  const { lang, toBengaliNumber } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const price = Number(product.price_bdt) || 0;
  const total = price * quantity;
  const maxStock = product.stock_quantity > 0 ? product.stock_quantity : 99;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    await onSubmit({
      product_id: product.id,
      product_name: product.name,
      product_price: price,
      quantity,
      total_price: total,
      business_id: product.business_id || product.businesses?.id || null,
      business_name: product.businesses?.business_name || "",
      business_district: product.businesses?.district || "",
      business_contact: product.businesses?.contact_phone || product.businesses?.contact_email || "",
      delivery_address: data.get("address"),
      contact_phone: data.get("phone"),
      note: data.get("note") || "",
      image_url: product.image_url || "",
    });
    setLoading(false);
  };

  return (
    <dialog open className="provider-dialog" onClose={onClose}>
      <form className="modal" onSubmit={handleSubmit}>
        <button className="icon-button close" type="button" onClick={onClose} aria-label="Close"><X /></button>
        <p className="eyebrow">{product.businesses?.business_name || (lang === "bn" ? "অর্ডার" : "Order")}</p>
        <h2>{lang === "bn" ? "অর্ডার ফর্ম" : "Place your order"}</h2>
        <div style={{ marginBottom: 16 }}>
          <b>{product.name}</b>
          <p style={{ margin: "4px 0", color: "var(--muted)", fontSize: 14 }}>{product.description}</p>
          <p style={{ margin: "6px 0 0", fontWeight: 700, color: "var(--river-dark)" }}>৳{lang === "bn" ? toBengaliNumber(price.toLocaleString()) : price.toLocaleString()} / unit</p>
        </div>
        <label>
          {lang === "bn" ? "পরিমাণ" : "Quantity"}
          <input type="number" min="1" max={maxStock} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(maxStock, Number(e.target.value) || 1)))} required />
        </label>
        <div style={{ margin: "10px 0 16px", padding: "10px 14px", background: "var(--paper)", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{lang === "bn" ? "মোট মূল্য" : "Total Price"}:</span>
          <b style={{ fontSize: 18, color: "var(--river-dark)" }}>৳{lang === "bn" ? toBengaliNumber(total.toLocaleString()) : total.toLocaleString()}</b>
        </div>
        <label>
          {lang === "bn" ? "ডেলিভারি ঠিকানা" : "Delivery address"}
          <textarea name="address" rows="3" required placeholder={lang === "bn" ? "আপনার বিস্তারিত ঠিকানা লিখুন..." : "Enter your full delivery address..."} />
        </label>
        <label>
          {lang === "bn" ? "যোগাযোগের ফোন নম্বর" : "Contact phone number"}
          <input name="phone" type="tel" required defaultValue={user?.user_metadata?.phone || ""} placeholder="01XXXXXXXXX" />
        </label>
        <label>
          {lang === "bn" ? "বিশেষ দ্রষ্টব্য (ঐচ্ছিক)" : "Note (optional)"}
          <input name="note" placeholder={lang === "bn" ? "ডেলিভারি সংক্রান্ত নির্দেশনা..." : "Any delivery instructions..."} />
        </label>
        <button type="submit" className="button primary wide" disabled={loading}>
          {loading ? (lang === "bn" ? "অর্ডার পাঠানো হচ্ছে..." : "Placing order...") : (lang === "bn" ? "অর্ডার নিশ্চিত করুন" : "Confirm order")}
        </button>
      </form>
    </dialog>
  );
}

function Marketplace({ query, setQuery, user, onAuth, notify }) {
  const [state, setState] = useState({ loading: true, products: [], error: "", postError: "" });
  const { refreshOrders } = useUserOrders(user);
  const [orderingProduct, setOrderingProduct] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [catalogResult, initialPostResult] = await Promise.all([
          supabase.from("business_products").select("id,name,description,price_bdt,stock_quantity,image_url,created_at,businesses!inner(business_name,district,contact_email,contact_phone)").eq("status", "PUBLISHED").order("created_at", { ascending: false }),
          supabase.from("social_posts").select("id,author_id,product_name,body,media_type,media_path,created_at,is_hidden").not("product_name", "is", null).order("created_at", { ascending: false }),
        ]);
        let postResult = initialPostResult;
        if (postResult.error && /is_hidden/i.test(postResult.error.message)) {
          postResult = await supabase.from("social_posts").select("id,author_id,product_name,body,media_type,media_path,created_at").not("product_name", "is", null).order("created_at", { ascending: false });
        }
        if (!active) return;
        const catalog = (catalogResult.data || []).map((product) => ({ ...product, kind: "LISTING" }));
        const namedPosts = postResult.data || [];
        const authorIds = [...new Set(namedPosts.map((post) => post.author_id))];
        const [businessResult, mediaResult] = await Promise.all([
          authorIds.length ? supabase.from("businesses").select("user_id,business_name,district,contact_email,contact_phone").in("user_id", authorIds) : { data: [] },
          namedPosts.length ? supabase.storage.from("social-posts").createSignedUrls(namedPosts.map((post) => post.media_path), 3600) : { data: [] },
        ]);
        if (!active) return;
        const businesses = Object.fromEntries((businessResult.data || []).map((business) => [business.user_id, business]));
        const mediaUrls = Object.fromEntries((mediaResult.data || []).map((item) => [item.path, item.signedUrl]));
        const productPosts = namedPosts.filter((post) => !isPostHidden(post.id, post)).map((post) => ({ id: post.id, kind: "POST", name: post.product_name, description: post.body, image_url: mediaUrls[post.media_path], media_type: post.media_type, created_at: post.created_at, businesses: businesses[post.author_id] })).filter((post) => post.businesses && post.image_url);
        setState({
          loading: false,
          products: combineShopProducts(catalog, productPosts),
          error: catalogResult.error && /business_products.*schema cache|relation .*business_products.*does not exist/i.test(catalogResult.error.message) ? "The Shop is not set up yet. Run Supabase migrations 072 and 073 in order." : catalogResult.error?.message || "",
          postError: postResult.error ? (/product_name|schema cache/i.test(postResult.error.message) ? "Run 074_business_post_product_name.sql in Supabase to show product posts in Shop." : postResult.error.message) : businessResult.error?.message || mediaResult.error?.message || "",
        });
      } catch (error) {
        if (active) setState({ loading: false, products: [], error: error.message || "Could not load the Shop.", postError: "" });
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const handlePlaceOrder = async (orderPayload) => {
    if (!user) {
      notify?.(lang === "bn" ? "অর্ডার করতে সাইন ইন করুন।" : "Please sign in to place an order.");
      onAuth?.();
      return;
    }
    const orderData = {
      ...orderPayload,
      id: `ord-${Date.now()}`,
      user_id: user.id,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    saveUserOrder(orderData, user.id);
    if (supabase) {
      try {
        await supabase.from("product_orders").insert({
          user_id: user.id,
          product_id: orderPayload.product_id,
          product_name: orderPayload.product_name,
          product_price: orderPayload.product_price,
          quantity: orderPayload.quantity,
          total_price: orderPayload.total_price,
          business_id: orderPayload.business_id,
          delivery_address: orderPayload.delivery_address,
          contact_phone: orderPayload.contact_phone,
          note: orderPayload.note,
          status: "PENDING"
        });
      } catch {}
    }
    setOrderingProduct(null);
    refreshOrders();
    notify?.(lang === "bn" ? "আপনার অর্ডার সফলভাবে পাঠানো হয়েছে। ড্যাশবোর্ড থেকে অর্ডারটি দেখতে পারেন।" : "Your order has been placed successfully. You can view it from your dashboard.");
  };

  const { lang, translateDistrict, toBengaliNumber } = useLanguage();
  const products = searchShopProducts(state.products, query);
  return <main className="page-shell page-top marketplace-page">
    <div className="page-title"><p className="eyebrow">{lang === "bn" ? "মার্কেটপ্লেস" : "TourismuBD marketplace"}</p><h1>{lang === "bn" ? "স্থানীয় উদ্যোগ থেকে কেনাকাটা করুন।" : "Shop from local businesses."}</h1><p>{lang === "bn" ? "বাংলাদেশের স্থানীয় উদ্যোক্তা ও ব্যবসার পণ্য ঘুরে দেখুন।" : "Browse products offered by business accounts across Bangladesh."}</p></div>
    <div className="marketplace-controls">
      <label className="inline-search marketplace-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={lang === "bn" ? "পণ্য, ব্যবসা বা জেলা দিয়ে অনুসন্ধান..." : "Search products, businesses, or districts"} /><span>{toBengaliNumber(products.length)} {lang === "bn" ? "টি পণ্য" : "products"}</span></label>
    </div>
    {state.loading ? <p>{lang === "bn" ? "পণ্য লোড হচ্ছে..." : "Loading products..."}</p> : null}
    {state.error ? <p className="form-error">{state.error}</p> : null}
    {state.postError ? <p className="form-note">{state.postError}</p> : null}
    {!state.loading && !state.error && !products.length ? <div className="business-empty"><ShoppingBag /><p>{lang === "bn" ? "অনুসন্ধানের সাথে কোনো পণ্য মেলেনি।" : "No products match your search yet."}</p></div> : null}
    <div className="marketplace-grid">{products.map((product) => <article className="marketplace-card" key={`${product.kind}-${product.id}`}>
      <div className="marketplace-media">{product.media_type === "VIDEO" ? <video controls preload="metadata" src={product.image_url} aria-label={product.name} /> : product.image_url ? <img src={product.image_url} alt={product.name} /> : <Package />}</div>
      <div className="marketplace-copy"><p className="eyebrow">{product.businesses?.business_name}</p><h2>{product.name}</h2><p>{product.description || (lang === "bn" ? "পণ্যের বিবরণ বিক্রেতার কাছে থেকে পাওয়া যাবে।" : "Product details are available from the seller.")}</p><div className="marketplace-price">{product.kind === "POST" ? <b className="marketplace-post-label">{lang === "bn" ? "পণ্য পোস্ট" : "Product post"}</b> : <><b>৳{lang === "bn" ? toBengaliNumber(Number(product.price_bdt).toLocaleString("en-US")) : Number(product.price_bdt).toLocaleString()}</b><span>{product.stock_quantity > 0 ? (lang === "bn" ? `${toBengaliNumber(product.stock_quantity)}টি উপলব্ধ` : `${product.stock_quantity} available`) : (lang === "bn" ? "স্টক শেষ" : "Out of stock")}</span></>}</div><div className="marketplace-seller"><span>{translateDistrict(product.businesses?.district) || (lang === "bn" ? "বাংলাদেশ" : "Bangladesh")}</span>{product.businesses?.contact_phone ? <a href={`tel:${product.businesses.contact_phone}`}>{product.businesses.contact_phone}</a> : product.businesses?.contact_email ? <a href={`mailto:${product.businesses.contact_email}`}>{lang === "bn" ? "যোগাযোগ করুন" : "Contact seller"}</a> : null}</div>{product.kind === "LISTING" ? <div className="marketplace-card-action"><button type="button" className="button primary marketplace-order-btn" onClick={() => user ? setOrderingProduct(product) : onAuth()}><ShoppingBag size={15} />{lang === "bn" ? "অর্ডার করুন" : "Order now"}</button></div> : null}</div>
    </article>)}</div>
    {orderingProduct ? <PlaceOrderDialog product={orderingProduct} user={user} onClose={() => setOrderingProduct(null)} onSubmit={handlePlaceOrder} /> : null}
  </main>;
}

function AccountAboutPage({ user, notify, onBack }) {
  const { lang } = useLanguage();
  const [state, setState] = useState({ loading: true, profile: null, provider: null, error: "" });
  const fallbackProfile = { full_name: user.user_metadata?.full_name || "", email: user.email, phone: user.user_metadata?.phone || "", phone_visible: false, ...PROFILE_DETAILS_DEFAULTS };

  useEffect(() => {
    let active = true;
    Promise.all([
      loadProfile(user.id),
      supabase.from("providers").select("id,type,display_name,service_name").eq("user_id", user.id).maybeSingle(),
    ]).then(([profileResult, providerResult]) => {
      if (active) setState({ loading: false, profile: profileResult.data || fallbackProfile, provider: providerResult.data, error: profileResult.error?.message || providerResult.error?.message || "" });
    });
    return () => { active = false; };
  }, [user.id]);

  if (state.loading) return <main className="page-shell page-top account-about-page"><p>{lang === "bn" ? "অ্যাকাউন্টের বিবরণ লোড হচ্ছে..." : "Loading your account details..."}</p></main>;
  if (state.error) return <main className="page-shell page-top account-about-page"><p className="form-error">{state.error}</p></main>;
  return <main className="page-shell page-top account-about-page">
    <button type="button" className="back-button" onClick={onBack}><ArrowLeft />{lang === "bn" ? "অ্যাকাউন্টে ফিরে যান" : "Back to account"}</button>
    <p className="eyebrow">{lang === "bn" ? "অ্যাকাউন্ট সেটিংস" : "Account settings"}</p>
    <ProfileDetailsForm user={user} profile={state.profile} provider={state.provider} notify={notify} onSaved={(profile) => { setState((current) => ({ ...current, profile })); onBack(); }} />
  </main>;
}

function TravelerRatings({ user, notify }) {
  const { lang, toBengaliNumber } = useLanguage();
  const [state, setState] = useState({ loading: true, bookings: [], error: "" });
  const [ratingBooking, setRatingBooking] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const loadRatings = async () => {
      try {
        const { data: bookings, error } = await supabase.from("traveler_review_requests").select("id,provider_name,service_type,completed_at,rating,reviewed_at").order("completed_at", { ascending: false });
        if (!active) return;
        if (error) return setState({ loading: false, bookings: [], error: error.message });
        setState({ loading: false, error: "", bookings: bookings || [] });
      } catch (error) {
        if (active) setState({ loading: false, bookings: [], error: error.message || (lang === "bn" ? "সম্পন্ন বুকিং লোড করা যায়নি।" : "Could not load completed bookings.") });
      }
    };
    loadRatings();
    return () => { active = false; };
  }, [user.id, refreshKey, lang]);

  const submitRating = async (booking, rating) => {
    if (booking.status === "CONFIRMED") {
      await supabase.from("bookings").update({ status: "COMPLETED" }).eq("id", booking.id);
    }
    const { error } = await supabase.from("reviews").insert({ booking_id: booking.id, traveler_id: user.id, rating });
    if (error) {
      if (error.code === "23505") {
        setRefreshKey((value) => value + 1);
        notify(lang === "bn" ? "আপনি ইতোমধ্যে এই প্রোভাইডারকে রেটিং দিয়েছেন।" : "You already rated this provider.");
        return true;
      }
      notify(error.message);
      return false;
    }
    setRefreshKey((value) => value + 1);
    notify(lang === "bn" ? "আপনার প্রোভাইডার রেটিং জমা হয়েছে।" : "Your provider rating was submitted.");
    return true;
  };

  return <section className="traveler-ratings" aria-labelledby="traveler-ratings-title">
    <div className="provider-bookings-heading"><div><p className="eyebrow">{lang === "bn" ? "সম্পন্ন বুকিং" : "Completed bookings"}{/* Completed bookings */}</p><h2 id="traveler-ratings-title">{lang === "bn" ? "আপনার প্রোভাইডার রেটিং" : "Your provider ratings"}{/* Your provider ratings */}</h2></div></div>
    {state.loading ? <p className="form-note">{lang === "bn" ? "সম্পন্ন বুকিং লোড হচ্ছে..." : "Loading completed bookings..."}</p> : null}
    {state.error ? <p className="form-error">{state.error}</p> : null}
    {!state.loading && !state.error && !state.bookings.length ? (
      <p className="booking-empty">{lang === "bn" ? "রেটিং দেওয়ার মতো কোনো সম্পন্ন ট্যুর বা বুকিং নেই।" : "No completed bookings pending rating."}</p>
    ) : null}
    <div className="booking-list">{state.bookings.map((booking) => <article className="booking-card" key={booking.id}><div><p className="eyebrow">{SERVICE_META[booking.service_type]?.label || booking.service_type}</p><h3>{booking.provider_name}</h3><p>{lang === "bn" ? `সম্পন্ন ${new Date(booking.completed_at).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}` : `Completed ${new Date(booking.completed_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`}</p></div><div className="booking-card-action">{booking.rating ? <p className="traveler-rating"><Star /><b>{toBengaliNumber(booking.rating)}.0</b><span>{lang === "bn" ? "আপনার রেটিং" : "Your rating"}{/* Your rating */}</span></p> : <button type="button" className="button primary" onClick={() => setRatingBooking(booking)}><Star />{lang === "bn" ? "রেটিং দিন" : "Rate provider"}{/* Rate provider */}</button>}</div></article>)}</div>
    {ratingBooking ? <RatingDialog booking={ratingBooking} onClose={() => setRatingBooking(null)} onSubmit={submitRating} /> : null}
  </section>;
}

function TravelerRatingsPage({ user, notify, onBack }) {
  const { lang } = useLanguage();
  return <main className="page-shell page-top traveler-ratings-page"><button type="button" className="back-button" onClick={onBack}><ArrowLeft />{lang === "bn" ? "অ্যাকাউন্টে ফিরে যান" : "Back to account"}</button><TravelerRatings user={user} notify={notify} /></main>;
}

function MessageDialog({ user, recipient, onClose, notify, onSent }) {
  const { lang } = useLanguage();
  const dialogRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.open && dialog.close();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError("");
    const body = new FormData(event.currentTarget).get("message")?.trim();
    const { error: messageError } = await supabase.from("direct_messages").insert({ sender_id: user.id, recipient_id: recipient.id, body });
    setSending(false);
    if (messageError) return setError(messageError.message);
    notify(lang === "bn" ? "বার্তা পাঠানো হয়েছে।" : "Message sent.");
    onSent?.();
    onClose();
  };

  return <dialog ref={dialogRef} className="provider-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="modal message-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} aria-labelledby="message-title">
      <button type="button" className="icon-button close" onClick={onClose} aria-label={lang === "bn" ? "বন্ধ করুন" : "Close"}><X /></button>
      <p className="eyebrow">{lang === "bn" ? "সরাসরি বার্তা" : "Direct message"}</p>
      <h2 id="message-title">{lang === "bn" ? `${recipient.full_name || "এই অ্যাকাউন্ট"}-কে বার্তা পাঠান` : `Message ${recipient.full_name || "this account"}`}</h2>
      <label>{lang === "bn" ? "বার্তা" : "Message"}<textarea name="message" required maxLength="2000" rows="5" autoFocus placeholder={lang === "bn" ? "আপনার বার্তা লিখুন..." : "Write your message"} /></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={sending}>{lang === "bn" ? "বাতিল" : "Cancel"}</button><button className="button primary" disabled={sending}>{sending ? (lang === "bn" ? "পাঠানো হচ্ছে..." : "Sending...") : (lang === "bn" ? "বার্তা পাঠান" : "Send message")}</button></div>
    </form>
  </dialog>;
}

function MessageCenter({ user, onClose, onOpenProfile, notify }) {
  const { lang } = useLanguage();
  const [state, setState] = useState({ loading: true, messages: [], error: "" });
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = async (isBackground = false) => {
    if (!isBackground) {
      setState((current) => ({ ...current, loading: true, error: "" }));
    }
    const { data: messages, error } = await supabase.from("direct_messages").select("id,sender_id,recipient_id,sender_name,sender_provider_type,recipient_name,recipient_provider_type,body,created_at").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(100);
    if (error) return setState((current) => ({ ...current, loading: false, messages: current.messages.length ? current.messages : [], error: error.message }));
    setState({ loading: false, messages: messages || [], error: "" });
  };

  useEffect(() => {
    load(false);
    const interval = window.setInterval(() => load(true), 30000);
    return () => window.clearInterval(interval);
  }, [user.id]);

  const conversations = useMemo(() => {
    const byPerson = new globalThis.Map();
    for (const message of state.messages) {
      const received = message.recipient_id === user.id;
      const person = received ? { id: message.sender_id, full_name: message.sender_name, provider_type: message.sender_provider_type } : { id: message.recipient_id, full_name: message.recipient_name, provider_type: message.recipient_provider_type };
      if (!byPerson.has(person.id)) byPerson.set(person.id, { person, latest: message });
    }
    return [...byPerson.values()];
  }, [state.messages, user.id]);
  const activeConversation = conversations.find((conversation) => conversation.person.id === selectedConversationId);
  const activeMessages = activeConversation ? state.messages.filter((message) => message.sender_id === activeConversation.person.id || message.recipient_id === activeConversation.person.id).reverse() : [];

  const send = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !activeConversation) return;
    setSending(true);
    const { error } = await supabase.from("direct_messages").insert({ sender_id: user.id, recipient_id: activeConversation.person.id, body });
    setSending(false);
    if (error) return notify(error.message);
    setDraft("");
    await load();
  };

  return <aside className="message-center" role="dialog" aria-modal="true" aria-label={lang === "bn" ? "বার্তাসমূহ" : "Messages"}>
    <div className="message-center-head"><div>{activeConversation ? <button type="button" className="message-back" onClick={() => setSelectedConversationId(null)}><ArrowLeft />{lang === "bn" ? "বার্তাসমূহ" : "Messages"}</button> : <p className="eyebrow">{lang === "bn" ? "বার্তাসমূহ" : "Messages"}</p>}{activeConversation ? <button type="button" className="message-profile-link" onClick={() => onOpenProfile(activeConversation.person.id)} aria-label={`View ${activeConversation.person.full_name} profile`}><h2>{activeConversation.person.full_name}</h2></button> : <h2>{lang === "bn" ? "মেসেজ সেন্টার" : "Message center"}</h2>}{activeConversation ? <small>{lang === "bn" ? (PROVIDER_ROLE_LABELS_BN[activeConversation.person.provider_type] || "ভ্রমণকারী") : (PROVIDER_TYPE_LABELS[activeConversation.person.provider_type] || "Traveler")}</small> : null}</div><button type="button" className="icon-button" onClick={onClose} aria-label={lang === "bn" ? "বার্তা বন্ধ করুন" : "Close messages"}><X /></button></div>
    {state.loading ? <p className="form-note">{lang === "bn" ? "বার্তা লোড হচ্ছে..." : "Loading messages..."}</p> : null}
    {state.error ? <p className="form-error">{state.error.includes("direct_messages") ? "Run 053_direct_messages.sql in Supabase to load messages." : state.error}</p> : null}
    {!state.loading && !state.error && !state.messages.length ? <p className="message-empty">{lang === "bn" ? "অন্যান্য অ্যাকাউন্টের বার্তা এখানে প্রদর্শিত হবে।" : "Messages from other accounts will appear here."}</p> : null}
    {!state.loading && !state.error && activeConversation ? <><div className="message-thread">{activeMessages.map((message) => <article className={message.sender_id === user.id ? "message-bubble own" : "message-bubble"} key={message.id}><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString(lang === "bn" ? "bn-BD" : undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></article>)}</div><form className="message-compose" onSubmit={send}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength="2000" rows="3" placeholder={lang === "bn" ? `${activeConversation.person.full_name}-কে বার্তা লিখুন...` : `Message ${activeConversation.person.full_name}`} aria-label={lang === "bn" ? `${activeConversation.person.full_name}-কে বার্তা লিখুন` : `Message ${activeConversation.person.full_name}`} /><button className="button primary" disabled={!draft.trim() || sending}><Send />{sending ? (lang === "bn" ? "পাঠানো হচ্ছে..." : "Sending...") : (lang === "bn" ? "পাঠান" : "Send")}</button></form></> : null}
    {!state.loading && !state.error && !activeConversation ? <div className="message-list">{conversations.map(({ person, latest }) => <button type="button" className="message-conversation" key={person.id} onClick={() => setSelectedConversationId(person.id)}><div><b>{person.full_name}</b><small>{lang === "bn" ? (PROVIDER_ROLE_LABELS_BN[person.provider_type] || "ভ্রমণকারী") : (PROVIDER_TYPE_LABELS[person.provider_type] || "Traveler")}{/* PROVIDER_TYPE_LABELS[person.provider_type] || "Traveler" */} · {new Date(latest.created_at).toLocaleString(lang === "bn" ? "bn-BD" : undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></div><p>{latest.sender_id === user.id ? (lang === "bn" ? `আপনি: ${latest.body}` : `You: ${latest.body}`) : latest.body}</p><ChevronRight /></button>)}</div> : null}
  </aside>;
}

function PublicPersonProfile({ person, onBack, backLabel = "Back to people", user, notify, onFollowerChange, readOnly = false }) {
  const { lang } = useLanguage();
  const dialogRef = useRef(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [messageOpen, setMessageOpen] = useState(false);
  const isBusiness = person.role === "BUSINESS_OWNER";
  const isProvider = PROVIDER_ROLES.some(([role]) => role === person.role);
  const [businessName, setBusinessName] = useState(person.business_name || "");
  const [serviceName, setServiceName] = useState(person.service_name || "");
  const role = lang === "bn" ? (PROVIDER_ROLE_LABELS_BN[person.role] || (person.role === "TRAVELER" ? "ভ্রমণকারী" : (person.role === "BUSINESS_OWNER" ? "উদ্যোক্তা" : "সদস্য"))) : (PROVIDER_TYPE_LABELS[person.role] || "Traveler");
  const photos = (person.profile_photo_urls || []).filter(Boolean);
  const contactDetails = PROFILE_DETAIL_FIELDS.slice(0, 2).map(([label, field]) => [lang === "bn" ? (DETAIL_FIELD_LABELS_BN[label] || label) : label, person[field] || (lang === "bn" ? "যুক্ত করা হয়নি" : "Not added")]);
  const details = PROFILE_DETAIL_FIELDS.slice(2).map(([label, field]) => [lang === "bn" ? (DETAIL_FIELD_LABELS_BN[label] || label) : label, person[field]]).filter(([, value]) => value);
  const avatarUrl = photos[photoIndex] || person.avatar_url;
  const profileName = isBusiness && businessName ? businessName : person.full_name || (lang === "bn" ? "TourismuBD সদস্য" : "TourismuBD member");
  const photoAlt = `${profileName} profile`;

  useEffect(() => {
    setBusinessName(person.business_name || "");
    if (!isBusiness || person.business_name || !supabase) return undefined;
    let active = true;
    supabase.from("businesses").select("business_name").eq("user_id", person.id).maybeSingle().then(({ data }) => {
      if (active && data?.business_name) setBusinessName(data.business_name);
    });
    return () => { active = false; };
  }, [isBusiness, person.business_name, person.id]);

  useEffect(() => {
    setServiceName(person.service_name || "");
    if (!isProvider || person.service_name || !supabase) return undefined;
    let active = true;
    supabase.from("public_provider_details").select("service_name").eq("user_id", person.id).maybeSingle().then(({ data }) => {
      if (active && data?.service_name) setServiceName(data.service_name);
    });
    return () => { active = false; };
  }, [isProvider, person.service_name, person.id]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (photoOpen) dialog.showModal();
    return () => dialog?.open && dialog.close();
  }, [photoOpen]);

  useEffect(() => {
    setPhotoIndex(0);
    if (photos.length < 2) return undefined;
    const timer = window.setInterval(() => setPhotoIndex((index) => (index + 1) % photos.length), 60000);
    return () => window.clearInterval(timer);
  }, [photos.length, photos.join("|")]);

  return <main className="page-shell page-top public-person-page">
    <button type="button" className="back-button" onClick={onBack}><ArrowLeft /> {backLabel}</button>
    <section className="public-person-profile" aria-labelledby="public-person-title">
      <div className="public-person-head">{avatarUrl ? <button type="button" className="public-person-avatar" onClick={() => setPhotoOpen(true)} aria-label={lang === "bn" ? "প্রোফাইল ছবি দেখুন" : "View profile picture"}><img src={avatarUrl} alt={photoAlt} /></button> : <span className="public-person-avatar"><CircleUserRound /></span>}<div><p className="eyebrow">{role}</p><h1 id="public-person-title">{profileName}</h1>{isBusiness && person.full_name ? <p className="public-person-owner">{lang === "bn" ? `ব্যবসার মালিক: ${person.full_name}` : `Business owner: ${person.full_name}`}{/* Business owner: {person.full_name} */}</p> : null}{isProvider && serviceName ? <p className="public-person-service-name">{lang === "bn" ? `সার্ভিস: ${serviceName}` : `Service: ${serviceName}`}{/* Service: {serviceName} */}</p> : null}<ProviderRating profile={person} isProvider={person.role !== "TRAVELER"} /></div>{readOnly ? null : <div className="public-person-actions">{user?.id !== person.id ? <button type="button" className="button secondary" onClick={() => user ? setMessageOpen(true) : notify(lang === "bn" ? "বার্তা পাঠাতে সাইন ইন করুন।" : "Sign in to send a message.")}><MessageSquare />{lang === "bn" ? "বার্তা পাঠান" : "Message"}</button> : null}<FollowButton user={user} profileId={person.id} notify={notify} onChanged={onFollowerChange} /></div>}</div>
      <p className="public-person-bio">{person.bio || (lang === "bn" ? "এখনো কোনো পরিচিতি যোগ করা হয়নি।" : "No bio added yet.")}</p>
      {person.followers_visible !== false || user?.id === person.id ? <FollowerCount count={person.follower_count || 0} /> : null}
      <dl className="public-person-contact">{contactDetails.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      {details.length ? <details className="public-person-details"><summary>{lang === "bn" ? "আরও দেখুন..." : "See more..."}</summary><dl>{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></details> : null}
    </section>
    {readOnly ? null : <DashboardPosts user={user} authorId={person.id} profile={person} title={lang === "bn" ? "টাইমলাইন" : "Timeline"} notify={notify} />}
    {messageOpen && user ? <MessageDialog user={user} recipient={person} onClose={() => setMessageOpen(false)} notify={notify} /> : null}
    {photoOpen ? <dialog ref={dialogRef} className="profile-photo-dialog" onCancel={(event) => { event.preventDefault(); setPhotoOpen(false); }} onMouseDown={(event) => event.target === event.currentTarget && setPhotoOpen(false)}><button type="button" className="profile-photo-full" onClick={() => setPhotoOpen(false)} aria-label={lang === "bn" ? "বন্ধ করুন" : "Close profile picture"}><img src={avatarUrl} alt={photoAlt} /></button></dialog> : null}
  </main>;
}

function PeopleDirectory({ notify, user, query, setQuery }) {
  const { lang } = useLanguage();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const deferredQuery = useDeferredValue(query.trim());

  useEffect(() => {
    if (!deferredQuery) return setPeople([]);
    if (!supabase) return notify(lang === "bn" ? "অনুসন্ধানের জন্য Supabase সংযুক্ত করুন।" : "Connect Supabase to search people.");
    let active = true;
    setLoading(true);
    const searchTerm = deferredQuery.replace(/[%,_]/g, "");
    supabase.rpc("search_public_people", { search_query: searchTerm }).then(({ data, error }) => {
      if (!active) return;
      setLoading(false);
      if (error) return notify(/search_public_people|function .* does not exist|schema cache/i.test(error.message) ? "Run Supabase migration 104_public_people_provider_name_search.sql to enable provider name search." : error.message);
      setPeople(data || []);
    });
    return () => { active = false; };
  }, [deferredQuery, lang, notify]);

  if (selectedPerson) return <PublicPersonProfile person={selectedPerson} user={user} notify={notify} onBack={() => setSelectedPerson(null)} onFollowerChange={(change) => setSelectedPerson((person) => ({ ...person, follower_count: Math.max(0, (person.follower_count || 0) + change) }))} />;

  const roleLabel = (role) => {
    if (lang !== "bn") return PROVIDER_TYPE_LABELS[role] || "Traveler";
    if (role === "TRAVELER") return "ভ্রমণকারী";
    if (role === "TOUR_GUIDE") return "ট্যুর গাইড";
    if (role === "HOTEL_RESORT") return "হোটেল ও রিসোর্ট";
    if (role === "RENTAL_SERVICE") return "বাহন ভাড়া সেবা";
    if (role === "BUSINESS") return "উদ্যোক্তা / ব্যবসা";
    return PROVIDER_TYPE_LABELS[role] || "ভ্রমণকারী";
  };

  return <main className="page-shell page-top people-page">
    <div className="page-title"><p className="eyebrow">{lang === "bn" ? "কমিউনিটি" : "People"}</p><h1>{lang === "bn" ? "ভ্রমণকারী বা সেবা প্রদানকারী খুঁজুন।" : "Find a traveler or provider."}</h1></div>
    <label className="people-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={lang === "bn" ? "নাম দিয়ে খুঁজুন..." : "Search by name"} aria-label={lang === "bn" ? "নাম দিয়ে অ্যাকাউন্ট খুঁজুন" : "Search people by name"} /></label>
    {!query.trim() ? <p className="people-note">{lang === "bn" ? "পাবলিক প্রোফাইল দেখতে নাম লিখে অনুসন্ধান করুন।" : "Search by name to view a public profile."}</p> : null}
    {loading ? <p className="people-note">{lang === "bn" ? "অনুসন্ধান চলছে..." : "Searching..."}</p> : null}
    {!loading && query.trim() && !people.length ? <p className="people-note">{lang === "bn" ? "কোনো অ্যাকাউন্ট পাওয়া যায়নি।" : "No matching accounts found."}</p> : null}
    <div className="people-results">{people.map((person) => <button type="button" className="person-result" key={person.id} onClick={() => setSelectedPerson(person)}><span className="person-result-avatar">{person.avatar_url ? <img src={person.avatar_url} alt="" /> : <CircleUserRound />}</span><span><b>{person.full_name || (lang === "bn" ? "TourismuBD সদস্য" : "TourismuBD member")}</b><small>{roleLabel(person.role)}</small></span><ChevronRight /></button>)}</div>
  </main>;
}

function Logo({ compact = false }) {
  return (
    <div className="logo" aria-label="TourismuBD">
      <span className="logo-mark"><Route size={20} strokeWidth={2.4} /></span>
      {compact ? null : <span>Tourismu<span>BD</span></span>}
    </div>
  );
}

function BookingNotifications({ user, onOpenBookings, onOpenRatings }) {
  const { lang, toBengaliNumber } = useLanguage();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const load = async () => {
    const { data } = await supabase.from("notifications").select("id,kind,message,read_at,created_at").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(10);
    if (data) setItems(data);
  };

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 30000);
    return () => window.clearInterval(interval);
  }, [user.id]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const markRead = async (item) => {
    if (!item.read_at) {
      const readAt = new Date().toISOString();
      setItems((current) => current.map((notification) => notification.id === item.id ? { ...notification, read_at: readAt } : notification));
      const { error } = await supabase.from("notifications").update({ read_at: readAt }).eq("id", item.id);
      if (error) load();
    }
    if (item.kind === "BOOKING_REQUESTED" && onOpenBookings) {
      setOpen(false);
      onOpenBookings();
    } else if (item.kind === "BOOKING_CONFIRMED" && onOpenBookings) {
      setOpen(false);
      onOpenBookings();
    } else if (item.kind === "BOOKING_COMPLETED") {
      setOpen(false);
      if (onOpenBookings) onOpenBookings();
      else if (onOpenRatings) onOpenRatings();
    } else if (onOpenBookings) {
      setOpen(false);
      onOpenBookings();
    }
  };

  const unread = items.filter((item) => !item.read_at).length;
  return <div className="notification-menu" ref={menuRef}>
    <button type="button" className="notification-button" onClick={() => { setOpen((value) => !value); load(); }} aria-label={lang === "bn" ? "বিজ্ঞপ্তি" : "Notifications"} aria-expanded={open}><Bell />{unread ? <span className="notification-badge">{unread > 9 ? "9+" : toBengaliNumber(unread)}</span> : null}</button>
    {open ? <div className="notification-popover" role="region" aria-label={lang === "bn" ? "বিজ্ঞপ্তি" : "Notifications"}><div className="notification-popover-head"><b>{lang === "bn" ? "আপডেট" : "Updates"}</b>{/* <b>Updates</b> */}<span>{unread ? (lang === "bn" ? `${toBengaliNumber(unread)}টি নতুন` : `${unread} new`) : (lang === "bn" ? "সব পড়া শেষ" : "All caught up")}</span></div>{items.length ? <div className="notification-list">{items.map((item) => <button type="button" className={item.read_at ? "notification-item" : "notification-item unread"} key={item.id} onClick={() => markRead(item)}><span>{item.message}</span><small>{new Date(item.created_at).toLocaleString(lang === "bn" ? "bn-BD" : undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></button>)}</div> : <p className="notification-empty">{lang === "bn" ? "এখনো কোনো আপডেট নেই।" : "No updates yet."}</p>}</div> : null}
  </div>;
}

function Header({ view, setView, tripCount, user, onAuth, onDeactivate, onSignOut, onOpenAbout, onOpenBookings, onOpenRatings, onOpenMessages, onOpenBusinessCatalog, notify, theme, onThemeChange }) {
  const { t, toBengaliNumber } = useLanguage();
  const [open, setOpen] = useState(false);
  const go = (next) => {
    setView(next);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navLabels = {
    feed: t("nav.timeline"),
    home: t("nav.discover"),
    explore: t("nav.places"),
    "travel-map": t("nav.travelMap"),
    trip: t("nav.myTrip"),
    services: t("nav.services"),
    people: t("nav.people"),
    shop: t("nav.shop"),
  };

  return (
    <header className={view === "home" ? "site-header" : "site-header inner"}>
      <button className="brand-button" onClick={() => go("home")}><Logo /></button>
      <nav className={open ? "main-nav is-open" : "main-nav"} aria-label={t("nav.toggleNav")}>
        {NAV.map(([id, defaultLabel]) => (
          <button key={id} className={view === id ? "active" : ""} onClick={() => go(id)}>
            {navLabels[id] || defaultLabel}{id === "trip" && tripCount ? <span className="nav-count">{toBengaliNumber(tripCount)}</span> : null}
          </button>
        ))}
        <button className="account-link" onClick={onAuth}><CircleUserRound size={17} />{user ? t("nav.account") : t("nav.signIn")}</button>
        {user ? <BookingNotifications user={user} onOpenBookings={onOpenBookings} onOpenRatings={onOpenRatings} /> : null}
        {user ? <OwnerMenu user={user} onDeactivate={onDeactivate} onSignOut={onSignOut} onOpenAbout={onOpenAbout} onOpenBookings={onOpenBookings} onOpenRatings={onOpenRatings} onOpenMessages={onOpenMessages} onOpenBusinessCatalog={onOpenBusinessCatalog} notify={notify} className="header-owner-menu" theme={theme} onThemeChange={onThemeChange} /> : null}
      </nav>
      <div className="header-actions">
        <LanguageSwitcher />
        <button className="icon-button menu-button" onClick={() => setOpen((value) => !value)} aria-label={t("nav.toggleNav")} aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

function SectionHead({ eyebrow, title, action, onAction }) {
  return (
    <div className="section-head">
      <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
      {action ? <button className="text-button" onClick={onAction}>{action}<ArrowRight size={17} /></button> : null}
    </div>
  );
}

function PlaceCard({ place, selected, onOpen, onToggle }) {
  const { t, translateCategory, translateDistrict, translateArea, translatePlaceName, translatePlaceDescription } = useLanguage();
  const displayName = translatePlaceName(place);
  const displayDistrict = translateDistrict(place.district);
  const displayCategory = translateCategory(place.category);
  const displayArea = translateArea(place.area);
  const displayDesc = translatePlaceDescription(place);
  const locationText = !displayArea || displayArea.toLowerCase() === displayDistrict.toLowerCase()
    ? displayDistrict
    : `${displayArea}, ${displayDistrict}`;

  return (
    <article className="place-card">
      <button className="place-image" onClick={() => onOpen(place)} aria-label={`View ${displayName}`}>
        <img src={place.image || fallbackImage} alt="" />
        <span className="place-category">{displayCategory}</span>
      </button>
      <div className="place-card-body">
        <p><MapPin size={14} /> {locationText}</p>
        <button className="title-link" onClick={() => onOpen(place)}>{displayName}</button>
        <p className="place-copy">{displayDesc}</p>
        <div className="place-actions">
          <button className={selected ? "button added" : "button secondary"} onClick={() => onToggle(place.id)}>
            {selected ? <Check size={17} /> : <Plus size={17} />}{selected ? t("placeCard.inMyTrip") : t("placeCard.addToTrip")}
          </button>
          <button className="icon-button" onClick={() => onOpen(place)} aria-label={`Open ${displayName}`}><ChevronRight /></button>
        </div>
      </div>
    </article>
  );
}

function Home({ setView, openServices, openPlace, selectedIds, togglePlace }) {
  const { t, translatePlaceName, translateArea, toBengaliNumber } = useLanguage();
  const [query, setQuery] = useState("");
  const [bannerVersion, setBannerVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setBannerVersion((v) => v + 1);
    window.addEventListener("tourismubd-media-updated", handleUpdate);
    window.addEventListener("tourismubd-banner-updated", handleUpdate);
    return () => {
      window.removeEventListener("tourismubd-media-updated", handleUpdate);
      window.removeEventListener("tourismubd-banner-updated", handleUpdate);
    };
  }, []);

  const heroImage = useMemo(() => getSystemBanner("hero_home", fallbackImage), [bannerVersion]);

  const match = query.trim()
    ? places.find((place) => `${place.name} ${place.area} ${(place.aliases || []).join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    : null;

  const submit = (event) => {
    event.preventDefault();
    if (match) openPlace(match);
    else setView("explore");
  };

  return (
    <main>
      <section className="hero">
        <img src={heroImage} alt="A wooden boat crossing the green waterways of Sylhet" />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow light">{t("hero.eyebrow")}</p>
          <h1>{t("hero.titleLine1")}<br />{t("hero.titleLine2")}</h1>
          <p>{t("hero.subtitle")}</p>
          <form className="search-box" onSubmit={submit}>
            <Search aria-hidden="true" />
            <label className="sr-only" htmlFor="hero-search">{t("hero.searchAction")}</label>
            <input id="hero-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("hero.searchPlaceholder")} />
            <button type="submit" aria-label={t("common.search")}><ArrowRight /></button>
          </form>
          {query && match ? <button className="search-suggestion" onClick={() => openPlace(match)}><MapPin size={16} />{translatePlaceName(match)}<span>{translateArea(match.area)}</span></button> : null}
        </div>
        <div className="hero-route" aria-hidden="true"><span>{t("hero.heroRouteStart")}</span><i /><span>{t("hero.heroRouteMid")}</span><i /><span>{t("hero.heroRouteEnd")}</span></div>
      </section>

      <section className="quick-actions page-shell" aria-label="Trip shortcuts">
        <button onClick={() => setView("explore")}><span><Binoculars /></span><div><b>{t("quickActions.findPlaceTitle")}</b><small>{t("quickActions.findPlaceSub")}</small></div><ChevronRight /></button>
        <button onClick={() => setView("trip")}><span><Route /></span><div><b>{t("quickActions.planTripTitle")}</b><small>{t("quickActions.planTripSub")}</small></div><ChevronRight /></button>
        <button onClick={() => openServices("HOUSEBOAT")}><span><Sailboat /></span><div><b>{t("quickActions.expertsTitle")}</b><small>{t("quickActions.expertsSub")}</small></div><ChevronRight /></button>
      </section>

      <section className="content-section page-shell">
        <SectionHead eyebrow={t("home.trendingEyebrow")} title={t("home.trendingTitle")} action={t("home.seeAll")} onAction={() => setView("explore")} />
        <div className="place-grid">
          {places.slice(0, 3).map((place) => <PlaceCard key={place.id} place={place} selected={selectedIds.includes(place.id)} onOpen={openPlace} onToggle={togglePlace} />)}
        </div>
      </section>

      <section className="district-band">
        <div className="page-shell district-layout">
          <div>
            <p className="eyebrow">{t("home.regionsEyebrow")}</p>
            <h2>{t("home.regionsTitle")}</h2>
            <p>{t("hero.subtitle")}</p>
            <button className="button primary" onClick={() => setView("trip")}><CalendarDays size={18} />{t("trip.generateRoute")}</button>
          </div>
          <div className="itinerary-preview">
            {(curatedItineraries.find((item) => item.durationDays === 2)?.days.flat() || places.slice(0, 4).map((place) => place.id)).slice(0, 4).map((item, index) => {
              const place = typeof item === "object" ? item : places.find((candidate) => candidate.id === item);
              return <div key={place?.id || index}><span>{toBengaliNumber(index + 1)}</span><div><b>{translatePlaceName(place?.name) || place?.name || "Sylhet highlight"}</b><small>{index < 2 ? `${t("trip.day")} ${toBengaliNumber(1)}` : `${t("trip.day")} ${toBengaliNumber(2)}`}</small></div></div>;
            })}
          </div>
        </div>
      </section>

      <WaterChoices openServices={openServices} compact />
    </main>
  );
}

function Explore({ selectedIds, togglePlace, openPlace, filters, setFilters }) {
  const { t, formatCount, translateCategory, translatePlaceName, translateDistrict, translateArea } = useLanguage();
  const { query, category, categoriesExpanded } = filters;
  const deferredQuery = useDeferredValue(query);
  const matchingPlaces = useMemo(() => places.filter((place) => {
    const nameBn = translatePlaceName(place);
    const districtBn = translateDistrict(place.district);
    const areaBn = translateArea(place.area);
    const categoryBn = translateCategory(place.category);
    const haystack = `${place.name} ${nameBn} ${place.area} ${areaBn} ${place.category} ${categoryBn} ${place.district} ${districtBn} ${(place.aliases || []).join(" ")}`.toLowerCase();
    return haystack.includes(deferredQuery.toLowerCase());
  }), [deferredQuery, translatePlaceName, translateDistrict, translateArea, translateCategory, placesVersion]);
  const categories = ["All", ...new Set(matchingPlaces.map((place) => place.category).sort())];
  const filtered = matchingPlaces.filter((place) => category === "All" || place.category === category);

  useEffect(() => {
    if (!categories.includes(category)) setFilters((current) => ({ ...current, category: "All" }));
  }, [category, categories.join("|"), setFilters]);

  return (
    <main className="page-shell page-top">
      <div className="page-title"><p className="eyebrow">{t("explore.eyebrow")}</p><h1>{t("explore.title")}</h1><p>{t("hero.subtitle")}</p></div>
      <div className="explore-tools">
        <label className="inline-search"><Search /><input value={query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder={t("explore.searchPlaceholder")} /><span>{formatCount(filtered.length, t("explore.placesCount"), t("explore.placesCount"))}</span></label>
        <div className={`category-tabs ${categoriesExpanded ? "expanded" : "collapsed"}`} role="group" aria-label="Filter places">
          {categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setFilters((current) => ({ ...current, category: item }))} key={item}>{item === "All" ? t("common.all") : translateCategory(item)}</button>)}
        </div>
        {categories.length > 8 ? <button type="button" className="category-more" onClick={() => setFilters((current) => ({ ...current, categoriesExpanded: !current.categoriesExpanded }))}>{categoriesExpanded ? t("common.less") : t("common.more")}</button> : null}
      </div>
      <div className="place-grid explore-grid">
        {filtered.map((place) => <PlaceCard key={place.id} place={place} selected={selectedIds.includes(place.id)} onOpen={openPlace} onToggle={togglePlace} />)}
      </div>
      {!filtered.length ? <div className="empty-state"><Search /><h2>{t("explore.noMatchTitle")}</h2><p>{t("explore.noMatchSubtitle")}</p></div> : null}
    </main>
  );
}

function PlacePhotoGallery({ place }) {
  const { lang, translatePlaceName, toBengaliNumber } = useLanguage();
  const [galleryVer, setGalleryVer] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setGalleryVer((v) => v + 1);
    window.addEventListener("tourismubd-media-updated", handleUpdate);
    return () => window.removeEventListener("tourismubd-media-updated", handleUpdate);
  }, []);

  const gallery = useMemo(() => getPlaceGallery(place), [place, galleryVer]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [prevIndex, setPrevIndex] = useState(null);
  const [slideDirection, setSlideDirection] = useState("initial"); // "next" | "prev" | "initial"
  const trackRef = useRef(null);
  const thumbStripRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const touchStartXRef = useRef(null);

  if (!gallery || !gallery.length) return null;

  const displayName = translatePlaceName(place);

  const scrollGallery = (direction) => {
    if (trackRef.current) {
      const scrollAmount = trackRef.current.clientWidth * 0.75 * direction;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const openLightbox = (index) => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setPrevIndex(null);
    setSlideDirection("initial");
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setLightboxIndex(null);
    setPrevIndex(null);
  };

  const goToPhoto = (targetIdx, customDirection) => {
    if (lightboxIndex === null || targetIdx === lightboxIndex || targetIdx < 0 || targetIdx >= gallery.length) return;

    let dir = customDirection;
    if (!dir) {
      if (lightboxIndex === gallery.length - 1 && targetIdx === 0) {
        dir = "next";
      } else if (lightboxIndex === 0 && targetIdx === gallery.length - 1) {
        dir = "prev";
      } else {
        dir = targetIdx > lightboxIndex ? "next" : "prev";
      }
    }

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    setPrevIndex(lightboxIndex);
    setSlideDirection(dir);
    setLightboxIndex(targetIdx);

    transitionTimerRef.current = setTimeout(() => {
      setPrevIndex(null);
      transitionTimerRef.current = null;
    }, 380);
  };

  const nextPhoto = () => {
    if (lightboxIndex === null) return;
    const nextIdx = (lightboxIndex + 1) % gallery.length;
    goToPhoto(nextIdx, "next");
  };

  const prevPhoto = () => {
    if (lightboxIndex === null) return;
    const prevIdx = (lightboxIndex - 1 + gallery.length) % gallery.length;
    goToPhoto(prevIdx, "prev");
  };

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, gallery.length]);

  // Preload adjacent images for instant smooth transitions
  useEffect(() => {
    if (lightboxIndex === null || !gallery.length) return;
    const nextIdx = (lightboxIndex + 1) % gallery.length;
    const prevIdx = (lightboxIndex - 1 + gallery.length) % gallery.length;
    [gallery[nextIdx]?.url, gallery[prevIdx]?.url].forEach((url) => {
      if (url && typeof Image !== "undefined") {
        const img = new Image();
        img.src = url;
      }
    });
  }, [lightboxIndex, gallery]);

  // Auto-scroll active thumbnail into view smoothly
  useEffect(() => {
    if (lightboxIndex === null || !thumbStripRef.current) return;
    const activeThumb = thumbStripRef.current.children[lightboxIndex];
    if (activeThumb?.scrollIntoView) {
      activeThumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [lightboxIndex]);

  // Clean up any pending transition timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // Touch swipe support for mobile/tablet
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches?.[0]?.clientX;
    if (typeof endX === "number") {
      const deltaX = endX - touchStartXRef.current;
      touchStartXRef.current = null;
      if (deltaX > 45) {
        prevPhoto();
      } else if (deltaX < -45) {
        nextPhoto();
      }
    }
  };

  const activePhoto = lightboxIndex !== null ? gallery[lightboxIndex] : null;

  return (
    <section className="place-scenic-gallery-section" aria-label="Scenic Photo Gallery">
      <div className="page-shell">
        <div className="place-gallery-header">
          <div className="place-gallery-title-box">
            <p className="eyebrow">{lang === "bn" ? "প্রাকৃতিক রূপ ও পরিবেশ" : "Visual Moments & Scenery"}</p>
            <h2>{lang === "bn" ? `${displayName}-এর নীরব সৌন্দর্য` : `Silent Beauty of ${displayName}`}</h2>
            <p className="place-gallery-subline">
              {lang === "bn"
                ? "প্রকৃতির স্নিগ্ধ রূপ, জল-হাওয়ার দোলা এবং এই স্থানের অপরূপ নিস্তব্ধতা।"
                : "Quiet reflections, gentle light, and the untouched serenity of this destination."}
            </p>
          </div>
          <div className="place-gallery-controls">
            <span className="place-gallery-pill">
              <Sparkles size={14} />{" "}
              {lang === "bn"
                ? `${toBengaliNumber(gallery.length)}টি নির্বাচিত ছবি`
                : `${gallery.length} Scenic Photos`}
            </span>
            <div className="place-gallery-nav-btns">
              <button
                type="button"
                className="place-gallery-arrow-btn"
                onClick={() => scrollGallery(-1)}
                title={lang === "bn" ? "পূর্ববর্তী ছবি" : "Scroll left"}
                aria-label={lang === "bn" ? "পূর্ববর্তী ছবি" : "Scroll left"}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="place-gallery-arrow-btn"
                onClick={() => scrollGallery(1)}
                title={lang === "bn" ? "পরবর্তী ছবি" : "Scroll right"}
                aria-label={lang === "bn" ? "পরবর্তী ছবি" : "Scroll right"}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="place-gallery-track" ref={trackRef}>
          {gallery.map((photo, index) => {
            const caption = photo[lang === "bn" ? "captionBn" : "captionEn"] || photo.captionEn;
            const tag = photo[lang === "bn" ? "tagBn" : "tagEn"] || photo.tagEn;
            return (
              <article
                key={photo.id || index}
                className="place-gallery-card"
                onClick={() => openLightbox(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openLightbox(index);
                }}
                title={lang === "bn" ? "পূর্ণ আকারে দেখতে ক্লিক করুন" : "Click to view full image"}
              >
                <div className="place-gallery-img-shell">
                  <img
                    src={photo.url}
                    alt={caption}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = photo.fallbackUrl || place.image || fallbackImage;
                    }}
                  />
                  {tag ? <span className="place-gallery-card-tag">{tag}</span> : null}
                  <span className="place-gallery-card-zoom" aria-hidden="true">
                    <Maximize2 size={15} />
                  </span>
                </div>
                <div className="place-gallery-card-info">
                  <p className="place-gallery-card-caption">{caption}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {activePhoto ? (
        <div className="place-lightbox-overlay" role="dialog" aria-modal="true" onClick={closeLightbox}>
          <div className="place-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="place-lightbox-topbar">
              <div className="place-lightbox-title-wrap">
                <span className="place-lightbox-tag">
                  {activePhoto[lang === "bn" ? "tagBn" : "tagEn"] || activePhoto.tagEn}
                </span>
                <span className="place-lightbox-counter">
                  {toBengaliNumber(lightboxIndex + 1)} / {toBengaliNumber(gallery.length)}
                </span>
              </div>
              <button
                type="button"
                className="place-lightbox-close-btn"
                onClick={closeLightbox}
                title={lang === "bn" ? "বন্ধ করুন (Esc)" : "Close (Esc)"}
                aria-label={lang === "bn" ? "বন্ধ করুন" : "Close"}
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="place-lightbox-stage"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <button
                type="button"
                className="place-lightbox-nav-btn prev"
                onClick={prevPhoto}
                title={lang === "bn" ? "পূর্ববর্তী ছবি" : "Previous photo"}
                aria-label={lang === "bn" ? "পূর্ববর্তী ছবি" : "Previous photo"}
              >
                <ChevronLeft size={28} />
              </button>

              <div className="place-lightbox-main-img-wrap">
                {prevIndex !== null && gallery[prevIndex] ? (
                  <div
                    className={`place-lightbox-image-slide slide-outgoing slide-out-${slideDirection}`}
                    aria-hidden="true"
                  >
                    <img
                      src={gallery[prevIndex].url}
                      alt=""
                      className="place-lightbox-main-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = gallery[prevIndex].fallbackUrl || place.image || fallbackImage;
                      }}
                    />
                  </div>
                ) : null}

                <div
                  key={lightboxIndex}
                  className={`place-lightbox-image-slide slide-incoming slide-in-${slideDirection}`}
                >
                  <img
                    src={activePhoto.url}
                    alt={activePhoto[lang === "bn" ? "captionBn" : "captionEn"]}
                    className="place-lightbox-main-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = activePhoto.fallbackUrl || place.image || fallbackImage;
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="place-lightbox-nav-btn next"
                onClick={nextPhoto}
                title={lang === "bn" ? "পরবর্তী ছবি" : "Next photo"}
                aria-label={lang === "bn" ? "পরবর্তী ছবি" : "Next photo"}
              >
                <ChevronRight size={28} />
              </button>
            </div>

            <div className="place-lightbox-bottombar">
              <p className="place-lightbox-caption">
                {activePhoto[lang === "bn" ? "captionBn" : "captionEn"]}
              </p>

              <div className="place-lightbox-thumbs" ref={thumbStripRef}>
                {gallery.map((thumb, idx) => (
                  <button
                    type="button"
                    key={thumb.id || idx}
                    className={`place-lightbox-thumb-btn ${idx === lightboxIndex ? "active" : ""}`}
                    onClick={() => goToPhoto(idx)}
                    title={thumb[lang === "bn" ? "captionBn" : "captionEn"]}
                  >
                    <img
                      src={thumb.url}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = thumb.fallbackUrl || place.image || fallbackImage;
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PlaceDetail({ place, selected, togglePlace, close, goTrip, openPlace }) {
  if (!place) return null;
  const {
    t,
    lang,
    translateCategory,
    translateDistrict,
    translatePlaceName,
    translateArea,
    translatePlaceDescription,
    translateHowToReach,
    translateBestTimeWhy,
    translateCaution,
    translateBestTimeRecommended,
    toBengaliNumber,
  } = useLanguage();
  const displayName = translatePlaceName(place);
  const displayDistrict = translateDistrict(place.district);
  const displayCategory = translateCategory(place.category);
  const displayArea = translateArea ? translateArea(place.area) : place.area;
  const displayDesc = translatePlaceDescription ? translatePlaceDescription(place) : (place.shortDescription || "");
  const locationText = displayArea && displayDistrict && displayArea.trim().toLowerCase() === displayDistrict.trim().toLowerCase()
    ? displayDistrict
    : (displayArea ? `${displayArea}, ${displayDistrict}` : displayDistrict);
  const nearby = findNearbyPlaces(place.id, 3);
  const recommendedTime = translateBestTimeRecommended
    ? translateBestTimeRecommended(place.bestTime?.recommended)
    : (place.bestTime?.recommended || (lang === "bn" ? "নভেম্বর – মার্চ" : "November – March"));
  const whyText = translateBestTimeWhy ? translateBestTimeWhy(place) : place.bestTime?.why;
  const cautionText = translateCaution ? translateCaution(place) : (place.bestTime?.caution || place.practicalTip);
  const reachText = translateHowToReach ? translateHowToReach(place) : place.howToReach;

  return (
    <main className="detail-page">
      <div className="detail-hero">
        <img src={place.image || fallbackImage} alt={`Landscape at ${displayName}`} />
        <div className="detail-overlay" />
        <button className="back-button" onClick={close}><ArrowLeft />{t("common.back")}</button>
        <div className="detail-title"><p className="eyebrow light">{displayCategory} · {locationText}</p><h1>{displayName}</h1><p>{displayDesc}</p></div>
        <div className="detail-actions">
          <button className={selected ? "button added" : "button white"} onClick={() => togglePlace(place.id)}>{selected ? <Check /> : <Plus />}{selected ? t("placeCard.inMyTrip") : t("placeCard.addToTrip")}</button>
          <button className="button primary" onClick={goTrip}><Route />{t("placeDetail.planRouteFromHere")}</button>
        </div>
      </div>
      <PlacePhotoGallery place={place} />
      <div className="page-shell detail-content">
        <section className="detail-main">
          <div className="fact-grid">
            <div><CalendarDays /><span>{lang === "bn" ? "ভ্রমণের সেরা সময়" : "Best time"}</span><b>{recommendedTime}</b></div>
            <div><Clock3 /><span>{lang === "bn" ? `${displayDistrict} থেকে` : `From ${place.district}`}</span><b>{place.travelTime || (lang === "bn" ? "আনুমানিক ১.৫ ঘণ্টা" : "About 1.5 hours")}</b></div>
            <div><Mountain /><span>{lang === "bn" ? "এলাকা" : "Area"}</span><b>{displayArea}</b></div>
          </div>
          <article className="prose-section"><p className="eyebrow">{lang === "bn" ? "ভ্রমণ পরিকল্পনা" : "Plan your visit"}</p><h2>{lang === "bn" ? "কখন যাবেন" : "When to go"}</h2><p>{whyText}</p><div className="notice"><Flag /> <span><b>{lang === "bn" ? "মনে রাখুন: " : "Keep in mind: "}</b>{cautionText}</span></div><small>{place.bestTime?.lastVerified ? (lang === "bn" ? `যাচাইকৃত: ${place.bestTime.lastVerified}` : `Last verified ${place.bestTime.lastVerified}`) : (lang === "bn" ? "তথ্য সরেজমিনে যাচাইকৃত" : "Field verification pending")}</small></article>
          <article className="prose-section"><p className="eyebrow">{lang === "bn" ? "যাতায়াত ব্যবস্থা" : "Getting there"}</p><h2>{lang === "bn" ? `কীভাবে যাবেন: ${displayName}` : `How to reach ${displayName}`}</h2><p>{reachText}</p></article>
          <article className="prose-section"><SectionHead eyebrow={lang === "bn" ? "কাছাকাছি দর্শনীয় স্থান" : "Continue nearby"} title={lang === "bn" ? "একই ভ্রমণে দর্শনীয় স্থানসমূহ" : "Useful places on the same trip"} />
            <div className="nearby-list">{nearby.map((item) => <button key={item.id} onClick={() => openPlace(item)}><img src={item.image || fallbackImage} alt="" /><span><b>{translatePlaceName(item)}</b><small>{translateArea ? translateArea(item.area) : item.area} · {lang === "bn" ? "বিস্তারিত দেখুন" : "view place"}</small></span><ChevronRight /></button>)}</div>
          </article>
        </section>
        <aside className="detail-aside">
          <div className="route-card"><Map /><p className="eyebrow">{lang === "bn" ? "রুট প্রেক্ষাপট" : "Route context"}</p><h3>{displayDistrict} → {displayName}</h3><div className="route-line"><i /><i /><i /></div><p>{lang === "bn" ? "সরাসরি সড়ক যোগাযোগ ও মানচিত্রের মাধ্যমে রুট প্রদর্শিত হয়।" : "Routes follow verified road legs across Bangladesh."}</p></div>
          <div className="trust-note"><BadgeCheck /><div><b>{lang === "bn" ? "সরেজমিনে যাচাইকৃত তথ্য" : "Information, checked by people"}</b><p>{lang === "bn" ? "পর্যটকদের জন্য ভ্রমণ নির্দেশিকা নিয়মিত স্থানীয় তথ্যের সাথে হালনাগাদ করা হয়।" : "Travel notes are curated and show when they were last verified."}</p></div></div>
        </aside>
      </div>
    </main>
  );
}

function routeMarkerIcon(label, isStart = false) {
  return L.divIcon({
    className: "route-leaflet-marker-shell",
    html: `<span class="route-leaflet-pin${isStart ? " start" : ""}"><i>${label}</i></span>`,
    iconSize: [38, 46],
    iconAnchor: [19, 43],
  });
}

function routeTooltip(title, detail) {
  const content = document.createElement("span");
  const name = document.createElement("b");
  const description = document.createElement("small");
  name.textContent = title;
  description.textContent = detail;
  content.append(name, description);
  return content;
}

function groupedRouteWaypoints(waypoints) {
  const groups = new globalThis.Map();
  waypoints.forEach((waypoint, index) => {
    const key = `${waypoint.coordinates.lat.toFixed(5)},${waypoint.coordinates.lng.toFixed(5)}`;
    const group = groups.get(key) || [];
    group.push({ waypoint, index });
    groups.set(key, group);
  });
  return [...groups.values()];
}

function translateRouteStatus(status, lang, toBengaliNumber) {
  if (!status || lang !== "bn") return status;
  if (status === "Map will load when visible.") return "দৃশ্যমান হলে মানচিত্র লোড হবে।";
  if (status === "Finding the road route...") return "সড়ক রুট খোঁজা হচ্ছে...";
  if (status === "Exact coordinates are unavailable for this day.") return "এই দিনের জন্য সঠিক স্থানাঙ্ক পাওয়া যায়নি।";
  if (status.startsWith("Road service is busy. Retrying")) {
    return status.replace(/Road service is busy\. Retrying \((\d+)\/(\d+)\)\.\.\./, (_, a, b) => `সড়ক সেবা ব্যস্ত। পুনরায় চেষ্টা করা হচ্ছে (${toBengaliNumber(a)}/${toBengaliNumber(b)})...`);
  }
  if (status === "A Bangladesh-only road route is unavailable for these stops.") return "এই স্থানগুলোর জন্য কেবল বাংলাদেশের অভ্যন্তরীণ সড়ক রুট উপলব্ধ নেই।";
  if (status === "The road route is temporarily unavailable; the verified stops are still shown.") return "সড়ক রুট সাময়িকভাবে অনুপলব্ধ; যাচাইকৃত স্থানগুলো দেখানো হচ্ছে।";
  if (status === "Starting the map...") return "মানচিত্র চালু হচ্ছে...";
  if (status === "This map could not be loaded.") return "মানচিত্রটি লোড করা সম্ভব হয়নি।";
  return status
    .replace(/([\d.]+) km one way/g, (_, n) => `${toBengaliNumber(n)} কিমি একমুখী`)
    .replace(/([\d.]+) km return/g, (_, n) => `${toBengaliNumber(n)} কিমি ফিরতি`)
    .replace(/([\d.]+) km round trip/g, (_, n) => `${toBengaliNumber(n)} কিমি মোট যাতায়াত`)
    .replace(/about (\d+) min outbound/g, (_, n) => `প্রায় ${toBengaliNumber(n)} মিনিট যাওয়া`)
    .replace(/about (\d+) min/g, (_, n) => `প্রায় ${toBengaliNumber(n)} মিনিট`)
    .replace(/· drive to (.+?); onward boat\/ferry travel excluded/g, (_, locs) => `· ${locs} পর্যন্ত গাড়ি; পরবর্তী নৌকা/ফেরি ভ্রমণ অন্তর্ভুক্ত নয়`)
    .replace(/· final access by boat or walking/g, "· শেষ অংশ নৌকা বা পায়ে হেঁটে");
}

function RouteDayMap({ plan, start }) {
  const mapNodeRef = useRef(null);
  const leafletMapRef = useRef(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const [mapStatus, setMapStatus] = useState("Map will load when visible.");
  const titleId = `route-day-${plan.day}`;

  useEffect(() => {
    if (!mapNodeRef.current || !plan.places.length) return undefined;
    if (typeof globalThis.IntersectionObserver !== "function") {
      setShouldLoadMap(true);
      return undefined;
    }
    const observer = new globalThis.IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setShouldLoadMap(true);
      observer.disconnect();
    }, { rootMargin: "120px 0px", threshold: 0.01 });
    observer.observe(mapNodeRef.current);
    return () => observer.disconnect();
  }, [plan.places.length]);

  useEffect(() => {
    if (!shouldLoadMap || !mapNodeRef.current || !plan.places.length) return undefined;
    let active = true;
    let map;
    let retryTimer;
    let tileRetryTimer;
    let resizeObserver;
    let resizeFrame;
    let refreshMapSize = () => {};
    const detachMapListeners = () => {
      cancelAnimationFrame(resizeFrame);
      clearTimeout(tileRetryTimer);
      resizeObserver?.disconnect();
      resizeObserver = undefined;
      globalThis.removeEventListener("resize", refreshMapSize);
    };
    const initialize = async () => {
      setMapStatus("Finding the road route...");
      const waypoints = await resolveRouteWaypoints(start, plan.places);
      if (!active || !mapNodeRef.current) return;
      const validWaypoints = waypoints.filter((waypoint) => Number.isFinite(waypoint.coordinates?.lat) && Number.isFinite(waypoint.coordinates?.lng));
      if (validWaypoints.length !== waypoints.length) { setMapStatus("Exact coordinates are unavailable for this day."); return; }

      detachMapListeners();
      leafletMapRef.current?.remove();
      map = L.map(mapNodeRef.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
      leafletMapRef.current = map;
      const primaryTileUrl = import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
      const fallbackTileUrl = import.meta.env.VITE_MAP_TILE_FALLBACK_URL || "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
      const osmAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      const fallbackAttribution = `${osmAttribution} &middot; Map style: <a href="https://opentopomap.org">OpenTopoMap</a>`;
      const tileSources = [
        { url: primaryTileUrl, attribution: osmAttribution, maxNativeZoom: 19 },
        { url: fallbackTileUrl, attribution: fallbackAttribution, maxNativeZoom: 17 },
      ].filter((source, index, sources) => sources.findIndex((candidate) => candidate.url === source.url) === index);
      let tileRetryCycle = 0;
      let tileLayer;
      const installTileLayer = (sourceIndex = 0) => {
        clearTimeout(tileRetryTimer);
        if (tileLayer) map.removeLayer(tileLayer);
        const source = tileSources[sourceIndex];
        let loadedTiles = 0;
        let failedTiles = 0;
        let recoveryScheduled = false;
        const layer = L.tileLayer(source.url, {
          maxZoom: 19,
          maxNativeZoom: source.maxNativeZoom,
          keepBuffer: 2,
          updateWhenIdle: true,
          attribution: source.attribution,
        }).addTo(map);
        tileLayer = layer;
        const recoverTiles = () => {
          if (recoveryScheduled || !active || leafletMapRef.current !== map || tileLayer !== layer) return;
          recoveryScheduled = true;
          tileRetryCycle += 1;
          const delay = Math.min(2500 + (tileRetryCycle * 1500), 12000);
          tileRetryTimer = setTimeout(() => {
            if (!active || leafletMapRef.current !== map || tileLayer !== layer) return;
            installTileLayer((sourceIndex + 1) % tileSources.length);
            refreshMapSize();
          }, delay);
        };
        layer.on("tileload", () => {
          loadedTiles += 1;
          if (loadedTiles < 2) return;
          tileRetryCycle = 0;
          clearTimeout(tileRetryTimer);
        });
        layer.on("tileerror", () => {
          failedTiles += 1;
          if ((loadedTiles === 0 && failedTiles >= 3) || (failedTiles >= 6 && failedTiles > loadedTiles * 2)) recoverTiles();
        });
        tileRetryTimer = setTimeout(() => {
          if (loadedTiles === 0) recoverTiles();
        }, 5000);
      };
      refreshMapSize = () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          if (active && leafletMapRef.current === map) map.invalidateSize({ pan: false, animate: false });
        });
      };
      installTileLayer();
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(refreshMapSize);
        resizeObserver.observe(mapNodeRef.current);
      }
      globalThis.addEventListener("resize", refreshMapSize);
      map.whenReady(() => requestAnimationFrame(() => {
        if (active && leafletMapRef.current === map) map.invalidateSize();
      }));
      const markerBounds = L.latLngBounds(validWaypoints.map((waypoint) => [waypoint.coordinates.lat, waypoint.coordinates.lng]));
      const markerGroups = groupedRouteWaypoints(validWaypoints);
      markerGroups.forEach((group) => {
        const { waypoint, index } = group[0];
        const includesStart = group.some((item) => item.index === 0);
        const label = includesStart ? "S" : group.length > 1 ? `${index}+` : index;
        const title = group.length > 1 ? (includesStart ? "Start and nearby stops" : "Nearby stops") : (includesStart ? "Start / return" : waypoint.name);
        const detail = group.length > 1
          ? group.map((item) => item.index === 0 ? `Start: ${start.name}` : `${item.index}. ${item.waypoint.name}`).join(" · ")
          : (includesStart ? start.name : waypoint.area);
        L.marker([waypoint.coordinates.lat, waypoint.coordinates.lng], {
          icon: routeMarkerIcon(label, includesStart),
          title: `${label}. ${title}`,
          alt: `${label}. ${title}`,
        })
          .addTo(map)
          .bindTooltip(routeTooltip(title, detail), { permanent: false, direction: "top", offset: [0, -36], className: "route-map-tooltip" });
      });
      if (markerBounds.isValid()) map.fitBounds(markerBounds.pad(0.3), { padding: [54, 54], maxZoom: 14 });

      const hasLocalApproach = validWaypoints.some((waypoint) => waypoint.roadAccessCoordinates);
      const departureLabels = [...new Set(validWaypoints.map((waypoint) => waypoint.roadAccessLabel).filter(Boolean))];
      const markedDepartures = new Set();
      validWaypoints.forEach((waypoint) => {
        const access = waypoint.roadAccessCoordinates;
        if (!access) return;
        if (waypoint.roadAccessLabel) {
          const key = `${access.lat},${access.lng}`;
          markerBounds.extend([access.lat, access.lng]);
          if (!markedDepartures.has(key)) {
            markedDepartures.add(key);
            L.marker([access.lat, access.lng], {
              icon: routeMarkerIcon("B", false),
              title: `${waypoint.roadAccessLabel} boat/ferry departure`,
              alt: `${waypoint.roadAccessLabel} boat/ferry departure`,
            }).addTo(map).bindTooltip(routeTooltip(waypoint.roadAccessLabel, "Driving ends here; onward boat/ferry travel is separate."), { permanent: false, direction: "top", offset: [0, -36], className: "route-map-tooltip" });
          }
          return;
        }
        if (!routeStaysInsideBangladesh([
          [access.lng, access.lat],
          [waypoint.coordinates.lng, waypoint.coordinates.lat],
        ])) return;
        L.polyline(
          [[access.lat, access.lng], [waypoint.coordinates.lat, waypoint.coordinates.lng]],
          { color: "#087f70", weight: 3, opacity: 0.72, dashArray: "7 8", lineCap: "round" },
        ).addTo(map);
      });

      if (validWaypoints.some((waypoint) => waypoint.coordinatesAreApproximate)) {
        setMapStatus("Some stops need verified coordinates before an exact road route can be shown.");
        return;
      }
      if (markerGroups.length !== validWaypoints.length) {
        setMapStatus("Some stops share the same saved coordinates; update them to show the exact road route.");
        return;
      }

      try {
        let roadRoute;
        let roadError;
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            roadRoute = await loadRoadRoute(validWaypoints);
            break;
          } catch (error) {
            roadError = error;
            if (error?.code === ROUTE_OUTSIDE_BANGLADESH || attempt === 3) break;
            setMapStatus(`Road service is busy. Retrying (${attempt}/2)...`);
            await new Promise((resolve) => setTimeout(resolve, attempt * 2500));
            if (!active) return;
          }
        }
        if (!roadRoute) throw roadError;
        if (!active || !map) return;
        L.polyline(roadRoute.coordinates, { color: "#ffffff", weight: 9, opacity: 0.82, lineJoin: "round" }).addTo(map);
        const line = L.polyline(roadRoute.coordinates, { color: "#087f70", weight: 5, opacity: 0.9, lineJoin: "round" }).addTo(map);
        const routeBounds = line.getBounds();
        if (markerBounds.isValid()) routeBounds.extend(markerBounds);
        map.invalidateSize({ pan: false, animate: false });
        map.fitBounds(routeBounds, { padding: [54, 54], maxZoom: 14 });
        const accessNote = departureLabels.length ? ` · drive to ${departureLabels.join(" / ")}; onward boat/ferry travel excluded` : hasLocalApproach ? " · final access by boat or walking" : "";
        setMapStatus(formatRoadRouteStatus(roadRoute, plan.places.length === 1, accessNote));
      } catch (error) {
        if (!active || !map) return;
        setMapStatus(error?.code === ROUTE_OUTSIDE_BANGLADESH
          ? "A Bangladesh-only road route is unavailable for these stops."
          : "The road route is temporarily unavailable; the verified stops are still shown.");
      }
    };
    const startMap = (attempt = 1) => initialize().catch((error) => {
      detachMapListeners();
      map?.remove();
      if (leafletMapRef.current === map) leafletMapRef.current = null;
      map = undefined;
      if (!active) return;
      if (attempt < 3) {
        setMapStatus("Starting the map...");
        retryTimer = setTimeout(() => startMap(attempt + 1), attempt * 700);
        return;
      }
      console.error("Route map failed to initialize", error);
      setMapStatus("This map could not be loaded.");
    });
    startMap();
    return () => {
      active = false;
      clearTimeout(retryTimer);
      clearTimeout(tileRetryTimer);
      detachMapListeners();
      if (leafletMapRef.current === map) leafletMapRef.current = null;
      map?.remove();
    };
  }, [plan, shouldLoadMap, start]);

  const { lang, toBengaliNumber } = useLanguage();
  return <article className="route-day-map" aria-labelledby={titleId}>
    <div className="route-day-map-head"><h3 id={titleId}>{lang === "bn" ? `দিন ${toBengaliNumber(plan.day)}` : `Day ${plan.day}`}</h3><span>{plan.places.length ? translateRouteStatus(mapStatus, lang, toBengaliNumber) : (lang === "bn" ? "এই দিনে কোনো যাত্রা নির্ধারিত নেই।" : "No stops scheduled for this day.")}</span></div>
    <div ref={mapNodeRef} className="route-map-canvas" role="region" aria-label={lang === "bn" ? `দিন ${toBengaliNumber(plan.day)}-এর সড়ক মানচিত্র` : `Road map for day ${plan.day}`} />
  </article>;
}

function TripPlanner({ user, selectedIds, setSelectedIds, notify, onDistrictSelected, settings, setSettings, onOpenTravelMap }) {
  const { t, lang, translateDistrict, translateDivision, translatePlaceName, translateArea, toBengaliNumber } = useLanguage();
  const inferredDistrictId = places.find((place) => selectedIds.some((id) => place.id === id || place.databaseId === id))?.districtId || "";
  const districtId = settings.districtId || inferredDistrictId;
  const { start, days } = settings;
  const updateSettings = (changes) => setSettings((current) => ({ ...current, ...changes }));
  const setDistrictId = (nextDistrictId) => updateSettings({ districtId: nextDistrictId, start: "town-center" });
  const setStart = (nextStart) => updateSettings({ start: nextStart });
  const setDays = (nextDays) => updateSettings({ days: typeof nextDays === "function" ? nextDays(days) : nextDays });
  const [routeResult, setRouteResult] = useState(null);
  const [saved, setSaved] = useState(() => loadSavedTrips(user?.id));
  const district = districts.find((item) => item.id === districtId);
  const suggestedPlaces = useMemo(() => suggestedPlacesForDistrict(districtId), [districtId]);
  const selected = selectedIds.map((id) => places.find((place) => place.id === id || place.databaseId === id)).filter(Boolean);
  const districtDayLimit = districtId ? Math.max(1, Math.min(12, suggestedPlaces.length)) : 12;
  const tripDayLimit = selected.length >= 2
    ? Math.min(districtDayLimit, maxTripDaysForPlaceCount(selected.length))
    : districtDayLimit;
  const startOptions = useMemo(() => {
    const name = district ? (lang === "bn" ? translateDistrict(district.name) : district.name) : (lang === "bn" ? "গন্তব্য" : "Destination");
    const rawName = district?.name || "Destination";
    const coordinates = DISTRICT_CENTER_COORDINATES[district?.slug] || suggestedPlaces[0]?.coordinates;
    const airport = {
      dhaka: "Hazrat Shahjalal International Airport",
      chattogram: "Shah Amanat International Airport",
      sylhet: "Osmani International Airport",
      "coxs-bazar": "Cox's Bazar International Airport",
      rajshahi: "Shah Makhdum Airport",
      jashore: "Jashore Airport",
      nilphamari: "Saidpur Airport",
      barishal: "Barishal Airport",
    }[district?.slug];
    return [
      { value: "town-center", name: lang === "bn" ? `${name} শহরের কেন্দ্র` : `${rawName} Town Center`, geocodeQuery: `${rawName}, Bangladesh`, coordinates, coordinatesAreApproximate: false },
      { value: "railway-station", name: lang === "bn" ? `${name} রেলওয়ে স্টেশন` : `${rawName} Railway Station`, geocodeQuery: `${rawName} Railway Station, ${rawName}, Bangladesh`, coordinates, coordinatesAreApproximate: true },
      { value: "bus-terminal", name: lang === "bn" ? `${name} বাস টার্মিনাল` : `${rawName} Bus Terminal`, geocodeQuery: `${rawName} Bus Terminal, ${rawName}, Bangladesh`, coordinates, coordinatesAreApproximate: true },
      ...(airport ? [{ value: "airport", name: airport, geocodeQuery: `${airport}, Bangladesh`, coordinates, coordinatesAreApproximate: true }] : []),
    ].filter((option) => option.coordinates);
  }, [district, lang, suggestedPlaces, translateDistrict]);
  const startingPoint = startOptions.find((option) => option.value === start) || startOptions[0];

  useEffect(() => setRouteResult(null), [districtId, selectedIds, start, days]);
  useEffect(() => {
    if (!settings.districtId && inferredDistrictId) updateSettings({ districtId: inferredDistrictId });
  }, [inferredDistrictId, settings.districtId]);
  useEffect(() => {
    if (days > tripDayLimit) setDays(tripDayLimit);
  }, [days, tripDayLimit]);
  useEffect(() => onDistrictSelected(district || null), [districtId, district, onDistrictSelected]);
  useEffect(() => setSaved(loadSavedTrips(user?.id)), [user?.id]);
  useEffect(() => {
    setSelectedIds((ids) => districtId ? ids.filter((id) => suggestedPlacesForDistrict(districtId).some((place) => place.id === id || place.databaseId === id)) : []);
  }, [districtId, setSelectedIds]);

  const generateSelected = () => {
    if (!districtId) return notify(lang === "bn" ? "প্রথমে একটি গন্তব্য জেলা নির্বাচন করুন।" : "Choose a destination district first.");
    if (selected.length < 2) return notify(lang === "bn" ? "রুট তৈরির জন্য কমপক্ষে দুটি স্থান যোগ করুন।" : "Add at least two places to build a route.");
    try {
      if (selected.length === suggestedPlaces.length) return setRouteResult(planDistrictTour(districtId, days, startingPoint));
      const route = planRoute(selected.map((place) => place.id), startingPoint);
      setRouteResult({ ...planDailyRoute(route, days), kind: "selected" });
    } catch (error) {
      console.error("Selected route could not be built", error);
      notify(lang === "bn" ? "নির্বাচিত রুট তৈরি করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।" : "The selected route could not be built. Please try again.");
    }
  };
  const generateDistrict = () => {
    if (!districtId) return notify(lang === "bn" ? "প্রথমে একটি গন্তব্য জেলা নির্বাচন করুন।" : "Choose a destination district first.");
    const validDays = Math.min(days, districtDayLimit);
    if (validDays !== days) setDays(validDays);
    setRouteResult(planDistrictTour(districtId, validDays, startingPoint));
  };
  const save = () => {
    if (!routeResult) return;
    if (!user) return notify(lang === "bn" ? "ভ্রমণ সংরক্ষণ করতে সাইন ইন করুন।" : "Sign in to save a trip.");
    const trip = { id: crypto.randomUUID(), name: `${days}-day ${district?.name || "Bangladesh"} ${routeResult.kind === "district" ? "district tour" : "selected places trip"}`, start: routeResult.start.name, days, placeIds: routeResult.orderedPlaces.map((place) => place.id), createdAt: new Date().toISOString() };
    saveTrip(trip, user.id);
    setSaved(loadSavedTrips(user.id));
    notify(lang === "bn" ? "ভ্রমণ এই ডিভাইসে সংরক্ষিত হয়েছে।" : "Trip saved on this device.");
  };

  return (
    <main className="page-shell page-top planner-page">
      <div className="page-title">
        <p className="eyebrow">{lang === "bn" ? "ভ্রমণ পরিকল্পনাকারী" : "Route planner"}</p>
        <h1>{lang === "bn" ? "পরিকল্পিত ও গোছানো ভ্রমণ।" : "Put the day in order."}</h1>
        <p>{lang === "bn" ? "একটি জেলা ও ১ থেকে ১২ দিন নির্বাচন করুন পুরো জেলা ভ্রমণের জন্য, অথবা যেকোনো দুটি বা ততোধিক স্থান নির্বাচন করে নিজস্ব রুট তৈরি করুন।" : "Choose a district and 1 to 12 days to plan every published place, or build a custom route from any two or more spots."}</p>
        {onOpenTravelMap ? (
          <div style={{ marginTop: "12px" }}>
            <button type="button" className="button secondary" onClick={onOpenTravelMap} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <MapPinned size={16} /> {lang === "bn" ? "ভ্রমণ করা জেলার মানচিত্র খুলুন" : "Open Visited Districts Travel Map"}
            </button>
          </div>
        ) : null}
      </div>
      <div className="planner-layout">
        <section className="planner-controls">
          <div className="control-section"><div className="control-title"><span>1</span><div><h2>{lang === "bn" ? "গন্তব্য জেলা নির্বাচন করুন" : "Choose destination district"}</h2><p>{lang === "bn" ? "জেলা নির্বাচনের পর প্রস্তাবিত স্থান দেখতে পাবেন।" : "Suggestions appear after you choose."}</p></div></div>
            <label>{lang === "bn" ? "গন্তব্য জেলা" : "Destination district"}<select value={districtId} onChange={(event) => setDistrictId(event.target.value)}><option value="">{lang === "bn" ? "একটি জেলা নির্বাচন করুন" : "Select a district"}</option>{districts.map((item) => <option value={item.id} key={item.id}>{translateDistrict(item.name)}, {translateDivision(item.division)}</option>)}</select></label>
          </div>
          <div className="control-section"><div className="control-title"><span>2</span><div><h2>{lang === "bn" ? "প্রস্তাবিত স্থানসমূহ" : "Suggested places"}</h2><p>{district ? (lang === "bn" ? `${translateDistrict(district.name)} জেলায় ${toBengaliNumber(selected.length)}টি স্থান নির্বাচিত` : `${selected.length} selected in ${district.name}`) : (lang === "bn" ? "আগে একটি জেলা নির্বাচন করুন" : "Choose a district first")}</p></div></div>
            {districtId ? <div className="selected-list">{suggestedPlaces.map((place) => {
              const active = selectedIds.some((id) => place.id === id || place.databaseId === id);
              return <button key={place.id} className={active ? "selected" : ""} onClick={() => setSelectedIds((ids) => active ? ids.filter((id) => id !== place.id && id !== place.databaseId) : [...ids, place.id])}><span>{active ? <Check /> : <Plus />}</span><div><b>{translatePlaceName(place.name)}</b><small>{translateArea(place.area)}</small></div></button>;
            })}</div> : <p className="form-note">{lang === "bn" ? "প্রস্তাবিত দর্শনীয় স্থান দেখতে গন্তব্য জেলা নির্বাচন করুন।" : "Select your destination district to see tourist spot suggestions."}</p>}
          </div>
          <div className="control-section"><div className="control-title"><span>3</span><div><h2>{lang === "bn" ? "জেলা ভ্রমণ পরিকল্পনা" : "Plan the district"}</h2><p>{district ? (lang === "bn" ? `${suggestedPlaces.length}টি দর্শনীয় স্থানের জন্য সর্বোচ্চ ${toBengaliNumber(districtDayLimit)} দিন নির্বাচন করুন।` : `Choose up to ${districtDayLimit} days for ${suggestedPlaces.length} published places.`) : (lang === "bn" ? "সবগুলো প্রকাশিত স্থানের জন্য ১ থেকে ১২ দিন নির্বাচন করুন।" : "Choose 1 to 12 days for every published place.")}</p></div></div>
            <label>{lang === "bn" ? "যাত্রার শুরু" : "Starting point"}<select value={start} onChange={(event) => setStart(event.target.value)} disabled={!startOptions.length}>{startOptions.map((option) => <option value={option.value} key={option.value}>{option.name}</option>)}</select></label>
            <div className="segmented" aria-label="Trip length">{Array.from({ length: 12 }, (_, index) => index + 1).map((value) => {
              const unavailable = value > tripDayLimit;
              const availabilityContext = selected.length >= 2 ? `${selected.length} selected places` : `${suggestedPlaces.length} places in ${district?.name}`;
              return <button key={value} className={days === value ? "active" : ""} disabled={unavailable} aria-label={unavailable ? `${value} days unavailable for ${availabilityContext}` : undefined} onClick={() => setDays(value)}>{toBengaliNumber(value)} {lang === "bn" ? "দিন" : `day${value === 1 ? "" : "s"}`}</button>;
            })}</div>
            <button className="button primary wide" onClick={generateDistrict}><Route />{lang === "bn" ? "পুরো জেলার রুট পরিকল্পনা" : "Plan full district"}</button>
            {selected.length >= 2 ? <button className="button secondary wide" onClick={generateSelected}>{lang === "bn" ? "নির্বাচিত স্থানগুলোর রুট তৈরি" : "Build selected places route"}</button> : null}
          </div>
        </section>
        <section className="route-output" aria-live="polite">
          {routeResult ? <><div className="route-output-head"><div><p className="eyebrow">{routeResult.kind === "district" ? (lang === "bn" ? "পুরো জেলা পরিকল্পনা" : "Full district plan") : (lang === "bn" ? "নির্বাচিত স্থান পরিকল্পনা" : "Selected places plan")}</p><h2>{routeResult.kind === "district" ? (lang === "bn" ? `${toBengaliNumber(days)} দিনে ${translateDistrict(district?.name)}` : `${district?.name} in ${days} days`) : (lang === "bn" ? `${toBengaliNumber(days)} দিনে ${toBengaliNumber(routeResult.orderedPlaces.length)}টি স্থান` : `${routeResult.orderedPlaces.length} selected places in ${days} days`)}</h2></div><button className="button secondary" onClick={save}>{lang === "bn" ? "ভ্রমণ সংরক্ষণ করুন" : "Save trip"}</button></div>
            <div className="route-stats"><span><Route />{lang === "bn" ? `আনুমানিক ${toBengaliNumber(Math.round(routeResult.totalDistanceKm || 0))} কিমি` : `Estimated ${Math.round(routeResult.totalDistanceKm || 0)} km`}</span><span><Clock3 />{lang === "bn" ? `আনুমানিক ${toBengaliNumber(Math.max(1, Math.round((routeResult.totalMinutes || 120) / 60)))} ঘণ্টা ভ্রমণ` : `Estimated ${Math.max(1, Math.round((routeResult.totalMinutes || 120) / 60))} hr travel`}</span><span><MapPin />{toBengaliNumber(routeResult.orderedPlaces.length)} {lang === "bn" ? "টি স্থান" : "places"}</span></div>
            <div className={`route-visual${routeResult.dayPlans ? " route-day-images" : ""}`}><div className="route-start"><span>S</span><div><small>{lang === "bn" ? "যাত্রা শুরু ও দৈনিক প্রত্যাবর্তন" : "Start and daily return"}</small><b>{translatePlaceName(routeResult.start.name) || routeResult.start.name}</b></div></div>{routeResult.dayPlans ? routeResult.dayPlans.map((plan) => <RouteDayMap key={plan.day} plan={plan} start={routeResult.start} />) : routeResult.orderedPlaces.map((place, index) => <div className="route-stop" key={place.id}><span>{toBengaliNumber(index + 1)}</span><div><small>{index + 1 === routeResult.orderedPlaces.length ? (lang === "bn" ? "এখানে সমাপ্তি" : "Finish here") : (lang === "bn" ? `স্টপ ${toBengaliNumber(index + 1)}` : `Stop ${index + 1}`)}</small><b>{translatePlaceName(place.name)}</b><p>{translateArea(place.area)}</p></div></div>)}</div>
            <div className="route-disclaimer"><ShieldCheck />{lang === "bn" ? "রুটগুলো চিহ্নিত সড়ক অনুসরণ করে এবং নির্বাচিত শুরুর স্থানে ফিরে আসে। যাত্রার আগে বর্তমান সড়কের অবস্থা যাচাই করুন।" : "Routes follow mapped roads and return to the selected starting point. Confirm current road conditions before departure."}</div>
          </> : <div className="route-placeholder"><div className="map-pattern"><Map /></div><h2>{districtId ? (lang === "bn" ? "আপনার ভ্রমণের রুট এখানে প্রদর্শিত হবে।" : "Your route will appear here.") : (lang === "bn" ? "শুরু করতে একটি জেলা নির্বাচন করুন।" : "Choose a district to begin.")}</h2><p>{districtId ? (lang === "bn" ? "কমপক্ষে দুটি স্থান নির্বাচন করুন, শুরুর পয়েন্ট বেছে নিন এবং রুট তৈরি করুন।" : "Select at least two places, choose a starting point, and build the route.") : (lang === "bn" ? "আমরা আপনার গন্তব্য জেলার প্রকাশিত পর্যটন স্থানগুলো প্রস্তাব করব।" : "We will suggest published tourist spots in your destination district.")}</p></div>}
        </section>
      </div>
      {saved.length ? <section className="saved-section"><SectionHead eyebrow={lang === "bn" ? "এই ডিভাইসে" : "On this device"} title={lang === "bn" ? "সংরক্ষিত ভ্রমণসমূহ" : "Saved trips"} /><div className="saved-list">{saved.map((trip) => <div key={trip.id}><Route /><span><b>{trip.name}</b><small>{toBengaliNumber(trip.placeIds.length)} {lang === "bn" ? "টি স্থান" : "places"} · {lang === "bn" ? `শুরু: ${trip.start}` : `starts at ${trip.start}`}</small></span></div>)}</div></section> : null}
    </main>
  );
}

function WaterChoices({ openServices, compact = false }) {
  const { t } = useLanguage();
  return (
    <section className={compact ? "water-band" : "water-options"}>
      <div className="page-shell">
        <SectionHead eyebrow={t("waterChoices.eyebrow")} title={t("waterChoices.title")} />
        <div className="water-grid">
          <button onClick={() => openServices?.("HOUSEBOAT")}><span className="water-icon"><Sailboat /></span><div><h3>{t("waterChoices.houseboatTitle")}</h3><p>{t("waterChoices.houseboatDesc")}</p></div><ArrowRight /></button>
          <button onClick={() => openServices?.("SMALL_BOAT")}><span className="water-icon small"><Compass /></span><div><h3>{t("waterChoices.smallBoatTitle")}</h3><p>{t("waterChoices.smallBoatDesc")}</p></div><ArrowRight /></button>
        </div>
      </div>
    </section>
  );
}

function BookingDialog({ listing, serviceType, onClose, onSubmit }) {
  const { lang } = useLanguage();
  const dialogRef = useRef(null);
  const fixedOneDay = serviceType === "SMALL_BOAT" && listing.water_bodies?.is_sundarbans;

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.open && dialog.close();
  }, []);

  return (
    <dialog ref={dialogRef} className="provider-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()} aria-labelledby="booking-title">
        <button type="button" className="icon-button close" onClick={onClose} aria-label={lang === "bn" ? "বন্ধ করুন" : "Close"}><X /></button>
        <p className="eyebrow">{lang === "bn" ? "বুকিং অনুরোধ" : "Booking request"}</p>
        <h2 id="booking-title">{lang === "bn" ? `${listing.service_name || listing.display_name || listing.name}-এর জন্য অনুরোধ` : `Request ${listing.service_name || listing.display_name || listing.name}`}</h2>
        <label>{lang === "bn" ? "শুরুর তারিখ" : "Start date"}<input name="startDate" required type="date" min={new Date().toISOString().slice(0, 10)} /></label>
        <label>{lang === "bn" ? "দিনের সংখ্যা" : "Number of days"}<input name="durationDays" required type="number" min="1" max="30" defaultValue="1" readOnly={fixedOneDay} /></label>
        {fixedOneDay ? <p className="form-note">{lang === "bn" ? "সুন্দরবনের ছোট নৌকা বুকিং ১ দিনের জন্য নির্ধারিত।" : "Sundarbans Small Boat bookings are fixed to one day."}</p> : null}
        <label>{lang === "bn" ? "ভ্রমণকারীর সংখ্যা" : "Travelers"}<input name="travelerCount" required type="number" min="1" max="100" defaultValue="1" /></label>
        <label>{lang === "bn" ? "বিশেষ তথ্য বা নোট" : "Note"}<textarea name="note" rows="3" placeholder={lang === "bn" ? "পিকআপ পয়েন্ট বা প্রয়োজনীয় বিবরণ..." : "Pickup point or practical details"} /></label>
        <label className="check-label"><input name="contactConsent" type="checkbox" /> {lang === "bn" ? "বুকিং নিশ্চিত হওয়ার পর সেবা প্রদানকারীর সাথে আমার ফোন ও ইমেইল শেয়ার করুন" : "Share my phone and email with the provider after confirmation"}</label>
        <button className="button primary wide">{lang === "bn" ? "বুকিং অনুরোধ পাঠান" : "Send booking request"}</button>
      </form>
    </dialog>
  );
}

function Services({ notify, type, onTypeChange, user, onAuth, district }) {
  const { t, lang, translateDistrict, toBengaliNumber } = useLanguage();
  const [liveListings, setLiveListings] = useState(null);
  const [booking, setBooking] = useState(null);
  const [profile, setProfile] = useState(null);
  const fallbackListings = type === "GUIDE" ? guides : waterListings.filter((item) => item.type === type);
  const listings = liveListings ?? fallbackListings;
  const service = SERVICE_META[type];
  const ServiceIcon = service.icon;

  useEffect(() => {
    if (!supabase) return setLiveListings(null);
    setLiveListings(null);
    const boatService = ["HOUSEBOAT", "SMALL_BOAT"].includes(type);
    let query = boatService
      ? supabase.from(type === "HOUSEBOAT" ? "houseboat_listings" : "small_boat_listings").select("id,provider_id,name,boarding_point,capacity,approximate_price_bdt,pricing_unit,water_bodies(is_sundarbans)").eq("status", "PUBLISHED")
      : supabase.from("public_provider_details").select("id,user_id,type,display_name,service_name,bio,photo_url,identity_verified,rating_average,rating_count,district,email,phone,blood_group,gender,working_place,hobby,present_address,permanent_address").eq("type", service.providerType);
    if (!boatService && district) query = query.eq("district", district.name);
    if (boatService) {
      let profileQuery = supabase.from("public_provider_details").select("id,user_id,type,display_name,service_name,bio,photo_url,rating_average,rating_count,district,email,phone,blood_group,gender,working_place,hobby,present_address,permanent_address");
      if (district) profileQuery = profileQuery.eq("district", district.name);
      Promise.all([query, profileQuery]).then(([listingResult, profileResult]) => {
        if (listingResult.error || profileResult.error) notify(listingResult.error?.message || profileResult.error?.message || (lang === "bn" ? "প্রোভাইডার তথ্য লোড করা যায়নি।" : "Could not load provider details."));
        const profiles = Object.fromEntries((profileResult.data || []).map(({ id, ...profile }) => [id, profile]));
        setLiveListings((listingResult.data || []).filter((listing) => !district || profiles[listing.provider_id]).map((listing) => ({ ...listing, ...profiles[listing.provider_id] })));
      });
    } else query.then(({ data, error }) => {
      if (error) notify(error.message);
      setLiveListings(data || []);
    });
  }, [type, district, lang, notify, service.providerType]);
  const openProfile = async (listing) => {
    if (!supabase || !listing.user_id) return notify(lang === "bn" ? "এই সেবা প্রদানকারীর প্রোফাইল এখনো প্রস্তুত নয়।" : "This provider profile is not available yet.");
    const { data, error } = await supabase.from("public_people").select(PUBLIC_PERSON_FIELDS).eq("id", listing.user_id).maybeSingle();
    if (error) return notify(error.message);
    if (!data) return notify(lang === "bn" ? "এই সেবা প্রদানকারীর প্রোফাইল এখনো প্রস্তুত নয়।" : "This provider profile is not available yet.");
    setProfile(data);
  };
  const requestBooking = (listing) => {
    if (!user) {
      notify(lang === "bn" ? "বুকিং অনুরোধ পাঠাতে পর্যটক হিসেবে সাইন ইন করুন।" : "Sign in as a traveler to request a booking.");
      return onAuth();
    }
    setBooking(listing);
  };
  const submitBooking = async (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const payload = {
      traveler_id: user.id,
      provider_id: ["HOUSEBOAT", "SMALL_BOAT"].includes(type) ? booking.provider_id : booking.id,
      service_type: type,
      start_date: values.get("startDate"),
      duration_days: Number(values.get("durationDays")),
      traveler_count: Number(values.get("travelerCount")),
      traveler_contact_consent: values.get("contactConsent") === "on",
      note: values.get("note") || null,
      ...(type === "HOUSEBOAT" ? { houseboat_listing_id: booking.id } : {}),
      ...(type === "SMALL_BOAT" ? { small_boat_listing_id: booking.id } : {}),
    };
    const { error } = await supabase.from("bookings").insert(payload);
    if (error) return notify(error.message);
    setBooking(null);
    notify(lang === "bn" ? "বুকিং অনুরোধ পাঠানো হয়েছে।" : "Booking request sent.");
  };
  if (profile) return <PublicPersonProfile person={profile} user={user} notify={notify} backLabel={lang === "bn" ? "সেবাসমূহে ফিরে যান" : "Back to local services"} onBack={() => setProfile(null)} onFollowerChange={(change) => setProfile((current) => ({ ...current, follower_count: Math.max(0, (current.follower_count || 0) + change) }))} />;
  const providerTitle = (listing) => listing.service_name || listing.display_name || listing.name;

  const serviceTabLabel = (id, defaultLabel) => {
    if (lang !== "bn") return defaultLabel;
    if (id === "GUIDE") return "ট্যুর গাইড";
    if (id === "HOUSEBOAT") return "হাউসবোট";
    if (id === "SMALL_BOAT") return "ছোট ট্রলার ও নৌকা";
    return defaultLabel;
  };

  return (
    <main className="page-shell page-top services-page">
      <div className="page-title"><p className="eyebrow">{lang === "bn" ? "স্থানীয় সেবাসমূহ" : "Local services"}</p><h1>{lang === "bn" ? "আগে ভ্রমণ পরিকল্পনা করুন। প্রয়োজনে সেবা নিন।" : "Plan first. Ask for help when you need it."}</h1><p>{lang === "bn" ? "পাবলিক তথ্য উন্মুক্ত থাকে; বুকিং নিশ্চিত হলেই কেবল ব্যক্তিগত যোগাযোগের তথ্য প্রকাশ পায়।" : "Public details stay useful; private contact unlocks only after a booking is confirmed."}</p></div>
      <div className="service-tabs" role="tablist">{Object.entries(SERVICE_META).map(([id, item]) => { const Icon = item.icon; return <button role="tab" aria-selected={type === id} className={type === id ? "active" : ""} onClick={() => onTypeChange(id)} key={id}><Icon />{serviceTabLabel(id, item.label)}</button>; })}</div>
      {listings.length ? <div className="provider-grid">{listings.map((listing) => <article className="provider-card" key={listing.id}>{listing.user_id ? <button type="button" className="provider-photo" onClick={() => openProfile(listing)} aria-label={`View ${providerTitle(listing)} profile`}>{listing.photo_url ? <img src={listing.photo_url} alt="" /> : <ServiceIcon />}</button> : <span className="provider-photo">{listing.photo_url ? <img src={listing.photo_url} alt="" /> : <ServiceIcon />}</span>}<div>{listing.user_id ? <button type="button" className="provider-name" onClick={() => openProfile(listing)}><h2>{providerTitle(listing)}</h2></button> : <h2>{providerTitle(listing)}</h2>}{listing.service_name && listing.display_name && listing.service_name !== listing.display_name ? <p className="provider-owner-name">{lang === "bn" ? "সেবা প্রদানকারী:" : "Provider:"} {listing.display_name}</p> : null}<ProviderRating profile={listing} /><p>{listing.bio || (listing.boarding_point ? `${listing.boarding_point} · ${lang === "bn" ? `ধারণক্ষমতা ${toBengaliNumber(listing.capacity)} জন` : `capacity ${listing.capacity}`}` : (lang === "bn" ? "নির্বাচিত সেবা এলাকায় অনুরোধের জন্য প্রস্তুত।" : "Available for requests in selected service areas."))}</p>{listing.approximate_price_bdt ? <b>{lang === "bn" ? `আনুমানিক ৳${toBengaliNumber(listing.approximate_price_bdt)} / ${listing.pricing_unit === "day" ? "দিন" : listing.pricing_unit === "hour" ? "ঘণ্টা" : "ট্রিপ"}` : `About ৳${listing.approximate_price_bdt} / ${listing.pricing_unit || "trip"}`}</b> : null}<PublicProfileDetails profile={listing} /></div><button className="button primary" onClick={() => requestBooking(listing)}>{lang === "bn" ? "বুকিং অনুরোধ" : "Request booking"}</button></article>)}</div> : <div className="empty-provider"><span><ServiceIcon /></span><p className="eyebrow">{serviceTabLabel(type, service.label)}{district ? ` · ${translateDistrict(district.name)}` : ""}</p><h2>{lang === "bn" ? "এখানে এখনো কোনো সেবা উপলব্ধ নেই।" : `No ${service.label.toLowerCase()} are available here yet.`}</h2><p>{lang === "bn" ? "সেবা প্রদানকারীরা তাদের পাবলিক প্রোফাইলে এই জেলা যুক্ত করলে এখানে দেখা যাবে।" : "Providers will appear here after they add this district to their public profile."}</p></div>}
      {booking ? <BookingDialog listing={booking} serviceType={type} onClose={() => setBooking(null)} onSubmit={submitBooking} /> : null}
    </main>
  );
}

function Footer() {
  const { t } = useLanguage();
  return <footer><div className="page-shell"><Logo /><p>{t("footer.tagline")}</p><span>{t("footer.rights")}</span></div></footer>;
}

function LoginRequired({ onSignIn, onBrowsePlaces }) {
  const { t } = useLanguage();
  return <main className="page-shell page-top login-required">
    <span className="login-required-icon"><ShieldCheck /></span>
    <p className="eyebrow">{t("nav.account")}</p>
    <h1>{t("auth.signInTitle")}</h1>
    <p>{t("footer.builtFor")}</p>
    <div className="login-required-actions">
      <button type="button" className="button primary" onClick={onSignIn}>{t("auth.submitSignIn")}</button>
      <button type="button" className="button secondary" onClick={onBrowsePlaces}><MapPin />{t("trip.browsePlaces")}</button>
    </div>
  </main>;
}

export default function App() {
  const tourismVersion = usePublishedTourism();
  const { lang } = useLanguage();
  const auth = useAuth();
  const [view, setView] = useState(viewFromLocation);
  const [serviceDistrictId, setServiceDistrictId] = useSessionState("tourismubd.service-district", "");
  const [selectedIds, setSelectedIds] = useSessionState("tourismubd.selected-places", []);
  const [exploreFilters, setExploreFilters] = useSessionState("tourismubd.explore-filters", { query: "", category: "All", categoriesExpanded: false });
  const [tripSettings, setTripSettings] = useSessionState("tourismubd.trip-settings", { districtId: "", start: "town-center", days: 2 });
  const [peopleQuery, setPeopleQuery] = useSessionState("tourismubd.people-query", "");
  const [marketplaceQuery, setMarketplaceQuery] = useSessionState("tourismubd.marketplace-query", "");
  const [activePlace, setActivePlace] = useState(null);

  useEffect(() => {
    if (activePlace) {
      const refreshed = places.find((p) => p.id === activePlace.id || p.slug === activePlace.slug);
      if (refreshed) setActivePlace(refreshed);
    }
  }, [tourismVersion, placesVersion]);
  const [serviceType, setServiceType] = useSessionState("tourismubd.service-type", "GUIDE");
  const [toast, setToast] = useState("");
  const [bdMapOpen, setBdMapOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [deactivationOpen, setDeactivationOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [messageProfile, setMessageProfile] = useState(null);
  const [linkedProfile, setLinkedProfile] = useState(null);
  const [linkedProfileReadOnly, setLinkedProfileReadOnly] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("tourismubd.theme") === "dark" ? "dark" : "light");
  const pendingAuthActionRef = useRef(null);
  const serviceDistrict = districts.find((district) => district.id === serviceDistrictId) || null;

  useEffect(() => {
    if (!supabase) return;
    supabase.rpc("get_reported_social_post_ids").then(({ data }) => {
      if (Array.isArray(data)) {
        const activeHiddenIds = new Set(data.map((row) => row.post_id || row).filter(Boolean));
        try {
          window.localStorage.setItem(HIDDEN_POSTS_STORAGE_KEY, JSON.stringify([...activeHiddenIds]));
        } catch { /* ignore storage errors */ }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    updateBrowserView(view, true);
    const handlePopState = () => {
      setActivePlace(null);
      setView(viewFromLocation());
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("tourismubd.theme", theme);
  }, [theme]);

  useEffect(() => {
    setSelectedIds([]);
    setServiceDistrictId("");
    setMessagesOpen(false);
    setMessageProfile(null);
  }, [auth.user?.id]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };
  const requestAuthentication = (afterAuthentication = null) => {
    if (!supabase) return notify(lang === "bn" ? "অ্যাকাউন্ট চালু করতে Supabase সংযুক্ত করুন।" : "Connect Supabase to enable accounts.");
    pendingAuthActionRef.current = afterAuthentication;
    setAuthOpen(true);
  };
  const showView = (nextView, replace = false) => {
    setActivePlace(null);
    setView(nextView);
    updateBrowserView(nextView, replace);
    window.scrollTo(0, 0);
  };
  const navigate = (nextView) => {
    const openView = () => showView(nextView);
    if (nextView !== "travel-map" && viewRequiresAuthentication(nextView, auth.user)) {
      requestAuthentication(openView);
      return false;
    }
    openView();
    return true;
  };
  const togglePlace = (id) => {
    const toggle = () => setSelectedIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
    if (!auth.user) return requestAuthentication(toggle);
    toggle();
  };
  const openPlace = (place) => { setActivePlace(place); window.scrollTo(0, 0); };
  const openServices = (type = "GUIDE") => {
    const open = () => { setServiceType(type); showView("services"); };
    if (!auth.user) return requestAuthentication(open);
    open();
  };
  const goTrip = () => {
    const place = activePlace;
    const open = () => {
      if (place) setSelectedIds((ids) => ids.includes(place.id) ? ids : [...ids, place.id]);
      showView("trip");
    };
    if (!auth.user) return requestAuthentication(open);
    open();
  };
  const openMessageProfile = async (personId) => {
    const { data, error } = await supabase.from("public_people").select(PUBLIC_PERSON_FIELDS).eq("id", personId).maybeSingle();
    if (error) return notify(error.message);
    if (!data) return notify(lang === "bn" ? "এই প্রোফাইলটি উপলব্ধ নেই।" : "This profile is not available.");
    setMessageProfile({ person: data, returnView: view });
    setMessagesOpen(false);
    setView("message-profile");
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const personId = search.get("profile");
    const adminPreview = import.meta.env.DEV && search.get("adminPreview") === "1";
    if (!personId || !supabase) return undefined;
    let active = true;
    const openLinkedProfile = async () => {
      const { data, error } = await supabase.from("public_people").select(PUBLIC_PERSON_FIELDS).eq("id", personId).maybeSingle();
      if (!active) return;
      if (error) return notify(error.message);
      if (!data) return notify(lang === "bn" ? "এই প্রোফাইলটি উপলব্ধ নেই।" : "This profile is not available.");
      setLinkedProfile(data);
      setLinkedProfileReadOnly(false);
      setView("linked-profile");
      window.scrollTo(0, 0);
    };
    const openAdminPreview = async () => {
      try {
        const response = await fetch(`${ADMIN_APP_URL}/__tourismubd-admin/profile?id=${encodeURIComponent(personId)}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || (lang === "bn" ? "অ্যাডমিন প্রোফাইল প্রিভিউ পাওয়া যায়নি।" : "The Admin profile preview is unavailable."));
        if (!active) return;
        if (!payload.data) return notify(lang === "bn" ? "এই প্রোফাইলটি উপলব্ধ নেই।" : "This profile is not available.");
        setLinkedProfile(payload.data);
        setLinkedProfileReadOnly(true);
        setView("linked-profile");
        window.scrollTo(0, 0);
      } catch (error) {
        if (active) notify(error.message || (lang === "bn" ? "অ্যাডমিন প্রোফাইল প্রিভিউ পাওয়া যায়নি।" : "The Admin profile preview is unavailable."));
      }
    };
    if (adminPreview) {
      openAdminPreview();
      return () => { active = false; };
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session?.user) openLinkedProfile();
      else requestAuthentication(openLinkedProfile);
    });
    return () => { active = false; };
  }, [lang]);
  const closeLinkedProfile = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("profile");
    url.searchParams.delete("adminPreview");
    window.history.replaceState({}, "", url);
    setLinkedProfile(null);
    setLinkedProfileReadOnly(false);
    showView("home", true);
  };
  const openDashboard = async (user = auth.user) => {
    if (!user) return setAuthOpen(true);
    const { data, error } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
    if (error) return notify(error.message);
    if (data?.status === "DEACTIVATED") {
      const { error: reactivateError } = await supabase.rpc("reactivate_own_account");
      if (reactivateError) return notify(reactivateError.message);
      notify(lang === "bn" ? "অ্যাকাউন্ট পুনরায় সক্রিয় হয়েছে।" : "Account reactivated.");
    }
    const role = data?.role || user.user_metadata?.role || "TRAVELER";
    showView(role === "TRAVELER" ? "traveler" : role === "BUSINESS_OWNER" ? "business" : "provider");
  };
  const authenticationComplete = async (user) => {
    const pendingAction = pendingAuthActionRef.current;
    pendingAuthActionRef.current = null;
    if (pendingAction) return pendingAction(user);
    return openDashboard(user);
  };
  const deactivateAccount = async (password) => {
    const { error: passwordError } = await supabase.auth.signInWithPassword({ email: auth.user.email, password });
    if (passwordError) return authErrorMessage(passwordError, "confirm your password");
    const { error } = await supabase.rpc("deactivate_own_account");
    if (error) return error.message;
    setDeactivationOpen(false);
    await supabase.auth.signOut();
    showView("home", true);
    notify(lang === "bn" ? "অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে। ৩ মাসের মধ্যে সাইন ইন করে এটি চালু রাখতে পারেন।" : "Account deactivated. Sign in within three months to keep it.");
    return "";
  };
  const signOut = async () => {
    setSignOutOpen(false);
    setMessagesOpen(false);
    await supabase.auth.signOut();
    showView("home", true);
    notify(lang === "bn" ? "সাইন আউট সম্পন্ন হয়েছে।" : "Signed out.");
  };
  const protectedView = viewRequiresAuthentication(view, auth.user) && !(view === "linked-profile" && linkedProfileReadOnly) && view !== "travel-map";

  return (
    <div className="app">
      {activePlace ? <PlaceDetail place={activePlace} selected={selectedIds.includes(activePlace.id)} togglePlace={togglePlace} close={() => setActivePlace(null)} goTrip={goTrip} openPlace={openPlace} /> : <>
        <Header view={view} setView={navigate} tripCount={selectedIds.length} user={auth.user} onAuth={() => auth.user ? openDashboard() : requestAuthentication()} onDeactivate={() => setDeactivationOpen(true)} onSignOut={() => setSignOutOpen(true)} onOpenAbout={() => navigate("account-about")} onOpenBookings={() => navigate("booking-requests")} onOpenRatings={() => navigate("provider-ratings")} onOpenMessages={() => setMessagesOpen(true)} onOpenBusinessCatalog={() => navigate("business-catalog")} notify={notify} theme={theme} onThemeChange={setTheme} />
        {protectedView ? <LoginRequired onSignIn={() => requestAuthentication(() => window.scrollTo(0, 0))} onBrowsePlaces={() => navigate("explore")} /> : null}
        {!protectedView && view === "home" ? <Home setView={navigate} openServices={openServices} openPlace={openPlace} selectedIds={selectedIds} togglePlace={togglePlace} /> : null}
        {view === "explore" ? <Explore selectedIds={selectedIds} togglePlace={togglePlace} openPlace={openPlace} filters={exploreFilters} setFilters={setExploreFilters} /> : null}
        {!protectedView && view === "travel-map" ? <BangladeshTravelMapPage onBack={() => navigate("explore")} onOpenTrip={() => navigate("trip")} notify={notify} /> : null}
        {!protectedView && view === "trip" ? <TripPlanner user={auth.user} selectedIds={selectedIds} setSelectedIds={setSelectedIds} notify={notify} onDistrictSelected={(district) => setServiceDistrictId(district?.id || "")} settings={tripSettings} setSettings={setTripSettings} onOpenTravelMap={() => navigate("travel-map")} /> : null}
        {!protectedView && view === "services" ? <Services notify={notify} type={serviceType} onTypeChange={setServiceType} user={auth.user} onAuth={() => requestAuthentication()} district={serviceDistrict} /> : null}
        {!protectedView && view === "people" ? <PeopleDirectory notify={notify} user={auth.user} query={peopleQuery} setQuery={setPeopleQuery} /> : null}
        {!protectedView && view === "feed" ? <CommunityFeed user={auth.user} notify={notify} /> : null}
        {!protectedView && view === "shop" ? <Marketplace query={marketplaceQuery} setQuery={setMarketplaceQuery} user={auth.user} onAuth={() => requestAuthentication()} notify={notify} /> : null}
        {view === "provider" && auth.user ? <ProviderDashboard user={auth.user} notify={notify} onOpenOrders={() => navigate("booking-requests")} /> : null}
        {view === "booking-requests" && auth.user ? <ProviderBookingRequestsPage user={auth.user} notify={notify} onBack={openDashboard} /> : null}
        {view === "traveler" && auth.user ? <TravelerDashboard user={auth.user} notify={notify} onOpenOrders={() => navigate("booking-requests")} /> : null}
        {view === "business" && auth.user ? <BusinessDashboard user={auth.user} notify={notify} onOpenOrders={() => navigate("booking-requests")} /> : null}
        {view === "business-catalog" && auth.user ? <BusinessCatalogPage user={auth.user} notify={notify} onBack={() => navigate("business")} /> : null}
        {view === "account-about" && auth.user ? <AccountAboutPage user={auth.user} notify={notify} onBack={openDashboard} /> : null}
        {view === "provider-ratings" && auth.user ? <TravelerRatingsPage user={auth.user} notify={notify} onBack={() => showView("traveler")} /> : null}
        {view === "message-profile" && auth.user && messageProfile ? <PublicPersonProfile person={messageProfile.person} user={auth.user} notify={notify} backLabel={lang === "bn" ? "মেসেজে ফিরে যান" : "Back to messages"} /* backLabel="Back to messages" */ onBack={() => { showView(messageProfile.returnView); setMessageProfile(null); setMessagesOpen(true); }} onFollowerChange={(change) => setMessageProfile((current) => ({ ...current, person: { ...current.person, follower_count: Math.max(0, (current.person.follower_count || 0) + change) } }))} /> : null}
        {view === "linked-profile" && linkedProfile && (auth.user || linkedProfileReadOnly) ? <PublicPersonProfile person={linkedProfile} user={auth.user} notify={notify} readOnly={linkedProfileReadOnly} backLabel={lang === "bn" ? "TourismuBD-তে ফিরে যান" : "Back to TourismuBD"} onBack={closeLinkedProfile} onFollowerChange={(change) => setLinkedProfile((current) => ({ ...current, follower_count: Math.max(0, (current.follower_count || 0) + change) }))} /> : null}
        <Footer />
      </>}
      {!bdMapOpen ? <BangladeshMapFloatingButton onOpen={() => setBdMapOpen(true)} /> : null}
      {bdMapOpen ? <BangladeshMapModal onClose={() => setBdMapOpen(false)} openPlace={openPlace} onOpenTrip={() => navigate("travel-map")} /> : null}
      {authOpen && supabase && !auth.user ? <AuthDialog onClose={() => { pendingAuthActionRef.current = null; setAuthOpen(false); }} notify={notify} onAuthenticated={authenticationComplete} /> : null}
      {deactivationOpen && auth.user ? <DeactivateAccountDialog onClose={() => setDeactivationOpen(false)} onConfirm={deactivateAccount} /> : null}
      {signOutOpen && auth.user ? <SignOutDialog onClose={() => setSignOutOpen(false)} onConfirm={signOut} /> : null}
      {messagesOpen && auth.user ? <MessageCenter user={auth.user} onClose={() => setMessagesOpen(false)} onOpenProfile={openMessageProfile} notify={notify} /> : null}
      <div className={toast ? "toast show" : "toast"} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
