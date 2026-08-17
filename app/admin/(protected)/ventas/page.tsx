"use client";

import { useEffect, useState } from "react";
import { getInformeVentasAdmin, getVentasHoyAdmin } from "@/lib/restaurant/admin-queries";
import type { InformeVentas, VentasHoy } from "@/lib/restaurant/admin-types";
import { errorMessage, formatCentimos } from "@/lib/format";
import { Stat } from "@/components/admin/Stat";
import { DonutCategorias, GraficoVentasDia } from "@/components/admin/VentasCharts";

export default function VentasAdminPage() {
  const [ventas, setVentas] = useState<VentasHoy | null>(null);
  const [informe, setInforme] = useState<InformeVentas | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hasta = new Date();
    const desde = new Date(hasta.getTime() - 7 * 24 * 60 * 60 * 1000);
    Promise.all([getVentasHoyAdmin(), getInformeVentasAdmin(desde, hasta)])
      .then(([v, inf]) => {
        setVentas(v);
        setInforme(inf);
      })
      .catch((err) => setError(`No se han podido cargar las ventas: ${errorMessage(err)}`));
  }, []);

  if (error) return <p className="text-sm text-noche-danger">{error}</p>;
  if (!ventas || !informe) return <p className="text-sm text-noche-ink-muted">Cargando…</p>;

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="font-display text-2xl text-noche-ink">Ventas</h1>
      <p className="mt-1 text-sm text-noche-ink-muted">Hoy y tendencia de los últimos 7 días.</p>

      <section className="mt-6">
        <h2 className="text-xs uppercase tracking-widest2 text-noche-ink-faint">Hoy</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Pedidos hoy" value={String(ventas.pedidos_hoy)} />
          <Stat label="Ventas" value={`${formatCentimos(ventas.ventas_centimos)} €`} />
          <Stat label="Ticket medio" value={`${formatCentimos(ventas.ticket_medio_centimos)} €`} />
          <Stat
            label="En curso"
            value={String(ventas.pendientes + ventas.en_preparacion + ventas.listos)}
          />
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-noche-border bg-noche-surface p-4 lg:col-span-2">
          <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
            Ventas últimos 7 días
          </p>
          <GraficoVentasDia dias={informe.por_dia} />
        </div>

        <div className="rounded-lg border border-noche-border bg-noche-surface p-4">
          <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
            Ventas por categoría (7 días)
          </p>
          <DonutCategorias categorias={informe.por_categoria} />
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-noche-border bg-noche-surface p-4">
          <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Pago (hoy)</p>
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
          <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
            Modo de pedido (hoy)
          </p>
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
      </section>
    </div>
  );
}
