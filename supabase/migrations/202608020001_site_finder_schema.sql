create extension if not exists pgcrypto;

create type public.user_role as enum ('admin','analyst','viewer');
create type public.task_status as enum ('open','in-progress','waiting','completed','canceled');
create type public.task_priority as enum ('low','normal','high','critical');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text not null, role public.user_role not null default 'viewer', organization text default 'Cornerstone Solar',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(), property_code text not null unique, project_name text, status text not null default 'new', pipeline_stage text not null default 'discovery',
  source_type text, source_name text, source_url text, source_listing_id text, source_collected_at date, listing_status text,
  address_line_1 text not null, address_line_2 text, city text not null, county text not null, state text not null default 'Oklahoma', postal_code text,
  latitude numeric(10,7), longitude numeric(10,7), parcel_number text, legal_description text,
  acreage_total numeric(12,2), acreage_usable_estimate numeric(12,2), asking_price numeric(14,2), price_per_acre numeric(12,2), annual_property_tax numeric(12,2),
  property_type text, current_land_use text, tillable_status text, cleared_percentage numeric(5,2), wooded_percentage numeric(5,2), pasture_percentage numeric(5,2),
  slope_average_percent numeric(6,2), slope_max_percent numeric(6,2), road_frontage_feet numeric(12,2), road_type text, legal_access_status text,
  topography_notes text, vegetation_notes text, improvements_notes text, water_features_notes text,
  seller_financing_available boolean, lease_option_possible boolean, purchase_possible boolean, target_control_structure text,
  owner_name text, broker_name text, broker_company text, broker_email text, broker_phone text, listing_expiration_date date,
  internal_summary text, next_action text, next_action_due_date date, assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  constraint property_status_valid check (status in ('new','screening','researching','contacted','site-control-discussion','due-diligence','utility-review','shortlisted','rejected','converted-to-project','archived')),
  constraint pipeline_stage_valid check (pipeline_stage in ('discovery','desktop-screening','owner-outreach','preliminary-diligence','site-control','utility-diligence','engineering','project-development')),
  constraint percentages_valid check ((cleared_percentage is null or cleared_percentage between 0 and 100) and (wooded_percentage is null or wooded_percentage between 0 and 100) and (pasture_percentage is null or pasture_percentage between 0 and 100)),
  constraint coordinates_valid check ((latitude is null or latitude between -90 and 90) and (longitude is null or longitude between -180 and 180))
);
create unique index properties_source_listing_unique on public.properties(source_name, source_listing_id) where source_listing_id is not null;
create index properties_filter_idx on public.properties(county, pipeline_stage, status, updated_at desc);
create index properties_assigned_idx on public.properties(assigned_to) where archived_at is null;

create table public.property_utility (
  id uuid primary key default gen_random_uuid(), property_id uuid not null unique references public.properties(id) on delete cascade,
  electric_utility text, service_territory_confirmed boolean, nearest_line_type text, nearest_line_voltage text,
  distance_to_three_phase_miles numeric(9,3), distance_to_distribution_line_miles numeric(9,3), distance_to_transmission_line_miles numeric(9,3),
  nearest_substation_name text, distance_to_substation_miles numeric(9,3), substation_capacity_known boolean, circuit_capacity_status text default 'unknown', feeder_name text,
  interconnection_contact_name text, interconnection_contact_email text, interconnection_request_date date, interconnection_response_date date, interconnection_notes text,
  utility_source_url text, verified_at timestamptz, verification_status text default 'unknown', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint utility_status_valid check (circuit_capacity_status in ('unknown','desktop-estimate','requested','utility-confirmed','unavailable','constrained')),
  constraint utility_verification_valid check (verification_status in ('unknown','desktop-estimate','requested','utility-confirmed','unavailable','constrained'))
);

create table public.property_environmental (
  id uuid primary key default gen_random_uuid(), property_id uuid not null unique references public.properties(id) on delete cascade,
  fema_flood_zone text, floodplain_percentage numeric(5,2), wetlands_status text, wetlands_percentage numeric(5,2), endangered_species_review_status text,
  cultural_resources_review_status text, environmental_contamination_status text, phase_one_status text, soil_classification text, prime_farmland_percentage numeric(5,2),
  farmland_classification text, drainage_notes text, stormwater_notes text, environmental_notes text, flood_source_url text, wetlands_source_url text, soil_source_url text,
  verified_at timestamptz, verification_status text default 'not-reviewed', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint env_verification_valid check (verification_status in ('not-reviewed','desktop-review','professional-review','agency-confirmed'))
);

create table public.property_regulatory (
  id uuid primary key default gen_random_uuid(), property_id uuid not null unique references public.properties(id) on delete cascade,
  jurisdiction text, inside_city_limits boolean, zoning_classification text, solar_use_allowed boolean, conditional_use_required boolean, rezoning_required boolean,
  county_permit_required boolean, building_permit_required boolean, electrical_permit_required boolean, stormwater_permit_required boolean, road_use_agreement_required boolean,
  decommissioning_plan_required boolean, decommissioning_bond_required boolean, setback_requirements text, height_restrictions text, screening_requirements text,
  zoning_contact_name text, zoning_contact_phone text, zoning_contact_email text, zoning_request_date date, zoning_response_date date, zoning_source_url text,
  regulatory_notes text, verified_at timestamptz, verification_status text default 'not-reviewed', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint regulatory_verification_valid check (verification_status in ('not-reviewed','desktop-review','professional-review','agency-confirmed'))
);

create table public.property_market (
  id uuid primary key default gen_random_uuid(), property_id uuid not null unique references public.properties(id) on delete cascade,
  nearby_load_centers_notes text, nearest_commercial_center text, distance_to_commercial_center_miles numeric(9,3), nearest_industrial_user text,
  distance_to_industrial_user_miles numeric(9,3), estimated_local_offtaker_strength text, estimated_ppa_fit text,
  estimated_annual_generation_kwh numeric(16,2), conceptual_capacity_mw_dc numeric(9,3), conceptual_capacity_mw_ac numeric(9,3), conceptual_panel_count integer,
  land_efficiency_acres_per_mw numeric(8,3), estimated_site_preparation_cost numeric(14,2), estimated_interconnection_risk text, estimated_development_risk text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.property_scores (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade, total_score numeric(6,2) not null,
  data_confidence numeric(5,2) not null default 0, land_cost_score numeric(5,2) not null default 0, usable_acreage_score numeric(5,2) not null default 0,
  clearing_score numeric(5,2) not null default 0, slope_score numeric(5,2) not null default 0, flood_score numeric(5,2) not null default 0, wetlands_score numeric(5,2) not null default 0,
  farmland_score numeric(5,2) not null default 0, road_access_score numeric(5,2) not null default 0, utility_proximity_score numeric(5,2) not null default 0,
  interconnection_confidence_score numeric(5,2) not null default 0, zoning_score numeric(5,2) not null default 0, offtaker_score numeric(5,2) not null default 0,
  seller_flexibility_score numeric(5,2) not null default 0, environmental_risk_score numeric(5,2) not null default 0, strategic_fit_score numeric(5,2) not null default 0,
  score_version text not null, score_explanations jsonb not null default '[]'::jsonb, calculated_at timestamptz not null default now(), calculated_by uuid references public.profiles(id) on delete set null,
  override_score numeric(6,2), override_reason text,
  constraint score_range check (total_score between 0 and 100 and (override_score is null or override_score between 0 and 100)),
  constraint override_reason_required check (override_score is null or length(trim(coalesce(override_reason,''))) >= 10)
);
create index property_scores_latest_idx on public.property_scores(property_id, calculated_at desc);

create table public.property_notes (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade, note_type text not null default 'general',
  note text not null, is_pinned boolean not null default false, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint note_type_valid check (note_type in ('general','seller-call','broker-call','utility','zoning','engineering','environmental','financing','off-taker','legal'))
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(), contact_type text not null, first_name text, last_name text, company text, title text, email text, phone text,
  address text, city text, county text, state text, notes text, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint contact_type_valid check (contact_type in ('owner','broker','utility','county','city','engineer','EPC','attorney','lender','grant','off-taker','investor','other'))
);
create index contacts_search_idx on public.contacts(contact_type, company, last_name);

create table public.property_contacts (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade, contact_id uuid not null references public.contacts(id) on delete cascade,
  relationship_type text, is_primary boolean not null default false, created_at timestamptz not null default now(), unique(property_id, contact_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(), property_id uuid unique references public.properties(id) on delete set null, project_code text not null unique, project_name text not null,
  project_stage text not null, legal_entity text, proposed_capacity_mw_dc numeric(9,3), proposed_capacity_mw_ac numeric(9,3), annual_generation_estimate_kwh numeric(16,2), target_cod text,
  utility text, interconnection_status text, site_control_status text, offtaker_status text, financing_status text, grant_status text, engineering_status text, permitting_status text,
  construction_status text, summary text, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, section text not null, task_name text not null,
  task_description text, document_action_target text, status text not null default 'pending', target_date date, completed_date date, owner uuid references public.profiles(id) on delete set null,
  notes text, sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.offtakers (
  id uuid primary key default gen_random_uuid(), company_name text not null, facility_name text, industry text, address text, city text, county text, state text,
  latitude numeric(10,7), longitude numeric(10,7), contact_id uuid references public.contacts(id) on delete set null, estimated_load_profile text,
  estimated_annual_kwh numeric(16,2), estimated_monthly_spend numeric(14,2), status text not null default 'identified', source_url text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint offtaker_status_valid check (status in ('identified','researching','outreach-planned','contacted','pitch-active','interested','NDA','energy-data-review','proposal','term-sheet','PPA-negotiation','closed-won','closed-lost'))
);

create table public.property_offtaker_matches (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade, offtaker_id uuid not null references public.offtakers(id) on delete cascade,
  distance_miles numeric(9,3), match_score numeric(6,2), grid_relationship_known boolean not null default false, rationale text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(property_id, offtaker_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(), property_id uuid references public.properties(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade,
  document_type text not null, title text not null, description text, storage_path text, original_filename text, mime_type text, size_bytes bigint, source_url text, version text,
  document_date date, uploaded_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint document_parent check (property_id is not null or project_id is not null),
  constraint document_type_valid check (document_type in ('listing','aerial','parcel-map','survey','title','deed','zoning','utility','interconnection','environmental','flood','wetlands','soil','engineering','production-model','EPC-quote','PPA','financing','grant','correspondence','photograph','other'))
);

create table public.imports (
  id uuid primary key default gen_random_uuid(), import_type text not null, source_name text not null, source_file_name text not null, imported_by uuid references public.profiles(id) on delete set null,
  records_total integer not null default 0, records_created integer not null default 0, records_updated integer not null default 0, records_rejected integer not null default 0,
  status text not null default 'preview', error_log jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), completed_at timestamptz
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(), property_id uuid references public.properties(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade,
  title text not null, description text, category text, priority public.task_priority not null default 'normal', status public.task_status not null default 'open',
  assigned_to uuid references public.profiles(id) on delete set null, due_date date, completed_at timestamptz, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), constraint task_parent check (property_id is not null or project_id is not null)
);
create index tasks_due_idx on public.tasks(status, due_date) where status not in ('completed','canceled');

create table public.public_property_submissions (
  id uuid primary key default gen_random_uuid(), name text not null, email text not null, phone text, submitter_type text, property_address text not null, county text not null,
  approximate_acreage numeric(12,2), asking_price numeric(14,2), current_use text, land_condition text, road_access text, utility_information text,
  seller_financing_interest boolean, lease_option_interest boolean, listing_url text, message text, evidence_level text not null default 'unverified', status text not null default 'new-lead',
  consented_at timestamptz not null, source_ip_hash text, created_at timestamptz not null default now(), constraint submission_unverified check (evidence_level = 'unverified')
);

create table public.scoring_settings (
  id uuid primary key default gen_random_uuid(), name text not null unique, version text not null, weights jsonb not null, thresholds jsonb not null, active boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.target_profiles (
  id uuid primary key default gen_random_uuid(), name text not null unique, criteria jsonb not null, active boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.provider_settings (
  id uuid primary key default gen_random_uuid(), provider_key text not null unique, enabled boolean not null default false, configuration jsonb not null default '{}'::jsonb,
  licensing_notes text, updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id) on delete set null, entity_type text not null, entity_id uuid not null, action text not null,
  before_data jsonb, after_data jsonb, created_at timestamptz not null default now()
);
create index activity_entity_idx on public.activity_log(entity_type, entity_id, created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
do $$ declare t text; begin foreach t in array array['profiles','properties','property_utility','property_environmental','property_regulatory','property_market','property_notes','contacts','projects','project_milestones','offtakers','property_offtaker_matches','documents','tasks','scoring_settings','target_profiles','provider_settings'] loop execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t); end loop; end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles(id,email,full_name) values(new.id,coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'full_name','')) on conflict(id) do nothing; return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.log_change() returns trigger language plpgsql security definer set search_path = public as $$
declare entity uuid; begin entity := coalesce(new.id, old.id); insert into public.activity_log(actor_id,entity_type,entity_id,action,before_data,after_data) values(auth.uid(),tg_table_name,entity,lower(tg_op),case when tg_op='INSERT' then null else to_jsonb(old) end,case when tg_op='DELETE' then null else to_jsonb(new) end); return coalesce(new,old); end; $$;
do $$ declare t text; begin foreach t in array array['properties','property_scores','contacts','documents','projects','project_milestones'] loop execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.log_change()', t || '_audit', t); end loop; end $$;

insert into public.scoring_settings(name,version,weights,thresholds,active) values ('Oklahoma Rural Solar default','ok-rural-solar-v1.0','{"landAffordability":12,"usableAcreage":8,"clearing":8,"slope":8,"flood":8,"wetlands":8,"farmland":5,"roadAccess":6,"utilityProximity":12,"interconnectionConfidence":10,"zoning":5,"offtaker":4,"sellerFlexibility":3,"strategicFit":3}','{"priority":85,"strong":70,"research":55,"highRisk":40}',true);
insert into public.target_profiles(name,criteria,active) values ('Oklahoma Rural Solar – Initial Target','{"state":"Oklahoma","acreageMin":10,"acreageMax":80,"usableAcresMin":8,"pricePerAcreTarget":5000,"pricePerAcreStretch":7500,"averageSlopeMax":5,"preferredLandUse":["pasture","grassland","former grazing","marginal land"],"legalRoadAccess":true,"lowFloodWetlandExposure":true}',true);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('site-finder-documents','site-finder-documents',false,15728640,array['application/pdf','image/png','image/jpeg','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.wordprocessingml.document']) on conflict(id) do update set public=false;
