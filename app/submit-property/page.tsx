import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { PublicPropertyForm } from "@/components/forms/public-property-form";
import { ProjectMark } from "@/components/ui/project-mark";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Submit Rural Oklahoma Land | NSoul",
  description: "Submit rural Oklahoma land for a preliminary, non-binding solar-development review by NSoul.",
  alternates: { canonical: "/submit-property" },
};

export const dynamic = "force-dynamic";

export default async function SubmitPropertyPage() {
  const admin = createAdminClient();
  let storageConfigured = false;
  if (admin) {
    try {
      storageConfigured = !((await admin.storage.getBucket("site-finder-documents")).error);
    } catch {
      storageConfigured = false;
    }
  }
  return (
    <main className="land-page">
      <header><Link href="/" className="land-brand"><ProjectMark/><strong>NSOUL</strong></Link><Link href="/"><ArrowLeft/>Return to project site</Link></header>
      <section className="land-intro">
        <p className="eyebrow">Rural Oklahoma land review</p>
        <h1>Submit Rural Oklahoma Land <em>for Consideration</em></h1>
        <p>NSoul is evaluating rural Oklahoma properties that may be suitable for future commercial solar development. Submitting a property does not constitute an offer, site approval, development commitment, or agreement.</p>
        <div><span><ShieldCheck/>Private intake</span><span><ShieldCheck/>Unverified lead record</span><span><ShieldCheck/>Non-binding review</span></div>
      </section>
      <section className="land-form-shell">
        <div><p className="eyebrow">Property intake</p><h2>Tell us about the land.</h2><p>Unknown answers can be left blank. Please provide only information you are authorized to share.</p></div>
        <PublicPropertyForm storageConfigured={storageConfigured} />
      </section>
      <footer>Submission does not constitute an offer, commitment, site approval, or development agreement.</footer>
    </main>
  );
}
