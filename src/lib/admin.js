export function adminRemovalPatch(remove, userId, now = new Date().toISOString()) {
  if (remove === "cancel") return { status: "CANCELLED", cancelled_by: userId, cancelled_at: now, cancellation_reason: "Removed by Super Admin" };
  if (remove === "resolve") return { status: "RESOLVED", resolved_by: userId, resolved_at: now, admin_note: "Resolved by Super Admin" };
  return remove;
}

export const ADMIN_ROLES = Object.freeze([
  "users_admin",
  "business_admin",
  "provider_admin",
  "subscription_admin",
  "booking_admin",
]);

export const ADMIN_ROLE_LABELS = Object.freeze({
  super_admin: "Super Admin",
  users_admin: "Users Admin",
  business_admin: "Business Admin",
  provider_admin: "Provider Admin",
  subscription_admin: "Subscription Admin",
  booking_admin: "Booking Admin",
});

const MODULE_ROLE = Object.freeze({
  users: "users_admin",
  business: "business_admin",
  providers: "provider_admin",
  subscriptions: "subscription_admin",
  bookings: "booking_admin",
});

export function hasAdminAccess(access) {
  return Boolean(access?.is_active && (access.role === "super_admin" || ADMIN_ROLES.includes(access.role)));
}

export function isSuperAdmin(access) {
  return access?.role === "super_admin" && access?.is_active;
}

export function canAccessAdminSection(access, section, resource) {
  if (!hasAdminAccess(access)) return false;
  if (section === "overview") return true;
  if (section === "reports") return isSuperAdmin(access) || ["users_admin", "provider_admin", "business_admin"].includes(access?.role);
  if (section === "blocked-accounts") return isSuperAdmin(access) || ["users_admin", "provider_admin", "business_admin"].includes(access?.role);
  if (section === "admin-management") return isSuperAdmin(access);
  if (isSuperAdmin(access)) return true;
  return MODULE_ROLE[resource?.adminModule] === access.role;
}

export function canManageProfile(actorId, profileId) {
  return actorId !== profileId;
}

const PROVIDER_TYPE_LABELS = Object.freeze({
  GUIDE: "Tour Guide",
  HOUSEBOAT_OWNER: "Houseboat Owner",
  SMALL_BOAT_OWNER: "Small Boat Owner",
  RESORT_HOTEL_OWNER: "Resort / Hotel Owner",
  CAR_TRANSPORT_OWNER: "Car / Transport Owner",
  PARKING_OWNER: "Parking Owner",
  TOUR_AGENCY_ORGANIZATION: "Tour Agency",
});

export function providerTypeLabel(type) {
  return PROVIDER_TYPE_LABELS[type] || String(type || "Provider").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const PLACE_STATUSES = Object.freeze(["DRAFT", "PUBLISHED", "HIDDEN", "ARCHIVED"]);

export function slugifyPlaceName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const optionalText = (value) => String(value || "").trim() || null;

export function buildPlacePayload(values) {
  const districtId = String(values.district_id || "").trim();
  const name = String(values.name || "").trim();
  const slug = slugifyPlaceName(values.slug || name);
  const latitude = String(values.latitude ?? "").trim() === "" ? NaN : Number(values.latitude);
  const longitude = String(values.longitude ?? "").trim() === "" ? NaN : Number(values.longitude);
  const status = String(values.status || "DRAFT");

  if (!districtId) throw new RangeError("Choose a district.");
  if (!name) throw new RangeError("Enter the tourist place name.");
  if (!slug) throw new RangeError("Enter a valid place slug.");
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new RangeError("Enter a valid latitude.");
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new RangeError("Enter a valid longitude.");
  if (!PLACE_STATUSES.includes(status)) throw new RangeError("Choose a valid publication status.");

  return {
    district_id: districtId,
    name,
    slug,
    upazila_or_area: optionalText(values.upazila_or_area),
    category: optionalText(values.category),
    latitude,
    longitude,
    short_description: optionalText(values.short_description),
    best_time: optionalText(values.best_time),
    how_to_reach: optionalText(values.how_to_reach),
    practical_tips: optionalText(values.practical_tips),
    image_url: optionalText(values.image_url),
    status,
  };
}

export function sortDestinationRows(rows, resourceId) {
  if (!Array.isArray(rows) || !["districts", "places"].includes(resourceId)) return rows;
  const fields = resourceId === "districts" ? ["division", "name"] : ["division_name", "district_name", "name"];
  return [...rows].sort((left, right) => {
    for (const field of fields) {
      const compared = String(left[field] || "").localeCompare(String(right[field] || ""), "en", { sensitivity: "base" });
      if (compared) return compared;
    }
    return 0;
  });
}

export function groupReportedPostRows(rows, reportCounts = {}) {
  if (!Array.isArray(rows)) return [];
  const postGroups = new Map();
  const nonPostRows = [];

  for (const row of rows) {
    if (row && row.social_post_id) {
      const list = postGroups.get(row.social_post_id) || [];
      list.push(row);
      postGroups.set(row.social_post_id, list);
    } else if (row) {
      nonPostRows.push(row);
    }
  }

  const groupedPostRows = [...postGroups.entries()].map(([postId, reportsList]) => {
    reportsList.sort((left, right) => Date.parse(right.updated_at || right.created_at || "") - Date.parse(left.updated_at || left.created_at || ""));
    const primary = reportsList[0];
    const hasOpen = reportsList.some((r) => r.status === "OPEN");
    const allReasons = [...new Set(reportsList.flatMap((r) => (Array.isArray(r.reason_categories) ? r.reason_categories : [])).filter(Boolean))];
    const allReportIds = reportsList.map((r) => r.id).filter(Boolean);
    const reporterCount = reportCounts && reportCounts[postId] != null ? Number(reportCounts[postId]) : reportsList.length;
    const formattedDetails = reporterCount === 1
      ? primary.details
      : reportsList.map((r, i) => {
          const dateStr = r.created_at ? new Date(r.created_at).toLocaleString() : "Date not available";
          return `[Report ${i + 1} - ${dateStr}]:\n${r.details || "No details provided"}`;
        }).join("\n\n");

    return {
      ...primary,
      _row_key: postId,
      id: primary.id,
      social_post_id: postId,
      post_id: postId,
      status: hasOpen ? "OPEN" : primary.status,
      report_count: reporterCount,
      reports_count: reporterCount,
      report_ids: allReportIds,
      all_reports: reportsList,
      reason_categories: allReasons.length ? allReasons : (primary.reason_categories || []),
      details: formattedDetails,
      created_by: reporterCount === 1 ? primary.created_by : `${reporterCount} members (${reportsList.map((r) => r.created_by).filter(Boolean).join(", ")})`,
      updated_at: primary.updated_at,
    };
  });

  const processedNonPostRows = nonPostRows.map((row) => ({
    ...row,
    reports_count: row.reports_count ?? 1,
    report_count: row.report_count ?? 1,
  }));

  return [...groupedPostRows, ...processedNonPostRows].sort((left, right) =>
    Date.parse(right.updated_at || right.created_at || "") - Date.parse(left.updated_at || left.created_at || "")
  );
}
