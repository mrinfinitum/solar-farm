# Property enrichment and preliminary GIS screening

Sprint 3 adds an authenticated, tenant-scoped screening pipeline without turning preliminary public-source context into a diligence conclusion. The migration order is:

1. `202608030000_sprint1_auth_rbac.sql`
2. `202608030001_property_acquisition.sql`
3. `202608030002_property_intelligence_crm.sql`
4. `202608030003_property_enrichment_gis.sql`

## Provider architecture

Every source implements the same server-side provider contract and runs as an independent enrichment step. A failed, unavailable, credential-missing, ambiguous, or rate-limited source is stored as its own outcome and does not erase successful results from another source. Each stored result includes provider identity/version, request parameters, retrieval time, dataset date when supplied, confidence, freshness, cache expiry, error/rate-limit state, and preliminary status.

The only built-in network integration is the public U.S. Census Geocoder. It provides address-range geocoding and returned geography context without a credential. Parcel, flood, wetlands, terrain, land cover, road/access, utility territory, grid infrastructure, solar resource, and commercial context are deliberately registered as unavailable adapters until an organization configures and licenses an appropriate source. The system never fabricates fallback data.

`GEOCODING_PROVIDER=census` documents the active geocoder selection. `SCREENING_BATCH_MAX` bounds each batch enqueue request (default 10, hard maximum 50). `NEXT_PUBLIC_MAP_STYLE_URL` remains the only browser-exposed map configuration. Provider secrets must stay server-only and must never use a `NEXT_PUBLIC_` prefix.

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
