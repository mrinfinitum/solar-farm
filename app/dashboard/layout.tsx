import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireSession } from "@/lib/auth/session";
import "./dashboard.css";
import "maplibre-gl/dist/maplibre-gl.css";
export const dynamic="force-dynamic";
export default async function DashboardLayout({children}:{children:React.ReactNode}){const profile=await requireSession(); return <DashboardShell profile={profile}>{children}</DashboardShell>}
