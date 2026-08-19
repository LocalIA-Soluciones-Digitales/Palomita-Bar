import { NextResponse } from "next/server";
import { notificarPremio } from "@/lib/promociones/notificar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Llamado por el trigger restaurant.notificar_premio_otorgado (pg_net) al
// insertarse un premios_otorgados. Autenticado por secreto compartido, no
// por sesión de usuario — no hay usuario en un trigger de base de datos.
export async function POST(request: Request) {
  const secret = process.env.PROMO_WEBHOOK_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { premio_id?: string } | null;
  const premioId = body?.premio_id;
  if (!premioId) {
    return NextResponse.json({ error: "Falta premio_id" }, { status: 400 });
  }

  try {
    await notificarPremio(premioId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error notificando premio", premioId, err);
    // 200: el error ya queda registrado en premios_otorgados.error_notificacion
    // y el cron de reintento lo recogerá; devolver 4xx/5xx aquí solo haría que
    // pg_net reintente sin más contexto.
    return NextResponse.json({ ok: false });
  }
}
