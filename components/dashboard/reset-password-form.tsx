"use client";
import { useEffect, useState } from "react";
import { recoveryTokensFromHash } from "@/lib/auth/recovery";
import { createClient } from "@/lib/supabase/client";
export function ResetPasswordForm() {
  const [message,setMessage]=useState("Preparing your secure recovery session…");
  const [loading,setLoading]=useState(false);
  const [ready,setReady]=useState(false);

  useEffect(() => {
    let active = true;

    async function prepareSession() {
      const supabase = createClient();
      if (!supabase) {
        if (active) setMessage("Password recovery is not configured.");
        return;
      }

      const tokens = recoveryTokensFromHash(window.location.hash);
      if (tokens) {
        // Remove bearer credentials from the address bar before making a
        // network request or rendering the editable form.
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        const { error } = await supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });
        if (error) {
          if (active) setMessage("This recovery link is invalid or has expired. Request a new link.");
          return;
        }

        const { data: activated, error: activationError } = await supabase.rpc("activate_my_membership");
        if (activationError || activated !== true) {
          await supabase.auth.signOut();
          if (active) setMessage("This account is not active. Contact an NSoul administrator.");
          return;
        }
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (active) setMessage("Open the password-reset link from your email to continue.");
          return;
        }
      }

      if (active) {
        setReady(true);
        setMessage("");
      }
    }

    void prepareSession();
    return () => { active = false; };
  }, []);

  async function submit(formData:FormData){ const password=String(formData.get("password")||""); const confirm=String(formData.get("confirm")||""); if(password!==confirm){setMessage("Passwords do not match.");return;} const supabase=createClient(); if(!supabase){setMessage("Supabase is not configured.");return;} setLoading(true); const {error}=await supabase.auth.updateUser({password}); setMessage(error?error.message:"Password updated. You can now return to the dashboard."); setLoading(false); }
  return <form action={submit} className="auth-form"><label><span>New password</span><div><input name="password" type="password" minLength={10} required autoComplete="new-password" disabled={!ready||loading} /></div></label><label><span>Confirm password</span><div><input name="confirm" type="password" minLength={10} required autoComplete="new-password" disabled={!ready||loading} /></div></label>{message&&<p className="auth-message" role="status">{message}</p>}<button className="finder-button finder-button--primary" disabled={!ready||loading}>{loading?"Updating…":ready?"Update password":"Preparing…"}</button></form>;
}
