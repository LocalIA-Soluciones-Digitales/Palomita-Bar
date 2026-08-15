import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { getHorarioPublico } from "@/lib/restaurant/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contacto",
  description: `${SITE.name}: ${SITE.address.line1}, ${SITE.address.city}. ${SITE.phone}.`,
};

export default async function ContactoPage() {
  const mapsQuery = encodeURIComponent(
    `${SITE.address.line1}, ${SITE.address.postalCode} ${SITE.address.city}`,
  );
  const horario = await getHorarioPublico();

  return (
    <div className="mx-auto max-w-4xl px-6 py-24">
      <p className="text-xs uppercase tracking-widest2 text-noche-primary">Contacto</p>
      <h1 className="mt-4 font-display text-5xl text-noche-ink">Visítanos</h1>

      <div className="mt-12 grid gap-12 sm:grid-cols-2">
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
              Dirección
            </p>
            <p className="mt-2 text-lg text-noche-ink">{SITE.address.line1}</p>
            <p className="text-lg text-noche-ink-muted">
              {SITE.address.postalCode} {SITE.address.city}, {SITE.address.province}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
              Teléfono
            </p>
            <a href={SITE.phoneHref} className="mt-2 block text-lg text-noche-ink hover:text-noche-primary">
              {SITE.phone}
            </a>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
              Instagram
            </p>
            <a
              href={SITE.instagram.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-lg text-noche-ink hover:text-noche-primary"
            >
              {SITE.instagram.handle}
            </a>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
              Horario
            </p>
            <p className="mt-2 whitespace-pre-line text-lg text-noche-ink-muted">
              {horario || SITE.hoursNote}
            </p>
          </div>
        </div>

        <div className="aspect-square w-full overflow-hidden border border-noche-border bg-noche-surface">
          <iframe
            title="Mapa de ubicación de Palomita Bar"
            className="h-full w-full border-0 grayscale invert-[0.92] contrast-[0.9]"
            loading="lazy"
            src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
          />
        </div>
      </div>
    </div>
  );
}
