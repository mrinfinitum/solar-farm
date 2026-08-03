import { FinanceWorkspace } from "@/components/finance/finance-workspace";
import { requireSession } from "@/lib/auth/session";
export default async function ReadinessPage({params}:PageProps<"/dashboard/projects/[id]/finance/readiness">){const {id}=await params;const profile=await requireSession();return <FinanceWorkspace projectId={id} view="readiness" role={profile.role}/>}
