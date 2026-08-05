"use client";

import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";

import { getUtmParameters, trackEvent } from "@/lib/analytics";

const organizationTypes = ["Commercial energy buyer", "Lender", "Investor", "EPC or engineer", "Attorney or advisor", "Landowner", "Public agency", "Other"] as const;

export function DataRoomRequestForm() {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const started = useRef(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("submitting"); setMessage(""); trackEvent("data_room_request_submit");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/data-room-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, ...getUtmParameters(), sourcePage: window.location.pathname }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "The request could not be submitted.");
      setState("success"); setMessage(result.message || "Request received.");
    } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "The request could not be submitted."); }
  }
  if (state === "success") return <div className="intake-success" role="status"><CheckCircle2 aria-hidden="true" /><p className="eyebrow">Request received</p><h3>Diligence access remains controlled.</h3><p>{message}</p></div>;
  return <form className="data-room-form" onSubmit={submit} onFocus={() => { if (!started.current) { started.current = true; trackEvent("data_room_request_start"); } }}>
    <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <div className="trust-form-grid">
      <SimpleField name="name" label="Name"><input name="name" autoComplete="name" required /></SimpleField><SimpleField name="company" label="Company"><input name="company" autoComplete="organization" required /></SimpleField>
      <SimpleField name="title" label="Title"><input name="title" autoComplete="organization-title" required /></SimpleField><SimpleField name="email" label="Work email"><input name="email" type="email" autoComplete="email" required /></SimpleField>
      <SimpleField name="phone" label="Phone"><input name="phone" type="tel" autoComplete="tel" /></SimpleField><SimpleField name="organizationType" label="Organization type"><select name="organizationType" required defaultValue=""><option value="" disabled>Select type</option>{organizationTypes.map((item) => <option key={item}>{item}</option>)}</select></SimpleField>
      <SimpleField name="reason" label="Reason for access" wide><textarea name="reason" rows={4} required /></SimpleField><SimpleField name="documentsRequested" label="Documents requested" wide><textarea name="documentsRequested" rows={4} required /></SimpleField>
      <SimpleField name="ndaWillingness" label="Willing to sign an NDA"><select name="ndaWillingness" required defaultValue=""><option value="" disabled>Select response</option><option>Yes</option><option>No</option><option>Need to review</option></select></SimpleField><SimpleField name="projectRelationship" label="Project relationship"><input name="projectRelationship" required /></SimpleField>
    </div>
    <p className="trust-form-notice">Submitting this form requests review only. It does not grant access or expose private project files.</p>{state === "error" ? <p className="form-error" role="alert">{message}</p> : null}
    <button className="button button--primary form-submit" disabled={state === "submitting"}>{state === "submitting" ? <><LoaderCircle className="spin" />Submitting…</> : <>Request Diligence Access <ArrowRight aria-hidden="true" /></>}</button>
  </form>;
}

function SimpleField({ label, wide, children }: { name: string; label: string; wide?: boolean; children: React.ReactNode }) { return <label className={`trust-field${wide ? " trust-field--wide" : ""}`}><span>{label}</span>{children}</label>; }
