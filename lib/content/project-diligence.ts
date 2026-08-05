import { commercialTerms, project, TERM_SHEET_PATH } from "@/lib/project-data";

export type DiligenceStatus = "Available" | "Complete" | "Active" | "Pending third party" | "Future phase" | "Available under NDA" | "Not initiated" | "Not applicable";
export type DiligenceItem = { label: string; value?: string; status: DiligenceStatus };

const unpublished = (label: string): DiligenceItem => ({ label, value: "Not yet published", status: "Not initiated" });

export const diligenceSections: { title: string; items: DiligenceItem[] }[] = [
  { title: "Company and project entity", items: [
    { label: "Brand name", value: "NSoul", status: "Available" },
    { label: "Legal entity", value: project.legalEntity, status: "Available" },
    { label: "Project company", value: project.projectCompany || "Not yet published", status: "Not initiated" },
    unpublished("Entity status"), unpublished("Leadership contact"), unpublished("Insurance status"), unpublished("Legal counsel status"), unpublished("Project ownership structure"),
  ] },
  { title: "Site and land", items: [
    { label: "Project address", value: `${project.address}, ${project.city}`, status: "Available" },
    unpublished("Site-control status"), unpublished("Parcel status"), unpublished("Survey status"), unpublished("Title review"), unpublished("Zoning review"), unpublished("Road access"), unpublished("Flood review"), unpublished("Wetlands review"), unpublished("Environmental review"),
  ] },
  { title: "Utility and interconnection", items: [
    { label: "Utility", value: project.utility, status: "Available" },
    { label: "Circuit-capacity response", value: "PSO circuit-capacity response pending", status: "Pending third party" },
    { label: "Interconnection request status", value: "Written utility response requested", status: "Active" },
    unpublished("Metering structure"), unpublished("Delivery structure"), unpublished("Study requirements"), unpublished("Interconnection cost status"), { label: "Utility correspondence", value: "Request access when available", status: "Available under NDA" },
  ] },
  { title: "Engineering and construction", items: ["Preliminary layout", "Annual production estimate", "Equipment assumptions", "EPC pricing", "Single-line drawing", "Civil design", "Construction schedule", "Commissioning plan", "Operations and maintenance plan"].map((label) => ({ label, value: "Pending technical validation", status: "Future phase" })) },
  { title: "Commercial structure", items: [
    { label: "Indicative PPA term sheet", value: "Indicative and non-binding", status: "Available" },
    { label: "Contract term", value: `Indicative ${commercialTerms.agreementTermYears}-year term`, status: "Active" },
    { label: "Indicative starting rate", value: `$${commercialTerms.startingPpaRate}/kWh`, status: "Active" },
    { label: "Proposed escalator", value: `${commercialTerms.annualEscalator}% annually`, status: "Active" },
    ...["Metering", "Invoicing", "REC treatment", "Customer credit requirements", "Assignment provisions", "Lender rights", "Performance standards", "Remedies", "End-of-term provisions"].map((label) => ({ label, value: "Subject to definitive documentation", status: "Future phase" as const })),
  ] },
  { title: "Financing and incentives", items: ["Project financing", "Equipment lease", "USDA REAP", "Tax-credit strategy", "Construction funding", "Lender diligence", "Financial close"].map((label) => ({ label, value: "No approval or closing represented", status: "Future phase" })) },
];

export const diligenceDocuments = [
  { title: "Indicative PPA term sheet", status: "Available" as const, href: TERM_SHEET_PATH, action: "Download public document", type: "PDF, indicative commercial terms" },
  { title: "Utility correspondence", status: "Available under NDA" as const, action: "Request access" },
  { title: "Eligibility verification", status: "Complete" as const, action: "Request access" },
  { title: "Preliminary layout", status: "Future phase" as const, action: "Pending" },
  { title: "Production model", status: "Future phase" as const, action: "Pending" },
  { title: "EPC quote", status: "Future phase" as const, action: "Pending" },
  { title: "Site documentation", status: "Available under NDA" as const, action: "Request access" },
  { title: "Environmental screening", status: "Not initiated" as const, action: "Not yet available" },
  { title: "Insurance", status: "Not initiated" as const, action: "Not yet available" },
  { title: "Entity documents", status: "Available under NDA" as const, action: "Request access" },
  { title: "Financing summary", status: "Future phase" as const, action: "Pending" },
  { title: "Draft project schedule", status: "Future phase" as const, action: "Pending" },
] as const;

export type CounterpartyStatus = "identified" | "contacted" | "proposal requested" | "under review" | "engaged" | "confirmed" | "pending disclosure";
export type Counterparty = { category: "utility" | "engineering" | "EPC" | "legal" | "insurance" | "lender" | "grant" | "metering" | "operations and maintenance" | "environmental" | "land" | "tax"; organizationName?: string; role: string; status: CounterpartyStatus; publicDescription: string; source?: string; displayPermission: boolean };

export const counterparties: Counterparty[] = [
  { category: "utility", organizationName: project.utility, role: "Interconnection utility", status: "contacted", publicDescription: "Circuit-capacity response pending.", displayPermission: true },
  { category: "engineering", role: "Qualified engineering provider", status: "identified", publicDescription: "Provider name remains pending disclosure.", displayPermission: false },
  { category: "EPC", role: "Qualified EPC provider", status: "identified", publicDescription: "Provider name remains pending disclosure.", displayPermission: false },
  { category: "operations and maintenance", role: "Operations provider", status: "identified", publicDescription: "Provider name remains pending disclosure.", displayPermission: false },
];

export const projectRisks = ["Utility capacity", "Engineering validation", "Customer load compatibility", "Definitive PPA", "Financing", "Permitting", "Equipment procurement", "Construction", "Project insurance", "Operating counterparties"] as const;
