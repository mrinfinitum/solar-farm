import type { Metadata } from "next";

import { LegalShell } from "@/components/layout/legal-shell";
import { LEGAL_CONTACT_EMAIL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms of Use | NSoul",
  description: "Terms governing informational use of the NSoul website and its development-stage project materials.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalShell eyebrow="NSoul LLC" title="Terms of Use" updated="August 3, 2026">
      <section><h2>Informational use</h2><p>This website provides general, development-stage information about NSoul LLC, potential commercial energy structures, and proposed project opportunities. You may use the site only for lawful informational and business-evaluation purposes.</p></section>
      <section><h2>Non-binding project information</h2><p>Project capacity, generation, rates, savings, timing, incentives, Renewable Energy Certificates, financing, utility status, and other figures are preliminary and illustrative unless expressly stated in a final signed agreement. They are not an offer, approval, commitment, production forecast, or guarantee.</p></section>
      <section><h2>No professional advice</h2><p>Website content is not legal, tax, accounting, engineering, investment, utility, environmental, or other professional advice. Obtain qualified advice appropriate to your circumstances.</p></section>
      <section><h2>Submissions</h2><p>Submitting a commercial inquiry, property, document, or message does not create an agency, partnership, customer relationship, offer, site approval, development commitment, confidentiality obligation, or agreement. Final obligations exist only in executed documents signed by authorized parties.</p></section>
      <section><h2>Intellectual property</h2><p>The site design, text, brand elements, graphics, and original materials are owned by or licensed to NSoul LLC and may not be reproduced or used commercially without permission, except for reasonable evaluation of an NSoul opportunity.</p></section>
      <section><h2>External links and services</h2><p>External sites and third-party services are controlled by their providers. NSoul is not responsible for their availability, content, security, or policies.</p></section>
      <section><h2>Disclaimer and limitation</h2><p>The site is provided on an “as available” basis to the extent permitted by law. NSoul disclaims warranties not expressly stated in a final written agreement and is not liable for decisions made solely from preliminary website content or for indirect, incidental, or consequential losses to the extent permitted by law.</p></section>
      <section><h2>Changes</h2><p>We may update the site or these terms as the business and project information evolve. The posted updated date identifies the current version.</p></section>
      <section><h2>Governing law</h2><p>The governing law and forum for these website terms remain to be confirmed by qualified legal counsel before commercial launch.</p></section>
      <section><h2>Contact</h2><p>Questions about these terms may be sent to <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>. This address is configurable and should be confirmed before launch.</p></section>
    </LegalShell>
  );
}
