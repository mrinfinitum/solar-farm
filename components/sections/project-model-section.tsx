import { ArrowRight } from "lucide-react";

import { RegionalProjectFeature } from "@/components/project-model/regional-project-feature";
import { Reveal } from "@/components/ui/reveal";
import { TrackedLink } from "@/components/ui/tracked-link";

export function ProjectModelSection() {
  return (
    <section id="project" className="project-model-section">
      <div className="container project-model-container">
        <Reveal className="project-model-intro">
          <p className="eyebrow">Buyer protection model</p>
          <h2>A commercial structure designed to keep project responsibility off the customer.</h2>
          <p className="project-model-description">
            The customer buys qualifying energy. NSoul and the responsible project parties coordinate the asset, while the utility and metering structure support approved delivery and measurement.
          </p>
          <p className="project-model-disclosure">
            Proposed structure only. Payment, responsibilities, protections, and delivery remain subject to definitive documentation, utility review, engineering, financing, and executed agreements.
          </p>
        </Reveal>

        <RegionalProjectFeature />

        <Reveal className="project-model-cta">
          <div>
            <h3>Evaluate whether regional solar fits your energy needs.</h3>
            <p>Share your facility location and energy profile to begin an indicative commercial review.</p>
          </div>
          <div>
            <TrackedLink className="button button--primary" href="#contact" event="project_cta_click" eventContext="representative-model">
              Start a discussion <ArrowRight aria-hidden="true" />
            </TrackedLink>
            <a className="button button--secondary" href="/submit-property">Submit land</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
