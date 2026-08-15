"use client";

import Image from "next/image";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export function AboutSection({ image }: { image: string | null }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  return (
    <section id="nosotros" className="bg-noche-bg px-6 py-28">
      <div
        ref={ref}
        className={`mx-auto grid max-w-6xl items-center gap-16 transition-all duration-700 md:grid-cols-2 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        {image ? (
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <Image
              src={image}
              alt="Barra de Palomita Bar"
              fill
              sizes="(min-width: 768px) 480px, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}

        <div>
          <p className="text-xs uppercase tracking-widest2 text-noche-primary">Nosotros</p>
          <h2 className="mt-4 font-display text-4xl text-noche-ink">Más que una copa</h2>
          <p className="mt-6 max-w-md text-noche-ink/70">
            Coctelería de barra con oficio, cocina internacional y un punto de sitio japonés.
            Nacimos en Barakaldo con la idea de un bar sin solemnidad donde cuidar cada detalle:
            de la maceración de un cóctel de autor a un roll tempurizado para compartir.
          </p>
          <p className="mt-4 max-w-md text-noche-ink/70">
            Barra abierta hasta tarde, buena música y una carta pensada para picar sin prisa,
            entre cóctel y cóctel.
          </p>
        </div>
      </div>
    </section>
  );
}
