import type { ProjectHealth, ProjectStage } from "@/lib/projects/domain";

export interface ProjectPortfolioRecord {
  id: string;
  project_code: string;
  project_name: string;
  project_stage: ProjectStage;
  project_health: ProjectHealth;
  location: string | null;
  county: string | null;
  proposed_capacity_mw_dc: number | null;
  proposed_capacity_mw_ac: number | null;
  target_operation_date: string | null;
  target_cod: string | null;
  utility: string | null;
  interconnection_status: string | null;
  offtaker_status: string | null;
  financing_status: string | null;
  current_budget: number | null;
  committed_capital: number;
  project_lead_id: string | null;
  assigned_to: string | null;
  updated_at: string;
  archived_at: string | null;
  project_milestones?: Array<Record<string, unknown>>;
  project_blockers?: Array<Record<string, unknown>>;
  profiles?: { full_name: string | null } | null;
}

export interface ProjectCommandData extends ProjectPortfolioRecord {
  summary: string | null;
  development_summary: string | null;
  site_control_status: string | null;
  engineering_status: string | null;
  permitting_status: string | null;
  construction_status: string | null;
  potential_incentives: number;
  confirmed_incentives: number;
  project_stage_gates: Array<Record<string, unknown>>;
  interconnection_requests: Array<Record<string, unknown>>;
  engineering_engagements: Array<Record<string, unknown>>;
  engineering_deliverables: Array<Record<string, unknown>>;
  project_design_versions: Array<Record<string, unknown>>;
  production_models: Array<Record<string, unknown>>;
  epc_proposals: Array<Record<string, unknown>>;
  epc_proposal_comparisons: Array<Record<string, unknown>>;
  offtaker_opportunities: Array<Record<string, unknown>>;
  offtaker_outreach: Array<Record<string, unknown>>;
  ppa_scenarios: Array<Record<string, unknown>>;
  permit_requirements: Array<Record<string, unknown>>;
  diligence_items: Array<Record<string, unknown>>;
  project_budget_versions: Array<Record<string, unknown>>;
  project_cost_estimates: Array<Record<string, unknown>>;
  capital_stack_versions: Array<Record<string, unknown>>;
  capital_stack_items: Array<Record<string, unknown>>;
  financial_model_versions: Array<Record<string, unknown>>;
  construction_progress_updates: Array<Record<string, unknown>>;
  operating_assets: Array<Record<string, unknown>>;
  project_incentives: Array<Record<string, unknown>>;
  project_blockers: Array<Record<string, unknown>>;
  project_decisions: Array<Record<string, unknown>>;
  project_milestones: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  activity: Array<Record<string, unknown>>;
}
