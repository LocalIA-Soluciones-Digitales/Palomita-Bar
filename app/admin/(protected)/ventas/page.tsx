"use client";

import { useEffect, useState } from "react";
import { getVentasHoyAdmin } from "@/lib/restaurant/admin-queries";
import type { VentasHoy } from "@/lib/restaurant/admin-types";
import { formatCentimos } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-brand-black/10 bg-white p-4">
      <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

export default function VentasAdminPage() {
  const [ventas, setVentas] = useState<VentasHoy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVentasHoyAdmin()
      .then(setVentas)
      .catch(() => setError("No se han podido cargar las ventas de hoy."));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!ventas) return <p className="text-sm text-brand-ink/50">Cargando…</p>;

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl">Ventas de hoy</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pedidos hoy" value={String(ventas.pedidos_hoy)} />
        <Stat label="Ventas" value={`${formatCentimos(ventas.ventas_centimos)} €`} />
        <Stat label="Ticket medio" value={`${formatCentimos(ventas.ticket_medio_centimos)} €`} />
        <Stat
          label="En curso"
          value={String(ventas.pendientes + ventas.en_preparacion + ventas.listos)}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="border border-brand-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">Pago</p>
          <div className="mt-3 flex justify-between text-sm">
            <span>En local</span>
            <span>{ventas.pagos_local}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span>Online</span>
            <span>{ventas.pagos_online}</span>
          </div>
        </div>

        <div className="border border-brand-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">Más vendidos hoy</p>
          <div className="mt-3 space-y-1">
            {ventas.top_productos.length === 0 ? (
              <p className="text-sm text-brand-ink/40">Todavía no hay pedidos hoy.</p>
            ) : (
              ventas.top_productos.map((p) => (
                <div key={p.nombre} className="flex justify-between text-sm">
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
