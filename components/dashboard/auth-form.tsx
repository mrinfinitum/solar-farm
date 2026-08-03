"use client";

import { useState } from "react";
import { ArrowRight, KeyRound, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ next = "/dashboard", configured }: { next?: string; configured: boolean }) {
  const [mode, setMode] = useState<"login" | "forgot">("login"); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(formData: FormData) {
    const supabase = createClient(); if (!supabase) { setMessage("Supabase is not configured. Add the required environment values to enable private access."); return; }
    setLoading(true); setMessage(""); const email = String(formData.get("email") || "");
    if (mode === "forgot") {
      const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset-password`; const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo }); setMessage(error ? error.message : "If the account exists, a password-reset email has been sent."); setLoading(false); return;
    }
    const password = String(formData.get("password") || ""); const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage("Unable to sign in. Check your email and password."); setLoading(false); return; }
    window.location.assign(next.startsWith("/") ? next : "/dashboard");
  }
  return (
    <form action={submit} className="auth-form">
      {!configured && <div className="auth-config"><strong>Setup required</strong><span>Connect a Supabase project before internal users can sign in.</span></div>}
      <label><span>Work email</span><div><Mail size={16} /><input name="email" type="email" autoComplete="email" required placeholder="you@company.com" /></div></label>
      {mode === "login" && <label><span>Password</span><div><KeyRound size={16} /><input name="password" type="password" autoComplete="current-password" required minLength={8} /></div></label>}
      {message && <p className="auth-message" role="status">{message}</p>}
      <button className="finder-button finder-button--primary" disabled={loading || !configured} type="submit">{loading ? <Loader2 className="spin" size={16} /> : mode === "login" ? "Sign in" : "Send reset link"}<ArrowRight size={16} /></button>
      <button className="auth-mode" type="button" onClick={() => { setMode(mode === "login" ? "forgot" : "login"); setMessage(""); }}>{mode === "login" ? "Forgot your password?" : "Return to sign in"}</button>
    </form>
  );
}
