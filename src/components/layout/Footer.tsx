import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-brand-black/10 bg-brand-black text-brand-cream">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl">Palomita</p>
            <p className="mt-3 text-sm text-brand-cream/70">{SITE.tagline}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest2 text-brand-cream/50">
              Navegación
            </p>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-cream/80 hover:text-brand-pink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest2 text-brand-cream/50">
              Visítanos
            </p>
            <address className="mt-4 space-y-1 text-sm not-italic text-brand-cream/80">
              <p>{SITE.address.line1}</p>
              <p>
                {SITE.address.postalCode} {SITE.address.city}, {SITE.address.province}
              </p>
              <p>
                <a href={SITE.phoneHref} className="hover:text-brand-pink">
                  {SITE.phone}
                </a>
              </p>
              <p>
                <a
                  href={SITE.instagram.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand-pink"
                >
                  {SITE.instagram.handle}
                </a>
              </p>
            </address>
          </div>
        </div>

        <p className="mt-16 text-xs text-brand-cream/40">
          © {new Date().getFullYear()} Palomita Bar
        </p>
      </div>
    </footer>
  );
}
