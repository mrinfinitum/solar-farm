import { ArrowUpRight } from "lucide-react";

import { EnergyFlow } from "@/components/project-model/energy-flow";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Reveal } from "@/components/ui/reveal";
import type { ProjectModelDetail, ProjectModelMetric } from "@/lib/project-model-data";

type ProjectOverviewCardProps = {
  metrics: readonly ProjectModelMetric[];
  details: readonly ProjectModelDetail[];
  flow: readonly string[];
};

export function ProjectOverviewCard({ metrics, details, flow }: ProjectOverviewCardProps) {
  return (
    <Reveal className="pm-card pm-overview-card">
      <div className="pm-card-header pm-overview-header">
        <div>
          <p>Representative commercial project</p>
          <h3>Regional Solar Project</h3>
        </div>
        <div className="pm-header-actions">
          <span className="pm-status-pill">Concept model</span>
          <a className="pm-arrow-button" href="#contact" aria-label="Discuss this representative project model">
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="pm-metric-grid">
        {metrics.map((metric) => (
          <div className={`pm-metric pm-metric--${metric.accent ?? "default"}`} key={metric.label}>
            <strong>
              {typeof metric.value === "number" ? (
                <AnimatedCounter value={metric.value} prefix={metric.prefix} suffix={metric.suffix} />
              ) : (
                <>{metric.prefix}{metric.value}{metric.suffix}</>
              )}
            </strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>

      <dl className="pm-detail-grid">
        {details.map((detail) => (
          <div key={detail.label}>
            <dt>{detail.label}</dt>
            <dd>{detail.value}</dd>
          </div>
        ))}
      </dl>

      <div className="pm-flow-wrap">
        <span>Commercial energy flow</span>
        <EnergyFlow steps={flow} />
      </div>
    </Reveal>
  );
}
