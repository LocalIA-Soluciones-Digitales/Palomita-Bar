/** Exportación de tablas a CSV (se abre directamente en Excel/Sheets) usando
 * solo APIs del navegador — sin añadir ninguna librería nueva al proyecto. */

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[";\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function descargarCSV(nombreArchivo: string, filas: (string | number)[][]) {
  // BOM UTF-8 para que Excel detecte bien los acentos; separador ";" porque
  // es lo que Excel en español espera por defecto para partir columnas.
  const contenido =
    "﻿" + filas.map((fila) => fila.map(escapeCsvCell).join(";")).join("\r\n");
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
