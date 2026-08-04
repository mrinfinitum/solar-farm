import { NextResponse } from "next/server";

import { getApiActor } from "@/lib/auth/api";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { getScreeningProvider, publicProviderCatalog } from "@/lib/enrichment/registry";

export async function GET() {
  const actor = await getApiActor(ADMIN_ROLES);
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [{ data, error }, { data: usage }] = await Promise.all([
    actor.supabase.from("data_providers").select("provider_key,provider_name,provider_version,capability,status,enabled,health_status,last_checked_at,last_success_at,last_failure_at,last_error_summary,cache_duration_seconds,daily_quota,monthly_quota,quota_used_daily,quota_used_monthly,configuration").eq("organization_id", actor.profile.organizationId).order("capability"),
    actor.supabase.from("provider_usage_logs").select("provider_key,request_count,status,occurred_at").eq("organization_id", actor.profile.organizationId).order("occurred_at", { ascending: false }).limit(250),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const catalog = new Map(publicProviderCatalog().map((provider) => [provider.key, provider]));
  return NextResponse.json({ data: (data || []).map((row) => ({ ...row, configuration: row.configuration || {}, adapter: catalog.get(row.provider_key) || null })), usage: usage || [] });
}

export async function POST(request: Request) {
  const actor = await getApiActor(ADMIN_ROLES);
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { action?: string; providerKey?: string; enabled?: boolean; cacheDurationSeconds?: number };
  const provider = body.providerKey ? getScreeningProvider(body.providerKey) : null;
  if (!provider) return NextResponse.json({ error: "Unknown provider." }, { status: 400 });
  if (body.action === "test") {
    const health = provider.healthCheck ? await provider.healthCheck() : { status: provider.configured() ? "configured" as const : "unavailable" as const, message: provider.configured() ? "Adapter is configured; no remote health probe is implemented." : provider.setupInstructions };
    const now = new Date().toISOString();
    await actor.supabase.from("data_providers").update({ health_status: health.status, last_checked_at: now, last_success_at: health.status === "operational" ? now : undefined, last_failure_at: ["degraded", "unavailable", "rate_limited"].includes(health.status) ? now : undefined, last_error_summary: health.status === "operational" ? null : health.message }).eq("organization_id", actor.profile.organizationId).eq("provider_key", provider.key);
    return NextResponse.json({ data: health });
  }
  if (body.action === "configure") {
    const cache = Number(body.cacheDurationSeconds);
    if (!Number.isInteger(cache) || cache < 60 || cache > 31536000) return NextResponse.json({ error: "Cache duration must be between 60 seconds and one year." }, { status: 400 });
    const { error } = await actor.supabase.from("data_providers").update({ enabled: Boolean(body.enabled), status: body.enabled ? (provider.configured() ? "active" : "not_configured") : "disabled", health_status: body.enabled ? (provider.configured() ? "configured" : "unavailable") : "disabled", cache_duration_seconds: cache }).eq("organization_id", actor.profile.organizationId).eq("provider_key", provider.key);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data: { updated: true } });
  }
  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}

