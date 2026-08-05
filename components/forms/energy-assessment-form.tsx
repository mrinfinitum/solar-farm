"use client";

import { ArrowRight, CheckCircle2, FileUp, LoaderCircle, LockKeyhole } from "lucide-react";
import { useRef, useState } from "react";

import { getUtmParameters, trackEvent } from "@/lib/analytics";
import { assessmentFacilityTypes, assessmentTerms, assessmentTimelines } from "@/lib/validation/public-trust";

type State = "idle" | "submitting" | "success" | "error";
type Issues = Record<string, string[] | undefined>;

export function EnergyAssessmentForm({ storageConfigured, audience = "" }: { storageConfigured: boolean; audience?: string }) {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<Issues>({});
  const [files, setFiles] = useState<File[]>([]);
  const started = useRef(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting"); setMessage(""); setIssues({});
    trackEvent("energy_assessment_submit", { audience });
    const form = new FormData(event.currentTarget);
    const utm = getUtmParameters();
    form.set("sourcePage", window.location.pathname); form.set("audience", audience);
    form.set("utmSource", utm.utmSource); form.set("utmMedium", utm.utmMedium); form.set("utmCampaign", utm.utmCampaign);
    try {
      const response = await fetch("/api/energy-assessments", { method: "POST", body: form });
      const result = await response.json() as { message?: string; issues?: Issues };
      if (!response.ok) { setIssues(result.issues || {}); throw new Error(result.message || "The assessment could not be submitted."); }
      setState("success"); setMessage(result.message || "Assessment received."); trackEvent("energy_assessment_success"); event.currentTarget.reset(); setFiles([]);
    } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "The assessment could not be submitted."); }
  }

  if (state === "success") return <div className="intake-success" role="status" tabIndex={-1}><CheckCircle2 aria-hidden="true" /><p className="eyebrow">Assessment received</p><h2>We have your facility information.</h2><p>{message}</p></div>;

  return (
    <form className="trust-intake-form" onSubmit={submit} onFocus={() => { if (!started.current) { started.current = true; trackEvent("energy_assessment_start", { audience }); } }}>
      <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <FormSection number="01" title="Contact"><div className="trust-form-grid">
        <Field name="firstName" label="First name" required issue={issues.firstName}><input name="firstName" autoComplete="given-name" required /></Field>
        <Field name="lastName" label="Last name" required issue={issues.lastName}><input name="lastName" autoComplete="family-name" required /></Field>
        <Field name="email" label="Work email" required issue={issues.email}><input name="email" type="email" autoComplete="email" required /></Field>
        <Field name="company" label="Company" required issue={issues.company}><input name="company" autoComplete="organization" required /></Field>
        <Field name="jobTitle" label="Job title" required issue={issues.jobTitle}><input name="jobTitle" autoComplete="organization-title" required /></Field>
        <Field name="phone" label="Phone" issue={issues.phone}><input name="phone" type="tel" autoComplete="tel" /></Field>
      </div></FormSection>

      <FormSection number="02" title="Facility"><div className="trust-form-grid">
        <Field name="facilityName" label="Facility name" required issue={issues.facilityName}><input name="facilityName" required /></Field>
        <Field name="facilityAddress" label="Facility address" required issue={issues.facilityAddress}><input name="facilityAddress" autoComplete="street-address" required /></Field>
        <Field name="city" label="City" required issue={issues.city}><input name="city" autoComplete="address-level2" required /></Field>
        <Field name="state" label="State" required issue={issues.state}><input name="state" maxLength={2} autoComplete="address-level1" required /></Field>
        <Field name="zipCode" label="ZIP code" required issue={issues.zipCode}><input name="zipCode" inputMode="numeric" autoComplete="postal-code" required /></Field>
        <Field name="facilityType" label="Facility type" required issue={issues.facilityType}><select name="facilityType" required defaultValue=""><option value="" disabled>Select facility type</option>{assessmentFacilityTypes.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field name="currentUtility" label="Current utility" required issue={issues.currentUtility}><input name="currentUtility" required /></Field>
        <Field name="yearsAtFacility" label="Years expected to remain at facility" issue={issues.yearsAtFacility}><input name="yearsAtFacility" /></Field>
      </div></FormSection>

      <FormSection number="03" title="Energy profile"><div className="trust-form-grid">
        <Field name="annualElectricityUse" label="Approximate annual electricity use"><input name="annualElectricityUse" placeholder="e.g. 1,500,000 kWh" /></Field>
        <Field name="monthlyElectricitySpend" label="Approximate monthly electricity spend"><input name="monthlyElectricitySpend" placeholder="e.g. $12,000" /></Field>
        <Field name="currentBlendedRate" label="Current blended rate, if known"><input name="currentBlendedRate" placeholder="$/kWh" /></Field>
        <Field name="daytimeOperatingHours" label="Daytime operating hours"><input name="daytimeOperatingHours" /></Field>
        <Field name="electricMeters" label="Number of electric meters"><input name="electricMeters" inputMode="numeric" /></Field>
        <Field name="demandChargesKnown" label="Demand charges known"><input name="demandChargesKnown" /></Field>
        <Field name="peakDemand" label="Peak demand, if known"><input name="peakDemand" placeholder="kW" /></Field>
        <Field name="desiredContractTerm" label="Desired contract term"><select name="desiredContractTerm" defaultValue=""><option value="">Select term</option>{assessmentTerms.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field name="desiredTimeline" label="Desired evaluation timeline"><select name="desiredTimeline" defaultValue=""><option value="">Select timeline</option>{assessmentTimelines.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field name="existingRenewableContracts" label="Existing renewable-energy contracts" wide><textarea name="existingRenewableContracts" rows={3} /></Field>
      </div></FormSection>

      <FormSection number="04" title="Bill upload"><div className="bill-upload-panel">
        <FileUp aria-hidden="true" /><div><h3>Optional utility statements</h3><p>Up to 12 PDF, JPG, JPEG, PNG, CSV, or XLSX files, 4 MB each.</p></div>
        <input name="bills" type="file" multiple disabled={!storageConfigured} accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx" aria-describedby="bill-upload-note" onClick={() => trackEvent("bill_upload_start")} onChange={(event) => { const selected = [...(event.target.files || [])]; setFiles(selected); if (selected.length) trackEvent("bill_upload_success", { fileCount: selected.length }); }} />
        <p id="bill-upload-note">{storageConfigured ? `${files.length ? `${files.length} file(s) selected. ` : ""}Files are stored in a private bucket for authorized review.` : "Secure storage is not configured. Submit the form now and provide bills securely after we contact you."}</p>
      </div></FormSection>

      <FormSection number="05" title="Consent"><label className="trust-consent"><input name="consent" type="checkbox" required /><span>I authorize NSoul to use the submitted information solely to evaluate a potential commercial energy opportunity.</span></label>{issues.consent?.[0] ? <p className="field-error">{issues.consent[0]}</p> : null}<p className="trust-form-notice"><LockKeyhole aria-hidden="true" />Submitting this information does not create an offer, commitment, guaranteed savings estimate, financing obligation, or energy contract.</p></FormSection>
      {state === "error" ? <p className="form-error" role="alert">{message}</p> : null}
      <button className="button button--primary form-submit" type="submit" disabled={state === "submitting"}>{state === "submitting" ? <><LoaderCircle className="spin" aria-hidden="true" />Submitting…</> : <>Submit Energy Assessment <ArrowRight aria-hidden="true" /></>}</button>
    </form>
  );
}

function FormSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) { return <fieldset className="trust-form-section"><legend><span>{number}</span>{title}</legend>{children}</fieldset>; }
function Field({ name, label, required, issue, wide, children }: { name: string; label: string; required?: boolean; issue?: string[]; wide?: boolean; children: React.ReactNode }) { const error = issue?.[0]; return <label className={`trust-field${wide ? " trust-field--wide" : ""}`}><span>{label}{required ? <small>Required</small> : null}</span>{children}{error ? <p id={`${name}-error`} className="field-error">{error}</p> : null}</label>; }
