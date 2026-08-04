import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateLoginReadiness,
  parseBootstrapOptions,
} from "../scripts/bootstrap-first-owner.mjs";

const userId = "837fbd1a-4c1d-4c23-bbee-71040ead75c7";

test("first-owner CLI accepts an explicit Auth UUID", () => {
  assert.deepEqual(parseBootstrapOptions(["--user-id", userId], { ...process.env }), {
    userId,
    verifyOnly: false,
    organizationName: "NSoul",
    organizationSlug: "nsoul",
  });
});

test("verification mode may use the server environment UUID", () => {
  assert.equal(
    parseBootstrapOptions(["--verify-only"], {
      ...process.env,
      NSOUL_INITIAL_OWNER_USER_ID: userId,
    }).verifyOnly,
    true,
  );
});

test("invalid first-owner UUIDs fail before any database request", () => {
  assert.throws(
    () => parseBootstrapOptions(["--user-id", "not-a-uuid"], { ...process.env }),
    /valid Auth UUID/,
  );
});

test("login readiness requires the complete active owner graph", () => {
  const ready = {
    authUserExists: true,
    authAccountActive: true,
    authEmailConfirmed: true,
    profileExists: true,
    organizationExists: true,
    membershipExists: true,
    membershipOrganizationMatches: true,
    role: "owner",
    status: "active",
  };
  assert.equal(evaluateLoginReadiness(ready), true);
  assert.equal(evaluateLoginReadiness({ ...ready, profileExists: false }), false);
  assert.equal(evaluateLoginReadiness({ ...ready, status: "suspended" }), false);
  assert.equal(evaluateLoginReadiness({ ...ready, role: "admin" }), false);
  assert.equal(evaluateLoginReadiness({ ...ready, authAccountActive: false }), false);
});
