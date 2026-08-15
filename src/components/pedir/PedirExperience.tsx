"use client";

import { useCart } from "@/components/cart/cart-context";
import { CategoryMenu } from "@/components/menu/CategoryMenu";
import { CartBar } from "@/components/pedir/CartBar";
import type { Categoria, Producto } from "@/lib/restaurant/types";

export function PedirExperience({
  categorias,
  productos,
  mesaLabel,
  mesaIdentificador,
}: {
  categorias: Categoria[];
  productos: Producto[];
  mesaLabel: string;
  mesaIdentificador?: string;
}) {
  const { lines, addItem, increment, decrement } = useCart();

  return (
    <>
      <div className="mx-auto max-w-3xl px-6 pb-32 pt-16">
        <p className="text-xs uppercase tracking-widest2 text-noche-primary">{mesaLabel}</p>
        <h1 className="mt-4 font-display text-4xl text-noche-ink">¿Qué te apetece?</h1>

        <div className="mt-12">
          <CategoryMenu
            categorias={categorias}
            productos={productos}
            cart={{
              getQuantity: (id) => lines.find((l) => l.producto.id === id)?.cantidad ?? 0,
              onAdd: addItem,
              onIncrement: increment,
              onDecrement: decrement,
            }}
          />
        </div>
      </div>

      <CartBar mesaIdentificador={mesaIdentificador} />
    </>
  );
}
