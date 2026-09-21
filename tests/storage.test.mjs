import assert from "node:assert/strict";
import { loadSavedTrips, saveTrip } from "../src/lib/storage.js";

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

if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
else delete globalThis.localStorage;

console.log("storage tests passed");
