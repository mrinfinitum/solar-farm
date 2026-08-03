import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

import { StartScreeningButton } from "@/components/properties/start-screening-button";
import { requireSession } from "@/lib/auth/session";
import { getProperty, getPropertyScreeningRuns } from "@/lib/site-finder-data";

export default async function PropertyScreeningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const profile = await requireSession();
  const [property, runs] = await Promise.all([getProperty(id), getPropertyScreeningRuns(id)]);
  if (!property) return <div className="finder-empty"><strong>Property not found</strong></div>;
  const canRun = ["owner","admin","developer","analyst"].includes(profile.role);
  return <><div className="finder-page-head"><div><p className="finder-eyebrow">Property intelligence</p><h1>Site screening</h1><p>{property.address_line_1}, {property.city}, {property.state}. Results are preliminary diligence aids, not approvals or professional conclusions.</p></div><Link className="finder-button" href={`/dashboard/properties/${id}`}>Property record</Link></div>
    {canRun && <StartScreeningButton propertyId={id}/>}<section className="finder-card"><div className="finder-card-head"><div><h2>Screening history</h2><p>Every run retains provider, freshness, error, proposal, and decision history.</p></div></div>{runs.length ? <div className="screening-history">{runs.map(run => <Link key={run.id} href={`/dashboard/properties/${id}/screening/${run.id}`}><span className={`finder-status finder-status--${run.status}`}>{run.status.replaceAll("_", " ")}</span><strong>{new Date(run.started_at).toLocaleString()}</strong><small>{run.successful_provider_count} successful · {run.warning_count} unavailable/warning · {run.proposed_change_count} proposals</small><ArrowRight/></Link>)}</div> : <div className="finder-empty"><Play/><strong>No screening runs</strong><p>Start a run to check configured sources. Unconfigured categories will be clearly marked unavailable.</p></div>}</section></>;
}
