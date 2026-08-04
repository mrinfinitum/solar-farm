# Live environment verification

This is a dated operational snapshot, not a substitute for rechecking the live services. Secret values are intentionally excluded.

## August 4, 2026 snapshot

### Git and deployment

- Local checkout: primary Git worktree at `/Users/geofftracy/Projects/solar-farm`, branch `main`.
- Starting local and remote commit: `cb011c8ce20b3c46014db3e2555634dcced5050a`.
- `https://www.nsoul.co/login` returned HTTP 200 from Vercel and rendered the configured NSoul Studio sign-in form.
- DNS for `www.nsoul.co` resolves through Vercel.
- The public production login bundle targets the same Supabase project reference as `.env.local` and contains no service-role marker.
- A fresh local production build produced a different login asset hash than the live page. Asset hashes can vary with build environment, so this does not prove a code mismatch; it means the deployed Git SHA still must be obtained from Vercel.
- The authenticated Vercel CLI account can access two scopes, but neither exposes an NSoul project. Production environment scopes, server-only variable presence, deployment identifier, and deployed Git commit therefore remain unverified.
- The in-app browser was unavailable during this audit, so the credentialed UI login/logout journey was not executed.
- Local production smoke checks returned HTTP 200 for `/login`, redirected anonymous `/dashboard` access to `/login?next=%2Fdashboard`, and rejected a callback without a code by redirecting to `invalid_callback`. Production also rejected a callback without a code correctly.

### Supabase

- Application project reference: `rvvzosuxytifazgbssqr`.
- The repository had no `supabase/config.toml` or CLI link metadata at the start of the audit. On the follow-up stabilization run, the CLI was authenticated, the checkout was initialized and linked, and the non-secret local config was aligned to invitation-only Auth defaults.
- The exact remote ledger returned no applied versions for the ten migrations present at query time. The observable remote schema nevertheless contains every migration surface through `202608030006_financial_modeling_capital_readiness.sql`. This means the schema was applied outside the Supabase migration ledger. The locally prepared lint-fix migration now brings the repository inventory to eleven migrations.
- Read-only service-role verification observed every migration surface through `202608030006_financial_modeling_capital_readiness.sql`.
- `202608040001_property_provider_integrations.sql` is not applied: `data_providers.enabled` and the other provider-operations columns were absent.
- The pending migration was reviewed. It is forward-only for application data: it adds provider-operation columns/constraints/indexes, normalizes provider metadata, replaces two provider triggers/functions, and seeds missing provider rows. It contains no table/column drop, truncate, or data deletion.
- `db push` is unsafe while the ledger is empty because it would attempt to replay every migration against an already-populated schema. Forced migration repair was explicitly prohibited, so no ledger repair or migration application was performed.
- The project reports no physical backups and PITR is disabled. A supported logical dump was attempted but could not run because Docker/`pg_dump` is unavailable. The remote state is documented by the exact ledger result and `npm run verify:remote-environment`, but a recoverable database snapshot is still required before reconciliation.
- Remote `supabase db lint` found an error in `refresh_funding_notifications()` because `lender_requirements.assigned_to` did not exist, plus a type warning in `recalculate_project_health()` because an empty JSON array literal lacked an explicit `jsonb` cast. Forward-only migration `202608040002_remote_function_lint_fixes.sql` adds the missing assignment field/index and replaces the health function with the explicit cast. It is prepared and tested locally but not deployed.
- Owner Auth user `837fbd1a-4c1d-4c23-bbee-71040ead75c7` exists, is active, and is confirmed.
- Organization `a3e17009-78eb-4b48-9226-30ba193061b6` has canonical name `NSoul LLC` and slug `nsoul`. During this audit, the idempotent bootstrap corrected the remote name from `NSoul` to `NSoul LLC`; the profile compatibility organization value was updated, while the active owner membership and existing bootstrap audit remained unchanged.
- Owner membership is `owner` / `active`, matches the expected organization, and the read-only readiness checks return `loginReady: true`.
- `activate_my_membership()` exists. An unauthenticated service check safely returned `false`, as expected.

### Environment variables

Local `.env.local` has non-empty values for the four Supabase/site variables. The optional map, legal-contact, email-delivery, geocoder-selection/fallback, solar-resource, parcel, and batch-override values are missing or empty. Values were not printed.

Production public configuration is sufficient to render the login form and its public Supabase project reference matches local. The Vercel scopes available to this audit do not expose the project, so `SUPABASE_SERVICE_ROLE_KEY`, email, map, provider, site URL, environment scopes, and redeployment requirements remain unknown.

### Provider readiness

| Provider | Adapter | Local config | Vercel config | Live probe on Aug. 4 | Credentials | Current status |
| --- | --- | --- | --- | --- | --- | --- |
| U.S. Census Geocoder | Implemented | Configured by default | Public bundle/app available; exact scope unknown | Operational | None | Ready for preliminary geocoding |
| FEMA NFHL | Implemented | Configured by default | Unknown | Operational | None | Adapter ready; production DB migration still blocks provider-console fields |
| USFWS NWI | Implemented | Configured by default | Unknown | Operational | None | Adapter ready; preliminary screening only |
| USGS EPQS / 3DEP | Implemented | Configured by default | Unknown | Operational | None | Adapter ready; approximate terrain only |
| NLR solar resource | Implemented | Missing key | Unknown | Unavailable: key missing | `SOLAR_RESOURCE_API_KEY` | Enable only after credential approval |
| Mapbox fallback | Implemented in Census adapter | Disabled | Unknown | Not probed: key/provider missing | `SECONDARY_GEOCODING_API_KEY` | Optional fallback, not primary |
| Parcel | Provider-neutral stub | No implemented vendor | Unknown | Unavailable | Vendor-specific | Vendor/licensing decision required |
| Land cover | Explicit stub | Unconfigured | Unknown | Unavailable | Source-dependent | Manual workflow |
| Road access | Explicit stub | Unconfigured | Unknown | Unavailable | Source-dependent | Manual workflow |
| Utility territory | Explicit stub | Unconfigured | Unknown | Unavailable | Source-dependent | Manual workflow; no service inference |
| Grid infrastructure | Explicit stub | Unconfigured | Unknown | Unavailable | Source-dependent | Manual workflow; no capacity inference |
| Commercial context | Explicit stub | Unconfigured | Unknown | Unavailable | Source-dependent | Manual workflow |

Endpoint health means only that a service responded. It does not prove coverage, a determination, clearance, feasibility, capacity, production, or future availability.

### Validation

- `npm run build`: passed with Next.js 16.3.0.
- `npm run lint`: passed.
- `npm test`: passed all 97 tests, including owner/auth boundary tests, forward-only lint-fix coverage, and the built-bundle service-role scan.
- `npm audit --omit=dev`: reported zero vulnerabilities.
- `npm run verify:remote-environment`: owner ready and migrations through `202608030006` observable; exits non-ready because the provider-operations and lint-fix migrations are absent.

### Required completion actions

1. Create or confirm a recoverable Supabase backup. Current project status has no physical backups/PITR, and local logical dump tooling is unavailable.
2. Reconcile the empty migration ledger with the observed schema through an explicitly approved, reviewed process. Do not run `db push` until migrations through `202608030006` are recorded consistently; replaying them is unsafe. The original task prohibited forced migration repair, so this requires a new user-approved operational decision.
3. After the ledger and backup gates are satisfied, apply `202608040001_property_provider_integrations.sql` followed by `202608040002_remote_function_lint_fixes.sql`, then re-run `npm run verify:remote-environment`, `npx supabase migration list --linked`, and `npx supabase db lint --linked`.
4. Grant the operating account access to the NSoul Vercel project or link the checkout to it, then inspect variable names/scopes without printing values, confirm the deployed Git SHA, and redeploy if the migration or environment changes require it.
5. Connect the in-app browser or perform a user-assisted production smoke test: login, callback, activation, dashboard/profile resolution, owner navigation, logout, and repeat login.
6. Run a real property screening through the authenticated Studio after the provider migration is live, including cache, failure, proposal review, report, mobile, and both themes.

### Recommended next implementation sequence

No new adapter should begin until the pending migration, Vercel project access, and authenticated smoke test are complete. After stabilization:

1. Select and license a parcel provider using the existing Regrid/LightBox evaluation; parcel geometry and identifiers add the most immediate screening value but require cost/terms/coverage decisions.
2. Configure and validate NLR solar resource if the API terms and credential are approved; the adapter already exists, so this is lower implementation effort than a new provider.
3. Enable Mapbox only if Census miss rates justify a paid/credentialed fallback.
4. Evaluate authoritative utility-territory data before grid-infrastructure data; preserve the prohibition on service/capacity inference.
5. Add land-cover and road-access sources only after licensing, provenance, freshness, and acceptance criteria are documented.
