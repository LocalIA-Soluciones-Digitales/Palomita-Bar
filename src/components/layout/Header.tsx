"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { MobileNav } from "@/components/layout/MobileNav";
import { InstagramIcon } from "@/components/icons";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled
          ? "border-b border-noche-border bg-noche-bg/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:h-20">
        <Link href="/" className="leading-tight">
          <span className="block font-display text-xl tracking-wide text-noche-ink">
            Palomita Bar
          </span>
          <span className="block text-[10px] uppercase tracking-widest2 text-noche-ink-muted">
            Coctelería &amp; Picoteo
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors hover:text-noche-primary ${
                  active ? "text-noche-primary" : "text-noche-ink/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/pedir"
            className="inline-flex items-center rounded-full bg-noche-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-noche-primary-dark"
          >
            Pedir
          </Link>
          <a
            href={SITE.instagram.url}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram de Palomita Bar"
            className="text-noche-ink-muted transition-colors hover:text-noche-primary"
          >
            <InstagramIcon className="h-5 w-5" />
          </a>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
