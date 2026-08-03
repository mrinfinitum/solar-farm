import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import type {
  ProjectIntelligenceMetric,
  ProjectStructureRole,
  ProjectWorkflowStep,
} from "@/lib/project-model-data";

type ProjectIntelligenceConsoleProps = {
  metrics: readonly ProjectIntelligenceMetric[];
  roles: readonly ProjectStructureRole[];
  flow: readonly string[];
  workflow: readonly ProjectWorkflowStep[];
  currentStage: {
    readonly label: string;
    readonly description: string;
  };
};

function ProjectMap() {
  return (
    <div className="pi-map-panel">
      <div className="pi-panel-heading">
        <p>Regional project context</p>
        <span>Illustrative geography</span>
      </div>
      <div className="pi-map-canvas">
        <svg viewBox="0 0 680 390" role="img" aria-labelledby="pi-map-title pi-map-description">
          <title id="pi-map-title">Representative southeast Oklahoma project map</title>
          <desc id="pi-map-description">
            A simplified Oklahoma map showing a candidate project site connected to a nearby commercial load center.
          </desc>
          <path className="pi-oklahoma" d="M72 92h194V70h237l9 53 62 20 25 56-18 45 26 48-53 26-61-11-60 22-71-32-58 15-48-34-72 8-23-64H72Z" />
          <path className="pi-southeast" d="m433 257 60-21 50 21 41-13 23 48-53 26-61-11-60 22Z" />
          <path className="pi-connection" d="M501 286C473 260 436 235 388 213" />
          <g className="pi-load-marker" transform="translate(374 199)">
            <rect width="28" height="28" rx="7" />
            <path d="m16 3-9 13h7l-4 9 11-14h-7Z" />
          </g>
          <g className="pi-site-marker" transform="translate(501 286)">
            <circle r="25" />
            <circle r="7" />
          </g>
        </svg>
        <div className="pi-map-label pi-map-label--load">
          <span>Commercial load center</span>
          <strong>Regional demand</strong>
        </div>
        <div className="pi-map-label pi-map-label--site">
          <span>Candidate project site</span>
          <strong>Southeast Oklahoma</strong>
        </div>
      </div>
    </div>
  );
}

export function ProjectIntelligenceConsole({
  metrics,
  roles,
  flow,
  workflow,
  currentStage,
}: ProjectIntelligenceConsoleProps) {
  return (
    <Reveal className="pi-console">
      <header className="pi-console-header">
        <div>
          <p>Project intelligence</p>
          <h3>Regional Solar Project</h3>
        </div>
        <div className="pi-console-meta">
          <span>Southeast Oklahoma</span>
          <strong><i aria-hidden="true" /> Concept model</strong>
          <a href="#contact" aria-label="Discuss the representative Regional Solar Project">
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </header>

      <div className="pi-metric-rail" aria-label="Representative project metrics">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>

      <div className="pi-console-main">
        <ProjectMap />
        <div className="pi-structure-panel">
          <div className="pi-panel-heading">
            <p>Commercial structure</p>
            <span>Representative roles</span>
          </div>
          <div className="pi-role-list">
            {roles.map((role, index) => (
              <div key={role.name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{role.name}</strong>
                  <p>{role.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pi-flow-rail" aria-label="Commercial energy flow">
        <p>Commercial energy flow</p>
        <ol>
          {flow.map((step, index) => (
            <li key={step}>
              <i aria-hidden="true" />
              <span>{step}</span>
              {index < flow.length - 1 ? <b aria-hidden="true">→</b> : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="pi-workflow">
        <div className="pi-workflow-heading">
          <p>Development workflow</p>
          <span>Representative sequence</span>
        </div>
        <ol className="pi-workflow-rail">
          {workflow.map((step, index) => (
            <li className={index === 1 ? "is-current" : undefined} key={step.number}>
              <span>{step.number}</span>
              <strong>{step.label}</strong>
            </li>
          ))}
        </ol>
        <div className="pi-current-stage">
          <span>{currentStage.label}</span>
          <p>{currentStage.description}</p>
        </div>
      </div>
    </Reveal>
  );
}
