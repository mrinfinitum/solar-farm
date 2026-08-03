"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export function ResetPasswordForm() {
  const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
  async function submit(formData:FormData){ const password=String(formData.get("password")||""); const confirm=String(formData.get("confirm")||""); if(password!==confirm){setMessage("Passwords do not match.");return;} const supabase=createClient(); if(!supabase){setMessage("Supabase is not configured.");return;} setLoading(true); const {error}=await supabase.auth.updateUser({password}); setMessage(error?error.message:"Password updated. You can now return to the dashboard."); setLoading(false); }
  return <form action={submit} className="auth-form"><label><span>New password</span><div><input name="password" type="password" minLength={10} required autoComplete="new-password" /></div></label><label><span>Confirm password</span><div><input name="confirm" type="password" minLength={10} required autoComplete="new-password" /></div></label>{message&&<p className="auth-message" role="status">{message}</p>}<button className="finder-button finder-button--primary" disabled={loading}>{loading?"Updating…":"Update password"}</button></form>;
}
