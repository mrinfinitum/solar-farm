import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard";

  // Admin-generated recovery and invitation links use an implicit session in
  // the URL fragment. Fragments are intentionally unavailable to the server,
  // so forward the browser to the recovery form where the session is consumed.
  if (!code) {
    if (next === "/auth/reset-password") {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    return NextResponse.redirect(new URL("/login?error=invalid_callback", url.origin));
  }

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
