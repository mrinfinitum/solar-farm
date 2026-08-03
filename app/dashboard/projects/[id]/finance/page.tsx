import { FinanceWorkspace } from "@/components/finance/finance-workspace";
import { requireSession } from "@/lib/auth/session";
export default async function ProjectFinancePage({params}:PageProps<"/dashboard/projects/[id]/finance">){const {id}=await params;const profile=await requireSession();return <FinanceWorkspace projectId={id} view="overview" role={profile.role}/>}
