import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PropertyRecord } from "@/types/property";

const propertySelect = "*,property_scores(*),property_score_runs(*,property_score_components(*)),property_risk_flags(*),property_utility(*),property_environmental(*),property_regulatory(*),property_market(*)";

export async function getProperties(options?: { search?: string; stage?: string; status?: string; screening?: string; county?: string; grade?: string; risk?: string; confidence?: string; assignedTo?: string; utility?: string; verified?: string; sort?: string; page?: number; pageSize?: number }) {
  const supabase = await createClient(); if (!supabase) return { properties: [] as PropertyRecord[], count: 0, configured: false };
  const page = Math.max(1, options?.page || 1); const pageSize = Math.min(100, Math.max(10, options?.pageSize || 25));
  const [sortColumn, sortDirection] = (options?.sort || "updated_at:desc").split(":");
  const allowedSorts = new Set(["total_acres", "asking_price", "price_per_acre", "updated_at"]);
  const scoreRelation = options?.grade || options?.risk || options?.confidence ? "property_score_runs!inner(*,property_score_components(*))" : "property_score_runs(*,property_score_components(*))";
  const listSelect = propertySelect.replace("property_score_runs(*,property_score_components(*))", scoreRelation);
  let query = supabase.from("properties").select(listSelect, { count: "exact" }).is("archived_at", null).order(allowedSorts.has(sortColumn) ? sortColumn : "updated_at", { ascending: sortDirection === "asc" }).range((page - 1) * pageSize, page * pageSize - 1);
  if (options?.stage) query = query.eq("pipeline_stage", options.stage);
  if (options?.status) query = query.eq("current_status", options.status);
  if (options?.screening) query = query.eq("screening_status", options.screening);
  if (options?.county) query = query.eq("county", options.county);
  if (options?.assignedTo) query = query.eq("assigned_to", options.assignedTo);
  if (options?.grade) query = query.eq("property_score_runs.grade", options.grade);
  if (options?.risk) query = query.eq("property_score_runs.overall_risk", options.risk);
  if (options?.confidence) query = query.eq("property_score_runs.confidence", options.confidence);
  if (options?.utility) query = query.ilike("utility_name", `%${options.utility.replace(/[%_,()]/g, "")}%`);
  if (options?.verified === "verified") query = query.not("last_verified_at", "is", null);
  if (options?.verified === "unverified") query = query.is("last_verified_at", null);
  if (options?.search) { const search = options.search.replace(/[%_,()]/g, ""); query = query.or(`name.ilike.%${search}%,project_name.ilike.%${search}%,address_line_1.ilike.%${search}%,county.ilike.%${search}%,parcel_number.ilike.%${search}%,owner_name.ilike.%${search}%,property_code.ilike.%${search}%`); }
  const { data, count } = await query; const properties = (data || []) as unknown as PropertyRecord[];
  if (sortColumn === "score" || sortColumn === "risk") {
    const riskRank = { unknown: 0, low: 1, moderate: 2, high: 3, critical: 4 } as const;
    properties.sort((left, right) => { const leftRuns = Array.isArray(left.property_score_runs) ? left.property_score_runs : left.property_score_runs ? [left.property_score_runs] : []; const rightRuns = Array.isArray(right.property_score_runs) ? right.property_score_runs : right.property_score_runs ? [right.property_score_runs] : []; const leftRun = [...leftRuns].sort((a,b)=>b.scored_at.localeCompare(a.scored_at))[0]; const rightRun = [...rightRuns].sort((a,b)=>b.scored_at.localeCompare(a.scored_at))[0]; const difference = sortColumn === "score" ? (leftRun?.displayed_score ?? -1) - (rightRun?.displayed_score ?? -1) : (riskRank[leftRun?.overall_risk || "unknown"] - riskRank[rightRun?.overall_risk || "unknown"]); return sortDirection === "asc" ? difference : -difference; });
  }
  return { properties, count: count || 0, configured: true };
}

export async function getAssignableProfiles() { const supabase = await createClient(); if (!supabase) return []; const { data } = await supabase.from("profiles").select("id,full_name,email").order("full_name"); return data || []; }

export async function getPublicPropertySubmissions() {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("public_property_submissions")
    .select("id,name,email,phone,property_address,county,approximate_acreage,asking_price,status,created_at,converted_property_id")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getProperty(id: string) { const supabase = await createClient(); if (!supabase) return null; const [propertyResult, activityResult] = await Promise.all([supabase.from("properties").select(`${propertySelect},property_parcels(*),property_notes(*),comments(*),property_contacts(*,contacts(*)),documents(*),tasks(*),property_checklist_items(*),property_data_sources(*),property_status_history(*),project_properties(*),property_offtaker_matches(*,offtakers(*))`).eq("id", id).single(), supabase.rpc("property_activity", { target_property_id: id })]); if (!propertyResult.data) return null; return { ...propertyResult.data, property_activity: activityResult.data || [] } as unknown as (PropertyRecord & Record<string, unknown>); }

const screeningSelect = "*,property_enrichment_steps(*),property_enrichment_results(*),property_field_proposals(*),property_screening_reports(*)";

export async function getPropertyScreeningRuns(propertyId: string) {
  const supabase = await createClient(); if (!supabase) return [];
  const { data } = await supabase.from("property_enrichment_runs").select(screeningSelect).eq("property_id", propertyId).order("started_at", { ascending: false });
  return data || [];
}

export async function getPropertyScreeningRun(propertyId: string, runId: string) {
  const supabase = await createClient(); if (!supabase) return null;
  const { data } = await supabase.from("property_enrichment_runs").select(screeningSelect).eq("property_id", propertyId).eq("id", runId).maybeSingle();
  return data;
}

export async function getDashboardData() { const supabase = await createClient(); if (!supabase) return { properties: [] as PropertyRecord[], tasks: [], documents: [], projects: [], offtakers: [], notifications: [] }; const [properties, tasks, documents, projects, offtakers, notifications] = await Promise.all([supabase.from("properties").select(propertySelect).is("archived_at", null).order("updated_at", { ascending: false }), supabase.from("tasks").select("*").not("status", "in", '("completed","canceled")').is("archived_at",null).order("due_date"), supabase.from("documents").select("*").is("archived_at",null).order("created_at", { ascending: false }).limit(8), supabase.from("projects").select("*,project_blockers(id,title,severity,status,target_resolution_date,archived_at),project_milestones(id,task_name,status,target_date,critical_path,archived_at),project_incentives(id,estimated_value,confirmed_value,deadline,application_status,archived_at)").is("archived_at",null).order("updated_at", { ascending: false }), supabase.from("offtakers").select("*").order("updated_at", { ascending: false }), supabase.from("notifications").select("*").eq("status","unread").is("archived_at",null).order("due_at").limit(20)]); return { properties: (properties.data || []) as unknown as PropertyRecord[], tasks: tasks.data || [], documents: documents.data || [], projects: projects.data || [], offtakers: offtakers.data || [], notifications: notifications.data || [] }; }

export async function getCollection(table: "projects" | "offtakers" | "contacts" | "documents" | "imports") { const supabase = await createClient(); if (!supabase) return []; const { data } = await supabase.from(table).select("*").order("updated_at" in {} ? "updated_at" : "created_at", { ascending: false }); return data || []; }
