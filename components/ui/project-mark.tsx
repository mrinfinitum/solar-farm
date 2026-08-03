import { cn } from "@/lib/utils";

export function ProjectMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("project-mark", className)}
      viewBox="0 0 32 32"
      fill="none"
    >
      <circle cx="16" cy="16" r="5.4" fill="currentColor" />
      <circle cx="16" cy="16" r="9.1" stroke="currentColor" strokeWidth="1.2" opacity=".45" />
      <path d="M16 2v4M16 26v4M2 16h4M26 16h4M6.1 6.1l2.8 2.8M23.1 23.1l2.8 2.8M25.9 6.1l-2.8 2.8M8.9 23.1l-2.8 2.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="wordmark">
      <ProjectMark />
      <span><strong>{compact ? "N" : "NSOUL"}</strong></span>
    </span>
  );
}
