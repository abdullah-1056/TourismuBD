import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
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
  ChevronRight,
  CircleUserRound,
  CircleParking,
  Clock3,
  Compass,
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
  suggestedPlacesForDistrict,
  waterListings,
} from "./data/tourism.js";
import { formatRoadRouteStatus, loadRoadRoute, resolveRouteWaypoints, ROUTE_OUTSIDE_BANGLADESH, routeStaysInsideBangladesh } from "./lib/road-map.js";
import { findNearbyPlaces, maxTripDaysForPlaceCount, planDailyRoute, planDistrictTour, planRoute } from "./lib/route.js";
import { loadSavedTrips, saveTrip } from "./lib/storage.js";
import { combineShopProducts, searchShopProducts } from "./lib/shop.js";
import { supabase } from "./lib/supabase.js";
import { usePublishedTourism } from "./lib/tourism-content.js";
import { viewRequiresAuthentication } from "./lib/access.js";

const NAV = [
  ["feed", "Timeline", MessageSquare],
  ["home", "Discover", Compass],
  ["explore", "Places", MapPin],
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
const PROFILE_FIELDS = "full_name,email,phone,phone_visible,avatar_url,profile_photo_urls,bio,district,blood_group,gender,present_address,permanent_address,working_place,hobby,phone_edit_count,email_edit_count,followers_visible";
const LEGACY_PROFILE_FIELDS = "full_name,email,phone,phone_visible,avatar_url";
const PUBLIC_PERSON_FIELDS = "id,full_name,role,avatar_url,profile_photo_urls,bio,district,email,phone,blood_group,gender,working_place,hobby,present_address,permanent_address,follower_count,followers_visible,rating_average,rating_count";
const fallbackImage = `${import.meta.env.BASE_URL}images/sylhet-waterway.png`;
const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL || (import.meta.env.DEV ? "http://127.0.0.1:5176" : "");
const PROFILE_DETAILS_DEFAULTS = { profile_photo_urls: [], bio: "", district: "", blood_group: "", gender: "", present_address: "", permanent_address: "", working_place: "", hobby: "", phone_edit_count: 0, email_edit_count: 0, followers_visible: true };
const PROFILE_DETAIL_FIELDS = [["District", "district"], ["Email", "email"], ["Phone number", "phone"], ["Blood group", "blood_group"], ["Gender", "gender"], ["Working place", "working_place"], ["Hobby", "hobby"], ["Present address", "present_address"], ["Permanent address", "permanent_address"]];
const RESTORABLE_VIEWS = new Set(["home", "feed", "explore", "trip", "services", "people", "shop", "provider", "booking-requests", "traveler", "business", "business-catalog", "account-about", "provider-ratings"]);
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
    notify(mode === "signin" ? "Signed in." : "Account created. Check your email if confirmation is required.");
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
        <button type="button" className="icon-button close" onClick={onClose} aria-label="Close"><X /></button>
        <p className="eyebrow">TourismuBD account</p>
        <h2 id="auth-title">{mode === "signin" ? "Welcome back" : "Create an account"}</h2>
        <div className="segmented auth-switch"><button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button></div>
        {mode === "signup" ? <><label>Full name<input name="fullName" required autoComplete="name" /></label><label>Account type<select value={accountKind} onChange={(event) => setAccountKind(event.target.value)}><option value="TRAVELER">Traveler</option><option value="PROVIDER">Provider</option><option value="BUSINESS">Business</option></select></label>{accountKind === "PROVIDER" ? <><label>Provider type<select value={providerRole} onChange={(event) => setProviderRole(event.target.value)}>{PROVIDER_ROLES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Phone number<input name="phone" required type="tel" inputMode="tel" placeholder="01XXXXXXXXX" pattern="(\\+880|0)1[3-9][0-9]{8}" /></label></> : accountKind === "BUSINESS" ? <><label>Business name<input name="businessName" required minLength="2" maxLength="120" placeholder="Your shop or brand name" /></label><label>District<input name="district" placeholder="Business district" /></label><label>Phone number<input name="phone" required type="tel" inputMode="tel" placeholder="01XXXXXXXXX" pattern="(\\+880|0)1[3-9][0-9]{8}" /></label></> : <label>Phone number<input name="phone" required type="tel" inputMode="tel" placeholder="01XXXXXXXXX" pattern="(\\+880|0)1[3-9][0-9]{8}" /></label>}</> : null}
        <label>Email<input name="email" required type="email" autoComplete="email" /></label>
        <label>Password<input name="password" required type="password" minLength="8" autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="button primary wide">{mode === "signin" ? "Sign in" : "Create account"}</button>
        {mode === "signin" ? <button type="button" className="button secondary wide google-button" onClick={google}>Continue with Google</button> : null}
      </form>
    </dialog>
  );
}

function DeactivateAccountDialog({ onClose, onConfirm }) {
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
      <button type="button" className="icon-button close" onClick={onClose} aria-label="Close"><X /></button>
      <p className="eyebrow">Account security</p>
      <h2 id="deactivate-title">Deactivate account</h2>
      <p>Your account will be permanently deleted after three months unless you sign in again.</p>
      <label>Password<input name="password" type="password" required autoComplete="current-password" autoFocus /></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button primary wide" disabled={submitting}>{submitting ? "Checking password..." : "Deactivate account"}</button>
      <button type="button" className="button secondary wide deactivation-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
    </form>
  </dialog>;
}

function SignOutDialog({ onClose, onConfirm }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.open && dialog.close();
  }, []);

  return <dialog ref={dialogRef} className="provider-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal signout-modal" onMouseDown={(event) => event.stopPropagation()} aria-labelledby="signout-title">
      <button type="button" className="icon-button close" onClick={onClose} aria-label="Close"><X /></button>
      <p className="eyebrow">Account</p>
      <h2 id="signout-title">Sign out?</h2>
      <p>You will need to sign in again to manage your account.</p>
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>No</button><button type="button" className="button primary" onClick={onConfirm}>Yes, sign out</button></div>
    </section>
  </dialog>;
}

function ProfileDetailsForm({ user, profile, provider, notify, onSaved }) {
  const save = async (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const email = values.get("email").trim();
    const phone = values.get("phone").trim();
    const providerName = values.get("providerName")?.trim();
    const providerServiceName = values.get("providerServiceName")?.trim();
    if (!email || !phone) return notify("Email and phone number are required.");
    if (provider && (!providerName || providerName.length < 2)) return notify("Add a provider name with at least two characters.");
    const emailChanged = email !== (profile.email || user.email || "");
    const phoneChanged = phone !== (profile.phone || "");
    if (emailChanged && profile.email_edit_count >= 3) return notify("Email can only be changed three times.");
    if (phoneChanged && profile.phone_edit_count >= 3) return notify("Phone number can only be changed three times.");
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
    notify("Profile details saved.");
  };

  return <form className="profile-editor" onSubmit={save}>
    <h2>About</h2>
    {provider ? <><label>Provider name<input name="providerName" required minLength="2" maxLength="120" defaultValue={profile.full_name || ""} placeholder="Your name or provider identity" /></label><label>Service name<input name="providerServiceName" minLength="2" maxLength="120" defaultValue={provider.service_name || ""} placeholder="Hotel, guide service, transport company, or agency" /></label></> : null}
    <label>Email<input name="email" required type="email" defaultValue={profile.email || user.email || ""} /></label>
    <label>Phone number<input name="phone" required type="tel" inputMode="tel" pattern="(\\+880|0)1[3-9][0-9]{8}" defaultValue={profile.phone || ""} placeholder="01XXXXXXXXX" /></label>
    <label className="profile-editor-wide">Bio<textarea name="bio" rows="4" defaultValue={profile.bio || ""} placeholder="Tell travelers a little about yourself." /></label>
    <label>Blood group<select name="blood_group" defaultValue={profile.blood_group || ""}><option value="">Not added</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => <option key={group}>{group}</option>)}</select></label>
    <label>Gender<select name="gender" defaultValue={profile.gender || ""}><option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Non-binary</option></select></label>
    <label>District<select name="district" defaultValue={profile.district || ""}><option value="">Not added</option>{districts.map((item) => <option key={item.slug} value={item.name}>{item.name}</option>)}</select></label>
    <label>Working place (company)<input name="working_place" defaultValue={profile.working_place || ""} placeholder="Company or organization" /></label>
    <label>Hobby<input name="hobby" defaultValue={profile.hobby || ""} placeholder="Photography, hiking, etc." /></label>
    <label className="profile-editor-wide">Present address<textarea name="present_address" rows="3" defaultValue={profile.present_address || ""} /></label>
    <label className="profile-editor-wide">Permanent address<textarea name="permanent_address" rows="3" defaultValue={profile.permanent_address || ""} /></label>
    <label className="profile-editor-wide check-label"><input name="followers_visible" type="checkbox" defaultChecked={profile.followers_visible !== false} />Show my follower total on my public profile</label>
    <button className="button primary profile-editor-wide">Save profile</button>
  </form>;
}

function ProfileBio({ profile, fallback }) {
  const details = PROFILE_DETAIL_FIELDS.map(([label, field]) => [label, profile[field]]).filter(([, value]) => value);
  return <div className="profile-bio">
    <p>{profile.bio || fallback}</p>
    <details>
      <summary>See more...</summary>
      {details.length ? <dl>{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p className="profile-bio-empty">No profile details added yet.</p>}
    </details>
  </div>;
}

function PublicProfileDetails({ profile }) {
  const details = PROFILE_DETAIL_FIELDS.map(([label, field]) => [label, profile[field]]).filter(([, value]) => value);
  const ratingCount = Number(profile.rating_count);
  const ratingAverage = Number(profile.rating_average);
  const hasRatingData = Number.isFinite(ratingCount);
  if (!details.length && !hasRatingData) return null;
  return <details className="public-profile-details"><summary>See more...</summary><dl>{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}{hasRatingData ? <div className="provider-rating"><dt>Provider rating</dt><dd><Star aria-hidden="true" /><b>{ratingCount ? ratingAverage.toFixed(1) : "No ratings yet"}</b>{ratingCount ? <span>{ratingCount} {ratingCount === 1 ? "rating" : "ratings"}</span> : null}</dd></div> : null}</dl></details>;
}

function ProviderRating({ profile, className = "", isProvider = true }) {
  const ratingCount = Number(profile.rating_count);
  const ratingAverage = Number(profile.rating_average);
  if (!isProvider || !Number.isFinite(ratingCount)) return null;
  return <p className={`provider-rating-summary ${className}`}><Star aria-hidden="true" /><b>{ratingCount ? ratingAverage.toFixed(1) : "No ratings yet"}</b>{ratingCount ? <span>{ratingCount} {ratingCount === 1 ? "rating" : "ratings"}</span> : null}</p>;
}

function FollowerCount({ count = 0 }) {
  return <p className="follower-count"><UsersRound />{count} {count === 1 ? "follower" : "followers"}</p>;
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

  return <button type="button" className={following ? "button secondary follow-button" : "button primary follow-button"} onClick={toggle} disabled={loading}>{following ? <UserCheck /> : <UserPlus />}{loading ? "Loading" : following ? "Following" : "Follow"}</button>;
}

function PostComposer({ user, notify, onPublished, businessPost = false }) {
  const [body, setBody] = useState("");
  const [productName, setProductName] = useState("");
  const [media, setMedia] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [showLocationName, setShowLocationName] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [posting, setPosting] = useState(false);
  const locationSuggestions = locationName.trim() ? places.filter((place) => [place.name, ...(place.aliases || []), place.area, place.district].some((value) => value.toLowerCase().split(/\s+/).some((word) => word.startsWith(locationName.trim().toLowerCase())))) : [];

  const addLocation = () => setShowLocationName(true);

  const publish = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const text = body.trim();
    const name = productName.trim();
    if (businessPost && name.length < 2) return notify("Add a product name before publishing.");
    if (!text || !media) return notify("Add text and one picture or video to publish.");
    const isImage = ["image/jpeg", "image/png", "image/webp"].includes(media.type);
    const isVideo = ["video/mp4", "video/webm", "video/quicktime"].includes(media.type);
    if ((!isImage && !isVideo) || media.size > (isImage ? 10 : 100) * 1024 * 1024) return notify(isImage ? "Pictures must be JPG, PNG, or WebP up to 10 MB." : "Videos must be MP4, WebM, or MOV up to 100 MB.");
    setPosting(true);
    try {
      const audienceSetting = await supabase.from("profiles").select("post_audience").eq("id", user.id).single();
      if (audienceSetting.error) return notify("Run 023_post_audience.sql in Supabase before publishing posts.");
      let duration = null;
      if (isVideo) {
        duration = await getVideoDuration(media);
        if (duration < 30 || duration > 300) return notify("Videos must be 30-60 seconds or 1-5 minutes long.");
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
      notify("Post published.");
      onPublished?.();
    } catch (error) {
      notify(error?.message || "Post could not be published. Check your connection and try again.");
    } finally {
      setPosting(false);
    }
  };

  return <form className="post-composer" onSubmit={publish}>
    <div><p className="eyebrow">Share an update</p><h2>Post for the TourismuBD community.</h2></div>
    {businessPost ? <label className="post-product-field">Product name<input value={productName} onChange={(event) => setProductName(event.target.value)} required minLength="2" maxLength="140" placeholder="Name the product in this post" /></label> : null}
    <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength="2000" rows="4" placeholder="Write about your travel experience..." />
    <div className="post-composer-actions"><div className="post-composer-tools"><label className="post-file"><Camera /><span>{media ? media.name : "Add picture or video"}</span><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" onChange={(event) => setMedia(event.target.files?.[0] || null)} /></label><button type="button" className="button secondary post-location-button" onClick={addLocation}><MapPin />{locationName ? "Location added" : "Add location"}</button></div><button className="button primary" disabled={posting}><Send />{posting ? "Publishing" : "Publish"}</button></div>
    {showLocationName ? <div className="post-location-name"><MapPin /><input value={locationName} onChange={(event) => { setLocationName(event.target.value); setLocation(null); }} onFocus={() => setLocationFocused(true)} onBlur={() => window.setTimeout(() => setLocationFocused(false), 120)} maxLength="120" placeholder="Type a location name" aria-label="Location name" />{locationFocused && locationSuggestions.length ? <div className="post-location-suggestions" role="listbox">{locationSuggestions.map((place) => <button type="button" key={place.id} onMouseDown={(event) => event.preventDefault()} onClick={() => { setLocationName(place.name); setLocation({ latitude: place.coordinates.lat, longitude: place.coordinates.lng, accuracy: null }); setLocationFocused(false); }}><b>{place.name}</b><small>{place.area}, {place.district}</small></button>)}</div> : null}</div> : null}
    <p className="form-note">Pictures need text. Videos: 30-60 seconds or 1-5 minutes.</p>
  </form>;
}

function PostPublisher({ user, notify, onPublished, businessPost = false }) {
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open) dialog.showModal();
    return () => dialog?.open && dialog.close();
  }, [open]);

  return <>
    <button type="button" className="button primary create-post-button" onClick={() => setOpen(true)}><Send />Create post</button>
    {open ? <dialog ref={dialogRef} className="provider-dialog post-dialog" onCancel={(event) => { event.preventDefault(); close(); }} onMouseDown={(event) => event.target === event.currentTarget && close()}><section className="post-composer-modal" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="icon-button close" onClick={close} aria-label="Close post editor"><X /></button><PostComposer user={user} notify={notify} businessPost={businessPost} onPublished={() => { close(); onPublished?.(); }} /></section></dialog> : null}
  </>;
}

async function addPostEngagement(posts) {
  if (!posts.length) return posts;
  const { data, error } = await supabase.from("social_post_engagement").select("post_id,like_count,comment_count,liked_by_me").in("post_id", posts.map((post) => post.id));
  if (error) return posts.map((post) => ({ ...post, like_count: 0, comment_count: 0, liked_by_me: false }));
  const engagement = Object.fromEntries((data || []).map((item) => [item.post_id, item]));
  return posts.map((post) => ({ ...post, like_count: engagement[post.id]?.like_count || 0, comment_count: engagement[post.id]?.comment_count || 0, liked_by_me: Boolean(engagement[post.id]?.liked_by_me) }));
}

function PostReportDialog({ post, onClose, onSubmit, saving }) {
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
      <button type="button" className="icon-button close" onClick={onClose} aria-label="Close report form"><X /></button>
      <p className="eyebrow">Report timeline update</p>
      <h2>What is your objection?</h2>
      <p>Select every reason that applies, then explain why this post should be reviewed. Your report is sent privately to TourismuBD Admin.</p>
      <fieldset className="post-report-reasons"><legend>Report reasons</legend><div>{POST_REPORT_REASONS.map((reason) => <label key={reason}><input type="checkbox" checked={reasons.includes(reason)} onChange={() => toggleReason(reason)} />{reason}</label>)}</div></fieldset>
      <label>Objection details<textarea value={details} onChange={(event) => setDetails(event.target.value)} minLength="10" maxLength="2000" rows="6" placeholder="Write the reason for your report..." aria-label="Objection details" required autoFocus /></label>
      <p className="post-report-requirements">{reasons.length ? `${reasons.length} reason${reasons.length === 1 ? "" : "s"} selected.` : "Select at least one reason."} Write at least 10 characters ({Math.min(objectionLength, 10)}/10).</p>
      <div className="post-report-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={saving || !reasons.length || objectionLength < 10}><Flag />{saving ? "Submitting..." : "Submit report"}</button></div>
      <small>Reporting a post by {post.author.full_name || "this member"}.</small>
    </form>
  </dialog>;
}

function PostCard({ post, user, notify, onUpdated, onDeleted }) {
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
  const locationText = post.location_name || "View post location";
  const engagementError = (error) => notify(/social_post_(likes|comments)/.test(error.message) ? "Run 055_social_post_engagement.sql in Supabase first." : error.message);

  const saveEdit = async (event) => {
    event.preventDefault();
    const nextBody = body.trim();
    if (!nextBody) return notify("An update needs text.");
    const nextName = productName.trim();
    if (post.product_name && nextName.length < 2) return notify("Add a product name before saving.");
    const { data, error } = await supabase.from("social_posts").update({ body: nextBody, ...(post.product_name ? { product_name: nextName } : {}) }).eq("id", post.id).select(post.product_name ? "body,product_name" : "body").single();
    if (error) return notify(error.message);
    onUpdated?.({ ...post, body: data.body, product_name: data.product_name });
    setEditing(false);
    setMenuOpen(false);
    notify("Timeline update edited.");
  };
  const deletePost = async () => {
    if (!window.confirm("Delete this timeline update?")) return;
    const { error } = await supabase.from("social_posts").delete().eq("id", post.id);
    if (error) return notify(error.message);
    await supabase.storage.from("social-posts").remove([post.media_path]);
    onDeleted?.(post.id);
    notify("Timeline update deleted.");
  };
  const reportPost = async ({ details, reasons }) => {
    const objection = details.trim();
    if (!reasons.length) { notify("Select at least one reason for this report."); return false; }
    if (objection.length < 10) { notify("Write at least 10 characters explaining your objection."); return false; }
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
    if (error) { notify(error.code === "23505" ? "You already reported this update." : error.message); return false; }
    setHiddenSocialPost(post.id, true);
    setMenuOpen(false);
    notify(updated ? "Your existing report was updated." : "Timeline update reported.");
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
    const shareData = { title: "TourismuBD post", text: `${post.author.full_name || "TourismuBD member"}: ${post.body}`, url: window.location.origin };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        notify("Post copied. You can share it anywhere.");
      }
    } catch (error) {
      if (error.name !== "AbortError") notify("This post could not be shared.");
    }
  };

  return <><article className="community-post">
    <div className="post-card-head"><div className="post-author"><span>{post.author.avatar_url ? <img src={post.author.avatar_url} alt="" /> : <CircleUserRound />}</span><div><b>{post.author.full_name || "TourismuBD member"}</b><small>{PROVIDER_TYPE_LABELS[post.author.role] || "Traveler"} · {new Date(post.created_at).toLocaleDateString()}</small></div></div>{user ? <div className="post-menu"><button type="button" className="icon-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Timeline options" aria-expanded={menuOpen}><MoreHorizontal /></button>{menuOpen ? <div className="post-menu-popover" role="menu">{isOwner ? <><button type="button" onClick={() => { setEditing(true); setMenuOpen(false); }}><Pencil />Edit</button><button type="button" className="danger" onClick={deletePost}><Trash2 />Delete</button></> : <button type="button" onClick={() => { setMenuOpen(false); setReportOpen(true); }}><Flag />Report</button>}</div> : null}</div> : null}</div>
    {editing ? <form className="post-edit" onSubmit={saveEdit}>{post.product_name ? <label className="post-product-field">Product name<input value={productName} onChange={(event) => setProductName(event.target.value)} required minLength="2" maxLength="140" /></label> : null}<textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength="2000" /><div><button type="button" className="button secondary" onClick={() => { setBody(post.body); setProductName(post.product_name || ""); setEditing(false); }}>Cancel</button><button className="button primary">Save</button></div></form> : <>{post.product_name ? <h3 className="post-product-title">{post.product_name}</h3> : null}<p>{post.body}</p></>}
    {locationUrl ? <a className="post-location" href={locationUrl} target="_blank" rel="noreferrer"><MapPin />{locationText}</a> : post.location_name ? <span className="post-location"><MapPin />{locationText}</span> : null}
    {post.media_type === "VIDEO" ? <video controls preload="metadata" src={post.media_url} /> : <img src={post.media_url} alt="Post attachment" />}
    <div className="post-actions"><button type="button" className={liked ? "active" : ""} onClick={toggleLike} disabled={savingReaction} aria-label={liked ? "Unlike post" : "Like post"} aria-pressed={liked} title={liked ? "Unlike" : "Like"}><Heart />{likeCount ? <span>{likeCount}</span> : null}</button><button type="button" onClick={toggleComments} aria-label="Comments" aria-expanded={commentsOpen} title="Comments"><MessageCircle />{commentCount ? <span>{commentCount}</span> : null}</button><button type="button" onClick={sharePost} aria-label="Share post" title="Share"><Share2 /></button></div>
    {commentsOpen ? <section className="post-comments" aria-label="Post comments">{commentsLoading ? <p className="people-note">Loading comments...</p> : null}{!commentsLoading && !comments.length ? <p className="people-note">No comments yet.</p> : null}<div className="post-comment-list">{comments.map((comment) => <article className="post-comment" key={comment.id}><span>{comment.author?.avatar_url ? <img src={comment.author.avatar_url} alt="" /> : <CircleUserRound />}</span><div><b>{comment.author?.full_name || "TourismuBD member"}</b><small>{new Date(comment.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small><p>{comment.body}</p></div></article>)}</div><form className="post-comment-form" onSubmit={addComment}><textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} maxLength="1000" rows="2" placeholder="Write a comment" aria-label="Write a comment" /><button className="button primary" disabled={!commentBody.trim() || savingComment}><Send />{savingComment ? "Posting" : "Post"}</button></form></section> : null}
  </article>{reportOpen ? <PostReportDialog post={post} saving={savingReport} onClose={() => setReportOpen(false)} onSubmit={reportPost} /> : null}</>;
}

function DashboardPosts({ user, authorId = user?.id, profile, provider, refreshKey, title = "My timeline", notify }) {
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
  return <section className="dashboard-posts"><h2>{title}</h2>{state.loading ? <p className="people-note">Loading timeline...</p> : null}{state.error ? <p className="form-error">{state.error}</p> : null}{!state.loading && !state.error && !state.posts.length ? <p className="people-note">{title === "My timeline" ? "You have not published an update yet." : "No timeline updates are available for you."}</p> : null}<div className="post-feed">{state.posts.map((post) => <PostCard key={post.id} post={post} user={user} notify={notify} onUpdated={updatePost} onDeleted={removePost} />)}</div></section>;
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

  return <main className="page-shell page-top feed-page">
    <div className="page-title"><p className="eyebrow">Community timeline</p></div>
    {state.loading ? <p className="people-note">Loading posts...</p> : null}
    {state.error ? <p className="people-note">{state.error}</p> : null}
    {!state.loading && !state.error && !state.posts.length ? <p className="people-note">No timeline updates are available yet.</p> : null}
    <div className="post-feed">{state.posts.map((post) => <PostCard key={post.id} post={post} user={user} notify={notify} onUpdated={(nextPost) => setState((current) => ({ ...current, posts: current.posts.map((post) => post.id === nextPost.id ? nextPost : post) }))} onDeleted={(postId) => setState((current) => ({ ...current, posts: current.posts.filter((post) => post.id !== postId) }))} />)}</div>
  </main>;
}

function ProfilePhotoEditorDialog({ user, profile, provider, notify, onSaved, onClose }) {
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
    if (!image?.size || !["image/jpeg", "image/png", "image/webp"].includes(image.type) || image.size > 5 * 1024 * 1024) return setError("Use a JPG, PNG, or WebP image up to 5 MB.");
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
    notify("Profile picture saved.");
    onClose();
  };

  return <dialog ref={dialogRef} className="provider-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="modal profile-photo-editor" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} aria-labelledby="profile-photo-title">
      <button type="button" className="icon-button close" onClick={onClose} aria-label="Close"><X /></button>
      <p className="eyebrow">Profile</p>
      <h2 id="profile-photo-title">Profile picture</h2>
      <label>Choose image<input name="profilePhoto" type="file" required accept="image/jpeg,image/png,image/webp" /></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button primary wide" disabled={submitting}>{submitting ? "Uploading..." : "Save picture"}</button>
    </form>
  </dialog>;
}

function ProfileAvatar({ user, profile, provider, notify, onSaved }) {
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
  const alt = `${profile.full_name || "Account"} profile`;
  return <>
    <span className="dashboard-avatar-wrap">{avatarUrl ? <button type="button" className="dashboard-avatar" onClick={() => setOpen(true)} aria-label="View profile picture"><img src={avatarUrl} alt={alt} /></button> : <span className="dashboard-avatar"><CircleUserRound /></span>}<button type="button" className="profile-photo-edit" onClick={() => setEditing(true)} aria-label="Change profile picture" title="Change profile picture"><Camera /></button></span>
    {open ? <dialog ref={dialogRef} className="profile-photo-dialog" onCancel={(event) => { event.preventDefault(); close(); }} onMouseDown={(event) => event.target === event.currentTarget && close()}><button type="button" className="profile-photo-full" onClick={close} aria-label="Close profile picture"><img src={avatarUrl} alt={alt} /></button></dialog> : null}
    {editing ? <ProfilePhotoEditorDialog user={user} profile={profile} provider={provider} notify={notify} onSaved={onSaved} onClose={() => setEditing(false)} /> : null}
  </>;
}

function ProfilePhotoGallery({ user, profile, provider, notify, onSaved }) {
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
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type) || image.size > 5 * 1024 * 1024) return notify("Use a JPG, PNG, or WebP image up to 5 MB.");
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
    notify("Profile picture saved.");
  };

  const deletePhoto = async (slot) => {
    const photo = photos[slot];
    if (!photo || !window.confirm("Delete this profile picture permanently?")) return;
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
      if (storageError) { setDeleting(-1); onSaved(data); return notify("Picture removed from your profile, but storage cleanup failed."); }
    }
    setDeleting(-1);
    if (selectedPhoto === photo) setSelectedPhoto(null);
    onSaved(data);
    notify("Profile picture deleted.");
  };

  return <><section className="profile-picture-gallery" aria-label="Profile pictures"><div className="profile-picture-slots">{Array.from({ length: 7 }, (_, slot) => <div className="profile-picture-slot" key={slot}>{photos[slot] ? <><button type="button" className="profile-picture-preview" onClick={() => setSelectedPhoto(photos[slot])} aria-label={`View profile picture ${slot + 1}`}><img src={photos[slot]} alt={`Profile picture ${slot + 1}`} /></button><label className="profile-picture-upload-icon" title="Replace picture"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event, slot)} disabled={uploading === slot || deleting === slot} /><Camera /></label><button type="button" className="profile-picture-delete" onClick={() => deletePhoto(slot)} disabled={deleting === slot} aria-label={`Delete profile picture ${slot + 1}`} title="Delete picture"><Trash2 /></button></> : <label className="profile-picture-empty"><Camera /><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event, slot)} disabled={uploading === slot} /></label>}</div>)}</div></section>{selectedPhoto ? <dialog ref={dialogRef} className="profile-photo-dialog" onCancel={(event) => { event.preventDefault(); setSelectedPhoto(null); }} onMouseDown={(event) => event.target === event.currentTarget && setSelectedPhoto(null)}><button type="button" className="profile-photo-full" onClick={() => setSelectedPhoto(null)} aria-label="Close profile picture"><img src={selectedPhoto} alt="Profile picture" /></button></dialog> : null}</>;
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

  return <div className="owner-menu-audience"><span>Post audience</span><div role="group" aria-label="Post audience"><button type="button" className={audience === "PUBLIC" ? "active" : ""} onClick={() => selectAudience("PUBLIC")} disabled={saving}>Public</button><button type="button" className={audience === "FOLLOWERS" ? "active" : ""} onClick={() => selectAudience("FOLLOWERS")} disabled={saving}>Followers</button></div></div>;
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

  return <>
    <button type="button" className={`icon-button owner-menu-trigger ${className}`} onClick={() => setOpen(true)} aria-label={pendingMenuCount ? `Open account menu, ${pendingMenuCount} ${pendingMenuLabel} pending` : "Open account menu"} aria-expanded={open} title="Open account menu"><Menu />{pendingMenuCount ? <span className="owner-menu-trigger-badge">{pendingMenuCount > 9 ? "9+" : pendingMenuCount}</span> : null}</button>
    {open ? <><button type="button" className="owner-menu-backdrop" onClick={() => setOpen(false)} aria-label="Close account menu" /><aside className="owner-menu" role="dialog" aria-modal="true" aria-label="Account menu">
      <div className="owner-menu-head"><b>Account menu</b><button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close account menu" title="Close account menu"><X /></button></div>
      <button type="button" className="owner-menu-settings" onClick={() => setSettingsOpen((visible) => !visible)} aria-expanded={settingsOpen}><Settings />Settings<ChevronRight /></button>
      {settingsOpen ? <div className="owner-menu-settings-content"><button type="button" className="owner-menu-about" onClick={() => { setOpen(false); onOpenAbout(); }}><CircleUserRound />About<ChevronRight /></button>{isTraveler ? <><button type="button" className="owner-menu-about owner-menu-rating-option" onClick={() => { setOpen(false); onOpenRatings(); }} aria-label={pendingRatings ? `Rate providers, ${pendingRatings} pending` : "Rate providers"}><Star />Rate providers{pendingRatings ? <span className="owner-menu-rating-count">{pendingRatings > 9 ? "9+" : pendingRatings}</span> : null}<ChevronRight /></button><button type="button" className="owner-menu-about" onClick={() => setPostsOpen((visible) => !visible)} aria-expanded={postsOpen}><Send />Timeline<ChevronRight /></button>{postsOpen ? <PostAudienceSettings user={user} notify={notify} /> : null}</> : isProvider ? <button type="button" className="owner-menu-about owner-menu-booking-option" onClick={() => { setOpen(false); onOpenBookings(); }} aria-label={pendingBookings ? `Booking requests, ${pendingBookings} pending` : "Booking requests"}><CalendarDays />Booking requests{pendingBookings ? <span className="owner-menu-booking-count">{pendingBookings > 9 ? "9+" : pendingBookings}</span> : null}<ChevronRight /></button> : null}<div className="owner-menu-theme"><span>Theme</span><div role="group" aria-label="Color theme"><button type="button" className={theme === "light" ? "active" : ""} onClick={() => onThemeChange("light")} aria-pressed={theme === "light"}><Sun />Light</button><button type="button" className={theme === "dark" ? "active" : ""} onClick={() => onThemeChange("dark")} aria-pressed={theme === "dark"}><Moon />Dark</button></div></div></div> : null}
      {isBusiness ? <button type="button" className="owner-menu-about" onClick={() => { setOpen(false); onOpenBusinessCatalog(); }}><Store />Manage shop<ChevronRight /></button> : null}
      <button type="button" className="owner-menu-about" onClick={() => { setOpen(false); onOpenMessages(); }}><MessageSquare />Messages<ChevronRight /></button>
      <button type="button" className="owner-menu-deactivate" onClick={() => { setOpen(false); onDeactivate(); }}>Deactivate account<UserRoundX /></button>
      <button type="button" className="owner-menu-signout" onClick={() => { setOpen(false); onSignOut(); }}>Sign out<LogOut /></button>
    </aside></> : null}
  </>;
}

function ProviderDashboard({ user, notify }) {
  const [state, setState] = useState({ loading: true, profile: null, provider: null, rating: null, error: "", detailsAvailable: true });
  const [postVersion, setPostVersion] = useState(0);

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

  if (state.loading) return <main className="page-shell page-top provider-dashboard"><p>Loading your provider account...</p></main>;
  if (state.error) return <main className="page-shell page-top provider-dashboard"><p className="form-error">{state.error}</p></main>;

  const { profile, provider, rating } = state;
  return <main className="page-shell page-top provider-dashboard">
    <div className="page-title dashboard-title"><ProfileAvatar user={user} profile={profile || {}} provider={provider} notify={notify} onSaved={(nextProfile) => setState((current) => ({ ...current, profile: nextProfile }))} /><div><p className="eyebrow">Hello,</p><h1 className="dashboard-greeting">{profile?.full_name || provider?.display_name || "provider"}</h1><ProviderRating profile={rating || {}} /><ProfileBio profile={{ ...profile, bio: profile?.bio || provider?.bio }} fallback="Add your bio below." /><DashboardFollowerCount userId={user.id} /></div><div className="dashboard-post-action"><PostPublisher user={user} notify={notify} onPublished={() => setPostVersion((version) => version + 1)} /></div></div>
    {provider ? <section className="provider-dashboard-panel" aria-label="Provider account details">
      <div><span>Provider type</span><b>{PROVIDER_TYPE_LABELS[profile?.role] || provider.type}</b></div>
      <div><span>Service name</span><b>{provider.service_name || "Not added"}</b></div>
    </section> : <p className="form-error">Your provider setup is incomplete. Run the provider migration once, then reopen this page.</p>}
    {profile ? <ProfilePhotoGallery user={user} profile={profile} provider={provider} notify={notify} onSaved={(nextProfile) => setState((current) => ({ ...current, profile: nextProfile }))} /> : null}
    {profile ? <DashboardPosts user={user} profile={profile} provider={provider} refreshKey={postVersion} notify={notify} /> : null}
  </main>;
}

function ProviderBookingRequestsPage({ user, notify, onBack }) {
  const [state, setState] = useState({ loading: true, provider: null, error: "" });

  useEffect(() => {
    let active = true;
    supabase.from("providers").select("id").eq("user_id", user.id).maybeSingle().then(({ data, error }) => {
      if (active) setState({ loading: false, provider: data, error: error?.message || "" });
    });
    return () => { active = false; };
  }, [user.id]);

  if (state.loading) return <main className="page-shell page-top"><p>Loading booking requests...</p></main>;
  if (state.error) return <main className="page-shell page-top"><p className="form-error">{state.error}</p></main>;
  if (!state.provider) return <main className="page-shell page-top"><p className="form-error">A provider account is required to view booking requests.</p></main>;
  return <main className="page-shell page-top provider-booking-requests-page"><button type="button" className="back-button" onClick={onBack}><ArrowLeft />Back to account</button><ProviderBookings provider={state.provider} notify={notify} /></main>;
}

function ProviderBookings({ provider, notify }) {
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
    notify(status === "CONFIRMED" ? "Booking confirmed." : status === "CANCELLED" ? "Booking cancelled." : "Booking marked completed.");
    return true;
  };

  return <section className="provider-bookings" aria-labelledby="provider-bookings-title">
    <div className="provider-bookings-heading"><div><p className="eyebrow">Booking requests</p><h2 id="provider-bookings-title">Your service requests</h2></div></div>
    {state.loading ? <p className="form-note">Loading booking requests...</p> : null}
    {state.error ? <p className="form-error">{state.error}</p> : null}
    {!state.loading && !state.error && !state.bookings.length ? <p className="booking-empty">New traveler booking requests will appear here.</p> : null}
    <div className="booking-list">{state.bookings.map((booking) => <article className="booking-card" key={booking.id}>
      <div><p className="eyebrow">{SERVICE_META[booking.service_type]?.label || booking.service_type}</p><div className="booking-requester"><span>{booking.traveler_avatar_url ? <img src={booking.traveler_avatar_url} alt="" /> : <CircleUserRound />}</span><h3>{booking.traveler_name}</h3></div><p>{new Date(`${booking.start_date}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · {booking.duration_days} {booking.duration_days === 1 ? "day" : "days"} · {booking.traveler_count} {booking.traveler_count === 1 ? "traveler" : "travelers"}</p></div>
      <div className="booking-card-action"><span className={`booking-status ${booking.status.toLowerCase()}`}>{booking.status.toLowerCase()}</span>{booking.status === "PENDING" ? <button type="button" className="button primary" onClick={() => updateStatus(booking, "CONFIRMED")} disabled={updatingId === booking.id}>{updatingId === booking.id ? "Confirming..." : "Confirm booking"}</button> : null}{booking.status === "CONFIRMED" ? <button type="button" className="button primary" onClick={() => updateStatus(booking, "COMPLETED")} disabled={updatingId === booking.id}>{updatingId === booking.id ? "Updating..." : "Mark completed"}</button> : null}{["PENDING", "CONFIRMED"].includes(booking.status) ? <button type="button" className="button secondary booking-cancel" onClick={() => setCancellingBooking(booking)} disabled={updatingId === booking.id}>Cancel booking</button> : null}</div>
    </article>)}</div>
    {cancellingBooking ? <CancelBookingDialog booking={cancellingBooking} onClose={() => setCancellingBooking(null)} onConfirm={() => updateStatus(cancellingBooking, "CANCELLED")} /> : null}
  </section>;
}

function CancelBookingDialog({ booking, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.open && dialog.close();
  }, []);

  const cancelBooking = async (event) => {
    event.preventDefault();
    setCancelling(true);
    if (await onConfirm()) onClose();
    else setCancelling(false);
  };

  return <dialog ref={dialogRef} className="provider-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="modal booking-cancel-modal" onSubmit={cancelBooking} onMouseDown={(event) => event.stopPropagation()} aria-labelledby="cancel-booking-title">
      <button type="button" className="icon-button close" onClick={onClose} aria-label="Close"><X /></button>
      <p className="eyebrow">Cancel booking</p>
      <h2 id="cancel-booking-title">Cancel {booking.traveler_name}'s request?</h2>
      <p>The traveler will receive a cancellation notification.</p>
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Keep booking</button><button className="button booking-cancel-confirm" disabled={cancelling}>{cancelling ? "Cancelling..." : "Cancel request"}</button></div>
    </form>
  </dialog>;
}

function TravelerDashboard({ user, notify }) {
  const [state, setState] = useState({ loading: true, profile: null, error: "", detailsAvailable: true });
  const [tripCount] = useState(() => loadSavedTrips(user.id).length);
  const [postVersion, setPostVersion] = useState(0);
  const fallbackProfile = { full_name: user.user_metadata?.full_name || "", email: user.email, phone: user.user_metadata?.phone || "", phone_visible: false, ...PROFILE_DETAILS_DEFAULTS };

  useEffect(() => {
    let active = true;
    loadProfile(user.id).then(({ data, detailsAvailable }) => {
      if (active) setState({ loading: false, profile: data || fallbackProfile, error: "", detailsAvailable });
    });
    return () => { active = false; };
  }, [user.id]);

  if (state.loading) return <main className="page-shell page-top traveler-dashboard"><p>Loading your traveler account...</p></main>;
  const { profile } = state;
  return <main className="page-shell page-top traveler-dashboard">
    <div className="page-title dashboard-title"><ProfileAvatar user={user} profile={profile} notify={notify} onSaved={(nextProfile) => setState((current) => ({ ...current, profile: nextProfile }))} /><div><p className="eyebrow">Hello,</p><h1 className="dashboard-greeting">{profile.full_name || "traveler"}</h1><ProfileBio profile={profile} fallback="Your TourismuBD account and saved trip plans." /><DashboardFollowerCount userId={user.id} /></div><div className="dashboard-post-action"><PostPublisher user={user} notify={notify} onPublished={() => setPostVersion((version) => version + 1)} /></div></div>
    <section className="provider-dashboard-panel" aria-label="Traveler account details">
      <div><span>Saved itineraries</span><b>{tripCount}</b></div>
    </section>
    <ProfilePhotoGallery user={user} profile={profile} notify={notify} onSaved={(nextProfile) => setState((current) => ({ ...current, profile: nextProfile }))} />
    <DashboardPosts user={user} profile={profile} refreshKey={postVersion} notify={notify} />
  </main>;
}

function BusinessDashboard({ user, notify }) {
  const [state, setState] = useState({ loading: true, profile: null, business: null, error: "" });
  const [postVersion, setPostVersion] = useState(0);
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

  if (state.loading) return <main className="page-shell page-top provider-dashboard"><p>Loading your business account...</p></main>;
  if (state.error) return <main className="page-shell page-top provider-dashboard"><p className="form-error">{state.error}</p></main>;

  const { profile, business } = state;
  return <main className="page-shell page-top provider-dashboard business-profile-dashboard">
    <div className="page-title dashboard-title"><ProfileAvatar user={user} profile={profile} notify={notify} onSaved={(nextProfile) => setState((current) => ({ ...current, profile: nextProfile }))} /><div><p className="eyebrow">Hello,</p><h1 className="dashboard-greeting">{profile.full_name || "business owner"}</h1><ProfileBio profile={profile} fallback="Add your bio in account settings." /><DashboardFollowerCount userId={user.id} /></div><div className="dashboard-post-action"><PostPublisher user={user} notify={notify} businessPost onPublished={() => setPostVersion((version) => version + 1)} /></div></div>
    <section className="provider-dashboard-panel" aria-label="Business account details"><div><span>Business</span><b>{business?.business_name || "Business account"}</b></div></section>
    <ProfilePhotoGallery user={user} profile={profile} notify={notify} onSaved={(nextProfile) => setState((current) => ({ ...current, profile: nextProfile }))} />
    <DashboardPosts user={user} profile={profile} refreshKey={postVersion} notify={notify} />
  </main>;
}

function BusinessCatalogPage({ user, notify, onBack }) {
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
    if (error || !data) return notify(error?.message || "The business details could not be updated.");
    notify("Business details saved.");
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
    notify(editingProduct ? "Product updated." : "Product published in the Shop.");
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
    notify(status === "PUBLISHED" ? "Product published." : "Product hidden from the Shop.");
    setRefreshKey((value) => value + 1);
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    const { error } = await supabase.from("business_products").delete().eq("id", product.id);
    if (error) return notify(error.message);
    notify("Product deleted.");
    setRefreshKey((value) => value + 1);
  };

  if (state.loading) return <main className="page-shell page-top business-dashboard"><p>Loading your business...</p></main>;
  if (state.error) return <main className="page-shell page-top business-dashboard"><p className="form-error">{state.error}</p></main>;
  const { business, products } = state;
  return <main className="page-shell page-top business-dashboard">
    <button type="button" className="back-button" onClick={onBack}><ArrowLeft />Back to account</button>
    <div className="page-title business-heading"><p className="eyebrow">Business account</p><h1>{business.business_name}</h1><p>Manage your public shop details and product catalog.</p></div>
    <div className="business-layout">
      <section className="business-panel" aria-labelledby="business-details-title">
        <div className="business-panel-head"><Store /><div><p className="eyebrow">Shop profile</p><h2 id="business-details-title">Business details</h2></div></div>
        <form className="business-form" key={`business-${refreshKey}`} onSubmit={saveBusiness}>
          <label>Business name<input name="businessName" required minLength="2" maxLength="120" defaultValue={business.business_name} /></label>
          <label>District<input name="district" defaultValue={business.district || ""} /></label>
          <label>Contact email<input name="contactEmail" type="email" defaultValue={business.contact_email || user.email || ""} /></label>
          <label>Phone number<input name="phone" type="tel" defaultValue={business.contact_phone || ""} /></label>
          <label className="wide">Description<textarea name="description" rows="4" defaultValue={business.description || ""} placeholder="Tell shoppers what your business sells." /></label>
          <button className="button primary" disabled={savingBusiness}>{savingBusiness ? "Saving..." : "Save business"}</button>
        </form>
      </section>
      <section className="business-panel" aria-labelledby="add-product-title">
        <div className="business-panel-head" id="business-product-form-head" ref={productFormRef}><Package /><div><p className="eyebrow">Catalog</p><h2 id="add-product-title">{editingProduct ? "Edit product" : "Add a product"}</h2></div></div>
        <form className="business-form" key={editingProduct?.id || "new"} onSubmit={addProduct}>
          <label>Product name<input name="name" required minLength="2" maxLength="140" defaultValue={editingProduct?.name || ""} /></label>
          <label>Price (BDT)<input name="price" required type="number" min="0" step="0.01" defaultValue={editingProduct?.price_bdt ?? ""} /></label>
          <label>Stock quantity<input name="stock" required type="number" min="0" step="1" defaultValue={editingProduct?.stock_quantity ?? 1} /></label>
          <label>Image URL<input name="imageUrl" type="url" placeholder="https://example.com/product.jpg" defaultValue={editingProduct?.image_url || ""} /></label>
          <label className="wide">Description<textarea name="description" rows="4" placeholder="Product details, size, material, or delivery information." defaultValue={editingProduct?.description || ""} /></label>
          <button className="button primary" disabled={savingProduct}>{editingProduct ? <Pencil /> : <Plus />}{savingProduct ? "Saving..." : editingProduct ? "Save product" : "Publish product"}</button>
          {editingProduct ? <button type="button" className="button secondary" onClick={() => setEditingProduct(null)}>Cancel</button> : null}
        </form>
      </section>
    </div>
    <section className="business-products" aria-labelledby="your-products-title">
      <div className="section-head"><div><p className="eyebrow">Your catalog</p><h2 id="your-products-title">Products</h2></div><span>{products.length} listed</span></div>
      {!products.length ? <div className="business-empty"><Package /><p>Add your first product to start selling in the TourismuBD Shop.</p></div> : <div className="business-product-grid">{products.map((product) => <article className="business-product-card" key={product.id}>
        <div className="business-product-media">{product.image_url ? <img src={product.image_url} alt={product.name} /> : <Package />}</div>
        <div className="business-product-copy"><div className="business-product-title"><h3>{product.name}</h3><span className={`business-status ${product.status.toLowerCase()}`}>{product.status.toLowerCase()}</span></div><p>{product.description || "No description provided."}</p><div className="business-product-meta"><b>৳{Number(product.price_bdt).toLocaleString()}</b><span>{product.stock_quantity} in stock</span></div><div className="business-product-actions"><button type="button" className="icon-button" onClick={() => editProduct(product)} aria-label={`Edit ${product.name}`} title="Edit product"><Pencil /></button><button type="button" className="button secondary" onClick={() => setProductStatus(product)}>{product.status === "PUBLISHED" ? "Hide" : "Publish"}</button><button type="button" className="icon-button danger" onClick={() => deleteProduct(product)} aria-label={`Delete ${product.name}`} title="Delete product"><Trash2 /></button></div></div>
      </article>)}</div>}
    </section>
  </main>;
}

function Marketplace({ query, setQuery }) {
  const [state, setState] = useState({ loading: true, products: [], error: "", postError: "" });

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

  const products = searchShopProducts(state.products, query);
  return <main className="page-shell page-top marketplace-page">
    <div className="page-title"><p className="eyebrow">TourismuBD marketplace</p><h1>Shop from local businesses.</h1><p>Browse products offered by business accounts across Bangladesh.</p></div>
    <label className="inline-search marketplace-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, businesses, or districts" /><span>{products.length} products</span></label>
    {state.loading ? <p>Loading products...</p> : null}
    {state.error ? <p className="form-error">{state.error}</p> : null}
    {state.postError ? <p className="form-note">{state.postError}</p> : null}
    {!state.loading && !state.error && !products.length ? <div className="business-empty"><ShoppingBag /><p>No products match your search yet.</p></div> : null}
    <div className="marketplace-grid">{products.map((product) => <article className="marketplace-card" key={`${product.kind}-${product.id}`}>
      <div className="marketplace-media">{product.media_type === "VIDEO" ? <video controls preload="metadata" src={product.image_url} aria-label={product.name} /> : product.image_url ? <img src={product.image_url} alt={product.name} /> : <Package />}</div>
      <div className="marketplace-copy"><p className="eyebrow">{product.businesses?.business_name}</p><h2>{product.name}</h2><p>{product.description || "Product details are available from the seller."}</p><div className="marketplace-price">{product.kind === "POST" ? <b className="marketplace-post-label">Product post</b> : <><b>৳{Number(product.price_bdt).toLocaleString()}</b><span>{product.stock_quantity > 0 ? `${product.stock_quantity} available` : "Out of stock"}</span></>}</div><div className="marketplace-seller"><span>{product.businesses?.district || "Bangladesh"}</span>{product.businesses?.contact_phone ? <a href={`tel:${product.businesses.contact_phone}`}>{product.businesses.contact_phone}</a> : product.businesses?.contact_email ? <a href={`mailto:${product.businesses.contact_email}`}>Contact seller</a> : null}</div></div>
    </article>)}</div>
  </main>;
}

function AccountAboutPage({ user, notify, onBack }) {
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

  if (state.loading) return <main className="page-shell page-top account-about-page"><p>Loading your account details...</p></main>;
  if (state.error) return <main className="page-shell page-top account-about-page"><p className="form-error">{state.error}</p></main>;
  return <main className="page-shell page-top account-about-page">
    <button type="button" className="back-button" onClick={onBack}><ArrowLeft />Back to account</button>
    <p className="eyebrow">Account settings</p>
    <ProfileDetailsForm user={user} profile={state.profile} provider={state.provider} notify={notify} onSaved={(profile) => { setState((current) => ({ ...current, profile })); onBack(); }} />
  </main>;
}

function TravelerRatings({ user, notify }) {
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
        if (active) setState({ loading: false, bookings: [], error: error.message || "Could not load completed bookings." });
      }
    };
    loadRatings();
    return () => { active = false; };
  }, [user.id, refreshKey]);

  const submitRating = async (booking, rating) => {
    const { error } = await supabase.from("reviews").insert({ booking_id: booking.id, rating });
    if (error) {
      if (error.code === "23505") {
        setRefreshKey((value) => value + 1);
        notify("You already rated this provider.");
        return true;
      }
      notify(error.message);
      return false;
    }
    setRefreshKey((value) => value + 1);
    notify("Your provider rating was submitted.");
    return true;
  };

  if (!state.loading && !state.error && !state.bookings.length) return null;
  return <section className="traveler-ratings" aria-labelledby="traveler-ratings-title">
    <div className="provider-bookings-heading"><div><p className="eyebrow">Completed bookings</p><h2 id="traveler-ratings-title">Your provider ratings</h2></div></div>
    {state.loading ? <p className="form-note">Loading completed bookings...</p> : null}
    {state.error ? <p className="form-error">{state.error}</p> : null}
    <div className="booking-list">{state.bookings.map((booking) => <article className="booking-card" key={booking.id}><div><p className="eyebrow">{SERVICE_META[booking.service_type]?.label || booking.service_type}</p><h3>{booking.provider_name}</h3><p>Completed {new Date(booking.completed_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p></div><div className="booking-card-action">{booking.rating ? <p className="traveler-rating"><Star /><b>{booking.rating}.0</b><span>Your rating</span></p> : <button type="button" className="button primary" onClick={() => setRatingBooking(booking)}><Star />Rate provider</button>}</div></article>)}</div>
    {ratingBooking ? <RatingDialog booking={ratingBooking} onClose={() => setRatingBooking(null)} onSubmit={submitRating} /> : null}
  </section>;
}

function TravelerRatingsPage({ user, notify, onBack }) {
  return <main className="page-shell page-top traveler-ratings-page"><button type="button" className="back-button" onClick={onBack}><ArrowLeft />Back to account</button><TravelerRatings user={user} notify={notify} /></main>;
}

function RatingDialog({ booking, onClose, onSubmit }) {
  const dialogRef = useRef(null);
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.open && dialog.close();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    if (await onSubmit(booking, rating)) onClose();
    else setSubmitting(false);
  };

  return <dialog ref={dialogRef} className="provider-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="modal rating-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} aria-labelledby="rating-title">
      <button type="button" className="icon-button close" onClick={onClose} aria-label="Close"><X /></button>
      <p className="eyebrow">Completed booking</p>
      <h2 id="rating-title">Rate {booking.provider_name}</h2>
      <p>How was your experience? Your rating will be visible on this provider's public profile.</p>
      <div className="rating-picker" role="group" aria-label="Choose a rating from 1 to 5 stars">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} className={rating >= value ? "active" : ""} onClick={() => setRating(value)} aria-label={`${value} star${value === 1 ? "" : "s"}`} aria-pressed={rating === value}><Star /></button>)}</div>
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Not now</button><button className="button primary" disabled={!rating || submitting}>{submitting ? "Submitting..." : "Submit rating"}</button></div>
    </form>
  </dialog>;
}

function MessageDialog({ user, recipient, onClose, notify, onSent }) {
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
    notify("Message sent.");
    onSent?.();
    onClose();
  };

  return <dialog ref={dialogRef} className="provider-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="modal message-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} aria-labelledby="message-title">
      <button type="button" className="icon-button close" onClick={onClose} aria-label="Close"><X /></button>
      <p className="eyebrow">Direct message</p>
      <h2 id="message-title">Message {recipient.full_name || "this account"}</h2>
      <label>Message<textarea name="message" required maxLength="2000" rows="5" autoFocus placeholder="Write your message" /></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={sending}>Cancel</button><button className="button primary" disabled={sending}>{sending ? "Sending..." : "Send message"}</button></div>
    </form>
  </dialog>;
}

function MessageCenter({ user, onClose, onOpenProfile, notify }) {
  const [state, setState] = useState({ loading: true, messages: [], error: "" });
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    const { data: messages, error } = await supabase.from("direct_messages").select("id,sender_id,recipient_id,sender_name,sender_provider_type,recipient_name,recipient_provider_type,body,created_at").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(100);
    if (error) return setState({ loading: false, messages: [], error: error.message });
    setState({ loading: false, messages: messages || [], error: "" });
  };

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 30000);
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

  return <aside className="message-center" role="dialog" aria-modal="true" aria-label="Messages">
    <div className="message-center-head"><div>{activeConversation ? <button type="button" className="message-back" onClick={() => setSelectedConversationId(null)}><ArrowLeft />Messages</button> : <p className="eyebrow">Messages</p>}{activeConversation ? <button type="button" className="message-profile-link" onClick={() => onOpenProfile(activeConversation.person.id)} aria-label={`View ${activeConversation.person.full_name} profile`}><h2>{activeConversation.person.full_name}</h2></button> : <h2>Message center</h2>}{activeConversation ? <small>{PROVIDER_TYPE_LABELS[activeConversation.person.provider_type] || "Traveler"}</small> : null}</div><button type="button" className="icon-button" onClick={onClose} aria-label="Close messages"><X /></button></div>
    {state.loading ? <p className="form-note">Loading messages...</p> : null}
    {state.error ? <p className="form-error">{state.error.includes("direct_messages") ? "Run 053_direct_messages.sql in Supabase to load messages." : state.error}</p> : null}
    {!state.loading && !state.error && !state.messages.length ? <p className="message-empty">Messages from other accounts will appear here.</p> : null}
    {!state.loading && !state.error && activeConversation ? <><div className="message-thread">{activeMessages.map((message) => <article className={message.sender_id === user.id ? "message-bubble own" : "message-bubble"} key={message.id}><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></article>)}</div><form className="message-compose" onSubmit={send}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength="2000" rows="3" placeholder={`Message ${activeConversation.person.full_name}`} aria-label={`Message ${activeConversation.person.full_name}`} /><button className="button primary" disabled={!draft.trim() || sending}><Send />{sending ? "Sending..." : "Send"}</button></form></> : null}
    {!state.loading && !state.error && !activeConversation ? <div className="message-list">{conversations.map(({ person, latest }) => <button type="button" className="message-conversation" key={person.id} onClick={() => setSelectedConversationId(person.id)}><div><b>{person.full_name}</b><small>{PROVIDER_TYPE_LABELS[person.provider_type] || "Traveler"} · {new Date(latest.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></div><p>{latest.sender_id === user.id ? `You: ${latest.body}` : latest.body}</p><ChevronRight /></button>)}</div> : null}
  </aside>;
}

function PublicPersonProfile({ person, onBack, backLabel = "Back to people", user, notify, onFollowerChange, readOnly = false }) {
  const dialogRef = useRef(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [messageOpen, setMessageOpen] = useState(false);
  const isBusiness = person.role === "BUSINESS_OWNER";
  const isProvider = PROVIDER_ROLES.some(([role]) => role === person.role);
  const [businessName, setBusinessName] = useState(person.business_name || "");
  const [serviceName, setServiceName] = useState(person.service_name || "");
  const role = PROVIDER_TYPE_LABELS[person.role] || "Traveler";
  const photos = (person.profile_photo_urls || []).filter(Boolean);
  const contactDetails = PROFILE_DETAIL_FIELDS.slice(0, 2).map(([label, field]) => [label, person[field] || "Not added"]);
  const details = PROFILE_DETAIL_FIELDS.slice(2).map(([label, field]) => [label, person[field]]).filter(([, value]) => value);
  const avatarUrl = photos[photoIndex] || person.avatar_url;
  const profileName = isBusiness && businessName ? businessName : person.full_name || "TourismuBD member";
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
      <div className="public-person-head">{avatarUrl ? <button type="button" className="public-person-avatar" onClick={() => setPhotoOpen(true)} aria-label="View profile picture"><img src={avatarUrl} alt={photoAlt} /></button> : <span className="public-person-avatar"><CircleUserRound /></span>}<div><p className="eyebrow">{role}</p><h1 id="public-person-title">{profileName}</h1>{isBusiness && person.full_name ? <p className="public-person-owner">Business owner: {person.full_name}</p> : null}{isProvider && serviceName ? <p className="public-person-service-name">Service: {serviceName}</p> : null}<ProviderRating profile={person} isProvider={person.role !== "TRAVELER"} /></div>{readOnly ? null : <div className="public-person-actions">{user?.id !== person.id ? <button type="button" className="button secondary" onClick={() => user ? setMessageOpen(true) : notify("Sign in to send a message.")}><MessageSquare />Message</button> : null}<FollowButton user={user} profileId={person.id} notify={notify} onChanged={onFollowerChange} /></div>}</div>
      <p className="public-person-bio">{person.bio || "No bio added yet."}</p>
      {person.followers_visible !== false || user?.id === person.id ? <FollowerCount count={person.follower_count || 0} /> : null}
      <dl className="public-person-contact">{contactDetails.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      {details.length ? <details className="public-person-details"><summary>See more...</summary><dl>{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></details> : null}
    </section>
    {readOnly ? null : <DashboardPosts user={user} authorId={person.id} profile={person} title="Timeline" notify={notify} />}
    {messageOpen && user ? <MessageDialog user={user} recipient={person} onClose={() => setMessageOpen(false)} notify={notify} /> : null}
    {photoOpen ? <dialog ref={dialogRef} className="profile-photo-dialog" onCancel={(event) => { event.preventDefault(); setPhotoOpen(false); }} onMouseDown={(event) => event.target === event.currentTarget && setPhotoOpen(false)}><button type="button" className="profile-photo-full" onClick={() => setPhotoOpen(false)} aria-label="Close profile picture"><img src={avatarUrl} alt={photoAlt} /></button></dialog> : null}
  </main>;
}

function PeopleDirectory({ notify, user, query, setQuery }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const deferredQuery = useDeferredValue(query.trim());

  useEffect(() => {
    if (!deferredQuery) return setPeople([]);
    if (!supabase) return notify("Connect Supabase to search people.");
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
  }, [deferredQuery]);

  if (selectedPerson) return <PublicPersonProfile person={selectedPerson} user={user} notify={notify} onBack={() => setSelectedPerson(null)} onFollowerChange={(change) => setSelectedPerson((person) => ({ ...person, follower_count: Math.max(0, (person.follower_count || 0) + change) }))} />;

  return <main className="page-shell page-top people-page">
    <div className="page-title"><p className="eyebrow">People</p><h1>Find a traveler or provider.</h1></div>
    <label className="people-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name" aria-label="Search people by name" /></label>
    {!query.trim() ? <p className="people-note">Search by name to view a public profile.</p> : null}
    {loading ? <p className="people-note">Searching...</p> : null}
    {!loading && query.trim() && !people.length ? <p className="people-note">No matching accounts found.</p> : null}
    <div className="people-results">{people.map((person) => <button type="button" className="person-result" key={person.id} onClick={() => setSelectedPerson(person)}><span className="person-result-avatar">{person.avatar_url ? <img src={person.avatar_url} alt="" /> : <CircleUserRound />}</span><span><b>{person.full_name || "TourismuBD member"}</b><small>{PROVIDER_TYPE_LABELS[person.role] || "Traveler"}</small></span><ChevronRight /></button>)}</div>
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

function BookingNotifications({ user }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const load = async () => {
    const { data } = await supabase.from("notifications").select("id,message,read_at,created_at").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(10);
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
    if (item.read_at) return;
    const readAt = new Date().toISOString();
    setItems((current) => current.map((notification) => notification.id === item.id ? { ...notification, read_at: readAt } : notification));
    const { error } = await supabase.from("notifications").update({ read_at: readAt }).eq("id", item.id);
    if (error) load();
  };

  const unread = items.filter((item) => !item.read_at).length;
  return <div className="notification-menu" ref={menuRef}>
    <button type="button" className="notification-button" onClick={() => { setOpen((value) => !value); load(); }} aria-label="Notifications" aria-expanded={open}><Bell />{unread ? <span className="notification-badge">{unread > 9 ? "9+" : unread}</span> : null}</button>
    {open ? <div className="notification-popover" role="region" aria-label="Notifications"><div className="notification-popover-head"><b>Updates</b><span>{unread ? `${unread} new` : "All caught up"}</span></div>{items.length ? <div className="notification-list">{items.map((item) => <button type="button" className={item.read_at ? "notification-item" : "notification-item unread"} key={item.id} onClick={() => markRead(item)}><span>{item.message}</span><small>{new Date(item.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></button>)}</div> : <p className="notification-empty">No updates yet.</p>}</div> : null}
  </div>;
}

function Header({ view, setView, tripCount, user, onAuth, onDeactivate, onSignOut, onOpenAbout, onOpenBookings, onOpenRatings, onOpenMessages, onOpenBusinessCatalog, notify, theme, onThemeChange }) {
  const [open, setOpen] = useState(false);
  const go = (next) => {
    setView(next);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className={view === "home" ? "site-header" : "site-header inner"}>
      <button className="brand-button" onClick={() => go("home")}><Logo /></button>
      <nav className={open ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
        {NAV.map(([id, label]) => (
          <button key={id} className={view === id ? "active" : ""} onClick={() => go(id)}>
            {label}{id === "trip" && tripCount ? <span className="nav-count">{tripCount}</span> : null}
          </button>
        ))}
        <button className="account-link" onClick={onAuth}><CircleUserRound size={17} />{user ? "Account" : "Sign in"}</button>
        {user ? <BookingNotifications user={user} /> : null}
        {user ? <OwnerMenu user={user} onDeactivate={onDeactivate} onSignOut={onSignOut} onOpenAbout={onOpenAbout} onOpenBookings={onOpenBookings} onOpenRatings={onOpenRatings} onOpenMessages={onOpenMessages} onOpenBusinessCatalog={onOpenBusinessCatalog} notify={notify} className="header-owner-menu" theme={theme} onThemeChange={onThemeChange} /> : null}
      </nav>
      <button className="icon-button menu-button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={open}>
        {open ? <X /> : <Menu />}
      </button>
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
  return (
    <article className="place-card">
      <button className="place-image" onClick={() => onOpen(place)} aria-label={`View ${place.name}`}>
        <img src={place.image || fallbackImage} alt="" />
        <span className="place-category">{place.category}</span>
      </button>
      <div className="place-card-body">
        <p><MapPin size={14} /> {place.area}, {place.district}</p>
        <button className="title-link" onClick={() => onOpen(place)}>{place.name}</button>
        <p className="place-copy">{place.shortDescription}</p>
        <div className="place-actions">
          <button className={selected ? "button added" : "button secondary"} onClick={() => onToggle(place.id)}>
            {selected ? <Check size={17} /> : <Plus size={17} />}{selected ? "In my trip" : "Add to trip"}
          </button>
          <button className="icon-button" onClick={() => onOpen(place)} aria-label={`Open ${place.name}`}><ChevronRight /></button>
        </div>
      </div>
    </article>
  );
}

function Home({ setView, openServices, openPlace, selectedIds, togglePlace }) {
  const [query, setQuery] = useState("");
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
        <img src={fallbackImage} alt="A wooden boat crossing the green waterways of Sylhet" />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow light">Plan less. See more.</p>
          <h1>Bangladesh,<br />in a practical order.</h1>
          <p>Find a place, add what is nearby, and get a route that cuts needless backtracking.</p>
          <form className="search-box" onSubmit={submit}>
            <Search aria-hidden="true" />
            <label className="sr-only" htmlFor="hero-search">Search places</label>
            <input id="hero-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Ratargul or Jaflong" />
            <button type="submit" aria-label="Search"><ArrowRight /></button>
          </form>
          {query && match ? <button className="search-suggestion" onClick={() => openPlace(match)}><MapPin size={16} />{match.name}<span>{match.area}</span></button> : null}
        </div>
        <div className="hero-route" aria-hidden="true"><span>SYLHET CITY</span><i /><span>RATARGUL</span><i /><span>JAFLONG</span></div>
      </section>

      <section className="quick-actions page-shell" aria-label="Trip shortcuts">
        <button onClick={() => setView("explore")}><span><Binoculars /></span><div><b>Find a place</b><small>Start with one destination</small></div><ChevronRight /></button>
        <button onClick={() => setView("trip")}><span><Route /></span><div><b>Plan selected places</b><small>Build a practical route</small></div><ChevronRight /></button>
        <button onClick={() => openServices("HOUSEBOAT")}><span><Sailboat /></span><div><b>Explore by water</b><small>Houseboats and small boats</small></div><ChevronRight /></button>
      </section>

      <section className="content-section page-shell">
        <SectionHead eyebrow="Start with Sylhet" title="Places worth building a day around" action="See all places" onAction={() => setView("explore")} />
        <div className="place-grid">
          {places.slice(0, 3).map((place) => <PlaceCard key={place.id} place={place} selected={selectedIds.includes(place.id)} onOpen={openPlace} onToggle={togglePlace} />)}
        </div>
      </section>

      <section className="district-band">
        <div className="page-shell district-layout">
          <div>
            <p className="eyebrow">District trip</p>
            <h2>Two days in Sylhet.<br />Already organized.</h2>
            <p>Use a curated route, then adjust the places to fit your group.</p>
            <button className="button primary" onClick={() => setView("trip")}><CalendarDays size={18} />Open 2-day plan</button>
          </div>
        <div className="itinerary-preview">
            {(curatedItineraries.find((item) => item.durationDays === 2)?.days.flat() || places.slice(0, 4).map((place) => place.id)).slice(0, 4).map((item, index) => {
              const place = typeof item === "object" ? item : places.find((candidate) => candidate.id === item);
              return <div key={place?.id || index}><span>{index + 1}</span><div><b>{place?.name || "Sylhet highlight"}</b><small>{index < 2 ? "Day 1" : "Day 2"}</small></div></div>;
            })}
          </div>
        </div>
      </section>

      <WaterChoices openServices={openServices} compact />
    </main>
  );
}

function Explore({ selectedIds, togglePlace, openPlace, filters, setFilters }) {
  const { query, category, categoriesExpanded } = filters;
  const deferredQuery = useDeferredValue(query);
  const matchingPlaces = useMemo(() => places.filter((place) => {
    const haystack = `${place.name} ${place.area} ${place.category} ${place.district} ${(place.aliases || []).join(" ")}`.toLowerCase();
    return haystack.includes(deferredQuery.toLowerCase());
  }), [deferredQuery]);
  const categories = ["All", ...new Set(matchingPlaces.map((place) => place.category).sort())];
  const filtered = matchingPlaces.filter((place) => category === "All" || place.category === category);

  useEffect(() => {
    if (!categories.includes(category)) setFilters((current) => ({ ...current, category: "All" }));
  }, [category, categories.join("|"), setFilters]);

  return (
    <main className="page-shell page-top">
      <div className="page-title"><p className="eyebrow">Bangladesh destinations</p><h1>Find your next place.</h1><p>Published destinations with practical travel notes and clear verification status.</p></div>
      <div className="explore-tools">
        <label className="inline-search"><Search /><input value={query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Search by place, area, or category" /><span>{filtered.length} places</span></label>
        <div className={`category-tabs ${categoriesExpanded ? "expanded" : "collapsed"}`} role="group" aria-label="Filter places">
          {categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setFilters((current) => ({ ...current, category: item }))} key={item}>{item}</button>)}
        </div>
        {categories.length > 8 ? <button type="button" className="category-more" onClick={() => setFilters((current) => ({ ...current, categoriesExpanded: !current.categoriesExpanded }))}>{categoriesExpanded ? "See less" : "See more"}</button> : null}
      </div>
      <div className="place-grid explore-grid">
        {filtered.map((place) => <PlaceCard key={place.id} place={place} selected={selectedIds.includes(place.id)} onOpen={openPlace} onToggle={togglePlace} />)}
      </div>
      {!filtered.length ? <div className="empty-state"><Search /><h2>No place matches that search.</h2><p>Try a place name, area, or a broader category.</p></div> : null}
    </main>
  );
}

function PlaceDetail({ place, selected, togglePlace, close, goTrip, openPlace }) {
  if (!place) return null;
  const nearby = findNearbyPlaces(place.id, 3);
  return (
    <main className="detail-page">
      <div className="detail-hero">
        <img src={place.image || fallbackImage} alt={`Landscape at ${place.name}`} />
        <div className="detail-overlay" />
        <button className="back-button" onClick={close}><ArrowLeft />Back to places</button>
        <div className="detail-title"><p className="eyebrow light">{place.category} · {place.area}</p><h1>{place.name}</h1><p>{place.shortDescription}</p></div>
        <div className="detail-actions">
          <button className={selected ? "button added" : "button white"} onClick={() => togglePlace(place.id)}>{selected ? <Check /> : <Plus />}{selected ? "Added to my trip" : "Add to my trip"}</button>
          <button className="button primary" onClick={goTrip}><Route />Plan this trip</button>
        </div>
      </div>
      <div className="page-shell detail-content">
        <section className="detail-main">
          <div className="fact-grid">
            <div><CalendarDays /><span>Best time</span><b>{place.bestTime?.recommended || "November – March"}</b></div>
            <div><Clock3 /><span>From Sylhet City</span><b>{place.travelTime || "About 1.5 hours"}</b></div>
            <div><Mountain /><span>Area</span><b>{place.area}</b></div>
          </div>
          <article className="prose-section"><p className="eyebrow">Plan your visit</p><h2>When to go</h2><p>{place.bestTime?.why}</p><div className="notice"><Flag /> <span><b>Keep in mind</b>{place.bestTime?.caution || place.practicalTip}</span></div><small>{place.bestTime?.lastVerified ? `Last verified ${place.bestTime.lastVerified}` : "Field verification pending"}</small></article>
          <article className="prose-section"><p className="eyebrow">Getting there</p><h2>How to reach {place.name}</h2><p>{place.howToReach}</p></article>
          <article className="prose-section"><SectionHead eyebrow="Continue nearby" title="Useful places on the same trip" />
            <div className="nearby-list">{nearby.map((item) => <button key={item.id} onClick={() => openPlace(item)}><img src={item.image || fallbackImage} alt="" /><span><b>{item.name}</b><small>{item.area} · view place</small></span><ChevronRight /></button>)}</div>
          </article>
        </section>
        <aside className="detail-aside">
          <div className="route-card"><Map /><p className="eyebrow">Route context</p><h3>Sylhet City → {place.name}</h3><div className="route-line"><i /><i /><i /></div><p>This prototype uses approximate coordinates. Verified road legs will replace them before launch.</p></div>
          <div className="trust-note"><BadgeCheck /><div><b>Information, checked by people</b><p>Travel notes are curated and show when they were last verified.</p></div></div>
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

  return <article className="route-day-map" aria-labelledby={titleId}>
    <div className="route-day-map-head"><h3 id={titleId}>Day {plan.day}</h3><span>{plan.places.length ? mapStatus : "No stops scheduled for this day."}</span></div>
    <div ref={mapNodeRef} className="route-map-canvas" role="region" aria-label={`Road map for day ${plan.day}`} />
  </article>;
}

function TripPlanner({ user, selectedIds, setSelectedIds, notify, onDistrictSelected, settings, setSettings }) {
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
    const name = district?.name || "Destination";
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
      { value: "town-center", name: `${name} Town Center`, geocodeQuery: `${name}, Bangladesh`, coordinates, coordinatesAreApproximate: false },
      { value: "railway-station", name: `${name} Railway Station`, geocodeQuery: `${name} Railway Station, ${name}, Bangladesh`, coordinates, coordinatesAreApproximate: true },
      { value: "bus-terminal", name: `${name} Bus Terminal`, geocodeQuery: `${name} Bus Terminal, ${name}, Bangladesh`, coordinates, coordinatesAreApproximate: true },
      ...(airport ? [{ value: "airport", name: airport, geocodeQuery: `${airport}, Bangladesh`, coordinates, coordinatesAreApproximate: true }] : []),
    ].filter((option) => option.coordinates);
  }, [district?.name, district?.slug, suggestedPlaces]);
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
    if (!districtId) return notify("Choose a destination district first.");
    if (selected.length < 2) return notify("Add at least two places to build a route.");
    try {
      if (selected.length === suggestedPlaces.length) return setRouteResult(planDistrictTour(districtId, days, startingPoint));
      const route = planRoute(selected.map((place) => place.id), startingPoint);
      setRouteResult({ ...planDailyRoute(route, days), kind: "selected" });
    } catch (error) {
      console.error("Selected route could not be built", error);
      notify("The selected route could not be built. Please try again.");
    }
  };
  const generateDistrict = () => {
    if (!districtId) return notify("Choose a destination district first.");
    const validDays = Math.min(days, districtDayLimit);
    if (validDays !== days) setDays(validDays);
    setRouteResult(planDistrictTour(districtId, validDays, startingPoint));
  };
  const save = () => {
    if (!routeResult) return;
    if (!user) return notify("Sign in to save a trip.");
    const trip = { id: crypto.randomUUID(), name: `${days}-day ${district?.name || "Bangladesh"} ${routeResult.kind === "district" ? "district tour" : "selected places trip"}`, start: routeResult.start.name, days, placeIds: routeResult.orderedPlaces.map((place) => place.id), createdAt: new Date().toISOString() };
    saveTrip(trip, user.id);
    setSaved(loadSavedTrips(user.id));
    notify("Trip saved on this device.");
  };

  return (
    <main className="page-shell page-top planner-page">
      <div className="page-title"><p className="eyebrow">Route planner</p><h1>Put the day in order.</h1><p>Choose a district and 1 to 12 days to plan every published place, or build a custom route from any two or more spots.</p></div>
      <div className="planner-layout">
        <section className="planner-controls">
          <div className="control-section"><div className="control-title"><span>1</span><div><h2>Choose destination district</h2><p>Suggestions appear after you choose.</p></div></div>
            <label>Destination district<select value={districtId} onChange={(event) => setDistrictId(event.target.value)}><option value="">Select a district</option>{districts.map((item) => <option value={item.id} key={item.id}>{item.name}, {item.division}</option>)}</select></label>
          </div>
          <div className="control-section"><div className="control-title"><span>2</span><div><h2>Suggested places</h2><p>{district ? `${selected.length} selected in ${district.name}` : "Choose a district first"}</p></div></div>
            {districtId ? <div className="selected-list">{suggestedPlaces.map((place) => {
              const active = selectedIds.some((id) => place.id === id || place.databaseId === id);
              return <button key={place.id} className={active ? "selected" : ""} onClick={() => setSelectedIds((ids) => active ? ids.filter((id) => id !== place.id && id !== place.databaseId) : [...ids, place.id])}><span>{active ? <Check /> : <Plus />}</span><div><b>{place.name}</b><small>{place.area}</small></div></button>;
            })}</div> : <p className="form-note">Select your destination district to see tourist spot suggestions.</p>}
          </div>
          <div className="control-section"><div className="control-title"><span>3</span><div><h2>Plan the district</h2><p>{district ? `Choose up to ${districtDayLimit} days for ${suggestedPlaces.length} published places.` : "Choose 1 to 12 days for every published place."}</p></div></div>
            <label>Starting point<select value={start} onChange={(event) => setStart(event.target.value)} disabled={!startOptions.length}>{startOptions.map((option) => <option value={option.value} key={option.value}>{option.name}</option>)}</select></label>
            <div className="segmented" aria-label="Trip length">{Array.from({ length: 12 }, (_, index) => index + 1).map((value) => {
              const unavailable = value > tripDayLimit;
              const availabilityContext = selected.length >= 2 ? `${selected.length} selected places` : `${suggestedPlaces.length} places in ${district?.name}`;
              return <button key={value} className={days === value ? "active" : ""} disabled={unavailable} aria-label={unavailable ? `${value} days unavailable for ${availabilityContext}` : undefined} onClick={() => setDays(value)}>{value} day{value === 1 ? "" : "s"}</button>;
            })}</div>
            <button className="button primary wide" onClick={generateDistrict}><Route />Plan full district</button>
            {selected.length >= 2 ? <button className="button secondary wide" onClick={generateSelected}>Build selected places route</button> : null}
          </div>
        </section>
        <section className="route-output" aria-live="polite">
          {routeResult ? <><div className="route-output-head"><div><p className="eyebrow">{routeResult.kind === "district" ? "Full district plan" : "Selected places plan"}</p><h2>{routeResult.kind === "district" ? `${district?.name} in ${days} days` : `${routeResult.orderedPlaces.length} selected places in ${days} days`}</h2></div><button className="button secondary" onClick={save}>Save trip</button></div>
            <div className="route-stats"><span><Route />Estimated {Math.round(routeResult.totalDistanceKm || 0)} km</span><span><Clock3 />Estimated {Math.max(1, Math.round((routeResult.totalMinutes || 120) / 60))} hr travel</span><span><MapPin />{routeResult.orderedPlaces.length} places</span></div>
            <div className={`route-visual${routeResult.dayPlans ? " route-day-images" : ""}`}><div className="route-start"><span>S</span><div><small>Start and daily return</small><b>{routeResult.start.name}</b></div></div>{routeResult.dayPlans ? routeResult.dayPlans.map((plan) => <RouteDayMap key={plan.day} plan={plan} start={routeResult.start} />) : routeResult.orderedPlaces.map((place, index) => <div className="route-stop" key={place.id}><span>{index + 1}</span><div><small>{index + 1 === routeResult.orderedPlaces.length ? "Finish here" : `Stop ${index + 1}`}</small><b>{place.name}</b><p>{place.area}</p></div></div>)}</div>
            <div className="route-disclaimer"><ShieldCheck />Routes follow mapped roads and return to the selected starting point. Confirm current road conditions before departure.</div>
          </> : <div className="route-placeholder"><div className="map-pattern"><Map /></div><h2>{districtId ? "Your route will appear here." : "Choose a district to begin."}</h2><p>{districtId ? "Select at least two places, choose a starting point, and build the route." : "We will suggest published tourist spots in your destination district."}</p></div>}
        </section>
      </div>
      {saved.length ? <section className="saved-section"><SectionHead eyebrow="On this device" title="Saved trips" /><div className="saved-list">{saved.map((trip) => <div key={trip.id}><Route /><span><b>{trip.name}</b><small>{trip.placeIds.length} places · starts at {trip.start}</small></span></div>)}</div></section> : null}
    </main>
  );
}

function WaterChoices({ openServices, compact = false }) {
  return (
    <section className={compact ? "water-band" : "water-options"}>
      <div className="page-shell">
        <SectionHead eyebrow="Explore by water" title="Two choices, in every district." />
        <div className="water-grid">
          <button onClick={() => openServices?.("HOUSEBOAT")}><span className="water-icon"><Sailboat /></span><div><h3>Find a Houseboat</h3><p>Multi-day stays, subject to provider availability.</p></div><ArrowRight /></button>
          <button onClick={() => openServices?.("SMALL_BOAT")}><span className="water-icon small"><Compass /></span><div><h3>Rent a Small Boat</h3><p>Short water trips with local operators.</p></div><ArrowRight /></button>
        </div>
      </div>
    </section>
  );
}

function BookingDialog({ listing, serviceType, onClose, onSubmit }) {
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
        <button type="button" className="icon-button close" onClick={onClose} aria-label="Close"><X /></button>
        <p className="eyebrow">Booking request</p>
        <h2 id="booking-title">Request {listing.service_name || listing.display_name || listing.name}</h2>
        <label>Start date<input name="startDate" required type="date" min={new Date().toISOString().slice(0, 10)} /></label>
        <label>Number of days<input name="durationDays" required type="number" min="1" max="30" defaultValue="1" readOnly={fixedOneDay} /></label>
        {fixedOneDay ? <p className="form-note">Sundarbans Small Boat bookings are fixed to one day.</p> : null}
        <label>Travelers<input name="travelerCount" required type="number" min="1" max="100" defaultValue="1" /></label>
        <label>Note<textarea name="note" rows="3" placeholder="Pickup point or practical details" /></label>
        <label className="check-label"><input name="contactConsent" type="checkbox" /> Share my phone and email with the provider after confirmation</label>
        <button className="button primary wide">Send booking request</button>
      </form>
    </dialog>
  );
}

function Services({ notify, type, onTypeChange, user, onAuth, district }) {
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
        if (listingResult.error || profileResult.error) notify(listingResult.error?.message || profileResult.error?.message || "Could not load provider details.");
        const profiles = Object.fromEntries((profileResult.data || []).map(({ id, ...profile }) => [id, profile]));
        setLiveListings((listingResult.data || []).filter((listing) => !district || profiles[listing.provider_id]).map((listing) => ({ ...listing, ...profiles[listing.provider_id] })));
      });
    } else query.then(({ data, error }) => {
      if (error) notify(error.message);
      setLiveListings(data || []);
    });
  }, [type, district]);
  const openProfile = async (listing) => {
    if (!supabase || !listing.user_id) return notify("This provider profile is not available yet.");
    const { data, error } = await supabase.from("public_people").select(PUBLIC_PERSON_FIELDS).eq("id", listing.user_id).maybeSingle();
    if (error) return notify(error.message);
    if (!data) return notify("This provider profile is not available yet.");
    setProfile(data);
  };
  const requestBooking = (listing) => {
    if (!user) {
      notify("Sign in as a traveler to request a booking.");
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
    notify("Booking request sent.");
  };
  if (profile) return <PublicPersonProfile person={profile} user={user} notify={notify} backLabel="Back to local services" onBack={() => setProfile(null)} onFollowerChange={(change) => setProfile((current) => ({ ...current, follower_count: Math.max(0, (current.follower_count || 0) + change) }))} />;
  const providerTitle = (listing) => listing.service_name || listing.display_name || listing.name;

  return (
    <main className="page-shell page-top services-page">
      <div className="page-title"><p className="eyebrow">Local services</p><h1>Plan first. Ask for help when you need it.</h1><p>Public details stay useful; private contact unlocks only after a booking is confirmed.</p></div>
      <div className="service-tabs" role="tablist">{Object.entries(SERVICE_META).map(([id, item]) => { const Icon = item.icon; return <button role="tab" aria-selected={type === id} className={type === id ? "active" : ""} onClick={() => onTypeChange(id)} key={id}><Icon />{item.label}</button>; })}</div>
      {listings.length ? <div className="provider-grid">{listings.map((listing) => <article className="provider-card" key={listing.id}>{listing.user_id ? <button type="button" className="provider-photo" onClick={() => openProfile(listing)} aria-label={`View ${providerTitle(listing)} profile`}>{listing.photo_url ? <img src={listing.photo_url} alt="" /> : <ServiceIcon />}</button> : <span className="provider-photo">{listing.photo_url ? <img src={listing.photo_url} alt="" /> : <ServiceIcon />}</span>}<div>{listing.user_id ? <button type="button" className="provider-name" onClick={() => openProfile(listing)}><h2>{providerTitle(listing)}</h2></button> : <h2>{providerTitle(listing)}</h2>}{listing.service_name && listing.display_name && listing.service_name !== listing.display_name ? <p className="provider-owner-name">Provider: {listing.display_name}</p> : null}<ProviderRating profile={listing} /><p>{listing.bio || (listing.boarding_point ? `${listing.boarding_point} · capacity ${listing.capacity}` : "Available for requests in selected service areas.")}</p>{listing.approximate_price_bdt ? <b>About ৳{listing.approximate_price_bdt} / {listing.pricing_unit || "trip"}</b> : null}<PublicProfileDetails profile={listing} /></div><button className="button primary" onClick={() => requestBooking(listing)}>Request booking</button></article>)}</div> : <div className="empty-provider"><span><ServiceIcon /></span><p className="eyebrow">{service.label}{district ? ` in ${district.name}` : ""}</p><h2>No {service.label.toLowerCase()} are available here yet.</h2><p>Providers will appear here after they add this district to their public profile.</p></div>}
      {booking ? <BookingDialog listing={booking} serviceType={type} onClose={() => setBooking(null)} onSubmit={submitBooking} /> : null}
    </main>
  );
}

function Footer() {
  return <footer><div className="page-shell"><Logo /><p>Practical routes through Bangladesh, starting with Sylhet.</p><span>Place data shows when it was last verified.</span></div></footer>;
}

function LoginRequired({ onSignIn, onBrowsePlaces }) {
  return <main className="page-shell page-top login-required">
    <span className="login-required-icon"><ShieldCheck /></span>
    <p className="eyebrow">TourismuBD account</p>
    <h1>Sign in to continue.</h1>
    <p>Timeline posts, trip planning, local services, and people search are available to signed-in members.</p>
    <div className="login-required-actions">
      <button type="button" className="button primary" onClick={onSignIn}>Sign in</button>
      <button type="button" className="button secondary" onClick={onBrowsePlaces}><MapPin />Browse places</button>
    </div>
  </main>;
}

export default function App() {
  usePublishedTourism();
  const auth = useAuth();
  const [view, setView] = useState(viewFromLocation);
  const [serviceDistrictId, setServiceDistrictId] = useSessionState("tourismubd.service-district", "");
  const [selectedIds, setSelectedIds] = useSessionState("tourismubd.selected-places", []);
  const [exploreFilters, setExploreFilters] = useSessionState("tourismubd.explore-filters", { query: "", category: "All", categoriesExpanded: false });
  const [tripSettings, setTripSettings] = useSessionState("tourismubd.trip-settings", { districtId: "", start: "town-center", days: 2 });
  const [peopleQuery, setPeopleQuery] = useSessionState("tourismubd.people-query", "");
  const [marketplaceQuery, setMarketplaceQuery] = useSessionState("tourismubd.marketplace-query", "");
  const [activePlace, setActivePlace] = useState(null);
  const [serviceType, setServiceType] = useSessionState("tourismubd.service-type", "GUIDE");
  const [toast, setToast] = useState("");
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
    if (!supabase) return notify("Connect Supabase to enable accounts.");
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
    if (viewRequiresAuthentication(nextView, auth.user)) {
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
    if (!data) return notify("This profile is not available.");
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
      if (!data) return notify("This profile is not available.");
      setLinkedProfile(data);
      setLinkedProfileReadOnly(false);
      setView("linked-profile");
      window.scrollTo(0, 0);
    };
    const openAdminPreview = async () => {
      try {
        const response = await fetch(`${ADMIN_APP_URL}/__tourismubd-admin/profile?id=${encodeURIComponent(personId)}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "The Admin profile preview is unavailable.");
        if (!active) return;
        if (!payload.data) return notify("This profile is not available.");
        setLinkedProfile(payload.data);
        setLinkedProfileReadOnly(true);
        setView("linked-profile");
        window.scrollTo(0, 0);
      } catch (error) {
        if (active) notify(error.message || "The Admin profile preview is unavailable.");
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
  }, []);
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
      notify("Account reactivated.");
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
    notify("Account deactivated. Sign in within three months to keep it.");
    return "";
  };
  const signOut = async () => {
    setSignOutOpen(false);
    setMessagesOpen(false);
    await supabase.auth.signOut();
    showView("home", true);
    notify("Signed out.");
  };
  const protectedView = viewRequiresAuthentication(view, auth.user) && !(view === "linked-profile" && linkedProfileReadOnly);

  return (
    <div className="app">
      {activePlace ? <PlaceDetail place={activePlace} selected={selectedIds.includes(activePlace.id)} togglePlace={togglePlace} close={() => setActivePlace(null)} goTrip={goTrip} openPlace={openPlace} /> : <>
        <Header view={view} setView={navigate} tripCount={selectedIds.length} user={auth.user} onAuth={() => auth.user ? openDashboard() : requestAuthentication()} onDeactivate={() => setDeactivationOpen(true)} onSignOut={() => setSignOutOpen(true)} onOpenAbout={() => navigate("account-about")} onOpenBookings={() => navigate("booking-requests")} onOpenRatings={() => navigate("provider-ratings")} onOpenMessages={() => setMessagesOpen(true)} onOpenBusinessCatalog={() => navigate("business-catalog")} notify={notify} theme={theme} onThemeChange={setTheme} />
        {protectedView ? <LoginRequired onSignIn={() => requestAuthentication(() => window.scrollTo(0, 0))} onBrowsePlaces={() => navigate("explore")} /> : null}
        {!protectedView && view === "home" ? <Home setView={navigate} openServices={openServices} openPlace={openPlace} selectedIds={selectedIds} togglePlace={togglePlace} /> : null}
        {view === "explore" ? <Explore selectedIds={selectedIds} togglePlace={togglePlace} openPlace={openPlace} filters={exploreFilters} setFilters={setExploreFilters} /> : null}
        {!protectedView && view === "trip" ? <TripPlanner user={auth.user} selectedIds={selectedIds} setSelectedIds={setSelectedIds} notify={notify} onDistrictSelected={(district) => setServiceDistrictId(district?.id || "")} settings={tripSettings} setSettings={setTripSettings} /> : null}
        {!protectedView && view === "services" ? <Services notify={notify} type={serviceType} onTypeChange={setServiceType} user={auth.user} onAuth={() => requestAuthentication()} district={serviceDistrict} /> : null}
        {!protectedView && view === "people" ? <PeopleDirectory notify={notify} user={auth.user} query={peopleQuery} setQuery={setPeopleQuery} /> : null}
        {!protectedView && view === "feed" ? <CommunityFeed user={auth.user} notify={notify} /> : null}
        {!protectedView && view === "shop" ? <Marketplace query={marketplaceQuery} setQuery={setMarketplaceQuery} /> : null}
        {view === "provider" && auth.user ? <ProviderDashboard user={auth.user} notify={notify} /> : null}
        {view === "booking-requests" && auth.user ? <ProviderBookingRequestsPage user={auth.user} notify={notify} onBack={() => showView("provider")} /> : null}
        {view === "traveler" && auth.user ? <TravelerDashboard user={auth.user} notify={notify} /> : null}
        {view === "business" && auth.user ? <BusinessDashboard user={auth.user} notify={notify} /> : null}
        {view === "business-catalog" && auth.user ? <BusinessCatalogPage user={auth.user} notify={notify} onBack={() => navigate("business")} /> : null}
        {view === "account-about" && auth.user ? <AccountAboutPage user={auth.user} notify={notify} onBack={openDashboard} /> : null}
        {view === "provider-ratings" && auth.user ? <TravelerRatingsPage user={auth.user} notify={notify} onBack={() => showView("traveler")} /> : null}
        {view === "message-profile" && auth.user && messageProfile ? <PublicPersonProfile person={messageProfile.person} user={auth.user} notify={notify} backLabel="Back to messages" onBack={() => { showView(messageProfile.returnView); setMessageProfile(null); setMessagesOpen(true); }} onFollowerChange={(change) => setMessageProfile((current) => ({ ...current, person: { ...current.person, follower_count: Math.max(0, (current.person.follower_count || 0) + change) } }))} /> : null}
        {view === "linked-profile" && linkedProfile && (auth.user || linkedProfileReadOnly) ? <PublicPersonProfile person={linkedProfile} user={auth.user} notify={notify} readOnly={linkedProfileReadOnly} backLabel="Back to TourismuBD" onBack={closeLinkedProfile} onFollowerChange={(change) => setLinkedProfile((current) => ({ ...current, follower_count: Math.max(0, (current.follower_count || 0) + change) }))} /> : null}
        <Footer />
      </>}
      {authOpen && supabase && !auth.user ? <AuthDialog onClose={() => { pendingAuthActionRef.current = null; setAuthOpen(false); }} notify={notify} onAuthenticated={authenticationComplete} /> : null}
      {deactivationOpen && auth.user ? <DeactivateAccountDialog onClose={() => setDeactivationOpen(false)} onConfirm={deactivateAccount} /> : null}
      {signOutOpen && auth.user ? <SignOutDialog onClose={() => setSignOutOpen(false)} onConfirm={signOut} /> : null}
      {messagesOpen && auth.user ? <MessageCenter user={auth.user} onClose={() => setMessagesOpen(false)} onOpenProfile={openMessageProfile} notify={notify} /> : null}
      <div className={toast ? "toast show" : "toast"} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
