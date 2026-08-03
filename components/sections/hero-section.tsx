import Image from "next/image";
import { ArrowDown, ArrowUpRight, CalendarClock } from "lucide-react";
import { TrackedLink } from "@/components/ui/tracked-link";

export function HeroSection() {
  return (
    <section id="top" className="hero-section">
      <div className="hero-panel">
        <div className="container hero-copy hero-copy--centered">
          <p className="eyebrow hero-eyebrow">
            <span aria-hidden="true">✦</span>
            Commercial energy · Southeast Oklahoma
          </p>
          <h1>
            Commercial energy that costs less <em>from day one.</em>
          </h1>
          <p className="hero-description">
            We develop and operate regional solar infrastructure that gives commercial and industrial facilities access to predictable, discounted electricity—with no upfront equipment investment.
          </p>
          <div className="hero-actions">
            <TrackedLink className="hero-primary-cta" href="#project" event="hero_primary_cta">
              Explore the project
              <span><ArrowDown aria-hidden="true" size={17} /></span>
            </TrackedLink>
            <TrackedLink className="hero-text-link" href="#contact" event="hero_secondary_cta">
              Discuss your energy needs <ArrowUpRight aria-hidden="true" size={15} />
            </TrackedLink>
          </div>
          <div className="hero-proof">
            <p>1.5 MW project <span /> 2.25M kWh/year <span /> Targeted 2027 operation</p>
            <small><CalendarClock aria-hidden="true" size={14} /> Subject to utility interconnection and final approvals</small>
          </div>
        </div>

        <div className="hero-landscape">
          <Image
            src="/brand/nsoul-hero-solar-field.png"
            alt="Illustrative commercial-scale ground-mounted solar array in rolling green terrain"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1500px"
          />
          <div className="hero-art-label">
            <span>Illustrative concept</span>
            <strong>Regional generation · commercial demand</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
