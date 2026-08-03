"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  ["Overview","overview"],["Interconnection","interconnection"],["Engineering + EPC","engineering"],
  ["Off-takers","offtakers"],["PPA","ppa"],["Permitting","permitting"],["Finance","finance"],
  ["Incentives","incentives"],["Documents","documents"],["Tasks","tasks"],["Construction","construction"],["Operations","operations"],["Activity","activity"],
] as const;

export function ProjectSubnav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  return <nav className="project-subnav" aria-label="Project workspace">{tabs.map(([label,slug])=><Link className={pathname.endsWith(`/${slug}`)?"is-active":""} key={slug} href={`/dashboard/projects/${projectId}/${slug}`}>{label}</Link>)}</nav>;
}
