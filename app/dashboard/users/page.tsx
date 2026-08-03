import { UserAdministration } from "@/components/dashboard/user-administration";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

export default async function UsersPage() {
  const profile = await requireRole(ADMIN_ROLES);
  return <><div className="finder-page-head"><div><p className="finder-eyebrow">Identity and access</p><h1>Organization users</h1><p>Invitation-only membership, explicit roles, account state, and audited administrative changes for {profile.organization}.</p></div><span className="evidence-badge">{profile.role} controls</span></div><UserAdministration actorId={profile.id} actorRole={profile.role} /></>;
}
