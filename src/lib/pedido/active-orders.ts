const STORAGE_KEY = "palomita:pedidos-activos";
const MAX_PEDIDOS = 5;

interface PedidoActivoRef {
  id: string;
  savedAt: number;
}

function leerStorage(): PedidoActivoRef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is PedidoActivoRef =>
        typeof item?.id === "string" && typeof item?.savedAt === "number",
    );
  } catch {
    return [];
  }
}

function escribirStorage(pedidos: PedidoActivoRef[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota llena, etc.)
  }
}

export function getPedidosActivos(): PedidoActivoRef[] {
  return leerStorage();
}

export function guardarPedidoActivo(pedidoId: string) {
  const actuales = leerStorage().filter((p) => p.id !== pedidoId);
  const actualizados = [{ id: pedidoId, savedAt: Date.now() }, ...actuales].slice(
    0,
    MAX_PEDIDOS,
  );
  escribirStorage(actualizados);
}

export function olvidarPedido(pedidoId: string) {
  escribirStorage(leerStorage().filter((p) => p.id !== pedidoId));
}
