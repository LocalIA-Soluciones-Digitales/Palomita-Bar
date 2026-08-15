"use client";

import { SITE } from "@/lib/constants";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { PhoneIcon, InstagramIcon, MapPinIcon, ClockIcon } from "@/components/icons";

export function LocationSection({ horario }: { horario: string | null }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  const mapQuery = encodeURIComponent(
    `${SITE.name} ${SITE.address.line1}, ${SITE.address.postalCode} ${SITE.address.city}`,
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&z=16&output=embed`;

  return (
    <section id="contacto" className="border-t border-noche-border bg-noche-bg px-6 py-28">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl transition-all duration-700 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="flex items-center justify-center gap-3 text-xs uppercase tracking-widest2 text-noche-primary">
            <span className="h-px w-6 bg-noche-primary/50" />
            Encuéntranos
            <span className="h-px w-6 bg-noche-primary/50" />
          </p>
          <h2 className="mt-4 font-display text-4xl text-noche-ink">{SITE.name}</h2>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-noche-primary">Dirección</p>
            <p className="mt-3 flex items-start gap-2 text-noche-ink/80">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-noche-primary" />
              <span>
                {SITE.address.line1}
                <br />
                {SITE.address.postalCode} {SITE.address.city}
                <br />
                {SITE.address.province}, España
              </span>
            </p>

            <p className="mt-8 text-sm font-medium text-noche-primary">Contacto</p>
            <div className="mt-3 space-y-2 text-noche-ink/80">
              <p>
                <a
                  href={SITE.phoneHref}
                  className="inline-flex items-center gap-2 transition-colors hover:text-noche-primary"
                >
                  <PhoneIcon className="h-4 w-4 text-noche-primary" />
                  {SITE.phone}
                </a>
              </p>
              <p>
                <a
                  href={SITE.instagram.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-noche-primary"
                >
                  <InstagramIcon className="h-4 w-4 text-noche-primary" />
                  {SITE.instagram.handle}
                </a>
              </p>
            </div>

            <p className="mt-8 text-sm font-medium text-noche-primary">Horario</p>
            <p className="mt-3 flex items-start gap-2 whitespace-pre-line text-noche-ink/80">
              <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-noche-primary" />
              {horario ?? SITE.hoursNote}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-noche-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-noche-primary-dark"
              >
                <MapPinIcon className="h-4 w-4" />
                Cómo llegar
              </a>
              <a
                href={SITE.phoneHref}
                className="inline-flex items-center gap-2 rounded-full border border-noche-ink/30 px-6 py-3 text-sm font-medium text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary"
              >
                <PhoneIcon className="h-4 w-4" />
                Llamar
              </a>
            </div>

            <a
              href={SITE.googleReviewsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-10 inline-block text-sm text-noche-ink-muted underline decoration-noche-primary underline-offset-4 transition-colors hover:text-noche-ink"
            >
              Ver nuestras reseñas en Google
            </a>
          </div>

          <div className="h-72 overflow-hidden rounded-lg border border-noche-border md:h-full">
            <iframe
              title="Ubicación de Palomita Bar"
              src={mapsEmbedUrl}
              loading="lazy"
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
