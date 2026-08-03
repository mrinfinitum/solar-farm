import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProjectCommandData, ProjectPortfolioRecord } from "@/types/project-command";

const moduleTables = [
  "project_stage_gates", "interconnection_requests", "engineering_engagements", "engineering_deliverables",
  "project_design_versions", "production_models", "epc_proposals", "epc_proposal_comparisons",
  "offtaker_opportunities", "offtaker_outreach", "ppa_scenarios", "permit_requirements", "diligence_items",
  "project_budget_versions", "project_cost_estimates", "capital_stack_versions", "capital_stack_items",
  "financial_model_versions", "project_incentives", "project_blockers", "project_decisions", "construction_progress_updates", "operating_assets",
  "project_milestones", "tasks", "documents",
] as const;

export async function getProjectPortfolio() {
  const supabase = await createClient();
  if (!supabase) return [] as ProjectPortfolioRecord[];
  const { data } = await supabase
    .from("projects")
    .select("*,project_milestones(id,task_name,status,target_date,critical_path,archived_at),project_blockers(id,title,severity,status,target_resolution_date,archived_at)")
    .is("archived_at", null)
    .order("updated_at", { ascending: false });
  return (data || []) as unknown as ProjectPortfolioRecord[];
}

export async function getProjectCommandCenter(id: string): Promise<ProjectCommandData | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const base = await supabase.from("projects").select("*").eq("id", id).is("archived_at", null).maybeSingle();
  if (!base.data) return null;
  const results = await Promise.all(moduleTables.map(async (table) => {
    const query = supabase.from(table).select("*").eq("project_id", id);
    const withArchive = !["project_stage_gates"].includes(table as "project_stage_gates") ? query.is("archived_at", null) : query.is("archived_at", null);
    const { data } = await withArchive.order("created_at", { ascending: false });
    return [table, data || []] as const;
  }));
  const relatedIds = [id, ...results.flatMap(([, rows]) => rows.map((row) => String((row as { id?: unknown }).id || ""))).filter(Boolean)].slice(0, 250);
  const activity = await supabase.from("activity_log").select("*").in("entity_id", relatedIds).order("created_at", { ascending: false }).limit(120);
  return {
    ...base.data,
    ...Object.fromEntries(results),
    activity: activity.data || [],
  } as unknown as ProjectCommandData;
}

export async function getProjectModule(projectId: string, table: string) {
  const allowed = new Set<string>(moduleTables);
  if (!allowed.has(table)) return [];
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from(table).select("*").eq("project_id", projectId).is("archived_at", null).order("created_at", { ascending: false });
  return data || [];
}

export async function getProjectNotifications() {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("notifications").select("*").eq("status", "unread").is("archived_at", null).order("due_at", { ascending: true }).limit(20);
  return data || [];
}
