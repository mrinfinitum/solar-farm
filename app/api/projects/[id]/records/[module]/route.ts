import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/auth/api";

const moduleSchemas = {
  blockers: { table: "project_blockers", schema: z.object({ title: z.string().trim().min(2).max(200), category: z.enum(["land","utility","engineering","environmental","permitting","commercial","financing","legal","construction","operations","other"]), severity: z.enum(["low","medium","high","critical"]), description: z.string().trim().max(4000).nullable().optional(), target_resolution_date: z.string().nullable().optional(), status: z.enum(["open","monitoring","resolved","accepted","cancelled"]).default("open") }) },
  decisions: { table: "project_decisions", schema: z.object({ decision_title: z.string().trim().min(2).max(240), decision_date: z.string(), selected_option: z.string().trim().min(1).max(1000), rationale: z.string().trim().min(10).max(5000), financial_impact: z.string().max(2000).nullable().optional(), schedule_impact: z.string().max(2000).nullable().optional(), risk_impact: z.string().max(2000).nullable().optional() }) },
  interconnection: { table: "interconnection_requests", schema: z.object({ utility_id: z.uuid().nullable().optional(), service_territory: z.string().max(240).nullable().optional(), request_type: z.string().max(120).nullable().optional(), requested_capacity_mw: z.coerce.number().min(0).max(10000).nullable().optional(), application_number: z.string().max(120).nullable().optional(), status: z.enum(["not_started","screening","preparing_application","submitted","feasibility_study","system_impact_study","facilities_study","agreement_negotiation","approved","withdrawn","rejected","suspended","unknown"]), evidence_level: z.enum(["nearby_infrastructure","preliminary_utility_feedback","formal_study_result","executed_interconnection_agreement"]), next_action: z.string().max(1000).nullable().optional(), next_action_date: z.string().nullable().optional() }) },
  engineering: { table: "engineering_deliverables", schema: z.object({ title: z.string().trim().min(2).max(240), deliverable_type: z.enum(["site_layout","production_model","single_line_diagram","equipment_schedule","civil_plan","grading_plan","drainage_plan","geotechnical_report","structural_design","interconnection_package","construction_drawings","as_built_drawings","other"]), status: z.string().max(80).default("not_started"), target_date: z.string().nullable().optional() }) },
  epc: { table: "epc_proposals", schema: z.object({ vendor_id: z.uuid(), version_number: z.coerce.number().int().min(1), total_epc_cost: z.coerce.number().min(0).nullable().optional(), cost_per_watt_dc: z.coerce.number().min(0).nullable().optional(), cost_per_watt_ac: z.coerce.number().min(0).nullable().optional(), status: z.enum(["received","clarification","shortlisted","recommended","selected","declined","expired"]).default("received"), schedule_summary: z.string().max(3000).nullable().optional(), proposal_expiration: z.string().nullable().optional() }) },
  offtakers: { table: "offtaker_opportunities", schema: z.object({ company_id: z.uuid().nullable().optional(), facility: z.string().trim().min(2).max(240), location: z.string().max(240).nullable().optional(), industry: z.string().max(120).nullable().optional(), estimated_annual_usage_kwh: z.coerce.number().min(0).nullable().optional(), credit_review_status: z.string().max(80).default("not_started"), interest_level: z.string().max(80).default("unknown"), status: z.enum(["identified","researched","contacted","discovery","data_requested","data_received","qualified","pricing_review","loi","term_sheet","ppa_negotiation","committed","declined","paused"]), next_action: z.string().max(1000).nullable().optional() }) },
  ppa: { table: "ppa_scenarios", schema: z.object({ opportunity_id: z.uuid().nullable().optional(), version_number: z.coerce.number().int().min(1), term_years: z.coerce.number().int().min(1).max(50).nullable().optional(), starting_price_per_kwh: z.coerce.number().min(0).nullable().optional(), annual_escalator_pct: z.coerce.number().min(-20).max(20).nullable().optional(), contracted_energy_kwh: z.coerce.number().min(0).nullable().optional(), status: z.enum(["concept","indicative","term_sheet_draft","term_sheet_issued","term_sheet_accepted","legal_drafting","negotiation","execution_ready","executed","terminated","expired"]), legal_review_status: z.string().max(80).default("not_started"), executed_confirmation: z.boolean().default(false), signed_document_id: z.uuid().nullable().optional() }).refine((value) => value.status !== "executed" || (value.executed_confirmation && value.signed_document_id), "Executed PPA requires explicit confirmation and a signed document") },
  permits: { table: "permit_requirements", schema: z.object({ requirement_type: z.string().trim().min(2).max(160), responsible_agency: z.string().max(240).nullable().optional(), status: z.string().max(80).default("not_started"), due_date: z.string().nullable().optional(), expiration_date: z.string().nullable().optional(), cost: z.coerce.number().min(0).nullable().optional(), notes: z.string().max(3000).nullable().optional() }) },
  diligence: { table: "diligence_items", schema: z.object({ diligence_type: z.string().trim().min(2).max(120), title: z.string().trim().min(2).max(240), status: z.string().max(80).default("not_started"), due_date: z.string().nullable().optional(), risk_level: z.string().max(40).default("unknown"), findings: z.string().max(4000).nullable().optional() }) },
  incentives: { table: "project_incentives", schema: z.object({ incentive_program_id: z.uuid(), eligibility_status: z.string().max(80).default("unverified"), application_status: z.string().max(80).default("not_started"), estimated_value: z.coerce.number().min(0).nullable().optional(), confirmed_value: z.coerce.number().min(0).nullable().optional(), deadline: z.string().nullable().optional(), next_action: z.string().max(1000).nullable().optional() }) },
  budget: { table: "project_budget_versions", schema: z.object({ version_number: z.coerce.number().int().min(1), name: z.string().trim().min(2).max(200), status: z.enum(["draft","review","approved","superseded"]).default("draft"), total_project_cost: z.coerce.number().min(0) }) },
  capital_stack: { table: "capital_stack_versions", schema: z.object({ version_number: z.coerce.number().int().min(1), name: z.string().trim().min(2).max(200), status: z.enum(["draft","review","approved","superseded"]).default("draft"), approved_project_cost: z.coerce.number().min(0) }) },
  capital: { table: "capital_stack_items", schema: z.object({ capital_stack_version_id: z.uuid(), capital_type: z.enum(["sponsor_equity","investor_equity","construction_debt","permanent_debt","tax_credit_transfer_proceeds","tax_equity","grant","rebate","loan_guarantee","seller_financing","equipment_financing","bridge_financing","other"]), source: z.string().max(240).nullable().optional(), amount: z.coerce.number().min(0), status: z.enum(["concept","researching","contacted","application","diligence","term_sheet","committed","closed","declined","withdrawn"]).default("concept"), expected_close_date: z.string().nullable().optional(), conditions: z.string().max(4000).nullable().optional() }) },
  milestones: { table: "project_milestones", schema: z.object({ section: z.string().max(120).default("development"), task_name: z.string().trim().min(2).max(240), task_description: z.string().max(3000).nullable().optional(), status: z.enum(["not_started","in_progress","complete","blocked","waived","cancelled"]), target_date: z.string().nullable().optional(), critical_path: z.boolean().default(false), project_stage: z.string().max(80).nullable().optional() }) },
  tasks: { table: "tasks", schema: z.object({ title: z.string().trim().min(2).max(240), description: z.string().max(3000).nullable().optional(), category: z.string().max(100).nullable().optional(), priority: z.enum(["low","normal","high","critical"]).default("normal"), status: z.enum(["open","in-progress","waiting","completed","canceled"]).default("open"), due_date: z.string().nullable().optional(), assigned_to: z.uuid().nullable().optional() }) },
  construction: { table: "construction_progress_updates", schema: z.object({ title: z.string().trim().min(2).max(240), status: z.string().trim().min(2).max(80), record_type: z.string().max(120).nullable().optional(), effective_date: z.string().nullable().optional(), due_date: z.string().nullable().optional(), amount: z.coerce.number().nullable().optional(), details: z.union([z.record(z.string(),z.unknown()),z.string().transform((entry)=>({notes:entry}))]).default({}) }) },
  operations: { table: "operating_assets", schema: z.object({ title: z.string().trim().min(2).max(240), status: z.string().trim().min(2).max(80), record_type: z.string().max(120).nullable().optional(), effective_date: z.string().nullable().optional(), due_date: z.string().nullable().optional(), details: z.union([z.record(z.string(),z.unknown()),z.string().transform((entry)=>({notes:entry}))]).default({}) }) },
} as const;

const financialModules = new Set(["budget", "capital", "financial_model"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string; module: string }> }) {
  const actor = await getApiActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, module } = await params;
  const projectId = z.uuid().safeParse(id);
  const definition = moduleSchemas[module as keyof typeof moduleSchemas];
  if (!projectId.success || !definition) return NextResponse.json({ error: "Unsupported project record" }, { status: 404 });
  const analystAllowed = ["engineering", "incentives"].includes(module);
  if (!["owner", "admin", "developer"].includes(actor.role) && !(actor.role === "analyst" && analystAllowed)) return NextResponse.json({ error: "Read-only project access" }, { status: 403 });
  if (financialModules.has(module) && actor.role === "viewer") return NextResponse.json({ error: "Financial access restricted" }, { status: 403 });
  const parsed = definition.schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  const { data, error } = await actor.supabase.from(definition.table).insert({ ...parsed.data, project_id: projectId.data, organization_id: actor.profile.organizationId, created_by: actor.user.id }).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 409 }) : NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; module: string }> }) {
  const actor = await getApiActor(["owner", "admin", "developer"]);
  if (!actor) return NextResponse.json({ error: "Project operation permission required" }, { status: 403 });
  const { id, module } = await params;
  const projectId = z.uuid().safeParse(id);
  const definition = moduleSchemas[module as keyof typeof moduleSchemas];
  const body = await request.json();
  const recordId = z.uuid().safeParse(body.id);
  const parsed = definition?.schema.partial().safeParse(body.values);
  if (!projectId.success || !recordId.success || !definition || !parsed?.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const { data, error } = await actor.supabase.from(definition.table).update(parsed.data).eq("id", recordId.data).eq("project_id", projectId.data).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 409 }) : NextResponse.json({ data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; module: string }> }) {
  const actor = await getApiActor(["owner", "admin"]);
  if (!actor) return NextResponse.json({ error: "Administrator permission required" }, { status: 403 });
  const { id, module } = await params;
  const definition = moduleSchemas[module as keyof typeof moduleSchemas];
  const body = await request.json();
  const projectId = z.uuid().safeParse(id); const recordId = z.uuid().safeParse(body.id);
  if (!projectId.success || !recordId.success || !definition) return NextResponse.json({ error: "Invalid record" }, { status: 422 });
  const { error } = await actor.supabase.from(definition.table).update({ archived_at: new Date().toISOString() }).eq("id", recordId.data).eq("project_id", projectId.data);
  return error ? NextResponse.json({ error: error.message }, { status: 409 }) : new NextResponse(null, { status: 204 });
}
