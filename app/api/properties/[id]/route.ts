import { NextResponse } from "next/server";

import { getApiActor } from "@/lib/auth/api";
import { PROPERTY_OPERATOR_ROLES } from "@/lib/auth/roles";
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
  const actor = await getApiActor(PROPERTY_OPERATOR_ROLES);
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  if (body.action === "archive") {
    const { data, error } = await actor.supabase.from("properties").update({ current_status: "archived", status: "archived", archived_at: new Date().toISOString() }).eq("id", id).select().single();
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data });
  }
  if (body.action === "restore") {
    const { data, error } = await actor.supabase.from("properties").update({ current_status: "new", status: "new", archived_at: null }).eq("id", id).select().single();
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data });
  }
  if (body.action === "promote-to-project") {
    if (!PROMOTER_ROLES.includes(actor.role as (typeof PROMOTER_ROLES)[number])) return NextResponse.json({ error: "Your role cannot promote properties." }, { status: 403 });
    const { data: existingLink } = await actor.supabase.from("project_properties").select("project_id").eq("property_id", id).eq("relationship_type", "originating_property").maybeSingle();
    if (existingLink) return NextResponse.json({ data: { id: existingLink.project_id }, idempotent: true });
    const { data: project, error: projectError } = await actor.supabase.rpc("promote_property_to_project", { target_property_id: id });
    if (projectError || !project) return NextResponse.json({ error: projectError?.message || "Project could not be created" }, { status: projectError?.code === "42501" ? 403 : 400 });
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
