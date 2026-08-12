import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Revisa las variables de entorno del proyecto.",
  );
}

// Cliente server-side consciente de la sesión (cookies), para /admin.
// Sigue usando la clave anon: la autenticación viene de la cookie de
// sesión del usuario, y RLS decide qué puede ver/editar cada uno.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Se puede llamar desde un Server Component sin permiso de
          // escritura; el middleware se encarga de refrescar la sesión.
        }
      },
    },
  });
}
