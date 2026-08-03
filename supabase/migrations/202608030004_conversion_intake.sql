-- Conversion intake fields for the public land-submission workflow.
-- Public writes remain mediated by the validated server route; no anonymous reads are granted.

alter table public.public_property_submissions
  add column if not exists submission_status text not null default 'new-lead',
  add column if not exists tillable_status text,
  add column if not exists cleared_percentage numeric(5,2),
  add column if not exists wooded_percentage numeric(5,2),
  add column if not exists lease_interest boolean,
  add column if not exists option_interest boolean,
  add column if not exists parcel_number text,
  add column if not exists attachment_path text,
  add column if not exists source text not null default 'submit-property',
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists internal_notes text;

update public.public_property_submissions
set
  submission_status = coalesce(status, 'new-lead'),
  lease_interest = coalesce(lease_interest, lease_option_interest)
where submission_status = 'new-lead' or lease_interest is null;

alter table public.public_property_submissions
  drop constraint if exists public_property_submissions_cleared_percentage_check,
  add constraint public_property_submissions_cleared_percentage_check
    check (cleared_percentage is null or cleared_percentage between 0 and 100),
  drop constraint if exists public_property_submissions_wooded_percentage_check,
  add constraint public_property_submissions_wooded_percentage_check
    check (wooded_percentage is null or wooded_percentage between 0 and 100);

create index if not exists public_property_submissions_status_created_idx
  on public.public_property_submissions (organization_id, submission_status, created_at desc);

-- Explicitly preserve the server-boundary design introduced by the tenant-security migration.
drop policy if exists public_intake_insert on public.public_property_submissions;
revoke all on public.public_property_submissions from anon;

comment on column public.public_property_submissions.attachment_path is
  'Private storage path only. Use authenticated server workflows to create short-lived signed URLs.';
