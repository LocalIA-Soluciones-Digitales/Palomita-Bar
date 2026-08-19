"use client";

import { useState } from "react";
import { crearReservaAdmin } from "@/lib/restaurant/admin-queries";
import { construirNotasBloqueo, NOMBRE_BLOQUEO } from "@/lib/restaurant/reserva-bloqueo";
import type { MesaEstadoAdmin, ZonaAdmin } from "@/lib/restaurant/admin-types";
import { CloseIcon, LockIcon } from "@/components/icons";
import { useDialogA11y } from "@/hooks/useDialogA11y";

export function BloqueoMesaModal({
  fechaInicial,
  horaInicial,
  zonas,
  mesas,
  onClose,
  onCreated,
}: {
  fechaInicial: string;
  horaInicial: string;
  zonas: ZonaAdmin[];
  mesas: MesaEstadoAdmin[];
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [fecha, setFecha] = useState(fechaInicial);
  const [hora, setHora] = useState(horaInicial);
  const [zonaId, setZonaId] = useState("");
  const [mesaId, setMesaId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useDialogA11y(onClose);

  const mesasFiltradas = zonaId ? mesas.filter((m) => m.zona_id === zonaId) : mesas;

  const handleGuardar = async () => {
    if (!mesaId || !fecha || !hora) {
      setError("Indica al menos la mesa, la fecha y la hora.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await crearReservaAdmin({
        nombreCliente: NOMBRE_BLOQUEO,
        numPersonas: 0,
        fecha,
        hora,
        mesaId,
        zonaId: zonaId || null,
        notas: construirNotasBloqueo(motivo),
      });
      await onCreated();
      onClose();
    } catch {
      setError("No se ha podido bloquear la mesa. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Bloquear mesa"
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-noche-border bg-noche-surface p-6 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl text-noche-ink">
            <LockIcon className="h-4 w-4 text-noche-ink-muted" />
            Bloquear mesa
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-noche-ink-muted hover:bg-noche-surface-2 hover:text-noche-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-noche-ink-faint">
          Reserva la mesa para mantenimiento, un evento privado u otro motivo, sin asignarla a un
          cliente. Aparecerá como bloqueada en el Salón hasta que la canceles.
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
                Hora
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
                Zona (opcional)
              </label>
              <select
                value={zonaId}
                onChange={(e) => {
                  setZonaId(e.target.value);
                  setMesaId("");
                }}
                className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
              >
                <option value="">Cualquiera</option>
                {zonas.map((zona) => (
                  <option key={zona.id} value={zona.id}>
                    {zona.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
                Mesa
              </label>
              <select
                value={mesaId}
                onChange={(e) => setMesaId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
              >
                <option value="">Selecciona una mesa</option>
                {mesasFiltradas.map((mesa) => (
                  <option key={mesa.id} value={mesa.id}>
                    Mesa {mesa.numero}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
              Motivo (opcional)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Mantenimiento, evento privado, VIP…"
              className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink placeholder:text-noche-ink-faint"
            />
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-noche-danger">{error}</p> : null}

        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="mt-5 w-full rounded-lg bg-zinc-600 py-3 text-sm uppercase tracking-widest2 text-white hover:bg-zinc-500 disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Bloquear mesa"}
        </button>
      </div>
    </div>
  );
}
