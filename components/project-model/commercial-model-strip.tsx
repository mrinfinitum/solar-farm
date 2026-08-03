import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import type { CommercialRole } from "@/lib/project-model-data";

export function CommercialModelStrip({ roles }: { roles: readonly CommercialRole[] }) {
  return (
    <Reveal className="pm-card pm-commercial-strip">
      <div className="pm-strip-heading">
        <p>Aligned commercial model</p>
        <h3>A commercial structure designed to align incentives.</h3>
      </div>
      <div className="pm-role-grid">
        {roles.map((role, index) => (
          <div className="pm-role" key={role.name}>
            <span>0{index + 1}</span>
            <strong>{role.name}</strong>
            <p>{role.description}</p>
            {index < roles.length - 1 && <ArrowRight aria-hidden="true" />}
          </div>
        ))}
      </div>
    </Reveal>
  );
}
