import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente de navegador consciente de la sesión (cookies compartidas con
// el servidor vía @supabase/ssr). Se usa solo en /admin: login, panel
// de cocina y cualquier llamada autenticada desde un client component.
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
