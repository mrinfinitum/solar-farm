import type { ProviderResult, ScreeningProvider, ScreeningRequest } from "@/lib/enrichment/types";
import { calculateOverlap, geometryFingerprint, queryArcGis, requireCoordinates, sourceHealth } from "./provider-utils";

const SERVICE = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer";

export class FemaFloodProvider implements ScreeningProvider {
  key = "flood-provider"; name = "FEMA National Flood Hazard Layer"; version = "NFHL-Flood-Hazard-Zones-28"; capability = "flood" as const;
  credentialRequired = false; cacheTtlSeconds = 30 * 24 * 60 * 60;
  description = "Official FEMA NFHL flood-hazard zones and preliminary parcel intersection context.";
  setupInstructions = "Public FEMA ArcGIS service; no credential is required. Professional floodplain review remains necessary.";
  configured() { return true; }
  cacheKey(request: ScreeningRequest) { return `${this.key}:${this.version}:${geometryFingerprint(request)}:${request.geometryUpdatedAt || "point"}`; }
  healthCheck = sourceHealth(`${SERVICE}/28?f=json`, "FEMA NFHL");
  async execute(request: ScreeningRequest): Promise<ProviderResult> {
    if (!requireCoordinates(request) && !request.geometry) return { state: "warning", normalized: {}, confidence: "unknown", warning: "Coordinates or parcel geometry are required before flood screening." };
    try {
      const query = await queryArcGis(`${SERVICE}/28`, request, "FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,DFIRM_ID,VERSION_ID");
      const overlap = calculateOverlap(request.geometry, query.features);
      const zones = query.features.map(({ properties }) => ({ floodZone: properties.FLD_ZONE || null, subtype: properties.ZONE_SUBTY || null, specialFloodHazardArea: properties.SFHA_TF || null, staticBaseFloodElevation: properties.STATIC_BFE || null, mapId: properties.DFIRM_ID || null, versionId: properties.VERSION_ID || null }));
      return { state: query.exceededTransferLimit ? "warning" : "complete", normalized: { coverageState: zones.length ? "mapped_features_found" : "no_mapped_feature_at_query_geometry", zones, ...overlap, featureCount: zones.length, determination: "preliminary_screening_only" }, rawMetadata: { layer: 28, exceededTransferLimit: query.exceededTransferLimit }, sourceUrl: `${SERVICE}/28`, confidence: request.geometry ? "moderate" : "low", warning: query.exceededTransferLimit ? "The provider transfer limit was reached; results may be incomplete." : "FEMA map context is not a flood determination and must be professionally verified.", expiresInSeconds: this.cacheTtlSeconds };
    } catch (error) { return { state: "failed", normalized: {}, confidence: "unknown", error: error instanceof Error ? error.message : "FEMA request failed.", rateLimitState: (error as { rateLimited?: boolean }).rateLimited ? "limited" : undefined }; }
  }
}

