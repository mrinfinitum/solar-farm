import area from "@turf/area";
import intersect from "@turf/intersect";
import { featureCollection, feature } from "@turf/helpers";

import type { ScreeningRequest } from "@/lib/enrichment/types";

type GeoGeometry = { type: string; coordinates: unknown };

export function requireCoordinates(request: ScreeningRequest) {
  if (request.latitude == null || request.longitude == null) return null;
  return { latitude: request.latitude, longitude: request.longitude };
}

export function geometryFingerprint(request: ScreeningRequest) {
  return request.geometry ? JSON.stringify(request.geometry) : `${request.latitude},${request.longitude}`;
}

export function arcGisGeometry(request: ScreeningRequest) {
  const geometry = request.geometry as GeoGeometry | null;
  if (geometry?.type === "Polygon") return { geometry: JSON.stringify({ rings: geometry.coordinates, spatialReference: { wkid: 4326 } }), type: "esriGeometryPolygon" };
  if (geometry?.type === "MultiPolygon") {
    const rings = (geometry.coordinates as unknown[][][]).flat();
    return { geometry: JSON.stringify({ rings, spatialReference: { wkid: 4326 } }), type: "esriGeometryPolygon" };
  }
  const point = requireCoordinates(request);
  return point ? { geometry: `${point.longitude},${point.latitude}`, type: "esriGeometryPoint" } : null;
}

export async function queryArcGis(layerUrl: string, request: ScreeningRequest, outFields = "*") {
  const target = arcGisGeometry(request);
  if (!target) return { features: [], exceededTransferLimit: false };
  const endpoint = new URL(`${layerUrl}/query`);
  endpoint.searchParams.set("f", "geojson");
  endpoint.searchParams.set("where", "1=1");
  endpoint.searchParams.set("geometry", target.geometry);
  endpoint.searchParams.set("geometryType", target.type);
  endpoint.searchParams.set("inSR", "4326");
  endpoint.searchParams.set("outSR", "4326");
  endpoint.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  endpoint.searchParams.set("outFields", outFields);
  endpoint.searchParams.set("returnGeometry", "true");
  const response = await fetch(endpoint, { headers: { "User-Agent": "NSoul-Studio/1.0" }, signal: AbortSignal.timeout(20000) });
  if (response.status === 429) throw Object.assign(new Error("Provider rate limit reached."), { rateLimited: true });
  if (!response.ok) throw new Error(`Provider returned ${response.status}.`);
  const payload = await response.json() as { features?: Array<{ type: "Feature"; geometry: GeoGeometry; properties: Record<string, unknown> }>; exceededTransferLimit?: boolean; error?: { message?: string } };
  if (payload.error) throw new Error(payload.error.message || "ArcGIS query failed.");
  return { features: payload.features || [], exceededTransferLimit: Boolean(payload.exceededTransferLimit) };
}

export function calculateOverlap(requestGeometry: Record<string, unknown> | null, features: Array<{ geometry: GeoGeometry }>) {
  if (!requestGeometry || !features.length) return { overlapPercent: null, affectedAcres: null, method: "point-or-no-geometry" };
  try {
    const parcel = feature(requestGeometry as never);
    const parcelArea = area(parcel);
    let affectedSquareMeters = 0;
    for (const item of features) {
      const clipped = intersect(featureCollection([parcel, feature(item.geometry as never)]));
      if (clipped) affectedSquareMeters += area(clipped);
    }
    const boundedAffectedArea = Math.min(parcelArea, affectedSquareMeters);
    return {
      overlapPercent: parcelArea > 0 ? Math.min(100, Number(((boundedAffectedArea / parcelArea) * 100).toFixed(3))) : null,
      affectedAcres: Number((boundedAffectedArea / 4046.8564224).toFixed(3)),
      method: "geodesic-geometry-intersection",
    };
  } catch {
    return { overlapPercent: null, affectedAcres: null, method: "geometry-intersection-unavailable" };
  }
}

export function sourceHealth(url: string, name: string) {
  return async () => {
    try {
      const response = await fetch(url, { method: "GET", signal: AbortSignal.timeout(10000) });
      if (response.status === 429) return { status: "rate_limited" as const, message: `${name} is rate limited.` };
      return { status: response.ok ? "operational" as const : "degraded" as const, message: response.ok ? `${name} responded.` : `${name} returned ${response.status}.` };
    } catch { return { status: "unavailable" as const, message: `${name} did not respond.` }; }
  };
}
