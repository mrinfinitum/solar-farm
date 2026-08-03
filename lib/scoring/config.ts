export const SCORE_VERSION = "ok-rural-solar-v1.0";
export const scoringWeights = { landAffordability: 12, usableAcreage: 8, clearing: 8, slope: 8, flood: 8, wetlands: 8, farmland: 5, roadAccess: 6, utilityProximity: 12, interconnectionConfidence: 10, zoning: 5, offtaker: 4, sellerFlexibility: 3, strategicFit: 3 } as const;
export const scoreCategories = [
  { min: 85, label: "Priority candidate", tone: "green" }, { min: 70, label: "Strong candidate", tone: "cyan" }, { min: 55, label: "Research further", tone: "amber" }, { min: 40, label: "High risk", tone: "orange" }, { min: 0, label: "Reject or archive", tone: "red" },
] as const;
export const initialTargetProfile = { name: "Oklahoma Rural Solar – Initial Target", state: "Oklahoma", acreage: { min: 10, max: 80, usableMin: 8 }, pricePerAcre: { target: 5000, stretch: 7500 }, averageSlopePreferredMax: 5, preferredLandUses: ["pasture", "grassland", "former grazing", "marginal land"], utilityEvidenceRequired: true, notes: "Thresholds are starting assumptions and must be reviewed by an administrator before investment decisions." } as const;
