import type { ZonaAdmin } from "@/lib/restaurant/admin-types";

type MesaConNumero = { id: string; numero: number; zona_id: string | null };

export type PrefijoZona = "T" | "B" | "";

export function prefijoZona(zonaId: string | null, zonas: ZonaAdmin[]): PrefijoZona {
  if (!zonaId) return "";
  const nombre = zonas.find((z) => z.id === zonaId)?.nombre.toLowerCase() ?? "";
  if (nombre.includes("terraza")) return "T";
  if (nombre.includes("bar")) return "B";
  return "";
}

export function etiquetasMesas<T extends MesaConNumero>(mesas: T[], zonas: ZonaAdmin[]): Map<string, string> {
  const contadorPorPrefijo: Record<string, number> = {};
  const etiquetas = new Map<string, string>();

  [...mesas]
    .sort((a, b) => a.numero - b.numero)
    .forEach((mesa) => {
      const prefijo = prefijoZona(mesa.zona_id, zonas);
      if (!prefijo) {
        etiquetas.set(mesa.id, String(mesa.numero));
        return;
      }
      contadorPorPrefijo[prefijo] = (contadorPorPrefijo[prefijo] ?? 0) + 1;
      etiquetas.set(mesa.id, `${prefijo}${contadorPorPrefijo[prefijo]}`);
    });

  return etiquetas;
}
