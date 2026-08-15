"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/constants";
import { MobileNav } from "@/components/layout/MobileNav";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-display text-xl tracking-wide text-noche-ink">
          Palomita
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm uppercase tracking-widest2 text-noche-ink/80 transition-colors hover:text-noche-primary"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="text-xs uppercase tracking-widest2 text-noche-ink-muted transition-colors hover:text-noche-ink"
          >
            Equipo
          </Link>
          <Link
            href="/pedir"
            className="inline-flex items-center bg-noche-primary px-5 py-2.5 text-sm uppercase tracking-widest2 text-white transition-colors hover:bg-noche-primary-dark"
          >
            Pedir
          </Link>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
