-- Project-domain funding workflows and the first USDA REAP preparation workspace.
-- This migration is forward-only. It does not assert current USDA program terms,
-- grant amounts, eligibility, awards, or submission status.

create table public.funding_program_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  program_key text not null,
  program_name text not null,
  short_name text not null,
  agency_name text,
  version text not null,
  active boolean not null default true,
  program_url text,
  official_contact_url text,
  source_title text,
  date_verified date,
  verified_by uuid references public.profiles(id) on delete set null,
  last_reviewed_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, program_key, version)
);

create table public.funding_template_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  template_id uuid not null references public.funding_program_templates(id) on delete cascade,
  category text not null check (category in ('applicant','registration','site','utility','engineering','environmental','financial','commercial','legal','narrative','submission','post-award','reimbursement')),
  requirement_key text not null,
  title text not null,
  description text,
  default_required boolean not null default true,
  default_blocking boolean not null default false,
  confirmation_state text not null default 'needs-program-confirmation' check (confirmation_state in ('internal-preparation','source-verified','needs-program-confirmation')),
  source_url text,
  source_title text,
  date_verified date,
  verified_by uuid references public.profiles(id) on delete set null,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, requirement_key)
);

create table public.funding_template_milestones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  template_id uuid not null references public.funding_program_templates(id) on delete cascade,
  phase text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, phase)
);

create table public.project_funding_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade,
  program_template_id uuid references public.funding_program_templates(id) on delete set null,
  project_incentive_id uuid references public.project_incentives(id) on delete set null,
  funding_type text not null check (funding_type in ('grant','tax-credit','debt','equity','equipment-financing','incentive','other')),
  program_name text not null,
  provider_name text,
  status text not null default 'researching' check (status in ('researching','future','planning','pre-application','preparing','ready-to-submit','submitted','under-review','information-requested','approved','conditionally-approved','denied','withdrawn','closed','reimbursement','completed','archived')),
  requested_amount numeric check (requested_amount is null or requested_amount >= 0),
  estimated_amount numeric check (estimated_amount is null or estimated_amount >= 0),
  approved_amount numeric check (approved_amount is null or approved_amount >= 0),
  funded_amount numeric check (funded_amount is null or funded_amount >= 0),
  reimbursement_received numeric check (reimbursement_received is null or reimbursement_received >= 0),
  reimbursement_remaining numeric check (reimbursement_remaining is null or reimbursement_remaining >= 0),
  application_number text,
  application_url text,
  program_url text,
  primary_contact_id uuid references public.contacts(id) on delete set null,
  application_open_date date,
  application_deadline date,
  submitted_at timestamptz,
  decision_date date,
  award_date date,
  closing_date date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, program_name)
);

create table public.funding_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  funding_source_id uuid not null references public.project_funding_sources(id) on delete cascade,
  category text not null check (category in ('applicant','registration','site','utility','engineering','environmental','financial','commercial','legal','narrative','submission','post-award','reimbursement')),
  requirement_key text not null,
  title text not null,
  description text,
  status text not null default 'not-started' check (status in ('not-started','in-progress','waiting','complete','not-applicable','blocked','needs-review')),
  required boolean not null default true,
  blocking boolean not null default false,
  confirmation_state text not null default 'needs-program-confirmation' check (confirmation_state in ('internal-preparation','source-verified','needs-program-confirmation')),
  due_date date,
  completed_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  linked_document_id uuid references public.documents(id) on delete set null,
  linked_task_id uuid references public.tasks(id) on delete set null,
  source_url text,
  source_title text,
  source_verified_date date,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (funding_source_id, requirement_key)
);

create table public.funding_requirement_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  requirement_id uuid not null references public.funding_requirements(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  linked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (requirement_id, document_id)
);

create table public.funding_milestones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  funding_source_id uuid not null references public.project_funding_sources(id) on delete cascade,
  linked_project_milestone_id uuid references public.project_milestones(id) on delete set null,
  phase text not null check (phase in ('planning','pre-application','eligibility','engineering','utility','environmental','financial','application','review','award','closing','construction','inspection','reimbursement','completed')),
  title text not null,
  description text,
  status text not null default 'not-started' check (status in ('not-started','in-progress','waiting','complete','blocked','future','not-applicable')),
  target_date date,
  completed_date date,
  owner uuid references public.profiles(id) on delete set null,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (funding_source_id, phase, title)
);

create table public.funding_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  funding_source_id uuid not null references public.project_funding_sources(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('usda-program-specialist','usda-loan-specialist','usda-state-energy-coordinator','usda-area-specialist','grant-consultant','lender','engineer','environmental-reviewer','other')),
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (funding_source_id, contact_id, relationship_type)
);

create table public.funding_communications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  funding_source_id uuid not null references public.project_funding_sources(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  communication_type text not null check (communication_type in ('email','phone','meeting','video-call','letter','portal-message','note')),
  subject text not null,
  summary text not null,
  communication_date timestamptz not null,
  direction text not null check (direction in ('inbound','outbound','internal')),
  follow_up_date date,
  linked_document_id uuid references public.documents(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.funding_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  funding_source_id uuid not null references public.project_funding_sources(id) on delete cascade,
  question_number text,
  question text not null,
  source text not null,
  received_at timestamptz not null,
  due_date date,
  status text not null default 'open' check (status in ('open','drafting','waiting','submitted','accepted','closed')),
  response_summary text,
  linked_response_document_id uuid references public.documents(id) on delete set null,
  answered_at timestamptz,
  answered_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.funding_reimbursements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  funding_source_id uuid not null references public.project_funding_sources(id) on delete cascade,
  request_number text not null,
  period_start date,
  period_end date,
  eligible_cost_basis numeric not null default 0 check (eligible_cost_basis >= 0),
  requested_amount numeric not null default 0 check (requested_amount >= 0),
  approved_amount numeric check (approved_amount is null or approved_amount >= 0),
  paid_amount numeric check (paid_amount is null or paid_amount >= 0),
  submitted_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  status text not null default 'preparing' check (status in ('preparing','submitted','under-review','information-requested','approved','partially-paid','paid','denied')),
  linked_document_id uuid references public.documents(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (funding_source_id, request_number),
  check (period_end is null or period_start is null or period_end >= period_start),
  check (status <> 'paid' or (paid_amount is not null and paid_amount > 0 and paid_at is not null))
);

create table public.funding_cost_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  funding_source_id uuid not null references public.project_funding_sources(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null,
  description text not null,
  vendor text,
  estimated_cost numeric not null default 0 check (estimated_cost >= 0),
  actual_cost numeric check (actual_cost is null or actual_cost >= 0),
  eligible_amount numeric check (eligible_amount is null or eligible_amount >= 0),
  eligibility_status text not null default 'unknown' check (eligibility_status in ('unknown','potentially-eligible','confirmed-eligible','ineligible','needs-review')),
  invoice_document_id uuid references public.documents(id) on delete set null,
  proof_of_payment_document_id uuid references public.documents(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_funding_sources_project_idx on public.project_funding_sources(project_id, status) where archived_at is null;
create index funding_requirements_source_idx on public.funding_requirements(funding_source_id, category, status, sort_order);
create index funding_requirements_due_idx on public.funding_requirements(due_date) where status not in ('complete','not-applicable');
create index funding_milestones_source_idx on public.funding_milestones(funding_source_id, sort_order);
create index funding_communications_source_idx on public.funding_communications(funding_source_id, communication_date desc);
create index funding_questions_source_idx on public.funding_questions(funding_source_id, status, due_date);
create index funding_reimbursements_source_idx on public.funding_reimbursements(funding_source_id, status);
create index funding_cost_items_source_idx on public.funding_cost_items(funding_source_id, eligibility_status);

do $$ declare table_name text; begin
  foreach table_name in array array[
    'funding_program_templates','funding_template_requirements','funding_template_milestones','project_funding_sources',
    'funding_requirements','funding_milestones','funding_contacts','funding_communications','funding_questions',
    'funding_reimbursements','funding_cost_items'
  ] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', table_name||'_updated_at', table_name);
  end loop;
end $$;

create or replace function public.guard_funding_source_completion()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if new.status='completed' and exists (
    select 1 from public.funding_reimbursements r where r.funding_source_id=new.id and r.status not in ('paid','denied')
  ) then raise exception 'Funding source cannot be completed while reimbursement requests remain open'; end if;
  return new;
end $$;
create trigger project_funding_sources_completion_guard before update of status on public.project_funding_sources
for each row execute function public.guard_funding_source_completion();

-- Tenant policies: viewers read, workflow roles edit, and only administrators delete.
do $$ declare table_name text; begin
  foreach table_name in array array[
    'funding_program_templates','funding_template_requirements','funding_template_milestones','project_funding_sources',
    'funding_requirements','funding_requirement_documents','funding_milestones','funding_contacts','funding_communications',
    'funding_questions','funding_reimbursements','funding_cost_items'
  ] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('create policy %I on public.%I for select to authenticated using (organization_id=public.current_organization_id())',table_name||'_select',table_name);
  end loop;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array[
    'project_funding_sources','funding_requirements','funding_requirement_documents','funding_milestones','funding_contacts',
    'funding_communications','funding_questions','funding_reimbursements','funding_cost_items'
  ] loop
    execute format('create policy %I on public.%I for insert to authenticated with check (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[]))',table_name||'_insert',table_name);
    execute format('create policy %I on public.%I for update to authenticated using (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[])) with check (organization_id=public.current_organization_id())',table_name||'_update',table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[]))',table_name||'_delete',table_name);
  end loop;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['funding_program_templates','funding_template_requirements','funding_template_milestones'] loop
    execute format('create policy %I on public.%I for insert to authenticated with check (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[]))',table_name||'_insert',table_name);
    execute format('create policy %I on public.%I for update to authenticated using (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[])) with check (organization_id=public.current_organization_id())',table_name||'_update',table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (organization_id=public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[]))',table_name||'_delete',table_name);
  end loop;
end $$;

revoke all on public.funding_program_templates,public.funding_template_requirements,public.funding_template_milestones,
  public.project_funding_sources,public.funding_requirements,public.funding_requirement_documents,public.funding_milestones,
  public.funding_contacts,public.funding_communications,public.funding_questions,public.funding_reimbursements,public.funding_cost_items from anon;
grant select,insert,update,delete on public.funding_program_templates,public.funding_template_requirements,public.funding_template_milestones,
  public.project_funding_sources,public.funding_requirements,public.funding_requirement_documents,public.funding_milestones,
  public.funding_contacts,public.funding_communications,public.funding_questions,public.funding_reimbursements,public.funding_cost_items to authenticated;

-- Use the established audit envelope. Trigger rows include before/after data and tenant identity.
do $$ declare table_name text; begin
  foreach table_name in array array[
    'funding_program_templates','funding_template_requirements','funding_template_milestones','project_funding_sources',
    'funding_requirements','funding_requirement_documents','funding_milestones','funding_contacts','funding_communications',
    'funding_questions','funding_reimbursements','funding_cost_items'
  ] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.log_change()',table_name||'_audit',table_name);
  end loop;
end $$;

-- Configurable USDA REAP template. These are internal preparation prompts, not a claim of current USDA requirements.
with org as (select id from public.organizations where slug='nsoul' limit 1)
insert into public.funding_program_templates(
  organization_id,program_key,program_name,short_name,agency_name,version,program_url,official_contact_url,source_title,notes
)
select id,'usda-reap','Rural Energy for America Program','USDA REAP','USDA Rural Development','internal-preparation-v1',
  'https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency-improvements',
  'https://www.rd.usda.gov/ok/oklahoma-contacts','Official USDA Rural Development program and Oklahoma contact pages',
  'Initial internal preparation template. Re-verify every requirement, date, amount, percentage, cap, and eligibility rule against current USDA guidance before submission.'
from org on conflict(organization_id,program_key,version) do nothing;

with template as (select id,organization_id from public.funding_program_templates where program_key='usda-reap' and version='internal-preparation-v1')
insert into public.funding_template_requirements(organization_id,template_id,category,requirement_key,title,description,default_required,default_blocking,sort_order)
select template.organization_id,template.id,v.category,v.key,v.title,'Initial internal preparation checklist. Confirm applicability and current USDA treatment before submission.',v.required,v.blocking,v.sort_order
from template cross join (values
  ('applicant','applicant-legal-entity','Applicant legal entity documented',true,true,10),
  ('applicant','ein','EIN documented',true,true,20),('applicant','w9','W-9 available',true,false,30),
  ('registration','sam-registration','SAM.gov registration reviewed',true,true,40),('registration','uei','UEI reviewed',true,true,50),
  ('applicant','applicant-eligibility','Applicant eligibility review',true,true,60),('legal','ownership-control','Ownership and control documentation',true,false,70),
  ('site','project-address','Project address',true,false,100),('site','rural-geographic-eligibility','Rural geographic eligibility evidence',true,true,110),
  ('site','site-control','Site control evidence',true,true,120),('site','parcel-information','Parcel information',true,false,130),('site','site-map','Site map',true,false,140),
  ('utility','utility-identified','Utility identified',true,false,200),('utility','interconnection-inquiry','Interconnection inquiry submitted',true,false,210),
  ('utility','circuit-capacity-response','Circuit-capacity response',true,true,220),('utility','interconnection-documentation','Interconnection documentation',true,true,230),('utility','utility-requirements','Utility requirements reviewed',true,false,240),
  ('engineering','preliminary-layout','Preliminary layout',true,true,300),('engineering','production-estimate','Production estimate',true,true,310),
  ('engineering','equipment-schedule','Equipment schedule',true,false,320),('engineering','epc-cost-estimate','Itemized construction quote',true,true,330),
  ('engineering','single-line-diagram','Single-line diagram when applicable',false,false,340),('engineering','engineering-narrative','Engineering narrative',true,false,350),
  ('environmental','environmental-review-started','Environmental review started',true,true,400),('environmental','flood-review','Flood review',true,false,410),
  ('environmental','wetlands-review','Wetlands review',true,false,420),('environmental','historic-cultural-review','Historic or cultural review when applicable',false,false,430),
  ('environmental','species-review','Threatened or endangered species review when applicable',false,false,440),('environmental','environmental-package','Environmental documentation sufficient for agency review',true,true,450),
  ('financial','sources-uses','Sources and uses',true,true,500),('financial','project-budget','Project budget',true,true,510),('financial','financing-plan','Financing plan',true,true,520),
  ('financial','cash-flow-model','Cash-flow model',true,false,530),('financial','applicant-financials','Applicant financial information',true,true,540),
  ('financial','construction-financing','Construction financing evidence when applicable',false,false,550),('financial','matching-funds','Matching funds evidence when applicable',false,false,560),
  ('commercial','offtaker-strategy','Off-taker strategy',true,false,600),('commercial','ppa-term-sheet','PPA term sheet',true,false,610),
  ('commercial','executed-commercial-agreement','Executed commercial agreement when required by strategy',false,false,620),('commercial','customer-energy-data','Customer energy data where relevant',false,false,630),
  ('submission','pre-application-discussion','USDA pre-application discussion',true,false,700),('submission','application-form','Correct application form identified',true,true,710),
  ('narrative','application-narrative','Narrative',true,true,720),('submission','certifications','Certifications',true,true,730),('submission','supporting-exhibits','Supporting exhibits',true,true,740),
  ('submission','completeness-review','Internal completeness review',true,true,750),('submission','submitted','Submitted',true,true,760),('submission','submission-confirmation','Submission confirmation',true,true,770),
  ('post-award','award-conditions','Award conditions reviewed',true,false,800),('post-award','closing-requirements','Closing requirements',true,false,810),
  ('post-award','construction-tracking','Construction tracking',true,false,820),('post-award','procurement-compliance','Procurement compliance',true,false,830),
  ('post-award','inspection','Inspection',true,false,840),('reimbursement','reimbursement-package','Reimbursement package',true,false,850),('post-award','final-reporting','Final reporting',true,false,860)
) as v(category,key,title,required,blocking,sort_order)
on conflict(template_id,requirement_key) do nothing;

with template as (select id,organization_id from public.funding_program_templates where program_key='usda-reap' and version='internal-preparation-v1')
insert into public.funding_template_milestones(organization_id,template_id,phase,title,description,sort_order)
select template.organization_id,template.id,v.phase,v.title,v.description,v.sort_order from template cross join (values
  ('planning','Planning','Define the internal funding strategy and responsible team.',10),
  ('pre-application','Pre-Application','Open the agency conversation and confirm current process.',20),
  ('eligibility','Eligibility','Document applicant, site, and program fit.',30),
  ('engineering','Technical Package','Assemble engineering and production evidence.',40),
  ('financial','Financial Package','Assemble budget, sources, uses, and financing evidence.',50),
  ('application','Application','Complete internal review and submit when authorized.',60),
  ('review','USDA Review','Track agency review and information requests.',70),
  ('award','Award and Closing','Document award conditions and closing requirements.',80),
  ('construction','Construction','Track construction and eligible costs.',90),
  ('reimbursement','Reimbursement','Prepare and reconcile reimbursement requests.',100),
  ('completed','Final Reporting','Complete closeout and final reporting.',110)
) as v(phase,title,description,sort_order)
on conflict(template_id,phase) do nothing;

-- Idempotently establish Project 001 funding sources without inventing amounts.
with project as (
  select p.id project_id,p.organization_id,p.created_by from public.projects p
  where p.project_code='CS-001' or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001') order by p.created_at limit 1
), template as (select id,organization_id from public.funding_program_templates where program_key='usda-reap' and version='internal-preparation-v1')
insert into public.project_funding_sources(organization_id,project_id,program_template_id,funding_type,program_name,provider_name,status,program_url,notes,created_by)
select project.organization_id,project.project_id,template.id,'grant','USDA REAP','USDA Rural Development','pre-application',
  'https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency-improvements',
  'Initial internal preparation workflow. No application, award, amount, percentage, eligibility determination, or current program rule is asserted.',project.created_by
from project join template on template.organization_id=project.organization_id on conflict(project_id,program_name) do nothing;

with project as (
  select p.id project_id,p.organization_id,p.created_by from public.projects p
  where p.project_code='CS-001' or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001') order by p.created_at limit 1
)
insert into public.project_funding_sources(organization_id,project_id,funding_type,program_name,status,notes,created_by)
select project.organization_id,project.project_id,v.funding_type,v.program_name,v.status,'Project funding category placeholder. Amount not yet modeled.',project.created_by
from project cross join (values
  ('tax-credit','Tax Credits','researching'),('debt','Debt','planning'),('equity','Equity','future'),
  ('equipment-financing','Equipment Financing','planning'),('incentive','Other Incentives','researching')
) as v(funding_type,program_name,status)
on conflict(project_id,program_name) do nothing;

-- Copy the editable template into Project 001. Project records may diverge from later template versions.
with source as (
  select s.id,s.organization_id,s.program_template_id from public.project_funding_sources s
  join public.projects p on p.id=s.project_id
  where s.program_name='USDA REAP' and (p.project_code='CS-001' or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001'))
), template_rows as (
  select r.*,source.id funding_source_id from public.funding_template_requirements r join source on source.program_template_id=r.template_id
)
insert into public.funding_requirements(
  organization_id,funding_source_id,category,requirement_key,title,description,required,blocking,confirmation_state,source_url,source_title,source_verified_date,notes,sort_order
)
select organization_id,funding_source_id,category,requirement_key,title,description,default_required,default_blocking,confirmation_state,source_url,source_title,date_verified,notes,sort_order
from template_rows on conflict(funding_source_id,requirement_key) do nothing;

update public.funding_requirements r set status='complete',completed_at=coalesce(completed_at,now()),notes=concat_ws(' ',r.notes,'Known internal project status: geographic eligibility evidence is recorded as complete; link and re-verify the supporting evidence before submission.')
from public.project_funding_sources s where r.funding_source_id=s.id and s.program_name='USDA REAP' and s.project_id in (select id from public.projects where project_code='CS-001' or project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001')) and r.requirement_key='rural-geographic-eligibility' and r.status<>'complete';
update public.funding_requirements r set status='waiting',notes=concat_ws(' ',r.notes,'Known internal project status: pending third-party response.')
from public.project_funding_sources s where r.funding_source_id=s.id and s.program_name='USDA REAP' and s.project_id in (select id from public.projects where project_code='CS-001' or project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001')) and r.requirement_key='circuit-capacity-response' and r.status='not-started';
update public.funding_requirements r set status='in-progress',notes=concat_ws(' ',r.notes,'Known internal project status: preparation pending.')
from public.project_funding_sources s where r.funding_source_id=s.id and s.program_name='USDA REAP' and s.project_id in (select id from public.projects where project_code='CS-001' or project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001')) and r.requirement_key in ('preliminary-layout','production-estimate','epc-cost-estimate') and r.status='not-started';
update public.funding_requirements r set status='in-progress',notes=concat_ws(' ',r.notes,'Known internal project status: commercial off-taker outreach is active.')
from public.project_funding_sources s where r.funding_source_id=s.id and s.program_name='USDA REAP' and s.project_id in (select id from public.projects where project_code='CS-001' or project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001')) and r.requirement_key='offtaker-strategy' and r.status='not-started';

with source as (select s.id,s.organization_id,s.program_template_id from public.project_funding_sources s join public.projects p on p.id=s.project_id where s.program_name='USDA REAP' and (p.project_code='CS-001' or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001')))
insert into public.funding_milestones(organization_id,funding_source_id,phase,title,description,status,sort_order)
select source.organization_id,source.id,t.phase,t.title,t.description,
  case t.phase when 'planning' then 'complete' when 'pre-application' then 'in-progress' else 'future' end,t.sort_order
from source join public.funding_template_milestones t on t.template_id=source.program_template_id
on conflict(funding_source_id,phase,title) do nothing;

-- Link known project milestones without duplicating them.
update public.funding_milestones fm set linked_project_milestone_id=pm.id
from public.project_funding_sources s join public.project_milestones pm on pm.project_id=s.project_id
where fm.funding_source_id=s.id and s.program_name='USDA REAP' and fm.linked_project_milestone_id is null
  and s.project_id in (select id from public.projects where project_code='CS-001' or project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001'))
  and ((fm.phase='utility' and pm.task_name ilike '%circuit-capacity%') or (fm.phase='engineering' and pm.task_name ilike '%production estimate%'));
