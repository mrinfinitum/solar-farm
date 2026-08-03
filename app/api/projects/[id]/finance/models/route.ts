import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/auth/api";
import { createFinancialModelVersion } from "@/lib/finance/service";
import { createModelSchema } from "@/lib/finance/schemas";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid project" }, { status: 422 });
  const { data, error } = await actor.supabase.from("financial_models").select("*,financial_model_versions(*)").eq("project_id", id).is("archived_at", null).order("updated_at", { ascending: false });
  return error ? NextResponse.json({ error: error.message }, { status: 409 }) : NextResponse.json({ data });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(["owner", "admin", "developer", "analyst"]);
  if (!actor) return NextResponse.json({ error: "Financial modeling permission required" }, { status: 403 });
  const { id } = await params;
  const projectId = z.uuid().safeParse(id);
  const body = createModelSchema.safeParse(await request.json());
  if (!projectId.success || !body.success) return NextResponse.json({ error: "Validation failed", issues: body.success ? undefined : body.error.flatten() }, { status: 422 });
  try {
    const data = await createFinancialModelVersion(actor, projectId.data, body.data.name, body.data.scenarioType, body.data.inputs);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to calculate model" }, { status: 409 });
  }
}
