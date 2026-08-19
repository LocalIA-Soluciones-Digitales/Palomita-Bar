import type { EstadoResena } from "@/lib/restaurant/admin-types";

export const ESTILO_ESTADO_RESENA: Record<EstadoResena, { badge: string; dot: string; label: string }> = {
  pendiente: {
    badge: "bg-noche-warning/15 text-noche-warning",
    dot: "bg-noche-warning",
    label: "Pendiente",
  },
  aprobada: {
    badge: "bg-noche-positive/15 text-noche-positive",
    dot: "bg-noche-positive",
    label: "Aprobada",
  },
  rechazada: {
    badge: "bg-noche-ink-faint/15 text-noche-ink-faint",
    dot: "bg-noche-ink-faint",
    label: "Rechazada",
  },
};
