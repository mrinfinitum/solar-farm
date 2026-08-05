import { ArrowRight, Building2, MapPin } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/ui/reveal";
import { TermSheetLink } from "@/components/ui/term-sheet-link";
import { TrackedLink } from "@/components/ui/tracked-link";

const projectFacts = [
  { label: "Opportunity focus", value: "Regional Commercial Demand", copy: "Projects are evaluated around long-term commercial electricity needs." },
  { label: "Project design", value: "Built Around Customer Usage", copy: "Each project is designed around expected customer demand rather than a standard system size." },
  { label: "Project sizing", value: "Right-Sized Generation", copy: "The project size is determined by engineering, site conditions, customer demand, and utility review." },
  { label: "Production planning", value: "Engineering-Based Production", copy: "Independent production modeling estimates expected annual electricity output before construction." },
  { label: "Customer agreement", value: "Long-Term Energy Partnership", copy: "Commercial terms are developed specifically for the participating customer." },
  { label: "Project schedule", value: "Development Milestones", copy: "Utility review, engineering, permitting, financing, and construction determine the final schedule." },
  { label: "Ownership model", value: "We Develop. We Build. We Operate.", copy: "Your business purchases electricity, not solar equipment." },
] as const;

const developmentStages = [
  { title: "Opportunity Review", copy: "Does the location and business demand fit?" },
  { title: "Technical Validation", copy: "Utility review, engineering, and production modeling." },
  { title: "Commercial Proposal", copy: "Pricing, commercial terms, and customer review." },
  { title: "Project Delivery", copy: "Financing, construction, and commissioning." },
  { title: "Long-Term Partnership", copy: "NSoul operates the project while the customer purchases electricity." },
] as const;

export function CornerstoneProjectSection({ termSheetAvailable }: { termSheetAvailable: boolean }) {
  return (
    <section id="regional-development" className="section cornerstone-project-section">
      <div className="container">
        <Reveal className="cornerstone-project-heading">
          <div>
            <p className="eyebrow">Opportunity model</p>
            <h2>Projects begin with business demand.</h2>
          </div>
          <p>NSoul identifies Oklahoma businesses with significant electricity usage, then evaluates whether a regional project can support long-term pricing, budget planning, and business operations.</p>
        </Reveal>

        <div className="cornerstone-intelligence">
          <Reveal className="cornerstone-map-panel">
            <div className="cornerstone-panel-label"><MapPin aria-hidden="true" />Regional opportunity model</div>
            <div className="cornerstone-map" role="img" aria-label="Illustrative Oklahoma opportunity model connecting one candidate solar project with representative manufacturing, healthcare, distribution, food-processing, and retail facilities. No actual customers are shown.">
              <svg viewBox="0 0 680 390" aria-hidden="true">
                {/* U.S. Census Bureau TIGERweb state boundary, January 1, 2025 vintage. */}
                <path className="cornerstone-oklahoma" d="M548.5 47.2 L35 47.2 L35 90.9 L248.6 90.9 L248.7 260.4 L254.1 259.2 L270.4 276.4 L277.1 276.7 L279.3 272.9 L291 276.8 L293.6 269.4 L297.1 273.7 L301.2 274.2 L300.3 275.8 L305.1 279.9 L306.3 290.7 L316.5 292.1 L320.7 290.1 L329.2 296.4 L333.2 295.6 L337.1 298.5 L348.3 295.4 L356.4 304 L361.5 302 L365 295.7 L378.8 299.5 L383.2 296 L384.6 298.2 L382.5 303.1 L384.7 309 L394.9 310.3 L393.3 319.7 L402.8 321.9 L414.4 310.2 L420.2 313.5 L420.8 318.2 L429.3 317.7 L429.2 323.2 L431.8 325.3 L435.9 325 L438.6 319.5 L438.5 322.1 L440.2 319.2 L444 321.3 L447.2 316.8 L450.3 322.8 L447.6 325.3 L448.4 330.4 L452.6 334.1 L456 332 L455.6 326.5 L458.7 325.4 L455.9 322.4 L460.6 322.9 L463.5 313.2 L464.1 315.1 L468.1 313.1 L471.2 321.8 L476.8 320.9 L479.1 324.8 L483.6 323.5 L485.9 316.7 L491.5 318.6 L488.6 322.9 L495.5 324.8 L497.7 329.3 L503.2 329 L508.7 336.9 L512.4 329.6 L520.1 330.8 L522.7 323.7 L532.1 323.3 L533.1 320.5 L536.8 321.9 L538.7 319.5 L545.4 323.9 L546.5 321.7 L550.6 322.6 L551 318.6 L559.5 317.8 L562.2 314.4 L565.1 315.8 L565.8 319.9 L568.2 318.4 L573 321.1 L583.9 320.5 L589.1 312.7 L595.6 315.1 L595.9 317.8 L598.8 316.3 L598.1 319.8 L599.8 316.7 L601.2 321.4 L606.6 321.5 L613.9 331.7 L617.2 332.8 L617.3 329.6 L618.5 332.8 L621.4 330.4 L619.5 332.5 L623.5 333.5 L623.3 336.4 L623.4 334.3 L625.7 335.4 L624.7 336.7 L629.9 335.5 L629.1 339.2 L631.4 337.2 L633.3 338.8 L633.8 336.9 L635.8 338.6 L633.7 340.5 L636.7 339.1 L635.1 341.9 L638.4 340.8 L638.4 343 L641.1 341.1 L645 187.6 L631.7 90.9 L631.7 47.3 Z" />
                <path className="cornerstone-corridor" d="M188 185 C250 160 280 164 324 174 M188 185 C260 190 322 210 378 224 M188 185 C295 150 382 156 452 184 M188 185 C310 218 424 245 514 258 M188 185 C340 178 468 186 562 208" />
                <circle className="cornerstone-project-marker" cx="188" cy="185" r="9" />
                <rect className="cornerstone-facility-marker" x="318" y="168" width="12" height="12" rx="2" />
                <rect className="cornerstone-facility-marker" x="372" y="218" width="12" height="12" rx="2" />
                <rect className="cornerstone-facility-marker" x="446" y="178" width="12" height="12" rx="2" />
                <rect className="cornerstone-facility-marker" x="508" y="252" width="12" height="12" rx="2" />
                <rect className="cornerstone-facility-marker" x="556" y="202" width="12" height="12" rx="2" />
                <g className="cornerstone-map-annotations">
                  <text x="150" y="210">Candidate solar project</text>
                  <text x="288" y="155">Regional manufacturing</text>
                  <text x="348" y="246">Healthcare</text>
                  <text x="422" y="164">Distribution</text>
                  <text x="473" y="282">Food processing</text>
                  <text x="548" y="232">Retail</text>
                </g>
              </svg>
              <span className="cornerstone-map-label cornerstone-map-label--state">Oklahoma</span>
              <span className="cornerstone-map-label cornerstone-map-label--corridor"><Building2 aria-hidden="true" />One regional energy partnership</span>
              <span className="cornerstone-map-label cornerstone-map-label--region">Illustrative commercial demand model</span>
            </div>
            <ul className="cornerstone-map-legend" aria-label="Map legend"><li><i className="cornerstone-legend-project" />Candidate solar project</li><li><i className="cornerstone-legend-facility" />Representative commercial facility</li><li><i className="cornerstone-legend-path" />Illustrative commercial relationship</li></ul>
            <p>This diagram illustrates how a regional project may support nearby commercial energy demand.</p>
          </Reveal>

          <Reveal className="cornerstone-facts-panel" delay={0.05}>
            <div className="cornerstone-panel-label">How we evaluate opportunities</div>
            <dl>
              {projectFacts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}<small>{fact.copy}</small></dd></div>)}
            </dl>
          </Reveal>

          <Reveal className="cornerstone-status-panel" delay={0.1}>
            <div className="cornerstone-status-heading">
              <div><p className="eyebrow">Customer journey</p><h3>From opportunity to partnership</h3></div>
              <span>Five clear stages</span>
            </div>
            <ol>
              {developmentStages.map((stage, index) => (
                <li key={stage.title}>
                  <span className="cornerstone-stage-index">{String(index + 1).padStart(2, "0")}</span>
                  <span><strong>{stage.title}</strong><small>{stage.copy}</small></span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <Reveal className="cornerstone-project-actions">
          <p>This representative profile is illustrative. Every project remains subject to site-specific utility review, engineering, commercial agreement, financing, permitting, and final approvals.</p>
          <div>
            <TrackedLink className="button button--primary" href="/energy-assessment" event="project_cta_click" eventContext="regional-development">
              Request an Energy Assessment <ArrowRight aria-hidden="true" />
            </TrackedLink>
            <TermSheetLink available={termSheetAvailable} className="button button--secondary" label="Download Indicative Term Sheet" context="regional-development" />
            <Link className="button button--secondary" href="/project-diligence">View Project Diligence</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
