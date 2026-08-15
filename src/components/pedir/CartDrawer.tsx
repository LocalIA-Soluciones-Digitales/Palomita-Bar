"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-context";
import { useTableSession } from "@/components/mesa/table-session-context";
import { useSesionParticipantes } from "@/components/mesa/useSesionParticipantes";
import { formatCentimos } from "@/lib/format";
import { splitEqually } from "@/lib/restaurant/split";
import { crearPedido, validarMesaPorNumero } from "@/lib/restaurant/queries";
import { CloseIcon, ShareIcon } from "@/components/icons";
import type { PaymentMethod, RepartoInput } from "@/lib/restaurant/types";

export function CartDrawer({
  mesaIdentificador,
  onClose,
}: {
  mesaIdentificador?: string;
  onClose: () => void;
}) {
  const { lines, increment, decrement, removeItem, toggleShare, totalCentimos, clear } = useCart();
  const { sesion, participante } = useTableSession();
  const otrosParticipantes = useSesionParticipantes(sesion?.id).filter(
    (p) => p.id !== participante?.id,
  );
  const separado = sesion?.modo === "SEPARADO" && Boolean(participante);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("LOCAL");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedMesaIdentificador, setResolvedMesaIdentificador] = useState<string | undefined>();
  const [needsTableNumber, setNeedsTableNumber] = useState(false);
  const [tableNumberInput, setTableNumberInput] = useState("");
  const [tableError, setTableError] = useState<string | null>(null);
  const [resolvingTable, setResolvingTable] = useState(false);
  const [sharingProductId, setSharingProductId] = useState<string | null>(null);
  const router = useRouter();

  const effectiveMesaIdentificador = mesaIdentificador ?? resolvedMesaIdentificador;

  const miParteCentimos = separado
    ? lines.reduce((sum, l) => {
        const totalLinea = l.producto.precio_centimos * l.cantidad;
        const partes = splitEqually(totalLinea, l.compartidoCon.length + 1);
        return sum + (partes[0] ?? 0);
      }, 0)
    : totalCentimos;

  const handleCheckout = async (mesaOverride?: string) => {
    const mesaParaPedido = mesaOverride ?? effectiveMesaIdentificador;

    if (!mesaParaPedido && !sesion) {
      setNeedsTableNumber(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const items = lines.map((l) => {
        let reparto: RepartoInput[] | undefined;
        if (separado && participante) {
          const participantesLinea = [participante.id, ...l.compartidoCon];
          const totalLinea = l.producto.precio_centimos * l.cantidad;
          const partes = splitEqually(totalLinea, participantesLinea.length);
          reparto = participantesLinea.map((id, i) => ({
            participante_id: id,
            importe_centimos: partes[i] ?? 0,
          }));
        }
        return {
          producto_id: l.producto.id,
          cantidad: l.cantidad,
          reparto,
        };
      });

      const pedidoId = await crearPedido({
        mesaIdentificador: sesion ? undefined : mesaParaPedido,
        paymentMethod,
        items,
        sesionId: sesion?.id,
        participanteId: separado ? participante?.id : undefined,
      });

      if (paymentMethod === "LOCAL") {
        clear();
        router.push(`/pedido/${pedidoId}`);
        return;
      }

      const response = await fetch(
        separado ? "/api/stripe/checkout-participante" : "/api/stripe/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            separado ? { participanteId: participante?.id } : { pedidoId },
          ),
        },
      );

      if (!response.ok) {
        throw new Error("checkout_failed");
      }

      const { url } = (await response.json()) as { url: string };
      clear();
      window.location.href = url;
    } catch {
      setError(
        "No hemos podido completar tu pedido. Comprueba tu conexión e inténtalo de nuevo.",
      );
      setSubmitting(false);
    }
  };

  const handleConfirmTableNumber = async () => {
    const numero = Number.parseInt(tableNumberInput, 10);
    if (!Number.isInteger(numero) || numero <= 0) {
      setTableError("Introduce un número de mesa válido.");
      return;
    }

    setResolvingTable(true);
    setTableError(null);
    const mesa = await validarMesaPorNumero(numero);
    setResolvingTable(false);

    if (!mesa) {
      setTableError("No encontramos esa mesa. Comprueba el número e inténtalo de nuevo.");
      return;
    }

    setResolvedMesaIdentificador(mesa.identificador);
    setNeedsTableNumber(false);
    await handleCheckout(mesa.identificador);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-noche-bg/60"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-noche-bg p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-noche-ink">Tu pedido</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-noche-ink-muted"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {separado ? (
          <p className="mt-2 text-xs uppercase tracking-widest2 text-noche-primary">
            Pidiendo como {participante?.nombre}
          </p>
        ) : null}

        <ul className="mt-6 divide-y divide-noche-border">
          {lines.map((line) => (
            <li key={line.producto.id} className="py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-noche-ink">{line.producto.nombre}</p>
                  <p className="text-xs text-noche-ink-muted">
                    {formatCentimos(line.producto.precio_centimos)} € · {line.cantidad}{" "}
                    {line.cantidad === 1 ? "unidad" : "unidades"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => decrement(line.producto.id)}
                    aria-label="Quitar una unidad"
                    className="flex h-8 w-8 items-center justify-center border border-noche-border text-noche-ink"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-sm text-noche-ink">{line.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => increment(line.producto.id)}
                    aria-label="Añadir una unidad"
                    className="flex h-8 w-8 items-center justify-center border border-noche-border text-noche-ink"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(line.producto.id)}
                    aria-label="Eliminar producto del pedido"
                    className="ml-1 text-noche-ink-muted hover:text-noche-primary"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {separado ? (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSharingProductId((current) =>
                        current === line.producto.id ? null : line.producto.id,
                      )
                    }
                    className="flex items-center gap-1.5 text-xs text-noche-ink-muted hover:text-noche-primary"
                  >
                    <ShareIcon className="h-3.5 w-3.5" />
                    {line.compartidoCon.length > 0
                      ? `Compartido con ${line.compartidoCon.length}`
                      : "Compartir"}
                  </button>

                  {sharingProductId === line.producto.id ? (
                    <div className="mt-2 border border-noche-border bg-noche-surface p-3">
                      {otrosParticipantes.length === 0 ? (
                        <p className="text-xs text-noche-ink-muted">
                          Todavía no hay más comensales en la mesa.
                        </p>
                      ) : (
                        otrosParticipantes.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 py-1 text-sm text-noche-ink">
                            <input
                              type="checkbox"
                              checked={line.compartidoCon.includes(p.id)}
                              onChange={() => toggleShare(line.producto.id, p.id)}
                            />
                            {p.nombre}
                          </label>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between border-t border-noche-border pt-4">
          <span className="text-sm uppercase tracking-widest2 text-noche-ink-muted">
            {separado ? "Mi parte" : "Total"}
          </span>
          <span className="font-display text-2xl text-noche-ink">
            {formatCentimos(miParteCentimos)} €
          </span>
        </div>
        {separado && miParteCentimos !== totalCentimos ? (
          <p className="mt-1 text-right text-xs text-noche-ink-muted">
            Total de la mesa para este pedido: {formatCentimos(totalCentimos)} €
          </p>
        ) : null}

        <div className="mt-4">
          <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Pago</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("LOCAL")}
              className={`flex-1 border px-4 py-3 text-center text-sm transition-colors ${
                paymentMethod === "LOCAL"
                  ? "border-noche-ink bg-noche-ink text-noche-bg"
                  : "border-noche-border text-noche-ink-muted"
              }`}
            >
              Pagar en local
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("ONLINE")}
              className={`flex-1 border px-4 py-3 text-center text-sm transition-colors ${
                paymentMethod === "ONLINE"
                  ? "border-noche-ink bg-noche-ink text-noche-bg"
                  : "border-noche-border text-noche-ink-muted"
              }`}
            >
              Pagar online
            </button>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

        {needsTableNumber ? (
          <div className="mt-6 border-t border-noche-border pt-4">
            <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
              ¿En qué mesa estás?
            </p>
            <p className="mt-1 text-sm text-noche-ink-muted">
              No hemos detectado tu mesa. Indica su número para que cocina pueda entregarte el
              pedido.
            </p>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={tableNumberInput}
              onChange={(event) => setTableNumberInput(event.target.value)}
              placeholder="Nº de mesa"
              className="mt-3 w-full border border-noche-border bg-noche-surface px-4 py-3 text-sm text-noche-ink"
            />
            {tableError ? <p className="mt-2 text-sm text-red-400">{tableError}</p> : null}
            <button
              type="button"
              onClick={handleConfirmTableNumber}
              disabled={resolvingTable || submitting || tableNumberInput.trim() === ""}
              className="mt-3 w-full bg-noche-ink py-4 text-sm uppercase tracking-widest2 text-noche-bg transition-colors disabled:opacity-50"
            >
              {resolvingTable || submitting ? "Comprobando…" : "Confirmar mesa"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleCheckout()}
            disabled={submitting || lines.length === 0}
            className="mt-6 w-full bg-noche-primary py-4 text-sm uppercase tracking-widest2 text-white transition-colors hover:bg-noche-primary-dark disabled:opacity-50"
          >
            {submitting
              ? "Enviando pedido…"
              : paymentMethod === "ONLINE"
                ? "Ir a pagar"
                : "Confirmar pedido"}
          </button>
        )}
      </div>
    </div>
  );
}
