"use client";

import { useEffect, useMemo, useState } from "react";
import { getVisitasAdmin } from "@/lib/restaurant/admin-analytics-queries";
import type { VisitaAdmin } from "@/lib/restaurant/admin-types";
import { errorMessage } from "@/lib/format";
import { Stat } from "@/components/admin/Stat";

type RangoId = "7d" | "30d" | "90d";

const RANGOS: { id: RangoId; label: string; dias: number }[] = [
  { id: "7d", label: "7 días", dias: 7 },
  { id: "30d", label: "30 días", dias: 30 },
  { id: "90d", label: "90 días", dias: 90 },
];

function contarPor<K extends string>(visitas: VisitaAdmin[], key: (v: VisitaAdmin) => K | null): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const v of visitas) {
    const k = key(v) ?? "Desconocido";
    acc[k] = (acc[k] ?? 0) + 1;
  }
  return acc;
}

export default function VisitasAdminPage() {
  const [rango, setRango] = useState<RangoId>("30d");
  const [visitas, setVisitas] = useState<VisitaAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dias = RANGOS.find((r) => r.id === rango)!.dias;

  useEffect(() => {
    setVisitas(null);
    const hasta = new Date();
    const desde = new Date(hasta.getTime() - dias * 24 * 60 * 60 * 1000);
    getVisitasAdmin(desde, hasta)
      .then(setVisitas)
      .catch((err) => setError(errorMessage(err)));
  }, [dias]);

  const porDispositivo = useMemo(
    () => (visitas ? contarPor(visitas, (v) => v.device_type) : {}),
    [visitas],
  );
  const porOrigen = useMemo(
    () => (visitas ? contarPor(visitas, (v) => v.source_category) : {}),
    [visitas],
  );
  const porPath = useMemo(() => {
    if (!visitas) return [] as [string, number][];
    const acc = contarPor(visitas, (v) => v.path as string);
    return Object.entries(acc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [visitas]);

  const recurrentes = visitas ? visitas.filter((v) => v.is_returning).length : 0;
  const sesionesUnicas = visitas ? new Set(visitas.map((v) => v.session_id)).size : 0;

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-noche-ink">Visitas</h1>
        <div className="flex gap-1">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRango(r.id)}
              className={`rounded-lg px-3 py-1.5 text-xs uppercase tracking-widest2 ${
                rango === r.id
                  ? "bg-noche-primary/15 text-noche-primary"
                  : "border border-noche-border bg-noche-surface text-noche-ink-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-noche-danger">{error}</p> : null}

      {!visitas ? (
        <p className="mt-6 text-sm text-noche-ink-muted">Cargando…</p>
      ) : (
        <div className="mt-6 space-y-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Eventos" value={String(visitas.length)} />
            <Stat label="Sesiones" value={String(sesionesUnicas)} />
            <Stat label="Recurrentes" value={String(recurrentes)} />
            <Stat
              label="% recurrencia"
              value={visitas.length === 0 ? "—" : `${Math.round((recurrentes / visitas.length) * 100)}%`}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-lg text-noche-ink">Por dispositivo</h2>
              {Object.keys(porDispositivo).length === 0 ? (
                <p className="mt-2 text-sm text-noche-ink-muted">Sin datos en este periodo.</p>
              ) : (
                <ul className="mt-3 space-y-1 text-sm text-noche-ink">
                  {Object.entries(porDispositivo).map(([k, v]) => (
                    <li key={k} className="flex justify-between">
                      <span>{k}</span>
                      <span className="text-noche-ink-muted">{v}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h2 className="font-display text-lg text-noche-ink">Por origen</h2>
              {Object.keys(porOrigen).length === 0 ? (
                <p className="mt-2 text-sm text-noche-ink-muted">Sin datos en este periodo.</p>
              ) : (
                <ul className="mt-3 space-y-1 text-sm text-noche-ink">
                  {Object.entries(porOrigen).map(([k, v]) => (
                    <li key={k} className="flex justify-between">
                      <span>{k}</span>
                      <span className="text-noche-ink-muted">{v}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg text-noche-ink">Páginas más visitadas</h2>
            {porPath.length === 0 ? (
              <p className="mt-2 text-sm text-noche-ink-muted">Sin datos en este periodo.</p>
            ) : (
              <ol className="mt-3 space-y-1 text-sm text-noche-ink">
                {porPath.map(([path, count], i) => (
                  <li key={path} className="flex justify-between gap-3">
                    <span className="truncate">
                      {i + 1}. {path}
                    </span>
                    <span className="shrink-0 text-noche-ink-muted">{count}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
