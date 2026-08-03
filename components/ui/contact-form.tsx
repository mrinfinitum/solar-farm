"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, LoaderCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  contactSchema,
  electricitySpendOptions,
  type ContactFormData,
} from "@/lib/validation";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      jobTitle: "",
      phone: "",
      facilityLocation: "",
      electricitySpend: "",
      message: "",
      interested: false,
      website: "",
    },
  });

  async function onSubmit(values: ContactFormData) {
    setSubmitState("submitting");
    setServerMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) throw new Error(result.message || "We could not send your request.");

      setSubmitState("success");
      setServerMessage(result.message || "Your request has been received.");
      reset();
    } catch (error) {
      setSubmitState("error");
      setServerMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  if (submitState === "success") {
    return (
      <div className="form-success" role="status" aria-live="polite">
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
    <form className="contact-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="form-grid">
        <FormField id="firstName" label="First name" error={errors.firstName?.message}>
          <input id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} {...register("firstName")} />
        </FormField>
        <FormField id="lastName" label="Last name" error={errors.lastName?.message}>
          <input id="lastName" autoComplete="family-name" aria-invalid={!!errors.lastName} {...register("lastName")} />
        </FormField>
        <FormField id="email" label="Work email" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </FormField>
        <FormField id="company" label="Company" error={errors.company?.message}>
          <input id="company" autoComplete="organization" aria-invalid={!!errors.company} {...register("company")} />
        </FormField>
        <FormField id="jobTitle" label="Job title" error={errors.jobTitle?.message}>
          <input id="jobTitle" autoComplete="organization-title" aria-invalid={!!errors.jobTitle} {...register("jobTitle")} />
        </FormField>
        <FormField id="phone" label="Phone (optional)" error={errors.phone?.message}>
          <input id="phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
        </FormField>
        <FormField id="facilityLocation" label="Facility location" error={errors.facilityLocation?.message}>
          <input id="facilityLocation" autoComplete="street-address" aria-invalid={!!errors.facilityLocation} {...register("facilityLocation")} />
        </FormField>
        <FormField id="electricitySpend" label="Approx. monthly electricity spend (optional)" error={errors.electricitySpend?.message}>
          <select id="electricitySpend" aria-invalid={!!errors.electricitySpend} {...register("electricitySpend")}>
            <option value="">Select a range</option>
            {electricitySpendOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </FormField>
      </div>

      <FormField id="message" label="Tell us about your energy needs" error={errors.message?.message}>
        <textarea id="message" rows={5} aria-invalid={!!errors.message} {...register("message")} />
      </FormField>

      <div className="checkbox-field">
        <input id="interested" type="checkbox" aria-invalid={!!errors.interested} {...register("interested")} />
        <label htmlFor="interested">I am interested in discussing a commercial energy or PPA opportunity.</label>
      </div>
      {errors.interested?.message && <p className="field-error">{errors.interested.message}</p>}

      {submitState === "error" && <p className="form-error" role="alert">{serverMessage}</p>}

      <button className="button button--primary form-submit" type="submit" disabled={submitState === "submitting"}>
        {submitState === "submitting" ? (
          <><LoaderCircle className="spin" aria-hidden="true" size={17} /> Sending request…</>
        ) : (
          <>Request an introductory discussion <ArrowRight aria-hidden="true" size={17} /></>
        )}
      </button>
      <p className="form-privacy">Your information is used only to respond to this commercial energy inquiry.</p>
    </form>
  );
}

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
