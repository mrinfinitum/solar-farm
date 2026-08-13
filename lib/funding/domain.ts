import type {
  FundingMilestone, FundingQuestion, FundingRequirement, FundingTask,
  NextBestAction, ReadinessResult,
} from "@/lib/funding/types";

const completeStatuses = new Set(["complete", "not-applicable"]);

export function calculateReadiness(requirements: FundingRequirement[]): ReadinessResult {
  if (!requirements.length) return { state: "not-configured", percentage: null, completed: 0, total: 0, blockers: [] };
  const applicable = requirements.filter((item) => item.required && item.status !== "not-applicable");
  if (!applicable.length) return { state: "not-applicable", percentage: null, completed: 0, total: 0, blockers: [] };
  const completed = applicable.filter((item) => item.status === "complete").length;
  const blockers = applicable.filter((item) => item.blocking && !completeStatuses.has(item.status));
  return {
    state: "configured",
    percentage: Math.round((completed / applicable.length) * 100),
    completed,
    total: applicable.length,
    blockers,
  };
}

export function calculateCategoryReadiness(requirements: FundingRequirement[]) {
  const categories = new Map<string, FundingRequirement[]>();
  for (const requirement of requirements) {
    const values = categories.get(requirement.category) ?? [];
    values.push(requirement);
    categories.set(requirement.category, values);
  }
  return Object.fromEntries([...categories].map(([category, values]) => [category, calculateReadiness(values)]));
}

export function calculateDataConfidence(requirements: FundingRequirement[]): ReadinessResult {
  if (!requirements.length) return { state: "not-configured", percentage: null, completed: 0, total: 0, blockers: [] };
  const applicable = requirements.filter((item) => item.required && item.status !== "not-applicable");
  if (!applicable.length) return { state: "not-applicable", percentage: null, completed: 0, total: 0, blockers: [] };
  const completed = applicable.filter((item) =>
    item.confirmation_state === "source-verified" || Boolean(item.verified_at && (item.source_url || item.source_title)),
  ).length;
  return { state: "configured", percentage: Math.round(completed / applicable.length * 100), completed, total: applicable.length, blockers: [] };
}

const dateValue = (value: string | null | undefined) => value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
const unfinished = (status: string) => !["complete", "not-applicable", "closed", "accepted", "paid", "denied"].includes(status);

export function deriveNextBestAction(input: {
  requirements: FundingRequirement[];
  questions: FundingQuestion[];
  milestones: FundingMilestone[];
  tasks: FundingTask[];
  today?: Date;
}): NextBestAction {
  const today = input.today ?? new Date();
  const day = today.toISOString().slice(0, 10);
  const overdue = input.requirements
    .filter((item) => item.blocking && unfinished(item.status) && item.due_date && item.due_date < day)
    .sort((a, b) => dateValue(a.due_date) - dateValue(b.due_date))[0];
  if (overdue) return { kind: "requirement", title: overdue.title, reason: "This blocking requirement is overdue.", dueDate: overdue.due_date };

  const blocker = input.requirements
    .filter((item) => item.required && item.blocking && unfinished(item.status))
    .sort((a, b) => {
      const registrationPriority = (item: FundingRequirement) => item.requirement_key === "sam-registration-active" ? 0 : 1;
      return registrationPriority(a) - registrationPriority(b) || a.sort_order - b.sort_order;
    })[0];
  if (blocker?.requirement_key === "sam-registration-active") return {
    kind: "requirement",
    title: "Monitor SAM.gov registration for activation",
    reason: "NSoul LLC's Financial Assistance registration has been submitted. Confirm Active status before treating the federal-registration requirement as complete.",
    dueDate: blocker.due_date,
  };
  if (blocker) return { kind: "requirement", title: blocker.title, reason: "This is the next incomplete blocking requirement in the current internal checklist.", dueDate: blocker.due_date };

  const question = input.questions.filter((item) => unfinished(item.status)).sort((a, b) => dateValue(a.due_date) - dateValue(b.due_date))[0];
  if (question) return { kind: "question", title: question.question, reason: "An open agency question requires a response.", dueDate: question.due_date };

  const milestone = input.milestones.filter((item) => unfinished(item.status)).sort((a, b) => dateValue(a.target_date) - dateValue(b.target_date) || a.sort_order - b.sort_order)[0];
  if (milestone) return { kind: "milestone", title: milestone.title, reason: "This is the next incomplete program milestone.", dueDate: milestone.target_date };

  const task = input.tasks.filter((item) => unfinished(item.status)).sort((a, b) => dateValue(a.due_date ?? a.target_date) - dateValue(b.due_date ?? b.target_date))[0];
  if (task) return { kind: "task", title: task.title ?? task.task_name ?? "Open funding task", reason: "This is the next linked project task.", dueDate: task.due_date ?? task.target_date ?? null };

  return { kind: "complete", title: "Review current USDA guidance", reason: "No open project workflow item is configured. Re-verify the program before submission.", dueDate: null };
}

export function calculateReimbursementSummary(rows: Array<{ requested_amount: number | null; approved_amount: number | null; paid_amount: number | null; status: string }>) {
  return rows.reduce((summary, row) => ({
    requested: summary.requested + Number(row.requested_amount ?? 0),
    approved: summary.approved + Number(row.approved_amount ?? 0),
    paid: summary.paid + Number(row.paid_amount ?? 0),
    open: summary.open + (row.status === "paid" || row.status === "denied" ? 0 : 1),
  }), { requested: 0, approved: 0, paid: 0, open: 0 });
}

export function calculatePortfolioFundingTotals(sources: Array<{ status: string; approved_amount: number | null; funded_amount: number | null; reimbursement_received: number | null }>) {
  const count = (statuses: string[]) => sources.filter((source) => statuses.includes(source.status)).length;
  return {
    activeSources: sources.filter((source) => !["archived", "denied", "withdrawn", "completed"].includes(source.status)).length,
    preparing: count(["planning", "pre-application", "preparing", "ready-to-submit"]),
    submitted: count(["submitted"]),
    underReview: count(["under-review", "information-requested"]),
    approved: count(["approved", "conditionally-approved", "closed", "reimbursement", "completed"]),
    awardedFunding: sources.reduce((sum, source) => sum + Number(source.approved_amount ?? 0), 0),
    funded: sources.reduce((sum, source) => sum + Number(source.funded_amount ?? 0), 0),
    reimbursementReceived: sources.reduce((sum, source) => sum + Number(source.reimbursement_received ?? 0), 0),
  };
}
