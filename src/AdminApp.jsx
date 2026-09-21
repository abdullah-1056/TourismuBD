import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CarFront,
  CircleUserRound,
  ClipboardCheck,
  Database,
  FileClock,
  Eye,
  EyeOff,
  ExternalLink,
  LayoutDashboard,
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
  ShieldCheck,
  Star,
  Trash2,
  UsersRound,
  Waves,
  X,
} from "lucide-react";
import { adminRemovalPatch, buildPlacePayload, canManageProfile, hasAdminAccess, PLACE_STATUSES, providerTypeLabel, slugifyPlaceName, sortDestinationRows } from "./lib/admin.js";
import { supabase } from "./lib/supabase.js";

const RESOURCES = [
  { id: "profiles", label: "Users", table: "profiles", profileRole: "TRAVELER", icon: UsersRound, columns: ["full_name", "email", "role", "status"], remove: { status: "SUSPENDED" }, noDelete: true, deleteReason: "Auth users require server-side deletion." },
  { id: "providers", label: "Providers", table: "providers", icon: Building2, columns: ["owner_name", "provider_type", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "businesses", label: "Business", table: "businesses", businessSection: true, icon: BriefcaseBusiness, columns: ["owner_name", "business_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" }, noDelete: true, deleteReason: "Business accounts are linked to Auth users. Hide or remove them from active use instead." },
  { id: "business-products", label: "Products", table: "business_products", businessSection: true, businessChild: true, icon: Package, columns: ["seller_name", "name", "price_bdt", "stock_quantity", "status", "created_at"], remove: { status: "HIDDEN" } },
  { id: "subscriptions", label: "Subscriptions", table: "provider_subscriptions", icon: ClipboardCheck, columns: ["provider_type", "monthly_fee_bdt", "status", "current_period_end"], remove: { status: "FROZEN" } },
  { id: "places", label: "Places", table: "places", icon: MapPin, columns: ["division_name", "district_name", "name", "upazila_or_area", "category", "status"], remove: { status: "HIDDEN" } },
  { id: "routes", label: "Routes", table: "place_relationships", icon: Route, columns: ["from_place_id", "to_place_id", "relationship_type", "travel_minutes"] },
  { id: "water", label: "Water bodies", table: "water_bodies", icon: Waves, columns: ["name", "type", "is_sundarbans", "status"], remove: { status: "HIDDEN" } },
  { id: "guides", label: "Tour guides", table: "providers", providerType: "GUIDE", icon: CircleUserRound, columns: ["owner_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "houseboats", label: "Houseboat owners", table: "providers", providerType: "HOUSEBOAT_OWNER", icon: Sailboat, columns: ["owner_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "smallboats", label: "Small boat owners", table: "providers", providerType: "SMALL_BOAT_OWNER", icon: Sailboat, columns: ["owner_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "hotels", label: "Resort / Hotel owners", table: "providers", providerType: "RESORT_HOTEL_OWNER", icon: Building2, columns: ["owner_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "transport", label: "Transport owners", table: "providers", providerType: "CAR_TRANSPORT_OWNER", icon: CarFront, columns: ["owner_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "parking", label: "Parking owners", table: "providers", providerType: "PARKING_OWNER", icon: MapPin, columns: ["owner_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "agencies", label: "Tour agencies", table: "providers", providerType: "TOUR_AGENCY_ORGANIZATION", icon: UsersRound, columns: ["owner_name", "district", "contact_email", "account_status", "public_status"], remove: { account_status: "REMOVED", public_status: "HIDDEN" } },
  { id: "bookings", label: "Bookings", table: "bookings", icon: CalendarCheck, columns: ["service_type", "start_date", "traveler_count", "status"], remove: "cancel" },
  { id: "trips", label: "Saved trips", table: "saved_trips", icon: CarFront, columns: ["name", "traveler_id", "starting_point_value", "created_at"] },
  { id: "reviews", label: "Reviews", table: "reviews", icon: Star, columns: ["booking_id", "rating", "status", "created_at"], remove: { status: "REMOVED" } },
  { id: "reports", label: "Reports", table: "reports", icon: AlertTriangle, columns: ["category", "status", "provider_id", "created_at"], remove: "resolve" },
  { id: "audit", label: "Audit history", table: "admin_actions", icon: FileClock, columns: ["action", "entity_type", "admin_user_id", "created_at"], readonly: true },
];
const PROVIDER_RESOURCES = RESOURCES.filter((item) => item.providerType);
const BUSINESS_RESOURCES = RESOURCES.filter((item) => item.businessChild);
const SIDEBAR_RESOURCES = RESOURCES.filter((item) => !item.providerType && !item.businessChild);

const SUMMARY = [
  { label: "Users", table: "profiles", icon: UsersRound, resource: "profiles", filter: ["role", "TRAVELER"] },
  { label: "Providers", table: "providers", icon: Building2, resource: "providers" },
  { label: "Businesses", table: "businesses", icon: BriefcaseBusiness, resource: "businesses" },
  { label: "Places", table: "places", icon: MapPin, resource: "places" },
  { label: "Bookings", table: "bookings", icon: CalendarCheck, resource: "bookings" },
  { label: "Open reports", table: "reports", icon: AlertTriangle, resource: "reports", filter: ["status", "OPEN"] },
];

const IMMUTABLE = new Set(["id", "created_at", "updated_at", "monthly_fee_bdt"]);
const DISPLAY_ONLY = new Set(["profile", "owner_name", "provider_type", "seller_name", "district", "district_name", "division_name", "districts"]);
const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || (import.meta.env.DEV ? "http://127.0.0.1:5175/" : "/");
const ADMIN_AUTH_BYPASS = import.meta.env.DEV && import.meta.env.VITE_ADMIN_AUTH_BYPASS !== "false";
const LOCAL_ADMIN_TABLES = new Set(["profiles", "providers", "businesses", "business_products", "provider_verifications", "provider_subscriptions", "guide_profiles", "houseboat_listings", "small_boat_listings", "bookings", "saved_trips", "reviews", "reports", "admin_actions"]);

function publicProfileUrl(userId) {
  const url = new URL(PUBLIC_APP_URL, window.location.origin);
  url.searchParams.set("profile", userId);
  if (import.meta.env.DEV) url.searchParams.set("adminPreview", "1");
  return url.toString();
}

function PublicProfileLink({ provider }) {
  const profileId = provider.user_id || provider.id;
  if (!profileId) return null;
  return <a className="ops-view-profile" href={publicProfileUrl(profileId)} target="_blank" rel="noreferrer" title="View on TourismuBD"><ExternalLink /><span>View profile</span></a>;
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

function Brand() {
  return <span className="ops-brand"><span><Route /></span><b>TourismuBD</b><small>ADMIN</small></span>;
}

function AccessGate({ onAccess }) {
  const [state, setState] = useState({ loading: true, session: null, profile: null });
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const check = async (session) => {
      if (!active) return;
      if (!session?.user) return setState({ loading: false, session: null, profile: null });
      const result = await supabase.from("profiles").select("full_name,email,role,status").eq("id", session.user.id).single();
      if (!active) return;
      setState({ loading: false, session, profile: result.data || null });
      if (result.error) setError(result.error.message);
    };
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => check(session));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  const login = async (event) => {
    event.preventDefault();
    setError("");
    const values = new FormData(event.currentTarget);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: values.get("email"), password: values.get("password") });
    if (loginError) setError(loginError.message);
  };

  const allowed = hasAdminAccess(state.profile);
  useEffect(() => { if (allowed) onAccess(state.session.user, state.profile); }, [allowed, onAccess, state.profile, state.session]);

  if (state.loading) return <div className="ops-gate"><RefreshCw className="ops-spin" /><p>Checking admin access...</p></div>;
  if (allowed) return <div className="ops-gate"><RefreshCw className="ops-spin" /><p>Opening operations...</p></div>;
  if (state.session) return (
    <main className="ops-login">
      <section className="ops-login-panel"><Brand /><div className="ops-denied-icon"><ShieldCheck /></div><p className="ops-kicker">Access denied</p><h1>Super Admin access is required.</h1><p>{state.session.user.email} is signed in, but this account is not an active `SUPER_ADMIN`.</p>{error ? <p className="ops-error">{error}</p> : null}<button className="ops-button" onClick={() => supabase.auth.signOut()}><LogOut /> Sign out</button><a href={PUBLIC_APP_URL}>Return to TourismuBD</a></section>
    </main>
  );
  return (
    <main className="ops-login">
      <section className="ops-login-panel">
        <Brand /><p className="ops-kicker">Restricted operations</p><h1>Admin sign in</h1><p>Use your approved Gmail or account email and password.</p>
        <form onSubmit={login}><label>Email<input name="email" type="email" required autoComplete="username" placeholder="admin@gmail.com" /></label><label>Password<input name="password" type="password" required autoComplete="current-password" /></label>{error ? <p className="ops-error" role="alert">{error}</p> : null}<button className="ops-button"><ShieldCheck /> Sign in securely</button></form>
        <a href={PUBLIC_APP_URL}>Return to TourismuBD</a>
      </section>
    </main>
  );
}

function Editor({ resource, row, userId, bypassAuth, onClose, onSaved }) {
  const dialogRef = useRef(null);
  const primaryKey = resource.primaryKey || "id";
  const editingSelf = resource.id === "profiles" && !canManageProfile(userId, row.id);
  const editable = Object.fromEntries(Object.entries(row).filter(([key]) => !IMMUTABLE.has(key) && (!resource.businessSection || !["user_id", "business_id"].includes(key)) && (!DISPLAY_ONLY.has(key) || (resource.table === "businesses" && key === "district")) && key !== primaryKey && !(editingSelf && ["role", "status"].includes(key))));
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
    if (bypassAuth && resource.businessSection) {
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

function PlaceEditor({ row, districts, onClose, onSaved }) {
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
    let request = supabase.from("places");
    request = row ? request.update(payload).eq("id", row.id) : request.insert(payload);
    const result = await request.select("id").maybeSingle();
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
          <label className="wide">Image URL<input type="url" value={form.image_url} onChange={(event) => update("image_url", event.target.value)} placeholder="https://..." /></label>
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

function ProfileField({ label, value, wide = false }) {
  const shown = Array.isArray(value) ? value.join(", ") : value;
  return <div className={wide ? "ops-profile-field wide" : "ops-profile-field"}><span>{label}</span><strong>{shown || "Not provided"}</strong></div>;
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

function Operations({ user, profile, onSignOut, onAccessLost, bypassAuth = false }) {
  const [section, setSection] = useState("overview");
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [query, setQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState(null);
  const [placeEditor, setPlaceEditor] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [travelerProfile, setTravelerProfile] = useState(null);
  const [districtOptions, setDistrictOptions] = useState([]);
  const rowRequest = useRef(0);
  const resource = RESOURCES.find((item) => item.id === section);
  const currentResource = useRef(resource);
  currentResource.current = resource;

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(""), 2800); };
  const loadSummary = async () => {
    const entries = await Promise.all(SUMMARY.map(async (item) => {
      if (bypassAuth && LOCAL_ADMIN_TABLES.has(item.table)) {
        try { return [item.resource, (await loadLocalAdminTable(item.table, { limit: 1000, filter: item.filter?.[0], value: item.filter?.[1] })).length]; }
        catch { return [item.resource, 0]; }
      }
      let request = supabase.from(item.table).select("*", { count: "exact", head: true });
      if (item.filter) request = request.eq(...item.filter);
      const result = await request;
      return [item.resource, result.count || 0];
    }));
    setCounts(Object.fromEntries(entries));
  };
  const loadDistrictOptions = async () => {
    const result = await supabase.from("districts").select("id,name,division,slug,status").order("name");
    if (result.error) return setError(result.error.message);
    setDistrictOptions(result.data || []);
  };
  const loadRows = async (target = resource) => {
    if (!target || currentResource.current?.id !== target.id) return;
    const requestId = ++rowRequest.current;
    setLoading(true);
    setError("");
    let result;
    if (bypassAuth && LOCAL_ADMIN_TABLES.has(target.table)) {
      try {
        const filter = target.providerType ? ["type", target.providerType] : target.profileRole ? ["role", target.profileRole] : [];
        result = { data: await loadLocalAdminTable(target.table, { limit: ["providers", "businesses"].includes(target.table) ? 500 : 1000, filter: filter[0], value: filter[1] }), error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else {
      let request = supabase.from(target.table).select(target.id === "places" ? "*,districts(name,division,slug)" : "*").limit(target.id === "places" ? 1000 : 100);
      if (target.providerType) request = request.eq("type", target.providerType);
      if (target.profileRole) request = request.eq("role", target.profileRole);
      if (target.columns.includes("created_at")) request = request.order("created_at", { ascending: false });
      result = await request;
    }
    if (requestId !== rowRequest.current || currentResource.current?.id !== target.id) return;
    setLoading(false);
    if (result.error) return setError(target.businessSection && /schema cache|does not exist/i.test(result.error.message) ? "Business tables are not set up yet. Run Supabase migrations 072 and 073 in order." : result.error.message);
    const resultRows = result.data || [];
    let nextRows = target.id === "places"
      ? resultRows.map((row) => ({
        ...row,
        district_name: row.districts?.name || "Unknown district",
        division_name: row.districts?.division || "Unknown division",
      }))
      : resultRows;
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
  };

  useEffect(() => { loadSummary(); loadDistrictOptions(); }, []);
  useEffect(() => {
    setQuery("");
    setDivisionFilter("");
    setDistrictFilter("");
    setRows([]);
    setEditing(null);
    setPlaceEditor(null);
    setProviderProfile(null);
    setTravelerProfile(null);
    if (resource) loadRows(resource);
    else { rowRequest.current += 1; setLoading(false); }
  }, [resource]);
  useEffect(() => {
    if (bypassAuth) return undefined;
    let active = true;
    const validate = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active || !data.session?.user) return active && onAccessLost();
      const result = await supabase.from("profiles").select("role,status").eq("id", data.session.user.id).single();
      if (active && (result.error || !hasAdminAccess(result.data))) onAccessLost();
    };
    const onFocus = () => validate();
    const timer = window.setInterval(validate, 15000);
    window.addEventListener("focus", onFocus);
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) onAccessLost();
      else window.setTimeout(validate, 0);
    });
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", onFocus); data.subscription.unsubscribe(); };
  }, [bypassAuth, onAccessLost]);

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (needle && !JSON.stringify(row).toLowerCase().includes(needle)) return false;
      if (divisionFilter && row.division_name !== divisionFilter) return false;
      if (districtFilter && row.district_id !== districtFilter) return false;
      return true;
    });
  }, [districtFilter, divisionFilter, query, resource?.id, rows]);

  const divisionOptions = useMemo(() => [...new Set(districtOptions.map((district) => district.division))].sort(), [districtOptions]);
  const filteredDistrictOptions = useMemo(() => districtOptions.filter((district) => !divisionFilter || district.division === divisionFilter), [districtOptions, divisionFilter]);

  const remove = async (row) => {
    if (resource.id === "profiles" && !canManageProfile(user.id, row.id)) return setError("You cannot suspend your own Admin account.");
    if (!resource.remove || !window.confirm(`Remove this ${resource.label.toLowerCase()} record from active use?`)) return;
    const patch = adminRemovalPatch(resource.remove, user.id);
    const key = resource.primaryKey || "id";
    let result;
    if (bypassAuth && resource.businessSection) {
      try {
        const data = await mutateLocalAdminTable(resource.table, "PATCH", key, row[key], patch);
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else {
      result = await supabase.from(resource.table).update(patch).eq(key, row[key]).select(key).maybeSingle();
    }
    if (result.error) return setError(result.error.message);
    if (!result.data) return setError("No record was changed. Your access may have changed.");
    notify("Record removed from active use.");
    await Promise.all([loadRows(), loadSummary()]);
  };

  const setPlaceStatus = async (row, status) => {
    if (status === "HIDDEN" && !window.confirm(`Hide ${row.name} from the public Places page?`)) return;
    const result = await supabase.from("places").update({ status }).eq("id", row.id).select("id").maybeSingle();
    if (result.error) return setError(result.error.message);
    if (!result.data) return setError("No tourist place was changed. Your access may have changed.");
    notify(status === "PUBLISHED" ? "Tourist place published." : "Tourist place hidden.");
    await Promise.all([loadRows(), loadSummary()]);
  };

  const destroy = async (row) => {
    if (resource.noDelete) return setError(resource.deleteReason);
    if (window.prompt("Type DELETE to permanently remove this record.") !== "DELETE") return;
    const key = resource.primaryKey || "id";
    let result;
    if (bypassAuth && resource.businessSection) {
      try {
        const data = await mutateLocalAdminTable(resource.table, "DELETE", key, row[key]);
        result = { data: data[0] || null, error: null };
      } catch (localError) {
        result = { data: null, error: localError };
      }
    } else {
      result = await supabase.from(resource.table).delete().eq(key, row[key]).select(key).maybeSingle();
    }
    if (result.error) return setError(result.error.message);
    if (!result.data) return setError("No record was deleted. Your access may have changed.");
    notify("Record permanently deleted.");
    await Promise.all([loadRows(), loadSummary()]);
  };

  const saved = async (message) => { setEditing(null); setPlaceEditor(null); notify(message); await Promise.all([loadRows(), loadSummary(), loadDistrictOptions()]); };
  const show = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    const text = Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value);
    return text.length > 46 ? `${text.slice(0, 43)}...` : text;
  };

  return (
    <div className="ops-app">
      <aside className="ops-sidebar"><a href={PUBLIC_APP_URL} aria-label="Return to TourismuBD"><Brand /></a><nav aria-label="Admin navigation"><button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}><LayoutDashboard /> Overview</button>{SIDEBAR_RESOURCES.map((item) => { const Icon = item.icon; const active = item.id === "providers" ? resource?.table === "providers" : item.id === "businesses" ? resource?.businessSection : section === item.id; return <button className={active ? "active" : ""} onClick={() => setSection(item.id)} key={item.id}><Icon /> {item.label}</button>; })}</nav></aside>
      <main className="ops-main">
        {bypassAuth ? <div className="ops-dev-banner"><ShieldCheck /><span>Local development access. Production authentication remains enabled.</span></div> : null}
        <header className="ops-topbar"><div><p className="ops-kicker">Operations console</p><h1>{resource?.table === "providers" ? "Providers" : resource?.businessSection ? "Business" : resource?.label || "Overview"}</h1></div><div className="ops-account"><span><b>{profile.full_name || "Super Admin"}</b><small>{user.email}</small></span>{bypassAuth ? null : <button className="ops-icon-button" onClick={onSignOut} title="Sign out" aria-label="Sign out"><LogOut /></button>}</div></header>
        {section === "overview" ? <section className="ops-overview"><div className="ops-stat-grid">{SUMMARY.map((item) => { const Icon = item.icon; return <button onClick={() => setSection(item.resource)} key={item.label}><span><Icon /></span><small>{item.label}</small><strong>{counts[item.resource] ?? "—"}</strong></button>; })}</div><div className="ops-note"><BookOpenCheck /><div><h2>Protected operations</h2><p>Changes are enforced by Supabase row-level security and written to Audit history. User authentication identities remain server-managed.</p></div></div></section> : null}
        {resource?.businessSection ? <div className="ops-provider-tabs ops-business-tabs" role="tablist" aria-label="Business management"><button role="tab" aria-selected={section === "businesses"} className={section === "businesses" ? "active" : ""} onClick={() => setSection("businesses")}><BriefcaseBusiness />Business accounts</button>{BUSINESS_RESOURCES.map((item) => { const Icon = item.icon; return <button role="tab" aria-selected={section === item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)} key={item.id}><Icon />{item.label}</button>; })}</div> : null}
        {resource ? <section className="ops-table-panel">{resource.table === "providers" ? <div className="ops-provider-tabs" role="tablist" aria-label="Provider categories"><button role="tab" aria-selected={section === "providers"} className={section === "providers" ? "active" : ""} onClick={() => setSection("providers")}><Building2 />All providers</button>{PROVIDER_RESOURCES.map((item) => { const Icon = item.icon; return <button role="tab" aria-selected={section === item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)} key={item.id}><Icon />{item.label}</button>; })}</div> : null}<div className="ops-table-tools"><div className="ops-table-filters"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${resource.label.toLowerCase()}`} /></label>{resource.id === "places" ? <select aria-label="Filter by division" value={divisionFilter} onChange={(event) => { setDivisionFilter(event.target.value); setDistrictFilter(""); }}><option value="">All divisions</option>{divisionOptions.map((division) => <option value={division} key={division}>{division}</option>)}</select> : null}{resource.id === "places" ? <select aria-label="Filter by district" value={districtFilter} onChange={(event) => setDistrictFilter(event.target.value)}><option value="">All districts</option>{filteredDistrictOptions.map((district) => <option value={district.id} key={district.id}>{district.name}</option>)}</select> : null}</div><div className="ops-table-actions">{resource.id === "places" ? <button className="ops-button" onClick={() => setPlaceEditor({ row: null })}><Plus /> Add place</button> : null}<button className="ops-icon-button" onClick={() => loadRows(resource)} title="Refresh" aria-label="Refresh records"><RefreshCw /></button></div></div>{bypassAuth && resource.table === "providers" ? <div className="ops-data-note"><ShieldCheck /><span>Protected provider accounts load through the localhost Admin server. The Supabase service-role key stays outside the browser.</span></div> : null}{error ? <div className="ops-alert" role="alert"><AlertTriangle /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X /></button></div> : null}<div className="ops-table-wrap"><table><thead><tr>{resource.columns.map((column) => <th key={column}>{column.replaceAll("_", " ")}</th>)}<th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan={resource.columns.length + 1} className="ops-empty">Loading records...</td></tr> : null}{!loading && !visibleRows.length ? <tr><td colSpan={resource.columns.length + 1} className="ops-empty">{resource.table === "providers" ? "No provider accounts are available to this session." : "No records found."}</td></tr> : null}{visibleRows.map((row) => { const self = resource.id === "profiles" && !canManageProfile(user.id, row.id); const placesSection = resource.id === "places"; const profilesSection = resource.id === "profiles" || resource.table === "businesses"; const providersSection = resource.table === "providers"; return <tr key={row[resource.primaryKey || "id"]}>{resource.columns.map((column) => <td key={column} title={show(row[column])}>{show(row[column])}</td>)}<td><div className="ops-row-actions">{resource.readonly ? <span className="ops-readonly"><ShieldCheck /> Read only</span> : row._publicPreview ? <><PublicProfileLink provider={row} /><button onClick={() => setProviderProfile(row)} title="View Admin details" aria-label="View Admin details"><Eye /></button></> : <>{providersSection || profilesSection ? <PublicProfileLink provider={row} /> : null}{profilesSection ? <button onClick={() => setTravelerProfile(row.profile || row)} title={resource.table === "businesses" ? "View business owner details" : "View user details"} aria-label={resource.table === "businesses" ? "View business owner details" : "View user details"}><Eye /></button> : null}{providersSection ? <button onClick={() => setProviderProfile(row)} title="View Admin details" aria-label="View Admin details"><Eye /></button> : null}<button onClick={() => placesSection ? setPlaceEditor({ row }) : setEditing(row)} title="Edit" aria-label="Edit record"><Pencil /></button>{placesSection ? <button onClick={() => setPlaceStatus(row, row.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED")} title={row.status === "PUBLISHED" ? "Hide from public pages" : "Publish on public pages"} aria-label={row.status === "PUBLISHED" ? "Hide place" : "Publish place"}>{row.status === "PUBLISHED" ? <EyeOff /> : <Eye />}</button> : resource.remove ? <button onClick={() => remove(row)} disabled={self} title={self ? "You cannot suspend yourself" : "Remove from active use"} aria-label="Remove record"><Archive /></button> : null}<button className="danger" onClick={() => destroy(row)} title={resource.noDelete ? resource.deleteReason : "Delete permanently"} aria-label="Delete record"><Trash2 /></button></>}</div></td></tr>; })}</tbody></table></div><p className="ops-table-foot">Showing {visibleRows.length} of {rows.length} loaded records</p></section> : null}
      </main>
      {editing ? <Editor resource={resource} row={editing} userId={user.id} bypassAuth={bypassAuth} onClose={() => setEditing(null)} onSaved={saved} /> : null}
      {placeEditor ? <PlaceEditor row={placeEditor.row} districts={districtOptions} onClose={() => setPlaceEditor(null)} onSaved={saved} /> : null}
      {providerProfile ? <ProviderProfile provider={providerProfile} bypassAuth={bypassAuth} onClose={() => setProviderProfile(null)} /> : null}
      {travelerProfile ? <TravelerProfile profile={travelerProfile} onClose={() => setTravelerProfile(null)} /> : null}
      <div className={toast ? "ops-toast show" : "ops-toast"} role="status">{toast}</div>
    </div>
  );
}

export default function AdminApp() {
  const [access, setAccess] = useState(null);
  const loseAccess = useCallback(() => setAccess(null), []);
  const signOut = useCallback(async () => { await supabase.auth.signOut(); setAccess(null); }, []);
  if (!supabase) return <main className="ops-login"><section className="ops-login-panel"><Brand /><Database className="ops-setup-icon" /><p className="ops-kicker">Admin backend not connected</p><h1>Connect Supabase to open operations.</h1><p>The Admin portal never runs in preview mode. Add the project URL and anon key, then sign in with an active `SUPER_ADMIN` account.</p><a className="ops-button" href={PUBLIC_APP_URL}>Return to TourismuBD</a></section></main>;
  if (ADMIN_AUTH_BYPASS) return <Operations user={{ id: "local-development", email: "Authentication bypassed" }} profile={{ full_name: "Local development" }} onSignOut={() => {}} onAccessLost={() => {}} bypassAuth />;
  return access ? <Operations {...access} onSignOut={signOut} onAccessLost={loseAccess} /> : <AccessGate onAccess={(user, profile) => setAccess({ user, profile })} />;
}
