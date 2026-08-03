import Papa from "papaparse";
import type { PropertyDataProvider } from "@/lib/integrations/types";

export const csvProvider: PropertyDataProvider = {
  key: "csv", name: "Authorized CSV import", enabled: true, mode: "file",
  description: "Imports a user-supplied CSV after preview, mapping, validation, and duplicate checks.",
  licensingNotes: "Only upload data you are authorized to use. The importer does not scrape or enrich records.",
  async normalize(input) {
    const text = typeof input === "string" ? input : "";
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    return parsed.data.map((fields, index) => ({ sourceName: fields.source_name || "CSV import", sourceUrl: fields.source_url || null, collectedAt: new Date().toISOString(), rawIdentifier: fields.source_listing_id || `row-${index + 2}`, fields, evidenceLevel: "source-reported" as const, warnings: parsed.errors.filter((error) => error.row === index).map((error) => error.message), licensingNotes: this.licensingNotes }));
  },
};
