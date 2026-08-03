import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/auth/api";
import { PROJECT_STAGES } from "@/lib/projects/domain";

const schema = z.object({
  nextStage: z.enum(PROJECT_STAGES),
  reason: z.string().trim().max(2000).nullable().optional(),
  overrideReason: z.string().trim().max(3000).nullable().optional(),
  decisionId: z.uuid().nullable().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(["owner", "admin", "developer"]);
  if (!actor) return NextResponse.json({ error: "Project operation permission required" }, { status: 403 });
  const { id } = await params;
  const projectId = z.uuid().safeParse(id);
  const parsed = schema.safeParse(await request.json());
  if (!projectId.success || !parsed.success) return NextResponse.json({ error: "Invalid stage transition", issues: parsed.success ? undefined : parsed.error.flatten() }, { status: 422 });
  if (parsed.data.overrideReason && !["owner", "admin"].includes(actor.role)) return NextResponse.json({ error: "Only an owner or administrator may override a failed gate" }, { status: 403 });
  const { data, error } = await actor.supabase.rpc("advance_project_stage", {
    target_project_id: projectId.data,
    requested_stage: parsed.data.nextStage,
    transition_reason: parsed.data.reason || null,
    override_reason: parsed.data.overrideReason || null,
    supporting_decision: parsed.data.decisionId || null,
  });
  return error ? NextResponse.json({ error: error.message }, { status: 409 }) : NextResponse.json({ data });
}
