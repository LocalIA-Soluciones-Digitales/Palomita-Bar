"use client";

import { useEffect, useState } from "react";
import { getVentasHoyAdmin } from "@/lib/restaurant/admin-queries";
import type { VentasHoy } from "@/lib/restaurant/admin-types";
import { formatCentimos } from "@/lib/format";
import { Stat } from "@/components/admin/Stat";

export default function VentasAdminPage() {
  const [ventas, setVentas] = useState<VentasHoy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVentasHoyAdmin()
      .then(setVentas)
      .catch(() => setError("No se han podido cargar las ventas de hoy."));
  }, []);

  if (error) return <p className="text-sm text-noche-danger">{error}</p>;
  if (!ventas) return <p className="text-sm text-noche-ink-muted">Cargando…</p>;

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="font-display text-2xl text-noche-ink">Ventas de hoy</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pedidos hoy" value={String(ventas.pedidos_hoy)} />
        <Stat label="Ventas" value={`${formatCentimos(ventas.ventas_centimos)} €`} />
        <Stat label="Ticket medio" value={`${formatCentimos(ventas.ticket_medio_centimos)} €`} />
        <Stat
          label="En curso"
          value={String(ventas.pendientes + ventas.en_preparacion + ventas.listos)}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-noche-border bg-noche-surface p-4">
          <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Pago</p>
          <div className="mt-3 flex justify-between text-sm text-noche-ink">
            <span>En local</span>
            <span>{ventas.pagos_local}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-noche-ink">
            <span>Online</span>
            <span>{ventas.pagos_online}</span>
          </div>
        </div>

        <div className="rounded-lg border border-noche-border bg-noche-surface p-4">
          <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Modo de pedido</p>
          <div className="mt-3 flex justify-between text-sm text-noche-ink">
            <span>Juntos</span>
            <span>{ventas.pedidos_juntos}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-noche-ink">
            <span>Cada uno por separado</span>
            <span>{ventas.pedidos_separado}</span>
          </div>
        </div>

        <div className="rounded-lg border border-noche-border bg-noche-surface p-4">
          <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Más vendidos hoy</p>
          <div className="mt-3 space-y-1">
            {ventas.top_productos.length === 0 ? (
              <p className="text-sm text-noche-ink-faint">Todavía no hay pedidos hoy.</p>
            ) : (
              ventas.top_productos.map((p) => (
                <div key={p.nombre} className="flex justify-between text-sm text-noche-ink">
                  <span>{p.nombre}</span>
                  <span>{p.cantidad}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
