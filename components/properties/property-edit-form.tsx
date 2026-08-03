"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import type { PropertyRecord } from "@/types/property";

const statuses = ["new","desktop_screening","owner_outreach","site_control","utility_screening","detailed_diligence","candidate_project","rejected"];

export function PropertyEditForm({ property }: { property: PropertyRecord }) {
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState(""); const router = useRouter();
  async function submit(formData: FormData) {
    setLoading(true); setMessage("");
    const value = (name: string) => String(formData.get(name) || "").trim();
    const number = (name: string) => value(name) ? Number(value(name)) : null;
    const payload = { project_name: value("project_name") || null, current_status: value("current_status"), owner_name: value("owner_name") || null, owner_mailing_address: value("owner_mailing_address") || null, total_acres: number("total_acres"), estimated_usable_acres: number("estimated_usable_acres"), acreage_total: number("total_acres"), acreage_usable_estimate: number("estimated_usable_acres"), asking_price: number("asking_price"), assigned_to: value("assigned_to") || null, internal_summary: value("internal_summary") || null, last_verified_at: value("verified") === "yes" ? new Date().toISOString() : null };
    const response = await fetch(`/api/properties/${property.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json(); setLoading(false);
    if (!response.ok) return setMessage(result.error || "Property could not be updated.");
    setMessage("Property updated."); router.refresh();
  }
  return <form action={submit} className="finder-card finder-form finder-form-section"><div className="finder-card-head"><div><p className="finder-eyebrow">Property record</p><h2>Edit screening details</h2></div></div><div className="finder-form-grid">
    <label><span>Working name</span><input className="finder-field" name="project_name" defaultValue={property.project_name || ""} /></label>
    <label><span>Status</span><select className="finder-field" name="current_status" defaultValue={property.current_status || "new"}>{statuses.map((status) => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
    <label><span>Assigned user ID</span><input className="finder-field" name="assigned_to" defaultValue={property.assigned_to || ""} /></label>
    <label><span>Owner name</span><input className="finder-field" name="owner_name" defaultValue={property.owner_name || ""} /></label>
    <label><span>Owner mailing address</span><input className="finder-field" name="owner_mailing_address" defaultValue={property.owner_mailing_address || ""} /></label>
    <label><span>Total acres</span><input className="finder-field" name="total_acres" type="number" defaultValue={property.total_acres ?? property.acreage_total ?? ""} /></label>
    <label><span>Estimated usable acres</span><input className="finder-field" name="estimated_usable_acres" type="number" defaultValue={property.estimated_usable_acres ?? property.acreage_usable_estimate ?? ""} /></label>
    <label><span>Asking price</span><input className="finder-field" name="asking_price" type="number" defaultValue={property.asking_price ?? ""} /></label>
    <label><span>Verification</span><select className="finder-field" name="verified" defaultValue={property.last_verified_at ? "yes" : "no"}><option value="no">Unverified</option><option value="yes">Verified now</option></select></label>
    <label className="wide"><span>Internal summary</span><textarea className="finder-textarea" name="internal_summary" defaultValue={property.internal_summary || ""} /></label>
  </div>{message && <p className="assessment-message" role="status">{message}</p>}<div className="finder-form-actions"><button className="finder-button finder-button--primary" disabled={loading}>{loading ? <Loader2 className="spin" size={14} /> : <Save size={14} />}Save changes</button></div></form>;
}
