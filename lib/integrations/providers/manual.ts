import type { NormalizedPropertyData, PropertyDataProvider } from "@/lib/integrations/types";

export const manualProvider: PropertyDataProvider = {
  key: "manual", name: "Manual research", enabled: true, mode: "manual",
  description: "Team-entered listing or off-market property research with explicit source attribution.",
  licensingNotes: "The user entering the record is responsible for source rights and accuracy.",
  async normalize(input) {
    const value = typeof input === "object" && input ? input as Record<string, unknown> : {};
    const normalized: NormalizedPropertyData = { sourceName: String(value.source_name || "Manual research"), sourceUrl: value.source_url ? String(value.source_url) : null, collectedAt: String(value.source_collected_at || new Date().toISOString()), rawIdentifier: value.source_listing_id ? String(value.source_listing_id) : null, fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, typeof item === "string" || typeof item === "number" || typeof item === "boolean" || item === null ? item : String(item)])), evidenceLevel: "source-reported", warnings: ["Manual entry has not been independently verified."], licensingNotes: this.licensingNotes };
    return [normalized];
  },
};
