-- Production provider operations for preliminary property screening.
-- Secrets remain deployment environment variables and are never stored here.

alter table public.data_providers drop constraint if exists data_providers_status_check;
alter table public.data_providers
  add column if not exists enabled boolean not null default true,
  add column if not exists health_status text not null default 'unknown',
  add column if not exists last_checked_at timestamptz,
  add column if not exists last_success_at timestamptz,
  add column if not exists last_failure_at timestamptz,
  add column if not exists last_error_summary text,
  add column if not exists cache_duration_seconds integer,
  add column if not exists quota_used_daily integer not null default 0,
  add column if not exists quota_used_monthly integer not null default 0,
  add constraint data_providers_status_check check (status in ('active','disabled','not_configured','rate_limited')),
  add constraint data_providers_health_check check (health_status in ('configured','operational','degraded','unavailable','rate_limited','disabled','unknown')),
  add constraint data_providers_cache_duration_check check (cache_duration_seconds is null or cache_duration_seconds between 60 and 31536000);

update public.data_providers set
  provider_name = case provider_key
    when 'flood-provider' then 'FEMA National Flood Hazard Layer'
    when 'wetlands-provider' then 'USFWS National Wetlands Inventory'
    when 'terrain-provider' then 'USGS 3DEP Elevation Point Query Service'
    when 'solar-resource-provider' then 'NLR Solar Resource API'
    when 'parcel-provider' then 'Parcel provider interface'
    else provider_name end,
  provider_version = case provider_key
    when 'flood-provider' then 'NFHL-Flood-Hazard-Zones-28'
    when 'wetlands-provider' then 'NWI-Wetlands-0'
    when 'terrain-provider' then 'EPQS-v1'
    when 'solar-resource-provider' then 'solar-resource-v1'
    when 'parcel-provider' then 'adapter-v1'
    else provider_version end,
  status = case when provider_key in ('census-geocoder','flood-provider','wetlands-provider','terrain-provider') then 'active' when provider_key = 'solar-resource-provider' then 'not_configured' else status end,
  credential_required = provider_key in ('solar-resource-provider','parcel-provider','land-cover-provider','road-access-provider','utility-territory-provider','grid-infrastructure-provider','commercial-load-provider'),
  cache_duration_seconds = coalesce(cache_duration_seconds, case provider_key
    when 'census-geocoder' then 2592000
    when 'flood-provider' then 2592000
    when 'wetlands-provider' then 7776000
    when 'terrain-provider' then 15552000
    when 'solar-resource-provider' then 31536000
    else 2592000 end),
  configuration = configuration - 'api_key' - 'token' - 'secret';

comment on column public.data_providers.configuration is 'Non-secret provider settings only. Credentials belong in server deployment environment variables.';
comment on column public.data_providers.health_status is 'Last observed operational health; not a guarantee of future availability or coverage.';
comment on column public.data_providers.cache_duration_seconds is 'Organization override for provider-specific cache freshness.';

create index if not exists provider_health_idx on public.data_providers (organization_id, health_status, last_checked_at desc);

create or replace function public.normalize_screening_step_credentials()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.provider_key in ('census-geocoder','flood-provider','wetlands-provider','terrain-provider') then new.credential_required := false; end if;
  return new;
end $$;
drop trigger if exists normalize_screening_step_credentials on public.property_enrichment_steps;
create trigger normalize_screening_step_credentials before insert or update of provider_key on public.property_enrichment_steps for each row execute function public.normalize_screening_step_credentials();

create or replace function public.seed_screening_providers_for_organization()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.data_providers (organization_id,provider_key,provider_name,provider_version,capability,status,credential_required,cache_duration_seconds)
  select new.id, provider_key, provider_name, provider_version, capability, status, credential_required, cache_seconds from (values
    ('census-geocoder','U.S. Census Geocoder','Public_AR_Current/Current_Current','geocoding','active',false,2592000),
    ('parcel-provider','Parcel provider interface','adapter-v1','parcel','not_configured',true,2592000),
    ('flood-provider','FEMA National Flood Hazard Layer','NFHL-Flood-Hazard-Zones-28','flood','active',false,2592000),
    ('wetlands-provider','USFWS National Wetlands Inventory','NWI-Wetlands-0','wetlands','active',false,7776000),
    ('terrain-provider','USGS 3DEP Elevation Point Query Service','EPQS-v1','terrain','active',false,15552000),
    ('land-cover-provider','Land-cover provider','stub-v1','land_cover','not_configured',true,2592000),
    ('road-access-provider','Road-access provider','stub-v1','road_access','not_configured',true,2592000),
    ('utility-territory-provider','Utility-territory provider','stub-v1','utility_territory','not_configured',true,2592000),
    ('grid-infrastructure-provider','Grid-infrastructure provider','stub-v1','grid_infrastructure','not_configured',true,2592000),
    ('solar-resource-provider','NLR Solar Resource API','solar-resource-v1','solar_resource','not_configured',true,31536000),
    ('commercial-load-provider','Commercial-context provider','stub-v1','commercial_context','not_configured',true,2592000)
  ) as p(provider_key,provider_name,provider_version,capability,status,credential_required,cache_seconds)
  on conflict (organization_id,provider_key) do nothing;
  return new;
end $$;
drop trigger if exists seed_screening_providers_after_organization on public.organizations;
create trigger seed_screening_providers_after_organization after insert on public.organizations for each row execute function public.seed_screening_providers_for_organization();
revoke all on function public.seed_screening_providers_for_organization() from public, anon, authenticated;
