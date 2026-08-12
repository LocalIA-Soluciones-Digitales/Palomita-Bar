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
      <div className="mt-4 flex gap-1 border-b border-brand-black/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs uppercase tracking-widest2 ${
              tab === t.id
                ? "border-b-2 border-brand-pink text-brand-ink"
                : "text-brand-ink/40 hover:text-brand-ink"
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
