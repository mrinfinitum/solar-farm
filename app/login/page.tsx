import Link from "next/link";
import { AuthForm } from "@/components/dashboard/auth-form";
import { ProjectMark } from "@/components/ui/project-mark";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionProfile } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import "@/app/dashboard/dashboard.css";

export const metadata = { title: "Sign in | Cornerstone Site Finder" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const query = await searchParams;
  const profile = await getSessionProfile();
  if (profile) redirect(query.next?.startsWith("/") && !query.next.startsWith("//") ? query.next : "/dashboard");
  return <main className="auth-page"><div className="auth-brand"><ProjectMark/><strong>NSOUL</strong></div><section className="auth-card"><p className="finder-eyebrow">Private development system</p><h1>CORNERSTONE<br/>SITE FINDER</h1><p>Secure property pipeline, due diligence, and project advancement for the Cornerstone Solar team.</p>{query.error === "account_inactive" ? <p className="form-error" role="alert">Your account is not active. Contact an NSoul administrator.</p> : null}<AuthForm next={query.next} configured={isSupabaseConfigured()} /><footer><span>Invitation-only access</span><Link href="/">Return to public site</Link></footer></section></main>;
}
