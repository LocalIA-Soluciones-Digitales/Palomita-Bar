import type { ReservaAdmin } from "@/lib/restaurant/admin-types";

// Los bloqueos de mesa se guardan como reservas normales (misma tabla y
// mismo flujo de estados) marcadas con este prefijo en las notas, para no
// tener que tocar el esquema de base de datos por una variante de reserva.
const BLOQUEO_PREFIX = "[BLOQUEO]";

export const NOMBRE_BLOQUEO = "Mesa bloqueada";

export function esBloqueo(reserva: Pick<ReservaAdmin, "notas">): boolean {
  return reserva.notas?.startsWith(BLOQUEO_PREFIX) ?? false;
}

export function motivoBloqueo(reserva: Pick<ReservaAdmin, "notas">): string {
  return reserva.notas?.slice(BLOQUEO_PREFIX.length).trim() ?? "";
}

export function construirNotasBloqueo(motivo: string): string {
  const limpio = motivo.trim();
  return limpio ? `${BLOQUEO_PREFIX} ${limpio}` : BLOQUEO_PREFIX;
}
