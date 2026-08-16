import type { Metadata } from "next";
import { ReservaForm } from "@/components/reservas/ReservaForm";

export const metadata: Metadata = {
  title: "Reservar mesa",
  description: "Reserva mesa en Palomita Bar, coctelería y picoteo en Barakaldo.",
};

export default function ReservarPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24">
      <p className="text-xs uppercase tracking-widest2 text-noche-primary">Reservas</p>
      <h1 className="mt-4 font-display text-5xl text-noche-ink">Resérvanos tu mesa</h1>
      <p className="mt-4 text-noche-ink-muted">
        Déjanos tus datos y te confirmamos la mesa. Para grupos grandes o eventos, mejor llámanos
        directamente.
      </p>

      <div className="mt-12">
        <ReservaForm />
      </div>
    </div>
  );
}
