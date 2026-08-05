import { ArrowRight, Building2, MapPin } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/ui/reveal";
import { TermSheetLink } from "@/components/ui/term-sheet-link";
import { TrackedLink } from "@/components/ui/tracked-link";

const opportunityQuestions = [
  { question: "Can this work for my business?", answer: "Start with actual usage", detail: "We review your bills, daytime demand, facility location, and operating plans." },
  { question: "Why Oklahoma?", answer: "Built for this region", detail: "NSoul develops around Oklahoma facilities, utility territories, land, and local operating conditions." },
  { question: "Why local?", answer: "Closer accountability", detail: "A visible regional project and direct relationship make status and responsibility easier to understand." },
  { question: "Why not only the utility?", answer: "Add a long-term option", detail: "Your utility remains essential. Local solar may add metered energy, cost visibility, and renewable value." },
  { question: "How do we determine fit?", answer: "Five checks before a proposal", detail: "Usage, location, utility pathway, project economics, and contract readiness must align." },
] as const;

const developmentStages = [
  { title: "Actual energy use", detail: "Bills, rates, demand, and operating hours" },
  { title: "Facility and region", detail: "Location, occupancy horizon, and local opportunity" },
  { title: "Utility pathway", detail: "Service territory, interconnection, and delivery" },
  { title: "Commercial comparison", detail: "Proposed pricing compared with the utility baseline" },
  { title: "Clear decision", detail: "Advance only when the technical and business fit is credible" },
] as const;

export function CornerstoneProjectSection({ termSheetAvailable }: { termSheetAvailable: boolean }) {
  return (
    <section id="regional-development" className="section cornerstone-project-section">
      <div className="container">
        <Reveal className="cornerstone-project-heading">
          <div>
            <p className="eyebrow">Opportunity model</p>
            <h2>Built around your business, not a standard system.</h2>
          </div>
          <p>NSoul starts with your facility, actual electricity use, and long-term operating plans. A local project advances only when the location, utility pathway, economics, and business demand align.</p>
        </Reveal>

        <div className="cornerstone-intelligence">
          <Reveal className="cornerstone-map-panel">
            <div className="cornerstone-panel-label"><MapPin aria-hidden="true" />Oklahoma opportunity model</div>
            <div className="cornerstone-map" role="img" aria-label="Illustrative opportunity model showing an Oklahoma solar project connected to representative commercial energy demand. No customer, utility, or infrastructure locations are shown.">
              <svg viewBox="0 0 680 390" aria-hidden="true">
                {/* U.S. Census Bureau TIGERweb state boundary, January 1, 2025 vintage. */}
                <path className="cornerstone-oklahoma" d="M548.5 47.2 L35 47.2 L35 90.9 L248.6 90.9 L248.7 260.4 L254.1 259.2 L270.4 276.4 L277.1 276.7 L279.3 272.9 L291 276.8 L293.6 269.4 L297.1 273.7 L301.2 274.2 L300.3 275.8 L305.1 279.9 L306.3 290.7 L316.5 292.1 L320.7 290.1 L329.2 296.4 L333.2 295.6 L337.1 298.5 L348.3 295.4 L356.4 304 L361.5 302 L365 295.7 L378.8 299.5 L383.2 296 L384.6 298.2 L382.5 303.1 L384.7 309 L394.9 310.3 L393.3 319.7 L402.8 321.9 L414.4 310.2 L420.2 313.5 L420.8 318.2 L429.3 317.7 L429.2 323.2 L431.8 325.3 L435.9 325 L438.6 319.5 L438.5 322.1 L440.2 319.2 L444 321.3 L447.2 316.8 L450.3 322.8 L447.6 325.3 L448.4 330.4 L452.6 334.1 L456 332 L455.6 326.5 L458.7 325.4 L455.9 322.4 L460.6 322.9 L463.5 313.2 L464.1 315.1 L468.1 313.1 L471.2 321.8 L476.8 320.9 L479.1 324.8 L483.6 323.5 L485.9 316.7 L491.5 318.6 L488.6 322.9 L495.5 324.8 L497.7 329.3 L503.2 329 L508.7 336.9 L512.4 329.6 L520.1 330.8 L522.7 323.7 L532.1 323.3 L533.1 320.5 L536.8 321.9 L538.7 319.5 L545.4 323.9 L546.5 321.7 L550.6 322.6 L551 318.6 L559.5 317.8 L562.2 314.4 L565.1 315.8 L565.8 319.9 L568.2 318.4 L573 321.1 L583.9 320.5 L589.1 312.7 L595.6 315.1 L595.9 317.8 L598.8 316.3 L598.1 319.8 L599.8 316.7 L601.2 321.4 L606.6 321.5 L613.9 331.7 L617.2 332.8 L617.3 329.6 L618.5 332.8 L621.4 330.4 L619.5 332.5 L623.5 333.5 L623.3 336.4 L623.4 334.3 L625.7 335.4 L624.7 336.7 L629.9 335.5 L629.1 339.2 L631.4 337.2 L633.3 338.8 L633.8 336.9 L635.8 338.6 L633.7 340.5 L636.7 339.1 L635.1 341.9 L638.4 340.8 L638.4 343 L641.1 341.1 L645 187.6 L631.7 90.9 L631.7 47.3 Z" />
                <path className="cornerstone-corridor" d="M265 215 C342 184 406 157 480 154 M265 215 C350 218 430 224 538 238 M265 215 C357 255 438 278 575 290" />
                <circle className="cornerstone-project-halo" cx="265" cy="215" r="17" />
                <circle className="cornerstone-project-node" cx="265" cy="215" r="9" />
                <rect className="cornerstone-facility-node" x="472" y="146" width="16" height="16" rx="3" />
                <rect className="cornerstone-facility-node" x="530" y="230" width="16" height="16" rx="3" />
                <rect className="cornerstone-facility-node" x="567" y="282" width="16" height="16" rx="3" />
              </svg>
              <span className="cornerstone-map-label cornerstone-map-label--state">Oklahoma</span>
              <span className="cornerstone-map-label cornerstone-map-label--project"><MapPin aria-hidden="true" />Candidate project</span>
              <span className="cornerstone-map-label cornerstone-map-label--corridor">Local opportunity</span>
              <span className="cornerstone-map-label cornerstone-map-label--region"><Building2 aria-hidden="true" />Your business demand</span>
            </div>
            <div className="cornerstone-map-legend" aria-label="Opportunity model legend">
              <span><i className="is-project" />Candidate project</span>
              <span><i className="is-facility" />Representative facility</span>
              <span><i className="is-relationship" />Illustrative relationship</span>
            </div>
            <p>Illustrative model only. No customer, utility, or infrastructure locations are shown.</p>
          </Reveal>

          <Reveal className="cornerstone-facts-panel" delay={0.05}>
            <div className="cornerstone-panel-label">What makes an opportunity work</div>
            <dl>
              {opportunityQuestions.map(({ question, answer, detail }) => <div key={question}><dt>{question}</dt><dd>{answer}</dd><p>{detail}</p></div>)}
            </dl>
          </Reveal>

          <Reveal className="cornerstone-status-panel" delay={0.1}>
            <div className="cornerstone-status-heading">
              <div><p className="eyebrow">Fit assessment</p><h3>From bills to a clear answer</h3></div>
              <span>Five practical checks</span>
            </div>
            <ol>
              {developmentStages.map((stage, index) => (
                <li key={stage.title}>
                  <span className="cornerstone-stage-index">{String(index + 1).padStart(2, "0")}</span>
                  <span><strong>{stage.title}</strong><small>{stage.detail}</small></span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <Reveal className="cornerstone-project-actions">
          <p>A facility is a potential fit only after its actual energy use, location, utility pathway, project economics, and commercial requirements have been reviewed.</p>
          <div>
            <TrackedLink className="button button--primary" href="/energy-assessment" event="project_cta_click" eventContext="regional-development">
              Check Your Facility <ArrowRight aria-hidden="true" />
            </TrackedLink>
            <TermSheetLink available={termSheetAvailable} className="button button--secondary" label="Download Indicative Term Sheet" context="regional-development" />
            <Link className="button button--secondary" href="/project-diligence">View Project Diligence</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
