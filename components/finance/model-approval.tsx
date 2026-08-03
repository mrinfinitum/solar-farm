"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export function ModelApproval({ projectId, modelId, disabled }: { projectId: string; modelId: string; disabled: boolean }) {
  const router=useRouter();const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  async function approve(){const note=window.prompt("Document the approval decision (minimum 10 characters):");if(!note)return;setBusy(true);const response=await fetch(`/api/projects/${projectId}/finance/models/${modelId}/approve`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({decisionNote:note})});const payload=await response.json();setBusy(false);if(!response.ok)return setMessage(payload.error||"Approval failed");router.refresh();}
  return <div><button className="finder-button finder-button--primary" disabled={disabled||busy} onClick={approve}>{busy?<Loader2 className="spin"/>:<CheckCircle2/>}Approve current version</button>{message?<small className="finance-form-error">{message}</small>:null}</div>;
}
