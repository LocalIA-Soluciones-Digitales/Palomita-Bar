"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatCentimos } from "@/lib/format";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/icons";
import type { Categoria, Producto } from "@/lib/restaurant/types";

export interface MenuCartControls {
  getQuantity: (productoId: string) => number;
  onAdd: (producto: Producto) => void;
  onIncrement: (productoId: string) => void;
  onDecrement: (productoId: string) => void;
}

interface Lightbox {
  url: string;
  nombre: string;
}

export function CategoryMenu({
  categorias,
  productos,
  highlightProductId,
  cart,
}: {
  categorias: Categoria[];
  productos: Producto[];
  highlightProductId?: string;
  cart?: MenuCartControls;
}) {
  const [activeId, setActiveId] = useState<string | null>(categorias[0]?.id ?? null);
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(highlightProductId ?? null);
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleFlip = (id: string) => {
    setFlippedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categoriasConProductos = useMemo(
    () => categorias.filter((c) => productos.some((p) => p.categoria_id === c.id)),
    [categorias, productos],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
          setActiveId(top.target.id.replace("categoria-", ""));
        }
      },
      { rootMargin: "-160px 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    Object.values(sectionRefs.current).forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [categoriasConProductos]);

  useEffect(() => {
    if (!highlightProductId) return;
    const frame = requestAnimationFrame(() => {
      const node = document.querySelector(`[data-product-id="${highlightProductId}"]`);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const timeout = setTimeout(() => setHighlighted(null), 2200);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [highlightProductId]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  const scrollToCategory = (id: string) => {
    const node = sectionRefs.current[id];
    if (!node) return;
    const y = node.getBoundingClientRect().top + window.scrollY - 140;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-6 border-b border-noche-border bg-noche-bg/95 px-6 py-3 backdrop-blur-md">
        <div role="tablist" aria-label="Categorías" className="scrollbar-hide flex gap-2 overflow-x-auto">
          {categoriasConProductos.map((categoria) => {
            const count = productos.filter((p) => p.categoria_id === categoria.id).length;
            const selected = activeId === categoria.id;
            return (
              <button
                key={categoria.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => scrollToCategory(categoria.id)}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs uppercase tracking-widest2 transition-colors ${
                  selected
                    ? "bg-noche-primary text-white"
                    : "text-noche-ink-muted hover:text-noche-ink"
                }`}
              >
                {categoria.nombre} · {count}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-12 space-y-16">
        {categoriasConProductos.map((categoria) => {
          const items = productos.filter((p) => p.categoria_id === categoria.id);

          return (
            <div
              key={categoria.id}
              id={`categoria-${categoria.id}`}
              ref={(node) => {
                sectionRefs.current[categoria.id] = node;
              }}
              className="scroll-mt-36"
            >
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="h-px w-8 bg-noche-primary" />
                <h2 className="font-display text-3xl text-noche-ink">{categoria.nombre}</h2>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {items.map((producto) => {
                  const cantidad = cart?.getQuantity(producto.id) ?? 0;
                  const isHighlighted = highlighted === producto.id;
                  const isFlipped = flippedIds.has(producto.id);
                  const tieneNutricion =
                    producto.ingredientes.length > 0 || producto.calorias != null;

                  return (
                    <div key={producto.id} data-product-id={producto.id} className="[perspective:1600px]">
                      <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={isFlipped}
                        aria-label={
                          isFlipped
                            ? `Ocultar ingredientes de ${producto.nombre}`
                            : `Ver ingredientes y valores nutricionales de ${producto.nombre}`
                        }
                        onClick={() => toggleFlip(producto.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleFlip(producto.id);
                          }
                        }}
                        className={`group relative min-h-[212px] cursor-pointer transition-transform duration-700 ease-out [transform-style:preserve-3d] ${
                          isFlipped ? "[transform:rotateY(180deg)]" : ""
                        }`}
                      >
                        {/* Cara frontal */}
                        <div
                          className={`absolute inset-0 flex gap-4 rounded-lg border p-4 [backface-visibility:hidden] ${
                            isHighlighted
                              ? "border-noche-primary bg-noche-surface"
                              : "border-noche-border bg-noche-surface/40 hover:border-noche-primary/60"
                          }`}
                        >
                          {producto.imagen_url ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightbox({ url: producto.imagen_url as string, nombre: producto.nombre });
                              }}
                              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-noche-surface-2"
                              aria-label={`Ver foto de ${producto.nombre}`}
                            >
                              <Image
                                src={producto.imagen_url}
                                alt={producto.nombre}
                                fill
                                sizes="96px"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              {producto.destacado ? (
                                <>
                                  <div className="absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
                                  <span className="absolute bottom-1 left-1 rounded bg-noche-accent/90 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-widest2 text-white">
                                    Top
                                  </span>
                                </>
                              ) : null}
                            </button>
                          ) : (
                            <div className="h-24 w-24 shrink-0 rounded-lg bg-noche-surface-2" />
                          )}

                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-display text-lg text-noche-ink">{producto.nombre}</p>
                              {producto.destacado && !producto.imagen_url ? (
                                <span className="shrink-0 whitespace-nowrap rounded bg-noche-accent/20 px-2 py-0.5 text-[10px] uppercase tracking-widest2 text-noche-accent">
                                  Recomendado
                                </span>
                              ) : null}
                            </div>
                            {producto.descripcion ? (
                              <p className="mt-1 text-sm text-noche-ink-muted">
                                {producto.descripcion}
                              </p>
                            ) : null}

                            <div className="mt-auto flex items-center justify-between pt-3">
                              <p className="text-sm font-medium text-noche-primary">
                                {formatCentimos(producto.precio_centimos)} €
                              </p>

                              {cart ? (
                                cantidad > 0 ? (
                                  <div
                                    className="flex shrink-0 items-center gap-3"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => cart.onDecrement(producto.id)}
                                      aria-label="Quitar una unidad"
                                      className="flex h-8 w-8 items-center justify-center rounded-full border border-noche-border text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary"
                                    >
                                      <MinusIcon className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="w-4 text-center text-sm text-noche-ink">
                                      {cantidad}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => cart.onIncrement(producto.id)}
                                      aria-label="Añadir una unidad"
                                      className="flex h-8 w-8 items-center justify-center rounded-full border border-noche-border text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary"
                                    >
                                      <PlusIcon className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cart.onAdd(producto);
                                    }}
                                    className="shrink-0 rounded-lg border border-noche-primary px-3 py-1.5 text-xs uppercase tracking-widest2 text-noche-primary transition-colors hover:bg-noche-primary hover:text-white"
                                  >
                                    Añadir
                                  </button>
                                )
                              ) : null}
                            </div>

                            {tieneNutricion ? (
                              <p className="mt-1.5 text-[10px] uppercase tracking-widest2 text-noche-ink-muted/70">
                                Toca para ver ingredientes y calorías
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Cara trasera */}
                        <div
                          className="absolute inset-0 flex flex-col rounded-lg border border-noche-primary/60 bg-noche-surface p-4 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                        >
                          <p className="font-display text-lg text-noche-ink">{producto.nombre}</p>

                          {producto.ingredientes.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {producto.ingredientes.map((ingrediente) => (
                                <span
                                  key={ingrediente}
                                  className="rounded-full border border-noche-border bg-noche-surface-2 px-2 py-0.5 text-[11px] text-noche-ink-muted"
                                >
                                  {ingrediente}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-noche-ink-muted">
                              Ingredientes no disponibles.
                            </p>
                          )}

                          {producto.calorias != null ? (
                            <div className="mt-auto grid grid-cols-4 gap-2 pt-3 text-center">
                              <div>
                                <p className="text-sm font-medium text-noche-primary">
                                  {producto.calorias}
                                </p>
                                <p className="text-[9px] uppercase tracking-widest2 text-noche-ink-muted">
                                  Kcal
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-noche-ink">
                                  {producto.proteinas_g ?? "—"}g
                                </p>
                                <p className="text-[9px] uppercase tracking-widest2 text-noche-ink-muted">
                                  Prot.
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-noche-ink">
                                  {producto.carbohidratos_g ?? "—"}g
                                </p>
                                <p className="text-[9px] uppercase tracking-widest2 text-noche-ink-muted">
                                  Carbs
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-noche-ink">
                                  {producto.grasas_g ?? "—"}g
                                </p>
                                <p className="text-[9px] uppercase tracking-widest2 text-noche-ink-muted">
                                  Grasas
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-auto pt-3 text-sm text-noche-ink-muted">
                              Información nutricional no disponible.
                            </p>
                          )}

                          <p className="mt-2 text-center text-[10px] uppercase tracking-widest2 text-noche-ink-muted/70">
                            Toca para volver
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-noche-bg/95 p-6 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Cerrar"
            className="absolute right-6 top-6 text-noche-ink"
          >
            <CloseIcon className="h-7 w-7" />
          </button>
          <div
            className="relative h-full max-h-[80vh] w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightbox.url}
              alt={lightbox.nombre}
              fill
              sizes="90vw"
              className="rounded-lg object-contain"
            />
          </div>
          <p className="mt-4 font-display text-lg text-noche-ink">{lightbox.nombre}</p>
        </div>
      ) : null}
    </div>
  );
}
