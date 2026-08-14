// Executed directly by Node's type-stripping test runner; no application secrets are loaded.
import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_ROLES,
  canAccessDashboard,
  canAssignRole,
  canManageMembership,
} from "../lib/auth/roles.ts";
import { passwordResetRedirectUrl, SITE_URL } from "../lib/site-config.ts";

test("anonymous dashboard access is rejected", () => {
  assert.equal(canAccessDashboard(null), false);
});

test("viewer is blocked from the administrative user route", () => {
  assert.equal(ADMIN_ROLES.includes("viewer"), false);
});

test("developer cannot change organization roles", () => {
  assert.equal(canManageMembership("developer", "viewer", "analyst"), false);
});

test("admin may invite or manage a non-owner", () => {
  assert.equal(canAssignRole("admin", "developer"), true);
  assert.equal(canManageMembership("admin", "viewer", "analyst"), true);
});

test("admin cannot assign or modify an owner", () => {
  assert.equal(canAssignRole("admin", "owner"), false);
  assert.equal(canManageMembership("admin", "owner", "admin"), false);
});

test("owner may manage every role", () => {
  assert.equal(canAssignRole("owner", "owner"), true);
  assert.equal(canManageMembership("owner", "owner", "viewer"), true);
});

test("suspended and deactivated users cannot enter the dashboard", () => {
  assert.equal(canAccessDashboard("suspended"), false);
  assert.equal(canAccessDashboard("deactivated"), false);
  assert.equal(canAccessDashboard("active"), true);
});

test("password recovery uses the canonical callback instead of the homepage", () => {
  assert.equal(SITE_URL, "https://nsoul.co");
  assert.equal(
    passwordResetRedirectUrl(),
    "https://nsoul.co/auth/callback?next=/auth/reset-password",
  );
});
