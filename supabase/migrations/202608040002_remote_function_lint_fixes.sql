-- Forward-only fixes for defects detected by `supabase db lint` on August 4, 2026.
-- Apply after 202608040001_property_provider_integrations.sql.

alter table public.lender_requirements
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null;

create index if not exists lender_requirements_assigned_due_idx
  on public.lender_requirements (organization_id, assigned_to, due_date)
  where status not in ('complete', 'waived');

create or replace function public.recalculate_project_health(target_project_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  project_record public.projects;
  calculated text := 'on_track';
  factors jsonb := '[]'::jsonb;
  prior text;
  effective text;
begin
  if public.current_organization_role() not in ('owner','admin','developer') then
    raise exception 'Project operation permission required';
  end if;

  select * into project_record
  from public.projects
  where id = target_project_id
    and organization_id = public.current_organization_id()
    and archived_at is null
  for update;

  if project_record.id is null then raise exception 'Project not found'; end if;
  prior := project_record.project_health;

  if exists(
    select 1 from public.project_blockers
    where project_id = target_project_id
      and severity = 'critical'
      and status in ('open','monitoring')
      and archived_at is null
  ) then
    calculated := 'blocked';
    factors := factors || jsonb_build_array('unresolved_critical_blocker');
  elsif exists(
    select 1 from public.project_milestones
    where project_id = target_project_id
      and critical_path
      and status not in ('complete','waived','cancelled')
      and target_date < current_date
      and archived_at is null
  ) then
    calculated := 'at_risk';
    factors := factors || jsonb_build_array('overdue_critical_milestone');
  elsif exists(
    select 1 from public.project_blockers
    where project_id = target_project_id
      and severity = 'high'
      and status in ('open','monitoring')
      and archived_at is null
  ) then
    calculated := 'attention';
    factors := factors || jsonb_build_array('unresolved_high_blocker');
  end if;

  effective := coalesce(project_record.health_override, calculated);
  perform set_config('app.project_controlled_update', 'on', true);
  update public.projects
  set project_health = effective, updated_at = now()
  where id = target_project_id;

  if prior is distinct from effective then
    insert into public.project_health_history(
      organization_id, project_id, prior_health, calculated_health, effective_health,
      factors, manual_override, override_reason, changed_by
    ) values (
      project_record.organization_id, target_project_id, prior, calculated, effective,
      factors, project_record.health_override is not null,
      project_record.health_override_reason, auth.uid()
    );
  end if;

  return effective;
end
$$;

revoke all on function public.recalculate_project_health(uuid) from public, anon;
grant execute on function public.recalculate_project_health(uuid) to authenticated;
