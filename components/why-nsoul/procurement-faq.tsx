"use client";

import { ChevronDown } from "lucide-react";

import { procurementFaq } from "@/lib/content/procurement-faq";
import { trackEvent } from "@/lib/analytics";

export function ProcurementFaq() {
  return (
    <div className="procurement-faq">
      {procurementFaq.map((item) => (
        <details key={item.question} onToggle={(event) => {
          if (event.currentTarget.open) trackEvent("procurement_faq_open", { question: item.question });
        }}>
          <summary>{item.question}<ChevronDown aria-hidden="true" /></summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
