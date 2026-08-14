import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Banknote, CheckCircle2, CircleDashed, FileWarning, Landmark, PlugZap, ShieldAlert, Users, Wrench } from "lucide-react";
import { calculateCapitalStack, titleCaseStatus } from "@/lib/projects/domain";
import type { ProjectCommandData } from "@/types/project-command";
import { StageGateControl } from "@/components/projects/stage-gate-control";
import { ProjectRecordForm } from "@/components/projects/project-record-form";

const money=(value:unknown)=>`$${Number(value||0).toLocaleString(undefined,{maximumFractionDigits:0})}`;
const date=(value:unknown)=>value?new Date(String(value)).toLocaleDateString():"Not scheduled";
const first=<T,>(rows:T[])=>rows[0];

export function ProjectOverview({project,role}:{project:ProjectCommandData;role:string}){
  const blocker=project.project_blockers.find(row=>["open","monitoring"].includes(String(row.status)));
  const nextMilestone=[...project.project_milestones].filter(row=>!['complete','waived','cancelled'].includes(String(row.status))&&row.target_date).sort((a,b)=>String(a.target_date).localeCompare(String(b.target_date)))[0];
  const interconnection=first(project.interconnection_requests);const offtaker=first(project.offtaker_opportunities);const ppa=first(project.ppa_scenarios);const budget=first(project.project_budget_versions);const stack=first(project.capital_stack_versions);
  const reap=project.project_funding_sources.find(source=>source.program_name==="USDA REAP"&&!source.archived_at);
  const stackItems=project.capital_stack_items.filter(item=>item.capital_stack_version_id===stack?.id).map(item=>({amount:Number(item.amount||0),status:String(item.status),capitalType:String(item.capital_type)}));
  const capital=calculateCapitalStack(Number(stack?.approved_project_cost||budget?.total_project_cost||project.current_budget||0),stackItems);
  const gateTotal=project.project_stage_gates.filter(gate=>gate.from_stage===project.project_stage&&gate.required).length;
  const gateComplete=project.project_stage_gates.filter(gate=>gate.from_stage===project.project_stage&&gate.required&&gate.satisfied).length;
  const missingDocuments=[
    !project.documents.some(doc=>doc.document_type==="interconnection")&&"Interconnection evidence",
    !project.documents.some(doc=>["production-model","engineering"].includes(String(doc.document_type)))&&"Production model",
    !project.documents.some(doc=>doc.document_type==="PPA")&&"PPA or term sheet",
  ].filter(Boolean);
  return <div className="project-command-overview">
    <section className="project-readiness-rail"><div><span>Current stage</span><strong>{titleCaseStatus(project.project_stage)}</strong><small>{gateComplete}/{gateTotal||0} active gates complete</small></div><div><span>Health</span><strong className={`project-health-text project-health-text--${project.project_health}`}>{titleCaseStatus(project.project_health)}</strong><small>{blocker?String(blocker.title):"No active primary blocker"}</small></div><div><span>Due next</span><strong>{String(nextMilestone?.task_name||"No milestone scheduled")}</strong><small>{date(nextMilestone?.target_date)}</small></div><div><span>Capital readiness</span><strong>{capital.fullyFinanced?"Funded":"Gap remains"}</strong><small>{money(capital.capitalGap)} uncommitted</small></div></section>
    <div className="project-command-grid"><section className="project-command-main">
      <div className="project-command-section-head"><div><p className="finder-eyebrow">Readiness overview</p><h2>Development workstreams</h2></div><span>Updated {date(project.updated_at)}</span></div>
      <div className="project-workstream-list">
        <ProjectWorkstream href="interconnection" icon={PlugZap} label="Interconnection" value={titleCaseStatus(String(interconnection?.status||project.interconnection_status))} detail={interconnection?.next_action?String(interconnection.next_action):"Utility evidence and next action not yet recorded"}/>
        <ProjectWorkstream href="engineering" icon={Wrench} label="Engineering + EPC" value={titleCaseStatus(project.engineering_status)} detail={`${project.engineering_deliverables.length} deliverables · ${project.epc_proposals.length} EPC proposals`}/>
        <ProjectWorkstream href="offtakers" icon={Users} label="Off-taker" value={titleCaseStatus(String(offtaker?.status||project.offtaker_status))} detail={offtaker?.next_action?String(offtaker.next_action):"No committed off-taker represented"}/>
        <ProjectWorkstream href="ppa" icon={Landmark} label="PPA" value={titleCaseStatus(String(ppa?.status||"not_started"))} detail={ppa?.status==="executed"?"Executed status supported by signed-document confirmation":"Unsigned scenarios remain non-binding"}/>
        <ProjectWorkstream href="permitting" icon={ShieldAlert} label="Permits + diligence" value={titleCaseStatus(project.permitting_status)} detail={`${project.permit_requirements.filter(row=>row.status==="approved").length}/${project.permit_requirements.length} permit requirements approved`}/>
        <ProjectWorkstream href="finance" icon={Banknote} label="Budget + capital stack" value={money(capital.totalProjectCost)} detail={`${money(capital.committedCapital)} committed · ${money(capital.capitalGap)} gap`}/>
        <ProjectWorkstream href="funding" icon={Landmark} label="Funding + USDA REAP" value={reap?titleCaseStatus(String(reap.status)):"Not configured"} detail={reap?.submitted_at?"Application submission recorded":"SAM.gov active · REAP application not submitted"}/>
      </div>
      <div className="project-command-section-head project-command-section-head--compact"><div><p className="finder-eyebrow">Stage control</p><h2>Required evidence</h2></div><Link href={`/dashboard/projects/${project.id}/activity`}>Audit history <ArrowUpRight size={13}/></Link></div>
      <div className="project-gate-list">{project.project_stage_gates.filter(gate=>gate.from_stage===project.project_stage).map(gate=><StageGateControl key={String(gate.id)} projectId={project.id} gate={gate} canManage={["owner","admin","developer"].includes(role)}/>)}{!gateTotal?<div><CircleDashed/><div><strong>No configured gate for this transition</strong><small>Stage selection still requires an authorized project operator.</small></div></div>:null}</div>
      <div className="project-command-section-head project-command-section-head--compact"><div><p className="finder-eyebrow">Controls</p><h2>Blockers and decisions</h2></div><div className="project-inline-actions"><ProjectRecordForm projectId={project.id} section="blockers"/><ProjectRecordForm projectId={project.id} section="decisions"/></div></div>
    </section><aside className="project-command-aside">
      <section><p className="finder-eyebrow">Current blocker</p>{blocker?<><AlertTriangle className="project-risk-icon"/><h3>{String(blocker.title)}</h3><p>{String(blocker.description||"No description recorded.")}</p><dl><div><dt>Severity</dt><dd>{titleCaseStatus(String(blocker.severity))}</dd></div><div><dt>Target</dt><dd>{date(blocker.target_resolution_date)}</dd></div></dl></>:<><CheckCircle2 className="project-ok-icon"/><h3>No active blocker</h3><p>Health will continue to respond to critical milestones and newly recorded blockers.</p></>}</section>
      <section><p className="finder-eyebrow">Missing evidence</p><FileWarning/><h3>{missingDocuments.length?`${missingDocuments.length} priority items`:'Core evidence present'}</h3><ul>{missingDocuments.map(item=><li key={String(item)}>{String(item)}</li>)}{!missingDocuments.length?<li>Review document expiry and version status.</li>:null}</ul><Link href={`/dashboard/projects/${project.id}/documents`}>Open document room <ArrowUpRight size={13}/></Link></section>
      <section><p className="finder-eyebrow">Incentives</p><strong className="project-aside-value">{money(project.potential_incentives)}</strong><p>Potential value · review required</p><small>{money(project.confirmed_incentives)} confirmed by current records. No program is treated as permanently active.</small></section>
    </aside></div>
  </div>;
}

function ProjectWorkstream({href,icon:Icon,label,value,detail}:{href:string;icon:typeof PlugZap;label:string;value:string;detail:string}){return <Link href={href}><span><Icon/></span><div><strong>{label}</strong><small>{detail}</small></div><b>{value}</b><ArrowUpRight/></Link>}
