export type ProjectModelMetric = {
  value: number | string;
  prefix?: string;
  suffix?: string;
  label: string;
  accent?: "green" | "cyan";
};

export type ProjectModelDetail = {
  label: string;
  value: string;
};

export type ProjectModelPhase = {
  number: string;
  title: string;
  status: string;
  description: string;
};

export type CommercialRole = {
  name: string;
  description: string;
};

export const projectModel = {
  intro: {
    eyebrow: "Representative project model",
    title: "How a regional solar project can be structured.",
    description: "A representative commercial model showing how site scale, energy demand, project development, and long-term power purchasing can fit together.",
    purpose: "Illustrative values demonstrate a potential commercial structure. They do not represent a final site design, offer, production estimate, or operating forecast.",
  },
  metrics: [
    { value: "1–5", suffix: " MW DC", label: "Representative scale", accent: "cyan" },
    { value: 0, prefix: "$", label: "Potential customer upfront capital", accent: "green" },
    { value: 20, suffix: " YEARS", label: "Illustrative PPA term" },
    { value: "LOCAL", label: "Regional commercial demand", accent: "cyan" },
  ] satisfies ProjectModelMetric[],
  details: [
    { label: "Market", value: "Regional commercial energy user" },
    { label: "Site type", value: "Ground-mounted solar array" },
    { label: "Generation model", value: "Sized around facility demand and site capacity" },
    { label: "Commercial structure", value: "Long-term power purchase agreement" },
    { label: "Ownership model", value: "Developer-owned and operated" },
    { label: "Customer role", value: "Purchases generated electricity" },
  ] satisfies ProjectModelDetail[],
  flow: ["Solar site", "Grid connection", "Commercial facility", "Long-term energy savings"],
  geographyChips: ["Rural site", "Regional grid", "Commercial load nearby"],
  phases: [
    { number: "01", title: "Site and demand screening", status: "First", description: "Identify viable land and a compatible commercial energy user." },
    { number: "02", title: "Utility feasibility", status: "Next", description: "Confirm service territory, circuit conditions, and interconnection path." },
    { number: "03", title: "Preliminary engineering", status: "Then", description: "Estimate array size, generation, cost, and required site work." },
    { number: "04", title: "Commercial agreement", status: "Validate", description: "Align indicative pricing, term, usage, and customer requirements." },
    { number: "05", title: "Financing and permitting", status: "Close", description: "Complete diligence, approvals, capital structure, and legal documentation." },
    { number: "06", title: "Construction and operation", status: "Deliver", description: "Build, commission, monitor, maintain, and report performance." },
  ] satisfies ProjectModelPhase[],
  roles: [
    { name: "Developer", description: "Finances, builds, owns, and operates the project" },
    { name: "Off-taker", description: "Purchases generated energy under a long-term agreement" },
    { name: "Utility", description: "Supports interconnection and grid delivery" },
    { name: "Project", description: "Produces regional renewable electricity over its operating life" },
  ] satisfies CommercialRole[],
} as const;
