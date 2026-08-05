import type { Metadata } from "next";
import { AlertCircle, ArrowRight, CheckCircle2, FileText, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { DataRoomRequestForm } from "@/components/forms/data-room-request-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageEvent } from "@/components/ui/page-event";
import { TrackedLink } from "@/components/ui/tracked-link";
import { counterparties, diligenceDocuments, diligenceSections, projectRisks } from "@/lib/content/project-diligence";
import { developmentMilestones, project } from "@/lib/project-data";
import { isTermSheetAvailable } from "@/lib/term-sheet";

const description = `Review current diligence status, dependencies, and available documents for the ${project.name}.`;
export const metadata: Metadata = { title: `Project Diligence | ${project.name}`, description, alternates: { canonical: "/project-diligence" }, openGraph: { title: `Project Diligence | ${project.name}`, description, url: "/project-diligence", type: "website" } };

export default function ProjectDiligencePage() {
  const termSheetAvailable = isTermSheetAvailable();
  return <><PageEvent event="diligence_view" /><SiteHeader termSheetAvailable={termSheetAvailable} /><main className="public-site diligence-page">
    <section className="diligence-hero"><div className="container"><p className="eyebrow">Project diligence</p><h1>Understand what is complete, what is pending, and what still must be proven.</h1><p>NSoul is developing the {project.name} through a staged process involving land, utility, engineering, commercial, financing, permitting, and legal review.</p><span>Information as of {project.informationDate}</span></div></section>

    <section className="section diligence-register" aria-labelledby="diligence-register-title"><div className="container"><div className="trust-section-heading"><div><p className="eyebrow">Status register</p><h2 id="diligence-register-title">Project information, without implied approvals.</h2></div><p>Status reflects the typed project record as of the information date. Unknown items are shown as not yet published rather than inferred.</p></div>
      <div className="diligence-sections">{diligenceSections.map((section) => <section key={section.title}><h3>{section.title}</h3><dl>{section.items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd><span>{item.value || "Not yet published"}</span><Status status={item.status} /></dd></div>)}</dl></section>)}</div>
    </div></section>

    <section className="section diligence-counterparties" aria-labelledby="counterparty-title"><div className="container"><div className="trust-section-heading"><div><p className="eyebrow">Third-party credibility</p><h2 id="counterparty-title">Roles are shown before names are earned.</h2></div><p>Organizations are named publicly only when confirmed and permitted. Contacted vendors are not described as partners.</p></div><div className="counterparty-list">{counterparties.map((party) => <article key={party.category}><span>{party.category}</span><h3>{party.displayPermission && party.organizationName ? party.organizationName : party.role}</h3><p>{party.publicDescription}</p><small>Status: {party.status}</small></article>)}</div></div></section>

    <section className="section diligence-schedule" aria-labelledby="schedule-title"><div className="container"><div className="trust-section-heading"><div><p className="eyebrow">Development schedule</p><h2 id="schedule-title">Six gated stages, with later work dependent on earlier proof.</h2></div></div><ol>{developmentMilestones.map((milestone, index) => <li key={milestone.title}><span>{String(index + 1).padStart(2, "0")}</span><Status status={mapMilestoneStatus(milestone.status)} /><div><h3>{milestone.title}</h3><p>{milestone.description}</p></div></li>)}</ol></div></section>

    <section className="section diligence-risks" aria-labelledby="risk-title"><div className="container"><div className="trust-section-heading"><div><p className="eyebrow">Risks and dependencies</p><h2 id="risk-title">Professional transparency means naming what remains unresolved.</h2></div><p>These dependencies are normal development workstreams, not evidence of approval, completion, or failure.</p></div><ul>{projectRisks.map((risk) => <li key={risk}><AlertCircle aria-hidden="true" />{risk}</li>)}</ul></div></section>

    <section className="section diligence-documents" aria-labelledby="documents-title"><div className="container"><div className="trust-section-heading"><div><p className="eyebrow">Document access</p><h2 id="documents-title">Public when appropriate, controlled when necessary.</h2></div><p>Private records are never automatically exposed. Access may require commercial relevance, review, and an NDA.</p></div><div className="document-register">{diligenceDocuments.map((document) => <article key={document.title}><FileText aria-hidden="true" /><div><h3>{document.title}</h3>{"type" in document ? <p>{document.type}</p> : null}</div><Status status={document.status} />{"href" in document && termSheetAvailable ? <TrackedLink href={document.href} event="diligence_document_click" eventContext={document.title} download>{document.action}</TrackedLink> : document.action === "Request access" ? <Link href="#data-room">Request access</Link> : <span>{document.action}</span>}</article>)}</div></div></section>

    <section id="data-room" className="section data-room-section" aria-labelledby="data-room-title"><div className="container data-room-layout"><div><LockKeyhole aria-hidden="true" /><p className="eyebrow">Controlled diligence</p><h2 id="data-room-title">Request access to available project records.</h2><p>Requests are reviewed individually. Submission does not grant access, establish a commercial relationship, or release private documents.</p><ul><li><CheckCircle2 aria-hidden="true" />Role and purpose review</li><li><CheckCircle2 aria-hidden="true" />Document-specific access</li><li><CheckCircle2 aria-hidden="true" />NDA when appropriate</li></ul></div><div className="intake-form-card"><DataRoomRequestForm /></div></div></section>

    <section className="trust-final-cta"><div className="container"><p className="eyebrow">Evaluate the commercial fit</p><h2>Pair project diligence with your facility’s actual energy data.</h2><div><Link className="button button--primary button--large" href="/energy-assessment">Request an Energy Assessment <ArrowRight aria-hidden="true" /></Link><Link className="button button--secondary button--large" href="/our-vision">Our Vision</Link></div></div></section>
  </main><SiteFooter termSheetAvailable={termSheetAvailable} /></>;
}

function Status({ status }: { status: string }) { return <span className={`diligence-status diligence-status--${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>; }
function mapMilestoneStatus(status: string) { return status === "complete" ? "Complete" : status === "active" ? "Active" : status === "pending" ? "Pending third party" : "Future phase"; }
