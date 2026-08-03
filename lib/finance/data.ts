import "server-only";
import { createClient } from "@/lib/supabase/server";

async function rows(table: string, projectId?: string) {
  const supabase = await createClient();
  if (!supabase) return [];
  let query = supabase.from(table).select("*");
  if (projectId) query = query.eq("project_id", projectId);
  const result = await query.order("created_at", { ascending: false }).limit(100);
  return result.data || [];
}

export async function getFinanceWorkspace(projectId: string) {
  const [models, versions, scenarioSets, sensitivityRuns, stackVersions, stackItems, debtFacilities, equitySources, readiness, requirements, flags, partners, termSheets] = await Promise.all([
    rows("financial_models", projectId), rows("financial_model_versions", projectId), rows("scenario_sets", projectId), rows("sensitivity_runs", projectId),
    rows("capital_stack_versions", projectId), rows("capital_stack_items", projectId), rows("debt_facilities", projectId), rows("equity_sources", projectId),
    rows("funding_readiness_assessments", projectId), rows("funding_readiness_requirements", projectId), rows("funding_readiness_flags", projectId), rows("capital_partners"), rows("financing_term_sheets", projectId),
  ]);
  return { models, versions, scenarioSets, sensitivityRuns, stackVersions, stackItems, debtFacilities, equitySources, readiness, requirements, flags, partners, termSheets };
}

export async function getFinancialModelVersion(projectId: string, modelId: string) {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("financial_model_versions").select("*,financial_model_warnings(*),financial_model_approvals(*)").eq("id", modelId).eq("project_id", projectId).maybeSingle();
  return data;
}

export async function getCapitalWorkspace() {
  const [partners, contacts, interactions, lenderOpportunities, investorOpportunities, termSheets] = await Promise.all([
    rows("capital_partners"), rows("capital_partner_contacts"), rows("capital_partner_interactions"), rows("lender_opportunities"), rows("investor_opportunities"), rows("financing_term_sheets"),
  ]);
  return { partners, contacts, interactions, lenderOpportunities, investorOpportunities, termSheets };
}

export async function getPortfolioFundingSummary() {
  const supabase = await createClient();
  if (!supabase) return { approvedModels: 0, staleModels: 0, lenderReady: 0, capitalPartners: 0, readinessQueue: [] as Record<string, unknown>[] };
  const [approved, stale, readiness, partners] = await Promise.all([
    supabase.from("financial_model_versions").select("id", { count: "exact", head: true }).not("approved_at", "is", null).eq("is_stale", false),
    supabase.from("financial_model_versions").select("id", { count: "exact", head: true }).eq("is_stale", true),
    supabase.from("funding_readiness_assessments").select("*,projects(project_name)").order("assessed_at", { ascending: false }).limit(20),
    supabase.from("capital_partners").select("id", { count: "exact", head: true }).is("archived_at", null),
  ]);
  const latestByProject = new Map<string, Record<string, unknown>>();
  for (const row of readiness.data || []) if (!latestByProject.has(String(row.project_id))) latestByProject.set(String(row.project_id), row);
  const queue = [...latestByProject.values()].filter((row) => row.readiness_status !== "lender_ready");
  return { approvedModels: approved.count || 0, staleModels: stale.count || 0, lenderReady: [...latestByProject.values()].filter((row) => row.readiness_status === "lender_ready").length, capitalPartners: partners.count || 0, readinessQueue: queue };
}
