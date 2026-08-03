import { NextResponse } from "next/server";

import { EDITOR_ROLES } from "@/lib/auth/roles";
import { getApiActor } from "@/lib/auth/api";
import { calculatePreliminaryScore } from "@/lib/scoring/preliminary";
import { preliminaryAssessmentSchema } from "@/lib/validation/site-finder";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(EDITOR_ROLES);
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const parsed = preliminaryAssessmentSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });

  const { data: property } = await actor.supabase.from("properties").select("id").eq("id", id).maybeSingle();
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  let result;
  try {
    result = calculatePreliminaryScore(parsed.data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to calculate score" }, { status: 422 });
  }

  const { data: assessment, error: assessmentError } = await actor.supabase.from("property_assessments").insert({
    property_id: id,
    assessment_type: "preliminary",
    inputs: parsed.data,
    notes: parsed.data.notes || null,
    assessed_by: actor.user.id,
  }).select("id").single();
  if (assessmentError || !assessment) return NextResponse.json({ error: assessmentError?.message || "Assessment could not be saved" }, { status: 400 });

  const { data: run, error: runError } = await actor.supabase.from("property_score_runs").insert({
    property_id: id,
    assessment_id: assessment.id,
    model_version: result.modelVersion,
    numeric_score: result.numericScore,
    displayed_score: result.displayedScore,
    grade: result.grade,
    recommendation: result.recommendation,
    overall_risk: result.overallRisk,
    confidence: result.confidence,
    verified_field_count: result.verifiedFieldCount,
    missing_critical_field_count: result.missingCriticalFieldCount,
    raw_inputs: parsed.data,
    weighted_outputs: result.components,
    explanatory_notes: parsed.data.notes || null,
    override_score: parsed.data.overrideScore ?? null,
    override_reason: result.overrideReason,
    scored_by: actor.user.id,
  }).select("id").single();
  if (runError || !run) return NextResponse.json({ error: runError?.message || "Score run could not be saved" }, { status: 400 });

  const componentRows = result.components.map((component) => ({
    score_run_id: run.id,
    category: component.category,
    raw_score: component.rawScore,
    weight: component.weight,
    weighted_score: component.weightedScore,
    source_quality: component.sourceQuality,
    is_critical_missing: component.criticalMissing,
    explanation: component.explanation,
  }));
  const riskRows = result.fatalRisks.map((riskType) => ({
    property_id: id,
    score_run_id: run.id,
    risk_type: riskType,
    severity: "fatal",
    explanation: `Fatal risk recorded during ${result.modelVersion} assessment.`,
  }));
  await actor.supabase.from("property_risk_flags").update({ active: false, resolved_at: new Date().toISOString(), resolved_by: actor.user.id }).eq("property_id", id).eq("active", true);
  const [{ error: componentsError }, risksResult] = await Promise.all([
    actor.supabase.from("property_score_components").insert(componentRows),
    riskRows.length ? actor.supabase.from("property_risk_flags").insert(riskRows) : Promise.resolve({ error: null }),
  ]);
  if (componentsError || risksResult.error) return NextResponse.json({ error: componentsError?.message || risksResult.error?.message }, { status: 400 });

  return NextResponse.json({ data: { runId: run.id, ...result } }, { status: 201 });
}
