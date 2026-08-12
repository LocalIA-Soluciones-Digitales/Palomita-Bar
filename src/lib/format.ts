export function formatCentimos(centimos: number): string {
  return (centimos / 100).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
