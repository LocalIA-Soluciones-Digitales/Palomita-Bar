/** Vibración corta de confirmación al tocar +/Añadir; no-op si el navegador no lo soporta (p. ej. iOS Safari). */
export function vibrarSuave() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(12);
  }
}
