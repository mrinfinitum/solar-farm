import { Cpu, SunMedium, UsersRound } from "lucide-react";

const pillars = [
  {
    title: "Energy",
    signal: "Generate",
    copy: "Develop and operate reliable solar infrastructure designed around real sites, responsible delivery, and long-term commercial relationships.",
    icon: SunMedium,
  },
  {
    title: "Technology",
    signal: "Coordinate",
    copy: "Use NSoul Studio to manage property intelligence, development, financing, documentation, and operations with greater discipline.",
    icon: Cpu,
  },
  {
    title: "Community",
    signal: "Reinvest",
    copy: "Direct part of long-term success toward initiatives that expand housing, stability, opportunity, and local resilience.",
    icon: UsersRound,
  },
] as const;

export function VisionPillars() {
  return (
    <section className="vision-pillars section" aria-labelledby="pillars-title">
      <div className="container">
        <div className="vision-section-head">
          <div><p className="eyebrow">Three connected pillars</p><h2 id="pillars-title">Infrastructure with a wider purpose.</h2></div>
          <p>Each pillar strengthens the others. Sound development supports durable ownership; durable ownership creates the capacity for future service.</p>
        </div>
        <div className="vision-pillars__grid">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <article key={pillar.title}>
                <div className="vision-pillars__visual" aria-hidden="true">
                  <div className="vision-pillars__visual-meta"><span>0{index + 1}</span><small>{pillar.signal}</small></div>
                  <div className="vision-pillars__glyph"><Icon size={42} strokeWidth={1.45} /></div>
                  <i /><i /><i />
                </div>
                <div className="vision-pillars__copy">
                  <h3>{pillar.title}</h3>
                  <p>{pillar.copy}</p>
                </div>
              </article>
            );
          })}
        </div>
        <p className="vision-intent-note"><span>Connected by long-term ownership</span> Over time, NSoul intends to establish clearly defined community-impact programs and partnerships as operating success creates the capacity to support them responsibly.</p>
      </div>
    </section>
  );
}
