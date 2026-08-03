import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { developmentMilestones } from "@/lib/project-data";

export function DevelopmentSection() {
  return (
    <section id="development" className="section development-section">
      <div className="container development-layout">
        <div className="development-intro">
          <SectionHeading
            eyebrow="Development status"
            title="From viable site to operating energy asset."
            description="The project is advancing through technical validation and commercial outreach. Each later stage remains contingent on the milestones before it."
          />
          <div className="status-key" aria-label="Status color key">
            <span><i className="key-complete" /> Complete</span>
            <span><i className="key-active" /> Active</span>
            <span><i className="key-pending" /> Pending</span>
            <span><i className="key-future" /> Future</span>
          </div>
        </div>

        <ol className="development-timeline">
          {developmentMilestones.map((milestone, index) => (
            <li key={milestone.title}>
              <Reveal className="timeline-item" delay={index * 0.05}>
                <div className="timeline-marker">
                  <span>0{index + 1}</span>
                  <i className={`timeline-dot timeline-dot--${milestone.status}`} />
                </div>
                <div>
                  <StatusBadge status={milestone.status}>{milestone.label}</StatusBadge>
                  <h3>{milestone.title}</h3>
                  <p>{milestone.description}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

