"use client";

import { useEffect, useState } from "react";
import { getPedidoPublico } from "@/lib/restaurant/queries";
import { formatCentimos } from "@/lib/format";
import { CheckIcon } from "@/components/icons";
import { StatusBadge } from "@/components/mesa/StatusBadge";
import { guardarPedidoActivo, olvidarPedido } from "@/lib/pedido/active-orders";
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
    if (ESTADOS_FINALES.includes(pedido.estado)) {
      olvidarPedido(pedido.id);
    } else {
      guardarPedidoActivo(pedido.id);
    }
  }, [pedido.estado, pedido.id]);

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
      <p className="text-xs uppercase tracking-widest2 text-noche-primary">
        {pedido.mesa_numero
          ? pedido.mesa_nombre
            ? `${pedido.mesa_nombre} (Mesa ${pedido.mesa_numero})`
            : `Mesa ${pedido.mesa_numero}`
          : "Pedido"}
      </p>
      <h1 className="mt-4 font-display text-4xl text-noche-ink">
        Pedido #{pedido.id.slice(0, 8)}
      </h1>

      <div className="mt-4">
        <StatusBadge
          label={pedido.payment_method === "LOCAL" ? "Pago en local" : "Pago online"}
          variant="neutral"
        />
      </div>

      {cancelado ? (
        <p className="mt-8 text-noche-ink-muted">Este pedido ha sido cancelado.</p>
      ) : (
        <ol className="mt-10 space-y-4">
          {PASOS.map((paso, index) => {
            const alcanzado = index <= pasoActualIndex;
            const conectorLleno = index < pasoActualIndex;
            const esUltimo = index === PASOS.length - 1;
            return (
              <li key={paso.estado} className="relative flex items-center gap-3">
                {!esUltimo ? (
                  <span
                    aria-hidden="true"
                    className={`absolute left-[13px] top-7 h-4 w-0.5 transition-colors duration-700 ${
                      conectorLleno ? "bg-noche-primary" : "bg-noche-surface-2"
                    }`}
                  />
                ) : null}
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${
                    alcanzado ? "bg-noche-primary text-white" : "bg-noche-surface-2 text-noche-ink-faint"
                  } ${index === pasoActualIndex ? "ring-4 ring-noche-primary/25" : ""}`}
                >
                  {alcanzado ? <CheckIcon className="h-4 w-4" /> : null}
                </span>
                <span
                  className={`transition-colors duration-500 ${
                    alcanzado ? "text-noche-ink" : "text-noche-ink-faint"
                  }`}
                >
                  {paso.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {pedido.estado === "READY" ? (
        <p className="mt-8 font-display text-xl text-noche-primary">
          ¡Tu pedido está listo! Nuestro equipo lo llevará a tu mesa.
        </p>
      ) : null}

      <div className="mt-12 rounded-lg border border-noche-border bg-noche-surface/40 p-4">
        <ul className="space-y-2">
          {pedido.items.map((item, index) => (
            <li key={index} className="flex justify-between text-sm text-noche-ink/90">
              <span>
                {item.cantidad} × {item.producto_nombre}
              </span>
              <span>{formatCentimos(item.precio_unitario_centimos * item.cantidad)} €</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-noche-border pt-4 font-medium text-noche-ink">
          <span>Total</span>
          <span>{formatCentimos(pedido.total_centimos)} €</span>
        </div>
      </div>
    </div>
  );
}
