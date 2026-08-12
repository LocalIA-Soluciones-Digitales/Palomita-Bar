"use client";

import { useEffect, useMemo, useState } from "react";
import { getInformeVentasAdmin } from "@/lib/restaurant/admin-queries";
import { formatCentimos } from "@/lib/format";
import type { InformeVentas } from "@/lib/restaurant/admin-types";

type RangoId = "hoy" | "7d" | "30d" | "mes" | "mes_anterior";

const RANGOS: { id: RangoId; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "mes", label: "Este mes" },
  { id: "mes_anterior", label: "Mes anterior" },
];

function calcularRango(id: RangoId): { desde: Date; hasta: Date; etiqueta: string } {
  const ahora = new Date();
  const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

  switch (id) {
    case "hoy":
      return { desde: hoyInicio, hasta: ahora, etiqueta: "hoy" };
    case "7d":
      return {
        desde: new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000),
        hasta: ahora,
        etiqueta: "últimos 7 días",
      };
    case "30d":
      return {
        desde: new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000),
        hasta: ahora,
        etiqueta: "últimos 30 días",
      };
    case "mes": {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      return {
        desde: inicio,
        hasta: ahora,
        etiqueta: ahora.toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
      };
    }
    case "mes_anterior": {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
      const fin = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      return {
        desde: inicio,
        hasta: fin,
        etiqueta: inicio.toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
      };
    }
  }
}

export function InformeDesarrollo() {
  const [rango, setRango] = useState<RangoId>("30d");
  const [informe, setInforme] = useState<InformeVentas | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { desde, hasta, etiqueta } = useMemo(() => calcularRango(rango), [rango]);

  useEffect(() => {
    setInforme(null);
    getInformeVentasAdmin(desde, hasta)
      .then(setInforme)
      .catch(() => setError("No se ha podido cargar el informe."));
  }, [desde, hasta]);

  const maxVentasDia = informe
    ? Math.max(1, ...informe.por_dia.map((d) => d.ventas_centimos))
    : 1;
  const maxUnidadesCategoria = informe
    ? Math.max(1, ...informe.por_categoria.map((c) => c.unidades))
    : 1;

  const masPedidos = informe?.productos.filter((p) => p.unidades > 0).slice(0, 10) ?? [];
  const sinMovimiento = informe?.productos.filter((p) => p.unidades === 0) ?? [];

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex gap-1">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRango(r.id)}
              className={`px-3 py-1.5 text-xs uppercase tracking-widest2 ${
                rango === r.id
                  ? "bg-brand-black text-brand-cream"
                  : "border border-brand-black/10 bg-white text-brand-ink/60"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="border border-brand-black px-4 py-2 text-xs uppercase tracking-widest2 hover:bg-brand-black hover:text-brand-cream"
        >
          Imprimir / Guardar PDF
        </button>
      </div>

      <div className="mt-6 hidden print:block">
        <p className="text-xs uppercase tracking-widest2 text-brand-pink">Palomita Bar</p>
        <h1 className="mt-1 font-display text-2xl">Informe de ventas — {etiqueta}</h1>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {!informe ? (
        <p className="mt-6 text-sm text-brand-ink/50">Cargando…</p>
      ) : (
        <div className="mt-6 space-y-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Pedidos" value={String(informe.resumen.pedidos)} />
            <Stat label="Ventas" value={`${formatCentimos(informe.resumen.ventas_centimos)} €`} />
            <Stat
              label="Ticket medio"
              value={`${formatCentimos(informe.resumen.ticket_medio_centimos)} €`}
            />
            <Stat label="Platos servidos" value={String(informe.resumen.unidades_vendidas)} />
          </div>

          <div>
            <h2 className="font-display text-lg">Ventas por día</h2>
            {informe.por_dia.length === 0 ? (
              <p className="mt-2 text-sm text-brand-ink/50">Sin pedidos en este periodo.</p>
            ) : (
              <div className="mt-3 flex h-32 items-end gap-1 border-b border-brand-black/10 pb-1">
                {informe.por_dia.map((dia) => (
                  <div
                    key={dia.fecha}
                    className="group relative flex-1 bg-brand-pink/70 transition-colors hover:bg-brand-pink"
                    style={{
                      height: `${Math.max(4, (dia.ventas_centimos / maxVentasDia) * 100)}%`,
                    }}
                    title={`${new Date(dia.fecha).toLocaleDateString("es-ES")}: ${formatCentimos(dia.ventas_centimos)} € (${dia.pedidos} pedidos)`}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-display text-lg">Por categoría</h2>
            <div className="mt-3 space-y-2">
              {informe.por_categoria
                .filter((c) => c.unidades > 0)
                .map((cat) => (
                  <div key={cat.categoria} className="flex items-center gap-3 text-sm">
                    <span className="w-40 shrink-0 truncate">{cat.categoria}</span>
                    <div className="h-3 flex-1 bg-brand-sand">
                      <div
                        className="h-3 bg-brand-pink"
                        style={{ width: `${(cat.unidades / maxUnidadesCategoria) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-brand-ink/60">
                      {cat.unidades} uds · {formatCentimos(cat.ventas_centimos)} €
                    </span>
                  </div>
                ))}
              {informe.por_categoria.every((c) => c.unidades === 0) ? (
                <p className="text-sm text-brand-ink/50">Sin pedidos en este periodo.</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-lg">Platos más pedidos</h2>
              {masPedidos.length === 0 ? (
                <p className="mt-2 text-sm text-brand-ink/50">Sin pedidos en este periodo.</p>
              ) : (
                <ol className="mt-3 space-y-1 text-sm">
                  {masPedidos.map((p, i) => (
                    <li key={p.producto_id} className="flex justify-between gap-3">
                      <span className="truncate">
                        {i + 1}. {p.nombre}
                      </span>
                      <span className="shrink-0 text-brand-ink/60">{p.unidades} uds</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div>
              <h2 className="font-display text-lg">Sin movimiento</h2>
              <p className="mt-1 text-xs text-brand-ink/50">
                No se han pedido en este periodo — candidatos a destacar, cambiar de receta o
                quitar de la carta.
              </p>
              {sinMovimiento.length === 0 ? (
                <p className="mt-2 text-sm text-brand-ink/50">
                  Todos los platos han tenido movimiento.
                </p>
              ) : (
                <ul className="mt-3 space-y-1 text-sm text-brand-ink/70">
                  {sinMovimiento.map((p) => (
                    <li key={p.producto_id}>
                      {p.nombre} <span className="text-brand-ink/40">· {p.categoria}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-brand-black/10 bg-white p-4">
      <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}
