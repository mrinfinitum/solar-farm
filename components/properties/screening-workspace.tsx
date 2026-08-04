"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, RefreshCw, ShieldAlert, X } from "lucide-react";

type Step = { id: string; provider_key: string; capability: string; status: string; warning?: string | null; error_message?: string | null; reused_cached_result?: boolean };
type Result = {
  id: string;
  step_id: string;
  provider_key: string;
  provider_name: string;
  normalized_result: Record<string, unknown> | null;
  confidence: string;
  source_url?: string | null;
  source_dataset_date?: string | null;
  retrieved_at: string;
  preliminary: boolean;
};
type Proposal = { id: string; field_name: string; current_value: unknown; proposed_value: unknown; confidence: string; conflict_status: string; decision: string; proposal_reason: string };
type Run = { id: string; property_id: string; status: string; summary?: string | null; started_at: string; successful_provider_count: number; warning_count: number; failed_provider_count: number; proposed_change_count: number; property_enrichment_steps?: Step[]; property_enrichment_results?: Result[]; property_field_proposals?: Proposal[] };

function value(value: unknown) { return value == null ? "Not recorded" : typeof value === "string" ? value : JSON.stringify(value); }

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function resultFacts(result?: Result) {
  if (!result?.normalized_result) return [];
  return Object.entries(result.normalized_result)
    .filter(([, item]) => item !== null && item !== "" && !Array.isArray(item) && typeof item !== "object")
    .slice(0, 4);
}

function stepMessage(step: Step) {
  if (step.status === "running") return "Requesting source data…";
  if (step.status === "pending") return "Queued. This source has not run yet.";
  if (step.status === "unavailable") return step.warning || "This integration is not configured. Manual entry remains available.";
  if (step.status === "failed") return step.error_message || "The source request failed. Other providers will continue independently.";
  if (step.warning) return step.warning;
  if (step.reused_cached_result) return "A current cached result was reused.";
  if (step.status === "complete") return "Source returned a preliminary result.";
  return step.error_message || "No automated source data was returned.";
}

export function ScreeningWorkspace({ propertyId, initialRun, canDecide }: { propertyId: string; initialRun: Run; canDecide: boolean }) {
  const router = useRouter(); const started = useRef(false);
  const [run, setRun] = useState(initialRun); const [processing, setProcessing] = useState(false); const [error, setError] = useState("");
  const refresh = useCallback(async () => { const response = await fetch(`/api/properties/${propertyId}/screening`, { cache: "no-store" }); const body = await response.json(); const latest = (body.data as Run[]).find((item) => item.id === run.id); if (latest) setRun(latest); return latest; }, [propertyId, run.id]);
  const process = useCallback(async () => {
    setProcessing(true); setError(""); let complete = false; let attempts = 0;
    try {
      while (!complete && attempts <= 24) {
        attempts += 1;
        const response = await fetch(`/api/properties/${propertyId}/screening`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "process-next", runId: run.id }) });
        const body = await response.json().catch(() => ({ error: "The screening service returned an unreadable response." }));
        if (!response.ok) throw new Error(body.error || "A screening step failed.");
        complete = Boolean(body.done); await refresh();
      }
      if (!complete) throw new Error("Screening paused before all providers finished. Resume the run to continue.");
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : "The screening run could not continue.");
    } finally {
      setProcessing(false); router.refresh();
    }
  }, [propertyId, refresh, router, run.id]);
  useEffect(() => { if (!started.current && ["queued", "running"].includes(initialRun.status)) { started.current = true; void process(); } }, [initialRun.status, process]);
  async function decide(proposalId: string, decision: "accept" | "reject") { const response = await fetch(`/api/properties/${propertyId}/screening`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proposalId, decision }) }); if (!response.ok) { const body = await response.json(); setError(body.error || "Decision could not be saved."); return; } await refresh(); router.refresh(); }
  async function rerun() { const response = await fetch(`/api/properties/${propertyId}/screening`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", forceRefresh: true }) }); const body = await response.json(); if (!response.ok) { setError(body.error || "A new run could not be started."); return; } const next = Array.isArray(body.data) ? body.data[0] : body.data; router.push(`/dashboard/properties/${propertyId}/screening/${next.id}`); }
  const steps = [...(run.property_enrichment_steps || [])].sort((a,b) => a.provider_key.localeCompare(b.provider_key));
  const results = run.property_enrichment_results || [];
  const resultsByStep = new Map(results.map((result) => [result.step_id, result]));
  const proposals = run.property_field_proposals || [];
  const finishedCount = steps.filter(step => ["complete","warning","unavailable","failed","skipped"].includes(step.status)).length;
  const unavailableCount = steps.filter(step => step.status === "unavailable").length;
  return <div className="screening-workspace">
    <section className="finder-card screening-summary"><div><p className="finder-eyebrow">Run status</p><h2>{run.status.replaceAll("_", " ")}</h2><p>{run.summary || "Providers run independently. Missing integrations do not invent or infer data."}</p></div><div className="screening-actions"><Link className="finder-button" target="_blank" href={`/api/screening-reports/${run.id}`}><FileText size={15}/>Printable report</Link><button className="finder-button" onClick={rerun}><RefreshCw size={15}/>Force refresh</button></div></section>
    {error && <div className="screening-error" role="alert"><p>{error}</p><button className="finder-button" type="button" onClick={() => void process()} disabled={processing}><RefreshCw size={15}/>Resume screening</button></div>}
    <section className="finder-card"><div className="finder-card-head screening-provider-head" aria-live="polite"><div><p className="finder-eyebrow">Provider progress</p><h2>{processing ? "Screening in progress…" : "Screening sources"}</h2><p>{unavailableCount ? `${unavailableCount} optional integration${unavailableCount === 1 ? " is" : "s are"} not configured. Available sources still run independently.` : "Configured sources run independently and retain their provenance."}</p></div><span>{finishedCount}/{steps.length}</span></div><div className="provider-step-grid">{steps.map(step => {
      const result = resultsByStep.get(step.id);
      const facts = resultFacts(result);
      return <article key={step.id} className={`provider-step provider-step--${step.status}`}>
        <div className="provider-step__status"><span>{step.status === "unavailable" ? "Integration unavailable" : step.status}</span>{result?.preliminary && <small>Preliminary</small>}</div>
        <h3>{label(step.capability)}</h3>
        <p>{stepMessage(step)}</p>
        {facts.length > 0 && <dl className="provider-step__facts">{facts.map(([key, item]) => <div key={key}><dt>{label(key)}</dt><dd>{value(item)}</dd></div>)}</dl>}
        {result && <footer><span>{label(result.confidence)} confidence · {result.provider_name}</span>{result.source_url && <a href={result.source_url} target="_blank" rel="noreferrer">View source</a>}</footer>}
      </article>;
    })}</div></section>
    <section className="finder-card"><div className="finder-card-head"><div><p className="finder-eyebrow">Review queue</p><h2>Proposed field updates</h2><p>Automated sources never silently replace manual or verified facts.</p></div><span>{proposals.filter(item => item.decision === "pending").length} pending</span></div>{proposals.length ? <div className="proposal-list">{proposals.map(proposal => <article key={proposal.id}><div><span>{proposal.confidence} confidence · {proposal.conflict_status.replaceAll("_", " ")}</span><h3>{proposal.field_name.replaceAll("_", " ")}</h3><p>{proposal.proposal_reason}</p></div><dl><div><dt>Current</dt><dd>{value(proposal.current_value)}</dd></div><div><dt>Proposed</dt><dd>{value(proposal.proposed_value)}</dd></div></dl>{proposal.decision === "pending" && canDecide ? <div><button aria-label={`Accept ${proposal.field_name}`} className="finder-icon-button" onClick={() => decide(proposal.id,"accept")}><Check/></button><button aria-label={`Reject ${proposal.field_name}`} className="finder-icon-button" onClick={() => decide(proposal.id,"reject")}><X/></button></div> : <strong>{proposal.decision}</strong>}</article>)}</div> : <div className="finder-empty"><ShieldAlert/><strong>No field proposals yet</strong><p>No successful source has proposed a value, or the run is still processing.</p></div>}</section>
  </div>;
}
