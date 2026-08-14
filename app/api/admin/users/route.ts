import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionProfile } from "@/lib/auth/session";
import {
  ADMIN_ROLES,
  USER_ROLES,
  canAssignRole,
  canManageMembership,
  type UserRole,
} from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { passwordResetRedirectUrl } from "@/lib/site-config";

const roleSchema = z.enum(USER_ROLES);
const inviteSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  fullName: z.string().trim().min(2).max(120),
  role: roleSchema,
});
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("change-role"), membershipId: z.string().uuid(), role: roleSchema }),
  z.object({ action: z.literal("deactivate"), membershipId: z.string().uuid() }),
  z.object({ action: z.literal("reactivate"), membershipId: z.string().uuid() }),
  z.object({ action: z.literal("resend-invitation"), membershipId: z.string().uuid() }),
]);

async function requireAdministrator() {
  const actor = await getSessionProfile();
  if (!actor) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  if (!ADMIN_ROLES.includes(actor.role)) {
    return { error: NextResponse.json({ error: "Owner or administrator access required." }, { status: 403 }) } as const;
  }
  return { actor } as const;
}

function getAdminAfterAuthorization() {
  const admin = createAdminClient();
  if (!admin) return { error: NextResponse.json({ error: "Server administration is not configured." }, { status: 503 }) } as const;
  return { admin } as const;
}

async function recordActivity(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  actor: NonNullable<Awaited<ReturnType<typeof getSessionProfile>>>,
  membershipId: string,
  action: string,
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
) {
  const { error } = await admin.from("activity_log").insert({
    organization_id: actor.organizationId,
    actor_id: actor.id,
    entity_type: "organization_member",
    entity_id: membershipId,
    action,
    before_data: beforeData,
    after_data: afterData,
  });
  if (error) throw new Error(`Audit record failed: ${error.message}`);
}

async function isLastActiveOwner(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  organizationId: string,
  targetRole: UserRole,
) {
  if (targetRole !== "owner") return false;
  const { count } = await admin
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .eq("status", "active");
  return (count || 0) <= 1;
}

export async function GET() {
  const authorization = await requireAdministrator();
  if ("error" in authorization) return authorization.error;
  const configured = getAdminAfterAuthorization();
  if ("error" in configured) return configured.error;
  const { actor } = authorization;
  const { admin } = configured;

  const { data: memberships, error } = await admin
    .from("organization_members")
    .select("id,user_id,role,status,invited_by,created_at,updated_at,profiles!organization_members_user_id_fkey(full_name,email)")
    .eq("organization_id", actor.organizationId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const data = await Promise.all(
    (memberships || []).map(async (membership) => {
      const { data: authUser } = await admin.auth.admin.getUserById(membership.user_id);
      const profile = Array.isArray(membership.profiles) ? membership.profiles[0] : membership.profiles;
      return {
        id: membership.id,
        userId: membership.user_id,
        fullName: profile?.full_name || authUser.user?.user_metadata?.full_name || "Invited user",
        email: profile?.email || authUser.user?.email || "",
        role: membership.role,
        status: membership.status,
        invitationState: membership.status === "invited" ? "pending" : "accepted",
        lastSignInAt: authUser.user?.last_sign_in_at || null,
        invitedAt: membership.created_at,
      };
    }),
  );

  return NextResponse.json({ data, actor: { id: actor.id, role: actor.role } });
}

export async function POST(request: Request) {
  const authorization = await requireAdministrator();
  if ("error" in authorization) return authorization.error;
  const parsed = inviteSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email, name, and role." }, { status: 422 });
  const { actor } = authorization;
  if (!canAssignRole(actor.role, parsed.data.role)) {
    return NextResponse.json({ error: "Only an owner may assign the owner role." }, { status: 403 });
  }

  const configured = getAdminAfterAuthorization();
  if ("error" in configured) return configured.error;
  const { admin } = configured;

  const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { full_name: parsed.data.fullName },
    redirectTo: passwordResetRedirectUrl(),
  });
  if (inviteError || !invitation.user) {
    return NextResponse.json({ error: inviteError?.message || "Invitation could not be created." }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: invitation.user.id,
    email: parsed.data.email,
    full_name: parsed.data.fullName,
  });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .insert({
      organization_id: actor.organizationId,
      user_id: invitation.user.id,
      role: parsed.data.role,
      status: "invited",
      invited_by: actor.id,
    })
    .select("id,user_id,role,status,created_at")
    .single();
  if (membershipError || !membership) {
    await admin.auth.admin.deleteUser(invitation.user.id);
    return NextResponse.json({ error: membershipError?.message || "Membership could not be created." }, { status: 400 });
  }

  try {
    await recordActivity(admin, actor, membership.id, "user_invited", null, {
      user_id: membership.user_id,
      email: parsed.data.email,
      role: membership.role,
      status: membership.status,
    });
  } catch (error) {
    await admin.from("organization_members").delete().eq("id", membership.id);
    await admin.auth.admin.deleteUser(invitation.user.id);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Audit record failed." }, { status: 500 });
  }

  return NextResponse.json({ data: membership }, { status: 201 });
}

export async function PATCH(request: Request) {
  const authorization = await requireAdministrator();
  if ("error" in authorization) return authorization.error;
  const parsed = actionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "A valid membership action is required." }, { status: 422 });
  const { actor } = authorization;

  const configured = getAdminAfterAuthorization();
  if ("error" in configured) return configured.error;
  const { admin } = configured;
  const { data: target, error: targetError } = await admin
    .from("organization_members")
    .select("id,user_id,role,status,profiles!organization_members_user_id_fkey(email)")
    .eq("id", parsed.data.membershipId)
    .eq("organization_id", actor.organizationId)
    .maybeSingle();
  if (targetError || !target) return NextResponse.json({ error: "Membership was not found." }, { status: 404 });

  const requestedRole = parsed.data.action === "change-role" ? parsed.data.role : undefined;
  if (!canManageMembership(actor.role, target.role as UserRole, requestedRole)) {
    return NextResponse.json({ error: "Only an owner may manage owner memberships or assign the owner role." }, { status: 403 });
  }
  if (
    (parsed.data.action === "deactivate" || (parsed.data.action === "change-role" && parsed.data.role !== "owner"))
    && await isLastActiveOwner(admin, actor.organizationId, target.role as UserRole)
  ) {
    return NextResponse.json({ error: "The organization must retain at least one active owner." }, { status: 409 });
  }

  const before = { role: target.role, status: target.status };
  let after = before;
  let activity = "membership_updated";

  if (parsed.data.action === "change-role") {
    const { error } = await admin.from("organization_members").update({ role: parsed.data.role }).eq("id", target.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    after = { ...before, role: parsed.data.role };
    activity = "role_changed";
  } else if (parsed.data.action === "deactivate") {
    const { error: banError } = await admin.auth.admin.updateUserById(target.user_id, { ban_duration: "876000h" });
    if (banError) return NextResponse.json({ error: banError.message }, { status: 400 });
    const { error } = await admin.from("organization_members").update({ status: "deactivated" }).eq("id", target.id);
    if (error) {
      await admin.auth.admin.updateUserById(target.user_id, { ban_duration: "none" });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    after = { ...before, status: "deactivated" };
    activity = "membership_deactivated";
  } else if (parsed.data.action === "reactivate") {
    const { error: unbanError } = await admin.auth.admin.updateUserById(target.user_id, { ban_duration: "none" });
    if (unbanError) return NextResponse.json({ error: unbanError.message }, { status: 400 });
    const { error } = await admin.from("organization_members").update({ status: "active" }).eq("id", target.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    after = { ...before, status: "active" };
    activity = "membership_reactivated";
  } else {
    if (target.status !== "invited") return NextResponse.json({ error: "Only pending invitations can be resent." }, { status: 409 });
    const profile = Array.isArray(target.profiles) ? target.profiles[0] : target.profiles;
    if (!profile?.email) return NextResponse.json({ error: "The invited user has no email address." }, { status: 409 });
    const { error } = await admin.auth.resend({
      type: "signup",
      email: profile.email,
      options: { emailRedirectTo: passwordResetRedirectUrl() },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    activity = "invitation_resent";
  }

  try {
    await recordActivity(admin, actor, target.id, activity, before, after);
  } catch (error) {
    if (parsed.data.action === "change-role") {
      await admin.from("organization_members").update({ role: target.role }).eq("id", target.id);
    } else if (parsed.data.action === "deactivate") {
      await admin.from("organization_members").update({ status: target.status }).eq("id", target.id);
      await admin.auth.admin.updateUserById(target.user_id, { ban_duration: "none" });
    } else if (parsed.data.action === "reactivate") {
      await admin.from("organization_members").update({ status: target.status }).eq("id", target.id);
      if (target.status === "deactivated" || target.status === "suspended") {
        await admin.auth.admin.updateUserById(target.user_id, { ban_duration: "876000h" });
      }
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Audit record failed." }, { status: 500 });
  }

  return NextResponse.json({ data: { id: target.id, ...after } });
}
