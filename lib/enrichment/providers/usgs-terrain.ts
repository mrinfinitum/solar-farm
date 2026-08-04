import type { ProviderResult, ScreeningProvider, ScreeningRequest } from "@/lib/enrichment/types";
import { geometryFingerprint, requireCoordinates, sourceHealth } from "./provider-utils";

const ENDPOINT = "https://epqs.nationalmap.gov/v1/json";
type Point = [number, number];
function isoDate(value: string | null) { if (!value) return null; const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10); }

function samples(request: ScreeningRequest): Point[] {
  const geometry = request.geometry as { type?: string; coordinates?: unknown } | null;
  const points: Point[] = [];
  const collect = (value: unknown) => {
    if (Array.isArray(value) && value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") points.push([value[0], value[1]]);
    else if (Array.isArray(value)) value.forEach(collect);
  };
  if (geometry) collect(geometry.coordinates);
  if (request.longitude != null && request.latitude != null) points.push([request.longitude, request.latitude]);
  if (!points.length) return [];
  const stride = Math.max(1, Math.ceil(points.length / 8));
  return points.filter((_, index) => index % stride === 0).slice(0, 8);
}

function distanceMeters(a: Point, b: Point) {
  const radius = 6371000; const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad; const dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

export class UsgsTerrainProvider implements ScreeningProvider {
  key = "terrain-provider"; name = "USGS 3DEP Elevation Point Query Service"; version = "EPQS-v1"; capability = "terrain" as const;
  credentialRequired = false; cacheTtlSeconds = 180 * 24 * 60 * 60;
  description = "Official USGS elevation samples with transparent, approximate slope indicators.";
  setupInstructions = "Public USGS service; no credential is required. It does not replace a survey or civil grading study.";
  configured() { return true; }
  cacheKey(request: ScreeningRequest) { return `${this.key}:${this.version}:${geometryFingerprint(request)}:${request.geometryUpdatedAt || "point"}`; }
  healthCheck = sourceHealth(`${ENDPOINT}?x=-94.83&y=33.9&wkid=4326&units=Meters&includeDate=true`, "USGS EPQS");
  async execute(request: ScreeningRequest): Promise<ProviderResult> {
    if (!requireCoordinates(request) && !request.geometry) return { state: "warning", normalized: {}, confidence: "unknown", warning: "Coordinates or parcel geometry are required before terrain screening." };
    const points = samples(request);
    try {
      const values = await Promise.all(points.map(async ([longitude, latitude]) => {
        const url = new URL(ENDPOINT); url.searchParams.set("x", String(longitude)); url.searchParams.set("y", String(latitude)); url.searchParams.set("wkid", "4326"); url.searchParams.set("units", "Meters"); url.searchParams.set("includeDate", "true");
        const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (!response.ok) throw new Error(`USGS EPQS returned ${response.status}.`);
        const data = await response.json() as { value?: number; resolution?: number; rasterId?: number; attributes?: { AcquisitionDate?: string } };
        if (!Number.isFinite(data.value)) throw new Error("USGS EPQS did not return a usable elevation.");
        return { longitude, latitude, elevationMeters: Number(data.value), resolution: data.resolution ?? null, rasterId: data.rasterId ?? null, acquisitionDate: data.attributes?.AcquisitionDate || null };
      }));
      const elevations = values.map((value) => value.elevationMeters);
      const slopes = values.slice(1).map((value) => Math.abs(value.elevationMeters - values[0].elevationMeters) / Math.max(1, distanceMeters([values[0].longitude, values[0].latitude], [value.longitude, value.latitude])) * 100);
      return { state: "complete", normalized: { sampleCount: values.length, minimumElevationMeters: Math.min(...elevations), maximumElevationMeters: Math.max(...elevations), averageElevationMeters: Number((elevations.reduce((a, b) => a + b, 0) / elevations.length).toFixed(2)), terrainVariabilityMeters: Number((Math.max(...elevations) - Math.min(...elevations)).toFixed(2)), approximateAverageSlopePercent: slopes.length ? Number((slopes.reduce((a, b) => a + b, 0) / slopes.length).toFixed(2)) : null, approximateMaximumSlopePercent: slopes.length ? Number(Math.max(...slopes).toFixed(2)) : null, samples: values, method: "EPQS point samples; slopes are straight-line screening indicators" }, rawMetadata: { units: "meters", service: "USGS 3DEP EPQS" }, sourceUrl: ENDPOINT, sourceDatasetDate: isoDate(values.map((value) => value.acquisitionDate).find(Boolean) || null) || undefined, confidence: request.geometry && values.length > 2 ? "moderate" : "low", warning: "Sample-derived terrain indicators do not replace a topographic survey, grading analysis, or civil engineering review.", expiresInSeconds: this.cacheTtlSeconds };
    } catch (error) { return { state: "failed", normalized: {}, confidence: "unknown", error: error instanceof Error ? error.message : "Terrain request failed." }; }
  }
}
