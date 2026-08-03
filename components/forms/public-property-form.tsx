"use client";

import { CheckCircle2, FileUp, Loader2, Send } from "lucide-react";
import { useRef, useState } from "react";

import { getUtmParameters, trackEvent } from "@/lib/analytics";

export function PublicPropertyForm({ storageConfigured }: { storageConfigured: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const started = useRef(false);

  async function submit(form: FormData) {
    setLoading(true);
    setMessage("");
    trackEvent("land_submission_submit");
    const attribution = getUtmParameters();
    form.set("source", window.location.pathname);
    form.set("utm_source", attribution.utmSource);
    form.set("utm_medium", attribution.utmMedium);
    form.set("utm_campaign", attribution.utmCampaign);
    form.set("consent", form.get("consent") === "on" ? "true" : "false");

    try {
      const response = await fetch("/api/public-submissions", { method: "POST", body: form });
      const result = await response.json();
      setMessage(response.ok ? result.message || "Your land submission has been received for an initial, non-binding review." : result.error || "We could not accept the submission.");
      setSuccess(response.ok);
      if (response.ok) trackEvent("land_submission_success");
    } catch {
      setMessage("We could not accept the submission. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) return <div className="land-success" role="status" aria-live="polite"><CheckCircle2/><h2>Submission received</h2><p>{message}</p><p>Submission does not constitute an offer, commitment, site approval, or development agreement.</p></div>;

  return (
    <form action={submit} className="land-form" onFocus={() => { if (!started.current) { started.current = true; trackEvent("land_submission_start"); } }}>
      <LandGroup title="Owner or broker">
        <label><span>Submitting as</span><select name="submitter_type" required><option value="owner">Owner</option><option value="broker">Broker</option></select></label>
        <label><span>Full name</span><input name="name" autoComplete="name" required/></label>
        <label><span>Email</span><input name="email" type="email" autoComplete="email" required/></label>
        <label><span>Phone</span><input name="phone" type="tel" autoComplete="tel"/></label>
      </LandGroup>
      <LandGroup title="Property">
        <label className="wide"><span>Property address or location description</span><input name="property_address" required/></label>
        <label><span>County</span><input name="county" required/></label>
        <label><span>Approximate acreage</span><input name="approximate_acreage" type="number" min="0" step=".01"/></label>
        <label><span>Asking price</span><input name="asking_price" type="number" min="0" step=".01"/></label>
        <label><span>Current land use</span><input name="current_use" placeholder="Pasture, timber, agricultural…"/></label>
        <label><span>Tillable status</span><input name="tillable_status" placeholder="Known, partial, unknown…"/></label>
        <label><span>Cleared percentage</span><input name="cleared_percentage" type="number" min="0" max="100"/></label>
        <label><span>Wooded percentage</span><input name="wooded_percentage" type="number" min="0" max="100"/></label>
        <label><span>Road access</span><input name="road_access"/></label>
        <label><span>Parcel number (optional)</span><input name="parcel_number"/></label>
        <label className="wide"><span>Utility information, if known</span><textarea name="utility_information" rows={3}/></label>
      </LandGroup>
      <LandGroup title="Transaction preferences">
        <InterestSelect name="seller_financing_interest" label="Seller financing interest" />
        <InterestSelect name="lease_interest" label="Long-term ground lease interest" />
        <InterestSelect name="option_interest" label="Option agreement interest" />
        <label className="wide"><span>Listing URL</span><input name="listing_url" type="url"/></label>
        <label className="wide"><span>Message</span><textarea name="message" rows={5}/></label>
      </LandGroup>
      <fieldset className="land-form-group">
        <legend>Supporting file</legend>
        <label className="wide land-file-field"><span><FileUp aria-hidden="true"/>Optional PDF, JPG, or PNG · 5 MB maximum</span><input name="attachment" type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={!storageConfigured}/></label>
        <p className="land-upload-note">{storageConfigured ? "Files are stored privately and reviewed only by authorized NSoul team members." : "Secure file storage is not configured. You can still submit the property information without an attachment."}</p>
      </fieldset>
      <label className="honeypot" aria-hidden="true"><span>Website</span><input name="website" tabIndex={-1} autoComplete="off"/></label>
      <label className="land-consent"><input name="consent" type="checkbox" required/><span>I consent to NSoul LLC using this information to evaluate the property and contact me. I understand this submission is unverified and is not an offer, commitment, site approval, or development agreement.</span></label>
      {message && <p className="land-message" role="alert">{message}</p>}
      <button disabled={loading}>{loading ? <Loader2 className="spin"/> : <Send/>}Submit land for consideration</button>
    </form>
  );
}

function LandGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="land-form-group"><legend>{title}</legend><div className="land-form-grid">{children}</div></fieldset>;
}

function InterestSelect({ name, label }: { name: string; label: string }) {
  return <label><span>{label}</span><select name={name}><option value="">Unknown</option><option value="yes">Interested</option><option value="no">Not interested</option></select></label>;
}
