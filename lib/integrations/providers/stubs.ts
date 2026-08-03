import type { PropertyDataProvider } from "@/lib/integrations/types";

function stub(key: string, name: string, description: string): PropertyDataProvider {
  return { key, name, enabled: false, mode: "unavailable", description, licensingNotes: "No authorized API or licensed dataset is configured. This adapter intentionally returns no data.", async normalize() { return []; } };
}

export const providerStubs = [
  stub("county-assessor", "County assessor", "Future adapter for authorized county parcel and assessor sources."),
  stub("flood", "FEMA flood", "Future adapter for FEMA National Flood Hazard Layer services."),
  stub("wetlands", "USFWS wetlands", "Future adapter for authorized National Wetlands Inventory services."),
  stub("soils", "USDA soils", "Future adapter for USDA Web Soil Survey data."),
  stub("utility", "Utility infrastructure", "Future adapter for utility-authorized territory and infrastructure data. Visible lines never imply capacity."),
  stub("listings", "Licensed listings", "Future adapter for broker feeds or a licensed commercial property API; no scraping is implemented."),
];
