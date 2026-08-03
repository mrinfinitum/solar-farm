export const FINANCE_ENGINE_VERSION = "nsoul-finance-1.0.0";

export type FinanceInputs = {
  projectCost: number;
  annualGenerationKwh: number;
  availabilityPct: number;
  degradationPct: number;
  curtailmentPct: number;
  ppaRatePerKwh: number;
  ppaEscalatorPct: number;
  termYears: number;
  annualOpex: number;
  opexEscalatorPct: number;
  replacementCapex: Array<{ year: number; amount: number }>;
  incentives: Array<{ year: number; amount: number; confidence: "unverified" | "estimated" | "confirmed" }>;
  debtAmount: number;
  debtInterestPct: number;
  debtTermYears: number;
  interestOnlyYears: number;
  balloonAmount: number;
  reserveContributionAnnual: number;
  taxRatePct: number;
  depreciationYears: number;
  discountRatePct: number;
  committedCapital: number;
};

export type ProjectionYear = {
  year: number;
  generationKwh: number;
  ppaRatePerKwh: number;
  revenue: number;
  opex: number;
  replacementCapex: number;
  incentiveProceeds: number;
  interestExpense: number;
  principalPayment: number;
  debtService: number;
  endingDebtBalance: number;
  taxableIncome: number;
  taxes: number;
  cfads: number;
  dscr: number | null;
  projectCashFlow: number;
  equityCashFlow: number;
};

export type FinanceWarning = { code: string; message: string; severity: "info" | "warning" | "blocking" };

export type FinanceOutputs = {
  engineVersion: string;
  years: ProjectionYear[];
  totalRevenue: number;
  totalOpex: number;
  totalProjectCashFlow: number;
  equityRequired: number;
  projectNpv: number;
  equityNpv: number;
  projectIrr: number | null;
  equityIrr: number | null;
  minimumDscr: number | null;
  averageDscr: number | null;
  simplePaybackYear: number | null;
  discountedPaybackYear: number | null;
  breakEvenPpaRate: number | null;
  breakEvenProjectCost: number | null;
  capitalGap: number;
  sponsorEquityRequirement: number;
  warnings: FinanceWarning[];
};

export const DEFAULT_FINANCE_INPUTS: FinanceInputs = {
  projectCost: 5_000_000,
  annualGenerationKwh: 7_500_000,
  availabilityPct: 98,
  degradationPct: 0.5,
  curtailmentPct: 1,
  ppaRatePerKwh: 0.085,
  ppaEscalatorPct: 1.5,
  termYears: 20,
  annualOpex: 90_000,
  opexEscalatorPct: 2.5,
  replacementCapex: [{ year: 12, amount: 250_000 }],
  incentives: [],
  debtAmount: 3_000_000,
  debtInterestPct: 6.5,
  debtTermYears: 15,
  interestOnlyYears: 1,
  balloonAmount: 0,
  reserveContributionAnnual: 15_000,
  taxRatePct: 21,
  depreciationYears: 5,
  discountRatePct: 8,
  committedCapital: 0,
};

const money = (value: number) => Math.round(value * 100) / 100;
const rate = (value: number) => value / 100;

function validate(inputs: FinanceInputs): FinanceWarning[] {
  const warnings: FinanceWarning[] = [];
  if (inputs.projectCost <= 0) warnings.push({ code: "PROJECT_COST_REQUIRED", message: "Project cost must be greater than zero.", severity: "blocking" });
  if (inputs.annualGenerationKwh <= 0) warnings.push({ code: "GENERATION_REQUIRED", message: "Annual generation must be greater than zero.", severity: "blocking" });
  if (inputs.termYears < 1 || inputs.termYears > 50) warnings.push({ code: "TERM_RANGE", message: "Model term must be between 1 and 50 years.", severity: "blocking" });
  if (inputs.debtAmount > inputs.projectCost) warnings.push({ code: "DEBT_EXCEEDS_COST", message: "Debt exceeds modeled project cost.", severity: "warning" });
  if (inputs.debtAmount > 0 && inputs.debtTermYears < 1) warnings.push({ code: "DEBT_TERM_REQUIRED", message: "Debt term is required when debt is modeled.", severity: "blocking" });
  if (inputs.incentives.some((item) => item.confidence === "unverified")) warnings.push({ code: "UNVERIFIED_INCENTIVE", message: "Unverified incentives are excluded from modeled proceeds.", severity: "warning" });
  return warnings;
}

function annualDebtPayment(principal: number, annualRate: number, periods: number, balloon: number) {
  if (principal <= 0 || periods <= 0) return 0;
  if (annualRate === 0) return (principal - balloon) / periods;
  const pvBalloon = balloon / Math.pow(1 + annualRate, periods);
  return (principal - pvBalloon) * annualRate / (1 - Math.pow(1 + annualRate, -periods));
}

export function npv(cashFlows: number[], discountRatePct: number) {
  const discount = rate(discountRatePct);
  return cashFlows.reduce((sum, value, index) => sum + value / Math.pow(1 + discount, index), 0);
}

export function irr(cashFlows: number[]): number | null {
  if (!cashFlows.some((value) => value < 0) || !cashFlows.some((value) => value > 0)) return null;
  let low = -0.9999;
  let high = 10;
  const valueAt = (guess: number) => cashFlows.reduce((sum, value, index) => sum + value / Math.pow(1 + guess, index), 0);
  let lowValue = valueAt(low);
  let highValue = valueAt(high);
  if (Math.sign(lowValue) === Math.sign(highValue)) return null;
  for (let iteration = 0; iteration < 240; iteration += 1) {
    const mid = (low + high) / 2;
    const midValue = valueAt(mid);
    if (!Number.isFinite(midValue)) return null;
    if (Math.abs(midValue) < 0.000001) return mid * 100;
    if (Math.sign(midValue) === Math.sign(lowValue)) {
      low = mid;
      lowValue = midValue;
    } else {
      high = mid;
      highValue = midValue;
    }
  }
  const result = ((low + high) / 2) * 100;
  return Number.isFinite(result) ? result : null;
}

export function paybackYear(cashFlows: number[], discountRatePct = 0) {
  const discount = rate(discountRatePct);
  let cumulative = 0;
  for (let index = 0; index < cashFlows.length; index += 1) {
    cumulative += cashFlows[index] / Math.pow(1 + discount, index);
    if (cumulative >= 0) return index;
  }
  return null;
}

function projectNpvForPpa(inputs: FinanceInputs, ppaRatePerKwh: number) {
  return buildProjection({ ...inputs, ppaRatePerKwh }, { calculateBreakEven: false }).projectNpv;
}

function breakEvenPpa(inputs: FinanceInputs) {
  let low = 0;
  let high = 2;
  if (projectNpvForPpa(inputs, high) < 0) return null;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    if (projectNpvForPpa(inputs, mid) >= 0) high = mid;
    else low = mid;
  }
  return high;
}

export function buildProjection(inputs: FinanceInputs, options: { calculateBreakEven?: boolean } = {}): FinanceOutputs {
  const warnings = validate(inputs);
  const blocking = warnings.some((warning) => warning.severity === "blocking");
  if (blocking) {
    return { engineVersion: FINANCE_ENGINE_VERSION, years: [], totalRevenue: 0, totalOpex: 0, totalProjectCashFlow: 0, equityRequired: 0, projectNpv: 0, equityNpv: 0, projectIrr: null, equityIrr: null, minimumDscr: null, averageDscr: null, simplePaybackYear: null, discountedPaybackYear: null, breakEvenPpaRate: null, breakEvenProjectCost: null, capitalGap: 0, sponsorEquityRequirement: 0, warnings };
  }

  const debtRate = rate(inputs.debtInterestPct);
  const amortizingYears = Math.max(inputs.debtTermYears - inputs.interestOnlyYears, 0);
  const amortizingPayment = annualDebtPayment(inputs.debtAmount, debtRate, amortizingYears, inputs.balloonAmount);
  const equityRequired = Math.max(inputs.projectCost - inputs.debtAmount, 0);
  let debtBalance = inputs.debtAmount;
  const years: ProjectionYear[] = [];

  for (let year = 1; year <= inputs.termYears; year += 1) {
    const generationKwh = inputs.annualGenerationKwh * Math.pow(1 - rate(inputs.degradationPct), year - 1) * (1 - rate(inputs.curtailmentPct)) * rate(inputs.availabilityPct);
    const ppaRatePerKwh = inputs.ppaRatePerKwh * Math.pow(1 + rate(inputs.ppaEscalatorPct), year - 1);
    const revenue = generationKwh * ppaRatePerKwh;
    const opex = inputs.annualOpex * Math.pow(1 + rate(inputs.opexEscalatorPct), year - 1);
    const replacementCapex = inputs.replacementCapex.filter((item) => item.year === year).reduce((sum, item) => sum + item.amount, 0);
    const incentiveProceeds = inputs.incentives.filter((item) => item.year === year && item.confidence !== "unverified").reduce((sum, item) => sum + item.amount, 0);
    const interestExpense = debtBalance * debtRate;
    let principalPayment = 0;
    let debtService = 0;
    if (debtBalance > 0 && year <= inputs.debtTermYears) {
      if (year <= inputs.interestOnlyYears) debtService = interestExpense;
      else {
        debtService = Math.min(amortizingPayment, debtBalance + interestExpense);
        principalPayment = Math.min(Math.max(debtService - interestExpense, 0), debtBalance);
      }
      if (year === inputs.debtTermYears && inputs.balloonAmount > 0) {
        const balloon = Math.min(inputs.balloonAmount, debtBalance - principalPayment);
        principalPayment += balloon;
        debtService += balloon;
      }
      debtBalance = Math.max(debtBalance - principalPayment, 0);
    }
    const depreciation = year <= inputs.depreciationYears ? inputs.projectCost / Math.max(inputs.depreciationYears, 1) : 0;
    const taxableIncome = Math.max(revenue - opex - interestExpense - depreciation, 0);
    const taxes = taxableIncome * rate(inputs.taxRatePct);
    const cfads = revenue - opex - taxes - replacementCapex - inputs.reserveContributionAnnual;
    const projectCashFlow = cfads + incentiveProceeds;
    const equityCashFlow = projectCashFlow - debtService;
    years.push({ year, generationKwh: money(generationKwh), ppaRatePerKwh, revenue: money(revenue), opex: money(opex), replacementCapex: money(replacementCapex), incentiveProceeds: money(incentiveProceeds), interestExpense: money(interestExpense), principalPayment: money(principalPayment), debtService: money(debtService), endingDebtBalance: money(debtBalance), taxableIncome: money(taxableIncome), taxes: money(taxes), cfads: money(cfads), dscr: debtService > 0 ? cfads / debtService : null, projectCashFlow: money(projectCashFlow), equityCashFlow: money(equityCashFlow) });
  }

  const projectCashFlows = [-inputs.projectCost, ...years.map((year) => year.projectCashFlow)];
  const equityCashFlows = [-equityRequired, ...years.map((year) => year.equityCashFlow)];
  const projectIrr = irr(projectCashFlows);
  const equityIrr = irr(equityCashFlows);
  if (projectIrr === null) warnings.push({ code: "PROJECT_IRR_UNAVAILABLE", message: "Project IRR unavailable for this cash-flow pattern.", severity: "warning" });
  if (equityIrr === null) warnings.push({ code: "EQUITY_IRR_UNAVAILABLE", message: "Equity IRR unavailable for this cash-flow pattern.", severity: "warning" });
  const dscrValues = years.flatMap((year) => year.dscr == null ? [] : [year.dscr]);
  const projectNpvValue = money(npv(projectCashFlows, inputs.discountRatePct));
  return {
    engineVersion: FINANCE_ENGINE_VERSION,
    years,
    totalRevenue: money(years.reduce((sum, year) => sum + year.revenue, 0)),
    totalOpex: money(years.reduce((sum, year) => sum + year.opex, 0)),
    totalProjectCashFlow: money(years.reduce((sum, year) => sum + year.projectCashFlow, 0)),
    equityRequired: money(equityRequired),
    projectNpv: projectNpvValue,
    equityNpv: money(npv(equityCashFlows, inputs.discountRatePct)),
    projectIrr,
    equityIrr,
    minimumDscr: dscrValues.length ? Math.min(...dscrValues) : null,
    averageDscr: dscrValues.length ? dscrValues.reduce((sum, value) => sum + value, 0) / dscrValues.length : null,
    simplePaybackYear: paybackYear(equityCashFlows),
    discountedPaybackYear: paybackYear(equityCashFlows, inputs.discountRatePct),
    breakEvenPpaRate: options.calculateBreakEven === false ? null : breakEvenPpa(inputs),
    breakEvenProjectCost: money(inputs.projectCost + projectNpvValue),
    capitalGap: money(Math.max(inputs.projectCost - inputs.committedCapital, 0)),
    sponsorEquityRequirement: money(Math.max(inputs.projectCost - inputs.debtAmount - inputs.committedCapital, 0)),
    warnings,
  };
}

export type SensitivityVariable = "projectCost" | "annualGenerationKwh" | "ppaRatePerKwh" | "annualOpex" | "debtInterestPct";

export function runSensitivity(inputs: FinanceInputs, rowVariable: SensitivityVariable, rowDeltasPct: number[], columnVariable: SensitivityVariable, columnDeltasPct: number[]) {
  if (rowDeltasPct.length * columnDeltasPct.length > 121) throw new Error("Sensitivity matrix is limited to 121 server-calculated cells.");
  return rowDeltasPct.flatMap((rowDelta) => columnDeltasPct.map((columnDelta) => {
    const scenario = { ...inputs, [rowVariable]: inputs[rowVariable] * (1 + rate(rowDelta)), [columnVariable]: inputs[columnVariable] * (1 + rate(columnDelta)) };
    const output = buildProjection(scenario, { calculateBreakEven: false });
    return { rowDeltaPct: rowDelta, columnDeltaPct: columnDelta, projectNpv: output.projectNpv, projectIrr: output.projectIrr, minimumDscr: output.minimumDscr };
  }));
}

export type ReadinessInput = { approvedModel: boolean; modelStale: boolean; productionApproved: boolean; budgetApproved: boolean; siteControlValid: boolean; interconnectionEvidence: boolean; fatalFlags: string[]; completedRequirements: number; totalRequirements: number };

export function calculateFundingReadiness(input: ReadinessInput) {
  const gates = [input.approvedModel && !input.modelStale, input.productionApproved, input.budgetApproved, input.siteControlValid, input.interconnectionEvidence];
  const evidenceScore = input.totalRequirements > 0 ? input.completedRequirements / input.totalRequirements : 0;
  const score = Math.round((gates.filter(Boolean).length / gates.length * 80) + (evidenceScore * 20));
  const status = input.fatalFlags.length > 0 ? "blocked" : score >= 90 ? "lender_ready" : score >= 70 ? "investor_ready" : score >= 45 ? "developing" : "early";
  return { score, status, blockingReasons: input.fatalFlags };
}

export function canManageCapitalData(role: string) { return role === "owner" || role === "admin"; }
export function canEditFinancialModel(role: string) { return ["owner", "admin", "developer", "analyst"].includes(role); }
export function canApproveFinancialModel(role: string) { return role === "owner" || role === "admin"; }
