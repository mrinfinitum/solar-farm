import { Building2, SunMedium, UtilityPole, ArrowRight } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";

const projectNodes = [
  {
    icon: SunMedium,
    title: "Solar project",
    description: "Developed, owned, and operated by NSoul",
  },
  {
    icon: UtilityPole,
    title: "Utility connection",
    description: "Interconnection and grid delivery",
  },
  {
    icon: Building2,
    title: "Energy customer",
    description: "Purchases generated electricity",
  },
] as const;

const projectFacts = [
  { value: "1–5 MW DC", label: "Representative capacity" },
  { value: "20 years", label: "Illustrative agreement term" },
  { value: "Southeast Oklahoma", label: "Target region" },
] as const;

const commercialRoles = [
  {
    name: "Developer",
    description: "Finances, builds, owns, and operates the project.",
  },
  {
    name: "Energy customer",
    description: "Purchases the generated electricity under a long-term agreement.",
  },
  {
    name: "Utility",
    description: "Supports interconnection and power delivery.",
  },
] as const;

const projectProcess = ["Develop", "Connect", "Generate", "Deliver"] as const;

export function RegionalProjectFeature() {
  return (
    <Reveal className="regional-project-feature">
      <div className="regional-project-main">
        <div className="regional-project-diagram" aria-label="Representative commercial solar delivery model">
          {projectNodes.map(({ icon: Icon, title, description }, index) => (
            <div className="regional-project-node" key={title}>
              <div className="regional-project-icon" aria-hidden="true">
                <Icon strokeWidth={1.6} />
              </div>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
              {index < projectNodes.length - 1 ? <span className="regional-project-connector" aria-hidden="true" /> : null}
            </div>
          ))}
        </div>

        <div className="regional-project-snapshot">
          <div className="regional-project-facts" aria-label="Representative project facts">
            {projectFacts.map((fact) => (
              <div key={fact.label}>
                <strong>{fact.value}</strong>
                <span>{fact.label}</span>
              </div>
            ))}
          </div>

          <div className="regional-project-roles">
            <h3>Commercial structure</h3>
            {commercialRoles.map((role) => (
              <div key={role.name}>
                <strong>{role.name}</strong>
                <p>{role.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="regional-project-process" aria-label="Project delivery process">
        {projectProcess.map((step, index) => (
          <span key={step}>
            {step}
            {index < projectProcess.length - 1 ? <ArrowRight aria-hidden="true" /> : null}
          </span>
        ))}
      </div>
    </Reveal>
  );
}
