import { ArrowRight, CircleCheck } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/ui/reveal";
import { homepageTrustPoints } from "@/lib/content/buyer-protection";

export function BuyerConfidenceSection() {
  return (
    <section className="section buyer-confidence" aria-labelledby="buyer-confidence-title">
      <div className="container buyer-confidence__shell">
        <Reveal className="buyer-confidence__intro">
          <p className="eyebrow">Built around the buyer</p>
          <h2 id="buyer-confidence-title">A smaller developer should not mean greater customer risk.</h2>
          <p>NSoul is developing a project structure in which the customer does not fund construction, purchase equipment, operate the system, or begin paying for project energy before the agreed commercial requirements are satisfied.</p>
        </Reveal>
        <div className="buyer-confidence__points">
          {homepageTrustPoints.map((point, index) => (
            <Reveal key={point.title} delay={index * 0.04}>
              <article>
                <span className="buyer-confidence__index">0{index + 1}</span>
                <span className="buyer-confidence__icon"><CircleCheck aria-hidden="true" /></span>
                <div><small>{point.label}</small><h3>{point.title}</h3><p>{point.copy}</p></div>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="buyer-confidence__actions">
          <Link className="button button--primary" href="/our-vision">Our Vision <ArrowRight aria-hidden="true" /></Link>
          <Link className="button button--secondary" href="/project-diligence">View Project Diligence</Link>
        </div>
      </div>
    </section>
  );
}
