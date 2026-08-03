import { NextResponse } from "next/server";

import { getApiActor } from "@/lib/auth/api";
import { PROPERTY_OPERATOR_ROLES } from "@/lib/auth/roles";
import { calculatePropertyScore } from "@/lib/scoring/calculate";
import { propertyInputSchema } from "@/lib/validation/site-finder";

export async function GET(request: Request) {
  const actor = await getApiActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  let query = actor.supabase.from("properties")
    .select("*,property_scores(*),property_score_runs(*)", { count: "exact" })
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(Math.min(Number(url.searchParams.get("limit")) || 50, 100));
  const search = url.searchParams.get("q");
  if (search) query = query.or(`project_name.ilike.%${search}%,address_line_1.ilike.%${search}%,county.ilike.%${search}%,property_code.ilike.%${search}%`);
  const { data, error, count } = await query;
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data, count });
}

export async function POST(request: Request) {
  const actor = await getApiActor(PROPERTY_OPERATOR_ROLES);
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = propertyInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  const { utility, environmental, regulatory, market, ...property } = parsed.data;
  const acreage = property.total_acres ?? property.acreage_total;
  const askingPrice = property.asking_price;
  const pricePerAcre = askingPrice && acreage ? Math.round((askingPrice / acreage) * 100) / 100 : null;
  const canonical = {
    ...property,
    name: property.project_name || property.address_line_1,
    total_acres: acreage,
    acreage_total: acreage,
    estimated_usable_acres: property.estimated_usable_acres ?? property.acreage_usable_estimate,
    acreage_usable_estimate: property.estimated_usable_acres ?? property.acreage_usable_estimate,
    listing_url: property.listing_url || property.source_url || null,
    source_url: property.listing_url || property.source_url || null,
    source: property.source || property.source_type || "manual",
    source_type: property.source || property.source_type || "manual",
    utility_name: utility?.electric_utility || property.utility_id || null,
    notes_summary: property.internal_summary || null,
    source_recorded_at: property.source_recorded_at || new Date().toISOString(),
    price_per_acre: pricePerAcre,
    created_by: actor.user.id,
  };
  const { data: created, error } = await actor.supabase.from("properties").insert(canonical).select().single();
  if (error || !created) return NextResponse.json({ error: error?.message || "Property could not be created" }, { status: 400 });
  await Promise.all([
    utility ? actor.supabase.from("property_utility").insert({ ...utility, property_id: created.id }) : null,
    environmental ? actor.supabase.from("property_environmental").insert({ ...environmental, property_id: created.id }) : null,
    regulatory ? actor.supabase.from("property_regulatory").insert({ ...regulatory, property_id: created.id }) : null,
    market ? actor.supabase.from("property_market").insert({ ...market, property_id: created.id }) : null,
    actor.supabase.from("property_data_sources").insert({ property_id: created.id, provider_key: "manual", source_type: canonical.source, source_url: canonical.listing_url, source_quality: "unknown", created_by: actor.user.id }),
  ].filter(Boolean));
  const score = calculatePropertyScore({ ...created, property_utility: utility || null, property_environmental: environmental || null, property_regulatory: regulatory || null, property_market: market || null });
  return NextResponse.json({ data: created, score }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await getApiActor(PROPERTY_OPERATOR_ROLES);
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { action?: string; ids?: string[] };
  if (body.action !== "archive" || !Array.isArray(body.ids) || body.ids.length === 0 || body.ids.length > 100) {
    return NextResponse.json({ error: "Invalid bulk action" }, { status: 422 });
  }
  const { error } = await actor.supabase.from("properties").update({ current_status: "archived", status: "archived", archived_at: new Date().toISOString() }).in("id", body.ids);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ archived: body.ids.length });
}
