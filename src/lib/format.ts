export function formatCentimos(centimos: number): string {
  return (centimos / 100).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Los errores de Supabase (PostgrestError, o clienteId() al faltar la env
// var) no siempre son instancias de Error, pero casi siempre traen .message.
// Sin esto los catch{} del admin ocultaban la causa real (p.ej. "Falta
// NEXT_PUBLIC_PALOMITA_CLIENTE_ID") detrás de un genérico "no se ha podido".
export function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return String(err);
}
