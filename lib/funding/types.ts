export type FundingRequirementStatus =
  | "not-started" | "in-progress" | "waiting" | "complete"
  | "not-applicable" | "blocked" | "needs-review";

export interface FundingRequirement {
  id: string;
  funding_source_id: string;
  category: string;
  requirement_key: string;
  title: string;
  description: string | null;
  status: FundingRequirementStatus;
  required: boolean;
  blocking: boolean;
  confirmation_state: "internal-preparation" | "source-verified" | "needs-program-confirmation";
  due_date: string | null;
  completed_at: string | null;
  verified_at: string | null;
  source_url: string | null;
  source_title: string | null;
  source_verified_date: string | null;
  linked_document_id: string | null;
  linked_task_id: string | null;
  notes: string | null;
  sort_order: number;
}

export interface FundingSource {
  id: string;
  project_id: string;
  funding_type: string;
  program_name: string;
  provider_name: string | null;
  status: string;
  requested_amount: number | null;
  estimated_amount: number | null;
  approved_amount: number | null;
  funded_amount: number | null;
  reimbursement_received: number | null;
  reimbursement_remaining: number | null;
  application_number: string | null;
  application_deadline: string | null;
  submitted_at: string | null;
  notes: string | null;
  program_template_id: string | null;
  primary_contact_id: string | null;
  archived_at: string | null;
}

export interface FederalRegistrationStatus {
  id: string;
  organization_id: string;
  entity_name: string;
  registration_system: string;
  registration_type: string;
  uei_status: "not-recorded" | "assigned" | "needs-review";
  registration_status: "not-started" | "in-progress" | "submitted-pending-activation" | "active" | "expired" | "rejected" | "needs-review";
  submission_date: string | null;
  activation_confirmed_at: string | null;
  renewal_date: string | null;
  purpose: string | null;
  primary_program: string | null;
  official_source_url: string | null;
  primary_project_id: string | null;
  primary_funding_source_id: string | null;
}

export interface FundingQuestion {
  id: string;
  question: string;
  status: string;
  due_date: string | null;
  received_at: string;
}

export interface FundingMilestone {
  id: string;
  phase: string;
  title: string;
  description: string | null;
  status: string;
  target_date: string | null;
  completed_date: string | null;
  sort_order: number;
}

export interface FundingTask {
  id: string;
  title?: string;
  task_name?: string;
  status: string;
  due_date?: string | null;
  target_date?: string | null;
  priority?: string | null;
}

export interface ReadinessResult {
  state: "configured" | "not-configured" | "not-applicable";
  percentage: number | null;
  completed: number;
  total: number;
  blockers: FundingRequirement[];
}

export interface NextBestAction {
  kind: "requirement" | "question" | "milestone" | "task" | "complete";
  title: string;
  reason: string;
  dueDate: string | null;
  href?: string;
}
