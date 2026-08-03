import { NextResponse } from "next/server";
import { getApiActor } from "@/lib/auth/api";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { propertyInputSchema } from "@/lib/validation/site-finder";

interface ImportBody { sourceName?: string; fileName?: string; dryRun?: boolean; records?: Record<string, string>[]; }

export async function POST(request: Request) {
  const actor = await getApiActor(ADMIN_ROLES);
  if (!actor) return NextResponse.json({ error: "Owner or administrator access is required." }, { status: 403 });
  const { supabase, user, profile } = actor;
  const body = await request.json() as ImportBody;
  if (!Array.isArray(body.records) || body.records.length < 1 || body.records.length > 500) {
    return NextResponse.json({ error: "Imports must contain between 1 and 500 rows." }, { status: 422 });
  }

  let created = 0; let updated = 0; let rejected = 0;
  const errors: Record<string, string>[] = [];
  for (let index = 0; index < body.records.length; index++) {
    const row = body.records[index];
    const parsed = propertyInputSchema.safeParse({
      property_code: row.property_code || `IMP-${Date.now()}-${index + 1}`,
      project_name: row.project_name || row.address || null,
      status: "new", pipeline_stage: "discovery", source_type: "csv",
      source_name: row.source_name || body.sourceName || "CSV import",
      source_url: row.source_url || null, source_listing_id: row.source_listing_id || null,
      source_collected_at: row.source_collected_at || new Date().toISOString().slice(0, 10),
      address_line_1: row.address, city: row.city, county: row.county,
      state: row.state || "Oklahoma", postal_code: row.postal_code || "",
      latitude: row.latitude || null, longitude: row.longitude || null,
      acreage_total: row.acreage_total || null, acreage_usable_estimate: null,
      asking_price: row.asking_price || null, property_type: row.property_type || null,
      current_land_use: row.current_land_use || null, tillable_status: row.tillable_status || null,
      cleared_percentage: row.cleared_percentage || null, wooded_percentage: row.wooded_percentage || null,
      slope_average_percent: null, legal_access_status: null,
      seller_financing_available: row.seller_financing_available || null,
      lease_option_possible: null, purchase_possible: null, owner_name: row.owner_name || null,
      broker_name: row.broker_name || null, internal_summary: row.notes || null,
      next_action: "Complete initial desktop screening", next_action_due_date: null,
    });
    if (!parsed.success) {
      rejected++;
      errors.push({ row: String(index + 2), property_code: row.property_code || "", error: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ") });
      continue;
    }

    let existing: null | { id: string } = null;
    if (parsed.data.source_listing_id) {
      const { data } = await supabase.from("properties").select("id").eq("source_name", parsed.data.source_name).eq("source_listing_id", parsed.data.source_listing_id).maybeSingle();
      existing = data;
    }
    if (existing) updated++; else created++;
    if (!body.dryRun) {
      const pricePerAcre = parsed.data.asking_price && parsed.data.acreage_total ? parsed.data.asking_price / parsed.data.acreage_total : null;
      const values = { ...parsed.data, organization_id: profile.organizationId, price_per_acre: pricePerAcre };
      const { error } = existing
        ? await supabase.from("properties").update(values).eq("id", existing.id)
        : await supabase.from("properties").insert({ ...values, created_by: user.id });
      if (error) {
        rejected++; if (existing) updated--; else created--;
        errors.push({ row: String(index + 2), property_code: parsed.data.property_code, error: error.message });
      }
    }
  }

  if (!body.dryRun) {
    const { error } = await supabase.from("imports").insert({
      organization_id: profile.organizationId, import_type: "property-csv",
      source_name: body.sourceName || "CSV import", source_file_name: body.fileName || "upload.csv",
      imported_by: user.id, records_total: body.records.length, records_created: created,
      records_updated: updated, records_rejected: rejected,
      status: rejected ? "completed-with-errors" : "completed", error_log: errors,
      completed_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ dryRun: Boolean(body.dryRun), created, updated, rejected, errors });
}
