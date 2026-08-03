# NSoul — Cornerstone Solar

This repository contains two coordinated products:

- `/` — public NSoul marketing site for the proposed 1 Cornerstone Lane Solar Farm.
- `/dashboard` — private **Cornerstone Site Finder** property pipeline and due-diligence application.
- `/submit-property` — public, non-binding rural Oklahoma land-submission intake.

The internal application uses Next.js App Router, TypeScript, Supabase PostgreSQL/Auth/Storage, `@supabase/ssr`, Zod, React Hook Form, Recharts, MapLibre GL, Papa Parse, and Lucide.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The public site builds and runs before Supabase is configured. `/login` displays a setup-required state until the public Supabase values are present.

## Supabase setup

1. Create a Supabase project.
2. Disable public user registration in **Authentication → Providers → Email**. Accounts are administrator-created only.
3. Copy the project URL and publishable key to `.env.local`.
4. Copy the service-role key to `.env.local`; it is server-only and must never be prefixed with `NEXT_PUBLIC_`.
5. Link the Supabase CLI and apply migrations:

```bash
npx supabase login
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --include-seed
```

The `--include-seed` flag runs `supabase/seed.sql` after the migrations. Alternatively, apply the migrations with `npx supabase db push`, then paste `supabase/seed.sql` into the Supabase SQL Editor.

The migration creates the private `site-finder-documents` bucket, its 15 MB/type restrictions, RLS policies, profile trigger, scoring configuration, target profile, audit triggers, and all application tables.

## First administrator

Create the first user manually in **Authentication → Users → Add user**, then run this in the SQL Editor:

```sql
update public.profiles
set role = 'admin', full_name = 'Administrator', organization = 'Cornerstone Solar'
where email = 'YOUR_ADMIN_EMAIL';
```

Additional users are also created manually in Supabase and default to `viewer`. An administrator can promote them to `analyst` or `admin` after verifying identity and need.

## Environment

See `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_MAP_STYLE_URL` — optional MapLibre-compatible style URL
- `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` — optional public contact delivery

Missing map/email values produce safe configured-state messages. Missing Supabase values disable private authentication and storage operations without breaking the public build.

## Validation

```bash
npm run lint
npm run build
```

## Vercel deployment

1. Import the GitHub repository into Vercel.
2. Use the standard Next.js preset.
3. Add all production environment values in Vercel, keeping the service-role key server-only.
4. Set the Supabase Auth Site URL to the deployed origin and add `https://YOUR_DOMAIN/auth/callback` to allowed redirect URLs.
5. Deploy and verify `/`, `/login`, password reset, `/dashboard`, signed document downloads, CSV dry-run, and `/submit-property`.

See [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) and [docs/SITE_FINDER_ARCHITECTURE.md](docs/SITE_FINDER_ARCHITECTURE.md) for the full handoff.
