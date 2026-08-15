"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatCentimos } from "@/lib/format";
import { MinusIcon, PlusIcon } from "@/components/icons";
import { ProductDetailModal } from "@/components/menu/ProductDetailModal";
import type { Categoria, Producto } from "@/lib/restaurant/types";

export interface MenuCartControls {
  getQuantity: (productoId: string) => number;
  onAdd: (producto: Producto) => void;
  onIncrement: (productoId: string) => void;
  onDecrement: (productoId: string) => void;
}

interface DetalleActivo {
  categoriaId: string;
  index: number;
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
  const [detalle, setDetalle] = useState<DetalleActivo | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(highlightProductId ?? null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const scrollToCategory = (id: string) => {
    const node = sectionRefs.current[id];
    if (!node) return;
    const y = node.getBoundingClientRect().top + window.scrollY - 140;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const detalleCategoria = detalle
    ? categoriasConProductos.find((c) => c.id === detalle.categoriaId) ?? null
    : null;
  const detalleItems = detalle
    ? productos.filter((p) => p.categoria_id === detalle.categoriaId)
    : [];

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
                {items.map((producto, index) => {
                  const cantidad = cart?.getQuantity(producto.id) ?? 0;
                  const isHighlighted = highlighted === producto.id;
                  const tieneNutricion =
                    producto.ingredientes.length > 0 || producto.calorias != null;

                  return (
                    <div
                      key={producto.id}
                      data-product-id={producto.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Ver detalle de ${producto.nombre}`}
                      onClick={() => setDetalle({ categoriaId: categoria.id, index })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setDetalle({ categoriaId: categoria.id, index });
                        }
                      }}
                      className={`group flex cursor-pointer gap-4 rounded-lg border p-4 transition-all duration-300 ${
                        isHighlighted
                          ? "border-noche-primary bg-noche-surface"
                          : "border-noche-border bg-noche-surface/40 hover:border-noche-primary/60"
                      }`}
                    >
                      {producto.imagen_url ? (
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-noche-surface-2">
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
                        </div>
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
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {detalle && detalleCategoria && detalleItems.length > 0 ? (
        <ProductDetailModal
          items={detalleItems}
          activeIndex={Math.min(detalle.index, detalleItems.length - 1)}
          categoriaNombre={detalleCategoria.nombre}
          onClose={() => setDetalle(null)}
          onNavigate={(index) => setDetalle({ categoriaId: detalleCategoria.id, index })}
          cart={cart}
        />
      ) : null}
    </div>
  );
}
