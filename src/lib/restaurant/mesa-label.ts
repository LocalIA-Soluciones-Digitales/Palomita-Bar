import type { ZonaAdmin } from "@/lib/restaurant/admin-types";

type MesaConNumero = { id: string; numero: number; zona_id: string | null };

export function etiquetasMesas<T extends MesaConNumero>(mesas: T[], zonas: ZonaAdmin[]): Map<string, string> {
  const nombreZona = new Map(zonas.map((z) => [z.id, z.nombre.toLowerCase()]));
  const contadorPorPrefijo: Record<string, number> = {};
  const etiquetas = new Map<string, string>();

  [...mesas]
    .sort((a, b) => a.numero - b.numero)
    .forEach((mesa) => {
      const zona = mesa.zona_id ? (nombreZona.get(mesa.zona_id) ?? "") : "";
      const prefijo = zona.includes("terraza") ? "T" : zona.includes("bar") ? "B" : "";
      if (!prefijo) {
        etiquetas.set(mesa.id, String(mesa.numero));
        return;
      }
      contadorPorPrefijo[prefijo] = (contadorPorPrefijo[prefijo] ?? 0) + 1;
      etiquetas.set(mesa.id, `${prefijo}${contadorPorPrefijo[prefijo]}`);
    });

  return etiquetas;
}
