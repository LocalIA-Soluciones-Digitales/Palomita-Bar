"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getCarta, getCategorias, crearPedido } from "@/lib/restaurant/queries";
import { getPedidosHistorialAdmin } from "@/lib/restaurant/admin-queries";
import { formatCentimos } from "@/lib/format";
import { renderTicketComandaHTML, renderTicketCuentaHTML, imprimirTicketHTML } from "@/lib/print/ticket";
import type { Categoria, Producto } from "@/lib/restaurant/types";
import type { PedidoCocina } from "@/lib/restaurant/cocina-types";
import { ProductGridPicker } from "@/components/admin/ProductGridPicker";
import { CheckIcon, PrinterIcon, TrashIcon } from "@/components/icons";

export function BarraPOS() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const [recientes, setRecientes] = useState<PedidoCocina[]>([]);

  useEffect(() => {
    Promise.all([getCategorias(), getCarta()]).then(([cats, prods]) => {
      setCategorias(cats);
      setProductos(prods);
      setCategoriaActiva(cats.find((c) => c.tipo === "bebida")?.id ?? cats[0]?.id ?? null);
    });
  }, []);

  const cargarRecientes = useCallback(() => {
    getPedidosHistorialAdmin(1)
      .then((pedidos) => setRecientes(pedidos.filter((p) => !p.mesa_numero).slice(0, 12)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    cargarRecientes();
  }, [cargarRecientes]);

  const setCantidad = (productoId: string, delta: number) => {
    setCantidades((prev) => {
      const actual = prev[productoId] ?? 0;
      const nueva = Math.max(0, actual + delta);
      return { ...prev, [productoId]: nueva };
    });
  };

  const lineas = useMemo(
    () =>
      Object.entries(cantidades)
        .filter(([, cantidad]) => cantidad > 0)
        .map(([productoId, cantidad]) => ({
          producto: productos.find((p) => p.id === productoId),
          cantidad,
        }))
        .filter((l): l is { producto: Producto; cantidad: number } => Boolean(l.producto)),
    [cantidades, productos],
  );

  const totalCentimos = lineas.reduce((sum, l) => sum + l.producto.precio_centimos * l.cantidad, 0);
  const totalUnidades = lineas.reduce((sum, l) => sum + l.cantidad, 0);

  const vaciar = () => {
    setCantidades({});
    setConfirmacion(null);
  };

  const handleEnviar = async () => {
    if (lineas.length === 0) return;
    setEnviando(true);
    setError(null);
    try {
      await crearPedido({
        paymentMethod: "LOCAL",
        items: lineas.map((l) => ({ producto_id: l.producto.id, cantidad: l.cantidad })),
      });

      const html = renderTicketComandaHTML({
        destino: "BARRA",
        mesaEtiqueta: "Barra",
        items: lineas.map((l) => ({ cantidad: l.cantidad, nombre: l.producto.nombre })),
      });
      imprimirTicketHTML(html);

      setCantidades({});
      setConfirmacion("Pedido enviado a cocina.");
      cargarRecientes();
      setTimeout(() => setConfirmacion(null), 4000);
    } catch {
      setError("No se ha podido enviar el pedido.");
    } finally {
      setEnviando(false);
    }
  };

  const handleImprimirCuenta = () => {
    if (lineas.length === 0) return;
    const html = renderTicketCuentaHTML({
      mesaEtiqueta: "Barra",
      items: lineas.map((l) => ({
        cantidad: l.cantidad,
        nombre: l.producto.nombre,
        precioUnitarioCentimos: l.producto.precio_centimos,
      })),
    });
    imprimirTicketHTML(html);
  };

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        {categorias.length === 0 ? (
          <p className="text-sm text-noche-ink-muted">Cargando carta…</p>
        ) : (
          <ProductGridPicker
            categorias={categorias}
            productos={productos}
            categoriaActiva={categoriaActiva}
            onCategoriaChange={setCategoriaActiva}
            cantidades={cantidades}
            onCantidadChange={setCantidad}
            gridClassName="grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
          />
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-noche-border bg-noche-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-noche-ink">Cuenta de barra</h2>
            {lineas.length > 0 ? (
              <button
                type="button"
                onClick={vaciar}
                className="flex items-center gap-1 text-xs text-noche-ink-faint hover:text-noche-danger"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Vaciar
              </button>
            ) : null}
          </div>

          {lineas.length === 0 ? (
            <p className="mt-3 text-sm text-noche-ink-muted">
              Selecciona productos de la carta para montar el pedido.
            </p>
          ) : (
            <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
              {lineas.map((l) => (
                <li key={l.producto.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-noche-ink">
                    <span className="text-noche-ink-muted">{l.cantidad}×</span> {l.producto.nombre}
                  </span>
                  <span className="shrink-0 text-noche-ink-muted">
                    {formatCentimos(l.producto.precio_centimos * l.cantidad)} €
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-noche-border pt-3">
            <span className="text-sm text-noche-ink-muted">{totalUnidades} producto(s)</span>
            <span className="font-display text-xl text-noche-ink">{formatCentimos(totalCentimos)} €</span>
          </div>

          {error ? <p className="mt-2 text-xs text-noche-danger">{error}</p> : null}
          {confirmacion ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-noche-positive">
              <CheckIcon className="h-3.5 w-3.5" />
              {confirmacion}
            </p>
          ) : null}

          <div className="mt-3 space-y-2">
            <button
              type="button"
              disabled={lineas.length === 0 || enviando}
              onClick={handleEnviar}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-noche-primary py-2.5 text-xs uppercase tracking-widest2 text-noche-ink transition-colors hover:bg-noche-primary-dark disabled:opacity-40"
            >
              {enviando ? "Enviando…" : "Enviar a cocina"}
            </button>
            <button
              type="button"
              disabled={lineas.length === 0}
              onClick={handleImprimirCuenta}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-noche-border py-2.5 text-xs uppercase tracking-widest2 text-noche-ink transition-colors hover:bg-noche-surface-2 disabled:opacity-40"
            >
              <PrinterIcon className="h-3.5 w-3.5" />
              Imprimir cuenta
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-noche-border bg-noche-surface p-4">
          <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
            Últimos pedidos de barra
          </p>
          {recientes.length === 0 ? (
            <p className="mt-2 text-sm text-noche-ink-muted">Sin pedidos de barra hoy.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {recientes.map((p) => {
                const hora = new Date(p.created_at).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <li key={p.id} className="rounded-lg border border-noche-border/70 px-2.5 py-2 text-xs">
                    <div className="flex items-center justify-between text-noche-ink-muted">
                      <span>{hora}</span>
                      <span className="font-medium text-noche-ink">{formatCentimos(p.total_centimos)} €</span>
                    </div>
                    <p className="mt-1 truncate text-noche-ink">
                      {p.items.map((it) => `${it.cantidad}× ${it.producto_nombre}`).join(", ")}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
