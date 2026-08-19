"use client";

import { useEffect, useMemo, useState } from "react";
import { getPremiosAdmin, marcarPremioCanjeadoAdmin } from "@/lib/restaurant/admin-queries";
import type { EstadoPremio, PremioAdmin } from "@/lib/restaurant/admin-types";
import { errorMessage } from "@/lib/format";
import { CheckIcon, MailIcon, PhoneIcon, RefreshIcon, TagIcon } from "@/components/icons";
import { SkeletonCard } from "@/components/admin/Skeleton";

const FILTROS: { estado: EstadoPremio | "TODOS"; label: string }[] = [
  { estado: "PENDIENTE", label: "Pendientes" },
  { estado: "CANJEADO", label: "Canjeados" },
  { estado: "TODOS", label: "Todos" },
];

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export function PremiosGestion() {
  const [premios, setPremios] = useState<PremioAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<EstadoPremio | "TODOS">("PENDIENTE");
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [reenviandoId, setReenviandoId] = useState<string | null>(null);

  const cargar = async () => {
    try {
      setPremios(await getPremiosAdmin());
    } catch (err) {
      setError(`No se han podido cargar los premios: ${errorMessage(err)}`);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = useMemo(() => {
    if (!premios) return [];
    return filtro === "TODOS" ? premios : premios.filter((p) => p.estado === filtro);
  }, [premios, filtro]);

  const handleCanjear = async (id: string) => {
    setProcesandoId(id);
    try {
      await marcarPremioCanjeadoAdmin(id);
      await cargar();
    } catch (err) {
      setError(`No se ha podido marcar como canjeado: ${errorMessage(err)}`);
    } finally {
      setProcesandoId(null);
    }
  };

  const handleReenviar = async (id: string) => {
    setReenviandoId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/premios/${id}/reenviar`, { method: "POST" });
      if (!res.ok) throw new Error("No se ha podido reenviar el aviso.");
      await cargar();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setReenviandoId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-noche-border bg-noche-surface">
      <div className="flex items-center justify-between border-b border-noche-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-noche-primary/10 text-noche-primary">
            <TagIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-noche-ink">Premios otorgados</p>
            <p className="text-xs text-noche-ink-faint">Marca como canjeado cuando el cliente lo use.</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg bg-noche-surface-2 p-0.5">
          {FILTROS.map((f) => (
            <button
              key={f.estado}
              type="button"
              onClick={() => setFiltro(f.estado)}
              className={`rounded-md px-2.5 py-1 text-[11px] uppercase tracking-widest2 transition ${
                filtro === f.estado
                  ? "bg-noche-primary text-noche-ink"
                  : "text-noche-ink-muted hover:text-noche-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="px-4 pt-3 text-sm text-noche-danger">{error}</p> : null}

      <div className="px-4 py-2">
        {premios === null ? (
          <SkeletonCard filas={3} />
        ) : filtrados.length === 0 ? (
          <p className="py-3 text-sm text-noche-ink-muted">No hay premios en este filtro.</p>
        ) : (
          <ul className="divide-y divide-noche-border/50">
            {filtrados.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-noche-ink">
                    {p.comensal_nombre || p.comensal_telefono} — {p.premio_descripcion}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-noche-ink-faint">
                    <span>{p.regla_nombre}</span>
                    <span>· Otorgado el {formatFecha(p.fecha_otorgado)}</span>
                    {p.notificado_en ? (
                      <span className="flex items-center gap-1 text-noche-positive">
                        {p.canal_notificacion === "EMAIL" ? (
                          <MailIcon className="h-3 w-3" />
                        ) : (
                          <PhoneIcon className="h-3 w-3" />
                        )}
                        Avisado
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReenviar(p.id)}
                        disabled={reenviandoId === p.id}
                        className="flex items-center gap-1 text-noche-ink-faint hover:text-noche-primary disabled:opacity-50"
                      >
                        <RefreshIcon className="h-3 w-3" />
                        {reenviandoId === p.id ? "Enviando…" : "Sin avisar todavía · Reenviar"}
                      </button>
                    )}
                  </p>
                </div>
                {p.estado === "PENDIENTE" ? (
                  <button
                    type="button"
                    onClick={() => handleCanjear(p.id)}
                    disabled={procesandoId === p.id}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-noche-primary px-3 py-1.5 text-[11px] uppercase tracking-widest2 text-noche-ink transition hover:brightness-110 disabled:opacity-50"
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                    Marcar canjeado
                  </button>
                ) : (
                  <span className="shrink-0 rounded-full bg-noche-positive/10 px-2.5 py-1 text-[11px] uppercase tracking-widest2 text-noche-positive">
                    Canjeado
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
