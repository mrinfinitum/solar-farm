import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/auth/api";
import { PROJECT_HEALTH_VALUES } from "@/lib/projects/domain";

const schema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("recalculate") }),
  z.object({ mode: z.literal("override"), health: z.enum(PROJECT_HEALTH_VALUES), reason: z.string().trim().min(10).max(3000) }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(["owner", "admin", "developer"]);
  if (!actor) return NextResponse.json({ error: "Project operation permission required" }, { status: 403 });
  const { id } = await params;
  const projectId = z.uuid().safeParse(id);
  const parsed = schema.safeParse(await request.json());
  if (!projectId.success || !parsed.success) return NextResponse.json({ error: "Invalid health request" }, { status: 422 });
  if (parsed.data.mode === "override") {
    if (!["owner", "admin"].includes(actor.role)) return NextResponse.json({ error: "Only an owner or administrator may override health" }, { status: 403 });
    const { data, error } = await actor.supabase.rpc("override_project_health", { target_project_id: projectId.data, requested_health: parsed.data.health, reason: parsed.data.reason });
    return error ? NextResponse.json({ error: error.message }, { status: 409 }) : NextResponse.json({ data });
  }
  const { data, error } = await actor.supabase.rpc("recalculate_project_health", { target_project_id: projectId.data });
  return error ? NextResponse.json({ error: error.message }, { status: 409 }) : NextResponse.json({ data });
}
