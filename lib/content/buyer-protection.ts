import { Building2, Gauge, Landmark, Ruler, ShieldCheck } from "lucide-react";

export const buyerProtectionModules = [
  { title: "No upfront equipment purchase", copy: "The proposed structure does not require the customer to purchase the solar array or fund project construction." },
  { title: "Payment tied to contracted energy", copy: "The final billing structure should define when payment begins, how energy is measured, how invoices are calculated, and how discrepancies are resolved." },
  { title: "Commercial operation conditions", copy: "The definitive agreement should define the requirements that must be satisfied before the project begins commercial delivery." },
  { title: "Operating responsibility", copy: "The project owner and its contracted providers should remain responsible for monitoring, maintenance, insurance, and operating obligations defined in the final agreement." },
  { title: "Contract remedies", copy: "The final PPA may address underperformance, reporting, defaults, termination rights, assignment, lender rights, and replacement of responsible project parties." },
  { title: "Utility continuity", copy: "The final structure should explain how the customer’s existing utility service, interconnection, metering, delivery, and billing responsibilities continue." },
] as const;

export const responsibilityParties = [
  { name: "NSoul / Project Company", icon: ShieldCheck, duties: ["Coordinates development", "Establishes site control", "Manages commercial structure", "Organizes project capital", "Oversees project execution"] },
  { name: "Engineering and EPC Providers", icon: Ruler, duties: ["Complete technical design", "Establish production assumptions", "Procure equipment", "Construct and commission the project"] },
  { name: "Utility", icon: Landmark, duties: ["Reviews interconnection", "Establishes applicable technical requirements", "Supports approved metering and grid arrangements", "Continues regulated utility responsibilities"] },
  { name: "Metering and Reporting", icon: Gauge, duties: ["Records approved project output", "Supports invoice calculations", "Provides production data", "Supports commercial reconciliation"] },
  { name: "Commercial Customer", icon: Building2, duties: ["Provides energy-use information", "Completes commercial and credit review", "Negotiates definitive agreements", "Purchases qualifying energy under the final contract"] },
] as const;

export const homepageTrustPoints = [
  { label: "Capital clarity", title: "Customer capital protected", copy: "The proposed structure does not require the customer to purchase the solar equipment or fund project construction." },
  { label: "Billing clarity", title: "Metered energy", copy: "Commercial billing is intended to be based on energy measured under the definitive agreement and approved metering structure." },
  { label: "Clear accountability", title: "Defined responsibilities", copy: "Development, engineering, financing, construction, insurance, maintenance, and operations are assigned to the responsible project parties in final documentation." },
  { label: "Visible process", title: "Transparent diligence", copy: "Project status, assumptions, risks, third-party reviews, and available documents are disclosed through the project-diligence process." },
] as const;
