import { Building2, Check, Handshake, PanelsTopLeft, TrendingDown } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";

const steps = [
  {
    label: "Develop",
    title: "We build and own the project.",
    detail: "Development, financing, construction, and operations—handled.",
    icon: Building2,
  },
  {
    label: "Generate",
    title: "Solar produces local power.",
    detail: "A commercial array converts sunlight into dependable electricity.",
    icon: PanelsTopLeft,
  },
  {
    label: "Purchase",
    title: "You purchase energy under a PPA.",
    detail: "Clear terms. No solar equipment on your balance sheet.",
    icon: Handshake,
  },
  {
    label: "Save",
    title: "You gain predictable pricing.",
    detail: "Long-term visibility helps protect your operating budget.",
    icon: TrendingDown,
  },
];

export function ProcessSection() {
  return (
    <section id="how-it-works" className="section process-section">
      <div className="container">
        <Reveal className="process-intro">
          <p className="eyebrow">From site to savings</p>
          <div>
            <h2>A simpler path to renewable energy.</h2>
            <p>
              We handle the infrastructure. Your business gains the energy,
              pricing clarity, and upside.
            </p>
          </div>
        </Reveal>
        <div className="process-grid">
          {steps.map((step, index) => (
            <Reveal key={step.label} className="process-step" delay={index * 0.08}>
              <div className="process-step__top">
                <strong>0{index + 1}</strong>
                <step.icon aria-hidden="true" size={21} strokeWidth={1.7} />
              </div>
              <span>{step.label}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </Reveal>
          ))}
        </div>
        <div className="process-statement">
          {["No equipment purchase", "No system maintenance", "No internal solar-development team required"].map((item) => (
            <span key={item}><Check aria-hidden="true" size={16} /> {item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
