import { CheckCircle2 } from "lucide-react";

const principles = [
  "Development-stage transparency",
  "Utility review before final commitments",
  "Engineering-led project validation",
  "Commercial terms documented before financing",
  "Long-term operations responsibility",
] as const;

export function TrustStrip() {
  return (
    <section className="trust-strip" aria-labelledby="trust-strip-title">
      <div className="container trust-strip-shell">
        <div>
          <p className="eyebrow">Project approach</p>
          <h2 id="trust-strip-title">Clear gates. Documented decisions.</h2>
        </div>
        <ul>
          {principles.map((principle) => (
            <li key={principle}><CheckCircle2 aria-hidden="true" />{principle}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
