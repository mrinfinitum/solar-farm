import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasRole, isUserRole, type MembershipStatus, type UserRole } from "@/lib/auth/roles";

export interface SessionProfile {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
  organization: string;
  organizationSlug: string;
  role: UserRole;
  status: MembershipStatus;
  lastSignInAt: string | null;
}

async function loadSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership || membership.status !== "active" || !isUserRole(membership.role)) {
    return null;
  }

  const [{ data: profile }, { data: organization }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    supabase.from("organizations").select("name, slug").eq("id", membership.organization_id).maybeSingle(),
  ]);

  if (!organization) return null;

  return {
    id: user.id,
    email: profile?.email || user.email || "",
    fullName: profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Team member",
    organizationId: membership.organization_id,
    organization: organization.name,
    organizationSlug: organization.slug,
    role: membership.role,
    status: membership.status,
    lastSignInAt: user.last_sign_in_at || null,
  };
}

export const getSessionProfile = cache(loadSessionProfile);

export async function requireSession() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?error=account_inactive");
  return profile;
}

export async function requireRole(roles: readonly UserRole[]) {
  const profile = await requireSession();
  if (!hasRole(profile.role, roles)) redirect("/dashboard?error=forbidden");
  return profile;
}
