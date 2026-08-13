-- Record verified SAM.gov activation for NSoul LLC without changing USDA REAP
-- application, eligibility, review, award, or funding status.

alter table public.organization_federal_registrations
  add column if not exists renewal_date date;

-- Preserve the existing task system while allowing organization-owned renewal
-- work that is not tied to one property or project.
alter table public.tasks
  add column if not exists task_scope text not null default 'record';
alter table public.tasks
  drop constraint if exists task_scope_check;
alter table public.tasks
  add constraint task_scope_check check (task_scope in ('record','company'));
alter table public.tasks
  drop constraint if exists task_parent;
alter table public.tasks
  add constraint task_parent check (
    (task_scope='company' and property_id is null and project_id is null)
    or (task_scope='record' and (property_id is not null or project_id is not null))
  );
create index if not exists tasks_company_due_idx
  on public.tasks(organization_id,due_date) where task_scope='company' and archived_at is null;

-- Keep registration audit events status-only. Never serialize the restricted UEI.
create or replace function public.audit_federal_registration_status()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare target public.organization_federal_registrations;
begin
  target := case when tg_op='DELETE' then old else new end;
  insert into public.activity_log(organization_id,actor_id,entity_type,entity_id,action,before_data,after_data)
  values(
    target.organization_id,auth.uid(),'organization_federal_registration',target.id,lower(tg_op),null,
    case when tg_op='DELETE' then null else jsonb_build_object(
      'entity_name',target.entity_name,
      'registration_system',target.registration_system,
      'registration_type',target.registration_type,
      'uei_status',target.uei_status,
      'registration_status',target.registration_status,
      'submission_date',target.submission_date,
      'activation_confirmed_at',target.activation_confirmed_at,
      'renewal_date',target.renewal_date,
      'primary_program',target.primary_program,
      'primary_project_id',target.primary_project_id,
      'primary_funding_source_id',target.primary_funding_source_id
    ) end
  );
  return coalesce(new,old);
end $$;

-- Verified federal registration status. The restricted identifier record is
-- deliberately untouched and any stored UEI remains private.
update public.organization_federal_registrations r set
  uei_status='assigned',
  registration_status='active',
  activation_confirmed_at=timestamptz '2026-08-09 12:00:00-05',
  renewal_date=date '2027-08-09',
  notes='SAM.gov Financial Assistance registration is Active for the current registration period. USDA REAP application not submitted.',
  updated_at=now()
from public.organizations o
where r.organization_id=o.id and o.slug='nsoul'
  and r.registration_system='SAM.gov' and r.registration_type='Financial Assistance'
  and (
    r.uei_status is distinct from 'assigned'
    or r.registration_status is distinct from 'active'
    or r.activation_confirmed_at is distinct from timestamptz '2026-08-09 12:00:00-05'
    or r.renewal_date is distinct from date '2027-08-09'
  );

-- Complete only the verified SAM Active requirement. Readiness continues to be
-- calculated from the requirement records at request time.
update public.funding_requirements r set
  status='complete',
  completed_at=coalesce(r.completed_at,timestamptz '2026-08-09 12:00:00-05'),
  confirmation_state='source-verified',
  verified_at=coalesce(r.verified_at,timestamptz '2026-08-09 12:00:00-05'),
  source_url='https://sam.gov',
  source_title='SAM.gov',
  source_verified_date=date '2026-08-09',
  notes='NSoul LLC Financial Assistance registration confirmed Active for the current registration period.',
  updated_at=now()
from public.project_funding_sources s join public.projects p on p.id=s.project_id
where r.funding_source_id=s.id and s.program_name='USDA REAP'
  and (p.project_code='CS-001' or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001'))
  and r.requirement_key='sam-registration-active'
  and r.status<>'complete';

-- Configure the remaining preparation sequence without manufacturing a result.
-- The deterministic engine still selects from actual incomplete blockers.
update public.funding_requirements r set
  title=case r.requirement_key
    when 'current-application-window-verified' then 'Current Oklahoma REAP application pathway and window verified'
    else r.title end,
  sort_order=case r.requirement_key
    when 'current-application-window-verified' then 15
    when 'current-program-rules-verified' then 16
    when 'applicant-eligibility' then 17
    else r.sort_order end,
  updated_at=now()
from public.project_funding_sources s join public.projects p on p.id=s.project_id
where r.funding_source_id=s.id and s.program_name='USDA REAP'
  and (p.project_code='CS-001' or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001'))
  and r.requirement_key in ('current-application-window-verified','current-program-rules-verified','applicant-eligibility')
  and r.status<>'complete';

update public.funding_template_requirements set
  title=case requirement_key
    when 'current-application-window-verified' then 'Current Oklahoma REAP application pathway and window verified'
    else title end,
  sort_order=case requirement_key
    when 'current-application-window-verified' then 15
    when 'current-program-rules-verified' then 16
    when 'applicant-eligibility' then 17
    else sort_order end,
  updated_at=now()
where template_id in (
  select id from public.funding_program_templates where program_key='usda-reap' and version='internal-preparation-v1'
) and requirement_key in ('current-application-window-verified','current-program-rules-verified','applicant-eligibility');

-- REAP remains pre-application and no application submission timestamp is set.
update public.project_funding_sources s set status='pre-application',updated_at=now()
from public.projects p where p.id=s.project_id and s.program_name='USDA REAP'
  and (p.project_code='CS-001' or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001'))
  and s.status in ('researching','planning','pre-application','preparing') and s.submitted_at is null;

-- Company-level renewal preparation task, created only when no equivalent open
-- or completed task exists for the same renewal period.
with org as (
  select id from public.organizations where slug='nsoul' limit 1
)
insert into public.tasks(
  organization_id,property_id,project_id,task_scope,title,description,category,priority,status,due_date,created_by
)
select org.id,null,null,'company','Renew SAM.gov Registration',
  'SAM.gov registration annual renewal date is August 9, 2027. Begin renewal preparation approximately 30 days in advance.',
  'federal-registration','high','open',date '2027-07-09',null
from org
where not exists (
  select 1 from public.tasks t where t.organization_id=org.id
    and t.task_scope='company' and t.title='Renew SAM.gov Registration'
    and t.due_date=date '2027-07-09' and t.archived_at is null
);

-- Requested sanitized activation milestone. It contains no UEI value.
with registration as (
  select r.* from public.organization_federal_registrations r
  join public.organizations o on o.id=r.organization_id
  where o.slug='nsoul' and r.registration_system='SAM.gov' and r.registration_type='Financial Assistance' limit 1
)
insert into public.activity_log(organization_id,actor_id,entity_type,entity_id,action,after_data,created_at)
select organization_id,null,'organization_federal_registration',id,'sam_registration_activated',
  jsonb_build_object(
    'title','SAM.gov Registration Activated',
    'description','NSoul LLC''s federal Financial Assistance registration is now active in SAM.gov. Federal entity registration is complete for the current registration period.',
    'category','Funding / Federal Registration',
    'project_id',primary_project_id,
    'funding_source_id',primary_funding_source_id,
    'program','USDA REAP'
  ),timestamptz '2026-08-09 12:00:00-05'
from registration
where not exists (
  select 1 from public.activity_log a where a.entity_type='organization_federal_registration'
    and a.entity_id=registration.id and a.action='sam_registration_activated'
);
