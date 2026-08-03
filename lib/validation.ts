import { z } from "zod";

export const electricitySpendOptions = [
  "Under $10,000",
  "$10,000–$25,000",
  "$25,000–$50,000",
  "$50,000–$100,000",
  "Over $100,000",
  "Prefer not to say",
] as const;

export const contactSchema = z.object({
  firstName: z.string().trim().min(2, "Enter your first name").max(50),
  lastName: z.string().trim().min(2, "Enter your last name").max(50),
  email: z.string().trim().email("Enter a valid work email").max(120),
  company: z.string().trim().min(2, "Enter your company name").max(120),
  jobTitle: z.string().trim().min(2, "Enter your job title").max(100),
  phone: z.string().trim().max(30).optional(),
  facilityLocation: z.string().trim().min(2, "Enter a facility location").max(160),
  electricitySpend: z.enum(electricitySpendOptions).or(z.literal("")).optional(),
  message: z.string().trim().min(10, "Tell us a little about your energy needs").max(2000),
  interested: z.boolean().refine((value) => value, {
    message: "Confirm that you are interested in a commercial energy discussion",
  }),
  website: z.string().max(0, "Submission could not be processed").optional(),
});

export type ContactFormData = z.input<typeof contactSchema>;
export type ValidatedContact = z.output<typeof contactSchema>;
