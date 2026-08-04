import type { ProviderResult, ScreeningProvider, ScreeningRequest } from "@/lib/enrichment/types";
import { geometryFingerprint, requireCoordinates } from "./provider-utils";

const ENDPOINT = "https://developer.nlr.gov/api/solar/solar_resource/v1.json";

export class NlrSolarResourceProvider implements ScreeningProvider {
  key = "solar-resource-provider"; name = "NLR Solar Resource API"; version = "solar-resource-v1"; capability = "solar_resource" as const;
  credentialRequired = true; cacheTtlSeconds = 365 * 24 * 60 * 60;
  description = "NLR/NREL modeled annual and monthly GHI, DNI, and latitude-tilt solar resource context.";
  setupInstructions = "Set SOLAR_RESOURCE_API_KEY in the server environment. Never expose it with a NEXT_PUBLIC_ prefix.";
  configured() { return Boolean(process.env.SOLAR_RESOURCE_API_KEY); }
  cacheKey(request: ScreeningRequest) { return `${this.key}:${this.version}:${geometryFingerprint(request)}`; }
  async healthCheck() {
    if (!this.configured()) return { status: "unavailable" as const, message: "SOLAR_RESOURCE_API_KEY is not configured." };
    const result = await this.execute({ propertyId: "health", address: "", latitude: 33.9, longitude: -94.83, parcelNumber: null, county: null, state: "OK", forcedRefresh: true, geometry: null, geometryUpdatedAt: null, acreage: null });
    return { status: result.state === "complete" ? "operational" as const : result.rateLimitState ? "rate_limited" as const : "degraded" as const, message: result.state === "complete" ? "NLR solar resource endpoint responded." : result.error || result.warning || "NLR check failed." };
  }
  async execute(request: ScreeningRequest): Promise<ProviderResult> {
    const point = requireCoordinates(request);
    if (!this.configured()) return { state: "unavailable", normalized: {}, confidence: "unknown", error: "provider_not_configured", warning: this.setupInstructions };
    if (!point) return { state: "warning", normalized: {}, confidence: "unknown", warning: "Coordinates are required before solar-resource screening." };
    const url = new URL(ENDPOINT); url.searchParams.set("api_key", process.env.SOLAR_RESOURCE_API_KEY!); url.searchParams.set("lat", String(point.latitude)); url.searchParams.set("lon", String(point.longitude));
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (response.status === 429) return { state: "failed", normalized: {}, confidence: "unknown", error: "NLR rate limit reached.", rateLimitState: "limited" };
      if (!response.ok) throw new Error(`NLR solar resource API returned ${response.status}.`);
      const payload = await response.json() as { errors?: string[]; outputs?: Record<string, { annual?: number; monthly?: Record<string, number> }>; metadata?: { sources?: string[] } };
      if (payload.errors?.length) return { state: "failed", normalized: {}, confidence: "unknown", error: payload.errors.join(" ") };
      const outputs = payload.outputs || {};
      return { state: "complete", normalized: { averageDirectNormalIrradiance: outputs.avg_dni || null, averageGlobalHorizontalIrradiance: outputs.avg_ghi || null, averageLatitudeTiltIrradiance: outputs.avg_lat_tilt || null, units: "kWh/m²/day", modeledPeriod: "1998–2009", approximateResolution: "0.1 degree (~10 km)", methodology: "SUNY satellite solar radiation model" }, rawMetadata: { sources: payload.metadata?.sources || [], endpointVersion: this.version }, sourceUrl: "https://developer.nlr.gov/docs/solar/solar-resource-v1/", sourceDatasetDate: "2009-12-31", confidence: "moderate", warning: "Modeled solar-resource context is not a site-specific production estimate or performance guarantee.", expiresInSeconds: this.cacheTtlSeconds };
    } catch (error) { return { state: "failed", normalized: {}, confidence: "unknown", error: error instanceof Error ? error.message : "Solar resource request failed." }; }
  }
}

