import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-noche-border bg-noche-surface text-noche-ink">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl">Palomita</p>
            <p className="mt-3 text-sm text-noche-ink-muted">{SITE.tagline}</p>
            <a
              href={SITE.instagram.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm text-noche-ink-muted transition-colors hover:text-noche-primary"
            >
              {SITE.instagram.handle}
            </a>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
              Navegación
            </p>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-noche-ink/80 transition-colors hover:text-noche-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
              Visítanos
            </p>
            <address className="mt-4 space-y-1 text-sm not-italic text-noche-ink/80">
              <p>{SITE.address.line1}</p>
              <p>
                {SITE.address.postalCode} {SITE.address.city}, {SITE.address.province}
              </p>
              <p>
                <a href={SITE.phoneHref} className="transition-colors hover:text-noche-primary">
                  {SITE.phone}
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-noche-border pt-6">
          <p className="text-xs text-noche-ink-muted">
            © {new Date().getFullYear()} Palomita Bar
          </p>
          <p className="text-xs text-noche-ink-muted">Barakaldo, Bizkaia</p>
        </div>
      </div>
    </footer>
  );
}
