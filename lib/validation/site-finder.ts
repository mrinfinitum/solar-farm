import { z } from "zod";
import { PRELIMINARY_CATEGORIES } from "@/lib/scoring/preliminary";

const optionalNumber = z.preprocess((value) => value === "" || value == null ? null : Number(value), z.number().finite().nonnegative().nullable());
const optionalPercent = z.preprocess((value) => value === "" || value == null ? null : Number(value), z.number().min(0).max(100).nullable());
const optionalBoolean = z.preprocess((value) => value === "" || value == null ? null : value === true || value === "true" || value === "yes" || value === "1", z.boolean().nullable());

export const propertyInputSchema = z.object({
  property_code: z.string().trim().min(3).max(40), project_name: z.string().trim().max(160).nullable().optional(), status: z.string().trim().default("new"), pipeline_stage: z.string().trim().default("discovery"),
  source_type: z.string().trim().max(80).nullable().optional(), source_name: z.string().trim().max(160).nullable().optional(), source_url: z.url().nullable().optional().or(z.literal("")), source_listing_id: z.string().trim().max(160).nullable().optional(), source_collected_at: z.string().nullable().optional(),
  address_line_1: z.string().trim().min(3).max(200), address_line_2: z.string().trim().max(200).nullable().optional(), city: z.string().trim().min(2).max(100), county: z.string().trim().min(2).max(100), state: z.string().trim().default("Oklahoma"), postal_code: z.string().trim().max(12).default(""),
  latitude: z.preprocess((value) => value === "" || value == null ? null : Number(value), z.number().min(-90).max(90).nullable()), longitude: z.preprocess((value) => value === "" || value == null ? null : Number(value), z.number().min(-180).max(180).nullable()), parcel_number: z.string().trim().max(120).nullable().optional(),
  acreage_total: optionalNumber, acreage_usable_estimate: optionalNumber, asking_price: optionalNumber, property_type: z.string().trim().max(100).nullable().optional(), current_land_use: z.string().trim().max(160).nullable().optional(), tillable_status: z.string().trim().max(80).nullable().optional(), cleared_percentage: optionalPercent, wooded_percentage: optionalPercent, slope_average_percent: optionalPercent,
  legal_access_status: z.string().trim().max(80).nullable().optional(), seller_financing_available: optionalBoolean, lease_option_possible: optionalBoolean, purchase_possible: optionalBoolean,
  owner_name: z.string().trim().max(160).nullable().optional(), broker_name: z.string().trim().max(160).nullable().optional(), internal_summary: z.string().trim().max(5000).nullable().optional(), next_action: z.string().trim().max(500).nullable().optional(), next_action_due_date: z.string().nullable().optional(), assigned_to: z.uuid().nullable().optional(),
  utility: z.object({ electric_utility: z.string().trim().max(160).nullable().optional(), distance_to_three_phase_miles: optionalNumber, circuit_capacity_status: z.string().default("unknown"), verification_status: z.string().default("unknown") }).optional(),
  environmental: z.object({ floodplain_percentage: optionalPercent, wetlands_percentage: optionalPercent, prime_farmland_percentage: optionalPercent, verification_status: z.string().default("not-reviewed") }).optional(),
  regulatory: z.object({ zoning_classification: z.string().trim().max(160).nullable().optional(), solar_use_allowed: optionalBoolean, conditional_use_required: optionalBoolean, verification_status: z.string().default("not-reviewed") }).optional(),
  market: z.object({ estimated_local_offtaker_strength: z.string().nullable().optional(), conceptual_capacity_mw_dc: optionalNumber, estimated_annual_generation_kwh: optionalNumber, estimated_development_risk: z.string().nullable().optional() }).optional(),
  owner_mailing_address: z.string().trim().max(500).nullable().optional(), total_acres: optionalNumber, estimated_usable_acres: optionalNumber,
  listing_url: z.url().nullable().optional().or(z.literal("")), utility_id: z.string().trim().max(160).nullable().optional(),
  current_status: z.enum(["new","desktop_screening","owner_outreach","site_control","utility_screening","detailed_diligence","candidate_project","rejected","archived"]).default("new"),
  source: z.string().trim().max(120).nullable().optional(), source_recorded_at: z.string().nullable().optional(), last_verified_at: z.string().nullable().optional(),
});

export const publicSubmissionSchema = z.object({
  name: z.string().trim().min(2).max(120), email: z.email().max(200), phone: z.string().trim().max(40).nullable().optional(), submitter_type: z.enum(["owner","broker","other"]), property_address: z.string().trim().min(5).max(240), county: z.string().trim().min(2).max(100), approximate_acreage: optionalNumber, asking_price: optionalNumber,
  current_use: z.string().trim().max(200).nullable().optional(), land_condition: z.string().trim().max(200).nullable().optional(), road_access: z.string().trim().max(300).nullable().optional(), utility_information: z.string().trim().max(1000).nullable().optional(), seller_financing_interest: optionalBoolean, lease_option_interest: optionalBoolean,
  listing_url: z.url().nullable().optional().or(z.literal("")), message: z.string().trim().max(5000).nullable().optional(), consent: z.literal(true), website: z.string().max(0),
});

const preliminaryCategory = z.enum(PRELIMINARY_CATEGORIES.map(([key]) => key));
const fatalRisk = z.enum([
  "no_viable_interconnection","insufficient_site_control","environmental_constraint",
  "incompatible_land_use","insufficient_usable_acreage","no_legal_access","title_defect",
  "failed_project_economics","no_plausible_offtaker",
]);

export const preliminaryAssessmentSchema = z.object({
  components: z.array(z.object({
    category: preliminaryCategory,
    rawScore: z.number().min(0).max(100).nullable(),
    sourceQuality: z.enum(["verified","estimated","unknown"]),
    critical: z.boolean(),
    explanation: z.string().trim().min(3).max(1000),
  })).length(PRELIMINARY_CATEGORIES.length),
  fatalRisks: z.array(fatalRisk).default([]),
  notes: z.string().trim().max(5000).nullable().optional(),
  overrideScore: z.number().min(0).max(100).nullable().optional(),
  overrideReason: z.string().trim().max(1000).nullable().optional(),
}).superRefine((value, context) => {
  if (value.overrideScore != null && (!value.overrideReason || value.overrideReason.length < 10)) {
    context.addIssue({ code: "custom", path: ["overrideReason"], message: "Explain the override in at least 10 characters." });
  }
});
