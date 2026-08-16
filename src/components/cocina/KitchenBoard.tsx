"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatCentimos } from "@/lib/format";
import { playNewOrderChime } from "@/lib/notify-sound";
import type { EstadoPedido } from "@/lib/restaurant/types";
import type { PedidoCocina } from "@/lib/restaurant/cocina-types";

const COLUMNAS: {
  titulo: string;
  estados: EstadoPedido[];
  accent: string;
  badge: string;
  dot: string;
}[] = [
  {
    titulo: "Nuevos",
    estados: ["RECEIVED", "ACCEPTED"],
    accent: "border-t-noche-warning",
    badge: "bg-noche-warning/15 text-noche-warning",
    dot: "bg-noche-warning",
  },
  {
    titulo: "En preparación",
    estados: ["PREPARING"],
    accent: "border-t-sky-400",
    badge: "bg-sky-400/15 text-sky-300",
    dot: "bg-sky-400",
  },
  {
    titulo: "Listos",
    estados: ["READY"],
    accent: "border-t-noche-positive",
    badge: "bg-noche-positive/15 text-noche-positive",
    dot: "bg-noche-positive",
  },
];

const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, { estado: EstadoPedido; label: string }>> = {
  RECEIVED: { estado: "ACCEPTED", label: "Aceptar" },
  ACCEPTED: { estado: "PREPARING", label: "Empezar preparación" },
  PREPARING: { estado: "READY", label: "Marcar listo" },
  READY: { estado: "DELIVERED", label: "Entregado" },
};

function elapsedMinutes(createdAt: string, tick: number) {
  const diffMs = Date.now() - new Date(createdAt).getTime() + tick * 0;
  return Math.max(0, Math.floor(diffMs / 60000));
}

function urgencyClasses(minutos: number) {
  if (minutos >= 15) {
    return "bg-noche-danger/15 text-noche-danger";
  }
  if (minutos >= 8) {
    return "bg-noche-warning/15 text-noche-warning";
  }
  return "bg-noche-surface-2 text-noche-ink-muted";
}

type FiltroTipo = "todos" | "comida" | "bebida";

const FILTROS: { valor: FiltroTipo; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "comida", label: "Cocina" },
  { valor: "bebida", label: "Barra" },
];

export function KitchenBoard({ pedidosIniciales }: { pedidosIniciales: PedidoCocina[] }) {
  const [pedidos, setPedidos] = useState<PedidoCocina[]>(pedidosIniciales);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [filtro, setFiltro] = useState<FiltroTipo>("todos");

  const refetch = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.rpc("get_pedidos_cocina");
    if (!error && data) {
      setPedidos(data as unknown as PedidoCocina[]);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("cocina-pedidos")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "restaurant", table: "pedidos" },
        () => {
          playNewOrderChime();
          refetch();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "restaurant", table: "pedidos" },
        () => refetch(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "restaurant", table: "pedido_items" },
        () => refetch(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const avanzar = async (pedidoId: string, nuevoEstado: EstadoPedido) => {
    setActualizando(pedidoId);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.rpc("avanzar_pedido_cocina", {
      p_pedido_id: pedidoId,
      p_nuevo_estado: nuevoEstado,
    });
    if (!error) {
      await refetch();
    }
    setActualizando(null);
  };

  return (
    <div className="mt-6">
      <div className="flex gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => setFiltro(f.valor)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest2 transition-colors ${
              filtro === f.valor
                ? "bg-noche-primary text-white"
                : "border border-noche-border text-noche-ink-muted hover:text-noche-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
      {COLUMNAS.map((columna) => {
        const items = pedidos
          .filter((p) => columna.estados.includes(p.estado))
          .filter(
            (p) =>
              filtro === "todos" ||
              p.items.some((item) => item.producto_tipo === null || item.producto_tipo === filtro),
          )
          .sort((a, b) => a.created_at.localeCompare(b.created_at));

        return (
          <div
            key={columna.titulo}
            className={`rounded-xl border-t-4 bg-noche-surface p-3 ${columna.accent}`}
          >
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${columna.dot}`} />
              <h2 className="text-sm font-semibold uppercase tracking-widest2 text-noche-ink">
                {columna.titulo}
              </h2>
              <span
                className={`ml-auto rounded-full px-2.5 py-0.5 text-sm font-bold ${columna.badge}`}
              >
                {items.length}
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-noche-border py-6 text-center text-xs text-noche-ink-muted">
                  Sin pedidos
                </p>
              ) : null}

              {items.map((pedido) => {
                const siguiente = SIGUIENTE_ESTADO[pedido.estado];
                const esNuevo = pedido.estado === "RECEIVED";
                const minutos = elapsedMinutes(pedido.created_at, tick);

                return (
                  <div
                    key={pedido.id}
                    className={`rounded-xl border-2 bg-noche-surface-2/40 p-3.5 shadow-sm transition-shadow ${
                      esNuevo
                        ? "animate-pulse border-noche-warning ring-2 ring-noche-warning/40"
                        : "border-noche-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-xl leading-tight text-noche-ink">
                        {pedido.mesa_numero
                          ? pedido.mesa_nombre
                            ? `${pedido.mesa_nombre} (Mesa ${pedido.mesa_numero})`
                            : `Mesa ${pedido.mesa_numero}`
                          : "Sin mesa"}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold tabular-nums ${urgencyClasses(minutos)}`}
                      >
                        {minutos < 1 ? "ahora" : `${minutos} min`}
                      </span>
                    </div>
                    {pedido.participante_nombre ? (
                      <p className="text-xs text-noche-ink-muted">
                        Pedido de {pedido.participante_nombre}
                      </p>
                    ) : null}

                    <ul className="mt-3 space-y-1.5">
                      {pedido.items.map((item, index) => {
                        const fueraDeFiltro =
                          filtro !== "todos" &&
                          item.producto_tipo !== null &&
                          item.producto_tipo !== filtro;
                        return (
                          <li
                            key={index}
                            className={`flex items-start gap-2 ${fueraDeFiltro ? "opacity-35" : ""}`}
                          >
                            <span className="mt-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-noche-primary/20 px-1.5 text-sm font-bold text-noche-primary">
                              {item.cantidad}
                            </span>
                            <div>
                              <span className="text-base font-medium text-noche-ink">
                                {item.producto_nombre}
                              </span>
                              {item.notas ? (
                                <span className="block text-xs text-noche-ink-muted">
                                  {item.notas}
                                </span>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {pedido.notas ? (
                      <p className="mt-2 rounded-md bg-noche-warning/10 px-2 py-1 text-xs text-noche-warning">
                        Notas: {pedido.notas}
                      </p>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-semibold text-noche-ink">
                        {formatCentimos(pedido.total_centimos)} €
                      </span>
                      {pedido.payment_method === "LOCAL" ? (
                        <span className="rounded-full bg-noche-warning/15 px-2 py-0.5 font-medium text-noche-warning">
                          Pago en local
                        </span>
                      ) : (
                        <span
                          className={
                            pedido.payment_status === "PAID"
                              ? "rounded-full bg-noche-positive/15 px-2 py-0.5 font-medium text-noche-positive"
                              : "rounded-full bg-noche-warning/15 px-2 py-0.5 font-medium text-noche-warning"
                          }
                        >
                          {pedido.payment_status === "PAID" ? "Pagado" : "Pago pendiente"}
                        </span>
                      )}
                    </div>

                    {siguiente ? (
                      <button
                        type="button"
                        disabled={actualizando === pedido.id}
                        onClick={() => avanzar(pedido.id, siguiente.estado)}
                        className="mt-3 w-full rounded-lg bg-noche-primary py-3 text-sm font-bold uppercase tracking-widest2 text-noche-ink transition-colors hover:bg-noche-primary-dark active:scale-[0.98] disabled:opacity-50"
                      >
                        {actualizando === pedido.id ? "…" : siguiente.label}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
