import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PropertyRecord } from "@/types/property";

const propertySelect = "*,property_scores(*),property_score_runs(*),property_risk_flags(*),property_utility(*),property_environmental(*),property_regulatory(*),property_market(*)";

export async function getProperties(options?: { search?: string; stage?: string; status?: string; county?: string; grade?: string; risk?: string; assignedTo?: string; verified?: string; sort?: string; page?: number; pageSize?: number }) {
  const supabase = await createClient(); if (!supabase) return { properties: [] as PropertyRecord[], count: 0, configured: false };
  const page = Math.max(1, options?.page || 1); const pageSize = Math.min(100, Math.max(10, options?.pageSize || 25));
  const [sortColumn, sortDirection] = (options?.sort || "updated_at:desc").split(":");
  const allowedSorts = new Set(["total_acres", "asking_price", "price_per_acre", "updated_at"]);
  const scoreRelation = options?.grade || options?.risk ? "property_score_runs!inner(*)" : "property_score_runs(*)";
  const listSelect = propertySelect.replace("property_score_runs(*)", scoreRelation);
  let query = supabase.from("properties").select(listSelect, { count: "exact" }).is("archived_at", null).order(allowedSorts.has(sortColumn) ? sortColumn : "updated_at", { ascending: sortDirection === "asc" }).range((page - 1) * pageSize, page * pageSize - 1);
  if (options?.stage) query = query.eq("pipeline_stage", options.stage);
  if (options?.status) query = query.eq("current_status", options.status);
  if (options?.county) query = query.eq("county", options.county);
  if (options?.assignedTo) query = query.eq("assigned_to", options.assignedTo);
  if (options?.grade) query = query.eq("property_score_runs.grade", options.grade);
  if (options?.risk) query = query.eq("property_score_runs.overall_risk", options.risk);
  if (options?.verified === "verified") query = query.not("last_verified_at", "is", null);
  if (options?.verified === "unverified") query = query.is("last_verified_at", null);
  if (options?.search) query = query.or(`project_name.ilike.%${options.search}%,address_line_1.ilike.%${options.search}%,county.ilike.%${options.search}%,parcel_number.ilike.%${options.search}%,owner_name.ilike.%${options.search}%,broker_name.ilike.%${options.search}%,property_code.ilike.%${options.search}%`);
  const { data, count } = await query; return { properties: (data || []) as unknown as PropertyRecord[], count: count || 0, configured: true };
}

export async function getAssignableProfiles() { const supabase = await createClient(); if (!supabase) return []; const { data } = await supabase.from("profiles").select("id,full_name,email").order("full_name"); return data || []; }

export async function getProperty(id: string) { const supabase = await createClient(); if (!supabase) return null; const { data } = await supabase.from("properties").select(`${propertySelect},property_parcels(*),property_notes(*),comments(*),property_contacts(*,contacts(*)),documents(*),tasks(*),property_data_sources(*),property_status_history(*),project_properties(*),property_offtaker_matches(*,offtakers(*))`).eq("id", id).single(); return data as unknown as (PropertyRecord & Record<string, unknown>) | null; }

export async function getDashboardData() { const supabase = await createClient(); if (!supabase) return { properties: [] as PropertyRecord[], tasks: [], documents: [], projects: [], offtakers: [] }; const [properties, tasks, documents, projects, offtakers] = await Promise.all([supabase.from("properties").select(propertySelect).is("archived_at", null).order("updated_at", { ascending: false }), supabase.from("tasks").select("*").not("status", "in", '("completed","canceled")').order("due_date"), supabase.from("documents").select("*").order("created_at", { ascending: false }).limit(8), supabase.from("projects").select("*").order("updated_at", { ascending: false }), supabase.from("offtakers").select("*").order("updated_at", { ascending: false })]); return { properties: (properties.data || []) as unknown as PropertyRecord[], tasks: tasks.data || [], documents: documents.data || [], projects: projects.data || [], offtakers: offtakers.data || [] }; }

export async function getCollection(table: "projects" | "offtakers" | "contacts" | "documents" | "imports") { const supabase = await createClient(); if (!supabase) return []; const { data } = await supabase.from(table).select("*").order("updated_at" in {} ? "updated_at" : "created_at", { ascending: false }); return data || []; }
