"use client";

import { useEffect, useMemo, useState } from "react";
import { crearReservaAdmin } from "@/lib/restaurant/admin-queries";
import type { MesaEstadoAdmin, ReservaAdmin, ZonaAdmin } from "@/lib/restaurant/admin-types";
import { mesasOcupadasEn } from "@/lib/restaurant/reserva-disponibilidad";
import { CloseIcon } from "@/components/icons";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { MesaMultiSelect } from "@/components/admin/MesaMultiSelect";

export function ReservaModal({
  fechaInicial,
  horaInicial,
  mesaIdInicial,
  zonaIdInicial,
  zonas,
  mesas,
  reservas,
  onClose,
  onCreated,
}: {
  fechaInicial: string;
  horaInicial: string;
  mesaIdInicial?: string | null;
  zonaIdInicial?: string | null;
  zonas: ZonaAdmin[];
  mesas: MesaEstadoAdmin[];
  reservas: ReservaAdmin[];
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [numPersonas, setNumPersonas] = useState("2");
  const [fecha, setFecha] = useState(fechaInicial);
  const [hora, setHora] = useState(horaInicial);
  const [zonaId, setZonaId] = useState(zonaIdInicial ?? "");
  const [mesaIds, setMesaIds] = useState<string[]>(mesaIdInicial ? [mesaIdInicial] : []);
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useDialogA11y(onClose);

  const mesasFiltradas = zonaId ? mesas.filter((m) => m.zona_id === zonaId) : mesas;
  const mesasOcupadas = useMemo(
    () => mesasOcupadasEn(reservas, fecha, hora),
    [reservas, fecha, hora],
  );

  useEffect(() => {
    setMesaIds((ids) => ids.filter((id) => !mesasOcupadas.has(id)));
  }, [mesasOcupadas]);

  const handleGuardar = async () => {
    if (!nombreCliente.trim() || !fecha || !hora) {
      setError("Indica al menos el nombre, la fecha y la hora.");
      return;
    }
    if (mesaIds.some((id) => mesasOcupadas.has(id))) {
      setError("Alguna mesa elegida ya está reservada cerca de esa hora. Elige otra mesa u otra hora.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await crearReservaAdmin({
        nombreCliente: nombreCliente.trim(),
        telefono: telefono.trim() || undefined,
        numPersonas: Number(numPersonas) || 2,
        fecha,
        hora,
        zonaId: zonaId || null,
        mesaIds,
        notas: notas.trim() || undefined,
      });
      await onCreated();
      onClose();
    } catch {
      setError("No se ha podido guardar la reserva. Inténtalo de nuevo.");
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
        aria-label="Nueva reserva"
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-noche-border bg-noche-surface p-6 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-noche-ink">Nueva reserva</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-noche-ink-muted hover:bg-noche-surface-2 hover:text-noche-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
              Nombre del cliente
            </label>
            <input
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
              Teléfono (opcional)
            </label>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
            />
          </div>

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
            <div className="w-24">
              <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
                Pers.
              </label>
              <input
                type="number"
                min={1}
                value={numPersonas}
                onChange={(e) => setNumPersonas(e.target.value)}
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
                  setMesaIds([]);
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
                Mesa (opcional)
              </label>
              <div className="mt-1">
                <MesaMultiSelect
                  mesas={mesasFiltradas}
                  zonas={zonas}
                  selectedIds={mesaIds}
                  ocupadas={mesasOcupadas}
                  numPersonas={Number(numPersonas) || 0}
                  onChange={setMesaIds}
                  fullWidth
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
              Notas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
            />
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-noche-danger">{error}</p> : null}

        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="mt-5 w-full rounded-lg bg-noche-primary py-3 text-sm uppercase tracking-widest2 text-noche-ink disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar reserva"}
        </button>
      </div>
    </div>
  );
}
