"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";

type ProviderRow = {
  provider_key: string; provider_name: string; capability: string; status: string; enabled: boolean; health_status: string;
  last_checked_at: string | null; last_success_at: string | null; last_failure_at: string | null; last_error_summary: string | null;
  cache_duration_seconds: number | null; daily_quota: number | null; monthly_quota: number | null; quota_used_daily: number; quota_used_monthly: number;
  adapter: { configured: boolean; credentialRequired: boolean; description: string; setupInstructions: string; version: string } | null;
};

export function IntegrationsConsole({ initialRows }: { initialRows: ProviderRow[] }) {
  const [rows, setRows] = useState(initialRows); const [busy, setBusy] = useState<string | null>(null); const [message, setMessage] = useState("");
  async function action(providerKey: string, payload: Record<string, unknown>) {
    setBusy(providerKey); setMessage("");
    const response = await fetch("/api/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ providerKey, ...payload }) });
    const result = await response.json(); setBusy(null);
    if (!response.ok) return setMessage(result.error || "Integration update failed.");
    if (payload.action === "test") setRows((current) => current.map((row) => row.provider_key === providerKey ? { ...row, health_status: result.data.status, last_checked_at: new Date().toISOString(), last_error_summary: result.data.status === "operational" ? null : result.data.message } : row));
    else setRows((current) => current.map((row) => row.provider_key === providerKey ? { ...row, enabled: Boolean(payload.enabled), status: payload.enabled ? (row.adapter?.configured ? "active" : "not_configured") : "disabled", cache_duration_seconds: Number(payload.cacheDurationSeconds) } : row));
    setMessage(payload.action === "test" ? result.data.message : "Provider settings saved.");
  }
  return <div className="integration-console">
    {message && <p className="integration-message">{message}</p>}
    {rows.map((row) => <article className="integration-provider" key={row.provider_key}>
      <header><div><span>{row.capability.replaceAll("_", " ")}</span><h2>{row.provider_name}</h2></div><strong className={`integration-health integration-health--${row.enabled ? row.health_status : "disabled"}`}>{row.enabled ? row.health_status : "disabled"}</strong></header>
      <p>{row.adapter?.description || "Provider adapter metadata is unavailable."}</p>
      <dl><div><dt>Configuration</dt><dd>{row.adapter?.configured ? "Configured" : "Not configured"}</dd></div><div><dt>Credential</dt><dd>{row.adapter?.credentialRequired ? "Server environment" : "None required"}</dd></div><div><dt>Last check</dt><dd>{row.last_checked_at ? new Date(row.last_checked_at).toLocaleString() : "Not tested"}</dd></div><div><dt>Cache</dt><dd>{Math.round((row.cache_duration_seconds || 0) / 86400)} days</dd></div><div><dt>Daily usage</dt><dd>{row.quota_used_daily || 0}{row.daily_quota ? ` / ${row.daily_quota}` : " / unmetered"}</dd></div><div><dt>Monthly usage</dt><dd>{row.quota_used_monthly || 0}{row.monthly_quota ? ` / ${row.monthly_quota}` : " / unmetered"}</dd></div></dl>
      {row.last_error_summary && <div className="integration-alert"><ShieldAlert size={15}/>{row.last_error_summary}</div>}
      <details><summary>Setup instructions</summary><p>{row.adapter?.setupInstructions}</p><small>Stored secret values are never returned by this screen.</small></details>
      <footer><label><input type="checkbox" checked={row.enabled} onChange={(event) => action(row.provider_key, { action: "configure", enabled: event.target.checked, cacheDurationSeconds: row.cache_duration_seconds || 2592000 })}/>Enabled</label><button className="finder-button" disabled={busy === row.provider_key} onClick={() => action(row.provider_key, { action: "test" })}>{busy === row.provider_key ? <RefreshCw className="is-spinning" size={14}/> : <CheckCircle2 size={14}/>}Test connection</button></footer>
    </article>)}
  </div>;
}

