import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PRELIMINARY_CATEGORIES, calculatePreliminaryScore } from "../lib/scoring/preliminary.ts";

const complete = PRELIMINARY_CATEGORIES.map(([category, label]) => ({ category, rawScore: 80, sourceQuality: "verified" as const, critical: true, explanation: `${label} verified.` }));
const crmMigration = readFileSync(new URL("../supabase/migrations/202608030002_property_intelligence_crm.sql", import.meta.url), "utf8");

test("preliminary score calculation is deterministic", () => {
  assert.deepEqual(calculatePreliminaryScore({ components: complete }), calculatePreliminaryScore({ components: complete }));
  assert.equal(calculatePreliminaryScore({ components: complete }).numericScore, 80);
  assert.equal(calculatePreliminaryScore({ components: complete }).grade, "B");
});

test("fatal risk overrides a strong numeric recommendation", () => {
  const result = calculatePreliminaryScore({ components: complete.map((item) => ({ ...item, rawScore: 95 })), fatalRisks: ["no_viable_interconnection"] });
  assert.equal(result.grade, "A");
  assert.equal(result.overallRisk, "critical");
  assert.match(result.recommendation, /Hold/);
});

test("manual override requires a reason", () => {
  assert.throws(() => calculatePreliminaryScore({ components: complete, overrideScore: 90, overrideReason: "short" }), /requires a reason/);
  assert.equal(calculatePreliminaryScore({ components: complete, overrideScore: 90, overrideReason: "Documented engineering adjustment" }).displayedScore, 90);
});

test("grade thresholds are exact and the original score survives an override", () => {
  for (const [score, grade] of [[85,"A"],[84,"B"],[70,"B"],[69,"C"],[55,"C"],[54,"D"],[40,"D"],[39,"F"]] as const) {
    const result = calculatePreliminaryScore({ components: complete.map((item) => ({ ...item, rawScore: score })) });
    assert.equal(result.grade, grade);
  }
  const overridden = calculatePreliminaryScore({ components: complete, overrideScore: 90, overrideReason: "Supported management adjustment" });
  assert.equal(overridden.numericScore, 80);
  assert.equal(overridden.displayedScore, 90);
});

test("confidence accounts for estimates, unknown critical facts, and stale sources", () => {
  const stale = complete.map((item) => ({ ...item, sourceDate: "2020-01-01" }));
  const result = calculatePreliminaryScore({ components: stale, asOfDate: "2026-08-03" });
  assert.equal(result.verifiedFieldCount, 0);
  assert.equal(result.confidence, "low");
  const estimated = calculatePreliminaryScore({ components: complete.map((item) => ({ ...item, sourceQuality: "estimated" as const })) });
  assert.equal(estimated.estimatedFieldCount, 7);
});

test("property migration enforces tenant RLS and explicit operation policies", () => {
  const sql = readFileSync(new URL("../supabase/migrations/202608030001_property_acquisition.sql", import.meta.url), "utf8");
  for (const table of ["property_parcels", "property_assessments", "property_score_runs", "property_score_components", "property_risk_flags", "property_data_sources", "property_status_history", "comments", "project_properties"]) {
    assert.match(sql, new RegExp(`'${table}'`));
  }
  assert.match(sql, /for select to authenticated/);
  assert.match(sql, /for insert to authenticated/);
  assert.match(sql, /for update to authenticated/);
  assert.match(sql, /for delete to authenticated/);
  assert.match(sql, /organization_id = public\.current_organization_id\(\)/);
});

test("promotion boundary is permission checked and idempotent", () => {
  const route = readFileSync(new URL("../app/api/properties/[id]/route.ts", import.meta.url), "utf8");
  assert.match(route, /PROMOTER_ROLES/);
  assert.match(route, /project_properties/);
  assert.match(route, /existingLink/);
  assert.match(route, /idempotent: true/);
  assert.match(route, /promote_property_to_project/);
  assert.match(crmMigration, /for update/);
  assert.match(crmMigration, /project_stage, legal_entity/);
  assert.match(crmMigration, /'prospect'/);
  assert.match(crmMigration, /for update;/i);
});

test("canonical pipeline, checklist, provenance, and tenant policies are installed", () => {
  assert.match(crmMigration, /promoted_to_project/);
  assert.match(crmMigration, /create table public\.property_checklist_items/);
  assert.match(crmMigration, /user_reported.*public_source/s);
  assert.match(crmMigration, /property_activity/);
  assert.match(crmMigration, /organization_id = public\.current_organization_id\(\)/);
  assert.match(crmMigration, /array\['owner','admin','developer'\]/);
  assert.doesNotMatch(crmMigration, /array\['owner','admin','developer','analyst'\].*property_checklist/s);
});

test("private documents use tenant-prefixed storage and authenticated signed downloads", () => {
  const upload = readFileSync(new URL("../app/api/documents/route.ts", import.meta.url), "utf8");
  const download = readFileSync(new URL("../app/api/documents/[id]/route.ts", import.meta.url), "utf8");
  assert.match(upload, /profile\.organizationId/);
  assert.match(download, /createSignedUrl/);
  assert.match(download, /getApiActor/);
  assert.match(crmMigration, /confidentiality/);
});

test("material CRM changes are audited and archived properties are restorable", () => {
  for (const trigger of ["property_checklist_items_audit","property_contacts_audit","property_notes_audit","tasks_audit"]) assert.match(crmMigration, new RegExp(trigger));
  const route = readFileSync(new URL("../app/api/properties/[id]/route.ts", import.meta.url), "utf8");
  assert.match(route, /body\.action === "restore"/);
  assert.match(route, /archived_at: null/);
});

test("public submission conversion is secured, retained, and idempotent", () => {
  const route = readFileSync(new URL("../app/api/public-submissions/[id]/convert/route.ts", import.meta.url), "utf8");
  assert.match(route, /ADMIN_ROLES/);
  assert.match(route, /convert_public_submission_to_property/);
  assert.match(crmMigration, /converted_property_id is not null/);
  assert.match(crmMigration, /select \* into property_record from public\.properties/);
});

test("anonymous and read-only roles are blocked from property mutations", () => {
  const createRoute = readFileSync(new URL("../app/api/properties/route.ts", import.meta.url), "utf8");
  const crmRoute = readFileSync(new URL("../app/api/properties/[id]/crm/route.ts", import.meta.url), "utf8");
  assert.match(createRoute, /PROPERTY_OPERATOR_ROLES/);
  assert.match(crmRoute, /PROPERTY_OPERATOR_ROLES/);
  assert.match(crmMigration, /revoke all on public\.property_checklist_items from anon/);
});
