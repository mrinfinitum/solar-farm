import Link from "next/link";
import { AuthForm } from "@/components/dashboard/auth-form";
import { ProjectMark } from "@/components/ui/project-mark";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import "@/app/dashboard/dashboard.css";

export const metadata = { title: "Sign in | Cornerstone Site Finder" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const query = await searchParams;
  return <main className="auth-page"><div className="auth-brand"><ProjectMark/><strong>NSOUL</strong></div><section className="auth-card"><p className="finder-eyebrow">Private development system</p><h1>CORNERSTONE<br/>SITE FINDER</h1><p>Secure property pipeline, due diligence, and project advancement for the Cornerstone Solar team.</p><AuthForm next={query.next} configured={isSupabaseConfigured()} /><footer><span>Authorized users only</span><Link href="/">Return to public site</Link></footer></section></main>;
}
