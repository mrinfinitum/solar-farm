import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/property";
export interface SessionProfile { id: string; email: string; fullName: string; organization: string; role: UserRole; }
export const getSessionProfile = cache(async (): Promise<SessionProfile | null> => { const supabase = await createClient(); if (!supabase) return null; const { data: { user } } = await supabase.auth.getUser(); if (!user) return null; const { data } = await supabase.from("profiles").select("id,email,full_name,organization,role").eq("id", user.id).single(); return { id: user.id, email: data?.email || user.email || "", fullName: data?.full_name || user.email?.split("@")[0] || "Team member", organization: data?.organization || "Cornerstone Solar", role: (data?.role as UserRole | undefined) || "viewer" }; });
export async function requireSession() { const profile = await getSessionProfile(); if (!profile) redirect("/login"); return profile; }
export async function requireRole(roles: UserRole[]) { const profile = await requireSession(); if (!roles.includes(profile.role)) throw new Error("Forbidden"); return profile; }
