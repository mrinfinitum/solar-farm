"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, Building2, ChevronDown, Columns3, ContactRound, FileText, FolderKanban, Import, LayoutDashboard, LogOut, Map, Menu, Plus, Search, Settings, Users, X } from "lucide-react";
import { ProjectMark } from "@/components/ui/project-mark";
import { createClient } from "@/lib/supabase/client";
import type { SessionProfile } from "@/lib/auth/session";

const nav=[
  ["Overview","/dashboard",LayoutDashboard],["Properties","/dashboard/properties",Building2],["Map","/dashboard/map",Map],["Comparisons","/dashboard/comparisons",Columns3],["Projects","/dashboard/projects",FolderKanban],["Off-Takers","/dashboard/offtakers",Users],["Contacts","/dashboard/contacts",ContactRound],["Documents","/dashboard/documents",FileText],["Imports","/dashboard/imports",Import],["Settings","/dashboard/settings",Settings],
] as const;

export function DashboardShell({ profile, children }: { profile: SessionProfile; children: React.ReactNode }) {
  const pathname=usePathname(); const [open,setOpen]=useState(false); const [userOpen,setUserOpen]=useState(false);
  async function logout(){await createClient()?.auth.signOut(); window.location.assign("/login");}
  return <div className="finder-app">
    <aside className={`finder-sidebar ${open?"is-open":""}`}><div className="finder-logo"><ProjectMark/><div><strong>NSOUL</strong><span>Cornerstone Site Finder</span></div><button onClick={()=>setOpen(false)} aria-label="Close navigation"><X/></button></div><nav aria-label="Dashboard navigation">{nav.map(([label,href,Icon])=><Link key={href} href={href} onClick={()=>setOpen(false)} className={pathname===href||href!=="/dashboard"&&pathname.startsWith(href)?"is-active":""}><Icon size={17}/><span>{label}</span></Link>)}</nav><div className="finder-sidebar-foot"><span>Private workspace</span><strong>{profile.organization}</strong><small>Evidence-first development</small></div></aside>
    <div className="finder-main"><header className="finder-topbar"><button className="finder-mobile-menu" onClick={()=>setOpen(true)} aria-label="Open navigation"><Menu/></button><div className="finder-search"><Search size={16}/><input aria-label="Global search" placeholder="Search properties, contacts, projects…"/><kbd>⌘ K</kbd></div><div className="finder-top-actions"><Link className="finder-button finder-button--primary" href="/dashboard/properties/new"><Plus size={15}/>New property</Link><Link className="finder-button finder-button--quiet" href="/dashboard/imports"><Import size={15}/>Import CSV</Link><button className="finder-icon-button" aria-label="Notifications placeholder" title="Notifications are not configured"><Bell size={17}/></button><div className="finder-user"><button onClick={()=>setUserOpen(!userOpen)} aria-expanded={userOpen}><span>{profile.fullName.slice(0,1).toUpperCase()}</span><div><strong>{profile.fullName}</strong><small>{profile.role}</small></div><ChevronDown size={14}/></button>{userOpen&&<div className="finder-user-menu"><button onClick={logout}><LogOut size={15}/>Sign out</button></div>}</div></div></header><main className="finder-content">{children}</main></div>{open&&<button className="finder-backdrop" onClick={()=>setOpen(false)} aria-label="Close navigation overlay"/>}
  </div>;
}
