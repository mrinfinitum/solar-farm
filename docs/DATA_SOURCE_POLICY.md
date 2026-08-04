# Data source and evidence policy

Manual entry and authorized CSV import remain the canonical fallback. The application does not scrape Zillow, LandWatch, Land.com, LoopNet, Lands of America, assessors, utilities, USDA, or other unsupported sources.

The repository includes server-side preliminary-screening adapters for the public U.S. Census Geocoder, FEMA National Flood Hazard Layer, USFWS National Wetlands Inventory, and USGS 3DEP Elevation Point Query Service. These official services require no key, but their responses remain desktop-screening evidence rather than verified diligence. NLR solar-resource screening requires `SOLAR_RESOURCE_API_KEY`. The optional Mapbox geocoding fallback requires `SECONDARY_GEOCODING_PROVIDER=mapbox` and `SECONDARY_GEOCODING_API_KEY`. Parcel, land cover, road access, utility territory, grid infrastructure, and commercial context remain provider-neutral manual/unavailable workflows.

Every external conclusion should retain:

- provider/source name;
- source URL;
- collection date;
- raw listing or parcel identifier when available;
- evidence level;
- licensing or usage notes;
- warnings and unresolved conflicts.

Evidence levels are unverified, source-reported, desktop-estimated, third-party verified, and agency/utility confirmed. A visible line never establishes capacity. Geographic off-taker proximity never establishes physical or contractual deliverability.

Potential future authorized sources include county assessor/clerk data, Oklahoma Corporation Commission resources, utility service-territory maps, USDA Web Soil Survey, Oklahoma GIS datasets, broker feeds, licensed commercial property APIs, and seller submissions. An adapter must remain disabled until usage rights and a supported access method are documented.
