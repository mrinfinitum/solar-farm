"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MailPlus, RefreshCw, ShieldCheck, UserRoundCheck, UserRoundX, X } from "lucide-react";
import { USER_ROLES, canManageMembership, type MembershipStatus, type UserRole } from "@/lib/auth/roles";

interface MemberRow { id: string; userId: string; fullName: string; email: string; role: UserRole; status: MembershipStatus; invitationState: "pending" | "accepted"; lastSignInAt: string | null; invitedAt: string; }

export function UserAdministration({ actorId, actorRole }: { actorId: string; actorRole: UserRole }) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(result.error || "Users could not be loaded.");
    setMembers(result.data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialLoad() {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const result = await response.json();
      if (cancelled) return;
      setLoading(false);
      if (!response.ok) setMessage(result.error || "Users could not be loaded.");
      else setMembers(result.data);
    }
    void initialLoad();
    return () => { cancelled = true; };
  }, []);

  async function invite(formData: FormData) {
    setBusyId("invite"); setMessage(null);
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: formData.get("fullName"), email: formData.get("email"), role: formData.get("role") }) });
    const result = await response.json(); setBusyId(null);
    if (!response.ok) return setMessage(result.error || "Invitation failed.");
    setInviteOpen(false); setMessage("Invitation sent and recorded in the activity log."); await load();
  }

  async function act(member: MemberRow, action: string, role?: UserRole) {
    if (action === "deactivate" && !window.confirm(`Deactivate ${member.fullName}? Their dashboard access will be blocked immediately.`)) return;
    setBusyId(member.id); setMessage(null);
    const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, membershipId: member.id, ...(role ? { role } : {}) }) });
    const result = await response.json(); setBusyId(null);
    if (!response.ok) return setMessage(result.error || "The membership could not be updated.");
    setMessage("Access change completed and recorded in the activity log."); await load();
  }

  return <section className="finder-card user-admin">
    <div className="user-admin-head"><div><span>{members.length} members</span><strong>Secure organization directory</strong></div><button className="finder-button finder-button--primary" onClick={() => setInviteOpen(true)}><MailPlus size={16} />Invite user</button></div>
    {message ? <p className="user-admin-message" role="status">{message}</p> : null}
    {loading ? <div className="user-admin-loading"><Loader2 className="spin" />Loading organization access…</div> : <div className="finder-table-wrap"><table className="finder-table user-admin-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Invitation</th><th>Last sign-in</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{members.map((member) => {
      const manageable = canManageMembership(actorRole, member.role); const busy = busyId === member.id;
      return <tr key={member.id}><td data-label="User"><div className="user-identity"><span>{member.fullName.slice(0, 1).toUpperCase()}</span><div><strong>{member.fullName}</strong><small>{member.email}</small></div></div></td><td data-label="Role"><select className="user-role-select" aria-label={`Role for ${member.fullName}`} value={member.role} disabled={!manageable || busy} onChange={(event) => void act(member, "change-role", event.target.value as UserRole)}>{USER_ROLES.filter((role) => actorRole === "owner" || role !== "owner").map((role) => <option key={role}>{role}</option>)}</select></td><td data-label="Status"><span className={`finder-status ${member.status === "active" ? "finder-status--good" : member.status === "suspended" || member.status === "deactivated" ? "finder-status--risk" : ""}`}>{member.status}</span></td><td data-label="Invitation">{member.invitationState}</td><td data-label="Last sign-in">{member.lastSignInAt ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(member.lastSignInAt)) : "Never"}</td><td data-label="Actions"><div className="user-actions">{member.status === "invited" ? <button title="Resend invitation" aria-label={`Resend invitation to ${member.fullName}`} disabled={!manageable || busy} onClick={() => void act(member, "resend-invitation")}><RefreshCw /></button> : null}{member.status === "active" ? <button title="Deactivate" aria-label={`Deactivate ${member.fullName}`} disabled={!manageable || busy || member.userId === actorId} onClick={() => void act(member, "deactivate")}><UserRoundX /></button> : <button title="Reactivate" aria-label={`Reactivate ${member.fullName}`} disabled={!manageable || busy} onClick={() => void act(member, "reactivate")}><UserRoundCheck /></button>}</div></td></tr>;
    })}</tbody></table></div>}
    {inviteOpen ? <div className="user-dialog-backdrop"><div className="user-dialog" role="dialog" aria-modal="true" aria-labelledby="invite-title"><button className="user-dialog-close" onClick={() => setInviteOpen(false)} aria-label="Close invite dialog"><X /></button><ShieldCheck /><p className="finder-eyebrow">Invitation-only access</p><h2 id="invite-title">Invite an organization member</h2><p>The new user receives a secure Supabase invitation. Access begins only after the invitation is accepted.</p><form action={invite} className="finder-form"><label><span>Full name</span><input className="finder-field" name="fullName" required minLength={2} /></label><label><span>Work email</span><input className="finder-field" name="email" type="email" required /></label><label><span>Role</span><select className="finder-field" name="role" defaultValue="viewer">{USER_ROLES.filter((role) => actorRole === "owner" || role !== "owner").map((role) => <option key={role}>{role}</option>)}</select></label><button className="finder-button finder-button--primary" disabled={busyId === "invite"}>{busyId === "invite" ? <Loader2 className="spin" /> : <MailPlus />}Send secure invitation</button></form></div></div> : null}
  </section>;
}
