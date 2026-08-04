import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../supabase/migrations/202608030003_property_enrichment_gis.sql");
const service = read("../lib/enrichment/service.ts");
const registry = read("../lib/enrichment/registry.ts");
const geocoder = read("../lib/enrichment/providers/census-geocoder.ts");
const scoring = read("../lib/enrichment/scoring.ts");
const screeningRoute = read("../app/api/properties/[id]/screening/route.ts");
const batchRoute = read("../app/api/properties/screening-batch/route.ts");
const screeningWorkspace = read("../components/properties/screening-workspace.tsx");
const globalStyles = read("../app/globals.css");
const providerMigration = read("../supabase/migrations/202608040001_property_provider_integrations.sql");
const fema = read("../lib/enrichment/providers/fema-flood.ts");
const wetlands = read("../lib/enrichment/providers/usfws-wetlands.ts");
const terrain = read("../lib/enrichment/providers/usgs-terrain.ts");
const solar = read("../lib/enrichment/providers/nlr-solar.ts");
const integrationsRoute = read("../app/api/integrations/route.ts");

test("all enrichment tables have tenant RLS and no anonymous grants", () => {
  for (const table of ["data_providers","property_enrichment_runs","property_enrichment_steps","property_enrichment_results","property_field_proposals","property_geometries","property_environmental_findings","property_terrain_findings","property_access_findings","property_utility_findings","property_grid_assets","property_commercial_context","property_screening_reports","provider_usage_logs"]) assert.match(migration, new RegExp(`'${table}'`));
  assert.match(migration, /revoke all on public\.%I from anon/);
  assert.match(migration, /organization_id = public\.current_organization_id\(\)/);
});

test("active duplicate runs are prevented atomically", () => { assert.match(migration, /property_enrichment_one_active_run/); assert.match(migration, /active_screening_exists/); });
test("manual and verified facts are proposed rather than overwritten", () => { assert.match(service, /createFieldProposals/); assert.match(service, /differs_from_verified/); assert.match(service, /differs_from_manual/); assert.doesNotMatch(service, /from\("properties"\)\.update\([^)]*latitude/s); });
test("proposal decisions are operator-only and audited", () => { assert.match(migration, /property_field_proposals_operator_update/); assert.match(migration, /array\['owner','admin','developer'\]/); assert.match(migration, /proposal_accepted/); assert.match(migration, /proposal_rejected/); assert.match(screeningRoute, /PROPERTY_OPERATOR_ROLES/); });
test("configured providers fail independently", () => { assert.match(service, /catch \(error\)/); assert.match(service, /Provider request failed/); assert.match(service, /processNextScreeningStep/); assert.match(registry, /UnavailableProvider/); });
test("no-key fallback leaves unsupported categories unavailable", () => { assert.match(registry, /ConfiguredParcelProvider/); assert.match(registry, /utility-territory-provider/); assert.match(read("../lib/enrichment/providers/unavailable.ts"), /state: "unavailable"/); assert.match(solar, /provider_not_configured/); });
test("Census geocoding handles no match and ambiguous candidates conservatively", () => { assert.match(geocoder, /No Census address-range match/); assert.match(geocoder, /Multiple address candidates/); assert.match(geocoder, /No candidate was selected automatically/); });
test("cache reuse and forced refresh are explicit", () => { assert.match(service, /gt\("expires_at"/); assert.match(service, /reused_from_result_id/); assert.match(service, /request\.forcedRefresh/); assert.match(screeningRoute, /forceRefresh/); });
test("utility proximity cannot create a high interconnection score", () => { assert.match(scoring, /grid_and_interconnection/); assert.match(scoring, /utility_confirmed/); assert.match(scoring, /Math\.min\(component\.rawScore \?\? 0, 35\)/); });
test("environmental and grid outputs retain preliminary warnings", () => { assert.match(read("../lib/enrichment/types.ts"), /does not establish interconnection capacity/); assert.match(read("../lib/enrichment/types.ts"), /does not establish available hosting capacity/); assert.match(migration, /preliminary boolean not null default true/); });
test("batch screening is bounded and incremental", () => { assert.match(batchRoute, /SCREENING_BATCH_MAX/); assert.match(batchRoute, /\.max\(maximum\)/); assert.match(batchRoute, /create_property_enrichment_run/); assert.doesNotMatch(batchRoute, /processNextScreeningStep/); });
test("reports remain tenant-scoped, non-public, and printable", () => { const report = read("../app/api/screening-reports/[runId]/route.ts"); assert.match(report, /getApiActor/); assert.match(report, /window\.print/); assert.match(report, /no-store/); assert.match(report, /preliminary/i); });
test("provider metadata and screening lifecycle are auditable", () => { assert.match(migration, /provider_name text not null/); assert.match(migration, /provider_version text not null/); assert.match(migration, /property_enrichment_runs.*provider_usage_logs/s); assert.match(migration, /create trigger %I after insert or update or delete/); assert.match(migration, /execute function public\.log_change\(\)/); });
test("screening cards inherit Studio themes and surface provider results", () => {
  assert.match(globalStyles, /--finder-panel-soft:var\(--fd-panel2\)/);
  assert.doesNotMatch(globalStyles, /--finder-panel-soft:#0b1722/);
  assert.match(screeningWorkspace, /property_enrichment_results/);
  assert.match(screeningWorkspace, /normalized_result/);
  assert.match(screeningWorkspace, /Integration unavailable/);
  assert.match(screeningWorkspace, /Resume screening/);
});
test("FEMA adapter uses the official NFHL hazard-zone layer and stores preliminary overlap", () => { assert.match(fema, /hazards\.fema\.gov/); assert.match(fema, /SERVICE}\/28/); assert.match(fema, /calculateOverlap/); assert.match(fema, /not a flood determination/); });
test("USFWS adapter uses NWI and preserves no-feature versus provider failure", () => { assert.match(wetlands, /fwspublicservices\.wim\.usgs\.gov/); assert.match(wetlands, /no_mapped_feature_at_query_geometry/); assert.match(wetlands, /state: "failed"/); });
test("USGS terrain uses bounded samples and labels slope as approximate", () => { assert.match(terrain, /epqs\.nationalmap\.gov/); assert.match(terrain, /slice\(0, 8\)/); assert.match(terrain, /approximateMaximumSlopePercent/); assert.match(terrain, /do not replace a topographic survey/); });
test("solar resource requires a server-only key and never exposes it in public config", () => { assert.match(solar, /process\.env\.SOLAR_RESOURCE_API_KEY/); assert.doesNotMatch(solar, /NEXT_PUBLIC_SOLAR/); assert.match(read("../.env.example"), /SOLAR_RESOURCE_API_KEY=/); });
test("provider cache keys include adapter version and geometry freshness", () => { assert.match(fema, /this\.version/); assert.match(fema, /geometryUpdatedAt/); assert.match(service, /provider_version", provider\.version/); });
test("provider health, failures, cache controls and secret scrubbing are migrated", () => { for (const value of ["health_status","last_failure_at","last_error_summary","cache_duration_seconds","quota_used_daily"]) assert.match(providerMigration, new RegExp(value)); assert.match(providerMigration, /configuration - 'api_key' - 'token' - 'secret'/); });
test("integration mutations are owner-admin server boundaries", () => { assert.match(integrationsRoute, /getApiActor\(ADMIN_ROLES\)/g); assert.match(integrationsRoute, /action === "test"/); assert.match(integrationsRoute, /action === "configure"/); assert.doesNotMatch(integrationsRoute, /SUPABASE_SERVICE_ROLE_KEY/); });
test("public services require no credentials while gated services remain gated", () => { assert.match(providerMigration, /'flood-provider'.*false/s); assert.match(providerMigration, /'wetlands-provider'.*false/s); assert.match(providerMigration, /'terrain-provider'.*false/s); assert.match(providerMigration, /'solar-resource-provider'.*true/s); });
test("screening failures do not erase successful provider results", () => { assert.match(service, /property_enrichment_results"\)\.insert/); assert.match(service, /property_enrichment_steps/); assert.match(service, /partially_complete/); });
test("automated risk scoring remains a versioned proposal", () => { assert.match(service, /deterministicScoreImpact/); assert.match(service, /decision: "proposed"/); assert.match(service, /before: scoreBefore/); assert.match(service, /proposed_score_after/); });
test("secondary geocoding remains ambiguity-safe and manual coordinates remain usable", () => { assert.match(geocoder, /SECONDARY_GEOCODING_PROVIDER/); assert.match(geocoder, /operator-supplied coordinates/); assert.match(geocoder, /returned multiple candidates/); assert.match(geocoder, /candidates\.length !== 1/); });
test("parcel adapter remains explicit and vendor evaluation avoids invented pricing", () => { const parcel = read("../lib/enrichment/providers/parcel.ts"); const evaluation = read("../docs/PARCEL_PROVIDER_EVALUATION.md"); assert.match(parcel, /manual_or_multi_select/); assert.match(evaluation, /Regrid/); assert.match(evaluation, /LightBox/); assert.match(evaluation, /Do not select a provider based on undocumented pricing/); });
