/**
 * Reparte un importe en céntimos entre N comensales sin perder ni un
 * céntimo por redondeo: el resto de la división entera se asigna, uno a
 * uno, a los primeros comensales de la lista (orden determinista).
 */
export function splitEqually(totalCentimos: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(totalCentimos / n);
  const resto = totalCentimos - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < resto ? 1 : 0));
}
