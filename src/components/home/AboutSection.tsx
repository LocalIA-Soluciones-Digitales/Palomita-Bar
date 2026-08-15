"use client";

import Image from "next/image";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export function AboutSection({ image }: { image: string | null }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  return (
    <section id="nosotros" className="bg-noche-bg px-6 py-16 md:py-24">
      <div
        ref={ref}
        className={`mx-auto grid max-w-7xl items-center gap-16 transition-all duration-700 md:grid-cols-2 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        {image ? (
          <div className="relative order-2 aspect-[4/5] w-full lg:order-1">
            <div className="absolute -bottom-6 -right-6 -z-10 h-32 w-32 rounded-lg border border-noche-primary/30 md:h-40 md:w-40" />
            <div className="relative h-full w-full overflow-hidden rounded-lg">
              <Image
                src={image}
                alt="Barra de Palomita Bar"
                fill
                sizes="(min-width: 768px) 480px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}

        <div className="order-1 lg:order-2">
          <p className="flex items-center gap-3 text-xs uppercase tracking-widest2 text-noche-primary">
            <span className="h-px w-6 bg-noche-primary/50" />
            Nosotros
          </p>
          <h2 className="mt-4 font-display text-4xl font-light leading-tight text-noche-ink md:text-5xl lg:text-6xl">
            Más que una copa
          </h2>
          <p className="mt-6 max-w-md text-noche-ink/70">
            Coctelería de barra con oficio, cocina internacional y un punto de sitio japonés.
            Nacimos en Barakaldo con la idea de un bar sin solemnidad donde cuidar cada detalle:
            de la maceración de un cóctel de autor a un roll tempurizado para compartir.
          </p>
          <p className="mt-4 max-w-md text-noche-ink/70">
            Barra abierta hasta tarde, buena música y una carta pensada para picar sin prisa,
            entre cóctel y cóctel.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-noche-ink-muted">
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-noche-primary" />
              Coctelería artesanal
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-noche-primary" />
              Picoteo para compartir
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-noche-primary" />
              Inspiración japonesa
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
