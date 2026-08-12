import "server-only";
import { createClient } from "@supabase/supabase-js";

// SOLO para código server-only con verdadera necesidad de saltarse RLS
// (el webhook de Stripe, que no tiene sesión de usuario). El import
// "server-only" hace que el build falle si esto se importa alguna vez
// desde un componente cliente, evitando que la service role acabe en
// el bundle del navegador.
export function createSupabaseServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
