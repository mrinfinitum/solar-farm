import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { ReapWorkspace } from "@/components/funding/reap-workspace";
const views=new Set(["eligibility","documents","timeline","contacts","questions","costs","reimbursement","activity"]);
export default async function ReapViewPage({params}:PageProps<"/dashboard/projects/[id]/funding/reap/[view]">){const {id,view}=await params;if(!views.has(view))notFound();const profile=await requireSession();return <ReapWorkspace projectId={id} view={view} role={profile.role}/>}
