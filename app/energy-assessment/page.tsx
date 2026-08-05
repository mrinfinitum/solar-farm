import type { Metadata } from "next";

import { EnergyAssessmentForm } from "@/components/forms/energy-assessment-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { isTermSheetAvailable } from "@/lib/term-sheet";

const description = "Submit facility information and optional utility bills for a preliminary, non-binding commercial energy assessment from NSoul.";
export const metadata: Metadata = { title: "Commercial Energy Assessment | NSoul", description, alternates: { canonical: "/energy-assessment" }, openGraph: { title: "Commercial Energy Assessment | NSoul", description, url: "/energy-assessment", type: "website" } };

export default async function EnergyAssessmentPage({ searchParams }: { searchParams: Promise<{ audience?: string | string[] }> }) {
  const query = await searchParams;
  const audience = typeof query.audience === "string" ? query.audience.slice(0, 80) : "";
  const termSheetAvailable = isTermSheetAvailable();
  const storageConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  return <><SiteHeader termSheetAvailable={termSheetAvailable} /><main className="public-site intake-page"><section className="intake-hero"><div className="container"><p className="eyebrow">Energy assessment</p><h1>See whether local solar could lower your facility’s energy costs.</h1><p>Provide basic facility information or upload recent utility statements. NSoul will use the information to prepare a preliminary, non-binding comparison.</p></div></section><section className="section intake-form-section"><div className="container intake-form-layout"><aside><p className="eyebrow">What happens next</p><h2>Start with verified facility data.</h2><ol><li><span>01</span>We review submitted usage and billing information.</li><li><span>02</span>We test facility fit and identify missing inputs.</li><li><span>03</span>Any comparison remains preliminary until engineering and commercial review.</li></ol><p>This assessment is not legal, tax, financial, engineering, utility, or investment advice.</p></aside><div className="intake-form-card"><EnergyAssessmentForm storageConfigured={storageConfigured} audience={audience} /></div></div></section></main><SiteFooter termSheetAvailable={termSheetAvailable} /></>;
}
