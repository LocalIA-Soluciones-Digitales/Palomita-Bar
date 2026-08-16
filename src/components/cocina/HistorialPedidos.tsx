"use client";

import { useEffect, useMemo, useState } from "react";
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

const ESTADO_DOT: Record<EstadoPedido, string> = {
  RECEIVED: "bg-noche-warning",
  ACCEPTED: "bg-noche-warning",
  PREPARING: "bg-noche-warning",
  READY: "bg-noche-primary",
  DELIVERED: "bg-noche-positive",
  CANCELLED: "bg-noche-danger",
};

const RANGOS = [
  { dias: 1, label: "Hoy" },
  { dias: 7, label: "7 días" },
  { dias: 30, label: "30 días" },
] as const;

function toLocalDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayKeyToDate(key: string): Date {
  const parts = key.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(y, m - 1, d);
}

function formatDayHeader(key: string): string {
  const date = dayKeyToDate(key);
  const today = new Date();
  const todayKey = toLocalDayKey(today.toISOString());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toLocalDayKey(yesterday.toISOString());

  if (key === todayKey) return "Hoy";
  if (key === yesterdayKey) return "Ayer";

  const label = date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function diasDesdeHoy(fecha: string): number {
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  const objetivo = new Date(fecha + "T00:00:00");
  const diffMs = hoy.getTime() - objetivo.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function HistorialPedidos() {
  const [dias, setDias] = useState<number>(7);
  const [fechaBusqueda, setFechaBusqueda] = useState<string>("");
  const [pedidos, setPedidos] = useState<PedidoCocina[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const diasConsulta = fechaBusqueda ? diasDesdeHoy(fechaBusqueda) : dias;

  useEffect(() => {
    setPedidos(null);
    setError(null);
    getPedidosHistorialAdmin(diasConsulta)
      .then(setPedidos)
      .catch(() => setError("No se ha podido cargar el historial."));
  }, [diasConsulta]);

  const pedidosFiltrados = useMemo(() => {
    if (!pedidos) return null;
    if (!fechaBusqueda) return pedidos;
    return pedidos.filter((p) => toLocalDayKey(p.created_at) === fechaBusqueda);
  }, [pedidos, fechaBusqueda]);

  const grupos = useMemo(() => {
    if (!pedidosFiltrados) return [];
    const map = new Map<string, PedidoCocina[]>();
    for (const p of pedidosFiltrados) {
      const key = toLocalDayKey(p.created_at);
      const lista = map.get(key);
      if (lista) lista.push(p);
      else map.set(key, [p]);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, items]) => ({
        key,
        items,
        total: items.reduce((sum, p) => sum + p.total_centimos, 0),
      }));
  }, [pedidosFiltrados]);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {RANGOS.map((r) => (
            <button
              key={r.dias}
              type="button"
              onClick={() => {
                setFechaBusqueda("");
                setDias(r.dias);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs uppercase tracking-widest2 transition-colors ${
                !fechaBusqueda && dias === r.dias
                  ? "bg-noche-primary/15 text-noche-primary"
                  : "border border-noche-border bg-noche-surface text-noche-ink-muted hover:text-noche-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-noche-ink-faint"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <input
              type="date"
              value={fechaBusqueda}
              onChange={(e) => setFechaBusqueda(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="rounded-lg border border-noche-border bg-noche-surface py-1.5 pl-8 pr-3 text-xs text-noche-ink accent-noche-primary"
            />
          </div>
          {fechaBusqueda ? (
            <button
              type="button"
              onClick={() => setFechaBusqueda("")}
              className="text-xs text-noche-ink-faint underline-offset-2 hover:text-noche-ink hover:underline"
            >
              Quitar filtro
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-noche-danger">{error}</p> : null}

      {!pedidosFiltrados ? (
        <p className="mt-4 text-sm text-noche-ink-muted">Cargando…</p>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-noche-border bg-noche-surface/50 p-8 text-center text-sm text-noche-ink-muted">
          {fechaBusqueda
            ? "No hay pedidos registrados ese día."
            : "Sin pedidos en este periodo."}
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {grupos.map((grupo) => (
            <div key={grupo.key}>
              <div className="sticky top-0 z-10 -mx-1 mb-2 flex items-baseline justify-between gap-3 bg-noche-bg/95 px-1 py-1.5 backdrop-blur">
                <h3 className="font-display text-base text-noche-ink">{formatDayHeader(grupo.key)}</h3>
                <div className="flex items-center gap-3 text-xs text-noche-ink-faint">
                  <span>
                    {grupo.items.length} pedido{grupo.items.length === 1 ? "" : "s"}
                  </span>
                  <span className="text-noche-ink-muted">{formatCentimos(grupo.total)} €</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {grupo.items.map((pedido) => {
                  const hora = new Date(pedido.created_at).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={pedido.id}
                      className="rounded-xl border border-noche-border bg-noche-surface p-3.5 transition-colors hover:border-noche-border/80 hover:bg-noche-surface-2"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-base text-noche-ink">
                            {pedido.mesa_numero
                              ? pedido.mesa_nombre
                                ? `${pedido.mesa_nombre} (Mesa ${pedido.mesa_numero})`
                                : `Mesa ${pedido.mesa_numero}`
                              : "Sin mesa"}
                          </span>
                          <span className="text-xs text-noche-ink-faint">{hora}</span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest2 ${ESTADO_COLOR[pedido.estado]}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${ESTADO_DOT[pedido.estado]}`} />
                          {ESTADO_LABEL[pedido.estado]}
                        </span>
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {pedido.items.map((item, index) => (
                          <span
                            key={index}
                            className="rounded-md bg-noche-surface-3 px-2 py-1 text-xs text-noche-ink-muted"
                          >
                            {item.cantidad} × {item.producto_nombre}
                          </span>
                        ))}
                      </div>

                      <div className="mt-2.5 flex justify-between border-t border-noche-border pt-2.5 text-sm font-medium text-noche-ink">
                        <span className="text-noche-ink-muted">Total</span>
                        <span>{formatCentimos(pedido.total_centimos)} €</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
