import { z } from "zod";

export const electricitySpendOptions = [
  "Under $10,000",
  "$10,000–$25,000",
  "$25,000–$50,000",
  "$50,000–$100,000",
  "Over $100,000",
  "Prefer not to say",
] as const;

export const facilityTypeOptions = ["Manufacturing", "Healthcare", "Food processing", "Lumber or paper", "Distribution", "Retail", "Public or institutional", "Other"] as const;
export const annualUsageOptions = ["Under 500,000 kWh", "500,000–1,000,000 kWh", "1,000,000–2,500,000 kWh", "2,500,000–5,000,000 kWh", "Over 5,000,000 kWh", "Unknown"] as const;
export const discussionTopicOptions = ["PPA opportunity", "Energy-cost analysis", "Project partnership", "Financing", "Land opportunity", "General inquiry"] as const;
export const desiredTimelineOptions = ["Immediate", "Within 3 months", "Within 6 months", "Within 12 months", "Exploratory"] as const;

export const contactSchema = z.object({
  firstName: z.string().trim().min(2, "Enter your first name").max(50),
  lastName: z.string().trim().min(2, "Enter your last name").max(50),
  email: z.string().trim().email("Enter a valid work email").max(120),
  company: z.string().trim().min(2, "Enter your company name").max(120),
  jobTitle: z.string().trim().min(2, "Enter your job title").max(100),
  phone: z.string().trim().max(30).optional(),
  facilityLocation: z.string().trim().min(2, "Enter a facility location").max(160),
  facilityType: z.enum(facilityTypeOptions).or(z.literal("")).optional(),
  annualElectricityUsage: z.enum(annualUsageOptions).or(z.literal("")).optional(),
  discussionTopic: z.enum(discussionTopicOptions).or(z.literal("")).optional(),
  utilityProvider: z.string().trim().max(120).optional(),
  desiredTimeline: z.enum(desiredTimelineOptions).or(z.literal("")).optional(),
  electricitySpend: z.enum(electricitySpendOptions).or(z.literal("")).optional(),
  message: z.string().trim().min(10, "Tell us a little about your energy needs").max(2000),
  interested: z.boolean().refine((value) => value, {
    message: "Confirm that you are interested in a commercial energy discussion",
  }),
  website: z.string().max(0, "Submission could not be processed").optional(),
  sourcePage: z.string().trim().max(240).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
});

export type ContactFormData = z.input<typeof contactSchema>;
export type ValidatedContact = z.output<typeof contactSchema>;
