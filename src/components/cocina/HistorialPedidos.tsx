"use client";

import { useEffect, useState } from "react";
import { getPedidosHistorialAdmin } from "@/lib/restaurant/admin-queries";
import { formatCentimos } from "@/lib/format";
import type { PedidoCocina } from "@/lib/restaurant/cocina-types";
import type { EstadoPedido } from "@/lib/restaurant/types";

const ESTADO_LABEL: Record<EstadoPedido, string> = {
  RECEIVED: "Recibido",
  ACCEPTED: "Aceptado",
  PREPARING: "En preparación",
  READY: "Listo",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const ESTADO_COLOR: Record<EstadoPedido, string> = {
  RECEIVED: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-amber-100 text-amber-800",
  PREPARING: "bg-amber-100 text-amber-800",
  READY: "bg-brand-pink/10 text-brand-pink",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const RANGOS = [
  { dias: 1, label: "Hoy" },
  { dias: 7, label: "7 días" },
  { dias: 30, label: "30 días" },
] as const;

export function HistorialPedidos() {
  const [dias, setDias] = useState<number>(7);
  const [pedidos, setPedidos] = useState<PedidoCocina[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPedidos(null);
    getPedidosHistorialAdmin(dias)
      .then(setPedidos)
      .catch(() => setError("No se ha podido cargar el historial."));
  }, [dias]);

  return (
    <div className="mt-6">
      <div className="flex gap-1">
        {RANGOS.map((r) => (
          <button
            key={r.dias}
            type="button"
            onClick={() => setDias(r.dias)}
            className={`px-3 py-1.5 text-xs uppercase tracking-widest2 ${
              dias === r.dias
                ? "bg-brand-black text-brand-cream"
                : "border border-brand-black/10 bg-white text-brand-ink/60"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {!pedidos ? (
        <p className="mt-4 text-sm text-brand-ink/50">Cargando…</p>
      ) : pedidos.length === 0 ? (
        <p className="mt-4 text-sm text-brand-ink/50">Sin pedidos en este periodo.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {pedidos.map((pedido) => {
            const fecha = new Date(pedido.created_at).toLocaleString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={pedido.id} className="border border-brand-black/10 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display text-lg">
                    {pedido.mesa_numero
                      ? pedido.mesa_nombre
                        ? `${pedido.mesa_nombre} (Mesa ${pedido.mesa_numero})`
                        : `Mesa ${pedido.mesa_numero}`
                      : "Sin mesa"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] uppercase tracking-widest2 ${ESTADO_COLOR[pedido.estado]}`}
                    >
                      {ESTADO_LABEL[pedido.estado]}
                    </span>
                    <span className="text-xs text-brand-ink/50">{fecha}</span>
                  </div>
                </div>

                <ul className="mt-2 space-y-1 text-sm text-brand-ink/80">
                  {pedido.items.map((item, index) => (
                    <li key={index}>
                      {item.cantidad} × {item.producto_nombre}
                    </li>
                  ))}
                </ul>

                <div className="mt-2 flex justify-between border-t border-brand-black/10 pt-2 text-sm font-medium">
                  <span>Total</span>
                  <span>{formatCentimos(pedido.total_centimos)} €</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
