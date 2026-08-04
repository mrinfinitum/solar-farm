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
  cacheTtlSeconds = 30 * 24 * 60 * 60;
  description = "Primary forward geocoding and returned Census geography context.";
  setupInstructions = "Public U.S. Census service; no credential is required.";
  configured() { return true; }
  cacheKey(request: ScreeningRequest) { return `census:${request.address.trim().toUpperCase()}`; }

  async execute(request: ScreeningRequest): Promise<ProviderResult> {
    if (!request.address.trim() && request.latitude != null && request.longitude != null) return this.reverseCoordinates(request);
    if (!request.address.trim()) return { state: "warning", normalized: {}, confidence: "unknown", warning: "A complete street address or operator-supplied coordinates are required for geocoding." };
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
    if (!matches.length) return this.secondaryFallback(request, endpoint.origin + endpoint.pathname);
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
      expiresInSeconds: this.cacheTtlSeconds,
    };
  }

  private async secondaryFallback(request: ScreeningRequest, censusSource: string): Promise<ProviderResult> {
    if (process.env.SECONDARY_GEOCODING_PROVIDER !== "mapbox" || !process.env.SECONDARY_GEOCODING_API_KEY) return { state: "warning", normalized: { candidates: [], primaryProvider: "census", secondaryProvider: "not_configured" }, confidence: "unknown", warning: "No Census address-range match was returned. Manual coordinates and map-pin confirmation remain available.", sourceUrl: censusSource };
    const endpoint = new URL(`https://api.mapbox.com/search/geocode/v6/forward`);
    endpoint.searchParams.set("q", request.address); endpoint.searchParams.set("access_token", process.env.SECONDARY_GEOCODING_API_KEY); endpoint.searchParams.set("limit", "5"); endpoint.searchParams.set("country", "US");
    try {
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) return { state: "warning", normalized: { candidates: [] }, confidence: "unknown", warning: `Census returned no match and the secondary geocoder returned ${response.status}. Manual coordinates remain available.`, sourceUrl: censusSource };
      const payload = await response.json() as { features?: Array<{ properties?: { full_address?: string; name?: string }; geometry?: { coordinates?: [number, number] } }> };
      const candidates = (payload.features || []).flatMap((item) => item.geometry?.coordinates ? [{ address: item.properties?.full_address || item.properties?.name || request.address, longitude: item.geometry.coordinates[0], latitude: item.geometry.coordinates[1] }] : []);
      if (candidates.length !== 1) return { state: "warning", normalized: { candidates, primaryProvider: "census", secondaryProvider: "mapbox" }, confidence: candidates.length ? "low" : "unknown", warning: candidates.length ? "The secondary geocoder returned multiple candidates. An operator must select one." : "Neither geocoder returned a candidate. Manual coordinates remain available.", sourceUrl: "https://docs.mapbox.com/api/search/geocoding/" };
      const candidate = candidates[0];
      return { state: "complete", normalized: { formattedAddress: candidate.address, latitude: candidate.latitude, longitude: candidate.longitude, matchType: "secondary geocoder fallback", primaryProvider: "census", secondaryProvider: "mapbox" }, proposals: [{ fieldName: "normalized_address", value: candidate.address, reason: "Single candidate returned by the configured secondary geocoder after Census returned no match.", confidence: "low" }, { fieldName: "latitude", value: candidate.latitude, reason: "Secondary geocoder fallback; operator verification is required.", confidence: "low" }, { fieldName: "longitude", value: candidate.longitude, reason: "Secondary geocoder fallback; operator verification is required.", confidence: "low" }], sourceUrl: "https://docs.mapbox.com/api/search/geocoding/", confidence: "low", warning: "Secondary geocoding is a fallback and requires operator confirmation.", expiresInSeconds: this.cacheTtlSeconds };
    } catch { return { state: "warning", normalized: { candidates: [] }, confidence: "unknown", warning: "The optional secondary geocoder was unavailable. Manual coordinates remain available.", sourceUrl: censusSource }; }
  }

  private async reverseCoordinates(request: ScreeningRequest): Promise<ProviderResult> {
    const base: ProviderResult = { state: "complete", normalized: { latitude: request.latitude, longitude: request.longitude, matchType: "operator-supplied coordinates", reverseGeocodingState: "not_inferred" }, confidence: "low", warning: "Manual or map-pin coordinates were preserved. No street address was inferred.", sourceUrl: "manual://coordinates", expiresInSeconds: this.cacheTtlSeconds };
    if (process.env.SECONDARY_GEOCODING_PROVIDER !== "mapbox" || !process.env.SECONDARY_GEOCODING_API_KEY) return base;
    const endpoint = new URL("https://api.mapbox.com/search/geocode/v6/reverse"); endpoint.searchParams.set("longitude", String(request.longitude)); endpoint.searchParams.set("latitude", String(request.latitude)); endpoint.searchParams.set("access_token", process.env.SECONDARY_GEOCODING_API_KEY); endpoint.searchParams.set("limit", "1");
    try {
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(12000) }); if (!response.ok) return base;
      const payload = await response.json() as { features?: Array<{ properties?: { full_address?: string; name?: string } }> }; const address = payload.features?.[0]?.properties?.full_address || payload.features?.[0]?.properties?.name;
      if (!address) return base;
      return { ...base, normalized: { ...base.normalized, formattedAddress: address, reverseGeocodingState: "candidate_returned", secondaryProvider: "mapbox" }, proposals: [{ fieldName: "normalized_address", value: address, reason: "Reverse-geocoded candidate for operator-supplied coordinates; confirmation is required.", confidence: "low" }], sourceUrl: "https://docs.mapbox.com/api/search/geocoding/", warning: "The reverse-geocoded address is a proposal. The operator-supplied coordinates remain authoritative until review." };
    } catch { return base; }
  }

  async healthCheck() {
    try {
      const response = await fetch("https://geocoding.geo.census.gov/geocoder/", { method: "HEAD", signal: AbortSignal.timeout(8000) });
      return { status: response.ok ? "operational" as const : "degraded" as const, message: response.ok ? "Census endpoint responded." : `Census endpoint returned ${response.status}.` };
    } catch { return { status: "unavailable" as const, message: "Census endpoint did not respond." }; }
  }
}
