"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, FolderKanban, Loader2, RotateCcw } from "lucide-react";

export function PropertyActions({ id, canConvert, canEdit = true, archived = false, unresolvedRiskCount = 0 }: { id: string; canConvert: boolean; canEdit?: boolean; archived?: boolean; unresolvedRiskCount?: number }) {
  const [loading, setLoading] = useState<"promote" | "archive" | "restore" | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function act(action: "promote-to-project" | "archive" | "restore") {
    const prompt = action === "archive" ? "Archive this property?" : action === "restore" ? "Restore this property to the New stage?" : `Promote this property into a project? The property and audit history will remain linked.${unresolvedRiskCount ? ` Warning: ${unresolvedRiskCount} unresolved risk flag${unresolvedRiskCount === 1 ? "" : "s"} will be carried into the project.` : ""}`;
    if (!confirm(prompt)) return;
    setLoading(action === "archive" ? "archive" : action === "restore" ? "restore" : "promote");
    const response = await fetch(`/api/properties/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const result = await response.json();
    setLoading(null);
    if (!response.ok) return setMessage(result.error || "Action failed.");
    router.push(action === "promote-to-project" ? "/dashboard/projects" : action === "archive" ? "/dashboard/properties" : `/dashboard/properties/${id}`);
    router.refresh();
  }
  return <div className="property-action-group">
    {canEdit && archived && <button onClick={() => act("restore")} disabled={Boolean(loading)} className="finder-button"><RotateCcw size={14} />{loading === "restore" ? "Restoring…" : "Restore"}</button>}
    {canEdit && !archived && <button onClick={() => act("archive")} disabled={Boolean(loading)} className="finder-button"><Archive size={14} />{loading === "archive" ? "Archiving…" : "Archive"}</button>}
    {canConvert && <button onClick={() => act("promote-to-project")} disabled={Boolean(loading)} className="finder-button finder-button--primary">{loading === "promote" ? <Loader2 className="spin" size={14} /> : <FolderKanban size={14} />}Promote to Project</button>}
    {message && <span className="risk-flag" role="alert">{message}</span>}
  </div>;
}
