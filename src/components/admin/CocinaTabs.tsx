"use client";

import { useState } from "react";
import { KitchenBoard } from "@/components/cocina/KitchenBoard";
import { HistorialPedidos } from "@/components/cocina/HistorialPedidos";
import type { PedidoCocina } from "@/lib/restaurant/cocina-types";

const TABS = [
  { id: "activos", label: "En curso" },
  { id: "historial", label: "Historial" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function CocinaTabs({ pedidosIniciales }: { pedidosIniciales: PedidoCocina[] }) {
  const [tab, setTab] = useState<TabId>("activos");

  return (
    <div>
      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-noche-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2 text-xs uppercase tracking-widest2 ${
              tab === t.id
                ? "border-b-2 border-noche-primary text-noche-ink"
                : "text-noche-ink-faint hover:text-noche-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "activos" ? (
        <KitchenBoard pedidosIniciales={pedidosIniciales} />
      ) : (
        <HistorialPedidos />
      )}
    </div>
  );
}
