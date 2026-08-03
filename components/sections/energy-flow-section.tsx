import Image from "next/image";
import { Zap } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";

export function EnergyFlowSection() {
  return (
    <section className="energy-flow-section" aria-labelledby="energy-flow-title">
      <div className="energy-flow-grid" aria-hidden="true" />
      <div className="container energy-flow-layout">
        <Reveal className="energy-flow-copy">
          <p className="eyebrow">The connection</p>
          <h2 id="energy-flow-title">
            Sunlight in.<br />
            <em>Business powered.</em>
          </h2>
          <p>
            We build the generation. You put the energy to work.
          </p>
        </Reveal>

        <Reveal className="energy-flow-graphic energy-flow-graphic--models" delay={0.08}>
          <div className="energy-model energy-model--solar">
            <div className="energy-model__art">
              <Image
                src="/brand/nsoul-whimsical-solar.png"
                alt="Whimsical isolated 3D illustration of a solar-panel installation"
                fill
                sizes="(max-width: 768px) 38vw, 340px"
              />
            </div>
            <span><small>01 · Generate</small><strong>Local solar</strong></span>
          </div>

          <div className="energy-current energy-current--left" aria-hidden="true">
            <i /><i /><i />
          </div>

          <div className="energy-core">
            <span className="energy-core__ring" aria-hidden="true" />
            <Zap aria-hidden="true" />
            <small>Contracted</small>
            <strong>POWER</strong>
          </div>

          <div className="energy-current energy-current--right" aria-hidden="true">
            <i /><i /><i />
          </div>

          <div className="energy-model energy-model--business">
            <div className="energy-model__art">
              <Image
                src="/brand/nsoul-whimsical-business.png"
                alt="Whimsical isolated 3D illustration of a bright green business building"
                fill
                sizes="(max-width: 768px) 38vw, 360px"
              />
            </div>
            <span><small>02 · Deliver</small><strong>Your business</strong></span>
          </div>
        </Reveal>

      </div>

      <div className="energy-flow-marquee" aria-hidden="true">
        GENERATE · DELIVER · SAVE · GENERATE · DELIVER · SAVE ·
      </div>
    </section>
  );
}
