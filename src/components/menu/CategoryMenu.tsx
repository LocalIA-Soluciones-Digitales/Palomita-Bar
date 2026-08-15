"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatCentimos } from "@/lib/format";
import { CloseIcon } from "@/components/icons";
import type { Categoria, Producto } from "@/lib/restaurant/types";

export interface MenuCartControls {
  getQuantity: (productoId: string) => number;
  onAdd: (producto: Producto) => void;
  onIncrement: (productoId: string) => void;
  onDecrement: (productoId: string) => void;
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
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

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxUrl]);

  const scrollToCategory = (id: string) => {
    const node = sectionRefs.current[id];
    if (!node) return;
    const y = node.getBoundingClientRect().top + window.scrollY - 140;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-6 border-b border-noche-border bg-noche-bg/95 px-6 py-3 backdrop-blur-md">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto">
          {categoriasConProductos.map((categoria) => (
            <button
              key={categoria.id}
              type="button"
              onClick={() => scrollToCategory(categoria.id)}
              className={`shrink-0 whitespace-nowrap px-4 py-2 text-xs uppercase tracking-widest2 transition-colors ${
                activeId === categoria.id
                  ? "bg-noche-primary text-white"
                  : "text-noche-ink-muted hover:text-noche-ink"
              }`}
            >
              {categoria.nombre}
            </button>
          ))}
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
              <h2 className="font-display text-3xl text-noche-ink">{categoria.nombre}</h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {items.map((producto) => {
                  const cantidad = cart?.getQuantity(producto.id) ?? 0;
                  const isHighlighted = highlighted === producto.id;

                  return (
                    <div
                      key={producto.id}
                      data-product-id={producto.id}
                      className={`flex gap-4 border p-4 transition-all duration-500 ${
                        isHighlighted
                          ? "border-noche-primary bg-noche-surface"
                          : "border-noche-border bg-noche-surface/40"
                      }`}
                    >
                      {producto.imagen_url ? (
                        <button
                          type="button"
                          onClick={() => setLightboxUrl(producto.imagen_url)}
                          className="relative h-24 w-24 shrink-0 overflow-hidden bg-noche-surface-2"
                          aria-label={`Ver foto de ${producto.nombre}`}
                        >
                          <Image
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            fill
                            sizes="96px"
                            className="object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </button>
                      ) : (
                        <div className="h-24 w-24 shrink-0 bg-noche-surface-2" />
                      )}

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-display text-lg text-noche-ink">{producto.nombre}</p>
                          {producto.destacado ? (
                            <span className="shrink-0 whitespace-nowrap bg-noche-accent/20 px-2 py-0.5 text-[10px] uppercase tracking-widest2 text-noche-accent">
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
                          <p className="text-sm text-noche-ink/90">
                            {formatCentimos(producto.precio_centimos)} €
                          </p>

                          {cart ? (
                            cantidad > 0 ? (
                              <div className="flex shrink-0 items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => cart.onDecrement(producto.id)}
                                  aria-label="Quitar una unidad"
                                  className="flex h-8 w-8 items-center justify-center border border-noche-border text-noche-ink"
                                >
                                  −
                                </button>
                                <span className="w-4 text-center text-sm text-noche-ink">
                                  {cantidad}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => cart.onIncrement(producto.id)}
                                  aria-label="Añadir una unidad"
                                  className="flex h-8 w-8 items-center justify-center border border-noche-border text-noche-ink"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => cart.onAdd(producto)}
                                className="shrink-0 border border-noche-primary px-3 py-1.5 text-xs uppercase tracking-widest2 text-noche-primary transition-colors hover:bg-noche-primary hover:text-white"
                              >
                                Añadir
                              </button>
                            )
                          ) : null}
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

      {lightboxUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-noche-bg/95 p-6 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            aria-label="Cerrar"
            className="absolute right-6 top-6 text-noche-ink"
          >
            <CloseIcon className="h-7 w-7" />
          </button>
          <div className="relative h-full max-h-[80vh] w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <Image src={lightboxUrl} alt="" fill sizes="90vw" className="object-contain" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
