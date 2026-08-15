"use client";

import { useMemo, useState } from "react";
import { useTableSession } from "@/components/mesa/table-session-context";
import { asumirReparto } from "@/lib/restaurant/queries";
import { formatCentimos } from "@/lib/format";
import { CloseIcon } from "@/components/icons";

interface LineaReparto {
  id: string;
  productoNombre: string;
  importeCentimos: number;
  pagado: boolean;
  participanteId: string;
}

export function CuentaMesaDrawer({ onClose }: { onClose: () => void }) {
  const { participante, sesionPublica, refrescarSesionPublica } = useTableSession();
  const [asumiendoId, setAsumiendoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lineas = useMemo<LineaReparto[]>(() => {
    if (!sesionPublica) return [];
    return sesionPublica.pedidos.flatMap((pedido) =>
      pedido.items.flatMap((item) =>
        item.repartos.map((r) => ({
          id: r.participante_id + item.id,
          productoNombre: item.producto_nombre,
          importeCentimos: r.importe_centimos,
          pagado: r.pagado,
          participanteId: r.participante_id,
        })),
      ),
    );
  }, [sesionPublica]);

  // Necesitamos el id real del reparto (no solo el compuesto de arriba) para poder
  // asumirlo — se reconstruye por separado porque el id de reparto es único de verdad.
  const repartosPendientesConId = useMemo(() => {
    if (!sesionPublica) return [];
    return sesionPublica.pedidos.flatMap((pedido) =>
      pedido.items.flatMap((item) =>
        item.repartos
          .filter((r) => !r.pagado)
          .map((r) => ({
            repartoId: r.id,
            productoNombre: item.producto_nombre,
            importeCentimos: r.importe_centimos,
            participanteId: r.participante_id,
          })),
      ),
    );
  }, [sesionPublica]);

  if (!sesionPublica || !participante) return null;

  const resumenPorParticipante = sesionPublica.participantes.map((p) => {
    const suyas = lineas.filter((l) => l.participanteId === p.id);
    const debe = suyas.reduce((sum, l) => sum + l.importeCentimos, 0);
    const pagado = suyas.filter((l) => l.pagado).reduce((sum, l) => sum + l.importeCentimos, 0);
    return { participante: p, debe, pagado, pendiente: debe - pagado };
  });

  const miResumen = resumenPorParticipante.find((r) => r.participante.id === participante.id);
  const pendientesDeOtros = repartosPendientesConId.filter(
    (r) => r.participanteId !== participante.id,
  );

  const handlePagarMiParte = async () => {
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout-participante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participanteId: participante.id }),
      });
      if (!response.ok) throw new Error("checkout_failed");
      const { url } = (await response.json()) as { url: string };
      window.location.href = url;
    } catch {
      setError("No hemos podido iniciar el pago. Inténtalo de nuevo.");
    }
  };

  const handleAsumir = async (repartoId: string) => {
    setAsumiendoId(repartoId);
    setError(null);
    try {
      await asumirReparto(repartoId, participante.id);
      await refrescarSesionPublica();
    } catch {
      setError("No hemos podido asignarte esa parte. Inténtalo de nuevo.");
    } finally {
      setAsumiendoId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-noche-bg/60" onClick={onClose}>
      <div
        className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-noche-bg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-noche-ink">Cuenta de la mesa</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-noche-ink-muted">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {miResumen ? (
          <div className="mt-6 border border-noche-border bg-noche-surface p-4">
            <p className="text-xs uppercase tracking-widest2 text-noche-primary">Mi parte</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-noche-ink-muted">Debo</p>
                <p className="mt-1 font-display text-lg text-noche-ink">
                  {formatCentimos(miResumen.debe)} €
                </p>
              </div>
              <div>
                <p className="text-xs text-noche-ink-muted">Pagado</p>
                <p className="mt-1 font-display text-lg text-noche-positive">
                  {formatCentimos(miResumen.pagado)} €
                </p>
              </div>
              <div>
                <p className="text-xs text-noche-ink-muted">Pendiente</p>
                <p className="mt-1 font-display text-lg text-noche-primary">
                  {formatCentimos(miResumen.pendiente)} €
                </p>
              </div>
            </div>

            {miResumen.pendiente > 0 ? (
              <button
                type="button"
                onClick={handlePagarMiParte}
                className="mt-4 w-full bg-noche-primary py-3 text-sm uppercase tracking-widest2 text-white transition-colors hover:bg-noche-primary-dark"
              >
                Pagar mi parte · {formatCentimos(miResumen.pendiente)} €
              </button>
            ) : (
              <p className="mt-4 text-center text-sm text-noche-positive">
                Estás al día. Nada pendiente de pago.
              </p>
            )}
          </div>
        ) : null}

        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
            Resto de la mesa
          </p>
          <div className="mt-3 space-y-2">
            {resumenPorParticipante
              .filter((r) => r.participante.id !== participante.id)
              .map((r) => (
                <div
                  key={r.participante.id}
                  className="flex items-center justify-between border border-noche-border px-4 py-3 text-sm"
                >
                  <span className="text-noche-ink">{r.participante.nombre}</span>
                  <span className={r.pendiente > 0 ? "text-noche-primary" : "text-noche-positive"}>
                    {r.pendiente > 0
                      ? `${formatCentimos(r.pendiente)} € pendiente`
                      : "Al día"}
                  </span>
                </div>
              ))}
            {resumenPorParticipante.length <= 1 ? (
              <p className="text-sm text-noche-ink-muted">Todavía no hay más comensales.</p>
            ) : null}
          </div>
        </div>

        {pendientesDeOtros.length > 0 ? (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
              ¿Alguien se ha ido sin pagar su parte?
            </p>
            <div className="mt-3 space-y-2">
              {pendientesDeOtros.map((r, index) => {
                const nombre = sesionPublica.participantes.find(
                  (p) => p.id === r.participanteId,
                )?.nombre;
                return (
                  <div
                    key={`${r.repartoId}-${index}`}
                    className="flex items-center justify-between border border-noche-border px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-noche-ink">{r.productoNombre}</p>
                      <p className="text-xs text-noche-ink-muted">
                        {nombre ?? "Comensal"} · {formatCentimos(r.importeCentimos)} €
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAsumir(r.repartoId)}
                      disabled={asumiendoId === r.repartoId}
                      className="shrink-0 border border-noche-primary px-3 py-1.5 text-xs uppercase tracking-widest2 text-noche-primary transition-colors hover:bg-noche-primary hover:text-white disabled:opacity-50"
                    >
                      {asumiendoId === r.repartoId ? "…" : "Asumir"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
