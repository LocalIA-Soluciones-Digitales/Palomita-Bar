"use client";

import { useEffect, useState } from "react";
import { eliminarErrorLogAdmin, getErrorLogsAdmin } from "@/lib/restaurant/admin-analytics-queries";
import type { ErrorLogAdmin } from "@/lib/restaurant/admin-types";
import { errorMessage } from "@/lib/format";
import { TrashIcon } from "@/components/icons";
import { Stat } from "@/components/admin/Stat";

export default function ErroresAdminPage() {
  const [errores, setErrores] = useState<ErrorLogAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);

  const cargar = () => {
    getErrorLogsAdmin()
      .then(setErrores)
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(cargar, []);

  const eliminar = async (id: string) => {
    try {
      await eliminarErrorLogAdmin(id);
      setErrores((prev) => (prev ? prev.filter((e) => e.id !== id) : prev));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const fuentesDistintas = errores ? new Set(errores.map((e) => e.source)).size : null;
  const ultimoRegistro = errores && errores.length > 0 ? errores[0] : null;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl text-noche-ink">Log de errores</h1>
      <p className="mt-1 text-sm text-noche-ink-muted">Fallos registrados en la web de Palomita.</p>

      {error ? <p className="mt-4 text-sm text-noche-danger">{error}</p> : null}

      {errores && errores.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Errores registrados" value={String(errores.length)} />
          <Stat label="Fuentes distintas" value={String(fuentesDistintas)} />
          <Stat
            label="Último registrado"
            value={ultimoRegistro ? new Date(ultimoRegistro.created_at).toLocaleDateString("es-ES") : "—"}
          />
        </div>
      ) : null}

      {!errores ? (
        <p className="mt-6 text-sm text-noche-ink-muted">Cargando…</p>
      ) : errores.length === 0 ? (
        <p className="mt-6 text-sm text-noche-ink-muted">Sin errores registrados. Todo en orden.</p>
      ) : (
        <ul className="mt-6 grid gap-3 lg:grid-cols-2">
          {errores.map((e) => (
            <li key={e.id} className="self-start rounded-lg border border-noche-border bg-noche-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setAbierto(abierto === e.id ? null : e.id)}
                  className="flex-1 text-left"
                >
                  <p className="text-sm text-noche-ink">{e.message}</p>
                  <p className="mt-1 text-xs text-noche-ink-muted">
                    {e.source} · {new Date(e.created_at).toLocaleString("es-ES")}
                    {e.url ? ` · ${e.url}` : ""}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => eliminar(e.id)}
                  aria-label="Eliminar error"
                  className="shrink-0 rounded-lg p-1.5 text-noche-ink-faint hover:bg-noche-danger/10 hover:text-noche-danger"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              {abierto === e.id && e.stack ? (
                <pre className="mt-3 overflow-x-auto rounded-md bg-noche-bg p-3 text-xs text-noche-ink-muted">
                  {e.stack}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
