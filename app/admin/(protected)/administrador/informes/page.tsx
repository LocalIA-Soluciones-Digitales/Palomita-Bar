"use client";

import { useEffect, useMemo, useState } from "react";
import { getInformeVentasAdmin } from "@/lib/restaurant/admin-queries";
import {
  getNewsletterAdmin,
  getResenasAdmin,
  getVisitasAdmin,
} from "@/lib/restaurant/admin-analytics-queries";
import type { InformeVentas } from "@/lib/restaurant/admin-types";
import { errorMessage, formatCentimos } from "@/lib/format";
import { Stat } from "@/components/admin/Stat";
import { PrinterIcon } from "@/components/icons";

type RangoId = "7d" | "30d" | "mes" | "mes_anterior";

const RANGOS: { id: RangoId; label: string }[] = [
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "mes", label: "Este mes" },
  { id: "mes_anterior", label: "Mes anterior" },
];

function calcularRango(id: RangoId): { desde: Date; hasta: Date; etiqueta: string } {
  const ahora = new Date();

  switch (id) {
    case "7d":
      return {
        desde: new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000),
        hasta: ahora,
        etiqueta: "últimos 7 días",
      };
    case "30d":
      return {
        desde: new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000),
        hasta: ahora,
        etiqueta: "últimos 30 días",
      };
    case "mes": {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      return {
        desde: inicio,
        hasta: ahora,
        etiqueta: ahora.toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
      };
    }
    case "mes_anterior": {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
      const fin = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      return {
        desde: inicio,
        hasta: fin,
        etiqueta: inicio.toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
      };
    }
  }
}

export default function InformeProfesionalPage() {
  const [rango, setRango] = useState<RangoId>("30d");
  const [ventas, setVentas] = useState<InformeVentas | null>(null);
  const [visitasCount, setVisitasCount] = useState<number | null>(null);
  const [sesionesUnicas, setSesionesUnicas] = useState<number | null>(null);
  const [nuevosSuscriptores, setNuevosSuscriptores] = useState<number | null>(null);
  const [nuevasResenas, setNuevasResenas] = useState<number | null>(null);
  const [valoracionMedia, setValoracionMedia] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { desde, hasta, etiqueta } = useMemo(() => calcularRango(rango), [rango]);

  useEffect(() => {
    setVentas(null);
    Promise.all([
      getInformeVentasAdmin(desde, hasta),
      getVisitasAdmin(desde, hasta),
      getNewsletterAdmin(),
      getResenasAdmin(),
    ])
      .then(([informe, visitas, suscriptores, resenas]) => {
        setVentas(informe);
        setVisitasCount(visitas.length);
        setSesionesUnicas(new Set(visitas.map((v) => v.session_id)).size);
        setNuevosSuscriptores(
          suscriptores.filter((s) => new Date(s.created_at) >= desde && new Date(s.created_at) <= hasta)
            .length,
        );
        const resenasPeriodo = resenas.filter(
          (r) => new Date(r.created_at) >= desde && new Date(r.created_at) <= hasta,
        );
        setNuevasResenas(resenasPeriodo.length);
        setValoracionMedia(
          resenasPeriodo.length > 0
            ? resenasPeriodo.reduce((acc, r) => acc + r.valoracion, 0) / resenasPeriodo.length
            : null,
        );
      })
      .catch((err) => setError(errorMessage(err)));
  }, [desde, hasta]);

  const sinMovimiento = ventas?.productos.filter((p) => p.unidades === 0) ?? [];
  const masPedidos = ventas?.productos.filter((p) => p.unidades > 0).slice(0, 5) ?? [];

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="font-display text-2xl text-noche-ink">Informe profesional</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {RANGOS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRango(r.id)}
                className={`rounded-lg px-3 py-1.5 text-xs uppercase tracking-widest2 ${
                  rango === r.id
                    ? "bg-noche-primary/15 text-noche-primary"
                    : "border border-noche-border bg-noche-surface text-noche-ink-muted"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-noche-border px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink hover:bg-noche-surface-2"
          >
            <PrinterIcon className="h-3.5 w-3.5" />
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      <div className="mt-6 hidden print:block">
        <p className="text-xs uppercase tracking-widest2 text-noche-primary">Palomita Bar</p>
        <h1 className="mt-1 font-display text-2xl">Informe profesional — {etiqueta}</h1>
        <p className="mt-1 text-xs text-noche-ink-muted">
          Generado el {new Date().toLocaleDateString("es-ES")}
        </p>
      </div>

      {error ? <p className="mt-4 text-sm text-noche-danger">{error}</p> : null}

      {!ventas ? (
        <p className="mt-6 text-sm text-noche-ink-muted">Cargando…</p>
      ) : (
        <div className="mt-6 space-y-8">
          <section>
            <h2 className="font-display text-lg text-noche-ink">Resumen ejecutivo</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Pedidos" value={String(ventas.resumen.pedidos)} />
              <Stat label="Ventas" value={`${formatCentimos(ventas.resumen.ventas_centimos)} €`} />
              <Stat
                label="Ticket medio"
                value={`${formatCentimos(ventas.resumen.ticket_medio_centimos)} €`}
              />
              <Stat label="Visitas web" value={visitasCount === null ? "…" : String(visitasCount)} />
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg text-noche-ink">Web y captación</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Sesiones" value={sesionesUnicas === null ? "…" : String(sesionesUnicas)} />
              <Stat
                label="Nuevos suscriptores"
                value={nuevosSuscriptores === null ? "…" : String(nuevosSuscriptores)}
              />
              <Stat label="Nuevas reseñas" value={nuevasResenas === null ? "…" : String(nuevasResenas)} />
              <Stat
                label="Valoración media"
                value={valoracionMedia === null ? "—" : `${valoracionMedia.toFixed(1)} / 5`}
              />
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg text-noche-ink">Recomendaciones de carta</h2>
            {masPedidos.length > 0 ? (
              <p className="mt-2 text-sm text-noche-ink">
                <span className="text-noche-ink-muted">Platos estrella del periodo: </span>
                {masPedidos.map((p) => p.nombre).join(", ")}.
              </p>
            ) : null}
            {sinMovimiento.length > 0 ? (
              <p className="mt-2 text-sm text-noche-ink">
                <span className="text-noche-ink-muted">
                  Sin ningún pedido en este periodo — candidatos a destacar, cambiar de receta o
                  quitar de la carta:{" "}
                </span>
                {sinMovimiento.map((p) => p.nombre).join(", ")}.
              </p>
            ) : (
              <p className="mt-2 text-sm text-noche-ink-muted">
                Todos los platos han tenido movimiento en este periodo.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
