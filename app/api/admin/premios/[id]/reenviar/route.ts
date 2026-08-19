import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notificarPremio } from "@/lib/promociones/notificar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Botón "Reenviar" del panel: autenticado por la sesión de Supabase Auth del
// encargado (misma comprobación que app/admin/(protected)/layout.tsx), no
// por el secreto del webhook — aquí sí hay un usuario detrás de la llamada.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // notificarPremio usa el cliente service_role (salta RLS), así que hay que
  // comprobar aquí, con la sesión del encargado, que el premio es de su
  // propio tenant antes de dejarle reenviar el aviso.
  const { data: puedeVer, error: accesoError } = await supabase.rpc("puede_ver_premio_admin", {
    p_premio_id: id,
  });
  if (accesoError || !puedeVer) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    await notificarPremio(id, { forzar: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error reenviando notificación de premio", id, err);
    return NextResponse.json({ error: "No se ha podido reenviar el aviso" }, { status: 502 });
  }
}
