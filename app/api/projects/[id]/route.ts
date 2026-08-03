import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/auth/api";

const updateSchema = z.object({
  project_name: z.string().trim().min(2).max(240).optional(), location: z.string().max(300).nullable().optional(), county: z.string().max(120).nullable().optional(),
  proposed_capacity_mw_dc: z.coerce.number().min(0).max(10000).nullable().optional(), proposed_capacity_mw_ac: z.coerce.number().min(0).max(10000).nullable().optional(),
  target_operation_date: z.string().nullable().optional(), project_lead_id: z.uuid().nullable().optional(), summary: z.string().max(5000).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(["owner", "admin", "developer"]);
  if (!actor) return NextResponse.json({ error: "Project operation permission required" }, { status: 403 });
  const { id } = await params; const projectId = z.uuid().safeParse(id); const parsed = updateSchema.safeParse(await request.json());
  if (!projectId.success || !parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const { data, error } = await actor.supabase.from("projects").update(parsed.data).eq("id", projectId.data).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 409 }) : NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(["owner", "admin"]);
  if (!actor) return NextResponse.json({ error: "Administrator permission required" }, { status: 403 });
  const { id } = await params; const projectId = z.uuid().safeParse(id);
  if (!projectId.success) return NextResponse.json({ error: "Invalid project" }, { status: 422 });
  const { error } = await actor.supabase.from("projects").update({ archived_at: new Date().toISOString() }).eq("id", projectId.data);
  return error ? NextResponse.json({ error: error.message }, { status: 409 }) : new NextResponse(null, { status: 204 });
}
