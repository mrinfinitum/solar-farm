import { requireSession } from "@/lib/auth/session";
import { ProjectFundingOverview } from "@/components/funding/project-funding-overview";
export default async function ProjectFundingPage({params}:PageProps<"/dashboard/projects/[id]/funding">){const {id}=await params;const profile=await requireSession();return <ProjectFundingOverview projectId={id} role={profile.role}/>}
