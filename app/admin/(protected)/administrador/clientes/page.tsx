"use client";

import { useEffect, useState } from "react";
import { getNewsletterAdmin, getResenasAdmin } from "@/lib/restaurant/admin-analytics-queries";
import type { NewsletterSubscriberAdmin, ResenaAdmin } from "@/lib/restaurant/admin-types";
import { errorMessage } from "@/lib/format";
import { Stat } from "@/components/admin/Stat";
import { StarIcon } from "@/components/icons";

export default function ClientesAdminPage() {
  const [suscriptores, setSuscriptores] = useState<NewsletterSubscriberAdmin[] | null>(null);
  const [resenas, setResenas] = useState<ResenaAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getNewsletterAdmin(), getResenasAdmin()])
      .then(([n, r]) => {
        setSuscriptores(n);
        setResenas(r);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const valoracionMedia =
    resenas && resenas.length > 0
      ? resenas.reduce((acc, r) => acc + r.valoracion, 0) / resenas.length
      : null;

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl text-noche-ink">Captación de clientes</h1>

      {error ? <p className="mt-4 text-sm text-noche-danger">{error}</p> : null}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Suscriptores" value={suscriptores === null ? "…" : String(suscriptores.length)} />
        <Stat
          label="Confirmados"
          value={
            suscriptores === null ? "…" : String(suscriptores.filter((s) => s.confirmado).length)
          }
        />
        <Stat label="Reseñas" value={resenas === null ? "…" : String(resenas.length)} />
        <Stat
          label="Valoración media"
          value={valoracionMedia === null ? "—" : `${valoracionMedia.toFixed(1)} / 5`}
        />
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-lg text-noche-ink">Últimos suscriptores</h2>
          {!suscriptores ? (
            <p className="mt-2 text-sm text-noche-ink-muted">Cargando…</p>
          ) : suscriptores.length === 0 ? (
            <p className="mt-2 text-sm text-noche-ink-muted">Sin suscriptores todavía.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {suscriptores.slice(0, 20).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 border-b border-noche-border pb-2">
                  <span className="truncate text-noche-ink">{s.email}</span>
                  <span className="shrink-0 text-xs text-noche-ink-muted">
                    {new Date(s.created_at).toLocaleDateString("es-ES")}
                    {s.confirmado ? "" : " · sin confirmar"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg text-noche-ink">Últimas reseñas</h2>
          {!resenas ? (
            <p className="mt-2 text-sm text-noche-ink-muted">Cargando…</p>
          ) : resenas.length === 0 ? (
            <p className="mt-2 text-sm text-noche-ink-muted">Sin reseñas todavía.</p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {resenas.slice(0, 10).map((r) => (
                <li key={r.id} className="border-b border-noche-border pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-noche-ink">{r.nombre}</span>
                    <span className="flex items-center gap-0.5 text-noche-primary">
                      {Array.from({ length: r.valoracion }).map((_, i) => (
                        <StarIcon key={i} className="h-3.5 w-3.5" />
                      ))}
                    </span>
                  </div>
                  {r.comentario ? (
                    <p className="mt-1 text-noche-ink-muted">{r.comentario}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
