# Database and authentication setup

## Apply schema

```bash
npx supabase login
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --include-seed
```

Migration order:

1. `202608020001_site_finder_schema.sql` — tables, indexes, constraints, triggers, private bucket, default scoring and target settings.
2. `202608020002_site_finder_rls.sql` — RLS and storage policies.

The `--include-seed` flag applies `supabase/seed.sql` after the migrations. The seed creates only the supplied 1 Cornerstone Lane reference property/project/milestones. Unknown acreage, price, parcel, coordinates, capacity, flood, zoning, engineering, PPA, finance, and grant values remain null or unverified.

## Auth configuration

- Enable email/password authentication.
- Disable public registration.
- Create users manually.
- Configure the Site URL and `/auth/callback` redirect.
- Set the first profile to `admin` with the SQL shown in the README.

## Role behavior

- `admin`: full CRUD, users/settings, imports, conversion, permanent deletion.
- `analyst`: property/contact/research/document/task mutation; no user management or permanent project deletion.
- `viewer`: read-only.

UI controls are convenience only. Policies enforce these permissions in PostgreSQL and private Storage.

## Storage

The migration creates `site-finder-documents` as a private bucket with a 15 MB limit. Allowed MIME types are PDF, PNG, JPEG, CSV, XLSX, and DOCX. Never mark this bucket public.
