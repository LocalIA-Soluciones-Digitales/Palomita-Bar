import Link from "next/link";
import { SITE } from "@/lib/constants";

export default function HomePage() {
  return (
    <>
      <section className="relative flex min-h-[90vh] flex-col justify-end overflow-hidden bg-brand-black px-6 pb-16 pt-32 text-brand-cream">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs uppercase tracking-widest2 text-brand-pink">
            Barakaldo
          </p>
          <h1 className="mt-4 font-display text-6xl leading-[0.95] sm:text-8xl">
            Palomita
          </h1>
          <p className="mt-6 max-w-md text-lg text-brand-cream/80">
            {SITE.tagline}. Picoteo con guiño japonés, cócteles de autor y
            barra abierta hasta tarde.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/carta"
              className="inline-flex items-center border border-brand-cream/40 px-6 py-3 text-sm uppercase tracking-widest2 transition-colors hover:border-brand-pink hover:text-brand-pink"
            >
              Ver carta
            </Link>
            <Link
              href="/pedir"
              className="inline-flex items-center bg-brand-pink px-6 py-3 text-sm uppercase tracking-widest2 transition-colors hover:bg-brand-pink-dark"
            >
              Pedir en mesa
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-28 text-center">
        <p className="text-xs uppercase tracking-widest2 text-brand-pink">
          Concepto
        </p>
        <p className="mt-6 font-display text-3xl leading-snug text-brand-ink sm:text-4xl">
          Coctelería de barra, cocina internacional y un punto de sitio
          japonés. Sin solemnidad, con oficio.
        </p>
      </section>

      <section className="border-t border-brand-black/10 bg-brand-sand px-6 py-28">
        <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-widest2 text-brand-pink">
              Picoteo
            </p>
            <h2 className="mt-4 font-display text-4xl">Para compartir</h2>
            <p className="mt-4 max-w-md text-brand-ink/70">
              Croquetas, gyozas, bao, tartar de atún y rolls. Pensado para
              picar sin prisa, entre cóctel y cóctel.
            </p>
            <Link
              href="/carta"
              className="mt-6 inline-block text-sm uppercase tracking-widest2 text-brand-ink underline decoration-brand-pink underline-offset-4"
            >
              Ver carta completa
            </Link>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest2 text-brand-pink">
              Coctelería
            </p>
            <h2 className="mt-4 font-display text-4xl">De la barra</h2>
            <p className="mt-4 max-w-md text-brand-ink/70">
              Clásicos bien hechos —Pisco Sour, Espresso Martini, Negroni— y
              la casa: la Palomita.
            </p>
            <Link
              href="/cocteleria"
              className="mt-6 inline-block text-sm uppercase tracking-widest2 text-brand-ink underline decoration-brand-pink underline-offset-4"
            >
              Descubrir coctelería
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-widest2 text-brand-pink">
            Ubicación
          </p>
          <h2 className="mt-4 font-display text-4xl">
            {SITE.address.line1}
          </h2>
          <p className="mt-2 text-brand-ink/70">
            {SITE.address.postalCode} {SITE.address.city}, {SITE.address.province}
          </p>
          <Link
            href="/contacto"
            className="mt-6 inline-block text-sm uppercase tracking-widest2 text-brand-ink underline decoration-brand-pink underline-offset-4"
          >
            Cómo llegar y horarios
          </Link>
        </div>
      </section>
    </>
  );
}
