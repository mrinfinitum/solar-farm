import { z } from "zod";

const optionalText = z.string().trim().max(5000).optional().nullable();
const optionalDate = z.string().date().optional().nullable();
const optionalUuid = z.string().uuid().optional().nullable();
const nonEmptyUpdate = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict().refine((value) => Object.keys(value).length > 0, "At least one update is required");

export const fundingSourceSchema = z.object({
  funding_type: z.enum(["grant","tax-credit","debt","equity","equipment-financing","incentive","other"]),
  program_name: z.string().trim().min(2).max(160), provider_name: z.string().trim().max(160).optional().nullable(),
  status: z.enum(["researching","future","planning","pre-application","preparing","ready-to-submit","submitted","under-review","information-requested","approved","conditionally-approved","denied","withdrawn","closed","reimbursement","completed","archived"]),
  estimated_amount: z.coerce.number().nonnegative().optional().nullable(), requested_amount: z.coerce.number().nonnegative().optional().nullable(),
  approved_amount: z.coerce.number().nonnegative().optional().nullable(), funded_amount: z.coerce.number().nonnegative().optional().nullable(),
  application_deadline: optionalDate, notes: optionalText,
});

export const requirementUpdateSchema = z.object({
  status: z.enum(["not-started","in-progress","waiting","complete","not-applicable","blocked","needs-review"]).optional(),
  required: z.boolean().optional(), blocking: z.boolean().optional(), due_date: optionalDate,
  linked_document_id: optionalUuid, linked_task_id: optionalUuid, notes: optionalText,
  verify: z.boolean().optional(), source_url: z.string().url().optional().nullable(), source_title: z.string().trim().max(300).optional().nullable(),
}).refine((value) => Object.keys(value).length > 0, "At least one update is required");

export const communicationSchema = z.object({
  contact_id: optionalUuid,
  communication_type: z.enum(["email","phone","meeting","video-call","letter","portal-message","note"]),
  subject: z.string().trim().min(2).max(240), summary: z.string().trim().min(2).max(5000),
  communication_date: z.string().datetime(), direction: z.enum(["inbound","outbound","internal"]),
  follow_up_date: optionalDate, linked_document_id: optionalUuid,
});

export const questionSchema = z.object({
  question_number: z.string().trim().max(80).optional().nullable(), question: z.string().trim().min(3).max(5000),
  source: z.string().trim().min(2).max(240), received_at: z.string().datetime(), due_date: optionalDate,
  status: z.enum(["open","drafting","waiting","submitted","accepted","closed"]).default("open"), response_summary: optionalText,
  linked_response_document_id: optionalUuid,
});

export const reimbursementSchema = z.object({
  request_number: z.string().trim().min(1).max(80), period_start: optionalDate, period_end: optionalDate,
  eligible_cost_basis: z.coerce.number().nonnegative(), requested_amount: z.coerce.number().nonnegative(),
  approved_amount: z.coerce.number().nonnegative().optional().nullable(), paid_amount: z.coerce.number().nonnegative().optional().nullable(),
  submitted_at: z.string().datetime().optional().nullable(), approved_at: z.string().datetime().optional().nullable(), paid_at: z.string().datetime().optional().nullable(),
  status: z.enum(["preparing","submitted","under-review","information-requested","approved","partially-paid","paid","denied"]),
  linked_document_id: optionalUuid, notes: optionalText,
}).superRefine((value, context) => {
  if (value.period_start && value.period_end && value.period_end < value.period_start) context.addIssue({ code: "custom", path: ["period_end"], message: "Period end must be after period start" });
  if (value.status === "paid" && (!value.paid_amount || !value.paid_at)) context.addIssue({ code: "custom", path: ["status"], message: "Paid reimbursements require a paid amount and paid date" });
});

export const costItemSchema = z.object({
  category: z.string().trim().min(2).max(100), description: z.string().trim().min(2).max(500), vendor: z.string().trim().max(200).optional().nullable(),
  estimated_cost: z.coerce.number().nonnegative(), actual_cost: z.coerce.number().nonnegative().optional().nullable(), eligible_amount: z.coerce.number().nonnegative().optional().nullable(),
  eligibility_status: z.enum(["unknown","potentially-eligible","confirmed-eligible","ineligible","needs-review"]),
  invoice_document_id: optionalUuid, proof_of_payment_document_id: optionalUuid, notes: optionalText,
});

export const fundingContactSchema = z.object({
  contact_id: z.string().uuid(), relationship_type: z.enum(["usda-program-specialist","usda-loan-specialist","usda-state-energy-coordinator","usda-area-specialist","grant-consultant","lender","engineer","environmental-reviewer","other"]),
  is_primary: z.boolean().default(false), notes: optionalText,
});

export const requirementDocumentSchema = z.object({ requirement_id: z.string().uuid(), document_id: z.string().uuid() });

export const fundingSourceUpdateSchema = nonEmptyUpdate({
  status: fundingSourceSchema.shape.status.optional(), estimated_amount: z.coerce.number().nonnegative().optional().nullable(),
  requested_amount: z.coerce.number().nonnegative().optional().nullable(), approved_amount: z.coerce.number().nonnegative().optional().nullable(),
  funded_amount: z.coerce.number().nonnegative().optional().nullable(), application_deadline: optionalDate, notes: optionalText,
  primary_contact_id: optionalUuid, submitted_at: z.string().datetime().optional().nullable(), decision_date: optionalDate,
  award_date: optionalDate, closing_date: optionalDate,
});

export const questionUpdateSchema = nonEmptyUpdate({
  status: questionSchema.shape.status.optional(), response_summary: optionalText, linked_response_document_id: optionalUuid, due_date: optionalDate,
});

export const reimbursementUpdateSchema = nonEmptyUpdate({
  status: reimbursementSchema.shape.status.optional(), eligible_cost_basis: z.coerce.number().nonnegative().optional(),
  requested_amount: z.coerce.number().nonnegative().optional(), approved_amount: z.coerce.number().nonnegative().optional().nullable(),
  paid_amount: z.coerce.number().nonnegative().optional().nullable(), submitted_at: z.string().datetime().optional().nullable(),
  approved_at: z.string().datetime().optional().nullable(), paid_at: z.string().datetime().optional().nullable(), linked_document_id: optionalUuid, notes: optionalText,
});

export const communicationUpdateSchema = nonEmptyUpdate({ subject: z.string().trim().min(2).max(240).optional(), summary: z.string().trim().min(2).max(5000).optional(), follow_up_date: optionalDate, linked_document_id: optionalUuid });
export const costItemUpdateSchema = nonEmptyUpdate({
  category: z.string().trim().min(2).max(100).optional(), description: z.string().trim().min(2).max(500).optional(), vendor: z.string().trim().max(200).optional().nullable(),
  estimated_cost: z.coerce.number().nonnegative().optional(), actual_cost: z.coerce.number().nonnegative().optional().nullable(), eligible_amount: z.coerce.number().nonnegative().optional().nullable(),
  eligibility_status: costItemSchema.shape.eligibility_status.optional(), invoice_document_id: optionalUuid, proof_of_payment_document_id: optionalUuid, notes: optionalText,
});
export const fundingContactUpdateSchema = nonEmptyUpdate({ relationship_type: fundingContactSchema.shape.relationship_type.optional(), is_primary: z.boolean().optional(), notes: optionalText });
