# NSoul / `solar-farm` Codex conversation handoff

Generated from the conversation and reconciled with the repository checkout on **August 4, 2026**. Treat this as historical context, not an unquestionable source of truth. The next agent must inspect the checkout and `AGENTS.md`, preserve unrelated work, and recheck external-system state before making changes.

## 1. Executive summary

NSoul is a Southeast Oklahoma commercial-solar developer and intended independent power producer. The public product is a premium marketing site for NSoul and the proposed **1 Cornerstone Lane Solar Farm** in Idabel, Oklahoma. Its primary audience is commercial and industrial energy buyers; secondary audiences include landowners, lenders, investors, technical partners, and community partners. Its main conversion is a qualified commercial-energy/PPA discussion. A secondary conversion is downloading an indicative, non-binding PPA term sheet.

The private product is **NSoul Studio**, an invitation-only, organization-scoped solar-development operating platform. It covers property acquisition, property intelligence and CRM, preliminary GIS/provider screening, project development, financial modeling, funding readiness, capital-partner CRM, documents, activity, and role-governed administration. The intended outcome is a trustworthy system of record that helps NSoul move opportunities from land discovery through development and operating readiness without presenting preliminary data as verified diligence or project approval.

This conversation began with building and repeatedly refining the public marketing site, then expanded the repository through five authenticated Studio sprints, conversion/trust work, owner bootstrap and themes, an Our Vision page, and production property-screening adapters. The most recent completed implementation connected official FEMA, USFWS, USGS, Census, and credential-gated NLR screening sources; added provider administration, health, caching, safe geocoding/manual-coordinate behavior, and parcel-provider boundaries; validated the repository; and pushed commit `b337db8` to `main`.

**Current phase:** application foundations and provider adapters are implemented in source, but production readiness still depends on hosted Supabase/Vercel configuration and verification. **Single most important next action:** reconcile the remote Supabase project with all migrations through `202608040001_property_provider_integrations.sql`, configure the approved server-side provider variables, and run end-to-end screening/RLS tests against the actual deployed environment.

## 2. User intent and success criteria

### Product and brand goals

- The legal company name is **NSoul LLC**; **NSoul** is the facing brand.
- Preserve the proposed project identity **1 Cornerstone Lane Solar Farm**.
- Present NSoul as a development-stage commercial-solar developer and intended asset owner/operator, not as an established utility, large completed portfolio, traditional residential installer, construction company, government grant site, or generic environmental nonprofit.
- The public site must feel like a premium venture-backed energy/climate-technology company, with Vercel, Linear, Stripe, Ramp, Mercury, Tesla Energy, and restrained modern climate-tech work used only as quality references—not copied.
- Primary public conversion: a qualified commercial off-taker requests an introductory conversation.
- Secondary conversion: the indicative PPA term sheet is downloaded.
- Build an emotionally credible long-term vision: own productive solar assets, earn recurring energy revenue, reinvest in new projects, and, as operating success permits, support housing, opportunity, and community improvement.
- Never imply guaranteed pricing, production, savings, incentives, interconnection, approval, financing, customer relationships, or completed projects.

### Public marketing-site requirements

- Keep the public site at `/` and add `/our-vision`, `/submit-property`, `/privacy`, `/terms`, `/login`, metadata, sitemap, and robots support.
- Use Next.js App Router, TypeScript, React, Tailwind/CSS utilities, Motion/Framer Motion, Lucide, responsive layouts, accessible semantics, reduced-motion behavior, and light/dark themes.
- Include a premium header, hero, business-owner economics, process, project/model explanation, project-specific facts, economics chart/milestones, development status, FAQ, commercial inquiry, land intake, footer legal/trust language, and term-sheet entry points.
- Public project facts must remain clearly preliminary and non-binding.
- Make public navigation directional: normal at the top, hidden while scrolling down, and sticky/revealed only while scrolling up. The user explicitly rejected a menu that remained sticky while scrolling down.
- Include **Studio login** in the footer rather than making it a dominant public CTA.
- The login and Studio UI must match the public NSoul green/sage palette and support the same light/dark toggle.
- The energy-flow section must work on mobile without clipped/oversized images or awkward stacking.
- Build `/our-vision` without redesigning the rest of the site, use the existing header/footer/themes, add it to public navigation, and explain the asset-ownership/reinvestment/community flywheel without overclaiming.

### Studio / authenticated-platform requirements

- Preserve the public marketing site; place the private platform under `/dashboard`.
- Use cookie-based Supabase SSR authentication with `@supabase/ssr`.
- Invitation only; no open signup.
- Roles: `owner`, `admin`, `developer`, `analyst`, `viewer`.
- Membership statuses: `invited`, `active`, `suspended`, `deactivated`.
- Only active organization members may enter Studio.
- Owner/admin may invite non-owner members; only an owner may assign/manage an owner role.
- Enforce authorization in route handlers/server actions and PostgreSQL RLS, never only through hidden UI.
- Keep `SUPABASE_SERVICE_ROLE_KEY` in server-only administration/operations modules; never import it into client components or expose it in bundles.
- Maintain organization-scoped records, explicit RLS policies, private storage, append-only/audited material actions, and a premium responsive SaaS shell.
- Navigation requested: Overview, Properties, Projects, Off-takers, Contacts, Documents, Imports, Map, Settings, plus Users for owner/admin and later Capital for owner/admin.

### Property acquisition and CRM requirements

- Manual-first workflow; do not prematurely integrate or scrape listing/data providers.
- Support full property records, quick/manual entry, CSV import, source URL/name/date, map coordinates, seller/broker information, parcels, assessments, deterministic scoring, confidence, risk/fatal flags, comparisons, diligence checklist, tasks, notes, contacts, documents, history, archive/restore, public-land-submission review, and Promote to Project.
- Never allow a score alone to auto-promote a property.
- Retain the original property and evidence after promotion.
- All automated or imported data must remain source-attributed and distinguish verified, estimated, user-reported, public-source, and unknown quality.

### Property screening / provider requirements

- Build one resumable provider-step framework in which one provider can fail without erasing other results.
- Keep manual entry available when providers are unavailable.
- The latest production-integration request explicitly prioritized:
  - FEMA National Flood Hazard Layer;
  - USFWS National Wetlands Inventory;
  - USGS 3DEP / Elevation Point Query Service;
  - National Laboratory of the Rockies solar-resource API;
  - Census geocoding as default, optional secondary geocoder, manual coordinates, map pin, reverse proposal, and ambiguity-safe candidate handling;
  - parcel adapter/configuration/candidates/geometry/metadata/multi-select/manual workflow plus evaluation of at least two vendors without inventing pricing;
  - secured owner/admin integration console;
  - provider health, failure, quota, cache, version, geometry fingerprint, and freshness state;
  - deterministic score-impact proposals/risk flags that never overwrite verified/manual facts;
  - no interconnection or capacity inference from proximity;
  - at least 16 tests, build, lint, tests, audit, documentation, and an explicit live-versus-unavailable report.
- Do not claim all 11 screening categories are operational.

### Project command-center requirements

- Promoted properties become governed projects, not loose marketing records.
- Track canonical stages, stage gates, health, interconnection, engineering/EPC, off-taker/PPA, permits/diligence, budget/capital stack, incentives, blockers, decisions, milestones, documents, notifications, construction, commissioning, and early operating foundations.
- Direct project-stage and health mutations are guarded; privileged overrides require role and reason.
- Never treat nearby infrastructure as available capacity or a PPA draft as executed.

### Finance/funding requirements

- Provide server-calculated, versioned financial models, scenarios, sensitivity analysis, model approval/staleness, funding readiness, capital-partner CRM, term-sheet versions, close checklists, restricted data-room packaging, and printable funding packages.
- Store complete validated model inputs/outputs, engine version/hash, warnings, and schedules.
- Approval is owner/admin only. Material upstream changes mark models stale.
- Keep tax, incentives, lender readiness, production, and savings explicitly preliminary and subject to professional/source verification.

### Engineering/workflow requirements

- Inspect repository instructions and the installed Next.js documentation before framework changes because Next.js 16 has breaking APIs.
- Preserve useful existing/user work and avoid destructive Git operations or history rewrites.
- Run lint and a production build before completion; later sprints also required all tests and `npm audit --omit=dev`.
- Do not commit secrets or real environment values.
- **Standing Git preference:** after any future changes, commit and push them. Do not force-push or rewrite history.
- Completion reports should include branch, Git status, files changed, validation commands, remaining placeholders/manual steps, and actual provider status.

### Scope boundaries and launch constraints

- No deadline was recorded.
- Public claims must remain development-stage and non-binding.
- No unsupported scraping.
- No fake live integrations or demo values represented as verified operational data.
- No weakening RLS to make UI work.
- No service-role client in browser code.
- Hosted configuration, migration application, provider credentials, email delivery, domain configuration, and production QA require manual/external actions and cannot be inferred from a local build.

## 3. Decisions and rationale

### Brand and product architecture

- **Decision:** use **NSoul LLC** as legal identity and **NSoul** as facing brand; retain 1 Cornerstone Lane as the reference project. **Why:** explicitly directed by the user as the brand evolved from Cornerstone Solar. **Status:** final unless the user changes it.
- **Decision:** keep one repository with public marketing routes and a protected Studio under `/dashboard`. **Why:** the user repeatedly required preservation of the public site while extending the authenticated operating platform. **Rejected:** rebuilding/replacing the public site for each backend sprint. **Status:** final.
- **Decision:** call the private workspace **NSoul Studio** / Development Studio rather than keeping “Cornerstone Site Finder” as the outward product name. **Why:** the company-facing brand consolidated around NSoul, while the original Site Finder purpose remains part of the platform. **Status:** final in current UI.

### Public design system

- **Decision:** premium sage/off-white and near-black green palette with electric/lime accent, large editorial sans typography, restrained monospace eyebrows, light/dark themes, substantial imagery, and rounded-but-not-bubbly surfaces. **Why:** repeated user preference for premium, futuristic, clear-at-a-glance B2B SaaS rather than generic solar. **Status:** final direction, individual sections may still be refined.
- **Decision:** use a sun/solar mark next to the futuristic `NSOUL` wordmark. **Why:** explicit user request. **Status:** final.
- **Decision:** favor larger type and concise copy. **Why:** the user repeatedly flagged small text, weak hierarchy, and hard-to-read charts/cards. **Rejected:** tiny monospace-heavy dashboard labels and long low-contrast copy. **Status:** final preference.
- **Decision:** directional header behavior—hide on downward scroll, reveal sticky on upward scroll, return to normal at top. **Why:** the user explicitly said the sticky menu still remained on scroll down and asked to remove it. **Status:** implemented/final.
- **Decision:** place Studio login in the footer. **Why:** user suggested a footer login so authenticated access exists without competing with public conversion. **Status:** implemented.
- **Decision:** use project/warehouse/solar imagery without people for certain commercial benefit cards and use whimsical isolated 3D assets in the “Sunlight in. Business powered.” connection section. **Why:** extensive iteration showed the user preferred the whimsical 3D energy-flow composition but wanted business imagery to feel commercial and clean. **Rejected:** large realistic combined building render that caused overlap/stacking; person-centric cards in the final benefit direction; overly bright SAVE/PROTECT/POWER/RENEW cards that the user called “cheesy.” **Status:** current asset choices are implemented; future refinements should preserve the approved visual grammar rather than restart the design.
- **Decision:** use “We…” rather than repeatedly saying “NSoul…” in explanatory body copy. **Why:** explicit request for a more direct brand voice. **Status:** final copy preference.
- **Decision:** project sections should communicate in under five seconds and avoid combining too many maps, roles, dividers, chips, and metrics. **Why:** the user called dense versions chaotic and asked for progressively simpler/premium compositions. **Rejected:** spreadsheet-like pale dashboards and multi-card project panels. **Status:** final principle; the current regional-project component should be inspected before further redesign.

### Authentication and tenancy

- **Decision:** `organization_members` is the authoritative authorization record. `profiles.role` and `profiles.organization` are compatibility data, not authorization inputs. **Why:** secure normalized membership model and explicit user requirement. **Status:** final.
- **Decision:** only `organization_members.status = 'active'` may enter Studio. Invitation/suspension/deactivation are membership states; there is no separate profile status or invitation-accepted boolean. **Why:** confirmed by login/session audit. **Status:** final.
- **Decision:** one organization membership per user for current release. **Why:** simplifies tenant selection and fail-closed session loading. **Tradeoff:** future multi-tenant support requires an active-organization selector and schema/session changes. **Status:** provisional product constraint.
- **Decision:** first-owner bootstrap is a server-only idempotent CLI using service role. **Why:** the first owner is the necessary exception to invitation-only access, and weakening dashboard checks was rejected. **Status:** final mechanism; remote execution state must be verified.
- **Decision:** activity-log inserts for security events occur only through trusted server/database workflows. **Why:** audit integrity. **Status:** final.

### Property and evidence model

- **Decision:** manual-first canonical records with source attribution before broad integrations. **Why:** data licensing, accuracy, and unsupported API concerns. **Rejected:** scraping listing sites or simulating automatic feeds. **Status:** final.
- **Decision:** deterministic scoring is separate from fatal risk and confidence. **Why:** a high score must not erase a disqualifying fact or weak evidence. **Status:** final.
- **Decision:** automated provider output creates proposals; operators accept/reject them. **Why:** preserve manual and verified facts and make source changes auditable. **Status:** final.
- **Decision:** property promotion is an idempotent permission-checked database transaction that retains the source property. **Why:** preserve provenance and prevent duplicate projects. **Status:** final.

### Provider architecture

- **Decision:** independent server-side provider adapters with normalized outcomes, source/version/freshness/cache metadata, and explicit unavailable/credential-missing/error states. **Why:** honest failure isolation and resumable serverless execution. **Status:** final.
- **Decision:** public official Phase 1 sources are Census, FEMA NFHL, USFWS NWI, and USGS EPQS; NLR solar is server-key-gated. **Why:** user prioritized authoritative sources. **Status:** implemented; remote endpoint availability still operationally variable.
- **Decision:** optional Mapbox fallback only when Census returns no match; never auto-select multiple candidates. **Why:** ambiguity safety. **Status:** implemented/provisional provider choice.
- **Decision:** no parcel vendor selected. Provide a provider-neutral interface and compare Regrid and LightBox without making pricing claims. **Why:** vendor/licensing decision remains open. **Status:** open/manual fallback.
- **Decision:** connection health means endpoint response only, not site coverage or diligence clearance. **Why:** avoid false assurance. **Status:** final.

### Project and financial controls

- **Decision:** project stage and health changes use database functions/triggers and configurable gates; history is append-only. **Why:** material project governance cannot depend on UI. **Status:** final.
- **Decision:** finance engine is deterministic/versioned and approved versions become stale when material upstream records change. **Why:** reproducibility and transaction-readiness discipline. **Status:** final foundation.
- **Decision:** funding package includes only owner/admin-approved private documents and a current approved model. **Why:** data-room control. **Status:** final.
- **Decision:** tax/depreciation is a preliminary placeholder, not a tax-credit/partnership-flip model. **Why:** professional review and more complete source data are required. **Status:** explicitly provisional.

## 4. User preferences

### Visual and UX

- Premium, clean, institutional, confident, modern B2B SaaS/climate-tech.
- Sage/off-white light mode; near-black/deep green dark mode; restrained lime/electric-green accents; no bright cyan.
- Larger, bolder typography with strong hierarchy; easy to read at a glance.
- Rounded rectangles, but more square and controlled than pillowy cards.
- Emotional, premium imagery; for operational imagery, favor commercial solar arrays, automated factories, warehouses, and manufacturing—not residential-installation clichés.
- Use motion selectively: restrained entrance effects, count-up only when requested, responsive hover states, and respect reduced motion. The user later explicitly requested removing one economics count-up, so do not globally add counters without checking context.
- Preserve both light and dark modes across marketing, login, Studio, provider cards, charts, and new sections.
- Mobile must be designed, not merely stacked. The user repeatedly flagged clipping, map cutoff, oversized headlines, image overflow, and awkward two-item stacking.
- Keep section transitions tight; remove unexplained gaps and harsh horizontal lines.
- Use concise labels and avoid clutter from excess chips, dividers, tiny technical labels, and repeated disclaimers.

### Brand voice and content

- `NSOUL` in the wordmark; “NSoul” in prose; “NSoul LLC” for legal/company ownership.
- Prefer direct first-person plural (“We develop…”) in explanatory marketing copy.
- Simple commercial language focused on saving operating capital, predictable energy costs, business continuity, and long-term value.
- Keep factual caveats visible but not visually dominant.
- Never list outreach targets as customers or imply agreements that do not exist.
- Never imply utility capacity/interconnection, environmental clearance, title, permitting, financing, production, or savings are confirmed unless corresponding verified evidence exists.

### Engineering and collaboration

- Work directly in the current repository/branch unless instructions require otherwise.
- Inspect branch, status, package configuration, README/AGENTS/contributing instructions before implementation.
- Preserve useful/unrelated work.
- Run proportional validation, including lint and production build, and later the complete tests/audit.
- Be autonomous and action-oriented; report concrete outcomes, not only recommendations.
- After any changes, commit and push. Never force-push or rewrite history.
- Completion reports should explicitly state current branch/status, changed files, validation, remaining placeholders, live/unavailable integrations, and manual deployment actions.

### Explicit dislikes / approaches not to repeat

- Sticky menu remaining visible while scrolling down.
- Small, low-contrast type, especially chart labels/tooltips and Studio screening cards.
- Cheesy bright alternating SAVE/PROTECT/POWER/RENEW cards.
- Dense “dashboard within a dashboard” public project sections.
- Large empty areas, harsh section lines, faded farm imagery, clipped maps, or pale washed-out interfaces.
- Person-centric imagery where the request is specifically about generation and automated commercial use.
- Excessively literal or busy UI additions after the user says “stop” or asks to revert; preserve the last approved structure and make the narrow requested adjustment.

## 5. Work completed

### Repository/bootstrap and public marketing foundation — commit `ed00902`

- Initialized/organized the Next.js 16 App Router application and production deployment foundation.
- Added the public marketing site, global visual system, header/footer, core sections, responsive rules, imagery, NSoul mark, initial dashboard scaffolding, Supabase clients, schemas, seed, validation, and Vercel-safe environment handling.
- Key paths: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/layout/`, `components/sections/`, `components/ui/`, `public/brand/`, `lib/project-data.ts`, `lib/supabase/`, `supabase/migrations/202608020001_site_finder_schema.sql`, `supabase/migrations/202608020002_site_finder_rls.sql`, `supabase/seed.sql`, `.env.example`, `.gitignore`, `README.md`.

### Secure organization access / Sprint 1 — commit `4f446a7`

- Implemented cookie-based SSR session refresh, active-membership dashboard checks, organization/profile/membership model, owner/admin/developer/analyst/viewer roles, invitation-only administration, protected admin routes, private tenant storage, activity audit, and user administration.
- Replaced early broad legacy policies with tenant-scoped explicit policies in `supabase/migrations/202608020003_identity_and_tenant_security.sql`.
- Key paths: `lib/auth/session.ts`, `lib/auth/roles.ts`, `lib/auth/api.ts`, `lib/supabase/proxy.ts`, `app/api/admin/users/route.ts`, `app/dashboard/users/page.tsx`, `components/dashboard/user-administration.tsx`, `components/dashboard/dashboard-shell.tsx`, `docs/SECURITY_AND_OPERATIONS.md`, `tests/security.test.mts`, `scripts/verify-browser-secrets.mjs`.

### Regional public project simplification — commits `a1b5dfe` and earlier design iterations

- Replaced the overly dense initial public project-intelligence console with a simpler regional-project feature.
- Key paths: `components/project-model/regional-project-feature.tsx`, `components/sections/project-model-section.tsx`, `app/globals.css`.
- The current checkout—not screenshots from intermediate iterations—is authoritative.

### Property acquisition — commit `12b4b49`

- Added canonical property pipeline, parcels, assessments, deterministic score runs/components, risk flags, data sources, status history, comments, project-property links, APIs, forms, list/detail workflows, archive/restore, and preliminary assessment editor.
- Key paths: `supabase/migrations/202608030001_property_acquisition.sql`, `app/api/properties/`, `components/properties/`, `lib/scoring/preliminary.ts`, `lib/validation/site-finder.ts`, `docs/PROPERTY_ACQUISITION.md`, `tests/property-acquisition.test.mts`.

### Property Intelligence and Acquisition CRM / Sprint 2 — commit `c11a175`

- Added expanded canonical statuses, 22-item diligence checklist, source-quality vocabulary, contacts/tasks/notes/documents/activity, risk resolution, source tracking, public-submission conversion, idempotent promotion, and refined RLS/role boundaries.
- Key paths: `supabase/migrations/202608030002_property_intelligence_crm.sql`, `app/api/properties/[id]/crm/route.ts`, `app/api/public-submissions/[id]/convert/route.ts`, `components/properties/property-crm-panels.tsx`, `components/imports/public-submission-review.tsx`, `docs/PROPERTY_ACQUISITION.md`, `tests/property-acquisition.test.mts`.

### Property Data Enrichment and GIS Screening / Sprint 3 — commit `f947461`

- Added provider-neutral run/step/result/proposal/cache/usage architecture, Census geocoding, explicit unavailable providers, one-step-at-a-time resumable requests, batch queue bounds, proposal review, screening reports, map and screening pages, and tenant RLS.
- Key paths: `supabase/migrations/202608030003_property_enrichment_gis.sql`, `lib/enrichment/`, `app/api/properties/[id]/screening/route.ts`, `app/api/properties/screening-batch/route.ts`, `app/api/screening-reports/[runId]/route.ts`, `components/properties/screening-workspace.tsx`, `docs/PROPERTY_ENRICHMENT.md`, `tests/property-enrichment.test.mts`.

### Directional public nav and branded Studio — commits `bff638f`, `bf2520c`

- Implemented down-scroll hide/up-scroll sticky header behavior and added Studio login to the footer.
- Restyled `/login` and the Studio shell for the NSoul green/sage palette.
- Key paths: `components/layout/site-header.tsx`, `components/layout/site-footer.tsx`, `app/login/page.tsx`, `components/dashboard/dashboard-shell.tsx`, `app/dashboard/dashboard.css`, `app/globals.css`.

### Conversion, trust, and project intelligence — commit `4ba869d`

- Added downloadable indicative term sheet, stronger project-specific content, qualified commercial inquiry flow, improved public land submission, Privacy/Terms, conversion event tracking, trust strip, FAQ, production metadata, sitemap/robots, content/launch checklists, and marketing tests.
- Key paths: `public/documents/cornerstone-solar-indicative-term-sheet.pdf`, `scripts/generate-term-sheet.py`, `components/sections/cornerstone-project-section.tsx`, `components/sections/faq-section.tsx`, `components/sections/trust-strip.tsx`, `components/ui/contact-form.tsx`, `components/forms/public-property-form.tsx`, `app/api/contact/route.ts`, `app/api/public-submissions/route.ts`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `lib/analytics.ts`, `docs/CONTENT_ACCURACY_CHECKLIST.md`, `docs/LAUNCH_CHECKLIST.md`, `tests/marketing-readiness.test.mts`.

### Project Development Command Center / Sprint 4 — commit `1090dab`

- Added canonical project stages/transitions, governed stage gates, deterministic health rules, overrides/history, interconnection, engineering/EPC, off-taker/PPA, permitting/diligence, finance/incentives, blockers/decisions/milestones, construction/operations foundations, APIs, project shell/subnav, and role-scoped RLS.
- Key paths: `supabase/migrations/202608030005_project_development_command_center.sql`, `lib/projects/domain.ts`, `lib/projects/data.ts`, `app/api/projects/`, `app/dashboard/projects/`, `components/projects/`, `docs/PROJECT_DEVELOPMENT_COMMAND_CENTER.md`, `tests/project-command-center.test.mts`.

### Financial modeling, funding readiness, capital partner CRM / Sprint 5 — commit `1967aa3`

- Added deterministic finance engine `nsoul-finance-1.0.0`, immutable model versions/hashes, approval and staleness controls, scenario/sensitivity routes, funding readiness, capital partner/term-sheet/close records, private data-room allowlist, printable funding package, finance/capital UI, and restricted RLS.
- Key paths: `supabase/migrations/202608030006_financial_modeling_capital_readiness.sql`, `lib/finance/engine.ts`, `lib/finance/schemas.ts`, `lib/finance/service.ts`, `lib/finance/data.ts`, `app/api/projects/[id]/finance/`, `app/api/capital/`, `components/finance/`, `app/dashboard/capital/`, `docs/FINANCIAL_MODELING_AND_FUNDING.md`, `tests/financial-readiness.test.mts`.

### Mobile energy flow — commit `23dba43`

- Added focused responsive rules for the “Sunlight in. Business powered.” section after the user reported a poor mobile composition.
- Key path: `app/globals.css`.

### Initial owner bootstrap and Studio theme — commit `b976268`

- Diagnosed the “Your account is not active. Contact an NSoul administrator.” failure as missing/inactive authoritative membership graph rather than a need to weaken login checks.
- Added idempotent server-only CLI and verification mode. It checks Auth user existence/active/confirmed state, profile, `nsoul` organization, matching membership, `owner` role, `active` status, and `loginReady`; it creates one `initial_owner_bootstrap` audit record and refuses to move a user from another organization.
- Added `NSOUL_INITIAL_OWNER_USER_ID` and `NSOUL_INITIAL_ORGANIZATION_NAME` environment names, scripts `bootstrap:first-owner` and `verify:first-owner`, Studio light/dark support, and owner-bootstrap tests.
- Key paths: `scripts/bootstrap-first-owner.mjs`, `tests/owner-bootstrap.test.mts`, `docs/SECURITY_AND_OPERATIONS.md`, `docs/DATABASE_SETUP.md`, `.env.example`, `app/dashboard/dashboard.css`.
- The Auth UUID supplied for this issue was `837fbd1a-4c1d-4c23-bbee-71040ead75c7`. The repository confirms the mechanism and tests; this handoff has no confirmed tool output proving the CLI was executed successfully against the hosted Supabase project. Re-run `npm run verify:first-owner -- --user-id ...` in a secure environment.

### Screening result clarity — commit `9e8b9f0`

- Fixed hard-to-read screening provider cards in light mode and clarified pending/unavailable/error output so a provider does not appear to produce content when it is waiting or unconfigured.
- Key paths: `components/properties/screening-workspace.tsx`, `app/globals.css`, `tests/property-enrichment.test.mts`.

### Our Vision — commit `9f74219`

- Added `/our-vision`, metadata/navigation/sitemap entry, premium mission narrative, asset flywheel, business model, pillars, milestones, founder statement, commitment, and final CTA with responsive/light/dark styling.
- Key paths: `app/our-vision/page.tsx`, `components/vision/`, `components/layout/site-header.tsx`, `components/layout/site-footer.tsx`, `app/globals.css`, `tests/marketing-readiness.test.mts`.

### Production property screening integrations — commit `b337db8`

- Added official FEMA NFHL, USFWS NWI, USGS EPQS/3DEP, and credential-gated NLR solar adapters.
- Expanded Census geocoding with optional Mapbox fallback, ambiguity-safe candidates, manual/map-pin coordinates, and proposed reverse address.
- Added Turf geometry overlap/affected-acre helpers, geometry/version-aware cache fingerprints, provider health/failure/cache/quota metadata, deterministic score-impact proposals, parcel interface/evaluation, secured owner/admin integration API/UI, and migration `202608040001_property_provider_integrations.sql`.
- Key paths: `lib/enrichment/providers/fema-flood.ts`, `usfws-wetlands.ts`, `usgs-terrain.ts`, `nlr-solar.ts`, `census-geocoder.ts`, `parcel.ts`, `provider-utils.ts`, `lib/enrichment/service.ts`, `lib/enrichment/registry.ts`, `components/maps/coordinate-picker.tsx`, `components/settings/integrations-console.tsx`, `app/api/integrations/route.ts`, `app/dashboard/settings/integrations/page.tsx`, `docs/PROPERTY_ENRICHMENT.md`, `docs/PARCEL_PROVIDER_EVALUATION.md`, `tests/property-enrichment.test.mts`.
- Confirmed validation at completion: `npm run lint` passed; `npm run build` passed; `npm test` passed 96 tests across the recorded suites plus browser-secret scan; `npm audit --omit=dev` reported 0 vulnerabilities; commit pushed to `origin/main`.

## 6. Current repository and runtime state

### Git

- Repository: `/Users/geofftracy/Projects/solar-farm`
- Remote: `https://github.com/mrinfinitum/solar-farm.git`
- Branch at audit: `main`
- `HEAD` and `origin/main` at audit: `b337db8 Complete production property screening integrations`
- No staged or modified tracked files were present when this handoff started.
- Pre-existing untracked file: `docs/CODEX_CHAT_HANDOFF_REQUEST.md`. It contains the handoff request and was not edited or staged by the agent creating this document.
- This handoff document is a documentation-only addition and should have its own later commit/push. Recheck `git status` after importing the handoff.

### Runtime

- No listener was found on local TCP ports 3000 or 3001 during the August 4, 2026 audit.
- Process enumeration itself was denied by the sandbox, so a non-listening background process cannot be ruled out; no tool/agent command remained active.
- Local development address is normally `http://localhost:3000` after `npm run dev`.

### Build and tests

- Last confirmed at commit `b337db8`: lint passed, production build passed, all recorded tests passed (96), browser service-role scan passed, and `npm audit --omit=dev` reported 0 vulnerabilities.
- The handoff audit did not re-run the suite because it made no application-code change. The next agent should re-run it after any implementation work.
- Test scripts: `test:security`, `test:property`, `test:enrichment`, `test:marketing`, `test:project`, `test:finance`, and `verify:browser-secrets` under aggregate `npm test`.

### Local environment

- `.env.local` exists and, without revealing values, had these names configured during the audit: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.
- `NEXT_PUBLIC_MAP_STYLE_URL`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL` were empty.
- Newer optional screening variables were not present in the inspected `.env.local`: `SECONDARY_GEOCODING_PROVIDER`, `SECONDARY_GEOCODING_API_KEY`, `SOLAR_RESOURCE_API_KEY`, `PARCEL_PROVIDER`, and `SCREENING_BATCH_MAX` (the application has safe defaults where documented).
- Never copy values from an old transcript; configure them in local/Vercel secret settings.

### Database, auth, storage, and seed

- Source migrations exist in filename order through `202608040001_property_provider_integrations.sql`.
- The user stated that Supabase migrations had been applied before the initial-owner issue, but no tool result in this handoff proves exactly which remote migration was last applied. The latest production-provider migration was added afterward and should be assumed **not deployed until verified**.
- `supabase/seed.sql` supplies the 1 Cornerstone Lane reference record while leaving unknown diligence facts null/unverified.
- The private bucket is `site-finder-documents`, with organization-prefixed object paths and signed download routes. Migration documentation describes a 15 MB limit and allowed PDF/PNG/JPEG/CSV/XLSX/DOCX types.
- Supabase public signup must be disabled manually. Exact Auth Site URL, callback allowlist, SMTP, backup/PITR, and hosted RLS state are external settings and were not verified in this audit.
- Initial owner bootstrap mechanism exists; actual hosted `loginReady` result is not confirmed here.

### Deployment

- User referenced the production login URL `https://www.nsoul.co/login`; source metadata defaults to `https://www.nsoul.co` when `NEXT_PUBLIC_SITE_URL` is absent.
- Git pushes to `main` succeeded through `b337db8`. Whether Vercel automatically deployed that commit, whether the domain points at it, and the current deployment health were not verified with a Vercel API/CLI in this conversation.
- No pull request was used; work was committed directly to `main` according to the user’s standing preference.

## 7. External systems and integrations

### Supabase

- **Purpose:** Auth, PostgreSQL, RLS, private Storage, organization membership, operational records, provider configuration, audit, and administrative invitations.
- **Configured in source:** SSR publishable-key clients, server client, server-only admin client, migrations, private bucket, invitation/admin route, callback/reset/logout, first-owner CLI.
- **Environment names:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NSOUL_INITIAL_OWNER_USER_ID`, `NSOUL_INITIAL_ORGANIZATION_NAME`.
- **Manual actions:** verify every migration remotely, disable public signup, configure Site URL/callbacks/SMTP, bootstrap/verify owner, invite another user, test each role/RLS, configure backups/PITR.
- **Risk:** local/static tests do not prove hosted policies or Auth settings.

### Vercel / public domain

- **Purpose:** production hosting for Next.js, environment variables, custom domain.
- **Known:** GitHub `main` is pushed; repository is Vercel-oriented; user cited `https://www.nsoul.co/login`.
- **Manual actions:** verify latest deployment commit, production/preview env scopes, `NEXT_PUBLIC_SITE_URL`, callback allowlists, HTTPS, logs, and all public/private routes.

### GitHub

- **Repository:** `https://github.com/mrinfinitum/solar-farm.git`.
- **Workflow preference:** commit and push after changes; current work has gone directly to `main`; never force-push or rewrite history.

### Resend / email

- **Purpose:** optional commercial inquiry delivery.
- **Environment names:** `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.
- **Current local audit:** empty. Forms validate and provide a safe fallback without delivery.
- **Manual actions:** configure verified sender/domain and test internal notification/confirmation. Public forms currently use process-local rate limiting; add durable edge/WAF protection before high-volume launch.

### MapLibre / map style

- **Purpose:** property map and coordinate picker.
- **Environment:** `NEXT_PUBLIC_MAP_STYLE_URL` is intentionally browser-visible and was empty locally.
- **Fallback:** manual latitude/longitude remains usable. A map pin does not establish parcel ownership, utility service, capacity, or feasibility.

### U.S. Census Geocoder

- **Purpose:** default address geocoding/reverse context.
- **Credentials:** none.
- **Behavior:** conservative match handling; multiple candidates are not auto-selected; manual coordinates remain valid.
- **Default freshness:** 30 days.

### Mapbox (optional secondary geocoder)

- **Purpose:** fallback only when Census returns no match and optional reverse-address proposal.
- **Environment:** `SECONDARY_GEOCODING_PROVIDER=mapbox`, `SECONDARY_GEOCODING_API_KEY` (server only).
- **Status:** not configured locally and not required for manual/Census operation.

### FEMA NFHL

- **Purpose:** preliminary flood-zone/SFHA/map context and geometry overlap.
- **Source:** official FEMA ArcGIS NFHL service, layer 28 as implemented.
- **Credentials:** none. **Default freshness:** 30 days.
- **Limits:** desktop screening only; a service response is not a flood determination or coverage guarantee. A CLI smoke query experienced connection reset during development even though service metadata/layer verification succeeded; handle degraded service honestly.

### USFWS National Wetlands Inventory

- **Purpose:** preliminary wetland classification and overlap context.
- **Credentials:** none. **Default freshness:** 90 days.
- **Limits:** desktop screening only, not a jurisdictional determination or environmental clearance.

### USGS EPQS / 3DEP

- **Purpose:** sampled elevation, range/variability, and approximate terrain/slope context.
- **Credentials:** none. **Default freshness:** 180 days.
- **Limits:** sampling is approximate and not survey, grading, geotechnical, or civil design.

### National Laboratory of the Rockies solar-resource API

- **Purpose:** preliminary DNI/GHI/latitude-tilt context.
- **Environment:** `SOLAR_RESOURCE_API_KEY` (server only).
- **Status:** credential-gated and not configured locally. **Default freshness:** one year.
- **Limits:** implemented data is a reference dataset (documented as 1998–2009 and approximate resolution); not a production model or guarantee.

### Parcel data

- **Purpose:** parcel candidates, geometry, metadata, multi-select/manual confirmation.
- **Status:** provider-neutral adapter/manual fallback only; `PARCEL_PROVIDER` was not configured.
- **Vendors researched:** Regrid and LightBox official documentation. No pricing was invented and no vendor was selected.
- **Manual action:** user must choose provider/licensing, credentials, coverage, terms, and sample acceptance criteria before implementation can be considered live.

### Other screening categories

- Land cover, road access, utility territory, grid infrastructure, and commercial context remain explicit unavailable/manual workflows.
- Do not claim capacity, service territory, deliverability, or commercial fit from proximity.

### Utility / PSO and USDA REAP

- PSO appears in project copy as the utility-review context; there is no live utility integration or confirmed circuit capacity in source.
- The marketing development timeline states USDA REAP geographic eligibility is complete. Treat this as a user-supplied project statement; it does not imply an incentive award or full eligibility determination.

### Analytics

- `lib/analytics.ts` and tracking components record lightweight conversion events without form-field content. Production analytics destination/configuration was not independently verified.

## 8. Data model and business rules

### Identity and tenancy

- `organizations`: organization identity; current slug is `nsoul`.
- `profiles`: references `auth.users(id)` with cascade behavior from the identity migration; contains profile display/contact compatibility fields.
- `organization_members`: authoritative `organization_id`, `user_id`, `role`, `status`, `invited_by`, timestamps. Current release expects one membership per user.
- Roles: `owner`, `admin`, `developer`, `analyst`, `viewer`.
- Statuses: `invited`, `active`, `suspended`, `deactivated`.
- Login readiness requires Auth user existing, active/not banned, email confirmed, profile existing, `nsoul` organization existing, matching membership, recognized role, and `status = active`. The first-owner verification additionally requires `role = owner`.
- `activity_log`: same-organization readable; ordinary users cannot directly insert/update/delete.
- `app_settings`: organization-scoped owner/admin management.

### Role rules

- All active roles may enter/read permitted tenant data.
- Owner/admin/developer/analyst generally create/update development and analysis records; viewer is read-only.
- Owner/admin generally delete/archive operational records.
- Owner/admin invite/manage non-owner users; admin cannot assign, change, deactivate, or remove owner role. Owner can manage all roles, subject to final-active-owner safeguards.
- Capital partner/sensitive finance records are owner/admin only.
- UI visibility is never the authority; routes and RLS must recheck.

### Property pipeline and relationships

- Canonical statuses documented in current CRM: `new`, `desktop_screening`, `owner_outreach`, `site_control`, `utility_screening`, `detailed_diligence`, `candidate_project`, `promoted_to_project`, `rejected`, `archived`.
- `properties` is the source record with child parcels, data sources, assessments, score runs/components, risk flags, checklist items, contacts, tasks, notes, documents, and activity.
- Each new property receives 22 standard diligence items.
- Promotion uses `promote_property_to_project`, locks and checks permissions, returns an existing linked project when present, otherwise creates a `prospect` project and `project_properties` origin relationship, copies relevant unresolved context, and marks the property promoted. Score never auto-promotes.
- Public land submissions are staging records; owner/admin conversion is idempotent and retains the original submission.

### Property scoring

- Model: `nsoul-preliminary-v2.0`.
- Raw category inputs are 0–100; maximum weights: grid/interconnection 30, usable land/geometry 15, environmental constraints 15, acquisition economics 10, construction access/terrain 10, permitting/land use 10, off-taker/commercial fit 10.
- Grades: A 85–100, B 70–84, C 55–69, D 40–54, F 0–39.
- Data quality: `verified`, `estimated`, `user_reported`, `public_source`, `unknown`.
- Confidence accounts for evidence type/count, unknown critical facts, and age; verified data older than 366 days is stale for confidence.
- Fatal risks produce critical risk/hold regardless of numeric score. Canonical examples include no viable interconnection, insufficient site control/acreage, environmental constraint, incompatible land use, no legal access, title defect, failed economics, and no plausible off-taker.
- Manual override needs a reason at least 10 characters. Calculated score remains immutable alongside displayed override, actor, reason, and timestamp.
- Grid/interconnection cannot receive more than 35 raw points without `utility_confirmed` evidence in enrichment proposal logic.

### Screening

- Provider steps are independent and resumable; one step advances per authenticated request.
- Batch default is 10, hard maximum 50.
- Current cache defaults: Census/FEMA 30 days, NWI 90 days, USGS 180 days, NLR one year. Organization owner/admin may override allowed duration; migration constraint permits 60 through 31,536,000 seconds.
- Cache fingerprint includes request/provider version and relevant geometry/update timestamp.
- Provider outputs store identity/version, request, retrieval/dataset date, confidence, freshness, expiry, warning/error/rate-limit state, and normalized results.
- Automated findings become `property_field_proposals`; owner/admin/developer accept/reject, analyst/viewer cannot decide. Cached results still create proposals for the current run.
- Flood/wetland/terrain may create deterministic score-impact proposals with before/delta/after/model/risk flags. They remain proposed and do not overwrite verified/manual facts.

### Project stages and governance

- Canonical stages: `prospect`, `site_control`, `utility_screening`, `interconnection_application`, `preliminary_engineering`, `offtaker_development`, `ppa_negotiation`, `permitting`, `financing`, `procurement`, `construction`, `commissioning`, `operating`, `repowering`, `decommissioning`, `suspended`, `cancelled`.
- Direct stage/health column updates are guarded. `advance_project_stage` validates canonical transitions and required gates under lock.
- Developer may advance satisfied transitions. Owner/admin may override failed/nonstandard transitions only with written reason and supporting project decision.
- Deterministic health: unresolved critical blocker → `blocked`; overdue critical milestone → `at_risk`; unresolved high blocker → `attention`; otherwise `on_track`. Shared TypeScript rules also consider site-control expiry, capital gap, permit delay, EPC budget variance, and construction variance.
- Notification refresh is not automatically scheduled; `refresh_project_notifications()` needs an authenticated scheduler/application workflow.

### Financial model

- Engine: `nsoul-finance-1.0.0` in `lib/finance/engine.ts`.
- Persists complete validated inputs/outputs, canonical SHA-256 version hash, source hash, warnings, annual revenue, and operating-cost schedules.
- Delivered generation applies degradation, curtailment, and availability to the annual generation assumption.
- PPA revenue = delivered kWh × escalated contract rate.
- Opex escalates annually; replacement capex occurs in specified years.
- Unverified incentives are excluded; estimated/confirmed values remain planning inputs with disclaimers.
- Debt handles interest-only years, amortization, balloon; DSCR = CFADS / debt service and is null when no debt service.
- Project/equity NPV uses annual end-of-period discounting; IRR uses bounded bisection and can be unavailable; payback is first non-negative cumulative year; break-even PPA uses bounded binary search.
- Sensitivity limit: 121 cells.
- Approval: owner/admin only. Blocking warnings/stale versions cannot be approved or packaged. Material production, EPC, PPA, interconnection-cost, incentive, debt, or target-date changes mark approved versions stale.
- Funding readiness: 80% from current approved model, approved production source, approved budget, valid site control, and interconnection evidence; 20% from completed requirements. Any unresolved fatal flag makes status `blocked`. Status values: `early`, `developing`, `review_ready`, `lender_ready`, `blocked`. “Lender ready” is internal evidence state, not lender approval.

### Marketing project assumptions (source of truth: `lib/project-data.ts`)

- Project: `1 Cornerstone Lane Solar Farm`.
- Owner/developer shown in current source: `NSoul LLC`.
- Address: `1 Cornerstone Lane`, `Idabel, Oklahoma 74745`, `McCurtain County`.
- Capacity: `1.5 MW DC`; technology: Tier-1 ground-mounted photovoltaic array.
- Annual generation assumption: `2,250,000 kWh`.
- Target operation: `Q2/Q3 2027`; subject to utility/interconnection and final approvals.
- Agreement: `20-year commercial PPA`; possible five-year extensions.
- Indicative starting PPA: `$0.08075/kWh`; modeled utility baseline `$0.095/kWh`; starting discount `15%`; annual PPA escalator `2%`; customer upfront capital `$0`; REC transfer proposed to off-taker.
- Displayed economics: Year 1 `$32,062`, Year 5 `$44,098`, Year 10 `$61,886`, 20-year cumulative `$765,000+`; rate comparison in `lib/project-data.ts` is the code source of truth.
- These values are preliminary marketing/model assumptions, not guarantees. The global disclaimer explicitly subjects capacity, generation, pricing, savings, incentives, RECs, financing, schedule, and terms to final technical/commercial approvals.

## 9. Known issues, risks, and technical debt

1. **Remote migration state unknown.** Source contains migrations through `202608040001_property_provider_integrations.sql`, but hosted application state is unverified. Impact: provider settings/health fields or later Studio modules may fail at runtime. Next: inspect Supabase migration history, back up, apply missing files in order, then role-test RLS.
2. **Initial owner hosted readiness unconfirmed.** The original symptom was “Your account is not active. Contact an NSoul administrator.” Cause was the fail-closed session requirement for a complete active membership graph. Script/tests were added, but this handoff lacks proof of hosted execution. Next: secure `verify:first-owner`; bootstrap only if not ready; then sign in and inspect `/dashboard/users`/activity.
3. **New provider keys absent locally.** NLR and optional Mapbox cannot return live results without server variables. Parcel has no selected provider. Impact: several cards remain unavailable/manual. Next: configure only approved providers and use `/dashboard/settings/integrations` test controls.
4. **Official public endpoints can degrade/rate-limit.** FEMA point smoke query reset during development; public API availability is outside application control. Next: verify health/error persistence, monitor usage, keep manual fallbacks, and do not equate health with coverage.
5. **Several of 11 screening categories remain unavailable.** Parcel, land cover, road, utility territory, grid infrastructure, and commercial context are not live. This is intentional honesty, not a UI bug. Next: prioritize licensed/official providers and preserve explicit unavailable states.
6. **Documentation drift.** `docs/DATA_SOURCE_POLICY.md` still says Phase 1 does not call FEMA/USFWS/etc., which is superseded by the current adapters and commit `b337db8`. The opening migration list in `docs/PROPERTY_ENRICHMENT.md` refers to a nonexistent `202608030000_sprint1_auth_rbac.sql` and omits the real identity migration filename. `docs/LAUNCH_CHECKLIST.md` says migrations only through `202608030004`, also stale. `docs/SECURITY_AND_OPERATIONS.md` mentions an old three-high-severity audit result, while the latest confirmed audit at `b337db8` was zero. Next: update these documents in one documentation reconciliation change and re-run audit before asserting current status.
7. **No end-to-end disposable Supabase policy suite.** Static tests inspect boundaries but cannot prove hosted RLS or transaction behavior. Next: add CI/staging integration tests with two organizations and all five roles.
8. **Public form abuse controls are process-local.** Impact: serverless instances cannot share counters. Next: Vercel WAF/durable limiter and optional CAPTCHA before meaningful volume.
9. **Email delivery unconfigured locally.** Valid forms may use safe fallback but not notify staff. Next: configure Resend domain/sender and verify delivery/privacy behavior.
10. **No map style configured locally.** Map UI falls back to manual coordinates. Next: select reviewed MapLibre-compatible provider and test light/dark/mobile/accessibility.
11. **Notification refresh needs scheduling.** Project/funding alerts depend on refresh functions, not an attached scheduler. Next: add authenticated cron/queue and monitor failures.
12. **Finance multi-table persistence is sequential.** A mid-write failure can leave a partial draft. Next: move persistence into a transaction RPC and add failure/retry integration tests.
13. **Tax/incentive/finance calculations are preliminary.** No authoritative tax-credit, partnership-flip, lender, market-data, or accounting integration exists. Next: qualified professional review and versioned methodology before transaction use.
14. **No live utility/SCADA/ERP/accounting/e-signature integration.** Records are manual/source-attributed. Do not imply project approval, current production, or live operations.
15. **Launch configuration not verified.** Vercel domain, production deployment, Supabase callbacks/signup/SMTP/backups, legal review, analytics destination, Lighthouse, and multi-breakpoint QA remain external. Follow `docs/LAUNCH_CHECKLIST.md`, correcting its stale migration range first.
16. **Accessibility/performance require production QA.** The code includes semantics/reduced-motion work, but extensive visual iterations and large image assets warrant keyboard, contrast, reduced-motion, mobile, slow-network, and Lighthouse testing on the deployed site.
17. **Untracked request file.** `docs/CODEX_CHAT_HANDOFF_REQUEST.md` predated this handoff write and was not staged. The next agent must decide with the user whether it belongs in Git; do not silently delete it.

## 10. Remaining work

### P0 — blocking

- [ ] **Verify/apply all remote Supabase migrations.** Dependency: production/staging Supabase access and backup. Apply filename order through `202608040001_property_provider_integrations.sql`; verify RLS, triggers, functions, provider rows, and private bucket. Acceptance: migration history matches checkout and no dashboard route fails due to missing schema.
- [ ] **Verify the initial owner in the hosted project.** Requires secure environment/service-role key and the known Auth UUID. Run `npm run verify:first-owner -- --user-id AUTH_USER_UUID`; if not ready, run bootstrap and re-verify. Acceptance: `loginReady: true`, active owner membership in `nsoul`, one bootstrap audit, successful `/login` → `/dashboard`.
- [ ] **Verify latest Vercel deployment and production environment.** Requires Vercel access. Acceptance: deployed SHA includes `b337db8` or later, `www.nsoul.co` routes succeed, no secret is browser-exposed, Supabase callbacks match, and logs show no missing-migration/provider schema errors.

### P1 — required next

- [ ] **Configure/test production screening providers.** Set `SOLAR_RESOURCE_API_KEY` if NLR use is approved; optionally Mapbox server variables; leave parcel disabled until a vendor decision. Use owner/admin integration console. Acceptance: Census/FEMA/NWI/USGS real property run completes or records honest endpoint errors; NLR shows configured only with key; unavailable categories remain explicit.
- [ ] **Run real end-to-end screening QA.** Test address-only, manual coordinates, map pin, ambiguous address, polygon parcel geometry, cached rerun, forced refresh, provider failure, proposal accept/reject, report, light/dark, and mobile. Verify no automated value overwrites a manual/verified fact.
- [ ] **Reconcile stale documentation.** Update `docs/DATA_SOURCE_POLICY.md`, `docs/LAUNCH_CHECKLIST.md`, and the audit paragraph in `docs/SECURITY_AND_OPERATIONS.md`. Acceptance: migration order and provider/audit state match the checkout and latest commands.
- [ ] **Complete launch checklist external configuration.** Configure Resend, legal contact, domain/callbacks, privacy/legal review, backups, analytics validation, durable rate limiting, and production QA. Requires user/operations decisions.
- [ ] **Add hosted RLS tests.** Use disposable/staging Supabase with two organizations, all five roles, anonymous client, and service-role bundle scan. Acceptance: cross-tenant access and unauthorized mutations fail at database and API boundaries.

### P2 — improvement

- [ ] Select a parcel provider after Regrid/LightBox licensing, coverage, geometry, batch, audit, and sample-quality evaluation. Requires user/vendor decision and possibly payment.
- [ ] Evaluate official/licensed providers for land cover, road access, utility territory, grid infrastructure, and commercial context. Acceptance: no capacity/feasibility claims and complete source/license/freshness metadata.
- [ ] Add durable background job/cron for project and funding notifications.
- [ ] Move financial-model multi-table writes into a transactional RPC.
- [ ] Add server-side signed PDF funding-package generation and controlled lender portal only after RLS/evidence review.
- [ ] Optimize large public images and run production Lighthouse/accessibility/performance checks at 375, 430, 768, 1024, 1280, 1440, and 1920 pixels in both themes/reduced motion.

### Later / optional

- [ ] Professionally reviewed tax-credit, depreciation, transferability, and partnership-allocation models.
- [ ] Verified utility queue/service-territory/hosting-capacity integration with provenance and legal usage rights.
- [ ] SCADA/production, ERP/accounting, lender/market data, e-signature, and construction field adapters.
- [ ] Multi-tenant active-organization selection if users need multiple memberships.
- [ ] Controlled portfolio/board exports and external partner access.

## 11. Open questions

1. **Which migrations are actually applied in production?** This determines whether the current pushed UI/API can operate. Default assumption: do not trust source presence as proof of deployment.
2. **Was the supplied Auth user actually bootstrapped and verified remotely?** This determines whether the login issue is resolved. Default: mechanism complete, external result unknown.
3. **Does Vercel currently deploy `main` automatically and is `b337db8` live at `www.nsoul.co`?** Needed for accurate launch status. Default: push succeeded, deployment unverified.
4. **Should NLR and optional Mapbox be enabled in production now?** Requires server credentials and approval of provider terms/usage. Default: NLR unavailable without key; Census/manual remain primary; Mapbox disabled.
5. **Which parcel vendor, if any, should NSoul license?** Affects geometry, owner/parcel metadata, coverage, cost, terms, and API work. Default: keep manual/provider-neutral workflow.
6. **Which remaining screening category is next after parcel?** Utility/grid data has high value but high risk of overclaiming; a source and usage rights must be chosen first. Default: no inference from proximity.
7. **What is the approved production email sender and legal contact?** Needed for reliable inquiry delivery and finalized policy pages. Default: safe fallback and draft `legal@nsoul.co` display value.
8. **Should `docs/CODEX_CHAT_HANDOFF_REQUEST.md` be committed or removed?** It is an untracked user/request artifact. Default: preserve untouched until directed.

## 12. Verification and reproduction guide

### Prerequisites and local start

- Node.js compatible with Next.js 16.3 and npm.
- A Supabase project for private-route testing.
- Repository checkout at `/Users/geofftracy/Projects/solar-farm` or another local path.

```bash
git clone https://github.com/mrinfinitum/solar-farm.git
cd solar-farm
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The public site should render without Supabase; `/login` should show setup-required until public Supabase values exist.

### Environment variable names

Required for authenticated Studio:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
```

First-owner operations:

```text
NSOUL_INITIAL_OWNER_USER_ID
NSOUL_INITIAL_ORGANIZATION_NAME
```

Optional public/operational values:

```text
NEXT_PUBLIC_MAP_STYLE_URL
LEGAL_CONTACT_EMAIL
RESEND_API_KEY
CONTACT_TO_EMAIL
CONTACT_FROM_EMAIL
GEOCODING_PROVIDER
SECONDARY_GEOCODING_PROVIDER
SECONDARY_GEOCODING_API_KEY
SOLAR_RESOURCE_API_KEY
PARCEL_PROVIDER
SCREENING_BATCH_MAX
```

Never prefix service-role, secondary-geocoding, NLR, Resend, or parcel secrets with `NEXT_PUBLIC_`.

### Supabase setup

```bash
npx supabase login
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --include-seed
```

Use staging/backup first. Disable public registration, configure production/preview callback URLs, SMTP, and private Storage. Verify every later migration is included; some older docs list only a partial order.

### First owner

```bash
npm run verify:first-owner -- --user-id AUTH_USER_UUID
npm run bootstrap:first-owner -- --user-id AUTH_USER_UUID
npm run verify:first-owner -- --user-id AUTH_USER_UUID
```

Expected final JSON: all Auth/profile/organization/membership checks true, role `owner`, status `active`, and `loginReady: true`. Bootstrap is idempotent and refuses cross-organization reassignment.

### Automated validation

```bash
npm run lint
npm run build
npm test
npm audit --omit=dev
```

Target result from the last completed code commit: all pass, including browser-secret scanning. Investigate rather than forcing framework downgrades if audit output changes.

### Main manual journeys

1. Public: `/`, `/our-vision`, `/submit-property`, `/privacy`, `/terms`, term-sheet download, contact form, footer Studio login, directional nav, both themes, reduced motion, and mobile widths.
2. Auth: anonymous `/dashboard` redirects to login; active users enter; invited/suspended/deactivated fail closed; authenticated login redirects to dashboard; reset/logout work.
3. Users: owner invites all roles and manages owner; admin can invite/manage non-owner but cannot assign/manage owner; developer/viewer cannot access admin API.
4. Property: create/edit/archive/restore, attach source/contact/task/note/document, run score, add/resolve risk, compare, convert public submission, and promote idempotently.
5. Screening: run each provider independently, interrupt/resume, cache/force refresh, inspect source/freshness/warnings, test integration admin controls, decide proposals, and print report.
6. Project: advance a satisfied stage, verify failed gate rejection, owner/admin override with reason, health recalculation, project modules, audit/history, and private documents.
7. Finance: create model, verify formulas/warnings, run bounded sensitivity, approve as owner/admin, mutate upstream source and confirm staleness, compute readiness, manage capital partner as owner/admin, and generate a no-store funding package using only approved documents.
8. Security: test two organizations for cross-tenant denial and inspect built static bundles for service-role material.

### Reproduce current external blockers

- Leave `SOLAR_RESOURCE_API_KEY` empty: NLR should report unavailable/credential missing, not fabricated content.
- Leave `PARCEL_PROVIDER` empty: parcel should remain manual/unavailable.
- Leave `NEXT_PUBLIC_MAP_STYLE_URL` empty: coordinate entry should remain functional without the interactive basemap.
- Leave Resend variables empty: contact form should use its safe fallback and clearly avoid claiming delivery.

## 13. Important conversation artifacts

### Request documents outside the repository

These attachments contained full sprint/design specifications. Paths may not be available in a new conversation or machine, so repository docs and implemented code should remain primary:

- Initial public marketing brief: `/Users/geofftracy/.codex/attachments/aab2c82d-59d8-4cf3-8ff3-b9fac4308984/pasted-text.txt`
- Original Cornerstone Site Finder backend brief: `/Users/geofftracy/.codex/attachments/ebedb4e5-126f-47a9-9891-f463547d581b/pasted-text.txt`
- First regional-project redesign brief: `/Users/geofftracy/.codex/attachments/0d0661f6-0b77-4251-8d10-63a8a908f4ce/pasted-text.txt`
- Simplified regional-project brief: `/Users/geofftracy/.codex/attachments/235ce958-a4a9-40d0-a9ef-72d786c5db9d/pasted-text.txt`
- Property acquisition brief: `/Users/geofftracy/.codex/attachments/7151af87-c3a7-4c6e-83a7-f414b31267b8/pasted-text.txt`
- Sprint 2 brief: `/Users/geofftracy/.codex/attachments/003eda9a-2ad8-40e0-9231-c1e9b82e1b1d/pasted-text.txt`
- Sprint 3 brief: `/Users/geofftracy/.codex/attachments/1e464394-be8d-44b9-b844-15cbb215ae13/pasted-text.txt`
- Conversion/trust brief: `/Users/geofftracy/.codex/attachments/f5f759d3-c27f-49ac-b6f7-b8e0421ab184/pasted-text.txt`
- Sprint 4 brief: `/Users/geofftracy/.codex/attachments/7ba6d05b-6c59-4baf-a0d0-0c878e5b2065/pasted-text.txt`
- Sprint 5 brief: `/Users/geofftracy/.codex/attachments/865bba9c-c50f-4b60-acd3-3840a463f743/pasted-text.txt`
- Our Vision brief: `/Users/geofftracy/.codex/attachments/cf6cb440-230f-493c-b4b0-27f5876008a6/pasted-text.txt`
- Production screening integration brief: `/Users/geofftracy/.codex/attachments/d99a82c5-7c31-4543-8643-2207df69c7f9/pasted-text.txt`

### Visual iteration context not obvious from Git

- The user supplied many screenshots throughout public-site iteration. The important retained preferences are recorded in Sections 3–4; intermediate screenshots should not override current source.
- Two user-supplied whimsical 3D references were originally at:
  - `/Users/geofftracy/Downloads/solar-panel-3d-render-icon-illustration/14_eco.jpg`
  - `/Users/geofftracy/Downloads/green-house-3d-render-icon-illustration/4_eco.jpg`
- Derived/current brand assets are committed under `public/brand/`, including whimsical solar/business images, commercial/automated factory images, solar arrays, the hero field, campus/model images, and `nsoul-mark.svg`.
- The user explicitly preferred the simpler “Sunlight in. Business powered.” relationship story and larger readable labels; preserve the current mobile fixes.

### Exact essential error/state messages

- Initial owner symptom: `Your account is not active. Contact an NSoul administrator.`
- Unconfigured Studio login state: `Supabase is not configured. Add the required environment values to enable private access.`
- Provider UI must distinguish `Waiting to run`, `Unavailable`, warnings, errors, and completed source content rather than presenting empty dark boxes.

### Project/legal factual context

- The company is NSoul LLC; NSoul is the facing brand.
- The proposed project remains development-stage. Do not display named outreach targets as customers.
- Current public data/disclaimer source is `lib/project-data.ts`, not old screenshot copy.
- Term sheet location: `public/documents/cornerstone-solar-indicative-term-sheet.pdf`; it must stay indicative/non-binding.

## 14. Recommended continuation prompt

> Treat `docs/CODEX_CONVERSATION_HANDOFF.md` as historical context and reconcile it with the checkout and `AGENTS.md`. First verify the remote Supabase migration history through `202608040001_property_provider_integrations.sql`, then securely run the first-owner verification and execute an end-to-end production/staging property-screening run. Preserve RLS, manual fallbacks, source attribution, light/dark/mobile behavior, and honest unavailable states. Do not expose secrets or claim interconnection, production, savings, or provider coverage. Update stale provider/launch/audit documentation, run `npm run lint`, `npm run build`, `npm test`, and `npm audit --omit=dev`, then commit and push. Ask the user only for Supabase/Vercel access, provider credentials, or a parcel-vendor decision if those are genuinely required.
