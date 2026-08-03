import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildProjection, FINANCE_ENGINE_VERSION, runSensitivity, type FinanceInputs, type SensitivityVariable } from "@/lib/finance/engine";

type SupabaseActor = {
  supabase: SupabaseClient;
  profile: { organizationId: string };
  user: { id: string };
};

export function stableHash(value: unknown) {
  const canonicalize = (input: unknown): unknown => Array.isArray(input)
    ? input.map(canonicalize)
    : input && typeof input === "object"
      ? Object.fromEntries(Object.entries(input as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]))
      : input;
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

export async function createFinancialModelVersion(actor: SupabaseActor, projectId: string, name: string, scenarioType: string, inputs: FinanceInputs) {
  const projection = buildProjection(inputs);
  const blockingWarnings = projection.warnings.filter((warning) => warning.severity === "blocking");
  if (blockingWarnings.length) throw new Error(blockingWarnings.map((warning) => warning.message).join(" "));
  const sourceTables = ["production_models", "epc_proposals", "ppa_scenarios", "interconnection_cost_estimates", "project_incentives"] as const;
  const projectSource = await actor.supabase.from("projects").select("id,updated_at").eq("id", projectId).single();
  if (projectSource.error) throw new Error("Project source record not found.");
  const linkedSources = [{ sourceTable: "projects", ...projectSource.data }];
  for (const sourceTable of sourceTables) {
    const source = await actor.supabase.from(sourceTable).select("id,updated_at").eq("project_id", projectId).is("archived_at", null).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (source.error) throw new Error(`Unable to resolve ${sourceTable} source data: ${source.error.message}`);
    if (source.data) linkedSources.push({ sourceTable, ...source.data });
  }
  const debtSource = await actor.supabase.from("debt_terms").select("id,created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (debtSource.error) throw new Error(`Unable to resolve debt_terms source data: ${debtSource.error.message}`);
  if (debtSource.data) linkedSources.push({ sourceTable: "debt_terms", id: debtSource.data.id, updated_at: debtSource.data.created_at });
  const sourceHash = stableHash({ inputs, linkedSources });
  const modelResult = await actor.supabase.from("financial_models").upsert({ organization_id: actor.profile.organizationId, project_id: projectId, name, created_by: actor.user.id }, { onConflict: "organization_id,project_id,name" }).select("id").single();
  if (modelResult.error) throw new Error(modelResult.error.message);
  const versionCount = await actor.supabase.from("financial_model_versions").select("id", { count: "exact", head: true }).eq("financial_model_id", modelResult.data.id);
  const versionNumber = (versionCount.count || 0) + 1;
  const versionHash = stableHash({ engineVersion: FINANCE_ENGINE_VERSION, versionNumber, inputs, projection });
  const versionResult = await actor.supabase.from("financial_model_versions").insert({
    organization_id: actor.profile.organizationId, project_id: projectId, financial_model_id: modelResult.data.id, version_number: versionNumber,
    name: `${name} v${versionNumber}`, status: "draft", scenario_type: scenarioType, engine_version: FINANCE_ENGINE_VERSION,
    version_hash: versionHash, source_hash: sourceHash, inputs, outputs: projection, created_by: actor.user.id,
  }).select("*").single();
  if (versionResult.error) throw new Error(versionResult.error.message);
  const setName = `${name} scenarios`;
  let scenarioSet = await actor.supabase.from("scenario_sets").select("id").eq("project_id", projectId).eq("name", setName).is("archived_at", null).maybeSingle();
  if (!scenarioSet.data) scenarioSet = await actor.supabase.from("scenario_sets").insert({ organization_id: actor.profile.organizationId, project_id: projectId, name: setName, base_model_version_id: scenarioType === "base" ? versionResult.data.id : null, created_by: actor.user.id }).select("id").single();
  if (scenarioSet.data) {
    await actor.supabase.from("scenario_versions").insert({ organization_id: actor.profile.organizationId, project_id: projectId, scenario_set_id: scenarioSet.data.id, model_version_id: versionResult.data.id, scenario_type: scenarioType, label: versionResult.data.name });
    await actor.supabase.from("scenario_comparisons").insert({ organization_id: actor.profile.organizationId, project_id: projectId, scenario_set_id: scenarioSet.data.id, comparison_payload: { modelVersionId: versionResult.data.id, scenarioType, projectNpv: projection.projectNpv, projectIrr: projection.projectIrr, equityIrr: projection.equityIrr, minimumDscr: projection.minimumDscr, capitalGap: projection.capitalGap, warnings: projection.warnings }, created_by: actor.user.id });
  }
  const assumptionRows = Object.entries(inputs).filter(([, value]) => typeof value === "number").map(([key, value]) => ({ organization_id: actor.profile.organizationId, project_id: projectId, model_version_id: versionResult.data.id, assumption_key: key, numeric_value: value, material: true, created_by: actor.user.id }));
  const outputEntries: Array<[string, number | null]> = [["project_npv", projection.projectNpv], ["equity_npv", projection.equityNpv], ["project_irr", projection.projectIrr], ["equity_irr", projection.equityIrr], ["minimum_dscr", projection.minimumDscr], ["average_dscr", projection.averageDscr], ["break_even_ppa_rate", projection.breakEvenPpaRate], ["break_even_project_cost", projection.breakEvenProjectCost], ["capital_gap", projection.capitalGap], ["sponsor_equity_requirement", projection.sponsorEquityRequirement]];
  const outputRows = outputEntries.map(([key, value]) => ({ organization_id: actor.profile.organizationId, project_id: projectId, model_version_id: versionResult.data.id, output_key: key, numeric_value: value }));
  const warningRows = projection.warnings.map((warning) => ({ organization_id: actor.profile.organizationId, project_id: projectId, model_version_id: versionResult.data.id, ...warning }));
  const sourceRows = linkedSources.map((source) => ({
    organization_id: actor.profile.organizationId,
    project_id: projectId,
    model_version_id: versionResult.data.id,
    source_table: source.sourceTable,
    source_id: source.id,
    source_updated_at: source.updated_at,
    source_hash: stableHash(source),
    material: true,
  }));
  const revenueRows = projection.years.map((year) => ({ organization_id: actor.profile.organizationId, project_id: projectId, model_version_id: versionResult.data.id, year_number: year.year, generation_kwh: year.generationKwh, rate_per_kwh: year.ppaRatePerKwh, gross_revenue: year.revenue }));
  const opexRows = projection.years.map((year) => ({ organization_id: actor.profile.organizationId, project_id: projectId, model_version_id: versionResult.data.id, year_number: year.year, operating_expense: year.opex, reserve_contribution: inputs.reserveContributionAnnual, replacement_capex: year.replacementCapex }));
  const writes = [
    assumptionRows.length ? actor.supabase.from("financial_model_assumptions").insert(assumptionRows) : Promise.resolve({ error: null }),
    actor.supabase.from("financial_model_outputs").insert(outputRows),
    warningRows.length ? actor.supabase.from("financial_model_warnings").insert(warningRows) : Promise.resolve({ error: null }),
    actor.supabase.from("financial_model_source_links").insert(sourceRows),
    actor.supabase.from("revenue_forecast_years").insert(revenueRows),
    actor.supabase.from("opex_forecast_years").insert(opexRows),
    actor.supabase.from("financial_models").update({ current_version_id: versionResult.data.id, status: "draft" }).eq("id", modelResult.data.id),
  ];
  const results = await Promise.all(writes);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
  return versionResult.data;
}

export async function createSensitivityRun(actor: SupabaseActor, projectId: string, versionId: string, rowVariable: SensitivityVariable, rowDeltasPct: number[], columnVariable: SensitivityVariable, columnDeltasPct: number[]) {
  const version = await actor.supabase.from("financial_model_versions").select("inputs").eq("id", versionId).eq("project_id", projectId).single();
  if (version.error) throw new Error("Financial model version not found.");
  const results = runSensitivity(version.data.inputs as FinanceInputs, rowVariable, rowDeltasPct, columnVariable, columnDeltasPct);
  const run = await actor.supabase.from("sensitivity_runs").insert({ organization_id: actor.profile.organizationId, project_id: projectId, model_version_id: versionId, row_variable: rowVariable, column_variable: columnVariable, row_deltas: rowDeltasPct, column_deltas: columnDeltasPct, created_by: actor.user.id }).select("id").single();
  if (run.error) throw new Error(run.error.message);
  const rows = results.map((result) => ({ organization_id: actor.profile.organizationId, project_id: projectId, sensitivity_run_id: run.data.id, row_delta: result.rowDeltaPct, column_delta: result.columnDeltaPct, output_payload: result }));
  const saved = await actor.supabase.from("sensitivity_results").insert(rows);
  if (saved.error) throw new Error(saved.error.message);
  return { id: run.data.id, results };
}
