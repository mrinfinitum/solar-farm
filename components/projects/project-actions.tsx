"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, ArrowRight, HeartPulse, LoaderCircle, Pencil } from "lucide-react";
import { PROJECT_HEALTH_VALUES, PROJECT_STAGES, titleCaseStatus } from "@/lib/projects/domain";

export function ProjectActions({ projectId, currentStage, role, project }: { projectId: string; currentStage: string; role: string; project: { project_name: string; location: string | null; county: string | null; proposed_capacity_mw_dc: number | null; proposed_capacity_mw_ac: number | null; target_operation_date: string | null; summary: string | null } }) {
  const router = useRouter();
  const [mode, setMode] = useState<"edit" | "stage" | "health" | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const canOperate = ["owner", "admin", "developer"].includes(role);
  const canAdmin = ["owner", "admin"].includes(role);

  async function submitStage(formData: FormData) {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/projects/${projectId}/stage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nextStage: formData.get("nextStage"), reason: formData.get("reason") || null, overrideReason: formData.get("overrideReason") || null, decisionId: formData.get("decisionId") || null }) });
    const body = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(body.error || "Stage could not be advanced.");
    setMode(null); router.refresh();
  }

  async function submitHealth(formData: FormData) {
    setBusy(true); setMessage("");
    const override = formData.get("health");
    const payload = override ? { mode: "override", health: override, reason: formData.get("reason") } : { mode: "recalculate" };
    const response = await fetch(`/api/projects/${projectId}/health`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const body = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(body.error || "Health could not be updated.");
    setMode(null); router.refresh();
  }

  async function submitEdit(formData: FormData) {
    setBusy(true); setMessage("");
    const numberOrNull=(name:string)=>formData.get(name)?Number(formData.get(name)):null;
    const response=await fetch(`/api/projects/${projectId}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({project_name:formData.get("project_name"),location:formData.get("location")||null,county:formData.get("county")||null,proposed_capacity_mw_dc:numberOrNull("proposed_capacity_mw_dc"),proposed_capacity_mw_ac:numberOrNull("proposed_capacity_mw_ac"),target_operation_date:formData.get("target_operation_date")||null,summary:formData.get("summary")||null})});
    const body=await response.json();setBusy(false);if(!response.ok)return setMessage(body.error||"Project could not be updated.");setMode(null);router.refresh();
  }

  async function archiveProject() {
    if (!window.confirm("Archive this project? It will leave default portfolio views but remain auditable.")) return;
    setBusy(true); const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" }); setBusy(false);
    if (!response.ok) return setMessage("Project could not be archived.");
    router.push("/dashboard/projects"); router.refresh();
  }

  return <div className="project-action-cluster">
    {canOperate ? <><button className="finder-button" onClick={() => setMode("edit")}><Pencil size={15}/>Edit</button><button className="finder-button finder-button--primary" onClick={() => setMode("stage")}><ArrowRight size={15}/>Advance stage</button><button className="finder-button" onClick={() => setMode("health")}><HeartPulse size={15}/>Health</button></> : null}
    {canAdmin ? <button className="finder-icon-button" onClick={archiveProject} aria-label="Archive project" title="Archive project"><Archive size={16}/></button> : null}
    {mode ? <div className="project-dialog-backdrop" role="presentation" onMouseDown={() => !busy && setMode(null)}><section className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
      <p className="finder-eyebrow">Controlled project action</p><h2 id="project-dialog-title">{mode === "edit" ? "Edit project profile" : mode === "stage" ? "Advance development stage" : "Update project health"}</h2>
      {mode === "edit"?<form action={submitEdit} className="project-dialog-form"><label>Project name<input className="finder-field" name="project_name" defaultValue={project.project_name} required/></label><label>Location<input className="finder-field" name="location" defaultValue={project.location||""}/></label><label>County<input className="finder-field" name="county" defaultValue={project.county||""}/></label><label>Capacity MW DC<input className="finder-field" type="number" step="any" name="proposed_capacity_mw_dc" defaultValue={project.proposed_capacity_mw_dc??""}/></label><label>Capacity MW AC<input className="finder-field" type="number" step="any" name="proposed_capacity_mw_ac" defaultValue={project.proposed_capacity_mw_ac??""}/></label><label>Target operation<input className="finder-field" type="date" name="target_operation_date" defaultValue={project.target_operation_date||""}/></label><label className="project-form-wide">Summary<textarea className="finder-textarea" name="summary" defaultValue={project.summary||""}/></label><button disabled={busy} className="finder-button finder-button--primary">{busy?<LoaderCircle className="spin"/>:<Pencil/>}Save project</button></form>:mode === "stage" ? <form action={submitStage} className="project-dialog-form"><label>Next canonical stage<select className="finder-select" name="nextStage" defaultValue={currentStage}>{PROJECT_STAGES.map((stage)=><option key={stage} value={stage}>{titleCaseStatus(stage)}</option>)}</select></label><label>Transition note<textarea className="finder-textarea" name="reason" placeholder="Why is the project ready to move?"/></label>{canAdmin ? <details><summary>Gate override (owner/admin only)</summary><label>Written override reason<textarea className="finder-textarea" name="overrideReason"/></label><label>Supporting decision record ID<input className="finder-field" name="decisionId" placeholder="UUID required for override"/></label></details>:null}<button disabled={busy} className="finder-button finder-button--primary" type="submit">{busy?<LoaderCircle className="spin" size={15}/>:<ArrowRight size={15}/>}Check gates and advance</button></form> : <form action={submitHealth} className="project-dialog-form"><p>Recalculate from current blockers and critical milestones, or apply an auditable administrator override.</p>{canAdmin?<><label>Manual override (optional)<select className="finder-select" name="health" defaultValue=""><option value="">Use deterministic health</option>{PROJECT_HEALTH_VALUES.map((health)=><option key={health} value={health}>{titleCaseStatus(health)}</option>)}</select></label><label>Override reason<textarea className="finder-textarea" name="reason" placeholder="Required for a manual override"/></label></>:null}<button disabled={busy} className="finder-button finder-button--primary" type="submit">{busy?<LoaderCircle className="spin" size={15}/>:<HeartPulse size={15}/>}Update health</button></form>}
      {message?<p className="project-action-error" role="alert">{message}</p>:null}<button className="finder-button" onClick={()=>setMode(null)} disabled={busy}>Cancel</button>
    </section></div>:null}
  </div>;
}
