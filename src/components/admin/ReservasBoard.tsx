"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  actualizarReservaEstadoAdmin,
  asignarMesasReservaAdmin,
  getMesasEstadoAdmin,
  getReservasAdmin,
  getZonasAdmin,
} from "@/lib/restaurant/admin-queries";
import { esBloqueo, motivoBloqueo, NOMBRE_BLOQUEO } from "@/lib/restaurant/reserva-bloqueo";
import { mesasOcupadasEn } from "@/lib/restaurant/reserva-disponibilidad";
import { ESTILO_BLOQUEO, ESTILO_ESTADO } from "@/lib/restaurant/reserva-estilos";
import { errorMessage } from "@/lib/format";
import { ReservaModal } from "@/components/admin/ReservaModal";
import { BloqueoMesaModal } from "@/components/admin/BloqueoMesaModal";
import { MesaMultiSelect } from "@/components/admin/MesaMultiSelect";
import { ReservasTimeline } from "@/components/admin/ReservasTimeline";
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CloseIcon,
  LockIcon,
  PhoneIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  TableIcon,
  UsersIcon,
} from "@/components/icons";
import type { EstadoReserva, MesaEstadoAdmin, ReservaAdmin, ZonaAdmin } from "@/lib/restaurant/admin-types";

function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
}

function addDaysISO(fecha: string, delta: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

function formatHora(hora: string): string {
  return hora.slice(0, 5);
}

function formatFechaLarga(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1, 12));
  const texto = dt.toLocaleDateString("es-ES", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const ESTADO_FILTROS: { id: "TODAS" | EstadoReserva; label: string }[] = [
  { id: "TODAS", label: "Todas" },
  { id: "CONFIRMADA", label: "Confirmadas" },
  { id: "SENTADA", label: "Sentadas" },
  { id: "CANCELADA", label: "Canceladas" },
  { id: "NO_SHOW", label: "No presentados" },
];

function StatTile({ label, value, valueClassName }: { label: string; value: number; valueClassName?: string }) {
  return (
    <div className="rounded-lg border border-noche-border bg-noche-surface px-4 py-3 text-center">
      <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl ${valueClassName ?? "text-noche-ink"}`}>{value}</p>
    </div>
  );
}

export function ReservasBoard() {
  const [fecha, setFecha] = useState(todayISO());
  const [reservas, setReservas] = useState<ReservaAdmin[]>([]);
  const [zonas, setZonas] = useState<ZonaAdmin[]>([]);
  const [mesas, setMesas] = useState<MesaEstadoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<"TODAS" | EstadoReserva>("TODAS");
  const [zonaFiltroId, setZonaFiltroId] = useState<string | null>(null);
  const [incluirBloqueos, setIncluirBloqueos] = useState(true);
  const [mostrarReserva, setMostrarReserva] = useState(false);
  const [mostrarBloqueo, setMostrarBloqueo] = useState(false);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [vista, setVista] = useState<"lista" | "mesas">("lista");

  const esHoy = fecha === todayISO();

  const refetch = useCallback(async () => {
    try {
      const [reservasData, zonasData, mesasData] = await Promise.all([
        getReservasAdmin(fecha),
        getZonasAdmin(),
        getMesasEstadoAdmin(fecha),
      ]);
      setReservas(reservasData);
      setZonas(zonasData);
      setMesas(mesasData);
      setErrorCarga(false);
    } catch {
      setErrorCarga(true);
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  useEffect(() => {
    setCargando(true);
    refetch();
  }, [refetch]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("reservas-board")
      .on("postgres_changes", { event: "*", schema: "restaurant", table: "reservas" }, () => refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const mesaPorId = useMemo(() => new Map(mesas.map((m) => [m.id, m])), [mesas]);

  const zonaNombre = useCallback(
    (zonaId: string | null) => zonas.find((z) => z.id === zonaId)?.nombre ?? null,
    [zonas],
  );

  const reservasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return reservas
      .filter((r) => (incluirBloqueos ? true : !esBloqueo(r)))
      .filter((r) => estadoFiltro === "TODAS" || r.estado === estadoFiltro)
      .filter((r) => {
        if (!zonaFiltroId) return true;
        const mesaZona = r.mesa_id ? mesaPorId.get(r.mesa_id)?.zona_id : null;
        return (mesaZona ?? r.zona_id) === zonaFiltroId;
      })
      .filter((r) => {
        if (!termino) return true;
        return (
          r.nombre_cliente.toLowerCase().includes(termino) ||
          (r.telefono ?? "").toLowerCase().includes(termino)
        );
      })
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [reservas, incluirBloqueos, estadoFiltro, zonaFiltroId, busqueda, mesaPorId]);

  const stats = useMemo(() => {
    const reales = reservas.filter((r) => !esBloqueo(r));
    const confirmadas = reales.filter((r) => r.estado === "CONFIRMADA").length;
    const sentadas = reales.filter((r) => r.estado === "SENTADA").length;
    const bajas = reales.filter((r) => r.estado === "CANCELADA" || r.estado === "NO_SHOW").length;
    const personas = reales
      .filter((r) => r.estado === "CONFIRMADA" || r.estado === "SENTADA")
      .reduce((sum, r) => sum + r.num_personas, 0);
    const bloqueadas = reservas.filter((r) => esBloqueo(r) && r.estado === "CONFIRMADA").length;
    return { total: reales.length, confirmadas, sentadas, bajas, personas, bloqueadas };
  }, [reservas]);

  const proximaReserva = useMemo(() => {
    if (!esHoy) return null;
    const ahora = new Date().toLocaleTimeString("en-GB", { timeZone: "Europe/Madrid", hour12: false });
    return (
      reservas
        .filter((r) => !esBloqueo(r) && r.estado === "CONFIRMADA" && r.hora >= ahora)
        .sort((a, b) => a.hora.localeCompare(b.hora))[0] ?? null
    );
  }, [reservas, esHoy]);

  const cambiarEstado = async (reserva: ReservaAdmin, estado: EstadoReserva) => {
    setActualizandoId(reserva.id);
    setAccionError(null);
    try {
      await actualizarReservaEstadoAdmin(reserva.id, estado);
      await refetch();
    } catch (err) {
      setAccionError(errorMessage(err));
    } finally {
      setActualizandoId(null);
    }
  };

  const reasignarMesas = async (reserva: ReservaAdmin, mesaIds: string[]) => {
    setActualizandoId(reserva.id);
    setAccionError(null);
    try {
      await asignarMesasReservaAdmin(reserva.id, mesaIds);
      await refetch();
    } catch (err) {
      setAccionError(errorMessage(err));
    } finally {
      setActualizandoId(null);
    }
  };

  const irAListaConReserva = (reserva: ReservaAdmin) => {
    setVista("lista");
    if (!esBloqueo(reserva)) {
      setEstadoFiltro("TODAS");
      setBusqueda(reserva.nombre_cliente);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFecha((f) => addDaysISO(f, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-noche-border text-noche-ink-muted hover:bg-noche-surface-2 hover:text-noche-ink"
            aria-label="Día anterior"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-noche-border bg-noche-surface px-3 py-2">
            <CalendarIcon className="h-4 w-4 shrink-0 text-noche-ink-muted" />
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value || todayISO())}
              className="bg-transparent text-xs text-noche-ink outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setFecha((f) => addDaysISO(f, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-noche-border text-noche-ink-muted hover:bg-noche-surface-2 hover:text-noche-ink"
            aria-label="Día siguiente"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          {!esHoy ? (
            <button
              type="button"
              onClick={() => setFecha(todayISO())}
              className="rounded-lg border border-noche-border px-3 py-2 text-xs uppercase tracking-widest2 text-noche-ink-muted hover:bg-noche-surface-2 hover:text-noche-ink"
            >
              Hoy
            </button>
          ) : null}
          <p className="hidden text-sm text-noche-ink-muted sm:block">{formatFechaLarga(fecha)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMostrarBloqueo(true)}
            className="flex items-center gap-1.5 rounded-lg border border-noche-border px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink-muted hover:bg-noche-surface-2 hover:text-noche-ink"
          >
            <LockIcon className="h-3.5 w-3.5" />
            Bloquear mesa
          </button>
          <button
            type="button"
            onClick={() => setMostrarReserva(true)}
            className="flex items-center gap-1.5 rounded-lg bg-noche-primary px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink hover:bg-noche-primary-dark"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Nueva reserva
          </button>
        </div>
      </div>

      {esHoy && proximaReserva ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-noche-primary/30 bg-noche-primary/5 px-4 py-2.5 text-sm text-noche-ink">
          <ClockIcon className="h-4 w-4 shrink-0 text-noche-primary" />
          Próxima reserva: <span className="font-medium">{formatHora(proximaReserva.hora)}</span> ·{" "}
          {proximaReserva.nombre_cliente} · {proximaReserva.num_personas} pers.
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Reservas" value={stats.total} />
        <StatTile label="Confirmadas" value={stats.confirmadas} valueClassName="text-blue-400" />
        <StatTile label="Sentadas" value={stats.sentadas} valueClassName="text-orange-400" />
        <StatTile label="Bajas" value={stats.bajas} valueClassName="text-noche-ink-faint" />
        <StatTile label="Personas" value={stats.personas} />
        <StatTile label="Mesas bloqueadas" value={stats.bloqueadas} valueClassName="text-zinc-400" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-noche-border p-1">
          <button
            type="button"
            onClick={() => setVista("lista")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] uppercase tracking-widest2 transition-colors ${
              vista === "lista" ? "bg-noche-primary/15 text-noche-primary" : "text-noche-ink-muted"
            }`}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={() => setVista("mesas")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] uppercase tracking-widest2 transition-colors ${
              vista === "mesas" ? "bg-noche-primary/15 text-noche-primary" : "text-noche-ink-muted"
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            Mesas
          </button>
        </div>
        {vista === "lista" ? (
          <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-noche-border bg-noche-surface px-3 py-2">
            <SearchIcon className="h-4 w-4 shrink-0 text-noche-ink-faint" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o teléfono…"
              className="w-full bg-transparent text-sm text-noche-ink placeholder:text-noche-ink-faint outline-none"
            />
          </div>
        ) : null}
        {vista === "lista" ? (
          <div className="flex flex-wrap gap-1.5">
            {ESTADO_FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setEstadoFiltro(f.id)}
                className={`rounded-lg px-3 py-1.5 text-[11px] uppercase tracking-widest2 transition-colors ${
                  estadoFiltro === f.id
                    ? "bg-noche-primary/15 text-noche-primary"
                    : "border border-noche-border text-noche-ink-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setZonaFiltroId(null)}
            className={`rounded-lg px-3 py-1.5 text-[11px] uppercase tracking-widest2 transition-colors ${
              zonaFiltroId === null
                ? "bg-noche-primary/15 text-noche-primary"
                : "border border-noche-border text-noche-ink-muted"
            }`}
          >
            Todas las zonas
          </button>
          {zonas.map((zona) => (
            <button
              key={zona.id}
              type="button"
              onClick={() => setZonaFiltroId(zona.id)}
              className={`rounded-lg px-3 py-1.5 text-[11px] uppercase tracking-widest2 transition-colors ${
                zonaFiltroId === zona.id
                  ? "bg-noche-primary/15 text-noche-primary"
                  : "border border-noche-border text-noche-ink-muted"
              }`}
            >
              {zona.nombre}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-noche-ink-muted">
          <input
            type="checkbox"
            checked={incluirBloqueos}
            onChange={(e) => setIncluirBloqueos(e.target.checked)}
          />
          Incluir bloqueos
        </label>
      </div>

      {errorCarga ? (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-noche-danger/30 bg-noche-danger/10 px-3 py-2 text-sm text-noche-danger">
          <span>No se han podido cargar las reservas.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1 text-xs uppercase tracking-widest2 underline"
          >
            <RefreshIcon className="h-3 w-3" />
            Reintentar
          </button>
        </div>
      ) : null}

      {accionError ? (
        <p className="mt-3 flex items-center justify-between rounded-lg border border-noche-danger/30 bg-noche-danger/10 px-3 py-2 text-sm text-noche-danger">
          {accionError}
          <button type="button" onClick={() => setAccionError(null)} className="text-noche-ink-faint">
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </p>
      ) : null}

      {vista === "mesas" ? (
        cargando ? (
          <p className="py-8 text-center text-sm text-noche-ink-muted">Cargando reservas…</p>
        ) : (
          <ReservasTimeline
            fecha={fecha}
            esHoy={esHoy}
            mesas={mesas}
            zonas={zonas}
            reservas={reservas}
            zonaFiltroId={zonaFiltroId}
            incluirBloqueos={incluirBloqueos}
            onSelectReserva={irAListaConReserva}
          />
        )
      ) : (
      <div className="mt-4 space-y-2">
        {cargando ? (
          <p className="py-8 text-center text-sm text-noche-ink-muted">Cargando reservas…</p>
        ) : reservasFiltradas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-noche-border py-10 text-center">
            <p className="text-sm text-noche-ink-muted">
              {reservas.length === 0
                ? "No hay reservas para este día."
                : "Ninguna reserva coincide con los filtros."}
            </p>
          </div>
        ) : (
          reservasFiltradas.map((reserva) => {
            const bloqueo = esBloqueo(reserva);
            const estilo = bloqueo ? ESTILO_BLOQUEO : ESTILO_ESTADO[reserva.estado];
            const mesaAsignada = reserva.mesa_id ? mesaPorId.get(reserva.mesa_id) : null;
            const zonaMostrada = mesaAsignada?.zona_id ?? reserva.zona_id;
            const finalizada = reserva.estado === "CANCELADA" || reserva.estado === "NO_SHOW";
            const actualizando = actualizandoId === reserva.id;
            const mesasOcupadas = mesasOcupadasEn(reservas, reserva.fecha, reserva.hora, reserva.id);

            return (
              <div
                key={reserva.id}
                className={`rounded-lg border border-noche-border bg-noche-surface p-4 transition-opacity ${
                  finalizada ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-noche-surface-2 py-1.5">
                      <span className="font-display text-lg leading-tight text-noche-ink">
                        {formatHora(reserva.hora)}
                      </span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="flex items-center gap-1.5 font-display text-lg text-noche-ink">
                          {bloqueo ? <LockIcon className="h-4 w-4 text-zinc-400" /> : null}
                          {bloqueo ? NOMBRE_BLOQUEO : reserva.nombre_cliente}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest2 ${estilo.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${estilo.dot}`} />
                          {estilo.label}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-noche-ink-muted">
                        {!bloqueo ? (
                          <span className="flex items-center gap-1">
                            <UsersIcon className="h-3.5 w-3.5" />
                            {reserva.num_personas} pers.
                          </span>
                        ) : null}
                        {!bloqueo && reserva.telefono ? (
                          <a
                            href={`tel:${reserva.telefono}`}
                            className="flex items-center gap-1 hover:text-noche-ink"
                          >
                            <PhoneIcon className="h-3.5 w-3.5" />
                            {reserva.telefono}
                          </a>
                        ) : null}
                        {zonaMostrada ? <span>{zonaNombre(zonaMostrada)}</span> : null}
                        {bloqueo && motivoBloqueo(reserva) ? <span>{motivoBloqueo(reserva)}</span> : null}
                        {!bloqueo && reserva.notas ? (
                          <span className="italic text-noche-ink-faint">&ldquo;{reserva.notas}&rdquo;</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-start gap-2">
                    {!bloqueo ? (
                      <MesaMultiSelect
                        mesas={mesas}
                        zonas={zonas}
                        selectedIds={reserva.mesa_ids}
                        ocupadas={mesasOcupadas}
                        numPersonas={reserva.num_personas}
                        disabled={actualizando || finalizada}
                        onChange={(ids) => reasignarMesas(reserva, ids)}
                      />
                    ) : (
                      <select
                        value={reserva.mesa_id ?? ""}
                        disabled={actualizando || finalizada}
                        onChange={(e) => reasignarMesas(reserva, e.target.value ? [e.target.value] : [])}
                        className="rounded-lg border border-noche-border bg-noche-surface-2 px-2 py-1.5 text-xs text-noche-ink disabled:opacity-50"
                      >
                        <option value="">Sin mesa asignada</option>
                        {mesas.map((m) => {
                          const ocupada = mesasOcupadas.has(m.id);
                          return (
                            <option key={m.id} value={m.id} disabled={ocupada}>
                              Mesa {m.numero}
                              {ocupada ? " (reservada a esa hora)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    )}

                    {!finalizada ? (
                      <>
                        {reserva.estado === "CONFIRMADA" ? (
                          <button
                            type="button"
                            disabled={actualizando}
                            onClick={() => cambiarEstado(reserva, "SENTADA")}
                            className="flex items-center gap-1 rounded-lg bg-noche-primary px-3 py-1.5 text-[11px] uppercase tracking-widest2 text-noche-ink hover:bg-noche-primary-dark disabled:opacity-50"
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            Sentar
                          </button>
                        ) : null}
                        {!bloqueo && reserva.estado === "CONFIRMADA" ? (
                          <button
                            type="button"
                            disabled={actualizando}
                            onClick={() => cambiarEstado(reserva, "NO_SHOW")}
                            className="rounded-lg border border-noche-border px-3 py-1.5 text-[11px] uppercase tracking-widest2 text-noche-ink-muted hover:bg-noche-surface-2 disabled:opacity-50"
                          >
                            No presentado
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={actualizando}
                          onClick={() => cambiarEstado(reserva, "CANCELADA")}
                          className="rounded-lg border border-noche-border px-3 py-1.5 text-[11px] uppercase tracking-widest2 text-noche-danger hover:bg-noche-danger/10 disabled:opacity-50"
                        >
                          {bloqueo ? "Desbloquear" : "Cancelar"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={actualizando}
                        onClick={() => cambiarEstado(reserva, "CONFIRMADA")}
                        className="flex items-center gap-1 rounded-lg border border-noche-border px-3 py-1.5 text-[11px] uppercase tracking-widest2 text-noche-ink-muted hover:bg-noche-surface-2 hover:text-noche-ink disabled:opacity-50"
                      >
                        <RefreshIcon className="h-3.5 w-3.5" />
                        Reactivar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}

      {mostrarReserva ? (
        <ReservaModal
          fechaInicial={fecha}
          horaInicial={new Date().toLocaleTimeString("en-GB", {
            timeZone: "Europe/Madrid",
            hour: "2-digit",
            minute: "2-digit",
          })}
          zonas={zonas}
          mesas={mesas}
          reservas={reservas}
          onClose={() => setMostrarReserva(false)}
          onCreated={refetch}
        />
      ) : null}

      {mostrarBloqueo ? (
        <BloqueoMesaModal
          fechaInicial={fecha}
          horaInicial={new Date().toLocaleTimeString("en-GB", {
            timeZone: "Europe/Madrid",
            hour: "2-digit",
            minute: "2-digit",
          })}
          zonas={zonas}
          mesas={mesas}
          reservas={reservas}
          onClose={() => setMostrarBloqueo(false)}
          onCreated={refetch}
        />
      ) : null}
    </div>
  );
}
