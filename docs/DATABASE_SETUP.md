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
3. `202608020003_identity_and_tenant_security.sql` — organizations, membership roles/statuses, tenant isolation, explicit RLS policies, and invitation activation.
4. Apply all later migrations in filename order for the property, project, conversion, and finance modules.

The current final migration is `202608040002_remote_function_lint_fixes.sql`. Confirm both the migration ledger and the observable remote schema after every push:

```bash
npx supabase migration list --linked
npm run verify:remote-environment
```

If the remote migration ledger is empty while the schema surfaces already exist, stop. Do not run `db push`: it will attempt to replay migrations. Create a recoverable backup, compare the complete schema, and obtain explicit approval for a ledger-reconciliation procedure. Never use migration repair merely to silence a mismatch.

The `--include-seed` flag applies `supabase/seed.sql` after the migrations. The seed creates only the supplied 1 Cornerstone Lane reference property/project/milestones. Unknown acreage, price, parcel, coordinates, capacity, flood, zoning, engineering, PPA, finance, and grant values remain null or unverified.

## Auth configuration

- Enable email/password authentication.
- Disable public registration.
- Create users manually.
- Configure the Site URL and `/auth/callback` redirect.
- Bootstrap the first active owner with `npm run bootstrap:first-owner -- --user-id AUTH_USER_UUID` as documented in `docs/SECURITY_AND_OPERATIONS.md`.
- The canonical organization identity is name `NSoul LLC` and slug `nsoul`.

## Role behavior

- `owner`: all organization and membership controls, including owner-role management.
- `admin`: non-owner user administration and privileged application operations.
- `developer`: property and project development operations.
- `analyst`: analytical and record-editing workflows without membership administration.
- `viewer`: read-only.

UI controls are convenience only. Policies enforce these permissions in PostgreSQL and private Storage.

## Storage

The migration creates `site-finder-documents` as a private bucket with a 15 MB limit. Allowed MIME types are PDF, PNG, JPEG, CSV, XLSX, and DOCX. Never mark this bucket public.
