const pillars = [
  {
    title: "Energy",
    copy: "Develop and operate reliable solar infrastructure designed around real sites, responsible delivery, and long-term commercial relationships.",
  },
  {
    title: "Technology",
    copy: "Use NSoul Studio to manage property intelligence, development, financing, documentation, and operations with greater discipline.",
  },
  {
    title: "Community",
    copy: "Direct part of long-term success toward initiatives that expand housing, stability, opportunity, and local resilience.",
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
          {pillars.map((pillar, index) => (
            <article key={pillar.title}>
              <span>0{index + 1}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.copy}</p>
            </article>
          ))}
        </div>
        <p className="vision-intent-note">Over time, NSoul intends to establish clearly defined community-impact programs and partnerships as operating success creates the capacity to support them responsibly.</p>
      </div>
    </section>
  );
}
