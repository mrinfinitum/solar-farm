import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function VisionHero() {
  return (
    <section id="top" className="vision-hero" aria-labelledby="vision-title">
      <Image
        className="vision-hero__image"
        src="/brand/nsoul-solar-business-campus.jpg"
        alt="Illustrative solar arrays connected to a modern commercial facility at sunset"
        fill
        priority
        sizes="100vw"
      />
      <div className="vision-hero__veil" aria-hidden="true" />
      <div className="vision-hero__rays" aria-hidden="true" />
      <div className="container vision-hero__content vision-enter">
        <p className="eyebrow">Our vision</p>
        <h1 id="vision-title">Through the power of the sun,<br /><em>we enlighten the community.</em></h1>
        <p className="vision-hero__lede">
          NSoul is being built to create long-term value from renewable energy—value that strengthens businesses, creates durable local infrastructure, and helps expand opportunity for people and communities.
        </p>
        <div className="vision-hero__actions">
          <Link className="button button--primary button--large" href="#model">Explore the NSoul model <ArrowDownRight aria-hidden="true" size={17} /></Link>
          <Link className="vision-text-link" href="/#contact">Start a conversation <ArrowUpRight aria-hidden="true" size={16} /></Link>
        </div>
      </div>
      <div className="vision-hero__caption" aria-hidden="true">
        <span>Infrastructure</span><i /> <span>Ownership</span><i /> <span>Service</span>
      </div>
    </section>
  );
}
