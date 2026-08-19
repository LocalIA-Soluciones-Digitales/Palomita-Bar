import type { Metadata } from "next";
import { getResenasAprobadas } from "@/lib/restaurant/queries";
import { ResenaForm } from "@/components/resenas/ResenaForm";
import { Stars } from "@/components/resenas/Stars";

export const metadata: Metadata = {
  title: "Opiniones",
  description: "Lee y comparte tu opinión sobre Palomita Bar, coctelería y picoteo en Barakaldo.",
};

export default async function OpinionesPage() {
  const resenas = await getResenasAprobadas().catch(() => []);

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <p className="text-xs uppercase tracking-widest2 text-noche-primary">Opiniones</p>
      <h1 className="mt-4 font-display text-5xl text-noche-ink">Cuéntanos tu experiencia</h1>
      <p className="mt-4 text-noche-ink-muted">
        Tu opinión se revisa antes de publicarse, para mantener las reseñas auténticas.
      </p>

      <div className="mt-12">
        <ResenaForm />
      </div>

      <div className="mt-16 space-y-4">
        <h2 className="font-display text-2xl text-noche-ink">Lo que dicen nuestros clientes</h2>
        {resenas.length === 0 ? (
          <p className="text-sm text-noche-ink-muted">
            Todavía no hay reseñas publicadas. ¡Sé el primero en dejar la tuya!
          </p>
        ) : (
          resenas.map((r) => (
            <div key={r.id} className="rounded-lg border border-noche-border bg-noche-surface p-5">
              <Stars rating={r.valoracion} />
              <p className="mt-3 text-noche-ink/80">&ldquo;{r.comentario}&rdquo;</p>
              <p className="mt-2 text-sm text-noche-ink-muted">
                {r.nombre} · {new Date(r.created_at).toLocaleDateString("es-ES")}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
