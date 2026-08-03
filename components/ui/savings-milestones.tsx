import { Reveal } from "@/components/ui/reveal";
import type { EconomicMilestone } from "@/lib/project-data";

function formatValue(milestone: EconomicMilestone) {
  return `${milestone.prefix ?? ""}${new Intl.NumberFormat("en-US").format(milestone.value)}${milestone.suffix ?? ""}`;
}

export function SavingsMilestones({ milestones }: { milestones: EconomicMilestone[] }) {
  return (
    <div className="milestone-grid milestone-grid--featured">
      {milestones.map((milestone, index) => (
        <Reveal className="savings-card" key={milestone.period} delay={index * 0.06}>
          <span>{milestone.period}</span>
          <strong aria-label={`${milestone.prefix ?? ""}${new Intl.NumberFormat("en-US").format(milestone.value)}${milestone.suffix ?? ""}`}>
            {formatValue(milestone)}
          </strong>
          <p>{milestone.label}</p>
        </Reveal>
      ))}
    </div>
  );
}
