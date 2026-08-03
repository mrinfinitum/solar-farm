export const PROJECT_STAGES = [
  "prospect", "site_control", "utility_screening", "interconnection_application",
  "preliminary_engineering", "offtaker_development", "ppa_negotiation", "permitting",
  "financing", "procurement", "construction", "commissioning", "operating",
  "repowering", "decommissioning", "suspended", "cancelled",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const PROJECT_HEALTH_VALUES = ["on_track", "attention", "at_risk", "blocked", "unknown"] as const;
export type ProjectHealth = (typeof PROJECT_HEALTH_VALUES)[number];

export const INTERCONNECTION_STATUSES = [
  "not_started", "screening", "preparing_application", "submitted", "feasibility_study",
  "system_impact_study", "facilities_study", "agreement_negotiation", "approved",
  "withdrawn", "rejected", "suspended", "unknown",
] as const;

export const OFFTAKER_STAGES = [
  "identified", "researched", "contacted", "discovery", "data_requested", "data_received",
  "qualified", "pricing_review", "loi", "term_sheet", "ppa_negotiation", "committed",
  "declined", "paused",
] as const;

export const PPA_STATUSES = [
  "concept", "indicative", "term_sheet_draft", "term_sheet_issued", "term_sheet_accepted",
  "legal_drafting", "negotiation", "execution_ready", "executed", "terminated", "expired",
] as const;

export type GateRecord = { required: boolean; satisfied: boolean; label: string };
export type HealthInputs = {
  unresolvedCriticalBlockers: number;
  unresolvedHighBlockers: number;
  overdueCriticalMilestones: number;
  siteControlExpiresWithinDays?: number | null;
  financingGap?: number;
  permitDelays?: number;
  epcBudgetVariancePct?: number | null;
  constructionScheduleVarianceDays?: number | null;
};

export function evaluateStageGates(gates: GateRecord[]) {
  const failed = gates.filter((gate) => gate.required && !gate.satisfied);
  return { canAdvance: failed.length === 0, failed };
}

export function canOverrideStageGate(role: string, reason?: string | null, decisionId?: string | null) {
  return ["owner", "admin"].includes(role) && Boolean(reason?.trim()) && Boolean(decisionId);
}

export function determineProjectHealth(input: HealthInputs): { health: ProjectHealth; factors: string[] } {
  const factors: string[] = [];
  if (input.unresolvedCriticalBlockers > 0) factors.push("Unresolved critical blocker");
  if (input.overdueCriticalMilestones > 0) factors.push("Overdue critical milestone");
  if (input.siteControlExpiresWithinDays != null && input.siteControlExpiresWithinDays <= 60) factors.push("Site control nearing expiration");
  if ((input.financingGap || 0) > 0) factors.push("Capital gap remains");
  if ((input.permitDelays || 0) > 0) factors.push("Permit action overdue");
  if ((input.epcBudgetVariancePct || 0) >= 10) factors.push("EPC budget variance exceeds 10%");
  if ((input.constructionScheduleVarianceDays || 0) >= 30) factors.push("Construction schedule variance exceeds 30 days");
  if (input.unresolvedCriticalBlockers > 0) return { health: "blocked", factors };
  if (input.overdueCriticalMilestones > 0 || (input.financingGap || 0) > 0 || (input.constructionScheduleVarianceDays || 0) >= 30) return { health: "at_risk", factors };
  if (input.unresolvedHighBlockers > 0 || factors.length > 0) return { health: "attention", factors };
  return { health: "on_track", factors };
}

export type CapitalItem = { amount: number; status: string; capitalType: string };

export function calculateCapitalStack(projectCost: number, items: CapitalItem[]) {
  const committedItems = items.filter((item) => ["committed", "closed"].includes(item.status));
  const committedCapital = committedItems.reduce((sum, item) => sum + item.amount, 0);
  const uncommittedCapital = items.filter((item) => !["committed", "closed", "declined", "withdrawn"].includes(item.status)).reduce((sum, item) => sum + item.amount, 0);
  const debtTypes = new Set(["construction_debt", "permanent_debt", "equipment_financing", "bridge_financing", "loan_guarantee"]);
  const equityTypes = new Set(["sponsor_equity", "investor_equity", "tax_equity"]);
  const incentiveTypes = new Set(["grant", "rebate", "tax_credit_transfer_proceeds"]);
  const totalOf = (types: Set<string>) => committedItems.filter((item) => types.has(item.capitalType)).reduce((sum, item) => sum + item.amount, 0);
  const percentage = (amount: number) => projectCost > 0 ? Math.round((amount / projectCost) * 10_000) / 100 : 0;
  return {
    totalProjectCost: projectCost,
    committedCapital,
    uncommittedCapital,
    capitalGap: Math.max(projectCost - committedCapital, 0),
    debtPercentage: percentage(totalOf(debtTypes)),
    equityPercentage: percentage(totalOf(equityTypes)),
    incentivePercentage: percentage(totalOf(incentiveTypes)),
    fullyFinanced: projectCost > 0 && committedCapital >= projectCost,
  };
}

export function canMarkPpaExecuted(input: { status: string; signedDocumentId?: string | null; executedConfirmation?: boolean }) {
  return input.status !== "executed" || (Boolean(input.signedDocumentId) && input.executedConfirmation === true);
}

export function isProjectOperator(role: string) {
  return ["owner", "admin", "developer"].includes(role);
}

export function canEditAnalysis(role: string) {
  return ["owner", "admin", "developer", "analyst"].includes(role);
}

export function titleCaseStatus(value?: string | null) {
  if (!value) return "Unknown";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
