import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/auth/api";
import { communicationUpdateSchema, costItemUpdateSchema, fundingContactUpdateSchema, fundingSourceUpdateSchema, questionUpdateSchema, reimbursementUpdateSchema, requirementUpdateSchema } from "@/lib/funding/schemas";

const tables = {
  requirements: "funding_requirements", sources: "project_funding_sources", communications: "funding_communications",
  questions: "funding_questions", reimbursements: "funding_reimbursements", costs: "funding_cost_items", contacts: "funding_contacts",
} as const;

export async function PATCH(request: Request, context: { params: Promise<{ id: string; resource: string; recordId: string }> }) {
  const actor = await getApiActor(["owner", "admin", "developer", "analyst"]);
  if (!actor) return NextResponse.json({ error: "Funding workflow permission required" }, { status: 403 });
  const { id, resource, recordId } = await context.params;
  if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(recordId).success || !(resource in tables)) return NextResponse.json({ error: "Invalid funding request" }, { status: 422 });
  const table = tables[resource as keyof typeof tables];
  if (resource !== "sources") {
    const { data: record } = await actor.supabase.from(table).select("funding_source_id").eq("id", recordId).eq("organization_id", actor.profile.organizationId).maybeSingle();
    if (!record?.funding_source_id) return NextResponse.json({ error: "Record not found" }, { status: 404 });
    const { data: source } = await actor.supabase.from("project_funding_sources").select("id").eq("id", record.funding_source_id).eq("project_id", id).maybeSingle();
    if (!source) return NextResponse.json({ error: "Record does not belong to this project" }, { status: 404 });
  }
  const raw = await request.json().catch(() => null);
  const updateSchemas = {
    requirements: requirementUpdateSchema, sources: fundingSourceUpdateSchema, communications: communicationUpdateSchema,
    questions: questionUpdateSchema, reimbursements: reimbursementUpdateSchema, costs: costItemUpdateSchema, contacts: fundingContactUpdateSchema,
  } as const;
  const parsed = updateSchemas[resource as keyof typeof updateSchemas].safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  let payload = parsed.data as Record<string, unknown>;
  if (resource === "requirements") {
    payload = { ...payload };
    if (payload.status === "complete") payload.completed_at = new Date().toISOString();
    if (payload.verify === true) {
      payload.verified_at = new Date().toISOString(); payload.verified_by = actor.user.id; payload.confirmation_state = "source-verified";
    }
    delete payload.verify;
  }
  if (resource === "questions" && ["submitted", "accepted", "closed"].includes(String(payload.status))) {
    payload.answered_at = new Date().toISOString(); payload.answered_by = actor.user.id;
  }
  if (resource === "sources" && payload.status === "submitted" && !payload.submitted_at) payload.submitted_at = new Date().toISOString();
  const allowed = resource === "requirements"
    ? ["status","required","blocking","due_date","linked_document_id","linked_task_id","notes","verified_at","verified_by","confirmation_state","source_url","source_title","completed_at"]
    : resource === "questions" ? ["status","response_summary","linked_response_document_id","answered_at","answered_by","due_date"]
    : resource === "sources" ? ["status","estimated_amount","requested_amount","approved_amount","funded_amount","application_deadline","notes","primary_contact_id","submitted_at","decision_date","award_date","closing_date"]
    : resource === "reimbursements" ? ["status","eligible_cost_basis","requested_amount","approved_amount","paid_amount","submitted_at","approved_at","paid_at","linked_document_id","notes"]
    : resource === "communications" ? ["subject","summary","follow_up_date","linked_document_id"]
    : resource === "costs" ? ["category","description","vendor","estimated_cost","actual_cost","eligible_amount","eligibility_status","invoice_document_id","proof_of_payment_document_id","notes"]
    : ["relationship_type","is_primary","notes"];
  payload = Object.fromEntries(Object.entries(payload).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(payload).length) return NextResponse.json({ error: "No allowed changes supplied" }, { status: 422 });

  let query = actor.supabase.from(table).update(payload).eq("id", recordId).eq("organization_id", actor.profile.organizationId);
  if (resource === "sources") query = query.eq("project_id", id);
  const result = await query.select("*").maybeSingle();
  return result.error ? NextResponse.json({ error: result.error.message }, { status: 409 }) : result.data ? NextResponse.json({ data: result.data }) : NextResponse.json({ error: "Record not found" }, { status: 404 });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; resource: string; recordId: string }> }) {
  const actor = await getApiActor(["owner", "admin"]);
  if (!actor) return NextResponse.json({ error: "Administrator permission required" }, { status: 403 });
  const { id, resource, recordId } = await context.params;
  if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(recordId).success || !(resource in tables)) return NextResponse.json({ error: "Invalid funding request" }, { status: 422 });
  const table = tables[resource as keyof typeof tables];
  if (resource !== "sources") {
    const { data: record } = await actor.supabase.from(table).select("funding_source_id").eq("id", recordId).eq("organization_id", actor.profile.organizationId).maybeSingle();
    if (!record?.funding_source_id) return NextResponse.json({ error: "Record not found" }, { status: 404 });
    const { data: source } = await actor.supabase.from("project_funding_sources").select("id").eq("id", record.funding_source_id).eq("project_id", id).maybeSingle();
    if (!source) return NextResponse.json({ error: "Record does not belong to this project" }, { status: 404 });
  }
  if (resource === "sources") {
    const result = await actor.supabase.from(table).update({ archived_at: new Date().toISOString(), status: "archived" }).eq("id", recordId).eq("project_id", id).select("id").maybeSingle();
    return result.error ? NextResponse.json({ error: result.error.message }, { status: 409 }) : NextResponse.json({ data: result.data });
  }
  const result = await actor.supabase.from(table).delete().eq("id", recordId).eq("organization_id", actor.profile.organizationId);
  return result.error ? NextResponse.json({ error: result.error.message }, { status: 409 }) : new NextResponse(null, { status: 204 });
}
