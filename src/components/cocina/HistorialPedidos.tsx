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
  RECEIVED: "bg-noche-warning/15 text-noche-warning",
  ACCEPTED: "bg-noche-warning/15 text-noche-warning",
  PREPARING: "bg-noche-warning/15 text-noche-warning",
  READY: "bg-noche-primary/15 text-noche-primary",
  DELIVERED: "bg-noche-positive/15 text-noche-positive",
  CANCELLED: "bg-noche-danger/15 text-noche-danger",
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
            className={`rounded-lg px-3 py-1.5 text-xs uppercase tracking-widest2 ${
              dias === r.dias
                ? "bg-noche-primary/15 text-noche-primary"
                : "border border-noche-border bg-noche-surface text-noche-ink-muted"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-noche-danger">{error}</p> : null}

      {!pedidos ? (
        <p className="mt-4 text-sm text-noche-ink-muted">Cargando…</p>
      ) : pedidos.length === 0 ? (
        <p className="mt-4 text-sm text-noche-ink-muted">Sin pedidos en este periodo.</p>
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
              <div key={pedido.id} className="rounded-lg border border-noche-border bg-noche-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display text-lg text-noche-ink">
                    {pedido.mesa_numero
                      ? pedido.mesa_nombre
                        ? `${pedido.mesa_nombre} (Mesa ${pedido.mesa_numero})`
                        : `Mesa ${pedido.mesa_numero}`
                      : "Sin mesa"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest2 ${ESTADO_COLOR[pedido.estado]}`}
                    >
                      {ESTADO_LABEL[pedido.estado]}
                    </span>
                    <span className="text-xs text-noche-ink-muted">{fecha}</span>
                  </div>
                </div>

                <ul className="mt-2 space-y-1 text-sm text-noche-ink-muted">
                  {pedido.items.map((item, index) => (
                    <li key={index}>
                      {item.cantidad} × {item.producto_nombre}
                    </li>
                  ))}
                </ul>

                <div className="mt-2 flex justify-between border-t border-noche-border pt-2 text-sm font-medium text-noche-ink">
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
