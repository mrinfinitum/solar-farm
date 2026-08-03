-- Sprint 3: provider-agnostic property enrichment and preliminary GIS screening.

create table public.data_providers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_key text not null,
  provider_name text not null,
  provider_version text not null,
  capability text not null,
  status text not null default 'not_configured' check (status in ('active','disabled','not_configured','rate_limited')),
  credential_required boolean not null default false,
  daily_quota integer,
  monthly_quota integer,
  estimated_cost_per_request numeric(12,6),
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider_key)
);

create table public.property_enrichment_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','running','partially_complete','complete','failed','cancelled')),
  started_by uuid not null references public.profiles(id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  provider_count integer not null default 0,
  successful_provider_count integer not null default 0,
  failed_provider_count integer not null default 0,
  warning_count integer not null default 0,
  proposed_change_count integer not null default 0,
  accepted_change_count integer not null default 0,
  rejected_change_count integer not null default 0,
  score_before numeric(6,2),
  proposed_score_after numeric(6,2),
  final_score_after numeric(6,2),
  model_version text,
  summary text,
  error_summary text,
  forced_refresh boolean not null default false,
  batch_key uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index property_enrichment_one_active_run on public.property_enrichment_runs (property_id)
  where status in ('queued','running');
create index property_enrichment_run_history on public.property_enrichment_runs (organization_id, property_id, started_at desc);

create table public.property_enrichment_steps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  run_id uuid not null references public.property_enrichment_runs(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  provider_key text not null,
  capability text not null,
  sort_order integer not null,
  status text not null default 'pending' check (status in ('pending','running','complete','warning','unavailable','failed','skipped')),
  started_at timestamptz,
  completed_at timestamptz,
  warning text,
  error_message text,
  rate_limit_state text,
  credential_required boolean not null default false,
  reused_cached_result boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, provider_key)
);

create table public.property_enrichment_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  run_id uuid not null references public.property_enrichment_runs(id) on delete cascade,
  step_id uuid not null references public.property_enrichment_steps(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  provider_key text not null,
  provider_name text not null,
  provider_version text not null,
  capability text not null,
  request_parameters jsonb not null default '{}'::jsonb,
  normalized_result jsonb not null default '{}'::jsonb,
  raw_response_metadata jsonb not null default '{}'::jsonb,
  source_url text,
  retrieved_at timestamptz not null default now(),
  source_dataset_date date,
  confidence text not null default 'unknown' check (confidence in ('high','moderate','low','unknown')),
  preliminary boolean not null default true,
  error_state text,
  rate_limit_state text,
  credential_required boolean not null default false,
  cache_key text not null,
  expires_at timestamptz,
  freshness_status text not null default 'unknown' check (freshness_status in ('current','aging','stale','unknown')),
  reused_from_result_id uuid references public.property_enrichment_results(id) on delete set null,
  created_at timestamptz not null default now()
);
create index property_enrichment_cache on public.property_enrichment_results (organization_id, property_id, provider_key, cache_key, retrieved_at desc);

create table public.property_field_proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  run_id uuid not null references public.property_enrichment_runs(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  field_name text not null,
  current_value jsonb,
  proposed_value jsonb,
  normalized_value jsonb,
  source_id uuid references public.property_enrichment_results(id) on delete set null,
  source_quality text not null check (source_quality in ('verified','estimated','user_reported','public_source','unknown')),
  confidence text not null check (confidence in ('high','moderate','low','unknown')),
  proposal_reason text not null,
  conflict_status text not null default 'unresolved' check (conflict_status in ('no_conflict','differs_from_manual','differs_from_verified','multiple_sources_disagree','ambiguous','unresolved')),
  decision text not null default 'pending' check (decision in ('pending','accepted','rejected')),
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  rejected_by uuid references public.profiles(id) on delete set null,
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, field_name, source_id)
);

create table public.property_geometries (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade, run_id uuid references public.property_enrichment_runs(id) on delete set null,
  geometry_type text not null, geojson jsonb not null, parcel_number text, source_result_id uuid references public.property_enrichment_results(id) on delete set null,
  source_quality text not null default 'public_source', confidence text not null default 'unknown', preliminary boolean not null default true,
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.property_environmental_findings (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade, run_id uuid not null references public.property_enrichment_runs(id) on delete cascade,
  finding_type text not null, finding_label text not null, status text not null default 'unknown', overlap_percent numeric(7,3), affected_acres numeric(12,3),
  source_result_id uuid references public.property_enrichment_results(id) on delete set null, confidence text not null default 'unknown', preliminary boolean not null default true,
  recommended_action text not null, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table public.property_terrain_findings (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade, run_id uuid not null references public.property_enrichment_runs(id) on delete cascade,
  average_elevation numeric(12,3), average_slope numeric(7,3), maximum_slope numeric(7,3), terrain_variability numeric(12,3), aspect text,
  estimated_flat_acres numeric(12,3), land_cover_breakdown jsonb not null default '{}'::jsonb, tree_cover_percent numeric(7,3), grading_risk text not null default 'unknown',
  source_result_id uuid references public.property_enrichment_results(id) on delete set null, confidence text not null default 'unknown', preliminary boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.property_access_findings (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade, run_id uuid not null references public.property_enrichment_runs(id) on delete cascade,
  nearest_public_road text, distance_to_road_meters numeric(12,2), apparent_frontage boolean, likely_access_side text, road_classification text,
  verified_weight_limit_notes text, access_risk text not null default 'unknown', legal_access_status text not null default 'unknown',
  source_result_id uuid references public.property_enrichment_results(id) on delete set null, confidence text not null default 'unknown', preliminary boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.property_utility_findings (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade, run_id uuid not null references public.property_enrichment_runs(id) on delete cascade,
  likely_utility text, verification_status text not null default 'unknown' check (verification_status in ('unknown','likely','manually_confirmed','utility_confirmed')),
  utility_contact jsonb, territory_geojson jsonb, source_result_id uuid references public.property_enrichment_results(id) on delete set null,
  confidence text not null default 'unknown', preliminary boolean not null default true, created_at timestamptz not null default now()
);

create table public.property_grid_assets (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade, run_id uuid not null references public.property_enrichment_runs(id) on delete cascade,
  asset_type text not null, asset_name text, approximate_voltage_kv numeric(9,2), distance_miles numeric(10,3), geometry jsonb,
  source_result_id uuid references public.property_enrichment_results(id) on delete set null, source_dataset_date date, confidence text not null default 'unknown',
  preliminary boolean not null default true, created_at timestamptz not null default now()
);

create table public.property_commercial_context (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade, run_id uuid not null references public.property_enrichment_runs(id) on delete cascade,
  facility_name text not null, category text not null, approximate_distance_miles numeric(10,3), public_source text not null,
  potential_relevance text, verification_status text not null default 'unverified', source_result_id uuid references public.property_enrichment_results(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.property_screening_reports (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade, run_id uuid not null references public.property_enrichment_runs(id) on delete cascade,
  report_status text not null default 'ready', title text not null, executive_summary text, top_strengths jsonb not null default '[]'::jsonb,
  top_risks jsonb not null default '[]'::jsonb, missing_critical_information jsonb not null default '[]'::jsonb, recommended_actions jsonb not null default '[]'::jsonb,
  source_appendix jsonb not null default '[]'::jsonb, storage_path text, generated_by uuid references public.profiles(id) on delete set null,
  generated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (run_id)
);

create table public.provider_usage_logs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  provider_key text not null, capability text not null, property_id uuid references public.properties(id) on delete set null,
  run_id uuid references public.property_enrichment_runs(id) on delete set null, request_count integer not null default 1,
  estimated_cost numeric(12,6), status text not null, rate_limit_state text, requested_by uuid references public.profiles(id) on delete set null,
  occurred_at timestamptz not null default now()
);

create table public.provider_usage_summaries (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null default public.current_organization_id() references public.organizations(id) on delete cascade,
  provider_key text not null, period_start date not null, period_type text not null check (period_type in ('daily','monthly')),
  request_count integer not null default 0, estimated_cost numeric(14,6) not null default 0, rate_limited_count integer not null default 0,
  updated_at timestamptz not null default now(), unique (organization_id, provider_key, period_start, period_type)
);

alter table public.property_data_sources
  add column if not exists enrichment_result_id uuid references public.property_enrichment_results(id) on delete set null,
  add column if not exists confidence text,
  add column if not exists expires_at timestamptz,
  add column if not exists freshness_status text not null default 'unknown';

alter table public.properties
  add column if not exists geocoding_status text not null default 'not_started',
  add column if not exists screening_status text not null default 'not_started',
  add column if not exists latest_screened_at timestamptz,
  add column if not exists normalized_address text,
  add column if not exists geocode_confidence text;

create trigger data_providers_updated_at before update on public.data_providers for each row execute function public.set_updated_at();
create trigger property_enrichment_runs_updated_at before update on public.property_enrichment_runs for each row execute function public.set_updated_at();
create trigger property_enrichment_steps_updated_at before update on public.property_enrichment_steps for each row execute function public.set_updated_at();
create trigger property_field_proposals_updated_at before update on public.property_field_proposals for each row execute function public.set_updated_at();
create trigger property_geometries_updated_at before update on public.property_geometries for each row execute function public.set_updated_at();
create trigger provider_usage_summaries_updated_at before update on public.provider_usage_summaries for each row execute function public.set_updated_at();

do $$
declare table_name text; policy_record record;
begin
  foreach table_name in array array[
    'data_providers','property_enrichment_runs','property_enrichment_steps','property_enrichment_results','property_field_proposals',
    'property_geometries','property_environmental_findings','property_terrain_findings','property_access_findings','property_utility_findings',
    'property_grid_assets','property_commercial_context','property_screening_reports','provider_usage_logs','provider_usage_summaries'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon', table_name);
    for policy_record in select policyname from pg_policies where schemaname='public' and tablename=table_name loop
      execute format('drop policy %I on public.%I', policy_record.policyname, table_name);
    end loop;
    execute format('create policy %I on public.%I for select to authenticated using (organization_id = public.current_organization_id())', table_name || '_tenant_select', table_name);
    if table_name = 'data_providers' or table_name = 'provider_usage_summaries' then
      execute format('create policy %I on public.%I for insert to authenticated with check (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[]))', table_name || '_tenant_insert', table_name);
      execute format('create policy %I on public.%I for update to authenticated using (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[])) with check (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[]))', table_name || '_tenant_update', table_name);
    else
      execute format('create policy %I on public.%I for insert to authenticated with check (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[]))', table_name || '_tenant_insert', table_name);
      execute format('create policy %I on public.%I for update to authenticated using (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[])) with check (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[]))', table_name || '_tenant_update', table_name);
    end if;
    execute format('create policy %I on public.%I for delete to authenticated using (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[]))', table_name || '_tenant_delete', table_name);
  end loop;
end $$;

-- Analysts can generate screening proposals, but only operators may decide or
-- mutate them. This prevents direct PostgREST updates from bypassing review.
drop policy if exists property_field_proposals_tenant_update on public.property_field_proposals;
create policy property_field_proposals_operator_update on public.property_field_proposals
  for update to authenticated
  using (organization_id = public.current_organization_id() and public.has_organization_role(array['owner','admin','developer']::public.organization_role[]))
  with check (organization_id = public.current_organization_id() and public.has_organization_role(array['owner','admin','developer']::public.organization_role[]));

insert into public.data_providers (organization_id, provider_key, provider_name, provider_version, capability, status, credential_required)
select organizations.id, provider.provider_key, provider.provider_name, '1.0', provider.capability,
  case when provider.provider_key = 'census-geocoder' then 'active' else 'not_configured' end,
  provider.credential_required
from public.organizations
cross join (values
  ('census-geocoder','U.S. Census Geocoder','geocoding',false),
  ('parcel-provider','Parcel provider','parcel',true),
  ('flood-provider','Flood screening provider','flood',true),
  ('wetlands-provider','Wetlands screening provider','wetlands',true),
  ('terrain-provider','Terrain provider','terrain',true),
  ('land-cover-provider','Land-cover provider','land_cover',true),
  ('road-access-provider','Road and access provider','road_access',true),
  ('utility-territory-provider','Utility-territory provider','utility_territory',true),
  ('grid-infrastructure-provider','Grid-infrastructure provider','grid_infrastructure',true),
  ('solar-resource-provider','Solar-resource provider','solar_resource',true),
  ('commercial-load-provider','Commercial-context provider','commercial_context',true)
) as provider(provider_key, provider_name, capability, credential_required)
on conflict (organization_id, provider_key) do nothing;

create or replace function public.create_property_enrichment_run(target_property_id uuid, force_refresh boolean default false, requested_batch_key uuid default null)
returns public.property_enrichment_runs
language plpgsql security definer set search_path = public, pg_temp as $$
declare property_record public.properties%rowtype; run_record public.property_enrichment_runs%rowtype; prior_score numeric(6,2);
begin
  if not public.has_organization_role(array['owner','admin','developer','analyst']::public.organization_role[]) then
    raise exception 'insufficient_role' using errcode = '42501';
  end if;
  select * into property_record from public.properties where id=target_property_id and organization_id=public.current_organization_id() for update;
  if not found then raise exception 'property_not_found' using errcode='P0002'; end if;
  if exists(select 1 from public.property_enrichment_runs where property_id=target_property_id and status in ('queued','running')) then
    raise exception 'active_screening_exists' using errcode='23505';
  end if;
  select displayed_score into prior_score from public.property_score_runs where property_id=target_property_id order by scored_at desc limit 1;
  insert into public.property_enrichment_runs(organization_id,property_id,status,started_by,provider_count,score_before,proposed_score_after,model_version,forced_refresh,batch_key)
  values(property_record.organization_id,target_property_id,'queued',auth.uid(),11,prior_score,prior_score,'nsoul-preliminary-v2.0',force_refresh,requested_batch_key)
  returning * into run_record;
  update public.properties set screening_status='queued' where id=target_property_id;
  insert into public.property_enrichment_steps(organization_id,run_id,property_id,provider_key,capability,sort_order,credential_required)
  select property_record.organization_id,run_record.id,target_property_id,step.provider_key,step.capability,step.sort_order,step.credential_required from (values
    ('census-geocoder','geocoding',1,false),('parcel-provider','parcel',2,true),('flood-provider','flood',3,true),
    ('wetlands-provider','wetlands',4,true),('terrain-provider','terrain',5,true),('land-cover-provider','land_cover',6,true),
    ('road-access-provider','road_access',7,true),('utility-territory-provider','utility_territory',8,true),
    ('grid-infrastructure-provider','grid_infrastructure',9,true),('solar-resource-provider','solar_resource',10,true),
    ('commercial-load-provider','commercial_context',11,true)
  ) as step(provider_key,capability,sort_order,credential_required);
  insert into public.activity_log(organization_id,actor_id,entity_type,entity_id,action,after_data)
  values(property_record.organization_id,auth.uid(),'property_enrichment_run',run_record.id,'screening_queued',jsonb_build_object('property_id',target_property_id));
  return run_record;
end $$;
revoke all on function public.create_property_enrichment_run(uuid,boolean,uuid) from public, anon;
grant execute on function public.create_property_enrichment_run(uuid,boolean,uuid) to authenticated;

create or replace function public.decide_property_field_proposal(target_proposal_id uuid, accept_proposal boolean, rejection_note text default null)
returns public.property_field_proposals
language plpgsql security definer set search_path = public, pg_temp as $$
declare proposal public.property_field_proposals%rowtype; allowed_fields text[] := array['normalized_address','address_line_1','city','county','state','postal_code','latitude','longitude','parcel_number','total_acres','owner_name','utility_name'];
begin
  if not public.has_organization_role(array['owner','admin','developer']::public.organization_role[]) then raise exception 'insufficient_role' using errcode='42501'; end if;
  select * into proposal from public.property_field_proposals where id=target_proposal_id and organization_id=public.current_organization_id() for update;
  if not found then raise exception 'proposal_not_found' using errcode='P0002'; end if;
  if proposal.decision <> 'pending' then return proposal; end if;
  if accept_proposal then
    if not (proposal.field_name = any(allowed_fields)) then raise exception 'unsupported_property_field' using errcode='22023'; end if;
    if proposal.field_name = any(array['latitude','longitude','total_acres']) then
      execute format('update public.properties set %I = ($1 #>> ''{}'')::numeric, updated_at=now() where id=$2 and organization_id=$3',proposal.field_name)
        using proposal.normalized_value,proposal.property_id,proposal.organization_id;
    else
      execute format('update public.properties set %I = $1 #>> ''{}'', updated_at=now() where id=$2 and organization_id=$3',proposal.field_name)
        using proposal.normalized_value,proposal.property_id,proposal.organization_id;
    end if;
    update public.property_field_proposals set decision='accepted',accepted_by=auth.uid(),accepted_at=now() where id=proposal.id returning * into proposal;
  else
    update public.property_field_proposals set decision='rejected',rejected_by=auth.uid(),rejected_at=now(),rejection_reason=nullif(trim(rejection_note),'') where id=proposal.id returning * into proposal;
  end if;
  update public.property_enrichment_runs set
    accepted_change_count=(select count(*) from public.property_field_proposals where run_id=proposal.run_id and decision='accepted'),
    rejected_change_count=(select count(*) from public.property_field_proposals where run_id=proposal.run_id and decision='rejected')
    where id=proposal.run_id;
  insert into public.activity_log(organization_id,actor_id,entity_type,entity_id,action,after_data)
  values(proposal.organization_id,auth.uid(),'property_field_proposal',proposal.id,case when accept_proposal then 'proposal_accepted' else 'proposal_rejected' end,to_jsonb(proposal));
  return proposal;
end $$;
revoke all on function public.decide_property_field_proposal(uuid,boolean,text) from public, anon;
grant execute on function public.decide_property_field_proposal(uuid,boolean,text) to authenticated;

do $$ declare table_name text; begin
  foreach table_name in array array['property_enrichment_runs','property_enrichment_steps','property_enrichment_results','property_field_proposals','property_geometries','property_environmental_findings','property_terrain_findings','property_access_findings','property_utility_findings','property_grid_assets','property_commercial_context','property_screening_reports','provider_usage_logs'] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.log_change()',table_name || '_audit',table_name);
  end loop;
end $$;

comment on table public.property_enrichment_results is 'Source-attributed preliminary provider output. Raw metadata must exclude prohibited or unnecessary personal information.';
comment on table public.property_field_proposals is 'Review queue that prevents automated screening from silently overwriting manual or verified property facts.';
comment on table public.property_grid_assets is 'Nearby infrastructure context only; proximity does not establish hosting capacity, feasibility, cost, or utility approval.';
