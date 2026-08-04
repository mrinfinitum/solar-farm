import type { ProviderResult, ScreeningProvider, ScreeningRequest } from "@/lib/enrichment/types";
import { calculateOverlap, geometryFingerprint, queryArcGis, requireCoordinates, sourceHealth } from "./provider-utils";

const LAYER = "https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0";

export class UsfwsWetlandsProvider implements ScreeningProvider {
  key = "wetlands-provider"; name = "USFWS National Wetlands Inventory"; version = "NWI-Wetlands-0"; capability = "wetlands" as const;
  credentialRequired = false; cacheTtlSeconds = 90 * 24 * 60 * 60;
  description = "Official NWI wetland and deepwater feature context with parcel overlap when geometry is available.";
  setupInstructions = "Public USFWS service; no credential is required. NWI is screening data, not a jurisdictional determination.";
  configured() { return true; }
  cacheKey(request: ScreeningRequest) { return `${this.key}:${this.version}:${geometryFingerprint(request)}:${request.geometryUpdatedAt || "point"}`; }
  healthCheck = sourceHealth(`${LAYER}?f=json`, "USFWS NWI");
  async execute(request: ScreeningRequest): Promise<ProviderResult> {
    if (!requireCoordinates(request) && !request.geometry) return { state: "warning", normalized: {}, confidence: "unknown", warning: "Coordinates or parcel geometry are required before wetlands screening." };
    try {
      const query = await queryArcGis(LAYER, request, "Wetlands.ATTRIBUTE,Wetlands.WETLAND_TYPE,Wetlands.ACRES");
      const overlap = calculateOverlap(request.geometry, query.features);
      const features = query.features.map(({ properties }) => ({ classification: properties.ATTRIBUTE || properties["Wetlands.ATTRIBUTE"] || null, wetlandType: properties.WETLAND_TYPE || properties["Wetlands.WETLAND_TYPE"] || null, mappedAcres: properties.ACRES || properties["Wetlands.ACRES"] || null }));
      return { state: query.exceededTransferLimit ? "warning" : "complete", normalized: { coverageState: features.length ? "mapped_features_found" : "no_mapped_feature_at_query_geometry", features, ...overlap, featureCount: features.length, determination: "desktop_screening_only" }, rawMetadata: { layer: 0, exceededTransferLimit: query.exceededTransferLimit }, sourceUrl: LAYER, confidence: request.geometry ? "moderate" : "low", warning: "NWI data are suitable for preliminary screening only and do not replace field verification or a jurisdictional determination.", expiresInSeconds: this.cacheTtlSeconds };
    } catch (error) { return { state: "failed", normalized: {}, confidence: "unknown", error: error instanceof Error ? error.message : "Wetlands request failed.", rateLimitState: (error as { rateLimited?: boolean }).rateLimited ? "limited" : undefined }; }
  }
}
