import { FinanceWorkspace } from "@/components/finance/finance-workspace";
import { requireSession } from "@/lib/auth/session";
export default async function ScenariosPage({params}:PageProps<"/dashboard/projects/[id]/finance/scenarios">){const {id}=await params;const profile=await requireSession();return <FinanceWorkspace projectId={id} view="scenarios" role={profile.role}/>}
