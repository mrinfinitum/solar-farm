import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Cable, CircleDollarSign, Gauge, Handshake, MapPin, RefreshCw, ShieldCheck, SunMedium } from "lucide-react";

import { FounderStatement } from "@/components/vision/founder-statement";
import { VisionCommitment } from "@/components/vision/vision-commitment";
import { VisionFlywheel } from "@/components/vision/vision-flywheel";
import { VisionHero } from "@/components/vision/vision-hero";
import { VisionPillars } from "@/components/vision/vision-pillars";
import { VisionScrollReset } from "@/components/vision/vision-scroll-reset";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { isTermSheetAvailable } from "@/lib/term-sheet";

const description = "Discover NSoul’s vision for building long-term solar energy assets that strengthen businesses, create recurring value, and support stronger communities.";

export const metadata: Metadata = {
  title: "Our Vision | NSoul",
  description,
  alternates: { canonical: "/our-vision" },
  openGraph: {
    type: "website",
    url: "/our-vision",
    title: "Our Vision | NSoul",
    description,
    images: [{ url: "/brand/nsoul-solar-business-campus.jpg", width: 1823, height: 863, alt: "Illustrative NSoul solar infrastructure serving a commercial facility" }],
  },
  twitter: { card: "summary_large_image", title: "Our Vision | NSoul", description, images: ["/brand/nsoul-solar-business-campus.jpg"] },
};

const modelSteps = [
  { phase: "Origination", title: "Control or acquire suitable land", icon: MapPin, image: "/brand/nsoul-owner-confidence.jpg" },
  { phase: "Development", title: "Develop financeable solar projects", icon: SunMedium, image: "/brand/nsoul-solar-business-model.jpg" },
  { phase: "Grid", title: "Secure interconnection and engineering", icon: Cable, image: "/brand/nsoul-solar-generation-v2.png" },
  { phase: "Commercial", title: "Contract with energy buyers", icon: Handshake, image: "/brand/nsoul-business-isolated.png" },
  { phase: "Capital", title: "Finance and build the asset", icon: CircleDollarSign, image: "/brand/nsoul-solar-business-campus.jpg" },
  { phase: "Ownership", title: "Retain ownership", icon: ShieldCheck, image: "/brand/nsoul-family-business-solar.jpg" },
  { phase: "Operations", title: "Operate for recurring revenue", icon: Gauge, image: "/brand/nsoul-automated-factory-v2.png" },
  { phase: "Impact", title: "Reinvest in projects and future impact", icon: RefreshCw, image: "/brand/nsoul-clean-energy-team.jpg" },
] as const;

const milestones = [
  { label: "First project", title: "Prove the model.", copy: "Advance a development-stage project through disciplined validation, contracting, financing, and delivery." },
  { label: "Portfolio growth", title: "Build recurring value.", copy: "Develop additional assets and long-term commercial energy relationships without sacrificing underwriting discipline." },
  { label: "Community partnerships", title: "Create measurable programs.", copy: "As operating success permits, establish accountable partnerships focused on housing, opportunity, and local resilience." },
  { label: "Long-term legacy", title: "Serve future generations.", copy: "Retain productive infrastructure, deepen local relationships, and grow impact alongside the company’s operating capacity." },
] as const;

export default function OurVisionPage() {
  const termSheetAvailable = isTermSheetAvailable();
  return (
    <>
      <VisionScrollReset />
      <SiteHeader termSheetAvailable={termSheetAvailable} tone="dark" />
      <main className="public-site vision-page">
        <VisionHero />

        <section className="vision-why section" aria-labelledby="why-title">
          <div className="container vision-why__stack">
            <figure className="vision-why__horizon">
              <Image
                src="/brand/nsoul-solar-horizon-dreamscape.jpg"
                alt="Solar panels extending toward a luminous, peaceful horizon at dawn"
                width={1983}
                height={793}
                sizes="(max-width: 720px) calc(100vw - 30px), (max-width: 1100px) calc(100vw - 48px), 1360px"
              />
              <figcaption><span aria-hidden="true" /> Renewable by nature, enduring by design</figcaption>
            </figure>
            <div className="vision-why__content">
              <p className="eyebrow">Why NSoul exists</p>
              <h2 id="why-title">Energy should create <em>more than power.</em></h2>
              <div className="vision-long-copy">
                <p>The sun offers a vast, renewable source of energy. Our work is to harness it responsibly, shape it into productive infrastructure, and carry its value beyond the meter.</p>
                <p>By owning and operating assets for the long term, NSoul can serve businesses, reinvest in future projects, and build the capacity to help people and communities thrive.</p>
              </div>
            </div>
          </div>
        </section>

        <VisionFlywheel />

        <section id="model" className="vision-model section" aria-labelledby="model-title">
          <div className="container">
            <div className="vision-section-head">
              <div><p className="eyebrow">Our business model</p><h2 id="model-title">A mission supported by a durable business model.</h2></div>
              <p>NSoul is being structured as a commercial solar developer and independent power producer: develop carefully, own for the long term, and operate with discipline.</p>
            </div>
            <div className="vision-model__workflow">
              <div className="vision-model__toolbar">
                <span><i aria-hidden="true" /> NSoul operating model</span>
                <small>8 stages · Continuous ownership cycle</small>
              </div>
              <ol className="vision-model__steps">
                {modelSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.title}>
                      <span className="vision-model__card-image" style={{ backgroundImage: `url(${step.image})` }} aria-hidden="true" />
                      <div className="vision-model__card-meta">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <i><Icon aria-hidden="true" size={18} /></i>
                      </div>
                      <div className="vision-model__card-copy">
                        <small>{step.phase}</small>
                        <strong>{step.title}</strong>
                      </div>
                      <ArrowRight className="vision-model__card-arrow" aria-hidden="true" size={16} />
                    </li>
                  );
                })}
              </ol>
            </div>
            <p className="vision-model__principle">Purpose does not replace sound economics. <em>It depends on them.</em></p>
          </div>
        </section>

        <VisionPillars />

        <section className="vision-success section" aria-labelledby="success-title">
          <div className="container">
            <div className="vision-section-head">
              <div><p className="eyebrow">What success looks like</p><h2 id="success-title">Growth measured in assets, relationships, and service.</h2></div>
              <p>The long-term goal is a repeatable development platform, multiple operating assets, trusted local partnerships, and measurable community investment that grows with operating success.</p>
            </div>
            <ol className="vision-milestones">
              {milestones.map((milestone, index) => <li key={milestone.label}><span>0{index + 1}</span><p>{milestone.label}</p><h3>{milestone.title}</h3><small>{milestone.copy}</small></li>)}
            </ol>
          </div>
        </section>

        <FounderStatement />
        <VisionCommitment />

        <section className="vision-final-cta" aria-labelledby="vision-cta-title">
          <div className="container">
            <p className="eyebrow">Build with us</p>
            <h2 id="vision-cta-title">Let’s build energy that creates lasting value.</h2>
            <p>We are seeking commercial energy partners, landowners, technical partners, lenders, investors, and community leaders who believe infrastructure can serve both business and people.</p>
            <div>
              <Link className="button button--primary button--large" href="/#contact">Start the conversation <ArrowUpRight aria-hidden="true" size={17} /></Link>
              <Link className="button button--secondary button--large" href="/#project">View the project <ArrowRight aria-hidden="true" size={17} /></Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter termSheetAvailable={termSheetAvailable} />
    </>
  );
}
