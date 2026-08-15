import { SITE } from "@/lib/constants";

export function LocationSection({ horario }: { horario: string | null }) {
  const mapQuery = encodeURIComponent(
    `${SITE.name} ${SITE.address.line1}, ${SITE.address.postalCode} ${SITE.address.city}`,
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&z=16&output=embed`;

  return (
    <section className="border-t border-noche-border bg-noche-bg px-6 py-28">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-widest2 text-noche-primary">Ubicación</p>
          <h2 className="mt-4 font-display text-4xl text-noche-ink">{SITE.address.line1}</h2>
          <p className="mt-2 text-noche-ink-muted">
            {SITE.address.postalCode} {SITE.address.city}, {SITE.address.province}
          </p>

          <p className="mt-8 text-xs uppercase tracking-widest2 text-noche-ink-muted">Horario</p>
          <p className="mt-2 text-noche-ink/80">{horario ?? SITE.hoursNote}</p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center border border-noche-ink/30 px-6 py-3 text-sm uppercase tracking-widest2 text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary"
            >
              Cómo llegar
            </a>
            <a
              href={SITE.phoneHref}
              className="inline-flex items-center bg-noche-primary px-6 py-3 text-sm uppercase tracking-widest2 text-white transition-colors hover:bg-noche-primary-dark"
            >
              Llamar
            </a>
          </div>

          <a
            href="https://www.google.com/search?q=Palomita+Bar+Barakaldo+reseñas"
            target="_blank"
            rel="noreferrer"
            className="mt-10 inline-block text-sm uppercase tracking-widest2 text-noche-ink-muted underline decoration-noche-primary underline-offset-4 transition-colors hover:text-noche-ink"
          >
            Ver nuestras reseñas en Google
          </a>
        </div>

        <div className="h-72 overflow-hidden border border-noche-border md:h-full">
          <iframe
            title="Ubicación de Palomita Bar"
            src={mapsEmbedUrl}
            loading="lazy"
            className="h-full w-full grayscale invert-[0.92] contrast-[0.9]"
          />
        </div>
      </div>
    </section>
  );
}
