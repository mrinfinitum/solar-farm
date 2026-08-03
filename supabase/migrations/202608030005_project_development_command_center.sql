-- Sprint 4: Project Development Command Center.
-- Additive normalization over the property-promotion and tenant-security foundations.

alter table public.projects
  add column if not exists project_health text not null default 'unknown',
  add column if not exists health_override text,
  add column if not exists health_override_reason text,
  add column if not exists health_overridden_by uuid references public.profiles(id) on delete set null,
  add column if not exists health_overridden_at timestamptz,
  add column if not exists stage_entered_at timestamptz not null default now(),
  add column if not exists target_operation_date date,
  add column if not exists project_lead_id uuid references public.profiles(id) on delete set null,
  add column if not exists current_blocker_id uuid,
  add column if not exists current_budget numeric(16,2),
  add column if not exists committed_capital numeric(16,2) not null default 0,
  add column if not exists confirmed_incentives numeric(16,2) not null default 0,
  add column if not exists potential_incentives numeric(16,2) not null default 0;

alter table public.projects drop constraint if exists projects_stage_check;
update public.projects set project_stage = case
  when project_stage in ('development','project_development') then 'utility_screening'
  when project_stage in ('planning','candidate') then 'prospect'
  else project_stage end;
alter table public.projects add constraint projects_stage_check check (project_stage in (
  'prospect','site_control','utility_screening','interconnection_application','preliminary_engineering',
  'offtaker_development','ppa_negotiation','permitting','financing','procurement','construction',
  'commissioning','operating','repowering','decommissioning','suspended','cancelled'
));
alter table public.projects drop constraint if exists projects_health_check;
alter table public.projects add constraint projects_health_check check (project_health in ('on_track','attention','at_risk','blocked','unknown'));
alter table public.projects drop constraint if exists projects_health_override_check;
alter table public.projects add constraint projects_health_override_check check (health_override is null or health_override in ('on_track','attention','at_risk','blocked','unknown'));

create table public.project_stage_history (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade, from_stage text, to_stage text not null,
  changed_by uuid references public.profiles(id) on delete set null, reason text, gate_snapshot jsonb not null default '[]',
  override_used boolean not null default false, override_reason text, supporting_decision_id uuid,
  created_at timestamptz not null default now()
);
create table public.project_health_history (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade, prior_health text, calculated_health text not null,
  effective_health text not null, factors jsonb not null default '[]', manual_override boolean not null default false,
  override_reason text, changed_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create table public.project_stage_gates (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade, from_stage text not null, to_stage text not null,
  gate_key text not null, label text not null, required boolean not null default true, satisfied boolean not null default false,
  evidence_document_id uuid references public.documents(id) on delete set null, evidence_note text,
  satisfied_by uuid references public.profiles(id) on delete set null, satisfied_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique (organization_id, project_id, from_stage, to_stage, gate_key)
);
create table public.project_blockers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade, title text not null, category text not null default 'other', severity text not null default 'medium',
  description text, assigned_to uuid references public.profiles(id) on delete set null, opened_date date not null default current_date,
  target_resolution_date date, status text not null default 'open', resolution text, resolved_date date,
  supporting_documents jsonb not null default '[]', created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  check (category in ('land','utility','engineering','environmental','permitting','commercial','financing','legal','construction','operations','other')),
  check (severity in ('low','medium','high','critical')), check (status in ('open','monitoring','resolved','accepted','cancelled'))
);
create table public.project_decisions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade, decision_title text not null, decision_date date not null default current_date,
  decision_owner uuid references public.profiles(id) on delete set null, options_considered jsonb not null default '[]', selected_option text not null,
  rationale text not null, financial_impact text, schedule_impact text, risk_impact text, supporting_documents jsonb not null default '[]', related_records jsonb not null default '[]',
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create table public.project_assumptions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade, category text not null, assumption_key text not null, value jsonb not null,
  source text, confidence text not null default 'unknown', verified_at timestamptz, assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  check (confidence in ('verified','high','medium','low','unknown'))
);
create table public.project_team_members (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  project_role text not null, is_lead boolean not null default false, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique (organization_id, project_id, user_id, project_role)
);
alter table public.projects add constraint projects_current_blocker_fk foreign key (current_blocker_id) references public.project_blockers(id) on delete set null;

alter table public.project_milestones
  add column if not exists organization_id uuid references public.organizations(id) on delete restrict,
  add column if not exists project_stage text,
  add column if not exists critical_path boolean not null default false,
  add column if not exists dependency_id uuid references public.project_milestones(id) on delete set null,
  add column if not exists related_deliverable_id uuid,
  add column if not exists blocker_status text not null default 'clear',
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists archived_at timestamptz;
update public.project_milestones milestone set organization_id = project.organization_id from public.projects project where project.id = milestone.project_id and milestone.organization_id is null;
alter table public.project_milestones alter column organization_id set default public.current_organization_id();
alter table public.project_milestones alter column organization_id set not null;

create table public.utilities (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  name text not null, service_territory text, website text, notes text, status text not null default 'active', assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique (organization_id, name)
);
create table public.utility_contacts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  utility_id uuid not null references public.utilities(id) on delete cascade, contact_id uuid references public.contacts(id) on delete set null,
  name text, title text, email text, phone text, notes text, status text not null default 'active', assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create table public.interconnection_requests (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade, utility_id uuid references public.utilities(id) on delete set null,
  service_territory text, request_type text, requested_capacity_mw numeric(10,3), submitted_capacity_mw numeric(10,3), application_number text,
  point_of_interconnection text, submission_date date, deposit numeric(16,2), study_phase text, queue_position text,
  utility_response text, estimated_upgrade_cost numeric(16,2), final_upgrade_cost numeric(16,2), expected_timeline text,
  status text not null default 'not_started', assigned_contact_id uuid references public.utility_contacts(id) on delete set null,
  next_action text, next_action_date date, evidence_level text not null default 'nearby_infrastructure', assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  check (status in ('not_started','screening','preparing_application','submitted','feasibility_study','system_impact_study','facilities_study','agreement_negotiation','approved','withdrawn','rejected','suspended','unknown')),
  check (evidence_level in ('nearby_infrastructure','preliminary_utility_feedback','formal_study_result','executed_interconnection_agreement'))
);
create table public.interconnection_status_history (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade, interconnection_request_id uuid not null references public.interconnection_requests(id) on delete cascade,
  from_status text, to_status text not null, note text, changed_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);

-- Key versioned engineering, commercial, diligence, finance, incentive, construction, and operations records.
create table public.engineering_engagements (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  engineering_firm text not null, status text not null default 'planned', scope text, start_date date, target_completion date, approved_design_version_id uuid,
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create table public.engineering_deliverables (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  engagement_id uuid references public.engineering_engagements(id) on delete cascade, deliverable_type text not null, title text not null, status text not null default 'not_started', target_date date, delivered_date date, document_id uuid references public.documents(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  check (deliverable_type in ('site_layout','production_model','single_line_diagram','equipment_schedule','civil_plan','grading_plan','drainage_plan','geotechnical_report','structural_design','interconnection_package','construction_drawings','as_built_drawings','other'))
);
create table public.project_design_versions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  version_number integer not null, status text not null default 'draft', target_mw_dc numeric(10,3), target_mw_ac numeric(10,3), dc_ac_ratio numeric(7,3), mounting_type text, storage_option text,
  module_assumptions jsonb not null default '{}', inverter_assumptions jsonb not null default '{}', racking_assumptions jsonb not null default '{}', civil_assumptions jsonb not null default '{}',
  approved_by uuid references public.profiles(id) on delete set null, approved_at timestamptz, assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz, unique (organization_id, project_id, version_number)
);
create table public.production_models (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  design_version_id uuid references public.project_design_versions(id) on delete set null, version_number integer not null, status text not null default 'preliminary', year_one_generation_kwh numeric(18,2), annual_degradation_pct numeric(7,4), system_loss_pct numeric(7,4), model_source text, lender_acceptable boolean not null default false,
  assumptions jsonb not null default '{}', assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz, unique (organization_id, project_id, version_number)
);
create table public.equipment_scenarios (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  name text not null, status text not null default 'concept', module text, inverter text, racking text, storage text, capacity_mw_dc numeric(10,3), capacity_mw_ac numeric(10,3), notes text,
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create table public.epc_vendors (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  name text not null, contact_id uuid references public.contacts(id) on delete set null, qualification_status text not null default 'unreviewed', notes text, assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz, unique (organization_id, name)
);
create table public.epc_proposals (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  vendor_id uuid not null references public.epc_vendors(id) on delete restrict, version_number integer not null, status text not null default 'received', total_epc_cost numeric(16,2), cost_per_watt_dc numeric(10,4), cost_per_watt_ac numeric(10,4), contingency numeric(16,2), schedule_summary text,
  exclusions jsonb not null default '[]', allowances jsonb not null default '[]', equipment jsonb not null default '{}', warranty text, liquidated_damages text, bonding text, om_offering text,
  interconnection_scope text, civil_scope text, escalation_assumptions text, proposal_expiration date, document_id uuid references public.documents(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique (organization_id, project_id, vendor_id, version_number)
);
create table public.epc_proposal_comparisons (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  name text not null, proposal_ids uuid[] not null default '{}', recommendation text, recommendation_rationale text, selected_proposal_id uuid references public.epc_proposals(id) on delete set null,
  decision_id uuid references public.project_decisions(id) on delete set null, status text not null default 'draft', assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);

create table public.companies (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  name text not null, company_type text not null default 'other', industry text, website text, address text, city text, county text, state text, notes text,
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique (organization_id, name)
);
create table public.offtaker_opportunities (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null, contact_id uuid references public.contacts(id) on delete set null, facility text, location text, industry text,
  estimated_annual_usage_kwh numeric(18,2), peak_demand_kw numeric(14,2), monthly_electricity_spend numeric(16,2), current_utility text, current_rate numeric(10,5),
  contract_authority text, credit_review_status text not null default 'not_started', interest_level text not null default 'unknown', status text not null default 'identified', next_action text,
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  check (status in ('identified','researched','contacted','discovery','data_requested','data_received','qualified','pricing_review','loi','term_sheet','ppa_negotiation','committed','declined','paused'))
);
create table public.offtaker_outreach (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  opportunity_id uuid not null references public.offtaker_opportunities(id) on delete cascade, outreach_type text not null, occurred_at timestamptz not null default now(), summary text not null, follow_up text, follow_up_date date, document_ids uuid[] not null default '{}',
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  check (outreach_type in ('call','email','meeting','note','follow_up'))
);
create table public.ppa_scenarios (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  opportunity_id uuid references public.offtaker_opportunities(id) on delete set null, version_number integer not null, term_years integer, starting_price_per_kwh numeric(10,5), annual_escalator_pct numeric(7,4), contracted_energy_kwh numeric(18,2), minimum_purchase_obligation text,
  delivery_structure text, rec_ownership text, credit_support text, security_deposit numeric(16,2), early_termination_terms text, purchase_option text, renewal_option text, expected_start_date date,
  status text not null default 'concept', legal_review_status text not null default 'not_started', executed_confirmation boolean not null default false, signed_document_id uuid references public.documents(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique (organization_id, project_id, version_number),
  check (status in ('concept','indicative','term_sheet_draft','term_sheet_issued','term_sheet_accepted','legal_drafting','negotiation','execution_ready','executed','terminated','expired')),
  check (status <> 'executed' or (executed_confirmation and signed_document_id is not null))
);
create table public.ppa_status_history (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  ppa_scenario_id uuid not null references public.ppa_scenarios(id) on delete cascade, from_status text, to_status text not null, note text,
  changed_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);

create table public.permit_requirements (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  requirement_type text not null, responsible_agency text, status text not null default 'not_started', application_number text, due_date date, submission_date date, approval_date date, expiration_date date,
  cost numeric(16,2), conditions text, notes text, assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create table public.diligence_items (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  diligence_type text not null, title text not null, status text not null default 'not_started', due_date date, completed_date date, findings text, risk_level text not null default 'unknown', document_ids uuid[] not null default '{}',
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);

create table public.project_budget_versions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  version_number integer not null, name text not null, status text not null default 'draft', total_project_cost numeric(16,2) not null default 0, approved_by uuid references public.profiles(id) on delete set null, approved_at timestamptz,
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique (organization_id, project_id, version_number)
);
create table public.project_cost_estimates (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  budget_version_id uuid references public.project_budget_versions(id) on delete cascade, category text not null, base_estimate numeric(16,2) not null default 0, current_estimate numeric(16,2) not null default 0,
  committed_amount numeric(16,2) not null default 0, paid_amount numeric(16,2) not null default 0, source text, estimate_date date, confidence text not null default 'unknown', notes text,
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create table public.capital_stack_versions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  version_number integer not null, name text not null, status text not null default 'draft', approved_project_cost numeric(16,2) not null default 0,
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique (organization_id, project_id, version_number)
);
create table public.capital_stack_items (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  capital_stack_version_id uuid not null references public.capital_stack_versions(id) on delete cascade, capital_type text not null, source text, amount numeric(16,2) not null default 0, percentage_of_total numeric(7,3), status text not null default 'concept', expected_close_date date,
  conditions text, interest_rate numeric(7,4), term_months integer, lender_or_investor text, document_ids uuid[] not null default '{}', notes text,
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  check (capital_type in ('sponsor_equity','investor_equity','construction_debt','permanent_debt','tax_credit_transfer_proceeds','tax_equity','grant','rebate','loan_guarantee','seller_financing','equipment_financing','bridge_financing','other')),
  check (status in ('concept','researching','contacted','application','diligence','term_sheet','committed','closed','declined','withdrawn'))
);
create table public.financial_model_versions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  version_number integer not null, name text not null, status text not null default 'draft', inputs jsonb not null default '{}', outputs jsonb not null default '{}', assumptions_disclaimer text not null default 'Preliminary model; not tax, legal, investment, or accounting advice.',
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique (organization_id, project_id, version_number)
);
create table public.incentive_programs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  name text not null, program_type text not null, authority text, verification_source text, last_verified_date date, requires_current_verification boolean not null default true,
  not_professional_advice boolean not null default true, status text not null default 'review_required', created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz, unique (organization_id, name)
);
create table public.project_incentives (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  incentive_program_id uuid not null references public.incentive_programs(id) on delete restrict, eligibility_status text not null default 'unverified', application_status text not null default 'not_started',
  estimated_value numeric(16,2), confirmed_value numeric(16,2), deadline date, missing_requirements jsonb not null default '[]', next_action text, verification_source text, last_verified_date date,
  assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade, notification_type text not null, title text not null, body text, due_at timestamptz, read_at timestamptz, source_table text, source_id uuid,
  status text not null default 'unread', created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique (organization_id, notification_type, source_table, source_id, user_id)
);

-- The remaining requested modules use a canonical flexible foundation in Sprint 4.
-- Module-specific payload remains versioned/auditable while later sprints can promote
-- stable fields without data loss.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'interconnection_milestones','interconnection_documents','interconnection_cost_estimates','interconnection_requirements',
    'epc_cost_items','operations_maintenance_proposals','offtaker_energy_profiles','letters_of_intent','ppa_term_sheets','ppa_negotiations','ppa_documents',
    'permit_applications','permit_status_history','environmental_reviews','title_reviews','surveys','geotechnical_reviews','zoning_reviews',
    'funding_sources','lender_opportunities','investor_opportunities','financing_requirements','financing_status_history','financial_assumptions',
    'incentive_applications','incentive_requirements','incentive_deadlines','incentive_documents',
    'construction_contracts','construction_milestones','construction_progress_updates','change_orders','commissioning_checklists',
    'operating_assets','maintenance_events','production_readings','operating_incidents'
  ] loop
    execute format('create table public.%I (
      id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
      project_id uuid not null references public.projects(id) on delete cascade, title text not null, status text not null default ''not_started'',
      record_type text, effective_date date, due_date date, amount numeric(16,2), details jsonb not null default ''{}'', document_id uuid references public.documents(id) on delete set null,
      assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
    )', table_name);
  end loop;
end $$;

-- Expand existing document records for project operations without weakening private storage.
alter table public.documents
  add column if not exists document_category text,
  add column if not exists version_number integer not null default 1,
  add column if not exists expires_at timestamptz,
  add column if not exists is_signed boolean not null default false,
  add column if not exists document_status text not null default 'draft',
  add column if not exists linked_records jsonb not null default '[]';
alter table public.documents drop constraint if exists document_type_valid;
alter table public.documents add constraint document_type_valid check (document_type in (
  'listing','aerial','parcel-map','survey','title','deed','zoning','utility','interconnection','environmental','flood','wetlands','soil','engineering','production-model','EPC-quote','PPA','financing','grant','correspondence','photograph',
  'land','permitting','EPC','off_taker','finance','investor','incentive','insurance','construction','commissioning','operations','legal','other'
));

-- Status histories are append-only and created by trusted triggers.
create or replace function public.record_interconnection_status_change()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if old.status is distinct from new.status then
    insert into public.interconnection_status_history(organization_id,project_id,interconnection_request_id,from_status,to_status,changed_by)
    values(new.organization_id,new.project_id,new.id,old.status,new.status,auth.uid());
  end if;
  return new;
end $$;
create trigger interconnection_status_history_trigger after update of status on public.interconnection_requests for each row execute function public.record_interconnection_status_change();

create or replace function public.record_ppa_status_change()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if old.status is distinct from new.status then
    insert into public.ppa_status_history(organization_id,project_id,ppa_scenario_id,from_status,to_status,changed_by)
    values(new.organization_id,new.project_id,new.id,old.status,new.status,auth.uid());
  end if;
  return new;
end $$;
create trigger ppa_status_history_trigger after update of status on public.ppa_scenarios for each row execute function public.record_ppa_status_change();

create or replace function public.seed_project_stage_gates(target_project_id uuid, target_organization_id uuid, actor_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.project_stage_gates(organization_id,project_id,from_stage,to_stage,gate_key,label,created_by)
  values
    (target_organization_id,target_project_id,'utility_screening','interconnection_application','utility_identified','Utility identified',actor_id),
    (target_organization_id,target_project_id,'utility_screening','interconnection_application','utility_contact','Utility contact established',actor_id),
    (target_organization_id,target_project_id,'utility_screening','interconnection_application','site_layout','Preliminary site layout available',actor_id),
    (target_organization_id,target_project_id,'utility_screening','interconnection_application','capacity_defined','Initial project capacity defined',actor_id),
    (target_organization_id,target_project_id,'utility_screening','interconnection_application','screening_documented','Screening request documented',actor_id),
    (target_organization_id,target_project_id,'interconnection_application','preliminary_engineering','application_submitted','Application submitted',actor_id),
    (target_organization_id,target_project_id,'interconnection_application','preliminary_engineering','application_number','Application number recorded',actor_id),
    (target_organization_id,target_project_id,'interconnection_application','preliminary_engineering','deposit_recorded','Required deposit recorded',actor_id),
    (target_organization_id,target_project_id,'interconnection_application','preliminary_engineering','study_status','Utility study status known',actor_id),
    (target_organization_id,target_project_id,'offtaker_development','ppa_negotiation','offtaker_identified','Target off-taker identified',actor_id),
    (target_organization_id,target_project_id,'offtaker_development','ppa_negotiation','energy_use','Energy-use information recorded',actor_id),
    (target_organization_id,target_project_id,'offtaker_development','ppa_negotiation','pricing_approved','Preliminary pricing scenario approved',actor_id),
    (target_organization_id,target_project_id,'offtaker_development','ppa_negotiation','credit_review','Credit-review status recorded',actor_id),
    (target_organization_id,target_project_id,'offtaker_development','ppa_negotiation','commercial_interest','Commercial interest confirmed',actor_id),
    (target_organization_id,target_project_id,'ppa_negotiation','financing','ppa_or_term_sheet','Negotiated PPA or approved term sheet',actor_id),
    (target_organization_id,target_project_id,'ppa_negotiation','financing','production_model','Lender-acceptable production model',actor_id),
    (target_organization_id,target_project_id,'ppa_negotiation','financing','epc_budget','EPC budget recorded',actor_id),
    (target_organization_id,target_project_id,'ppa_negotiation','financing','interconnection_cost','Interconnection cost estimate recorded',actor_id),
    (target_organization_id,target_project_id,'ppa_negotiation','financing','site_control_term','Site control extends through expected close',actor_id),
    (target_organization_id,target_project_id,'ppa_negotiation','financing','financing_model','Financing model complete',actor_id),
    (target_organization_id,target_project_id,'financing','procurement','capital_funded','Capital stack fully funded',actor_id),
    (target_organization_id,target_project_id,'financing','procurement','capital_approvals','Lender or investor approvals recorded',actor_id),
    (target_organization_id,target_project_id,'financing','procurement','epc_executed','Executed EPC agreement',actor_id),
    (target_organization_id,target_project_id,'financing','procurement','permits_sufficient','Permits sufficient for procurement',actor_id),
    (target_organization_id,target_project_id,'financing','procurement','insurance_documented','Insurance requirements documented',actor_id)
  on conflict do nothing;
end $$;

create or replace function public.seed_project_stage_gates_trigger()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$ begin
  perform public.seed_project_stage_gates(new.id,new.organization_id,new.created_by); return new;
end $$;
create trigger projects_seed_stage_gates after insert on public.projects for each row execute function public.seed_project_stage_gates_trigger();
select public.seed_project_stage_gates(id,organization_id,created_by) from public.projects;

create or replace function public.advance_project_stage(
  target_project_id uuid, requested_stage text, transition_reason text default null,
  override_reason text default null, supporting_decision uuid default null
) returns public.projects language plpgsql security definer set search_path = public, pg_temp as $$
declare
  project_record public.projects;
  actor_role public.organization_role;
  failed_gates jsonb;
  override_allowed boolean;
  transition_valid boolean;
  override_used boolean;
  prior_stage text;
  stage_order text[] := array['prospect','site_control','utility_screening','interconnection_application','preliminary_engineering','offtaker_development','ppa_negotiation','permitting','financing','procurement','construction','commissioning','operating','repowering','decommissioning'];
begin
  select * into project_record from public.projects where id=target_project_id and organization_id=public.current_organization_id() and archived_at is null for update;
  if project_record.id is null then raise exception 'Project not found'; end if;
  actor_role := public.current_organization_role();
  if actor_role not in ('owner','admin','developer') then raise exception 'Project operation permission required'; end if;
  prior_stage := project_record.project_stage;
  if requested_stage = prior_stage or requested_stage not in ('prospect','site_control','utility_screening','interconnection_application','preliminary_engineering','offtaker_development','ppa_negotiation','permitting','financing','procurement','construction','commissioning','operating','repowering','decommissioning','suspended','cancelled') then
    raise exception 'Invalid project stage transition';
  end if;
  transition_valid := requested_stage in ('suspended','cancelled')
    or array_position(stage_order,requested_stage)=array_position(stage_order,prior_stage)+1
    or (prior_stage='ppa_negotiation' and requested_stage='financing');
  select coalesce(jsonb_agg(jsonb_build_object('gate_key',gate_key,'label',label)),'[]'::jsonb) into failed_gates
  from public.project_stage_gates where project_id=target_project_id and from_stage=project_record.project_stage and to_stage=requested_stage and required and not satisfied and archived_at is null;
  override_allowed := actor_role in ('owner','admin') and nullif(trim(override_reason),'') is not null and supporting_decision is not null;
  if supporting_decision is not null and not exists(
    select 1 from public.project_decisions where id=supporting_decision and project_id=target_project_id
      and organization_id=project_record.organization_id and archived_at is null
  ) then raise exception 'Supporting decision does not belong to this project'; end if;
  if (jsonb_array_length(failed_gates)>0 or not transition_valid) and not override_allowed then
    raise exception 'Required stage gates or transition rules are not satisfied';
  end if;
  override_used := jsonb_array_length(failed_gates)>0 or not transition_valid;
  insert into public.project_stage_history(organization_id,project_id,from_stage,to_stage,changed_by,reason,gate_snapshot,override_used,override_reason,supporting_decision_id)
  values(project_record.organization_id,target_project_id,prior_stage,requested_stage,auth.uid(),transition_reason,failed_gates,override_used,override_reason,supporting_decision);
  perform set_config('app.project_controlled_update','on',true);
  update public.projects set project_stage=requested_stage,stage_entered_at=now(),updated_at=now() where id=target_project_id returning * into project_record;
  insert into public.activity_log(organization_id,actor_id,entity_type,entity_id,action,before_data,after_data)
  values(project_record.organization_id,auth.uid(),'projects',target_project_id,'stage_advanced',jsonb_build_object('stage',prior_stage),jsonb_build_object('stage',requested_stage,'override',override_used));
  return project_record;
end $$;

create or replace function public.recalculate_project_health(target_project_id uuid)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare project_record public.projects; calculated text := 'on_track'; factors jsonb := '[]'; prior text; effective text;
begin
  if public.current_organization_role() not in ('owner','admin','developer') then raise exception 'Project operation permission required'; end if;
  select * into project_record from public.projects where id=target_project_id and organization_id=public.current_organization_id() and archived_at is null for update;
  if project_record.id is null then raise exception 'Project not found'; end if;
  prior := project_record.project_health;
  if exists(select 1 from public.project_blockers where project_id=target_project_id and severity='critical' and status in ('open','monitoring') and archived_at is null) then
    calculated := 'blocked'; factors := factors || jsonb_build_array('unresolved_critical_blocker');
  elsif exists(select 1 from public.project_milestones where project_id=target_project_id and critical_path and status not in ('complete','waived','cancelled') and target_date<current_date and archived_at is null) then
    calculated := 'at_risk'; factors := factors || jsonb_build_array('overdue_critical_milestone');
  elsif exists(select 1 from public.project_blockers where project_id=target_project_id and severity='high' and status in ('open','monitoring') and archived_at is null) then
    calculated := 'attention'; factors := factors || jsonb_build_array('unresolved_high_blocker');
  end if;
  effective := coalesce(project_record.health_override,calculated);
  perform set_config('app.project_controlled_update','on',true);
  update public.projects set project_health=effective,updated_at=now() where id=target_project_id;
  if prior is distinct from effective then
    insert into public.project_health_history(organization_id,project_id,prior_health,calculated_health,effective_health,factors,manual_override,override_reason,changed_by)
    values(project_record.organization_id,target_project_id,prior,calculated,effective,factors,project_record.health_override is not null,project_record.health_override_reason,auth.uid());
  end if;
  return effective;
end $$;

create or replace function public.override_project_health(target_project_id uuid, requested_health text, reason text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare project_record public.projects; prior text;
begin
  if public.current_organization_role() not in ('owner','admin') then raise exception 'Administrator permission required'; end if;
  if requested_health not in ('on_track','attention','at_risk','blocked','unknown') or nullif(trim(reason),'') is null then raise exception 'Valid health and reason are required'; end if;
  select * into project_record from public.projects where id=target_project_id and organization_id=public.current_organization_id() for update;
  if project_record.id is null then raise exception 'Project not found'; end if;
  prior := project_record.project_health;
  perform set_config('app.project_controlled_update','on',true);
  update public.projects set project_health=requested_health,health_override=requested_health,health_override_reason=reason,health_overridden_by=auth.uid(),health_overridden_at=now(),updated_at=now() where id=target_project_id;
  insert into public.project_health_history(organization_id,project_id,prior_health,calculated_health,effective_health,factors,manual_override,override_reason,changed_by)
  values(project_record.organization_id,target_project_id,prior,prior,requested_health,'["manual_override"]',true,reason,auth.uid());
  insert into public.activity_log(organization_id,actor_id,entity_type,entity_id,action,before_data,after_data)
  values(project_record.organization_id,auth.uid(),'projects',target_project_id,'health_overridden',jsonb_build_object('health',prior),jsonb_build_object('health',requested_health,'reason',reason));
  return requested_health;
end $$;

create or replace function public.guard_project_control_fields()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if (old.project_stage is distinct from new.project_stage or old.project_health is distinct from new.project_health)
    and coalesce(current_setting('app.project_controlled_update',true),'off') <> 'on' then
    raise exception 'Project stage and health must be changed through their controlled workflows';
  end if;
  return new;
end $$;
create trigger projects_guard_control_fields before update on public.projects
for each row execute function public.guard_project_control_fields();

create or replace function public.capital_stack_summary(target_version_id uuid)
returns table(total_project_cost numeric,committed_capital numeric,uncommitted_capital numeric,capital_gap numeric,debt_percentage numeric,equity_percentage numeric,incentive_percentage numeric,fully_financed boolean)
language sql stable security invoker set search_path = public, pg_temp as $$
  with version as (select approved_project_cost cost from public.capital_stack_versions where id=target_version_id and organization_id=public.current_organization_id()),
  amounts as (select coalesce(sum(amount) filter(where status in ('committed','closed')),0) committed,
    coalesce(sum(amount) filter(where status not in ('committed','closed','declined','withdrawn')),0) uncommitted,
    coalesce(sum(amount) filter(where capital_type in ('construction_debt','permanent_debt','equipment_financing','bridge_financing','loan_guarantee') and status in ('committed','closed')),0) debt,
    coalesce(sum(amount) filter(where capital_type in ('sponsor_equity','investor_equity','tax_equity') and status in ('committed','closed')),0) equity,
    coalesce(sum(amount) filter(where capital_type in ('grant','rebate','tax_credit_transfer_proceeds') and status in ('committed','closed')),0) incentive
    from public.capital_stack_items where capital_stack_version_id=target_version_id and archived_at is null)
  select version.cost,amounts.committed,amounts.uncommitted,greatest(version.cost-amounts.committed,0),
    case when version.cost>0 then round(amounts.debt/version.cost*100,2) else 0 end,
    case when version.cost>0 then round(amounts.equity/version.cost*100,2) else 0 end,
    case when version.cost>0 then round(amounts.incentive/version.cost*100,2) else 0 end,
    amounts.committed>=version.cost and version.cost>0 from version cross join amounts;
$$;

create or replace function public.refresh_project_notifications()
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare inserted_count integer := 0; affected_rows integer;
begin
  if public.current_organization_id() is null then raise exception 'Active organization required'; end if;
  insert into public.notifications(organization_id,project_id,user_id,notification_type,title,body,due_at,source_table,source_id)
  select milestone.organization_id,milestone.project_id,milestone.assigned_to,'milestone_due','Critical milestone due: '||milestone.task_name,
    milestone.task_description,milestone.target_date::timestamptz,'project_milestones',milestone.id
  from public.project_milestones milestone where milestone.organization_id=public.current_organization_id() and milestone.critical_path
    and milestone.status not in ('complete','waived','cancelled') and milestone.target_date<=current_date+interval '14 days' and milestone.archived_at is null
  on conflict do nothing; get diagnostics affected_rows = row_count; inserted_count := inserted_count + affected_rows;
  insert into public.notifications(organization_id,project_id,user_id,notification_type,title,body,due_at,source_table,source_id)
  select blocker.organization_id,blocker.project_id,blocker.assigned_to,'critical_blocker','Critical blocker: '||blocker.title,
    blocker.description,blocker.target_resolution_date::timestamptz,'project_blockers',blocker.id
  from public.project_blockers blocker where blocker.organization_id=public.current_organization_id() and blocker.severity='critical'
    and blocker.status in ('open','monitoring') and blocker.archived_at is null
  on conflict do nothing; get diagnostics affected_rows = row_count; inserted_count := inserted_count + affected_rows;
  insert into public.notifications(organization_id,project_id,user_id,notification_type,title,body,due_at,source_table,source_id)
  select incentive.organization_id,incentive.project_id,incentive.assigned_to,'incentive_deadline','Incentive deadline approaching',
    incentive.next_action,incentive.deadline::timestamptz,'project_incentives',incentive.id
  from public.project_incentives incentive where incentive.organization_id=public.current_organization_id()
    and incentive.deadline<=current_date+interval '30 days' and incentive.application_status not in ('submitted','approved','declined') and incentive.archived_at is null
  on conflict do nothing; get diagnostics affected_rows = row_count; inserted_count := inserted_count + affected_rows;
  return inserted_count;
end $$;

-- Updated timestamps, indexes, RLS, and material-event audit coverage.
do $$ declare table_name text; begin
  foreach table_name in array array[
    'project_stage_gates','project_blockers','project_decisions','project_assumptions','project_team_members','utilities','utility_contacts','interconnection_requests',
    'engineering_engagements','engineering_deliverables','project_design_versions','production_models','equipment_scenarios','epc_vendors','epc_proposals','epc_proposal_comparisons',
    'companies','offtaker_opportunities','offtaker_outreach','ppa_scenarios','permit_requirements','diligence_items','project_budget_versions','project_cost_estimates',
    'capital_stack_versions','capital_stack_items','financial_model_versions','incentive_programs','project_incentives','notifications',
    'interconnection_milestones','interconnection_documents','interconnection_cost_estimates','interconnection_requirements','epc_cost_items','operations_maintenance_proposals',
    'offtaker_energy_profiles','letters_of_intent','ppa_term_sheets','ppa_negotiations','ppa_documents','permit_applications','permit_status_history','environmental_reviews','title_reviews','surveys','geotechnical_reviews','zoning_reviews',
    'funding_sources','lender_opportunities','investor_opportunities','financing_requirements','financing_status_history','financial_assumptions','incentive_applications','incentive_requirements','incentive_deadlines','incentive_documents',
    'construction_contracts','construction_milestones','construction_progress_updates','change_orders','commissioning_checklists','operating_assets','maintenance_events','production_readings','operating_incidents'
  ] loop execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()',table_name||'_updated_at',table_name); end loop;
end $$;

create index project_portfolio_idx on public.projects(organization_id,archived_at,project_stage,project_health,updated_at desc);
create index project_gates_idx on public.project_stage_gates(organization_id,project_id,from_stage,to_stage,satisfied) where archived_at is null;
create index project_blockers_idx on public.project_blockers(organization_id,project_id,status,severity) where archived_at is null;
create index project_milestones_command_idx on public.project_milestones(organization_id,project_id,status,target_date) where archived_at is null;
create index interconnection_project_idx on public.interconnection_requests(organization_id,project_id,status) where archived_at is null;
create index offtaker_project_idx on public.offtaker_opportunities(organization_id,project_id,status) where archived_at is null;
create index project_incentive_deadline_idx on public.project_incentives(organization_id,deadline) where archived_at is null;

do $$ declare table_name text; policy_record record; begin
  foreach table_name in array array[
    'project_stage_history','project_health_history','project_stage_gates','project_blockers','project_decisions','project_assumptions','project_team_members',
    'utilities','utility_contacts','interconnection_requests','interconnection_status_history','engineering_engagements','engineering_deliverables','project_design_versions','production_models','equipment_scenarios','epc_vendors','epc_proposals','epc_proposal_comparisons',
    'companies','offtaker_opportunities','offtaker_outreach','ppa_scenarios','ppa_status_history','permit_requirements','diligence_items','project_budget_versions','project_cost_estimates','capital_stack_versions','capital_stack_items','financial_model_versions','incentive_programs','project_incentives','notifications',
    'interconnection_milestones','interconnection_documents','interconnection_cost_estimates','interconnection_requirements','epc_cost_items','operations_maintenance_proposals','offtaker_energy_profiles','letters_of_intent','ppa_term_sheets','ppa_negotiations','ppa_documents','permit_applications','permit_status_history','environmental_reviews','title_reviews','surveys','geotechnical_reviews','zoning_reviews','funding_sources','lender_opportunities','investor_opportunities','financing_requirements','financing_status_history','financial_assumptions','incentive_applications','incentive_requirements','incentive_deadlines','incentive_documents','construction_contracts','construction_milestones','construction_progress_updates','change_orders','commissioning_checklists','operating_assets','maintenance_events','production_readings','operating_incidents'
  ] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('revoke all on public.%I from anon',table_name);
    execute format('create policy %I on public.%I for select to authenticated using (organization_id=public.current_organization_id())',table_name||'_tenant_select',table_name);
    if table_name not in ('project_stage_history','project_health_history','interconnection_status_history','ppa_status_history') then
      if table_name in ('project_assumptions','engineering_deliverables','project_design_versions','production_models','equipment_scenarios','epc_proposal_comparisons','financial_model_versions','financial_assumptions','project_incentives') then
        execute format('create policy %I on public.%I for insert to authenticated with check (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[]))',table_name||'_tenant_insert',table_name);
        execute format('create policy %I on public.%I for update to authenticated using (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[])) with check (organization_id=public.current_organization_id())',table_name||'_tenant_update',table_name);
      else
        execute format('create policy %I on public.%I for insert to authenticated with check (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'']::public.organization_role[]))',table_name||'_tenant_insert',table_name);
        execute format('create policy %I on public.%I for update to authenticated using (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'']::public.organization_role[])) with check (organization_id=public.current_organization_id())',table_name||'_tenant_update',table_name);
      end if;
      execute format('create policy %I on public.%I for delete to authenticated using (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[]))',table_name||'_tenant_delete',table_name);
    end if;
  end loop;
end $$;

-- Project records, milestones, and execution tasks are operational records. Analysts
-- retain access to the explicitly analysis-oriented Sprint 4 tables above.
do $$ declare table_name text; begin
  foreach table_name in array array['projects','project_milestones','tasks'] loop
    execute format('drop policy if exists %I on public.%I',table_name||'_tenant_insert',table_name);
    execute format('drop policy if exists %I on public.%I',table_name||'_tenant_update',table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'']::public.organization_role[]))',table_name||'_tenant_insert',table_name);
    execute format('create policy %I on public.%I for update to authenticated using (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'']::public.organization_role[])) with check (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'']::public.organization_role[]))',table_name||'_tenant_update',table_name);
  end loop;
end $$;

-- Financial and investor records are not exposed to viewer memberships.
do $$ declare table_name text; begin
  foreach table_name in array array['project_budget_versions','project_cost_estimates','capital_stack_versions','capital_stack_items','financial_model_versions','funding_sources','lender_opportunities','investor_opportunities','financing_requirements','financing_status_history','financial_assumptions'] loop
    execute format('drop policy if exists %I on public.%I',table_name||'_tenant_select',table_name);
    execute format('create policy %I on public.%I for select to authenticated using (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[]))',table_name||'_financial_select',table_name);
  end loop;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['project_stage_gates','project_blockers','project_decisions','interconnection_requests','engineering_deliverables','project_design_versions','production_models','epc_proposals','epc_proposal_comparisons','offtaker_opportunities','offtaker_outreach','ppa_scenarios','permit_requirements','diligence_items','project_budget_versions','project_cost_estimates','capital_stack_versions','capital_stack_items','financial_model_versions','project_incentives','construction_contracts','construction_progress_updates','change_orders','operating_assets','maintenance_events','operating_incidents'] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.log_change()',table_name||'_audit',table_name);
  end loop;
end $$;

revoke all on function public.seed_project_stage_gates(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.seed_project_stage_gates_trigger() from public,anon,authenticated;
revoke all on function public.record_interconnection_status_change() from public,anon,authenticated;
revoke all on function public.record_ppa_status_change() from public,anon,authenticated;
revoke all on function public.guard_project_control_fields() from public,anon,authenticated;
revoke all on function public.advance_project_stage(uuid,text,text,text,uuid) from public,anon;
grant execute on function public.advance_project_stage(uuid,text,text,text,uuid) to authenticated;
revoke all on function public.recalculate_project_health(uuid) from public,anon;
grant execute on function public.recalculate_project_health(uuid) to authenticated;
revoke all on function public.override_project_health(uuid,text,text) from public,anon;
grant execute on function public.override_project_health(uuid,text,text) to authenticated;
revoke all on function public.capital_stack_summary(uuid) from public,anon;
grant execute on function public.capital_stack_summary(uuid) to authenticated;
revoke all on function public.refresh_project_notifications() from public,anon;
grant execute on function public.refresh_project_notifications() to authenticated;

insert into public.incentive_programs(organization_id,name,program_type,status,requires_current_verification,not_professional_advice)
select organization.id,seed.name,seed.program_type,'review_required',true,true
from public.organizations organization cross join (values
  ('48E Clean Electricity Investment Credit','tax_credit'),('45Y Clean Electricity Production Credit','tax_credit'),
  ('Low-Income Communities Bonus Credit','bonus_credit'),('Domestic Content Bonus','bonus_credit'),('Energy Community Bonus','bonus_credit'),
  ('MACRS','depreciation'),('Bonus depreciation','depreciation'),('USDA REAP grant','grant'),('USDA REAP guaranteed loan','loan_guarantee')
) seed(name,program_type) on conflict (organization_id,name) do nothing;

comment on function public.advance_project_stage is 'Authoritative stage transition boundary. Failed gates require owner/admin override reason and a supporting decision record.';
comment on table public.project_stage_history is 'Append-only project stage history; direct mutation is not granted.';
comment on table public.production_readings is 'Manual operations foundation only; no live SCADA or production integration is implied.';
comment on table public.incentive_programs is 'Review-required program catalog. Records require current verification and are not professional advice.';
