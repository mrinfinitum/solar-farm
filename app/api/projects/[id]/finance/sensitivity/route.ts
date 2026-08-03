import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/auth/api";
import { createSensitivityRun } from "@/lib/finance/service";
import { sensitivitySchema } from "@/lib/finance/schemas";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(["owner", "admin", "developer", "analyst"]);
  if (!actor) return NextResponse.json({ error: "Financial modeling permission required" }, { status: 403 });
  const { id } = await params; const projectId = z.uuid().safeParse(id); const body = sensitivitySchema.safeParse(await request.json());
  if (!projectId.success || !body.success) return NextResponse.json({ error: "Validation failed", issues: body.success ? undefined : body.error.flatten() }, { status: 422 });
  try {
    const data = await createSensitivityRun(actor, projectId.data, body.data.modelVersionId, body.data.rowVariable, body.data.rowDeltasPct, body.data.columnVariable, body.data.columnDeltasPct);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Sensitivity run failed" }, { status: 409 }); }
}
