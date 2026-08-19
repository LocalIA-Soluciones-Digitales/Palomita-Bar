import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { InstagramIcon, MapPinIcon } from "@/components/icons";

export function Footer() {
  const mapQuery = encodeURIComponent(
    `${SITE.name} ${SITE.address.line1}, ${SITE.address.postalCode} ${SITE.address.city}`,
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <footer className="border-t border-noche-border bg-noche-surface text-noche-ink">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/logo-palomita.png"
                alt=""
                width={94}
                height={80}
                className="h-9 w-auto"
              />
              <p className="font-display text-2xl">Palomita Bar</p>
            </div>
            <p className="mt-3 text-sm text-noche-ink-muted">{SITE.tagline}</p>
            <a
              href={SITE.instagram.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-noche-ink-muted transition-colors hover:text-noche-primary"
            >
              <InstagramIcon className="h-4 w-4" />
              {SITE.instagram.handle}
            </a>
          </div>

          <div>
            <p className="text-sm font-medium text-noche-ink-muted">Navegación</p>
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
              <li>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-noche-ink/80 transition-colors hover:text-noche-primary"
                >
                  <MapPinIcon className="h-4 w-4" />
                  Cómo llegar
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-noche-ink-muted">Visítanos</p>
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
            © {new Date().getFullYear()} Palomita Bar · {SITE.address.city}
          </p>
        </div>
      </div>
    </footer>
  );
}
