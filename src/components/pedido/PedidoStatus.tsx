"use client";

import { useEffect, useState } from "react";
import { getPedidoPublico } from "@/lib/restaurant/queries";
import { formatCentimos } from "@/lib/format";
import type { EstadoPedido, PedidoPublico } from "@/lib/restaurant/types";

const PASOS: { estado: EstadoPedido; label: string }[] = [
  { estado: "RECEIVED", label: "Pedido recibido" },
  { estado: "ACCEPTED", label: "Pedido aceptado" },
  { estado: "PREPARING", label: "En preparación" },
  { estado: "READY", label: "Listo" },
  { estado: "DELIVERED", label: "Entregado" },
];

const ESTADOS_FINALES: EstadoPedido[] = ["DELIVERED", "CANCELLED"];
const INTERVALO_MS = 5000;

export function PedidoStatus({ pedidoInicial }: { pedidoInicial: PedidoPublico }) {
  const [pedido, setPedido] = useState(pedidoInicial);

  useEffect(() => {
    if (ESTADOS_FINALES.includes(pedido.estado)) return;

    const interval = setInterval(async () => {
      const actualizado = await getPedidoPublico(pedido.id);
      if (actualizado) setPedido(actualizado);
    }, INTERVALO_MS);

    return () => clearInterval(interval);
  }, [pedido.estado, pedido.id]);

  const pasoActualIndex = PASOS.findIndex((p) => p.estado === pedido.estado);
  const cancelado = pedido.estado === "CANCELLED";

  return (
    <div className="mx-auto max-w-lg px-6 py-24">
      <p className="text-xs uppercase tracking-widest2 text-brand-pink">
        {pedido.mesa_numero
          ? pedido.mesa_nombre
            ? `${pedido.mesa_nombre} (Mesa ${pedido.mesa_numero})`
            : `Mesa ${pedido.mesa_numero}`
          : "Pedido"}
      </p>
      <h1 className="mt-4 font-display text-4xl">Pedido #{pedido.id.slice(0, 8)}</h1>

      {pedido.payment_method === "LOCAL" ? (
        <p className="mt-4 inline-block bg-brand-sand px-3 py-1 text-xs uppercase tracking-widest2">
          Pago en local
        </p>
      ) : null}

      {cancelado ? (
        <p className="mt-8 text-brand-ink/70">Este pedido ha sido cancelado.</p>
      ) : (
        <ol className="mt-10 space-y-4">
          {PASOS.map((paso, index) => {
            const alcanzado = index <= pasoActualIndex;
            return (
              <li key={paso.estado} className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 rounded-full ${alcanzado ? "bg-brand-pink" : "bg-brand-black/20"}`}
                />
                <span className={alcanzado ? "text-brand-ink" : "text-brand-ink/40"}>
                  {paso.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {pedido.estado === "READY" ? (
        <p className="mt-8 font-display text-xl text-brand-pink">
          ¡Tu pedido está listo! Nuestro equipo lo llevará a tu mesa.
        </p>
      ) : null}

      <div className="mt-12 border-t border-brand-black/10 pt-6">
        <ul className="space-y-2">
          {pedido.items.map((item, index) => (
            <li key={index} className="flex justify-between text-sm">
              <span>
                {item.cantidad} × {item.producto_nombre}
              </span>
              <span>{formatCentimos(item.precio_unitario_centimos * item.cantidad)} €</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-brand-black/10 pt-4 font-medium">
          <span>Total</span>
          <span>{formatCentimos(pedido.total_centimos)} €</span>
        </div>
      </div>
    </div>
  );
}
