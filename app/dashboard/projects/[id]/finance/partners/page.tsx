import { FinanceWorkspace } from "@/components/finance/finance-workspace";
import { requireSession } from "@/lib/auth/session";
export default async function PartnersPage({params}:PageProps<"/dashboard/projects/[id]/finance/partners">){const {id}=await params;const profile=await requireSession();return <FinanceWorkspace projectId={id} view="partners" role={profile.role}/>}
