import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard";

  if (!code) return NextResponse.redirect(new URL("/login?error=invalid_callback", url.origin));

  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(new URL("/login?error=configuration", url.origin));

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=invalid_callback", url.origin));

  const { data: activated, error: activationError } = await supabase.rpc("activate_my_membership");
  if (activationError || activated !== true) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=account_inactive", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
