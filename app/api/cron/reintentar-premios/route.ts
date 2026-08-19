import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { notificarPremio } from "@/lib/promociones/notificar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Red de seguridad diaria: pg_net (el webhook principal) no reintenta, así
// que esto recoge cualquier premio que llevara más de 10 minutos sin avisar
// (fallo de red, credenciales aún sin configurar, etc.). Vercel añade la
// cabecera Authorization con CRON_SECRET automáticamente en Cron Jobs.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc("get_premios_pendientes_notificacion");
  if (error) {
    console.error("Error listando premios pendientes de notificar", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  const ids = (data ?? []) as string[];
  let ok = 0;
  let fallidos = 0;
  for (const id of ids) {
    try {
      await notificarPremio(id);
      ok += 1;
    } catch (err) {
      fallidos += 1;
      console.error("Error reintentando notificación de premio", id, err);
    }
  }

  return NextResponse.json({ total: ids.length, ok, fallidos });
}
