import assert from "node:assert/strict";
import test from "node:test";
import { GUEST_PUBLIC_VIEWS, viewRequiresAuthentication } from "../src/lib/access.js";

test("guests can only open Discover and Places", () => {
  assert.deepEqual(GUEST_PUBLIC_VIEWS, ["home", "explore"]);
  assert.equal(viewRequiresAuthentication("home", null), false);
  assert.equal(viewRequiresAuthentication("explore", null), false);

  for (const view of ["feed", "trip", "services", "people", "traveler", "provider", "account-about"]) {
    assert.equal(viewRequiresAuthentication(view, null), true, `${view} should require authentication`);
  }
});

test("signed-in members can open protected views", () => {
  assert.equal(viewRequiresAuthentication("feed", { id: "member-id" }), false);
  assert.equal(viewRequiresAuthentication("trip", { id: "member-id" }), false);
  assert.equal(viewRequiresAuthentication("services", { id: "member-id" }), false);
  assert.equal(viewRequiresAuthentication("people", { id: "member-id" }), false);
});
