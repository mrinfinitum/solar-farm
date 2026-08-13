-- Private federal-registration status for NSoul LLC and Project 001.
-- This migration records the 2026-08-09 SAM.gov submission without asserting
-- activation, applicant eligibility, a USDA REAP submission, or an award.

create table public.organization_federal_registrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  entity_name text not null,
  registration_system text not null,
  registration_type text not null,
  uei_status text not null default 'not-recorded' check (uei_status in ('not-recorded','assigned','needs-review')),
  registration_status text not null default 'not-started' check (registration_status in ('not-started','in-progress','submitted-pending-activation','active','expired','rejected','needs-review')),
  submission_date date,
  activation_confirmed_at timestamptz,
  purpose text,
  primary_program text,
  official_source_url text,
  primary_project_id uuid references public.projects(id) on delete set null,
  primary_funding_source_id uuid references public.project_funding_sources(id) on delete set null,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, registration_system, registration_type)
);

-- Sensitive identifiers are intentionally separated from broadly readable
-- registration status. No UEI value is seeded because the user did not provide it.
create table public.organization_federal_identifiers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  federal_registration_id uuid not null references public.organization_federal_registrations(id) on delete cascade,
  identifier_type text not null check (identifier_type in ('uei')),
  identifier_value text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (federal_registration_id, identifier_type)
);

create index organization_federal_registrations_org_idx
  on public.organization_federal_registrations(organization_id, registration_system, registration_status);
create index organization_federal_identifiers_registration_idx
  on public.organization_federal_identifiers(federal_registration_id, identifier_type);

create trigger organization_federal_registrations_updated_at before update on public.organization_federal_registrations
  for each row execute function public.set_updated_at();
create trigger organization_federal_identifiers_updated_at before update on public.organization_federal_identifiers
  for each row execute function public.set_updated_at();

alter table public.organization_federal_registrations enable row level security;
alter table public.organization_federal_identifiers enable row level security;

create policy organization_federal_registrations_select on public.organization_federal_registrations
  for select to authenticated using (organization_id=public.current_organization_id());
create policy organization_federal_registrations_insert on public.organization_federal_registrations
  for insert to authenticated with check (
    organization_id=public.current_organization_id()
    and public.has_organization_role(array['owner','admin','developer','analyst']::public.organization_role[])
  );
create policy organization_federal_registrations_update on public.organization_federal_registrations
  for update to authenticated using (
    organization_id=public.current_organization_id()
    and public.has_organization_role(array['owner','admin','developer','analyst']::public.organization_role[])
  ) with check (organization_id=public.current_organization_id());
create policy organization_federal_registrations_delete on public.organization_federal_registrations
  for delete to authenticated using (
    organization_id=public.current_organization_id()
    and public.has_organization_role(array['owner','admin']::public.organization_role[])
  );

-- The actual UEI, when deliberately entered later, is restricted to owners and
-- administrators. Funding pages query only the status table above.
create policy organization_federal_identifiers_select on public.organization_federal_identifiers
  for select to authenticated using (
    organization_id=public.current_organization_id()
    and public.has_organization_role(array['owner','admin']::public.organization_role[])
  );
create policy organization_federal_identifiers_insert on public.organization_federal_identifiers
  for insert to authenticated with check (
    organization_id=public.current_organization_id()
    and public.has_organization_role(array['owner','admin']::public.organization_role[])
  );
create policy organization_federal_identifiers_update on public.organization_federal_identifiers
  for update to authenticated using (
    organization_id=public.current_organization_id()
    and public.has_organization_role(array['owner','admin']::public.organization_role[])
  ) with check (organization_id=public.current_organization_id());
create policy organization_federal_identifiers_delete on public.organization_federal_identifiers
  for delete to authenticated using (
    organization_id=public.current_organization_id()
    and public.has_organization_role(array['owner','admin']::public.organization_role[])
  );

revoke all on public.organization_federal_registrations,public.organization_federal_identifiers from anon;
grant select,insert,update,delete on public.organization_federal_registrations to authenticated;
grant select,insert,update,delete on public.organization_federal_identifiers to authenticated;

-- Do not attach the generic row audit trigger to either table. Its complete-row
-- snapshots would copy a future UEI into activity_log. These audit functions emit
-- status-only events and never serialize identifier_value.
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
      'primary_program',target.primary_program,
      'primary_project_id',target.primary_project_id,
      'primary_funding_source_id',target.primary_funding_source_id
    ) end
  );
  return coalesce(new,old);
end $$;

create or replace function public.audit_federal_identifier_presence()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare target public.organization_federal_identifiers;
begin
  target := case when tg_op='DELETE' then old else new end;
  insert into public.activity_log(organization_id,actor_id,entity_type,entity_id,action,before_data,after_data)
  values(
    target.organization_id,auth.uid(),'organization_federal_identifier',target.id,lower(tg_op),null,
    case when tg_op='DELETE' then null else jsonb_build_object('identifier_type',target.identifier_type,'identifier_present',true) end
  );
  return coalesce(new,old);
end $$;

create trigger organization_federal_registrations_audit after insert or update or delete on public.organization_federal_registrations
  for each row execute function public.audit_federal_registration_status();
create trigger organization_federal_identifiers_audit after insert or update or delete on public.organization_federal_identifiers
  for each row execute function public.audit_federal_identifier_presence();

-- Extend the editable internal preparation template. These status prompts are
-- project workflow records, not immutable statements of current USDA rules.
update public.funding_template_requirements
set title='SAM.gov registration initiated',description='Track the start of the entity registration process.',updated_at=now()
where requirement_key='sam-registration' and template_id in (
  select id from public.funding_program_templates where program_key='usda-reap' and version='internal-preparation-v1'
);
update public.funding_template_requirements
set title='Unique Entity ID assigned',description='Record assignment status. Store the identifier only in the restricted federal identifier record.',updated_at=now()
where requirement_key='uei' and template_id in (
  select id from public.funding_program_templates where program_key='usda-reap' and version='internal-preparation-v1'
);

with template as (
  select id,organization_id from public.funding_program_templates where program_key='usda-reap' and version='internal-preparation-v1'
)
insert into public.funding_template_requirements(
  organization_id,template_id,category,requirement_key,title,description,default_required,default_blocking,
  confirmation_state,source_url,source_title,sort_order
)
select template.organization_id,template.id,v.category,v.requirement_key,v.title,v.description,true,v.blocking,
  'needs-program-confirmation',v.source_url,v.source_title,v.sort_order
from template cross join (values
  ('registration','sam-financial-assistance-submitted','SAM.gov Financial Assistance registration submitted','Confirm submission for federal financial assistance purposes. Submission is not Active status.',true,'https://sam.gov','SAM.gov',45),
  ('registration','sam-registration-active','SAM.gov registration active','Confirm Active status in SAM.gov before treating federal registration as complete.',true,'https://sam.gov','SAM.gov',55),
  ('submission','current-program-rules-verified','Current REAP program rules verified','Re-verify the preparation checklist against current official USDA Rural Development guidance.',true,'https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency-improvements','USDA Rural Development REAP program page',690),
  ('submission','current-application-window-verified','Current REAP application window and deadline verified','Confirm the current application window and deadline using official USDA guidance.',true,'https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency-improvements','USDA Rural Development REAP program page',695)
) as v(category,requirement_key,title,description,blocking,source_url,source_title,sort_order)
on conflict(template_id,requirement_key) do update set
  title=excluded.title,description=excluded.description,default_required=excluded.default_required,
  default_blocking=excluded.default_blocking,source_url=excluded.source_url,source_title=excluded.source_title,
  sort_order=excluded.sort_order,updated_at=now();

-- Seed/update the NSoul LLC status record and associate it with Project 001 and
-- the existing USDA REAP funding source. No identifier value is inserted.
with project as (
  select p.id,p.organization_id,p.created_by from public.projects p
  where p.project_code='CS-001' or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001')
  order by p.created_at limit 1
), reap as (
  select s.id,s.project_id from public.project_funding_sources s join project p on p.id=s.project_id
  where s.program_name='USDA REAP' and s.archived_at is null limit 1
)
insert into public.organization_federal_registrations(
  organization_id,entity_name,registration_system,registration_type,uei_status,registration_status,
  submission_date,purpose,primary_program,official_source_url,primary_project_id,primary_funding_source_id,notes,created_by
)
select p.organization_id,'NSoul LLC','SAM.gov','Financial Assistance','assigned','submitted-pending-activation',
  date '2026-08-09','Federal financial assistance','USDA Rural Energy for America Program (REAP)','https://sam.gov',
  p.id,reap.id,'SAM.gov registration submitted. Active status remains pending confirmation. USDA REAP application not submitted.',p.created_by
from project p join reap on reap.project_id=p.id
on conflict(organization_id,registration_system,registration_type) do update set
  entity_name=excluded.entity_name,uei_status=excluded.uei_status,registration_status=excluded.registration_status,
  submission_date=excluded.submission_date,purpose=excluded.purpose,primary_program=excluded.primary_program,
  official_source_url=excluded.official_source_url,primary_project_id=excluded.primary_project_id,
  primary_funding_source_id=excluded.primary_funding_source_id,notes=excluded.notes,updated_at=now()
where public.organization_federal_registrations.uei_status is distinct from excluded.uei_status
   or public.organization_federal_registrations.registration_status is distinct from excluded.registration_status
   or public.organization_federal_registrations.submission_date is distinct from excluded.submission_date
   or public.organization_federal_registrations.primary_project_id is distinct from excluded.primary_project_id
   or public.organization_federal_registrations.primary_funding_source_id is distinct from excluded.primary_funding_source_id;

-- Copy newly added template prompts into Project 001, without duplicating rows.
with source as (
  select s.id,s.organization_id,s.program_template_id from public.project_funding_sources s
  join public.projects p on p.id=s.project_id
  where s.program_name='USDA REAP' and s.archived_at is null
    and (p.project_code='CS-001' or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001'))
), template_rows as (
  select r.*,source.id funding_source_id from public.funding_template_requirements r
  join source on source.program_template_id=r.template_id
  where r.requirement_key in ('sam-financial-assistance-submitted','sam-registration-active','current-program-rules-verified','current-application-window-verified')
)
insert into public.funding_requirements(
  organization_id,funding_source_id,category,requirement_key,title,description,required,blocking,
  confirmation_state,source_url,source_title,source_verified_date,notes,sort_order
)
select organization_id,funding_source_id,category,requirement_key,title,description,default_required,default_blocking,
  confirmation_state,source_url,source_title,date_verified,notes,sort_order
from template_rows on conflict(funding_source_id,requirement_key) do nothing;

-- Today’s verified registration progress. SAM Active remains a separate waiting
-- requirement, so the registration category cannot receive full completion credit.
update public.funding_requirements r set
  title=case r.requirement_key
    when 'sam-registration' then 'SAM.gov registration initiated'
    when 'uei' then 'Unique Entity ID assigned'
    else r.title end,
  status='complete',completed_at=coalesce(r.completed_at,timestamptz '2026-08-09 12:00:00-05'),
  confirmation_state=case when r.requirement_key='applicant-legal-entity' then 'internal-preparation' else 'source-verified' end,
  source_url=case when r.requirement_key='applicant-legal-entity' then r.source_url else 'https://sam.gov' end,
  source_title=case when r.requirement_key='applicant-legal-entity' then r.source_title else 'SAM.gov' end,
  source_verified_date=case when r.requirement_key='applicant-legal-entity' then r.source_verified_date else date '2026-08-09' end,
  notes=case r.requirement_key
    when 'applicant-legal-entity' then 'Verified legal applicant: NSoul LLC.'
    when 'sam-registration' then 'SAM.gov Financial Assistance entity registration was initiated and subsequently submitted.'
    when 'uei' then 'UEI assignment confirmed. The identifier value is restricted and is not stored in this requirement.'
    when 'sam-financial-assistance-submitted' then 'Financial Assistance registration submitted for federal financial assistance purposes. Active status remains pending.'
    else r.notes end,
  updated_at=now()
from public.project_funding_sources s join public.projects p on p.id=s.project_id
where r.funding_source_id=s.id and s.program_name='USDA REAP'
  and (p.project_code='CS-001' or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001'))
  and r.requirement_key in ('applicant-legal-entity','sam-registration','uei','sam-financial-assistance-submitted');

update public.funding_requirements r set
  status='waiting',completed_at=null,confirmation_state='needs-program-confirmation',sort_order=55,
  notes='SAM.gov Financial Assistance registration has been submitted. Confirm Active status before treating federal registration as complete.',updated_at=now()
from public.project_funding_sources s join public.projects p on p.id=s.project_id
where r.funding_source_id=s.id and s.program_name='USDA REAP'
  and (p.project_code='CS-001' or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001'))
  and r.requirement_key='sam-registration-active' and r.status<>'complete';

update public.funding_requirements r set status='needs-review',completed_at=null,confirmation_state='needs-program-confirmation',updated_at=now()
from public.project_funding_sources s join public.projects p on p.id=s.project_id
where r.funding_source_id=s.id and s.program_name='USDA REAP'
  and (p.project_code='CS-001' or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001'))
  and r.requirement_key in ('applicant-eligibility','current-program-rules-verified','current-application-window-verified')
  and r.status<>'complete';

-- Keep USDA REAP at pre-application and never infer a submission timestamp.
update public.project_funding_sources s set status='pre-application',updated_at=now()
from public.projects p where p.id=s.project_id and s.program_name='USDA REAP'
  and (p.project_code='CS-001' or p.project_name in ('1 Cornerstone Lane Solar Farm','Cornerstone Solar Project 001'))
  and s.status in ('researching','planning','pre-application','preparing') and s.submitted_at is null;

-- Requested sanitized activity entry. It intentionally includes no UEI value.
with registration as (
  select r.* from public.organization_federal_registrations r
  join public.organizations o on o.id=r.organization_id
  where o.slug='nsoul' and r.registration_system='SAM.gov' and r.registration_type='Financial Assistance' limit 1
)
insert into public.activity_log(organization_id,actor_id,entity_type,entity_id,action,after_data,created_at)
select organization_id,null,'organization_federal_registration',id,'sam_financial_assistance_registration_submitted',
  jsonb_build_object(
    'title','SAM.gov Financial Assistance Registration Submitted',
    'description','NSoul LLC completed and submitted its SAM.gov Financial Assistance registration. A Unique Entity ID has been assigned. Active registration remains pending confirmation.',
    'category','Funding / Federal Registration',
    'project_id',primary_project_id,
    'funding_source_id',primary_funding_source_id,
    'program','USDA REAP'
  ),timestamptz '2026-08-09 12:00:00-05'
from registration
where not exists (
  select 1 from public.activity_log a where a.entity_type='organization_federal_registration'
    and a.entity_id=registration.id and a.action='sam_financial_assistance_registration_submitted'
);
