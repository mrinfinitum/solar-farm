import { CensusGeocodingProvider } from "@/lib/enrichment/providers/census-geocoder";
import { UnavailableProvider } from "@/lib/enrichment/providers/unavailable";
import { ConfiguredParcelProvider } from "@/lib/enrichment/providers/parcel";
import { FemaFloodProvider } from "@/lib/enrichment/providers/fema-flood";
import { UsfwsWetlandsProvider } from "@/lib/enrichment/providers/usfws-wetlands";
import { UsgsTerrainProvider } from "@/lib/enrichment/providers/usgs-terrain";
import { NlrSolarResourceProvider } from "@/lib/enrichment/providers/nlr-solar";
import type { ScreeningProvider } from "@/lib/enrichment/types";

const providers: ScreeningProvider[] = [
  new CensusGeocodingProvider(),
  new ConfiguredParcelProvider(),
  new FemaFloodProvider(),
  new UsfwsWetlandsProvider(),
  new UsgsTerrainProvider(),
  new UnavailableProvider("land-cover-provider", "Land-cover provider", "land_cover"),
  new UnavailableProvider("road-access-provider", "Road-access provider", "road_access"),
  new UnavailableProvider("utility-territory-provider", "Utility-territory provider", "utility_territory"),
  new UnavailableProvider("grid-infrastructure-provider", "Grid-infrastructure provider", "grid_infrastructure"),
  new NlrSolarResourceProvider(),
  new UnavailableProvider("commercial-load-provider", "Commercial-context provider", "commercial_context"),
];

export function getScreeningProviders() { return providers; }
export function getScreeningProvider(key: string) { return providers.find((provider) => provider.key === key) || null; }
export function publicProviderCatalog() { return providers.map(({ key, name, version, capability, credentialRequired, cacheTtlSeconds, description, setupInstructions }) => ({ key, name, version, capability, credentialRequired, cacheTtlSeconds, description, setupInstructions, configured: providers.find((item) => item.key === key)?.configured() || false })); }
