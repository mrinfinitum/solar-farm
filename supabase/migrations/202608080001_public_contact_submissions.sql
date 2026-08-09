create table if not exists public.public_contact_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  email text not null,
  company text not null,
  job_title text not null,
  phone text,
  facility_location text not null,
  facility_type text,
  annual_electricity_usage text,
  electricity_spend text,
  discussion_topic text,
  utility_provider text,
  desired_timeline text,
  message text not null,
  source_page text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  status text not null default 'new'
);

create index if not exists public_contact_submissions_status_submitted_idx
  on public.public_contact_submissions (status, submitted_at desc);

alter table public.public_contact_submissions enable row level security;
revoke all on public.public_contact_submissions from public, anon, authenticated;

comment on table public.public_contact_submissions is
  'Validated public commercial inquiries. Read through owner and administrator server workflows only.';
