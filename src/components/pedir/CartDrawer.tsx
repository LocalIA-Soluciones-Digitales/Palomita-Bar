"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-context";
import { useTableSession } from "@/components/mesa/table-session-context";
import { formatCentimos } from "@/lib/format";
import { splitEqually } from "@/lib/restaurant/split";
import { crearPedido, getCarta, validarMesaPorEtiqueta } from "@/lib/restaurant/queries";
import { CloseIcon, MinusIcon, PlusIcon, ShareIcon, TrashIcon } from "@/components/icons";
import { vibrarSuave } from "@/lib/haptics";
import type { PaymentMethod, RepartoInput } from "@/lib/restaurant/types";

interface CambioPrecio {
  productoId: string;
  nombre: string;
  antes: number;
  despues: number;
}

export function CartDrawer({
  mesaIdentificador,
  onClose,
}: {
  mesaIdentificador?: string;
  onClose: () => void;
}) {
  const { lines, increment, decrement, removeItem, toggleShare, applyCatalog, totalCentimos, clear } =
    useCart();
  const { sesion, participante, sesionPublica } = useTableSession();
  const otrosParticipantes = (sesionPublica?.participantes ?? []).filter(
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
  const [comprobandoPrecios, setComprobandoPrecios] = useState(false);
  const [cambiosPrecio, setCambiosPrecio] = useState<CambioPrecio[] | null>(null);
  const [preciosAceptados, setPreciosAceptados] = useState(false);
  const [propinaPct, setPropinaPct] = useState(0);
  const router = useRouter();

  const effectiveMesaIdentificador = mesaIdentificador ?? resolvedMesaIdentificador;

  const miParteCentimos = separado
    ? lines.reduce((sum, l) => {
        const totalLinea = l.producto.precio_centimos * l.cantidad;
        const partes = splitEqually(totalLinea, l.compartidoCon.length + 1);
        return sum + (partes[0] ?? 0);
      }, 0)
    : totalCentimos;

  // La propina solo se ofrece con pago online: con pago en local el importe
  // se cobra en persona y no pasa por Stripe.
  const propinaCentimos = paymentMethod === "ONLINE" ? Math.round((miParteCentimos * propinaPct) / 100) : 0;

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
            separado
              ? { participanteId: participante?.id, tipCentimos: propinaCentimos }
              : { pedidoId, tipCentimos: propinaCentimos },
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

  const handleConfirmarClick = async () => {
    if (cambiosPrecio && !preciosAceptados) return;

    setComprobandoPrecios(true);
    setError(null);
    try {
      const catalogo = await getCarta();
      const idsEnCarrito = new Set(lines.map((l) => l.producto.id));
      const cambios: CambioPrecio[] = [];
      let hayNoDisponibles = false;

      for (const id of idsEnCarrito) {
        const linea = lines.find((l) => l.producto.id === id);
        const fresco = catalogo.find((p) => p.id === id);
        if (!linea) continue;
        if (!fresco || !fresco.disponible) {
          hayNoDisponibles = true;
          continue;
        }
        if (fresco.precio_centimos !== linea.producto.precio_centimos) {
          cambios.push({
            productoId: id,
            nombre: fresco.nombre,
            antes: linea.producto.precio_centimos,
            despues: fresco.precio_centimos,
          });
        }
      }

      if (hayNoDisponibles || cambios.length > 0) {
        applyCatalog(catalogo);
      }

      if (hayNoDisponibles) {
        setError(
          "Algún producto de tu pedido ya no está disponible y se ha quitado del carrito. Revísalo antes de confirmar.",
        );
        setCambiosPrecio(null);
        setPreciosAceptados(false);
        return;
      }

      if (cambios.length > 0 && !preciosAceptados) {
        setCambiosPrecio(cambios);
        return;
      }

      setCambiosPrecio(null);
      setPreciosAceptados(false);
      await handleCheckout();
    } finally {
      setComprobandoPrecios(false);
    }
  };

  const descartarCambiosPrecio = () => {
    setCambiosPrecio(null);
    setPreciosAceptados(false);
  };

  const handleConfirmTableNumber = async () => {
    const etiqueta = tableNumberInput.trim();
    if (etiqueta === "") {
      setTableError("Introduce un número de mesa válido.");
      return;
    }

    setResolvingTable(true);
    setTableError(null);
    const mesa = await validarMesaPorEtiqueta(etiqueta);
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

        <ul className="mt-6 space-y-3">
          {lines.map((line) => (
            <li
              key={line.producto.id}
              className="rounded-lg border border-noche-border bg-noche-surface/40 p-4"
            >
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
                    onClick={() => {
                      decrement(line.producto.id);
                      descartarCambiosPrecio();
                    }}
                    aria-label="Quitar una unidad"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-noche-border text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary"
                  >
                    <MinusIcon className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-4 text-center text-sm text-noche-ink">{line.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => {
                      vibrarSuave();
                      increment(line.producto.id);
                      descartarCambiosPrecio();
                    }}
                    aria-label="Añadir una unidad"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-noche-border text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary active:scale-90"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeItem(line.producto.id);
                      descartarCambiosPrecio();
                    }}
                    aria-label="Eliminar producto del pedido"
                    className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-noche-ink-muted transition-colors hover:bg-noche-danger/10 hover:text-noche-danger"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {separado ? (
                <div className="mt-3">
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
                    <div className="mt-2 rounded-lg border border-noche-border bg-noche-surface p-3">
                      {otrosParticipantes.length === 0 ? (
                        <p className="text-xs text-noche-ink-muted">
                          Todavía no hay más comensales en la mesa.
                        </p>
                      ) : (
                        <>
                          <div className="space-y-1">
                            {otrosParticipantes.map((p) => {
                              const checked = line.compartidoCon.includes(p.id);
                              return (
                                <label
                                  key={p.id}
                                  className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm transition-colors ${
                                    checked
                                      ? "border-noche-primary/40 bg-noche-primary/10 text-noche-ink"
                                      : "border-transparent text-noche-ink hover:bg-noche-surface-2/60"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleShare(line.producto.id, p.id)}
                                    className="accent-noche-primary"
                                  />
                                  {p.nombre}
                                </label>
                              );
                            })}
                          </div>
                          {line.compartidoCon.length > 0 ? (
                            <p className="mt-2 text-xs text-noche-ink-muted">
                              {formatCentimos(
                                splitEqually(
                                  line.producto.precio_centimos * line.cantidad,
                                  line.compartidoCon.length + 1,
                                )[0] ?? 0,
                              )}{" "}
                              € por persona
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between rounded-lg border border-noche-border bg-noche-surface-2/50 px-4 py-4">
          <span className="text-sm uppercase tracking-widest2 text-noche-ink-muted">
            {separado ? "Mi parte" : "Total"}
          </span>
          <span
            className={`font-display text-2xl ${separado ? "text-noche-primary" : "text-noche-ink"}`}
          >
            {formatCentimos(miParteCentimos)} €
          </span>
        </div>
        {separado && miParteCentimos !== totalCentimos ? (
          <p className="mt-1 text-right text-xs text-noche-ink-muted">
            Total de la mesa para este pedido:{" "}
            <span className="text-noche-ink">{formatCentimos(totalCentimos)} €</span>
          </p>
        ) : null}

        <div className="mt-4">
          <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Pago</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("LOCAL")}
              className={`flex-1 rounded-lg border px-4 py-3 text-center text-sm transition-colors ${
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
              className={`flex-1 rounded-lg border px-4 py-3 text-center text-sm transition-colors ${
                paymentMethod === "ONLINE"
                  ? "border-noche-ink bg-noche-ink text-noche-bg"
                  : "border-noche-border text-noche-ink-muted"
              }`}
            >
              Pagar online
            </button>
          </div>
        </div>

        {paymentMethod === "ONLINE" ? (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Propina</p>
            <div className="mt-2 flex gap-2">
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setPropinaPct(pct)}
                  className={`flex-1 rounded-lg border py-2 text-center text-sm transition-colors ${
                    propinaPct === pct
                      ? "border-noche-primary bg-noche-primary/10 text-noche-primary"
                      : "border-noche-border text-noche-ink-muted"
                  }`}
                >
                  {pct === 0 ? "Sin propina" : `${pct}%`}
                </button>
              ))}
            </div>
            {propinaCentimos > 0 ? (
              <p className="mt-2 text-xs text-noche-ink-muted">
                Propina: <span className="text-noche-ink">{formatCentimos(propinaCentimos)} €</span> · Total con propina:{" "}
                <span className="text-noche-ink">{formatCentimos(miParteCentimos + propinaCentimos)} €</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-noche-danger">{error}</p> : null}

        {cambiosPrecio && cambiosPrecio.length > 0 ? (
          <div className="mt-4 rounded-lg border border-noche-primary/60 bg-noche-primary/10 p-4">
            <p className="text-sm font-medium text-noche-ink">
              Algunos precios han cambiado desde que abriste la carta
            </p>
            <ul className="mt-2 space-y-1 text-sm text-noche-ink/90">
              {cambiosPrecio.map((c) => (
                <li key={c.productoId} className="flex justify-between gap-3">
                  <span className="truncate">{c.nombre}</span>
                  <span className="shrink-0">
                    <span className="text-noche-ink-muted line-through">
                      {formatCentimos(c.antes)} €
                    </span>{" "}
                    {formatCentimos(c.despues)} €
                  </span>
                </li>
              ))}
            </ul>
            <label className="mt-3 flex items-center gap-2 text-sm text-noche-ink">
              <input
                type="checkbox"
                checked={preciosAceptados}
                onChange={(e) => setPreciosAceptados(e.target.checked)}
              />
              Acepto los nuevos precios
            </label>
          </div>
        ) : null}

        {needsTableNumber ? (
          <div className="mt-6 border-t border-noche-border pt-4">
            <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
              ¿En qué mesa estás?
            </p>
            <p className="mt-1 text-sm text-noche-ink-muted">
              No hemos detectado tu mesa. Indica su número para que cocina pueda entregarte el
              pedido. Si estás en la terraza usa T y el número (p. ej. T1); en la barra usa B (p.
              ej. B2).
            </p>
            <input
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              value={tableNumberInput}
              onChange={(event) => setTableNumberInput(event.target.value)}
              placeholder="Nº de mesa (ej. T1, B2, 5)"
              className="mt-3 w-full rounded-lg border border-noche-border bg-noche-surface px-4 py-3 text-sm text-noche-ink"
            />
            {tableError ? <p className="mt-2 text-sm text-noche-danger">{tableError}</p> : null}
            <button
              type="button"
              onClick={handleConfirmTableNumber}
              disabled={resolvingTable || submitting || tableNumberInput.trim() === ""}
              className="mt-3 w-full rounded-lg bg-noche-ink py-4 text-sm uppercase tracking-widest2 text-noche-bg transition-colors disabled:opacity-50"
            >
              {resolvingTable || submitting ? "Comprobando…" : "Confirmar mesa"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConfirmarClick}
            disabled={
              submitting ||
              comprobandoPrecios ||
              lines.length === 0 ||
              (cambiosPrecio !== null && cambiosPrecio.length > 0 && !preciosAceptados)
            }
            className="mt-6 w-full rounded-lg bg-noche-primary py-4 text-sm uppercase tracking-widest2 text-white transition-colors hover:bg-noche-primary-dark disabled:opacity-50"
          >
            {comprobandoPrecios
              ? "Comprobando precios…"
              : submitting
                ? "Enviando pedido…"
                : cambiosPrecio && cambiosPrecio.length > 0
                  ? "Confirmar con los nuevos precios"
                  : paymentMethod === "ONLINE"
                    ? "Ir a pagar"
                    : "Confirmar pedido"}
          </button>
        )}
      </div>
    </div>
  );
}
