"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2 } from "lucide-react";

type Submission = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  property_address: string;
  county: string;
  approximate_acreage?: number | null;
  asking_price?: number | null;
  status: string;
  created_at: string;
  converted_property_id?: string | null;
};

export function PublicSubmissionReview({ rows }: { rows: Submission[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function convert(id: string) {
    setSaving(id);
    setMessage("");
    try {
      const response = await fetch(`/api/public-submissions/${id}/convert`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission could not be converted.");
      const property = Array.isArray(result.data) ? result.data[0] : result.data;
      if (!property?.id) throw new Error("The property was created but its destination could not be resolved.");
      router.push(`/dashboard/properties/${property.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submission could not be converted.");
      setSaving(null);
    }
  }

  return <section className="finder-card public-submissions">
    <div className="finder-card-head"><div><p className="finder-eyebrow">Public land intake</p><h2>Review & convert submissions</h2></div><span className="evidence-badge">Unverified leads</span></div>
    {rows.length ? <div className="finder-table-wrap"><table className="finder-table"><thead><tr><th>Property</th><th>Submitter</th><th>Acreage</th><th>Status</th><th>Received</th><th>Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td data-label="Property"><strong>{row.property_address}</strong><small>{row.county} County</small></td><td data-label="Submitter">{row.name}<small>{row.email}</small></td><td data-label="Acreage">{row.approximate_acreage ?? "—"}</td><td data-label="Status"><span className={row.converted_property_id ? "finder-status finder-status--good" : "finder-status"}>{row.converted_property_id ? "Converted" : row.status.replaceAll("-", " ")}</span></td><td data-label="Received">{new Date(row.created_at).toLocaleDateString()}</td><td data-label="Action">{row.converted_property_id ? <Link className="finder-button" href={`/dashboard/properties/${row.converted_property_id}`}>Open <ArrowUpRight size={13}/></Link> : <button className="finder-button finder-button--primary" disabled={saving === row.id} onClick={() => convert(row.id)}>{saving === row.id ? <Loader2 className="spin" size={13}/> : <ArrowUpRight size={13}/>}Convert to property</button>}</td></tr>)}</tbody></table></div> : <div className="finder-empty"><strong>No public submissions</strong><p>New public land leads remain unverified until an owner or administrator converts them into a property record.</p></div>}
    {message && <p className="risk-flag" role="alert">{message}</p>}
  </section>;
}
