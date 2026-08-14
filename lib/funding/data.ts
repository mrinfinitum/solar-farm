import "server-only";
import { createClient } from "@/lib/supabase/server";
import { calculateCategoryReadiness, calculateDataConfidence, calculatePortfolioFundingTotals, calculateReadiness, deriveNextBestAction } from "@/lib/funding/domain";
import type { FederalRegistrationStatus, FundingMilestone, FundingQuestion, FundingRequirement, FundingSource, FundingTask } from "@/lib/funding/types";

type Row = Record<string, unknown>;

export async function getFundingSpotlight() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: source } = await supabase.from("project_funding_sources")
    .select("id,project_id,program_name,status,submitted_at,projects(project_name,project_code)")
    .eq("program_name", "USDA REAP").is("archived_at", null).order("created_at").limit(1).maybeSingle();
  if (!source) return null;
  const [requirements, registration] = await Promise.all([
    supabase.from("funding_requirements").select("requirement_key,status,required").eq("funding_source_id", String(source.id)),
    supabase.from("organization_federal_registrations")
      .select("registration_status").eq("primary_project_id", String(source.project_id))
      .eq("registration_system", "SAM.gov").eq("registration_type", "Financial Assistance").maybeSingle(),
  ]);
  return { source: source as Row, requirements: (requirements.data ?? []) as Row[], registration: (registration.data as Row | null) ?? null };
}

export async function getProjectFundingOverview(projectId: string) {
  const supabase = await createClient();
  if (!supabase) return { sources: [] as FundingSource[], latestStack: null as Row | null, stackItems: [] as Row[] };
  const [sources, versions] = await Promise.all([
    supabase.from("project_funding_sources").select("*").eq("project_id", projectId).is("archived_at", null).order("created_at"),
    supabase.from("capital_stack_versions").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1),
  ]);
  const latestStack = (versions.data?.[0] as Row | undefined) ?? null;
  const stackItems = latestStack
    ? (await supabase.from("capital_stack_items").select("*").eq("capital_stack_version_id", String(latestStack.id)).is("archived_at", null)).data ?? []
    : [];
  return { sources: (sources.data ?? []) as FundingSource[], latestStack, stackItems: stackItems as Row[] };
}

export async function getReapWorkspace(projectId: string) {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: source } = await supabase.from("project_funding_sources")
    .select("*,funding_program_templates(*)").eq("project_id", projectId).eq("program_name", "USDA REAP").is("archived_at", null).maybeSingle();
  if (!source) return null;
  const sourceId = String(source.id);
  const [requirements, milestones, communications, questions, reimbursements, costs, contacts, availableContacts, documents, tasks, activity, federalRegistration] = await Promise.all([
    supabase.from("funding_requirements").select("*").eq("funding_source_id", sourceId).order("sort_order"),
    supabase.from("funding_milestones").select("*").eq("funding_source_id", sourceId).order("sort_order"),
    supabase.from("funding_communications").select("*,contacts(*)").eq("funding_source_id", sourceId).order("communication_date", { ascending: false }),
    supabase.from("funding_questions").select("*").eq("funding_source_id", sourceId).order("received_at", { ascending: false }),
    supabase.from("funding_reimbursements").select("*").eq("funding_source_id", sourceId).order("created_at", { ascending: false }),
    supabase.from("funding_cost_items").select("*").eq("funding_source_id", sourceId).order("created_at", { ascending: false }),
    supabase.from("funding_contacts").select("*,contacts(*)").eq("funding_source_id", sourceId).order("is_primary", { ascending: false }),
    supabase.from("contacts").select("id,first_name,last_name,company,title,email,phone").order("last_name").limit(200),
    supabase.from("documents").select("*").eq("project_id", projectId).is("archived_at", null).order("created_at", { ascending: false }).limit(200),
    supabase.from("tasks").select("*").or(`project_id.eq.${projectId},and(task_scope.eq.company,category.eq.federal-registration)`).is("archived_at", null).order("due_date", { ascending: true, nullsFirst: false }).limit(100),
    supabase.from("activity_log").select("*").in("entity_type", ["project_funding_sources","funding_requirements","funding_requirement_documents","funding_milestones","funding_contacts","funding_communications","funding_questions","funding_reimbursements","funding_cost_items","organization_federal_registration"]).order("created_at", { ascending: false }).limit(120),
    supabase.from("organization_federal_registrations")
      .select("id,organization_id,entity_name,registration_system,registration_type,uei_status,registration_status,submission_date,activation_confirmed_at,renewal_date,purpose,primary_program,official_source_url,primary_project_id,primary_funding_source_id")
      .eq("primary_project_id", projectId).eq("registration_system", "SAM.gov").eq("registration_type", "Financial Assistance").maybeSingle(),
  ]);
  const requirementRows = (requirements.data ?? []) as FundingRequirement[];
  const requirementDocuments = requirementRows.length
    ? await supabase.from("funding_requirement_documents").select("*,documents(*)").in("requirement_id", requirementRows.map((row) => row.id))
    : { data: [] as Row[] };
  const milestoneRows = (milestones.data ?? []) as FundingMilestone[];
  const questionRows = (questions.data ?? []) as FundingQuestion[];
  const taskRows = (tasks.data ?? []) as FundingTask[];
  const today = new Date(); const todayKey = today.toISOString().slice(0, 10); const nextWeek = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  const openTasks = taskRows.filter((task) => !["complete", "completed", "cancelled"].includes(task.status));
  const taskDate = (task: FundingTask) => task.due_date ?? task.target_date ?? null;
  const taskBuckets = {
    overdue: openTasks.filter((task) => { const date = taskDate(task); return Boolean(date && date < todayKey); }).length,
    today: openTasks.filter((task) => taskDate(task) === todayKey).length,
    nextSevenDays: openTasks.filter((task) => { const date = taskDate(task); return Boolean(date && date > todayKey && date <= nextWeek); }).length,
    waiting: openTasks.filter((task) => task.status === "waiting" || task.status === "blocked").length,
  };
  const relatedActivityIds = new Set<string>([
    sourceId,
    ...requirementRows.map((row) => row.id), ...milestoneRows.map((row) => row.id),
    ...(communications.data ?? []).map((row) => String(row.id)), ...questionRows.map((row) => row.id),
    ...(reimbursements.data ?? []).map((row) => String(row.id)), ...(costs.data ?? []).map((row) => String(row.id)),
    ...(contacts.data ?? []).map((row) => String(row.id)),
    ...(federalRegistration.data ? [String(federalRegistration.data.id)] : []),
  ]);
  const readiness = calculateReadiness(requirementRows);
  return {
    source: source as unknown as FundingSource & { funding_program_templates?: Row | null }, requirements: requirementRows,
    milestones: milestoneRows, communications: communications.data ?? [], questions: questionRows,
    reimbursements: reimbursements.data ?? [], costs: costs.data ?? [], contacts: contacts.data ?? [],
    availableContacts: availableContacts.data ?? [], documents: documents.data ?? [], requirementDocuments: requirementDocuments.data ?? [], tasks: taskRows, taskBuckets,
    activity: (activity.data ?? []).filter((row) => relatedActivityIds.has(String(row.entity_id))), readiness,
    categoryReadiness: calculateCategoryReadiness(requirementRows), dataConfidence: calculateDataConfidence(requirementRows),
    federalRegistration: (federalRegistration.data as FederalRegistrationStatus | null) ?? null,
    nextBestAction: deriveNextBestAction({ requirements: requirementRows, questions: questionRows, milestones: milestoneRows, tasks: taskRows }),
  };
}

export async function getPortfolioFundingWorkspace() {
  const supabase = await createClient();
  const empty = { projects: 0, sources: [] as Row[], totals: calculatePortfolioFundingTotals([]), requirements: [] as Row[], deadlines: [] as Row[], questions: [] as Row[], reimbursements: [] as Row[], activity: [] as Row[] };
  if (!supabase) return empty;
  const [projects, sources, requirements, deadlines, questions, reimbursements, activity] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).is("archived_at", null),
    supabase.from("project_funding_sources").select("*,projects(project_name,project_code)").is("archived_at", null).order("updated_at", { ascending: false }),
    supabase.from("funding_requirements").select("*,project_funding_sources(program_name,projects(project_name))").in("status", ["blocked","waiting","not-started","needs-review"]).eq("blocking", true).order("due_date", { ascending: true, nullsFirst: false }).limit(30),
    supabase.from("funding_requirements").select("*,project_funding_sources(program_name,projects(project_name))").not("due_date", "is", null).not("status", "in", "(complete,not-applicable)").order("due_date", { ascending: true }).limit(30),
    supabase.from("funding_questions").select("*,project_funding_sources(program_name,projects(project_name))").in("status", ["open","drafting","waiting"]).order("due_date", { ascending: true, nullsFirst: false }).limit(30),
    supabase.from("funding_reimbursements").select("*,project_funding_sources(program_name,projects(project_name))").order("created_at", { ascending: false }).limit(30),
    supabase.from("activity_log").select("*").in("entity_type", ["project_funding_sources","funding_requirements","funding_milestones","funding_communications","funding_questions","funding_reimbursements","funding_cost_items"]).order("created_at", { ascending: false }).limit(30),
  ]);
  return {
    projects: projects.count ?? 0, sources: (sources.data ?? []) as Row[],
    totals: calculatePortfolioFundingTotals((sources.data ?? []) as Array<{status:string;approved_amount:number|null;funded_amount:number|null;reimbursement_received:number|null}>),
    requirements: (requirements.data ?? []) as Row[], deadlines: (deadlines.data ?? []) as Row[], questions: (questions.data ?? []) as Row[],
    reimbursements: (reimbursements.data ?? []) as Row[], activity: (activity.data ?? []) as Row[],
  };
}
