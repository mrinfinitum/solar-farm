import { ArrowUpRight, LogIn, MapPin } from "lucide-react";

import { navigation, project, disclaimer } from "@/lib/project-data";
import { ProjectMark } from "@/components/ui/project-mark";
import { TermSheetLink } from "@/components/ui/term-sheet-link";

export function SiteFooter({ termSheetAvailable }: { termSheetAvailable: boolean }) {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <a className="brand-link" href="#top" aria-label="NSoul home">
            <ProjectMark />
            <span><strong>NSOUL</strong></span>
          </a>
          <p>{project.name}</p>
          <span><MapPin aria-hidden="true" size={15} /> {project.city}</span>
        </div>

        <div className="footer-links">
          <div>
            <p className="footer-label">Explore</p>
            {navigation.slice(0, 4).map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </div>
          <div>
            <p className="footer-label">Connect</p>
            <a href="#development">Development</a>
            <a href="#contact">Contact <ArrowUpRight aria-hidden="true" size={13} /></a>
            <a href="/login">Studio login <LogIn aria-hidden="true" size={13} /></a>
            <TermSheetLink available={termSheetAvailable} className="footer-download" />
          </div>
          <div>
            <p className="footer-label">Legal</p>
            <span title="Privacy policy to be provided before launch">Privacy</span>
            <span title="Terms of use to be provided before launch">Terms</span>
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
