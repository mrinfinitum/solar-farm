import { z } from "zod";

const boundedPct = z.coerce.number().min(-100).max(100);
const nonnegative = z.coerce.number().finite().min(0);

export const financeInputsSchema = z.object({
  projectCost: nonnegative,
  annualGenerationKwh: nonnegative,
  availabilityPct: z.coerce.number().min(0).max(100),
  degradationPct: z.coerce.number().min(0).max(20),
  curtailmentPct: z.coerce.number().min(0).max(100),
  ppaRatePerKwh: z.coerce.number().finite().min(0).max(10),
  ppaEscalatorPct: boundedPct,
  termYears: z.coerce.number().int().min(1).max(50),
  annualOpex: nonnegative,
  opexEscalatorPct: boundedPct,
  replacementCapex: z.array(z.object({ year: z.coerce.number().int().min(1).max(50), amount: nonnegative })).max(50),
  incentives: z.array(z.object({ year: z.coerce.number().int().min(1).max(50), amount: nonnegative, confidence: z.enum(["unverified", "estimated", "confirmed"]) })).max(50),
  debtAmount: nonnegative,
  debtInterestPct: z.coerce.number().min(0).max(100),
  debtTermYears: z.coerce.number().int().min(0).max(50),
  interestOnlyYears: z.coerce.number().int().min(0).max(50),
  balloonAmount: nonnegative,
  reserveContributionAnnual: nonnegative,
  taxRatePct: z.coerce.number().min(0).max(100),
  depreciationYears: z.coerce.number().int().min(1).max(50),
  discountRatePct: z.coerce.number().min(-99).max(100),
  committedCapital: nonnegative,
});

export const createModelSchema = z.object({
  name: z.string().trim().min(2).max(160),
  scenarioType: z.enum(["base", "conservative", "optimistic", "lender_case", "investor_case", "p50", "p90", "custom"]).default("base"),
  inputs: financeInputsSchema,
});

export const sensitivitySchema = z.object({
  modelVersionId: z.uuid(),
  rowVariable: z.enum(["projectCost", "annualGenerationKwh", "ppaRatePerKwh", "annualOpex", "debtInterestPct"]),
  columnVariable: z.enum(["projectCost", "annualGenerationKwh", "ppaRatePerKwh", "annualOpex", "debtInterestPct"]),
  rowDeltasPct: z.array(z.coerce.number().min(-90).max(300)).min(1).max(11),
  columnDeltasPct: z.array(z.coerce.number().min(-90).max(300)).min(1).max(11),
});

export const capitalPartnerSchema = z.object({
  name: z.string().trim().min(2).max(200),
  partnerType: z.enum(["bank", "credit_union", "cib", "infrastructure_fund", "family_office", "tax_credit_buyer", "grant_funder", "other"]),
  website: z.url().nullable().optional(),
  strategyNotes: z.string().trim().max(5000).nullable().optional(),
  status: z.enum(["prospect", "contacted", "diligence", "active", "inactive", "declined"]).default("prospect"),
});
