# Property Intelligence and Acquisition CRM

## Migration order

Apply migrations in filename order:

1. `202608020001_site_finder_schema.sql`
2. `202608020002_site_finder_rls.sql`
3. `202608020003_identity_and_tenant_security.sql`
4. `202608030001_property_acquisition.sql`
5. `202608030002_property_intelligence_crm.sql`

The final two migrations are additive. They retain legacy property fields while adding the canonical pipeline, versioned assessments, provenance, fatal risks, standard diligence checklist, atomic promotion, and audited CRM records.

## Relationships and pipeline

`properties` is the source record. It owns zero or more parcels, source records, score runs, fatal risks, checklist items, contacts, tasks, notes, documents, and activity entries. `property_score_runs` preserves the calculated and displayed scores; its component rows preserve every input. Promotion creates one `projects` record plus one `project_properties` origin relationship while retaining the property.

Canonical statuses are `new`, `desktop_screening`, `owner_outreach`, `site_control`, `utility_screening`, `detailed_diligence`, `candidate_project`, `promoted_to_project`, `rejected`, and `archived`. Archived records are excluded from the portfolio by default and can be restored to `new`.

## Roles and RLS

| Capability | Owner | Admin | Developer | Analyst | Viewer |
| --- | :---: | :---: | :---: | :---: | :---: |
| Read organization properties and CRM history | Yes | Yes | Yes | Yes | Yes |
| Create/update/archive/restore properties | Yes | Yes | Yes | No | No |
| Manage contacts, tasks, notes, documents, checklist, and risks | Yes | Yes | Yes | No | No |
| Run a versioned preliminary assessment | Yes | Yes | Yes | Yes | No |
| Promote property to project | Yes | Yes | Yes | No | No |
| Permanently delete operational records | Yes | Yes | No | No | No |
| Convert a public submission | Yes | Yes | No | No | No |

Every operational table has organization-scoped SELECT, INSERT, UPDATE, and DELETE policies. Anonymous access is revoked. Mutation routes recheck the active cookie-authenticated session and role; RLS independently checks the organization and role. Activity records cannot be inserted directly by ordinary users.

## Scoring formula and evidence

The deterministic `nsoul-preliminary-v2.0` model accepts a 0–100 category score and applies these maximum weights: grid/interconnection 30; usable land/geometry 15; environmental constraints 15; acquisition economics 10; construction access/terrain 10; permitting/land use 10; off-taker/commercial fit 10.

Grades are A 85–100, B 70–84, C 55–69, D 40–54, and F 0–39. Every component records its raw value, weighted output, data quality, explanation, missing information, source name/URL/date, entering user, and verification details. Data quality is one of `verified`, `estimated`, `user_reported`, `public_source`, or `unknown`.

Confidence considers verified count, estimated count, other sourced components, unknown critical facts, and age. A verified source more than 366 days old is treated as stale for confidence. Risk is separate from score: fatal flags produce critical risk and a hold recommendation. Otherwise missing critical information and the calculated score inform the displayed risk. This is a screening model, not project approval.

Manual overrides require a reason of at least ten characters. The original calculated score remains immutable alongside the displayed override, override reason, actor, and timestamp.

## Fatal risks

Canonical fatal risks include no viable interconnection, insufficient site control, environmental constraint, incompatible land use, insufficient usable acreage, no legal access, title defect, failed economics, and no plausible off-taker. Each flag carries severity, status, description, source, resolution status, assignee, and resolution metadata. Resolving a flag does not erase it.

## Diligence, activity, and promotion

Each property receives 22 standard diligence items covering identity, land, access, utility, environmental, regulatory, title, engineering, EPC, production, and off-taker work. Items support assignment, due date, status, completion, notes, source, and a supporting document. Tasks may link to an item and may be marked as blockers.

Database triggers record property changes, score runs, overrides, risks, checklist changes, contacts, tasks, notes, documents, status history, archives/restores, and promotion. `property_activity(property_id)` returns the tenant-scoped chronological history including child records.

`promote_property_to_project` is a permission-checked database transaction. It locks the property, returns an existing linked project when present, otherwise creates a `prospect` project, copies the property’s location/assignment/summary/unresolved risks, creates the origin relationship, and marks the property `promoted_to_project`. A grade never promotes a property automatically.

Public land submissions remain staging records. Owners and administrators review them under Dashboard → Imports. `convert_public_submission_to_property` is owner/admin-only, idempotent, retains the original submission, creates an unverified manual property, and records the conversion.

## Private document storage

Configure the private `site-finder-documents` bucket by applying the migrations. Objects use `{organization_id}/{property_or_project_id}/{generated_filename}` paths. Metadata includes category, parent, original filename, MIME type, bytes, uploader, confidentiality, version, description, and creation date. Downloads pass through an authenticated route that returns a 60-second signed download URL. Never place operational documents in `public/`.

## Provider interfaces and limitations

`lib/geocoding/provider.ts` provides a manual fallback and a provider-neutral future interface. No paid provider is hardcoded. Address, parcel, owner, acreage, grid capacity, utility territory, floodplain, wetlands, zoning, title, and commercial values remain manual or source-attributed unless explicitly verified. A coordinate marker does not imply parcel ownership, service territory, capacity, deliverability, or project viability.

Recommended Sprint 3 work: apply migrations to a Supabase staging project; add integration tests against two organizations; add a transactional contact-create/link function; add bulk assignment and export; integrate a licensed geocoder or parcel provider behind the existing interface; add notification delivery for overdue blockers; and add project detail routing.
