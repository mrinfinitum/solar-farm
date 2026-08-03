import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ContactSection } from "@/components/sections/contact-section";
import { CornerstoneProjectSection } from "@/components/sections/cornerstone-project-section";
import { DevelopmentSection } from "@/components/sections/development-section";
import { EconomicsSection } from "@/components/sections/economics-section";
import { HeroSection } from "@/components/sections/hero-section";
import { MetricsSection } from "@/components/sections/metrics-section";
import { OpportunitySection } from "@/components/sections/opportunity-section";
import { ProcessSection } from "@/components/sections/process-section";
import { EnergyFlowSection } from "@/components/sections/energy-flow-section";
import { ProjectModelSection } from "@/components/sections/project-model-section";
import { FaqSection } from "@/components/sections/faq-section";
import { TrustStrip } from "@/components/sections/trust-strip";
import { isTermSheetAvailable } from "@/lib/term-sheet";

export default function Home() {
  const termSheetAvailable = isTermSheetAvailable();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "#organization",
        name: "NSoul",
        legalName: "NSoul LLC",
        description: "Developer of the proposed 1 Cornerstone Lane Solar Farm in Idabel, Oklahoma.",
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.nsoul.co",
      },
      {
        "@type": "Project",
        "@id": "#energy-project",
        name: "1 Cornerstone Lane Solar Farm",
        description: "A proposed 1.5 MW DC ground-mounted photovoltaic project in McCurtain County, Oklahoma.",
        location: {
          "@type": "Place",
          name: "Idabel, Oklahoma",
          address: {
            "@type": "PostalAddress",
            streetAddress: "1 Cornerstone Lane",
            addressLocality: "Idabel",
            addressRegion: "OK",
            postalCode: "74745",
            addressCountry: "US",
          },
        },
        memberOf: { "@id": "#organization" },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <SiteHeader termSheetAvailable={termSheetAvailable} />
      <main className="public-site">
        <HeroSection />
        <MetricsSection />
        <OpportunitySection />
        <EnergyFlowSection />
        <ProcessSection />
        <ProjectModelSection />
        <CornerstoneProjectSection termSheetAvailable={termSheetAvailable} />
        <EconomicsSection />
        <TrustStrip />
        <DevelopmentSection />
        <FaqSection />
        <ContactSection termSheetAvailable={termSheetAvailable} />
      </main>
      <SiteFooter termSheetAvailable={termSheetAvailable} />
    </>
  );
}
