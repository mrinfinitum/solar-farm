import { NextResponse } from "next/server";
import { getApiActor } from "@/lib/auth/api";
import { capitalPartnerSchema } from "@/lib/finance/schemas";

export async function GET() {
  const actor = await getApiActor(["owner", "admin"]);
  if (!actor) return NextResponse.json({ error: "Capital data access restricted" }, { status: 403 });
  const { data, error } = await actor.supabase.from("capital_partners").select("*,capital_partner_contacts(*)").is("archived_at", null).order("updated_at", { ascending: false });
  return error ? NextResponse.json({ error: error.message }, { status: 409 }) : NextResponse.json({ data });
}

export async function POST(request: Request) {
  const actor = await getApiActor(["owner", "admin"]);
  if (!actor) return NextResponse.json({ error: "Capital partner management restricted" }, { status: 403 });
  const body = capitalPartnerSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Validation failed", issues: body.error.flatten() }, { status: 422 });
  const { data, error } = await actor.supabase.from("capital_partners").insert({ organization_id: actor.profile.organizationId, name: body.data.name, partner_type: body.data.partnerType, website: body.data.website, strategy_notes: body.data.strategyNotes, status: body.data.status, created_by: actor.user.id }).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 409 }) : NextResponse.json({ data }, { status: 201 });
}
