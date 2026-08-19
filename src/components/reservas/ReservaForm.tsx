"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { crearReservaPublica, getHorarioPublico } from "@/lib/restaurant/queries";
import { errorMessage } from "@/lib/format";
import { CheckIcon } from "@/components/icons";
import {
  estaDentroDeHorario,
  horarioDelDia,
  parseHorario,
  semanaPorDefecto,
  type SemanaHorario,
} from "@/lib/horario";

function hoyISO(): string {
  const hoy = new Date();
  return hoy.toISOString().slice(0, 10);
}

export function ReservaForm() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [numPersonas, setNumPersonas] = useState(2);
  const [fecha, setFecha] = useState(hoyISO());
  const [hora, setHora] = useState("21:00");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [semana, setSemana] = useState<SemanaHorario>(semanaPorDefecto());

  useEffect(() => {
    getHorarioPublico()
      .then((valor) => {
        const parsed = parseHorario(valor);
        if (parsed) setSemana(parsed);
      })
      .catch(() => {
        // Si falla la carga, se mantiene el horario por defecto.
      });
  }, []);

  const horaValida = useMemo(
    () => estaDentroDeHorario(semana, fecha, hora),
    [semana, fecha, hora],
  );
  const diaSeleccionado = useMemo(() => horarioDelDia(semana, fecha), [semana, fecha]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!horaValida) {
      setError(
        diaSeleccionado.abierto
          ? `Esa hora está fuera de nuestro horario. Ese día abrimos de ${diaSeleccionado.desde} a ${diaSeleccionado.hasta}.`
          : "Ese día el local está cerrado. Elige otra fecha u hora.",
      );
      return;
    }
    setEnviando(true);
    try {
      await crearReservaPublica({
        nombreCliente: nombre,
        telefono: telefono || undefined,
        numPersonas,
        fecha,
        hora,
        notas: notas || undefined,
      });
      setEnviado(true);
    } catch (err) {
      setError(errorMessage(err) || "No hemos podido registrar tu reserva. Llámanos y te ayudamos.");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="rounded-lg border border-noche-positive/40 bg-noche-positive/10 p-6 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-noche-positive/20 text-noche-positive">
          <CheckIcon className="h-5 w-5" />
        </span>
        <p className="mt-3 font-display text-xl text-noche-ink">Reserva recibida</p>
        <p className="mt-1 text-sm text-noche-ink-muted">
          Te esperamos el {fecha} a las {hora}. Si necesitas cambiar algo, llámanos al teléfono del
          local.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Nombre</span>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={80}
            className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface px-4 py-3 text-noche-ink"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
            Teléfono (opcional)
          </span>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            maxLength={20}
            className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface px-4 py-3 text-noche-ink"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
            Nº de personas
          </span>
          <input
            type="number"
            required
            min={1}
            max={30}
            value={numPersonas}
            onChange={(e) => setNumPersonas(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface px-4 py-3 text-noche-ink"
          />
        </label>
        <div />
        <label className="block min-w-0">
          <span className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Fecha</span>
          <input
            type="date"
            required
            min={hoyISO()}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="mt-1 block w-full max-w-full appearance-none rounded-lg border border-noche-border bg-noche-surface px-4 py-3 text-noche-ink"
          />
        </label>
        <label className="block min-w-0">
          <span className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Hora</span>
          <input
            type="time"
            required
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className={`mt-1 block w-full max-w-full appearance-none rounded-lg border bg-noche-surface px-4 py-3 text-noche-ink ${
              horaValida ? "border-noche-border" : "border-noche-danger"
            }`}
          />
          <span className="mt-1 block text-xs text-noche-ink-faint">
            {diaSeleccionado.abierto
              ? `Ese día abrimos de ${diaSeleccionado.desde} a ${diaSeleccionado.hasta}.`
              : "Ese día el local está cerrado."}
          </span>
        </label>
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
          Notas (opcional)
        </span>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Alergias, celebración, silla para bebé…"
          className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface px-4 py-3 text-noche-ink"
        />
      </label>

      {error ? <p className="text-sm text-noche-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-noche-primary py-4 text-sm uppercase tracking-widest2 text-white transition-colors hover:bg-noche-primary-dark disabled:opacity-50"
      >
        {enviando ? "Enviando…" : "Confirmar reserva"}
      </button>
    </form>
  );
}
