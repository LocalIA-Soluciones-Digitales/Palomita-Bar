"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatCentimos } from "@/lib/format";
import {
  AllergenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  EyeIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/icons";
import { ProductDetailModal } from "@/components/menu/ProductDetailModal";
import { vibrarSuave } from "@/lib/haptics";
import type { Categoria, Producto } from "@/lib/restaurant/types";

export interface MenuCartControls {
  getQuantity: (productoId: string) => number;
  onAdd: (producto: Producto) => void;
  onIncrement: (productoId: string) => void;
  onDecrement: (productoId: string) => void;
}

interface OrigenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface DetalleActivo {
  categoriaId: string;
  index: number;
  origen: OrigenRect;
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
  const [busqueda, setBusqueda] = useState("");
  const [alergenosExcluidos, setAlergenosExcluidos] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const alergenosDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const p of productos) for (const a of p.alergenos) set.add(a);
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [productos]);

  const toggleAlergeno = (alergeno: string) => {
    setAlergenosExcluidos((prev) => {
      const next = new Set(prev);
      if (next.has(alergeno)) next.delete(alergeno);
      else next.add(alergeno);
      return next;
    });
  };

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es");
    return productos.filter((p) => {
      if (alergenosExcluidos.size > 0 && p.alergenos.some((a) => alergenosExcluidos.has(a))) {
        return false;
      }
      if (!texto) return true;
      const nombre = p.nombre.toLocaleLowerCase("es");
      const descripcion = (p.descripcion ?? "").toLocaleLowerCase("es");
      return nombre.includes(texto) || descripcion.includes(texto);
    });
  }, [productos, busqueda, alergenosExcluidos]);

  const hayFiltrosActivos = busqueda.trim() !== "" || alergenosExcluidos.size > 0;

  const categoriasConProductos = useMemo(
    () => categorias.filter((c) => productosFiltrados.some((p) => p.categoria_id === c.id)),
    [categorias, productosFiltrados],
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

  const updateCategoryScrollState = () => {
    const node = categoryScrollRef.current;
    if (!node) return;
    setCanScrollLeft(node.scrollLeft > 4);
    setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 4);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(updateCategoryScrollState);
    window.addEventListener("resize", updateCategoryScrollState);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateCategoryScrollState);
    };
  }, [categoriasConProductos]);

  const scrollCategoryBar = (direction: "left" | "right") => {
    const node = categoryScrollRef.current;
    if (!node) return;
    node.scrollBy({ left: direction === "left" ? -180 : 180, behavior: "smooth" });
  };

  const scrollToCategory = (id: string) => {
    const node = sectionRefs.current[id];
    if (!node) return;
    const stickyBarHeight = stickyRef.current?.getBoundingClientRect().height ?? 76;
    const headerHeight = 64 + stickyBarHeight;
    const y = node.getBoundingClientRect().top + window.scrollY - headerHeight - 24;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const detalleCategoria = detalle
    ? categoriasConProductos.find((c) => c.id === detalle.categoriaId) ?? null
    : null;
  const detalleItems = detalle
    ? productosFiltrados.filter((p) => p.categoria_id === detalle.categoriaId)
    : [];

  return (
    <div>
      <div
        ref={stickyRef}
        className="sticky top-16 z-20 -mx-6 border-b border-noche-border bg-noche-bg/95 px-6 py-3 backdrop-blur-md"
      >
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-noche-ink-faint" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en la carta…"
            aria-label="Buscar en la carta"
            className="w-full rounded-full border border-noche-border bg-noche-surface/60 py-2 pl-9 pr-9 text-sm text-noche-ink placeholder:text-noche-ink-faint outline-none transition-colors focus:border-noche-primary"
          />
          {busqueda ? (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              aria-label="Borrar búsqueda"
              className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-noche-ink-faint hover:text-noche-ink"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {alergenosDisponibles.length > 0 ? (
          <div className="scrollbar-hide mt-2 flex gap-1.5 overflow-x-auto">
            {alergenosDisponibles.map((alergeno) => {
              const excluido = alergenosExcluidos.has(alergeno);
              return (
                <button
                  key={alergeno}
                  type="button"
                  aria-pressed={excluido}
                  onClick={() => toggleAlergeno(alergeno)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] uppercase tracking-widest2 transition-colors ${
                    excluido
                      ? "border-noche-primary bg-noche-primary/15 text-noche-primary"
                      : "border-noche-border text-noche-ink-faint hover:text-noche-ink"
                  }`}
                >
                  Sin {alergeno}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="relative mt-3">
          <div
            ref={categoryScrollRef}
            role="tablist"
            aria-label="Categorías"
            onScroll={updateCategoryScrollState}
            className="scrollbar-hide flex gap-2 overflow-x-auto scroll-smooth"
          >
            {categoriasConProductos.map((categoria) => {
              const count = productosFiltrados.filter((p) => p.categoria_id === categoria.id).length;
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

          {canScrollLeft ? (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center bg-gradient-to-r from-noche-bg to-transparent">
              <button
                type="button"
                onClick={() => scrollCategoryBar("left")}
                aria-label="Ver categorías anteriores"
                className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-noche-border bg-noche-surface text-noche-ink shadow-sm transition-colors hover:border-noche-primary hover:text-noche-primary"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {canScrollRight ? (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-end bg-gradient-to-l from-noche-bg to-transparent">
              <button
                type="button"
                onClick={() => scrollCategoryBar("right")}
                aria-label="Ver más categorías"
                className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-noche-border bg-noche-surface text-noche-ink shadow-sm transition-colors hover:border-noche-primary hover:text-noche-primary"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {hayFiltrosActivos && categoriasConProductos.length === 0 ? (
        <p className="mt-12 text-center text-sm text-noche-ink-muted">
          No hay productos que coincidan con la búsqueda o los filtros.
        </p>
      ) : null}

      <div className="mt-12 space-y-16">
        {categoriasConProductos.map((categoria) => {
          const items = productosFiltrados.filter((p) => p.categoria_id === categoria.id);

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
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDetalle({
                          categoriaId: categoria.id,
                          index,
                          origen: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDetalle({
                            categoriaId: categoria.id,
                            index,
                            origen: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
                          });
                        }
                      }}
                      className={`group flex cursor-pointer gap-4 rounded-xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${
                        isHighlighted
                          ? "border-noche-primary bg-noche-surface"
                          : "border-noche-border bg-noche-surface/40 hover:border-noche-primary/60"
                      }`}
                    >
                      {producto.imagen_url ? (
                        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-noche-surface-2">
                          <Image
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            fill
                            sizes="112px"
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
                        <div className="h-28 w-28 shrink-0 rounded-lg bg-noche-surface-2" />
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
                                  onClick={() => {
                                    vibrarSuave();
                                    cart.onIncrement(producto.id);
                                  }}
                                  aria-label="Añadir una unidad"
                                  className="flex h-8 w-8 items-center justify-center rounded-full border border-noche-border text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary active:scale-90"
                                >
                                  <PlusIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  vibrarSuave();
                                  cart.onAdd(producto);
                                }}
                                className="shrink-0 rounded-lg border border-noche-primary px-3 py-1.5 text-xs uppercase tracking-widest2 text-noche-primary transition-colors hover:bg-noche-primary hover:text-white active:scale-95"
                              >
                                Añadir
                              </button>
                            )
                          ) : null}
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {tieneNutricion ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-noche-ink-faint">
                              <EyeIcon className="h-3 w-3" />
                              Ingredientes y calorías
                            </span>
                          ) : null}
                          {producto.alergenos.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-noche-ink-faint">
                              <AllergenIcon className="h-3 w-3" />
                              {producto.alergenos.join(", ")}
                            </span>
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

      {detalle && detalleCategoria && detalleItems.length > 0 ? (
        <ProductDetailModal
          items={detalleItems}
          activeIndex={Math.min(detalle.index, detalleItems.length - 1)}
          categoriaNombre={detalleCategoria.nombre}
          origen={detalle.origen}
          onClose={() => setDetalle(null)}
          onNavigate={(index) =>
            setDetalle({ categoriaId: detalleCategoria.id, index, origen: detalle.origen })
          }
          cart={cart}
        />
      ) : null}
    </div>
  );
}
