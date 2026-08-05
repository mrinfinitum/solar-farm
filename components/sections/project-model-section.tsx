import { ArrowRight } from "lucide-react";

import { RegionalProjectFeature } from "@/components/project-model/regional-project-feature";
import { Reveal } from "@/components/ui/reveal";
import { TrackedLink } from "@/components/ui/tracked-link";

export function ProjectModelSection() {
  return (
    <section id="project" className="project-model-section">
      <div className="container project-model-container">
        <Reveal className="project-model-intro">
          <p className="eyebrow">How your business benefits</p>
          <h2>Buying power, not solar panels.</h2>
          <p className="project-model-description">
            Keep your capital focused on running your business, not building an energy project.
          </p>
          <p className="project-model-disclosure">
            Proposed commercial model. Final pricing, metering, responsibilities, and delivery remain subject to definitive documentation and executed agreements.
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
