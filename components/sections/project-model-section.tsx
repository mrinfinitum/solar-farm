import { ArrowRight } from "lucide-react";

import { CommercialModelStrip } from "@/components/project-model/commercial-model-strip";
import { DevelopmentPath } from "@/components/project-model/development-path";
import { ProjectOverviewCard } from "@/components/project-model/project-overview-card";
import { RepresentativeMap } from "@/components/project-model/representative-map";
import { Reveal } from "@/components/ui/reveal";
import { projectModel } from "@/lib/project-model-data";

export function ProjectModelSection() {
  return (
    <section id="project" className="project-model-section">
      <div className="project-model-grid" aria-hidden="true" />
      <div className="container project-model-container">
        <Reveal className="project-model-intro">
          <div>
            <p className="eyebrow">{projectModel.intro.eyebrow}</p>
            <h2>{projectModel.intro.title}</h2>
            <p className="project-model-description">{projectModel.intro.description}</p>
          </div>
          <aside className="project-model-purpose">
            <div><span>Model purpose</span><i>Illustrative model</i></div>
            <p>{projectModel.intro.purpose}</p>
          </aside>
        </Reveal>

        <div className="project-model-dashboard">
          <ProjectOverviewCard metrics={projectModel.metrics} details={projectModel.details} flow={projectModel.flow} />
          <div className="project-model-side">
            <RepresentativeMap chips={projectModel.geographyChips} />
            <DevelopmentPath phases={projectModel.phases} />
          </div>
        </div>

        <CommercialModelStrip roles={projectModel.roles} />

        <Reveal className="pm-cta">
          <div>
            <p className="eyebrow">Apply the model</p>
            <h3>Evaluate how this structure could fit a real facility.</h3>
            <p>The next step is to compare facility energy demand, site conditions, utility feasibility, and commercial terms.</p>
          </div>
          <div className="pm-cta-actions">
            <a className="button button--primary" href="#development">Explore the Cornerstone Project <ArrowRight aria-hidden="true" /></a>
            <a className="button button--secondary" href="#contact">Discuss an Energy Agreement</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
