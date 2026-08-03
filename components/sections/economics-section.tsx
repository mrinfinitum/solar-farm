import { Info } from "lucide-react";

import { RateChart } from "@/components/ui/rate-chart";
import { Reveal } from "@/components/ui/reveal";
import { SavingsMilestones } from "@/components/ui/savings-milestones";
import { SectionHeading } from "@/components/ui/section-heading";
import { commercialTerms, economicMilestones, project } from "@/lib/project-data";

const assumptions = [
  `${new Intl.NumberFormat("en-US").format(project.annualGenerationKwh)} kWh estimated annual Year 1 production`,
  `${commercialTerms.annualEscalator}% annual PPA escalator`,
  "Utility baseline assumptions are illustrative",
  "Final economics depend on technical design, energy usage, interconnection, legal terms, and actual utility rates",
];

export function EconomicsSection() {
  return (
    <section id="economics" className="section economics-section">
      <div className="container">
        <SectionHeading
          eyebrow="Indicative economics"
          title="Savings that may compound over time."
          description="A modeled comparison between our proposed PPA and an illustrative commercial utility baseline. Values are directional, not guaranteed forecasts."
        />

        <SavingsMilestones milestones={economicMilestones} />

        <div className="economics-grid">
          <Reveal className="chart-card">
            <div className="chart-heading">
              <div>
                <p className="eyebrow">Rate comparison</p>
                <h3>Indicative $ / kWh</h3>
              </div>
              <span>20-year model</span>
            </div>
            <RateChart />
          </Reveal>

          <Reveal className="assumptions-card" delay={0.08}>
            <p className="eyebrow">Model assumptions</p>
            <h3>What the estimate considers</h3>
            <ul>
              {assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
            </ul>
            <div className="assumption-highlight">
              <span>Indicative starting rate</span>
              <strong>${commercialTerms.startingPpaRate}<small>/kWh</small></strong>
              <p>{commercialTerms.startingDiscount}% below the modeled Year 1 baseline</p>
            </div>
          </Reveal>
        </div>

        <div className="economics-disclaimer">
          <Info aria-hidden="true" size={17} />
          <p>All economics shown are preliminary, non-binding development-stage estimates. Actual savings depend on final design, production, usage, interconnection, legal terms, and utility rates.</p>
        </div>
      </div>
    </section>
  );
}
