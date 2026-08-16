"use client";

import { useEffect, useState } from "react";
import { getConfiguracionAdmin, setConfiguracionAdmin } from "@/lib/restaurant/admin-queries";
import { errorMessage } from "@/lib/format";
import { CheckIcon, ClockIcon } from "@/components/icons";

export function HorarioGestion() {
  const [horario, setHorario] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getConfiguracionAdmin()
      .then((valor) => setHorario(valor ?? ""))
      .catch(() => setError("No se ha podido cargar el horario."))
      .finally(() => setCargando(false));
  }, []);

  const handleGuardar = async () => {
    setGuardando(true);
    setGuardado(false);
    setError(null);
    try {
      await setConfiguracionAdmin(horario);
      setGuardado(true);
    } catch (err) {
      setError(`No se ha podido guardar: ${errorMessage(err)}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-noche-border bg-noche-surface">
      <div className="flex items-center justify-between border-b border-noche-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-noche-primary/10 text-noche-primary">
            <ClockIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-noche-ink">Horario</p>
            <p className="text-xs text-noche-ink-faint">Se muestra en la sección de contacto de la home.</p>
          </div>
        </div>
        {guardado ? (
          <span className="flex items-center gap-1 rounded-full bg-noche-positive/10 px-2.5 py-1 text-xs text-noche-positive">
            <CheckIcon className="h-3 w-3" />
            Guardado
          </span>
        ) : null}
      </div>

      <div className="px-4 py-4">
        {cargando ? (
          <p className="text-sm text-noche-ink-muted">Cargando…</p>
        ) : (
          <>
            <textarea
              value={horario}
              onChange={(e) => {
                setHorario(e.target.value);
                setGuardado(false);
              }}
              rows={3}
              placeholder="Ej: Martes a domingo, 18:00 - 01:00"
              className="w-full rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
            />

            {error ? <p className="mt-2 text-sm text-noche-danger">{error}</p> : null}

            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="mt-3 rounded-lg bg-noche-primary px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink transition hover:brightness-110 disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
