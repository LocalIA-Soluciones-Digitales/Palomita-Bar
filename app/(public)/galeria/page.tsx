import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galería",
  description: "Galería de fotos de Palomita Bar, Barakaldo.",
};

export default function GaleriaPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <p className="text-xs uppercase tracking-widest2 text-brand-pink">Galería</p>
      <h1 className="mt-4 font-display text-5xl">En imágenes</h1>
      <p className="mt-4 max-w-lg text-brand-ink/70">
        Pendiente de material fotográfico. Se conectará a Supabase Storage
        (bucket <code>restaurant/palomita/gallery</code>) en cuanto haya
        fotos reales del local y de la carta.
      </p>

      <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/5] bg-brand-sand"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
