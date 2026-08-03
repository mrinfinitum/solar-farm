import type { ProviderResult, ScreeningCapability, ScreeningProvider, ScreeningRequest } from "@/lib/enrichment/types";

export class UnavailableProvider implements ScreeningProvider {
  constructor(public key: string, public name: string, public capability: ScreeningCapability, public credentialRequired = true) {}
  version = "stub-v1";
  configured() { return false; }
  cacheKey(request: ScreeningRequest) { return `${this.key}:${request.propertyId}`; }
  async execute(): Promise<ProviderResult> {
    return { state: "unavailable", normalized: {}, confidence: "unknown", warning: `${this.name} is not configured. Continue with manual entry and professional verification.`, error: "provider_not_configured" };
  }
}
