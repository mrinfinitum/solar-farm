import Link from "next/link";
import { Building2, Download, FileSearch, Inbox, Mail, MapPin } from "lucide-react";

import { getAdminSubmissions } from "@/lib/admin-submissions";

function display(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "Not provided" : String(value);
}

function received(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }).format(new Date(value));
}

function statusClass(status: string) {
  return status === "new" || status === "new-lead" ? "finder-status finder-status--good" : "finder-status";
}

export default async function SubmissionsPage() {
  const { configured, contacts, assessments, diligenceRequests, propertySubmissions, errors } = await getAdminSubmissions();
  const total = contacts.length + assessments.length + diligenceRequests.length + propertySubmissions.length;
  const newCount = [...contacts, ...assessments, ...diligenceRequests, ...propertySubmissions].filter((item) => item.status === "new" || item.status === "new-lead").length;

  return <>
    <div className="finder-page-head"><div><p className="finder-eyebrow">Secure public intake</p><h1>Submissions</h1><p>Review energy assessments, diligence-access requests, and property leads received through the public website.</p></div></div>

    {!configured ? <div className="finder-empty"><Inbox size={28}/><strong>Submission storage is not configured</strong><p>Add the server-only Supabase service-role key to this environment. Public forms remain unavailable in production until a submission can be stored or delivered safely.</p></div> : null}
    {errors.length ? <div className="risk-flag" role="alert">Some submission records could not be loaded. Confirm that the latest Supabase migrations have been applied.</div> : null}

    {configured ? <>
      <section className="finder-grid finder-metrics submission-metrics" aria-label="Submission summary">
        <div className="finder-card finder-metric"><span>Total submissions</span><strong>{total}</strong><small>Across all public forms</small></div>
        <div className="finder-card finder-metric"><span>New</span><strong>{newCount}</strong><small>Awaiting initial review</small></div>
        <div className="finder-card finder-metric"><span>Energy assessments</span><strong>{assessments.length}</strong><small>Commercial energy leads</small></div>
        <div className="finder-card finder-metric"><span>Commercial inquiries</span><strong>{contacts.length}</strong><small>Main website contact form</small></div>
      </section>

      {!total ? <div className="finder-empty submissions-empty"><Inbox size={30}/><strong>No submissions yet</strong><p>New public form submissions will appear here automatically after they are stored securely.</p></div> : null}

      {contacts.length ? <section className="finder-card submission-section">
        <div className="finder-card-head"><div><p className="finder-eyebrow">Primary contact form</p><h2>Commercial inquiries</h2></div><span className="evidence-badge">{contacts.length} received</span></div>
        <div className="submission-list">{contacts.map((contact) => <details className="submission-record" key={contact.id}>
          <summary><span className="submission-record-icon"><Mail aria-hidden="true"/></span><span><strong>{contact.company}</strong><small>{contact.first_name} {contact.last_name} · {display(contact.discussion_topic)}</small></span><time>{received(contact.submitted_at)}</time><span className={statusClass(contact.status)}>{contact.status}</span></summary>
          <div className="submission-detail-grid submission-detail-grid--three">
            <div><h3>Contact</h3><dl><dt>Name</dt><dd>{contact.first_name} {contact.last_name}</dd><dt>Email</dt><dd><a href={`mailto:${contact.email}`}>{contact.email}</a></dd><dt>Phone</dt><dd>{display(contact.phone)}</dd><dt>Role</dt><dd>{contact.job_title}</dd></dl></div>
            <div><h3>Facility</h3><dl><dt>Location</dt><dd>{contact.facility_location}</dd><dt>Type</dt><dd>{display(contact.facility_type)}</dd><dt>Utility</dt><dd>{display(contact.utility_provider)}</dd><dt>Annual use</dt><dd>{display(contact.annual_electricity_usage)}</dd><dt>Monthly spend</dt><dd>{display(contact.electricity_spend)}</dd></dl></div>
            <div><h3>Discussion</h3><dl><dt>Topic</dt><dd>{display(contact.discussion_topic)}</dd><dt>Timeline</dt><dd>{display(contact.desired_timeline)}</dd><dt>Message</dt><dd>{contact.message}</dd><dt>Source</dt><dd>{display(contact.source_page)}</dd></dl></div>
          </div>
          <div className="submission-actions"><a className="finder-button finder-button--primary" href={`mailto:${contact.email}?subject=${encodeURIComponent(`NSoul energy inquiry, ${contact.company}`)}`}>Reply by email</a></div>
        </details>)}</div>
      </section> : null}

      {assessments.length ? <section className="finder-card submission-section">
        <div className="finder-card-head"><div><p className="finder-eyebrow">Commercial intake</p><h2>Energy assessments</h2></div><span className="evidence-badge">{assessments.length} received</span></div>
        <div className="submission-list">{assessments.map((assessment) => <details className="submission-record" key={assessment.id}>
          <summary><span className="submission-record-icon"><Mail aria-hidden="true"/></span><span><strong>{assessment.company}</strong><small>{assessment.first_name} {assessment.last_name} · {assessment.facility_name}</small></span><time>{received(assessment.submitted_at)}</time><span className={statusClass(assessment.status)}>{assessment.status}</span></summary>
          <div className="submission-detail-grid">
            <div><h3>Contact</h3><dl><dt>Name</dt><dd>{assessment.first_name} {assessment.last_name}</dd><dt>Email</dt><dd><a href={`mailto:${assessment.email}`}>{assessment.email}</a></dd><dt>Phone</dt><dd>{display(assessment.phone)}</dd><dt>Role</dt><dd>{assessment.job_title}</dd></dl></div>
            <div><h3>Facility</h3><dl><dt>Address</dt><dd>{assessment.facility_address}, {assessment.city}, {assessment.state} {assessment.zip_code}</dd><dt>Type</dt><dd>{assessment.facility_type}</dd><dt>Utility</dt><dd>{assessment.current_utility}</dd><dt>Occupancy</dt><dd>{display(assessment.years_at_facility)}</dd></dl></div>
            <div><h3>Energy profile</h3><dl><dt>Annual use</dt><dd>{display(assessment.annual_electricity_use)}</dd><dt>Monthly spend</dt><dd>{display(assessment.monthly_electricity_spend)}</dd><dt>Blended rate</dt><dd>{display(assessment.current_blended_rate)}</dd><dt>Peak demand</dt><dd>{display(assessment.peak_demand)}</dd><dt>Meters</dt><dd>{display(assessment.electric_meters)}</dd></dl></div>
            <div><h3>Commercial goals</h3><dl><dt>Contract term</dt><dd>{display(assessment.desired_contract_term)}</dd><dt>Timeline</dt><dd>{display(assessment.desired_timeline)}</dd><dt>Existing contracts</dt><dd>{display(assessment.existing_renewable_contracts)}</dd><dt>Source</dt><dd>{display(assessment.source_page)}</dd></dl></div>
          </div>
          {assessment.energy_assessment_files?.length ? <div className="submission-files"><h3>Private utility bills</h3>{assessment.energy_assessment_files.map((file) => <a className="finder-button" href={`/api/energy-assessments/${assessment.id}/files/${file.id}`} key={file.id}><Download size={14}/>{file.original_filename} <small>{Math.ceil(file.size_bytes / 1024)} KB</small></a>)}</div> : <p className="submission-note">No utility bills were uploaded with this assessment.</p>}
        </details>)}</div>
      </section> : null}

      {diligenceRequests.length ? <section className="finder-card submission-section">
        <div className="finder-card-head"><div><p className="finder-eyebrow">Controlled access</p><h2>Project diligence requests</h2></div><span className="evidence-badge">Manual approval required</span></div>
        <div className="submission-list">{diligenceRequests.map((request) => <details className="submission-record" key={request.id}>
          <summary><span className="submission-record-icon"><FileSearch aria-hidden="true"/></span><span><strong>{request.company}</strong><small>{request.name} · {request.organization_type}</small></span><time>{received(request.submitted_at)}</time><span className={statusClass(request.status)}>{request.status}</span></summary>
          <div className="submission-detail-grid submission-detail-grid--three">
            <div><h3>Requester</h3><dl><dt>Name</dt><dd>{request.name}</dd><dt>Title</dt><dd>{request.title}</dd><dt>Email</dt><dd><a href={`mailto:${request.email}`}>{request.email}</a></dd><dt>Phone</dt><dd>{display(request.phone)}</dd></dl></div>
            <div><h3>Request</h3><dl><dt>Reason</dt><dd>{request.reason}</dd><dt>Documents</dt><dd>{request.documents_requested}</dd></dl></div>
            <div><h3>Review context</h3><dl><dt>NDA willingness</dt><dd>{request.nda_willingness}</dd><dt>Relationship</dt><dd>{request.project_relationship}</dd><dt>Source</dt><dd>{display(request.source_page)}</dd></dl></div>
          </div>
          <p className="submission-note">This request does not grant document access. Review the requester and approve access outside the public workflow.</p>
        </details>)}</div>
      </section> : null}

      {propertySubmissions.length ? <section className="finder-card submission-section">
        <div className="finder-card-head"><div><p className="finder-eyebrow">Land intake</p><h2>Property submissions</h2></div><Link href="/dashboard/imports">Open conversion tools</Link></div>
        <div className="submission-list">{propertySubmissions.map((property) => <details className="submission-record" key={property.id}>
          <summary><span className="submission-record-icon"><MapPin aria-hidden="true"/></span><span><strong>{property.property_address}</strong><small>{property.county} County · {property.name}</small></span><time>{received(property.created_at)}</time><span className={statusClass(property.status)}>{property.converted_property_id ? "converted" : property.status}</span></summary>
          <div className="submission-detail-grid submission-detail-grid--three">
            <div><h3>Submitter</h3><dl><dt>Name</dt><dd>{property.name}</dd><dt>Email</dt><dd><a href={`mailto:${property.email}`}>{property.email}</a></dd><dt>Phone</dt><dd>{display(property.phone)}</dd><dt>Type</dt><dd>{display(property.submitter_type)}</dd></dl></div>
            <div><h3>Property</h3><dl><dt>Address</dt><dd>{property.property_address}</dd><dt>County</dt><dd>{property.county}</dd><dt>Acreage</dt><dd>{display(property.approximate_acreage)}</dd><dt>Asking price</dt><dd>{property.asking_price ? `$${property.asking_price.toLocaleString()}` : "Not provided"}</dd></dl></div>
            <div><h3>Initial details</h3><dl><dt>Current use</dt><dd>{display(property.current_use)}</dd><dt>Road access</dt><dd>{display(property.road_access)}</dd><dt>Utility</dt><dd>{display(property.utility_information)}</dd><dt>Message</dt><dd>{display(property.message)}</dd></dl></div>
          </div>
          <div className="submission-actions">{property.converted_property_id ? <Link className="finder-button" href={`/dashboard/properties/${property.converted_property_id}`}><Building2 size={14}/>Open property</Link> : <Link className="finder-button finder-button--primary" href="/dashboard/imports">Review and convert</Link>}</div>
        </details>)}</div>
      </section> : null}
    </> : null}
  </>;
}
