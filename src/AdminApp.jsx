import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  Camera,
  CarFront,
  Check,
  CircleUserRound,
  ClipboardCheck,
  Database,
  FileClock,
  Eye,
  EyeOff,
  ExternalLink,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  Link,
  LogOut,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Route,
  Sailboat,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  UploadCloud,
  UsersRound,
  UserCog,
  Waves,
  X,
} from "lucide-react";
import { ADMIN_ROLES, ADMIN_ROLE_LABELS, adminRemovalPatch, buildPlacePayload, canAccessAdminSection, canManageProfile, groupReportedPostRows, hasAdminAccess, isSuperAdmin, PLACE_STATUSES, providerTypeLabel, slugifyPlaceName, sortDestinationRows } from "./lib/admin.js";
import { supabase } from "./lib/admin-supabase.js";
import {
  districts as staticDistricts,
  places as staticPlaces,
  waterListings as staticWaterListings,
  getCustomPlaceImage,
  getCustomWaterImage,
  getSystemBanner,
  saveCustomPlaceImage,
  saveCustomWaterImage,
  saveCustomSystemBanner,
  syncCustomMediaFromServer,
} from "./data/tourism.js";
import { getPlaceGallery, saveCustomPlaceGallery } from "./data/place-galleries.js";

const RESOURCES = [
  { id: "media", label: "Media", table: "places", adminModule: "media", mediaSection: true, icon: ImageIcon, columns: ["name", "category", "district_id", "image_url"] },
  { id: "profiles", label: "Users", table: "profiles", adminModule: "users", profileRole: "TRAVELER", publicProfilesOnly: true, icon: UsersRound, columns: ["full_name", "email", "phone", "district", "role", "status", "updated_at"], remove: { status: "SUSPENDED" } },
  { id: "providers", label: "Providers", table: "providers", adminModule: "providers", icon: Building2, columns: ["owner_name", "provider_type", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "businesses", label: "Business", table: "businesses", adminModule: "business", businessSection: true, icon: BriefcaseBusiness, columns: ["owner_name", "business_name", "district", "contact_email", "contact_phone", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "business-products", label: "Products", table: "business_products", adminModule: "business", businessSection: true, businessChild: true, icon: Package, columns: ["seller_name", "name", "description", "price_bdt", "stock_quantity", "status", "updated_at"], remove: { status: "HIDDEN" } },
  { id: "subscriptions", label: "Subscriptions", table: "provider_subscriptions", adminModule: "subscriptions", subscriptionSection: true, icon: ClipboardCheck, columns: ["owner_name", "service_name", "provider_type", "district", "monthly_fee_bdt", "status", "current_period_end"], remove: { status: "FROZEN" } },
  { id: "business-subscriptions", label: "Business accounts", table: "businesses", businessSection: true, subscriptionSection: true, subscriptionChild: true, icon: BriefcaseBusiness, columns: ["owner_name", "business_name", "district", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "places", label: "Places", table: "places", icon: MapPin, columns: ["division_name", "district_name", "name", "upazila_or_area", "category", "status"], remove: { status: "HIDDEN" } },
  { id: "routes", label: "Routes", table: "place_relationships", icon: Route, columns: ["from_place_id", "to_place_id", "relationship_type", "travel_minutes"] },
  { id: "water", label: "Water bodies", table: "water_bodies", icon: Waves, columns: ["name", "type", "is_sundarbans", "status"], remove: { status: "HIDDEN" } },
  { id: "guides", label: "Tour guides", table: "providers", adminModule: "providers", providerType: "GUIDE", icon: CircleUserRound, columns: ["owner_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "houseboats", label: "Houseboat owners", table: "providers", adminModule: "providers", providerType: "HOUSEBOAT_OWNER", icon: Sailboat, columns: ["owner_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "smallboats", label: "Small boat owners", table: "providers", adminModule: "providers", providerType: "SMALL_BOAT_OWNER", icon: Sailboat, columns: ["owner_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "hotels", label: "Resort / Hotel owners", table: "providers", adminModule: "providers", providerType: "RESORT_HOTEL_OWNER", icon: Building2, columns: ["owner_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "transport", label: "Transport owners", table: "providers", adminModule: "providers", providerType: "CAR_TRANSPORT_OWNER", icon: CarFront, columns: ["owner_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "parking", label: "Parking owners", table: "providers", adminModule: "providers", providerType: "PARKING_OWNER", icon: MapPin, columns: ["owner_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "agencies", label: "Tour agencies", table: "providers", adminModule: "providers", providerType: "TOUR_AGENCY_ORGANIZATION", icon: UsersRound, columns: ["owner_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "bookings", label: "Bookings", table: "bookings", adminModule: "bookings", icon: CalendarCheck, columns: ["service_type", "service_name", "provider_name", "traveler_names", "booking_count", "latest_booking", "status"] },
  { id: "trips", label: "Saved trips", table: "saved_trips", icon: CarFront, columns: ["name", "traveler_id", "starting_point_value", "created_at"] },
  { id: "reviews", label: "Reviews", table: "reviews", icon: Star, columns: ["booking_id", "rating", "status", "created_at"], remove: { status: "REMOVED" } },
  { id: "reports", label: "Reports", table: "reports", primaryKey: "_row_key", adminModule: "reports", reportSection: true, icon: AlertTriangle, columns: ["category", "reason_categories", "status", "reported_post_owner", "reported_post_owner_id", "reported_post", "reports_count", "updated_at"], remove: "resolve" },
  { id: "removed-accounts", label: "Activate post", table: "profiles", adminModule: "users", publicProfilesOnly: true, profileStatus: "SUSPENDED", reportSection: true, reportChild: true, activation: true, icon: BadgeCheck, columns: ["reported_post", "full_name", "email", "role", "district", "status", "updated_at"], remove: { status: "ACTIVE" }, noDelete: true, deleteReason: "Use the activation action to restore this user account." },
  { id: "removed-providers", label: "Activate providers", table: "providers", adminModule: "providers", accountStatus: "REMOVED", reportSection: true, reportChild: true, activation: true, icon: BadgeCheck, columns: ["owner_name", "provider_type", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "ACTIVE", public_status: "PUBLISHED" }, noDelete: true, deleteReason: "Use the activation action to restore this provider account." },
  { id: "removed-businesses", label: "Activate businesses", table: "businesses", adminModule: "business", businessSection: true, accountStatus: "REMOVED", reportSection: true, reportChild: true, activation: true, icon: BadgeCheck, columns: ["owner_name", "business_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "ACTIVE", public_status: "PUBLISHED" }, noDelete: true, deleteReason: "Use the activation action to restore this business account." },
  { id: "frozen-subscriptions", label: "Activate subscriptions", table: "provider_subscriptions", adminModule: "subscriptions", subscriptionSection: true, subscriptionStatus: "FROZEN", reportSection: true, reportChild: true, activation: true, icon: BadgeCheck, columns: ["owner_name", "service_name", "provider_type", "district", "status", "current_period_end"], remove: { status: "ACTIVE" }, noDelete: true, deleteReason: "Use the activation action to restore this subscription." },
  { id: "audit", label: "Audit history", table: "admin_actions", icon: FileClock, columns: ["action", "entity_type", "admin_user_id", "created_at"], readonly: true },
  { id: "blocked-accounts", label: "Blocked accounts", table: "profiles", primaryKey: "_row_key", blockedSection: true, icon: ShieldCheck, columns: ["full_name", "email", "phone", "role", "district", "status", "updated_at"], remove: { status: "ACTIVE" }, noDelete: true, deleteReason: "Use Activate to restore a blocked account." },
];
const PROVIDER_RESOURCES = RESOURCES.filter((item) => item.providerType);
const BUSINESS_RESOURCES = RESOURCES.filter((item) => item.businessChild);
const SIDEBAR_RESOURCES = RESOURCES.filter((item) => !item.providerType && !item.businessChild && !item.subscriptionChild && !item.reportChild);

const SUMMARY = [
  { label: "Users", table: "profiles", icon: UsersRound, resource: "profiles", filter: ["role", "TRAVELER"], publicProfilesOnly: true },
  { label: "Providers", table: "providers", icon: Building2, resource: "providers" },
  { label: "Businesses", table: "businesses", icon: BriefcaseBusiness, resource: "businesses" },
  { label: "Subscriptions", table: "provider_subscriptions", icon: ClipboardCheck, resource: "subscriptions" },
  { label: "Places", table: "places", icon: MapPin, resource: "places" },
  { label: "Bookings", table: "bookings", icon: CalendarCheck, resource: "bookings" },
  { label: "Open reports", table: "reports", icon: AlertTriangle, resource: "reports", filter: ["status", "OPEN"] },
];

const IMMUTABLE = new Set(["id", "created_at", "updated_at", "monthly_fee_bdt"]);
const DISPLAY_ONLY = new Set(["profile", "owner_name", "provider_type", "seller_name", "district", "district_name", "division_name", "districts"]);
const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || (import.meta.env.DEV ? "http://127.0.0.1:5175/" : "/");
// Local bypass is intentionally opt-in. Missing environment settings must never open Admin as Super Admin.
const ADMIN_AUTH_BYPASS = import.meta.env.DEV && import.meta.env.VITE_ADMIN_AUTH_BYPASS === "true";
const LOCAL_ADMIN_TABLES = new Set(["profiles", "providers", "businesses", "business_products", "places", "place_relationships", "water_bodies", "provider_verifications", "provider_subscriptions", "guide_profiles", "houseboat_listings", "small_boat_listings", "bookings", "saved_trips", "reviews", "reports", "social_posts", "admin_actions", "admin_accounts"]);
const LOCAL_ADMIN_MUTABLE_TABLES = new Set(["profiles", "providers", "businesses", "business_products", "places", "place_relationships", "water_bodies", "provider_subscriptions", "bookings", "saved_trips", "reviews", "reports", "social_posts"]);
const ADMIN_EDITABLE_FIELDS = {
  profiles: new Set(["full_name", "email", "phone", "bio", "blood_group", "gender", "district", "working_place", "hobby", "present_address", "permanent_address", "avatar_url", "profile_photo_urls", "status", "is_blocked"]),
  providers: new Set(["display_name", "service_name", "bio", "photo_url", "contact_email", "contact_phone", "account_status", "public_status", "is_blocked"]),
  businesses: new Set(["business_name", "description", "district", "contact_email", "contact_phone", "account_status", "public_status", "is_blocked"]),
  business_products: new Set(["name", "description", "price_bdt", "stock_quantity", "image_url", "status"]),
  places: new Set(["district_id", "name", "slug", "upazila_or_area", "category", "latitude", "longitude", "short_description", "best_time", "how_to_reach", "practical_tips", "image_url", "status"]),
  place_relationships: new Set(["relationship_type", "travel_minutes"]),
  water_bodies: new Set(["name", "type", "is_sundarbans", "status", "image_url"]),
  provider_subscriptions: new Set(["status", "current_period_start", "current_period_end", "grace_until", "last_payment_at", "admin_note"]),
  bookings: new Set(["status", "cancelled_by", "cancelled_at", "cancellation_reason"]),
  saved_trips: new Set(["name"]),
  reviews: new Set(["status"]),
  reports: new Set(["status", "admin_note", "resolved_by", "resolved_at", "social_post_id"]),
  social_posts: new Set(["is_hidden"]),
};
const ADMIN_SECTION_STORAGE_KEY = "tourismubd.admin.section";
const EXPLICIT_BLOCKED_STORAGE_KEY = "tourismubd.admin.explicit_blocked_accounts";
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
    const ids = getHiddenPostIds();
    if (hidden) ids.add(postId);
    else ids.delete(postId);
    window.localStorage.setItem(HIDDEN_POSTS_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorage may be restricted
  }
}

function isPostHidden(postId, post) {
  if (post && typeof post.is_hidden === "boolean") return post.is_hidden;
  if (!postId) return false;
  return getHiddenPostIds().has(postId);
}

function getExplicitBlockedAccountMap() {
  try {
    const raw = window.localStorage.getItem(EXPLICIT_BLOCKED_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function setExplicitBlockedAccount(id, isBlocked) {
  if (!id) return;
  try {
    const map = getExplicitBlockedAccountMap();
    map[id] = Boolean(isBlocked);
    window.localStorage.setItem(EXPLICIT_BLOCKED_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage may be unavailable in some environments
  }
}

function isAccountExplicitlyBlocked(row, table) {
  if (!row) return false;
  const map = getExplicitBlockedAccountMap();
  const id = row.id || (table && row._row_key ? row._row_key.replace(`${table}:`, "") : null);
  if (id && typeof map[id] === "boolean") {
    return map[id];
  }
  return Boolean(row.is_blocked);
}

function isAdminSection(section) {
  return section === "overview" || section === "admin-management" || RESOURCES.some((resource) => resource.id === section);
}

function savedAdminSection() {
  try {
    const section = window.sessionStorage.getItem(ADMIN_SECTION_STORAGE_KEY);
    return isAdminSection(section) ? section : "overview";
  } catch {
    return "overview";
  }
}

function publicProfileUrl(userId) {
  const url = new URL(PUBLIC_APP_URL, window.location.origin);
  url.searchParams.set("profile", userId);
  if (import.meta.env.DEV) url.searchParams.set("adminPreview", "1");
  return url.toString();
}

function PublicProfileLink({ provider }) {
  const profileId = provider.user_id || provider.id;
  if (!profileId) return null;
  return <a className="ops-view-profile" href={publicProfileUrl(profileId)} target="_blank" rel="noreferrer" title="View on TourismuBD" aria-label="View profile"><ExternalLink /></a>;
}

async function loadLocalAdminTable(table, { limit = 100, filter, value, ids } = {}) {
  const params = new URLSearchParams({ table, limit: String(limit) });
  if (filter && value) { params.set("filter", filter); params.set("value", value); }
  if (ids?.length) params.set("ids", ids.join(","));
  const response = await fetch(`/__tourismubd-admin/data?${params}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "The local Admin data service is unavailable.");
  return payload.data || [];
}

async function mutateLocalAdminTable(table, method, key, recordId, patch) {
  const params = new URLSearchParams({ table, key, recordId: String(recordId) });
  const response = await fetch(`/__tourismubd-admin/data?${params}`, {
    method,
    headers: patch ? { "Content-Type": "application/json" } : undefined,
    body: patch ? JSON.stringify(patch) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "The local Admin update failed.");
  return payload.data || [];
}

async function callLocalAdminRpc(functionName, args, { requireSuperAdmin = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (requireSuperAdmin && supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  }
  const response = await fetch(`/__tourismubd-admin/rpc?function=${encodeURIComponent(functionName)}`, {
    method: "POST",
    headers,
    body: JSON.stringify(args),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "The local Admin action failed.");
  return payload.data;
}

async function inviteSecondaryAdmin(args, bypassAuth) {
  if (import.meta.env.DEV) return callLocalAdminRpc("invite_secondary_admin", args, { requireSuperAdmin: !bypassAuth });
  const { data, error } = await supabase.functions.invoke("invite-secondary-admin", { body: args });
  if (error) throw new Error(data?.error || error.message || "Could not send the Admin invitation.");
  if (data?.error) throw new Error(data.error);
  return data;
}

async function removeSecondaryAdmin(adminAccountId, bypassAuth) {
  if (import.meta.env.DEV) return callLocalAdminRpc("remove_secondary_admin", { admin_account_id: adminAccountId }, { requireSuperAdmin: !bypassAuth });
  const { data, error } = await supabase.functions.invoke("invite-secondary-admin", { body: { action: "remove", adminAccountId } });
  if (error) throw new Error(data?.error || error.message || "Could not remove the Secondary Admin.");
  if (data?.error) throw new Error(data.error);
  return data;
}

async function deleteAuthUser(userId, bypassAuth) {
  if (import.meta.env.DEV) return callLocalAdminRpc("delete_user", { user_id: userId }, { requireSuperAdmin: !bypassAuth });
  const { data, error } = await supabase.functions.invoke("invite-secondary-admin", { body: { action: "delete_user", userId } });
  if (error) throw new Error(data?.error || error.message || "Could not delete user account.");
  if (data?.error) throw new Error(data.error);
  return data;
}

function Brand() {
  return <span className="ops-brand"><span><Route /></span><b>TourismuBD</b><small>ADMIN</small></span>;
}

function AdminPasswordSetup({ email, onReady }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") || "");
    const confirmation = String(values.get("confirmation") || "");
    if (password.length < 8) return setError("Use at least 8 characters for the password.");
    if (password !== confirmation) return setError("The passwords do not match.");
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) return setError(updateError.message);
    const url = new URL(window.location.href);
    url.searchParams.delete("admin-invite");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    onReady();
  };
  return <main className="ops-login"><section className="ops-login-panel"><Brand /><p className="ops-kicker">Admin invitation</p><h1>Set your Admin password</h1><p>{email} has been granted Admin access. Set a password to finish securely.</p><form onSubmit={submit}><label>New password<input name="password" type="password" minLength="8" required autoComplete="new-password" /></label><label>Confirm password<input name="confirmation" type="password" minLength="8" required autoComplete="new-password" /></label>{error ? <p className="ops-error" role="alert">{error}</p> : null}<button className="ops-button" disabled={saving}><ShieldCheck />{saving ? "Saving..." : "Set password and continue"}</button></form></section></main>;
}

function AdminPasswordChangeDialog({ email, onClose, onChanged }) {
  const dialogRef = useRef(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const values = new FormData(event.currentTarget);
    const currentPassword = String(values.get("currentPassword") || "");
    const password = String(values.get("password") || "");
    const confirmation = String(values.get("confirmation") || "");
    if (password.length < 8) return setError("Use at least 8 characters for the new password.");
    if (password !== confirmation) return setError("The new passwords do not match.");
    if (password === currentPassword) return setError("Choose a new password that is different from the current password.");

    setSaving(true);
    const { error: verificationError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (verificationError) {
      setSaving(false);
      return setError("Your current password is incorrect.");
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) return setError(updateError.message);
    onChanged();
  };

  return <dialog ref={dialogRef} className="ops-dialog ops-password-dialog" onCancel={onClose}>
    <form onSubmit={submit} className="ops-editor ops-password-form">
      <button type="button" className="ops-icon-button ops-close" onClick={onClose} aria-label="Close change password"><X /></button>
      <p className="ops-kicker">Super Admin security</p>
      <h2>Change password</h2>
      <p className="ops-password-help">Confirm your current password, then choose a new password with at least 8 characters. You will be signed out after it changes.</p>
      <label>Current password<input name="currentPassword" type="password" required autoComplete="current-password" /></label>
      <label>New password<input name="password" type="password" minLength="8" required autoComplete="new-password" /></label>
      <label>Confirm new password<input name="confirmation" type="password" minLength="8" required autoComplete="new-password" /></label>
      {error ? <p className="ops-error" role="alert">{error}</p> : null}
      <div className="ops-dialog-actions"><button type="button" className="ops-button secondary" onClick={onClose} disabled={saving}>Cancel</button><button className="ops-button" disabled={saving}><KeyRound />{saving ? "Changing..." : "Change password"}</button></div>
    </form>
  </dialog>;
}

function adminPasswordRecoveryUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("admin-invite");
  url.searchParams.set("admin-recovery", "1");
  return url.toString();
}

function adminAuthErrorMessage(error, action) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  if (message === "fetch failed" || /failed to fetch/i.test(message)) {
    return "Could not reach Supabase. Your free Supabase project is likely paused due to 7 days of inactivity. Restore it in your Supabase dashboard or set VITE_ADMIN_AUTH_BYPASS=true in .env for local dev.";
  }
  if (message && message !== "{}") return message;
  return `Supabase could not ${action} because its outgoing email service is unavailable. Configure SMTP in Authentication > SMTP Settings, then try again.`;
}

async function validateRecoveryEmail(email) {
  if (!import.meta.env.DEV) return null;
  let response;
  try {
    response = await fetch("/__tourismubd-admin/recovery-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch (networkErr) {
    throw new Error("Could not reach local Admin dev server (port 5176). Ensure 'npm run dev:admin' is running.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Enter the active Super Admin email.");
  return payload.data?.recoveryLink || null;
}

function AdminPasswordRecoveryRequest({ onReturnToSignIn, initialError = "" }) {
  const [error, setError] = useState(initialError);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [cooldownDone, setCooldownDone] = useState(false);
  const [devLink, setDevLink] = useState(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    setCooldownDone(false);
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          setError("");
          setCooldownDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const submit = async (event) => {
    event.preventDefault();
    if (cooldown > 0) return;
    setError("");
    setCooldownDone(false);
    const email = String(new FormData(event.currentTarget).get("email") || "").trim().toLowerCase();
    let localDevLink = null;
    try {
      localDevLink = await validateRecoveryEmail(email);
      if (localDevLink) setDevLink(localDevLink);
    } catch (validationError) {
      return setError(validationError instanceof Error ? validationError.message : "Enter the active Super Admin email.");
    }
    setSending(true);
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: adminPasswordRecoveryUrl() });
    setSending(false);
    if (recoveryError) {
      const match = recoveryError.message?.match(/after\s+(\d+)\s+seconds/i);
      if (match) {
        const secs = parseInt(match[1], 10) || 60;
        setCooldown(secs);
        return setError(`For security purposes, you can only request this after ${secs} seconds. Check your Gmail inbox and spam folder if you already requested one.`);
      }
      return setError(adminAuthErrorMessage(recoveryError, "send the password-reset email"));
    }
    setSentEmail(email);
    setSent(true);
  };

  if (sent) {
    return (
      <main className="ops-login">
        <section className="ops-login-panel">
          <Brand />
          <p className="ops-kicker">Password recovery</p>
          <h1>Check your email</h1>
          <p className="ops-success" role="status">
            A password-reset link was sent to <strong>{sentEmail}</strong>. Check your email, then return here and sign in.
          </p>
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noreferrer"
            className="ops-button"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", textDecoration: "none", marginBottom: "0.75rem" }}
          >
            <Mail /> Open Gmail
          </a>
          {import.meta.env.DEV && devLink ? (
            <a
              href={devLink}
              className="ops-button secondary"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", textDecoration: "none", marginBottom: "0.75rem" }}
            >
              <KeyRound /> Reset password directly (Instant dev link)
            </a>
          ) : null}
          <button type="button" className="ops-button secondary" onClick={onReturnToSignIn}>
            Return to sign in
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="ops-login">
      <section className="ops-login-panel">
        <Brand />
        <p className="ops-kicker">Password recovery</p>
        <h1>Reset Admin password</h1>
        <p>Enter the active Super Admin email. We will send a secure link to choose a new password.</p>
        <form onSubmit={submit}>
          <label>
            Choose Admin email
            <input
              name="email"
              type="email"
              list="admin-emails"
              defaultValue="mdabdullah200211@gmail.com"
              required
              autoComplete="email"
              placeholder="mdabdullah200211@gmail.com"
            />
            <datalist id="admin-emails">
              <option value="mdabdullah200211@gmail.com">mdabdullah200211@gmail.com (Super Admin)</option>
            </datalist>
          </label>
          {cooldown > 0 ? (
            <div style={{ margin: "1rem 0", padding: "0.75rem", background: "rgba(229,169,60,0.12)", border: "1px solid rgba(229,169,60,0.35)", borderRadius: "8px", fontSize: "0.88rem", lineHeight: "1.4" }}>
              <p style={{ margin: "0 0 0.25rem 0", fontWeight: "bold", color: "var(--ops-accent, #e5a93c)" }}>
                Rate-limit cooldown active ({cooldown}s remaining)
              </p>
              <p style={{ margin: 0 }}>
                Supabase limits requests to 1 every 60 seconds. When the timer finishes, click the button below to send the email. Also check your Gmail inbox and Spam folder now.
              </p>
            </div>
          ) : cooldownDone ? (
            <p className="ops-success" role="status" style={{ margin: "0.75rem 0" }}>
              ✓ Cooldown finished! Click <strong>Send reset link</strong> below to send the email.
            </p>
          ) : error ? (
            <p className="ops-error" role="alert">{error}</p>
          ) : null}
          <button
            className="ops-button"
            disabled={sending || cooldown > 0}
            style={cooldownDone ? { background: "var(--ops-accent, #e5a93c)", color: "#111", fontWeight: "bold" } : {}}
          >
            <Mail />
            {sending ? "Sending..." : cooldown > 0 ? `Wait ${cooldown}s before sending` : cooldownDone ? "Send reset link now" : "Send reset link"}
          </button>
          <button type="button" className="ops-button secondary" onClick={onReturnToSignIn}>
            Return to sign in
          </button>
        </form>
      </section>
    </main>
  );
}

function AdminPasswordRecovery({ email, onReady }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") || "");
    const confirmation = String(values.get("confirmation") || "");
    if (password.length < 8) return setError("Use at least 8 characters for the new password.");
    if (password !== confirmation) return setError("The new passwords do not match.");
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) return setError(updateError.message);
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("admin-recovery");
    cleanUrl.hash = "";
    window.history.replaceState(null, "", `${cleanUrl.pathname}${cleanUrl.search}`);
    await supabase.auth.signOut();
    onReady();
  };
  return (
    <main className="ops-login">
      <section className="ops-login-panel">
        <Brand />
        <p className="ops-kicker">Password recovery</p>
        <h1>Choose a new password</h1>
        <p>Create a new password for {email}. You will then sign in with it.</p>
        <form onSubmit={submit}>
          <label>
            New password
            <input name="password" type="password" minLength="8" required autoComplete="new-password" placeholder="At least 8 characters" />
          </label>
          <label>
            Confirm password
            <input name="confirmation" type="password" minLength="8" required autoComplete="new-password" placeholder="Confirm new password" />
          </label>
          {error ? <p className="ops-error" role="alert">{error}</p> : null}
          <button className="ops-button" disabled={saving}>
            <ShieldCheck />
            {saving ? "Saving..." : "Set new password"}
          </button>
        </form>
      </section>
    </main>
  );
}

function AccessGate({ onAccess }) {
  const [state, setState] = useState({ loading: true, session: null, profile: null, access: null });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [inviteSetup, setInviteSetup] = useState(() => new URLSearchParams(window.location.search).get("admin-invite") === "1");
  const [recoverySetup, setRecoverySetup] = useState(() => {
    if (typeof window === "undefined") return false;
    const search = new URLSearchParams(window.location.search);
    const hash = window.location.hash || "";
    return search.get("admin-recovery") === "1" || hash.includes("type=recovery");
  });
  const hasExpiredLink = typeof window !== "undefined" && (
    window.location.hash.includes("otp_expired") ||
    window.location.hash.includes("error_code=otp_expired") ||
    window.location.hash.includes("invalid+or+has+expired")
  );
  const [recoveryRequest, setRecoveryRequest] = useState(() => hasExpiredLink);

  useEffect(() => {
    let active = true;
    const check = async (session) => {
      if (!active) return;
      if (!session?.user) return setState({ loading: false, session: null, profile: null, access: null });
      const result = await supabase.from("profiles").select("full_name,email,role,status").eq("id", session.user.id).single();
      if (!active) return;
      if (result.error) {
        setError(result.error.message);
        setState({ loading: false, session, profile: null, access: null });
        return;
      }
      const accessResult = await supabase.rpc("current_admin_access");
      if (!active) return;
      let adminAccess = accessResult.data?.[0] || null;
      if (!adminAccess && result.data?.role === "SUPER_ADMIN" && result.data?.status === "ACTIVE") {
        adminAccess = { role: "super_admin", is_active: true };
      }
      setState({ loading: false, session, profile: result.data || null, access: adminAccess });
      if (adminAccess) {
        setError("");
      } else if (accessResult.error) {
        setError(accessResult.error.message);
      }
    };
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecoverySetup(true);
      check(session);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  const login = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    const values = new FormData(event.currentTarget);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: String(values.get("email") || "").trim().toLowerCase(), password: values.get("password") });
    if (loginError) setError(/invalid login credentials/i.test(loginError.message) ? "Email or password is incorrect. Use the Super Admin password set in Supabase Auth, or reset it with Forgot password." : loginError.message);
  };

  const allowed = hasAdminAccess(state.access) || (state.profile?.role === "SUPER_ADMIN" && state.profile?.status === "ACTIVE");
  const isSuperAdminEmail = state.session?.user?.email?.toLowerCase() === "mdabdullah200211@gmail.com";
  const canRecoverAdmin = Boolean(state.session?.user) && (allowed || isSuperAdmin(state.access) || state.profile?.role === "SUPER_ADMIN" || isSuperAdminEmail || Boolean(state.session?.user));

  useEffect(() => { if (allowed && !inviteSetup && !recoverySetup) onAccess(state.session.user, state.profile, state.access); }, [allowed, inviteSetup, onAccess, recoverySetup, state.access, state.profile, state.session]);

  if (state.loading) return <div className="ops-gate"><RefreshCw className="ops-spin" /><p>Checking admin access...</p></div>;
  if (canRecoverAdmin && recoverySetup) {
    return (
      <AdminPasswordRecovery
        email={state.session.user.email}
        onReady={() => {
          setError("");
          setRecoverySetup(false);
          setRecoveryRequest(false);
          setSuccessMessage("Your Super Admin password has been updated. Sign in with your new password.");
        }}
      />
    );
  }
  if (allowed && inviteSetup) return <AdminPasswordSetup email={state.session.user.email} onReady={() => setInviteSetup(false)} />;
  if (allowed) return <div className="ops-gate"><RefreshCw className="ops-spin" /><p>Opening operations...</p></div>;
  if (state.session) return (
    <main className="ops-login">
      <section className="ops-login-panel"><Brand /><div className="ops-denied-icon"><ShieldCheck /></div><p className="ops-kicker">Access denied</p><h1>Admin access is required.</h1><p>{state.session.user.email} is signed in, but this account is not an active Admin.</p>{error ? <p className="ops-error">{error}</p> : null}<button className="ops-button" onClick={() => supabase.auth.signOut()}><LogOut /> Sign out</button><a href={PUBLIC_APP_URL}>Return to TourismuBD</a></section>
    </main>
  );
  if (recoveryRequest || hasExpiredLink) {
    return (
      <AdminPasswordRecoveryRequest
        initialError={hasExpiredLink ? "This password-recovery link has expired or was already used. Request a new reset link below." : ""}
        onReturnToSignIn={() => {
          setRecoveryRequest(false);
          if (hasExpiredLink) {
            const cleanUrl = new URL(window.location.href);
            cleanUrl.hash = "";
            window.history.replaceState(null, "", `${cleanUrl.pathname}${cleanUrl.search}`);
          }
        }}
      />
    );
  }
  return (
    <main className="ops-login">
      <section className="ops-login-panel">
        <Brand /><p className="ops-kicker">Restricted operations</p><h1>Admin sign in</h1><p>Use your approved Gmail or account email and password.</p>
        <form onSubmit={login}>
          <label>Email<input name="email" type="email" required autoComplete="username" placeholder="admin@gmail.com" /></label>
          <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
          {successMessage ? <p className="ops-success" role="status">{successMessage}</p> : null}
          {error || recoverySetup ? <p className="ops-error" role="alert">{error || "This password-recovery link has expired or was already used. Request a new reset link, then open it first on this computer."}</p> : null}
          <button className="ops-button"><ShieldCheck /> Sign in securely</button>
          <button type="button" className="ops-text-button" onClick={() => { setError(""); setSuccessMessage(""); setRecoveryRequest(true); }}>Forgot password?</button>
        </form>
        <a href={PUBLIC_APP_URL}>Return to TourismuBD</a>
      </section>
    </main>
  );
}

function Editor({ resource, row, userId, bypassAuth, onClose, onSaved }) {
  const dialogRef = useRef(null);
  const primaryKey = resource.primaryKey || "id";
  const editingSelf = resource.id === "profiles" && !canManageProfile(userId, row.id);
  const allowedFields = ADMIN_EDITABLE_FIELDS[resource.table];
  const editable = Object.fromEntries(Object.entries(row).filter(([key]) => !IMMUTABLE.has(key) && (!allowedFields || allowedFields.has(key)) && (!resource.businessSection || !["user_id", "business_id"].includes(key)) && (!DISPLAY_ONLY.has(key) || (resource.table === "businesses" && key === "district")) && key !== primaryKey && !(editingSelf && ["role", "status"].includes(key))));
  const [value, setValue] = useState(JSON.stringify(editable, null, 2));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { dialogRef.current?.showModal(); }, []);
  const save = async (event) => {
    event.preventDefault();
    setError("");
    let patch;
    try { patch = JSON.parse(value); } catch { return setError("The record must be valid JSON."); }
    if (!patch || Array.isArray(patch) || typeof patch !== "object") return setError("The record must be a JSON object.");
    if (editingSelf) { delete patch.role; delete patch.status; }
    setSaving(true);
    const key = resource.primaryKey || "id";
    let result;
    if (bypassAuth && LOCAL_ADMIN_MUTABLE_TABLES.has(resource.table)) {
      try {
        const data = await mutateLocalAdminTable(resource.table, "PATCH", key, row[key], patch);
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else {
      result = await supabase.from(resource.table).update(patch).eq(key, row[key]).select(key).maybeSingle();
    }
    setSaving(false);
    if (result.error) return setError(result.error.message);
    if (!result.data) return setError("No record was updated. Your access may have changed.");
    onSaved("Record updated.");
  };
  return (
    <dialog ref={dialogRef} className="ops-dialog" onCancel={onClose}>
      <form onSubmit={save} className="ops-editor"><button type="button" className="ops-icon-button ops-close" onClick={onClose} aria-label="Close editor"><X /></button><p className="ops-kicker">{resource.label}</p><h2>Edit record</h2><label>Record fields<textarea value={value} onChange={(event) => setValue(event.target.value)} spellCheck="false" rows="18" /></label>{error ? <p className="ops-error" role="alert">{error}</p> : null}<div className="ops-dialog-actions"><button type="button" className="ops-button secondary" onClick={onClose}>Cancel</button><button className="ops-button" disabled={saving}><Pencil /> {saving ? "Saving..." : "Save changes"}</button></div></form>
    </dialog>
  );
}

function ImageUploader({
  currentUrl = "",
  onImageSelected,
  label = "Picture",
  previewHeight = 160,
  bucket = "system-media",
}) {
  const [mode, setMode] = useState("file");
  const [urlInput, setUrlInput] = useState(currentUrl || "");
  const [previewUrl, setPreviewUrl] = useState(currentUrl || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setUrlInput(currentUrl || "");
    setPreviewUrl(currentUrl || "");
  }, [currentUrl]);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Please choose a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB.");
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const filePath = `uploads/${fileName}`;

      if (supabase?.storage) {
        try {
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, { cacheControl: "3600", upsert: true, contentType: file.type });

          if (!uploadError) {
            const publicUrlData = supabase.storage.from(bucket).getPublicUrl(filePath);
            const finalUrl = publicUrlData.data?.publicUrl;
            if (finalUrl) {
              setPreviewUrl(finalUrl);
              setUrlInput(finalUrl);
              onImageSelected?.(finalUrl);
              setUploading(false);
              return;
            }
          }
        } catch {}
      }

      // Try local admin server upload endpoint for lightweight URL
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch("/__tourismubd-admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl, filename: file.name }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data?.url) {
            setPreviewUrl(json.data.url);
            setUrlInput(json.data.url);
            onImageSelected?.(json.data.url);
            setUploading(false);
            return;
          }
        }

        // Fallback to data URL if local endpoint also fails
        setPreviewUrl(dataUrl);
        setUrlInput(dataUrl);
        onImageSelected?.(dataUrl);
        setUploading(false);
      } catch {
        setError("Upload failed. Please try again.");
        setUploading(false);
      }
    } catch (err) {
      setError(err?.message || "Upload failed. Please try again.");
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer?.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUrlChange = (val) => {
    setUrlInput(val);
    setPreviewUrl(val.trim());
    setError("");
    onImageSelected?.(val.trim());
  };

  return (
    <div className="ops-image-uploader">
      <div className="ops-uploader-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "file"}
          className={`ops-uploader-tab ${mode === "file" ? "active" : ""}`}
          onClick={() => setMode("file")}
        >
          <UploadCloud size={14} /> Upload File
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "url"}
          className={`ops-uploader-tab ${mode === "url" ? "active" : ""}`}
          onClick={() => setMode("url")}
        >
          <Link size={14} /> Paste Image URL
        </button>
      </div>

      {mode === "file" ? (
        <div
          className={`ops-dropzone ${dragActive ? "drag-active" : ""} ${uploading ? "uploading" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <UploadCloud className="ops-dropzone-icon" size={26} />
          <p className="ops-dropzone-primary">
            {uploading ? "Uploading to storage..." : "Drag & drop an image here, or click to browse"}
          </p>
          <span className="ops-dropzone-hint">Supports JPG, PNG, WebP up to 10MB</span>
        </div>
      ) : (
        <div className="ops-url-input-wrap">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://images.unsplash.com/... or Google Image link"
            className="ops-image-url-field"
          />
        </div>
      )}

      {error ? <p className="ops-uploader-error">{error}</p> : null}

      {previewUrl ? (
        <div className="ops-uploader-preview-box">
          <div className="ops-uploader-preview-img-wrap" style={{ maxHeight: `${previewHeight}px` }}>
            <img
              src={previewUrl}
              alt="Preview"
              onError={() => setError("Image could not be loaded from this URL.")}
            />
          </div>
          <div className="ops-uploader-preview-bar">
            <span className="ops-uploader-preview-label"><Check size={14} /> Image Selected</span>
            <button
              type="button"
              className="ops-uploader-clear-btn"
              onClick={() => {
                setPreviewUrl("");
                setUrlInput("");
                onImageSelected?.("");
              }}
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PlaceEditor({ row, districts, bypassAuth, onClose, onSaved }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(() => ({
    district_id: row?.district_id || districts[0]?.id || "",
    name: row?.name || "",
    slug: row?.slug || "",
    upazila_or_area: row?.upazila_or_area || "",
    category: row?.category || "Tourist place",
    latitude: row?.latitude ?? "",
    longitude: row?.longitude ?? "",
    short_description: row?.short_description || "",
    best_time: row?.best_time || "November to March",
    how_to_reach: row?.how_to_reach || "",
    practical_tips: row?.practical_tips || "",
    image_url: row?.image_url || "",
    status: row?.status || "DRAFT",
  }));
  const [slugEdited, setSlugEdited] = useState(Boolean(row?.slug));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { dialogRef.current?.showModal(); }, []);
  const update = (field, value) => setForm((current) => ({
    ...current,
    [field]: value,
    ...(field === "name" && !slugEdited ? { slug: slugifyPlaceName(value) } : {}),
  }));
  const save = async (event) => {
    event.preventDefault();
    setError("");
    let payload;
    try { payload = buildPlacePayload(form); } catch (placeError) { return setError(placeError.message); }
    setSaving(true);
    let result;
    if (bypassAuth) {
      try {
        const data = await mutateLocalAdminTable("places", row ? "PATCH" : "POST", "id", row?.id || "", payload);
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else {
      let request = supabase.from("places");
      request = row ? request.update(payload).eq("id", row.id) : request.insert(payload);
      result = await request.select("id").maybeSingle();
    }
    setSaving(false);
    if (result.error) return setError(result.error.message);
    if (!result.data) return setError(`The tourist place was not ${row ? "updated" : "created"}. Your access may have changed.`);
    onSaved(row ? "Tourist place updated." : "Tourist place added.");
  };

  return (
    <dialog ref={dialogRef} className="ops-dialog ops-place-dialog" onCancel={onClose}>
      <form onSubmit={save} className="ops-editor ops-place-editor">
        <button type="button" className="ops-icon-button ops-close" onClick={onClose} aria-label="Close place editor"><X /></button>
        <p className="ops-kicker">Destination management</p>
        <h2>{row ? "Edit tourist place" : "Add tourist place"}</h2>
        <div className="ops-form-grid">
          <label>District<select value={form.district_id} onChange={(event) => update("district_id", event.target.value)} required><option value="">Choose district</option>{districts.map((district) => <option value={district.id} key={district.id}>{district.name}, {district.division}{district.status === "PUBLISHED" ? "" : ` (${district.status.toLowerCase()})`}</option>)}</select></label>
          <label>Status<select value={form.status} onChange={(event) => update("status", event.target.value)}>{PLACE_STATUSES.map((status) => <option value={status} key={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</option>)}</select></label>
          <label>Place name<input value={form.name} onChange={(event) => update("name", event.target.value)} required /></label>
          <label>Slug<input value={form.slug} onChange={(event) => { setSlugEdited(true); update("slug", event.target.value); }} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>
          <label>Upazila or area<input value={form.upazila_or_area} onChange={(event) => update("upazila_or_area", event.target.value)} /></label>
          <label>Category<input value={form.category} onChange={(event) => update("category", event.target.value)} /></label>
          <label>Latitude<input type="number" step="any" min="-90" max="90" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} required /></label>
          <label>Longitude<input type="number" step="any" min="-180" max="180" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} required /></label>
          <div className="wide ops-form-uploader-field">
            <label>Cover picture (Upload file or paste URL)</label>
            <ImageUploader
              currentUrl={form.image_url}
              onImageSelected={(url) => update("image_url", url)}
              label="Cover picture"
            />
          </div>
          <label className="wide">Short description<textarea value={form.short_description} onChange={(event) => update("short_description", event.target.value)} rows="3" /></label>
          <label>Best time<textarea value={form.best_time} onChange={(event) => update("best_time", event.target.value)} rows="3" /></label>
          <label>How to reach<textarea value={form.how_to_reach} onChange={(event) => update("how_to_reach", event.target.value)} rows="3" /></label>
          <label className="wide">Practical tips<textarea value={form.practical_tips} onChange={(event) => update("practical_tips", event.target.value)} rows="3" /></label>
        </div>
        {error ? <p className="ops-error" role="alert">{error}</p> : null}
        <div className="ops-dialog-actions"><button type="button" className="ops-button secondary" onClick={onClose}>Cancel</button><button className="ops-button" disabled={saving}>{row ? <Pencil /> : <Plus />}{saving ? "Saving..." : row ? "Save changes" : "Add place"}</button></div>
      </form>
    </dialog>
  );
}

function DeleteRecordDialog({ resource, row, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  const recordName = row._is_post
    ? (row.reported_post ? (row.reported_post.length > 50 ? `${row.reported_post.slice(0, 47)}...` : row.reported_post) : row.id)
    : (row.name || row.display_name || row.full_name || row.business_name || row.contact_email || row.email || row.id);
  const isAuthAccount = ["profiles", "providers", "businesses"].includes(resource.table);
  useEffect(() => { dialogRef.current?.showModal(); }, []);
  return <dialog ref={dialogRef} className="ops-dialog" onCancel={onClose}>
    <section className="ops-editor">
      <button type="button" className="ops-icon-button ops-close" onClick={onClose} aria-label="Close delete confirmation"><X /></button>
      <p className="ops-kicker">Permanent action</p>
      <h2>Delete record?</h2>
      <p>Delete <b>{recordName}</b> from {resource.label.toLowerCase()}? {isAuthAccount ? "This permanently deletes this account and its Supabase Auth identity from the system." : "This cannot be undone."}</p>
      <div className="ops-dialog-actions"><button type="button" className="ops-button secondary" onClick={onClose}>Cancel</button><button type="button" className="ops-button danger" onClick={() => onConfirm(row)}><Trash2 />Delete permanently</button></div>
    </section>
  </dialog>;
}

function AccountActionDialog({ resource, row, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  const isExplicitBlock = Boolean(row._forceBlock);
  const restoring = !isExplicitBlock && (Boolean(resource.activation) || resource.id === "blocked-accounts");
  const blocking = isExplicitBlock || (!restoring && (resource.id === "profiles" || resource.table === "providers" || resource.businessSection));
  const recordName = isExplicitBlock && (row._is_post || row.reported_post_owner_id)
    ? (row.reported_post_owner || row.full_name || row.owner_name || "member")
    : row._is_post
      ? (row.reported_post ? (row.reported_post.length > 50 ? `${row.reported_post.slice(0, 47)}...` : row.reported_post) : row.id)
      : (row.owner_name || row.display_name || row.full_name || row.business_name || row.id);
  const action = restoring ? "Activate" : blocking ? "Block" : resource.id === "reports" ? "Resolve" : "Remove";
  const entityType = isExplicitBlock ? "account" : row._is_post ? "post" : "account";
  useEffect(() => { dialogRef.current?.showModal(); }, []);
  return <dialog ref={dialogRef} className="ops-dialog" onCancel={onClose}>
    <section className="ops-editor">
      <button type="button" className="ops-icon-button ops-close" onClick={onClose} aria-label="Close account action"><X /></button>
      <p className="ops-kicker">{isExplicitBlock ? "Account action" : row._is_post ? "Post action" : "Account action"}</p>
      <h2>{action} {entityType}?</h2>
      <p>{restoring
        ? row._is_post
          ? <>Restore this post by <b>{row.full_name || "member"}</b> to active use?</>
          : <>Restore <b>{recordName}</b> and its linked services to active use?</>
        : isExplicitBlock
          ? <>Move <b>{recordName}</b> to Blocked accounts?</>
          : blocking
            ? <>Move <b>{recordName}</b> to Activate accounts?</>
            : <>Apply this action to <b>{recordName}</b>?</>
      }</p>
      <div className="ops-dialog-actions"><button type="button" className="ops-button secondary" onClick={onClose}>Cancel</button><button type="button" className={restoring ? "ops-button" : "ops-button danger"} onClick={() => onConfirm(row)}>{isExplicitBlock ? <ShieldAlert /> : <Archive />}{action} {entityType}</button></div>
    </section>
  </dialog>;
}

function ReportAccountRemovalDialog({ report, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  const accountName = report.reported_post_owner || "this account";
  const target = report.admin_action_target || (report.social_post_id ? "post" : "account");
  const isPostTarget = target === "post";
  const providerTarget = target === "provider";
  const subscriptionTarget = target === "subscription";
  const bookingTarget = target === "booking";
  const businessTarget = target === "business";
  useEffect(() => { dialogRef.current?.showModal(); }, []);
  return <dialog ref={dialogRef} className="ops-dialog" onCancel={onClose}>
    <section className="ops-editor">
      <button type="button" className="ops-icon-button ops-close" onClick={onClose} aria-label="Close account removal confirmation"><X /></button>
      <p className="ops-kicker">Report action</p>
      <h2>{isPostTarget ? "Remove post from active use?" : bookingTarget ? "Cancel booking?" : subscriptionTarget ? "Freeze subscription?" : providerTarget ? "Remove provider?" : businessTarget ? "Remove business?" : "Remove account?"}</h2>
      <p>{isPostTarget ? <>Remove this post by <b>{accountName}</b> from active use and hide it from user feeds. It will move to the Activate Post Page, and its report history will remain preserved.</> : bookingTarget ? <>Cancel booking <b>{report.reported_booking_record?.id}</b>. The report will be marked resolved, and booking history will be retained.</> : subscriptionTarget ? <>Freeze <b>{report.reported_subscription_record?.service_name || accountName}</b> and keep it available in Activate subscriptions. The provider account will remain active. The report will be marked resolved.</> : providerTarget ? <>Move <b>{accountName}</b> out of active use and hide it from public search. It will remain available in Activate providers. The report will be marked resolved.</> : businessTarget ? <>Move <b>{report.reported_business_record?.business_name || accountName}</b> out of active use and hide it from public search. The owner’s login will remain intact, and the business will be available in Activate businesses. The report will be marked resolved.</> : <>Suspend <b>{accountName}</b>, hide the account from public search, and keep it available for later activation. The report will be marked resolved.</>}</p>
      <div className="ops-dialog-actions"><button type="button" className="ops-button secondary" onClick={onClose}>Cancel</button><button type="button" className="ops-button danger" onClick={() => onConfirm(report)}><Archive />{isPostTarget ? "Remove post" : bookingTarget ? "Cancel booking" : subscriptionTarget ? "Freeze subscription" : providerTarget ? "Remove provider" : businessTarget ? "Remove business" : "Remove account"}</button></div>
    </section>
  </dialog>;
}

function ProfileField({ label, value, wide = false }) {
  const shown = Array.isArray(value) ? value.join(", ") : value;
  return <div className={wide ? "ops-profile-field wide" : "ops-profile-field"}><span>{label}</span><strong>{shown || "Not provided"}</strong></div>;
}

function reportReasons(report) {
  if (report.reason_categories?.length) return report.reason_categories;
  const match = report.details?.match(/^Report reasons:\s*(.+?)(?:\n\n|$)/);
  return match ? match[1].split(" | ") : [];
}

function bookingEndDate(startDate, durationDays) {
  if (!startDate) return null;
  const end = new Date(`${startDate}T12:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  end.setDate(end.getDate() + Math.max(1, Number(durationDays) || 1) - 1);
  return end.toISOString().slice(0, 10);
}

function BookingHistoryDialog({ provider, onClose, onCancelBooking }) {
  const dialogRef = useRef(null);
  const bookings = [...(provider.booking_records || [])].sort((left, right) => Date.parse(right.created_at || "") - Date.parse(left.created_at || ""));
  useEffect(() => { dialogRef.current?.showModal(); }, []);
  return <dialog ref={dialogRef} className="ops-dialog ops-provider-dialog" onCancel={onClose}>
    <section className="ops-provider-profile">
      <button type="button" className="ops-icon-button ops-close" onClick={onClose} aria-label="Close booking history"><X /></button>
      <header className="ops-provider-header"><div className="ops-provider-avatar"><BookOpenCheck /></div><div><p className="ops-kicker">Provider bookings</p><h2>{provider.service_name || provider.provider_name}</h2><p>{provider.provider_name} · {bookings.length} booking{bookings.length === 1 ? "" : "s"}</p></div></header>
      <section className="ops-profile-section"><h3>Booking history</h3><div className="ops-booking-history">{bookings.map((booking) => <article key={booking.id}>
        <div className="ops-booking-history-head"><div><p className="ops-kicker">{booking.service_type?.replaceAll("_", " ")}</p><h4>{booking.traveler_name}</h4></div><span className={`ops-status ${booking.status === "COMPLETED" ? "active" : ""}`}>{booking.status}</span></div>
        <div className="ops-profile-grid"><ProfileField label="Traveler" value={booking.traveler_name} /><ProfileField label="Traveler count" value={booking.traveler_count} /><ProfileField label="Start date" value={booking.start_date} /><ProfileField label="End date" value={bookingEndDate(booking.start_date, booking.duration_days)} /><ProfileField label="Duration" value={booking.duration_days ? `${booking.duration_days} day${booking.duration_days === 1 ? "" : "s"}` : null} /><ProfileField label="Booking requested" value={booking.created_at ? new Date(booking.created_at).toLocaleString() : null} /><ProfileField label="Traveler email" value={booking.traveler_profile?.email} /><ProfileField label="Traveler phone" value={booking.traveler_profile?.phone} /><ProfileField label="Contact permission" value={booking.traveler_contact_consent ? "Granted" : "Not granted"} /><ProfileField label="Booking ID" value={booking.id} /><ProfileField label="Traveler note" value={booking.note} wide /></div>
        {onCancelBooking && ["PENDING", "CONFIRMED"].includes(booking.status) ? <div className="ops-dialog-actions"><button type="button" className="ops-button danger" onClick={() => onCancelBooking(booking)}><Archive />Cancel booking</button></div> : null}
      </article>)}</div></section>
    </section>
  </dialog>;
}

function ReportedPostDialog({ report, onClose, bypassAuth = false }) {
  const dialogRef = useRef(null);
  const initialPost = report.reported_post_record || null;
  const [postRecord, setPostRecord] = useState(initialPost);
  const [mediaUrl, setMediaUrl] = useState(initialPost?.media_url || report.media_url || "");
  const [loadingMedia, setLoadingMedia] = useState(!initialPost?.media_url && !report.media_url && Boolean(initialPost?.media_path || report.social_post_id));

  useEffect(() => { dialogRef.current?.showModal(); }, []);

  useEffect(() => {
    let active = true;
    const currentPost = postRecord || report.reported_post_record;
    if (currentPost?.media_url) {
      setMediaUrl(currentPost.media_url);
      setLoadingMedia(false);
      return;
    }
    const path = currentPost?.media_path;
    if (path) {
      const fetchUrl = async () => {
        try {
          if (bypassAuth) {
            const response = await fetch(`/__tourismubd-admin/post-media?path=${encodeURIComponent(path)}`);
            const payload = await response.json();
            if (active && response.ok && payload.url) setMediaUrl(payload.url);
          } else {
            const { data } = await supabase.storage.from("social-posts").createSignedUrl(path, 3600);
            if (active && data?.signedUrl) setMediaUrl(data.signedUrl);
          }
        } catch {}
        finally {
          if (active) setLoadingMedia(false);
        }
      };
      fetchUrl();
      return;
    }
    if (!currentPost && report.social_post_id) {
      const fetchPostAndMedia = async () => {
        try {
          let loadedPost = null;
          if (bypassAuth) {
            const posts = await loadLocalAdminTable("social_posts", { limit: 1, filter: "id", value: report.social_post_id });
            loadedPost = posts?.[0] || null;
          } else {
            const { data } = await supabase.from("social_posts").select("id,author_id,body,product_name,media_type,media_path,location_name,created_at,is_hidden").eq("id", report.social_post_id).maybeSingle();
            loadedPost = data || null;
          }
          if (!active) return;
          if (loadedPost) {
            setPostRecord(loadedPost);
            if (loadedPost.media_path) {
              if (bypassAuth) {
                const response = await fetch(`/__tourismubd-admin/post-media?path=${encodeURIComponent(loadedPost.media_path)}`);
                const payload = await response.json();
                if (active && response.ok && payload.url) setMediaUrl(payload.url);
              } else {
                const { data: signData } = await supabase.storage.from("social-posts").createSignedUrl(loadedPost.media_path, 3600);
                if (active && signData?.signedUrl) setMediaUrl(signData.signedUrl);
              }
            }
          }
        } catch {}
        finally {
          if (active) setLoadingMedia(false);
        }
      };
      fetchPostAndMedia();
      return;
    }
    setLoadingMedia(false);
    return () => { active = false; };
  }, [bypassAuth, postRecord, report.reported_post_record, report.social_post_id]);

  const post = postRecord || report.reported_post_record;
  const activeMediaUrl = mediaUrl || post?.media_url;

  return <dialog ref={dialogRef} className="ops-dialog ops-provider-dialog" onCancel={onClose}>
    <section className="ops-provider-profile">
      <button type="button" className="ops-icon-button ops-close" onClick={onClose} aria-label="Close reported post"><X /></button>
      <header className="ops-provider-header"><div className="ops-provider-avatar"><AlertTriangle /></div><div><p className="ops-kicker">Reported timeline update</p><h2>{report.reported_post_owner || "TourismuBD member"}</h2><p>{post?.created_at ? new Date(post.created_at).toLocaleString() : "Date not available"}</p></div></header>
      <section className="ops-profile-section">
        <h3>Post content</h3>
        {post?.product_name ? <p className="ops-reported-post-product">{post.product_name}</p> : null}
        <p className="ops-reported-post-body">{post?.body || "This timeline post is no longer available."}</p>
        {post?.location_name ? <p className="ops-reported-post-location"><MapPin />{post.location_name}</p> : null}
        {activeMediaUrl ? (
          post?.media_type === "VIDEO"
            ? <video className="ops-reported-post-media" controls preload="metadata" src={activeMediaUrl} />
            : <img className="ops-reported-post-media" src={activeMediaUrl} alt="Reported post attachment" />
        ) : loadingMedia ? (
          <p className="people-note">Loading attachment...</p>
        ) : null}
      </section>
      <section className="ops-profile-section"><h3>Post record</h3><div className="ops-profile-grid"><ProfileField label="Post ID" value={report.social_post_id} wide /><ProfileField label="Post owner ID" value={report.reported_post_owner_id} wide /></div></section>
    </section>
  </dialog>;
}

function ReportDetailsDialog({ report, readOnly = false, canDeletePost = false, canRemoveAccount = false, canRemoveProvider = false, canRemoveBusiness = false, canFreezeSubscription = false, canCancelBooking = false, onClose, onViewProfile, onViewProvider, onViewPost, onLinkPost, onDeletePost, onRemoveAccount, onActivatePost, onBlockAccount }) {
  const dialogRef = useRef(null);
  const selectedReasons = reportReasons(report);
  useEffect(() => { dialogRef.current?.showModal(); }, []);
  return <dialog ref={dialogRef} className="ops-dialog ops-provider-dialog" onCancel={onClose}>
    <section className="ops-provider-profile">
      <button type="button" className="ops-icon-button ops-close" onClick={onClose} aria-label="Close report details"><X /></button>
      <header className="ops-provider-header">
        <div className="ops-provider-avatar"><AlertTriangle /></div>
        <div><p className="ops-kicker">Submitted report</p><h2>{report.category?.replaceAll("_", " ") || "Report"}</h2><p>{report.updated_at ? new Date(report.updated_at).toLocaleString() : "Date not available"}</p></div>
        <span className={`ops-status ${report.status === "RESOLVED" ? "active" : ""}`}>{report.status || "OPEN"}</span>
      </header>
      <section className="ops-profile-section"><h3>Report details</h3><div className="ops-profile-grid">
        <ProfileField label="Category" value={report.category?.replaceAll("_", " ")} />
        <ProfileField label="Status" value={report.status} />
        {report.report_count > 1 ? <ProfileField label="Total reports" value={`${report.report_count} reports filed against this post`} /> : null}
        <ProfileField label="Reported by" value={report.created_by} />
        <ProfileField label="First submitted" value={report.created_at ? new Date(report.created_at).toLocaleString() : null} />
        <ProfileField label="Last updated" value={report.updated_at ? new Date(report.updated_at).toLocaleString() : null} />
        <div className="ops-profile-field wide"><span>Report reasons</span>{selectedReasons.length ? <div className="ops-report-reasons">{selectedReasons.map((reason) => <label key={reason}><input type="checkbox" checked readOnly />{reason}</label>)}</div> : <strong>This report was submitted before reason selection was added.</strong>}</div>
        <ProfileField label="Details" value={report.details} wide />
        <ProfileField label="Reported post owner" value={report.reported_post_owner} />
        <ProfileField label="Reported post owner ID" value={report.reported_post_owner_id} />
        <ProfileField label="Reported post" value={report.reported_post} wide />
      </div></section>
      <section className="ops-profile-section"><h3>Linked records</h3><div className="ops-profile-grid">
        {report.social_post_id ? <ProfileField label="Post ID" value={report.social_post_id} wide /> : null}
        <ProfileField label="Provider ID" value={report.provider_id} />
        {report.reported_business_record ? <><ProfileField label="Business" value={report.reported_business_record.business_name} /><ProfileField label="Business status" value={report.reported_business_record.account_status} /></> : null}
        {report.reported_subscription_record ? <><ProfileField label="Subscription status" value={report.reported_subscription_record.status} /><ProfileField label="Subscription period ends" value={report.reported_subscription_record.current_period_end} /></> : null}
        <ProfileField label="Booking ID" value={report.booking_id} />
        {report.reported_booking_record ? <><ProfileField label="Booking status" value={report.reported_booking_record.status} /><ProfileField label="Booking date" value={report.reported_booking_record.start_date} /><ProfileField label="Traveler count" value={report.reported_booking_record.traveler_count} /></> : null}
        <ProfileField label="Review ID" value={report.review_id} />
        <ProfileField label="Report ID" value={report.id} />
      </div></section>
      <section className="ops-profile-section"><h3>Admin resolution</h3><div className="ops-profile-grid">
        <ProfileField label="Admin note" value={report.admin_note} wide />
        <ProfileField label="Resolved by" value={report.resolved_by} />
        <ProfileField label="Resolved at" value={report.resolved_at ? new Date(report.resolved_at).toLocaleString() : null} />
      </div></section>
      {report.reported_post_owner_id || report.reported_provider_record || report.reported_subscription_record || report.reported_booking_record || report.reported_business_record ? <section className="ops-profile-section"><h3>{readOnly ? "Reported account" : "Reported account controls"}</h3><div className="ops-dialog-actions">
        {report.reported_post_owner_id ? <a className="ops-button secondary" href={publicProfileUrl(report.reported_post_owner_id)} target="_blank" rel="noreferrer"><ExternalLink />View profile</a> : null}
        {report.reported_post_owner_profile ? <button type="button" className="ops-button secondary" onClick={() => onViewProfile(report.reported_post_owner_profile)}><Eye />View account details</button> : null}
        {report.reported_provider_record ? <button type="button" className="ops-button secondary" onClick={() => onViewProvider(report.reported_provider_record)}><Eye />View provider details</button> : null}
        {report.social_post_id ? <button type="button" className="ops-button secondary" onClick={() => onViewPost(report)}><Eye />View reported post</button> : null}
        {canDeletePost && report.social_post_id && !report._is_post ? <button type="button" className="ops-button secondary" onClick={() => onDeletePost(report)}><Trash2 />Delete post</button> : null}
        {report._is_post && onActivatePost ? <button type="button" className="ops-button" title="Activate post" onClick={() => onActivatePost(report)}><Archive />Activate post</button> : report.social_post_id ? <button type="button" className="ops-button danger" title="Remove post from active use" onClick={() => onRemoveAccount(report, "post")}><Archive />Remove from active use</button> : null}
        {(report._is_post || report.reported_post_owner_id) && onBlockAccount ? <button type="button" className="ops-button danger ops-block-button" title="Block account" onClick={() => onBlockAccount(report)}><ShieldAlert />Block account</button> : null}
        {canRemoveProvider && report.reported_provider_record ? <button type="button" className="ops-button danger" onClick={() => onRemoveAccount(report, "provider")}><Archive />Remove provider</button> : null}
        {canRemoveBusiness && report.reported_business_record ? <button type="button" className="ops-button danger" onClick={() => onRemoveAccount(report, "business")}><Archive />Remove business</button> : null}
        {canFreezeSubscription && report.reported_subscription_record ? <button type="button" className="ops-button danger" onClick={() => onRemoveAccount(report, "subscription")}><Archive />Freeze subscription</button> : null}
        {canCancelBooking && report.reported_booking_record && ["PENDING", "CONFIRMED"].includes(report.reported_booking_record.status) ? <button type="button" className="ops-button danger" onClick={() => onRemoveAccount(report, "booking")}><Archive />Cancel booking</button> : null}
      </div><p className="ops-profile-note">{readOnly ? "This Admin can review the report but cannot change this account or its posts." : "Account, booking, and subscription actions preserve historical records."}</p></section> : <section className="ops-profile-section"><h3>Reported account controls</h3><p className="ops-profile-note">This report has no linked account or booking, so account and booking actions are unavailable.</p>{!readOnly ? <button type="button" className="ops-button secondary" onClick={() => onLinkPost(report)}><Link />Link to timeline post</button> : null}</section>}
    </section>
  </dialog>;
}

function TravelerProfile({ profile, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => { dialogRef.current?.showModal(); }, []);
  const photo = profile.avatar_url || profile.profile_photo_urls?.[0];
  const accountLabel = profile.role === "BUSINESS_OWNER" ? "business account" : "traveler account";
  return <dialog ref={dialogRef} className="ops-dialog ops-provider-dialog" onCancel={onClose}>
    <section className="ops-provider-profile">
      <button type="button" className="ops-icon-button ops-close" onClick={onClose} aria-label="Close traveler profile"><X /></button>
      <header className="ops-provider-header">
        <div className="ops-provider-avatar">{photo ? <img src={photo} alt="" /> : <CircleUserRound />}</div>
        <div><p className="ops-kicker">TourismuBD {accountLabel}</p><h2>{profile.full_name || "Account owner"}</h2><p>{profile.district || "District not provided"}</p></div>
        <span className={`ops-status ${profile.status === "ACTIVE" ? "active" : ""}`}>{profile.status}</span>
      </header>
      <section className="ops-profile-section"><h3>Account details</h3><div className="ops-profile-grid">
        <ProfileField label="Full name" value={profile.full_name} />
        <ProfileField label="Account role" value={profile.role?.replaceAll("_", " ")} />
        <ProfileField label="Email" value={profile.email} />
        <ProfileField label="Phone" value={profile.phone} />
        <ProfileField label="District" value={profile.district} />
        <ProfileField label="Gender" value={profile.gender} />
        <ProfileField label="Blood group" value={profile.blood_group} />
        <ProfileField label="Working place" value={profile.working_place} />
        <ProfileField label="Present address" value={profile.present_address} wide />
        <ProfileField label="Permanent address" value={profile.permanent_address} wide />
        <ProfileField label="Hobby" value={profile.hobby} wide />
        <ProfileField label="Bio" value={profile.bio} wide />
      </div></section>
    </section>
  </dialog>;
}

function ProviderProfile({ provider, onClose, bypassAuth }) {
  const dialogRef = useRef(null);
  const [details, setDetails] = useState({ loading: true, error: "", verification: null, subscription: null, guide: null, houseboats: [], smallBoats: [] });

  useEffect(() => { dialogRef.current?.showModal(); }, []);
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (provider._publicPreview) {
        setDetails({ loading: false, error: "", verification: null, subscription: null, guide: null, houseboats: [], smallBoats: [] });
        return;
      }
      let verification;
      let subscription;
      let guide;
      let houseboats;
      let smallBoats;
      if (bypassAuth) {
        try {
          const rows = await Promise.all([
            loadLocalAdminTable("provider_verifications", { filter: "provider_id", value: provider.id }),
            loadLocalAdminTable("provider_subscriptions", { filter: "provider_id", value: provider.id }),
            loadLocalAdminTable("guide_profiles", { filter: "provider_id", value: provider.id }),
            loadLocalAdminTable("houseboat_listings", { filter: "provider_id", value: provider.id }),
            loadLocalAdminTable("small_boat_listings", { filter: "provider_id", value: provider.id }),
          ]);
          [verification, subscription, guide, houseboats, smallBoats] = rows.map((data, index) => ({ data: index < 3 ? data[0] || null : data, error: null }));
        } catch (localError) {
          if (active) setDetails((current) => ({ ...current, loading: false, error: localError.message }));
          return;
        }
      } else {
        [verification, subscription, guide, houseboats, smallBoats] = await Promise.all([
          supabase.from("provider_verifications").select("email_verified,phone_verified,identity_checked,service_checked,status,provider_note,admin_note,reviewed_at").eq("provider_id", provider.id).maybeSingle(),
          supabase.from("provider_subscriptions").select("provider_type,monthly_fee_bdt,status,current_period_start,current_period_end,grace_until,last_payment_at").eq("provider_id", provider.id).maybeSingle(),
          supabase.from("guide_profiles").select("languages,approximate_rate_bdt,availability,experience").eq("provider_id", provider.id).maybeSingle(),
          supabase.from("houseboat_listings").select("id,name,boarding_point,capacity,approximate_price_bdt,pricing_unit,facilities,availability,status").eq("provider_id", provider.id).order("created_at", { ascending: false }),
          supabase.from("small_boat_listings").select("id,name,boarding_point,capacity,approximate_price_bdt,pricing_unit,availability,status").eq("provider_id", provider.id).order("created_at", { ascending: false }),
        ]);
      }
      if (!active) return;
      const firstError = [verification, subscription, guide, houseboats, smallBoats].find((result) => result.error && result.error.code !== "PGRST116")?.error;
      setDetails({
        loading: false,
        error: firstError?.message || "",
        verification: verification.data || null,
        subscription: subscription.data || null,
        guide: guide.data || null,
        houseboats: houseboats.data || [],
        smallBoats: smallBoats.data || [],
      });
    };
    load();
    return () => { active = false; };
  }, [bypassAuth, provider._publicPreview, provider.id]);

  const owner = provider.profile || {};
  const listings = provider.type === "HOUSEBOAT_OWNER" ? details.houseboats : provider.type === "SMALL_BOAT_OWNER" ? details.smallBoats : [];
  const photo = provider.photo_url || owner.avatar_url || owner.profile_photo_urls?.[0];
  return (
    <dialog ref={dialogRef} className="ops-dialog ops-provider-dialog" onCancel={onClose}>
      <section className="ops-provider-profile">
        <button type="button" className="ops-icon-button ops-close" onClick={onClose} aria-label="Close provider profile"><X /></button>
        <header className="ops-provider-header">
          <div className="ops-provider-avatar">{photo ? <img src={photo} alt="" /> : <CircleUserRound />}</div>
          <div><p className="ops-kicker">TourismuBD provider account</p><h2>{provider.display_name}</h2><p>{providerTypeLabel(provider.type)} · {owner.district || "District not provided"}</p></div>
          <span className={`ops-status ${provider.account_status === "ACTIVE" ? "active" : ""}`}>{provider.account_status}</span>
        </header>

        <div className="ops-profile-section"><h3>Account owner</h3><div className="ops-profile-grid">
          <ProfileField label="Full name" value={owner.full_name} />
          <ProfileField label="Account role" value={owner.role?.replaceAll("_", " ")} />
          <ProfileField label="Email" value={owner.email || provider.contact_email} />
          <ProfileField label="Phone" value={owner.phone || provider.contact_phone} />
          <ProfileField label="District" value={owner.district} />
          <ProfileField label="Profile status" value={owner.status} />
          <ProfileField label="Working place" value={owner.working_place} />
          <ProfileField label="Gender" value={owner.gender} />
          <ProfileField label="Present address" value={owner.present_address} wide />
          <ProfileField label="Bio" value={owner.bio || provider.bio} wide />
        </div></div>

        <div className="ops-profile-section"><h3>Provider details</h3><div className="ops-profile-grid">
          <ProfileField label="Service type" value={providerTypeLabel(provider.type)} />
          <ProfileField label="Public status" value={provider.public_status} />
          <ProfileField label="Service email" value={provider.contact_email} />
          <ProfileField label="Service phone" value={provider.contact_phone} />
          <ProfileField label={provider._publicPreview ? "User ID" : "Provider ID"} value={provider._publicPreview ? provider.user_id : provider.id} wide />
        </div></div>

        {details.loading ? <div className="ops-profile-loading"><RefreshCw className="ops-spin" /> Loading service records...</div> : null}
        {details.error ? <div className="ops-alert"><AlertTriangle /><span>{details.error}</span></div> : null}
        {!details.loading && provider._publicPreview ? <div className="ops-profile-section"><p className="ops-profile-note">Public development preview. Sign in as an active Super Admin to view verification, subscription, and private service records.</p></div> : null}
        {!details.loading && !provider._publicPreview ? <>
          <div className="ops-profile-section"><h3>Account checks</h3><div className="ops-check-grid">
            <span><BadgeCheck /> Verification <b>{details.verification?.status || "Not submitted"}</b></span>
            <span><Mail /> Email <b>{details.verification?.email_verified ? "Verified" : "Not verified"}</b></span>
            <span><Phone /> Phone <b>{details.verification?.phone_verified ? "Verified" : "Not verified"}</b></span>
            <span><ClipboardCheck /> Subscription <b>{details.subscription?.status || "Not started"}</b></span>
          </div>{details.subscription ? <p className="ops-profile-note">Monthly fee: ৳{details.subscription.monthly_fee_bdt} · Current period ends: {details.subscription.current_period_end || "Not set"}</p> : null}</div>

          {details.guide ? <div className="ops-profile-section"><h3>Guide service</h3><div className="ops-profile-grid"><ProfileField label="Languages" value={details.guide.languages} /><ProfileField label="Approximate rate" value={details.guide.approximate_rate_bdt ? `৳${details.guide.approximate_rate_bdt}` : null} /><ProfileField label="Availability" value={details.guide.availability} /><ProfileField label="Experience" value={details.guide.experience} wide /></div></div> : null}

          {listings.length ? <div className="ops-profile-section"><h3>{provider.type === "HOUSEBOAT_OWNER" ? "Houseboats" : "Small boats"}</h3><div className="ops-provider-listings">{listings.map((listing) => <article key={listing.id}><div><strong>{listing.name}</strong><span>{listing.status}</span></div><p>{listing.boarding_point} · Capacity {listing.capacity}</p><small>{listing.approximate_price_bdt ? `৳${listing.approximate_price_bdt} / ${listing.pricing_unit || "trip"}` : "Price not provided"}{listing.availability ? ` · ${listing.availability}` : ""}</small></article>)}</div></div> : null}
        </> : null}
      </section>
    </dialog>
  );
}

function RemoveAdminDialog({ account, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  useEffect(() => { dialogRef.current?.showModal(); }, []);
  return <dialog ref={dialogRef} className="ops-dialog" onCancel={onClose}>
    <section className="ops-editor">
      <button type="button" className="ops-icon-button ops-close" onClick={onClose} aria-label="Close remove Admin confirmation"><X /></button>
      <p className="ops-kicker">Admin Management</p>
      <h2>Remove Secondary Admin?</h2>
      <p><b>{account.email}</b> will lose Admin access. Admin-only Secondary Admin logins are permanently deleted from Supabase. Older public TourismuBD accounts keep their public profile and only lose Admin access.</p>
      <div className="ops-dialog-actions"><button type="button" className="ops-button secondary" onClick={onClose}>Cancel</button><button type="button" className="ops-button danger" onClick={() => onConfirm(account)}><Trash2 />Remove Admin</button></div>
    </section>
  </dialog>;
}

function AdminManagement({ bypassAuth, readOnly = false, onNotice }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [form, setForm] = useState({ email: "", password: "", passwordConfirm: "", role: "users_admin", is_active: true });
  const [feedback, setFeedback] = useState("");
  const [setupLink, setSetupLink] = useState(null);
  const showError = useCallback((error, fallback) => {
    const message = error instanceof Error ? error.message : fallback;
    setFeedback(message);
  }, []);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const result = bypassAuth
        ? await loadLocalAdminTable("admin_accounts", { limit: 500 })
        : await supabase.from("admin_accounts").select("id,user_id,email,role,is_active,created_at,updated_at").order("created_at", { ascending: false }).then(({ data, error }) => {
          if (error) throw error;
          return data || [];
        });
      setAccounts(result);
    } catch (loadError) {
      showError(loadError, "Could not load Secondary Admin accounts.");
    } finally {
      setLoading(false);
    }
  }, [bypassAuth, showError]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const updateForm = (field, value) => {
    setFeedback("");
    setForm((current) => ({ ...current, [field]: value }));
  };
  const reset = () => {
    setFeedback("");
    setSetupLink(null);
    setEditing(null);
    setForm({ email: "", password: "", passwordConfirm: "", role: "users_admin", is_active: true });
  };
  const save = async (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!email) return showError(null, "Enter the Secondary Admin's email address.");
    if (!editing && form.password.length < 12) return showError(null, "Use a temporary password with at least 12 characters.");
    if (!editing && form.password !== form.passwordConfirm) return showError(null, "The temporary passwords do not match.");
    setFeedback("");
    setSetupLink(null);
    setSaving(true);
    try {
      const args = { admin_email: email, admin_role: form.role, active: form.is_active };
      let invitation;
      if (editing) {
        if (bypassAuth) await callLocalAdminRpc("assign_secondary_admin", args);
        else {
          const { error } = await supabase.rpc("assign_secondary_admin", args);
          if (error) throw error;
        }
      } else invitation = await inviteSecondaryAdmin({ email, password: form.password, role: form.role, active: form.is_active }, bypassAuth);
      reset();
      if (invitation?.manualInviteUrl) {
        setSetupLink({ email, url: invitation.manualInviteUrl });
        onNotice("Email delivery failed. Share the one-time Admin setup link instead.");
      } else onNotice(editing ? "Secondary Admin updated." : invitation?.credentials === "created" ? "Secondary Admin login created. Give the email and temporary password privately." : invitation?.invitation === "existing" ? "Admin permission granted. This email already has a login." : "Admin invitation email sent.");
      await loadAccounts();
    } catch (saveError) {
      showError(saveError, "Could not save the Secondary Admin.");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (account) => {
    setFeedback("");
    try {
      await removeSecondaryAdmin(account.id, bypassAuth);
      setRemoving(null);
      onNotice("Secondary Admin removed from Supabase.");
      await loadAccounts();
    } catch (removeError) {
      showError(removeError, "Could not remove the Secondary Admin.");
    }
  };
  const edit = (account) => {
    setFeedback("");
    setEditing(account);
    setForm({ email: account.email, password: "", passwordConfirm: "", role: account.role, is_active: account.is_active });
  };
  const toggleActive = async (account) => {
    setFeedback("");
    setSaving(true);
    try {
      const args = { admin_email: account.email, admin_role: account.role, active: !account.is_active };
      if (bypassAuth) await callLocalAdminRpc("assign_secondary_admin", args);
      else {
        const { error } = await supabase.rpc("assign_secondary_admin", args);
        if (error) throw error;
      }
      onNotice(`Secondary Admin ${account.is_active ? "disabled" : "enabled"}.`);
      await loadAccounts();
    } catch (toggleError) {
      showError(toggleError, "Could not change this Secondary Admin's status.");
    } finally {
      setSaving(false);
    }
  };

  return <section className="ops-admin-management">
    <div className="ops-admin-intro"><div><p className="ops-kicker">Access control</p><h2>Admin Management</h2><p>Each Secondary Admin has one individual role. Multiple accounts can share the same role.</p></div></div>
    <div className="ops-admin-grid">
      <section className="ops-admin-form-panel">
        <h3>{editing ? "Edit Secondary Admin" : "Create Secondary Admin"}</h3>
        <p>New Admins receive an Admin-only login and do not appear on the public TourismuBD site. Give their temporary password to them privately.</p>
        {feedback ? <div className="ops-alert ops-admin-alert" role="alert"><AlertTriangle /><span>{feedback}</span><button type="button" onClick={() => setFeedback("")} aria-label="Dismiss error"><X /></button></div> : null}
        {setupLink ? <div className="ops-admin-setup-link"><strong>Admin setup link for {setupLink.email}</strong><p>Email delivery is unavailable. Send this one-time link privately to the new Admin.</p><input value={setupLink.url} readOnly aria-label="Admin setup link" /><button type="button" className="ops-button secondary" onClick={() => { if (!navigator.clipboard) return showError(null, "Copy the setup link manually."); navigator.clipboard.writeText(setupLink.url).then(() => onNotice("Admin setup link copied.")).catch(() => showError(null, "Copy the setup link manually.")); }}><Link />Copy link</button></div> : null}
        <form onSubmit={save} className="ops-admin-form">
          <label>Email<input value={form.email} onChange={(event) => updateForm("email", event.target.value)} type="email" autoComplete="email" required disabled={Boolean(editing)} placeholder="admin@example.com" /></label>
          {!editing ? <><label>Temporary password<input value={form.password} onChange={(event) => updateForm("password", event.target.value)} type="password" autoComplete="new-password" minLength="12" required /></label>
          <label>Confirm temporary password<input value={form.passwordConfirm} onChange={(event) => updateForm("passwordConfirm", event.target.value)} type="password" autoComplete="new-password" minLength="12" required /></label></> : null}
          <label>Role<select value={form.role} onChange={(event) => updateForm("role", event.target.value)}>{ADMIN_ROLES.map((role) => <option key={role} value={role}>{ADMIN_ROLE_LABELS[role]}</option>)}</select></label>
          <label className="ops-check-label"><input type="checkbox" checked={form.is_active} onChange={(event) => updateForm("is_active", event.target.checked)} />Active immediately</label>
          <div className="ops-dialog-actions"><button type="button" className="ops-button secondary" onClick={reset}>{editing ? "Cancel" : "Clear"}</button><button className="ops-button" disabled={saving}>{editing ? <Pencil /> : <Plus />}{saving ? "Saving..." : editing ? "Save changes" : "Create Admin"}</button></div>
        </form>
      </section>
      <section className="ops-table-panel">
        <div className="ops-table-tools"><div className="ops-table-filters"><strong>Secondary Admin accounts</strong></div><button className="ops-icon-button" onClick={loadAccounts} title="Refresh Admin accounts" aria-label="Refresh Admin accounts"><RefreshCw /></button></div>
        <div className="ops-table-wrap"><table><thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>
          {loading ? <tr><td colSpan="5" className="ops-empty">Loading Admin accounts...</td></tr> : null}
          {!loading && !accounts.length ? <tr><td colSpan="5" className="ops-empty">No Secondary Admin accounts yet.</td></tr> : null}
          {accounts.map((account) => <tr key={account.id}><td>{account.email}</td><td>{ADMIN_ROLE_LABELS[account.role] || account.role}</td><td><span className={`ops-status ${account.is_active && account.user_id ? "active" : ""}`}>{!account.user_id ? account.is_active ? "PENDING SIGN-UP" : "PENDING DISABLED" : account.is_active ? "ACTIVE" : "DISABLED"}</span></td><td>{account.updated_at ? new Date(account.updated_at).toLocaleString() : "—"}</td><td><div className="ops-row-actions"><button onClick={() => edit(account)} title="Edit Admin" aria-label="Edit Admin"><Pencil /></button><button onClick={() => toggleActive(account)} disabled={saving} title={account.is_active ? "Disable Admin" : "Enable Admin"} aria-label={account.is_active ? "Disable Admin" : "Enable Admin"}><BadgeCheck /></button><button className="danger" onClick={() => setRemoving(account)} title="Remove Admin" aria-label="Remove Admin"><Trash2 /></button></div></td></tr>)}
        </tbody></table></div>
      </section>
    </div>
    {removing ? <RemoveAdminDialog account={removing} onClose={() => setRemoving(null)} onConfirm={remove} /> : null}
  </section>;
}

const DEFAULT_BANNERS = [
  {
    id: "hero_home",
    title: "Homepage Hero Banner",
    description: "The primary landscape banner featured at the top of the homepage hero section.",
    defaultUrl: "/images/sylhet-waterway.png",
  },
  {
    id: "banner_explore",
    title: "Explore Places Banner",
    description: "Featured visual banner on the Explore Destinations view.",
    defaultUrl: "/images/sylhet-division-landscapes.png",
  },
  {
    id: "banner_trip",
    title: "Trip Planner & Route Banner",
    description: "Header banner for the multi-day tour and route planner.",
    defaultUrl: "/images/jaflong-river.png",
  },
  {
    id: "banner_community",
    title: "Traveler Community Banner",
    description: "Atmospheric banner on community feeds and traveler shared stories.",
    defaultUrl: "/images/gallery/water-3.jpg",
  },
  {
    id: "banner_waterways",
    title: "Rivers & Waterways Banner",
    description: "Scenic banner for Bangladesh river systems, lakes, and water bodies.",
    defaultUrl: "/images/gallery/water-1.jpg",
  },
];

const MEDIA_TABS = [
  { id: "places", label: "Destinations (Places)", icon: MapPin },
  { id: "galleries", label: "Scenic Photo Galleries (6-9 Photos)", icon: Camera },
  { id: "water", label: "Water Bodies & Nature", icon: Waves },
  { id: "banners", label: "Hero & System Banners", icon: ImageIcon },
  { id: "products", label: "Business & Products", icon: Package },
];

function MediaEditorDialog({ item, onClose, onSaved }) {
  const dialogRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(item.imageUrl || item.image || item.image_url || "");
  const [captionBn, setCaptionBn] = useState(item.captionBn || "");
  const [captionEn, setCaptionEn] = useState(item.captionEn || "");
  const [tagBn, setTagBn] = useState(item.tagBn || "");
  const [tagEn, setTagEn] = useState(item.tagEn || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setError("Please provide an image either by uploading or pasting a URL.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSaved({
        ...item,
        imageUrl: imageUrl.trim(),
        captionBn,
        captionEn,
        tagBn,
        tagEn,
      });
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to save image changes.");
      setSaving(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="ops-dialog ops-media-dialog" onCancel={onClose}>
      <form onSubmit={handleSave} className="ops-editor">
        <button type="button" className="ops-icon-button ops-close" onClick={onClose} aria-label="Close dialog">
          <X />
        </button>
        <p className="ops-kicker">Media management · {item.typeLabel || "Picture"}</p>
        <h2>{item.title || "Update picture"}</h2>
        {item.subtitle ? <p className="ops-media-dialog-subtitle">{item.subtitle}</p> : null}

        <div className="ops-media-dialog-uploader">
          <ImageUploader
            currentUrl={imageUrl}
            onImageSelected={(url) => {
              setImageUrl(url);
              setError("");
            }}
            label="Picture"
            previewHeight={200}
          />
        </div>

        {item.isGalleryPhoto ? (
          <div className="ops-form-grid" style={{ marginTop: "1rem" }}>
            <label>
              Caption (বাংলা)
              <input
                value={captionBn}
                onChange={(e) => setCaptionBn(e.target.value)}
                placeholder="যেমন: আঁচরঙ্গা দিঘির শান্ত ও স্নিগ্ধ জলরাশি"
              />
            </label>
            <label>
              Caption (English)
              <input
                value={captionEn}
                onChange={(e) => setCaptionEn(e.target.value)}
                placeholder="e.g. Peaceful waters of Achranga Dighi"
              />
            </label>
            <label>
              Tag (বাংলা)
              <input
                value={tagBn}
                onChange={(e) => setTagBn(e.target.value)}
                placeholder="যেমন: শান্ত জলরাশি"
              />
            </label>
            <label>
              Tag (English)
              <input
                value={tagEn}
                onChange={(e) => setTagEn(e.target.value)}
                placeholder="e.g. Calm Waters"
              />
            </label>
          </div>
        ) : null}

        {error ? <p className="ops-error" role="alert">{error}</p> : null}

        <div className="ops-dialog-actions">
          <button type="button" className="ops-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="ops-button" disabled={saving}>
            <Pencil /> {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function getPlaceCoverImage(p) {
  if (!p) return "/images/sylhet-waterway.png";
  const custom = getCustomPlaceImage(p.slug || p.id);
  if (custom) return custom;
  if (p.image_url && !p.image_url.includes("sylhet-waterway")) return p.image_url;
  if (p.image && !p.image.includes("sylhet-waterway")) return p.image;
  const gallery = getPlaceGallery(p);
  return gallery[0]?.url || p.image_url || p.image || "/images/sylhet-waterway.png";
}

function MediaManager({ bypassAuth = false, onNotice, readOnly = false }) {
  const [activeTab, setActiveTab] = useState("places");
  const [searchQuery, setSearchQuery] = useState("");
  const [places, setPlaces] = useState(() =>
    staticPlaces.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      district_id: p.districtId || p.district,
      image_url: getPlaceCoverImage(p),
      status: p.status || "PUBLISHED",
    }))
  );
  const [waterBodies, setWaterBodies] = useState(() =>
    (staticWaterListings || []).map((w, idx) => ({
      id: w.id || `wb-${idx}`,
      name: w.name,
      type: w.type || "Water body",
      district: w.district || "",
      image_url: w.image || "/images/gallery/water-1.jpg",
      status: "PUBLISHED",
    }))
  );
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState(() =>
    DEFAULT_BANNERS.map((b) => ({
      ...b,
      imageUrl: getSystemBanner(b.id, b.defaultUrl),
    }))
  );
  const [loading, setLoading] = useState(false);
  const [selectedGallerySlug, setSelectedGallerySlug] = useState("achranga-dighi");
  const [editingItem, setEditingItem] = useState(null);

  const loadAllMedia = useCallback(async () => {
    try {
      await syncCustomMediaFromServer();
    } catch {}

    // 1. Load Places
    try {
      let loadedPlaces = [];
      if (!bypassAuth && supabase) {
        const { data, error } = await supabase
          .from("places")
          .select("id, name, slug, category, district_id, image_url, status")
          .order("name");
        if (!error && data?.length) {
          loadedPlaces = data.map((p) => ({
            ...p,
            image_url: getPlaceCoverImage(p),
          }));
        }
      }
      if (!loadedPlaces.length) {
        loadedPlaces = staticPlaces.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category,
          district_id: p.districtId || p.district,
          image_url: getPlaceCoverImage(p),
          status: p.status || "PUBLISHED",
        }));
      }
      setPlaces(loadedPlaces);
    } catch {
      setPlaces(staticPlaces.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        district_id: p.districtId || p.district,
        image_url: getPlaceCoverImage(p),
        status: p.status || "PUBLISHED",
      })));
    }

    // 2. Load Water Bodies
    try {
      let loadedWater = [];
      if (!bypassAuth && supabase) {
        const { data, error } = await supabase
          .from("water_bodies")
          .select("id, name, type, district, image_url, status")
          .order("name");
        if (!error && data?.length) {
          loadedWater = data;
        }
      }
      if (!loadedWater.length) {
        loadedWater = (staticWaterListings || []).map((w, idx) => ({
          id: w.id || `wb-${idx}`,
          name: w.name,
          type: w.type || "Water body",
          district: w.district || "",
          image_url: w.image || "/images/gallery/water-1.jpg",
          status: "PUBLISHED",
        }));
      }
      setWaterBodies(loadedWater);
    } catch {
      setWaterBodies([]);
    }

    // 3. Load Products
    try {
      if (!bypassAuth && supabase) {
        const { data } = await supabase
          .from("business_products")
          .select("id, name, seller_name, price_bdt, image_url")
          .limit(50);
        if (data) setProducts(data);
      }
    } catch {
      setProducts([]);
    }

    // 4. Load Banners
    const bannerItems = DEFAULT_BANNERS.map((b) => ({
      ...b,
      imageUrl: getSystemBanner(b.id, b.defaultUrl),
    }));
    setBanners(bannerItems);

    setLoading(false);
  }, [bypassAuth]);

  useEffect(() => {
    loadAllMedia();
  }, [loadAllMedia]);

  const selectedPlace = useMemo(() => {
    return places.find((p) => p.slug === selectedGallerySlug || p.id === selectedGallerySlug) || places[0];
  }, [places, selectedGallerySlug]);

  const currentGallery = useMemo(() => {
    if (!selectedPlace) return [];
    return getPlaceGallery(selectedPlace);
  }, [selectedPlace]);

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return places;
    return places.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.district_id?.toLowerCase().includes(q)
    );
  }, [places, searchQuery]);

  const filteredWater = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return waterBodies;
    return waterBodies.filter(
      (w) =>
        w.name?.toLowerCase().includes(q) ||
        w.type?.toLowerCase().includes(q) ||
        w.district?.toLowerCase().includes(q)
    );
  }, [waterBodies, searchQuery]);

  const handleItemSaved = async (savedItem) => {
    if (savedItem.isPlaceCover) {
      const newUrl = savedItem.imageUrl;
      saveCustomPlaceImage(savedItem.slug || savedItem.id, newUrl);

      let dbUpdated = false;
      if (!bypassAuth && supabase) {
        try {
          if (savedItem.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(savedItem.id)) {
            const { error } = await supabase.from("places").update({ image_url: newUrl }).eq("id", savedItem.id);
            if (!error) dbUpdated = true;
          }
          if (!dbUpdated && (savedItem.slug || savedItem.id)) {
            const slug = savedItem.slug || savedItem.id;
            const { error } = await supabase.from("places").update({ image_url: newUrl }).eq("slug", slug);
            if (!error) dbUpdated = true;
          }
        } catch (err) {
          console.warn("Direct Supabase update error:", err);
        }
      }

      if (!dbUpdated) {
        try {
          const key = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(savedItem.id) ? "id" : "slug";
          const recordId = key === "id" ? savedItem.id : (savedItem.slug || savedItem.id);
          await mutateLocalAdminTable("places", "PATCH", key, recordId, { image_url: newUrl });
          dbUpdated = true;
        } catch (err) {
          console.warn("Server admin mutation error:", err);
        }
      }

      setPlaces((prev) =>
        prev.map((p) => (p.id === savedItem.id || p.slug === savedItem.slug ? { ...p, image_url: newUrl } : p))
      );
      onNotice?.("Place cover picture updated successfully.");
    } else if (savedItem.isGalleryPhoto) {
      if (!selectedPlace) return;
      const slug = selectedPlace.slug || selectedPlace.id;
      let updatedGallery;
      if (savedItem.isNewPhoto) {
        updatedGallery = [
          ...currentGallery,
          {
            url: savedItem.imageUrl,
            fallbackUrl: savedItem.imageUrl,
            captionBn: savedItem.captionBn || "",
            captionEn: savedItem.captionEn || "",
            tagBn: savedItem.tagBn || "",
            tagEn: savedItem.tagEn || "",
          },
        ];
      } else {
        updatedGallery = currentGallery.map((photo, idx) => {
          if (idx !== savedItem.galleryIndex) return photo;
          return {
            ...photo,
            url: savedItem.imageUrl,
            fallbackUrl: savedItem.imageUrl,
            captionBn: savedItem.captionBn,
            captionEn: savedItem.captionEn,
            tagBn: savedItem.tagBn,
            tagEn: savedItem.tagEn,
          };
        });
      }
      saveCustomPlaceGallery(slug, updatedGallery);
      setPlaces((prev) => [...prev]);
      onNotice?.("Scenic gallery photo updated successfully.");
    } else if (savedItem.isWaterBody) {
      const newUrl = savedItem.imageUrl;
      saveCustomWaterImage(savedItem.id, newUrl);
      if (!bypassAuth && supabase && savedItem.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(savedItem.id)) {
        try {
          await supabase.from("water_bodies").update({ image_url: newUrl }).eq("id", savedItem.id);
        } catch {}
      }
      setWaterBodies((prev) =>
        prev.map((w) => (w.id === savedItem.id ? { ...w, image_url: newUrl } : w))
      );
      onNotice?.("Water body picture updated successfully.");
    } else if (savedItem.isBanner) {
      saveCustomSystemBanner(savedItem.bannerId, savedItem.imageUrl);
      setBanners((prev) =>
        prev.map((b) => (b.id === savedItem.bannerId ? { ...b, imageUrl: savedItem.imageUrl } : b))
      );
      onNotice?.("System banner updated successfully.");
    } else if (savedItem.isProduct) {
      const newUrl = savedItem.imageUrl;
      if (!bypassAuth && supabase && savedItem.id) {
        try {
          await supabase.from("business_products").update({ image_url: newUrl }).eq("id", savedItem.id);
        } catch {}
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === savedItem.id ? { ...p, image_url: newUrl } : p))
      );
      onNotice?.("Product picture updated successfully.");
    }
  };

  const handleMoveGalleryPhoto = (index, direction) => {
    if (!selectedPlace) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= currentGallery.length) return;
    const next = [...currentGallery];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    saveCustomPlaceGallery(selectedPlace.slug || selectedPlace.id, next);
    setPlaces((prev) => [...prev]);
    onNotice?.("Photo order updated.");
  };

  const handleDeleteGalleryPhoto = (index) => {
    if (!selectedPlace) return;
    if (currentGallery.length <= 6) {
      alert("A scenic gallery must maintain at least 6 photos to showcase the location properly.");
      return;
    }
    if (!window.confirm("Remove this photo from the scenic gallery?")) return;
    const next = currentGallery.filter((_, idx) => idx !== index);
    saveCustomPlaceGallery(selectedPlace.slug || selectedPlace.id, next);
    setPlaces((prev) => [...prev]);
    onNotice?.("Photo removed from scenic gallery.");
  };

  return (
    <section className="ops-table-panel ops-media-manager">
      <div className="ops-media-toolbar">
        <div className="ops-media-tabs" role="tablist" aria-label="Media sections">
          {MEDIA_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                className={`ops-media-tab ${active ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery("");
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="ops-media-search-wrap">
          {activeTab !== "banners" ? (
            <label className="ops-media-search">
              <Search size={15} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "galleries"
                    ? "Select or search destination..."
                    : `Search ${activeTab}...`
                }
              />
            </label>
          ) : null}
          <button
            className="ops-icon-button"
            onClick={loadAllMedia}
            title="Refresh media"
            aria-label="Refresh media"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="ops-media-loading">Loading media records...</div>
      ) : null}

      {!loading && activeTab === "places" ? (
        <div className="ops-media-content">
          <div className="ops-media-subhead">
            <div>
              <h3>Destination Cover Pictures</h3>
              <p>Upload a file or paste any web/Google image URL for every tourist destination.</p>
            </div>
            <span className="ops-badge">{filteredPlaces.length} destinations</span>
          </div>

          <div className="ops-media-grid">
            {filteredPlaces.map((place) => {
              const gallery = getPlaceGallery(place);
              const imgUrl = getPlaceCoverImage(place);
              return (
                <div key={place.id || place.slug} className="ops-media-card">
                  <div className="ops-media-card-thumb">
                    <img
                      src={imgUrl}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = gallery[0]?.fallbackUrl || "/images/sylhet-waterway.png";
                      }}
                    />
                    <button
                      type="button"
                      className="ops-media-card-action-btn"
                      onClick={() =>
                        setEditingItem({
                          id: place.id,
                          slug: place.slug,
                          title: place.name,
                          subtitle: `${place.district_id || ""} · ${place.category || ""}`,
                          typeLabel: "Destination Cover Picture",
                          imageUrl: imgUrl,
                          isPlaceCover: true,
                        })
                      }
                      title="Change picture"
                    >
                      <Camera size={14} /> Change Picture
                    </button>
                  </div>
                  <div className="ops-media-card-info">
                    <h4>{place.name}</h4>
                    <p>{place.district_id || "Bangladesh"} · {place.category || "Scenic spot"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "galleries" ? (
        <div className="ops-media-content">
          <div className="ops-media-subhead">
            <div>
              <h3>Scenic Photo Galleries (Silent Beauty)</h3>
              <p>Each destination features 6 to 9 silent beauty photos. Super Admins and Media Admins can replace, add, or reorder any photo.</p>
            </div>
            <div className="ops-place-select-wrap">
              <label>Select Destination:</label>
              <select
                value={selectedPlace?.slug || selectedGallerySlug}
                onChange={(e) => setSelectedGallerySlug(e.target.value)}
                className="ops-gallery-place-select"
              >
                {places.map((p) => (
                  <option key={p.slug || p.id} value={p.slug || p.id}>
                    {p.name} ({p.district_id || "Bangladesh"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ops-gallery-management-box">
            <div className="ops-gallery-summary-bar">
              <div>
                <strong>{selectedPlace?.name} Gallery</strong>
                <span className="ops-badge">
                  {currentGallery.length} / 9 photos ({currentGallery.length >= 6 ? "Meets 6-photo minimum" : "Needs 6 photos"})
                </span>
              </div>
              {currentGallery.length < 9 ? (
                <button
                  type="button"
                  className="ops-button"
                  onClick={() =>
                    setEditingItem({
                      title: `Add Photo to ${selectedPlace?.name} Gallery`,
                      subtitle: "Upload a file or paste image URL with captions",
                      typeLabel: "Scenic Gallery Photo",
                      imageUrl: "",
                      captionBn: "",
                      captionEn: "",
                      tagBn: "",
                      tagEn: "",
                      isGalleryPhoto: true,
                      isNewPhoto: true,
                    })
                  }
                >
                  <Plus size={14} /> Add Gallery Photo
                </button>
              ) : null}
            </div>

            <div className="ops-gallery-grid">
              {currentGallery.map((photo, idx) => (
                <div key={idx} className="ops-gallery-card">
                  <div className="ops-gallery-card-thumb">
                    <img
                      src={photo.url || photo.fallbackUrl}
                      alt={photo.captionEn || `Photo ${idx + 1}`}
                      onError={(e) => {
                        e.currentTarget.src = photo.fallbackUrl || "/images/gallery/water-1.jpg";
                      }}
                    />
                    <span className="ops-gallery-card-num">#{idx + 1}</span>
                    <div className="ops-gallery-card-actions">
                      <button
                        type="button"
                        onClick={() => handleMoveGalleryPhoto(idx, -1)}
                        disabled={idx === 0}
                        title="Move photo left/up"
                        aria-label="Move photo up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveGalleryPhoto(idx, 1)}
                        disabled={idx === currentGallery.length - 1}
                        title="Move photo right/down"
                        aria-label="Move photo down"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingItem({
                            title: `Edit Photo #${idx + 1} for ${selectedPlace?.name}`,
                            subtitle: photo.tagBn || photo.tagEn || "",
                            typeLabel: "Scenic Gallery Photo",
                            imageUrl: photo.url,
                            captionBn: photo.captionBn || "",
                            captionEn: photo.captionEn || "",
                            tagBn: photo.tagBn || "",
                            tagEn: photo.tagEn || "",
                            galleryIndex: idx,
                            isGalleryPhoto: true,
                          })
                        }
                        title="Edit picture & captions"
                        aria-label="Edit photo"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDeleteGalleryPhoto(idx)}
                        disabled={currentGallery.length <= 6}
                        title={currentGallery.length <= 6 ? "Minimum 6 photos required" : "Delete photo"}
                        aria-label="Delete photo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="ops-gallery-card-details">
                    <span className="ops-gallery-tag">{photo.tagBn || photo.tagEn || "শান্ত রূপ"}</span>
                    <p className="ops-gallery-caption-bn">{photo.captionBn || "শান্ত ও স্নিগ্ধ প্রাকৃতিক দৃশ্য"}</p>
                    <small className="ops-gallery-caption-en">{photo.captionEn || "Serene landscape"}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "water" ? (
        <div className="ops-media-content">
          <div className="ops-media-subhead">
            <div>
              <h3>Water Bodies & Rivers</h3>
              <p>Pictures of rivers, haors, lakes, and waterfalls across Bangladesh.</p>
            </div>
            <span className="ops-badge">{filteredWater.length} water bodies</span>
          </div>

          <div className="ops-media-grid">
            {filteredWater.map((item) => {
              const imgUrl = item.image_url || "/images/gallery/water-1.jpg";
              return (
                <div key={item.id} className="ops-media-card">
                  <div className="ops-media-card-thumb">
                    <img
                      src={imgUrl}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/gallery/water-1.jpg";
                      }}
                    />
                    <button
                      type="button"
                      className="ops-media-card-action-btn"
                      onClick={() =>
                        setEditingItem({
                          id: item.id,
                          title: item.name,
                          subtitle: `${item.type} · ${item.district || "Bangladesh"}`,
                          typeLabel: "Water Body Picture",
                          imageUrl: imgUrl,
                          isWaterBody: true,
                        })
                      }
                      title="Change picture"
                    >
                      <Camera size={14} /> Change Picture
                    </button>
                  </div>
                  <div className="ops-media-card-info">
                    <h4>{item.name}</h4>
                    <p>{item.type} · {item.district || "Bangladesh"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "banners" ? (
        <div className="ops-media-content">
          <div className="ops-media-subhead">
            <div>
              <h3>System Hero & Page Banners</h3>
              <p>Update any high-visibility website banner, including the homepage hero image.</p>
            </div>
            <span className="ops-badge">{banners.length} banners</span>
          </div>

          <div className="ops-banners-list">
            {banners.map((banner) => (
              <div key={banner.id} className="ops-banner-card">
                <div className="ops-banner-preview-box">
                  <img
                    src={banner.imageUrl || banner.defaultUrl}
                    alt={banner.title}
                    onError={(e) => {
                      e.currentTarget.src = banner.defaultUrl;
                    }}
                  />
                  <div className="ops-banner-overlay-badge">Live System Banner</div>
                </div>
                <div className="ops-banner-details">
                  <h4>{banner.title}</h4>
                  <p>{banner.description}</p>
                  <div className="ops-banner-actions">
                    <button
                      type="button"
                      className="ops-button"
                      onClick={() =>
                        setEditingItem({
                          bannerId: banner.id,
                          title: banner.title,
                          subtitle: banner.description,
                          typeLabel: "System Banner",
                          imageUrl: banner.imageUrl || banner.defaultUrl,
                          isBanner: true,
                        })
                      }
                    >
                      <Camera size={14} /> Change Banner Picture
                    </button>
                    {banner.imageUrl !== banner.defaultUrl ? (
                      <button
                        type="button"
                        className="ops-button secondary"
                        onClick={() => {
                          saveCustomSystemBanner(banner.id, banner.defaultUrl);
                          setBanners((prev) =>
                            prev.map((b) => (b.id === banner.id ? { ...b, imageUrl: banner.defaultUrl } : b))
                          );
                          onNotice?.("Banner reset to default.");
                        }}
                      >
                        Reset to Default
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "products" ? (
        <div className="ops-media-content">
          <div className="ops-media-subhead">
            <div>
              <h3>Business & Product Pictures</h3>
              <p>Manage product listing and business catalog imagery.</p>
            </div>
            <span className="ops-badge">{products.length} products</span>
          </div>

          {!products.length ? (
            <div className="ops-empty">No marketplace products found. Add products in the Business section to manage their imagery.</div>
          ) : (
            <div className="ops-media-grid">
              {products.map((item) => {
                const imgUrl = item.image_url || "/images/gallery/nature-1.jpg";
                return (
                  <div key={item.id} className="ops-media-card">
                    <div className="ops-media-card-thumb">
                      <img
                        src={imgUrl}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/gallery/nature-1.jpg";
                        }}
                      />
                      <button
                        type="button"
                        className="ops-media-card-action-btn"
                        onClick={() =>
                          setEditingItem({
                            id: item.id,
                            title: item.name,
                            subtitle: `${item.seller_name || "Seller"} · ৳${item.price_bdt || 0}`,
                            typeLabel: "Product Picture",
                            imageUrl: imgUrl,
                            isProduct: true,
                          })
                        }
                        title="Change picture"
                      >
                        <Camera size={14} /> Change Picture
                      </button>
                    </div>
                    <div className="ops-media-card-info">
                      <h4>{item.name}</h4>
                      <p>{item.seller_name || "Seller"} · ৳{item.price_bdt || 0}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {editingItem ? (
        <MediaEditorDialog
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={handleItemSaved}
        />
      ) : null}
    </section>
  );
}

function Operations({ user, profile, access, onSignOut, onAccessLost, bypassAuth = false }) {
  const adminIsSuper = bypassAuth || isSuperAdmin(access);
  const isMediaAdmin = access?.role === "media_admin";
  const canOpenSection = useCallback((nextSection) => {
    if (isMediaAdmin) return nextSection === "media";
    if (nextSection === "blocked-accounts") return adminIsSuper || ["users_admin", "provider_admin", "business_admin"].includes(access?.role);
    return canAccessAdminSection(access, nextSection, RESOURCES.find((item) => item.id === nextSection));
  }, [access, adminIsSuper, isMediaAdmin, canAccessAdminSection]);
  const [section, setSectionState] = useState(() => {
    if (isMediaAdmin) return "media";
    const saved = savedAdminSection();
    return canOpenSection(saved) ? saved : "overview";
  });
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [query, setQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [placeVisibilityFilter, setPlaceVisibilityFilter] = useState("ALL");
  const [reportStatusFilter, setReportStatusFilter] = useState("OPEN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState(null);
  const [placeEditor, setPlaceEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [accountAction, setAccountAction] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [bookingHistory, setBookingHistory] = useState(null);
  const [reportDetails, setReportDetails] = useState(null);
  const [reportAccountAction, setReportAccountAction] = useState(null);
  const [reportedPost, setReportedPost] = useState(null);
  const [travelerProfile, setTravelerProfile] = useState(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [districtOptions, setDistrictOptions] = useState([]);
  const rowRequest = useRef(0);
  const resource = RESOURCES.find((item) => item.id === section);
  const currentResource = useRef(resource);
  currentResource.current = resource;

  const setSection = useCallback((nextSection) => {
    if (isMediaAdmin && nextSection !== "media") return;
    if (!isAdminSection(nextSection) || !canOpenSection(nextSection)) return;
    setSectionState(nextSection);
    try {
      const currentState = window.history.state || {};
      if (currentState.tourismubdAdminSection !== nextSection) {
        window.history.pushState({ ...currentState, tourismubdAdminSection: nextSection }, "", window.location.href);
      }
    } catch { /* Browser history can be unavailable. */ }
  }, [canOpenSection, isMediaAdmin]);

  useEffect(() => {
    try {
      const currentState = window.history.state || {};
      const historySection = isAdminSection(currentState.tourismubdAdminSection) && canOpenSection(currentState.tourismubdAdminSection) ? currentState.tourismubdAdminSection : section;
      if (historySection !== section) setSectionState(historySection);
      window.history.replaceState({ ...currentState, tourismubdAdminSection: historySection }, "", window.location.href);
      const restoreSection = (event) => {
        if (isAdminSection(event.state?.tourismubdAdminSection) && canOpenSection(event.state.tourismubdAdminSection)) setSectionState(event.state.tourismubdAdminSection);
      };
      window.addEventListener("popstate", restoreSection);
      return () => window.removeEventListener("popstate", restoreSection);
    } catch { return undefined; }
  }, [canOpenSection, section]);

  useEffect(() => {
    if (!canOpenSection(section)) setSectionState(isMediaAdmin ? "media" : "overview");
  }, [canOpenSection, isMediaAdmin, section]);

  useEffect(() => {
    try { window.sessionStorage.setItem(ADMIN_SECTION_STORAGE_KEY, section); } catch { /* Session storage can be unavailable. */ }
  }, [section]);

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(""), 2800); };
  const reportsForCurrentAdmin = async (reportRows) => {
    if (isSuperAdmin(access) || !reportRows.length) return reportRows;
    const postIds = [...new Set(reportRows.map((row) => row.social_post_id).filter(Boolean))];
    const postResult = bypassAuth
      ? await loadLocalAdminTable("social_posts", { limit: 500, ids: postIds })
      : postIds.length
        ? (await supabase.from("social_posts").select("id,author_id").in("id", postIds)).data || []
        : [];
    const postsById = Object.fromEntries(postResult.map((post) => [post.id, post]));
    const authorIds = [...new Set(postResult.map((post) => post.author_id).filter(Boolean))];
    const profileResult = bypassAuth
      ? await loadLocalAdminTable("profiles", { limit: 500, ids: authorIds })
      : authorIds.length
        ? (await supabase.from("profiles").select("id,role,is_admin_only").in("id", authorIds)).data || []
        : [];
    const profilesById = Object.fromEntries(profileResult.map((author) => [author.id, author]));
    if (access?.role === "booking_admin") return reportRows.filter((report) => Boolean(report.booking_id));
    if (access?.role === "business_admin") {
      const businessOwnerIds = authorIds.filter((id) => profilesById[id]?.role === "BUSINESS_OWNER" && !profilesById[id]?.is_admin_only);
      let businesses;
      if (bypassAuth) {
        businesses = (await loadLocalAdminTable("businesses", { limit: 500 })).filter((business) => businessOwnerIds.includes(business.user_id));
      } else if (businessOwnerIds.length) {
        const result = await supabase.from("businesses").select("user_id").in("user_id", businessOwnerIds);
        businesses = result.data || [];
      } else businesses = [];
      const businessOwnerSet = new Set(businesses.map((business) => business.user_id));
      return reportRows.filter((report) => !report.provider_id && businessOwnerSet.has(postsById[report.social_post_id]?.author_id));
    }
    if (access?.role === "subscription_admin") {
      const providerIds = [...new Set([...reportRows.map((row) => row.provider_id), ...authorIds].filter(Boolean))];
      let providerRows;
      if (bypassAuth) {
        providerRows = (await loadLocalAdminTable("providers", { limit: 500 })).filter((provider) => providerIds.includes(provider.id) || authorIds.includes(provider.user_id));
      } else {
        const providerResults = await Promise.all([
          reportRows.some((row) => row.provider_id) ? supabase.from("providers").select("id,user_id").in("id", [...new Set(reportRows.map((row) => row.provider_id).filter(Boolean))]) : Promise.resolve({ data: [], error: null }),
          authorIds.length ? supabase.from("providers").select("id,user_id").in("user_id", authorIds) : Promise.resolve({ data: [], error: null }),
        ]);
        providerRows = providerResults.flatMap((result) => result.data || []);
      }
      const providerIdsWithReports = [...new Set(providerRows.map((provider) => provider.id))];
      if (!providerIdsWithReports.length) return [];
      let subscriptions;
      if (bypassAuth) {
        subscriptions = (await loadLocalAdminTable("provider_subscriptions", { limit: 500 })).filter((subscription) => providerIdsWithReports.includes(subscription.provider_id));
      } else {
        const result = await supabase.from("provider_subscriptions").select("provider_id").in("provider_id", providerIdsWithReports);
        subscriptions = result.data || [];
      }
      const subscribedProviderIds = new Set(subscriptions.map((subscription) => subscription.provider_id));
      const providerIdByAuthor = Object.fromEntries(providerRows.map((provider) => [provider.user_id, provider.id]));
      return reportRows.filter((report) => subscribedProviderIds.has(report.provider_id || providerIdByAuthor[postsById[report.social_post_id]?.author_id]));
    }
    return reportRows.filter((report) => {
      if (report.social_post_id) return true;
      const author = profilesById[postsById[report.social_post_id]?.author_id];
      if (access?.role === "users_admin") return !report.provider_id && author?.role === "TRAVELER" && !author.is_admin_only;
      if (access?.role === "business_admin") return !report.provider_id && author?.role === "BUSINESS_OWNER" && !author.is_admin_only;
      if (access?.role === "provider_admin") return Boolean(report.provider_id) || (author?.role && !["TRAVELER", "BUSINESS_OWNER", "SUPER_ADMIN"].includes(author.role) && !author.is_admin_only);
      return false;
    });
  };
  const loadSummary = async () => {
    const availableSummary = SUMMARY.filter((item) => canOpenSection(item.resource));
    const entries = await Promise.all(availableSummary.map(async (item) => {
      if (bypassAuth && LOCAL_ADMIN_TABLES.has(item.table)) {
        try {
          const rows = await loadLocalAdminTable(item.table, { limit: 1000, filter: item.filter?.[0], value: item.filter?.[1] });
          const visibleProfileRows = item.publicProfilesOnly ? rows.filter((row) => !row.is_admin_only) : rows;
          const visibleRows = item.resource === "reports" ? await reportsForCurrentAdmin(visibleProfileRows) : visibleProfileRows;
          return [item.resource, item.publicProfilesOnly ? visibleRows.filter((row) => !row.is_admin_only).length : visibleRows.length];
        }
        catch { return [item.resource, 0]; }
      }
      let request = supabase.from(item.table).select("*", { count: "exact", head: true });
      if (item.filter) request = request.eq(...item.filter);
      if (item.publicProfilesOnly) request = request.eq("is_admin_only", false);
      if (item.resource !== "reports" || isSuperAdmin(access)) {
        const result = await request;
        return [item.resource, result.count || 0];
      }
      const result = await supabase.from(item.table).select("id,status,social_post_id,provider_id");
      if (item.filter) result.data = (result.data || []).filter((row) => row[item.filter[0]] === item.filter[1]);
      return [item.resource, (await reportsForCurrentAdmin(result.data || [])).length];
    }));
    setCounts(Object.fromEntries(entries));
  };
  const loadDistrictOptions = async () => {
    const result = await supabase.from("districts").select("id,name,division,slug,status").order("name");
    if (result.error) return setError(result.error.message);
    setDistrictOptions(result.data || []);
  };
  const loadRows = async (target = resource) => {
    if (!target || target.id === "media" || isMediaAdmin || currentResource.current?.id !== target.id) return;
    const requestId = ++rowRequest.current;
    setLoading(true);
    setError("");
    let result;
    if (target.id === "blocked-accounts") {
      const tables = adminIsSuper ? ["profiles", "providers", "businesses"]
        : access?.role === "users_admin" ? ["profiles"]
          : access?.role === "provider_admin" ? ["providers"]
            : access?.role === "business_admin" ? ["businesses"] : [];
      const blockedRows = [];
      for (const table of tables) {
        let tableResult;
        if (bypassAuth) {
          try {
            tableResult = { data: await loadLocalAdminTable(table, { limit: 1000 }), error: null };
          } catch (localError) {
            tableResult = { data: null, error: localError };
          }
        } else {
          const statusColumn = table === "profiles" ? "status" : "account_status";
          tableResult = await supabase.from(table).select("*").eq(statusColumn, table === "profiles" ? "SUSPENDED" : "REMOVED").limit(1000);
        }
        if (tableResult.error) {
          result = tableResult;
          break;
        }
        for (const row of tableResult.data || []) {
          if (table === "profiles" && (row.is_admin_only || (!adminIsSuper && row.role !== "TRAVELER") || row.status !== "SUSPENDED")) continue;
          if (table === "providers" && row.account_status !== "REMOVED") continue;
          if (table === "businesses" && row.account_status !== "REMOVED") continue;
          if (!isAccountExplicitlyBlocked(row, table)) continue;
          blockedRows.push({
            ...row,
            _blocked_table: table,
            _row_key: `${table}:${row.id}`,
            full_name: row.full_name || row.owner_name || row.display_name || row.business_name || "—",
            email: row.email || row.contact_email || "—",
            phone: row.phone || row.contact_phone || "—",
            role: table === "providers" ? `Provider · ${row.provider_type || row.type || "Provider"}` : table === "businesses" ? "Business owner" : row.role,
            status: table === "profiles" ? row.status : row.account_status,
            updated_at: row.updated_at,
          });
        }
      }
      if (!result?.error) result = { data: blockedRows, error: null };
    } else if (bypassAuth && LOCAL_ADMIN_TABLES.has(target.table)) {
      try {
        const filter = target.providerType ? ["type", target.providerType] : target.profileRole ? ["role", target.profileRole] : target.profileStatus ? ["status", target.profileStatus] : target.accountStatus ? ["account_status", target.accountStatus] : target.subscriptionStatus ? ["status", target.subscriptionStatus] : [];
        result = { data: await loadLocalAdminTable(target.table, { limit: ["providers", "businesses"].includes(target.table) ? 500 : 1000, filter: filter[0], value: filter[1] }), error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else {
      let request = supabase.from(target.table).select(target.id === "places" ? "*,districts(name,division,slug)" : "*").limit(["places", "reports"].includes(target.id) ? 1000 : 100);
      if (target.providerType) request = request.eq("type", target.providerType);
      if (target.profileRole) request = request.eq("role", target.profileRole);
      if (target.publicProfilesOnly) request = request.eq("is_admin_only", false);
      if (target.profileStatus) request = request.eq("status", target.profileStatus);
      if (target.accountStatus) request = request.eq("account_status", target.accountStatus);
      if (target.subscriptionStatus) request = request.eq("status", target.subscriptionStatus);
      if (target.id === "reports") request = request.order("updated_at", { ascending: false });
      else if (target.id === "removed-accounts" || target.id === "blocked-accounts" || (target.columns.includes("updated_at") && !target.columns.includes("created_at"))) request = request.order("updated_at", { ascending: false });
      else if (target.id === "bookings" || target.columns.includes("created_at")) request = request.order("created_at", { ascending: false });
      result = await request;
    }
    if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
    if (result.error) {
      setLoading(false);
      return setError(target.businessSection && /schema cache|does not exist/i.test(result.error.message) ? "Business tables are not set up yet. Run Supabase migrations 072 and 073 in order." : result.error.message);
    }
    const resultRows = (result.data || []).filter((row) => {
      if (target.id === "blocked-accounts") return true;
      if (target.id === "reports") return true;
      if (target.activation && isAccountExplicitlyBlocked(row, target.table)) return false;
      if (target.id === "profiles") return (target.profileStatus ? row.status === target.profileStatus : row.status !== "SUSPENDED") && (!target.publicProfilesOnly || !row.is_admin_only);
      if (target.table === "providers" || target.table === "businesses") return target.accountStatus ? row.account_status === target.accountStatus : row.account_status !== "REMOVED";
      if (target.table === "provider_subscriptions" && target.subscriptionStatus) return row.status === target.subscriptionStatus;
      return true;
    });
    let nextRows = target.id === "places"
      ? resultRows.map((row) => ({
        ...row,
        district_name: row.districts?.name || "Unknown district",
        division_name: row.districts?.division || "Unknown division",
      }))
      : resultRows;
    if (target.table === "reports" && nextRows.length) {
      const postIds = [...new Set(nextRows.map((row) => row.social_post_id).filter(Boolean))];
      const providerIds = [...new Set(nextRows.map((row) => row.provider_id).filter(Boolean))];
      let postResult;
      let reportCountsByPostId = {};
      if (bypassAuth) {
        try {
          const [postsData, allReportsData] = await Promise.all([
            loadLocalAdminTable("social_posts", { limit: 500, ids: postIds }),
            loadLocalAdminTable("reports", { limit: 1000 }),
          ]);
          postResult = { data: postsData, error: null };
          for (const r of (allReportsData || [])) {
            if (r.social_post_id && postIds.includes(r.social_post_id)) {
              reportCountsByPostId[r.social_post_id] = (reportCountsByPostId[r.social_post_id] || 0) + 1;
            }
          }
        } catch (localError) { postResult = { data: [], error: localError }; }
      } else {
        const postQuery = postIds.length ? supabase.from("social_posts").select("id,author_id,body,product_name,media_type,media_path,location_name,created_at,is_hidden").in("id", postIds) : Promise.resolve({ data: [], error: null });
        const countQuery = postIds.length ? supabase.from("reports").select("id,social_post_id").in("social_post_id", postIds).limit(1000) : Promise.resolve({ data: [], error: null });
        const [postsResponse, countsResponse] = await Promise.all([postQuery, countQuery]);
        postResult = postsResponse;
        if (postResult.error && /product_name/i.test(postResult.error.message)) {
          postResult = postIds.length ? await supabase.from("social_posts").select("id,author_id,body,media_type,media_path,location_name,created_at,is_hidden").in("id", postIds) : { data: [], error: null };
        }
        if (postResult.error) {
          postResult = { data: [], error: null };
        }
        if (Array.isArray(countsResponse?.data)) {
          for (const r of countsResponse.data) {
            if (r.social_post_id) {
              reportCountsByPostId[r.social_post_id] = (reportCountsByPostId[r.social_post_id] || 0) + 1;
            }
          }
        }
      }
      for (const row of nextRows) {
        if (row.social_post_id) {
          const rowCount = nextRows.filter((r) => r.social_post_id === row.social_post_id).length;
          reportCountsByPostId[row.social_post_id] = Math.max(reportCountsByPostId[row.social_post_id] || 0, rowCount);
        }
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      const postsById = Object.fromEntries((postResult.data || []).map((item) => [item.id, item]));
      const authorIds = [...new Set((postResult.data || []).map((item) => item.author_id).filter(Boolean))];
      let profileResult;
      if (bypassAuth) {
        try { profileResult = { data: await loadLocalAdminTable("profiles", { limit: 500, ids: authorIds }), error: null }; }
        catch (localError) { profileResult = { data: [], error: localError }; }
      } else {
        profileResult = authorIds.length ? await supabase.from("profiles").select("id,full_name,email,phone,district,role,status,is_admin_only,bio,avatar_url,profile_photo_urls").in("id", authorIds) : { data: [], error: null };
        if (profileResult.error) {
          profileResult = { data: [], error: null };
        }
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      const profilesById = Object.fromEntries((profileResult.data || []).map((item) => [item.id, item]));
      let businessRows = [];
      if (isSuperAdmin(access) && bypassAuth) {
        try { businessRows = await loadLocalAdminTable("businesses", { limit: 500 }); }
        catch { businessRows = []; }
        businessRows = businessRows.filter((business) => authorIds.includes(business.user_id));
      } else if ((isSuperAdmin(access) || access?.role === "business_admin") && authorIds.length) {
        try {
          const businessResult = await supabase.from("businesses").select("*").in("user_id", authorIds);
          businessRows = (!businessResult.error && businessResult.data) || [];
        } catch { businessRows = []; }
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      const businessesByUserId = Object.fromEntries(businessRows.map((business) => [business.user_id, business]));
      let providerRows = [];
      if (bypassAuth) {
        try { providerRows = await loadLocalAdminTable("providers", { limit: 500 }); }
        catch { providerRows = []; }
        providerRows = providerRows.filter((provider) => providerIds.includes(provider.id) || authorIds.includes(provider.user_id));
      } else {
        try {
          const providerResults = await Promise.all([
            providerIds.length ? supabase.from("providers").select("*").in("id", providerIds) : Promise.resolve({ data: [], error: null }),
            authorIds.length ? supabase.from("providers").select("*").in("user_id", authorIds) : Promise.resolve({ data: [], error: null }),
          ]);
          providerRows = [...new Map(providerResults.flatMap((item) => item.data || []).map((provider) => [provider.id, provider])).values()];
        } catch { providerRows = []; }
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      const providersById = Object.fromEntries(providerRows.map((provider) => [provider.id, provider]));
      const providersByUserId = Object.fromEntries(providerRows.map((provider) => [provider.user_id, provider]));
      const subscriptionProviderIds = [...new Set([...providerIds, ...providerRows.map((provider) => provider.id)])];
      let subscriptionRows = [];
      if (bypassAuth) {
        try { subscriptionRows = await loadLocalAdminTable("provider_subscriptions", { limit: 500 }); }
        catch { subscriptionRows = []; }
        subscriptionRows = subscriptionRows.filter((subscription) => subscriptionProviderIds.includes(subscription.provider_id));
      } else if (subscriptionProviderIds.length) {
        try {
          const subscriptionResult = await supabase.from("provider_subscriptions").select("*").in("provider_id", subscriptionProviderIds);
          subscriptionRows = (!subscriptionResult.error && subscriptionResult.data) || [];
        } catch { subscriptionRows = []; }
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      const subscriptionsByProviderId = Object.fromEntries(subscriptionRows.map((subscription) => [subscription.provider_id, subscription]));
      const bookingIds = [...new Set(nextRows.map((row) => row.booking_id).filter(Boolean))];
      let reportedBookings = [];
      if (bypassAuth) {
        try { reportedBookings = await loadLocalAdminTable("bookings", { limit: 500, ids: bookingIds }); }
        catch { reportedBookings = []; }
      } else if (bookingIds.length) {
        try {
          const bookingResult = await supabase.from("bookings").select("*").in("id", bookingIds);
          reportedBookings = (!bookingResult.error && bookingResult.data) || [];
        } catch { reportedBookings = []; }
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      const bookingsById = Object.fromEntries(reportedBookings.map((booking) => [booking.id, booking]));
      if (!isSuperAdmin(access)) {
        nextRows = nextRows.filter((report) => {
          if (report.social_post_id) return true;
          const authorId = postsById[report.social_post_id]?.author_id;
          const author = profilesById[authorId];
          if (access?.role === "users_admin") return !report.provider_id && (author ? author.role === "TRAVELER" && !author.is_admin_only : true);
          if (access?.role === "business_admin") return !report.provider_id && (author ? author.role === "BUSINESS_OWNER" && !author.is_admin_only : true);
          if (access?.role === "provider_admin") return Boolean(report.provider_id) || Boolean(providersById[report.provider_id]) || (author ? !["TRAVELER", "BUSINESS_OWNER", "SUPER_ADMIN"].includes(author.role) && !author.is_admin_only : true);
          if (access?.role === "subscription_admin") return Boolean(subscriptionsByProviderId[report.provider_id] || subscriptionsByProviderId[providersByUserId[authorId]?.id]);
          if (access?.role === "booking_admin") return Boolean(bookingsById[report.booking_id]);
          return false;
        });
      }
      const mediaPaths = [...new Set((postResult.data || []).map((post) => post.media_path).filter(Boolean))];
      const mediaResults = await Promise.all(mediaPaths.map(async (path) => {
        try {
          if (bypassAuth) {
            const response = await fetch(`/__tourismubd-admin/post-media?path=${encodeURIComponent(path)}`);
            const payload = await response.json();
            return [path, response.ok ? payload.url || null : null];
          }
          const { data } = await supabase.storage.from("social-posts").createSignedUrl(path, 3600);
          return [path, data?.signedUrl || null];
        } catch { return [path, null]; }
      }));
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      const mediaUrlsByPath = Object.fromEntries(mediaResults);
      nextRows = nextRows.map((row) => {
        const post = postsById[row.social_post_id] || null;
        const owner = profilesById[post?.author_id] || null;
        const business = businessesByUserId[post?.author_id] || null;
        const provider = providersById[row.provider_id] || providersByUserId[post?.author_id] || null;
        const subscription = subscriptionsByProviderId[provider?.id || row.provider_id] || null;
        return {
          ...row,
          reason_categories: reportReasons(row),
          reported_post_owner: post ? owner?.full_name || "Unknown member" : business?.business_name || provider?.display_name || "Not a timeline post",
          reported_post_owner_id: post?.author_id || provider?.user_id || null,
          reported_post_owner_profile: owner,
          reported_provider_record: provider ? { ...provider, profile: owner } : null,
          reported_business_record: business ? { ...business, profile: owner } : null,
          reported_subscription_record: subscription ? { ...subscription, provider_record: provider ? { ...provider, profile: owner } : null } : null,
          reported_booking_record: bookingsById[row.booking_id] || null,
          reported_post: post ? `${post.product_name ? `${post.product_name}: ` : ""}${post.body}` : (row.details || "Timeline update"),
          reported_post_record: post ? { ...post, media_url: mediaUrlsByPath[post.media_path] || null } : null,
        };
      });
      nextRows = nextRows.filter((report) => !report.social_post_id || !isPostHidden(report.social_post_id, report.reported_post_record));
      nextRows = groupReportedPostRows(nextRows, reportCountsByPostId);
    }
    if (target.id === "removed-accounts") {
      let hiddenPosts = [];
      if (bypassAuth) {
        try {
          const allPosts = await loadLocalAdminTable("social_posts", { limit: 1000 });
          hiddenPosts = (allPosts || []).filter((p) => p && p.is_hidden);
        } catch { hiddenPosts = []; }
      } else {
        try {
          const { data: postsData } = await supabase
            .from("social_posts")
            .select("id,author_id,body,product_name,media_type,media_path,location_name,created_at,is_hidden")
            .eq("is_hidden", true)
            .order("created_at", { ascending: false })
            .limit(1000);
          hiddenPosts = postsData || [];
        } catch { hiddenPosts = []; }
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      const authorIds = [...new Set(hiddenPosts.map((p) => p.author_id).filter(Boolean))];
      let authorsById = {};
      if (authorIds.length) {
        if (bypassAuth) {
          try {
            const authors = await loadLocalAdminTable("profiles", { limit: 500, ids: authorIds });
            authorsById = Object.fromEntries((authors || []).map((a) => [a.id, a]));
          } catch {}
        } else {
          try {
            const { data: authors } = await supabase.from("profiles").select("id,full_name,email,role,district,status,is_admin_only").in("id", authorIds);
            authorsById = Object.fromEntries((authors || []).map((a) => [a.id, a]));
          } catch {}
        }
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      const postIds = hiddenPosts.map((p) => p.id);
      let reportsByPostId = {};
      if (postIds.length) {
        if (bypassAuth) {
          try {
            const allReports = await loadLocalAdminTable("reports", { limit: 1000 });
            for (const r of (allReports || [])) {
              if (r.social_post_id && postIds.includes(r.social_post_id)) {
                const list = reportsByPostId[r.social_post_id] || [];
                list.push(r);
                reportsByPostId[r.social_post_id] = list;
              }
            }
          } catch {}
        } else {
          try {
            const { data: reportRows } = await supabase.from("reports").select("id,status,details,reason_categories,category,created_by,created_at,updated_at,social_post_id").in("social_post_id", postIds).limit(1000);
            for (const r of (reportRows || [])) {
              if (r.social_post_id) {
                const list = reportsByPostId[r.social_post_id] || [];
                list.push(r);
                reportsByPostId[r.social_post_id] = list;
              }
            }
          } catch {}
        }
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      const mediaPaths = [...new Set(hiddenPosts.map((post) => post.media_path).filter(Boolean))];
      const mediaResults = await Promise.all(mediaPaths.map(async (path) => {
        try {
          if (bypassAuth) {
            const response = await fetch(`/__tourismubd-admin/post-media?path=${encodeURIComponent(path)}`);
            const payload = await response.json();
            return [path, response.ok ? payload.url || null : null];
          }
          const { data } = await supabase.storage.from("social-posts").createSignedUrl(path, 3600);
          return [path, data?.signedUrl || null];
        } catch { return [path, null]; }
      }));
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      const mediaUrlsByPath = Object.fromEntries(mediaResults);
      const postRows = hiddenPosts
        .filter((post) => {
          const author = authorsById[post.author_id] || null;
          if (author && isAccountExplicitlyBlocked(author, "profiles")) return false;
          if (isAccountExplicitlyBlocked({ id: post.author_id }, "profiles")) return false;
          return true;
        })
        .map((post) => {
        const author = authorsById[post.author_id] || null;
        const postReports = reportsByPostId[post.id] || [];
        const reportCount = postReports.length;
        const reasons = [...new Set(postReports.flatMap((r) => Array.isArray(r.reason_categories) ? r.reason_categories : []).filter(Boolean))];
        const latestReport = postReports[0];
        const mediaUrl = (post.media_path && mediaUrlsByPath[post.media_path]) || null;
        return {
          id: post.id,
          _row_key: post.id,
          _is_post: true,
          social_post_id: post.id,
          post_id: post.id,
          author_id: post.author_id,
          reported_post: post.product_name ? `${post.product_name}: ${post.body}` : post.body,
          body: post.body,
          media_type: post.media_type,
          media_path: post.media_path,
          media_url: mediaUrl,
          full_name: author?.full_name || "Unknown member",
          email: author?.email || "—",
          role: author?.role || "TRAVELER",
          district: author?.district || "—",
          status: "REMOVED",
          updated_at: latestReport?.updated_at || post.created_at,
          created_at: post.created_at,
          reports_count: reportCount,
          report_count: reportCount,
          report_ids: postReports.map((r) => r.id),
          all_reports: postReports,
          reason_categories: reasons,
          details: postReports.map((r) => r.details).filter(Boolean).join("\n\n") || "Post removed from active use.",
          reported_post_owner: author?.full_name || "Unknown member",
          reported_post_owner_id: post.author_id,
          reported_post_owner_profile: author,
          reported_post_record: { ...post, media_url: mediaUrl },
        };
      });
      const profileRows = nextRows.map((row) => ({
        ...row,
        _is_post: false,
        reported_post: "—",
      }));
      nextRows = [...postRows, ...profileRows].sort((left, right) =>
        Date.parse(right.updated_at || right.created_at || "") - Date.parse(left.updated_at || left.created_at || "")
      );
    }
    if (target.table === "providers" && nextRows.length) {
      let profileResult;
      if (bypassAuth) {
        try { profileResult = { data: await loadLocalAdminTable("profiles", { limit: 500, ids: nextRows.map((row) => row.user_id) }), error: null }; }
        catch (localError) { profileResult = { data: null, error: localError }; }
      } else {
        profileResult = await supabase.from("profiles").select("id,full_name,email,phone,bio,blood_group,gender,present_address,permanent_address,working_place,hobby,avatar_url,profile_photo_urls,district,role,status,created_at").in("id", nextRows.map((row) => row.user_id));
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      if (profileResult.error) return setError(profileResult.error.message);
      const profilesById = Object.fromEntries((profileResult.data || []).map((item) => [item.id, item]));
      nextRows = nextRows.map((row) => ({
        ...row,
        profile: profilesById[row.user_id] || null,
        owner_name: profilesById[row.user_id]?.full_name || row.display_name,
        provider_type: providerTypeLabel(row.type),
        district: profilesById[row.user_id]?.district || "Not provided",
      }));
    }
    if (target.table === "provider_subscriptions" && nextRows.length) {
      const providerIds = [...new Set(nextRows.map((row) => row.provider_id).filter(Boolean))];
      let providerResult;
      if (bypassAuth) {
        try { providerResult = { data: await loadLocalAdminTable("providers", { limit: 500, ids: providerIds }), error: null }; }
        catch (localError) { providerResult = { data: null, error: localError }; }
      } else {
        providerResult = providerIds.length ? await supabase.from("providers").select("id,user_id,type,display_name,service_name").in("id", providerIds) : { data: [], error: null };
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      if (providerResult.error) return setError(providerResult.error.message);
      const providersById = Object.fromEntries((providerResult.data || []).map((item) => [item.id, item]));
      const providerUserIds = [...new Set((providerResult.data || []).map((item) => item.user_id).filter(Boolean))];
      let profileResult;
      if (bypassAuth) {
        try { profileResult = { data: await loadLocalAdminTable("profiles", { limit: 500, ids: providerUserIds }), error: null }; }
        catch (localError) { profileResult = { data: null, error: localError }; }
      } else {
        profileResult = providerUserIds.length ? await supabase.from("profiles").select("id,full_name,district").in("id", providerUserIds) : { data: [], error: null };
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      if (profileResult.error) return setError(profileResult.error.message);
      const profilesById = Object.fromEntries((profileResult.data || []).map((item) => [item.id, item]));
      nextRows = nextRows.map((row) => {
        const provider = providersById[row.provider_id] || null;
        const providerProfile = profilesById[provider?.user_id] || null;
        return {
          ...row,
          owner_name: providerProfile?.full_name || provider?.display_name || "Not provided",
          service_name: provider?.service_name || provider?.display_name || "Not added",
          provider_type: providerTypeLabel(row.provider_type || provider?.type),
          district: providerProfile?.district || "Not provided",
          provider_record: provider ? { ...provider, profile: providerProfile } : null,
        };
      });
    }
    if (target.table === "bookings" && nextRows.length) {
      const providerIds = [...new Set(nextRows.map((row) => row.provider_id).filter(Boolean))];
      const travelerIds = [...new Set(nextRows.map((row) => row.traveler_id).filter(Boolean))];
      let providerResult;
      let profileResult;
      if (bypassAuth) {
        try {
          [providerResult, profileResult] = await Promise.all([
            loadLocalAdminTable("providers", { limit: 500, ids: providerIds }),
            loadLocalAdminTable("profiles", { limit: 500, ids: travelerIds }),
          ]);
          providerResult = { data: providerResult, error: null };
          profileResult = { data: profileResult, error: null };
        } catch (localError) {
          providerResult = { data: null, error: localError };
          profileResult = { data: null, error: localError };
        }
      } else {
        [providerResult, profileResult] = await Promise.all([
          providerIds.length ? supabase.from("providers").select("id,user_id,display_name,service_name").in("id", providerIds) : Promise.resolve({ data: [], error: null }),
          travelerIds.length ? supabase.from("profiles").select("id,full_name,email,phone").in("id", travelerIds) : Promise.resolve({ data: [], error: null }),
        ]);
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      if (providerResult.error || profileResult.error) return setError(providerResult.error?.message || profileResult.error?.message);
      const providersById = Object.fromEntries((providerResult.data || []).map((item) => [item.id, item]));
      const travelerProfilesById = Object.fromEntries((profileResult.data || []).map((item) => [item.id, item]));
      const providerUserIds = [...new Set((providerResult.data || []).map((item) => item.user_id).filter(Boolean))];
      let providerProfilesResult;
      if (bypassAuth) {
        try { providerProfilesResult = { data: await loadLocalAdminTable("profiles", { limit: 500, ids: providerUserIds }), error: null }; }
        catch (localError) { providerProfilesResult = { data: null, error: localError }; }
      } else {
        providerProfilesResult = providerUserIds.length ? await supabase.from("profiles").select("id,full_name,email,phone,bio,blood_group,gender,present_address,permanent_address,working_place,hobby,avatar_url,profile_photo_urls,district,role,status,created_at").in("id", providerUserIds) : { data: [], error: null };
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      if (providerProfilesResult.error) return setError(providerProfilesResult.error.message);
      const providerProfilesById = Object.fromEntries((providerProfilesResult.data || []).map((item) => [item.id, item]));
      let providerRatings = [];
      if (bypassAuth) {
        try {
          const reviews = await loadLocalAdminTable("reviews", { limit: 500 });
          const bookingProviders = Object.fromEntries(nextRows.map((booking) => [booking.id, booking.provider_id]));
          const ratingsByProvider = new Map();
          reviews.forEach((review) => {
            const providerId = bookingProviders[review.booking_id];
            if (!providerId || review.status !== "PUBLISHED") return;
            const rating = ratingsByProvider.get(providerId) || { total: 0, count: 0 };
            rating.total += Number(review.rating) || 0;
            rating.count += 1;
            ratingsByProvider.set(providerId, rating);
          });
          providerRatings = [...ratingsByProvider].map(([id, rating]) => ({ id, rating_average: rating.total / rating.count, rating_count: rating.count }));
        } catch (localError) {
          return setError(localError instanceof Error ? localError.message : "Could not load provider ratings.");
        }
      } else if (providerIds.length) {
        const ratingResult = await supabase.from("public_provider_details").select("id,rating_average,rating_count").in("id", providerIds);
        if (ratingResult.error) return setError(ratingResult.error.message);
        providerRatings = ratingResult.data || [];
      }
      const providerRatingsById = Object.fromEntries(providerRatings.map((rating) => [rating.id, rating]));
      nextRows = nextRows.map((row) => {
        const provider = providersById[row.provider_id];
        const providerProfile = providerProfilesById[provider?.user_id] || null;
        const travelerProfile = travelerProfilesById[row.traveler_id] || null;
        const rating = providerRatingsById[row.provider_id];
        return {
          ...row,
          service_name: provider?.service_name || provider?.display_name || "Not added",
          provider_name: providerProfile?.full_name || provider?.display_name || "Not provided",
          provider_rating: rating?.rating_count ? `${Number(rating.rating_average).toFixed(1)} (${rating.rating_count})` : "No ratings",
          traveler_name: travelerProfile?.full_name || "Not provided",
          traveler_profile: travelerProfile,
          provider_record: provider ? { ...provider, profile: providerProfile } : null,
        };
      });
      const groupedBookings = new Map();
      nextRows.forEach((booking) => {
        const key = booking.provider_id || booking.id;
        const current = groupedBookings.get(key);
        const bookingTime = Date.parse(booking.created_at || booking.start_date || "");
        const currentTime = Date.parse(current?.latest.created_at || current?.latest.start_date || "");
        if (!current) {
          groupedBookings.set(key, { latest: booking, bookings: [booking], travelerNames: new Set([booking.traveler_name]), bookingCount: 1 });
          return;
        }
        current.bookings.push(booking);
        current.travelerNames.add(booking.traveler_name);
        current.bookingCount += 1;
        if (bookingTime > currentTime) current.latest = booking;
      });
      nextRows = [...groupedBookings.values()].map(({ latest, bookings, travelerNames, bookingCount }) => ({
        ...latest,
        id: latest.provider_id || latest.id,
        traveler_names: [...travelerNames].join(", "),
        booking_count: bookingCount,
        latest_booking: latest.start_date,
        booking_records: bookings,
      }));
    }
    if (target.table === "businesses" && nextRows.length) {
      let profileResult;
      if (bypassAuth) {
        try { profileResult = { data: await loadLocalAdminTable("profiles", { limit: 500, ids: nextRows.map((row) => row.user_id) }), error: null }; }
        catch (localError) { profileResult = { data: null, error: localError }; }
      } else {
        profileResult = await supabase.from("profiles").select("id,full_name,email,phone,district,role,status,created_at").in("id", nextRows.map((row) => row.user_id));
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      if (profileResult.error) return setError(profileResult.error.message);
      const profilesById = Object.fromEntries((profileResult.data || []).map((item) => [item.id, item]));
      nextRows = nextRows.map((row) => ({ ...row, profile: profilesById[row.user_id] || null, owner_name: profilesById[row.user_id]?.full_name || "Not provided" }));
    }
    if (target.table === "business_products" && nextRows.length) {
      let businessResult;
      if (bypassAuth) {
        try { businessResult = { data: await loadLocalAdminTable("businesses", { limit: 500, ids: [...new Set(nextRows.map((row) => row.business_id))] }), error: null }; }
        catch (localError) { businessResult = { data: null, error: localError }; }
      } else {
        businessResult = await supabase.from("businesses").select("id,business_name").in("id", nextRows.map((row) => row.business_id));
      }
      if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
      if (businessResult.error) return setError(businessResult.error.message);
      const businessesById = Object.fromEntries((businessResult.data || []).map((item) => [item.id, item]));
      nextRows = nextRows.map((row) => ({ ...row, seller_name: businessesById[row.business_id]?.business_name || "Unknown business" }));
    }
    setRows(sortDestinationRows(nextRows, target.id));
    setLoading(false);
  };

  useEffect(() => { loadSummary(); if (adminIsSuper) loadDistrictOptions(); }, [adminIsSuper, canOpenSection]);
  useEffect(() => {
    setQuery("");
    setDivisionFilter("");
    setDistrictFilter("");
    setPlaceVisibilityFilter("ALL");
    setReportStatusFilter("OPEN");
    setRows([]);
    setEditing(null);
    setPlaceEditor(null);
    setDeleting(null);
    setProviderProfile(null);
    setBookingHistory(null);
    setReportDetails(null);
    setTravelerProfile(null);
    if (resource) loadRows(resource);
    else { rowRequest.current += 1; setLoading(false); }
  }, [resource]);
  useEffect(() => {
    if (resource?.id !== "reports") return undefined;
    const refreshReports = () => {
      if (document.visibilityState === "visible") {
        loadRows(resource);
        loadSummary();
      }
    };
    window.addEventListener("focus", refreshReports);
    document.addEventListener("visibilitychange", refreshReports);
    let channel;
    if (!bypassAuth && supabase) {
      channel = supabase
        .channel("admin-reports-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
          loadRows(resource);
          loadSummary();
        })
        .subscribe();
    }
    return () => {
      window.removeEventListener("focus", refreshReports);
      document.removeEventListener("visibilitychange", refreshReports);
      if (channel) supabase.removeChannel(channel);
    };
  }, [bypassAuth, resource]);
  useEffect(() => {
    if (bypassAuth) return undefined;
    let active = true;
    const validate = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active || !data.session?.user) return active && onAccessLost();
      const result = await supabase.rpc("current_admin_access");
      if (active && (result.error || !hasAdminAccess(result.data?.[0]))) onAccessLost();
    };
    const onFocus = () => validate();
    window.addEventListener("focus", onFocus);
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) onAccessLost();
      else window.setTimeout(validate, 0);
    });
    return () => { active = false; window.removeEventListener("focus", onFocus); data.subscription.unsubscribe(); };
  }, [bypassAuth, onAccessLost]);

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (needle && !JSON.stringify(row).toLowerCase().includes(needle)) return false;
      if (divisionFilter && row.division_name !== divisionFilter) return false;
      if (districtFilter && row.district_id !== districtFilter) return false;
      if (resource?.id === "places" && placeVisibilityFilter === "HIDDEN" && row.status !== "HIDDEN") return false;
      if (resource?.id === "places" && placeVisibilityFilter === "ALL" && row.status === "HIDDEN") return false;
      if (resource?.id === "reports" && reportStatusFilter === "OPEN" && ["RESOLVED", "DISMISSED"].includes(row.status)) return false;
      if (resource?.id === "reports" && reportStatusFilter === "RESOLVED" && !["RESOLVED", "DISMISSED"].includes(row.status)) return false;
      if (resource?.id === "reports" && row.social_post_id && isPostHidden(row.social_post_id, row.reported_post_record)) return false;
      if (resource?.id === "removed-accounts" && row._is_post && !isPostHidden(row.id, row.reported_post_record)) return false;
      return true;
    });
  }, [districtFilter, divisionFilter, placeVisibilityFilter, query, reportStatusFilter, resource?.id, rows]);

  const divisionOptions = useMemo(() => [...new Set(districtOptions.map((district) => district.division))].sort(), [districtOptions]);
  const filteredDistrictOptions = useMemo(() => districtOptions.filter((district) => !divisionFilter || district.division === divisionFilter), [districtOptions, divisionFilter]);

  const applyAccountAction = async (row) => {
    if (row._is_post) {
      if (!row._forceBlock) {
        let result;
        if (bypassAuth) {
          try {
            const data = await mutateLocalAdminTable("social_posts", "PATCH", "id", row.id, { is_hidden: false });
            result = { data: data[0] || null, error: null };
            await mutateLocalAdminTable("reports", "PATCH", "social_post_id", row.id, adminRemovalPatch("resolve", user.id)).catch(() => null);
          } catch (localError) {
            result = { data: null, error: localError };
          }
        } else {
          result = await supabase.from("social_posts").update({ is_hidden: false }).eq("id", row.id).select("id").maybeSingle();
          await supabase.from("reports").update(adminRemovalPatch("resolve", user.id)).eq("social_post_id", row.id);
        }
        if (result.error) return setError(result.error.message);
        if (!result.data) return setError("No post was activated. Your access may have changed.");
        setHiddenSocialPost(row.id, false);
        notify("Post restored to active use.");
        await Promise.all([loadRows(), loadSummary()]);
        return;
      }
    }
    const isExplicitBlock = Boolean(row._forceBlock);
    const table = (row._is_post || row._blockAccountId || row.reported_post_owner_id) ? "profiles" : (resource.id === "blocked-accounts" ? row._blocked_table : resource.table);
    const targetAccountId = row._blockAccountId || (row._is_post ? (row.author_id || row.reported_post_owner_id) : (row.reported_post_owner_id || row.id));
    if (table === "profiles" && !canManageProfile(user.id, targetAccountId)) return setError("You cannot suspend your own Admin account.");
    const restoring = !isExplicitBlock && (Boolean(resource.activation) || resource.id === "blocked-accounts");
    const blocking = isExplicitBlock || (!restoring && (resource.id === "profiles" || resource.table === "providers" || resource.businessSection));
    if (!resource.remove && resource.id !== "blocked-accounts" && !isExplicitBlock) return;
    const patch = isExplicitBlock
      ? table === "profiles" ? adminRemovalPatch({ status: "SUSPENDED", is_blocked: true }, user.id)
        : adminRemovalPatch({ account_status: "REMOVED", public_status: "HIDDEN", is_blocked: true }, user.id)
      : resource.id === "blocked-accounts"
        ? table === "profiles" ? adminRemovalPatch({ status: "ACTIVE", is_blocked: false }, user.id)
          : adminRemovalPatch({ account_status: "ACTIVE", public_status: "PUBLISHED", is_blocked: false }, user.id)
        : adminRemovalPatch(resource.activation ? { ...resource.remove, is_blocked: false } : resource.remove, user.id);
    const key = (row._is_post || row._blockAccountId || row.reported_post_owner_id) ? "id" : (resource.id === "blocked-accounts" ? "id" : resource.primaryKey || "id");
    const targetId = (row._is_post || row._blockAccountId || row.reported_post_owner_id) ? targetAccountId : row[key];
    let result;
    if (bypassAuth && LOCAL_ADMIN_MUTABLE_TABLES.has(table)) {
      try {
        const data = await mutateLocalAdminTable(table, "PATCH", key, targetId, patch);
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else {
      result = await supabase.from(table).update(patch).eq(key, targetId).select(key).maybeSingle();
      if (result.error && /is_blocked/i.test(result.error.message)) {
        const fallbackPatch = { ...patch };
        delete fallbackPatch.is_blocked;
        result = await supabase.from(table).update(fallbackPatch).eq(key, targetId).select(key).maybeSingle();
      }
    }
    if (result.error) return setError(result.error.message);
    if (!result.data) return setError("No record was changed. Your access may have changed.");
    if (isExplicitBlock) {
      setExplicitBlockedAccount(targetId, true);
    } else if (restoring) {
      setExplicitBlockedAccount(targetId, false);
    } else if (blocking) {
      setExplicitBlockedAccount(targetId, false);
    }
    if (isExplicitBlock && table === "profiles") {
      const blockLinkedPatch = { account_status: "REMOVED", public_status: "HIDDEN", is_blocked: true };
      try {
        for (const linkedTable of ["providers", "businesses"]) {
          if (bypassAuth) {
            const accounts = await loadLocalAdminTable(linkedTable, { limit: 500, filter: "user_id", value: targetId });
            await Promise.all(accounts.map((account) => {
              setExplicitBlockedAccount(account.id, true);
              return mutateLocalAdminTable(linkedTable, "PATCH", "id", account.id, blockLinkedPatch);
            }));
          } else {
            const { data: linkedAccounts } = await supabase.from(linkedTable).select("id").eq("user_id", targetId);
            (linkedAccounts || []).forEach((acct) => setExplicitBlockedAccount(acct.id, true));
            await supabase.from(linkedTable).update(blockLinkedPatch).eq("user_id", targetId);
          }
        }
      } catch {
        // best effort cascade
      }
    }
    if (isExplicitBlock && (row.social_post_id || row._is_post || resource.id === "reports")) {
      const postId = row.social_post_id || (row._is_post ? row.id : null);
      if (postId) {
        setHiddenSocialPost(postId, true);
        if (bypassAuth) {
          try {
            await mutateLocalAdminTable("social_posts", "PATCH", "id", postId, { is_hidden: true });
          } catch { /* best effort */ }
        } else {
          try {
            await supabase.from("social_posts").update({ is_hidden: true }).eq("id", postId);
          } catch { /* best effort */ }
        }
      }
      if (bypassAuth) {
        try {
          if (row.id && resource.id === "reports") {
            await mutateLocalAdminTable("reports", "PATCH", "id", row.id, adminRemovalPatch("resolve", user.id));
          }
          if (row.report_ids?.length) {
            for (const rid of row.report_ids) {
              await mutateLocalAdminTable("reports", "PATCH", "id", rid, adminRemovalPatch("resolve", user.id)).catch(() => null);
            }
          }
          if (postId) {
            await mutateLocalAdminTable("reports", "PATCH", "social_post_id", postId, adminRemovalPatch("resolve", user.id)).catch(() => null);
          }
        } catch { /* best effort */ }
      } else {
        if (postId) {
          await supabase.from("reports").update(adminRemovalPatch("resolve", user.id)).eq("social_post_id", postId);
        }
        if (row.id && resource.id === "reports") {
          await supabase.from("reports").update(adminRemovalPatch("resolve", user.id)).eq("id", row.id);
        }
        if (row.report_ids?.length) {
          await supabase.from("reports").update(adminRemovalPatch("resolve", user.id)).in("id", row.report_ids);
        }
      }
    }
    if (restoring && resource.table === "profiles" && resource.id !== "blocked-accounts") {
      const restorePatch = { account_status: "ACTIVE", public_status: "PUBLISHED" };
      try {
        for (const table of ["providers", "businesses"]) {
          if (bypassAuth) {
            const accounts = await loadLocalAdminTable(table, { limit: 500, filter: "user_id", value: row.id });
            await Promise.all(accounts.filter((account) => account.account_status === "REMOVED").map((account) => {
              setExplicitBlockedAccount(account.id, false);
              return mutateLocalAdminTable(table, "PATCH", "id", account.id, restorePatch);
            }));
          } else {
            const restored = await supabase.from(table).update(restorePatch).eq("user_id", row.id).eq("account_status", "REMOVED");
            if (restored.error) throw restored.error;
            setExplicitBlockedAccount(row.id, false);
          }
        }
      } catch (restoreError) {
        return setError(restoreError instanceof Error ? restoreError.message : "The account was activated, but its services could not be restored.");
      }
    }
    if (isExplicitBlock) {
      notify("Account blocked. It is now in Blocked accounts.");
      await loadSummary();
      setSection("blocked-accounts");
      return;
    }
    notify(restoring ? "Account restored to active use." : blocking ? "Account blocked. It is now in its Activate tab." : "Record removed from active use.");
    if (blocking) {
      await loadSummary();
      setSection(table === "providers" ? "removed-providers" : table === "businesses" ? "removed-businesses" : "removed-accounts");
      return;
    }
    await Promise.all([loadRows(), loadSummary()]);
  };

  const remove = (row) => {
    if (resource.id === "reports") return removeReportedPostOwner(row);
    if (resource.remove) setAccountAction(row);
  };

  const blockAccount = (row) => {
    if (!adminIsSuper && !["users_admin", "provider_admin", "business_admin"].includes(access?.role)) return setError("Only authorized administrators can block accounts.");
    const accountId = row._is_post ? (row.author_id || row.reported_post_owner_id) : (row.reported_post_owner_id || row.id);
    const table = (row._is_post || row.reported_post_owner_id) ? "profiles" : (resource.id === "blocked-accounts" ? row._blocked_table : resource.table);
    if (table === "profiles" && !canManageProfile(user.id, accountId)) return setError("You cannot suspend your own Admin account.");
    setAccountAction({ ...row, _forceBlock: true, _blockAccountId: accountId });
  };

  const setPlaceStatus = async (row, status) => {
    let result;
    if (bypassAuth) {
      try {
        const data = await mutateLocalAdminTable("places", "PATCH", "id", row.id, { status });
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else {
      result = await supabase.from("places").update({ status }).eq("id", row.id).select("id").maybeSingle();
    }
    if (result.error) return setError(result.error.message);
    if (!result.data) return setError("No tourist place was changed. Your access may have changed.");
    notify(status === "PUBLISHED" ? "Tourist place published." : "Tourist place hidden.");
    await Promise.all([loadRows(), loadSummary()]);
  };

  const deleteReportedPost = async (report) => {
    if (!report.social_post_id) return setError("This report is not linked to a timeline post.");
    if (!window.confirm("Permanently delete the reported timeline post?")) return;
    let result;
    if (bypassAuth) {
      try {
        const data = await mutateLocalAdminTable("social_posts", "DELETE", "id", report.social_post_id);
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else {
      result = await supabase.from("social_posts").delete().eq("id", report.social_post_id).select("id").maybeSingle();
    }
    if (result.error) return setError(result.error.message);
    if (!result.data) return setError("No timeline post was deleted. Your access may have changed.");
    setHiddenSocialPost(report.social_post_id, false);
    setReportDetails(null);
    notify("Reported timeline post deleted.");
    await loadRows();
  };

  const cancelBooking = async (booking) => {
    if (!["PENDING", "CONFIRMED"].includes(booking.status)) return setError("Only pending or confirmed bookings can be cancelled.");
    if (!window.confirm(`Cancel booking ${booking.id}?`)) return;
    const patch = { status: "CANCELLED", cancelled_by: user.id, cancelled_at: new Date().toISOString(), cancellation_reason: "Cancelled by Booking Admin" };
    let result;
    if (bypassAuth) {
      try {
        const data = await mutateLocalAdminTable("bookings", "PATCH", "id", booking.id, patch);
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else {
      result = await supabase.from("bookings").update(patch).eq("id", booking.id).select("id").maybeSingle();
    }
    if (result.error) return setError(result.error.message);
    if (!result.data) return setError("No booking was cancelled. Your access may have changed.");
    setBookingHistory(null);
    notify("Booking cancelled.");
    await Promise.all([loadRows(), loadSummary()]);
  };

  const linkReportedPost = async (report) => {
    const postId = window.prompt("Paste the Post ID for the timeline post this report is about.");
    if (!postId) return;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(postId.trim())) return setError("Enter a valid Post ID.");
    let result;
    if (bypassAuth) {
      try {
        const data = await mutateLocalAdminTable("reports", "PATCH", "id", report.id, { social_post_id: postId.trim() });
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else {
      result = await supabase.from("reports").update({ social_post_id: postId.trim() }).eq("id", report.id).select("id").maybeSingle();
    }
    if (result.error) return setError(result.error.message);
    if (!result.data) return setError("No report was linked. Confirm the Post ID and your Admin access.");
    setReportDetails(null);
    notify("Report linked to the timeline post.");
    await loadRows();
  };

  const removeReportedPostOwner = (report, target = report?.social_post_id ? "post" : "account") => {
    const isPostTarget = target === "post";
    const providerTarget = target === "provider";
    const subscriptionTarget = target === "subscription";
    const businessTarget = target === "business";
    const allowed = adminIsSuper
      || (access?.role === "users_admin" && (target === "account" || isPostTarget) && !report.reported_provider_record && report.reported_post_owner_profile?.role === "TRAVELER" && !report.reported_post_owner_profile?.is_admin_only)
      || (access?.role === "provider_admin" && providerTarget && Boolean(report.reported_provider_record))
      || (access?.role === "business_admin" && businessTarget && Boolean(report.reported_business_record))
      || (access?.role === "subscription_admin" && subscriptionTarget && Boolean(report.reported_subscription_record))
      || (access?.role === "booking_admin" && target === "booking" && Boolean(report.reported_booking_record));
    if (!allowed) return setError("Use your assigned account section to manage this report target.");
    if (isPostTarget && !report.social_post_id) return setError("This report is not linked to a timeline post.");
    if (target === "account" && !report.reported_post_owner_id) return setError("This report is not linked to an account.");
    report.admin_action_target = target;
    setReportAccountAction(report);
  };

  const suspendReportedPostOwner = async (report) => {
    let result;
    const target = report.admin_action_target || (report.social_post_id ? "post" : "account");
    const isPostTarget = target === "post";
    const providerTarget = target === "provider";
    const subscriptionTarget = target === "subscription";
    const bookingTarget = target === "booking";
    const businessTarget = target === "business";
    if (isPostTarget) {
      if (!report.social_post_id) return setError("This report is not linked to a timeline post.");
      if (bypassAuth) {
        try {
          const data = await mutateLocalAdminTable("social_posts", "PATCH", "id", report.social_post_id, { is_hidden: true });
          result = { data: data[0] || null, error: null };
        } catch (localError) {
          result = { data: null, error: localError };
        }
      } else {
        result = await supabase.from("social_posts").update({ is_hidden: true }).eq("id", report.social_post_id).select("id").maybeSingle();
      }
      if (result.error) return setError(result.error.message);
      if (!result.data) return setError("No post was removed. Your access may have changed.");
      setHiddenSocialPost(report.social_post_id, true);
      let reportResult;
      if (bypassAuth) {
        try {
          const data = await mutateLocalAdminTable("reports", "PATCH", "id", report.id, adminRemovalPatch("resolve", user.id));
          reportResult = { data: data[0] || null, error: null };
          if (report.report_ids?.length) {
            for (const rid of report.report_ids) {
              if (rid !== report.id) {
                await mutateLocalAdminTable("reports", "PATCH", "id", rid, adminRemovalPatch("resolve", user.id)).catch(() => null);
              }
            }
          }
        } catch (localError) {
          reportResult = { data: null, error: localError };
        }
      } else {
        await supabase.from("reports").update(adminRemovalPatch("resolve", user.id)).eq("social_post_id", report.social_post_id);
        reportResult = await supabase.from("reports").update(adminRemovalPatch("resolve", user.id)).eq("id", report.id).select("id").maybeSingle();
      }
      if (reportResult.error || !reportResult.data) {
        await Promise.all([loadRows(), loadSummary()]);
        return setError(`Post is hidden, but the report could not be resolved. ${reportResult.error?.message || "Try resolving the report again."}`);
      }
      setReportDetails(null);
      notify("Post removed from active use. It is now in Activate post.");
      await loadSummary();
      setSection("removed-accounts");
      return;
    }
    if (report.reported_post_owner_id) setExplicitBlockedAccount(report.reported_post_owner_id, false);
    if (report.reported_provider_record?.id) setExplicitBlockedAccount(report.reported_provider_record.id, false);
    if (report.reported_business_record?.id) setExplicitBlockedAccount(report.reported_business_record.id, false);
    if (providerTarget && !report.reported_provider_record?.id) return setError("The reported provider record could not be found.");
    if (subscriptionTarget && !report.reported_subscription_record?.id) return setError("The reported subscription record could not be found.");
    if (bookingTarget && !report.reported_booking_record?.id) return setError("The reported booking record could not be found.");
    if (businessTarget && !report.reported_business_record?.id) return setError("The reported business record could not be found.");
    if (bookingTarget && !["PENDING", "CONFIRMED"].includes(report.reported_booking_record.status)) return setError("Only pending or confirmed bookings can be cancelled.");
    if (businessTarget && bypassAuth) {
      try {
        const data = await mutateLocalAdminTable("businesses", "PATCH", "id", report.reported_business_record.id, { account_status: "REMOVED", public_status: "HIDDEN" });
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else if (businessTarget) {
      result = await supabase.from("businesses").update({ account_status: "REMOVED", public_status: "HIDDEN" }).eq("id", report.reported_business_record.id).select("id").maybeSingle();
    } else if (bookingTarget && bypassAuth) {
      try {
        const data = await mutateLocalAdminTable("bookings", "PATCH", "id", report.reported_booking_record.id, { status: "CANCELLED", cancelled_by: user.id, cancelled_at: new Date().toISOString(), cancellation_reason: "Cancelled after report review" });
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else if (bookingTarget) {
      result = await supabase.from("bookings").update({ status: "CANCELLED", cancelled_by: user.id, cancelled_at: new Date().toISOString(), cancellation_reason: "Cancelled after report review" }).eq("id", report.reported_booking_record.id).select("id").maybeSingle();
    } else if (subscriptionTarget && bypassAuth) {
      try {
        const data = await mutateLocalAdminTable("provider_subscriptions", "PATCH", "id", report.reported_subscription_record.id, { status: "FROZEN" });
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else if (subscriptionTarget) {
      result = await supabase.from("provider_subscriptions").update({ status: "FROZEN" }).eq("id", report.reported_subscription_record.id).select("id").maybeSingle();
    } else if (providerTarget && bypassAuth) {
      try {
        const data = await mutateLocalAdminTable("providers", "PATCH", "id", report.reported_provider_record.id, { account_status: "REMOVED", public_status: "HIDDEN" });
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else if (providerTarget) {
      result = await supabase.from("providers").update({ account_status: "REMOVED", public_status: "HIDDEN" }).eq("id", report.reported_provider_record.id).select("id").maybeSingle();
    } else if (bypassAuth) {
      try {
        const data = await mutateLocalAdminTable("profiles", "PATCH", "id", report.reported_post_owner_id, { status: "SUSPENDED" });
        result = { data: data[0] || null, error: null };
        if (result.data) {
          const removedPatch = { account_status: "REMOVED", public_status: "HIDDEN" };
          for (const table of ["providers", "businesses"]) {
            const accounts = await loadLocalAdminTable(table, { limit: 500, filter: "user_id", value: report.reported_post_owner_id });
            await Promise.all(accounts.map((account) => mutateLocalAdminTable(table, "PATCH", "id", account.id, removedPatch)));
          }
        }
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else {
      result = await supabase.from("profiles").update({ status: "SUSPENDED" }).eq("id", report.reported_post_owner_id).select("id").maybeSingle();
      if (!result.error && result.data) {
        const removedPatch = { account_status: "REMOVED", public_status: "HIDDEN" };
        await Promise.allSettled([
          supabase.from("providers").update(removedPatch).eq("user_id", report.reported_post_owner_id),
          supabase.from("businesses").update(removedPatch).eq("user_id", report.reported_post_owner_id),
        ]);
      }
    }
    if (result.error) return setError(result.error.message);
    if (!result.data) return setError("No account was removed. Your access may have changed.");
    if (report.social_post_id) {
      setHiddenSocialPost(report.social_post_id, true);
      if (bypassAuth) {
        try {
          await mutateLocalAdminTable("social_posts", "PATCH", "id", report.social_post_id, { is_hidden: true });
        } catch { /* best effort */ }
      } else {
        try {
          await supabase.from("social_posts").update({ is_hidden: true }).eq("id", report.social_post_id);
        } catch { /* best effort */ }
      }
    }
    let reportResult;
    if (bypassAuth) {
      try {
        const data = await mutateLocalAdminTable("reports", "PATCH", "id", report.id, adminRemovalPatch("resolve", user.id));
        reportResult = { data: data[0] || null, error: null };
        if (report.report_ids?.length) {
          for (const rid of report.report_ids) {
            if (rid !== report.id) {
              await mutateLocalAdminTable("reports", "PATCH", "id", rid, adminRemovalPatch("resolve", user.id)).catch(() => null);
            }
          }
        }
      } catch (localError) {
        reportResult = { data: null, error: localError };
      }
    } else {
      if (report.social_post_id) {
        await supabase.from("reports").update(adminRemovalPatch("resolve", user.id)).eq("social_post_id", report.social_post_id);
      }
      reportResult = await supabase.from("reports").update(adminRemovalPatch("resolve", user.id)).eq("id", report.id).select("id").maybeSingle();
    }
    if (reportResult.error || !reportResult.data) {
      await Promise.all([loadRows(), loadSummary()]);
      return setError(`${businessTarget ? "Business is removed and hidden" : bookingTarget ? "Booking is cancelled" : subscriptionTarget ? "Subscription is frozen" : providerTarget ? "Provider is removed and hidden" : "Account is suspended and hidden"}, but the report could not be resolved. ${reportResult.error?.message || "Try resolving the report again."}`);
    }
    setReportDetails(null);
    notify(businessTarget ? "Business removed from active use. It is now in Activate businesses." : bookingTarget ? "Booking cancelled and report resolved." : subscriptionTarget ? "Subscription frozen. It is now in Activate subscriptions." : providerTarget ? "Provider removed from active use. It is now in Activate providers." : adminIsSuper ? "Account removed. It is now in Activate accounts." : "Account removed. It is now in Activate users.");
    await loadSummary();
    setSection(businessTarget ? "removed-businesses" : bookingTarget ? "bookings" : subscriptionTarget ? "frozen-subscriptions" : providerTarget ? "removed-providers" : "removed-accounts");
  };

  const activateAccount = async (row) => {
    setExplicitBlockedAccount(row.id, false);
    let result;
    if (bypassAuth) {
      try {
        const data = await mutateLocalAdminTable("profiles", "PATCH", "id", row.id, { status: "ACTIVE" });
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else {
      result = await supabase.from("profiles").update({ status: "ACTIVE" }).eq("id", row.id).select("id").maybeSingle();
    }
    if (result.error) return setError(result.error.message);
    if (!result.data) return setError("No account was activated. Your access may have changed.");
    notify("Account activated.");
    await Promise.all([loadRows(), loadSummary()]);
  };

  const destroy = async (row) => {
    if (row._is_post) {
      let result;
      if (bypassAuth) {
        try {
          const data = await mutateLocalAdminTable("social_posts", "DELETE", "id", row.id);
          result = { data: data[0] || null, error: null };
        } catch (localError) {
          result = { data: null, error: localError };
        }
      } else {
        result = await supabase.from("social_posts").delete().eq("id", row.id).select("id").maybeSingle();
      }
      if (result.error) { setDeleting(null); return setError(result.error.message); }
      if (!result.data) { setDeleting(null); return setError("No post was deleted. Your access may have changed."); }
      setHiddenSocialPost(row.id, false);
      setDeleting(null);
      notify("Reported timeline post deleted.");
      await Promise.all([loadRows(), loadSummary()]);
      return;
    }
    if (resource.noDelete) return setError(resource.deleteReason);

    // Deleting any user, provider, or business account permanently deletes
    // their identity and data from Supabase Auth and all cascaded tables.
    if (["profiles", "providers", "businesses"].includes(resource.table)) {
      const targetUserId = resource.table === "profiles" ? row.id : row.user_id;
      if (targetUserId) {
        if (targetUserId === user.id || row.role === "SUPER_ADMIN" || row.email?.toLowerCase() === "mdabdullah200211@gmail.com" || row.contact_email?.toLowerCase() === "mdabdullah200211@gmail.com") {
          setDeleting(null);
          return setError("The Super Admin account cannot be deleted.");
        }
        try {
          await deleteAuthUser(targetUserId, bypassAuth);
          setDeleting(null);
          notify("Account and Supabase Auth identity permanently deleted.");
          await Promise.all([loadRows(), loadSummary()]);
          return;
        } catch (authDeleteError) {
          setDeleting(null);
          return setError(authDeleteError.message || "Failed to delete account from Supabase.");
        }
      }
    }

    const key = resource.primaryKey || "id";
    let result;
    if (resource.id === "reports" && row.report_ids?.length) {
      if (bypassAuth && LOCAL_ADMIN_MUTABLE_TABLES.has(resource.table)) {
        try {
          const deleted = [];
          for (const rid of row.report_ids) {
            const data = await mutateLocalAdminTable("reports", "DELETE", "id", rid);
            if (data?.[0]) deleted.push(data[0]);
          }
          result = { data: deleted[0] || null, error: null };
        } catch (localError) {
          result = { data: null, error: localError };
        }
      } else {
        result = await supabase.from("reports").delete().in("id", row.report_ids).select("id");
        if (!result.error) result.data = result.data?.[0] || null;
      }
    } else if (bypassAuth && LOCAL_ADMIN_MUTABLE_TABLES.has(resource.table)) {
      try {
        const data = await mutateLocalAdminTable(resource.table, "DELETE", key, row[key]);
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else {
      result = await supabase.from(resource.table).delete().eq(key, row[key]).select(key).maybeSingle();
    }
    if (result.error) { setDeleting(null); return setError(result.error.message); }
    if (!result.data) { setDeleting(null); return setError("No record was deleted. Your access may have changed."); }
    setDeleting(null);
    notify("Record permanently deleted.");
    await Promise.all([loadRows(), loadSummary()]);
  };

  const saved = async (message) => { setEditing(null); setPlaceEditor(null); notify(message); await Promise.all([loadRows(), loadSummary(), loadDistrictOptions()]); };
  const show = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    const text = Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value);
    return text.length > 46 ? `${text.slice(0, 43)}...` : text;
  };
  const visibleSidebarResources = SIDEBAR_RESOURCES.filter((item) => canOpenSection(item.id));
  const visibleSummary = SUMMARY.filter((item) => canOpenSection(item.resource));
  const visibleActivationResources = RESOURCES.filter((item) => item.activation && canOpenSection(item.id));
  const appClass = [
    "ops-app",
    section === "removed-accounts" || section === "removed-providers" || section === "removed-businesses" || section === "frozen-subscriptions" || section === "blocked-accounts" ? "ops-activate-accounts" : "",
    section === "profiles" ? "ops-users" : "",
    resource?.table === "providers" || resource?.businessSection ? "ops-provider-blocking" : "",
    resource?.id === "reports" ? "ops-reports" : "",
    !adminIsSuper ? "ops-secondary-admin" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={appClass}>
      <aside className="ops-sidebar"><a href={PUBLIC_APP_URL} aria-label="Return to TourismuBD"><Brand /></a><nav aria-label="Admin navigation">{!isMediaAdmin ? <button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}><LayoutDashboard /> Overview</button> : null}{visibleSidebarResources.map((item) => { const Icon = item.icon; const active = item.id === "reports" ? Boolean(resource?.reportSection) : item.id === "providers" ? resource?.table === "providers" && !resource?.activation : item.id === "businesses" ? resource?.businessSection && !resource?.subscriptionSection && !resource?.activation : item.id === "subscriptions" ? resource?.subscriptionSection : section === item.id; return <button className={active ? "active" : ""} onClick={() => setSection(item.id)} key={item.id}><Icon /> {item.label}</button>; })}{adminIsSuper ? <button className={section === "admin-management" ? "active" : ""} onClick={() => setSection("admin-management")}><UserCog /> Admin Management</button> : null}</nav></aside>
      <main className="ops-main">
        {bypassAuth ? <div className="ops-dev-banner"><ShieldCheck /><span>Local development access. Production authentication remains enabled.</span></div> : null}
        <header className="ops-topbar"><div><p className="ops-kicker">Operations console</p><h1>{section === "admin-management" ? "Admin Management" : section === "media" ? "Media Management" : resource?.table === "providers" ? "Providers" : resource?.subscriptionSection ? "Subscriptions" : resource?.businessSection ? "Business" : resource?.label || "Overview"}</h1></div><div className="ops-account"><span><b>{profile.full_name || "Admin"}</b><small>{ADMIN_ROLE_LABELS[access?.role] || "Super Admin"} · {user.email}</small></span>{!bypassAuth && adminIsSuper ? <button className="ops-icon-button" onClick={() => setPasswordDialogOpen(true)} title="Change password" aria-label="Change password"><KeyRound /></button> : null}<button className="ops-icon-button" onClick={onSignOut} title="Sign out" aria-label="Sign out"><LogOut /></button></div></header>
        {section === "overview" ? <section className="ops-overview"><div className="ops-stat-grid">{visibleSummary.map((item) => { const Icon = item.icon; return <button onClick={() => setSection(item.resource)} key={item.label}><span><Icon /></span><small>{item.label}</small><strong>{counts[item.resource] ?? "—"}</strong></button>; })}</div><div className="ops-note"><BookOpenCheck /><div><h2>Protected operations</h2><p>Changes are enforced by Supabase row-level security and written to Audit history. User authentication identities remain server-managed.</p></div></div></section> : null}
        {section === "media" ? <MediaManager bypassAuth={bypassAuth} onNotice={notify} readOnly={false} /> : null}
        {resource?.id === "places" && section !== "media" ? <div className="ops-place-tabs" role="tablist" aria-label="Place visibility"><button role="tab" aria-selected={placeVisibilityFilter === "ALL"} className={placeVisibilityFilter === "ALL" ? "active" : ""} onClick={() => setPlaceVisibilityFilter("ALL")}><MapPin />All places</button><button role="tab" aria-selected={placeVisibilityFilter === "HIDDEN"} className={placeVisibilityFilter === "HIDDEN" ? "active" : ""} onClick={() => setPlaceVisibilityFilter("HIDDEN")}><EyeOff />Hied places</button></div> : null}
        {resource?.reportSection ? <div className="ops-place-tabs" role="tablist" aria-label="Report account status"><button role="tab" aria-selected={section === "reports"} className={section === "reports" ? "active" : ""} onClick={() => setSection("reports")}><AlertTriangle />Reports</button>{adminIsSuper ? <button role="tab" aria-selected={section === "removed-accounts"} className={section === "removed-accounts" ? "active" : ""} onClick={() => setSection("removed-accounts")}><BadgeCheck />Activate post</button> : visibleActivationResources.map((item) => <button role="tab" aria-selected={section === item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)} key={item.id}><BadgeCheck />{item.label}</button>)}</div> : null}
        {section === "admin-management" && adminIsSuper ? <AdminManagement bypassAuth={bypassAuth} readOnly={!adminIsSuper} onNotice={notify} /> : null}
        {resource && section !== "media" ? <section className="ops-table-panel">{resource.businessSection && !resource.subscriptionSection && !resource.activation ? <div className="ops-provider-tabs ops-business-tabs" role="tablist" aria-label="Business management"><button role="tab" aria-selected={section === "businesses"} className={section === "businesses" ? "active" : ""} onClick={() => setSection("businesses")}><BriefcaseBusiness />Business accounts</button>{BUSINESS_RESOURCES.map((item) => { const Icon = item.icon; return <button role="tab" aria-selected={section === item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)} key={item.id}><Icon />{item.label}</button>; })}</div> : null}{resource.table === "providers" && !resource.activation ? <div className="ops-provider-tabs" role="tablist" aria-label="Provider categories"><button role="tab" aria-selected={section === "providers"} className={section === "providers" ? "active" : ""} onClick={() => setSection("providers")}><Building2 />All providers</button>{PROVIDER_RESOURCES.map((item) => { const Icon = item.icon; return <button role="tab" aria-selected={section === item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)} key={item.id}><Icon />{item.label}</button>; })}</div> : null}{(resource.subscriptionSection || section === "frozen-subscriptions") ? <div className="ops-subscription-tabs" role="tablist" aria-label="Subscription account types"><button role="tab" aria-selected={section === "subscriptions"} className={section === "subscriptions" ? "active" : ""} onClick={() => setSection("subscriptions")}><ClipboardCheck />Provider subscriptions</button><button role="tab" aria-selected={section === "business-subscriptions"} className={section === "business-subscriptions" ? "active" : ""} onClick={() => setSection("business-subscriptions")}><BriefcaseBusiness />Business accounts</button>{canOpenSection("frozen-subscriptions") ? <button role="tab" aria-selected={section === "frozen-subscriptions"} className={section === "frozen-subscriptions" ? "active" : ""} onClick={() => setSection("frozen-subscriptions")}><BadgeCheck />Activate subscriptions</button> : null}</div> : null}<div className="ops-table-tools"><div className="ops-table-filters"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${resource.label.toLowerCase()}`} /></label>{resource.id === "places" ? <select aria-label="Filter by division" value={divisionFilter} onChange={(event) => { setDivisionFilter(event.target.value); setDistrictFilter(""); }}><option value="">All divisions</option>{divisionOptions.map((division) => <option value={division} key={division}>{division}</option>)}</select> : null}{resource.id === "places" ? <select aria-label="Filter by district" value={districtFilter} onChange={(event) => setDistrictFilter(event.target.value)}><option value="">All districts</option>{filteredDistrictOptions.map((district) => <option value={district.id} key={district.id}>{district.name}</option>)}</select> : null}{resource.id === "reports" ? <select aria-label="Filter by report status" value={reportStatusFilter} onChange={(event) => setReportStatusFilter(event.target.value)}><option value="OPEN">Open reports</option><option value="RESOLVED">Resolved reports</option><option value="ALL">All reports</option></select> : null}</div><div className="ops-table-actions">{resource.id === "places" ? <button className="ops-button" onClick={() => setPlaceEditor({ row: null })}><Plus /> Add place</button> : null}<button className="ops-icon-button" onClick={() => loadRows(resource)} title="Refresh" aria-label="Refresh records"><RefreshCw /></button></div></div>{bypassAuth && resource.table === "providers" ? <div className="ops-data-note"><ShieldCheck /><span>Protected provider accounts load through the localhost Admin server. The Supabase service-role key stays outside the browser.</span></div> : null}{error ? <div className="ops-alert" role="alert"><AlertTriangle /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X /></button></div> : null}<div className="ops-table-wrap"><table><thead><tr>{resource.columns.map((column) => <th key={column}>{column.replaceAll("_", " ")}</th>)}<th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan={resource.columns.length + 1} className="ops-empty">Loading records...</td></tr> : null}{!loading && !visibleRows.length ? <tr><td colSpan={resource.columns.length + 1} className="ops-empty">{resource.table === "providers" ? "No provider accounts are available to this session." : "No records found."}</td></tr> : null}{visibleRows.map((row) => { const self = resource.id === "profiles" && !canManageProfile(user.id, row.id); const placesSection = resource.id === "places"; const profilesSection = resource.table === "profiles" || resource.table === "businesses"; const providersSection = resource.table === "providers"; const providerSubscriptionSection = resource.table === "provider_subscriptions"; const bookingsSection = resource.id === "bookings"; const reportsSection = resource.id === "reports"; return <tr key={row._row_key || row[resource.primaryKey || "id"]}>{resource.columns.map((column) => <td key={column} title={show(row[column])}>{show(row[column])}</td>)}<td><div className="ops-row-actions">{resource.readonly ? <span className="ops-readonly"><ShieldCheck /> Read only</span> : row._publicPreview ? <><PublicProfileLink provider={row} /><button onClick={() => setProviderProfile(row)} title="View Admin details" aria-label="View Admin details"><Eye /></button></> : <>{bookingsSection && row.provider_record ? <><PublicProfileLink provider={row.provider_record} /><button onClick={() => setProviderProfile(row.provider_record)} title="View provider details" aria-label="View provider details"><Eye /></button><button onClick={() => setBookingHistory(row)} title="View booking history" aria-label="View booking history"><BookOpenCheck /></button></> : null}{reportsSection ? <button onClick={() => setReportDetails(row)} title="View report details" aria-label="View report details"><Eye /></button> : null}{providersSection || profilesSection ? <PublicProfileLink provider={row._is_post ? { user_id: row.author_id } : row} /> : null}{providerSubscriptionSection && row.provider_record ? <><PublicProfileLink provider={row.provider_record} /><button onClick={() => setProviderProfile(row.provider_record)} title="View Admin details" aria-label="View Admin details"><Eye /></button></> : null}{row._is_post ? <button onClick={() => setReportDetails(row)} title="View post and report details" aria-label="View post and report details"><Eye /></button> : profilesSection ? <button onClick={() => setTravelerProfile(row.profile || row)} title={resource.table === "businesses" ? "View business owner details" : "View user details"} aria-label={resource.table === "businesses" ? "View business owner details" : "View user details"}><Eye /></button> : null}{providersSection ? <button onClick={() => setProviderProfile(row)} title="View Admin details" aria-label="View Admin details"><Eye /></button> : null}{!bookingsSection ? <>{row._is_post ? null : <button onClick={() => placesSection ? setPlaceEditor({ row }) : setEditing(row)} title="Edit" aria-label="Edit record"><Pencil /></button>}{placesSection ? <button onClick={() => setPlaceStatus(row, row.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED")} title={row.status === "PUBLISHED" ? "Hide from public pages" : "Publish on public pages"} aria-label={row.status === "PUBLISHED" ? "Hide place" : "Publish place"}>{row.status === "PUBLISHED" ? <EyeOff /> : <Eye />}</button> : resource.remove ? <button onClick={() => remove(row)} disabled={self} title={self ? "You cannot suspend yourself" : "Remove from active use"} aria-label="Remove record"><Archive /></button> : null}{resource.activation ? <button className="danger ops-block-button" onClick={() => blockAccount(row)} disabled={self || (row._is_post && !canManageProfile(user.id, row.author_id || row.reported_post_owner_id))} title={self || (row._is_post && !canManageProfile(user.id, row.author_id || row.reported_post_owner_id)) ? "You cannot block yourself" : "Block account"} aria-label="Block record"><ShieldAlert /></button> : null}{resource.activation || row._is_post ? null : <button className="danger" onClick={() => resource.noDelete ? setError(resource.deleteReason) : setDeleting(row)} title={resource.noDelete ? resource.deleteReason : "Delete permanently"} aria-label="Delete record"><Trash2 /></button>}</> : null}</>}</div></td></tr>; })}</tbody></table></div><p className="ops-table-foot">Showing {visibleRows.length} of {rows.length} loaded records</p></section> : null}
      </main>
      {editing ? <Editor resource={resource} row={editing} userId={user.id} bypassAuth={bypassAuth} onClose={() => setEditing(null)} onSaved={saved} /> : null}
      {placeEditor ? <PlaceEditor row={placeEditor.row} districts={districtOptions} bypassAuth={bypassAuth} onClose={() => setPlaceEditor(null)} onSaved={saved} /> : null}
      {deleting ? <DeleteRecordDialog resource={resource} row={deleting} onClose={() => setDeleting(null)} onConfirm={destroy} /> : null}
      {accountAction ? <AccountActionDialog resource={resource} row={accountAction} onClose={() => setAccountAction(null)} onConfirm={(row) => { setAccountAction(null); applyAccountAction(row); }} /> : null}
      {providerProfile ? <ProviderProfile provider={providerProfile} bypassAuth={bypassAuth} onClose={() => setProviderProfile(null)} /> : null}
      {bookingHistory ? <BookingHistoryDialog provider={bookingHistory} onClose={() => setBookingHistory(null)} onCancelBooking={adminIsSuper || access?.role === "booking_admin" ? cancelBooking : null} /> : null}
      {reportDetails ? <ReportDetailsDialog report={reportDetails} readOnly={!adminIsSuper && !(access?.role === "users_admin" && !reportDetails.reported_provider_record && reportDetails.reported_post_owner_profile?.role === "TRAVELER" && !reportDetails.reported_post_owner_profile?.is_admin_only) && !(access?.role === "business_admin" && Boolean(reportDetails.reported_business_record)) && !(access?.role === "provider_admin" && Boolean(reportDetails.reported_provider_record)) && !(access?.role === "subscription_admin" && Boolean(reportDetails.reported_subscription_record)) && !(access?.role === "booking_admin" && Boolean(reportDetails.reported_booking_record))} canDeletePost={adminIsSuper || (access?.role === "users_admin" && !reportDetails.reported_provider_record && reportDetails.reported_post_owner_profile?.role === "TRAVELER" && !reportDetails.reported_post_owner_profile?.is_admin_only) || (access?.role === "business_admin" && Boolean(reportDetails.reported_business_record)) || (access?.role === "provider_admin" && Boolean(reportDetails.reported_provider_record)) || (access?.role === "subscription_admin" && Boolean(reportDetails.reported_subscription_record))} canRemoveAccount={adminIsSuper || (access?.role === "users_admin" && !reportDetails.reported_provider_record && reportDetails.reported_post_owner_profile?.role === "TRAVELER" && !reportDetails.reported_post_owner_profile?.is_admin_only)} canRemoveProvider={adminIsSuper || access?.role === "provider_admin"} canRemoveBusiness={adminIsSuper || access?.role === "business_admin"} canFreezeSubscription={adminIsSuper || access?.role === "subscription_admin"} canCancelBooking={adminIsSuper || access?.role === "booking_admin"} onClose={() => setReportDetails(null)} onViewProfile={setTravelerProfile} onViewProvider={setProviderProfile} onViewPost={setReportedPost} onLinkPost={linkReportedPost} onDeletePost={deleteReportedPost} onRemoveAccount={removeReportedPostOwner} onActivatePost={(post) => { setReportDetails(null); applyAccountAction(post); }} onBlockAccount={adminIsSuper || ["users_admin", "provider_admin", "business_admin"].includes(access?.role) ? (post) => { setReportDetails(null); blockAccount(post); } : null} /> : null}
      {reportAccountAction ? <ReportAccountRemovalDialog report={reportAccountAction} onClose={() => setReportAccountAction(null)} onConfirm={(report) => { setReportAccountAction(null); suspendReportedPostOwner(report); }} /> : null}
      {reportedPost ? <ReportedPostDialog report={reportedPost} bypassAuth={bypassAuth} onClose={() => setReportedPost(null)} /> : null}
      {travelerProfile ? <TravelerProfile profile={travelerProfile} onClose={() => setTravelerProfile(null)} /> : null}
      {passwordDialogOpen ? <AdminPasswordChangeDialog email={user.email} onClose={() => setPasswordDialogOpen(false)} onChanged={() => { setPasswordDialogOpen(false); onSignOut(); }} /> : null}
      <div className={toast ? "ops-toast show" : "ops-toast"} role="status">{toast}</div>
    </div>
  );
}

function hasRecoveryOrInviteIntent() {
  if (typeof window === "undefined") return false;
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash || "";
  return (
    search.get("admin-recovery") === "1" ||
    search.get("admin-invite") === "1" ||
    hash.includes("type=recovery") ||
    hash.includes("type=invite") ||
    hash.includes("access_token=")
  );
}

export default function AdminApp() {
  const [access, setAccess] = useState(null);
  const [bypassActive, setBypassActive] = useState(() => ADMIN_AUTH_BYPASS && !hasRecoveryOrInviteIntent());
  const loseAccess = useCallback(() => { setAccess(null); setBypassActive(false); }, []);
  const signOut = useCallback(async () => { await supabase.auth.signOut(); setAccess(null); setBypassActive(false); }, []);

  useEffect(() => {
    if (hasRecoveryOrInviteIntent()) {
      setBypassActive(false);
    }
    const { data } = supabase?.auth?.onAuthStateChange?.((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setBypassActive(false);
      }
    }) || {};
    return () => data?.subscription?.unsubscribe?.();
  }, []);

  if (!supabase) return <main className="ops-login"><section className="ops-login-panel"><Brand /><Database className="ops-setup-icon" /><p className="ops-kicker">Admin backend not connected</p><h1>Connect Supabase to open operations.</h1><p>The Admin portal never runs in preview mode. Add the project URL and anon key, then sign in with an active `SUPER_ADMIN` account.</p><a className="ops-button" href={PUBLIC_APP_URL}>Return to TourismuBD</a></section></main>;
  if (bypassActive) return <Operations user={{ id: "local-development", email: "Authentication bypassed" }} profile={{ full_name: "Local development" }} access={{ role: "super_admin", is_active: true }} onSignOut={signOut} onAccessLost={loseAccess} bypassAuth />;
  return access ? <Operations {...access} onSignOut={signOut} onAccessLost={loseAccess} /> : <AccessGate onAccess={(user, profile, adminAccess) => setAccess({ user, profile, access: adminAccess })} />;
}
