"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { formatCentimos } from "@/lib/format";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DropletIcon,
  FireIcon,
  MinusIcon,
  PlusIcon,
  ProteinIcon,
  StarIcon,
  TagIcon,
  WheatIcon,
} from "@/components/icons";
import type { Producto } from "@/lib/restaurant/types";
import type { MenuCartControls } from "@/components/menu/CategoryMenu";

const MACRO_COLORS = {
  proteinas: "#3987e5",
  carbohidratos: "#d95926",
  grasas: "#199e70",
} as const;

const MACRO_ICONS = {
  proteinas: ProteinIcon,
  carbohidratos: WheatIcon,
  grasas: DropletIcon,
} as const;

function macroBreakdown(producto: Producto) {
  const p = producto.proteinas_g ?? 0;
  const c = producto.carbohidratos_g ?? 0;
  const f = producto.grasas_g ?? 0;
  const kcal = { proteinas: p * 4, carbohidratos: c * 4, grasas: f * 9 };
  const total = kcal.proteinas + kcal.carbohidratos + kcal.grasas;
  if (total <= 0) return [];

  const raw = [
    { key: "proteinas" as const, label: "Proteínas", grams: p, pct: (kcal.proteinas / total) * 100 },
    { key: "carbohidratos" as const, label: "Carbohidratos", grams: c, pct: (kcal.carbohidratos / total) * 100 },
    { key: "grasas" as const, label: "Grasas", grams: f, pct: (kcal.grasas / total) * 100 },
  ];

  const floored = raw.map((r) => ({ ...r, pctInt: Math.floor(r.pct) }));
  let remainder = 100 - floored.reduce((acc, r) => acc + r.pctInt, 0);
  const byLargestFraction = [...floored].sort((a, b) => (b.pct % 1) - (a.pct % 1));
  for (const item of byLargestFraction) {
    if (remainder <= 0) break;
    item.pctInt += 1;
    remainder -= 1;
  }

  return floored.map((r) => ({ ...r, color: MACRO_COLORS[r.key] }));
}

function Donut({ segments }: { segments: { pctInt: number; color: string }[] }) {
  const radius = 42;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  const gap = 3;
  let cumulative = 0;

  return (
    <svg viewBox="0 0 104 104" className="h-20 w-20 shrink-0" role="img" aria-hidden="true">
      <g transform="rotate(-90 52 52)">
        <circle cx="52" cy="52" r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-noche-surface-3" />
        {segments.map((seg, i) => {
          const length = (seg.pctInt / 100) * circumference;
          const visibleLength = Math.max(length - gap, 0);
          const dashOffset = -cumulative;
          cumulative += length;
          return (
            <circle
              key={i}
              cx="52"
              cy="52"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${visibleLength} ${circumference - visibleLength}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          );
        })}
      </g>
    </svg>
  );
}

function TablaFila({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: { label: string; value: string };
}) {
  return (
    <div className="border-b border-noche-border/60 py-1.5 last:border-b-0">
      <div className="flex items-center justify-between text-sm">
        <span className="text-noche-ink">{label}</span>
        <span className="font-medium text-noche-ink">{value}</span>
      </div>
      {sub ? (
        <div className="flex items-center justify-between pl-3 text-xs text-noche-ink-muted">
          <span>{sub.label}</span>
          <span>{sub.value}</span>
        </div>
      ) : null}
    </div>
  );
}

interface OrigenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function ProductDetailModal({
  items,
  activeIndex,
  categoriaNombre,
  origen,
  onClose,
  onNavigate,
  cart,
}: {
  items: Producto[];
  activeIndex: number;
  categoriaNombre: string;
  origen: OrigenRect;
  onClose: () => void;
  onNavigate: (index: number) => void;
  cart?: MenuCartControls;
}) {
  // `items` is guaranteed non-empty and `activeIndex` in range by the caller.
  const producto = items[activeIndex]!;
  const cantidad = cart?.getQuantity(producto.id) ?? 0;
  const macros = useMemo(() => macroBreakdown(producto), [producto]);
  const tieneNutricion = producto.ingredientes.length > 0 || producto.calorias != null;

  const goPrev = () => onNavigate((activeIndex - 1 + items.length) % items.length);
  const goNext = () => onNavigate((activeIndex + 1) % items.length);

  const cardRef = useRef<HTMLDivElement>(null);

  // Anima la tarjeta desde el tamaño/posición del click hasta su lugar
  // final centrado, mientras gira (efecto "volteo" que a la vez amplía).
  useLayoutEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const finalRect = node.getBoundingClientRect();
    const originCenterX = origen.left + origen.width / 2;
    const originCenterY = origen.top + origen.height / 2;
    const finalCenterX = finalRect.left + finalRect.width / 2;
    const finalCenterY = finalRect.top + finalRect.height / 2;

    const dx = originCenterX - finalCenterX;
    const dy = originCenterY - finalCenterY;
    const sx = Math.max(origen.width / finalRect.width, 0.05);
    const sy = Math.max(origen.height / finalRect.height, 0.05);

    node.style.transition = "none";
    node.style.opacity = "0.5";
    node.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy}) rotateY(-130deg)`;

    // Fuerza el reflow para que el estado inicial se pinte antes de animar.
    void node.getBoundingClientRect();

    const raf = requestAnimationFrame(() => {
      node.style.transition = "transform 550ms cubic-bezier(0.22, 1, 0.36, 1), opacity 350ms ease-out";
      node.style.transform = "translate(0, 0) scale(1, 1) rotateY(0deg)";
      node.style.opacity = "1";
    });

    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, items.length]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={producto.nombre}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-noche-bg/90 p-4 backdrop-blur-md"
    >
      <div className="flex w-full max-w-5xl items-center justify-center gap-2 [perspective:2000px] sm:gap-4">
        {items.length > 1 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Producto anterior"
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-noche-border bg-noche-surface/80 text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary sm:flex"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        ) : null}

        <div
          ref={cardRef}
          onClick={(e) => e.stopPropagation()}
          className="relative flex w-full min-w-0 max-w-3xl flex-col overflow-hidden rounded-2xl border border-noche-primary/40 bg-noche-surface shadow-[0_0_60px_-15px_oklch(var(--noche-primary)/0.5)] [transform-style:preserve-3d] [will-change:transform]"
          style={{ maxHeight: "min(92vh, 760px)" }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-noche-border bg-noche-surface/90 text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary"
          >
            <CloseIcon className="h-4 w-4" />
          </button>

          <div className="overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
            <div className="flex min-w-0 flex-col">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-noche-primary px-3 py-1 text-[10px] font-medium uppercase tracking-widest2 text-white">
                <StarIcon className="h-3 w-3" />
                {categoriaNombre}
              </span>

              {producto.imagen_url ? (
                <div className="relative mx-auto mt-4 h-44 w-44 shrink-0 overflow-hidden rounded-xl bg-noche-surface-2 sm:h-52 sm:w-52">
                  <Image
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    fill
                    sizes="(min-width: 640px) 208px, 176px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="mx-auto mt-4 h-44 w-44 shrink-0 rounded-xl bg-noche-surface-2 sm:h-52 sm:w-52" />
              )}

              <h2 className="mt-4 font-display text-2xl text-noche-ink sm:text-3xl">{producto.nombre}</h2>
              {producto.descripcion ? (
                <p className="mt-1.5 text-sm text-noche-ink-muted">{producto.descripcion}</p>
              ) : null}

              {producto.ingredientes.length > 0 ? (
                <div className="mt-4">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest2 text-noche-ink-muted">
                    <TagIcon className="h-3.5 w-3.5" />
                    Ingredientes
                  </p>
                  <div className="mt-2 rounded-lg border border-noche-border bg-noche-surface-2 p-3">
                    <ol className="space-y-1.5 text-sm text-noche-ink-muted">
                      {producto.ingredientes.map((ingrediente, i) => (
                        <li key={ingrediente} className="flex items-baseline gap-2">
                          <span className="w-4 shrink-0 text-[10px] font-medium tabular-nums text-noche-primary/70">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="truncate">{ingrediente}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ) : null}

              <div className="mt-auto flex items-center justify-between pt-4">
                <div>
                  <p className="text-2xl font-medium text-noche-primary">
                    {formatCentimos(producto.precio_centimos)} €
                  </p>
                  <p className="text-[10px] uppercase tracking-widest2 text-noche-ink-faint">
                    IVA incluido
                  </p>
                </div>

                {cart ? (
                  cantidad > 0 ? (
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => cart.onDecrement(producto.id)}
                        aria-label="Quitar una unidad"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-noche-border text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary"
                      >
                        <MinusIcon className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm text-noche-ink">{cantidad}</span>
                      <button
                        type="button"
                        onClick={() => cart.onIncrement(producto.id)}
                        aria-label="Añadir una unidad"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-noche-border text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => cart.onAdd(producto)}
                      className="shrink-0 rounded-lg border border-noche-primary px-4 py-2 text-xs uppercase tracking-widest2 text-noche-primary transition-colors hover:bg-noche-primary hover:text-white"
                    >
                      Añadir
                    </button>
                  )
                ) : null}
              </div>
            </div>

            <div className="flex min-w-0 flex-col">
              {tieneNutricion ? (
                <>
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest2 text-noche-primary">
                    <FireIcon className="h-4 w-4" />
                    Información nutricional
                  </p>

                  {producto.calorias != null ? (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <div className="rounded-lg border border-noche-border bg-noche-surface-2 p-2.5 text-center">
                        <FireIcon className="mx-auto h-4 w-4 text-noche-danger" />
                        <p className="mt-1.5 text-base font-semibold text-noche-ink">
                          {producto.calorias}
                        </p>
                        <p className="text-[9px] uppercase tracking-widest2 text-noche-ink-muted">Kcal</p>
                      </div>
                      <div className="rounded-lg border border-noche-border bg-noche-surface-2 p-2.5 text-center">
                        <span className="mx-auto flex h-4 w-4 items-center justify-center" style={{ color: MACRO_COLORS.proteinas }}>
                          <ProteinIcon className="h-4 w-4" />
                        </span>
                        <p className="mt-1.5 text-base font-semibold text-noche-ink">
                          {producto.proteinas_g ?? "—"}g
                        </p>
                        <p className="text-[9px] uppercase tracking-widest2 text-noche-ink-muted">Proteínas</p>
                      </div>
                      <div className="rounded-lg border border-noche-border bg-noche-surface-2 p-2.5 text-center">
                        <span className="mx-auto flex h-4 w-4 items-center justify-center" style={{ color: MACRO_COLORS.carbohidratos }}>
                          <WheatIcon className="h-4 w-4" />
                        </span>
                        <p className="mt-1.5 text-base font-semibold text-noche-ink">
                          {producto.carbohidratos_g ?? "—"}g
                        </p>
                        <p className="text-[9px] uppercase tracking-widest2 text-noche-ink-muted">Carbos</p>
                      </div>
                      <div className="rounded-lg border border-noche-border bg-noche-surface-2 p-2.5 text-center">
                        <span className="mx-auto flex h-4 w-4 items-center justify-center" style={{ color: MACRO_COLORS.grasas }}>
                          <DropletIcon className="h-4 w-4" />
                        </span>
                        <p className="mt-1.5 text-base font-semibold text-noche-ink">
                          {producto.grasas_g ?? "—"}g
                        </p>
                        <p className="text-[9px] uppercase tracking-widest2 text-noche-ink-muted">Grasas</p>
                      </div>
                    </div>
                  ) : null}

                  {macros.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-widest2 text-noche-ink-muted">
                        Desglose de macros
                      </p>
                      <div className="mt-3 flex items-center gap-4 rounded-lg border border-noche-border bg-noche-surface-2 p-3">
                        <Donut segments={macros} />
                        <ul className="min-w-0 flex-1 space-y-2 text-sm">
                          {macros.map((m) => {
                            const Icon = MACRO_ICONS[m.key];
                            return (
                              <li key={m.key} className="flex items-center justify-between gap-2">
                                <span className="flex min-w-0 items-center gap-2 text-noche-ink-muted">
                                  <span
                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                                    style={{ backgroundColor: `${m.color}26`, color: m.color }}
                                  >
                                    <Icon className="h-3 w-3" />
                                  </span>
                                  <span className="truncate">{m.label}</span>
                                </span>
                                <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                                  <span className="font-medium text-noche-ink">{m.grams}g</span>
                                  <span className="text-xs text-noche-ink-faint">({m.pctInt}%)</span>
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg border border-dashed border-noche-border p-4 text-center text-sm text-noche-ink-faint">
                      Sin datos de macronutrientes.
                    </div>
                  )}

                  {producto.calorias != null ? (
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-widest2 text-noche-ink-muted">
                        Valores por ración
                      </p>
                      <div className="mt-3 rounded-lg border border-noche-border bg-noche-surface-2 px-3">
                        <TablaFila label="Valor energético" value={`${producto.calorias} kcal`} />
                        <TablaFila
                          label="Grasas"
                          value={`${producto.grasas_g ?? "—"} g`}
                          sub={
                            producto.grasas_saturadas_g != null
                              ? { label: "de las cuales saturadas", value: `${producto.grasas_saturadas_g} g` }
                              : undefined
                          }
                        />
                        <TablaFila
                          label="Hidratos de carbono"
                          value={`${producto.carbohidratos_g ?? "—"} g`}
                          sub={
                            producto.azucares_g != null
                              ? { label: "de los cuales azúcares", value: `${producto.azucares_g} g` }
                              : undefined
                          }
                        />
                        <TablaFila label="Proteínas" value={`${producto.proteinas_g ?? "—"} g`} />
                        {producto.sal_g != null ? (
                          <TablaFila label="Sal" value={`${producto.sal_g} g`} />
                        ) : null}
                      </div>
                      <p className="mt-2 text-[11px] text-noche-ink-faint">
                        Valores aproximados por ración.
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-center text-sm text-noche-ink-muted">
                  Información nutricional no disponible para este producto.
                </div>
              )}
            </div>
          </div>

            {items.length > 1 ? (
              <div className="mt-4 flex items-center justify-center gap-2">
                {items.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(i)}
                    aria-label={`Ver ${item.nombre}`}
                    aria-current={i === activeIndex}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeIndex ? "w-6 bg-noche-primary" : "w-1.5 bg-noche-border"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {items.length > 1 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Producto siguiente"
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-noche-border bg-noche-surface/80 text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary sm:flex"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
