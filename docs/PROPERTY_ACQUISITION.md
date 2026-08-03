# Property Acquisition and Preliminary Screening

## Migration order

Apply migrations in filename order. Sprint 2 is additive and must run after the identity and tenant migration:

1. `202608020001_site_finder_schema.sql`
2. `202608020002_site_finder_rls.sql`
3. `202608020003_identity_and_tenant_security.sql`
4. `202608030001_property_acquisition.sql`

The final migration backfills canonical property fields from legacy equivalents, retains the legacy columns for compatibility, adds versioned assessment tables, and installs explicit tenant policies.

## Scoring formula

The `nsoul-preliminary-v2.0` model accepts a 0–100 raw score for each category and multiplies it by the category weight:

| Category | Weight |
| --- | ---: |
| Grid and interconnection | 30 |
| Usable land and geometry | 15 |
| Environmental constraints | 15 |
| Acquisition economics | 10 |
| Construction access and terrain | 10 |
| Permitting and land use | 10 |
| Off-taker and commercial fit | 10 |

Weighted outputs sum to the numeric score. Grades are A 85–100, B 70–84, C 55–69, D 40–54, and F 0–39. Every run stores raw inputs, weighted outputs, model version, scorer, time, notes, quality, and missing-critical indicators. A manual override requires a reason of at least ten characters and never removes the underlying numeric score.

## Risk and confidence

- Any active fatal risk produces `critical` risk and a hold recommendation, regardless of grade.
- Without fatal risks, three or more missing critical fields produce `high` risk; one or more missing critical fields or a score below 70 produces `moderate` risk; otherwise risk is `low`.
- Confidence is `high` with at least five verified categories and no critical gaps; `moderate` with at least four verified/estimated categories and at most one critical gap; otherwise `low`.

These are preliminary screening rules, not approval, production, interconnection, savings, or financing determinations.

## Permissions matrix

| Capability | Owner | Admin | Developer | Analyst | Viewer |
| --- | :---: | :---: | :---: | :---: | :---: |
| Read organization properties | Yes | Yes | Yes | Yes | Yes |
| Create/update/score/archive | Yes | Yes | Yes | Yes | No |
| Promote property to project | Yes | Yes | Yes | No | No |
| Permanently delete | Yes | Yes | No | No | No |

Every route rechecks membership and role server-side. RLS enforces organization isolation independently of UI controls. Triggered audit records cover property mutations, status changes, assessments, score runs, risk flags, and project relationships.

## Enrichment-provider interface

`lib/geocoding/provider.ts` defines a provider-neutral geocoding contract. The default manual provider sends no data externally and returns no inferred coordinates. Future parcel, environmental, grid, and commercial providers should follow the same pattern: return source-attributed data, write provenance to `property_data_sources`, and never silently replace a verified value.

## Known limitations

- Address, parcel, environmental, utility, and commercial values are manual in this sprint.
- Map placement requires manually recorded coordinates and the existing optional MapLibre style configuration.
- Assignment currently accepts a member UUID during manual intake; a searchable member picker can replace it without changing the data model.
- The additive migration retains older property and score columns until a future data-conversion sprint verifies every production record.
- Bulk archive is limited to 100 selected records per request.
