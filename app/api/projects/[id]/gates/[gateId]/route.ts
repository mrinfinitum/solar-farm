import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/auth/api";

const schema = z.object({
  satisfied: z.boolean(),
  evidenceNote: z.string().trim().max(2000).nullable().optional(),
  evidenceDocumentId: z.uuid().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; gateId: string }> },
) {
  const actor = await getApiActor(["owner", "admin", "developer"]);
  if (!actor) return NextResponse.json({ error: "Project operation permission required" }, { status: 403 });
  const { id, gateId } = await params;
  const projectId = z.uuid().safeParse(id);
  const parsedGateId = z.uuid().safeParse(gateId);
  const body = schema.safeParse(await request.json());
  if (!projectId.success || !parsedGateId.success || !body.success) {
    return NextResponse.json({ error: "Invalid stage-gate update" }, { status: 422 });
  }
  if (body.data.satisfied && !body.data.evidenceNote && !body.data.evidenceDocumentId) {
    return NextResponse.json({ error: "Evidence note or document is required" }, { status: 422 });
  }
  const { data, error } = await actor.supabase
    .from("project_stage_gates")
    .update({
      satisfied: body.data.satisfied,
      evidence_note: body.data.evidenceNote || null,
      evidence_document_id: body.data.evidenceDocumentId || null,
      satisfied_by: body.data.satisfied ? actor.user.id : null,
      satisfied_at: body.data.satisfied ? new Date().toISOString() : null,
    })
    .eq("id", parsedGateId.data)
    .eq("project_id", projectId.data)
    .select()
    .single();
  return error ? NextResponse.json({ error: error.message }, { status: 409 }) : NextResponse.json({ data });
}
