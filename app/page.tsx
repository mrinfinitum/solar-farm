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
import { BuyerConfidenceSection } from "@/components/sections/buyer-confidence-section";
import { isTermSheetAvailable } from "@/lib/term-sheet";
import { SITE_URL } from "@/lib/site-config";

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
        description: "Commercial solar developer and independent power producer serving the Oklahoma Region.",
        url: SITE_URL,
        areaServed: { "@type": "AdministrativeArea", name: "Oklahoma Region" },
        makesOffer: {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Commercial solar energy development",
            description: "Development, ownership, and operation of regional commercial solar infrastructure.",
          },
        },
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
        <CornerstoneProjectSection />
        <BuyerConfidenceSection />
        <EconomicsSection />
        <DevelopmentSection />
        <FaqSection />
        <ContactSection termSheetAvailable={termSheetAvailable} />
      </main>
      <SiteFooter termSheetAvailable={termSheetAvailable} />
    </>
  );
}
