import { ArrowRight, Building2, Gauge, ShieldCheck } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";

const responsibilitySteps = [
  { icon: ShieldCheck, title: "Predictable pricing", description: "Know how your electricity is priced before you buy. No surprise equipment costs." },
  { icon: Gauge, title: "Metered energy", description: "Only electricity delivered under the final commercial agreement is measured and billed." },
  { icon: Building2, title: "Long-term partnership", description: "NSoul develops, owns, operates, and maintains the project while your organization focuses on running its business." },
] as const;

const protectionAnswers = [
  { value: "$0", title: "Customer equipment purchase", copy: "No solar equipment purchase or construction investment." },
  { value: "Metered", title: "Commercial billing", copy: "Electricity is measured and invoiced under the final agreement." },
  { value: "Local", title: "Regional partnership", copy: "Developed around Oklahoma businesses and long-term regional demand." },
] as const;

const commercialRoles = [
  { name: "NSoul", description: "Develops, finances, owns, operates, and maintains the project." },
  { name: "Customer", description: "Purchases electricity under the commercial agreement." },
  { name: "Utility", description: "Supports interconnection, metering, delivery, and regulated electric service." },
] as const;

const process = ["Evaluate", "Agree", "Deliver", "Save"] as const;

export function RegionalProjectFeature() {
  return (
      <Reveal className="regional-project-feature">
        <div className="regional-project-main">
          <div className="regional-project-diagram" aria-labelledby="buyer-model-steps">
            <h3 id="buyer-model-steps" className="sr-only">How the customer purchases electricity</h3>
            <ol>
              {responsibilitySteps.map(({ icon: Icon, title, description }, index) => (
                <li className="regional-project-node" key={title}>
                  <div className="regional-project-icon" aria-hidden="true"><Icon strokeWidth={1.6} /></div>
                  <div><h3>{title}</h3><p>{description}</p></div>
                  {index < responsibilitySteps.length - 1 ? <span className="regional-project-connector" aria-hidden="true" /> : null}
                </li>
              ))}
            </ol>
          </div>

          <div className="regional-project-snapshot">
            <div className="regional-project-facts" aria-label="Proposed customer protection answers">
              {protectionAnswers.map((fact) => (
                <div key={fact.title}>
                  <strong>{fact.value}</strong>
                  <span>{fact.title}</span>
                  <p>{fact.copy}</p>
                </div>
              ))}
            </div>

            <div className="regional-project-roles">
              <h3>Who does what</h3>
              {commercialRoles.map((role) => <div key={role.name}><strong>{role.name}</strong><p>{role.description}</p></div>)}
            </div>
          </div>
        </div>

        <div className="regional-project-process" aria-label="Customer journey: evaluate, agree, deliver, save">
          {process.map((step, index) => <span key={step}>{step}{index < process.length - 1 ? <ArrowRight aria-hidden="true" /> : null}</span>)}
          <p className="regional-project-footer-message">Your business buys electricity. Not solar panels.</p>
        </div>
      </Reveal>
  );
}
