"use client";

import { SITE } from "@/lib/constants";
import { StarIcon, StarHalfIcon } from "@/components/icons";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const RATING = 4.4;
const RATING_COUNT = "986+";

const BREAKDOWN = [
  { stars: 5, percent: 62 },
  { stars: 4, percent: 22 },
  { stars: 3, percent: 10 },
  { stars: 2, percent: 4 },
  { stars: 1, percent: 2 },
] as const;

const TESTIMONIALS = [
  {
    quote: "Buen ambiente y cocktails muy bien preparados. El Palomita es de lo mejor de la carta.",
    author: "Google Local Guide",
  },
  {
    quote: "El picoteo es ideal para compartir. Las gyozas y el tartar de atún son imprescindibles.",
    author: "Google Usuario",
  },
  {
    quote: "Perfecto para una noche con amigos. Abren hasta tarde y siempre hay buen rollo.",
    author: "Google Local Guide",
  },
] as const;

function Stars({ rating, className }: { rating: number; className?: string }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const roundedFull = rating - fullStars >= 0.75 ? fullStars + 1 : fullStars;

  return (
    <div className={`flex text-noche-primary ${className ?? ""}`}>
      {Array.from({ length: roundedFull }).map((_, i) => (
        <StarIcon key={`full-${i}`} className="h-4 w-4" />
      ))}
      {hasHalf ? <StarHalfIcon className="h-4 w-4" /> : null}
      {Array.from({ length: Math.max(0, 5 - roundedFull - (hasHalf ? 1 : 0)) }).map((_, i) => (
        <StarIcon key={`empty-${i}`} className="h-4 w-4 text-noche-ink-faint" />
      ))}
    </div>
  );
}

export function ReviewsSection() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

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
            <div className="flex items-end gap-4">
              <p className="font-display text-6xl font-light text-noche-ink md:text-7xl">
                {RATING}
              </p>
              <div className="pb-1">
                <Stars rating={RATING} />
                <p className="mt-1 text-sm text-noche-ink-muted">
                  {RATING_COUNT} reseñas en Google
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              {BREAKDOWN.map((row) => (
                <div key={row.stars} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-noche-ink-muted">{row.stars} estrellas</span>
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

            <a
              href={SITE.googleReviewsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center rounded-full border border-noche-ink/30 px-6 py-3 text-sm font-medium text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary"
            >
              Ver reseñas
            </a>
          </div>

          <div className="space-y-4">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.author + t.quote}
                className="rounded-lg border border-noche-border bg-noche-surface p-5"
              >
                <Stars rating={5} />
                <p className="mt-3 text-noche-ink/80">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-2 text-sm text-noche-ink-muted">{t.author}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
