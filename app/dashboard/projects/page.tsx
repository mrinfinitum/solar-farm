import { ProjectPortfolio } from "@/components/projects/project-portfolio";
import { getProjectPortfolio } from "@/lib/projects/data";

export default async function ProjectsPage(){const projects=await getProjectPortfolio();return <><div className="finder-page-head"><div><p className="finder-eyebrow">Development portfolio</p><h1>Project command center</h1><p>Track promoted solar assets from feasibility through commercial operation with governed stages, evidence, capital, and accountable next actions.</p></div></div><ProjectPortfolio projects={projects}/></>}
