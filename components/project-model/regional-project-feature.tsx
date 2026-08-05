import { ArrowRight, Building2, Gauge, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/ui/reveal";

const responsibilitySteps = [
  { icon: ShieldCheck, title: "Project company", description: "Develops, finances, owns, and operates the solar asset." },
  { icon: Gauge, title: "Utility and metering", description: "Supports approved interconnection, delivery, and energy measurement." },
  { icon: Building2, title: "Commercial customer", description: "Purchases qualifying energy under the final agreement." },
] as const;

const protectionAnswers = [
  { value: "$0", title: "Proposed customer equipment investment", copy: "The customer is not expected to purchase the solar array or fund project construction." },
  { value: "METERED", title: "Basis for commercial billing", copy: "The final agreement should define approved metering, invoice calculations, and reconciliation procedures." },
  { value: "AFTER OPERATION", title: "When energy purchasing begins", copy: "Customer payment should begin only after agreed commercial-operation requirements are satisfied." },
] as const;

const commercialRoles = [
  { name: "Project owner", description: "Responsible for project development, financing, ownership, and operating obligations defined in final documentation." },
  { name: "Energy customer", description: "Purchases metered project energy under the executed commercial agreement." },
  { name: "Utility", description: "Maintains its applicable interconnection, grid, metering, and regulated-service responsibilities." },
  { name: "Engineering and EPC providers", description: "Complete technical design, construction, testing, and commissioning under their contracted scopes." },
  { name: "Operations provider", description: "Supports monitoring, maintenance, reporting, and equipment service as defined by project contracts." },
] as const;

const process = ["Validate", "Build", "Meter", "Deliver"] as const;
const questions = ["When payment begins", "How energy is measured", "Who maintains the system", "What happens if the project is delayed", "What remedies and termination rights apply"] as const;

export function RegionalProjectFeature() {
  return (
    <>
      <Reveal className="regional-project-feature">
        <div className="regional-project-main">
          <div className="regional-project-diagram" aria-labelledby="buyer-model-steps">
            <h3 id="buyer-model-steps" className="sr-only">Proposed project responsibility chain</h3>
            <ol>
              {responsibilitySteps.map(({ icon: Icon, title, description }, index) => (
                <li className="regional-project-node" key={title}>
                  <div className="regional-project-icon" aria-hidden="true"><Icon strokeWidth={1.6} /></div>
                  <div><h3>{title}</h3><p>{description}</p></div>
                  {index < responsibilitySteps.length - 1 ? <span className="regional-project-connector" aria-hidden="true" /> : null}
                </li>
              ))}
            </ol>
            <p className="regional-project-note">The customer is not expected to purchase, construct, own, operate, or maintain the solar equipment.</p>
          </div>

          <div className="regional-project-snapshot">
            <div className="regional-project-facts" aria-label="Proposed customer protection answers">
              {protectionAnswers.map((fact) => (
                <article key={fact.title}>
                  <strong>{fact.value}</strong>
                  <h3>{fact.title}</h3>
                  <p>{fact.copy}</p>
                </article>
              ))}
            </div>

            <div className="regional-project-roles">
              <h3>Customer protection framework</h3>
              {commercialRoles.map((role) => <div key={role.name}><strong>{role.name}</strong><p>{role.description}</p></div>)}
            </div>
          </div>
        </div>

        <ol className="regional-project-process" aria-label="Proposed delivery sequence: validate, build, meter, deliver">
          {process.map((step, index) => <li key={step}><span>{step}</span>{index < process.length - 1 ? <ArrowRight aria-hidden="true" /> : null}</li>)}
        </ol>
      </Reveal>

      <Reveal className="buyer-confirmation-panel">
        <div><p className="eyebrow">Before signing</p><h3>What the customer should confirm</h3></div>
        <ul>{questions.map((question) => <li key={question}>{question}</li>)}</ul>
        <Link href="/why-nsoul" aria-label="See Why NSoul for the complete buyer-protection framework">See Why NSoul <ArrowRight aria-hidden="true" /></Link>
      </Reveal>
    </>
  );
}
