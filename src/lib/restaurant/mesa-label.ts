import type { ZonaAdmin } from "@/lib/restaurant/admin-types";

export type PrefijoZona = "T" | "B" | "S" | "";

export function prefijoZona(zonaId: string | null, zonas: ZonaAdmin[]): PrefijoZona {
  if (!zonaId) return "";
  const nombre = zonas.find((z) => z.id === zonaId)?.nombre.toLowerCase() ?? "";
  if (nombre.includes("terraza")) return "T";
  if (nombre.includes("bar")) return "B";
  if (nombre.includes("sala") || nombre.includes("principal")) return "S";
  return "";
}
