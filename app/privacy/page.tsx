import type { Metadata } from "next";

import { LegalShell } from "@/components/layout/legal-shell";
import { LEGAL_CONTACT_EMAIL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy | NSoul",
  description: "How NSoul LLC handles information submitted through its commercial energy and property-intake experiences.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalShell eyebrow="NSoul LLC" title="Privacy Policy" updated="August 3, 2026">
      <section><h2>Scope</h2><p>This policy describes how NSoul LLC collects and uses information submitted through this website. It applies to commercial energy inquiries, land submissions, technical logs, analytics, and related communications.</p></section>
      <section><h2>Information you provide</h2><p>Commercial inquiry data may include your name, work contact information, company, job title, facility location, energy profile, utility provider, desired timeline, and message. Land submissions may include ownership or broker details, property location, acreage, land characteristics, transaction preferences, listing or parcel information, and an optional supporting file.</p></section>
      <section><h2>Technical information and analytics</h2><p>We may process limited technical logs, such as request timestamps, browser or device information, IP-derived security signals, referring pages, and campaign parameters. Analytics events are intended to measure page and conversion performance and should not include form-field contents or unnecessary personal data.</p></section>
      <section><h2>How information is used</h2><p>We use submitted information to respond to inquiries, evaluate potential energy or land opportunities, maintain security, improve the website, and keep internal records. Submission does not create an offer, commitment, site approval, development agreement, or customer relationship.</p></section>
      <section><h2>Communications</h2><p>We may send a concise confirmation and respond about the inquiry you initiated. We do not use this policy to authorize unrelated promotional communications.</p></section>
      <section><h2>Sharing</h2><p>We may share information with service providers that support hosting, databases, storage, email delivery, analytics, security, and professional project evaluation. We may also disclose information when required by law or to protect legal rights. We do not represent that submitted opportunities are approved or committed projects.</p></section>
      <section><h2>Retention and security</h2><p>Information is retained for as long as reasonably needed to evaluate and document the inquiry, comply with obligations, resolve disputes, and maintain security. We use administrative and technical safeguards appropriate to the nature of the information, but no system can guarantee absolute security.</p></section>
      <section><h2>Your choices and rights</h2><p>You may ask to access, correct, or delete personal information, subject to applicable law and legitimate recordkeeping needs. You may also ask us to stop non-essential communications.</p></section>
      <section><h2>Contact</h2><p>For privacy questions or requests, contact <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>. This address is configurable and should be confirmed before launch.</p></section>
    </LegalShell>
  );
}
