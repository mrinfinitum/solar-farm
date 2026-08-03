import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Reveal } from "@/components/ui/reveal";

const ownerMetrics = [
  {
    value: 0,
    prefix: "$",
    benefit: "Capital preserved",
    label: "Upfront equipment cost",
    description: "Keep cash focused on operations, people, and growth.",
  },
  {
    value: 15,
    suffix: "%",
    benefit: "Lower overhead",
    label: "Indicative starting discount",
    description: "Potential energy savings from the first delivered kilowatt-hour.",
  },
  {
    value: 20,
    suffix: " yr",
    benefit: "Budget confidence",
    label: "Long-term price visibility",
    description: "A clearer operating-cost outlook for business planning.",
  },
  {
    value: 765,
    prefix: "$",
    suffix: "K+",
    benefit: "Value retained",
    label: "Modeled cumulative savings",
    description: "Potential value kept in the business over the agreement term.",
  },
] as const;

export function MetricsSection() {
  return (
    <section className="metrics-section" aria-label="Business-owner economics">
      <div className="container">
        <Reveal className="metric-intro">
          <div>
            <p className="eyebrow">Built for business owners</p>
            <h2>Keep more capital working in the business.</h2>
          </div>
          <p>Solar structured around operating priorities—not equipment ownership.</p>
        </Reveal>
        <div className="metric-grid">
          {ownerMetrics.map((metric, index) => (
            <Reveal key={metric.label} delay={index * 0.06} className="metric-card">
              <span className="metric-index">0{index + 1}</span>
              <span className="metric-benefit">{metric.benefit}</span>
              <strong>
                <AnimatedCounter {...metric} />
              </strong>
              <h3>{metric.label}</h3>
              <p>{metric.description}</p>
            </Reveal>
          ))}
        </div>
        <p className="metric-note">Illustrative development-stage economics. Actual pricing, savings, and terms depend on final project assumptions and agreements.</p>
      </div>
    </section>
  );
}
