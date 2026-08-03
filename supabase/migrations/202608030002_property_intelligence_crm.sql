-- Sprint 2 completion: Property Intelligence and Acquisition CRM.
-- Additive normalization over the manual-first acquisition foundation.

alter table public.properties drop constraint if exists properties_current_status_check;
alter table public.properties
  add column if not exists name text,
  add column if not exists utility_name text,
  add column if not exists utility_territory_status text not null default 'unknown',
  add column if not exists site_control_status text not null default 'not_started',
  add column if not exists notes_summary text;
update public.properties set
  name = coalesce(name, project_name, address_line_1),
  utility_name = coalesce(utility_name, utility_id),
  notes_summary = coalesce(notes_summary, internal_summary);
alter table public.properties alter column name set not null;
alter table public.properties add constraint properties_current_status_check check (current_status in (
  'new','desktop_screening','owner_outreach','site_control','utility_screening',
  'detailed_diligence','candidate_project','promoted_to_project','rejected','archived'
));

alter table public.property_parcels
  add column if not exists owner_name text,
  add column if not exists assessed_value numeric(14,2),
  add column if not exists source text,
  add column if not exists last_verified_at timestamptz,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists archived_at timestamptz;
update public.property_parcels set
  source = coalesce(source, 'manual'),
  last_verified_at = coalesce(last_verified_at, verified_at);
alter table public.property_parcels drop constraint if exists property_parcels_source_quality_check;
alter table public.property_parcels add constraint property_parcels_source_quality_check
  check (source_quality in ('verified','estimated','user_reported','public_source','unknown'));

alter table public.property_score_runs
  add column if not exists estimated_field_count integer not null default 0,
  add column if not exists overridden_by uuid references public.profiles(id) on delete set null,
  add column if not exists overridden_at timestamptz;

alter table public.property_score_components drop constraint if exists property_score_components_source_quality_check;
alter table public.property_score_components
  add constraint property_score_components_source_quality_check check (source_quality in ('verified','estimated','user_reported','public_source','unknown')),
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists source_date date,
  add column if not exists missing_information text,
  add column if not exists entered_by uuid references public.profiles(id) on delete set null,
  add column if not exists verified_by uuid references public.profiles(id) on delete set null,
  add column if not exists verified_at timestamptz,
  add column if not exists notes text;

alter table public.property_data_sources drop constraint if exists property_data_sources_source_quality_check;
alter table public.property_data_sources
  add constraint property_data_sources_source_quality_check check (source_quality in ('verified','estimated','user_reported','public_source','unknown')),
  add column if not exists source_name text,
  add column if not exists source_date date,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists archived_at timestamptz;

alter table public.property_risk_flags
  add column if not exists status text not null default 'open',
  add column if not exists description text,
  add column if not exists source text,
  add column if not exists resolution_status text not null default 'unresolved',
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists archived_at timestamptz;
update public.property_risk_flags set description = coalesce(description, explanation);
alter table public.property_risk_flags
  add constraint property_risk_status_check check (status in ('open','monitoring','resolved','dismissed')),
  add constraint property_risk_resolution_check check (resolution_status in ('unresolved','mitigating','resolved','accepted'));

create table public.property_checklist_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  property_id uuid not null references public.properties(id) on delete cascade,
  item_key text not null,
  title text not null,
  status text not null default 'not_started' check (status in ('not_started','in_progress','complete','not_applicable','blocked')),
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  completed_at timestamptz,
  notes text,
  supporting_document_id uuid references public.documents(id) on delete set null,
  source text,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (organization_id, property_id, item_key)
);
create index property_checklist_property_idx on public.property_checklist_items (organization_id, property_id, sort_order);

alter table public.tasks
  add column if not exists blocker boolean not null default false,
  add column if not exists checklist_item_id uuid references public.property_checklist_items(id) on delete set null,
  add column if not exists archived_at timestamptz;

alter table public.property_contacts
  add column if not exists organization_id uuid references public.organizations(id) on delete restrict,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists archived_at timestamptz;
update public.property_contacts pc set organization_id = p.organization_id
from public.properties p where p.id = pc.property_id and pc.organization_id is null;
alter table public.property_contacts alter column organization_id set not null;
alter table public.property_contacts alter column organization_id set default public.current_organization_id();
alter table public.property_contacts drop constraint if exists property_contacts_relationship_type_check;
alter table public.property_contacts add constraint property_contacts_relationship_type_check check (relationship_type in (
  'owner','broker','attorney','surveyor','engineer','EPC','utility_contact','county_contact',
  'environmental_consultant','lender','investor','offtaker','other'
));

alter table public.documents
  add column if not exists confidentiality text not null default 'internal',
  add column if not exists archived_at timestamptz;
alter table public.documents drop constraint if exists documents_confidentiality_check;
alter table public.documents add constraint documents_confidentiality_check check (confidentiality in ('internal','confidential','restricted'));

alter table public.projects
  add column if not exists county text,
  add column if not exists location text,
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
  add column if not exists development_summary text,
  add column if not exists unresolved_risks jsonb not null default '[]'::jsonb,
  add column if not exists archived_at timestamptz;

alter table public.public_property_submissions
  add column if not exists converted_property_id uuid references public.properties(id) on delete set null,
  add column if not exists converted_by uuid references public.profiles(id) on delete set null,
  add column if not exists converted_at timestamptz;
create unique index if not exists public_submission_conversion_unique
  on public.public_property_submissions (converted_property_id) where converted_property_id is not null;

create trigger property_checklist_items_updated_at before update on public.property_checklist_items
  for each row execute function public.set_updated_at();
create trigger property_data_sources_updated_at before update on public.property_data_sources
  for each row execute function public.set_updated_at();
create trigger property_risk_flags_updated_at before update on public.property_risk_flags
  for each row execute function public.set_updated_at();
create trigger property_contacts_updated_at before update on public.property_contacts
  for each row execute function public.set_updated_at();

create or replace function public.seed_property_checklist()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare checklist_titles text[] := array[
  'Address verified','Parcel verified','Property owner verified','Legal access verified','Total acreage verified',
  'Usable acreage reviewed','Road access reviewed','Utility territory confirmed','Utility capacity requested',
  'Utility response received','Floodplain reviewed','Wetlands reviewed','Slope reviewed','Zoning reviewed',
  'Title reviewed','Environmental review completed','Survey completed','Geotechnical review completed',
  'Preliminary engineering completed','EPC budget received','Production estimate received','Off-taker opportunity identified'
];
declare checklist_keys text[] := array[
  'address_verified','parcel_verified','owner_verified','legal_access_verified','total_acreage_verified',
  'usable_acreage_reviewed','road_access_reviewed','utility_territory_confirmed','utility_capacity_requested',
  'utility_response_received','floodplain_reviewed','wetlands_reviewed','slope_reviewed','zoning_reviewed',
  'title_reviewed','environmental_review_completed','survey_completed','geotechnical_review_completed',
  'preliminary_engineering_completed','epc_budget_received','production_estimate_received','offtaker_identified'
];
declare index_value integer;
begin
  for index_value in 1..array_length(checklist_keys, 1) loop
    insert into public.property_checklist_items
      (organization_id, property_id, item_key, title, sort_order, created_by)
    values (new.organization_id, new.id, checklist_keys[index_value], checklist_titles[index_value], index_value, new.created_by)
    on conflict (organization_id, property_id, item_key) do nothing;
  end loop;
  return new;
end $$;
revoke all on function public.seed_property_checklist() from public, anon, authenticated;
create trigger properties_seed_checklist after insert on public.properties
  for each row execute function public.seed_property_checklist();

insert into public.property_checklist_items (organization_id, property_id, item_key, title, sort_order, created_by)
select p.organization_id, p.id, seed.item_key, seed.title, seed.sort_order, p.created_by
from public.properties p cross join (values
  ('address_verified','Address verified',1),('parcel_verified','Parcel verified',2),('owner_verified','Property owner verified',3),
  ('legal_access_verified','Legal access verified',4),('total_acreage_verified','Total acreage verified',5),
  ('usable_acreage_reviewed','Usable acreage reviewed',6),('road_access_reviewed','Road access reviewed',7),
  ('utility_territory_confirmed','Utility territory confirmed',8),('utility_capacity_requested','Utility capacity requested',9),
  ('utility_response_received','Utility response received',10),('floodplain_reviewed','Floodplain reviewed',11),
  ('wetlands_reviewed','Wetlands reviewed',12),('slope_reviewed','Slope reviewed',13),('zoning_reviewed','Zoning reviewed',14),
  ('title_reviewed','Title reviewed',15),('environmental_review_completed','Environmental review completed',16),
  ('survey_completed','Survey completed',17),('geotechnical_review_completed','Geotechnical review completed',18),
  ('preliminary_engineering_completed','Preliminary engineering completed',19),('epc_budget_received','EPC budget received',20),
  ('production_estimate_received','Production estimate received',21),('offtaker_identified','Off-taker opportunity identified',22)
) as seed(item_key,title,sort_order)
on conflict (organization_id, property_id, item_key) do nothing;

alter table public.property_checklist_items enable row level security;
revoke all on public.property_checklist_items from anon;

-- Operational records are writable by owner/admin/developer. Analysts retain
-- access to versioned assessment records but cannot mutate source property facts.
do $$
declare table_name text; policy_record record;
begin
  foreach table_name in array array[
    'properties','property_parcels','property_notes','contacts','property_contacts','documents',
    'tasks','property_checklist_items','projects','project_properties'
  ] loop
    for policy_record in select policyname from pg_policies where schemaname='public' and tablename=table_name loop
      execute format('drop policy %I on public.%I', policy_record.policyname, table_name);
    end loop;
    execute format('create policy %I on public.%I for select to authenticated using (organization_id = public.current_organization_id())', table_name || '_tenant_select', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'']::public.organization_role[]))', table_name || '_tenant_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'']::public.organization_role[])) with check (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'']::public.organization_role[]))', table_name || '_tenant_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[]))', table_name || '_tenant_delete', table_name);
  end loop;
end $$;

create trigger property_checklist_items_audit after insert or update or delete on public.property_checklist_items for each row execute function public.log_change();
create trigger property_contacts_audit after insert or update or delete on public.property_contacts for each row execute function public.log_change();
create trigger property_notes_audit after insert or update or delete on public.property_notes for each row execute function public.log_change();
create trigger tasks_audit after insert or update or delete on public.tasks for each row execute function public.log_change();

create or replace function public.property_activity(target_property_id uuid)
returns setof public.activity_log
language sql stable security invoker set search_path = public, pg_temp as $$
  select activity.* from public.activity_log activity
  where activity.organization_id = public.current_organization_id()
    and (
      activity.entity_id = target_property_id
      or activity.after_data ->> 'property_id' = target_property_id::text
      or activity.before_data ->> 'property_id' = target_property_id::text
    )
  order by activity.created_at desc
$$;
revoke all on function public.property_activity(uuid) from public, anon;
grant execute on function public.property_activity(uuid) to authenticated;

create or replace function public.record_property_event(target_property_id uuid, event_action text, details jsonb default '{}'::jsonb)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare tenant_id uuid;
begin
  if event_action not in ('property_archived','property_restored','property_promoted','public_submission_converted','score_overridden') then
    raise exception 'unsupported_property_event' using errcode = '22023';
  end if;
  select organization_id into tenant_id from public.properties
    where id = target_property_id and organization_id = public.current_organization_id();
  if tenant_id is null then raise exception 'property_not_found' using errcode = 'P0002'; end if;
  insert into public.activity_log (organization_id, actor_id, entity_type, entity_id, action, after_data)
    values (tenant_id, auth.uid(), 'property', target_property_id, event_action, details);
end $$;
revoke all on function public.record_property_event(uuid,text,jsonb) from public, anon;

create or replace function public.record_property_status_change()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare event_action text;
begin
  if old.current_status is distinct from new.current_status then
    insert into public.property_status_history
      (organization_id, property_id, from_status, to_status, changed_by)
    values (new.organization_id, new.id, old.current_status, new.current_status, auth.uid());
    event_action := case
      when new.current_status = 'archived' then 'property_archived'
      when old.current_status = 'archived' then 'property_restored'
      when new.current_status = 'promoted_to_project' then 'property_promoted'
      else 'status_changed'
    end;
    insert into public.activity_log (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
      values (new.organization_id, auth.uid(), 'property', new.id, event_action,
        jsonb_build_object('status', old.current_status), jsonb_build_object('status', new.current_status));
  end if;
  return new;
end $$;
revoke all on function public.record_property_status_change() from public, anon, authenticated;

create or replace function public.promote_property_to_project(target_property_id uuid)
returns public.projects
language plpgsql security definer set search_path = public, pg_temp as $$
declare property_record public.properties%rowtype;
declare project_record public.projects%rowtype;
declare existing_project_id uuid;
begin
  if not public.has_organization_role(array['owner','admin','developer']::public.organization_role[]) then
    raise exception 'insufficient_role' using errcode = '42501';
  end if;
  select * into property_record from public.properties
    where id = target_property_id and organization_id = public.current_organization_id() for update;
  if not found then raise exception 'property_not_found' using errcode = 'P0002'; end if;
  select project_id into existing_project_id from public.project_properties
    where property_id = target_property_id and relationship_type = 'originating_property';
  if existing_project_id is not null then
    select * into project_record from public.projects where id = existing_project_id;
    return project_record;
  end if;
  insert into public.projects (
    organization_id, property_id, project_code, project_name, project_stage, legal_entity,
    county, location, assigned_to, development_summary, unresolved_risks, created_by
  ) values (
    property_record.organization_id, property_record.id,
    'NS-' || upper(substr(replace(property_record.id::text, '-', ''), 1, 8)),
    coalesce(property_record.name, property_record.project_name, property_record.address_line_1),
    'prospect', 'NSoul LLC', property_record.county,
    concat_ws(', ', property_record.address_line_1, property_record.city, property_record.state),
    property_record.assigned_to,
    coalesce(property_record.notes_summary, property_record.internal_summary,
      'Promoted from preliminary property screening. All technical and commercial assumptions remain subject to diligence.'),
    coalesce((select jsonb_agg(jsonb_build_object('type', risk_type, 'description', description, 'severity', severity))
      from public.property_risk_flags where property_id = property_record.id and active), '[]'::jsonb),
    auth.uid()
  ) returning * into project_record;
  insert into public.project_properties (organization_id, project_id, property_id, relationship_type, created_by)
    values (property_record.organization_id, project_record.id, property_record.id, 'originating_property', auth.uid());
  update public.properties set current_status='promoted_to_project', status='converted-to-project', pipeline_stage='project-development'
    where id=property_record.id;
  return project_record;
end $$;
revoke all on function public.promote_property_to_project(uuid) from public, anon;
grant execute on function public.promote_property_to_project(uuid) to authenticated;

create or replace function public.convert_public_submission_to_property(target_submission_id uuid)
returns public.properties
language plpgsql security definer set search_path = public, pg_temp as $$
declare submission_record public.public_property_submissions%rowtype;
declare property_record public.properties%rowtype;
begin
  if not public.has_organization_role(array['owner','admin']::public.organization_role[]) then
    raise exception 'insufficient_role' using errcode = '42501';
  end if;
  select * into submission_record from public.public_property_submissions
    where id = target_submission_id and organization_id = public.current_organization_id() for update;
  if not found then raise exception 'submission_not_found' using errcode = 'P0002'; end if;
  if submission_record.converted_property_id is not null then
    select * into property_record from public.properties where id = submission_record.converted_property_id;
    return property_record;
  end if;
  insert into public.properties (
    organization_id, property_code, name, project_name, status, current_status, pipeline_stage,
    source_type, source, source_name, source_recorded_at, listing_url, source_url,
    address_line_1, city, county, state, total_acres, acreage_total, asking_price,
    owner_name, notes_summary, internal_summary, created_by
  ) values (
    submission_record.organization_id, 'PUB-' || upper(substr(replace(submission_record.id::text, '-', ''), 1, 8)),
    submission_record.property_address, submission_record.property_address, 'new', 'new', 'discovery',
    'public-submission', 'public-submission', submission_record.name, submission_record.created_at,
    submission_record.listing_url, submission_record.listing_url, submission_record.property_address,
    'Unknown', submission_record.county, 'Oklahoma', submission_record.approximate_acreage,
    submission_record.approximate_acreage, submission_record.asking_price, submission_record.name,
    submission_record.message, submission_record.message, auth.uid()
  ) returning * into property_record;
  update public.public_property_submissions set
    status = 'converted', converted_property_id = property_record.id,
    converted_by = auth.uid(), converted_at = now()
  where id = submission_record.id;
  perform public.record_property_event(property_record.id, 'public_submission_converted', jsonb_build_object('submission_id', submission_record.id));
  return property_record;
end $$;
revoke all on function public.convert_public_submission_to_property(uuid) from public, anon;
grant execute on function public.convert_public_submission_to_property(uuid) to authenticated;

comment on function public.promote_property_to_project(uuid) is 'Atomic, permission-checked, idempotent promotion retaining the source property.';
comment on function public.convert_public_submission_to_property(uuid) is 'Admin-only idempotent conversion that retains the original public intake record.';
comment on table public.property_checklist_items is 'Standard property due-diligence checklist with assignment, evidence, and audit support.';
