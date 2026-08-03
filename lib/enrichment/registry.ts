import { CensusGeocodingProvider } from "@/lib/enrichment/providers/census-geocoder";
import { UnavailableProvider } from "@/lib/enrichment/providers/unavailable";
import type { ScreeningProvider } from "@/lib/enrichment/types";

const providers: ScreeningProvider[] = [
  new CensusGeocodingProvider(),
  new UnavailableProvider("parcel-provider", "Parcel provider", "parcel"),
  new UnavailableProvider("flood-provider", "FEMA flood provider", "flood"),
  new UnavailableProvider("wetlands-provider", "Wetlands provider", "wetlands"),
  new UnavailableProvider("terrain-provider", "Elevation and terrain provider", "terrain"),
  new UnavailableProvider("land-cover-provider", "Land-cover provider", "land_cover"),
  new UnavailableProvider("road-access-provider", "Road-access provider", "road_access"),
  new UnavailableProvider("utility-territory-provider", "Utility-territory provider", "utility_territory"),
  new UnavailableProvider("grid-infrastructure-provider", "Grid-infrastructure provider", "grid_infrastructure"),
  new UnavailableProvider("solar-resource-provider", "Solar-resource provider", "solar_resource"),
  new UnavailableProvider("commercial-load-provider", "Commercial-context provider", "commercial_context"),
];

export function getScreeningProviders() { return providers; }
export function getScreeningProvider(key: string) { return providers.find((provider) => provider.key === key) || null; }
export function publicProviderCatalog() { return providers.map(({ key, name, version, capability, credentialRequired }) => ({ key, name, version, capability, credentialRequired, configured: providers.find((item) => item.key === key)?.configured() || false })); }
