import { CircleDollarSign, Globe2, ShieldCheck, Zap } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const features = [
  {
    icon: CircleDollarSign,
    impact: "Save",
    title: "Lower your energy spend",
    description: "Purchase electricity at an agreed rate modeled below the commercial utility baseline.",
  },
  {
    icon: ShieldCheck,
    impact: "Protect",
    title: "Make power costs more predictable",
    description: "Reduce exposure to future utility price increases and fuel-related adjustments.",
  },
  {
    icon: Zap,
    impact: "Power",
    title: "We own and run the system",
    description: "Avoid buying the equipment while we manage development, financing, maintenance, and operations.",
  },
  {
    icon: Globe2,
    impact: "Renew",
    title: "Turn cleaner energy into business value",
    description: "Support renewable generation with the proposed transfer of associated Renewable Energy Certificates.",
  },
];

export function OpportunitySection() {
  return (
    <section id="opportunity" className="section opportunity-section">
      <div className="container">
        <SectionHeading
          eyebrow="The opportunity"
          title="Energy procurement without infrastructure ownership."
          description="A commercial Power Purchase Agreement can provide access to locally generated renewable electricity without requiring the customer to purchase, operate, insure, or maintain the generation equipment."
        />
        <div className="feature-grid">
          {features.map(({ icon: Icon, impact, title, description }, index) => (
            <Reveal key={title} className="feature-card" delay={index * 0.07}>
              <div className="feature-topline">
                <span className="feature-icon"><Icon aria-hidden="true" size={24} strokeWidth={1.7} /></span>
                <span className="feature-index">0{index + 1}</span>
              </div>
              <strong className="feature-impact" aria-label={impact}>
                {impact.split(" ").map((word) => <span key={word}>{word}</span>)}
              </strong>
              <h3>{title}</h3>
              <p>{description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
