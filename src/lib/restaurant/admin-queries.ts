import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type {
  CategoriaAdmin,
  InformeVentas,
  MesaAdmin,
  MesaEstadoAdmin,
  ProductoAdmin,
  VentasHoy,
} from "@/lib/restaurant/admin-types";
import type { EstadoPedido } from "@/lib/restaurant/types";
import type { PedidoCocina } from "@/lib/restaurant/cocina-types";

const PALOMITA_CLIENTE_ID = process.env.NEXT_PUBLIC_PALOMITA_CLIENTE_ID;

function clienteId(): string {
  if (!PALOMITA_CLIENTE_ID) {
    throw new Error("Falta NEXT_PUBLIC_PALOMITA_CLIENTE_ID en las variables de entorno.");
  }
  return PALOMITA_CLIENTE_ID;
}

export async function getCategoriasAdmin(): Promise<CategoriaAdmin[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_categorias_admin", {
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
  return (data ?? []) as unknown as CategoriaAdmin[];
}

export async function upsertCategoriaAdmin(input: {
  id?: string;
  nombre: string;
  slug: string;
  tipo: "comida" | "bebida";
  orden: number;
}): Promise<CategoriaAdmin> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("upsert_categoria_admin", {
    p_id: input.id ?? null,
    p_cliente_id: clienteId(),
    p_nombre: input.nombre,
    p_slug: input.slug,
    p_tipo: input.tipo,
    p_orden: input.orden,
  });
  if (error) throw error;
  return data as unknown as CategoriaAdmin;
}

export async function eliminarCategoriaAdmin(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("eliminar_categoria_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
}

export async function getProductosAdmin(): Promise<ProductoAdmin[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_productos_admin", {
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
  return (data ?? []) as unknown as ProductoAdmin[];
}

export async function upsertProductoAdmin(input: {
  id?: string;
  categoriaId: string | null;
  nombre: string;
  descripcion: string;
  precioCentimos: number;
  disponible: boolean;
  destacado: boolean;
  orden: number;
}): Promise<ProductoAdmin> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("upsert_producto_admin", {
    p_id: input.id ?? null,
    p_cliente_id: clienteId(),
    p_categoria_id: input.categoriaId,
    p_nombre: input.nombre,
    p_descripcion: input.descripcion || null,
    p_precio_centimos: input.precioCentimos,
    p_disponible: input.disponible,
    p_destacado: input.destacado,
    p_orden: input.orden,
  });
  if (error) throw error;
  return data as unknown as ProductoAdmin;
}

export async function eliminarProductoAdmin(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("eliminar_producto_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
}

export async function getMesasAdmin(): Promise<MesaAdmin[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_mesas_admin", {
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
  return (data ?? []) as unknown as MesaAdmin[];
}

export async function crearMesaAdmin(numero: number, nombre?: string): Promise<MesaAdmin> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("crear_mesa_admin", {
    p_cliente_id: clienteId(),
    p_numero: numero,
    p_nombre: nombre || null,
  });
  if (error) throw error;
  return data as unknown as MesaAdmin;
}

export async function actualizarMesaNombreAdmin(id: string, nombre: string): Promise<MesaAdmin> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("actualizar_mesa_nombre_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
    p_nombre: nombre || null,
  });
  if (error) throw error;
  return data as unknown as MesaAdmin;
}

export async function actualizarMesaActivaAdmin(id: string, activa: boolean): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("actualizar_mesa_activa_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
    p_activa: activa,
  });
  if (error) throw error;
}

export async function regenerarQrMesaAdmin(id: string): Promise<MesaAdmin> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("regenerar_qr_mesa_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
  return data as unknown as MesaAdmin;
}

export async function actualizarMesaPosicionAdmin(
  id: string,
  posX: number,
  posY: number,
): Promise<MesaAdmin> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("actualizar_mesa_posicion_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
    p_pos_x: posX,
    p_pos_y: posY,
  });
  if (error) throw error;
  return data as unknown as MesaAdmin;
}

export async function actualizarMesaOcupadaAdmin(id: string, ocupada: boolean): Promise<MesaAdmin> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("actualizar_mesa_ocupada_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
    p_ocupada: ocupada,
  });
  if (error) throw error;
  return data as unknown as MesaAdmin;
}

export async function getMesasEstadoAdmin(): Promise<MesaEstadoAdmin[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_mesas_estado_admin", {
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
  return (data ?? []) as unknown as MesaEstadoAdmin[];
}

export async function avanzarPedidoAdmin(pedidoId: string, nuevoEstado: EstadoPedido): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("avanzar_pedido_cocina", {
    p_pedido_id: pedidoId,
    p_nuevo_estado: nuevoEstado,
  });
  if (error) throw error;
}

export async function getVentasHoyAdmin(): Promise<VentasHoy> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_ventas_hoy_admin", {
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
  return data as unknown as VentasHoy;
}

export async function getPedidosHistorialAdmin(dias = 7): Promise<PedidoCocina[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_pedidos_historial_admin", {
    p_cliente_id: clienteId(),
    p_dias: dias,
  });
  if (error) throw error;
  return (data ?? []) as unknown as PedidoCocina[];
}

export async function getInformeVentasAdmin(desde: Date, hasta: Date): Promise<InformeVentas> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_informe_ventas_admin", {
    p_cliente_id: clienteId(),
    p_desde: desde.toISOString(),
    p_hasta: hasta.toISOString(),
  });
  if (error) throw error;
  return data as unknown as InformeVentas;
}

export async function esDeveloperAdmin(): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("is_developer");
  if (error) return false;
  return Boolean(data);
}

export async function getConfiguracionAdmin(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_configuracion_admin", {
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
  return (data as unknown as string | null) ?? null;
}

export async function setConfiguracionAdmin(horario: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("set_configuracion_admin", {
    p_cliente_id: clienteId(),
    p_horario: horario,
  });
  if (error) throw error;
}
