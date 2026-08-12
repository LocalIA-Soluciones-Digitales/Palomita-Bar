"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatCentimos } from "@/lib/format";
import {
  actualizarMesaOcupadaAdmin,
  actualizarMesaPosicionAdmin,
  avanzarPedidoAdmin,
  getMesasEstadoAdmin,
} from "@/lib/restaurant/admin-queries";
import { PedidoRapidoForm } from "@/components/admin/PedidoRapidoForm";
import type { MesaEstadoAdmin, PedidoMesaAdmin } from "@/lib/restaurant/admin-types";
import type { EstadoPedido } from "@/lib/restaurant/types";

type EstadoMesa = "LIBRE" | "OCUPADA" | "POR_CONFIRMAR" | "EN_PREPARACION" | "LISTO";

const ACTIVOS: EstadoPedido[] = ["RECEIVED", "ACCEPTED", "PREPARING", "READY"];

const ESTILO_MESA: Record<EstadoMesa, { shape: string; badge: string; label: string }> = {
  LIBRE: {
    shape: "border-brand-black/15 bg-white text-brand-ink/70",
    badge: "bg-brand-black/10 text-brand-ink/50",
    label: "Libre",
  },
  OCUPADA: {
    shape: "border-brand-black bg-brand-black text-brand-cream",
    badge: "bg-brand-black text-brand-cream",
    label: "Ocupada",
  },
  POR_CONFIRMAR: {
    shape: "border-amber-500 bg-amber-400 text-white animate-pulse",
    badge: "bg-amber-400 text-white",
    label: "Han pedido",
  },
  EN_PREPARACION: {
    shape: "border-sky-600 bg-sky-500 text-white",
    badge: "bg-sky-500 text-white",
    label: "En preparación",
  },
  LISTO: {
    shape: "border-emerald-600 bg-emerald-500 text-white",
    badge: "bg-emerald-500 text-white",
    label: "Listo para servir",
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

function estadoMesa(mesa: MesaEstadoAdmin): EstadoMesa {
  const activos = mesa.pedidos_hoy.filter((p) => ACTIVOS.includes(p.estado));
  if (activos.some((p) => p.estado === "RECEIVED")) return "POR_CONFIRMAR";
  if (activos.some((p) => p.estado === "ACCEPTED" || p.estado === "PREPARING")) {
    return "EN_PREPARACION";
  }
  if (activos.some((p) => p.estado === "READY")) return "LISTO";
  if (mesa.ocupada) return "OCUPADA";
  return "LIBRE";
}

const COLS = 5;
const MARGEN = 10;

function posicionAuto(index: number): { x: number; y: number } {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const x = COLS > 1 ? MARGEN + (col / (COLS - 1)) * (100 - 2 * MARGEN) : 50;
  const y = 18 + row * 26;
  return { x, y };
}

export function SalonBoard({ mesasIniciales }: { mesasIniciales: MesaEstadoAdmin[] }) {
  const [mesas, setMesas] = useState<MesaEstadoAdmin[]>(mesasIniciales);
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{
    id: string;
    pointerId: number;
    moved: boolean;
  } | null>(null);
  const [posicionesArrastre, setPosicionesArrastre] = useState<Record<string, { x: number; y: number }>>(
    {},
  );

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

  const toggleOcupada = async (mesa: MesaEstadoAdmin) => {
    try {
      await actualizarMesaOcupadaAdmin(mesa.id, !mesa.ocupada);
      await refetch();
    } catch {
      // silencioso: el usuario puede reintentar
    }
  };

  const posicionMesa = (mesa: MesaEstadoAdmin, index: number): { x: number; y: number } => {
    if (posicionesArrastre[mesa.id]) return posicionesArrastre[mesa.id];
    if (mesa.pos_x !== null && mesa.pos_y !== null) return { x: mesa.pos_x, y: mesa.pos_y };
    return posicionAuto(index);
  };

  const handlePointerDown = (mesa: MesaEstadoAdmin, e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { id: mesa.id, pointerId: e.pointerId, moved: false };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = arrastre.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.min(97, Math.max(3, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(94, Math.max(6, ((e.clientY - rect.top) / rect.height) * 100));

    drag.moved = true;
    setPosicionesArrastre((prev) => ({ ...prev, [drag.id]: { x, y } }));
  };

  const handlePointerUp = async () => {
    const drag = arrastre.current;
    arrastre.current = null;
    if (!drag) return;

    if (!drag.moved) {
      setMesaSeleccionadaId(drag.id);
      return;
    }

    const pos = posicionesArrastre[drag.id];
    if (pos) {
      try {
        await actualizarMesaPosicionAdmin(drag.id, pos.x, pos.y);
        await refetch();
      } catch {
        // deja la posición optimista en pantalla aunque falle el guardado
      }
    }
  };

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-widest2 text-brand-ink/60">
          {(Object.keys(ESTILO_MESA) as EstadoMesa[]).map((estado) => (
            <span key={estado} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full border ${ESTILO_MESA[estado].badge}`} />
              {ESTILO_MESA[estado].label}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-brand-ink/40">
          Arrastra las mesas para colocarlas como en el local. Pulsa una mesa para ver o tomar
          pedidos.
        </p>

        <div
          ref={canvasRef}
          className="relative mt-4 h-[560px] select-none overflow-hidden border border-brand-black/10 bg-white bg-[linear-gradient(to_right,rgba(20,17,16,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,17,16,0.05)_1px,transparent_1px)] bg-[size:24px_24px]"
        >
          {mesas.map((mesa, index) => {
            const estado = estadoMesa(mesa);
            const estilo = ESTILO_MESA[estado];
            const pos = posicionMesa(mesa, index);
            const pendientes = mesa.pedidos_hoy.filter((p) => p.estado === "RECEIVED").length;

            return (
              <button
                key={mesa.id}
                type="button"
                onPointerDown={(e) => handlePointerDown(mesa, e)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className={`absolute flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center justify-center rounded-full border-2 shadow-sm transition-transform active:cursor-grabbing ${estilo.shape} ${
                  mesaSeleccionadaId === mesa.id ? "ring-4 ring-brand-black/30" : ""
                }`}
              >
                <span className="font-display text-xl leading-none">{mesa.numero}</span>
                {mesa.nombre ? (
                  <span className="mt-0.5 max-w-[4.5rem] truncate text-[9px] uppercase tracking-widest2 opacity-80">
                    {mesa.nombre}
                  </span>
                ) : null}
                {pendientes > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-pink text-[10px] font-medium text-white">
                    {pendientes}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border border-brand-black/10 bg-white p-4">
        {!mesaSeleccionada ? (
          <p className="text-sm text-brand-ink/50">
            Selecciona una mesa para ver sus pedidos de hoy o tomar un pedido nuevo.
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

            <button
              type="button"
              onClick={() => toggleOcupada(mesaSeleccionada)}
              className="mt-3 text-xs uppercase tracking-widest2 text-brand-ink/60 underline decoration-brand-pink underline-offset-4 hover:text-brand-ink"
            >
              {mesaSeleccionada.ocupada ? "Liberar mesa" : "Sentar mesa (sin pedido aún)"}
            </button>

            {mesaSeleccionada.pedidos_hoy.length === 0 ? (
              <p className="mt-4 text-sm text-brand-ink/50">Sin pedidos hoy en esta mesa.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {mesaSeleccionada.pedidos_hoy.map((pedido: PedidoMesaAdmin) => {
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

            <PedidoRapidoForm
              mesaIdentificador={mesaSeleccionada.identificador}
              onPedidoCreado={refetch}
            />
          </div>
        )}
      </div>
    </div>
  );
}
