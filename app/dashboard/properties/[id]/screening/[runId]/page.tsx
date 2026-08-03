import { notFound } from "next/navigation";

import { ScreeningWorkspace } from "@/components/properties/screening-workspace";
import { requireSession } from "@/lib/auth/session";
import { getProperty, getPropertyScreeningRun } from "@/lib/site-finder-data";

export default async function ScreeningRunPage({ params }: { params: Promise<{ id: string; runId: string }> }) {
  const { id, runId } = await params; const profile = await requireSession();
  const [property, run] = await Promise.all([getProperty(id), getPropertyScreeningRun(id, runId)]); if (!property || !run) notFound();
  return <><div className="finder-page-head"><div><p className="finder-eyebrow">Preliminary property intelligence</p><h1>{property.name || property.project_name || property.address_line_1}</h1><p>Run {run.id.slice(0,8)} · {new Date(run.started_at).toLocaleString()}</p></div></div><ScreeningWorkspace propertyId={id} initialRun={run} canDecide={["owner","admin","developer"].includes(profile.role)}/></>;
}
