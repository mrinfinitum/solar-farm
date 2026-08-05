import { ArrowRight } from "lucide-react";

import { RegionalProjectFeature } from "@/components/project-model/regional-project-feature";
import { Reveal } from "@/components/ui/reveal";
import { TrackedLink } from "@/components/ui/tracked-link";

export function ProjectModelSection() {
  return (
    <section id="project" className="project-model-section">
      <div className="container project-model-container">
        <Reveal className="project-model-intro">
          <p className="eyebrow">Why NSoul</p>
          <h2>Lower costs. Less capital. Local renewable power.</h2>
          <p className="project-model-description">
            Whether you run a growing local business or a large regional operation, NSoul is designed to make solar power commercially useful, with potential energy savings, no equipment purchase, and a direct local relationship.
          </p>
          <p className="project-model-disclosure">
            Savings and renewable-energy benefits depend on actual electricity usage, final pricing, production, utility review, REC treatment, and executed agreements.
          </p>
        </Reveal>

        <RegionalProjectFeature />

        <Reveal className="project-model-cta">
          <div>
            <h3>See what local solar could mean for your business.</h3>
            <p>Start with your utility bills, operating profile, and long-term energy goals.</p>
          </div>
          <div>
            <TrackedLink className="button button--primary" href="/energy-assessment" event="project_cta_click" eventContext="why-nsoul-benefits">
              Request an Energy Assessment <ArrowRight aria-hidden="true" />
            </TrackedLink>
            <a className="button button--secondary" href="/project-diligence">View Project Diligence</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
