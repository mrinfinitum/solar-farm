import Link from "next/link";
import { ArrowUpRight, Check, Clock3, FileText, MapPinned } from "lucide-react";

import { ContactForm } from "@/components/ui/contact-form";
import { TermSheetLink } from "@/components/ui/term-sheet-link";

export function ContactSection({ termSheetAvailable }: { termSheetAvailable: boolean }) {
  return (
    <section id="contact" className="section contact-section">
      <div className="container contact-shell">
        <div className="contact-copy">
          <p className="eyebrow">Commercial energy partnerships</p>
          <h2>Put your energy spend to work.</h2>
          <p>Explore whether an NSoul commercial energy agreement could support your facility’s long-term energy strategy.</p>

          <div className="contact-proof-list">
            <span><Check aria-hidden="true" size={17} /> No upfront equipment capital</span>
            <span><Check aria-hidden="true" size={17} /> Long-term commercial PPA structure</span>
            <span><Check aria-hidden="true" size={17} /> Indicative, non-binding discussion</span>
          </div>

          <div className="contact-meta">
            <div><Clock3 aria-hidden="true" /><span><small>Next step</small>Introductory energy call</span></div>
            <div><ArrowUpRight aria-hidden="true" /><span><small>Project region</small>Oklahoma Region</span></div>
          </div>

          <div className="term-sheet-card">
            <FileText aria-hidden="true" />
            <div>
              <strong>Indicative PPA term sheet</strong>
              <p>{termSheetAvailable ? "PDF · approximately 8 KB · Indicative and non-binding" : "Indicative term sheet not yet available."}</p>
            </div>
            <TermSheetLink available={termSheetAvailable} className="button button--secondary" compact context="contact" />
          </div>
          <Link className="land-submit-cta" href="/submit-property">
            <MapPinned aria-hidden="true" />
            <span><strong>Own rural Oklahoma land?</strong><small>Submit Land for Consideration</small></span>
            <ArrowUpRight aria-hidden="true" />
          </Link>
          <div className="contact-context-links"><Link href="/energy-assessment">Request an Energy Assessment</Link><Link href="/project-diligence">View Project Diligence</Link></div>
        </div>

        <div className="contact-form-card">
          <div className="form-heading">
            <span>Qualified commercial inquiries</span>
            <i><b /> Secure form</i>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
