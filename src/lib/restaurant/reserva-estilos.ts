import type { EstadoReserva } from "@/lib/restaurant/admin-types";

export const ESTILO_ESTADO: Record<EstadoReserva, { badge: string; dot: string; label: string }> = {
  CONFIRMADA: { badge: "bg-blue-500/15 text-blue-300", dot: "bg-blue-500", label: "Confirmada" },
  SENTADA: { badge: "bg-orange-500/15 text-orange-300", dot: "bg-orange-500", label: "Sentada" },
  CANCELADA: {
    badge: "bg-noche-ink-faint/15 text-noche-ink-faint",
    dot: "bg-noche-ink-faint",
    label: "Cancelada",
  },
  NO_SHOW: { badge: "bg-noche-danger/15 text-noche-danger", dot: "bg-noche-danger", label: "No presentado" },
};

export const ESTILO_BLOQUEO = { badge: "bg-zinc-500/20 text-zinc-300", dot: "bg-zinc-500", label: "Bloqueada" };
