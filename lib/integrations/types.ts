import type { EvidenceLevel } from "@/types/property";

export interface NormalizedPropertyData {
  sourceName: string;
  sourceUrl: string | null;
  collectedAt: string;
  rawIdentifier: string | null;
  fields: Record<string, string | number | boolean | null>;
  evidenceLevel: EvidenceLevel;
  warnings: string[];
  licensingNotes: string;
}

export interface PropertyDataProvider {
  key: string;
  name: string;
  enabled: boolean;
  mode: "manual" | "file" | "authorized-api" | "unavailable";
  description: string;
  licensingNotes: string;
  normalize(input: unknown): Promise<NormalizedPropertyData[]>;
}
