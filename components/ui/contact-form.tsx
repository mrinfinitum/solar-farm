"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, LoaderCircle, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { getUtmParameters, trackEvent } from "@/lib/analytics";
import {
  annualUsageOptions,
  contactSchema,
  desiredTimelineOptions,
  discussionTopicOptions,
  electricitySpendOptions,
  facilityTypeOptions,
  type ContactFormData,
} from "@/lib/validation";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const started = useRef(false);
  const successRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "", lastName: "", email: "", company: "", jobTitle: "", phone: "",
      facilityLocation: "", facilityType: "", annualElectricityUsage: "", electricitySpend: "",
      discussionTopic: "", utilityProvider: "", desiredTimeline: "", message: "", interested: false, website: "",
    },
  });

  useEffect(() => {
    if (submitState === "success") successRef.current?.focus();
  }, [submitState]);

  async function onSubmit(values: ContactFormData) {
    setSubmitState("submitting");
    setServerMessage("");
    trackEvent("contact_form_submit");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, ...getUtmParameters(), sourcePage: window.location.pathname }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "We could not send your request.");

      setSubmitState("success");
      setServerMessage(result.message || "Your request has been received.");
      trackEvent("contact_form_success");
      reset();
    } catch (error) {
      setSubmitState("error");
      setServerMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      trackEvent("contact_form_error");
    }
  }

  if (submitState === "success") {
    return (
      <div ref={successRef} className="form-success" role="status" aria-live="polite" tabIndex={-1}>
        <span><CheckCircle2 aria-hidden="true" /></span>
        <p className="eyebrow">Request received</p>
        <h3>Thank you for starting the conversation.</h3>
        <p>{serverMessage}</p>
        <button className="button button--secondary" type="button" onClick={() => setSubmitState("idle")}>
          <RotateCcw aria-hidden="true" size={16} /> Send another request
        </button>
      </div>
    );
  }

  return (
    <form
      className="contact-form"
      onSubmit={handleSubmit(onSubmit)}
      onFocus={() => {
        if (!started.current) {
          started.current = true;
          trackEvent("contact_form_start");
        }
      }}
      noValidate
    >
      <div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} /></div>

      <FormGroup number="01" title="Contact">
        <div className="form-grid">
          <FormField id="firstName" label="First name" error={errors.firstName?.message}><input id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? "firstName-error" : undefined} {...register("firstName")} /></FormField>
          <FormField id="lastName" label="Last name" error={errors.lastName?.message}><input id="lastName" autoComplete="family-name" aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? "lastName-error" : undefined} {...register("lastName")} /></FormField>
          <FormField id="email" label="Work email" error={errors.email?.message}><input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} {...register("email")} /></FormField>
          <FormField id="company" label="Company" error={errors.company?.message}><input id="company" autoComplete="organization" aria-invalid={!!errors.company} aria-describedby={errors.company ? "company-error" : undefined} {...register("company")} /></FormField>
          <FormField id="jobTitle" label="Job title" error={errors.jobTitle?.message}><input id="jobTitle" autoComplete="organization-title" aria-invalid={!!errors.jobTitle} aria-describedby={errors.jobTitle ? "jobTitle-error" : undefined} {...register("jobTitle")} /></FormField>
          <FormField id="phone" label="Phone (optional)" error={errors.phone?.message}><input id="phone" type="tel" autoComplete="tel" {...register("phone")} /></FormField>
        </div>
      </FormGroup>

      <FormGroup number="02" title="Facility">
        <div className="form-grid">
          <FormField id="facilityLocation" label="Facility location" error={errors.facilityLocation?.message}><input id="facilityLocation" autoComplete="street-address" aria-invalid={!!errors.facilityLocation} aria-describedby={errors.facilityLocation ? "facilityLocation-error" : undefined} {...register("facilityLocation")} /></FormField>
          <FormField id="facilityType" label="Facility type (optional)" error={errors.facilityType?.message}><select id="facilityType" {...register("facilityType")}><option value="">Select a facility type</option>{facilityTypeOptions.map((option) => <option key={option}>{option}</option>)}</select></FormField>
          <FormField id="utilityProvider" label="Current utility provider (optional)" error={errors.utilityProvider?.message}><input id="utilityProvider" {...register("utilityProvider")} /></FormField>
        </div>
      </FormGroup>

      <FormGroup number="03" title="Energy profile">
        <div className="form-grid">
          <FormField id="annualElectricityUsage" label="Estimated annual electricity usage (optional)" error={errors.annualElectricityUsage?.message}><select id="annualElectricityUsage" {...register("annualElectricityUsage")}><option value="">Select annual usage</option>{annualUsageOptions.map((option) => <option key={option}>{option}</option>)}</select></FormField>
          <FormField id="electricitySpend" label="Approx. monthly electricity spend (optional)" error={errors.electricitySpend?.message}><select id="electricitySpend" {...register("electricitySpend")}><option value="">Select monthly spend</option>{electricitySpendOptions.map((option) => <option key={option}>{option}</option>)}</select></FormField>
        </div>
      </FormGroup>

      <FormGroup number="04" title="Discussion">
        <div className="form-grid">
          <FormField id="discussionTopic" label="Preferred topic (optional)" error={errors.discussionTopic?.message}><select id="discussionTopic" {...register("discussionTopic")}><option value="">Select a topic</option>{discussionTopicOptions.map((option) => <option key={option}>{option}</option>)}</select></FormField>
          <FormField id="desiredTimeline" label="Desired timeline (optional)" error={errors.desiredTimeline?.message}><select id="desiredTimeline" {...register("desiredTimeline")}><option value="">Select a timeline</option>{desiredTimelineOptions.map((option) => <option key={option}>{option}</option>)}</select></FormField>
        </div>
        <FormField id="message" label="Tell us about your energy needs" error={errors.message?.message}><textarea id="message" rows={5} aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : undefined} {...register("message")} /></FormField>
      </FormGroup>

      <div className="checkbox-field"><input id="interested" type="checkbox" aria-invalid={!!errors.interested} aria-describedby={errors.interested ? "interested-error" : undefined} {...register("interested")} /><label htmlFor="interested">I am interested in discussing a commercial energy or PPA opportunity.</label></div>
      {errors.interested?.message && <p className="field-error" id="interested-error">{errors.interested.message}</p>}
      {submitState === "error" && <p className="form-error" role="alert">{serverMessage}</p>}

      <button className="button button--primary form-submit" type="submit" disabled={submitState === "submitting"}>
        {submitState === "submitting" ? <><LoaderCircle className="spin" aria-hidden="true" size={17} /> Sending request…</> : <>Request an introductory discussion <ArrowRight aria-hidden="true" size={17} /></>}
      </button>
      <p className="form-privacy">Your information is used only to respond to this commercial energy inquiry. See our <a href="/privacy">Privacy Policy</a>.</p>
    </form>
  );
}

function FormGroup({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <fieldset className="contact-form-group"><legend><span>{number}</span>{title}</legend>{children}</fieldset>;
}

function FormField({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return <div className="form-field"><label htmlFor={id}>{label}</label>{children}{error && <p className="field-error" id={`${id}-error`}>{error}</p>}</div>;
}
