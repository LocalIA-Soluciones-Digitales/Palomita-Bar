"use client";

import { useEffect, useMemo, useState } from "react";
import {
  actualizarEstadoResenaAdmin,
  eliminarResenaAdmin,
  getResenasAdmin,
} from "@/lib/restaurant/admin-analytics-queries";
import type { EstadoResena, ResenaAdmin } from "@/lib/restaurant/admin-types";
import { ESTILO_ESTADO_RESENA } from "@/lib/restaurant/resena-estilos";
import { errorMessage } from "@/lib/format";
import { Stars } from "@/components/resenas/Stars";
import { Stat } from "@/components/admin/Stat";
import { TrashIcon } from "@/components/icons";

const FILTROS: { value: "todas" | EstadoResena; label: string }[] = [
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "rechazada", label: "Rechazadas" },
  { value: "todas", label: "Todas" },
];

export default function ResenasAdminPage() {
  const [resenas, setResenas] = useState<ResenaAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"todas" | EstadoResena>("pendiente");
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  const cargar = () => {
    getResenasAdmin()
      .then(setResenas)
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(cargar, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todas: resenas?.length ?? 0 };
    (["pendiente", "aprobada", "rechazada"] as EstadoResena[]).forEach((e) => {
      c[e] = resenas?.filter((r) => r.estado === e).length ?? 0;
    });
    return c;
  }, [resenas]);

  const visibles = useMemo(
    () => (resenas ? (filtro === "todas" ? resenas : resenas.filter((r) => r.estado === filtro)) : []),
    [resenas, filtro],
  );

  const cambiarEstado = async (id: string, estado: EstadoResena) => {
    setActualizandoId(id);
    setError(null);
    try {
      await actualizarEstadoResenaAdmin(id, estado);
      setResenas((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, estado } : r)) : prev));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActualizandoId(null);
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta reseña definitivamente?")) return;
    setActualizandoId(id);
    setError(null);
    try {
      await eliminarResenaAdmin(id);
      setResenas((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActualizandoId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl text-noche-ink">Reseñas</h1>
      <p className="mt-1 text-sm text-noche-ink-muted">
        Las escriben los clientes desde la web. Apruébalas para que aparezcan en público — nada se
        publica automáticamente.
      </p>

      {error ? <p className="mt-4 text-sm text-noche-danger">{error}</p> : null}

      {resenas && resenas.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Pendientes" value={String(counts.pendiente ?? 0)} />
          <Stat label="Aprobadas" value={String(counts.aprobada ?? 0)} />
          <Stat label="Total" value={String(counts.todas ?? 0)} />
        </div>
      ) : null}

      <div className="mt-6 flex items-center gap-1.5 overflow-x-auto">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltro(f.value)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs uppercase tracking-widest2 transition-colors ${
              filtro === f.value
                ? "bg-noche-primary/15 text-noche-primary"
                : "text-noche-ink-muted hover:bg-noche-surface-2"
            }`}
          >
            {f.label}
            <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-noche-surface-2 px-1 text-[10px] normal-case tracking-normal text-noche-ink-muted">
              {counts[f.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {!resenas ? (
        <p className="mt-6 text-sm text-noche-ink-muted">Cargando…</p>
      ) : visibles.length === 0 ? (
        <p className="mt-6 text-sm text-noche-ink-muted">No hay reseñas que coincidan con el filtro.</p>
      ) : (
        <ul className="mt-6 grid gap-3 lg:grid-cols-2">
          {visibles.map((r) => {
            const estilo = ESTILO_ESTADO_RESENA[r.estado];
            const ocupado = actualizandoId === r.id;
            return (
              <li key={r.id} className="self-start rounded-lg border border-noche-border bg-noche-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest2 ${estilo.badge}`}>
                        {estilo.label}
                      </span>
                      <span className="text-sm font-medium text-noche-ink">{r.nombre}</span>
                    </div>
                    <Stars rating={r.valoracion} className="mt-1.5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminar(r.id)}
                    disabled={ocupado}
                    aria-label="Eliminar reseña"
                    className="shrink-0 rounded-lg p-1.5 text-noche-ink-faint hover:bg-noche-danger/10 hover:text-noche-danger disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                {r.comentario ? <p className="mt-3 text-sm text-noche-ink/80">{r.comentario}</p> : null}
                <p className="mt-2 text-xs text-noche-ink-faint">
                  {new Date(r.created_at).toLocaleString("es-ES")}
                </p>

                <div className="mt-3 flex items-center gap-1.5">
                  {r.estado !== "aprobada" ? (
                    <button
                      type="button"
                      onClick={() => cambiarEstado(r.id, "aprobada")}
                      disabled={ocupado}
                      className="rounded-lg bg-noche-primary px-3 py-1.5 text-[11px] uppercase tracking-widest2 text-white hover:bg-noche-primary-dark disabled:opacity-50"
                    >
                      Aprobar
                    </button>
                  ) : null}
                  {r.estado !== "rechazada" ? (
                    <button
                      type="button"
                      onClick={() => cambiarEstado(r.id, "rechazada")}
                      disabled={ocupado}
                      className="rounded-lg border border-noche-border px-3 py-1.5 text-[11px] uppercase tracking-widest2 text-noche-ink-muted hover:bg-noche-surface-2 disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
