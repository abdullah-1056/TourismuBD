import { validateBookingDuration } from "./route.js";

const TRIPS_KEY = "tourismubd.savedTrips.v1";
const BOOKINGS_KEY = "tourismubd.bookings.v1";

function read(key) {
  if (!globalThis.localStorage) return [];
  try {
    const value = JSON.parse(globalThis.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function save(key, value, prefix) {
  if (!globalThis.localStorage) throw new Error("localStorage is not available");
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Saved value must be an object");
  }

  const records = read(key);
  const now = new Date().toISOString();
  const record = {
    ...value,
    id: value.id ?? `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
    createdAt: value.createdAt ?? now,
    updatedAt: now,
  };
  const index = records.findIndex(({ id }) => id === record.id);
  if (index === -1) records.push(record);
  else records[index] = record;
  globalThis.localStorage.setItem(key, JSON.stringify(records));
  return record;
}

function accountKey(key, userId) {
  return userId ? `${key}.${userId}` : null;
}

export function loadSavedTrips(userId) {
  const key = accountKey(TRIPS_KEY, userId);
  return key ? read(key) : [];
}

export function saveTrip(trip, userId) {
  const key = accountKey(TRIPS_KEY, userId);
  if (!key) throw new Error("Sign in to save a trip.");
  return save(key, trip, "trip");
}
export const loadBookings = () => read(BOOKINGS_KEY);
export function saveBooking(booking) {
  const validation = validateBookingDuration(booking);
  if (!validation.valid) throw new RangeError(validation.error);
  return save(BOOKINGS_KEY, booking, "booking");
}

const ORDERS_KEY = "tourismubd.orders.v1";
export function loadUserOrders(userId) {
  const key = accountKey(ORDERS_KEY, userId);
  return key ? read(key) : [];
}

export function saveUserOrder(order, userId) {
  const key = accountKey(ORDERS_KEY, userId);
  if (!key) throw new Error("Sign in to place an order.");
  return save(key, order, "order");
}

export function cancelUserOrder(orderId, userId) {
  const key = accountKey(ORDERS_KEY, userId);
  if (!key) return null;
  const records = read(key);
  const index = records.findIndex((item) => item.id === orderId);
  if (index !== -1) {
    records[index] = { ...records[index], status: "CANCELLED", updatedAt: new Date().toISOString() };
    globalThis.localStorage.setItem(key, JSON.stringify(records));
    return records[index];
  }
  return null;
}
