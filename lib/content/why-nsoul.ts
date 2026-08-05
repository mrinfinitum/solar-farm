export const proofPoints = [
  "Customer does not purchase the system",
  "Energy is measured",
  "Responsibilities are documented",
  "Due diligence remains visible",
  "Final commitments require definitive agreements",
] as const;

export const customerDoesNotManage = [
  "Purchasing solar equipment", "Financing construction", "Obtaining project permits", "Managing engineering", "Operating the array", "Maintaining equipment", "Replacing failed project equipment", "Monitoring production systems", "Managing project insurance",
] as const;

export const customerEvaluates = [
  "Expected energy usage", "Proposed rate", "Contract term", "Savings assumptions", "Metering and billing", "Renewable Energy Certificate treatment", "Credit and assignment terms", "Performance obligations", "Remedies", "Legal protections",
] as const;

export const localValue = [
  { title: "Responsive relationships", copy: "A regional developer can provide direct access to the people coordinating the project rather than routing every question through a national call center." },
  { title: "Project-specific development", copy: "The project can be evaluated around local land, utility conditions, customer demand, and regional operating needs." },
  { title: "Local economic participation", copy: "Development may support regional contractors, landowners, service providers, tax base, and long-term operations, subject to the final project structure." },
  { title: "Visible infrastructure", copy: "The customer can understand where the project is located, how development is progressing, and which parties are responsible." },
] as const;

export const audiencePaths = [
  { type: "Regional business", title: "Lower energy costs without owning a solar asset.", priorities: ["No upfront equipment purchase", "Simple commercial explanation", "Budget visibility", "Direct relationship", "Minimal internal workload", "Utility-bill review"], cta: "Request a Bill Review", query: "regional-business" },
  { type: "Mid-market or institutional", title: "A long-term energy strategy designed around the facility.", priorities: ["Load matching", "Financial modeling", "Contract term", "Facility continuity", "REC treatment", "Production reporting", "Legal and operational diligence"], cta: "Request a Facility Assessment", query: "mid-market" },
  { type: "Enterprise procurement", title: "A regional project prepared for procurement-grade review.", priorities: ["Project company structure", "Counterparty review", "EPC and engineering diligence", "Insurance", "Metering", "Lender and assignment rights", "REC ownership", "Performance reporting", "Data-room access"], cta: "Request Diligence Access", query: "enterprise" },
] as const;
