"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs=[["Overview",""],["Eligibility","eligibility"],["Documents","documents"],["Timeline","timeline"],["Contacts","contacts"],["Questions","questions"],["Costs","costs"],["Reimbursement","reimbursement"],["Activity","activity"]] as const;
export function FundingTabs({projectId}:{projectId:string}){const pathname=usePathname();return <nav className="funding-tabs" aria-label="USDA REAP workspace">{tabs.map(([label,slug])=>{const href=`/dashboard/projects/${projectId}/funding/reap${slug?`/${slug}`:""}`;return <Link className={pathname===href?"is-active":""} key={slug} href={href}>{label}</Link>})}</nav>}
