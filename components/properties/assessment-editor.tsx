"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Calculator, Loader2 } from "lucide-react";

import { PRELIMINARY_CATEGORIES, calculatePreliminaryScore, type FatalRiskType, type PreliminaryComponentInput } from "@/lib/scoring/preliminary";

const fatalRiskOptions: { value: FatalRiskType; label: string }[] = [
  ["no_viable_interconnection", "No viable interconnection"],
  ["insufficient_site_control", "Insufficient site control"],
  ["environmental_constraint", "Environmental constraint"],
  ["incompatible_land_use", "Incompatible land use"],
  ["insufficient_usable_acreage", "Insufficient usable acreage"],
  ["no_legal_access", "No legal access"],
  ["title_defect", "Title defect"],
  ["failed_project_economics", "Failed project economics"],
  ["no_plausible_offtaker", "No plausible off-taker"],
].map(([value, label]) => ({ value: value as FatalRiskType, label }));

export function AssessmentEditor({ propertyId }: { propertyId: string }) {
  const initial = PRELIMINARY_CATEGORIES.map(([category, label]) => ({ category, rawScore: null, sourceQuality: "unknown" as const, critical: ["grid_and_interconnection", "usable_land_and_geometry", "environmental_constraints"].includes(category), explanation: `${label} has not been assessed.`, sourceName: "", sourceUrl: "", sourceDate: "", missingInformation: "" }));
  const [components, setComponents] = useState<PreliminaryComponentInput[]>(initial);
  const [fatalRisks, setFatalRisks] = useState<FatalRiskType[]>([]);
  const [overrideScore, setOverrideScore] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const preview = calculatePreliminaryScore({ components, fatalRisks, overrideScore: overrideScore === "" ? null : Number(overrideScore), overrideReason: overrideScore === "" ? null : overrideReason.padEnd(10, " ") });

  function update(index: number, patch: Partial<PreliminaryComponentInput>) {
    setComponents((current) => current.map((component, itemIndex) => itemIndex === index ? { ...component, ...patch } : component));
  }
  async function submit() {
    setLoading(true); setMessage("");
    const response = await fetch(`/api/properties/${propertyId}/score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ components, fatalRisks, notes: notes || null, overrideScore: overrideScore === "" ? null : Number(overrideScore), overrideReason: overrideReason || null }) });
    const result = await response.json(); setLoading(false);
    if (!response.ok) return setMessage(result.error || "Assessment could not be saved.");
    setMessage("Assessment saved."); router.refresh();
  }

  return <section className="finder-card assessment-editor">
    <div className="finder-card-head"><div><p className="finder-eyebrow">Versioned preliminary model</p><h2>Assessment editor</h2></div><div className="assessment-preview"><strong>{preview.displayedScore}</strong><span>Grade {preview.grade} · {preview.overallRisk} risk</span></div></div>
    <div className="assessment-grid">
      {PRELIMINARY_CATEGORIES.map(([category, label, weight], index) => <div className="assessment-row" key={category}>
        <div><strong>{label}</strong><span>Maximum {weight} points · awarded {Math.round(((components[index].rawScore ?? 0) * weight) / 100 * 100) / 100}</span></div>
        <label><span>Category score (0–100)</span><input className="finder-field" type="number" min="0" max="100" value={components[index].rawScore ?? ""} onChange={(event) => update(index, { rawScore: event.target.value === "" ? null : Number(event.target.value) })} /></label>
        <label><span>Data quality</span><select className="finder-field" value={components[index].sourceQuality} onChange={(event) => update(index, { sourceQuality: event.target.value as PreliminaryComponentInput["sourceQuality"] })}><option value="unknown">Unknown</option><option value="estimated">Estimated</option><option value="user_reported">User reported</option><option value="public_source">Public source</option><option value="verified">Verified</option></select></label>
        <label className="assessment-explanation"><span>Explanation</span><input className="finder-field" value={components[index].explanation} onChange={(event) => update(index, { explanation: event.target.value })} /></label>
        <label><span>Source</span><input className="finder-field" value={components[index].sourceName || ""} onChange={(event) => update(index, { sourceName: event.target.value })} placeholder="Document, agency, owner…" /></label>
        <label><span>Source date</span><input className="finder-field" type="date" value={components[index].sourceDate || ""} onChange={(event) => update(index, { sourceDate: event.target.value })} /></label>
        <label className="assessment-explanation"><span>Missing information</span><input className="finder-field" value={components[index].missingInformation || ""} onChange={(event) => update(index, { missingInformation: event.target.value })} placeholder="What must still be confirmed?" /></label>
      </div>)}
    </div>
    <div className="fatal-risk-editor"><h3><AlertTriangle size={16} /> Fatal-risk flags</h3><div>{fatalRiskOptions.map((risk) => <label key={risk.value}><input type="checkbox" checked={fatalRisks.includes(risk.value)} onChange={(event) => setFatalRisks((current) => event.target.checked ? [...current, risk.value] : current.filter((value) => value !== risk.value))} />{risk.label}</label>)}</div></div>
    <div className="assessment-footer"><label><span>Manual override</span><input className="finder-field" type="number" min="0" max="100" value={overrideScore} onChange={(event) => setOverrideScore(event.target.value)} /></label><label><span>Override reason {overrideScore && "(required)"}</span><input className="finder-field" value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} /></label><label className="wide"><span>Assessment notes</span><textarea className="finder-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} /></label></div>
    {message && <p className="assessment-message" role="status">{message}</p>}
    <div className="finder-form-actions"><span>{preview.verifiedFieldCount} verified · {preview.estimatedFieldCount} estimated · {preview.missingCriticalFieldCount} critical missing</span><button type="button" className="finder-button finder-button--primary" onClick={submit} disabled={loading || (overrideScore !== "" && overrideReason.trim().length < 10)}>{loading ? <Loader2 className="spin" size={14} /> : <Calculator size={14} />}Save score run</button></div>
  </section>;
}
