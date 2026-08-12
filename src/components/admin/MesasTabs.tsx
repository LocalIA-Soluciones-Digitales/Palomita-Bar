"use client";

import { useState } from "react";
import { SalonBoard } from "@/components/admin/SalonBoard";
import { MesasGestion } from "@/components/admin/MesasGestion";
import type { MesaEstadoAdmin } from "@/lib/restaurant/admin-types";

const TABS = [
  { id: "salon", label: "Salón" },
  { id: "gestion", label: "Gestión de mesas" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function MesasTabs({ mesasIniciales }: { mesasIniciales: MesaEstadoAdmin[] }) {
  const [tab, setTab] = useState<TabId>("salon");

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

      {tab === "salon" ? (
        <SalonBoard mesasIniciales={mesasIniciales} />
      ) : (
        <div className="mt-6">
          <MesasGestion />
        </div>
      )}
    </div>
  );
}
