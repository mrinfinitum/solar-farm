"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPinned } from "lucide-react";

export function QuickScreening() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setBusy(true); setError("");
    const address = String(formData.get("address") || "");
    const city = String(formData.get("city") || "");
    const payload = {
      property_code: `QS-${Date.now()}`, project_name: address, address_line_1: address,
      city, county: String(formData.get("county") || "Unknown"), state: String(formData.get("state") || "Oklahoma"),
      postal_code: String(formData.get("postal_code") || ""), parcel_number: String(formData.get("parcel_number") || "") || null,
      latitude: formData.get("latitude") || null, longitude: formData.get("longitude") || null,
      source: "manual", current_status: "desktop_screening",
    };
    const propertyResponse = await fetch("/api/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const propertyBody = await propertyResponse.json();
    if (!propertyResponse.ok) { setError(propertyBody.error || "Property could not be created."); setBusy(false); return; }
    const screeningResponse = await fetch(`/api/properties/${propertyBody.data.id}/screening`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start" }) });
    const screeningBody = await screeningResponse.json();
    if (!screeningResponse.ok) { setError(screeningBody.error || "Screening could not be queued."); setBusy(false); return; }
    const run = Array.isArray(screeningBody.data) ? screeningBody.data[0] : screeningBody.data;
    router.push(`/dashboard/properties/${propertyBody.data.id}/screening/${run.id}`);
  }

  return <section className="finder-card quick-screening">
    <div className="quick-screening__intro"><MapPinned/><p className="finder-eyebrow">Quick screening</p><h2>Start with a real address.</h2><p>Create a conservative property record and begin provider-by-provider preliminary screening. Automated results remain proposed until reviewed.</p></div>
    <form action={submit} className="quick-screening__form">
      <label>Street address<input name="address" required minLength={3}/></label>
      <label>City<input name="city" required minLength={2}/></label>
      <label>County<input name="county" placeholder="Unknown is allowed"/></label>
      <label>State<input name="state" defaultValue="Oklahoma" required/></label>
      <label>ZIP code<input name="postal_code" inputMode="numeric"/></label>
      <label>Parcel number <small>optional</small><input name="parcel_number"/></label>
      <label>Latitude <small>optional</small><input name="latitude" type="number" step="any"/></label>
      <label>Longitude <small>optional</small><input name="longitude" type="number" step="any"/></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="finder-button finder-button--primary" disabled={busy}>{busy ? "Creating and queueing…" : <>Create and run screening <ArrowRight size={16}/></>}</button>
    </form>
  </section>;
}
