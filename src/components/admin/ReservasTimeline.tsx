"use client";

import { useMemo } from "react";
import { esBloqueo, NOMBRE_BLOQUEO } from "@/lib/restaurant/reserva-bloqueo";
import { mesasOcupadasEn, VENTANA_BLOQUEO_MINUTOS } from "@/lib/restaurant/reserva-disponibilidad";
import { ESTILO_BLOQUEO, ESTILO_ESTADO } from "@/lib/restaurant/reserva-estilos";
import { UsersIcon } from "@/components/icons";
import type { MesaEstadoAdmin, ReservaAdmin, ZonaAdmin } from "@/lib/restaurant/admin-types";

const ANCHO_COLUMNA = 44; // px por bloque de 30 min
const PASO_MINUTOS = 30;

function horaAMinutosDelDia(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Traduce una hora del día a minutos "continuos": las horas de madrugada
 * (antes de las 08:00) se consideran la prolongación nocturna del servicio
 * anterior, para que 01:30 quede a la derecha de 23:30 en vez de al principio. */
function minutosContinuos(hora: string): number {
  const minutos = horaAMinutosDelDia(hora);
  return minutos < 8 * 60 ? minutos + 24 * 60 : minutos;
}

function formatHora(minutos: number): string {
  const minutosDelDia = minutos % (24 * 60);
  const h = Math.floor(minutosDelDia / 60);
  const m = minutosDelDia % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface ReservasTimelineProps {
  fecha: string;
  esHoy: boolean;
  mesas: MesaEstadoAdmin[];
  zonas: ZonaAdmin[];
  reservas: ReservaAdmin[];
  zonaFiltroId: string | null;
  incluirBloqueos: boolean;
  onSelectReserva: (reserva: ReservaAdmin) => void;
}

export function ReservasTimeline({
  fecha,
  esHoy,
  mesas,
  zonas,
  reservas,
  zonaFiltroId,
  incluirBloqueos,
  onSelectReserva,
}: ReservasTimelineProps) {
  const reservasActivas = useMemo(
    () =>
      reservas
        .filter((r) => r.estado !== "CANCELADA" && r.estado !== "NO_SHOW")
        .filter((r) => incluirBloqueos || !esBloqueo(r))
        .filter((r) => r.mesa_ids.length > 0),
    [reservas, incluirBloqueos],
  );

  const mesasVisibles = useMemo(
    () =>
      mesas
        .filter((m) => m.activa)
        .filter((m) => !zonaFiltroId || m.zona_id === zonaFiltroId)
        .sort((a, b) => a.numero.localeCompare(b.numero, "es", { numeric: true })),
    [mesas, zonaFiltroId],
  );

  const zonasVisibles = useMemo(() => {
    const idsConMesa = new Set(mesasVisibles.map((m) => m.zona_id));
    const ordenadas = [...zonas].sort((a, b) => a.orden - b.orden);
    const grupos: { zona: ZonaAdmin | null; mesas: MesaEstadoAdmin[] }[] = ordenadas
      .filter((z) => idsConMesa.has(z.id))
      .map((z) => ({ zona: z, mesas: mesasVisibles.filter((m) => m.zona_id === z.id) }));
    const sinZona = mesasVisibles.filter((m) => !m.zona_id);
    if (sinZona.length > 0) grupos.push({ zona: null, mesas: sinZona });
    return grupos;
  }, [mesasVisibles, zonas]);

  const { inicioMin, finMin } = useMemo(() => {
    const horasAbs = reservasActivas.map((r) => minutosContinuos(r.hora));
    const minReserva = horasAbs.length > 0 ? Math.min(...horasAbs) : 19 * 60;
    const maxReserva = horasAbs.length > 0 ? Math.max(...horasAbs) : 23 * 60;
    const inicio = Math.max(8 * 60, Math.floor((minReserva - 60) / 60) * 60);
    const fin = Math.min(32 * 60, Math.ceil((maxReserva + 90) / 60) * 60);
    return { inicioMin: inicio, finMin: Math.max(fin, inicio + 4 * 60) };
  }, [reservasActivas]);

  const columnas = useMemo(() => {
    const cols: number[] = [];
    for (let t = inicioMin; t < finMin; t += PASO_MINUTOS) cols.push(t);
    return cols;
  }, [inicioMin, finMin]);

  const totalAncho = columnas.length * ANCHO_COLUMNA;

  const cargaPorColumna = useMemo(() => {
    const totalMesas = mesasVisibles.length || 1;
    return columnas.map((t) => {
      const horaStr = formatHora(t);
      const ocupadas = mesasOcupadasEn(reservasActivas, fecha, horaStr);
      const ocupadasVisibles = mesasVisibles.filter((m) => ocupadas.has(m.id)).length;
      return ocupadasVisibles / totalMesas;
    });
  }, [columnas, reservasActivas, fecha, mesasVisibles]);

  const ahoraAbs = useMemo(() => {
    if (!esHoy) return null;
    const ahora = new Date().toLocaleTimeString("en-GB", { timeZone: "Europe/Madrid", hour12: false });
    const abs = minutosContinuos(ahora.slice(0, 5));
    return abs >= inicioMin && abs < finMin ? abs : null;
  }, [esHoy, inicioMin, finMin]);

  const libresAhora = useMemo(() => {
    if (!esHoy) return null;
    const ahora = new Date().toLocaleTimeString("en-GB", { timeZone: "Europe/Madrid", hour12: false }).slice(0, 5);
    const ocupadas = mesasOcupadasEn(reservasActivas, fecha, ahora);
    const libres = mesasVisibles.filter((m) => !ocupadas.has(m.id));
    return { mesas: libres.length, total: mesasVisibles.length, plazas: libres.reduce((s, m) => s + m.capacidad, 0) };
  }, [esHoy, reservasActivas, fecha, mesasVisibles]);

  if (mesasVisibles.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-noche-border py-10 text-center">
        <p className="text-sm text-noche-ink-muted">No hay mesas activas para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {libresAhora ? (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-noche-primary/30 bg-noche-primary/5 px-4 py-2.5 text-sm text-noche-ink">
          <span className="font-medium">
            {libresAhora.mesas} / {libresAhora.total}
          </span>{" "}
          mesas libres ahora mismo ·{" "}
          <span className="font-medium">{libresAhora.plazas}</span> plazas disponibles
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 pb-2 text-[11px] text-noche-ink-muted">
        {(Object.keys(ESTILO_ESTADO) as (keyof typeof ESTILO_ESTADO)[])
          .filter((k) => k === "CONFIRMADA" || k === "SENTADA")
          .map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${ESTILO_ESTADO[k].dot}`} />
              {ESTILO_ESTADO[k].label}
            </span>
          ))}
        {incluirBloqueos ? (
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${ESTILO_BLOQUEO.dot}`} />
            {ESTILO_BLOQUEO.label}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-noche-primary/30" />
          Franja horaria más ocupada
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-noche-border">
        <div style={{ width: totalAncho + 128 }}>
          {/* Cabecera de horas */}
          <div className="flex border-b border-noche-border bg-noche-surface">
            <div className="sticky left-0 z-10 w-32 shrink-0 bg-noche-surface" />
            <div className="relative flex">
              {columnas.map((t, i) => {
                const esHora = t % 60 === 0;
                return (
                  <div
                    key={t}
                    className="shrink-0 border-l border-noche-border/60 py-1.5 text-center text-[10px] text-noche-ink-faint"
                    style={{
                      width: ANCHO_COLUMNA,
                      backgroundColor: `oklch(var(--noche-primary) / ${(cargaPorColumna[i] ?? 0) * 0.35})`,
                    }}
                  >
                    {esHora ? <span className="text-noche-ink-muted">{formatHora(t)}</span> : null}
                  </div>
                );
              })}
              {ahoraAbs !== null ? (
                <div
                  className="pointer-events-none absolute top-0 h-full w-px bg-noche-danger"
                  style={{ left: ((ahoraAbs - inicioMin) / PASO_MINUTOS) * ANCHO_COLUMNA }}
                />
              ) : null}
            </div>
          </div>

          {/* Filas de mesas agrupadas por zona */}
          {zonasVisibles.map(({ zona, mesas: mesasZona }) => (
            <div key={zona?.id ?? "sin-zona"}>
              <div className="flex bg-noche-surface-2/50">
                <div className="sticky left-0 z-10 w-32 shrink-0 bg-noche-surface-2/50 px-3 py-1 text-[10px] uppercase tracking-widest2 text-noche-ink-faint">
                  {zona?.nombre ?? "Sin zona"}
                </div>
                <div style={{ width: totalAncho }} />
              </div>
              {mesasZona.map((mesa) => {
                const bloques = reservasActivas.filter((r) => r.mesa_ids.includes(mesa.id));
                return (
                  <div key={mesa.id} className="flex border-t border-noche-border/60">
                    <div className="sticky left-0 z-10 flex w-32 shrink-0 items-center gap-1.5 border-r border-noche-border/60 bg-noche-surface px-3 py-2">
                      <span className="text-sm text-noche-ink">Mesa {mesa.numero}</span>
                      <span className="flex items-center gap-0.5 text-[10px] text-noche-ink-faint">
                        <UsersIcon className="h-3 w-3" />
                        {mesa.capacidad}
                      </span>
                    </div>
                    <div className="relative" style={{ width: totalAncho, height: 40 }}>
                      {bloques.map((r) => {
                        const bloqueo = esBloqueo(r);
                        const estilo = bloqueo ? ESTILO_BLOQUEO : ESTILO_ESTADO[r.estado];
                        const centro = minutosContinuos(r.hora);
                        const inicioBloque = Math.max(centro - VENTANA_BLOQUEO_MINUTOS, inicioMin);
                        const finBloque = Math.min(centro + VENTANA_BLOQUEO_MINUTOS, finMin);
                        if (finBloque <= inicioMin || inicioBloque >= finMin) return null;
                        const left = ((inicioBloque - inicioMin) / PASO_MINUTOS) * ANCHO_COLUMNA;
                        const width = ((finBloque - inicioBloque) / PASO_MINUTOS) * ANCHO_COLUMNA;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => onSelectReserva(r)}
                            title={
                              bloqueo
                                ? `${NOMBRE_BLOQUEO} · ${r.hora.slice(0, 5)}`
                                : `${r.nombre_cliente} · ${r.hora.slice(0, 5)} · ${r.num_personas} pers.`
                            }
                            className={`absolute top-1 flex h-8 items-center overflow-hidden rounded-md px-1.5 text-[10px] font-medium ${estilo.badge} hover:brightness-125`}
                            style={{ left, width: Math.max(width - 2, 4) }}
                          >
                            <span className="truncate">
                              {bloqueo ? NOMBRE_BLOQUEO : r.nombre_cliente}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
