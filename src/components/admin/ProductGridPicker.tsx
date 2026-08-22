"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { formatCentimos } from "@/lib/format";
import type { Categoria, Producto } from "@/lib/restaurant/types";
import { CloseIcon, MinusIcon, PlusIcon, SearchIcon } from "@/components/icons";

const TIPO_LABEL: Record<string, string> = {
  comida: "Comida",
  bebida: "Bebida",
};

export function ProductGridPicker({
  categorias,
  productos,
  categoriaActiva,
  onCategoriaChange,
  cantidades,
  onCantidadChange,
  className,
  gridClassName = "grid-cols-2",
  listMaxHeightClassName,
}: {
  categorias: Categoria[];
  productos: Producto[];
  categoriaActiva: string | null;
  onCategoriaChange: (id: string) => void;
  cantidades: Record<string, number>;
  onCantidadChange: (productoId: string, delta: number) => void;
  className?: string;
  gridClassName?: string;
  listMaxHeightClassName?: string;
}) {
  const [busqueda, setBusqueda] = useState("");

  const tipos = useMemo(() => {
    const vistos = new Set<string>();
    const orden: string[] = [];
    for (const c of categorias) {
      if (!vistos.has(c.tipo)) {
        vistos.add(c.tipo);
        orden.push(c.tipo);
      }
    }
    return orden;
  }, [categorias]);

  const tipoActivo =
    categorias.find((c) => c.id === categoriaActiva)?.tipo ?? tipos[0] ?? "bebida";

  const categoriasTipo = useMemo(
    () => categorias.filter((c) => c.tipo === tipoActivo),
    [categorias, tipoActivo],
  );

  const cambiarTipo = (tipo: string) => {
    const primera = categorias.find((c) => c.tipo === tipo);
    if (primera) onCategoriaChange(primera.id);
    setBusqueda("");
  };

  const busquedaNormalizada = busqueda.trim().toLocaleLowerCase("es");
  const enBusqueda = busquedaNormalizada.length > 0;

  const productosCategoria = useMemo(() => {
    if (enBusqueda) {
      return productos
        .filter((p) => p.nombre.toLocaleLowerCase("es").includes(busquedaNormalizada))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
    }
    return productos
      .filter((p) => p.categoria_id === categoriaActiva)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
  }, [productos, enBusqueda, busquedaNormalizada, categoriaActiva]);

  const grid = (
    <div className={`grid gap-2 ${gridClassName}`}>
      {productosCategoria.map((producto) => {
        const cantidad = cantidades[producto.id] ?? 0;
        return (
          <div
            key={producto.id}
            className={`flex flex-col justify-between rounded-xl border p-3 transition-colors ${
              cantidad > 0
                ? "border-noche-primary bg-noche-primary/5"
                : "border-noche-border bg-noche-surface-2/60"
            }`}
          >
            <div className="flex flex-col items-center text-center">
              {producto.imagen_url ? (
                <div className="relative mb-1.5 h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-noche-surface-3">
                  <Image
                    src={producto.imagen_url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <p className="text-base font-semibold leading-snug text-noche-ink">{producto.nombre}</p>
              <p className="mt-0.5 text-xs text-noche-ink-muted">
                {formatCentimos(producto.precio_centimos)} €
              </p>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onCantidadChange(producto.id, -1)}
                disabled={cantidad === 0}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-noche-border text-noche-ink transition-colors disabled:opacity-30"
              >
                <MinusIcon className="h-3 w-3" />
              </button>
              <span className="text-sm font-semibold tabular-nums text-noche-ink">{cantidad}</span>
              <button
                type="button"
                onClick={() => onCantidadChange(producto.id, 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-noche-primary text-noche-ink transition-colors hover:bg-noche-primary-dark"
              >
                <PlusIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
      {productosCategoria.length === 0 ? (
        <p className="col-span-full py-6 text-center text-xs text-noche-ink-muted">
          {enBusqueda ? "Sin resultados para esa búsqueda." : "Sin productos en esta categoría."}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className={className}>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-noche-ink-faint" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar producto…"
          aria-label="Buscar producto"
          className="w-full rounded-full border border-noche-border bg-noche-surface-2/60 py-2 pl-9 pr-9 text-sm text-noche-ink placeholder:text-noche-ink-faint outline-none transition-colors focus:border-noche-primary"
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

      {enBusqueda ? (
        <p className="mt-2 text-xs text-noche-ink-faint">
          {productosCategoria.length} resultado(s) para &ldquo;{busqueda.trim()}&rdquo;
        </p>
      ) : (
        <>
          {tipos.length > 1 ? (
            <div className="mt-3 flex gap-1.5">
              {tipos.map((tipo) => {
                const activo = tipo === tipoActivo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => cambiarTipo(tipo)}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-widest2 transition-colors ${
                      activo
                        ? "bg-noche-ink text-noche-bg"
                        : "bg-noche-surface-2 text-noche-ink-muted hover:bg-noche-surface-3 hover:text-noche-ink"
                    }`}
                  >
                    {TIPO_LABEL[tipo] ?? tipo}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="-mb-1 mt-2.5 flex gap-1.5 overflow-x-auto pb-1 pr-2 pt-1">
            {categoriasTipo.map((c) => {
              const activa = categoriaActiva === c.id;
              const enCarrito = productos
                .filter((p) => p.categoria_id === c.id)
                .reduce((n, p) => n + (cantidades[p.id] ?? 0), 0);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onCategoriaChange(c.id)}
                  className={`relative shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold uppercase tracking-widest2 transition-colors ${
                    activa
                      ? "bg-noche-primary text-noche-ink shadow-sm"
                      : "bg-noche-surface-2 text-noche-ink-muted hover:bg-noche-surface-3 hover:text-noche-ink"
                  }`}
                >
                  {c.nombre}
                  {enCarrito > 0 ? (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-noche-danger px-1 text-[10px] font-bold text-white">
                      {enCarrito}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
      )}

      {listMaxHeightClassName ? (
        <div className={`mt-3 overflow-y-auto ${listMaxHeightClassName}`}>{grid}</div>
      ) : (
        <div className="mt-3">{grid}</div>
      )}
    </div>
  );
}
