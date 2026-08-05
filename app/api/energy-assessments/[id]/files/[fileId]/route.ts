import { NextResponse } from "next/server";

import { getApiActor } from "@/lib/auth/api";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const actor = await getApiActor(ADMIN_ROLES);
  if (!actor) return NextResponse.json({ error: "Owner or administrator access required." }, { status: 403 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Private storage is not configured." }, { status: 503 });
  const { id, fileId } = await params;
  const { data } = await admin.from("energy_assessment_files").select("storage_path,original_filename").eq("id", fileId).eq("assessment_id", id).single();
  if (!data?.storage_path) return NextResponse.json({ error: "Assessment file not found." }, { status: 404 });
  const signed = await admin.storage.from("energy-assessment-bills").createSignedUrl(data.storage_path, 60, { download: data.original_filename });
  return signed.error ? NextResponse.json({ error: "A secure download could not be created." }, { status: 502 }) : NextResponse.redirect(signed.data.signedUrl);
}
