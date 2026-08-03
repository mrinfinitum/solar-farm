export const PRELIMINARY_SCORE_VERSION = "nsoul-preliminary-v2.0";

export const PRELIMINARY_CATEGORIES = [
  ["grid_and_interconnection", "Grid & interconnection", 30],
  ["usable_land_and_geometry", "Usable land & geometry", 15],
  ["environmental_constraints", "Environmental constraints", 15],
  ["acquisition_economics", "Acquisition economics", 10],
  ["construction_access_and_terrain", "Construction access & terrain", 10],
  ["permitting_and_land_use", "Permitting & land use", 10],
  ["offtaker_and_commercial_fit", "Off-taker & commercial fit", 10],
] as const;

export type PreliminaryCategory = (typeof PRELIMINARY_CATEGORIES)[number][0];
export type SourceQuality = "verified" | "estimated" | "user_reported" | "public_source" | "unknown";
export type FatalRiskType =
  | "no_viable_interconnection"
  | "insufficient_site_control"
  | "environmental_constraint"
  | "incompatible_land_use"
  | "insufficient_usable_acreage"
  | "no_legal_access"
  | "title_defect"
  | "failed_project_economics"
  | "no_plausible_offtaker";

export interface PreliminaryComponentInput {
  category: PreliminaryCategory;
  rawScore: number | null;
  sourceQuality: SourceQuality;
  critical: boolean;
  explanation: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceDate?: string | null;
  missingInformation?: string | null;
}

export interface PreliminaryScoreInput {
  components: PreliminaryComponentInput[];
  fatalRisks?: FatalRiskType[];
  overrideScore?: number | null;
  overrideReason?: string | null;
  asOfDate?: string;
}

export function gradeForScore(score: number) {
  if (score >= 85) return "A" as const;
  if (score >= 70) return "B" as const;
  if (score >= 55) return "C" as const;
  if (score >= 40) return "D" as const;
  return "F" as const;
}

export function calculatePreliminaryScore(input: PreliminaryScoreInput) {
  if (input.overrideScore != null && (!input.overrideReason || input.overrideReason.trim().length < 10)) {
    throw new Error("A manual score override requires a reason of at least 10 characters.");
  }

  const asOfTime = new Date(input.asOfDate || new Date().toISOString()).getTime();
  const byCategory = new Map(input.components.map((component) => [component.category, component]));
  const components = PRELIMINARY_CATEGORIES.map(([category, label, weight]) => {
    const supplied = byCategory.get(category);
    const rawScore = Math.max(0, Math.min(100, supplied?.rawScore ?? 0));
    return {
      category,
      label,
      weight,
      rawScore,
      weightedScore: Math.round((rawScore * weight) / 100 * 100) / 100,
      sourceQuality: supplied?.sourceQuality ?? "unknown",
      criticalMissing: Boolean(supplied?.critical && supplied.rawScore == null),
      explanation: supplied?.explanation?.trim() || "No assessment entered.",
      sourceName: supplied?.sourceName?.trim() || null,
      sourceUrl: supplied?.sourceUrl?.trim() || null,
      sourceDate: supplied?.sourceDate || null,
      missingInformation: supplied?.missingInformation?.trim() || null,
      stale: Boolean(supplied?.sourceDate && Number.isFinite(asOfTime) && asOfTime - new Date(supplied.sourceDate).getTime() > 366 * 24 * 60 * 60 * 1000),
    };
  });

  const numericScore = Math.round(components.reduce((sum, component) => sum + component.weightedScore, 0) * 100) / 100;
  const displayedScore = input.overrideScore ?? numericScore;
  const verifiedFieldCount = components.filter((component) => component.sourceQuality === "verified" && !component.stale).length;
  const estimatedFieldCount = components.filter((component) => component.sourceQuality === "estimated").length;
  const sourcedFieldCount = components.filter((component) => component.sourceQuality !== "unknown" && !component.stale).length;
  const missingCriticalFieldCount = components.filter((component) => component.criticalMissing).length;
  const fatalRisks = [...new Set(input.fatalRisks ?? [])];
  const confidence = verifiedFieldCount >= 5 && missingCriticalFieldCount === 0
    ? "high"
    : sourcedFieldCount >= 4 && missingCriticalFieldCount <= 1
      ? "moderate"
      : "low";
  const overallRisk = fatalRisks.length > 0
    ? "critical"
    : missingCriticalFieldCount >= 3
      ? "high"
      : missingCriticalFieldCount > 0 || numericScore < 70
        ? "moderate"
        : "low";
  const recommendation = fatalRisks.length > 0
    ? "Hold — fatal risk requires resolution"
    : displayedScore >= 70
      ? "Advance to the next diligence stage"
      : displayedScore >= 55
        ? "Continue targeted screening"
        : "Do not advance without material new evidence";

  return {
    modelVersion: PRELIMINARY_SCORE_VERSION,
    numericScore,
    displayedScore,
    grade: gradeForScore(displayedScore),
    overallRisk,
    confidence,
    verifiedFieldCount,
    estimatedFieldCount,
    missingCriticalFieldCount,
    recommendation,
    fatalRisks,
    components,
    overrideReason: input.overrideReason?.trim() || null,
  };
}
