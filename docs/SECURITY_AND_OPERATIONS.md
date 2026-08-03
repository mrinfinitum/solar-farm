# Sprint 1 security and operations

This document is the operational handoff for NSoul's invitation-only Supabase backend. The public marketing site remains public; `/dashboard` is available only to active organization members.

## Required environment variables

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + server | Ordinary user-scoped Auth, Postgres, and Storage access |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Auth administration and trusted public-intake writes |
| `NEXT_PUBLIC_SITE_URL` | Browser + server | Canonical callback origin, for example `https://nsoul.com` |

Optional values are documented in `.env.example`. Never prefix the service-role key with `NEXT_PUBLIC_`, expose it through a client component, or store it in source control. Configure separate keys for preview and production deployments and rotate the key if it is ever exposed.

## Migration order

Apply migrations in filename order:

1. `202608020001_site_finder_schema.sql` — legacy application schema and private Storage bucket.
2. `202608020002_site_finder_rls.sql` — legacy policies required by the existing deployment history.
3. `202608020003_identity_and_tenant_security.sql` — organizations, membership, roles, invitation activation, tenant columns, explicit operation policies, private tenant-prefixed Storage, and hardened audit access. This migration removes and supersedes the broad legacy policies.

Use `supabase db push` against a staging project first. Take a database backup before applying migration 003 to a populated environment. Existing records are assigned to the initial `NSoul LLC` organization (`nsoul`) during migration.

## Authentication configuration

In Supabase Authentication:

1. Disable public email sign-up. The application has no sign-up UI, but the provider setting is the authoritative control.
2. Set the Site URL to the production origin.
3. Allow the exact `/auth/callback` URLs used by production and approved preview environments.
4. Configure a production SMTP provider and branded invite/reset templates.
5. Require passwords of at least 10 characters in the Supabase password policy.

The Next.js proxy refreshes cookie-based SSR sessions. The dashboard layout performs the authoritative active-membership check. Suspended, deactivated, invited, missing-membership, and anonymous sessions fail closed.

## Initial owner bootstrap

The first owner is the one necessary exception to application-driven invitation. Create that Auth user from the Supabase dashboard, then run the following as a privileged database administrator after replacing the email:

```sql
do $$
declare
  bootstrap_user_id uuid;
  nsoul_organization_id uuid;
  bootstrap_membership_id uuid;
begin
  select id into strict bootstrap_user_id
  from auth.users
  where lower(email) = lower('OWNER@NSOUL.COM');

  select id into strict nsoul_organization_id
  from public.organizations
  where slug = 'nsoul';

  insert into public.organization_members (
    organization_id, user_id, role, status, invited_by
  ) values (
    nsoul_organization_id, bootstrap_user_id, 'owner', 'active', bootstrap_user_id
  )
  on conflict (user_id) do update
    set role = 'owner', status = 'active', updated_at = now()
  returning id into bootstrap_membership_id;

  insert into public.activity_log (
    organization_id, actor_id, entity_type, entity_id, action, after_data
  ) values (
    nsoul_organization_id,
    bootstrap_user_id,
    'organization_member',
    bootstrap_membership_id,
    'initial_owner_bootstrap',
    jsonb_build_object('role', 'owner', 'status', 'active')
  );
end
$$;
```

Verify the owner can sign in, visit `/dashboard/users`, and see their active owner membership. The application prevents deactivating or demoting the final active owner.

## Inviting the first additional user

1. Sign in as the bootstrapped owner.
2. Open **Users** in the dashboard sidebar.
3. Select **Invite user**, enter a verified work email and name, and choose a role.
4. The recipient follows the Supabase invitation, sets a password, and is activated through `/auth/callback`.
5. Confirm the membership status is active and the `user_invited` and `membership_activated` events exist in `activity_log`.

Admins may invite and manage non-owner roles. Only an owner can grant, modify, deactivate, or remove an owner membership.

## Authorization matrix

| Capability | Owner | Admin | Developer | Analyst | Viewer |
| --- | :---: | :---: | :---: | :---: | :---: |
| Enter dashboard while membership is active | ✓ | ✓ | ✓ | ✓ | ✓ |
| Read organization application records | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create/update development records | ✓ | ✓ | ✓ | ✓ | — |
| Delete development records | ✓ | ✓ | — | — | — |
| Invite non-owner users | ✓ | ✓ | — | — | — |
| Change non-owner roles/status | ✓ | ✓ | — | — | — |
| Assign or manage owner role | ✓ | — | — | — | — |
| Read same-organization activity log | ✓ | ✓ | ✓ | ✓ | ✓ |
| Insert/update/delete activity records directly | — | — | — | — | — |

## RLS policy matrix

| Resource | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| `organizations` | Active member of that organization | Denied | Owner only | Denied |
| `profiles` | Self or active member in current organization | Denied (Auth trigger only) | Self, limited to granted profile columns | Denied |
| `organization_members` | Self; active peer records for active members | Owner/admin; admin cannot assign owner | Owner/admin; admin cannot modify owner | Owner/admin; admin cannot delete owner |
| `app_settings` | Current organization | Owner/admin | Owner/admin | Owner/admin |
| Development/application tables | Current organization | Owner/admin/developer/analyst | Owner/admin/developer/analyst | Owner/admin |
| `public_property_submissions` | Owner/admin in current organization | Denied to anon/authenticated; trusted server route only | Owner/admin | Owner/admin |
| `activity_log` | Current organization | Denied to users; trusted workflow only | Denied | Denied |
| Storage `site-finder-documents` | Current organization path prefix | Editing roles | Editing roles | Owner/admin |

All exposed application tables have RLS enabled. There are no anonymous database policies for backend tables. The public contact and land-submission endpoints are intentionally public HTTP boundaries with validation and rate limiting; they do not grant anonymous Postgres access.

## Verification

```bash
npm run lint
npm run build
npm test
npm audit --omit=dev
```

`npm test` verifies the role matrix, suspended-user rejection, and scans client sources plus built static bundles for service-role material.

## Remaining security risks and production follow-up

- Public form rate limits are process-local. Put Vercel WAF/rate limiting or a durable distributed limiter in front of both public form routes before high-volume launch.
- Add CAPTCHA or another abuse challenge to public intake if automated spam becomes material.
- MFA and step-up authentication are not part of Sprint 1. Require them before sensitive financial or contractual workflows are added.
- The application audit log is append-only to authenticated users, but database owners and the service role can bypass RLS. Restrict Supabase dashboard access, enable platform audit logs, and export security events to immutable retention.
- Email invitation delivery depends on production SMTP and exact redirect allowlists. Test invitations and password recovery on the deployed origin.
- This sprint enforces one organization membership per user. A future multi-tenant release needs an explicit active-organization selector and must remove the `unique(user_id)` constraint only alongside corresponding session changes.
- Enable backups/PITR appropriate to the subscription tier, rehearse restore, monitor Auth/admin-route failures, and alert on owner-role changes and user deactivation.
- Run migrations and authorization tests against a dedicated staging Supabase project before production. Local static verification cannot prove hosted project configuration.
- The current dependency audit reports three high-severity transitive advisories in Next.js-bundled `postcss`/`sharp`. npm currently proposes an invalid breaking downgrade rather than a safe in-range update; track the upstream Next.js release and upgrade promptly when a patched stable version is available. Do not run `npm audit fix --force` against production without reviewing the resulting framework downgrade.
