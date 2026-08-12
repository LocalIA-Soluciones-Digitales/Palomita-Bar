import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";
import { MobileNav } from "@/components/layout/MobileNav";

export function Header() {
  return (
    <header className="relative z-40 border-b border-brand-black/10 bg-brand-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-display text-xl tracking-wide">
          Palomita
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm uppercase tracking-widest2 text-brand-ink/80 transition-colors hover:text-brand-pink"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/pedir"
            className="inline-flex items-center bg-brand-pink px-5 py-2.5 text-sm uppercase tracking-widest2 text-white transition-colors hover:bg-brand-pink-dark"
          >
            Pedir
          </Link>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
