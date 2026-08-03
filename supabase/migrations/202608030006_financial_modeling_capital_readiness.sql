-- Sprint 5: versioned financial modeling, funding readiness, and capital partner CRM.
-- Apply after 202608030005_project_development_command_center.sql.

create type public.financial_model_status as enum ('draft','under_review','approved_internal','approved_for_lender','approved_for_investor','superseded','rejected');
create type public.finance_scenario_type as enum ('base','conservative','optimistic','lender_case','investor_case','p50','p90','custom');
create type public.capital_partner_type as enum ('bank','credit_union','cib','infrastructure_fund','family_office','tax_credit_buyer','grant_funder','other');
create type public.readiness_status as enum ('not_ready','early','developing','lender_ready','investor_ready','close_ready','blocked');

create table public.financial_models (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  current_version_id uuid,
  status public.financial_model_status not null default 'draft',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique(organization_id,project_id,name)
);

alter table public.financial_model_versions
  add column financial_model_id uuid references public.financial_models(id) on delete cascade,
  add column scenario_type public.finance_scenario_type not null default 'base',
  add column engine_version text not null default 'legacy',
  add column version_hash text,
  add column source_hash text,
  add column is_stale boolean not null default false,
  add column stale_reason text,
  add column approved_by uuid references public.profiles(id) on delete set null,
  add column approved_at timestamptz,
  add column supersedes_version_id uuid references public.financial_model_versions(id) on delete set null;

alter table public.financial_models add constraint financial_models_current_version_fk foreign key(current_version_id) references public.financial_model_versions(id) on delete set null;

create table public.financial_model_assumptions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade, model_version_id uuid not null references public.financial_model_versions(id) on delete cascade,
  assumption_key text not null, numeric_value numeric, text_value text, unit text, source_table text, source_id uuid, material boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), unique(model_version_id,assumption_key)
);
create table public.financial_model_outputs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade, model_version_id uuid not null references public.financial_model_versions(id) on delete cascade,
  output_key text not null, numeric_value numeric, text_value text, unit text, year_number integer, output_payload jsonb not null default '{}',
  created_at timestamptz not null default now(), unique(model_version_id,output_key,year_number)
);
create table public.financial_model_warnings (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade, model_version_id uuid not null references public.financial_model_versions(id) on delete cascade,
  code text not null, severity text not null check(severity in ('info','warning','blocking')), message text not null, acknowledged_by uuid references public.profiles(id) on delete set null, acknowledged_at timestamptz, created_at timestamptz not null default now()
);
create table public.financial_model_approvals (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade, model_version_id uuid not null references public.financial_model_versions(id) on delete cascade,
  approval_status text not null check(approval_status in ('approved','rejected','withdrawn')), decision_note text not null, decided_by uuid not null references public.profiles(id) on delete restrict, decided_at timestamptz not null default now(), source_hash text not null
);
create table public.financial_model_source_links (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade, model_version_id uuid not null references public.financial_model_versions(id) on delete cascade,
  source_table text not null, source_id uuid not null, source_updated_at timestamptz, source_hash text not null, material boolean not null default true, created_at timestamptz not null default now(), unique(model_version_id,source_table,source_id)
);

create table public.scenario_sets (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  name text not null, base_model_version_id uuid references public.financial_model_versions(id) on delete restrict, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create table public.scenario_versions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  scenario_set_id uuid not null references public.scenario_sets(id) on delete cascade, model_version_id uuid not null references public.financial_model_versions(id) on delete cascade, scenario_type public.finance_scenario_type not null, label text not null, created_at timestamptz not null default now(), unique(scenario_set_id,scenario_type,label)
);
create table public.scenario_comparisons (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  scenario_set_id uuid not null references public.scenario_sets(id) on delete cascade, comparison_payload jsonb not null, created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.sensitivity_runs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  model_version_id uuid not null references public.financial_model_versions(id) on delete cascade, row_variable text not null, column_variable text not null, row_deltas numeric[] not null, column_deltas numeric[] not null, created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.sensitivity_results (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  sensitivity_run_id uuid not null references public.sensitivity_runs(id) on delete cascade, row_delta numeric not null, column_delta numeric not null, output_payload jsonb not null, created_at timestamptz not null default now(), unique(sensitivity_run_id,row_delta,column_delta)
);

-- Typed yearly schedules are kept separate from immutable model-version JSON for reporting and diligence exports.
create table public.production_forecasts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  name text not null, status text not null default 'draft', source_production_model_id uuid references public.production_models(id) on delete set null, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create table public.production_forecast_years (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, production_forecast_id uuid not null references public.production_forecasts(id) on delete cascade, year_number integer not null check(year_number between 1 and 50), generation_kwh numeric not null check(generation_kwh>=0), availability_pct numeric, degradation_pct numeric, curtailment_pct numeric, created_at timestamptz not null default now(), unique(production_forecast_id,year_number));
create table public.revenue_forecast_years (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, model_version_id uuid not null references public.financial_model_versions(id) on delete cascade, year_number integer not null, generation_kwh numeric not null, rate_per_kwh numeric not null, gross_revenue numeric not null, created_at timestamptz not null default now(), unique(model_version_id,year_number));
create table public.opex_forecast_years (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, model_version_id uuid not null references public.financial_model_versions(id) on delete cascade, year_number integer not null, operating_expense numeric not null, reserve_contribution numeric not null default 0, replacement_capex numeric not null default 0, created_at timestamptz not null default now(), unique(model_version_id,year_number));

create table public.debt_facilities (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  name text not null, facility_type text not null, lender_name text, commitment_amount numeric not null default 0, status text not null default 'concept', sensitive boolean not null default true, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create table public.debt_terms (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, debt_facility_id uuid not null references public.debt_facilities(id) on delete cascade, version_number integer not null, principal numeric not null, interest_rate_pct numeric not null, term_years integer not null, interest_only_years integer not null default 0, balloon_amount numeric not null default 0, dscr_minimum numeric, status text not null default 'draft', created_by uuid references public.profiles(id), created_at timestamptz not null default now(), unique(debt_facility_id,version_number));
create table public.debt_payment_schedules (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, debt_term_id uuid not null references public.debt_terms(id) on delete cascade, year_number integer not null, beginning_balance numeric not null, interest_payment numeric not null, principal_payment numeric not null, ending_balance numeric not null, created_at timestamptz not null default now(), unique(debt_term_id,year_number));
create table public.debt_covenants (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, debt_facility_id uuid not null references public.debt_facilities(id) on delete cascade, covenant_name text not null, threshold numeric, current_value numeric, compliance_status text not null default 'unverified', tested_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.debt_conditions (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, debt_facility_id uuid not null references public.debt_facilities(id) on delete cascade, title text not null, status text not null default 'open', due_date date, evidence_document_id uuid references public.documents(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.lender_requirements (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, lender_opportunity_id uuid references public.lender_opportunities(id) on delete cascade, title text not null, status text not null default 'open', due_date date, evidence_document_id uuid references public.documents(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.equity_sources (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, name text not null, source_type text not null, target_amount numeric not null default 0, status text not null default 'concept', sensitive boolean not null default true, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz);
create table public.equity_commitments (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, equity_source_id uuid not null references public.equity_sources(id) on delete cascade, committed_amount numeric not null, commitment_date date, conditions text, status text not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.investor_return_assumptions (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, equity_source_id uuid references public.equity_sources(id) on delete cascade, target_irr_pct numeric, preferred_return_pct numeric, promote_structure jsonb not null default '{}', disclaimer text not null default 'Preliminary modeling assumption; not investment, tax, legal, or accounting advice.', created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.tax_incentive_assumptions (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, model_version_id uuid references public.financial_model_versions(id) on delete cascade, incentive_program_id uuid references public.incentive_programs(id) on delete restrict, assumption_value numeric, confidence text not null default 'unverified', verification_source text, last_verified_date date, disclaimer text not null default 'Requires current tax and legal review; no eligibility or value is guaranteed.', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.depreciation_schedules (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, model_version_id uuid not null references public.financial_model_versions(id) on delete cascade, year_number integer not null, depreciation_amount numeric not null, method text not null, created_at timestamptz not null default now(), unique(model_version_id,year_number));

create table public.capital_partners (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  name text not null, partner_type public.capital_partner_type not null, website text, relationship_owner_id uuid references public.profiles(id), strategy_notes text, status text not null default 'prospect', sensitive boolean not null default true,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz, unique(organization_id,name)
);
create table public.capital_partner_contacts (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, capital_partner_id uuid not null references public.capital_partners(id) on delete cascade, full_name text not null, title text, email text, phone text, is_primary boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.capital_partner_interactions (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid references public.projects(id) on delete cascade, capital_partner_id uuid not null references public.capital_partners(id) on delete cascade, interaction_type text not null, occurred_at timestamptz not null default now(), summary text not null, next_action text, next_action_date date, created_by uuid references public.profiles(id), created_at timestamptz not null default now());
create table public.capital_partner_requirements (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, capital_partner_id uuid not null references public.capital_partners(id) on delete cascade, title text not null, requirement_type text, details text, status text not null default 'open', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.financing_term_sheets (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, capital_partner_id uuid references public.capital_partners(id) on delete set null, name text not null, status text not null default 'draft', selected boolean not null default false, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz);
create table public.financing_term_sheet_versions (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, term_sheet_id uuid not null references public.financing_term_sheets(id) on delete cascade, version_number integer not null, terms jsonb not null, document_id uuid references public.documents(id) on delete set null, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), unique(term_sheet_id,version_number));

create table public.funding_readiness_assessments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade,
  model_version_id uuid references public.financial_model_versions(id) on delete set null, score integer not null check(score between 0 and 100), readiness_status public.readiness_status not null, blocking_reasons jsonb not null default '[]', assessment_inputs jsonb not null, assessed_by uuid references public.profiles(id), assessed_at timestamptz not null default now()
);
create table public.funding_readiness_requirements (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, category text not null, title text not null, required boolean not null default true, status text not null default 'missing', evidence_document_id uuid references public.documents(id) on delete set null, owner_id uuid references public.profiles(id), due_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.funding_readiness_flags (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, flag_code text not null, severity text not null check(severity in ('info','warning','fatal')), message text not null, resolved_at timestamptz, resolved_by uuid references public.profiles(id), created_at timestamptz not null default now());
create table public.funding_close_checklists (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, title text not null, status text not null default 'open', target_close_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.funding_close_conditions (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, checklist_id uuid not null references public.funding_close_checklists(id) on delete cascade, title text not null, status text not null default 'open', evidence_document_id uuid references public.documents(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.funding_data_room_documents (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, document_id uuid not null references public.documents(id) on delete cascade, category text not null, approved_for_package boolean not null default false, approved_by uuid references public.profiles(id), approved_at timestamptz, created_at timestamptz not null default now(), unique(project_id,document_id));

-- Versioned operating schedules and diligence registers share an auditable envelope.
-- Their structured details remain JSON until a verified provider requires stronger columns.
do $$ declare table_name text; begin
  foreach table_name in array array[
    'degradation_scenarios','availability_scenarios','curtailment_scenarios','ppa_revenue_forecasts','utility_rate_scenarios','rec_revenue_scenarios','merchant_revenue_scenarios',
    'project_budget_items','operating_cost_forecasts','operating_cost_years','replacement_capital_items','insurance_forecasts','tax_forecasts','land_cost_forecasts','decommissioning_cost_forecasts','reserve_requirements',
    'debt_draw_schedules','debt_status_history','debt_service_reserves','lender_due_diligence_items','equity_contribution_schedules','investor_returns','sponsor_equity_assumptions','outside_equity_assumptions','investor_conditions','investor_due_diligence_items',
    'tax_credit_scenarios','tax_credit_transfer_scenarios','tax_credit_buyer_opportunities','tax_credit_transfer_terms','depreciation_scenarios','grant_scenarios','loan_guarantee_scenarios','incentive_cash_flow_events',
    'grant_funder_opportunities','capital_partner_documents','capital_partner_status_history','funding_readiness_documents','financing_close_checklists','financing_conditions_precedent','financing_close_events','funding_data_room_access_log'
  ] loop
    execute format('create table public.%I (id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict, project_id uuid not null references public.projects(id) on delete cascade, title text not null, status text not null default ''draft'', details jsonb not null default ''{}'', source_table text, source_id uuid, assigned_to uuid references public.profiles(id) on delete set null, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz)',table_name);
  end loop;
end $$;

create or replace function public.mark_project_models_stale() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare affected_project uuid; affected_org uuid;
begin
  if tg_table_name='projects' then affected_project:=coalesce(new.id,old.id); else affected_project:=coalesce(new.project_id,old.project_id); end if;
  affected_org:=coalesce(new.organization_id,old.organization_id);
  perform set_config('app.finance_controlled_update','on',true);
  update public.financial_model_versions set is_stale=true, status='under_review', stale_reason='A material linked source changed after this version was calculated.'
  where project_id=affected_project and organization_id=affected_org and approved_at is not null and is_stale=false;
  update public.financial_models set status='under_review',updated_at=now() where project_id=affected_project and organization_id=affected_org and archived_at is null;
  insert into public.notifications(organization_id,project_id,notification_type,title,body,source_table,source_id)
  select affected_org,affected_project,'model_requires_reapproval','Approved financial model requires review','A material project source changed after model approval.',tg_table_name,coalesce(new.id,old.id)
  where not exists(select 1 from public.notifications where project_id=affected_project and notification_type='model_requires_reapproval' and status='unread');
  return coalesce(new,old);
end $$;

create or replace function public.refresh_funding_notifications() returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare inserted_count integer:=0; affected integer;
begin
  if public.current_organization_id() is null then raise exception 'Active organization required'; end if;
  insert into public.notifications(organization_id,project_id,user_id,notification_type,title,body,due_at,source_table,source_id)
  select requirement.organization_id,requirement.project_id,requirement.assigned_to,'lender_requirement_due','Lender requirement due',requirement.title,requirement.due_date::timestamptz,'lender_requirements',requirement.id
  from public.lender_requirements requirement where requirement.organization_id=public.current_organization_id() and requirement.status not in ('complete','waived') and requirement.due_date<=current_date+interval '14 days'
  and not exists(select 1 from public.notifications notice where notice.source_id=requirement.id and notice.notification_type='lender_requirement_due' and notice.status='unread'); get diagnostics affected=row_count; inserted_count:=inserted_count+affected;
  insert into public.notifications(organization_id,project_id,notification_type,title,body,source_table,source_id)
  select flag.organization_id,flag.project_id,'funding_readiness_blocker','Funding-readiness blocker created',flag.message,'funding_readiness_flags',flag.id from public.funding_readiness_flags flag
  where flag.organization_id=public.current_organization_id() and flag.severity='fatal' and flag.resolved_at is null and not exists(select 1 from public.notifications notice where notice.source_id=flag.id and notice.notification_type='funding_readiness_blocker' and notice.status='unread'); get diagnostics affected=row_count; inserted_count:=inserted_count+affected;
  insert into public.notifications(organization_id,project_id,notification_type,title,body,source_table,source_id)
  select covenant.organization_id,covenant.project_id,'covenant_failure','Debt covenant requires attention',covenant.covenant_name,'debt_covenants',covenant.id from public.debt_covenants covenant
  where covenant.organization_id=public.current_organization_id() and covenant.compliance_status='failed' and not exists(select 1 from public.notifications notice where notice.source_id=covenant.id and notice.notification_type='covenant_failure' and notice.status='unread'); get diagnostics affected=row_count; inserted_count:=inserted_count+affected;
  return inserted_count;
end $$;

create or replace function public.approve_financial_model(p_version_id uuid,p_decision_note text) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare target public.financial_model_versions%rowtype; approval_id uuid;
begin
  if not public.has_organization_role(array['owner','admin']::public.organization_role[]) then raise exception 'Owner or administrator role required'; end if;
  if nullif(trim(p_decision_note),'') is null then raise exception 'Decision note required'; end if;
  select * into target from public.financial_model_versions where id=p_version_id and organization_id=public.current_organization_id() and archived_at is null for update;
  if not found then raise exception 'Financial model version not found'; end if;
  if target.is_stale then raise exception 'Stale model versions cannot be approved'; end if;
  if exists(select 1 from public.financial_model_warnings where model_version_id=p_version_id and severity='blocking') then raise exception 'Blocking model warnings must be resolved'; end if;
  perform set_config('app.finance_controlled_update','on',true);
  update public.financial_model_versions set status='approved_internal',approved_by=auth.uid(),approved_at=now() where id=p_version_id;
  insert into public.financial_model_approvals(organization_id,project_id,model_version_id,approval_status,decision_note,decided_by,source_hash) values(target.organization_id,target.project_id,target.id,'approved',p_decision_note,auth.uid(),coalesce(target.source_hash,'')) returning id into approval_id;
  insert into public.activity_log(organization_id,actor_id,entity_type,entity_id,action,after_data)
  values(target.organization_id,auth.uid(),'financial_model_versions',target.id,'financial_model_approved',jsonb_build_object('project_id',target.project_id,'approval_id',approval_id));
  update public.financial_models set status='approved_internal',updated_at=now() where id=target.financial_model_id;
  return approval_id;
end $$;

-- All Sprint 5 tables deny anonymous access and use explicit organization policies.
do $$ declare table_name text; begin
  foreach table_name in array array[
    'financial_models','financial_model_assumptions','financial_model_outputs','financial_model_warnings','financial_model_approvals','financial_model_source_links',
    'scenario_sets','scenario_versions','scenario_comparisons','sensitivity_runs','sensitivity_results','production_forecasts','production_forecast_years','revenue_forecast_years','opex_forecast_years',
    'debt_facilities','debt_terms','debt_payment_schedules','debt_covenants','debt_conditions','lender_requirements','equity_sources','equity_commitments','investor_return_assumptions','tax_incentive_assumptions','depreciation_schedules',
    'capital_partners','capital_partner_contacts','capital_partner_interactions','capital_partner_requirements','financing_term_sheets','financing_term_sheet_versions',
    'funding_readiness_assessments','funding_readiness_requirements','funding_readiness_flags','funding_close_checklists','funding_close_conditions','funding_data_room_documents',
    'degradation_scenarios','availability_scenarios','curtailment_scenarios','ppa_revenue_forecasts','utility_rate_scenarios','rec_revenue_scenarios','merchant_revenue_scenarios','project_budget_items','operating_cost_forecasts','operating_cost_years','replacement_capital_items','insurance_forecasts','tax_forecasts','land_cost_forecasts','decommissioning_cost_forecasts','reserve_requirements','debt_draw_schedules','debt_status_history','debt_service_reserves','lender_due_diligence_items','equity_contribution_schedules','investor_returns','sponsor_equity_assumptions','outside_equity_assumptions','investor_conditions','investor_due_diligence_items','tax_credit_scenarios','tax_credit_transfer_scenarios','tax_credit_buyer_opportunities','tax_credit_transfer_terms','depreciation_scenarios','grant_scenarios','loan_guarantee_scenarios','incentive_cash_flow_events','grant_funder_opportunities','capital_partner_documents','capital_partner_status_history','funding_readiness_documents','financing_close_checklists','financing_conditions_precedent','financing_close_events','funding_data_room_access_log'
  ] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('revoke all on public.%I from anon',table_name);
    execute format('grant select,insert,update,delete on public.%I to authenticated',table_name);
    execute format('create policy %I on public.%I for select to authenticated using (organization_id=public.current_organization_id())',table_name||'_select',table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[]))',table_name||'_insert',table_name);
    execute format('create policy %I on public.%I for update to authenticated using (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[])) with check (organization_id=public.current_organization_id())',table_name||'_update',table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[]))',table_name||'_delete',table_name);
  end loop;
end $$;

-- Capital relationships and lender/investor terms are deliberately restricted to owner/admin.
drop policy if exists financial_model_versions_financial_select on public.financial_model_versions;
drop policy if exists financial_model_versions_tenant_select on public.financial_model_versions;
create policy financial_model_versions_sprint5_select on public.financial_model_versions for select to authenticated using(organization_id=public.current_organization_id());

do $$ declare table_name text; begin
  foreach table_name in array array['debt_facilities','debt_terms','debt_payment_schedules','debt_covenants','debt_conditions','lender_requirements','equity_sources','equity_commitments','investor_return_assumptions','capital_partners','capital_partner_contacts','capital_partner_interactions','capital_partner_requirements','financing_term_sheets','financing_term_sheet_versions','funding_data_room_documents','tax_credit_buyer_opportunities','grant_funder_opportunities','capital_partner_documents','capital_partner_status_history','funding_data_room_access_log'] loop
    execute format('drop policy if exists %I on public.%I',table_name||'_select',table_name);
    execute format('drop policy if exists %I on public.%I',table_name||'_insert',table_name);
    execute format('drop policy if exists %I on public.%I',table_name||'_update',table_name);
    execute format('create policy %I on public.%I for select to authenticated using (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[]))',table_name||'_capital_select',table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[]))',table_name||'_capital_insert',table_name);
    execute format('create policy %I on public.%I for update to authenticated using (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[])) with check (organization_id=public.current_organization_id())',table_name||'_capital_update',table_name);
  end loop;
end $$;

-- Only trusted approval RPC may create approval records.
drop policy if exists financial_model_approvals_insert on public.financial_model_approvals;
drop policy if exists financial_model_approvals_update on public.financial_model_approvals;
drop policy if exists financial_model_approvals_delete on public.financial_model_approvals;

-- A calculated version is append-only. Status transitions are restricted to the
-- trusted approval and stale-source workflows above.
create or replace function public.guard_financial_model_version_immutability() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if current_setting('app.finance_controlled_update',true) is distinct from 'on' then
    raise exception 'Financial model versions are immutable; create a new version instead';
  end if;
  return new;
end $$;

drop policy if exists financial_model_versions_tenant_update on public.financial_model_versions;
drop policy if exists financial_model_versions_tenant_delete on public.financial_model_versions;
drop policy if exists financial_model_versions_update on public.financial_model_versions;
drop policy if exists financial_model_versions_delete on public.financial_model_versions;

create trigger financial_model_versions_immutable before update on public.financial_model_versions for each row execute function public.guard_financial_model_version_immutability();

do $$ declare table_name text; begin
  foreach table_name in array array['financial_models','scenario_sets','production_forecasts','debt_facilities','debt_covenants','debt_conditions','equity_sources','equity_commitments','investor_return_assumptions','tax_incentive_assumptions','capital_partners','capital_partner_contacts','capital_partner_requirements','financing_term_sheets','funding_readiness_requirements','funding_close_checklists','funding_close_conditions','operating_cost_forecasts','financing_close_checklists'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()',table_name||'_updated_at',table_name);
  end loop;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['financial_models','financial_model_approvals','scenario_sets','sensitivity_runs','debt_facilities','debt_terms','equity_sources','equity_commitments','capital_partners','capital_partner_interactions','financing_term_sheets','funding_readiness_assessments','funding_readiness_requirements','funding_close_checklists','funding_data_room_documents'] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.log_change()',table_name||'_sprint5_audit',table_name);
  end loop;
end $$;

create trigger production_finance_stale after insert or update or delete on public.production_models for each row execute function public.mark_project_models_stale();
create trigger epc_finance_stale after insert or update or delete on public.epc_proposals for each row execute function public.mark_project_models_stale();
create trigger ppa_finance_stale after insert or update or delete on public.ppa_scenarios for each row execute function public.mark_project_models_stale();
create trigger interconnection_cost_finance_stale after insert or update or delete on public.interconnection_cost_estimates for each row execute function public.mark_project_models_stale();
create trigger incentives_finance_stale after insert or update or delete on public.project_incentives for each row execute function public.mark_project_models_stale();
create trigger debt_terms_finance_stale after insert or update or delete on public.debt_terms for each row execute function public.mark_project_models_stale();
create trigger schedule_finance_stale after update of target_operation_date,target_cod on public.projects for each row execute function public.mark_project_models_stale();

revoke all on function public.mark_project_models_stale() from public,anon,authenticated;
revoke all on function public.guard_financial_model_version_immutability() from public,anon,authenticated;
revoke all on function public.approve_financial_model(uuid,text) from public,anon;
grant execute on function public.approve_financial_model(uuid,text) to authenticated;
revoke all on function public.refresh_funding_notifications() from public,anon;
grant execute on function public.refresh_funding_notifications() to authenticated;

comment on table public.financial_model_versions is 'Immutable calculation snapshots. Create a new version for every recalculation; approved versions become stale when material source records change.';
comment on table public.funding_data_room_documents is 'Private document allowlist for approved funding-package exports. Storage objects remain tenant-prefixed and non-public.';
comment on table public.tax_incentive_assumptions is 'Verification-required planning inputs; not a representation of tax eligibility and not professional advice.';
