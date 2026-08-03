"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";

export function StartScreeningButton({ propertyId }: { propertyId: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function start() { setBusy(true); setError(""); const response = await fetch(`/api/properties/${propertyId}/screening`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start" }) }); const body = await response.json(); if (!response.ok) { setBusy(false); setError(body.error || "Screening could not be started."); return; } const run = Array.isArray(body.data) ? body.data[0] : body.data; router.push(`/dashboard/properties/${propertyId}/screening/${run.id}`); }
  return <div className="screening-start-link"><button className="finder-button finder-button--primary" onClick={start} disabled={busy}><Play size={15}/>{busy ? "Queueing…" : "Start preliminary screening"}</button>{error && <span className="form-error" role="alert">{error}</span>}</div>;
}
