import type { ProviderResult, ScreeningProvider, ScreeningRequest } from "@/lib/enrichment/types";

type CensusMatch = {
  matchedAddress?: string;
  coordinates?: { x?: number; y?: number };
  addressComponents?: { city?: string; state?: string; zip?: string };
  geographies?: Record<string, Array<Record<string, unknown>>>;
  tigerLine?: Record<string, unknown>;
};

export class CensusGeocodingProvider implements ScreeningProvider {
  key = "census-geocoder";
  name = "U.S. Census Geocoder";
  version = "Public_AR_Current/Current_Current";
  capability = "geocoding" as const;
  credentialRequired = false;
  configured() { return true; }
  cacheKey(request: ScreeningRequest) { return `census:${request.address.trim().toUpperCase()}`; }

  async execute(request: ScreeningRequest): Promise<ProviderResult> {
    if (!request.address.trim()) return { state: "warning", normalized: {}, confidence: "unknown", warning: "A complete street address is required for Census geocoding." };
    const endpoint = new URL("https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress");
    endpoint.searchParams.set("address", request.address);
    endpoint.searchParams.set("benchmark", "Public_AR_Current");
    endpoint.searchParams.set("vintage", "Current_Current");
    endpoint.searchParams.set("format", "json");
    const response = await fetch(endpoint, { headers: { "User-Agent": "NSoul-Studio/1.0" }, signal: AbortSignal.timeout(12000) });
    if (response.status === 429) return { state: "failed", normalized: {}, confidence: "unknown", error: "The Census geocoder rate limit was reached.", rateLimitState: "limited" };
    if (!response.ok) throw new Error(`Census geocoder returned ${response.status}.`);
    const payload = await response.json() as { result?: { addressMatches?: CensusMatch[] } };
    const matches = payload.result?.addressMatches || [];
    if (!matches.length) return { state: "warning", normalized: { candidates: [] }, confidence: "unknown", warning: "No Census address-range match was returned. Manual coordinates remain available.", sourceUrl: endpoint.origin + endpoint.pathname };
    if (matches.length > 1) return { state: "warning", normalized: { candidates: matches.slice(0, 5).map((match) => ({ address: match.matchedAddress, coordinates: match.coordinates })) }, confidence: "low", warning: "Multiple address candidates were returned. No candidate was selected automatically.", sourceUrl: endpoint.origin + endpoint.pathname };
    const match = matches[0];
    const counties = match.geographies?.Counties || match.geographies?.["2020 Census Counties"] || [];
    const county = typeof counties[0]?.NAME === "string" ? String(counties[0].NAME).replace(/ County$/i, "") : null;
    const latitude = Number(match.coordinates?.y);
    const longitude = Number(match.coordinates?.x);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return { state: "warning", normalized: {}, confidence: "unknown", warning: "The matched address did not include usable coordinates.", sourceUrl: endpoint.origin + endpoint.pathname };
    const formattedAddress = match.matchedAddress || request.address;
    return {
      state: "complete",
      normalized: { formattedAddress, latitude, longitude, county, state: match.addressComponents?.state || request.state, postalCode: match.addressComponents?.zip || null, matchType: "MAF/TIGER address range" },
      proposals: [
        { fieldName: "normalized_address", value: formattedAddress, reason: "Normalized by the U.S. Census Geocoder.", confidence: "moderate" },
        { fieldName: "latitude", value: latitude, reason: "Interpolated Census address-range coordinate; requires verification.", confidence: "moderate" },
        { fieldName: "longitude", value: longitude, reason: "Interpolated Census address-range coordinate; requires verification.", confidence: "moderate" },
        ...(county ? [{ fieldName: "county", value: county, reason: "County geography returned by the Census geocoder.", confidence: "moderate" as const }] : []),
        ...(match.addressComponents?.state ? [{ fieldName: "state", value: match.addressComponents.state, reason: "State returned by the Census geocoder.", confidence: "moderate" as const }] : []),
        ...(match.addressComponents?.zip ? [{ fieldName: "postal_code", value: match.addressComponents.zip, reason: "ZIP code returned by the Census geocoder.", confidence: "moderate" as const }] : []),
      ],
      rawMetadata: { matchCount: 1, benchmark: this.version, tigerLinePresent: Boolean(match.tigerLine) },
      sourceUrl: "https://geocoding.geo.census.gov/geocoder/",
      confidence: "moderate",
      expiresInSeconds: 30 * 24 * 60 * 60,
    };
  }
}
