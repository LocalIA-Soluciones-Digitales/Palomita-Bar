"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import QRCode from "qrcode";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Mesa3D } from "@/components/admin/Floorplan3D";

const Floorplan3D = dynamic(() => import("@/components/admin/Floorplan3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-noche-ink-muted">
      Cargando plano 3D…
    </div>
  ),
});
import { formatCentimos } from "@/lib/format";
import { playNewOrderChime } from "@/lib/notify-sound";
import {
  actualizarMesaCapacidadAdmin,
  actualizarMesaNotaAdmin,
  atenderAvisoCamareroAdmin,
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
import { etiquetasMesas, prefijoZona } from "@/lib/restaurant/mesa-label";
import { PedidoRapidoForm } from "@/components/admin/PedidoRapidoForm";
import { ReservaModal } from "@/components/admin/ReservaModal";
import {
  BellIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  LinkIcon,
  LogoutIcon,
  MinusIcon,
  MoreIcon,
  PlusIcon,
  PrinterIcon,
  QrCodeIcon,
  RefreshIcon,
  SwapIcon,
  TagIcon,
  TrashIcon,
  UnlinkIcon,
  UsersIcon,
} from "@/components/icons";
import type {
  CamareroAdmin,
  MesaEstadoAdmin,
  PedidoMesaAdmin,
  ReservaAdmin,
  ZonaAdmin,
} from "@/lib/restaurant/admin-types";
import type { EstadoPedido } from "@/lib/restaurant/types";

export type EstadoMesa =
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
    badge: "bg-lime-500 text-zinc-950",
    label: "Listo para servir",
  },
  PAGANDO: {
    ring: "ring-noche-danger",
    badge: "bg-noche-danger text-white",
    label: "Pagando",
  },
  POR_LIMPIAR: {
    ring: "ring-zinc-400",
    badge: "bg-zinc-400 text-white",
    label: "Por limpiar",
  },
};

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function pedirUrl(identificador: string): string {
  return `${SITE_URL}/pedir?mesa=${identificador}`;
}

const ALERTA_ESPERA_MIN = 8;
const ALERTA_PAGO_MIN = 6;

function minutosDesde(iso: string, ahoraMs: number): number {
  return Math.max(0, Math.round((ahoraMs - new Date(iso).getTime()) / 60000));
}

function formatoTranscurrido(iso: string, ahoraMs: number): string {
  const mins = minutosDesde(iso, ahoraMs);
  if (mins < 60) return `hace ${mins} min`;
  return `hace ${Math.floor(mins / 60)}h ${mins % 60}min`;
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

function imprimirCuentaMesa(mesa: MesaEstadoAdmin, etiqueta: string) {
  const total = mesa.pedidos_hoy.reduce((sum, p) => sum + p.total_centimos, 0);
  const filas = mesa.pedidos_hoy
    .flatMap((p) => p.items)
    .map(
      (item) =>
        `<tr><td>${item.cantidad} × ${escapeHtml(item.producto_nombre)}</td><td style="text-align:right">${formatCentimos(item.precio_unitario_centimos * item.cantidad)} €</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Mesa ${etiqueta}</title>
    <style>
      body { font-family: sans-serif; padding: 24px; max-width: 360px; color: #1F1B1A; }
      h2 { margin-bottom: 0; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 16px; }
      td { padding: 4px 0; }
      tfoot td { border-top: 1px solid #1F1B1A; font-weight: bold; padding-top: 8px; }
    </style></head>
    <body>
      <h2>Palomita Bar</h2>
      <p>Mesa ${etiqueta}${mesa.nombre ? ` · ${escapeHtml(mesa.nombre)}` : ""}</p>
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

function StatTile({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-noche-border bg-noche-surface px-4 py-3 text-center">
      <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl ${valueClassName ?? "text-noche-ink"}`}>{value}</p>
    </div>
  );
}

function OcupacionTile({ pct }: { pct: number }) {
  return (
    <div className="rounded-lg border border-noche-border bg-noche-surface px-4 py-3 text-center">
      <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Ocupación</p>
      <div
        className="relative mx-auto mt-1 h-11 w-11 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(oklch(var(--noche-primary)) ${pct}%, oklch(var(--noche-surface-2)) ${pct}%)`,
        }}
      >
        <div className="absolute inset-1 flex items-center justify-center rounded-full bg-noche-surface text-[10px] font-medium text-noche-ink">
          {pct}%
        </div>
      </div>
    </div>
  );
}

function AccionMesa({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: (props: { className?: string }) => ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-lg px-1 py-2.5 text-center text-[10px] uppercase leading-tight tracking-widest2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "bg-noche-danger/10 text-noche-danger hover:bg-noche-danger/15"
          : "bg-noche-surface-2 text-noche-ink hover:bg-noche-surface-3"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
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
  const [vistaSuperior, setVistaSuperior] = useState(false);
  const [notaForm, setNotaForm] = useState("");
  const [notaGuardando, setNotaGuardando] = useState(false);
  const [qrAbierto, setQrAbierto] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());

  const [posicionesArrastre, setPosicionesArrastre] = useState<Record<string, { x: number; y: number }>>(
    {},
  );
  const primerRender = useRef(true);

  const esHoy = fecha === todayISO();

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

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
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "restaurant", table: "mesas" },
        (payload) => {
          // Solo suena aviso cuando aparece una llamada nueva (evita ruido
          // en cualquier otra actualización de la mesa: posición, aforo…).
          const antes = (payload.old as { aviso_camarero_at?: string | null } | null)
            ?.aviso_camarero_at;
          const despues = (payload.new as { aviso_camarero_at?: string | null } | null)
            ?.aviso_camarero_at;
          if (despues && despues !== antes) {
            playNewOrderChime();
          }
          refetch();
        },
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
    setQrAbierto(false);
    setQrDataUrl(null);
    setEnlaceCopiado(false);
  }, [mesaSeleccionadaId]);

  const mesaSeleccionada = useMemo(
    () => mesas.find((m) => m.id === mesaSeleccionadaId) ?? null,
    [mesas, mesaSeleccionadaId],
  );

  useEffect(() => {
    setNotaForm(mesaSeleccionada?.nota ?? "");
  }, [mesaSeleccionada?.id, mesaSeleccionada?.nota]);

  const alertaMesa = useMemo(() => {
    if (!mesaSeleccionada) return null;
    if (mesaSeleccionada.pagando && mesaSeleccionada.pagando_at) {
      const mins = minutosDesde(mesaSeleccionada.pagando_at, ahora);
      if (mins >= ALERTA_PAGO_MIN) return `Lleva ${mins} min pagando sin cerrar la cuenta.`;
    }
    const pendiente = mesaSeleccionada.pedidos_hoy.find((p) => p.estado === "RECEIVED");
    if (pendiente) {
      const mins = minutosDesde(pendiente.created_at, ahora);
      if (mins >= ALERTA_ESPERA_MIN) return `Lleva ${mins} min esperando que tomen su pedido.`;
    }
    return null;
  }, [mesaSeleccionada, ahora]);

  const reservaDeMesa = useCallback(
    (mesaId: string) => reservas.find((r) => r.mesa_id === mesaId && r.estado === "CONFIRMADA"),
    [reservas],
  );

  const mesasVisibles = useMemo(
    () => (zonaActivaId ? mesas.filter((m) => m.zona_id === zonaActivaId) : mesas),
    [mesas, zonaActivaId],
  );

  const etiquetaPorMesaId = useMemo(() => etiquetasMesas(mesas, zonas), [mesas, zonas]);

  const etiquetaMesa = useCallback(
    (mesa: MesaEstadoAdmin) => etiquetaPorMesaId.get(mesa.id) ?? String(mesa.numero),
    [etiquetaPorMesaId],
  );

  const posicionMesa = useCallback(
    (mesa: MesaEstadoAdmin, index: number): { x: number; y: number } => {
      const enArrastre = posicionesArrastre[mesa.id];
      if (enArrastre) return enArrastre;
      if (mesa.pos_x !== null && mesa.pos_y !== null) return { x: mesa.pos_x, y: mesa.pos_y };
      return posicionAuto(index);
    },
    [posicionesArrastre],
  );

  const mesasEscena = useMemo<Mesa3D[]>(
    () =>
      mesasVisibles.reduce<Mesa3D[]>((acc, mesa, index) => {
        const estado = estadoMesa(mesa, !!reservaDeMesa(mesa.id), esHoy);
        if (estadosOcultos.has(estado)) return acc;
        const pos = posicionMesa(mesa, index);
        acc.push({
          id: mesa.id,
          etiqueta: etiquetaMesa(mesa),
          nombre: mesa.nombre,
          capacidad: mesa.capacidad,
          estado,
          pendientes: mesa.pedidos_hoy.filter((p) => p.estado === "RECEIVED").length,
          grupoId: mesa.union_grupo_id,
          zonaPrefijo: prefijoZona(mesa.zona_id, zonas),
          x: pos.x,
          y: pos.y,
        });
        return acc;
      }, []),
    [mesasVisibles, reservaDeMesa, esHoy, posicionMesa, etiquetaMesa, estadosOcultos, zonas],
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

  const handleMesaSelect = (id: string) => {
    if (modoUnion) {
      setSeleccionUnion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setMesaSeleccionadaId(id);
    }
  };

  const handleMesaDragMove = (id: string, x: number, y: number) => {
    setPosicionesArrastre((prev) => ({ ...prev, [id]: { x, y } }));
  };

  const handleMesaDragEnd = async (id: string, x: number, y: number) => {
    setPosicionesArrastre((prev) => ({ ...prev, [id]: { x, y } }));
    try {
      await actualizarMesaPosicionAdmin(id, x, y);
      await refetch();
    } catch {
      // deja la posición optimista en pantalla aunque falle el guardado
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

  const handleAtenderAviso = async (mesaId: string) => {
    try {
      await atenderAvisoCamareroAdmin(mesaId);
      await refetch();
    } catch {
      setAccionError("No se ha podido marcar el aviso como atendido.");
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
    if (!confirm(`¿Eliminar la mesa ${etiquetaMesa(mesa)}? Esta acción no se puede deshacer.`)) return;
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

  const guardarNota = async (mesa: MesaEstadoAdmin) => {
    if (notaForm === (mesa.nota ?? "")) return;
    setNotaGuardando(true);
    try {
      await actualizarMesaNotaAdmin(mesa.id, notaForm);
      await refetch();
    } catch {
      setAccionError("No se ha podido guardar la nota.");
    } finally {
      setNotaGuardando(false);
    }
  };

  const abrirQr = async (mesa: MesaEstadoAdmin) => {
    setQrAbierto((v) => !v);
    if (!qrDataUrl) {
      try {
        setQrDataUrl(await QRCode.toDataURL(pedirUrl(mesa.identificador)));
      } catch {
        setAccionError("No se ha podido generar el QR.");
      }
    }
  };

  const copiarEnlaceMesa = async (mesa: MesaEstadoAdmin) => {
    try {
      await navigator.clipboard.writeText(pedirUrl(mesa.identificador));
      setEnlaceCopiado(true);
      setTimeout(() => setEnlaceCopiado(false), 2000);
    } catch {
      setAccionError("No se ha podido copiar el enlace.");
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
            className={`rounded-lg px-4 py-2 text-xs uppercase tracking-widest2 transition-colors ${
              zonaActivaId === null
                ? "bg-noche-primary/15 text-noche-primary"
                : "border border-noche-border text-noche-ink-muted"
            }`}
          >
            Todas
          </button>
          {zonas.map((zona) => (
            <button
              key={zona.id}
              type="button"
              onClick={() => setZonaActivaId(zona.id)}
              className={`rounded-lg px-4 py-2 text-xs uppercase tracking-widest2 transition-colors ${
                zonaActivaId === zona.id
                  ? "bg-noche-primary/15 text-noche-primary"
                  : "border border-noche-border text-noche-ink-muted"
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
            className="rounded-lg border border-noche-border bg-noche-surface px-3 py-2 text-xs text-noche-ink"
          />
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="rounded-lg border border-noche-border bg-noche-surface px-3 py-2 text-xs text-noche-ink"
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => setFiltrosAbiertos((v) => !v)}
              className="rounded-lg border border-noche-border px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink-muted"
            >
              Filtros{estadosOcultos.size > 0 ? ` (${estadosOcultos.size})` : ""}
            </button>
            {filtrosAbiertos ? (
              <div className="absolute right-0 z-10 mt-1 w-56 rounded-lg border border-noche-border bg-noche-surface p-3 shadow-lg">
                {(Object.keys(ESTILO_MESA) as EstadoMesa[]).map((estado) => (
                  <label key={estado} className="flex items-center gap-2 py-1 text-xs text-noche-ink">
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
            className="flex items-center gap-1.5 rounded-lg bg-noche-primary px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink hover:bg-noche-primary-dark"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Nueva reserva
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {errorCarga ? (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-noche-danger/30 bg-noche-danger/10 px-3 py-2 text-sm text-noche-danger">
              <span>No se han podido cargar las mesas.</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="flex items-center gap-1 text-xs uppercase tracking-widest2 underline"
              >
                <RefreshIcon className="h-3 w-3" />
                Reintentar
              </button>
            </div>
          ) : mesas.length === 0 ? (
            <p className="mt-3 text-sm text-noche-ink-muted">Cargando mesas…</p>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-noche-ink-faint">
              {modoUnion
                ? "Modo unión: pulsa las mesas que quieres juntar y confirma en el panel."
                : "Arrastra las mesas para colocarlas como en el local. Pulsa una mesa para ver o tomar pedidos."}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex overflow-hidden rounded-lg border border-noche-border text-xs uppercase tracking-widest2">
                <button
                  type="button"
                  onClick={() => setVistaSuperior(false)}
                  className={`px-3 py-2 ${!vistaSuperior ? "bg-noche-primary/15 text-noche-primary" : "text-noche-ink-muted"}`}
                >
                  3D
                </button>
                <button
                  type="button"
                  onClick={() => setVistaSuperior(true)}
                  className={`px-3 py-2 ${vistaSuperior ? "bg-noche-primary/15 text-noche-primary" : "text-noche-ink-muted"}`}
                >
                  Planta
                </button>
              </div>
              <button
                type="button"
                onClick={handleCrearMesaRapida}
                className="flex items-center gap-1.5 rounded-lg bg-noche-primary px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink hover:bg-noche-primary-dark"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Añadir mesa
              </button>
            </div>
          </div>

          <div className="relative mt-2 h-[560px] select-none overflow-hidden rounded-lg border border-noche-border bg-[radial-gradient(ellipse_at_center,_oklch(var(--noche-surface-2))_0%,_oklch(var(--noche-surface))_70%,_oklch(var(--noche-bg))_100%)]">
            <Floorplan3D
              mesas={mesasEscena}
              seleccionadaId={mesaSeleccionadaId}
              seleccionUnion={seleccionUnion}
              top={vistaSuperior}
              onSelect={handleMesaSelect}
              onDragMove={handleMesaDragMove}
              onDragEnd={handleMesaDragEnd}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile label="Total mesas" value={stats.total} />
            <StatTile label="Libres" value={stats.libres} valueClassName="text-noche-positive" />
            <StatTile label="Ocupadas" value={stats.ocupadas} />
            <StatTile label="Reservadas" value={stats.reservadas} valueClassName="text-blue-400" />
            <StatTile label="Clientes" value={stats.clientes} />
            <OcupacionTile pct={stats.ocupacionPct} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {mesas.some((m) => m.aviso_camarero_at) ? (
            <div className="rounded-lg border-2 border-noche-warning bg-noche-warning/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-noche-warning">
                <BellIcon className="h-4 w-4" />
                Camarero solicitado
              </p>
              <ul className="mt-2 space-y-1.5">
                {mesas
                  .filter((m) => m.aviso_camarero_at)
                  .map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => setMesaSeleccionadaId(m.id)}
                        className="text-noche-ink transition-colors hover:text-noche-primary"
                      >
                        {m.nombre ? `${m.nombre} (Mesa ${m.numero})` : `Mesa ${m.numero}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAtenderAviso(m.id)}
                        className="text-xs uppercase tracking-widest2 text-noche-ink-muted transition-colors hover:text-noche-primary"
                      >
                        Atendido
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-lg border border-noche-border bg-noche-surface p-4">
            {!mesaSeleccionada ? (
              <p className="text-sm text-noche-ink-muted">
                Selecciona una mesa para ver sus pedidos de hoy o tomar un pedido nuevo.
              </p>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl text-noche-ink">
                      Mesa {etiquetaMesa(mesaSeleccionada)}
                      {mesaSeleccionada.nombre ? ` · ${mesaSeleccionada.nombre}` : ""}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest2 ${
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
                      {mesaSeleccionada.sesion_modo === "SEPARADO" ? (
                        <span className="inline-block rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] uppercase tracking-widest2 text-violet-300">
                          Cada uno por separado
                        </span>
                      ) : null}
                    </div>
                    {alertaMesa ? (
                      <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">
                        <ClockIcon className="h-3 w-3 shrink-0" />
                        {alertaMesa}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuAbierto((v) => !v)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-noche-ink-faint hover:bg-noche-surface-2 hover:text-noche-ink"
                        title="Más opciones"
                      >
                        <MoreIcon className="h-4 w-4" />
                      </button>
                      {menuAbierto ? (
                        <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-noche-border bg-noche-surface p-2 shadow-lg">
                          <button
                            type="button"
                            onClick={() => handleTogglePagando(mesaSeleccionada)}
                            className="block w-full rounded-lg px-2 py-1.5 text-left text-xs uppercase tracking-widest2 text-noche-ink hover:bg-noche-surface-2"
                          >
                            {mesaSeleccionada.pagando ? "Quitar cobro" : "Marcar pagando"}
                          </button>
                          {mesaSeleccionada.por_limpiar ? (
                            <button
                              type="button"
                              onClick={() => handleMarcarLimpia(mesaSeleccionada)}
                              className="block w-full rounded-lg px-2 py-1.5 text-left text-xs uppercase tracking-widest2 text-noche-ink hover:bg-noche-surface-2"
                            >
                              Marcar como limpia
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMesaSeleccionadaId(null)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-noche-ink-faint hover:bg-noche-surface-2 hover:text-noche-ink"
                      title="Cerrar"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-noche-border bg-noche-surface-2/60 px-3 py-2">
                    <p className="text-xs uppercase tracking-widest2 text-noche-ink-faint">Capacidad</p>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCambiarCapacidad(mesaSeleccionada, -1)}
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-noche-border text-xs text-noche-ink hover:bg-noche-surface-3"
                      >
                        <MinusIcon className="h-3 w-3" />
                      </button>
                      <p className="text-sm text-noche-ink">{mesaSeleccionada.capacidad} personas</p>
                      <button
                        type="button"
                        onClick={() => handleCambiarCapacidad(mesaSeleccionada, 1)}
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-noche-border text-xs text-noche-ink hover:bg-noche-surface-3"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-noche-border bg-noche-surface-2/60 px-3 py-2">
                    <p className="text-xs uppercase tracking-widest2 text-noche-ink-faint">Clientes</p>
                    <p className="mt-1 text-sm text-noche-ink">{mesaSeleccionada.clientes_sentados}</p>
                  </div>
                  <div className="rounded-lg border border-noche-border bg-noche-surface-2/60 px-3 py-2">
                    <p className="text-xs uppercase tracking-widest2 text-noche-ink-faint">Entrada</p>
                    <p className="mt-1 text-sm text-noche-ink">
                      {mesaSeleccionada.entrada_at
                        ? new Date(mesaSeleccionada.entrada_at).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                    {mesaSeleccionada.entrada_at ? (
                      <p className="text-[11px] text-noche-ink-faint">
                        {formatoTranscurrido(mesaSeleccionada.entrada_at, ahora)}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-lg border border-noche-border bg-noche-surface-2/60 px-3 py-2">
                    <p className="text-xs uppercase tracking-widest2 text-noche-ink-faint">Camarero</p>
                    <p className="mt-1 truncate text-sm text-noche-ink">{mesaSeleccionada.camarero_nombre ?? "-"}</p>
                  </div>
                </div>

                <div className="mt-2">
                  <label className="text-xs uppercase tracking-widest2 text-noche-ink-faint">Nota rápida</label>
                  <textarea
                    value={notaForm}
                    onChange={(e) => setNotaForm(e.target.value)}
                    onBlur={() => guardarNota(mesaSeleccionada)}
                    disabled={notaGuardando}
                    placeholder="Alergias, cliente habitual, trona…"
                    rows={2}
                    className="mt-1 w-full resize-none rounded-lg border border-noche-border bg-noche-surface-2/60 px-3 py-2 text-sm text-noche-ink placeholder:text-noche-ink-faint disabled:opacity-60"
                  />
                </div>

                {accionError ? <p className="mt-3 text-sm text-noche-danger">{accionError}</p> : null}

                {!esHoy ? (
                  <p className="mt-3 text-xs text-noche-ink-muted">
                    Estás viendo otra fecha: solo puedes crear reservas, no gestionar el servicio en vivo.
                  </p>
                ) : null}

                {esHoy && modoUnion ? (
                  <div className="mt-4 rounded-lg border border-noche-primary/40 bg-noche-primary/5 p-3">
                    <p className="text-xs text-noche-ink">
                      Mesas seleccionadas: {seleccionUnion.length > 0 ? seleccionUnion.length : 0}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmarUnion}
                        disabled={seleccionUnion.length < 2}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-noche-primary py-2 text-xs uppercase tracking-widest2 text-noche-ink disabled:opacity-50"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        Confirmar unión
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModoUnion(false);
                          setSeleccionUnion([]);
                        }}
                        className="flex-1 rounded-lg border border-noche-border py-2 text-xs uppercase tracking-widest2 text-noche-ink"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}

                {esHoy && sentarForm ? (
                  <div className="mt-4 rounded-lg border border-noche-border p-3">
                    <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
                      Sentar clientes
                    </p>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="number"
                        min={1}
                        value={clientesForm}
                        onChange={(e) => setClientesForm(e.target.value)}
                        placeholder="Clientes"
                        className="w-20 rounded-lg border border-noche-border bg-noche-surface-2 px-2 py-1.5 text-sm text-noche-ink"
                      />
                      <select
                        value={camareroForm}
                        onChange={(e) => setCamareroForm(e.target.value)}
                        className="flex-1 rounded-lg border border-noche-border bg-noche-surface-2 px-2 py-1.5 text-sm text-noche-ink"
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
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-noche-primary py-2 text-xs uppercase tracking-widest2 text-noche-ink"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      Confirmar
                    </button>
                  </div>
                ) : null}

                {esHoy && cambiarMesaAbierto ? (
                  <div className="mt-4 rounded-lg border border-noche-border p-3">
                    <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
                      Mover a mesa libre
                    </p>
                    <select
                      onChange={(e) => e.target.value && handleCambiarMesa(mesaSeleccionada, e.target.value)}
                      defaultValue=""
                      className="mt-2 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-2 py-1.5 text-sm text-noche-ink"
                    >
                      <option value="" disabled>
                        Selecciona una mesa
                      </option>
                      {mesas
                        .filter((m) => !m.ocupada && m.id !== mesaSeleccionada.id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            Mesa {etiquetaMesa(m)}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : null}

                {esHoy ? (
                  <div className="mt-4 space-y-2">
                    {mesaSeleccionada.ocupada ? (
                      <button
                        type="button"
                        onClick={() => handleLiberar(mesaSeleccionada)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-noche-surface-2 py-2.5 text-xs uppercase tracking-widest2 text-noche-ink hover:bg-noche-surface-3"
                      >
                        <LogoutIcon className="h-3.5 w-3.5" />
                        Liberar mesa
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSentarForm((v) => !v)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-noche-primary py-2.5 text-xs uppercase tracking-widest2 text-noche-ink hover:bg-noche-primary-dark"
                      >
                        <UsersIcon className="h-3.5 w-3.5" />
                        Sentar clientes
                      </button>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <AccionMesa icon={ClockIcon} label="Reservar" onClick={() => setMostrarReserva(true)} />
                      <AccionMesa
                        icon={SwapIcon}
                        label="Cambiar mesa"
                        onClick={() => setCambiarMesaAbierto((v) => !v)}
                      />
                      {mesaSeleccionada.union_grupo_id ? (
                        <AccionMesa
                          icon={UnlinkIcon}
                          label="Separar mesas"
                          onClick={() => handleSepararGrupo(mesaSeleccionada)}
                        />
                      ) : (
                        <AccionMesa
                          icon={LinkIcon}
                          label="Unir mesas"
                          onClick={() => {
                            setModoUnion(true);
                            setSeleccionUnion([mesaSeleccionada.id]);
                          }}
                        />
                      )}
                      <AccionMesa
                        icon={PrinterIcon}
                        label="Imprimir cuenta"
                        onClick={() => imprimirCuentaMesa(mesaSeleccionada, etiquetaMesa(mesaSeleccionada))}
                      />
                      <AccionMesa
                        icon={TagIcon}
                        label={mesaSeleccionada.pagando ? "Quitar cobro" : "Marcar pagando"}
                        onClick={() => handleTogglePagando(mesaSeleccionada)}
                      />
                      <AccionMesa
                        icon={QrCodeIcon}
                        label="Ver QR / enlace"
                        onClick={() => abrirQr(mesaSeleccionada)}
                      />
                      <AccionMesa
                        icon={TrashIcon}
                        label="Eliminar mesa"
                        danger
                        onClick={() => handleEliminarMesa(mesaSeleccionada)}
                      />
                    </div>

                    {qrAbierto ? (
                      <div className="mt-3 rounded-lg border border-noche-border bg-noche-surface-2/60 p-3 text-center">
                        {qrDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={qrDataUrl}
                            alt={`QR de la mesa ${etiquetaMesa(mesaSeleccionada)}`}
                            className="mx-auto h-32 w-32"
                          />
                        ) : (
                          <p className="text-xs text-noche-ink-muted">Generando QR…</p>
                        )}
                        <p className="mt-2 break-all text-[11px] text-noche-ink-faint">
                          {pedirUrl(mesaSeleccionada.identificador)}
                        </p>
                        <div className="mt-2 flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => copiarEnlaceMesa(mesaSeleccionada)}
                            className="rounded-lg border border-noche-border px-3 py-1.5 text-xs uppercase tracking-widest2 text-noche-ink hover:bg-noche-surface-3"
                          >
                            {enlaceCopiado ? "¡Copiado!" : "Copiar enlace"}
                          </button>
                          <a
                            href={pedirUrl(mesaSeleccionada.identificador)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-noche-border px-3 py-1.5 text-xs uppercase tracking-widest2 text-noche-ink hover:bg-noche-surface-3"
                          >
                            Abrir
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMostrarReserva(true)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-noche-primary py-2 text-xs uppercase tracking-widest2 text-noche-ink hover:bg-noche-primary-dark"
                  >
                    <ClockIcon className="h-3.5 w-3.5" />
                    Reservar esta mesa
                  </button>
                )}

                {esHoy && mesaSeleccionada.pedidos_hoy.length === 0 ? (
                  <p className="mt-4 text-sm text-noche-ink-muted">Sin pedidos hoy en esta mesa.</p>
                ) : esHoy ? (
                  <div className="mt-4 space-y-4">
                    {mesaSeleccionada.pedidos_hoy.map((pedido: PedidoMesaAdmin) => {
                      const siguiente = SIGUIENTE_ESTADO[pedido.estado];
                      const hora2 = new Date(pedido.created_at).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div key={pedido.id} className="rounded-lg border border-noche-border p-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="uppercase tracking-widest2 text-noche-ink-muted">
                              {ESTADO_LABEL[pedido.estado]}
                            </span>
                            <span className="text-noche-ink-muted">{hora2}</span>
                          </div>
                          {pedido.participante_nombre ? (
                            <p className="text-xs text-noche-ink-muted">
                              Pedido de {pedido.participante_nombre}
                            </p>
                          ) : null}

                          <ul className="mt-2 space-y-1 text-sm text-noche-ink">
                            {pedido.items.map((item, index) => (
                              <li key={index} className="flex justify-between">
                                <span>
                                  {item.cantidad} × {item.producto_nombre}
                                  {item.notas ? (
                                    <span className="block text-xs text-noche-ink-muted">
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
                            <p className="mt-2 text-xs text-noche-ink-muted">Notas: {pedido.notas}</p>
                          ) : null}

                          <div className="mt-2 flex items-center justify-between border-t border-noche-border pt-2 text-sm font-medium text-noche-ink">
                            <span>Total</span>
                            <span>{formatCentimos(pedido.total_centimos)} €</span>
                          </div>

                          {siguiente ? (
                            <button
                              type="button"
                              disabled={actualizando === pedido.id}
                              onClick={() => avanzar(pedido.id, siguiente.estado)}
                              className="mt-3 w-full rounded-lg bg-noche-primary py-2 text-xs uppercase tracking-widest2 text-noche-ink transition-colors hover:bg-noche-primary-dark disabled:opacity-50"
                            >
                              {actualizando === pedido.id ? "…" : siguiente.label}
                            </button>
                          ) : null}
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-between border-t border-noche-border pt-3 font-display text-lg text-noche-ink">
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

          <div className="rounded-lg border border-noche-border bg-noche-surface p-4">
            <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Leyenda de estados</p>
            <div className="mt-3 space-y-2">
              {(Object.keys(ESTILO_MESA) as EstadoMesa[]).map((estado) => (
                <div key={estado} className="flex items-center gap-2 text-sm text-noche-ink">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ESTILO_MESA[estado].badge}`} />
                  {ESTILO_MESA[estado].label}
                </div>
              ))}
            </div>
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
