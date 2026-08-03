import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiActor } from "@/lib/auth/api";
import { PROPERTY_OPERATOR_ROLES } from "@/lib/auth/roles";

const checklistPatch = z.object({
  resource: z.literal("checklist"), id: z.uuid(),
  status: z.enum(["not_started", "in_progress", "complete", "not_applicable", "blocked"]),
  assigned_to: z.uuid().nullable().optional(), due_date: z.string().nullable().optional(),
  notes: z.string().trim().max(3000).nullable().optional(), source: z.string().trim().max(500).nullable().optional(),
  supporting_document_id: z.uuid().nullable().optional(),
});
const taskPatch = z.object({ resource: z.literal("task"), id: z.uuid(), status: z.enum(["open", "in-progress", "waiting", "completed", "canceled"]) });
const riskPatch = z.object({ resource: z.literal("risk"), id: z.uuid(), resolution_status: z.enum(["unresolved", "mitigating", "resolved", "accepted"]) });

async function propertyExists(actor: NonNullable<Awaited<ReturnType<typeof getApiActor>>>, id: string) {
  const { data } = await actor.supabase.from("properties").select("id").eq("id", id).maybeSingle();
  return Boolean(data);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(PROPERTY_OPERATOR_ROLES);
  if (!actor) return NextResponse.json({ error: "Property operator access required." }, { status: 403 });
  const { id: propertyId } = await params;
  if (!(await propertyExists(actor, propertyId))) return NextResponse.json({ error: "Property not found." }, { status: 404 });
  const body = await request.json();

  if (body.resource === "note") {
    const parsed = z.object({ resource: z.literal("note"), note: z.string().trim().min(2).max(5000), note_type: z.enum(["general","seller-call","broker-call","utility","zoning","engineering","environmental","financing","off-taker","legal"]).default("general") }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Valid note text is required." }, { status: 422 });
    const { data, error } = await actor.supabase.from("property_notes").insert({ property_id: propertyId, note: parsed.data.note, note_type: parsed.data.note_type, created_by: actor.user.id }).select().single();
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data }, { status: 201 });
  }
  if (body.resource === "task") {
    const parsed = z.object({ resource: z.literal("task"), title: z.string().trim().min(2).max(240), description: z.string().trim().max(3000).nullable().optional(), priority: z.enum(["low","normal","high","critical"]).default("normal"), assigned_to: z.uuid().nullable().optional(), due_date: z.string().nullable().optional(), blocker: z.boolean().default(false), checklist_item_id: z.uuid().nullable().optional() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Task validation failed.", issues: parsed.error.flatten() }, { status: 422 });
    const { resource, ...values } = parsed.data; void resource;
    const { data, error } = await actor.supabase.from("tasks").insert({ ...values, property_id: propertyId, status: "open", created_by: actor.user.id }).select().single();
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data }, { status: 201 });
  }
  if (body.resource === "contact") {
    const parsed = z.object({ resource: z.literal("contact"), relationship_type: z.enum(["owner","broker","attorney","surveyor","engineer","EPC","utility_contact","county_contact","environmental_consultant","lender","investor","offtaker","other"]), first_name: z.string().trim().max(100).nullable().optional(), last_name: z.string().trim().max(100).nullable().optional(), company: z.string().trim().max(160).nullable().optional(), title: z.string().trim().max(160).nullable().optional(), email: z.email().nullable().optional().or(z.literal("")), phone: z.string().trim().max(50).nullable().optional(), notes: z.string().trim().max(3000).nullable().optional(), is_primary: z.boolean().default(false) }).refine((value) => value.first_name || value.last_name || value.company, { message: "Provide a name or company." }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Contact validation failed.", issues: parsed.error.flatten() }, { status: 422 });
    const { relationship_type, is_primary, resource, ...contactValues } = parsed.data; void resource;
    const contactType = relationship_type === "utility_contact" ? "utility" : relationship_type === "county_contact" ? "county" : relationship_type === "offtaker" ? "off-taker" : relationship_type;
    const { data: contact, error: contactError } = await actor.supabase.from("contacts").insert({ ...contactValues, contact_type: contactType, created_by: actor.user.id }).select("id").single();
    if (contactError || !contact) return NextResponse.json({ error: contactError?.message || "Contact could not be created." }, { status: 400 });
    const { data, error } = await actor.supabase.from("property_contacts").insert({ property_id: propertyId, contact_id: contact.id, relationship_type, is_primary, created_by: actor.user.id }).select("*,contacts(*)").single();
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data }, { status: 201 });
  }
  return NextResponse.json({ error: "Unsupported CRM resource." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(PROPERTY_OPERATOR_ROLES);
  if (!actor) return NextResponse.json({ error: "Property operator access required." }, { status: 403 });
  const { id: propertyId } = await params;
  if (!(await propertyExists(actor, propertyId))) return NextResponse.json({ error: "Property not found." }, { status: 404 });
  const body = await request.json();
  const parsed = z.union([checklistPatch, taskPatch, riskPatch]).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Update validation failed.", issues: parsed.error.flatten() }, { status: 422 });
  if (parsed.data.resource === "checklist") {
    const { resource, id, status, ...values } = parsed.data; void resource;
    const { data, error } = await actor.supabase.from("property_checklist_items").update({ ...values, status, completed_at: status === "complete" ? new Date().toISOString() : null }).eq("id", id).eq("property_id", propertyId).select().single();
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data });
  }
  if (parsed.data.resource === "task") {
    const { id, status } = parsed.data;
    const { data, error } = await actor.supabase.from("tasks").update({ status, completed_at: status === "completed" ? new Date().toISOString() : null }).eq("id", id).eq("property_id", propertyId).select().single();
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data });
  }
  const { id, resolution_status } = parsed.data;
  const resolved = resolution_status === "resolved";
  const { data, error } = await actor.supabase.from("property_risk_flags").update({ resolution_status, status: resolved ? "resolved" : "monitoring", active: !resolved, resolved_at: resolved ? new Date().toISOString() : null, resolved_by: resolved ? actor.user.id : null }).eq("id", id).eq("property_id", propertyId).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data });
}
