"use client";

import { useCart } from "@/components/cart/cart-context";
import { formatCentimos } from "@/lib/format";
import type { Producto } from "@/lib/restaurant/types";

export function ProductRow({ producto }: { producto: Producto }) {
  const { lines, addItem, increment, decrement } = useCart();
  const line = lines.find((l) => l.producto.id === producto.id);

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="font-display text-lg">{producto.nombre}</p>
        {producto.descripcion ? (
          <p className="mt-1 text-sm text-brand-ink/60">{producto.descripcion}</p>
        ) : null}
        <p className="mt-1 text-sm text-brand-ink/80">
          {formatCentimos(producto.precio_centimos)} €
        </p>
      </div>

      {line ? (
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => decrement(producto.id)}
            aria-label="Quitar una unidad"
            className="flex h-10 w-10 items-center justify-center border border-brand-black/20 text-lg"
          >
            −
          </button>
          <span className="w-4 text-center text-sm">{line.cantidad}</span>
          <button
            type="button"
            onClick={() => increment(producto.id)}
            aria-label="Añadir una unidad"
            className="flex h-10 w-10 items-center justify-center border border-brand-black/20 text-lg"
          >
            +
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => addItem(producto)}
          className="shrink-0 border border-brand-black px-4 py-2.5 text-xs uppercase tracking-widest2 transition-colors hover:bg-brand-black hover:text-brand-cream"
        >
          Añadir
        </button>
      )}
    </div>
  );
}
