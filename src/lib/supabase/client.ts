import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Revisa las variables de entorno del proyecto.",
  );
}

// Cliente único con la clave anon (pública, sujeta a RLS). No usar la
// service role aquí: eso queda para operaciones server-only futuras
// (webhook de Stripe, admin), fuera de este archivo.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
