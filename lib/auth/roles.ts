export const USER_ROLES = ["owner", "admin", "developer", "analyst", "viewer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MEMBERSHIP_STATUSES = ["invited", "active", "suspended", "deactivated"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const ADMIN_ROLES: readonly UserRole[] = ["owner", "admin"];
export const EDITOR_ROLES: readonly UserRole[] = ["owner", "admin", "developer", "analyst"];
export const PROPERTY_OPERATOR_ROLES: readonly UserRole[] = ["owner", "admin", "developer"];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function hasRole(role: UserRole, allowed: readonly UserRole[]) {
  return allowed.includes(role);
}

export function canAssignRole(actorRole: UserRole, nextRole: UserRole) {
  return actorRole === "owner" || (actorRole === "admin" && nextRole !== "owner");
}

export function canManageMembership(actorRole: UserRole, targetRole: UserRole, nextRole?: UserRole) {
  if (actorRole === "owner") return true;
  if (actorRole !== "admin" || targetRole === "owner") return false;
  return nextRole !== "owner";
}

export function canAccessDashboard(status: MembershipStatus | null | undefined) {
  return status === "active";
}
