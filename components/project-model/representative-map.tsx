import { Reveal } from "@/components/ui/reveal";

export function RepresentativeMap({ chips }: { chips: readonly string[] }) {
  return (
    <Reveal className="pm-card pm-map-card" delay={0.08}>
      <div className="pm-card-header pm-compact-header">
        <p>Representative geography</p>
        <span>Regional model · not live data</span>
      </div>

      <div className="pm-map-visual">
        <svg viewBox="0 0 600 360" role="img" aria-labelledby="pm-map-title pm-map-description">
          <title id="pm-map-title">Representative southeast Oklahoma project geography</title>
          <desc id="pm-map-description">A stylized regional intelligence map showing a candidate rural solar site, a nearby commercial load center, and an indicative utility service area.</desc>
          <defs>
            <pattern id="pm-map-grid" width="34" height="34" patternUnits="userSpaceOnUse">
              <path d="M34 0H0V34" fill="none" stroke="rgba(173,255,204,.06)" strokeWidth="1" />
            </pattern>
            <radialGradient id="pm-site-glow">
              <stop offset="0" stopColor="#76f0a7" stopOpacity=".5" />
              <stop offset="1" stopColor="#76f0a7" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="600" height="360" fill="url(#pm-map-grid)" />
          <g className="pm-contours" aria-hidden="true">
            <path d="M22 291c85-49 146-40 220-2s152 44 330-22" />
            <path d="M8 318c104-48 173-36 246 1s153 34 340-11" />
            <path d="M71 37c68 43 145 49 236 11s171-25 245 19" />
          </g>
          <path className="pm-utility-area" d="M108 92h192V68h176l8 48 52 18 21 48-16 38 23 42-48 24-55-10-54 19-64-29-52 14-44-31-65 7-22-59h-52Z" />
          <path className="pm-ok-outline" d="M71 110h166V91h205l8 45 53 17 21 47-14 38 22 40-45 22-52-9-51 18-61-27-49 13-41-29-61 7-20-55H71Z" />
          <path className="pm-southeast-region" d="m384 247 51-18 43 18 35-11 19 42-45 22-52-9-51 18Z" />
          <path className="pm-site-connector" d="M430 274C407 248 378 221 335 197" />
          <circle className="pm-site-halo" cx="430" cy="274" r="44" fill="url(#pm-site-glow)" />
          <circle className="pm-site-ring" cx="430" cy="274" r="17" />
          <circle className="pm-site-dot" cx="430" cy="274" r="6" />
          <rect className="pm-load-marker" x="326" y="188" width="18" height="18" rx="4" />
          <path className="pm-load-bolt" d="m337 190-7 9h5l-3 7 8-10h-5Z" />
          <g className="pm-coordinate-labels" aria-hidden="true">
            <text x="16" y="22">34.0 N</text><text x="512" y="22">94.6 W</text><text x="16" y="346">GRID 07</text>
          </g>
        </svg>
        <span className="pm-map-label pm-map-label--site">Candidate project site</span>
        <span className="pm-map-label pm-map-label--load">Regional load center</span>
        <span className="pm-map-label pm-map-label--utility">Utility service area</span>
      </div>

      <div className="pm-map-chips">
        {chips.map((chip) => <span key={chip}>{chip}</span>)}
      </div>
    </Reveal>
  );
}
