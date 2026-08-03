"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { navigation } from "@/lib/project-data";
import { cn } from "@/lib/utils";
import { ProjectMark } from "@/components/ui/project-mark";
import { TermSheetLink } from "@/components/ui/term-sheet-link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const desktopNavigation = [
  { label: "Overview", href: "#top" },
  ...navigation.slice(1, 5).map((item) => ({
    ...item,
    label: item.href === "#how-it-works" ? "Process" : item.label,
  })),
];

export function SiteHeader({ termSheetAvailable }: { termSheetAvailable: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#top");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    const sections = desktopNavigation
      .map((item) => document.querySelector(item.href))
      .filter((section): section is Element => section !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveHref(`#${visible[0].target.id}`);
      },
      { rootMargin: "-12% 0px -72% 0px", threshold: [0, 0.2, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header className={cn("site-header", scrolled && "site-header--scrolled")}>
      <div className="nav-shell">
        <a className="brand-link" href="#top" aria-label="NSoul home">
          <ProjectMark />
          <span><strong>NSOUL</strong></span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {desktopNavigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(activeHref === item.href && "is-active")}
              aria-current={activeHref === item.href ? "location" : undefined}
              onClick={() => setActiveHref(item.href)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          <a
            className="nav-contact"
            href="#contact"
            aria-label="Discuss your energy needs"
          >
            <span>Contact</span>
            <i><ArrowUpRight aria-hidden="true" size={17} /></i>
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" className={cn("mobile-menu", menuOpen && "mobile-menu--open")}>
        <nav aria-label="Mobile navigation">
          {navigation.map((item, index) => (
            <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              <span>0{index + 1}</span>{item.label}
            </a>
          ))}
        </nav>
        <TermSheetLink available={termSheetAvailable} className="button button--secondary mobile-download" />
      </div>
    </header>
  );
}
