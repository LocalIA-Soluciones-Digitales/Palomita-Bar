import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Páginas públicas cacheadas (ISR) que muestran carta, horario, fotos o reseñas.
const PAGINAS = ["/", "/carta", "/cocteleria"];

// El panel la llama tras guardar algo que se ve en la web pública, para que el
// cambio salga al momento sin regenerar las páginas cada pocos segundos (cada
// regeneración cuenta como ISR Write en Vercel). Autenticada por la sesión del
// encargado, como app/api/admin/premios/[id]/reenviar.
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  for (const ruta of PAGINAS) revalidatePath(ruta);
  return NextResponse.json({ ok: true });
}
