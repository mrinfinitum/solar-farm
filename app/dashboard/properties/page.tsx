import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { PropertyList } from "@/components/properties/property-list";
import { requireSession } from "@/lib/auth/session";
import { getAssignableProfiles, getProperties } from "@/lib/site-finder-data";

const statuses = ["new","desktop_screening","owner_outreach","site_control","utility_screening","detailed_diligence","candidate_project","promoted_to_project","rejected"];

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [params, profile] = await Promise.all([searchParams, requireSession()]);
  const page = Math.max(1, Number(params.page) || 1);
  const [data, assignees] = await Promise.all([
    getProperties({ search: params.q, status: params.status, county: params.county, grade: params.grade, risk: params.risk, confidence: params.confidence, assignedTo: params.assigned, utility: params.utility, verified: params.verified, sort: params.sort, page }),
    getAssignableProfiles(),
  ]);
  const canEdit = ["owner","admin","developer"].includes(profile.role);
  const canScreen = ["owner","admin","developer","analyst"].includes(profile.role);
  return <>
    <div className="finder-page-head"><div><p className="finder-eyebrow">Property acquisition</p><h1>Property pipeline</h1><p>Source, screen, score, assign, and advance land opportunities with an auditable evidence trail.</p></div>{canEdit && <Link className="finder-button finder-button--primary" href="/dashboard/properties/new"><Plus size={15}/>New property</Link>}</div>
    <div className="finder-toolbar property-filter-toolbar"><form>
      <div className="finder-search"><Search size={15}/><input name="q" defaultValue={params.q} placeholder="Search address, parcel, owner, county…"/></div>
      <select className="finder-select" name="status" defaultValue={params.status || ""}><option value="">All statuses</option>{statuses.map((value) => <option value={value} key={value}>{value.replaceAll("_", " ")}</option>)}</select>
      <input className="finder-field property-county-filter" name="county" defaultValue={params.county} placeholder="County"/>
      <select className="finder-select" name="grade" defaultValue={params.grade || ""}><option value="">Any grade</option>{["A","B","C","D","F"].map((value) => <option key={value}>{value}</option>)}</select>
      <select className="finder-select" name="risk" defaultValue={params.risk || ""}><option value="">Any risk</option>{["low","moderate","high","critical","unknown"].map((value) => <option key={value}>{value}</option>)}</select>
      <select className="finder-select" name="confidence" defaultValue={params.confidence || ""}><option value="">Any confidence</option>{["high","moderate","low"].map((value) => <option key={value}>{value}</option>)}</select>
      <select className="finder-select" name="assigned" defaultValue={params.assigned || ""}><option value="">Any assignee</option>{assignees.map((person) => <option value={person.id} key={person.id}>{person.full_name || person.email}</option>)}</select>
      <input className="finder-field property-county-filter" name="utility" defaultValue={params.utility} placeholder="Utility"/>
      <select className="finder-select" name="verified" defaultValue={params.verified || ""}><option value="">Any verification</option><option value="verified">Verified</option><option value="unverified">Incomplete</option></select>
      <select className="finder-select" name="sort" defaultValue={params.sort || "updated_at:desc"}><option value="updated_at:desc">Recently updated</option><option value="score:desc">Highest score</option><option value="risk:desc">Highest risk</option><option value="total_acres:desc">Largest acreage</option><option value="asking_price:asc">Lowest price</option><option value="price_per_acre:asc">Lowest $/acre</option></select>
      <button className="finder-button">Apply</button>
    </form></div>
    {data.properties.length ? <><PropertyList properties={data.properties} canEdit={canEdit} canScreen={canScreen} assignees={assignees}/><div className="finder-pagination"><span>Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, data.count)} of {data.count}</span><div>{page > 1 && <Link className="finder-button" href={`?page=${page - 1}`}>Previous</Link>} {page * 25 < data.count && <Link className="finder-button" href={`?page=${page + 1}`}>Next</Link>}</div></div></> : <div className="finder-empty"><strong>No matching properties</strong><p>Adjust the filters or create a manual property record. No listing or parcel data is inferred automatically.</p></div>}
  </>;
}
