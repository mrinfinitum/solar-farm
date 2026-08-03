"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, CircleDashed, LoaderCircle } from "lucide-react";

export function StageGateControl({ projectId, gate, canManage }: {
  projectId: string;
  gate: Record<string, unknown>;
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const satisfied = Boolean(gate.satisfied);

  async function toggle() {
    const evidenceNote = satisfied ? null : window.prompt("Record the evidence supporting this gate:");
    if (!satisfied && !evidenceNote) return;
    setBusy(true); setMessage("");
    const response = await fetch(`/api/projects/${projectId}/gates/${String(gate.id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ satisfied: !satisfied, evidenceNote }),
    });
    const body = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(body.error || "Gate could not be updated.");
    router.refresh();
  }

  return <div className="project-gate-row">
    {busy ? <LoaderCircle className="spin"/> : satisfied ? <CheckCircle2/> : <CircleDashed/>}
    <div><strong>{String(gate.label)}</strong><small>{satisfied ? `Satisfied${gate.satisfied_at ? ` · ${new Date(String(gate.satisfied_at)).toLocaleDateString()}` : ""}` : "Required before advancement"}</small>{gate.evidence_note ? <small>{String(gate.evidence_note)}</small> : null}{message ? <small className="project-action-error">{message}</small> : null}</div>
    {canManage ? <button className="finder-button" type="button" onClick={toggle} disabled={busy}>{satisfied ? "Reopen" : "Verify"}</button> : null}
  </div>;
}
