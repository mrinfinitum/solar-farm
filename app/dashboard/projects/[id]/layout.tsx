import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Zap } from "lucide-react";
import { ProjectActions } from "@/components/projects/project-actions";
import { ProjectSubnav } from "@/components/projects/project-subnav";
import { requireSession } from "@/lib/auth/session";
import { getProjectCommandCenter } from "@/lib/projects/data";
import { titleCaseStatus } from "@/lib/projects/domain";

export default async function ProjectLayout({ children, params }: LayoutProps<"/dashboard/projects/[id]">) {
  const { id } = await params; const [profile, project] = await Promise.all([requireSession(), getProjectCommandCenter(id)]);
  if (!project) notFound();
  return <div className="project-command-page">
    <header className="project-command-header"><div><div className="project-command-kicker"><span>{project.project_code}</span><span className={`project-health project-health--${project.project_health}`}>{titleCaseStatus(project.project_health)}</span></div><h1>{project.project_name}</h1><div className="project-command-meta"><span><MapPin size={14}/>{project.location||project.county||"Location pending"}</span><span><Zap size={14}/>{project.proposed_capacity_mw_dc??"Not available"} MW DC</span><span><CalendarDays size={14}/>{project.target_operation_date||project.target_cod||"Target date pending"}</span><span>{titleCaseStatus(project.project_stage)}</span></div></div><ProjectActions projectId={id} currentStage={project.project_stage} role={profile.role} project={{project_name:project.project_name,location:project.location,county:project.county,proposed_capacity_mw_dc:project.proposed_capacity_mw_dc,proposed_capacity_mw_ac:project.proposed_capacity_mw_ac,target_operation_date:project.target_operation_date,summary:project.summary}}/></header>
    <ProjectSubnav projectId={id}/>{children}
  </div>;
}
