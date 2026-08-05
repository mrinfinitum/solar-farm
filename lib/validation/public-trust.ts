import { z } from "zod";

export const assessmentFacilityTypes = ["Manufacturing", "Healthcare", "Food processing", "Lumber or paper", "Warehouse or distribution", "Retail", "Public or institutional", "Office or commercial", "Other"] as const;
export const assessmentTimelines = ["Within 30 days", "Within 3 months", "Within 6 months", "Within 12 months", "Exploratory"] as const;
export const assessmentTerms = ["10 years", "15 years", "20 years", "25 years", "Open to recommendation"] as const;

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional().default("");
const requiredText = (message: string, maximum = 160) => z.string().trim().min(2, message).max(maximum);

export const energyAssessmentSchema = z.object({
  firstName: requiredText("Enter your first name", 50), lastName: requiredText("Enter your last name", 50),
  email: z.string().trim().email("Enter a valid work email").max(120), company: requiredText("Enter your company name", 120),
  jobTitle: requiredText("Enter your job title", 100), phone: optionalText(30),
  facilityName: requiredText("Enter the facility name"), facilityAddress: requiredText("Enter the facility address", 200),
  city: requiredText("Enter the city", 100), state: z.string().trim().length(2, "Use the two-letter state abbreviation").toUpperCase(),
  zipCode: z.string().trim().regex(/^\d{5}(?:-\d{4})?$/, "Enter a valid ZIP code"), facilityType: z.enum(assessmentFacilityTypes),
  currentUtility: requiredText("Enter the current utility", 120), yearsAtFacility: optionalText(40),
  annualElectricityUse: optionalText(80), monthlyElectricitySpend: optionalText(80), currentBlendedRate: optionalText(40),
  daytimeOperatingHours: optionalText(80), electricMeters: optionalText(20), demandChargesKnown: optionalText(80), peakDemand: optionalText(40),
  existingRenewableContracts: optionalText(300), desiredContractTerm: z.enum(assessmentTerms).or(z.literal("")).optional(),
  desiredTimeline: z.enum(assessmentTimelines).or(z.literal("")).optional(),
  consent: z.union([z.literal("true"), z.literal("on")], { message: "Authorization is required" }), website: z.string().max(0).optional(),
  sourcePage: optionalText(240), audience: optionalText(80), utmSource: optionalText(120), utmMedium: optionalText(120), utmCampaign: optionalText(120),
});

export const dataRoomRequestSchema = z.object({
  name: requiredText("Enter your name", 100), company: requiredText("Enter your company", 120), title: requiredText("Enter your title", 100),
  email: z.string().trim().email("Enter a valid work email").max(120), phone: optionalText(30),
  organizationType: z.enum(["Commercial energy buyer", "Lender", "Investor", "EPC or engineer", "Attorney or advisor", "Landowner", "Public agency", "Other"]),
  reason: requiredText("Explain the purpose of the request", 1000), documentsRequested: requiredText("List the documents requested", 1000),
  ndaWillingness: z.enum(["Yes", "No", "Need to review"]), projectRelationship: requiredText("Describe your relationship to the project", 500),
  website: z.string().max(0).optional(), sourcePage: optionalText(240), utmSource: optionalText(120), utmMedium: optionalText(120), utmCampaign: optionalText(120),
});

export type EnergyAssessment = z.output<typeof energyAssessmentSchema>;
export type DataRoomRequest = z.output<typeof dataRoomRequestSchema>;
