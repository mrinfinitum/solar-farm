const commitments = [
  "Build responsibly",
  "Tell the truth about project risk",
  "Use sound financial discipline",
  "Respect land, customers, and communities",
  "Measure impact",
  "Reinvest for the long term",
  "Avoid sacrificing mission for short-term gain",
] as const;

export function VisionCommitment() {
  return (
    <section className="vision-commitment section" aria-labelledby="commitment-title">
      <div className="container vision-commitment__layout">
        <div>
          <p className="eyebrow">Our commitment</p>
          <h2 id="commitment-title">The way we build matters.</h2>
          <p>Ambition only earns trust when it is paired with candor, patience, and disciplined execution.</p>
        </div>
        <ol>
          {commitments.map((commitment, index) => <li key={commitment}><span>0{index + 1}</span><strong>{commitment}</strong></li>)}
        </ol>
      </div>
    </section>
  );
}
