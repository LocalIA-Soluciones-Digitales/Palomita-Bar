"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getInformeVentasAdmin } from "@/lib/restaurant/admin-queries";
import {
  getErrorLogsAdmin,
  getNewsletterAdmin,
  getVisitasAdmin,
} from "@/lib/restaurant/admin-analytics-queries";
import { formatCentimos, errorMessage } from "@/lib/format";
import { Stat } from "@/components/admin/Stat";
import { AlertIcon, ChartBarIcon, EyeIcon, UsersIcon } from "@/components/icons";

function inicioDeMes(): Date {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
}

export default function ResumenAdministradorPage() {
  const [ventasMes, setVentasMes] = useState<number | null>(null);
  const [pedidosMes, setPedidosMes] = useState<number | null>(null);
  const [visitasMes, setVisitasMes] = useState<number | null>(null);
  const [suscripcionesMes, setSuscripcionesMes] = useState<number | null>(null);
  const [erroresTotal, setErroresTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const desde = inicioDeMes();
    const hasta = new Date();

    Promise.all([
      getInformeVentasAdmin(desde, hasta),
      getVisitasAdmin(desde, hasta),
      getNewsletterAdmin(),
      getErrorLogsAdmin(),
    ])
      .then(([informe, visitas, newsletter, errores]) => {
        setVentasMes(informe.resumen.ventas_centimos);
        setPedidosMes(informe.resumen.pedidos);
        setVisitasMes(visitas.length);
        setSuscripcionesMes(
          newsletter.filter((s) => new Date(s.created_at) >= desde).length,
        );
        setErroresTotal(errores.length);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="font-display text-2xl text-noche-ink">Resumen</h1>
      <p className="mt-1 text-sm text-noche-ink-muted">Panel administrador — este mes</p>

      {error ? <p className="mt-4 text-sm text-noche-danger">{error}</p> : null}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Ventas del mes"
          value={ventasMes === null ? "…" : `${formatCentimos(ventasMes)} €`}
        />
        <Stat label="Pedidos del mes" value={pedidosMes === null ? "…" : String(pedidosMes)} />
        <Stat label="Visitas del mes" value={visitasMes === null ? "…" : String(visitasMes)} />
        <Stat
          label="Nuevas suscripciones"
          value={suscripcionesMes === null ? "…" : String(suscripcionesMes)}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/administrador/informes"
          className="flex items-center gap-3 rounded-lg border border-noche-border bg-noche-surface p-4 transition-colors hover:border-noche-primary"
        >
          <ChartBarIcon className="h-5 w-5 text-noche-primary" />
          <span className="text-sm text-noche-ink">Generar informe profesional</span>
        </Link>
        <Link
          href="/admin/administrador/visitas"
          className="flex items-center gap-3 rounded-lg border border-noche-border bg-noche-surface p-4 transition-colors hover:border-noche-primary"
        >
          <EyeIcon className="h-5 w-5 text-noche-primary" />
          <span className="text-sm text-noche-ink">Analítica de visitas</span>
        </Link>
        <Link
          href="/admin/administrador/clientes"
          className="flex items-center gap-3 rounded-lg border border-noche-border bg-noche-surface p-4 transition-colors hover:border-noche-primary"
        >
          <UsersIcon className="h-5 w-5 text-noche-primary" />
          <span className="text-sm text-noche-ink">Captación de clientes</span>
        </Link>
        <Link
          href="/admin/administrador/errores"
          className="flex items-center gap-3 rounded-lg border border-noche-border bg-noche-surface p-4 transition-colors hover:border-noche-primary"
        >
          <AlertIcon className="h-5 w-5 text-noche-primary" />
          <span className="text-sm text-noche-ink">
            Log de errores{erroresTotal ? ` (${erroresTotal})` : ""}
          </span>
        </Link>
      </div>
    </div>
  );
}
