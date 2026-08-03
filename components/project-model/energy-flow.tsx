type EnergyFlowProps = {
  steps: readonly string[];
};

export function EnergyFlow({ steps }: EnergyFlowProps) {
  return (
    <div className="pm-energy-flow" aria-label={steps.join(" to ")}>
      <svg viewBox="0 0 900 50" preserveAspectRatio="none" aria-hidden="true">
        <path className="pm-flow-track" d="M18 25H882" />
        <path className="pm-flow-energy" d="M18 25H882" />
        {[18, 306, 594, 882].map((x) => <circle key={x} className="pm-flow-node" cx={x} cy="25" r="6" />)}
        <circle className="pm-flow-particle pm-flow-particle--one" cx="18" cy="25" r="4" />
        <circle className="pm-flow-particle pm-flow-particle--two" cx="18" cy="25" r="3" />
      </svg>
      <div className="pm-flow-labels">
        {steps.map((step, index) => <span key={step}><i>0{index + 1}</i>{step}</span>)}
      </div>
    </div>
  );
}
