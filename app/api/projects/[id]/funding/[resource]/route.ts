import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/auth/api";
import {
  communicationSchema, costItemSchema, fundingContactSchema, fundingSourceSchema,
  questionSchema, reimbursementSchema, requirementDocumentSchema,
} from "@/lib/funding/schemas";

const resources = {
  sources: { table: "project_funding_sources", schema: fundingSourceSchema },
  communications: { table: "funding_communications", schema: communicationSchema },
  questions: { table: "funding_questions", schema: questionSchema },
  reimbursements: { table: "funding_reimbursements", schema: reimbursementSchema },
  costs: { table: "funding_cost_items", schema: costItemSchema },
  contacts: { table: "funding_contacts", schema: fundingContactSchema },
  "requirement-documents": { table: "funding_requirement_documents", schema: requirementDocumentSchema },
} as const;

async function projectExists(actor: NonNullable<Awaited<ReturnType<typeof getApiActor>>>, projectId: string) {
  const { data } = await actor.supabase.from("projects").select("id").eq("id", projectId).is("archived_at", null).maybeSingle();
  return Boolean(data);
}

export async function GET(_request: Request, context: { params: Promise<{ id: string; resource: string }> }) {
  const actor = await getApiActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, resource } = await context.params;
  const projectId = z.string().uuid().safeParse(id);
  const config = resources[resource as keyof typeof resources];
  if (!projectId.success || !config) return NextResponse.json({ error: "Invalid funding request" }, { status: 422 });
  if (!await projectExists(actor, projectId.data)) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (resource === "sources") {
    const result = await actor.supabase.from(config.table).select("*").eq("project_id", projectId.data).is("archived_at", null);
    return result.error ? NextResponse.json({ error: result.error.message }, { status: 409 }) : NextResponse.json({ data: result.data });
  }
  const { data: sources } = await actor.supabase.from("project_funding_sources").select("id").eq("project_id", projectId.data).is("archived_at", null);
  const ids = (sources ?? []).map((source) => source.id);
  if (!ids.length) return NextResponse.json({ data: [] });
  const result = resource === "requirement-documents"
    ? await actor.supabase.from(config.table).select("*,funding_requirements!inner(funding_source_id)").in("funding_requirements.funding_source_id", ids)
    : await actor.supabase.from(config.table).select("*").in("funding_source_id", ids);
  return result.error ? NextResponse.json({ error: result.error.message }, { status: 409 }) : NextResponse.json({ data: result.data });
}

export async function POST(request: Request, context: { params: Promise<{ id: string; resource: string }> }) {
  const actor = await getApiActor(["owner", "admin", "developer", "analyst"]);
  if (!actor) return NextResponse.json({ error: "Funding workflow permission required" }, { status: 403 });
  const { id, resource } = await context.params;
  const projectId = z.string().uuid().safeParse(id);
  const config = resources[resource as keyof typeof resources];
  if (!projectId.success || !config) return NextResponse.json({ error: "Invalid funding request" }, { status: 422 });
  if (!await projectExists(actor, projectId.data)) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const raw = await request.json().catch(() => null);
  const parsed = config.schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });

  const organization_id = actor.profile.organizationId;
  let payload: Record<string, unknown> = { ...parsed.data, organization_id };
  if (resource === "sources") {
    const sourceInput = parsed.data as z.infer<typeof fundingSourceSchema>;
    payload = { ...payload, project_id: projectId.data, created_by: actor.user.id };
    if (sourceInput.program_name.trim().toLowerCase() === "usda reap") {
      const { data: template } = await actor.supabase.from("funding_program_templates").select("id").eq("organization_id", organization_id).eq("program_key", "usda-reap").eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (template) payload.program_template_id = template.id;
    }
  }
  else if (resource === "requirement-documents") {
    const link = parsed.data as { requirement_id: string; document_id: string };
    const [{ data: requirement }, { data: document }] = await Promise.all([
      actor.supabase.from("funding_requirements").select("id,funding_source_id,project_funding_sources!inner(project_id)").eq("id", link.requirement_id).eq("project_funding_sources.project_id", projectId.data).maybeSingle(),
      actor.supabase.from("documents").select("id").eq("id", link.document_id).eq("project_id", projectId.data).maybeSingle(),
    ]);
    if (!requirement || !document) return NextResponse.json({ error: "Requirement and document must belong to this project" }, { status: 422 });
    payload = { ...payload, linked_by: actor.user.id };
  }
  else {
    const sourceId = z.string().uuid().safeParse((raw as Record<string, unknown>)?.funding_source_id);
    if (!sourceId.success) return NextResponse.json({ error: "A valid funding source is required" }, { status: 422 });
    const { data: source } = await actor.supabase.from("project_funding_sources").select("id").eq("id", sourceId.data).eq("project_id", projectId.data).maybeSingle();
    if (!source) return NextResponse.json({ error: "Funding source not found" }, { status: 404 });
    payload = { ...payload, funding_source_id: sourceId.data };
    if (resource === "communications") payload.created_by = actor.user.id;
    if (resource === "costs") payload.project_id = projectId.data;
  }
  const result = await actor.supabase.from(config.table).insert(payload).select("*").single();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 409 });
  const initializationWarnings: string[] = [];
  if (resource === "sources" && result.data.program_template_id) {
    const [requirementTemplate, milestoneTemplate] = await Promise.all([
      actor.supabase.from("funding_template_requirements").select("*").eq("template_id", result.data.program_template_id).order("sort_order"),
      actor.supabase.from("funding_template_milestones").select("*").eq("template_id", result.data.program_template_id).order("sort_order"),
    ]);
    if (requirementTemplate.error) initializationWarnings.push(`Requirement template could not be read: ${requirementTemplate.error.message}`);
    else if (requirementTemplate.data?.length) {
      const copy = await actor.supabase.from("funding_requirements").insert(requirementTemplate.data.map(row=>({organization_id,funding_source_id:result.data.id,category:row.category,requirement_key:row.requirement_key,title:row.title,description:row.description,required:row.default_required,blocking:row.default_blocking,confirmation_state:row.confirmation_state,source_url:row.source_url,source_title:row.source_title,source_verified_date:row.date_verified,notes:row.notes,sort_order:row.sort_order})));
      if (copy.error) initializationWarnings.push(`Requirements were not initialized: ${copy.error.message}`);
    }
    if (milestoneTemplate.error) initializationWarnings.push(`Milestone template could not be read: ${milestoneTemplate.error.message}`);
    else if (milestoneTemplate.data?.length) {
      const copy = await actor.supabase.from("funding_milestones").insert(milestoneTemplate.data.map(row=>({organization_id,funding_source_id:result.data.id,phase:row.phase,title:row.title,description:row.description,status:"future",sort_order:row.sort_order})));
      if (copy.error) initializationWarnings.push(`Milestones were not initialized: ${copy.error.message}`);
    }
  }
  return NextResponse.json({ data: result.data, initializationWarnings }, { status: 201 });
}
