"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatCentimos } from "@/lib/format";
import { avanzarPedidoAdmin, getMesasEstadoAdmin } from "@/lib/restaurant/admin-queries";
import type { MesaEstadoAdmin, PedidoMesaAdmin } from "@/lib/restaurant/admin-types";
import type { EstadoPedido } from "@/lib/restaurant/types";

type EstadoMesa = "LIBRE" | "POR_CONFIRMAR" | "CONFIRMADO";

const ACTIVOS: EstadoPedido[] = ["RECEIVED", "ACCEPTED", "PREPARING", "READY"];

const ESTILO_MESA: Record<EstadoMesa, { card: string; badge: string; label: string }> = {
  LIBRE: {
    card: "border-brand-black/10 bg-white",
    badge: "bg-brand-black/5 text-brand-ink/50",
    label: "Libre",
  },
  POR_CONFIRMAR: {
    card: "border-amber-400 bg-amber-50 animate-pulse",
    badge: "bg-amber-400 text-white",
    label: "Por confirmar",
  },
  CONFIRMADO: {
    card: "border-brand-pink bg-brand-pink/5",
    badge: "bg-brand-pink text-white",
    label: "En curso",
  },
};

const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, { estado: EstadoPedido; label: string }>> = {
  RECEIVED: { estado: "ACCEPTED", label: "Aceptar" },
  ACCEPTED: { estado: "PREPARING", label: "Empezar preparación" },
  PREPARING: { estado: "READY", label: "Marcar listo" },
  READY: { estado: "DELIVERED", label: "Entregado" },
};

const ESTADO_LABEL: Record<EstadoPedido, string> = {
  RECEIVED: "Recibido",
  ACCEPTED: "Aceptado",
  PREPARING: "En preparación",
  READY: "Listo",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

function estadoMesa(pedidos: PedidoMesaAdmin[]): EstadoMesa {
  const activos = pedidos.filter((p) => ACTIVOS.includes(p.estado));
  if (activos.some((p) => p.estado === "RECEIVED")) return "POR_CONFIRMAR";
  if (activos.length > 0) return "CONFIRMADO";
  return "LIBRE";
}

export function SalonBoard({ mesasIniciales }: { mesasIniciales: MesaEstadoAdmin[] }) {
  const [mesas, setMesas] = useState<MesaEstadoAdmin[]>(mesasIniciales);
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const data = await getMesasEstadoAdmin();
      setMesas(data);
    } catch {
      // el próximo evento de realtime reintentará
    }
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("salon-mesas")
      .on(
        "postgres_changes",
        { event: "*", schema: "restaurant", table: "pedidos" },
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

  const mesaSeleccionada = useMemo(
    () => mesas.find((m) => m.id === mesaSeleccionadaId) ?? null,
    [mesas, mesaSeleccionadaId],
  );

  const avanzar = async (pedidoId: string, nuevoEstado: EstadoPedido) => {
    setActualizando(pedidoId);
    try {
      await avanzarPedidoAdmin(pedidoId, nuevoEstado);
      await refetch();
    } finally {
      setActualizando(null);
    }
  };

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-widest2 text-brand-ink/60">
          {(Object.keys(ESTILO_MESA) as EstadoMesa[]).map((estado) => (
            <span key={estado} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${ESTILO_MESA[estado].badge}`} />
              {ESTILO_MESA[estado].label}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {mesas.map((mesa) => {
            const estado = estadoMesa(mesa.pedidos_hoy);
            const estilo = ESTILO_MESA[estado];
            const pendientes = mesa.pedidos_hoy.filter((p) => p.estado === "RECEIVED").length;

            return (
              <button
                key={mesa.id}
                type="button"
                onClick={() => setMesaSeleccionadaId(mesa.id)}
                className={`border p-4 text-center transition-shadow hover:shadow-md ${estilo.card} ${
                  mesaSeleccionadaId === mesa.id ? "ring-2 ring-brand-black" : ""
                }`}
              >
                <p className="font-display text-2xl">{mesa.numero}</p>
                {mesa.nombre ? (
                  <p className="text-xs text-brand-ink/60">{mesa.nombre}</p>
                ) : null}
                <span
                  className={`mt-2 inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest2 ${estilo.badge}`}
                >
                  {estilo.label}
                </span>
                {pendientes > 0 ? (
                  <p className="mt-1 text-[10px] font-medium text-amber-700">
                    {pendientes} pedido{pendientes > 1 ? "s" : ""} sin confirmar
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border border-brand-black/10 bg-white p-4">
        {!mesaSeleccionada ? (
          <p className="text-sm text-brand-ink/50">
            Selecciona una mesa para ver sus pedidos de hoy.
          </p>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">
                Mesa {mesaSeleccionada.numero}
                {mesaSeleccionada.nombre ? ` · ${mesaSeleccionada.nombre}` : ""}
              </h2>
              <button
                type="button"
                onClick={() => setMesaSeleccionadaId(null)}
                className="text-xs uppercase tracking-widest2 text-brand-ink/40 hover:text-brand-pink"
              >
                Cerrar
              </button>
            </div>

            {mesaSeleccionada.pedidos_hoy.length === 0 ? (
              <p className="mt-4 text-sm text-brand-ink/50">
                Sin pedidos hoy en esta mesa.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {mesaSeleccionada.pedidos_hoy.map((pedido) => {
                  const siguiente = SIGUIENTE_ESTADO[pedido.estado];
                  const hora = new Date(pedido.created_at).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div key={pedido.id} className="border border-brand-black/10 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="uppercase tracking-widest2 text-brand-ink/50">
                          {ESTADO_LABEL[pedido.estado]}
                        </span>
                        <span className="text-brand-ink/50">{hora}</span>
                      </div>

                      <ul className="mt-2 space-y-1 text-sm">
                        {pedido.items.map((item, index) => (
                          <li key={index} className="flex justify-between">
                            <span>
                              {item.cantidad} × {item.producto_nombre}
                              {item.notas ? (
                                <span className="block text-xs text-brand-ink/50">
                                  {item.notas}
                                </span>
                              ) : null}
                            </span>
                            <span>
                              {formatCentimos(item.precio_unitario_centimos * item.cantidad)} €
                            </span>
                          </li>
                        ))}
                      </ul>

                      {pedido.notas ? (
                        <p className="mt-2 text-xs text-brand-ink/60">Notas: {pedido.notas}</p>
                      ) : null}

                      <div className="mt-2 flex items-center justify-between border-t border-brand-black/10 pt-2 text-sm font-medium">
                        <span>Total</span>
                        <span>{formatCentimos(pedido.total_centimos)} €</span>
                      </div>

                      {siguiente ? (
                        <button
                          type="button"
                          disabled={actualizando === pedido.id}
                          onClick={() => avanzar(pedido.id, siguiente.estado)}
                          className="mt-3 w-full bg-brand-black py-2 text-xs uppercase tracking-widest2 text-brand-cream transition-colors hover:bg-brand-pink disabled:opacity-50"
                        >
                          {actualizando === pedido.id ? "…" : siguiente.label}
                        </button>
                      ) : null}
                    </div>
                  );
                })}

                <div className="flex items-center justify-between border-t border-brand-black/10 pt-3 font-display text-lg">
                  <span>Cuenta de la mesa</span>
                  <span>
                    {formatCentimos(
                      mesaSeleccionada.pedidos_hoy.reduce((sum, p) => sum + p.total_centimos, 0),
                    )}{" "}
                    €
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
