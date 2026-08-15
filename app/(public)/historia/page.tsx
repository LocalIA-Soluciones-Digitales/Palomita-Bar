import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Historia",
  description: "La historia de Palomita Bar, coctelería y picoteo en Barakaldo.",
};

export default function HistoriaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-xs uppercase tracking-widest2 text-noche-primary">Historia</p>
      <h1 className="mt-4 font-display text-5xl text-noche-ink">Quiénes somos</h1>
      <p className="mt-8 text-lg leading-relaxed text-noche-ink-muted">
        Contenido pendiente de redactar con el equipo de Palomita. Esta
        sección está preparada para incorporar la historia del local, su
        filosofía y las personas detrás de la barra en cuanto esté
        disponible.
      </p>
    </div>
  );
}
