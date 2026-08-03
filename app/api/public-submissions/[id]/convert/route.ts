import { NextResponse } from "next/server";

import { getApiActor } from "@/lib/auth/api";
import { ADMIN_ROLES } from "@/lib/auth/roles";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(ADMIN_ROLES);
  if (!actor) return NextResponse.json({ error: "Owner or admin access required." }, { status: 403 });
  const { id } = await params;
  const { data, error } = await actor.supabase.rpc("convert_public_submission_to_property", { target_submission_id: id });
  return error ? NextResponse.json({ error: error.message }, { status: error.code === "42501" ? 403 : 400 }) : NextResponse.json({ data });
}
