import Image from "next/image";
import { ArrowUpRight, Compass, MapPin } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";

const exampleRows = [
  ["Example market", "Regional commercial energy user"],
  ["Representative scale", "1–5 MW DC"],
  ["Site type", "Ground-mounted solar array"],
  ["Generation profile", "Modeled around facility demand"],
  ["Commercial model", "Illustrative long-term PPA"],
  ["Customer capital", "Potentially $0 upfront"],
] as const;

const examplePath = [
  { title: "Site and demand screening", status: "complete", label: "Typical first" },
  { title: "Utility feasibility", status: "active", label: "Typical next" },
  { title: "Preliminary engineering", status: "pending", label: "Then" },
  { title: "Commercial structuring", status: "future", label: "Final model" },
] as const;

export function ProjectSection() {
  return (
    <section id="project" className="section project-section project-section--premium">
      <div className="container">
        <SectionHeading
          eyebrow="Illustrative project model"
          title="An example of how a regional solar project could be structured."
          description="Representative values show the shape of a commercial solar development, not a specific site, offer, or operating forecast."
        />

        <div className="project-dashboard">
          <Reveal className="project-main-card">
            <div className="card-kicker"><span>Example 01</span><span>Illustrative only</span></div>
            <div className="project-card-title">
              <div>
                <p>Representative regional energy infrastructure</p>
                <h3>Commercial Solar Project</h3>
              </div>
              <span className="project-arrow"><ArrowUpRight aria-hidden="true" /></span>
            </div>
            <div className="project-data-grid">
              {exampleRows.map(([label, value], index) => (
                <div key={label}>
                  <i aria-hidden="true">0{index + 1}</i>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="project-owner">
              <span>Potential developer / system owner</span>
              <strong>NSoul LLC</strong>
            </div>
          </Reveal>

          <Reveal className="map-card" delay={0.08}>
            <div className="map-topline">
              <span><Compass aria-hidden="true" size={15} /> Representative geography</span>
              <code>ILLUSTRATIVE · NOT A LIVE SITE</code>
            </div>
            <div className="map-canvas">
              <div className="map-grid" aria-hidden="true" />
              <svg viewBox="0 0 520 330" role="img" aria-label="Illustrative regional map showing a possible commercial solar service area">
                <path className="ok-outline" d="M42 92h170V74h178l7 38 49 15 19 43-13 33 21 38-41 21-48-9-49 17-57-25-44 12-37-26-57 6-19-51H42Z" />
                <path className="region-shape" d="m335 220 49-14 38 16 31-10 20 29-41 21-48-9-49 17Z" />
                <path className="map-route" d="M171 149c63 0 108 17 151 57 27 26 51 42 94 43" />
                <circle className="map-ring" cx="420" cy="247" r="18" />
                <circle className="map-dot" cx="420" cy="247" r="5" />
              </svg>
              <div className="map-label map-label--state"><span>Example</span> service territory</div>
              <div className="map-label map-label--site"><MapPin aria-hidden="true" size={13} /><span>Candidate</span> energy site</div>
              <div className="region-tag">Regional opportunity</div>
            </div>
          </Reveal>

          <Reveal className="readiness-card" delay={0.12}>
            <div className="readiness-heading">
              <div>
                <p className="eyebrow">Example sequence</p>
                <h3>Typical development path</h3>
              </div>
              <span>Illustrative</span>
            </div>
            <div className="readiness-list">
              {examplePath.map((step) => (
                <div key={step.title}>
                  <span>{step.title}</span>
                  <StatusBadge status={step.status}>{step.label}</StatusBadge>
                </div>
              ))}
            </div>
            <p className="readiness-note">Sequence and scope vary by site and remain subject to utility, commercial, regulatory, and financing review.</p>
          </Reveal>

          <Reveal className="facility-story-card" delay={0.15}>
            <div className="facility-story-copy">
              <p className="eyebrow">How the relationship works</p>
              <h3>A repeatable model for commercial demand.</h3>
              <p>In a typical structure, we could develop, own, and operate the solar asset while a qualified customer purchases energy through a long-term agreement, without buying or maintaining the equipment.</p>
              <span>Illustrative concept · not a project offer or commitment</span>
            </div>
            <div className="facility-story-art">
              <Image
                src="/brand/nsoul-commercial-facility-isolated.png"
                alt="Isolated illustration of a commercial facility connected to a ground-mounted solar array"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
