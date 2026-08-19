import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type {
  ErrorLogAdmin,
  EstadoResena,
  NewsletterSubscriberAdmin,
  ResenaAdmin,
  VisitaAdmin,
} from "@/lib/restaurant/admin-types";

// Consultas de solo-administrador: leen tablas cuya RLS ya restringe el
// SELECT a is_developer() (visits, error_logs, newsletter_subscribers) o a
// is_developer() OR mi_cliente_id() (resenas). Filtramos por cliente_id
// igualmente para no depender solo de RLS, siguiendo el mismo patrón que
// admin-queries.ts.
const PALOMITA_CLIENTE_ID = process.env.NEXT_PUBLIC_PALOMITA_CLIENTE_ID;

function clienteId(): string {
  if (!PALOMITA_CLIENTE_ID) {
    throw new Error("Falta NEXT_PUBLIC_PALOMITA_CLIENTE_ID en las variables de entorno.");
  }
  return PALOMITA_CLIENTE_ID;
}

export async function getVisitasAdmin(desde: Date, hasta: Date): Promise<VisitaAdmin[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("visits")
    .select(
      "id, session_id, event_type, path, referrer, source_category, utm_source, utm_medium, utm_campaign, device_type, is_returning, created_at",
    )
    .eq("cliente_id", clienteId())
    .gte("created_at", desde.toISOString())
    .lte("created_at", hasta.toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data ?? []) as VisitaAdmin[];
}

export async function getNewsletterAdmin(): Promise<NewsletterSubscriberAdmin[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, idioma, confirmado, confirmado_en, created_at")
    .eq("cliente_id", clienteId())
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as NewsletterSubscriberAdmin[];
}

export async function getResenasAdmin(): Promise<ResenaAdmin[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("resenas")
    .select("id, nombre, valoracion, comentario, estado, created_at")
    .eq("cliente_id", clienteId())
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as ResenaAdmin[];
}

export async function actualizarEstadoResenaAdmin(id: string, estado: EstadoResena): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("resenas")
    .update({ estado })
    .eq("id", id)
    .eq("cliente_id", clienteId());
  if (error) throw error;
}

export async function eliminarResenaAdmin(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("resenas").delete().eq("id", id).eq("cliente_id", clienteId());
  if (error) throw error;
}

export async function getErrorLogsAdmin(): Promise<ErrorLogAdmin[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("error_logs")
    .select("id, message, stack, source, url, user_agent, created_at")
    .eq("cliente_id", clienteId())
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as ErrorLogAdmin[];
}

export async function eliminarErrorLogAdmin(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("error_logs").delete().eq("id", id).eq("cliente_id", clienteId());
  if (error) throw error;
}
