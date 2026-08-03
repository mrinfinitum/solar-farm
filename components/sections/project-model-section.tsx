import { ArrowRight } from "lucide-react";

import { RegionalProjectFeature } from "@/components/project-model/regional-project-feature";
import { Reveal } from "@/components/ui/reveal";

export function ProjectModelSection() {
  return (
    <section id="project" className="project-model-section">
      <div className="container project-model-container">
        <Reveal className="project-model-intro">
          <p className="eyebrow">Representative project</p>
          <h2>Regional solar, structured simply.</h2>
          <p className="project-model-description">
            NSoul develops, owns, and operates the solar asset. A qualified regional organization purchases the generated
            electricity through a long-term commercial agreement.
          </p>
          <p className="project-model-disclosure">
            Illustrative project structure. Final capacity, pricing, delivery, and timing remain subject to engineering,
            utility review, financing, and agreements.
          </p>
        </Reveal>

        <RegionalProjectFeature />

        <Reveal className="project-model-cta">
          <div>
            <h3>Evaluate whether regional solar fits your energy needs.</h3>
            <p>Share your facility location and energy profile to begin an indicative commercial review.</p>
          </div>
          <div>
            <a className="button button--primary" href="#contact">
              Start a discussion <ArrowRight aria-hidden="true" />
            </a>
            <a className="button button--secondary" href="/submit-property">Submit land</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
