"use client";

import { useEffect, useRef, useState } from "react";
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
  repetirItems,
}: {
  categorias: Categoria[];
  productos: Producto[];
  mesaLabel: string;
  mesaIdentificador?: string;
  /** Productos (por nombre + cantidad) de un pedido anterior a repetir
   * (?repetir=id); se emparejan por nombre contra la carta viva porque el
   * pedido público no expone el id de producto. Lo que no se encuentre o ya
   * no esté disponible se avisa. */
  repetirItems?: { nombre: string; cantidad: number }[] | null;
}) {
  const { lines, addItem, increment, decrement, hydrated } = useCart();
  const { sesion, participante } = useTableSession();
  const [cuentaAbierta, setCuentaAbierta] = useState(false);
  const [avisoEstado, setAvisoEstado] = useState<"idle" | "enviando" | "enviado">("idle");
  const [avisoRepetir, setAvisoRepetir] = useState<string | null>(null);
  const repetidoRef = useRef(false);
  const separado = sesion?.modo === "SEPARADO" && Boolean(participante);

  // Espera a que el carrito termine de hidratarse desde localStorage antes de
  // añadir los productos a repetir, para no arriesgarse a que un carrito
  // guardado (leído después) pise lo que se acaba de añadir aquí.
  useEffect(() => {
    if (!hydrated || !repetirItems || repetirItems.length === 0 || repetidoRef.current) return;
    repetidoRef.current = true;

    const noEncontrados: string[] = [];
    for (const item of repetirItems) {
      const producto = productos.find((p) => p.nombre === item.nombre && p.disponible);
      if (producto) {
        for (let i = 0; i < item.cantidad; i += 1) addItem(producto);
      } else {
        noEncontrados.push(item.nombre);
      }
    }

    if (noEncontrados.length > 0) {
      setAvisoRepetir(
        `Hemos añadido lo que seguía disponible. No hemos podido añadir: ${noEncontrados.join(", ")}.`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, repetirItems, productos]);

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
            {avisoRepetir ? (
              <p
                role="status"
                className="mt-3 max-w-sm rounded-lg border border-noche-primary/40 bg-noche-primary/10 px-3 py-2 text-xs text-noche-ink"
              >
                {avisoRepetir}{" "}
                <button
                  type="button"
                  onClick={() => setAvisoRepetir(null)}
                  className="ml-1 underline underline-offset-2"
                >
                  Entendido
                </button>
              </p>
            ) : null}
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
