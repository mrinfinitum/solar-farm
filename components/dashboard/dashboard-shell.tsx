"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell, Building2, ChevronDown, ChevronLeft, ContactRound, FileText, FolderKanban, Inbox,
  HandCoins, Import, LayoutDashboard, LogOut, Map, Menu, Plus, Search, Settings, Users, X,
} from "lucide-react";
import { ProjectMark } from "@/components/ui/project-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { logoutAction } from "@/app/auth/actions";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import type { SessionProfile } from "@/lib/auth/session";

const navigation = [
  ["Overview", "/dashboard", LayoutDashboard], ["Properties", "/dashboard/properties", Building2],
  ["Projects", "/dashboard/projects", FolderKanban], ["Off-takers", "/dashboard/offtakers", Users],
  ["Contacts", "/dashboard/contacts", ContactRound], ["Documents", "/dashboard/documents", FileText],
  ["Imports", "/dashboard/imports", Import], ["Map", "/dashboard/map", Map],
  ["Settings", "/dashboard/settings", Settings],
] as const;

export function DashboardShell({ profile, children }: { profile: SessionProfile; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const items = ADMIN_ROLES.includes(profile.role)
    ? [...navigation, ["Submissions", "/dashboard/submissions", Inbox] as const, ["Capital", "/dashboard/capital", HandCoins] as const, ["Users", "/dashboard/users", Users] as const]
    : navigation;

  return <div className={`finder-app ${collapsed ? "finder-app--collapsed" : ""}`}>
    <aside className={`finder-sidebar ${mobileOpen ? "is-open" : ""}`}>
      <div className="finder-logo"><ProjectMark /><div><strong>NSOUL</strong><span>Development Studio</span></div><button onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></button></div>
      <nav aria-label="Dashboard navigation">{items.map(([label, href, Icon]) => { const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href)); return <Link key={href} href={href} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)} className={active ? "is-active" : ""}><Icon size={18} /><span>{label}</span></Link>; })}</nav>
      <div className="finder-sidebar-foot"><span>Organization</span><strong>{profile.organization}</strong><small>{profile.role} workspace</small></div>
      <button className="finder-collapse" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={collapsed}><ChevronLeft /></button>
    </aside>
    <div className="finder-main"><header className="finder-topbar">
      <button className="finder-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></button>
      <div className="finder-search"><Search size={17} /><input aria-label="Global search" placeholder="Search properties, contacts, projects…" /><kbd>⌘ K</kbd></div>
      <div className="finder-top-actions"><Link className="finder-button finder-button--primary" href="/dashboard/properties/new"><Plus size={16} />New property</Link><Link className="finder-button finder-button--quiet" href="/dashboard/imports"><Import size={16} />Import CSV</Link><ThemeToggle /><button className="finder-icon-button" aria-label="Notifications placeholder" title="Notifications are not configured"><Bell size={18} /></button><div className="finder-user"><button onClick={() => setUserOpen((value) => !value)} aria-expanded={userOpen} aria-haspopup="menu"><span>{profile.fullName.slice(0, 1).toUpperCase()}</span><div><strong>{profile.fullName}</strong><small>{profile.role}</small></div><ChevronDown size={15} /></button>{userOpen ? <div className="finder-user-menu" role="menu"><form action={logoutAction}><button type="submit" role="menuitem"><LogOut size={16} />Sign out</button></form></div> : null}</div></div>
    </header><main className="finder-content">{children}</main></div>
    {mobileOpen ? <button className="finder-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" /> : null}
  </div>;
}
