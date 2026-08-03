import { CheckCircle2 } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { industries } from "@/lib/project-data";

const qualifiers = [
  "Significant annual electricity consumption",
  "Long-term facility presence",
  "Interest in predictable commercial energy pricing",
];

export function OffTakerSection() {
  return (
    <section className="section offtaker-section">
      <div className="container">
        <SectionHeading
          eyebrow="Off-taker fit"
          title="Designed for organizations with meaningful daytime energy demand."
          description="We are seeking a qualified regional commercial or industrial off-taker interested in long-term energy savings, predictable pricing, and measurable renewable-energy participation."
        />
        <div className="industry-grid">
          {industries.map(({ name, icon: Icon }, index) => (
            <Reveal className="industry-tile" key={name} delay={(index % 4) * 0.05}>
              <Icon aria-hidden="true" size={21} strokeWidth={1.5} />
              <span>{name}</span>
              <small>0{index + 1}</small>
            </Reveal>
          ))}
        </div>
        <div className="qualifier-bar">
          <p>Strong-fit indicators</p>
          <div>
            {qualifiers.map((qualifier) => (
              <span key={qualifier}><CheckCircle2 aria-hidden="true" size={17} />{qualifier}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
