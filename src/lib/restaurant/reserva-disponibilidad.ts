import type { ReservaAdmin } from "@/lib/restaurant/admin-types";

// Al reservar una mesa se bloquea durante este margen (antes y después) para
// dar tiempo a la cena, evitando que se pueda asignar la misma mesa a otra
// reserva demasiado cercana en el tiempo.
const VENTANA_BLOQUEO_MINUTOS = 60;

function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function hayConflictoHorario(
  horaA: string,
  horaB: string,
  ventanaMinutos = VENTANA_BLOQUEO_MINUTOS,
): boolean {
  return Math.abs(horaAMinutos(horaA) - horaAMinutos(horaB)) < ventanaMinutos;
}

/** IDs de mesa que ya tienen una reserva activa dentro del margen de bloqueo de `hora`. */
export function mesasOcupadasEn(
  reservas: Pick<ReservaAdmin, "id" | "mesa_id" | "fecha" | "hora" | "estado">[],
  fecha: string,
  hora: string,
  excluirReservaId?: string,
): Set<string> {
  const ocupadas = new Set<string>();
  if (!fecha || !hora) return ocupadas;
  for (const r of reservas) {
    if (r.id === excluirReservaId) continue;
    if (r.fecha !== fecha) continue;
    if (r.estado === "CANCELADA" || r.estado === "NO_SHOW") continue;
    if (!r.mesa_id) continue;
    if (hayConflictoHorario(r.hora, hora)) {
      ocupadas.add(r.mesa_id);
    }
  }
  return ocupadas;
}
