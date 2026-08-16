"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPedidoPublico } from "@/lib/restaurant/queries";
import { getPedidosActivos, olvidarPedido } from "@/lib/pedido/active-orders";
import { ClockIcon, CloseIcon } from "@/components/icons";
import type { PedidoPublico } from "@/lib/restaurant/types";

const ESTADOS_FINALES = ["DELIVERED", "CANCELLED"];

const ETIQUETAS: Record<string, string> = {
  RECEIVED: "Pedido recibido",
  ACCEPTED: "Pedido aceptado",
  PREPARING: "En preparación",
  READY: "¡Tu pedido está listo!",
};

export function ActiveOrderBanner() {
  const pathname = usePathname();
  const [pedido, setPedido] = useState<PedidoPublico | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function comprobar() {
      const refs = getPedidosActivos();
      for (const ref of refs) {
        const actual = await getPedidoPublico(ref.id);
        if (!actual || ESTADOS_FINALES.includes(actual.estado)) {
          olvidarPedido(ref.id);
          continue;
        }
        if (!cancelado) {
          setPedido(actual);
          return;
        }
      }
      if (!cancelado) setPedido(null);
    }

    comprobar();
    const interval = setInterval(comprobar, 15000);
    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [pathname]);

  if (!pedido || pathname === `/pedido/${pedido.id}`) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-full border border-noche-border bg-noche-bg/95 py-2.5 pl-4 pr-2 shadow-lg backdrop-blur">
        <ClockIcon className="h-4 w-4 shrink-0 text-noche-primary" />
        <Link href={`/pedido/${pedido.id}`} className="min-w-0 flex-1">
          <p className="truncate text-sm text-noche-ink">
            {ETIQUETAS[pedido.estado] ?? "Pedido en curso"}
          </p>
          <p className="text-xs text-noche-ink-muted">Toca para ver el estado</p>
        </Link>
        <button
          type="button"
          onClick={() => {
            olvidarPedido(pedido.id);
            setPedido(null);
          }}
          aria-label="Ocultar seguimiento del pedido"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-noche-ink-muted hover:bg-noche-surface-2"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
