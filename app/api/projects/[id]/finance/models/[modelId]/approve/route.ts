import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/auth/api";

const approvalSchema = z.object({ decisionNote: z.string().trim().min(10).max(3000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string; modelId: string }> }) {
  const actor = await getApiActor(["owner", "admin"]);
  if (!actor) return NextResponse.json({ error: "Owner or administrator approval required" }, { status: 403 });
  const { id, modelId } = await params;
  const projectId = z.uuid().safeParse(id); const versionId = z.uuid().safeParse(modelId); const body = approvalSchema.safeParse(await request.json());
  if (!projectId.success || !versionId.success || !body.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const version = await actor.supabase.from("financial_model_versions").select("id,is_stale").eq("id", versionId.data).eq("project_id", projectId.data).maybeSingle();
  if (!version.data) return NextResponse.json({ error: "Model version not found" }, { status: 404 });
  if (version.data.is_stale) return NextResponse.json({ error: "Stale model versions cannot be approved" }, { status: 409 });
  const { data, error } = await actor.supabase.rpc("approve_financial_model", { p_version_id: versionId.data, p_decision_note: body.data.decisionNote });
  return error ? NextResponse.json({ error: error.message }, { status: 409 }) : NextResponse.json({ data });
}
