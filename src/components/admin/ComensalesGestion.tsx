"use client";

import { useEffect, useMemo, useState } from "react";
import { getComensalesAdmin } from "@/lib/restaurant/admin-queries";
import type { ComensalAdmin } from "@/lib/restaurant/admin-types";
import { errorMessage } from "@/lib/format";
import { SearchIcon, UsersIcon } from "@/components/icons";
import { SkeletonCard } from "@/components/admin/Skeleton";

export function ComensalesGestion() {
  const [comensales, setComensales] = useState<ComensalAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    getComensalesAdmin()
      .then(setComensales)
      .catch((err) => setError(`No se han podido cargar los comensales: ${errorMessage(err)}`));
  }, []);

  const filtrados = useMemo(() => {
    if (!comensales) return [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return comensales;
    return comensales.filter(
      (c) => c.nombre?.toLowerCase().includes(q) || c.telefono.includes(q),
    );
  }, [comensales, busqueda]);

  return (
    <div className="overflow-hidden rounded-xl border border-noche-border bg-noche-surface">
      <div className="flex items-center justify-between border-b border-noche-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-noche-primary/10 text-noche-primary">
            <UsersIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-noche-ink">Comensales</p>
            <p className="text-xs text-noche-ink-faint">Nº de visitas asistidas por teléfono.</p>
          </div>
        </div>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-noche-ink-faint" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o teléfono"
            className="w-48 rounded-lg border border-noche-border bg-noche-surface-2 py-1.5 pl-8 pr-2.5 text-xs text-noche-ink outline-none transition focus:border-noche-primary"
          />
        </div>
      </div>

      {error ? <p className="px-4 pt-3 text-sm text-noche-danger">{error}</p> : null}

      <div className="max-h-[28rem] overflow-y-auto px-4 py-2">
        {comensales === null ? (
          <SkeletonCard filas={4} />
        ) : filtrados.length === 0 ? (
          <p className="py-3 text-sm text-noche-ink-muted">
            {busqueda ? "Ningún comensal coincide con la búsqueda." : "Todavía no hay comensales registrados."}
          </p>
        ) : (
          <ul className="divide-y divide-noche-border/50">
            {filtrados.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-noche-ink">{c.nombre || "Sin nombre"}</p>
                  <p className="mt-0.5 truncate text-xs text-noche-ink-faint">
                    {c.telefono}
                    {c.email ? ` · ${c.email}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-noche-surface-2 px-2.5 py-1 text-xs text-noche-ink-muted">
                  {c.total_visitas} {c.total_visitas === 1 ? "visita" : "visitas"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
