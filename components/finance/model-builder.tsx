"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import { DEFAULT_FINANCE_INPUTS } from "@/lib/finance/engine";

export function ModelBuilder({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function submit(formData: FormData) {
    setBusy(true); setMessage("");
    const inputs = { ...DEFAULT_FINANCE_INPUTS,
      projectCost: Number(formData.get("projectCost")), annualGenerationKwh: Number(formData.get("annualGenerationKwh")), ppaRatePerKwh: Number(formData.get("ppaRatePerKwh")),
      annualOpex: Number(formData.get("annualOpex")), debtAmount: Number(formData.get("debtAmount")), debtInterestPct: Number(formData.get("debtInterestPct")), termYears: Number(formData.get("termYears")),
    };
    const response = await fetch(`/api/projects/${projectId}/finance/models`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: formData.get("name"), scenarioType: formData.get("scenarioType"), inputs }) });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(payload.error || "Unable to calculate model.");
    setOpen(false); router.push(`/dashboard/projects/${projectId}/finance/models/${payload.data.id}`); router.refresh();
  }
  return <><button className="finder-button finder-button--primary" onClick={() => setOpen(true)}><Calculator size={15}/>New model version</button>{open?<div className="finance-dialog-backdrop"><div className="finance-dialog" role="dialog" aria-modal="true" aria-labelledby="finance-model-title"><p className="finder-eyebrow">Server-calculated model</p><h2 id="finance-model-title">Create an indicative model</h2><p>Each run creates an immutable version with an engine identifier and source hash.</p><form action={submit} className="finance-model-form"><label>Model name<input name="name" className="finder-field" defaultValue="Base underwriting model" required/></label><label>Scenario<select name="scenarioType" className="finder-field"><option value="base">Base</option><option value="conservative">Conservative</option><option value="optimistic">Optimistic</option><option value="lender_case">Lender case</option><option value="investor_case">Investor case</option><option value="p50">P50</option><option value="p90">P90</option><option value="custom">Custom</option></select></label><label>Project cost<input name="projectCost" className="finder-field" type="number" min="1" defaultValue={DEFAULT_FINANCE_INPUTS.projectCost}/></label><label>Annual generation (kWh)<input name="annualGenerationKwh" className="finder-field" type="number" min="1" defaultValue={DEFAULT_FINANCE_INPUTS.annualGenerationKwh}/></label><label>PPA rate ($/kWh)<input name="ppaRatePerKwh" className="finder-field" type="number" min="0" step="0.0001" defaultValue={DEFAULT_FINANCE_INPUTS.ppaRatePerKwh}/></label><label>Annual O&amp;M<input name="annualOpex" className="finder-field" type="number" min="0" defaultValue={DEFAULT_FINANCE_INPUTS.annualOpex}/></label><label>Debt amount<input name="debtAmount" className="finder-field" type="number" min="0" defaultValue={DEFAULT_FINANCE_INPUTS.debtAmount}/></label><label>Debt rate (%)<input name="debtInterestPct" className="finder-field" type="number" min="0" step="0.01" defaultValue={DEFAULT_FINANCE_INPUTS.debtInterestPct}/></label><label>Agreement term<input name="termYears" className="finder-field" type="number" min="1" max="50" defaultValue={DEFAULT_FINANCE_INPUTS.termYears}/></label>{message?<p className="finance-form-error">{message}</p>:null}<div className="finance-dialog-actions"><button type="button" className="finder-button" onClick={() => setOpen(false)}>Cancel</button><button className="finder-button finder-button--primary" disabled={busy}>{busy?<Loader2 className="spin"/>:<Calculator/>}Calculate and save</button></div></form></div></div>:null}</>;
}
