"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, FolderKanban, Loader2 } from "lucide-react";

export function PropertyActions({ id, canConvert, canEdit = true }: { id: string; canConvert: boolean; canEdit?: boolean }) {
  const [loading, setLoading] = useState<"promote" | "archive" | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function act(action: "promote-to-project" | "archive") {
    const prompt = action === "archive" ? "Archive this property?" : "Promote this property into a project? The property and audit history will remain linked.";
    if (!confirm(prompt)) return;
    setLoading(action === "archive" ? "archive" : "promote");
    const response = await fetch(`/api/properties/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const result = await response.json();
    setLoading(null);
    if (!response.ok) return setMessage(result.error || "Action failed.");
    router.push(action === "archive" ? "/dashboard/properties" : "/dashboard/projects");
    router.refresh();
  }
  return <div className="property-action-group">
    {canEdit && <button onClick={() => act("archive")} disabled={Boolean(loading)} className="finder-button"><Archive size={14} />{loading === "archive" ? "Archiving…" : "Archive"}</button>}
    {canConvert && <button onClick={() => act("promote-to-project")} disabled={Boolean(loading)} className="finder-button finder-button--primary">{loading === "promote" ? <Loader2 className="spin" size={14} /> : <FolderKanban size={14} />}Promote to Project</button>}
    {message && <span className="risk-flag" role="alert">{message}</span>}
  </div>;
}
