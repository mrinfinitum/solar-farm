import { ArrowRight, CircleDollarSign, Leaf, WalletCards } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/ui/reveal";

const responsibilitySteps = [
  { icon: CircleDollarSign, title: "Potential cost savings", description: "Pricing is evaluated against your actual electricity costs to determine whether the opportunity makes commercial sense." },
  { icon: WalletCards, title: "Capital stays in your business", description: "The proposed model does not require your organization to purchase equipment or fund project construction." },
  { icon: Leaf, title: "Measurable renewable value", description: "Metered local solar and associated energy attributes may support sustainability goals when defined in the final agreement." },
] as const;

const protectionAnswers = [
  { value: "SAVE", title: "Modeled energy-cost opportunity", copy: "We compare proposed pricing with your real utility data. Savings are indicative until final terms are executed." },
  { value: "$0", title: "Proposed equipment purchase", copy: "Keep business capital focused on operations instead of owning a solar asset." },
  { value: "LOCAL", title: "Renewable energy value", copy: "A visible Oklahoma project can provide metered renewable power and potential REC value under the final agreement." },
] as const;

const commercialRoles = [
  { name: "Growing businesses", description: "A practical path to potential savings without adding equipment ownership or a specialized energy team." },
  { name: "Regional institutions", description: "Long-term budget planning, local accountability, and renewable-energy value aligned to facility needs." },
  { name: "Large energy users", description: "Load-based modeling, metered reporting, and commercial terms designed for more complex operations." },
  { name: "Procurement teams", description: "Inspectable assumptions, project diligence, and documented energy and REC treatment before commitment." },
] as const;

const process = ["Review", "Model", "Agree", "Power"] as const;
const priorities = ["Lower operating costs", "Long-term budget visibility", "No equipment ownership", "Renewable-energy goals", "A direct regional relationship"] as const;

export function RegionalProjectFeature() {
  return (
    <>
      <Reveal className="regional-project-feature">
        <div className="regional-project-main">
          <div className="regional-project-diagram" aria-labelledby="buyer-model-steps">
            <h3 id="buyer-model-steps" className="sr-only">Why businesses choose NSoul</h3>
            <ol>
              {responsibilitySteps.map(({ icon: Icon, title, description }, index) => (
                <li className="regional-project-node" key={title}>
                  <div className="regional-project-icon" aria-hidden="true"><Icon strokeWidth={1.6} /></div>
                  <div><h3>{title}</h3><p>{description}</p></div>
                  {index < responsibilitySteps.length - 1 ? <span className="regional-project-connector" aria-hidden="true" /> : null}
                </li>
              ))}
            </ol>
            <p className="regional-project-note">The opportunity is evaluated around your business, your actual energy use, and the benefits that matter to your organization.</p>
          </div>

          <div className="regional-project-snapshot">
            <div className="regional-project-facts" aria-label="Potential business benefits">
              {protectionAnswers.map((fact) => (
                <article key={fact.title}>
                  <strong>{fact.value}</strong>
                  <h3>{fact.title}</h3>
                  <p>{fact.copy}</p>
                </article>
              ))}
            </div>

            <div className="regional-project-roles">
              <h3>Built for businesses of every scale</h3>
              {commercialRoles.map((role) => <div key={role.name}><strong>{role.name}</strong><p>{role.description}</p></div>)}
            </div>
          </div>
        </div>

        <ol className="regional-project-process" aria-label="Customer journey: review, model, agree, power">
          {process.map((step, index) => <li key={step}><span>{step}</span>{index < process.length - 1 ? <ArrowRight aria-hidden="true" /> : null}</li>)}
        </ol>
      </Reveal>

      <Reveal className="buyer-confirmation-panel">
        <div><p className="eyebrow">Start with your priorities</p><h3>What could better power do for your business?</h3></div>
        <ul>{priorities.map((priority) => <li key={priority}>{priority}</li>)}</ul>
        <Link href="/energy-assessment" aria-label="Request an Energy Assessment">Request an Assessment <ArrowRight aria-hidden="true" /></Link>
      </Reveal>
    </>
  );
}
