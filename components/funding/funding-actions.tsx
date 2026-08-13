"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Plus, X } from "lucide-react";

const fieldsByKind = {
  communications: [
    ["subject","Subject","text"],["summary","Summary","textarea"],["communication_type","Type","select","email,phone,meeting,video-call,letter,portal-message,note"],
    ["direction","Direction","select","inbound,outbound,internal"],["communication_date","Date","datetime-local"],["follow_up_date","Follow-up date","date"],
  ],
  questions: [["question","Question or information request","textarea"],["source","Source","text"],["received_at","Received","datetime-local"],["due_date","Due date","date"]],
  costs: [["category","Category","text"],["description","Description","textarea"],["vendor","Vendor","text"],["estimated_cost","Estimated cost","number"],["actual_cost","Actual cost","number"],["eligible_amount","Eligible amount","number"],["eligibility_status","Eligibility","select","unknown,potentially-eligible,confirmed-eligible,ineligible,needs-review"]],
  reimbursements: [["request_number","Request number","text"],["eligible_cost_basis","Eligible cost basis","number"],["requested_amount","Requested amount","number"],["status","Status","select","preparing,submitted,under-review,information-requested,approved,partially-paid,paid,denied"],["notes","Notes","textarea"]],
} as const;

type Kind = keyof typeof fieldsByKind;

export function FundingAction({ projectId, sourceId, kind, label }: { projectId: string; sourceId: string; kind: Kind; label: string }) {
  const router = useRouter(); const [open,setOpen]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function submit(formData: FormData) {
    setBusy(true);setError("");
    const body: Record<string, unknown> = { funding_source_id: sourceId };
    for (const [key,,type] of fieldsByKind[kind]) {
      const value=String(formData.get(key)??"").trim(); if (!value) continue;
      body[key]=type==="number"?Number(value):type==="datetime-local"?new Date(value).toISOString():value;
    }
    if (kind==="reimbursements") { body.eligible_cost_basis ??= 0; body.requested_amount ??= 0; body.status ??= "preparing"; }
    if (kind==="communications") { body.communication_type ??= "note"; body.direction ??= "internal"; body.communication_date ??= new Date().toISOString(); }
    if (kind==="questions") { body.received_at ??= new Date().toISOString(); body.status="open"; }
    if (kind==="costs") { body.estimated_cost ??= 0; body.eligibility_status ??= "unknown"; }
    const response=await fetch(`/api/projects/${projectId}/funding/${kind}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok){setError(payload.error??"Unable to save record");setBusy(false);return;}
    setOpen(false);setBusy(false);router.refresh();
  }
  return <><button className="finder-button finder-button--primary" onClick={()=>setOpen(true)}><Plus size={15}/>{label}</button>{open?<div className="funding-modal-backdrop" role="presentation"><section className="funding-modal" role="dialog" aria-modal="true" aria-labelledby={`funding-${kind}-title`}><header><div><p className="finder-eyebrow">Funding workflow</p><h3 id={`funding-${kind}-title`}>{label}</h3></div><button onClick={()=>setOpen(false)} aria-label="Close"><X/></button></header><form action={submit}>{fieldsByKind[kind].map(([key,label,type,options])=><label key={key}><span>{label}</span>{type==="textarea"?<textarea name={key} rows={4}/>:type==="select"?<select name={key} defaultValue={options?.split(",")[0]}>{options?.split(",").map(option=><option key={option} value={option}>{option.replaceAll("-"," ")}</option>)}</select>:<input name={key} type={type} step={type==="number"?"0.01":undefined}/>}</label>)}{error?<p className="funding-form-error" role="alert">{error}</p>:null}<button className="finder-button finder-button--primary" disabled={busy} type="submit"><Check size={15}/>{busy?"Saving…":"Save record"}</button></form></section></div>:null}</>;
}

export function RequirementStatusControl({ projectId, requirementId, status, canEdit }: { projectId:string;requirementId:string;status:string;canEdit:boolean }) {
  const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  if(!canEdit)return <span className={`funding-status funding-status--${status}`}>{status.replaceAll("-"," ")}</span>;
  async function update(next:string){setBusy(true);setError("");const response=await fetch(`/api/projects/${projectId}/funding/requirements/${requirementId}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status:next})});if(!response.ok){const payload=await response.json().catch(()=>({}));setError(payload.error??"Update failed");}else router.refresh();setBusy(false)}
  return <div className="funding-status-control"><select aria-label="Requirement status" disabled={busy} value={status} onChange={(event)=>update(event.target.value)}>{["not-started","in-progress","waiting","complete","not-applicable","blocked","needs-review"].map(value=><option key={value}>{value}</option>)}</select>{error?<small role="alert">{error}</small>:null}</div>;
}

export function FundingRecordStatusControl({projectId,resource,recordId,status,statuses,canEdit,label}:{projectId:string;resource:"sources"|"questions"|"reimbursements";recordId:string;status:string;statuses:string[];canEdit:boolean;label:string}){
  const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  if(!canEdit)return <span className={`funding-status funding-status--${status}`}>{status.replaceAll("-"," ")}</span>;
  async function update(next:string){setBusy(true);setError("");const response=await fetch(`/api/projects/${projectId}/funding/${resource}/${recordId}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status:next})});if(!response.ok){const payload=await response.json().catch(()=>({}));setError(payload.error??"Update failed");}else router.refresh();setBusy(false)}
  return <div className="funding-status-control"><select aria-label={label} disabled={busy} value={status} onChange={(event)=>update(event.target.value)}>{statuses.map(value=><option key={value} value={value}>{value.replaceAll("-"," ")}</option>)}</select>{error?<small role="alert">{error}</small>:null}</div>;
}

export function ReimbursementPaymentAction({projectId,recordId,canEdit}:{projectId:string;recordId:string;canEdit:boolean}){
  const router=useRouter();const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  if(!canEdit)return null;
  async function submit(formData:FormData){setBusy(true);setError("");const amount=Number(formData.get("paid_amount"));const date=String(formData.get("paid_date")??"");const response=await fetch(`/api/projects/${projectId}/funding/reimbursements/${recordId}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status:"paid",paid_amount:amount,paid_at:new Date(`${date}T12:00:00Z`).toISOString()})});if(!response.ok){const payload=await response.json().catch(()=>({}));setError(payload.error??"Unable to record payment");setBusy(false);return}setOpen(false);setBusy(false);router.refresh()}
  return <><button className="finder-button finder-button--quiet" type="button" onClick={()=>setOpen(true)}>Record payment</button>{open?<div className="funding-modal-backdrop" role="presentation"><section className="funding-modal" role="dialog" aria-modal="true" aria-labelledby={`payment-${recordId}`}><header><div><p className="finder-eyebrow">Reimbursement</p><h3 id={`payment-${recordId}`}>Record payment received</h3></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close"><X/></button></header><form action={submit}><label><span>Paid amount</span><input name="paid_amount" type="number" min="0.01" step="0.01" required/></label><label><span>Paid date</span><input name="paid_date" type="date" required/></label>{error?<p className="funding-form-error" role="alert">{error}</p>:null}<button className="finder-button finder-button--primary" disabled={busy}>{busy?"Saving…":"Confirm payment"}</button></form></section></div>:null}</>;
}

export function FundingSourceAction({projectId}:{projectId:string}){
  const router=useRouter();const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  async function submit(formData:FormData){setBusy(true);setError("");const body={funding_type:formData.get("funding_type"),program_name:formData.get("program_name"),provider_name:formData.get("provider_name")||null,status:formData.get("status"),notes:formData.get("notes")||null};const response=await fetch(`/api/projects/${projectId}/funding/sources`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const payload=await response.json().catch(()=>({}));if(!response.ok){setError(payload.error??"Unable to add funding source");setBusy(false);return}if(Array.isArray(payload.initializationWarnings)&&payload.initializationWarnings.length){setError(`Funding source created. ${payload.initializationWarnings.join(" ")}`);setBusy(false);router.refresh();return}setOpen(false);setBusy(false);router.refresh()}
  return <><button className="finder-button finder-button--primary" type="button" onClick={()=>setOpen(true)}><Plus size={15}/>Add funding source</button>{open?<div className="funding-modal-backdrop" role="presentation"><section className="funding-modal" role="dialog" aria-modal="true" aria-labelledby="funding-source-title"><header><div><p className="finder-eyebrow">Project funding</p><h3 id="funding-source-title">Add funding source</h3></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close"><X/></button></header><form action={submit}><label><span>Funding type</span><select name="funding_type">{["grant","tax-credit","debt","equity","equipment-financing","incentive","other"].map(value=><option key={value}>{value}</option>)}</select></label><label><span>Program name</span><input name="program_name" required minLength={2}/></label><label><span>Provider</span><input name="provider_name"/></label><label><span>Status</span><select name="status">{["researching","planning","pre-application","preparing","future"].map(value=><option key={value}>{value}</option>)}</select></label><label><span>Notes</span><textarea name="notes" rows={3}/></label>{error?<p className="funding-form-error" role="alert">{error}</p>:null}<button className="finder-button finder-button--primary" disabled={busy}>{busy?"Saving…":"Add source"}</button></form></section></div>:null}</>;
}

export function LogInteractionButton(props:{projectId:string;sourceId:string}){return <FundingAction {...props} kind="communications" label="Log interaction"/>}

export function RequirementDocumentLinker({projectId,requirements,documents}:{projectId:string;requirements:Array<{id:string;title:string}>;documents:Array<{id:string;title?:string|null;file_name?:string|null}>}){
  const router=useRouter();const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  async function submit(formData:FormData){setBusy(true);setMessage("");const response=await fetch(`/api/projects/${projectId}/funding/requirement-documents`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({requirement_id:formData.get("requirement_id"),document_id:formData.get("document_id")})});setBusy(false);if(!response.ok){const payload=await response.json().catch(()=>({}));setMessage(payload.error??"Unable to link document");return}setMessage("Document linked");router.refresh()}
  if(!requirements.length||!documents.length)return null;
  return <form className="funding-link-form" action={submit}><label><span>Requirement</span><select name="requirement_id">{requirements.map(row=><option key={row.id} value={row.id}>{row.title}</option>)}</select></label><label><span>Existing project document</span><select name="document_id">{documents.map(row=><option key={row.id} value={row.id}>{row.title??row.file_name??"Project document"}</option>)}</select></label><button className="finder-button finder-button--primary" disabled={busy}>{busy?"Linking…":"Link evidence"}</button>{message?<small role="status">{message}</small>:null}</form>;
}

export function FundingContactLinker({projectId,sourceId,contacts}:{projectId:string;sourceId:string;contacts:Array<{id:string;first_name?:string|null;last_name?:string|null;company?:string|null}>}){
  const router=useRouter();const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  async function submit(formData:FormData){setBusy(true);setMessage("");const response=await fetch(`/api/projects/${projectId}/funding/contacts`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({funding_source_id:sourceId,contact_id:formData.get("contact_id"),relationship_type:formData.get("relationship_type"),is_primary:formData.get("is_primary")==="on"})});setBusy(false);if(!response.ok){const payload=await response.json().catch(()=>({}));setMessage(payload.error??"Unable to link contact");return}setMessage("Contact linked");router.refresh()}
  if(!contacts.length)return <p>Create the contact in the organization contact library before assigning a funding relationship.</p>;
  return <form className="funding-link-form" action={submit}><label><span>Existing contact</span><select name="contact_id">{contacts.map(row=>{const name=[row.first_name,row.last_name].filter(Boolean).join(" ")||row.company||"Contact";return <option key={row.id} value={row.id}>{name}</option>})}</select></label><label><span>Funding relationship</span><select name="relationship_type">{["usda-program-specialist","usda-loan-specialist","usda-state-energy-coordinator","usda-area-specialist","grant-consultant","lender","engineer","environmental-reviewer","other"].map(value=><option key={value}>{value}</option>)}</select></label><label className="funding-check"><input type="checkbox" name="is_primary"/> Primary funding contact</label><button className="finder-button finder-button--primary" disabled={busy}>{busy?"Linking…":"Link contact"}</button>{message?<small role="status">{message}</small>:null}</form>;
}
