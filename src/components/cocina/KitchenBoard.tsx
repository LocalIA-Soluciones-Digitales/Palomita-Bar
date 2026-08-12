"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatCentimos } from "@/lib/format";
import type { EstadoPedido } from "@/lib/restaurant/types";
import type { PedidoCocina } from "@/lib/restaurant/cocina-types";

const COLUMNAS: { titulo: string; estados: EstadoPedido[] }[] = [
  { titulo: "Nuevos", estados: ["RECEIVED", "ACCEPTED"] },
  { titulo: "En preparación", estados: ["PREPARING"] },
  { titulo: "Listos", estados: ["READY"] },
];

const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, { estado: EstadoPedido; label: string }>> = {
  RECEIVED: { estado: "ACCEPTED", label: "Aceptar" },
  ACCEPTED: { estado: "PREPARING", label: "Empezar preparación" },
  PREPARING: { estado: "READY", label: "Marcar listo" },
  READY: { estado: "DELIVERED", label: "Entregado" },
};

export function KitchenBoard({ pedidosIniciales }: { pedidosIniciales: PedidoCocina[] }) {
  const [pedidos, setPedidos] = useState<PedidoCocina[]>(pedidosIniciales);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.rpc("get_pedidos_cocina");
    if (!error && data) {
      setPedidos(data as unknown as PedidoCocina[]);
    }
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("cocina-pedidos")
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
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {COLUMNAS.map((columna) => {
        const items = pedidos
          .filter((p) => columna.estados.includes(p.estado))
          .sort((a, b) => a.created_at.localeCompare(b.created_at));

        return (
          <div key={columna.titulo} className="rounded-lg bg-white p-3">
            <h2 className="text-xs font-medium uppercase tracking-widest2 text-brand-ink/50">
              {columna.titulo} ({items.length})
            </h2>

            <div className="mt-3 space-y-3">
              {items.map((pedido) => {
                const siguiente = SIGUIENTE_ESTADO[pedido.estado];
                const hora = new Date(pedido.created_at).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={pedido.id} className="border border-brand-black/10 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-lg">
                        {pedido.mesa_numero ? `Mesa ${pedido.mesa_numero}` : "Sin mesa"}
                      </span>
                      <span className="text-xs text-brand-ink/50">{hora}</span>
                    </div>

                    <ul className="mt-2 space-y-1 text-sm">
                      {pedido.items.map((item, index) => (
                        <li key={index}>
                          {item.cantidad} × {item.producto_nombre}
                          {item.notas ? (
                            <span className="block text-xs text-brand-ink/50">
                              {item.notas}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>

                    {pedido.notas ? (
                      <p className="mt-2 text-xs text-brand-ink/60">
                        Notas: {pedido.notas}
                      </p>
                    ) : null}

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span>{formatCentimos(pedido.total_centimos)} €</span>
                      {pedido.payment_method === "LOCAL" ? (
                        <span className="bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                          ⚠️ Pago en local
                        </span>
                      ) : (
                        <span
                          className={
                            pedido.payment_status === "PAID"
                              ? "bg-green-100 px-2 py-0.5 font-medium text-green-800"
                              : "bg-amber-100 px-2 py-0.5 font-medium text-amber-800"
                          }
                        >
                          {pedido.payment_status === "PAID" ? "✓ Pagado" : "Pago pendiente"}
                        </span>
                      )}
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
