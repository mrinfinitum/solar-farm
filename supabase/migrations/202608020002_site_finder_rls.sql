create or replace function public.current_profile_role() returns public.user_role language sql stable security definer set search_path=public as $$ select role from public.profiles where id=auth.uid() $$;

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_utility enable row level security;
alter table public.property_environmental enable row level security;
alter table public.property_regulatory enable row level security;
alter table public.property_market enable row level security;
alter table public.property_scores enable row level security;
alter table public.property_notes enable row level security;
alter table public.contacts enable row level security;
alter table public.property_contacts enable row level security;
alter table public.projects enable row level security;
alter table public.project_milestones enable row level security;
alter table public.offtakers enable row level security;
alter table public.property_offtaker_matches enable row level security;
alter table public.documents enable row level security;
alter table public.imports enable row level security;
alter table public.tasks enable row level security;
alter table public.public_property_submissions enable row level security;
alter table public.scoring_settings enable row level security;
alter table public.target_profiles enable row level security;
alter table public.provider_settings enable row level security;
alter table public.activity_log enable row level security;

create policy profiles_self_read on public.profiles for select to authenticated using (id=auth.uid() or public.current_profile_role()='admin');
create policy profiles_self_update on public.profiles for update to authenticated using (id=auth.uid() or public.current_profile_role()='admin') with check (id=auth.uid() or public.current_profile_role()='admin');

do $$ declare t text; begin
  foreach t in array array['properties','property_utility','property_environmental','property_regulatory','property_market','property_scores','property_notes','contacts','property_contacts','projects','project_milestones','offtakers','property_offtaker_matches','documents','tasks'] loop
    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_read', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.current_profile_role() in (''admin'',''analyst''))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.current_profile_role() in (''admin'',''analyst'')) with check (public.current_profile_role() in (''admin'',''analyst''))', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.current_profile_role() = ''admin'')', t || '_delete', t);
  end loop;
end $$;

create policy imports_read on public.imports for select to authenticated using (true);
create policy imports_admin_write on public.imports for all to authenticated using (public.current_profile_role()='admin') with check (public.current_profile_role()='admin');
create policy settings_read on public.scoring_settings for select to authenticated using (true);
create policy targets_read on public.target_profiles for select to authenticated using (true);
create policy providers_read on public.provider_settings for select to authenticated using (true);
create policy settings_admin on public.scoring_settings for all to authenticated using (public.current_profile_role()='admin') with check (public.current_profile_role()='admin');
create policy targets_admin on public.target_profiles for all to authenticated using (public.current_profile_role()='admin') with check (public.current_profile_role()='admin');
create policy providers_admin on public.provider_settings for all to authenticated using (public.current_profile_role()='admin') with check (public.current_profile_role()='admin');
create policy activity_read on public.activity_log for select to authenticated using (true);
create policy public_intake_insert on public.public_property_submissions for insert to anon,authenticated with check (evidence_level='unverified' and status='new-lead');
create policy public_intake_admin_read on public.public_property_submissions for select to authenticated using (public.current_profile_role()='admin');
create policy public_intake_admin_update on public.public_property_submissions for update to authenticated using (public.current_profile_role()='admin') with check (public.current_profile_role()='admin');

create policy storage_documents_read on storage.objects for select to authenticated using (bucket_id='site-finder-documents');
create policy storage_documents_insert on storage.objects for insert to authenticated with check (bucket_id='site-finder-documents' and public.current_profile_role() in ('admin','analyst'));
create policy storage_documents_update on storage.objects for update to authenticated using (bucket_id='site-finder-documents' and public.current_profile_role() in ('admin','analyst')) with check (bucket_id='site-finder-documents' and public.current_profile_role() in ('admin','analyst'));
create policy storage_documents_delete on storage.objects for delete to authenticated using (bucket_id='site-finder-documents' and public.current_profile_role()='admin');
