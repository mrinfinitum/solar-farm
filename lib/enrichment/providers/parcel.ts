import type { ProviderResult, ScreeningProvider, ScreeningRequest } from "@/lib/enrichment/types";

export class ConfiguredParcelProvider implements ScreeningProvider {
  key = "parcel-provider"; name = "Parcel provider interface"; version = "adapter-v1"; capability = "parcel" as const;
  credentialRequired = true; cacheTtlSeconds = 30 * 24 * 60 * 60;
  description = "Pluggable parcel candidate, boundary, identifier, acreage, and ownership-metadata interface.";
  setupInstructions = "Set PARCEL_PROVIDER to an implemented adapter. No parcel vendor is enabled by default.";
  configured() { return false; }
  cacheKey(request: ScreeningRequest) { return `${this.key}:${request.parcelNumber || request.address}:${request.latitude},${request.longitude}`; }
  async execute(request: ScreeningRequest): Promise<ProviderResult> { return { state: "unavailable", normalized: { candidates: [], selectionMode: "manual_or_multi_select", supportsGeometry: true, supportsMetadata: true, requestedParcelNumber: request.parcelNumber }, confidence: "unknown", error: "provider_not_configured", warning: "No parcel provider is configured. Preserve manual parcel entry and boundary upload; do not auto-select an ambiguous candidate." }; }
}
