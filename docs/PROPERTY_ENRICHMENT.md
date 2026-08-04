# Property enrichment and preliminary GIS screening

Sprint 3 adds an authenticated, tenant-scoped screening pipeline without turning preliminary public-source context into a diligence conclusion. Apply the repository migrations in this filename order:

1. `202608020001_site_finder_schema.sql`
2. `202608020002_site_finder_rls.sql`
3. `202608020003_identity_and_tenant_security.sql`
4. `202608030001_property_acquisition.sql`
5. `202608030002_property_intelligence_crm.sql`
6. `202608030003_property_enrichment_gis.sql`
7. `202608030004_conversion_intake.sql`
8. `202608030005_project_development_command_center.sql`
9. `202608030006_financial_modeling_capital_readiness.sql`
10. `202608040001_property_provider_integrations.sql`
11. `202608040002_remote_function_lint_fixes.sql`

## Provider architecture

Every source implements the same server-side provider contract and runs as an independent enrichment step. A failed, unavailable, credential-missing, ambiguous, or rate-limited source is stored as its own outcome and does not erase successful results from another source. Each stored result includes provider identity/version, request parameters, retrieval time, dataset date when supplied, confidence, freshness, cache expiry, error/rate-limit state, and preliminary status.

The production Phase 1 adapters are the public U.S. Census Geocoder, FEMA National Flood Hazard Layer, USFWS National Wetlands Inventory, and USGS 3DEP Elevation Point Query Service. The NLR solar-resource adapter becomes configured only when `SOLAR_RESOURCE_API_KEY` is present on the server. Parcel, land cover, road/access, utility territory, grid infrastructure, and commercial context remain explicit manual/unavailable workflows until approved sources are configured. The system never fabricates fallback data or calls an unconfigured integration.

`GEOCODING_PROVIDER=census` documents the primary geocoder. `SECONDARY_GEOCODING_PROVIDER=mapbox` plus a server-only `SECONDARY_GEOCODING_API_KEY` enables a conservative fallback only when Census returns no match. Multiple candidates are never auto-selected. Operator-entered coordinates and map-pin coordinates remain usable without a geocoder. `SCREENING_BATCH_MAX` bounds each batch enqueue request (default 10, hard maximum 50). `NEXT_PUBLIC_MAP_STYLE_URL` remains the only browser-exposed map configuration. Provider secrets must stay server-only and must never use a `NEXT_PUBLIC_` prefix.

Provider-specific freshness is part of each request fingerprint: Census/FEMA 30 days, NWI 90 days, USGS terrain 180 days, and NLR solar resource one year by default. Parcel geometry and its update timestamp are included for geometry-sensitive providers. Organization owners/admins may override cache duration and disable or test adapters at `/dashboard/settings/integrations`. Connection health means only that the endpoint responded; it does not establish geographic coverage or diligence clearance.

## Workflow

- Operators create a full property record or use Quick Screening from an address.
- Owner, admin, developer, and analyst roles may start or batch-queue screening.
- The browser advances one provider step per authenticated request, so a serverless request never holds the whole pipeline open.
- Current cached results are reused unless a force refresh is requested. Reuse remains source-attributed and still creates review proposals for the current run.
- Automated values become `property_field_proposals`; they do not overwrite property facts.
- Owner, admin, and developer roles explicitly accept or reject proposals. Analysts and viewers cannot decide them.
- A printable authenticated report includes the run summary, source appendix, pending proposals, missing information, and the preliminary-screening disclaimer.

## Score and diligence guardrails

Screening-score proposals reuse the deterministic preliminary scoring model. Grid/interconnection cannot receive more than 35 raw points unless utility verification is recorded as `utility_confirmed`. Parcel ambiguity, incomplete provider coverage, and source conflict reduce confidence. Nearby infrastructure never means capacity or feasibility.

Flood, wetland, and terrain adapters may attach deterministic score-impact proposals and risk flags. Those values retain the before/after score and model version, remain `proposed`, and never replace a verified or manual fact. Material changes require operator review of the underlying source result.

Automated screening does **not** establish title, zoning, legal access, environmental clearance, wetlands/flood determination, exact buildable acreage, boundary accuracy, hosting capacity, interconnection feasibility, cost, utility approval, construction feasibility, production, savings, or financeability. Professional survey, title, civil/environmental/utility/engineering review, and final agreements remain required as applicable.

## RLS and data handling

All Sprint 3 tables use organization-scoped RLS and revoke anonymous access. Analysts may generate enrichment records and proposals, but only operators may update proposal decisions. The decision RPC whitelists writable property fields and records activity. Run/result/proposal changes are audited. Provider responses store normalized output and bounded metadata; do not add prohibited or unnecessary personal information to raw payloads.

## Operations and verification

Provider configuration and usage are visible in `data_providers`, `provider_usage_logs`, and `provider_usage_summaries`. Review failures, stale results, warnings, and quotas before relying on a run. Apply the migration, then run:

```bash
npm run lint
npm run build
npm test
npm audit --omit=dev
```

The application remains usable without provider credentials: manual entry, scoring, CRM, mapping of stored coordinates, proposal review, and run/report history continue to work.

## Migration order addition

`202608040001_property_provider_integrations.sql` adds non-secret provider operations fields, correct public-service credential flags, cache controls, health state, and provider seeding for future organizations without weakening existing RLS. The dated live-environment verification record is maintained in `docs/LIVE_ENVIRONMENT_STATUS.md`; source presence alone is not proof that a migration is deployed.
