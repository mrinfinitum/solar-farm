import { FileDown } from "lucide-react";

import { TERM_SHEET_PATH } from "@/lib/project-data";
import { cn } from "@/lib/utils";

type TermSheetLinkProps = {
  available: boolean;
  className?: string;
  compact?: boolean;
  label?: string;
};

export function TermSheetLink({
  available,
  className,
  compact = false,
  label = "Download Term Sheet",
}: TermSheetLinkProps) {
  const content = (
    <>
      <FileDown aria-hidden="true" size={16} strokeWidth={1.8} />
      {!compact && label}
    </>
  );

  if (!available) {
    return (
      <span
        aria-disabled="true"
        aria-label="Download Indicative Term Sheet (not yet available)"
        className={cn(className, "is-disabled")}
        role="link"
        title="Indicative term sheet coming soon"
      >
        {content}
      </span>
    );
  }

  return (
    <a
      aria-label="Download Indicative Term Sheet"
      className={className}
      href={TERM_SHEET_PATH}
      download
    >
      {content}
    </a>
  );
}
