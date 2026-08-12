"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-context";
import { formatCentimos } from "@/lib/format";
import { crearPedido } from "@/lib/restaurant/queries";

export function CartSheet({
  mesaIdentificador,
  onClose,
}: {
  mesaIdentificador: string;
  onClose: () => void;
}) {
  const { lines, increment, decrement, removeItem, totalCentimos, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCheckout = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const pedidoId = await crearPedido({
        mesaIdentificador,
        paymentMethod: "LOCAL",
        items: lines.map((l) => ({
          producto_id: l.producto.id,
          cantidad: l.cantidad,
        })),
      });
      clear();
      router.push(`/pedido/${pedidoId}`);
    } catch {
      setError(
        "No hemos podido completar tu pedido. Comprueba tu conexión e inténtalo de nuevo.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-brand-black/40"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-brand-cream p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Tu pedido</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm uppercase tracking-widest2 text-brand-ink/60"
          >
            Cerrar
          </button>
        </div>

        <ul className="mt-6 divide-y divide-brand-black/10">
          {lines.map((line) => (
            <li key={line.producto.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{line.producto.nombre}</p>
                <p className="text-xs text-brand-ink/60">
                  {formatCentimos(line.producto.precio_centimos)} € · {line.cantidad}{" "}
                  {line.cantidad === 1 ? "unidad" : "unidades"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => decrement(line.producto.id)}
                  aria-label="Quitar una unidad"
                  className="flex h-8 w-8 items-center justify-center border border-brand-black/20"
                >
                  −
                </button>
                <span className="w-4 text-center text-sm">{line.cantidad}</span>
                <button
                  type="button"
                  onClick={() => increment(line.producto.id)}
                  aria-label="Añadir una unidad"
                  className="flex h-8 w-8 items-center justify-center border border-brand-black/20"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(line.producto.id)}
                  aria-label="Eliminar producto del pedido"
                  className="ml-1 text-brand-ink/40 hover:text-brand-pink"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between border-t border-brand-black/10 pt-4">
          <span className="text-sm uppercase tracking-widest2">Total</span>
          <span className="font-display text-2xl">{formatCentimos(totalCentimos)} €</span>
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">Pago</p>
          <div className="mt-2 flex gap-2">
            <div className="flex-1 border border-brand-black bg-brand-black px-4 py-3 text-center text-sm text-brand-cream">
              Pagar en local
            </div>
            <div className="flex-1 border border-brand-black/15 px-4 py-3 text-center text-sm text-brand-ink/35">
              Pagar online (próximamente)
            </div>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={submitting || lines.length === 0}
          className="mt-6 w-full bg-brand-pink py-4 text-sm uppercase tracking-widest2 text-white transition-colors hover:bg-brand-pink-dark disabled:opacity-50"
        >
          {submitting ? "Enviando pedido…" : "Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}
