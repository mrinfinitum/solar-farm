import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiActor } from "@/lib/auth/api";

const RUN_ROLES = ["owner", "admin", "developer", "analyst"] as const;

export async function POST(request: Request) {
  const actor = await getApiActor(RUN_ROLES);
  if (!actor) return NextResponse.json({ error: "Property analysis access required." }, { status: 403 });
  const maximum = Math.max(1, Math.min(50, Number(process.env.SCREENING_BATCH_MAX || 10)));
  const parsed = z.object({ propertyIds: z.array(z.uuid()).min(1).max(maximum), forceRefresh: z.boolean().optional() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: `Select between 1 and ${maximum} properties.` }, { status: 422 });
  const batchKey = crypto.randomUUID();
  const created: unknown[] = []; const errors: Array<{ propertyId: string; error: string }> = [];
  for (const propertyId of [...new Set(parsed.data.propertyIds)]) {
    const { data, error } = await actor.supabase.rpc("create_property_enrichment_run", { target_property_id: propertyId, force_refresh: Boolean(parsed.data.forceRefresh), requested_batch_key: batchKey });
    if (error) errors.push({ propertyId, error: error.code === "23505" ? "An active run already exists." : error.message }); else created.push(data);
  }
  return NextResponse.json({ batchKey, maximum, created, errors }, { status: created.length ? 201 : 409 });
}
