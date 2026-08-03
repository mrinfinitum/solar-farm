import type { DevelopmentStatus } from "@/lib/project-data";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  children,
}: {
  status: DevelopmentStatus;
  children: React.ReactNode;
}) {
  return <span className={cn("status-badge", `status-badge--${status}`)}>{children}</span>;
}

