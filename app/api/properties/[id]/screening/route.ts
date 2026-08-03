import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiActor } from "@/lib/auth/api";
import { PROPERTY_OPERATOR_ROLES } from "@/lib/auth/roles";
import { processNextScreeningStep } from "@/lib/enrichment/service";

const RUN_ROLES = ["owner", "admin", "developer", "analyst"] as const;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  const { data, error } = await actor.supabase.from("property_enrichment_runs").select("*,property_enrichment_steps(*),property_field_proposals(*),property_enrichment_results(*),property_screening_reports(*)").eq("property_id", id).order("started_at", { ascending: false });
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(RUN_ROLES);
  if (!actor) return NextResponse.json({ error: "Property analysis access required." }, { status: 403 });
  const { id: propertyId } = await params;
  const parsed = z.object({ action: z.enum(["start", "process-next", "cancel", "retry"]), runId: z.uuid().optional(), forceRefresh: z.boolean().optional() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid screening action." }, { status: 422 });
  const { data: property } = await actor.supabase.from("properties").select("id").eq("id", propertyId).maybeSingle();
  if (!property) return NextResponse.json({ error: "Property not found." }, { status: 404 });
  if (parsed.data.action === "start") {
    const { data, error } = await actor.supabase.rpc("create_property_enrichment_run", { target_property_id: propertyId, force_refresh: Boolean(parsed.data.forceRefresh), requested_batch_key: null });
    return error ? NextResponse.json({ error: error.message, code: error.code }, { status: error.code === "23505" ? 409 : error.code === "42501" ? 403 : 400 }) : NextResponse.json({ data }, { status: 201 });
  }
  if (!parsed.data.runId) return NextResponse.json({ error: "A run ID is required." }, { status: 422 });
  if (parsed.data.action === "process-next") {
    try { return NextResponse.json(await processNextScreeningStep(actor.supabase, actor.profile.organizationId, actor.user.id, parsed.data.runId)); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Screening step failed." }, { status: 400 }); }
  }
  if (parsed.data.action === "cancel") {
    const { data, error } = await actor.supabase.from("property_enrichment_runs").update({ status: "cancelled", completed_at: new Date().toISOString(), error_summary: "Cancelled by an authorized user." }).eq("id", parsed.data.runId).eq("property_id", propertyId).in("status", ["queued", "running"]).select().maybeSingle();
    if (data) await Promise.all([
      actor.supabase.from("property_enrichment_steps").update({ status: "skipped", completed_at: new Date().toISOString(), warning: "Run cancelled before this step was processed." }).eq("run_id", parsed.data.runId).in("status", ["pending", "running"]),
      actor.supabase.from("properties").update({ screening_status: "cancelled" }).eq("id", propertyId),
    ]);
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data });
  }
  const { error } = await actor.supabase.from("property_enrichment_steps").update({ status: "pending", error_message: null, warning: null }).eq("run_id", parsed.data.runId).eq("property_id", propertyId).in("status", ["failed", "warning"]);
  if (!error) await actor.supabase.from("property_enrichment_runs").update({ status: "queued", completed_at: null, error_summary: null }).eq("id", parsed.data.runId).eq("property_id", propertyId);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(PROPERTY_OPERATOR_ROLES);
  if (!actor) return NextResponse.json({ error: "Property operator access required." }, { status: 403 });
  const { id: propertyId } = await params;
  const parsed = z.object({ proposalId: z.uuid(), decision: z.enum(["accept", "reject"]), reason: z.string().trim().max(1000).optional() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid proposal decision." }, { status: 422 });
  const { data: proposal } = await actor.supabase.from("property_field_proposals").select("id").eq("id", parsed.data.proposalId).eq("property_id", propertyId).maybeSingle();
  if (!proposal) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  const { data, error } = await actor.supabase.rpc("decide_property_field_proposal", { target_proposal_id: parsed.data.proposalId, accept_proposal: parsed.data.decision === "accept", rejection_note: parsed.data.reason || null });
  return error ? NextResponse.json({ error: error.message }, { status: error.code === "42501" ? 403 : 400 }) : NextResponse.json({ data });
}
