import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PRELIMINARY_CATEGORIES, calculatePreliminaryScore } from "../lib/scoring/preliminary.ts";

const complete = PRELIMINARY_CATEGORIES.map(([category, label]) => ({ category, rawScore: 80, sourceQuality: "verified" as const, critical: true, explanation: `${label} verified.` }));

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
});
