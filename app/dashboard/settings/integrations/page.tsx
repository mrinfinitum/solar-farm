import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { publicProviderCatalog } from "@/lib/enrichment/registry";
import { IntegrationsConsole } from "@/components/settings/integrations-console";

export default async function IntegrationsPage() {
  const profile = await requireRole(ADMIN_ROLES); const supabase = await createClient();
  const { data } = await supabase!.from("data_providers").select("provider_key,provider_name,capability,status,enabled,health_status,last_checked_at,last_success_at,last_failure_at,last_error_summary,cache_duration_seconds,daily_quota,monthly_quota,quota_used_daily,quota_used_monthly").eq("organization_id", profile.organizationId).order("capability");
  const catalog = new Map(publicProviderCatalog().map((provider) => [provider.key, provider]));
  const rows = (data || []).map((row) => ({ ...row, adapter: catalog.get(row.provider_key) || null }));
  return <><Link className="finder-back-link" href="/dashboard/settings"><ArrowLeft size={14}/>Settings</Link><div className="finder-page-head"><div><p className="finder-eyebrow">Provider operations</p><h1>Screening integrations</h1><p>Configuration, operational health, freshness, usage, and safe connection checks. Health does not imply source coverage or diligence clearance.</p></div><span className="evidence-badge">owner / admin</span></div><IntegrationsConsole initialRows={rows}/></>;
}
