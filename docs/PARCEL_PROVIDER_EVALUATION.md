# Parcel provider evaluation

No parcel vendor is enabled by default. The application preserves manual parcel number entry, operator-selected candidates, manual latitude/longitude, active GeoJSON boundaries, and multi-parcel workflows. An adapter must return zero or more candidates, a stable provider identifier, parcel geometry, reported acreage, source/update metadata, and only licensed ownership attributes. Ambiguous candidates must be selected by an operator.

## Candidates for procurement review

### Regrid Parcel API v2

Regrid documents point, field, owner, and geometry-oriented queries and returns parcel records as GeoJSON Feature Collections. Its point endpoint can return multiple nearby parcels, which fits the application’s candidate-selection model. Evaluate county-level attribute freshness, permitted storage/redistribution, ownership-field licensing, request limits, support, and contract terms using the organization’s expected Oklahoma volume.

Official documentation: https://support.regrid.com/api/section/parcel-api

### LightBox Parcel API

LightBox documents parcel-boundary and attribute workflows, including geometry queries and boundary use in property APIs. Evaluate response schema, Oklahoma coverage/freshness, ownership-field terms, bulk/multi-parcel behavior, caching/retention rights, quotas, and support under an actual proposal.

Official documentation: https://lightbox.document360.io/docs/parcels-documentation

## Decision gate

Do not select a provider based on undocumented pricing. Request current written proposals and a data-license review from both candidates. Test a representative sample containing rural addresses, boundary-adjacent points, multiple contiguous parcels, missing APNs, and known county records. Record match rate, geometry validity, source currency, ambiguous-candidate frequency, latency, quota behavior, and allowed retention before implementing an adapter.
