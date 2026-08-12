import { supabase } from "@/lib/supabase/client";
import type {
  CartItemInput,
  Categoria,
  Mesa,
  PaymentMethod,
  PedidoPublico,
  Producto,
} from "@/lib/restaurant/types";

const SITE_KEY = process.env.NEXT_PUBLIC_PALOMITA_SITE_KEY;

function siteKey(): string {
  if (!SITE_KEY) {
    throw new Error("Falta NEXT_PUBLIC_PALOMITA_SITE_KEY en las variables de entorno.");
  }
  return SITE_KEY;
}

// Todas las funciones de este módulo llaman a RPC públicas (SECURITY
// DEFINER) que resuelven el tenant desde site_key en el propio Postgres.
// El frontend nunca hace SELECT/INSERT directo sobre restaurant.* ni
// envía un cliente_id: no hay forma de que este código acceda a datos
// de otro tenant aunque se manipule en el navegador.

export async function getCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase.rpc("get_categorias_publica", {
    p_site_key: siteKey(),
  });
  if (error) throw error;
  return (data ?? []) as unknown as Categoria[];
}

export async function getCarta(): Promise<Producto[]> {
  const { data, error } = await supabase.rpc("get_carta_publica", {
    p_site_key: siteKey(),
  });
  if (error) throw error;
  return (data ?? []) as unknown as Producto[];
}

export async function validarMesa(identificador: string): Promise<Mesa | null> {
  const { data, error } = await supabase.rpc("validar_mesa", {
    p_site_key: siteKey(),
    p_identificador: identificador,
  });
  if (error || !data) return null;
  return data as unknown as Mesa;
}

export async function crearPedido(params: {
  mesaIdentificador?: string;
  items: CartItemInput[];
  paymentMethod: PaymentMethod;
  notas?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc("crear_pedido_restaurant", {
    p_site_key: siteKey(),
    p_mesa_identificador: params.mesaIdentificador ?? null,
    p_items: params.items,
    p_payment_method: params.paymentMethod,
    p_notas: params.notas ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function getPedidoPublico(pedidoId: string): Promise<PedidoPublico | null> {
  const { data, error } = await supabase.rpc("get_pedido_publico", {
    p_pedido_id: pedidoId,
  });
  if (error || !data) return null;
  return data as unknown as PedidoPublico;
}

export async function getHorarioPublico(): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_horario_publico", {
    p_site_key: siteKey(),
  });
  if (error) return null;
  return (data as unknown as string | null) ?? null;
}
