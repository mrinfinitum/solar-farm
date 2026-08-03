import Link from "next/link";
import { AuthForm } from "@/components/dashboard/auth-form";
import { ProjectMark } from "@/components/ui/project-mark";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionProfile } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import "@/app/dashboard/dashboard.css";

export const metadata = { title: "Sign in | NSoul Studio" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const query = await searchParams;
  const profile = await getSessionProfile();
  if (profile) redirect(query.next?.startsWith("/") && !query.next.startsWith("//") ? query.next : "/dashboard");
  return <main className="auth-page">
    <Link className="auth-brand" href="/" aria-label="Return to NSoul home"><ProjectMark/><strong>NSOUL</strong><span>STUDIO</span></Link>
    <div className="auth-layout">
      <section className="auth-intro" aria-labelledby="studio-heading">
        <p className="finder-eyebrow">Solar development intelligence</p>
        <h1 id="studio-heading">Projects move forward here.</h1>
        <p>One secure operating workspace for property intelligence, diligence, project advancement, and commercial coordination.</p>
        <div className="auth-intro-meta"><span>Private workspace</span><span>Invitation only</span></div>
      </section>
      <section className="auth-card">
        <p className="finder-eyebrow">NSoul Studio</p>
        <h2>Welcome back.</h2>
        <p>Sign in to continue to your development workspace.</p>
        {query.error === "account_inactive" ? <p className="form-error" role="alert">Your account is not active. Contact an NSoul administrator.</p> : null}
        <AuthForm next={query.next} configured={isSupabaseConfigured()} />
        <footer><span>Secure, invitation-only access</span><Link href="/">Public site</Link></footer>
      </section>
    </div>
  </main>;
}
