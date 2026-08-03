import { FinanceWorkspace } from "@/components/finance/finance-workspace";
import { requireSession } from "@/lib/auth/session";
export default async function CapitalStackPage({params}:PageProps<"/dashboard/projects/[id]/finance/capital-stack">){const {id}=await params;const profile=await requireSession();return <FinanceWorkspace projectId={id} view="capital-stack" role={profile.role}/>}
