-- Sprint 1: organization identity, invitation-only membership, auditability, and tenant RLS.

create type public.organization_role as enum ('owner', 'admin', 'developer', 'analyst', 'viewer');
create type public.membership_status as enum ('invited', 'active', 'suspended', 'deactivated');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column avatar_url text,
  add column job_title text,
  add column phone text;

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.organization_role not null default 'viewer',
  status public.membership_status not null default 'invited',
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id),
  unique (user_id)
);

create index organization_members_org_status_idx
  on public.organization_members (organization_id, status, role);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, key)
);

create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger organization_members_updated_at before update on public.organization_members
  for each row execute function public.set_updated_at();
create trigger app_settings_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

insert into public.organizations (name, slug)
values ('NSoul LLC', 'nsoul')
on conflict (slug) do update set name = excluded.name;

insert into public.organization_members (organization_id, user_id, role, status)
select
  (select id from public.organizations where slug = 'nsoul'),
  profiles.id,
  case profiles.role::text
    when 'admin' then 'admin'::public.organization_role
    when 'analyst' then 'analyst'::public.organization_role
    else 'viewer'::public.organization_role
  end,
  'active'::public.membership_status
from public.profiles
on conflict (user_id) do nothing;

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid() and status = 'active'
  limit 1
$$;

create or replace function public.current_organization_role()
returns public.organization_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role
  from public.organization_members
  where user_id = auth.uid() and status = 'active'
  limit 1
$$;

create or replace function public.has_organization_role(required_roles public.organization_role[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.current_organization_role() = any(required_roles), false)
$$;

create or replace function public.is_active_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.organization_members
    where user_id = auth.uid()
      and organization_id = target_organization_id
      and status = 'active'
  )
$$;

revoke all on function public.current_organization_id() from public, anon;
revoke all on function public.current_organization_role() from public, anon;
revoke all on function public.has_organization_role(public.organization_role[]) from public, anon;
revoke all on function public.is_active_organization_member(uuid) from public, anon;
grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.current_organization_role() to authenticated;
grant execute on function public.has_organization_role(public.organization_role[]) to authenticated;
grant execute on function public.is_active_organization_member(uuid) to authenticated;

-- Every exposed application record carries an organization boundary. Existing
-- records are assigned to the initial NSoul organization during this migration.
do $$
declare
  table_name text;
  initial_organization_id uuid;
begin
  select id into initial_organization_id from public.organizations where slug = 'nsoul';

  foreach table_name in array array[
    'properties', 'property_utility', 'property_environmental', 'property_regulatory',
    'property_market', 'property_scores', 'property_notes', 'contacts', 'property_contacts',
    'projects', 'project_milestones', 'offtakers', 'property_offtaker_matches', 'documents',
    'imports', 'tasks', 'public_property_submissions', 'scoring_settings', 'target_profiles',
    'provider_settings', 'activity_log'
  ] loop
    execute format('alter table public.%I add column organization_id uuid', table_name);
    execute format('update public.%I set organization_id = $1 where organization_id is null', table_name)
      using initial_organization_id;
    execute format('alter table public.%I alter column organization_id set not null', table_name);
    execute format('alter table public.%I alter column organization_id set default public.current_organization_id()', table_name);
    execute format(
      'alter table public.%I add constraint %I foreign key (organization_id) references public.organizations(id) on delete restrict',
      table_name,
      table_name || '_organization_id_fkey'
    );
    execute format('create index %I on public.%I (organization_id)', table_name || '_organization_idx', table_name);
  end loop;
end
$$;

create or replace function public.activate_my_membership()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  membership_record public.organization_members%rowtype;
begin
  if auth.uid() is null then
    return false;
  end if;

  update public.organization_members
  set status = 'active', updated_at = now()
  where user_id = auth.uid() and status = 'invited'
  returning * into membership_record;

  if not found then
    return exists (
      select 1 from public.organization_members
      where user_id = auth.uid() and status = 'active'
    );
  end if;

  insert into public.activity_log (
    organization_id, actor_id, entity_type, entity_id, action, after_data
  ) values (
    membership_record.organization_id,
    auth.uid(),
    'organization_member',
    membership_record.id,
    'membership_activated',
    jsonb_build_object('status', membership_record.status, 'role', membership_record.role)
  );

  return true;
end
$$;

revoke all on function public.activate_my_membership() from public, anon;
grant execute on function public.activate_my_membership() to authenticated;

-- Ensure trigger-based record auditing remains tenant-aware.
create or replace function public.log_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  entity uuid;
  tenant_id uuid;
begin
  if tg_op = 'DELETE' then
    entity := old.id;
    tenant_id := old.organization_id;
  else
    entity := new.id;
    tenant_id := new.organization_id;
  end if;

  insert into public.activity_log (
    organization_id, actor_id, entity_type, entity_id, action, before_data, after_data
  ) values (
    tenant_id,
    auth.uid(),
    tg_table_name,
    entity,
    lower(tg_op),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  return coalesce(new, old);
end
$$;

create trigger organization_members_audit
  after insert or update or delete on public.organization_members
  for each row execute function public.log_change();

-- Remove all legacy policies before installing fail-closed tenant policies.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles', 'properties', 'property_utility', 'property_environmental',
        'property_regulatory', 'property_market', 'property_scores', 'property_notes',
        'contacts', 'property_contacts', 'projects', 'project_milestones', 'offtakers',
        'property_offtaker_matches', 'documents', 'imports', 'tasks',
        'public_property_submissions', 'scoring_settings', 'target_profiles',
        'provider_settings', 'activity_log'
      )
  loop
    execute format('drop policy %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.app_settings enable row level security;

create policy organizations_select on public.organizations
  for select to authenticated
  using (public.is_active_organization_member(id));
create policy organizations_insert on public.organizations
  for insert to authenticated with check (false);
create policy organizations_update on public.organizations
  for update to authenticated
  using (id = public.current_organization_id() and public.has_organization_role(array['owner']::public.organization_role[]))
  with check (id = public.current_organization_id() and public.has_organization_role(array['owner']::public.organization_role[]));
create policy organizations_delete on public.organizations
  for delete to authenticated using (false);

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.organization_members target
      where target.user_id = profiles.id
        and target.organization_id = public.current_organization_id()
        and target.status = 'active'
    )
  );
create policy profiles_insert on public.profiles
  for insert to authenticated with check (false);
create policy profiles_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_delete on public.profiles
  for delete to authenticated using (false);

revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, avatar_url, job_title, phone) on public.profiles to authenticated;

create policy organization_members_select on public.organization_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or (
      organization_id = public.current_organization_id()
      and status = 'active'
      and public.is_active_organization_member(organization_id)
    )
  );
create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and invited_by = auth.uid()
    and status = 'invited'
    and public.has_organization_role(array['owner','admin']::public.organization_role[])
    and (role <> 'owner' or public.current_organization_role() = 'owner')
  );
create policy organization_members_update on public.organization_members
  for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.has_organization_role(array['owner','admin']::public.organization_role[])
    and (role <> 'owner' or public.current_organization_role() = 'owner')
  )
  with check (
    organization_id = public.current_organization_id()
    and public.has_organization_role(array['owner','admin']::public.organization_role[])
    and (role <> 'owner' or public.current_organization_role() = 'owner')
  );
create policy organization_members_delete on public.organization_members
  for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.has_organization_role(array['owner','admin']::public.organization_role[])
    and (role <> 'owner' or public.current_organization_role() = 'owner')
  );

revoke update on public.organization_members from authenticated;
grant update (role, status) on public.organization_members to authenticated;

create policy app_settings_select on public.app_settings
  for select to authenticated using (organization_id = public.current_organization_id());
create policy app_settings_insert on public.app_settings
  for insert to authenticated
  with check (organization_id = public.current_organization_id() and public.has_organization_role(array['owner','admin']::public.organization_role[]));
create policy app_settings_update on public.app_settings
  for update to authenticated
  using (organization_id = public.current_organization_id() and public.has_organization_role(array['owner','admin']::public.organization_role[]))
  with check (organization_id = public.current_organization_id() and public.has_organization_role(array['owner','admin']::public.organization_role[]));
create policy app_settings_delete on public.app_settings
  for delete to authenticated
  using (organization_id = public.current_organization_id() and public.has_organization_role(array['owner','admin']::public.organization_role[]));

-- Application tables use four separate operation policies. Viewers are read-only;
-- owners/admins/developers/analysts may create and edit; owners/admins may delete.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'properties', 'property_utility', 'property_environmental', 'property_regulatory',
    'property_market', 'property_scores', 'property_notes', 'contacts', 'property_contacts',
    'projects', 'project_milestones', 'offtakers', 'property_offtaker_matches', 'documents',
    'imports', 'tasks', 'scoring_settings', 'target_profiles', 'provider_settings'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (organization_id = public.current_organization_id())',
      table_name || '_tenant_select', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[]))',
      table_name || '_tenant_insert', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[])) with check (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'',''developer'',''analyst'']::public.organization_role[]))',
      table_name || '_tenant_update', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (organization_id = public.current_organization_id() and public.has_organization_role(array[''owner'',''admin'']::public.organization_role[]))',
      table_name || '_tenant_delete', table_name
    );
  end loop;
end
$$;

create policy public_property_submissions_select on public.public_property_submissions
  for select to authenticated
  using (organization_id = public.current_organization_id() and public.has_organization_role(array['owner','admin']::public.organization_role[]));
create policy public_property_submissions_insert on public.public_property_submissions
  for insert to authenticated with check (false);
create policy public_property_submissions_update on public.public_property_submissions
  for update to authenticated
  using (organization_id = public.current_organization_id() and public.has_organization_role(array['owner','admin']::public.organization_role[]))
  with check (organization_id = public.current_organization_id() and public.has_organization_role(array['owner','admin']::public.organization_role[]));
create policy public_property_submissions_delete on public.public_property_submissions
  for delete to authenticated
  using (organization_id = public.current_organization_id() and public.has_organization_role(array['owner','admin']::public.organization_role[]));

create policy activity_log_select on public.activity_log
  for select to authenticated using (organization_id = public.current_organization_id());
create policy activity_log_insert on public.activity_log
  for insert to authenticated with check (false);
create policy activity_log_update on public.activity_log
  for update to authenticated using (false) with check (false);
create policy activity_log_delete on public.activity_log
  for delete to authenticated using (false);
revoke insert, update, delete on public.activity_log from anon, authenticated;

revoke all on public.organizations, public.organization_members, public.app_settings from anon;
revoke all on public.properties, public.property_utility, public.property_environmental,
  public.property_regulatory, public.property_market, public.property_scores, public.property_notes,
  public.contacts, public.property_contacts, public.projects, public.project_milestones,
  public.offtakers, public.property_offtaker_matches, public.documents, public.imports, public.tasks,
  public.public_property_submissions, public.scoring_settings, public.target_profiles,
  public.provider_settings, public.activity_log from anon;

-- Storage is private and tenant-prefixed: {organization_id}/{parent_id}/{filename}.
drop policy if exists storage_documents_read on storage.objects;
drop policy if exists storage_documents_insert on storage.objects;
drop policy if exists storage_documents_update on storage.objects;
drop policy if exists storage_documents_delete on storage.objects;

drop function if exists public.current_profile_role();

create policy storage_documents_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'site-finder-documents'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  );
create policy storage_documents_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'site-finder-documents'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
    and public.has_organization_role(array['owner','admin','developer','analyst']::public.organization_role[])
  );
create policy storage_documents_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'site-finder-documents'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
    and public.has_organization_role(array['owner','admin','developer','analyst']::public.organization_role[])
  )
  with check (
    bucket_id = 'site-finder-documents'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
    and public.has_organization_role(array['owner','admin','developer','analyst']::public.organization_role[])
  );
create policy storage_documents_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'site-finder-documents'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
    and public.has_organization_role(array['owner','admin']::public.organization_role[])
  );

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.log_change() from public, anon, authenticated;
