import { notFound } from "next/navigation";
import { ProjectModuleView } from "@/components/projects/project-module-view";
import { ProjectOverview } from "@/components/projects/project-overview";
import { getProjectCommandCenter } from "@/lib/projects/data";
import { requireSession } from "@/lib/auth/session";

const sections = new Set(["overview","interconnection","engineering","offtakers","ppa","permitting","finance","incentives","documents","tasks","construction","operations","activity"]);

export default async function ProjectSectionPage({params}:PageProps<"/dashboard/projects/[id]/[section]">){
  const {id,section}=await params;if(!sections.has(section))notFound();const [project,profile]=await Promise.all([getProjectCommandCenter(id),requireSession()]);if(!project)notFound();
  return section==="overview"?<ProjectOverview project={project} role={profile.role}/>:<ProjectModuleView project={project} section={section}/>;
}
