"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { useTableSession } from "@/components/mesa/table-session-context";
import { CuentaMesaDrawer } from "@/components/mesa/CuentaMesaDrawer";
import { SessionNotifications } from "@/components/mesa/SessionNotifications";
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
  const { sesion, participante } = useTableSession();
  const [cuentaAbierta, setCuentaAbierta] = useState(false);
  const separado = sesion?.modo === "SEPARADO" && Boolean(participante);

  return (
    <>
      <div className="mx-auto max-w-3xl px-6 pb-32 pt-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest2 text-noche-primary">{mesaLabel}</p>
            <h1 className="mt-4 font-display text-4xl text-noche-ink">¿Qué te apetece?</h1>
          </div>
          {separado ? (
            <button
              type="button"
              onClick={() => setCuentaAbierta(true)}
              className="mt-1 shrink-0 border border-noche-border px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink-muted transition-colors hover:border-noche-primary hover:text-noche-primary"
            >
              Ver cuenta
            </button>
          ) : null}
        </div>

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
      {separado ? <SessionNotifications /> : null}
      {cuentaAbierta ? <CuentaMesaDrawer onClose={() => setCuentaAbierta(false)} /> : null}
    </>
  );
}
