import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { ThermalPrinter, PrinterTypes } from "node-thermal-printer";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const BRIDGE_EMAIL = process.env.BRIDGE_EMAIL;
const BRIDGE_PASSWORD = process.env.BRIDGE_PASSWORD;
const PRINTER_INTERFACE = process.env.PRINTER_INTERFACE;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !BRIDGE_EMAIL || !BRIDGE_PASSWORD || !PRINTER_INTERFACE) {
  console.error("Faltan variables de entorno. Copia .env.example a .env y rellénalo.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: PRINTER_INTERFACE,
  width: 42,
  removeSpecialCharacters: false,
  options: { timeout: 5000 },
});

const impresos = new Set();

function formatFechaHora() {
  return new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
}

async function imprimirComandaCocina(pedido) {
  const itemsCocina = (pedido.items ?? []).filter((item) => item.producto_tipo !== "bebida");
  if (itemsCocina.length === 0) return;

  try {
    printer.clear();
    printer.alignCenter();
    printer.bold(true);
    printer.println("PALOMITA BAR");
    printer.bold(false);
    printer.drawLine();

    printer.alignLeft();
    printer.setTextNormal();
    printer.println(formatFechaHora());
    printer.bold(true);
    printer.println(
      `Mesa: ${pedido.mesa_numero ?? "-"}${pedido.mesa_nombre ? ` · ${pedido.mesa_nombre}` : ""}`,
    );
    printer.bold(false);
    if (pedido.participante_nombre) printer.println(`Pedido de ${pedido.participante_nombre}`);
    if (pedido.notas) printer.println(`Notas: ${pedido.notas}`);

    printer.newLine();
    printer.alignCenter();
    printer.setTextDoubleHeight();
    printer.bold(true);
    printer.println("* COCINA *");
    printer.bold(false);
    printer.setTextNormal();
    printer.alignLeft();
    printer.drawLine();

    for (const item of itemsCocina) {
      printer.bold(true);
      printer.println(`[${item.cantidad}] ${item.producto_nombre}`);
      printer.bold(false);
      if (item.notas) printer.println(`     ↳ ${item.notas}`);
    }

    printer.drawLine();
    printer.alignCenter();
    printer.setTextNormal();
    printer.println(
      `${itemsCocina.reduce((n, i) => n + i.cantidad, 0)} producto(s)`,
    );
    printer.alignLeft();

    printer.newLine();
    printer.cut();
    await printer.execute();
    console.log(`[OK] Comanda impresa · pedido ${pedido.id} · mesa ${pedido.mesa_numero ?? "-"}`);
  } catch (err) {
    console.error(`[ERROR] No se pudo imprimir el pedido ${pedido.id}:`, err.message);
  }
}

async function revisarPedidosPendientes() {
  const { data, error } = await supabase.rpc("get_pedidos_cocina");
  if (error) {
    console.error("[ERROR] get_pedidos_cocina:", error.message);
    return;
  }

  for (const pedido of data ?? []) {
    if (pedido.estado !== "RECEIVED") continue;
    if (impresos.has(pedido.id)) continue;
    impresos.add(pedido.id);
    await imprimirComandaCocina(pedido);
  }
}

async function main() {
  console.log("Iniciando sesión en Supabase...");
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: BRIDGE_EMAIL,
    password: BRIDGE_PASSWORD,
  });
  if (authError) {
    console.error("No se pudo iniciar sesión:", authError.message);
    process.exit(1);
  }
  console.log("Sesión iniciada.");

  const conectada = await printer.isPrinterConnected().catch(() => false);
  console.log(
    conectada
      ? "Impresora conectada."
      : "Aviso: no se pudo confirmar la conexión con la impresora (se intentará imprimir igualmente).",
  );

  // No reimprimir lo que ya estuviera pendiente antes de arrancar el servicio.
  const { data: existentes } = await supabase.rpc("get_pedidos_cocina");
  for (const pedido of existentes ?? []) impresos.add(pedido.id);
  console.log(`Listo. ${impresos.size} pedido(s) existentes marcados como ya vistos.`);
  console.log("Esperando pedidos nuevos...");

  const channel = supabase
    .channel("cocina-print-bridge")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "restaurant", table: "pedidos" },
      () => revisarPedidosPendientes(),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "restaurant", table: "pedidos" },
      () => revisarPedidosPendientes(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "restaurant", table: "pedido_items" },
      () => revisarPedidosPendientes(),
    )
    .subscribe((status) => console.log("Canal Realtime:", status));

  process.on("SIGINT", () => {
    supabase.removeChannel(channel);
    process.exit(0);
  });
}

main();
