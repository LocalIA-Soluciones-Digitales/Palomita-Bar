"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { useTableSession } from "@/components/mesa/table-session-context";
import { CuentaMesaDrawer } from "@/components/mesa/CuentaMesaDrawer";
import { SessionNotifications } from "@/components/mesa/SessionNotifications";
import { CategoryMenu } from "@/components/menu/CategoryMenu";
import { CartBar } from "@/components/pedir/CartBar";
import { BellIcon } from "@/components/icons";
import { llamarCamarero } from "@/lib/restaurant/queries";
import type { Categoria, Producto } from "@/lib/restaurant/types";

const AVISO_COOLDOWN_MS = 60000;

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
  const [avisoEstado, setAvisoEstado] = useState<"idle" | "enviando" | "enviado">("idle");
  const separado = sesion?.modo === "SEPARADO" && Boolean(participante);

  const handleLlamarCamarero = async () => {
    if (!mesaIdentificador || avisoEstado !== "idle") return;
    setAvisoEstado("enviando");
    try {
      await llamarCamarero(mesaIdentificador);
      setAvisoEstado("enviado");
      setTimeout(() => setAvisoEstado("idle"), AVISO_COOLDOWN_MS);
    } catch {
      setAvisoEstado("idle");
    }
  };

  return (
    <>
      <div className="mx-auto max-w-3xl px-6 pb-32 pt-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest2 text-noche-primary">{mesaLabel}</p>
            <h1 className="mt-4 font-display text-4xl text-noche-ink">¿Qué te apetece?</h1>
          </div>
          <div className="mt-1 flex shrink-0 flex-col items-end gap-2">
            {mesaIdentificador ? (
              <button
                type="button"
                onClick={handleLlamarCamarero}
                disabled={avisoEstado !== "idle"}
                className="flex items-center gap-1.5 rounded-lg border border-noche-border px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink-muted transition-colors hover:border-noche-primary hover:text-noche-primary disabled:opacity-60"
              >
                <BellIcon className="h-3.5 w-3.5" />
                {avisoEstado === "enviado"
                  ? "Camarero avisado"
                  : avisoEstado === "enviando"
                    ? "Avisando…"
                    : "Llamar camarero"}
              </button>
            ) : null}
            {separado ? (
              <button
                type="button"
                onClick={() => setCuentaAbierta(true)}
                className="rounded-lg border border-noche-border px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink-muted transition-colors hover:border-noche-primary hover:text-noche-primary"
              >
                Ver cuenta
              </button>
            ) : null}
          </div>
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
