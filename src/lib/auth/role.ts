import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminRole = "administrador" | "encargado";

// "administrador" = is_developer() en Supabase (cuenta de desarrollo, ve
// datos de analítica/errores). "encargado" = staff de Palomita dado de
// alta en usuarios_negocio con rol 'gestion'. No hay tabla de roles
// nueva: se reutiliza el mecanismo multi-tenant ya existente en la BD.
export async function getAdminRole(supabase: SupabaseClient): Promise<AdminRole> {
  const { data } = await supabase.rpc("is_developer");
  return data === true ? "administrador" : "encargado";
}
