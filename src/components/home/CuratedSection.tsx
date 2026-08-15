"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCentimos } from "@/lib/format";
import type { Categoria, Producto } from "@/lib/restaurant/types";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRightIcon } from "@/components/icons";

export function CuratedSection({
  productos,
  categorias,
}: {
  productos: Producto[];
  categorias: Categoria[];
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  if (productos.length === 0) return null;

  const categoriaPorId = new Map(categorias.map((c) => [c.id, c.nombre]));

  return (
    <section className="border-t border-noche-border bg-noche-bg px-6 py-28">
      <div
        ref={ref}
        className={`mx-auto max-w-6xl transition-all duration-700 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="flex items-center justify-center gap-3 text-xs uppercase tracking-widest2 text-noche-primary">
            <span className="h-px w-6 bg-noche-primary/50" />
            La esencia
            <span className="h-px w-6 bg-noche-primary/50" />
          </p>
          <h2 className="mt-4 font-display text-4xl text-noche-ink">
            Una selección de Palomita Bar
          </h2>
          <p className="mt-4 text-noche-ink/70">
            Un aperitivo de nuestra carta: coctelería artesanal y picoteo elegido con esmero
            para compartir. Descubre el resto en la carta completa.
          </p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {productos.map((producto) => {
            const categoria = categoriaPorId.get(producto.categoria_id ?? "");
            return (
              <Link
                key={producto.id}
                href={`/carta?product=${producto.id}`}
                className="group block overflow-hidden rounded-lg border border-noche-border bg-noche-surface transition-colors hover:border-noche-primary/60"
              >
                <div className="flex items-center gap-4 sm:block">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg sm:h-auto sm:w-full sm:aspect-[4/5] sm:rounded-none">
                    {producto.imagen_url ? (
                      <Image
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 96px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-noche-surface-2" />
                    )}

                    <div className="absolute inset-0 hidden bg-gradient-to-t from-black/45 via-black/5 to-transparent sm:block" />

                    {categoria ? (
                      <span className="absolute left-3 top-3 hidden rounded-full bg-noche-bg/80 px-3 py-1 text-[10px] uppercase tracking-widest2 text-noche-ink backdrop-blur-sm sm:block">
                        {categoria}
                      </span>
                    ) : null}
                    <span className="absolute bottom-3 right-3 hidden rounded-full bg-noche-primary px-3 py-1 text-xs font-semibold text-white sm:block">
                      {formatCentimos(producto.precio_centimos)} €
                    </span>
                  </div>

                  <div className="min-w-0 px-4 py-3 sm:px-5 sm:py-4">
                    {categoria ? (
                      <p className="text-[10px] uppercase tracking-widest2 text-noche-primary sm:hidden">
                        {categoria}
                      </p>
                    ) : null}
                    <p className="mt-1 truncate font-display text-lg font-light text-noche-ink sm:mt-0 sm:text-xl">
                      {producto.nombre}
                    </p>
                    {producto.descripcion ? (
                      <p className="mt-1.5 hidden text-sm text-noche-ink-muted sm:line-clamp-2 sm:block">
                        {producto.descripcion}
                      </p>
                    ) : null}
                    <div className="mt-1 flex items-center justify-between gap-2 sm:hidden">
                      <p className="text-sm text-noche-ink-muted">
                        {formatCentimos(producto.precio_centimos)} €
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-noche-primary">
                        Ver
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/carta"
            className="inline-flex items-center rounded-full bg-noche-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-noche-primary-dark"
          >
            Ver carta completa →
          </Link>
        </div>
      </div>
    </section>
  );
}
