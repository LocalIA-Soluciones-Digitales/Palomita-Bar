"use client";

import { useState } from "react";
import { crearReservaAdmin } from "@/lib/restaurant/admin-queries";
import type { MesaEstadoAdmin, ZonaAdmin } from "@/lib/restaurant/admin-types";

export function ReservaModal({
  fechaInicial,
  horaInicial,
  mesaIdInicial,
  zonaIdInicial,
  zonas,
  mesas,
  onClose,
  onCreated,
}: {
  fechaInicial: string;
  horaInicial: string;
  mesaIdInicial?: string | null;
  zonaIdInicial?: string | null;
  zonas: ZonaAdmin[];
  mesas: MesaEstadoAdmin[];
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [numPersonas, setNumPersonas] = useState("2");
  const [fecha, setFecha] = useState(fechaInicial);
  const [hora, setHora] = useState(horaInicial);
  const [zonaId, setZonaId] = useState(zonaIdInicial ?? "");
  const [mesaId, setMesaId] = useState(mesaIdInicial ?? "");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mesasFiltradas = zonaId ? mesas.filter((m) => m.zona_id === zonaId) : mesas;

  const handleGuardar = async () => {
    if (!nombreCliente.trim() || !fecha || !hora) {
      setError("Indica al menos el nombre, la fecha y la hora.");
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
        mesaId: mesaId || null,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto bg-brand-cream p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Nueva reserva</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs uppercase tracking-widest2 text-brand-ink/60"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
              Nombre del cliente
            </label>
            <input
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              className="mt-1 w-full border border-brand-black/20 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
              Teléfono (opcional)
            </label>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="mt-1 w-full border border-brand-black/20 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1 w-full border border-brand-black/20 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
                Hora
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="mt-1 w-full border border-brand-black/20 px-3 py-2 text-sm"
              />
            </div>
            <div className="w-24">
              <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
                Pers.
              </label>
              <input
                type="number"
                min={1}
                value={numPersonas}
                onChange={(e) => setNumPersonas(e.target.value)}
                className="mt-1 w-full border border-brand-black/20 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
                Zona (opcional)
              </label>
              <select
                value={zonaId}
                onChange={(e) => {
                  setZonaId(e.target.value);
                  setMesaId("");
                }}
                className="mt-1 w-full border border-brand-black/20 px-3 py-2 text-sm"
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
              <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
                Mesa (opcional)
              </label>
              <select
                value={mesaId}
                onChange={(e) => setMesaId(e.target.value)}
                className="mt-1 w-full border border-brand-black/20 px-3 py-2 text-sm"
              >
                <option value="">Sin asignar</option>
                {mesasFiltradas.map((mesa) => (
                  <option key={mesa.id} value={mesa.id}>
                    Mesa {mesa.numero}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
              Notas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="mt-1 w-full border border-brand-black/20 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="mt-5 w-full bg-brand-black py-3 text-sm uppercase tracking-widest2 text-brand-cream disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar reserva"}
        </button>
      </div>
    </div>
  );
}
