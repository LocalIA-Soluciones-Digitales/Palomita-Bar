"use client";

import { useEffect, useMemo, useState } from "react";
import { getInformeVentasAdmin } from "@/lib/restaurant/admin-queries";
import {
  getNewsletterAdmin,
  getResenasAdmin,
  getVisitasAdmin,
} from "@/lib/restaurant/admin-analytics-queries";
import type { InformeVentas, InformeVentasProducto } from "@/lib/restaurant/admin-types";
import { errorMessage, formatCentimos } from "@/lib/format";
import { PrinterIcon, StarIcon } from "@/components/icons";

type RangoId = "7d" | "30d" | "mes" | "mes_anterior";

const RANGOS: { id: RangoId; label: string }[] = [
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "mes", label: "Este mes" },
  { id: "mes_anterior", label: "Mes anterior" },
];

// Colores del sistema, en el orden en que se reparten entre categorías del
// donut. Se leen como custom properties para poder usarlos tanto en
// Tailwind (bg-noche-*) como en gradientes CSS calculados en JS.
const PALETTE = [
  "--noche-primary",
  "--noche-accent",
  "--noche-positive",
  "--noche-warning",
  "--noche-ink-faint",
];

function calcularRango(id: RangoId): { desde: Date; hasta: Date; etiqueta: string } {
  const ahora = new Date();

  switch (id) {
    case "7d":
      return {
        desde: new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000),
        hasta: ahora,
        etiqueta: "últimos 7 días",
      };
    case "30d":
      return {
        desde: new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000),
        hasta: ahora,
        etiqueta: "últimos 30 días",
      };
    case "mes": {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      return {
        desde: inicio,
        hasta: ahora,
        etiqueta: ahora.toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
      };
    }
    case "mes_anterior": {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
      const fin = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      return {
        desde: inicio,
        hasta: fin,
        etiqueta: inicio.toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
      };
    }
  }
}

function rangoAnterior(desde: Date, hasta: Date): { desde: Date; hasta: Date } {
  const duracion = hasta.getTime() - desde.getTime();
  return { desde: new Date(desde.getTime() - duracion), hasta: new Date(desde.getTime()) };
}

function deltaPct(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual === 0 ? 0 : null;
  return ((actual - anterior) / anterior) * 100;
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-noche-ink-faint">nuevo</span>;
  }
  const positivo = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        positivo ? "text-noche-positive" : "text-noche-danger"
      }`}
    >
      {positivo ? "▲" : "▼"} {Math.abs(value).toFixed(0)}%
    </span>
  );
}

function KpiCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number | null;
}) {
  return (
    <div className="rounded-lg border border-noche-border bg-noche-surface p-4">
      <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="font-display text-3xl text-noche-ink">{value}</p>
        {delta !== undefined ? <DeltaBadge value={delta} /> : null}
      </div>
    </div>
  );
}

function GraficoVentasDia({ dias }: { dias: InformeVentas["por_dia"] }) {
  if (dias.length === 0) {
    return <p className="mt-2 text-sm text-noche-ink-muted">Sin pedidos en este periodo.</p>;
  }
  const max = Math.max(1, ...dias.map((d) => d.ventas_centimos));
  const media = dias.reduce((acc, d) => acc + d.ventas_centimos, 0) / dias.length;
  const mediaPct = Math.min(96, (media / max) * 100);
  const mostrarLabel = (i: number) => dias.length <= 8 || i === 0 || i === dias.length - 1 || i === Math.floor(dias.length / 2);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-noche-ink-faint">
        <span>Pico: {formatCentimos(max)} €</span>
        <span>Media/día: {formatCentimos(media)} €</span>
      </div>
      <div className="relative mt-2 flex h-40 items-end gap-1 border-b border-noche-border pb-1">
        <div
          className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-noche-ink-faint/40"
          style={{ bottom: `${mediaPct}%` }}
        />
        {dias.map((dia) => (
          <div
            key={dia.fecha}
            className="group relative flex-1 rounded-t-md bg-gradient-to-t from-noche-primary-dark to-noche-primary transition-opacity hover:opacity-90"
            style={{ height: `${Math.max(4, (dia.ventas_centimos / max) * 100)}%` }}
            title={`${new Date(dia.fecha).toLocaleDateString("es-ES")}: ${formatCentimos(dia.ventas_centimos)} € (${dia.pedidos} pedidos)`}
          />
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {dias.map((dia, i) => (
          <div key={dia.fecha} className="flex-1 text-center text-[10px] text-noche-ink-faint">
            {mostrarLabel(i)
              ? new Date(dia.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })
              : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutCategorias({ categorias }: { categorias: InformeVentas["por_categoria"] }) {
  const activas = categorias.filter((c) => c.ventas_centimos > 0).sort((a, b) => b.ventas_centimos - a.ventas_centimos);
  const total = activas.reduce((acc, c) => acc + c.ventas_centimos, 0);

  if (activas.length === 0 || total === 0) {
    return <p className="mt-2 text-sm text-noche-ink-muted">Sin pedidos en este periodo.</p>;
  }

  let acumulado = 0;
  const segmentos = activas.map((c, i) => {
    const inicio = (acumulado / total) * 100;
    acumulado += c.ventas_centimos;
    const fin = (acumulado / total) * 100;
    const color = PALETTE[i % PALETTE.length];
    return { ...c, inicio, fin, color };
  });

  const gradiente = segmentos
    .map((s) => `oklch(var(${s.color})) ${s.inicio}% ${s.fin}%`)
    .join(", ");

  return (
    <div className="mt-3 flex flex-col items-center gap-6 sm:flex-row">
      <div
        className="relative h-40 w-40 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradiente})` }}
      >
        <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-noche-surface text-center">
          <p className="text-[10px] uppercase tracking-widest2 text-noche-ink-muted">Total</p>
          <p className="font-display text-base text-noche-ink">{formatCentimos(total)} €</p>
        </div>
      </div>
      <div className="w-full flex-1 space-y-1.5">
        {segmentos.map((s) => (
          <div key={s.categoria} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: `oklch(var(${s.color}))` }}
            />
            <span className="min-w-0 flex-1 truncate text-noche-ink">{s.categoria}</span>
            <span className="shrink-0 text-noche-ink-muted">
              {Math.round(s.fin - s.inicio)}% · {formatCentimos(s.ventas_centimos)} €
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatosEstrella({ productos }: { productos: InformeVentasProducto[] }) {
  const top = productos.filter((p) => p.unidades > 0).slice(0, 5);
  const primero = top[0];
  if (!primero) {
    return <p className="mt-2 text-sm text-noche-ink-muted">Sin pedidos en este periodo.</p>;
  }
  const max = primero.unidades;
  const RANK_STYLE = [
    "bg-noche-primary text-noche-bg",
    "bg-noche-surface-3 text-noche-ink",
    "bg-noche-surface-3 text-noche-ink",
  ];

  return (
    <div className="mt-3 space-y-2">
      {top.map((p, i) => (
        <div key={p.producto_id} className="flex items-center gap-3">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              RANK_STYLE[i] ?? "bg-noche-surface-2 text-noche-ink-muted"
            }`}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm text-noche-ink">{p.nombre}</p>
              <p className="shrink-0 text-xs text-noche-ink-muted">
                {p.unidades} uds · {formatCentimos(p.ventas_centimos)} €
              </p>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-noche-surface-2">
              <div
                className="h-1.5 rounded-full bg-noche-primary"
                style={{ width: `${Math.max(4, (p.unidades / max) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function InformeProfesional() {
  const [rango, setRango] = useState<RangoId>("30d");
  const [ventas, setVentas] = useState<InformeVentas | null>(null);
  const [ventasPrev, setVentasPrev] = useState<InformeVentas | null>(null);
  const [visitasCount, setVisitasCount] = useState<number | null>(null);
  const [visitasCountPrev, setVisitasCountPrev] = useState<number | null>(null);
  const [sesionesUnicas, setSesionesUnicas] = useState<number | null>(null);
  const [origenPrincipal, setOrigenPrincipal] = useState<{ nombre: string; pct: number } | null>(null);
  const [recurrenciaPct, setRecurrenciaPct] = useState<number | null>(null);
  const [nuevosSuscriptores, setNuevosSuscriptores] = useState<number | null>(null);
  const [nuevasResenas, setNuevasResenas] = useState<number | null>(null);
  const [valoracionMedia, setValoracionMedia] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { desde, hasta, etiqueta } = useMemo(() => calcularRango(rango), [rango]);
  const { desde: desdePrev, hasta: hastaPrev } = useMemo(() => rangoAnterior(desde, hasta), [desde, hasta]);

  useEffect(() => {
    setVentas(null);
    Promise.all([
      getInformeVentasAdmin(desde, hasta),
      getInformeVentasAdmin(desdePrev, hastaPrev),
      getVisitasAdmin(desde, hasta),
      getVisitasAdmin(desdePrev, hastaPrev),
      getNewsletterAdmin(),
      getResenasAdmin(),
    ])
      .then(([informe, informePrev, visitas, visitasPrev, suscriptores, resenas]) => {
        setVentas(informe);
        setVentasPrev(informePrev);
        setVisitasCount(visitas.length);
        setVisitasCountPrev(visitasPrev.length);
        setSesionesUnicas(new Set(visitas.map((v) => v.session_id)).size);

        if (visitas.length > 0) {
          setRecurrenciaPct((visitas.filter((v) => v.is_returning).length / visitas.length) * 100);
          const porOrigen: Record<string, number> = {};
          for (const v of visitas) porOrigen[v.source_category] = (porOrigen[v.source_category] ?? 0) + 1;
          const top = Object.entries(porOrigen).sort((a, b) => b[1] - a[1])[0];
          setOrigenPrincipal(top ? { nombre: top[0], pct: (top[1] / visitas.length) * 100 } : null);
        } else {
          setRecurrenciaPct(null);
          setOrigenPrincipal(null);
        }

        setNuevosSuscriptores(
          suscriptores.filter((s) => new Date(s.created_at) >= desde && new Date(s.created_at) <= hasta).length,
        );
        const resenasPeriodo = resenas.filter(
          (r) => new Date(r.created_at) >= desde && new Date(r.created_at) <= hasta,
        );
        setNuevasResenas(resenasPeriodo.length);
        setValoracionMedia(
          resenasPeriodo.length > 0
            ? resenasPeriodo.reduce((acc, r) => acc + r.valoracion, 0) / resenasPeriodo.length
            : null,
        );
      })
      .catch((err) => setError(errorMessage(err)));
  }, [desde, hasta, desdePrev, hastaPrev]);

  const sinMovimiento = useMemo(() => ventas?.productos.filter((p) => p.unidades === 0) ?? [], [ventas]);
  const productoEstrella = useMemo(
    () => ventas?.productos.filter((p) => p.unidades > 0)[0] ?? null,
    [ventas],
  );

  const insights = useMemo(() => {
    if (!ventas) return [];
    const lista: string[] = [];

    if (productoEstrella) {
      lista.push(
        `"${productoEstrella.nombre}" ha sido el plato más pedido (${productoEstrella.unidades} unidades) — mantenlo siempre visible y bien abastecido.`,
      );
    }
    if (sinMovimiento.length > 0) {
      lista.push(
        `${sinMovimiento.length} plato${sinMovimiento.length === 1 ? "" : "s"} sin ningún pedido en este periodo (${sinMovimiento
          .slice(0, 4)
          .map((p) => p.nombre)
          .join(", ")}${sinMovimiento.length > 4 ? "…" : ""}) — candidatos a destacar, cambiar de receta o quitar de la carta.`,
      );
    }
    if (origenPrincipal) {
      lista.push(
        `El ${origenPrincipal.pct.toFixed(0)}% de las visitas llegan vía "${origenPrincipal.nombre}" — merece la pena reforzar ese canal con contenido o promociones.`,
      );
    }
    if (recurrenciaPct !== null) {
      lista.push(
        recurrenciaPct >= 30
          ? `El ${recurrenciaPct.toFixed(0)}% de las visitas son de clientes recurrentes, buena señal de fidelización.`
          : `Solo el ${recurrenciaPct.toFixed(0)}% de las visitas son recurrentes — un programa de fidelización o newsletter periódica podría ayudar a traer de vuelta a más clientes.`,
      );
    }
    if (sesionesUnicas && nuevosSuscriptores !== null) {
      const conversion = (nuevosSuscriptores / sesionesUnicas) * 100;
      lista.push(
        `De las ${sesionesUnicas} sesiones registradas, un ${conversion.toFixed(1)}% se convirtieron en nuevas suscripciones a la newsletter.`,
      );
    }
    return lista;
  }, [ventas, productoEstrella, sinMovimiento, origenPrincipal, recurrenciaPct, sesionesUnicas, nuevosSuscriptores]);

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="font-display text-2xl text-noche-ink">Informe profesional</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {RANGOS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRango(r.id)}
                className={`rounded-lg px-3 py-1.5 text-xs uppercase tracking-widest2 ${
                  rango === r.id
                    ? "bg-noche-primary/15 text-noche-primary"
                    : "border border-noche-border bg-noche-surface text-noche-ink-muted"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-noche-border px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink hover:bg-noche-surface-2"
          >
            <PrinterIcon className="h-3.5 w-3.5" />
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      <div className="mt-6 hidden border-b border-noche-border pb-4 print:block">
        <p className="text-xs uppercase tracking-widest2 text-noche-primary">Palomita Bar</p>
        <h1 className="mt-1 font-display text-2xl">Informe profesional — {etiqueta}</h1>
        <p className="mt-1 text-xs text-noche-ink-muted">
          Generado el {new Date().toLocaleDateString("es-ES")}
        </p>
      </div>

      {error ? <p className="mt-4 text-sm text-noche-danger">{error}</p> : null}

      {!ventas || !ventasPrev ? (
        <p className="mt-6 text-sm text-noche-ink-muted">Cargando…</p>
      ) : (
        <div className="mt-6 space-y-10">
          <section>
            <h2 className="font-display text-lg text-noche-ink">Resumen ejecutivo</h2>
            <p className="mt-1 text-xs text-noche-ink-faint">Comparado con el periodo anterior equivalente</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="Ventas"
                value={`${formatCentimos(ventas.resumen.ventas_centimos)} €`}
                delta={deltaPct(ventas.resumen.ventas_centimos, ventasPrev.resumen.ventas_centimos)}
              />
              <KpiCard
                label="Pedidos"
                value={String(ventas.resumen.pedidos)}
                delta={deltaPct(ventas.resumen.pedidos, ventasPrev.resumen.pedidos)}
              />
              <KpiCard
                label="Ticket medio"
                value={`${formatCentimos(ventas.resumen.ticket_medio_centimos)} €`}
                delta={deltaPct(ventas.resumen.ticket_medio_centimos, ventasPrev.resumen.ticket_medio_centimos)}
              />
              <KpiCard
                label="Visitas web"
                value={visitasCount === null ? "…" : String(visitasCount)}
                delta={
                  visitasCount !== null && visitasCountPrev !== null
                    ? deltaPct(visitasCount, visitasCountPrev)
                    : undefined
                }
              />
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg text-noche-ink">Ventas por día</h2>
            <GraficoVentasDia dias={ventas.por_dia} />
          </section>

          <section className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-lg text-noche-ink">Ventas por categoría</h2>
              <DonutCategorias categorias={ventas.por_categoria} />
            </div>
            <div>
              <h2 className="font-display text-lg text-noche-ink">Platos estrella</h2>
              <PlatosEstrella productos={ventas.productos} />
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg text-noche-ink">Captación de clientes</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard label="Sesiones" value={sesionesUnicas === null ? "…" : String(sesionesUnicas)} />
              <KpiCard
                label="Nuevos suscriptores"
                value={nuevosSuscriptores === null ? "…" : String(nuevosSuscriptores)}
              />
              <KpiCard label="Nuevas reseñas" value={nuevasResenas === null ? "…" : String(nuevasResenas)} />
              <div className="rounded-lg border border-noche-border bg-noche-surface p-4">
                <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Valoración media</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="font-display text-3xl text-noche-ink">
                    {valoracionMedia === null ? "—" : valoracionMedia.toFixed(1)}
                  </p>
                  {valoracionMedia !== null ? <StarIcon className="h-4 w-4 text-noche-primary" /> : null}
                </div>
              </div>
            </div>
          </section>

          {insights.length > 0 ? (
            <section className="rounded-xl border border-noche-primary/30 bg-noche-primary/5 p-5">
              <h2 className="font-display text-lg text-noche-ink">Análisis y recomendaciones</h2>
              <ul className="mt-3 space-y-2">
                {insights.map((texto, i) => (
                  <li key={i} className="flex gap-2 text-sm text-noche-ink">
                    <span className="mt-0.5 shrink-0 text-noche-primary">→</span>
                    <span>{texto}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
