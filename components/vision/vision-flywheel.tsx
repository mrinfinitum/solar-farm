const flywheel = [
  { title: "Sunlight", copy: "A natural resource converted into productive infrastructure." },
  { title: "Energy", copy: "Locally generated electricity for commercial and community use." },
  { title: "Revenue", copy: "Long-term contracted cash flow from operating energy assets." },
  { title: "Reinvestment", copy: "Capital directed into additional projects, resilience, and growth." },
  { title: "Community impact", copy: "A growing ability to support housing, opportunity, education, and local initiatives." },
] as const;

export function VisionFlywheel() {
  return (
    <section className="vision-flywheel" aria-labelledby="flywheel-title">
      <div className="container">
        <div className="vision-section-head vision-section-head--dark">
          <div><p className="eyebrow">The NSoul flywheel</p><h2 id="flywheel-title">Value designed to move forward.</h2></div>
          <p>Solar infrastructure creates a cycle of productive ownership: generate, operate, reinvest, and expand the capacity to serve.</p>
        </div>
        <ol className="vision-flywheel__rail">
          {flywheel.map((item, index) => (
            <li key={item.title}>
              <span>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
