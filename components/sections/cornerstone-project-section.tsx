import { ArrowRight, Building2, MapPin, Zap } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { StatusBadge } from "@/components/ui/status-badge";
import { TermSheetLink } from "@/components/ui/term-sheet-link";
import { TrackedLink } from "@/components/ui/tracked-link";

const projectFacts = [
  ["Project location", "Idabel, Oklahoma"],
  ["County", "McCurtain County"],
  ["Proposed capacity", "1.5 MW DC"],
  ["Estimated Year 1 generation", "Approximately 2,250,000 kWh"],
  ["Commercial structure", "Indicative long-term PPA"],
  ["Target operation", "Q2/Q3 2027, subject to utility and final approvals"],
  ["Current stage", "Development"],
] as const;

const statuses = [
  ["complete", "Complete", "USDA REAP geographic eligibility verification"],
  ["pending", "Pending", "PSO utility circuit-capacity response"],
  ["pending", "Pending", "Preliminary aerial layout"],
  ["pending", "Pending", "Commercial production estimate"],
  ["pending", "Pending", "Itemized construction estimate"],
  ["active", "Active", "Commercial off-taker outreach"],
  ["future", "Future", "PPA execution, financing, permitting, and construction"],
] as const;

export function CornerstoneProjectSection({ termSheetAvailable }: { termSheetAvailable: boolean }) {
  return (
    <section id="cornerstone-project" className="section cornerstone-project-section">
      <div className="container">
        <Reveal className="cornerstone-project-heading">
          <div>
            <p className="eyebrow">Active development project</p>
            <h2>1 Cornerstone Lane Solar Farm</h2>
          </div>
          <p>A proposed 1.5 MW DC ground-mounted solar development in Idabel, Oklahoma, currently advancing through utility review, preliminary engineering, and commercial off-taker outreach.</p>
        </Reveal>

        <div className="cornerstone-intelligence">
          <Reveal className="cornerstone-map-panel">
            <div className="cornerstone-panel-label"><MapPin aria-hidden="true" />Illustrative regional location</div>
            <div className="cornerstone-map" role="img" aria-label="Illustrative map of Oklahoma highlighting southeast Oklahoma, McCurtain County, Idabel, and a regional commercial corridor. This is not live infrastructure data.">
              <svg viewBox="0 0 680 390" aria-hidden="true">
                <path className="cornerstone-oklahoma" d="M52 110h229V87h250l10 54 66 20 26 61-18 46 28 54-61 31-65-13-66 23-76-34-60 17-52-36-76 8-27-72H52Z" />
                <path className="cornerstone-southeast" d="m451 295 66-20 52 23 42-14 32 38-61 31-65-13-66 23Z" />
                <path className="cornerstone-corridor" d="M212 202c82 3 151 24 213 69 42 31 83 48 143 51" />
                <circle className="cornerstone-load" cx="425" cy="271" r="7" />
                <circle className="cornerstone-site-ring" cx="576" cy="329" r="23" />
                <circle className="cornerstone-site" cx="576" cy="329" r="8" />
              </svg>
              <span className="cornerstone-map-label cornerstone-map-label--state">Oklahoma</span>
              <span className="cornerstone-map-label cornerstone-map-label--county">McCurtain County</span>
              <span className="cornerstone-map-label cornerstone-map-label--corridor"><Building2 aria-hidden="true" />Regional commercial corridor</span>
              <span className="cornerstone-map-label cornerstone-map-label--site"><Zap aria-hidden="true" />Idabel project site</span>
            </div>
            <p>No live utility geometry or infrastructure data is shown.</p>
          </Reveal>

          <Reveal className="cornerstone-facts-panel" delay={0.05}>
            <div className="cornerstone-panel-label">Project snapshot</div>
            <dl>
              {projectFacts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
          </Reveal>

          <Reveal className="cornerstone-status-panel" delay={0.1}>
            <div className="cornerstone-status-heading">
              <div><p className="eyebrow">Current status</p><h3>Development activity</h3></div>
              <span>Updated August 2026</span>
            </div>
            <ol>
              {statuses.map(([status, label, title]) => (
                <li key={title}>
                  <StatusBadge status={status}>{label}</StatusBadge>
                  <span>{title}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <Reveal className="cornerstone-project-actions">
          <p>Project information is preliminary and subject to utility review, engineering, commercial agreement, financing, permitting, and final approvals.</p>
          <div>
            <TrackedLink className="button button--primary" href="#contact" event="project_cta_click" eventContext="cornerstone">
              Discuss an Energy Agreement <ArrowRight aria-hidden="true" />
            </TrackedLink>
            <TermSheetLink available={termSheetAvailable} className="button button--secondary" label="Download Indicative Term Sheet" context="cornerstone" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
