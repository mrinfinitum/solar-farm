export const SCREENING_CAPABILITIES = [
  "geocoding", "parcel", "flood", "wetlands", "terrain", "land_cover",
  "road_access", "utility_territory", "grid_infrastructure", "solar_resource", "commercial_context",
] as const;

export type ScreeningCapability = (typeof SCREENING_CAPABILITIES)[number];
export type ScreeningConfidence = "high" | "moderate" | "low" | "unknown";
export type ScreeningStepState = "complete" | "warning" | "unavailable" | "failed" | "skipped";

export interface ScreeningRequest {
  propertyId: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  parcelNumber: string | null;
  county: string | null;
  state: string | null;
  forcedRefresh: boolean;
}

export interface FieldProposal {
  fieldName: string;
  value: string | number | null;
  reason: string;
  confidence: ScreeningConfidence;
  ambiguous?: boolean;
}

export interface ProviderResult {
  state: ScreeningStepState;
  normalized: Record<string, unknown>;
  proposals?: FieldProposal[];
  rawMetadata?: Record<string, unknown>;
  sourceUrl?: string;
  sourceDatasetDate?: string;
  confidence: ScreeningConfidence;
  warning?: string;
  error?: string;
  expiresInSeconds?: number;
  rateLimitState?: string;
}

export interface ScreeningProvider {
  key: string;
  name: string;
  version: string;
  capability: ScreeningCapability;
  credentialRequired: boolean;
  configured(): boolean;
  cacheKey(request: ScreeningRequest): string;
  execute(request: ScreeningRequest): Promise<ProviderResult>;
}

export const PRELIMINARY_SCREENING_DISCLAIMER = "Automated preliminary screening requires verification and does not establish interconnection capacity, utility approval, title, zoning, legal access, environmental clearance, exact buildable acreage, construction feasibility, or project financeability.";
export const GRID_PROXIMITY_WARNING = "Nearby electrical infrastructure does not establish available hosting capacity, interconnection feasibility, project cost, or utility approval.";
