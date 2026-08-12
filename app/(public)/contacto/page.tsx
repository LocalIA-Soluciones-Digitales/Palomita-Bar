import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contacto",
  description: `${SITE.name}: ${SITE.address.line1}, ${SITE.address.city}. ${SITE.phone}.`,
};

export default function ContactoPage() {
  const mapsQuery = encodeURIComponent(
    `${SITE.address.line1}, ${SITE.address.postalCode} ${SITE.address.city}`,
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-24">
      <p className="text-xs uppercase tracking-widest2 text-brand-pink">Contacto</p>
      <h1 className="mt-4 font-display text-5xl">Visítanos</h1>

      <div className="mt-12 grid gap-12 sm:grid-cols-2">
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">
              Dirección
            </p>
            <p className="mt-2 text-lg">{SITE.address.line1}</p>
            <p className="text-lg text-brand-ink/70">
              {SITE.address.postalCode} {SITE.address.city}, {SITE.address.province}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">
              Teléfono
            </p>
            <a href={SITE.phoneHref} className="mt-2 block text-lg hover:text-brand-pink">
              {SITE.phone}
            </a>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">
              Instagram
            </p>
            <a
              href={SITE.instagram.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-lg hover:text-brand-pink"
            >
              {SITE.instagram.handle}
            </a>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">
              Horario
            </p>
            <p className="mt-2 text-lg text-brand-ink/70">{SITE.hoursNote}</p>
          </div>
        </div>

        <div className="aspect-square w-full overflow-hidden bg-brand-sand">
          <iframe
            title="Mapa de ubicación de Palomita Bar"
            className="h-full w-full border-0"
            loading="lazy"
            src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
          />
        </div>
      </div>
    </div>
  );
}
