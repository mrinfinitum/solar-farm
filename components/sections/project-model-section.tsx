import { ArrowRight } from "lucide-react";

import { ProjectIntelligenceConsole } from "@/components/project-model/project-intelligence-console";
import { Reveal } from "@/components/ui/reveal";
import { projectModel } from "@/lib/project-model-data";

export function ProjectModelSection() {
  return (
    <section id="project" className="project-model-section">
      <div className="container project-model-container">
        <Reveal className="project-model-intro">
          <div>
            <p className="eyebrow">{projectModel.intro.eyebrow}</p>
            <h2>{projectModel.intro.title}</h2>
            <p className="project-model-description">{projectModel.intro.description}</p>
          </div>
          <aside className="project-model-note">
            <strong>{projectModel.intro.noteTitle}</strong>
            <p>{projectModel.intro.note}</p>
          </aside>
        </Reveal>

        <ProjectIntelligenceConsole
          metrics={projectModel.metrics}
          roles={projectModel.roles}
          flow={projectModel.flow}
          workflow={projectModel.workflow}
          currentStage={projectModel.currentStage}
        />

        <Reveal className="project-model-cta">
          <div>
            <h3>Evaluate a commercial energy opportunity.</h3>
            <p>Share your facility location and energy profile to begin an indicative project assessment.</p>
          </div>
          <div>
            <a className="button button--primary" href="#contact">
              Start a project discussion <ArrowRight aria-hidden="true" />
            </a>
            <a className="button button--secondary" href="/submit-property">Submit land</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
