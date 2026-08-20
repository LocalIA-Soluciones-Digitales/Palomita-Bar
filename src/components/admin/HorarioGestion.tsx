"use client";

import { useEffect, useState } from "react";
import { getConfiguracionAdmin, setConfiguracionAdmin } from "@/lib/restaurant/admin-queries";
import { errorMessage } from "@/lib/format";
import { CheckIcon, ClockIcon } from "@/components/icons";
import {
  DIAS_SEMANA,
  formatearHorarioVisual,
  parseHorario,
  semanaPorDefecto,
  serializarHorario,
  type SemanaHorario,
} from "@/lib/horario";

export function HorarioGestion() {
  const [semana, setSemana] = useState<SemanaHorario>(semanaPorDefecto());
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getConfiguracionAdmin()
      .then((valor) => {
        const parsed = parseHorario(valor);
        if (parsed) setSemana(parsed);
      })
      .catch(() => setError("No se ha podido cargar el horario."))
      .finally(() => setCargando(false));
  }, []);

  const actualizarDia = (indice: number, cambios: Partial<SemanaHorario[number]>) => {
    setSemana((prev) => {
      const copia = [...prev] as SemanaHorario;
      copia[indice] = { ...copia[indice]!, ...cambios };
      return copia;
    });
    setGuardado(false);
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setGuardado(false);
    setError(null);
    try {
      await setConfiguracionAdmin(serializarHorario(semana));
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
              {DIAS_SEMANA.map((nombre, i) => {
                const dia = semana[i]!;
                return (
                  <div
                    key={nombre}
                    className={`flex flex-col items-center gap-2.5 rounded-xl border px-3 py-4 transition-colors ${
                      dia.abierto
                        ? "border-noche-primary/25 bg-noche-primary/[0.06]"
                        : "border-noche-border bg-noche-surface-2/40"
                    }`}
                  >
                    <span className="text-xs font-medium uppercase tracking-widest2 text-noche-ink-faint">
                      {nombre.slice(0, 3)}
                    </span>

                    <button
                      type="button"
                      onClick={() => actualizarDia(i, { abierto: !dia.abierto })}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        dia.abierto ? "bg-noche-positive" : "bg-noche-surface-2"
                      }`}
                      aria-pressed={dia.abierto}
                      aria-label={`${nombre}: ${dia.abierto ? "abierto" : "cerrado"}`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          dia.abierto ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>

                    {dia.abierto ? (
                      <div className="flex w-full flex-col items-center gap-1.5">
                        <input
                          type="time"
                          value={dia.desde}
                          onChange={(e) => actualizarDia(i, { desde: e.target.value })}
                          className="w-full rounded-lg border border-noche-border bg-noche-surface-2 px-2 py-1.5 text-center text-sm text-noche-ink"
                        />
                        <span className="text-xs text-noche-ink-faint">hasta</span>
                        <input
                          type="time"
                          value={dia.hasta}
                          onChange={(e) => actualizarDia(i, { hasta: e.target.value })}
                          className="w-full rounded-lg border border-noche-border bg-noche-surface-2 px-2 py-1.5 text-center text-sm text-noche-ink"
                        />
                      </div>
                    ) : (
                      <span className="py-3 text-xs text-noche-ink-faint">Cerrado</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2.5">
              <p className="text-xs uppercase tracking-widest2 text-noche-ink-faint">Así se verá en la home</p>
              <p className="mt-1.5 whitespace-pre-line text-sm text-noche-ink/80">
                {formatearHorarioVisual(semana)}
              </p>
            </div>

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
