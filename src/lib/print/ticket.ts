import { SITE } from "@/lib/constants";
import { formatCentimos } from "@/lib/format";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const TICKET_BASE_STYLE = `
  * { box-sizing: border-box; }
  body { font-family: "Courier New", monospace; width: 76mm; margin: 0; padding: 10px 8px; color: #000; }
  .centro { text-align: center; }
  .negocio-nombre { font-size: 18px; font-weight: bold; letter-spacing: 0.5px; }
  .negocio-datos { font-size: 11px; line-height: 1.4; margin-top: 2px; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  hr.solida { border-top: 1px solid #000; }
  @media print { body { width: 76mm; } }
`;

function encabezadoNegocioHTML(): string {
  return `
    <div class="centro">
      <div class="negocio-nombre">${escapeHtml(SITE.name)}</div>
      <div class="negocio-datos">
        NIF: ${escapeHtml(SITE.nif)}<br />
        ${escapeHtml(SITE.address.line1)}<br />
        ${escapeHtml(SITE.address.postalCode)} · ${escapeHtml(SITE.address.city)}<br />
        ${escapeHtml(SITE.phone)}
      </div>
    </div>`;
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

// ------------------------------------------------------------------
// Comanda (ticket de cocina/barra): sin precios, para preparación.
// ------------------------------------------------------------------

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
  camareroNombre?: string | null;
  notasGenerales?: string | null;
  items: TicketComandaItem[];
}

export function renderTicketComandaHTML(opts: TicketComandaOptions): string {
  const filas = opts.items
    .map((item, index) => {
      const notas = item.notas
        ? `<div class="nota">↳ ${escapeHtml(item.notas)}</div>`
        : "";
      return `<div class="item${index === 0 ? " primero" : ""}"><span class="cant">${item.cantidad}</span><span class="nombre">${escapeHtml(item.nombre)}</span></div>${notas}`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>Comanda ${escapeHtml(opts.mesaEtiqueta)}</title>
    <style>
      ${TICKET_BASE_STYLE}
      .fecha { font-size: 11px; color: #333; }
      .linea { font-size: 15px; font-weight: bold; margin-top: 3px; }
      .sub { font-size: 12px; margin-top: 2px; }
      .notas-generales { font-size: 12px; margin-top: 4px; background: #f0f0f0; padding: 3px 5px; }
      .destino { font-size: 22px; font-weight: bold; text-align: center; margin: 10px 0 2px; letter-spacing: 2px; border: 2px solid #000; padding: 4px 0; }
      .item { display: flex; align-items: flex-start; gap: 10px; font-size: 17px; font-weight: bold; margin: 7px 0 2px; }
      .item.primero { margin-top: 4px; }
      .cant { min-width: 26px; height: 26px; line-height: 26px; text-align: center; border: 1.5px solid #000; border-radius: 4px; flex-shrink: 0; }
      .nombre { padding-top: 2px; }
      .nota { font-size: 12px; font-weight: normal; font-style: italic; margin: 0 0 4px 36px; }
      .pie { margin-top: 14px; font-size: 10px; text-align: center; color: #555; }
    </style></head>
    <body>
      ${encabezadoNegocioHTML()}
      <hr class="solida" />
      <div class="fecha">${formatFechaHora()}</div>
      <div class="linea">Mesa: ${escapeHtml(opts.mesaEtiqueta)}${opts.mesaNombre ? ` · ${escapeHtml(opts.mesaNombre)}` : ""}</div>
      <div class="sub">Salón: ${escapeHtml(opts.salonNombre ?? "-")} &nbsp;·&nbsp; Pax: ${opts.pax ?? 0}</div>
      ${opts.camareroNombre ? `<div class="sub">Camarero/a: ${escapeHtml(opts.camareroNombre)}</div>` : ""}
      ${opts.notasGenerales ? `<div class="notas-generales">Notas: ${escapeHtml(opts.notasGenerales)}</div>` : ""}
      <div class="destino">${opts.destino}</div>
      <hr />
      ${filas || '<div class="item">Sin líneas</div>'}
      <hr />
      <div class="pie">${opts.items.reduce((n, i) => n + i.cantidad, 0)} producto(s)</div>
    </body></html>`;
}

// ------------------------------------------------------------------
// Cuenta (factura simplificada): con precios, IVA y total a pagar.
// ------------------------------------------------------------------

const IVA_PCT = 10;

export interface TicketCuentaItem {
  cantidad: number;
  nombre: string;
  precioUnitarioCentimos: number;
}

export interface TicketCuentaOptions {
  mesaEtiqueta: string;
  mesaNombre?: string | null;
  camareroNombre?: string | null;
  items: TicketCuentaItem[];
}

export function renderTicketCuentaHTML(opts: TicketCuentaOptions): string {
  const totalCentimos = opts.items.reduce(
    (sum, item) => sum + item.precioUnitarioCentimos * item.cantidad,
    0,
  );
  const baseCentimos = totalCentimos / (1 + IVA_PCT / 100);
  const ivaCentimos = totalCentimos - baseCentimos;

  const filas = opts.items
    .map((item) => {
      const importe = item.precioUnitarioCentimos * item.cantidad;
      return `<tr>
        <td class="cant">${item.cantidad.toFixed(2)}</td>
        <td class="nombre">${escapeHtml(item.nombre)}</td>
        <td class="num">${formatCentimos(item.precioUnitarioCentimos)}</td>
        <td class="num">${formatCentimos(importe)}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>Cuenta ${escapeHtml(opts.mesaEtiqueta)}</title>
    <style>
      ${TICKET_BASE_STYLE}
      .meta { font-size: 12px; margin-top: 8px; line-height: 1.5; }
      .meta b { font-weight: bold; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
      thead td { font-size: 10px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; }
      td { padding: 3px 0; vertical-align: top; }
      .cant { width: 15%; }
      .nombre { width: 50%; }
      .num { width: 17.5%; text-align: right; white-space: nowrap; }
      .impuestos { width: 100%; font-size: 11px; margin-top: 6px; border-collapse: collapse; }
      .impuestos td { padding: 2px 0; }
      .impuestos .num { text-align: right; }
      .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 8px; padding-top: 6px; border-top: 1.5px solid #000; }
      .pie { margin-top: 16px; font-size: 12px; text-align: center; }
      .gracias { margin-top: 6px; font-size: 12px; text-align: center; font-weight: bold; letter-spacing: 1px; }
    </style></head>
    <body>
      ${encabezadoNegocioHTML()}
      <hr class="solida" />
      <div class="meta">
        <b>Mesa:</b> ${escapeHtml(opts.mesaEtiqueta)}${opts.mesaNombre ? ` · ${escapeHtml(opts.mesaNombre)}` : ""}<br />
        ${opts.camareroNombre ? `<b>Le atendió:</b> ${escapeHtml(opts.camareroNombre)}<br />` : ""}
        <b>Fecha:</b> ${formatFechaHora()}<br />
        Factura simplificada
      </div>
      <table>
        <thead><tr><td class="cant">Ud.</td><td class="nombre">Artículo</td><td class="num">Precio</td><td class="num">Importe</td></tr></thead>
        <tbody>${filas || '<tr><td colspan="4">Sin líneas</td></tr>'}</tbody>
      </table>
      <hr />
      <table class="impuestos">
        <tr><td>Base imponible</td><td class="num">${formatCentimos(baseCentimos)} €</td></tr>
        <tr><td>IVA (${IVA_PCT}%)</td><td class="num">${formatCentimos(ivaCentimos)} €</td></tr>
      </table>
      <div class="total-row"><span>TOTAL A PAGAR</span><span>${formatCentimos(totalCentimos)} €</span></div>
      <div class="pie">IVA incluido conforme a la normativa vigente.</div>
      <div class="gracias">¡GRACIAS POR SU VISITA!</div>
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
