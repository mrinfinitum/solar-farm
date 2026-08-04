import { ArrowUpRight, LogIn, MapPin } from "lucide-react";
import Link from "next/link";

import { navigation, project, disclaimer } from "@/lib/project-data";
import { ProjectMark } from "@/components/ui/project-mark";
import { TermSheetLink } from "@/components/ui/term-sheet-link";

export function SiteFooter({ termSheetAvailable }: { termSheetAvailable: boolean }) {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link className="brand-link" href="/" aria-label="NSoul home">
            <ProjectMark />
            <span><strong>NSOUL</strong></span>
          </Link>
          <p>{project.name}</p>
          <span><MapPin aria-hidden="true" size={15} /> {project.city}</span>
        </div>

        <div className="footer-links">
          <div>
            <p className="footer-label">Explore</p>
            <Link href="/our-vision">Our Vision</Link>
            {navigation.slice(0, 4).map((item) => <Link key={item.href} href={`/${item.href}`}>{item.label}</Link>)}
          </div>
          <div>
            <p className="footer-label">Connect</p>
            <Link href="/#development">Development</Link>
            <Link href="/#contact">Contact <ArrowUpRight aria-hidden="true" size={13} /></Link>
            <Link href="/login">Studio login <LogIn aria-hidden="true" size={13} /></Link>
            <TermSheetLink available={termSheetAvailable} className="footer-download" context="footer" />
          </div>
          <div>
            <p className="footer-label">Legal</p>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>

      <div className="container footer-disclaimer">
        <p>{disclaimer}</p>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} NSoul LLC. All rights reserved.</p>
        <p>Development-stage project · Information as of August 2026</p>
      </div>
    </footer>
  );
}
