"use client";

import { useEffect, useRef, useState } from "react";
import { useTableSession } from "@/components/mesa/table-session-context";

interface Toast {
  id: string;
  mensaje: string;
}

const DISMISS_MS = 5000;

export function SessionNotifications() {
  const { participante, sesionPublica } = useTableSession();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const vistos = useRef<Set<string>>(new Set());
  const primeraVez = useRef(true);

  useEffect(() => {
    if (!sesionPublica || !participante) return;

    const nombrePorId = new Map(sesionPublica.participantes.map((p) => [p.id, p.nombre]));
    const nuevos: Toast[] = [];

    for (const pedido of sesionPublica.pedidos) {
      if (pedido.participante_id === participante.id) continue;
      const quien = pedido.participante_id ? nombrePorId.get(pedido.participante_id) : null;

      for (const item of pedido.items) {
        for (const reparto of item.repartos) {
          if (reparto.participante_id !== participante.id) continue;
          if (vistos.current.has(reparto.id)) continue;
          vistos.current.add(reparto.id);

          if (!primeraVez.current) {
            nuevos.push({
              id: reparto.id,
              mensaje: `${quien ?? "Alguien"} ha compartido contigo: ${item.producto_nombre}`,
            });
          }
        }
      }
    }

    primeraVez.current = false;

    if (nuevos.length > 0) {
      setToasts((prev) => [...prev, ...nuevos]);
      nuevos.forEach((toast) => {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, DISMISS_MS);
      });
    }
  }, [sesionPublica, participante]);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-24 z-[110] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="max-w-sm rounded-lg border border-noche-border bg-noche-surface px-4 py-3 text-center text-sm text-noche-ink shadow-lg shadow-noche-bg/40"
        >
          {toast.mensaje}
        </div>
      ))}
    </div>
  );
}
