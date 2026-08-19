import { supabase } from "@/lib/supabase/client";
import type {
  CartItemInput,
  Categoria,
  Mesa,
  MesaSesion,
  ModoSesion,
  PaymentMethod,
  PedidoPublico,
  Producto,
  RepartoParaPago,
  ResenaPublica,
  SesionParticipante,
  SesionPublica,
  SiteImages,
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

export async function validarMesaPorEtiqueta(etiqueta: string): Promise<Mesa | null> {
  const { data, error } = await supabase.rpc("validar_mesa_etiqueta", {
    p_site_key: siteKey(),
    p_etiqueta: etiqueta,
  });
  if (error || !data) return null;
  return data as unknown as Mesa;
}

export async function crearPedido(params: {
  mesaIdentificador?: string;
  items: CartItemInput[];
  paymentMethod: PaymentMethod;
  notas?: string;
  sesionId?: string;
  participanteId?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc("crear_pedido_restaurant", {
    p_site_key: siteKey(),
    p_mesa_identificador: params.mesaIdentificador ?? null,
    p_items: params.items,
    p_payment_method: params.paymentMethod,
    p_notas: params.notas ?? null,
    p_sesion_id: params.sesionId ?? null,
    p_participante_id: params.participanteId ?? null,
  });
  if (error) throw error;
  return data as string;
}

// --- Sesión de mesa ("juntos" / "cada uno por separado") ---------------

export async function iniciarSesionMesa(
  mesaIdentificador: string,
  modo: ModoSesion,
): Promise<MesaSesion> {
  const { data, error } = await supabase.rpc("iniciar_sesion_mesa", {
    p_site_key: siteKey(),
    p_mesa_identificador: mesaIdentificador,
    p_modo: modo,
  });
  if (error) throw error;
  return data as unknown as MesaSesion;
}

export async function unirseSesionMesa(params: {
  sesionId: string;
  nombre: string;
  deviceId: string;
}): Promise<SesionParticipante> {
  const { data, error } = await supabase.rpc("unirse_sesion_mesa", {
    p_site_key: siteKey(),
    p_sesion_id: params.sesionId,
    p_nombre: params.nombre,
    p_device_id: params.deviceId,
  });
  if (error) throw error;
  return data as unknown as SesionParticipante;
}

export async function getSesionPublica(sesionId: string): Promise<SesionPublica | null> {
  const { data, error } = await supabase.rpc("get_sesion_publica", {
    p_site_key: siteKey(),
    p_sesion_id: sesionId,
  });
  if (error || !data) return null;
  return data as unknown as SesionPublica;
}

export async function asumirReparto(repartoId: string, participanteId: string): Promise<void> {
  const { error } = await supabase.rpc("asumir_reparto", {
    p_site_key: siteKey(),
    p_reparto_id: repartoId,
    p_participante_id: participanteId,
  });
  if (error) throw error;
}

export async function getRepartoParaPago(participanteId: string): Promise<RepartoParaPago | null> {
  const { data, error } = await supabase.rpc("get_reparto_para_pago", {
    p_participante_id: participanteId,
  });
  if (error || !data) return null;
  return data as unknown as RepartoParaPago;
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

export async function getSiteImages(): Promise<SiteImages | null> {
  const { data, error } = await supabase.rpc("get_site_images_publica", {
    p_site_key: siteKey(),
  });
  if (error || !data) return null;
  return data as unknown as SiteImages;
}

export async function llamarCamarero(mesaIdentificador: string): Promise<void> {
  const { error } = await supabase.rpc("llamar_camarero", {
    p_site_key: siteKey(),
    p_identificador: mesaIdentificador,
  });
  if (error) throw error;
}

export async function crearReservaPublica(input: {
  nombreCliente: string;
  numPersonas: number;
  fecha: string;
  hora: string;
  telefono: string;
  email?: string;
  notas?: string;
}): Promise<void> {
  const { error } = await supabase.rpc("crear_reserva_publica", {
    p_site_key: siteKey(),
    p_nombre_cliente: input.nombreCliente,
    p_num_personas: input.numPersonas,
    p_fecha: input.fecha,
    p_hora: input.hora,
    p_telefono: input.telefono,
    p_notas: input.notas ?? null,
    p_email: input.email ?? null,
  });
  if (error) throw error;
}

export async function crearResenaPublica(input: {
  nombre: string;
  valoracion: number;
  comentario: string;
}): Promise<void> {
  const { error } = await supabase.rpc("crear_resena", {
    p_site_key: siteKey(),
    p_nombre: input.nombre,
    p_valoracion: input.valoracion,
    p_comentario: input.comentario,
  });
  if (error) throw error;
}

export async function getResenasAprobadas(): Promise<ResenaPublica[]> {
  const { data, error } = await supabase.rpc("get_resenas_aprobadas", {
    p_site_key: siteKey(),
  });
  if (error) throw error;
  return (data ?? []) as unknown as ResenaPublica[];
}

export async function crearErrorLog(input: {
  message: string;
  stack?: string;
  source: string;
  url?: string;
}): Promise<void> {
  await supabase.rpc("crear_error_log", {
    p_site_key: siteKey(),
    p_message: input.message,
    p_stack: input.stack ?? null,
    p_source: input.source,
    p_url: input.url ?? null,
    p_user_agent: typeof navigator === "undefined" ? null : navigator.userAgent,
  });
}
