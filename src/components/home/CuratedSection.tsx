import Image from "next/image";
import Link from "next/link";
import { formatCentimos } from "@/lib/format";
import type { Categoria, Producto } from "@/lib/restaurant/types";

export function CuratedSection({
  productos,
  categorias,
}: {
  productos: Producto[];
  categorias: Categoria[];
}) {
  if (productos.length === 0) return null;

  const categoriaPorId = new Map(categorias.map((c) => [c.id, c.nombre]));

  return (
    <section className="border-t border-noche-border bg-noche-bg px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-widest2 text-noche-primary">Selección</p>
        <h2 className="mt-4 font-display text-4xl text-noche-ink">De la carta</h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((producto) => (
            <Link
              key={producto.id}
              href={`/carta?product=${producto.id}`}
              className="group relative flex items-center gap-4 overflow-hidden border border-noche-border bg-noche-surface transition-colors hover:border-noche-primary/60 sm:block sm:aspect-[3/4]"
            >
              {producto.imagen_url ? (
                <div className="relative h-24 w-24 shrink-0 overflow-hidden sm:h-full sm:w-full">
                  <Image
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 96px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="h-24 w-24 shrink-0 bg-noche-surface-2 sm:h-full sm:w-full" />
              )}

              <div className="min-w-0 px-4 py-3 sm:absolute sm:inset-x-0 sm:bottom-0 sm:bg-gradient-to-t sm:from-noche-bg/95 sm:via-noche-bg/50 sm:to-transparent sm:px-5 sm:py-6">
                {categoriaPorId.get(producto.categoria_id ?? "") ? (
                  <p className="text-[10px] uppercase tracking-widest2 text-noche-primary">
                    {categoriaPorId.get(producto.categoria_id ?? "")}
                  </p>
                ) : null}
                <p className="mt-1 truncate font-display text-lg text-noche-ink sm:text-xl">
                  {producto.nombre}
                </p>
                <p className="mt-1 text-sm text-noche-ink-muted">
                  {formatCentimos(producto.precio_centimos)} €
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/carta"
            className="inline-block text-sm uppercase tracking-widest2 text-noche-ink underline decoration-noche-primary underline-offset-4"
          >
            Ver carta completa
          </Link>
        </div>
      </div>
    </section>
  );
}
