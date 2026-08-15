"use client";

import { useEffect, useState } from "react";
import { getCarta, getCategorias, crearPedido } from "@/lib/restaurant/queries";
import { formatCentimos } from "@/lib/format";
import type { Categoria, Producto } from "@/lib/restaurant/types";
import { MinusIcon, PlusIcon } from "@/components/icons";

export function PedidoRapidoForm({
  mesaIdentificador,
  onPedidoCreado,
}: {
  mesaIdentificador: string;
  onPedidoCreado: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto || categorias.length > 0) return;
    Promise.all([getCategorias(), getCarta()]).then(([cats, prods]) => {
      setCategorias(cats);
      setProductos(prods);
      setCategoriaActiva(cats.find((c) => c.tipo === "bebida")?.id ?? cats[0]?.id ?? null);
    });
  }, [abierto, categorias.length]);

  const setCantidad = (productoId: string, delta: number) => {
    setCantidades((prev) => {
      const actual = prev[productoId] ?? 0;
      const nueva = Math.max(0, actual + delta);
      return { ...prev, [productoId]: nueva };
    });
  };

  const lineas = Object.entries(cantidades)
    .filter(([, cantidad]) => cantidad > 0)
    .map(([productoId, cantidad]) => ({
      producto: productos.find((p) => p.id === productoId)!,
      cantidad,
    }));

  const totalCentimos = lineas.reduce(
    (sum, l) => sum + l.producto.precio_centimos * l.cantidad,
    0,
  );

  const handleEnviar = async () => {
    if (lineas.length === 0) return;
    setEnviando(true);
    setError(null);
    try {
      await crearPedido({
        mesaIdentificador,
        paymentMethod: "LOCAL",
        items: lineas.map((l) => ({ producto_id: l.producto.id, cantidad: l.cantidad })),
      });
      setCantidades({});
      setAbierto(false);
      onPedidoCreado();
    } catch {
      setError("No se ha podido enviar el pedido.");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-noche-border py-2 text-xs uppercase tracking-widest2 text-noche-ink-muted hover:border-noche-primary hover:text-noche-ink"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Nuevo pedido (barra)
      </button>
    );
  }

  const productosCategoria = productos.filter((p) => p.categoria_id === categoriaActiva);

  return (
    <div className="mt-3 rounded-lg border border-noche-border bg-noche-surface-2/60 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Nuevo pedido</p>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-xs text-noche-ink-faint hover:text-noche-primary"
        >
          Cancelar
        </button>
      </div>

      {categorias.length === 0 ? (
        <p className="mt-3 text-sm text-noche-ink-muted">Cargando carta…</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-1">
            {categorias.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoriaActiva(c.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] uppercase tracking-widest2 ${
                  categoriaActiva === c.id
                    ? "bg-noche-primary/15 text-noche-primary"
                    : "bg-noche-surface text-noche-ink-muted"
                }`}
              >
                {c.nombre}
              </button>
            ))}
          </div>

          <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
            {productosCategoria.map((producto) => {
              const cantidad = cantidades[producto.id] ?? 0;
              return (
                <div key={producto.id} className="flex items-center justify-between gap-2 py-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-noche-ink">{producto.nombre}</p>
                    <p className="text-xs text-noche-ink-muted">
                      {formatCentimos(producto.precio_centimos)} €
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCantidad(producto.id, -1)}
                      disabled={cantidad === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-noche-border text-noche-ink disabled:opacity-30"
                    >
                      <MinusIcon className="h-3 w-3" />
                    </button>
                    <span className="w-4 text-center text-sm text-noche-ink">{cantidad}</span>
                    <button
                      type="button"
                      onClick={() => setCantidad(producto.id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-noche-border text-noche-ink"
                    >
                      <PlusIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {error ? <p className="mt-2 text-xs text-noche-danger">{error}</p> : null}

          <div className="mt-3 flex items-center justify-between border-t border-noche-border pt-2">
            <span className="text-sm font-medium text-noche-ink">{formatCentimos(totalCentimos)} €</span>
            <button
              type="button"
              disabled={lineas.length === 0 || enviando}
              onClick={handleEnviar}
              className="rounded-lg bg-noche-primary px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink disabled:opacity-40"
            >
              {enviando ? "Enviando…" : "Enviar a cocina"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
