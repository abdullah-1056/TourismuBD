import assert from "node:assert/strict";
import { loadSavedTrips, saveTrip, loadUserOrders, saveUserOrder, cancelUserOrder, loadSeenOrderIds, saveSeenOrderIds } from "../src/lib/storage.js";

const records = new Map();
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key) => records.get(key) ?? null,
  setItem: (key, value) => records.set(key, value),
} });

saveTrip({ id: "trip-a", name: "A" }, "traveler-a");
saveTrip({ id: "trip-b", name: "B" }, "traveler-b");
assert.deepEqual(loadSavedTrips("traveler-a").map((trip) => trip.id), ["trip-a"]);
assert.deepEqual(loadSavedTrips("traveler-b").map((trip) => trip.id), ["trip-b"]);
assert.deepEqual(loadSavedTrips(), []);

saveUserOrder({ id: "ord-1", product_name: "Handicraft", status: "PENDING" }, "user-1");
assert.deepEqual(loadUserOrders("user-1").map((ord) => ord.id), ["ord-1"]);
assert.deepEqual(loadUserOrders("user-2"), []);

cancelUserOrder("ord-1", "user-1");
const updatedOrders = loadUserOrders("user-1");
assert.equal(updatedOrders[0].status, "CANCELLED");

assert.equal(loadSeenOrderIds("user-1"), null);
saveSeenOrderIds("user-1", ["ord-1", "ord-2"]);
const seen = loadSeenOrderIds("user-1");
assert.equal(seen.has("ord-1"), true);
assert.equal(seen.has("ord-2"), true);
assert.equal(seen.has("ord-3"), false);

if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
else delete globalThis.localStorage;

console.log("storage tests passed");
