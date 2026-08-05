import type { Metadata } from "next";
import { ArrowRight, Check, CircleCheck, X } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProcurementFaq } from "@/components/why-nsoul/procurement-faq";
import { PageEvent } from "@/components/ui/page-event";
import { Reveal } from "@/components/ui/reveal";
import { TrackedLink } from "@/components/ui/tracked-link";
import { buyerProtectionModules, responsibilityParties } from "@/lib/content/buyer-protection";
import { audiencePaths, customerDoesNotManage, customerEvaluates, localValue, proofPoints } from "@/lib/content/why-nsoul";
import { isTermSheetAvailable } from "@/lib/term-sheet";

const description = "Learn how NSoul’s proposed commercial structure separates customer energy purchasing from project ownership, construction, operations, and maintenance responsibilities.";
export const metadata: Metadata = {
  title: "Why NSoul | Local Commercial Solar with Professional Structure",
  description,
  alternates: { canonical: "/why-nsoul" },
  openGraph: { title: "Why NSoul | Local Commercial Solar with Professional Structure", description, url: "/why-nsoul", type: "website" },
};

export default function WhyNSoulPage() {
  const termSheetAvailable = isTermSheetAvailable();
  return (
    <>
      <PageEvent event="why_nsoul_view" />
      <SiteHeader termSheetAvailable={termSheetAvailable} />
      <main className="public-site trust-page">
        <section className="trust-hero" aria-labelledby="why-nsoul-title">
          <div className="container trust-hero__inner">
            <p className="eyebrow">Why NSoul</p>
            <h1 id="why-nsoul-title">Local energy development with a structure built for commercial confidence.</h1>
            <p>NSoul is developing regional solar projects intended to provide qualified organizations with locally generated renewable energy, predictable commercial terms, and no upfront equipment purchase.</p>
            <div className="trust-hero__actions">
              <TrackedLink className="button button--primary button--large" href="/energy-assessment" event="why_nsoul_cta" eventContext="hero">Request an Energy Assessment <ArrowRight aria-hidden="true" /></TrackedLink>
              <Link className="button button--secondary button--large" href="/project-diligence">View Project Diligence</Link>
            </div>
            <ul className="trust-proof-strip">{proofPoints.map((point) => <li key={point}><Check aria-hidden="true" />{point}</li>)}</ul>
            <small>Development-stage project information. Final responsibilities and protections remain subject to utility review, financing, engineering, legal documentation, and executed agreements.</small>
          </div>
        </section>

        <section className="section trust-editorial" aria-labelledby="commercial-question-title">
          <div className="container">
            <div className="trust-section-heading"><div><p className="eyebrow">The commercial question</p><h2 id="commercial-question-title">You are not being asked to become a solar developer.</h2></div><p>The customer’s role is to evaluate and purchase energy under an agreed commercial structure. NSoul’s role is to coordinate the site, utility process, engineering, capital, construction, operations, maintenance, and reporting required to deliver that energy.</p></div>
            <div className="responsibility-compare">
              <article><span><X aria-hidden="true" /> Customer should not be responsible for</span><ul>{customerDoesNotManage.map((item) => <li key={item}>{item}</li>)}</ul></article>
              <article><span><CircleCheck aria-hidden="true" /> Customer evaluates</span><ul>{customerEvaluates.map((item) => <li key={item}>{item}</li>)}</ul></article>
            </div>
            <p className="trust-legal-note">Responsibilities and protections are not final until included in executed commercial and project agreements.</p>
          </div>
        </section>

        <section className="section buyer-protection-page" aria-labelledby="buyer-protection-title">
          <PageEvent event="buyer_protection_view" />
          <div className="container">
            <div className="trust-section-heading"><div><p className="eyebrow">Buyer protection</p><h2 id="buyer-protection-title">The transaction should protect the customer before it asks for commitment.</h2></div></div>
            <div className="protection-modules">{buyerProtectionModules.map((module, index) => <Reveal key={module.title} delay={index * 0.03}><article><span>{String(index + 1).padStart(2, "0")}</span><h3>{module.title}</h3><p>{module.copy}</p></article></Reveal>)}</div>
            <p className="trust-legal-note">Specific protections must be negotiated and documented in the final agreements. This page describes the intended commercial framework, not binding legal terms.</p>
          </div>
        </section>

        <section className="section responsibility-map" aria-labelledby="responsibility-map-title">
          <div className="container"><div className="trust-section-heading"><div><p className="eyebrow">Defined responsibilities</p><h2 id="responsibility-map-title">Each party has a specific role.</h2></div><p>Roles shown are intended responsibilities and remain subject to final scopes, utility requirements, and definitive documentation.</p></div>
            <ol>{responsibilityParties.map(({ name, icon: Icon, duties }, index) => <li key={name}><span>{String(index + 1).padStart(2, "0")}</span><i aria-hidden="true"><Icon /></i><div><h3>{name}</h3><ul>{duties.map((duty) => <li key={duty}>{duty}</li>)}</ul></div></li>)}</ol>
          </div>
        </section>

        <section className="section local-value" aria-labelledby="local-value-title"><div className="container"><div className="trust-section-heading"><div><p className="eyebrow">Local value</p><h2 id="local-value-title">Regional energy can create value beyond the kilowatt-hour.</h2></div><p>Potential local benefits depend on the final project structure and should be measured rather than assumed.</p></div><div className="local-value__grid">{localValue.map((item) => <article key={item.title}><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div></div></section>

        <section className="section audience-paths" aria-labelledby="audience-paths-title"><div className="container"><div className="trust-section-heading"><div><p className="eyebrow">Built for different buyers</p><h2 id="audience-paths-title">The commercial conversation changes with the organization.</h2></div></div><div className="audience-paths__grid">{audiencePaths.map((path, index) => <article key={path.type}><span>0{index + 1} · {path.type}</span><h3>{path.title}</h3><ul>{path.priorities.map((priority) => <li key={priority}>{priority}</li>)}</ul><TrackedLink href={path.query === "enterprise" ? `/project-diligence?audience=${path.query}#data-room` : `/energy-assessment?audience=${path.query}`} event="audience_path_select" eventContext={path.query}>{path.cta}<ArrowRight aria-hidden="true" /></TrackedLink></article>)}</div></div></section>

        <section className="section procurement-questions" aria-labelledby="procurement-title"><div className="container"><div className="trust-section-heading"><div><p className="eyebrow">Questions we expect</p><h2 id="procurement-title">A serious energy decision deserves direct answers.</h2></div></div><ProcurementFaq /></div></section>

        <section className="trust-final-cta" aria-labelledby="trust-final-title"><div className="container"><p className="eyebrow">Start with your actual energy data</p><h2 id="trust-final-title">Let us test the opportunity against your utility bills.</h2><p>The best way to evaluate potential savings is to compare the proposed commercial structure with your facility’s actual usage, rates, demand profile, and operating plans.</p><div><TrackedLink className="button button--primary button--large" href="/energy-assessment" event="why_nsoul_cta" eventContext="final">Request an Energy Assessment <ArrowRight aria-hidden="true" /></TrackedLink><Link className="button button--secondary button--large" href="/project-diligence">View Project Diligence</Link></div></div></section>
      </main>
      <SiteFooter termSheetAvailable={termSheetAvailable} />
    </>
  );
}
