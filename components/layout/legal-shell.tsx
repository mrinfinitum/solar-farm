import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ProjectMark } from "@/components/ui/project-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function LegalShell({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="legal-shell">
      <header className="legal-header container">
        <Link className="brand-link" href="/" aria-label="NSoul home"><ProjectMark /><strong>NSOUL</strong></Link>
        <div><Link href="/"><ArrowLeft aria-hidden="true" />Back to site</Link><ThemeToggle /></div>
      </header>
      <main className="legal-page container">
        <header><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>Last updated {updated}</p></header>
        <aside role="note">This draft policy should be reviewed by qualified legal counsel before commercial launch.</aside>
        <article>{children}</article>
      </main>
    </div>
  );
}
