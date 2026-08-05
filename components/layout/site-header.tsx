"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { navigation } from "@/lib/project-data";
import { cn } from "@/lib/utils";
import { ProjectMark } from "@/components/ui/project-mark";
import { TermSheetLink } from "@/components/ui/term-sheet-link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { trackEvent } from "@/lib/analytics";

const desktopNavigation = [
  { label: "Overview", href: "#top" },
  { label: "Our Vision", href: "/our-vision" },
  ...navigation.slice(1, 5).map((item) => ({
    ...item,
    label: item.href === "#how-it-works" ? "Process" : item.label,
  })),
];

const mobileNavigation = [
  { label: "Overview", href: "#top" },
  { label: "Our Vision", href: "/our-vision" },
  ...navigation.slice(0, 5).map((item) => ({
    ...item,
    label: item.href === "#how-it-works" ? "Process" : item.label,
  })),
];

function resolveHref(href: string, onHomePage: boolean) {
  return href.startsWith("#") && !onHomePage ? `/${href}` : href;
}

export function SiteHeader({ termSheetAvailable, tone = "default" }: { termSheetAvailable: boolean; tone?: "default" | "dark" }) {
  const pathname = usePathname();
  const onHomePage = pathname === "/";
  const [headerState, setHeaderState] = useState<"top" | "hidden" | "sticky">("top");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState(pathname === "/our-vision" ? "/our-vision" : "#top");

  useEffect(() => {
    let lastY = Math.max(0, window.scrollY);
    let frame = 0;
    let initializing = true;

    const updateHeader = () => {
      const currentY = Math.max(0, window.scrollY);
      const delta = currentY - lastY;

      if (initializing) {
        setHeaderState(currentY <= 24 ? "top" : "hidden");
        initializing = false;
        lastY = currentY;
      } else if (currentY <= 24) {
        setHeaderState("top");
        lastY = currentY;
      } else if (Math.abs(delta) >= 4) {
        setHeaderState(delta < 0 ? "sticky" : "hidden");
        lastY = currentY;
      }

      frame = 0;
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateHeader);
    };

    frame = window.requestAnimationFrame(updateHeader);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!onHomePage) return;
    const sections = desktopNavigation
      .filter((item) => item.href.startsWith("#"))
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
  }, [onHomePage]);

  const sticky = headerState === "sticky" || menuOpen;

  return (
    <header
      className={cn(
        "site-header",
        tone === "dark" && "site-header--dark-top",
        sticky && "site-header--sticky site-header--scrolled",
        headerState === "hidden" && !menuOpen && "site-header--hidden",
      )}
    >
      <div className="nav-shell">
        <Link className="brand-link" href="/" aria-label="NSoul home">
          <ProjectMark />
          <span><strong>NSOUL</strong></span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {desktopNavigation.map((item) => (
            <Link
              key={item.href}
              href={resolveHref(item.href, onHomePage)}
              className={cn(activeHref === item.href && "is-active")}
              aria-current={activeHref === item.href ? "location" : undefined}
              onClick={() => setActiveHref(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          <TermSheetLink available={termSheetAvailable} className="nav-term-sheet" label="Term sheet" context="header" />
          <a
            className="nav-contact"
            href={onHomePage ? "#contact" : "/#contact"}
            aria-label="Discuss your energy needs"
            onClick={() => trackEvent("nav_contact_click", { context: "header" })}
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

      <div id="mobile-menu" className={cn("mobile-menu", menuOpen && "mobile-menu--open")} aria-hidden={!menuOpen}>
        <nav aria-label="Mobile navigation">
          {mobileNavigation.map((item) => (
            <Link key={`${item.label}-${item.href}`} href={resolveHref(item.href, onHomePage)} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mobile-menu__actions">
          <a
            className="mobile-menu__contact"
            href={onHomePage ? "#contact" : "/#contact"}
            onClick={() => {
              setMenuOpen(false);
              trackEvent("nav_contact_click", { context: "mobile-menu" });
            }}
          >
            Contact <ArrowUpRight aria-hidden="true" size={18} />
          </a>
          <div className="mobile-menu__utility">
            <span>Appearance</span>
            <ThemeToggle />
          </div>
          <TermSheetLink available={termSheetAvailable} className="mobile-download" context="mobile-menu" />
        </div>
      </div>
    </header>
  );
}
