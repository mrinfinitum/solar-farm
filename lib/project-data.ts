import {
  Building2,
  Factory,
  HeartPulse,
  Landmark,
  PackageCheck,
  ShoppingBag,
  Store,
  Trees,
  type LucideIcon,
} from "lucide-react";

export type ProjectDetails = {
  name: string;
  owner: string;
  address: string;
  city: string;
  county: string;
  capacity: string;
  technology: string;
  annualGenerationKwh: number;
  targetOperation: string;
  agreement: string;
  stage: string;
  informationDate: string;
  legalEntity: string;
  projectCompany: string | null;
  utility: string;
};

export type Metric = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
};

export type EconomicMilestone = {
  period: string;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
};

export type DevelopmentStatus = "complete" | "active" | "pending" | "future";

export type DevelopmentMilestone = {
  status: DevelopmentStatus;
  label: string;
  title: string;
  description: string;
};

export type IndustryCategory = {
  name: string;
  icon: LucideIcon;
};

export const project: ProjectDetails = {
  name: "1 Cornerstone Lane Solar Farm",
  owner: "NSoul LLC",
  address: "1 Cornerstone Lane",
  city: "Idabel, Oklahoma 74745",
  county: "McCurtain County",
  capacity: "1.5 MW DC",
  technology: "Tier-1 ground-mounted photovoltaic array",
  annualGenerationKwh: 2_250_000,
  targetOperation: "Q2/Q3 2027",
  agreement: "20-year commercial PPA",
  stage: "Development",
  informationDate: "August 2026",
  legalEntity: "NSoul LLC",
  projectCompany: null,
  utility: "Public Service Company of Oklahoma (PSO)",
};

export const commercialTerms = {
  startingPpaRate: 0.08075,
  modeledUtilityBaseline: 0.095,
  startingDiscount: 15,
  annualEscalator: 2,
  customerUpfrontCapital: 0,
  agreementTermYears: 20,
  extensionOptions: "Possible five-year extensions",
  recs: "Proposed transfer to the commercial off-taker",
} as const;

export const metrics: Metric[] = [
  {
    value: commercialTerms.customerUpfrontCapital,
    prefix: "$",
    label: "Upfront customer capital",
  },
  {
    value: commercialTerms.startingDiscount,
    suffix: "%",
    label: "Indicative starting discount",
  },
  {
    value: 2.25,
    decimals: 2,
    suffix: "M",
    label: "Estimated annual kWh",
  },
  {
    value: 765,
    prefix: "$",
    suffix: "K+",
    label: "Modeled 20-year savings",
  },
];

export const rateComparison = [
  { year: "Year 1", yearNumber: 1, utility: 0.095, ppa: 0.08075 },
  { year: "Year 5", yearNumber: 5, utility: 0.107, ppa: 0.0874 },
  { year: "Year 10", yearNumber: 10, utility: 0.124, ppa: 0.0965 },
  { year: "Year 20*", yearNumber: 20, utility: 0.138, ppa: 0.0988 },
] as const;

export const economicMilestones: EconomicMilestone[] = [
  { period: "Year 1", value: 32_062, prefix: "$", label: "Modeled annual savings" },
  { period: "Year 5", value: 44_098, prefix: "$", label: "Modeled annual savings" },
  { period: "Year 10", value: 61_886, prefix: "$", label: "Modeled annual savings" },
  { period: "20 years", value: 765_000, prefix: "$", suffix: "+", label: "Modeled cumulative savings" },
];

export const developmentMilestones: DevelopmentMilestone[] = [
  {
    status: "complete",
    label: "Complete",
    title: "USDA REAP geographic eligibility",
    description: "Project address verified as geographically eligible.",
  },
  {
    status: "pending",
    label: "Pending",
    title: "PSO circuit-capacity review",
    description: "Written utility response requested.",
  },
  {
    status: "pending",
    label: "Pending",
    title: "Preliminary engineering",
    description: "Aerial layout, production estimate, and construction pricing underway.",
  },
  {
    status: "active",
    label: "Active",
    title: "Commercial off-taker outreach",
    description: "Discussions initiated with regional commercial and industrial organizations.",
  },
  {
    status: "future",
    label: "Future phase",
    title: "PPA execution and project financing",
    description: "Deployment follows technical validation and commercial agreement.",
  },
  {
    status: "future",
    label: "Future phase",
    title: "Construction and commissioning",
    description: "Timing remains subject to utility, permitting, financing, procurement, and final approvals.",
  },
];

export const industries: IndustryCategory[] = [
  { name: "Manufacturing", icon: Factory },
  { name: "Healthcare", icon: HeartPulse },
  { name: "Food processing", icon: PackageCheck },
  { name: "Lumber and paper", icon: Trees },
  { name: "Distribution", icon: Building2 },
  { name: "Retail", icon: ShoppingBag },
  { name: "Public institutions", icon: Landmark },
  { name: "Large commercial", icon: Store },
];

export const navigation = [
  { label: "Overview", href: "#top" },
  { label: "Our Vision", href: "/our-vision" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Project", href: "#project" },
  { label: "Economics", href: "#economics" },
  { label: "Development", href: "#development" },
  { label: "Contact", href: "#contact" },
] as const;

export const disclaimer =
  "This website presents preliminary, non-binding, indicative project information for discussion purposes only. Project capacity, generation, pricing, savings, incentives, Renewable Energy Certificates, financing, schedule, and commercial terms remain subject to technical design, energy-use review, utility interconnection, permitting, financing, legal documentation, and final approvals.";

export const TERM_SHEET_PATH = "/documents/cornerstone-solar-indicative-term-sheet.pdf";
