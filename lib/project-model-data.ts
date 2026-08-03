export type ProjectIntelligenceMetric = {
  value: string;
  label: string;
};

export type ProjectStructureRole = {
  name: string;
  description: string;
};

export type ProjectWorkflowStep = {
  number: string;
  label: string;
};

export const projectModel = {
  intro: {
    eyebrow: "Representative project",
    title: "A commercial solar asset, structured for long-term value.",
    description:
      "A representative view of how site capacity, regional demand, project ownership, and power purchasing align within a single operating model.",
    noteTitle: "Illustrative model",
    note:
      "Values are directional and remain subject to engineering, interconnection, financing, and final agreements.",
  },
  metrics: [
    { value: "1–5 MW DC", label: "Representative capacity" },
    { value: "2.25M kWh", label: "Illustrative annual generation" },
    { value: "20 years", label: "Representative agreement term" },
    { value: "Developer-owned", label: "Operating model" },
  ] satisfies ProjectIntelligenceMetric[],
  roles: [
    { name: "Developer", description: "Finances, builds, owns, and operates" },
    { name: "Energy customer", description: "Purchases generated electricity" },
    { name: "Utility", description: "Supports interconnection and delivery" },
  ] satisfies ProjectStructureRole[],
  flow: ["Site", "Interconnect", "Generate", "Deliver", "Operate"],
  workflow: [
    { number: "01", label: "Screen" },
    { number: "02", label: "Validate" },
    { number: "03", label: "Engineer" },
    { number: "04", label: "Contract" },
    { number: "05", label: "Finance" },
    { number: "06", label: "Operate" },
  ] satisfies ProjectWorkflowStep[],
  currentStage: {
    label: "Current stage · Utility validation",
    description:
      "Confirm service territory, available circuit capacity, interconnection requirements, and project-delivery constraints.",
  },
} as const;
