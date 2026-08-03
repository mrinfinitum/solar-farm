"use client";

import Link from "next/link";
import { useState } from "react";
import { Archive, Grid2X2, List, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

import { calculatePropertyScore } from "@/lib/scoring/calculate";
import type { PreliminaryScoreRun, PropertyRecord } from "@/types/property";

function latestRun(property: PropertyRecord) {
  const runs = Array.isArray(property.property_score_runs) ? property.property_score_runs : property.property_score_runs ? [property.property_score_runs] : [];
  return [...runs].sort((a, b) => b.scored_at.localeCompare(a.scored_at))[0] as PreliminaryScoreRun | undefined;
}

export function PropertyList({ properties, canEdit }: { properties: PropertyRecord[]; canEdit: boolean }) {
  const [view, setView] = useState<"table" | "cards">("table");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function archiveSelected() {
    if (!selected.length || !confirm(`Archive ${selected.length} selected properties?`)) return;
    setLoading(true);
    const response = await fetch("/api/properties", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "archive", ids: selected }) });
    setLoading(false);
    if (response.ok) { setSelected([]); router.refresh(); }
  }
  return <section className="finder-card">
    <div className="finder-card-head"><div><h2>{properties.length} matching properties</h2>{selected.length > 0 && <span className="selection-count">{selected.length} selected</span>}</div><div className="property-list-controls">{canEdit && selected.length > 0 && <button className="finder-button" onClick={archiveSelected} disabled={loading}><Archive size={14} />{loading ? "Archiving…" : "Archive"}</button>}<button className="finder-icon-button" aria-label="Table view" onClick={() => setView("table")}><List size={15} /></button><button className="finder-icon-button" aria-label="Card view" onClick={() => setView("cards")}><Grid2X2 size={15} /></button></div></div>
    {view === "table" ? <div className="finder-table-wrap"><table className="finder-table property-pipeline-table"><thead><tr>{canEdit && <th><span className="sr-only">Select</span></th>}<th>Property</th><th>Status</th><th>County</th><th>Acres</th><th>Asking price</th><th>$/acre</th><th>Grade</th><th>Risk</th><th>Verified</th><th>Updated</th></tr></thead><tbody>{properties.map((property) => { const legacy = calculatePropertyScore(property); const run = latestRun(property); const acres = property.total_acres ?? property.acreage_total; return <tr key={property.id}>{canEdit && <td data-label="Select"><input aria-label={`Select ${property.address_line_1}`} type="checkbox" checked={selected.includes(property.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, property.id] : current.filter((id) => id !== property.id))} /></td>}<td data-label="Property"><Link href={`/dashboard/properties/${property.id}`}>{property.project_name || property.address_line_1}</Link><small>{property.property_code}</small></td><td data-label="Status"><span className="finder-status">{(property.current_status || property.status).replaceAll("_", " ")}</span></td><td data-label="County">{property.county}</td><td data-label="Acres">{acres ?? "—"}</td><td data-label="Asking price">{property.asking_price ? `$${property.asking_price.toLocaleString()}` : "—"}</td><td data-label="Price per acre">{property.price_per_acre ? `$${property.price_per_acre.toLocaleString()}` : "—"}</td><td data-label="Grade"><strong className="grade-badge">{run?.grade || "—"}</strong><small>{run ? run.displayed_score : legacy.effectiveScore}</small></td><td data-label="Risk"><span className={`risk-tone risk-tone--${run?.overall_risk || "unknown"}`}>{run?.overall_risk || "unknown"}</span></td><td data-label="Verified">{property.last_verified_at ? "Verified" : "Unverified"}</td><td data-label="Updated">{new Date(property.updated_at).toLocaleDateString()}</td></tr>; })}</tbody></table></div> : <div className="property-card-grid">{properties.map((property) => { const run = latestRun(property); return <Link className="property-list-card" href={`/dashboard/properties/${property.id}`} key={property.id}><div><span>{(property.current_status || property.status).replaceAll("_", " ")}</span><strong>{run?.grade || "—"}</strong></div><h3>{property.project_name || property.address_line_1}</h3><p><MapPin size={12} />{property.city}, {property.county}</p><footer><span>{property.total_acres || property.acreage_total ? `${property.total_acres || property.acreage_total} acres` : "Acreage unknown"}</span><span>{run ? `${run.overall_risk} risk` : "Not scored"}</span></footer></Link>; })}</div>}
  </section>;
}
