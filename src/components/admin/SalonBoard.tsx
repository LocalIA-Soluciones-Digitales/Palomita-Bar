"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatCentimos } from "@/lib/format";
import { playNewOrderChime } from "@/lib/notify-sound";
import {
  actualizarMesaCapacidadAdmin,
  avanzarPedidoAdmin,
  cambiarMesaAdmin,
  crearMesaAdmin,
  eliminarMesaAdmin,
  getCamarerosAdmin,
  getMesasEstadoAdmin,
  getReservasAdmin,
  getZonasAdmin,
  liberarMesaAdmin,
  marcarMesaLimpiaAdmin,
  marcarMesaPagandoAdmin,
  actualizarMesaPosicionAdmin,
  sentarMesaAdmin,
  separarGrupoMesasAdmin,
  unirMesasAdmin,
} from "@/lib/restaurant/admin-queries";
import { PedidoRapidoForm } from "@/components/admin/PedidoRapidoForm";
import { ReservaModal } from "@/components/admin/ReservaModal";
import type {
  CamareroAdmin,
  MesaEstadoAdmin,
  PedidoMesaAdmin,
  ReservaAdmin,
  ZonaAdmin,
} from "@/lib/restaurant/admin-types";
import type { EstadoPedido } from "@/lib/restaurant/types";

type EstadoMesa =
  | "LIBRE"
  | "RESERVADA"
  | "OCUPADA"
  | "ESPERANDO_PEDIDO"
  | "EN_PREPARACION"
  | "LISTO"
  | "PAGANDO"
  | "POR_LIMPIAR";

const ACTIVOS: EstadoPedido[] = ["RECEIVED", "ACCEPTED", "PREPARING", "READY"];

const ESTILO_MESA: Record<EstadoMesa, { ring: string; badge: string; label: string }> = {
  LIBRE: {
    ring: "ring-emerald-500",
    badge: "bg-emerald-500 text-white",
    label: "Libre",
  },
  RESERVADA: {
    ring: "ring-blue-500",
    badge: "bg-blue-500 text-white",
    label: "Reservada",
  },
  OCUPADA: {
    ring: "ring-orange-500",
    badge: "bg-orange-500 text-white",
    label: "Ocupada",
  },
  ESPERANDO_PEDIDO: {
    ring: "ring-violet-500",
    badge: "bg-violet-500 text-white animate-pulse",
    label: "Esperando pedido",
  },
  EN_PREPARACION: {
    ring: "ring-cyan-500",
    badge: "bg-cyan-500 text-white",
    label: "En preparación",
  },
  LISTO: {
    ring: "ring-lime-500",
    badge: "bg-lime-500 text-brand-ink",
    label: "Listo para servir",
  },
  PAGANDO: {
    ring: "ring-red-500",
    badge: "bg-red-500 text-white",
    label: "Pagando",
  },
  POR_LIMPIAR: {
    ring: "ring-zinc-400",
    badge: "bg-zinc-400 text-white",
    label: "Por limpiar",
  },
};

const MADERA_MESA =
  "linear-gradient(135deg, #a9713f 0%, #8a5a30 45%, #6d4423 100%)";

function tamanoMesa(capacidad: number): number {
  return Math.min(128, 60 + Math.max(0, capacidad - 2) * 9);
}

function posicionesSillas(capacidad: number, radio: number): { x: number; y: number }[] {
  const n = Math.min(Math.max(capacidad, 1), 10);
  return Array.from({ length: n }, (_, i) => {
    const angulo = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: Math.cos(angulo) * radio, y: Math.sin(angulo) * radio };
  });
}

const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, { estado: EstadoPedido; label: string }>> = {
  RECEIVED: { estado: "ACCEPTED", label: "Aceptar" },
  ACCEPTED: { estado: "PREPARING", label: "Empezar preparación" },
  PREPARING: { estado: "READY", label: "Marcar listo" },
  READY: { estado: "DELIVERED", label: "Entregado" },
};

const ESTADO_LABEL: Record<EstadoPedido, string> = {
  RECEIVED: "Recibido",
  ACCEPTED: "Aceptado",
  PREPARING: "En preparación",
  READY: "Listo",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

function estadoMesa(mesa: MesaEstadoAdmin, reservada: boolean, enVivo: boolean): EstadoMesa {
  if (enVivo) {
    const activos = mesa.pedidos_hoy.filter((p) => ACTIVOS.includes(p.estado));
    if (activos.some((p) => p.estado === "RECEIVED")) return "ESPERANDO_PEDIDO";
    if (activos.some((p) => p.estado === "ACCEPTED" || p.estado === "PREPARING")) {
      return "EN_PREPARACION";
    }
    if (activos.some((p) => p.estado === "READY")) return "LISTO";
    if (mesa.pagando) return "PAGANDO";
    if (mesa.ocupada) return "OCUPADA";
    if (mesa.por_limpiar) return "POR_LIMPIAR";
  }
  if (reservada) return "RESERVADA";
  return "LIBRE";
}

const COLS = 5;
const MARGEN = 10;

function posicionAuto(index: number): { x: number; y: number } {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const x = COLS > 1 ? MARGEN + (col / (COLS - 1)) * (100 - 2 * MARGEN) : 50;
  const y = 18 + row * 26;
  return { x, y };
}

function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
}

function nowHHMM(): string {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function imprimirCuentaMesa(mesa: MesaEstadoAdmin) {
  const total = mesa.pedidos_hoy.reduce((sum, p) => sum + p.total_centimos, 0);
  const filas = mesa.pedidos_hoy
    .flatMap((p) => p.items)
    .map(
      (item) =>
        `<tr><td>${item.cantidad} × ${escapeHtml(item.producto_nombre)}</td><td style="text-align:right">${formatCentimos(item.precio_unitario_centimos * item.cantidad)} €</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Mesa ${mesa.numero}</title>
    <style>
      body { font-family: sans-serif; padding: 24px; max-width: 360px; color: #1F1B1A; }
      h2 { margin-bottom: 0; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 16px; }
      td { padding: 4px 0; }
      tfoot td { border-top: 1px solid #1F1B1A; font-weight: bold; padding-top: 8px; }
    </style></head>
    <body>
      <h2>Palomita Bar</h2>
      <p>Mesa ${mesa.numero}${mesa.nombre ? ` · ${escapeHtml(mesa.nombre)}` : ""}</p>
      <table><tbody>${filas || "<tr><td>Sin líneas</td></tr>"}</tbody>
      <tfoot><tr><td>Total</td><td style="text-align:right">${formatCentimos(total)} €</td></tr></tfoot></table>
    </body></html>`;

  const ventana = window.open("", "_blank", "width=400,height=600");
  if (!ventana) return;
  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
  ventana.print();
}

export function SalonBoard({ mesasIniciales }: { mesasIniciales: MesaEstadoAdmin[] }) {
  const [mesas, setMesas] = useState<MesaEstadoAdmin[]>(mesasIniciales);
  const [zonas, setZonas] = useState<ZonaAdmin[]>([]);
  const [camareros, setCamareros] = useState<CamareroAdmin[]>([]);
  const [reservas, setReservas] = useState<ReservaAdmin[]>([]);
  const [zonaActivaId, setZonaActivaId] = useState<string | null>(null);
  const [fecha, setFecha] = useState(todayISO());
  const [hora, setHora] = useState(nowHHMM());
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [estadosOcultos, setEstadosOcultos] = useState<Set<EstadoMesa>>(new Set());
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [modoUnion, setModoUnion] = useState(false);
  const [seleccionUnion, setSeleccionUnion] = useState<string[]>([]);
  const [mostrarReserva, setMostrarReserva] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [sentarForm, setSentarForm] = useState(false);
  const [clientesForm, setClientesForm] = useState("2");
  const [camareroForm, setCamareroForm] = useState("");
  const [cambiarMesaAbierto, setCambiarMesaAbierto] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ id: string; pointerId: number; moved: boolean } | null>(null);
  const [posicionesArrastre, setPosicionesArrastre] = useState<Record<string, { x: number; y: number }>>(
    {},
  );
  const primerRender = useRef(true);

  const esHoy = fecha === todayISO();

  const refetch = useCallback(async () => {
    try {
      const data = await getMesasEstadoAdmin(fecha);
      setMesas(data);
      setErrorCarga(false);
    } catch {
      setErrorCarga(true);
    }
  }, [fecha]);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      if (mesasIniciales.length > 0 && esHoy) return;
    }
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch]);

  useEffect(() => {
    getZonasAdmin()
      .then(setZonas)
      .catch(() => {});
    getCamarerosAdmin()
      .then(setCamareros)
      .catch(() => {});
  }, []);

  useEffect(() => {
    getReservasAdmin(fecha)
      .then(setReservas)
      .catch(() => {});
  }, [fecha]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("salon-mesas")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "restaurant", table: "pedidos" },
        () => {
          playNewOrderChime();
          refetch();
        },
      )
      .on("postgres_changes", { event: "UPDATE", schema: "restaurant", table: "pedidos" }, () =>
        refetch(),
      )
      .on("postgres_changes", { event: "*", schema: "restaurant", table: "pedido_items" }, () =>
        refetch(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  useEffect(() => {
    setSentarForm(false);
    setCambiarMesaAbierto(false);
    setMenuAbierto(false);
    setModoUnion(false);
    setSeleccionUnion([]);
    setAccionError(null);
  }, [mesaSeleccionadaId]);

  const mesaSeleccionada = useMemo(
    () => mesas.find((m) => m.id === mesaSeleccionadaId) ?? null,
    [mesas, mesaSeleccionadaId],
  );

  const reservaDeMesa = useCallback(
    (mesaId: string) => reservas.find((r) => r.mesa_id === mesaId && r.estado === "CONFIRMADA"),
    [reservas],
  );

  const mesasVisibles = useMemo(
    () => (zonaActivaId ? mesas.filter((m) => m.zona_id === zonaActivaId) : mesas),
    [mesas, zonaActivaId],
  );

  const stats = useMemo(() => {
    let libres = 0;
    let ocupadas = 0;
    let reservadas = 0;
    let clientes = 0;
    mesasVisibles.forEach((m) => {
      const estado = estadoMesa(m, !!reservaDeMesa(m.id), esHoy);
      if (estado === "LIBRE") libres += 1;
      else if (estado === "RESERVADA") reservadas += 1;
      else ocupadas += 1;
      clientes += m.clientes_sentados;
    });
    const total = mesasVisibles.length;
    const ocupacionPct = total > 0 ? Math.round((ocupadas / total) * 100) : 0;
    return { total, libres, ocupadas, reservadas, clientes, ocupacionPct };
  }, [mesasVisibles, reservaDeMesa, esHoy]);

  const avanzar = async (pedidoId: string, nuevoEstado: EstadoPedido) => {
    setActualizando(pedidoId);
    try {
      await avanzarPedidoAdmin(pedidoId, nuevoEstado);
      await refetch();
    } finally {
      setActualizando(null);
    }
  };

  const posicionMesa = (mesa: MesaEstadoAdmin, index: number): { x: number; y: number } => {
    const enArrastre = posicionesArrastre[mesa.id];
    if (enArrastre) return enArrastre;
    if (mesa.pos_x !== null && mesa.pos_y !== null) return { x: mesa.pos_x, y: mesa.pos_y };
    return posicionAuto(index);
  };

  const handlePointerDown = (mesa: MesaEstadoAdmin, e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { id: mesa.id, pointerId: e.pointerId, moved: false };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = arrastre.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.min(97, Math.max(3, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(94, Math.max(6, ((e.clientY - rect.top) / rect.height) * 100));

    drag.moved = true;
    setPosicionesArrastre((prev) => ({ ...prev, [drag.id]: { x, y } }));
  };

  const handlePointerUp = async () => {
    const drag = arrastre.current;
    arrastre.current = null;
    if (!drag) return;

    if (!drag.moved) {
      if (modoUnion) {
        setSeleccionUnion((prev) =>
          prev.includes(drag.id) ? prev.filter((id) => id !== drag.id) : [...prev, drag.id],
        );
      } else {
        setMesaSeleccionadaId(drag.id);
      }
      return;
    }

    const pos = posicionesArrastre[drag.id];
    if (pos) {
      try {
        await actualizarMesaPosicionAdmin(drag.id, pos.x, pos.y);
        await refetch();
      } catch {
        // deja la posición optimista en pantalla aunque falle el guardado
      }
    }
  };

  const handleSentarConfirmar = async (mesa: MesaEstadoAdmin) => {
    try {
      await sentarMesaAdmin(mesa.id, Number(clientesForm) || 1, camareroForm || null);
      setSentarForm(false);
      setClientesForm("2");
      setCamareroForm("");
      await refetch();
    } catch {
      setAccionError("No se ha podido sentar la mesa.");
    }
  };

  const handleLiberar = async (mesa: MesaEstadoAdmin) => {
    try {
      await liberarMesaAdmin(mesa.id);
      await refetch();
    } catch {
      setAccionError("No se ha podido liberar la mesa.");
    }
  };

  const handleTogglePagando = async (mesa: MesaEstadoAdmin) => {
    try {
      await marcarMesaPagandoAdmin(mesa.id, !mesa.pagando);
      setMenuAbierto(false);
      await refetch();
    } catch {
      setAccionError("No se ha podido actualizar el cobro.");
    }
  };

  const handleMarcarLimpia = async (mesa: MesaEstadoAdmin) => {
    try {
      await marcarMesaLimpiaAdmin(mesa.id);
      setMenuAbierto(false);
      await refetch();
    } catch {
      setAccionError("No se ha podido marcar como limpia.");
    }
  };

  const handleConfirmarUnion = async () => {
    if (seleccionUnion.length < 2) return;
    try {
      await unirMesasAdmin(seleccionUnion);
      setModoUnion(false);
      setSeleccionUnion([]);
      await refetch();
    } catch {
      setAccionError("No se han podido unir las mesas.");
    }
  };

  const handleSepararGrupo = async (mesa: MesaEstadoAdmin) => {
    if (!mesa.union_grupo_id) return;
    try {
      await separarGrupoMesasAdmin(mesa.union_grupo_id);
      await refetch();
    } catch {
      setAccionError("No se han podido separar las mesas.");
    }
  };

  const handleCambiarMesa = async (origen: MesaEstadoAdmin, destinoId: string) => {
    try {
      await cambiarMesaAdmin(origen.id, destinoId);
      setCambiarMesaAbierto(false);
      await refetch();
      setMesaSeleccionadaId(destinoId);
    } catch {
      setAccionError("No se ha podido cambiar de mesa.");
    }
  };

  const handleCrearMesaRapida = async () => {
    const siguienteNumero = mesas.reduce((max, m) => Math.max(max, m.numero), 0) + 1;
    try {
      const nueva = await crearMesaAdmin(siguienteNumero, undefined, zonaActivaId, 4);
      await refetch();
      setMesaSeleccionadaId(nueva.id);
    } catch {
      setAccionError("No se ha podido crear la mesa.");
    }
  };

  const handleEliminarMesa = async (mesa: MesaEstadoAdmin) => {
    if (!confirm(`¿Eliminar la mesa ${mesa.numero}? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarMesaAdmin(mesa.id);
      setMesaSeleccionadaId(null);
      await refetch();
    } catch {
      setAccionError("No se ha podido eliminar la mesa.");
    }
  };

  const handleCambiarCapacidad = async (mesa: MesaEstadoAdmin, delta: number) => {
    const nueva = Math.min(20, Math.max(1, mesa.capacidad + delta));
    if (nueva === mesa.capacidad) return;
    try {
      await actualizarMesaCapacidadAdmin(mesa.id, nueva);
      await refetch();
    } catch {
      setAccionError("No se ha podido cambiar el aforo.");
    }
  };

  const toggleFiltroEstado = (estado: EstadoMesa) => {
    setEstadosOcultos((prev) => {
      const next = new Set(prev);
      if (next.has(estado)) next.delete(estado);
      else next.add(estado);
      return next;
    });
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setZonaActivaId(null)}
            className={`px-4 py-2 text-xs uppercase tracking-widest2 transition-colors ${
              zonaActivaId === null
                ? "bg-brand-black text-brand-cream"
                : "border border-brand-black/20 text-brand-ink/60"
            }`}
          >
            Todas
          </button>
          {zonas.map((zona) => (
            <button
              key={zona.id}
              type="button"
              onClick={() => setZonaActivaId(zona.id)}
              className={`px-4 py-2 text-xs uppercase tracking-widest2 transition-colors ${
                zonaActivaId === zona.id
                  ? "bg-brand-black text-brand-cream"
                  : "border border-brand-black/20 text-brand-ink/60"
              }`}
            >
              {zona.nombre}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value || todayISO())}
            className="border border-brand-black/20 px-3 py-2 text-xs"
          />
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="border border-brand-black/20 px-3 py-2 text-xs"
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => setFiltrosAbiertos((v) => !v)}
              className="border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-widest2 text-brand-ink/60"
            >
              Filtros{estadosOcultos.size > 0 ? ` (${estadosOcultos.size})` : ""}
            </button>
            {filtrosAbiertos ? (
              <div className="absolute right-0 z-10 mt-1 w-56 border border-brand-black/10 bg-white p-3 shadow-lg">
                {(Object.keys(ESTILO_MESA) as EstadoMesa[]).map((estado) => (
                  <label key={estado} className="flex items-center gap-2 py-1 text-xs">
                    <input
                      type="checkbox"
                      checked={!estadosOcultos.has(estado)}
                      onChange={() => toggleFiltroEstado(estado)}
                    />
                    <span className={`h-2 w-2 rounded-full ${ESTILO_MESA[estado].badge}`} />
                    {ESTILO_MESA[estado].label}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setMostrarReserva(true)}
            className="bg-brand-pink px-4 py-2 text-xs uppercase tracking-widest2 text-white hover:bg-brand-pink-dark"
          >
            + Nueva reserva
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-widest2 text-brand-ink/60">
            {(Object.keys(ESTILO_MESA) as EstadoMesa[]).map((estado) => (
              <span key={estado} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full border ${ESTILO_MESA[estado].badge}`} />
                {ESTILO_MESA[estado].label}
              </span>
            ))}
          </div>

          {errorCarga ? (
            <div className="mt-3 flex items-center justify-between border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <span>No se han podido cargar las mesas.</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="text-xs uppercase tracking-widest2 underline"
              >
                Reintentar
              </button>
            </div>
          ) : mesas.length === 0 ? (
            <p className="mt-3 text-sm text-brand-ink/50">Cargando mesas…</p>
          ) : null}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-brand-ink/40">
              {modoUnion
                ? "Modo unión: pulsa las mesas que quieres juntar y confirma en el panel."
                : "Arrastra las mesas para colocarlas como en el local. Pulsa una mesa para ver o tomar pedidos."}
            </p>
            <button
              type="button"
              onClick={handleCrearMesaRapida}
              className="shrink-0 bg-brand-black px-4 py-2 text-xs uppercase tracking-widest2 text-brand-cream hover:bg-brand-pink"
            >
              + Añadir mesa
            </button>
          </div>

          <div
            ref={canvasRef}
            className="relative mt-2 h-[560px] select-none overflow-hidden border border-brand-black/10 bg-[radial-gradient(ellipse_at_center,_#3a3230_0%,_#221c1a_70%,_#141110_100%)]"
          >
            {mesasVisibles.map((mesa, index) => {
              const estado = estadoMesa(mesa, !!reservaDeMesa(mesa.id), esHoy);
              if (estadosOcultos.has(estado)) return null;
              const estilo = ESTILO_MESA[estado];
              const pos = posicionMesa(mesa, index);
              const pendientes = mesa.pedidos_hoy.filter((p) => p.estado === "RECEIVED").length;
              const enSeleccionUnion = seleccionUnion.includes(mesa.id);
              const tamano = tamanoMesa(mesa.capacidad);
              const sillas = posicionesSillas(mesa.capacidad, tamano / 2 + 12);

              return (
                <button
                  key={mesa.id}
                  type="button"
                  onPointerDown={(e) => handlePointerDown(mesa, e)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: tamano, height: tamano }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab transition-transform active:cursor-grabbing ${
                    mesaSeleccionadaId === mesa.id || enSeleccionUnion
                      ? "z-10 scale-105"
                      : ""
                  }`}
                >
                  {sillas.map((silla, i) => (
                    <span
                      key={i}
                      style={{ left: `calc(50% + ${silla.x}px)`, top: `calc(50% + ${silla.y}px)` }}
                      className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-[#4a3a2c] shadow"
                    />
                  ))}
                  <div
                    style={{ background: MADERA_MESA }}
                    className={`relative flex h-full w-full flex-col items-center justify-center rounded-md shadow-lg shadow-black/60 ring-4 ${estilo.ring} ${
                      mesaSeleccionadaId === mesa.id || enSeleccionUnion ? "ring-offset-2 ring-offset-brand-pink" : ""
                    }`}
                  >
                    <span
                      className={`absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${estilo.badge}`}
                    >
                      {mesa.numero}
                    </span>
                    {mesa.nombre ? (
                      <span className="max-w-[80%] truncate text-[9px] uppercase tracking-widest2 text-white/80">
                        {mesa.nombre}
                      </span>
                    ) : null}
                    {pendientes > 0 ? (
                      <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-pink text-[10px] font-medium text-white">
                        {pendientes}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 border border-brand-black/10 bg-white p-4 sm:grid-cols-6">
            <div>
              <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">Total mesas</p>
              <p className="font-display text-2xl">{stats.total}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">Libres</p>
              <p className="font-display text-2xl text-emerald-600">{stats.libres}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">Ocupadas</p>
              <p className="font-display text-2xl">{stats.ocupadas}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">Reservadas</p>
              <p className="font-display text-2xl text-blue-600">{stats.reservadas}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">Clientes</p>
              <p className="font-display text-2xl">{stats.clientes}</p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="relative h-12 w-12 shrink-0 rounded-full"
                style={{
                  background: `conic-gradient(#141110 ${stats.ocupacionPct}%, #F1EAE0 ${stats.ocupacionPct}%)`,
                }}
              >
                <div className="absolute inset-1 flex items-center justify-center rounded-full bg-brand-cream text-[10px] font-medium">
                  {stats.ocupacionPct}%
                </div>
              </div>
              <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">Ocupación</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-brand-black/10 bg-white p-4">
            {!mesaSeleccionada ? (
              <p className="text-sm text-brand-ink/50">
                Selecciona una mesa para ver sus pedidos de hoy o tomar un pedido nuevo.
              </p>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl">
                      Mesa {mesaSeleccionada.numero}
                      {mesaSeleccionada.nombre ? ` · ${mesaSeleccionada.nombre}` : ""}
                    </h2>
                    <span
                      className={`mt-1 inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest2 ${
                        ESTILO_MESA[estadoMesa(mesaSeleccionada, !!reservaDeMesa(mesaSeleccionada.id), esHoy)]
                          .badge
                      }`}
                    >
                      {
                        ESTILO_MESA[
                          estadoMesa(mesaSeleccionada, !!reservaDeMesa(mesaSeleccionada.id), esHoy)
                        ].label
                      }
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMesaSeleccionadaId(null)}
                    className="text-xs uppercase tracking-widest2 text-brand-ink/40 hover:text-brand-pink"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-widest2 text-brand-ink/40">Capacidad</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCambiarCapacidad(mesaSeleccionada, -1)}
                        className="flex h-5 w-5 items-center justify-center border border-brand-black/20 text-xs"
                      >
                        −
                      </button>
                      <p>{mesaSeleccionada.capacidad} personas</p>
                      <button
                        type="button"
                        onClick={() => handleCambiarCapacidad(mesaSeleccionada, 1)}
                        className="flex h-5 w-5 items-center justify-center border border-brand-black/20 text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest2 text-brand-ink/40">Clientes</p>
                    <p>{mesaSeleccionada.clientes_sentados}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest2 text-brand-ink/40">Entrada</p>
                    <p>
                      {mesaSeleccionada.entrada_at
                        ? new Date(mesaSeleccionada.entrada_at).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest2 text-brand-ink/40">Camarero</p>
                    <p>{mesaSeleccionada.camarero_nombre ?? "-"}</p>
                  </div>
                </div>

                {accionError ? <p className="mt-3 text-sm text-red-600">{accionError}</p> : null}

                {!esHoy ? (
                  <p className="mt-3 text-xs text-brand-ink/50">
                    Estás viendo otra fecha: solo puedes crear reservas, no gestionar el servicio en vivo.
                  </p>
                ) : null}

                {esHoy && modoUnion ? (
                  <div className="mt-4 border border-brand-pink/40 bg-brand-pink/5 p-3">
                    <p className="text-xs">
                      Mesas seleccionadas: {seleccionUnion.length > 0 ? seleccionUnion.length : 0}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmarUnion}
                        disabled={seleccionUnion.length < 2}
                        className="flex-1 bg-brand-black py-2 text-xs uppercase tracking-widest2 text-brand-cream disabled:opacity-50"
                      >
                        Confirmar unión
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModoUnion(false);
                          setSeleccionUnion([]);
                        }}
                        className="flex-1 border border-brand-black/20 py-2 text-xs uppercase tracking-widest2"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}

                {esHoy && sentarForm ? (
                  <div className="mt-4 border border-brand-black/10 p-3">
                    <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">
                      Sentar clientes
                    </p>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="number"
                        min={1}
                        value={clientesForm}
                        onChange={(e) => setClientesForm(e.target.value)}
                        placeholder="Clientes"
                        className="w-20 border border-brand-black/20 px-2 py-1.5 text-sm"
                      />
                      <select
                        value={camareroForm}
                        onChange={(e) => setCamareroForm(e.target.value)}
                        className="flex-1 border border-brand-black/20 px-2 py-1.5 text-sm"
                      >
                        <option value="">Sin camarero</option>
                        {camareros
                          .filter((c) => c.activo)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre}
                            </option>
                          ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSentarConfirmar(mesaSeleccionada)}
                      className="mt-2 w-full bg-brand-black py-2 text-xs uppercase tracking-widest2 text-brand-cream"
                    >
                      Confirmar
                    </button>
                  </div>
                ) : null}

                {esHoy && cambiarMesaAbierto ? (
                  <div className="mt-4 border border-brand-black/10 p-3">
                    <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">
                      Mover a mesa libre
                    </p>
                    <select
                      onChange={(e) => e.target.value && handleCambiarMesa(mesaSeleccionada, e.target.value)}
                      defaultValue=""
                      className="mt-2 w-full border border-brand-black/20 px-2 py-1.5 text-sm"
                    >
                      <option value="" disabled>
                        Selecciona una mesa
                      </option>
                      {mesas
                        .filter((m) => !m.ocupada && m.id !== mesaSeleccionada.id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            Mesa {m.numero}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : null}

                {esHoy ? (
                  <div className="relative mt-4 grid grid-cols-2 gap-2">
                    {mesaSeleccionada.ocupada ? (
                      <button
                        type="button"
                        onClick={() => handleLiberar(mesaSeleccionada)}
                        className="border border-brand-black/20 py-2 text-xs uppercase tracking-widest2 hover:bg-brand-sand"
                      >
                        Liberar mesa
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSentarForm((v) => !v)}
                        className="bg-brand-black py-2 text-xs uppercase tracking-widest2 text-brand-cream"
                      >
                        Sentar clientes
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setMostrarReserva(true)}
                      className="border border-brand-black/20 py-2 text-xs uppercase tracking-widest2 hover:bg-brand-sand"
                    >
                      Reservar
                    </button>

                    {mesaSeleccionada.union_grupo_id ? (
                      <button
                        type="button"
                        onClick={() => handleSepararGrupo(mesaSeleccionada)}
                        className="border border-brand-black/20 py-2 text-xs uppercase tracking-widest2 hover:bg-brand-sand"
                      >
                        Separar mesas
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setModoUnion(true);
                          setSeleccionUnion([mesaSeleccionada.id]);
                        }}
                        className="border border-brand-black/20 py-2 text-xs uppercase tracking-widest2 hover:bg-brand-sand"
                      >
                        Unir mesas
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setCambiarMesaAbierto((v) => !v)}
                      className="border border-brand-black/20 py-2 text-xs uppercase tracking-widest2 hover:bg-brand-sand"
                    >
                      Cambiar mesa
                    </button>

                    <button
                      type="button"
                      onClick={() => imprimirCuentaMesa(mesaSeleccionada)}
                      className="border border-brand-black/20 py-2 text-xs uppercase tracking-widest2 hover:bg-brand-sand"
                    >
                      Imprimir cuenta
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuAbierto((v) => !v)}
                        className="w-full border border-brand-black/20 py-2 text-xs uppercase tracking-widest2 hover:bg-brand-sand"
                      >
                        Más opciones
                      </button>
                      {menuAbierto ? (
                        <div className="absolute right-0 z-10 mt-1 w-48 border border-brand-black/10 bg-white p-2 shadow-lg">
                          <button
                            type="button"
                            onClick={() => handleTogglePagando(mesaSeleccionada)}
                            className="block w-full px-2 py-1.5 text-left text-xs uppercase tracking-widest2 hover:bg-brand-sand"
                          >
                            {mesaSeleccionada.pagando ? "Quitar cobro" : "Marcar pagando"}
                          </button>
                          {mesaSeleccionada.por_limpiar ? (
                            <button
                              type="button"
                              onClick={() => handleMarcarLimpia(mesaSeleccionada)}
                              className="block w-full px-2 py-1.5 text-left text-xs uppercase tracking-widest2 hover:bg-brand-sand"
                            >
                              Marcar como limpia
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleEliminarMesa(mesaSeleccionada)}
                            className="block w-full px-2 py-1.5 text-left text-xs uppercase tracking-widest2 text-red-600 hover:bg-red-50"
                          >
                            Eliminar mesa
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMostrarReserva(true)}
                    className="mt-4 w-full bg-brand-pink py-2 text-xs uppercase tracking-widest2 text-white hover:bg-brand-pink-dark"
                  >
                    Reservar esta mesa
                  </button>
                )}

                {esHoy && mesaSeleccionada.pedidos_hoy.length === 0 ? (
                  <p className="mt-4 text-sm text-brand-ink/50">Sin pedidos hoy en esta mesa.</p>
                ) : esHoy ? (
                  <div className="mt-4 space-y-4">
                    {mesaSeleccionada.pedidos_hoy.map((pedido: PedidoMesaAdmin) => {
                      const siguiente = SIGUIENTE_ESTADO[pedido.estado];
                      const hora2 = new Date(pedido.created_at).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div key={pedido.id} className="border border-brand-black/10 p-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="uppercase tracking-widest2 text-brand-ink/50">
                              {ESTADO_LABEL[pedido.estado]}
                            </span>
                            <span className="text-brand-ink/50">{hora2}</span>
                          </div>
                          {pedido.participante_nombre ? (
                            <p className="text-xs text-brand-ink/50">
                              Pedido de {pedido.participante_nombre}
                            </p>
                          ) : null}

                          <ul className="mt-2 space-y-1 text-sm">
                            {pedido.items.map((item, index) => (
                              <li key={index} className="flex justify-between">
                                <span>
                                  {item.cantidad} × {item.producto_nombre}
                                  {item.notas ? (
                                    <span className="block text-xs text-brand-ink/50">
                                      {item.notas}
                                    </span>
                                  ) : null}
                                </span>
                                <span>
                                  {formatCentimos(item.precio_unitario_centimos * item.cantidad)} €
                                </span>
                              </li>
                            ))}
                          </ul>

                          {pedido.notas ? (
                            <p className="mt-2 text-xs text-brand-ink/60">Notas: {pedido.notas}</p>
                          ) : null}

                          <div className="mt-2 flex items-center justify-between border-t border-brand-black/10 pt-2 text-sm font-medium">
                            <span>Total</span>
                            <span>{formatCentimos(pedido.total_centimos)} €</span>
                          </div>

                          {siguiente ? (
                            <button
                              type="button"
                              disabled={actualizando === pedido.id}
                              onClick={() => avanzar(pedido.id, siguiente.estado)}
                              className="mt-3 w-full bg-brand-black py-2 text-xs uppercase tracking-widest2 text-brand-cream transition-colors hover:bg-brand-pink disabled:opacity-50"
                            >
                              {actualizando === pedido.id ? "…" : siguiente.label}
                            </button>
                          ) : null}
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-between border-t border-brand-black/10 pt-3 font-display text-lg">
                      <span>Cuenta de la mesa</span>
                      <span>
                        {formatCentimos(
                          mesaSeleccionada.pedidos_hoy.reduce((sum, p) => sum + p.total_centimos, 0),
                        )}{" "}
                        €
                      </span>
                    </div>
                  </div>
                ) : null}

                {esHoy ? (
                  <PedidoRapidoForm
                    mesaIdentificador={mesaSeleccionada.identificador}
                    onPedidoCreado={refetch}
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {mostrarReserva ? (
        <ReservaModal
          fechaInicial={fecha}
          horaInicial={hora}
          mesaIdInicial={mesaSeleccionada?.id}
          zonaIdInicial={mesaSeleccionada?.zona_id}
          zonas={zonas}
          mesas={mesas}
          onClose={() => setMostrarReserva(false)}
          onCreated={async () => {
            const data = await getReservasAdmin(fecha);
            setReservas(data);
          }}
        />
      ) : null}
    </div>
  );
}
