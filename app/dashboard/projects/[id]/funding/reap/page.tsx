import { requireSession } from "@/lib/auth/session";
import { ReapWorkspace } from "@/components/funding/reap-workspace";
export default async function ReapOverviewPage({params}:PageProps<"/dashboard/projects/[id]/funding/reap">){const {id}=await params;const profile=await requireSession();return <ReapWorkspace projectId={id} view="overview" role={profile.role}/>}
