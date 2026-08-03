-- Sprint 2: Property acquisition and preliminary site screening.
-- Additive migration: legacy fields remain available while canonical fields are introduced.

alter table public.properties
  add column if not exists owner_mailing_address text,
  add column if not exists total_acres numeric(12,2),
  add column if not exists estimated_usable_acres numeric(12,2),
  add column if not exists listing_url text,
  add column if not exists utility_id text,
  add column if not exists current_status text,
  add column if not exists source text,
  add column if not exists source_recorded_at timestamptz,
  add column if not exists last_verified_at timestamptz;

update public.properties set
  total_acres = coalesce(total_acres, acreage_total),
  estimated_usable_acres = coalesce(estimated_usable_acres, acreage_usable_estimate),
  listing_url = coalesce(listing_url, source_url),
  source = coalesce(source, source_type, 'manual'),
  source_recorded_at = coalesce(source_recorded_at, source_collected_at::timestamptz, created_at),
  current_status = coalesce(current_status, case
    when status = 'screening' then 'desktop_screening'
    when status = 'contacted' then 'owner_outreach'
    when status = 'site-control-discussion' then 'site_control'
    when status = 'utility-review' then 'utility_screening'
    when status = 'due-diligence' then 'detailed_diligence'
    when status = 'shortlisted' or status = 'converted-to-project' then 'candidate_project'
    else replace(status, '-', '_') end);

alter table public.properties alter column current_status set default 'new';
alter table public.properties alter column current_status set not null;
alter table public.properties add constraint properties_current_status_check check (current_status in (
  'new','desktop_screening','owner_outreach','site_control','utility_screening',
  'detailed_diligence','candidate_project','rejected','archived'
));
create index properties_acquisition_filters_idx on public.properties
  (organization_id, current_status, county, assigned_to, updated_at desc);

create table public.property_parcels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  property_id uuid not null references public.properties(id) on delete cascade,
  parcel_number text not null,
  county text,
  acres numeric(12,2),
  geometry_geojson jsonb,
  source_quality text not null default 'unknown' check (source_quality in ('verified','estimated','unknown')),
  source_url text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, property_id, parcel_number)
);

create table public.property_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  property_id uuid not null references public.properties(id) on delete cascade,
  assessment_type text not null default 'preliminary',
  inputs jsonb not null default '{}'::jsonb,
  notes text,
  assessed_by uuid references public.profiles(id) on delete set null,
  assessed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.property_score_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  property_id uuid not null references public.properties(id) on delete cascade,
  assessment_id uuid references public.property_assessments(id) on delete set null,
  model_version text not null,
  numeric_score numeric(5,2) not null check (numeric_score between 0 and 100),
  displayed_score numeric(5,2) not null check (displayed_score between 0 and 100),
  grade text not null check (grade in ('A','B','C','D','F')),
  recommendation text not null,
  overall_risk text not null check (overall_risk in ('low','moderate','high','critical','unknown')),
  confidence text not null check (confidence in ('high','moderate','low')),
  verified_field_count integer not null default 0,
  missing_critical_field_count integer not null default 0,
  raw_inputs jsonb not null default '{}'::jsonb,
  weighted_outputs jsonb not null default '{}'::jsonb,
  explanatory_notes text,
  override_score numeric(5,2) check (override_score between 0 and 100),
  override_reason text,
  scored_by uuid references public.profiles(id) on delete set null,
  scored_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint property_score_override_reason check (
    override_score is null or length(trim(coalesce(override_reason, ''))) >= 10
  )
);
create index property_score_runs_latest_idx on public.property_score_runs
  (organization_id, property_id, scored_at desc);

create table public.property_score_components (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  score_run_id uuid not null references public.property_score_runs(id) on delete cascade,
  category text not null,
  raw_score numeric(5,2) not null check (raw_score between 0 and 100),
  weight numeric(5,2) not null check (weight between 0 and 100),
  weighted_score numeric(5,2) not null,
  source_quality text not null check (source_quality in ('verified','estimated','unknown')),
  is_critical_missing boolean not null default false,
  explanation text not null,
  created_at timestamptz not null default now(),
  unique (score_run_id, category)
);

create table public.property_risk_flags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  property_id uuid not null references public.properties(id) on delete cascade,
  score_run_id uuid references public.property_score_runs(id) on delete cascade,
  risk_type text not null check (risk_type in (
    'no_viable_interconnection','insufficient_site_control','environmental_constraint',
    'incompatible_land_use','insufficient_usable_acreage','no_legal_access','title_defect',
    'failed_project_economics','no_plausible_offtaker'
  )),
  severity text not null default 'fatal' check (severity in ('warning','fatal')),
  active boolean not null default true,
  explanation text not null,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index property_risk_flags_active_idx on public.property_risk_flags
  (organization_id, property_id) where active;

create table public.property_data_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  property_id uuid not null references public.properties(id) on delete cascade,
  provider_key text not null,
  source_type text not null,
  source_url text,
  external_record_id text,
  fields_supplied text[] not null default '{}',
  source_quality text not null default 'unknown' check (source_quality in ('verified','estimated','unknown')),
  raw_payload jsonb,
  recorded_at timestamptz not null default now(),
  verified_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.property_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  property_id uuid not null references public.properties(id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  property_id uuid references public.properties(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_parent_check check (num_nonnulls(property_id, project_id) = 1)
);

create table public.project_properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete restrict,
  relationship_type text not null default 'originating_property',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, project_id, property_id),
  unique (organization_id, property_id, relationship_type)
);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'property_parcels','property_assessments','property_score_runs','property_score_components',
    'property_risk_flags','property_data_sources','property_status_history','comments','project_properties'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (organization_id = public.current_organization_id())', table_name || '_tenant_select', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[]))', table_name || '_tenant_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[])) with check (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[]))', table_name || '_tenant_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[]))', table_name || '_tenant_delete', table_name);
    execute format('revoke all on public.%I from anon', table_name);
  end loop;
end $$;

create or replace function public.record_property_status_change()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if old.current_status is distinct from new.current_status then
    insert into public.property_status_history
      (organization_id, property_id, from_status, to_status, changed_by)
    values (new.organization_id, new.id, old.current_status, new.current_status, auth.uid());
  end if;
  return new;
end $$;
create trigger property_status_history_trigger after update of current_status on public.properties
  for each row execute function public.record_property_status_change();
revoke all on function public.record_property_status_change() from public, anon, authenticated;

create trigger property_parcels_updated_at before update on public.property_parcels for each row execute function public.set_updated_at();
create trigger property_assessments_updated_at before update on public.property_assessments for each row execute function public.set_updated_at();
create trigger comments_updated_at before update on public.comments for each row execute function public.set_updated_at();

create trigger property_assessments_audit after insert or update or delete on public.property_assessments for each row execute function public.log_change();
create trigger property_score_runs_audit after insert or update or delete on public.property_score_runs for each row execute function public.log_change();
create trigger property_risk_flags_audit after insert or update or delete on public.property_risk_flags for each row execute function public.log_change();
create trigger project_properties_audit after insert or update or delete on public.project_properties for each row execute function public.log_change();

comment on table public.property_data_sources is 'Canonical provenance ledger for manual and future enrichment providers.';
comment on table public.property_score_runs is 'Immutable versioned preliminary screening results; overrides require a recorded reason.';
