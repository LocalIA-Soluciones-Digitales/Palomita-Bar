"use client";

import { formatCentimos } from "@/lib/format";
import type { InformeVentas } from "@/lib/restaurant/admin-types";

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

export function GraficoVentasDia({ dias }: { dias: InformeVentas["por_dia"] }) {
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

export function DonutCategorias({ categorias }: { categorias: InformeVentas["por_categoria"] }) {
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
