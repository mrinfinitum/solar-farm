import { calculatePreliminaryScore, type PreliminaryComponentInput } from "@/lib/scoring/preliminary";

export interface ScreeningScoreContext {
  components: PreliminaryComponentInput[];
  parcelAmbiguous?: boolean;
  providerCoverageComplete?: boolean;
  sourcesConflict?: boolean;
  utilityVerificationStatus?: "unknown" | "likely" | "manually_confirmed" | "utility_confirmed";
}

export function proposeScreeningScore(context: ScreeningScoreContext) {
  const adjusted = context.components.map((component) => {
    if (component.category === "grid_and_interconnection" && context.utilityVerificationStatus !== "utility_confirmed") {
      return { ...component, rawScore: Math.min(component.rawScore ?? 0, 35), explanation: `${component.explanation} Automated proximity cannot establish available capacity or utility approval.` };
    }
    return component;
  });
  const result = calculatePreliminaryScore({ components: adjusted });
  const penalties = [context.parcelAmbiguous, context.providerCoverageComplete === false, context.sourcesConflict].filter(Boolean).length;
  return { ...result, confidence: penalties > 0 && result.confidence === "high" ? "moderate" as const : penalties > 1 ? "low" as const : result.confidence, confidencePenalties: penalties };
}
