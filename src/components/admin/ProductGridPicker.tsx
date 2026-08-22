"use client";

import Image from "next/image";
import { formatCentimos } from "@/lib/format";
import type { Categoria, Producto } from "@/lib/restaurant/types";
import { MinusIcon, PlusIcon } from "@/components/icons";

export function ProductGridPicker({
  categorias,
  productos,
  categoriaActiva,
  onCategoriaChange,
  cantidades,
  onCantidadChange,
  className,
  gridClassName = "grid-cols-2",
  listMaxHeightClassName,
}: {
  categorias: Categoria[];
  productos: Producto[];
  categoriaActiva: string | null;
  onCategoriaChange: (id: string) => void;
  cantidades: Record<string, number>;
  onCantidadChange: (productoId: string, delta: number) => void;
  className?: string;
  gridClassName?: string;
  listMaxHeightClassName?: string;
}) {
  const productosCategoria = productos
    .filter((p) => p.categoria_id === categoriaActiva)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));

  const grid = (
    <div className={`grid gap-2 ${gridClassName}`}>
      {productosCategoria.map((producto) => {
        const cantidad = cantidades[producto.id] ?? 0;
        return (
          <div
            key={producto.id}
            className={`flex flex-col justify-between rounded-xl border p-3 transition-colors ${
              cantidad > 0
                ? "border-noche-primary bg-noche-primary/5"
                : "border-noche-border bg-noche-surface-2/60"
            }`}
          >
            <div>
              {producto.imagen_url ? (
                <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-lg bg-noche-surface-3">
                  <Image
                    src={producto.imagen_url}
                    alt=""
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <p className="text-sm font-medium leading-snug text-noche-ink">{producto.nombre}</p>
              <p className="mt-0.5 text-xs text-noche-ink-muted">
                {formatCentimos(producto.precio_centimos)} €
              </p>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onCantidadChange(producto.id, -1)}
                disabled={cantidad === 0}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-noche-border text-noche-ink transition-colors disabled:opacity-30"
              >
                <MinusIcon className="h-3 w-3" />
              </button>
              <span className="text-sm font-semibold tabular-nums text-noche-ink">{cantidad}</span>
              <button
                type="button"
                onClick={() => onCantidadChange(producto.id, 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-noche-primary text-noche-ink transition-colors hover:bg-noche-primary-dark"
              >
                <PlusIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
      {productosCategoria.length === 0 ? (
        <p className="col-span-full py-6 text-center text-xs text-noche-ink-muted">
          Sin productos en esta categoría.
        </p>
      ) : null}
    </div>
  );

  return (
    <div className={className}>
      <div className="-mt-2 flex gap-1.5 overflow-x-auto pb-1 pr-2 pt-2">
        {categorias.map((c) => {
          const activa = categoriaActiva === c.id;
          const enCarrito = productos
            .filter((p) => p.categoria_id === c.id)
            .reduce((n, p) => n + (cantidades[p.id] ?? 0), 0);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onCategoriaChange(c.id)}
              className={`relative shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold uppercase tracking-widest2 transition-colors ${
                activa
                  ? "bg-noche-primary text-noche-ink shadow-sm"
                  : "bg-noche-surface-2 text-noche-ink-muted hover:bg-noche-surface-3 hover:text-noche-ink"
              }`}
            >
              {c.nombre}
              {enCarrito > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-noche-danger px-1 text-[10px] font-bold text-white">
                  {enCarrito}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {listMaxHeightClassName ? (
        <div className={`mt-3 overflow-y-auto ${listMaxHeightClassName}`}>{grid}</div>
      ) : (
        <div className="mt-3">{grid}</div>
      )}
    </div>
  );
}
