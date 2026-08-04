import "server-only";

import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getScreeningProvider } from "@/lib/enrichment/registry";
import type { ProviderResult, ScreeningRequest } from "@/lib/enrichment/types";

type DatabaseRow = Record<string, unknown>;

export async function processNextScreeningStep(supabase: SupabaseClient, organizationId: string, userId: string, runId: string) {
  const { data: run, error: runError } = await supabase.from("property_enrichment_runs").select("*,properties(*)").eq("id", runId).eq("organization_id", organizationId).single();
  if (runError || !run) throw new Error(runError?.message || "Screening run not found.");
  if (["complete", "partially_complete", "failed", "cancelled"].includes(run.status)) return { done: true, run };
  const property = run.properties as DatabaseRow;
  const { data: step } = await supabase.from("property_enrichment_steps").select("*").eq("run_id", runId).in("status", ["pending", "failed"]).order("sort_order").limit(1).maybeSingle();
  if (!step) return finalizeScreeningRun(supabase, organizationId, runId, property);
  const provider = getScreeningProvider(step.provider_key);
  if (!provider) return finishStep(supabase, step.id, "failed", { error_message: "Provider adapter is missing." });
  await supabase.from("property_enrichment_runs").update({ status: "running" }).eq("id", runId);
  await supabase.from("properties").update({ screening_status: "running" }).eq("id", property.id);
  await supabase.from("property_enrichment_steps").update({ status: "running", started_at: new Date().toISOString(), error_message: null }).eq("id", step.id);
  const [{ data: geometry }, { data: providerSetting }] = await Promise.all([
    supabase.from("property_geometries").select("geojson,updated_at").eq("property_id", property.id).eq("is_active", true).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("data_providers").select("status,enabled,cache_duration_seconds").eq("organization_id", organizationId).eq("provider_key", provider.key).maybeSingle(),
  ]);
  const request = buildRequest(property, Boolean(run.forced_refresh), geometry as DatabaseRow | null);
  if (providerSetting && (providerSetting.status === "disabled" || providerSetting.enabled === false)) {
    const outcome: ProviderResult = { state: "skipped", normalized: {}, confidence: "unknown", warning: "This provider is disabled for the organization." };
    return finishStep(supabase, step.id, outcome.state, { completed_at: new Date().toISOString(), warning: outcome.warning });
  }
  const cacheKey = createHash("sha256").update(provider.cacheKey(request)).digest("hex");
  let outcome: ProviderResult;
  let cached: DatabaseRow | null = null;
  if (!request.forcedRefresh && provider.configured()) {
    const { data } = await supabase.from("property_enrichment_results").select("*").eq("property_id", property.id).eq("provider_key", provider.key).eq("provider_version", provider.version).eq("cache_key", cacheKey).gt("expires_at", new Date().toISOString()).order("retrieved_at", { ascending: false }).limit(1).maybeSingle();
    cached = data;
  }
  try {
    outcome = cached ? {
      state: "complete", normalized: cached.normalized_result as Record<string, unknown>, confidence: cached.confidence as ProviderResult["confidence"],
      sourceUrl: cached.source_url as string | undefined, sourceDatasetDate: cached.source_dataset_date as string | undefined,
      rawMetadata: cached.raw_response_metadata as Record<string, unknown>, expiresInSeconds: Math.max(60, Math.floor((new Date(String(cached.expires_at)).getTime() - Date.now()) / 1000)),
      proposals: cachedProposals(provider.capability, cached.normalized_result as Record<string, unknown>, cached.confidence as ProviderResult["confidence"]),
    } : await provider.execute(request);
  } catch (error) {
    outcome = { state: "failed", normalized: {}, confidence: "unknown", error: error instanceof Error ? error.message : "Provider request failed." };
  }
  const scoreProposal = deterministicScoreImpact(provider.capability, outcome.normalized, run.score_before == null ? null : Number(run.score_before));
  if (scoreProposal) {
    outcome.normalized = { ...outcome.normalized, scoreProposal };
    await supabase.from("property_enrichment_runs").update({ proposed_score_after: scoreProposal.after, model_version: scoreProposal.modelVersion }).eq("id", runId);
  }
  const now = new Date();
  const configuredTtl = Number(providerSetting?.cache_duration_seconds || 0);
  const ttl = configuredTtl > 0 ? configuredTtl : outcome.expiresInSeconds || provider.cacheTtlSeconds;
  const expiresAt = ttl > 0 ? new Date(now.getTime() + ttl * 1000).toISOString() : null;
  const { data: result, error: resultError } = await supabase.from("property_enrichment_results").insert({
    organization_id: organizationId, run_id: runId, step_id: step.id, property_id: property.id,
    provider_key: provider.key, provider_name: provider.name, provider_version: provider.version, capability: provider.capability,
    request_parameters: scrubRequest(request), normalized_result: outcome.normalized, raw_response_metadata: outcome.rawMetadata || {},
    source_url: outcome.sourceUrl || null, source_dataset_date: outcome.sourceDatasetDate || null, confidence: outcome.confidence,
    preliminary: true, error_state: outcome.error || null, rate_limit_state: outcome.rateLimitState || null,
    credential_required: provider.credentialRequired, cache_key: cacheKey, expires_at: expiresAt,
    freshness_status: expiresAt ? "current" : "unknown", reused_from_result_id: cached?.id || null,
  }).select().single();
  if (resultError || !result) throw new Error(resultError?.message || "Provider result could not be stored.");
  await supabase.from("provider_usage_logs").insert({ organization_id: organizationId, provider_key: provider.key, capability: provider.capability, property_id: property.id, run_id: runId, request_count: cached ? 0 : 1, status: outcome.state, rate_limit_state: outcome.rateLimitState || null, requested_by: userId });
  await supabase.from("property_data_sources").insert({ organization_id: organizationId, property_id: property.id, provider_key: provider.key, source_type: provider.capability, source_url: outcome.sourceUrl || null, fields_supplied: (outcome.proposals || []).map((proposal) => proposal.fieldName), source_quality: "public_source", raw_payload: outcome.normalized, recorded_at: now.toISOString(), created_by: userId, enrichment_result_id: result.id, confidence: outcome.confidence, expires_at: expiresAt, freshness_status: expiresAt ? "current" : "unknown" });
  await createFieldProposals(supabase, organizationId, runId, property, result.id, outcome);
  await storeStructuredFindings(supabase, organizationId, runId, property, result.id, provider.capability, outcome);
  await supabase.from("data_providers").update({ health_status: outcome.state === "complete" ? "operational" : outcome.rateLimitState ? "rate_limited" : outcome.state === "failed" ? "degraded" : "unavailable", last_checked_at: now.toISOString(), last_success_at: outcome.state === "complete" ? now.toISOString() : undefined, last_failure_at: outcome.state === "failed" ? now.toISOString() : undefined, last_error_summary: outcome.error || outcome.warning || null }).eq("organization_id", organizationId).eq("provider_key", provider.key);
  await finishStep(supabase, step.id, outcome.state, { completed_at: now.toISOString(), warning: outcome.warning || null, error_message: outcome.error || null, rate_limit_state: outcome.rateLimitState || null, reused_cached_result: Boolean(cached) });
  const { count } = await supabase.from("property_enrichment_steps").select("id", { count: "exact", head: true }).eq("run_id", runId).in("status", ["pending", "running"]);
  return count ? { done: false, step: { ...step, status: outcome.state }, result } : finalizeScreeningRun(supabase, organizationId, runId, property);
}

function cachedProposals(capability: string, normalized: Record<string, unknown>, confidence: ProviderResult["confidence"]): NonNullable<ProviderResult["proposals"]> {
  if (capability !== "geocoding") return [];
  const fields: Array<[string, string]> = [["normalized_address", "formattedAddress"], ["county", "county"], ["state", "state"], ["postal_code", "postalCode"], ["latitude", "latitude"], ["longitude", "longitude"]];
  return fields.flatMap(([fieldName, resultKey]) => {
    const result = normalized[resultKey];
    return typeof result === "string" || typeof result === "number" ? [{ fieldName, value: result, confidence, reason: "Reused a still-current source result; operator review remains required." }] : [];
  });
}

function buildRequest(property: DatabaseRow, forcedRefresh: boolean, geometry: DatabaseRow | null): ScreeningRequest {
  return {
    propertyId: String(property.id),
    address: [property.address_line_1, property.city, property.state, property.postal_code].filter(Boolean).join(", "),
    latitude: property.latitude == null ? null : Number(property.latitude), longitude: property.longitude == null ? null : Number(property.longitude),
    parcelNumber: property.parcel_number ? String(property.parcel_number) : null, county: property.county ? String(property.county) : null,
    state: property.state ? String(property.state) : null, forcedRefresh,
    geometry: geometry?.geojson as Record<string, unknown> || null, geometryUpdatedAt: geometry?.updated_at ? String(geometry.updated_at) : null,
    acreage: property.total_acres == null && property.acreage_total == null ? null : Number(property.total_acres ?? property.acreage_total),
  };
}

function scrubRequest(request: ScreeningRequest) {
  return { propertyId: request.propertyId, address: request.address, latitude: request.latitude, longitude: request.longitude, parcelNumber: request.parcelNumber, geometryUpdatedAt: request.geometryUpdatedAt, hasGeometry: Boolean(request.geometry), forcedRefresh: request.forcedRefresh };
}

async function storeStructuredFindings(supabase: SupabaseClient, organizationId: string, runId: string, property: DatabaseRow, resultId: string, capability: string, outcome: ProviderResult) {
  const base = { organization_id: organizationId, property_id: property.id, run_id: runId, source_result_id: resultId, confidence: outcome.confidence, preliminary: true };
  if (capability === "flood" || capability === "wetlands") {
    const label = capability === "flood" ? "FEMA NFHL mapped flood-hazard context" : "USFWS NWI mapped wetland context";
    await supabase.from("property_environmental_findings").insert({ ...base, finding_type: capability, finding_label: label, status: outcome.state, overlap_percent: outcome.normalized.overlapPercent ?? null, affected_acres: outcome.normalized.affectedAcres ?? null, recommended_action: capability === "flood" ? "Confirm with the effective FIRM, local floodplain administrator, survey, and professional review." : "Complete wetland delineation and jurisdictional review where warranted.", details: outcome.normalized });
  }
  if (capability === "terrain" && outcome.state === "complete") {
    await supabase.from("property_terrain_findings").insert({ ...base, average_elevation: outcome.normalized.averageElevationMeters ?? null, average_slope: outcome.normalized.approximateAverageSlopePercent ?? null, maximum_slope: outcome.normalized.approximateMaximumSlopePercent ?? null, terrain_variability: outcome.normalized.terrainVariabilityMeters ?? null, grading_risk: "unknown", land_cover_breakdown: {} });
  }
}

function deterministicScoreImpact(capability: string, normalized: Record<string, unknown>, scoreBefore: number | null) {
  if (scoreBefore == null) return null;
  let delta = 0; const riskFlags: string[] = [];
  const overlap = Number(normalized.overlapPercent || 0);
  if (capability === "flood" && overlap > 0) { delta -= Math.min(12, 4 + overlap / 10); riskFlags.push("mapped_flood_hazard_overlap_requires_review"); }
  if (capability === "wetlands" && overlap > 0) { delta -= Math.min(12, 4 + overlap / 10); riskFlags.push("mapped_wetland_overlap_requires_review"); }
  const slope = Number(normalized.approximateMaximumSlopePercent || 0);
  if (capability === "terrain" && slope > 15) { delta -= Math.min(8, (slope - 15) / 3); riskFlags.push("sampled_terrain_variability_requires_review"); }
  if (!delta) return null;
  return { before: scoreBefore, delta: Number(delta.toFixed(2)), after: Number(Math.max(0, scoreBefore + delta).toFixed(2)), riskFlags, modelVersion: "nsoul-screening-impact-v1", decision: "proposed", note: "Preliminary deterministic impact only. Apply only after operator review of the underlying source result." };
}

async function createFieldProposals(supabase: SupabaseClient, organizationId: string, runId: string, property: DatabaseRow, resultId: string, outcome: ProviderResult) {
  for (const proposal of outcome.proposals || []) {
    const currentValue = property[proposal.fieldName] ?? null;
    const { count: verifiedCount } = await supabase.from("property_data_sources").select("id", { count: "exact", head: true }).eq("property_id", property.id).contains("fields_supplied", [proposal.fieldName]).or("source_quality.eq.verified,verified_at.not.is.null");
    const differs = currentValue != null && String(currentValue) !== String(proposal.value);
    const conflict = proposal.ambiguous ? "ambiguous" : differs && verifiedCount ? "differs_from_verified" : differs ? "differs_from_manual" : "no_conflict";
    await supabase.from("property_field_proposals").insert({ organization_id: organizationId, run_id: runId, property_id: property.id, field_name: proposal.fieldName, current_value: currentValue, proposed_value: proposal.value, normalized_value: proposal.value, source_id: resultId, source_quality: "public_source", confidence: proposal.confidence, proposal_reason: proposal.reason, conflict_status: conflict });
  }
}

async function finishStep(supabase: SupabaseClient, stepId: string, status: ProviderResult["state"], values: DatabaseRow) {
  await supabase.from("property_enrichment_steps").update({ status, ...values }).eq("id", stepId);
  return { done: false, step: { id: stepId, status } };
}

async function finalizeScreeningRun(supabase: SupabaseClient, organizationId: string, runId: string, property: DatabaseRow) {
  const [{ data: steps }, { count: proposalCount }, { data: sources }] = await Promise.all([
    supabase.from("property_enrichment_steps").select("status").eq("run_id", runId),
    supabase.from("property_field_proposals").select("id", { count: "exact", head: true }).eq("run_id", runId),
    supabase.from("property_enrichment_results").select("provider_name,capability,source_url,retrieved_at,confidence,preliminary,error_state").eq("run_id", runId),
  ]);
  const successful = (steps || []).filter((step) => step.status === "complete").length;
  const failed = (steps || []).filter((step) => step.status === "failed").length;
  const warnings = (steps || []).filter((step) => ["warning", "unavailable"].includes(step.status)).length;
  const finalStatus = successful === 0 && failed > 0 ? "failed" : warnings || failed ? "partially_complete" : "complete";
  const summary = successful ? `Automated preliminary screening completed with ${successful} configured provider${successful === 1 ? "" : "s"}. Unavailable categories remain manual.` : "No configured provider returned a successful result. Manual property workflow remains available.";
  const now = new Date().toISOString();
  const { data: run } = await supabase.from("property_enrichment_runs").update({ status: finalStatus, completed_at: now, successful_provider_count: successful, failed_provider_count: failed, warning_count: warnings, proposed_change_count: proposalCount || 0, summary }).eq("id", runId).eq("organization_id", organizationId).select().single();
  await supabase.from("properties").update({ screening_status: finalStatus, latest_screened_at: now }).eq("id", property.id);
  await supabase.from("property_screening_reports").upsert({ organization_id: organizationId, property_id: property.id, run_id: runId, title: `${property.name || property.project_name || property.address_line_1}, Preliminary Site Screening`, executive_summary: summary, top_strengths: [], top_risks: [], missing_critical_information: ["Utility hosting capacity and interconnection feasibility", "Title, zoning, legal access, environmental clearance, and exact buildable acreage", "Professional survey, civil engineering, and production modeling"], recommended_actions: ["Review and decide each proposed field update", "Confirm utility territory and request circuit-capacity review", "Commission parcel, title, environmental, survey, and engineering diligence as appropriate"], source_appendix: sources || [] }).select().single();
  return { done: true, run };
}
