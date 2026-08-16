function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type DestinoTicket = "COCINA" | "BARRA";

export interface TicketComandaItem {
  cantidad: number;
  nombre: string;
  notas?: string | null;
}

export interface TicketComandaOptions {
  destino: DestinoTicket;
  mesaEtiqueta: string;
  mesaNombre?: string | null;
  salonNombre?: string | null;
  pax?: number | null;
  notasGenerales?: string | null;
  items: TicketComandaItem[];
}

function formatFechaHora(): string {
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" });
  const hora = ahora.toLocaleTimeString("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${fecha} ${hora}`;
}

export function renderTicketComandaHTML(opts: TicketComandaOptions): string {
  const filas = opts.items
    .map((item) => {
      const notas = item.notas
        ? `<div class="nota">${escapeHtml(item.notas)}</div>`
        : "";
      return `<div class="item"><span class="cant">${item.cantidad},00</span><span class="nombre">${escapeHtml(item.nombre)}</span></div>${notas}`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>Comanda ${opts.mesaEtiqueta}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Courier New", monospace; width: 76mm; margin: 0; padding: 8px 6px; color: #000; }
      .fecha { font-size: 12px; }
      .linea { font-size: 15px; font-weight: bold; margin-top: 2px; }
      .notas-generales { font-size: 13px; margin-top: 4px; }
      .destino { font-size: 20px; font-weight: bold; text-align: center; margin: 10px 0 4px; letter-spacing: 1px; }
      hr { border: none; border-top: 1px dashed #000; margin: 4px 0 8px; }
      .item { display: flex; gap: 8px; font-size: 16px; font-weight: bold; margin: 4px 0; }
      .cant { min-width: 34px; }
      .nota { font-size: 12px; font-weight: normal; margin: -2px 0 4px 42px; }
      @media print {
        body { width: 76mm; }
      }
    </style></head>
    <body>
      <div class="fecha">${formatFechaHora()}</div>
      <div class="linea">Mesa:${escapeHtml(opts.mesaEtiqueta)}${opts.mesaNombre ? ` · ${escapeHtml(opts.mesaNombre)}` : ""}</div>
      <div class="linea">Salón:${escapeHtml(opts.salonNombre ?? "-")}  Pax:${opts.pax ?? 0}</div>
      <div class="notas-generales">Notas: ${opts.notasGenerales ? escapeHtml(opts.notasGenerales) : ""}</div>
      <div class="destino">${opts.destino}</div>
      <hr />
      ${filas || '<div class="item">Sin líneas</div>'}
    </body></html>`;
}

export function imprimirTicketHTML(html: string): void {
  const ventana = window.open("", "_blank", "width=380,height=600");
  if (!ventana) return;
  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
  ventana.print();
}
