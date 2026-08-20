"use client";

import Link from "next/link";
import { Stars } from "@/components/resenas/Stars";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { ResenaPublica } from "@/lib/restaurant/types";

export function ReviewsSection({ resenas }: { resenas: ResenaPublica[] }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  const totalResenas = resenas.length;
  const rating =
    totalResenas === 0
      ? 0
      : resenas.reduce((sum, r) => sum + r.valoracion, 0) / totalResenas;

  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = resenas.filter((r) => Math.round(r.valoracion) === stars).length;
    const percent = totalResenas === 0 ? 0 : Math.round((count / totalResenas) * 100);
    return { stars, percent };
  });

  const testimonios = [...resenas]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <section className="border-t border-noche-border bg-noche-bg px-6 py-28">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl transition-all duration-700 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <p className="flex items-center gap-3 text-xs uppercase tracking-widest2 text-noche-primary">
          <span className="h-px w-6 bg-noche-primary/50" />
          Opiniones
        </p>
        <h2 className="mt-4 font-display text-4xl text-noche-ink">Lo que dicen de nosotros</h2>

        <div className="mt-12 grid gap-16 lg:grid-cols-2">
          <div>
            {totalResenas === 0 ? (
              <p className="text-noche-ink-muted">
                Todavía no hay reseñas publicadas. ¡Sé el primero en dejar la tuya!
              </p>
            ) : (
              <>
                <div className="flex items-end gap-4">
                  <p className="font-display text-6xl font-light text-noche-ink md:text-7xl">
                    {rating.toFixed(1)}
                  </p>
                  <div className="pb-1">
                    <Stars rating={rating} />
                    <p className="mt-1 text-sm text-noche-ink-muted">
                      {totalResenas} reseña{totalResenas === 1 ? "" : "s"} de clientes
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-2">
                  {breakdown.map((row) => (
                    <div key={row.stars} className="flex items-center gap-3 text-sm">
                      <span className="w-16 shrink-0 text-noche-ink-muted">
                        {row.stars} estrellas
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-noche-surface-2">
                        <span
                          className="block h-full rounded-full bg-noche-primary"
                          style={{ width: `${row.percent}%` }}
                        />
                      </span>
                      <span className="w-10 shrink-0 text-right text-noche-ink-muted">
                        {row.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/opiniones"
                className="inline-flex items-center rounded-full border border-noche-ink/30 px-6 py-3 text-sm font-medium text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary"
              >
                Ver reseñas
              </Link>
              <Link
                href="/opiniones"
                className="inline-flex items-center rounded-full bg-noche-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-noche-primary-dark"
              >
                Danos tu opinión
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {testimonios.length === 0 ? (
              <div className="rounded-lg border border-noche-border bg-noche-surface p-5 text-noche-ink-muted">
                Aún no hay opiniones de clientes que mostrar aquí.
              </div>
            ) : (
              testimonios.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-noche-border bg-noche-surface p-5"
                >
                  <Stars rating={r.valoracion} />
                  <p className="mt-3 text-noche-ink/80">&ldquo;{r.comentario}&rdquo;</p>
                  <p className="mt-2 text-sm text-noche-ink-muted">{r.nombre}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
