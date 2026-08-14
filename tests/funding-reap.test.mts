import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  calculateDataConfidence, calculatePortfolioFundingTotals, calculateReadiness,
  calculateReimbursementSummary, deriveNextBestAction,
} from "../lib/funding/domain.ts";

const migration=readFileSync(new URL("../supabase/migrations/202608090001_project_funding_reap_workspace.sql",import.meta.url),"utf8");
const registrationMigration=readFileSync(new URL("../supabase/migrations/202608090002_private_federal_registration_status.sql",import.meta.url),"utf8");
const activeRegistrationMigration=readFileSync(new URL("../supabase/migrations/202608100001_sam_registration_active.sql",import.meta.url),"utf8");
const projectSeedRepairMigration=readFileSync(new URL("../supabase/migrations/202608100002_project001_funding_seed_repair.sql",import.meta.url),"utf8");
const collectionApi=readFileSync(new URL("../app/api/projects/[id]/funding/[resource]/route.ts",import.meta.url),"utf8");
const recordApi=readFileSync(new URL("../app/api/projects/[id]/funding/[resource]/[recordId]/route.ts",import.meta.url),"utf8");
const fundingData=readFileSync(new URL("../lib/funding/data.ts",import.meta.url),"utf8");
const reapWorkspace=readFileSync(new URL("../components/funding/reap-workspace.tsx",import.meta.url),"utf8");
const dashboardPage=readFileSync(new URL("../app/dashboard/page.tsx",import.meta.url),"utf8");
const projectOverview=readFileSync(new URL("../components/projects/project-overview.tsx",import.meta.url),"utf8");
const analytics=readFileSync(new URL("../lib/analytics.ts",import.meta.url),"utf8");
const makeRequirement=(overrides:Record<string,unknown>={})=>({id:"1",funding_source_id:"s",category:"engineering",requirement_key:"layout",title:"Layout",description:null,status:"not-started" as const,required:true,blocking:false,confirmation_state:"needs-program-confirmation" as const,due_date:null,completed_at:null,verified_at:null,source_url:null,source_title:null,source_verified_date:null,linked_document_id:null,linked_task_id:null,notes:null,sort_order:1,...overrides});

test("readiness uses completed required applicable requirements",()=>{const result=calculateReadiness([makeRequirement({status:"complete"}),makeRequirement({id:"2"}),makeRequirement({id:"3",required:false})]);assert.equal(result.percentage,50);assert.equal(result.completed,1);assert.equal(result.total,2)});
test("not applicable requirements are excluded",()=>{const result=calculateReadiness([makeRequirement({status:"not-applicable"})]);assert.equal(result.state,"not-applicable");assert.equal(result.percentage,null)});
test("empty templates report not configured",()=>assert.equal(calculateReadiness([]).state,"not-configured"));
test("blockers come only from actual incomplete blocking records",()=>{const result=calculateReadiness([makeRequirement({blocking:true,status:"waiting"}),makeRequirement({id:"2",blocking:true,status:"complete"})]);assert.equal(result.blockers.length,1);assert.equal(result.blockers[0].status,"waiting")});
test("data confidence is independent from checklist completion",()=>{const result=calculateDataConfidence([makeRequirement({status:"complete"}),makeRequirement({id:"2",confirmation_state:"source-verified",verified_at:"2026-08-09T00:00:00Z",source_url:"https://example.com"})]);assert.equal(result.percentage,50)});
test("next best action prioritizes overdue blockers",()=>{const result=deriveNextBestAction({requirements:[makeRequirement({blocking:true,due_date:"2026-08-01"})],questions:[{id:"q",question:"Question",status:"open",due_date:"2026-08-02",received_at:"2026-08-01"}],milestones:[],tasks:[],today:new Date("2026-08-09T12:00:00Z")});assert.equal(result.kind,"requirement");assert.match(result.reason,/overdue/i)});
test("open agency questions follow blocking requirements",()=>{const result=deriveNextBestAction({requirements:[makeRequirement({status:"complete"})],questions:[{id:"q",question:"Provide source",status:"open",due_date:null,received_at:"2026-08-01"}],milestones:[],tasks:[]});assert.equal(result.kind,"question")});
test("reimbursement calculations never infer missing values",()=>{const result=calculateReimbursementSummary([{requested_amount:100,approved_amount:null,paid_amount:null,status:"submitted"},{requested_amount:50,approved_amount:40,paid_amount:40,status:"paid"}]);assert.deepEqual(result,{requested:150,approved:40,paid:40,open:1})});
test("portfolio totals use stored values only",()=>{const result=calculatePortfolioFundingTotals([{status:"approved",approved_amount:100,funded_amount:20,reimbursement_received:10},{status:"planning",approved_amount:null,funded_amount:null,reimbursement_received:null}]);assert.equal(result.awardedFunding,100);assert.equal(result.preparing,1);assert.equal(result.activeSources,2)});
test("seed is idempotent and does not invent a grant amount",()=>{assert.match(migration,/on conflict\(project_id,program_name\) do nothing/);assert.match(migration,/No application, award, amount, percentage, eligibility determination/);assert.doesNotMatch(migration,/requested_amount\).*select[^;]*[1-9][0-9]{3}/s)});
test("Project 001 known statuses are seeded conservatively",()=>{assert.match(migration,/rural-geographic-eligibility/);assert.match(migration,/circuit-capacity-response/);assert.match(migration,/preliminary-layout/);assert.match(migration,/production-estimate/);assert.match(migration,/epc-cost-estimate/);assert.doesNotMatch(migration,/status='approved'.*USDA REAP/s)});
test("viewer access is read only and anonymous access is denied",()=>{assert.match(migration,/for select to authenticated/);assert.match(migration,/owner'',''admin'',''developer'',''analyst/);assert.match(migration,/revoke all on public\.funding_program_templates/);assert.doesNotMatch(collectionApi,/getApiActor\(\[.*viewer/)});
test("server mutations are role checked and Zod validated",()=>{assert.match(collectionApi,/getApiActor\(\["owner", "admin", "developer", "analyst"\]\)/);assert.match(collectionApi,/safeParse/);assert.match(recordApi,/updateSchemas\[resource as keyof typeof updateSchemas\]\.safeParse/);for(const schema of ["requirementUpdateSchema","fundingSourceUpdateSchema","questionUpdateSchema","reimbursementUpdateSchema","communicationUpdateSchema","costItemUpdateSchema","fundingContactUpdateSchema"])assert.match(recordApi,new RegExp(schema))});
test("new USDA REAP sources initialize from the active editable template",()=>{assert.match(collectionApi,/program_key", "usda-reap"/);assert.match(collectionApi,/funding_template_requirements/);assert.match(collectionApi,/funding_template_milestones/);assert.match(collectionApi,/initializationWarnings/)});
test("admin-only delete and archival are enforced",()=>{assert.match(recordApi,/getApiActor\(\["owner", "admin"\]\)/);assert.match(recordApi,/archived_at/);assert.match(migration,/owner'',''admin/)});
test("documents, contacts, tasks, milestones, and audit are linked instead of duplicated",()=>{for(const target of ["references public.documents","references public.contacts","references public.tasks","references public.project_milestones","public.log_change()"] )assert.match(migration,new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")))});
test("paid reimbursement and completed source workflow guards exist",()=>{assert.match(migration,/status <> 'paid' or \(paid_amount is not null/);assert.match(migration,/cannot be completed while reimbursement requests remain open/)});
test("program rules retain source evidence and verification metadata",()=>{for(const column of ["source_url","source_title","date_verified","verified_by","last_reviewed_by"])assert.match(migration,new RegExp(column))});
test("verified UEI assignment and SAM submission are complete while SAM Active remains incomplete",()=>{
  assert.match(registrationMigration,/requirement_key in \('applicant-legal-entity','sam-registration','uei','sam-financial-assistance-submitted'\)/);
  assert.match(registrationMigration,/status='complete'/);
  assert.match(registrationMigration,/requirement_key='sam-registration-active' and r\.status<>'complete'/);
  const readiness=calculateReadiness([
    makeRequirement({id:"uei",category:"registration",requirement_key:"uei",status:"complete",blocking:true,sort_order:10}),
    makeRequirement({id:"submitted",category:"registration",requirement_key:"sam-financial-assistance-submitted",status:"complete",blocking:true,sort_order:20}),
    makeRequirement({id:"active",category:"registration",requirement_key:"sam-registration-active",status:"waiting",blocking:true,sort_order:30}),
  ]);
  assert.equal(readiness.completed,2);assert.equal(readiness.total,3);assert.equal(readiness.percentage,67);
});
test("REAP remains pre-application and has not been submitted",()=>{
  assert.match(registrationMigration,/set status='pre-application'/);
  assert.doesNotMatch(registrationMigration,/set\s+submitted_at\s*=/i);
  assert.match(reapWorkspace,/Preparing · Not submitted/);
});
test("SAM activation becomes the deterministic next best action",()=>{
  const result=deriveNextBestAction({requirements:[
    makeRequirement({id:"ein",requirement_key:"ein",title:"EIN documented",blocking:true,sort_order:20}),
    makeRequirement({id:"sam",requirement_key:"sam-registration-active",title:"SAM.gov registration active",status:"waiting",blocking:true,sort_order:55}),
  ],questions:[],milestones:[],tasks:[]});
  assert.equal(result.title,"Monitor SAM.gov registration for activation");
  assert.match(result.reason,/Confirm Active status/);
});
test("federal identifier values are isolated from funding UI and analytics",()=>{
  assert.match(registrationMigration,/create table public\.organization_federal_identifiers/);
  assert.match(registrationMigration,/owner','admin'/);
  assert.doesNotMatch(fundingData,/from\("organization_federal_identifiers"\)/);
  assert.doesNotMatch(reapWorkspace,/identifier_value/);
  assert.doesNotMatch(analytics,/\buei\b|federal_identifier|identifier_value/i);
});
test("federal registration activity is sanitized and contains no identifier",()=>{
  const auditBody=registrationMigration.match(/create or replace function public\.audit_federal_identifier_presence\(\)([\s\S]*?)create trigger organization_federal_registrations_audit/)?.[1]??"";
  assert.ok(auditBody);
  assert.doesNotMatch(auditBody,/target\.identifier_value|to_jsonb/i);
  assert.match(registrationMigration,/sam_financial_assistance_registration_submitted/);
  const activityPayload=registrationMigration.match(/jsonb_build_object\(\n\s*'title','SAM\.gov Financial Assistance Registration Submitted'([\s\S]*?)\),timestamptz/)?.[1]??"";
  assert.ok(activityPayload);
  assert.doesNotMatch(activityPayload,/identifier_value|uei_value/i);
});
test("federal registration seed and activity update are idempotent",()=>{
  assert.match(registrationMigration,/on conflict\(organization_id,registration_system,registration_type\) do update/);
  assert.match(registrationMigration,/on conflict\(funding_source_id,requirement_key\) do nothing/);
  assert.match(registrationMigration,/where not exists \([\s\S]*sam_financial_assistance_registration_submitted/);
});
test("SAM Active completes the configured federal registration checklist",()=>{
  assert.match(activeRegistrationMigration,/registration_status='active'/);
  assert.match(activeRegistrationMigration,/requirement_key='sam-registration-active'/);
  assert.match(activeRegistrationMigration,/status='complete'/);
  const readiness=calculateReadiness([
    makeRequirement({id:"sam",category:"registration",requirement_key:"sam-registration",status:"complete",blocking:true,sort_order:10}),
    makeRequirement({id:"uei",category:"registration",requirement_key:"uei",status:"complete",blocking:true,sort_order:20}),
    makeRequirement({id:"submitted",category:"registration",requirement_key:"sam-financial-assistance-submitted",status:"complete",blocking:true,sort_order:30}),
    makeRequirement({id:"active",category:"registration",requirement_key:"sam-registration-active",status:"complete",blocking:true,sort_order:40}),
  ]);
  assert.equal(readiness.completed,4);assert.equal(readiness.total,4);assert.equal(readiness.percentage,100);assert.equal(readiness.blockers.length,0);
});
test("SAM activation is no longer a blocker and the next remaining requirement wins",()=>{
  const result=deriveNextBestAction({requirements:[
    makeRequirement({id:"sam",category:"registration",requirement_key:"sam-registration-active",title:"SAM.gov registration active",status:"complete",blocking:true,sort_order:10}),
    makeRequirement({id:"window",category:"applicant",requirement_key:"current-application-window-verified",title:"Current Oklahoma REAP application pathway and window verified",blocking:true,sort_order:15}),
    makeRequirement({id:"eligibility",category:"applicant",requirement_key:"applicant-eligibility",title:"Applicant eligibility confirmed for USDA REAP",blocking:true,sort_order:17}),
  ],questions:[],milestones:[],tasks:[]});
  assert.equal(result.title,"Current Oklahoma REAP application pathway and window verified");
  assert.doesNotMatch(result.title,/SAM\.gov/i);
});
test("SAM renewal date and company renewal task are stored idempotently",()=>{
  assert.match(activeRegistrationMigration,/renewal_date=date '2027-08-09'/);
  assert.match(activeRegistrationMigration,/'company','Renew SAM\.gov Registration'/);
  assert.match(activeRegistrationMigration,/date '2027-07-09'/);
  assert.match(activeRegistrationMigration,/where not exists \([\s\S]*t\.task_scope='company'[\s\S]*t\.title='Renew SAM\.gov Registration'/);
});
test("SAM activation activity is sanitized and REAP remains unsubmitted",()=>{
  assert.match(activeRegistrationMigration,/'sam_registration_activated'/);
  assert.match(activeRegistrationMigration,/'title','SAM\.gov Registration Activated'/);
  assert.doesNotMatch(activeRegistrationMigration,/set\s+submitted_at\s*=/i);
  assert.doesNotMatch(activeRegistrationMigration,/organization_federal_identifiers\s+(?:set|values)|insert into public\.organization_federal_identifiers/i);
  const payload=activeRegistrationMigration.match(/jsonb_build_object\(\n\s*'title','SAM\.gov Registration Activated'([\s\S]*?)\),timestamptz/)?.[1]??"";
  assert.ok(payload);
  assert.doesNotMatch(payload,/identifier_value|uei_value|actual_uei/i);
  assert.match(reapWorkspace,/Preparing · Not submitted/);
});
test("private dashboard displays active registration without loading the UEI value",()=>{
  assert.match(reapWorkspace,/Active · Complete/);
  assert.match(reapWorkspace,/Federal registration readiness/);
  assert.match(reapWorkspace,/renewal_date/);
  assert.doesNotMatch(fundingData,/from\("organization_federal_identifiers"\)/);
  assert.doesNotMatch(reapWorkspace,/identifier_value/);
});
test("Studio home and Project 001 overview surface REAP without overstating submission",()=>{
  assert.match(dashboardPage,/USDA REAP workspace/);
  assert.match(dashboardPage,/SAM\.gov active/);
  assert.match(dashboardPage,/Not submitted/);
  assert.match(projectOverview,/Funding \+ USDA REAP/);
  assert.match(projectOverview,/REAP application not submitted/);
  assert.doesNotMatch(dashboardPage,/identifier_value|uei_value|actual_uei/i);
});
test("Project 001 seed repair is idempotent and attaches the existing funding template",()=>{
  assert.match(projectSeedRepairMigration,/where not exists \([\s\S]*project_code='CS-001'/);
  assert.match(projectSeedRepairMigration,/on conflict\(project_id,program_name\) do nothing/);
  assert.match(projectSeedRepairMigration,/on conflict\(funding_source_id,requirement_key\) do nothing/);
  assert.match(projectSeedRepairMigration,/on conflict\(funding_source_id,phase,title\) do nothing/);
  assert.match(projectSeedRepairMigration,/program_template_id/);
});
test("Project 001 repair preserves private identifiers and conservative REAP status",()=>{
  assert.doesNotMatch(projectSeedRepairMigration,/organization_federal_identifiers|identifier_value|uei_value/i);
  assert.match(projectSeedRepairMigration,/select p\.organization_id,'NSoul LLC','SAM\.gov','Financial Assistance','assigned',\n\s*'active'/);
  assert.match(projectSeedRepairMigration,/renewal_date/);
  assert.match(projectSeedRepairMigration,/status='pre-application'/);
  assert.doesNotMatch(projectSeedRepairMigration,/set\s+submitted_at\s*=/i);
  assert.doesNotMatch(projectSeedRepairMigration,/status='approved'|status='submitted'/i);
});
