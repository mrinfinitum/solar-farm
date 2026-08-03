import { NextResponse } from "next/server";

import { getApiActor } from "@/lib/auth/api";
import { EDITOR_ROLES } from "@/lib/auth/roles";
import { propertyInputSchema } from "@/lib/validation/site-finder";

const PROMOTER_ROLES = ["owner", "admin", "developer"] as const;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data, error } = await actor.supabase.from("properties").select("*,property_scores(*),property_score_runs(*),property_utility(*),property_environmental(*),property_regulatory(*),property_market(*),property_notes(*),property_contacts(*,contacts(*)),documents(*),tasks(*),comments(*),property_risk_flags(*),property_data_sources(*),property_status_history(*),project_properties(*)").eq("id", id).single();
  return error ? NextResponse.json({ error: error.message }, { status: 404 }) : NextResponse.json({ data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(EDITOR_ROLES);
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  if (body.action === "archive") {
    const { data, error } = await actor.supabase.from("properties").update({ current_status: "archived", status: "archived", archived_at: new Date().toISOString() }).eq("id", id).select().single();
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data });
  }
  if (body.action === "promote-to-project") {
    if (!PROMOTER_ROLES.includes(actor.role as (typeof PROMOTER_ROLES)[number])) return NextResponse.json({ error: "Your role cannot promote properties." }, { status: 403 });
    const { data: existingLink } = await actor.supabase.from("project_properties").select("project_id").eq("property_id", id).eq("relationship_type", "originating_property").maybeSingle();
    if (existingLink) return NextResponse.json({ data: { id: existingLink.project_id }, idempotent: true });
    const { data: property } = await actor.supabase.from("properties").select("*").eq("id", id).single();
    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    const projectCode = `NS-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
    const { data: project, error: projectError } = await actor.supabase.from("projects").upsert({ property_id: id, project_code: projectCode, project_name: property.project_name || property.address_line_1, project_stage: "development", legal_entity: "NSoul LLC", created_by: actor.user.id, summary: "Promoted from preliminary property screening. Capacity, generation, schedule, interconnection, financing, and commercial terms remain unverified until separately documented." }, { onConflict: "property_id" }).select().single();
    if (projectError || !project) return NextResponse.json({ error: projectError?.message || "Project could not be created" }, { status: 400 });
    const { error: linkError } = await actor.supabase.from("project_properties").insert({ project_id: project.id, property_id: id, relationship_type: "originating_property", created_by: actor.user.id });
    if (linkError && linkError.code !== "23505") return NextResponse.json({ error: linkError.message }, { status: 400 });
    await actor.supabase.from("properties").update({ current_status: "candidate_project", status: "converted-to-project", pipeline_stage: "project-development" }).eq("id", id);
    return NextResponse.json({ data: project, idempotent: false });
  }
  const parsed = propertyInputSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  const updates = { ...parsed.data } as Record<string, unknown>;
  delete updates.utility; delete updates.environmental; delete updates.regulatory; delete updates.market;
  const editedAcres = typeof updates.total_acres === "number" ? updates.total_acres : typeof updates.acreage_total === "number" ? updates.acreage_total : null;
  const editedPrice = typeof updates.asking_price === "number" ? updates.asking_price : null;
  if (editedAcres && editedPrice) updates.price_per_acre = Math.round((editedPrice / editedAcres) * 100) / 100;
  const { data, error } = await actor.supabase.from("properties").update(updates).eq("id", id).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(["owner", "admin"]);
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { error } = await actor.supabase.from("properties").delete().eq("id", id);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : new NextResponse(null, { status: 204 });
}
