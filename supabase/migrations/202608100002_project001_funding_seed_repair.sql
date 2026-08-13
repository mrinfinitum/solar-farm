-- Repair Project 001 funding initialization when the canonical private project
-- record did not exist when the funding and federal-registration migrations ran.
-- This migration is idempotent and does not infer a REAP application, eligibility,
-- award, funding amount, current program rule, or sensitive federal identifier.

-- Establish the canonical private project only when neither its code nor name
-- already exists. Public project content is not used as an authorization source.
with org as (
  select id from public.organizations where slug='nsoul' limit 1
)
insert into public.projects(
  organization_id,project_code,project_name,project_stage,legal_entity,
  proposed_capacity_mw_dc,annual_generation_estimate_kwh,target_cod,utility,
  interconnection_status,offtaker_status,financing_status,grant_status,
  engineering_status,county,location,development_summary
)
select org.id,'CS-001','1 Cornerstone Lane Solar Farm','offtaker_development','NSoul LLC',
  1.5,2250000,'Q2/Q3 2027','Public Service Company of Oklahoma (PSO)',
  'pending','active','planning','pre-application','preliminary','McCurtain County',
  '1 Cornerstone Lane, Idabel, Oklahoma 74745',
  'Development-stage project. Utility, engineering, commercial, financing, permitting, and final approvals remain incomplete.'
from org
where not exists (
  select 1 from public.projects
  where project_code='CS-001'
     or project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001')
);

-- Attach the reusable funding categories to Project 001 without inventing amounts.
with project as (
  select p.id project_id,p.organization_id,p.created_by from public.projects p
  join public.organizations o on o.id=p.organization_id and o.slug='nsoul'
  where p.project_code='CS-001'
     or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001')
  order by p.created_at limit 1
), template as (
  select t.id,t.organization_id from public.funding_program_templates t
  where t.program_key='usda-reap' and t.version='internal-preparation-v1'
)
insert into public.project_funding_sources(
  organization_id,project_id,program_template_id,funding_type,program_name,
  provider_name,status,program_url,notes,created_by
)
select project.organization_id,project.project_id,template.id,'grant','USDA REAP',
  'USDA Rural Development','pre-application',
  'https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency-improvements',
  'Initial internal preparation workflow. No application, award, amount, percentage, eligibility determination, or current program rule is asserted.',
  project.created_by
from project join template on template.organization_id=project.organization_id
on conflict(project_id,program_name) do nothing;

with project as (
  select p.id project_id,p.organization_id,p.created_by from public.projects p
  join public.organizations o on o.id=p.organization_id and o.slug='nsoul'
  where p.project_code='CS-001'
     or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001')
  order by p.created_at limit 1
)
insert into public.project_funding_sources(
  organization_id,project_id,funding_type,program_name,status,notes,created_by
)
select project.organization_id,project.project_id,v.funding_type,v.program_name,v.status,
  'Project funding category placeholder. Amount not yet modeled.',project.created_by
from project cross join (values
  ('tax-credit','Tax Credits','researching'),
  ('debt','Debt','planning'),
  ('equity','Equity','future'),
  ('equipment-financing','Equipment Financing','planning'),
  ('incentive','Other Incentives','researching')
) as v(funding_type,program_name,status)
on conflict(project_id,program_name) do nothing;

-- Copy the current editable internal template into the newly available source.
with source as (
  select s.id,s.organization_id,s.program_template_id
  from public.project_funding_sources s
  join public.projects p on p.id=s.project_id
  where s.program_name='USDA REAP'
    and (p.project_code='CS-001'
      or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001'))
), template_rows as (
  select r.*,source.id funding_source_id
  from public.funding_template_requirements r
  join source on source.program_template_id=r.template_id
)
insert into public.funding_requirements(
  organization_id,funding_source_id,category,requirement_key,title,description,
  required,blocking,confirmation_state,source_url,source_title,
  source_verified_date,notes,sort_order
)
select organization_id,funding_source_id,category,requirement_key,title,description,
  default_required,default_blocking,confirmation_state,source_url,source_title,
  date_verified,notes,sort_order
from template_rows
on conflict(funding_source_id,requirement_key) do nothing;

with source as (
  select s.id,s.organization_id,s.program_template_id
  from public.project_funding_sources s
  join public.projects p on p.id=s.project_id
  where s.program_name='USDA REAP'
    and (p.project_code='CS-001'
      or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001'))
)
insert into public.funding_milestones(
  organization_id,funding_source_id,phase,title,description,status,sort_order
)
select source.organization_id,source.id,t.phase,t.title,t.description,
  case t.phase when 'planning' then 'complete' when 'pre-application' then 'in-progress' else 'future' end,
  t.sort_order
from source
join public.funding_template_milestones t on t.template_id=source.program_template_id
on conflict(funding_source_id,phase,title) do nothing;

-- Apply only verified Project 001 preparation states.
update public.funding_requirements r set
  status='complete',completed_at=coalesce(r.completed_at,timestamptz '2026-08-09 12:00:00-05'),
  notes=concat_ws(' ',r.notes,'Known internal project status: geographic eligibility evidence is recorded as complete; link and re-verify the supporting evidence before submission.'),
  updated_at=now()
from public.project_funding_sources s join public.projects p on p.id=s.project_id
where r.funding_source_id=s.id and s.program_name='USDA REAP'
  and (p.project_code='CS-001' or p.project_name='1 Cornerstone Lane Solar Farm')
  and r.requirement_key='rural-geographic-eligibility' and r.status<>'complete';

update public.funding_requirements r set
  status='waiting',notes=concat_ws(' ',r.notes,'Known internal project status: pending third-party response.'),updated_at=now()
from public.project_funding_sources s join public.projects p on p.id=s.project_id
where r.funding_source_id=s.id and s.program_name='USDA REAP'
  and (p.project_code='CS-001' or p.project_name='1 Cornerstone Lane Solar Farm')
  and r.requirement_key='circuit-capacity-response' and r.status='not-started';

update public.funding_requirements r set
  status='in-progress',notes=concat_ws(' ',r.notes,'Known internal project status: preparation pending.'),updated_at=now()
from public.project_funding_sources s join public.projects p on p.id=s.project_id
where r.funding_source_id=s.id and s.program_name='USDA REAP'
  and (p.project_code='CS-001' or p.project_name='1 Cornerstone Lane Solar Farm')
  and r.requirement_key in ('preliminary-layout','production-estimate','epc-cost-estimate')
  and r.status='not-started';

update public.funding_requirements r set
  status='in-progress',notes=concat_ws(' ',r.notes,'Known internal project status: commercial off-taker outreach is active.'),updated_at=now()
from public.project_funding_sources s join public.projects p on p.id=s.project_id
where r.funding_source_id=s.id and s.program_name='USDA REAP'
  and (p.project_code='CS-001' or p.project_name='1 Cornerstone Lane Solar Farm')
  and r.requirement_key='offtaker-strategy' and r.status='not-started';

-- Record the verified federal status without inserting or reading a UEI value.
with project as (
  select p.id,p.organization_id,p.created_by from public.projects p
  join public.organizations o on o.id=p.organization_id and o.slug='nsoul'
  where p.project_code='CS-001'
     or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001')
  order by p.created_at limit 1
), reap as (
  select s.id,s.project_id from public.project_funding_sources s
  join project p on p.id=s.project_id
  where s.program_name='USDA REAP' and s.archived_at is null limit 1
)
insert into public.organization_federal_registrations(
  organization_id,entity_name,registration_system,registration_type,uei_status,
  registration_status,submission_date,activation_confirmed_at,renewal_date,
  purpose,primary_program,official_source_url,primary_project_id,
  primary_funding_source_id,notes,created_by
)
select p.organization_id,'NSoul LLC','SAM.gov','Financial Assistance','assigned',
  'active',date '2026-08-09',timestamptz '2026-08-09 12:00:00-05',date '2027-08-09',
  'Federal financial assistance','USDA Rural Energy for America Program (REAP)',
  'https://sam.gov',p.id,reap.id,
  'SAM.gov Financial Assistance registration is Active for the current registration period. USDA REAP application not submitted.',
  p.created_by
from project p join reap on reap.project_id=p.id
on conflict(organization_id,registration_system,registration_type) do update set
  entity_name=excluded.entity_name,uei_status='assigned',registration_status='active',
  submission_date=excluded.submission_date,
  activation_confirmed_at=excluded.activation_confirmed_at,
  renewal_date=excluded.renewal_date,purpose=excluded.purpose,
  primary_program=excluded.primary_program,official_source_url=excluded.official_source_url,
  primary_project_id=excluded.primary_project_id,
  primary_funding_source_id=excluded.primary_funding_source_id,
  notes=excluded.notes,updated_at=now();

-- Complete the four configured federal-registration requirements. Legal applicant
-- identification remains in the applicant category and is also verified here.
update public.funding_requirements r set
  title=case r.requirement_key
    when 'sam-registration' then 'SAM.gov registration initiated'
    when 'uei' then 'Unique Entity ID assigned'
    else r.title end,
  status='complete',completed_at=coalesce(r.completed_at,timestamptz '2026-08-09 12:00:00-05'),
  confirmation_state=case when r.requirement_key='applicant-legal-entity' then 'internal-preparation' else 'source-verified' end,
  verified_at=case when r.requirement_key='applicant-legal-entity' then r.verified_at else coalesce(r.verified_at,timestamptz '2026-08-09 12:00:00-05') end,
  source_url=case when r.requirement_key='applicant-legal-entity' then r.source_url else 'https://sam.gov' end,
  source_title=case when r.requirement_key='applicant-legal-entity' then r.source_title else 'SAM.gov' end,
  source_verified_date=case when r.requirement_key='applicant-legal-entity' then r.source_verified_date else date '2026-08-09' end,
  notes=case r.requirement_key
    when 'applicant-legal-entity' then 'Verified legal applicant: NSoul LLC.'
    when 'sam-registration' then 'SAM.gov Financial Assistance registration initiated and submitted.'
    when 'uei' then 'UEI assignment confirmed. The identifier value is restricted and is not stored in this requirement.'
    when 'sam-financial-assistance-submitted' then 'Financial Assistance registration submitted for federal financial assistance purposes.'
    when 'sam-registration-active' then 'NSoul LLC Financial Assistance registration confirmed Active for the current registration period.'
    else r.notes end,
  updated_at=now()
from public.project_funding_sources s join public.projects p on p.id=s.project_id
where r.funding_source_id=s.id and s.program_name='USDA REAP'
  and (p.project_code='CS-001' or p.project_name='1 Cornerstone Lane Solar Farm')
  and r.requirement_key in (
    'applicant-legal-entity','sam-registration','uei',
    'sam-financial-assistance-submitted','sam-registration-active'
  );

-- Keep these current-program and eligibility determinations incomplete.
update public.funding_requirements r set
  title=case r.requirement_key
    when 'current-application-window-verified' then 'Current Oklahoma REAP application pathway and window verified'
    else r.title end,
  status='needs-review',completed_at=null,confirmation_state='needs-program-confirmation',
  sort_order=case r.requirement_key
    when 'current-application-window-verified' then 15
    when 'current-program-rules-verified' then 16
    when 'applicant-eligibility' then 17
    else r.sort_order end,
  updated_at=now()
from public.project_funding_sources s join public.projects p on p.id=s.project_id
where r.funding_source_id=s.id and s.program_name='USDA REAP'
  and (p.project_code='CS-001' or p.project_name='1 Cornerstone Lane Solar Farm')
  and r.requirement_key in (
    'current-application-window-verified','current-program-rules-verified','applicant-eligibility'
  ) and r.status<>'complete';

-- REAP remains pre-application. No application submission timestamp is written.
update public.project_funding_sources s set status='pre-application',updated_at=now()
from public.projects p
where p.id=s.project_id and s.program_name='USDA REAP'
  and (p.project_code='CS-001' or p.project_name='1 Cornerstone Lane Solar Farm')
  and s.submitted_at is null
  and s.status in ('researching','planning','pre-application','preparing');

-- Ensure the renewal task is present without creating an equivalent duplicate.
with org as (
  select id from public.organizations where slug='nsoul' limit 1
)
insert into public.tasks(
  organization_id,property_id,project_id,task_scope,title,description,
  category,priority,status,due_date,created_by
)
select org.id,null,null,'company','Renew SAM.gov Registration',
  'SAM.gov registration annual renewal date is August 9, 2027. Begin renewal preparation approximately 30 days in advance.',
  'federal-registration','high','open',date '2027-07-09',null
from org
where not exists (
  select 1 from public.tasks t
  where t.organization_id=org.id and t.task_scope='company'
    and t.title='Renew SAM.gov Registration' and t.due_date=date '2027-07-09'
    and t.archived_at is null
);

-- Add the sanitized activation milestone after the registration now exists.
with registration as (
  select r.* from public.organization_federal_registrations r
  join public.organizations o on o.id=r.organization_id
  where o.slug='nsoul' and r.registration_system='SAM.gov'
    and r.registration_type='Financial Assistance' limit 1
)
insert into public.activity_log(
  organization_id,actor_id,entity_type,entity_id,action,after_data,created_at
)
select organization_id,null,'organization_federal_registration',id,
  'sam_registration_activated',jsonb_build_object(
    'title','SAM.gov Registration Activated',
    'description','NSoul LLC''s federal Financial Assistance registration is now active in SAM.gov. Federal entity registration is complete for the current registration period.',
    'category','Funding / Federal Registration',
    'project_id',primary_project_id,
    'funding_source_id',primary_funding_source_id,
    'program','USDA REAP'
  ),timestamptz '2026-08-09 12:00:00-05'
from registration
where not exists (
  select 1 from public.activity_log a
  where a.entity_type='organization_federal_registration'
    and a.entity_id=registration.id and a.action='sam_registration_activated'
);
