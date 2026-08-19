"use client";

import { useState } from "react";
import { ProductosGestion } from "@/components/admin/ProductosGestion";
import { CategoriasGestion } from "@/components/admin/CategoriasGestion";

const TABS = [
  { id: "productos", label: "Productos" },
  { id: "categorias", label: "Categorías" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function CartaTabs() {
  const [tab, setTab] = useState<TabId>("productos");

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

      <div className="mt-6">{tab === "productos" ? <ProductosGestion /> : <CategoriasGestion />}</div>
    </div>
  );
}
