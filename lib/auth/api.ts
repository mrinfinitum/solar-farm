import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { hasRole, type UserRole } from "@/lib/auth/roles";

export async function getApiActor(requiredRoles?: readonly UserRole[]) {
  const profile = await getSessionProfile();
  if (!profile || (requiredRoles && !hasRole(profile.role, requiredRoles))) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  return { supabase, profile, user: { id: profile.id }, role: profile.role };
}
