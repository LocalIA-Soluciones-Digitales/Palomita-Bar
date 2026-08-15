import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type {
  CamareroAdmin,
  CategoriaAdmin,
  EstadoReserva,
  InformeVentas,
  MesaAdmin,
  MesaEstadoAdmin,
  ProductoAdmin,
  ReservaAdmin,
  VentasHoy,
  ZonaAdmin,
} from "@/lib/restaurant/admin-types";
import type { EstadoPedido, SiteImages } from "@/lib/restaurant/types";
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
  imagenUrl?: string | null;
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
    p_imagen_url: input.imagenUrl ?? null,
  });
  if (error) throw error;
  return data as unknown as ProductoAdmin;
}

export async function subirImagenProducto(file: File): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${clienteId()}/carta/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("palomita-bar").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("palomita-bar").getPublicUrl(path);
  return data.publicUrl;
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

export async function crearMesaAdmin(
  numero: number,
  nombre?: string,
  zonaId?: string | null,
  capacidad?: number,
): Promise<MesaAdmin> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("crear_mesa_admin", {
    p_cliente_id: clienteId(),
    p_numero: numero,
    p_nombre: nombre || null,
    p_zona_id: zonaId ?? null,
    p_capacidad: capacidad ?? 4,
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

export async function getMesasEstadoAdmin(fecha?: string): Promise<MesaEstadoAdmin[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_mesas_estado_admin", {
    p_cliente_id: clienteId(),
    ...(fecha ? { p_fecha: fecha } : {}),
  });
  if (error) throw error;
  return (data ?? []) as unknown as MesaEstadoAdmin[];
}

export async function eliminarMesaAdmin(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("eliminar_mesa_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
}

export async function actualizarMesaZonaAdmin(id: string, zonaId: string | null): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("actualizar_mesa_zona_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
    p_zona_id: zonaId,
  });
  if (error) throw error;
}

export async function actualizarMesaCapacidadAdmin(id: string, capacidad: number): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("actualizar_mesa_capacidad_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
    p_capacidad: capacidad,
  });
  if (error) throw error;
}

export async function sentarMesaAdmin(
  id: string,
  clientes: number,
  camareroId?: string | null,
): Promise<MesaAdmin> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("sentar_mesa_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
    p_clientes: clientes,
    p_camarero_id: camareroId ?? null,
  });
  if (error) throw error;
  return data as unknown as MesaAdmin;
}

export async function liberarMesaAdmin(id: string): Promise<MesaAdmin> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("liberar_mesa_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
  return data as unknown as MesaAdmin;
}

export async function marcarMesaLimpiaAdmin(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("marcar_mesa_limpia_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
}

export async function marcarMesaPagandoAdmin(id: string, pagando: boolean): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("marcar_mesa_pagando_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
    p_pagando: pagando,
  });
  if (error) throw error;
}

export async function unirMesasAdmin(ids: string[]): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("unir_mesas_admin", {
    p_ids: ids,
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
  return data as string;
}

export async function separarGrupoMesasAdmin(unionGrupoId: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("separar_grupo_mesas_admin", {
    p_union_grupo_id: unionGrupoId,
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
}

export async function cambiarMesaAdmin(mesaOrigenId: string, mesaDestinoId: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("cambiar_mesa_admin", {
    p_mesa_origen_id: mesaOrigenId,
    p_mesa_destino_id: mesaDestinoId,
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
}

export async function getZonasAdmin(): Promise<ZonaAdmin[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_zonas_admin", {
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
  return (data ?? []) as unknown as ZonaAdmin[];
}

export async function crearZonaAdmin(nombre: string, orden = 0): Promise<ZonaAdmin> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("crear_zona_admin", {
    p_cliente_id: clienteId(),
    p_nombre: nombre,
    p_orden: orden,
  });
  if (error) throw error;
  return data as unknown as ZonaAdmin;
}

export async function eliminarZonaAdmin(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("eliminar_zona_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
}

export async function getCamarerosAdmin(): Promise<CamareroAdmin[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_camareros_admin", {
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
  return (data ?? []) as unknown as CamareroAdmin[];
}

export async function crearCamareroAdmin(nombre: string): Promise<CamareroAdmin> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("crear_camarero_admin", {
    p_cliente_id: clienteId(),
    p_nombre: nombre,
  });
  if (error) throw error;
  return data as unknown as CamareroAdmin;
}

export async function actualizarCamareroActivoAdmin(id: string, activo: boolean): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("actualizar_camarero_activo_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
    p_activo: activo,
  });
  if (error) throw error;
}

export async function getReservasAdmin(fecha: string): Promise<ReservaAdmin[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_reservas_admin", {
    p_cliente_id: clienteId(),
    p_fecha: fecha,
  });
  if (error) throw error;
  return (data ?? []) as unknown as ReservaAdmin[];
}

export async function crearReservaAdmin(input: {
  nombreCliente: string;
  numPersonas: number;
  fecha: string;
  hora: string;
  telefono?: string;
  mesaId?: string | null;
  zonaId?: string | null;
  notas?: string;
}): Promise<ReservaAdmin> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("crear_reserva_admin", {
    p_cliente_id: clienteId(),
    p_nombre_cliente: input.nombreCliente,
    p_num_personas: input.numPersonas,
    p_fecha: input.fecha,
    p_hora: input.hora,
    p_telefono: input.telefono ?? null,
    p_mesa_id: input.mesaId ?? null,
    p_zona_id: input.zonaId ?? null,
    p_notas: input.notas ?? null,
  });
  if (error) throw error;
  return data as unknown as ReservaAdmin;
}

export async function actualizarReservaEstadoAdmin(
  id: string,
  estado: EstadoReserva,
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("actualizar_reserva_estado_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
    p_estado: estado,
  });
  if (error) throw error;
}

export async function asignarMesaReservaAdmin(id: string, mesaId: string | null): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("asignar_mesa_reserva_admin", {
    p_id: id,
    p_cliente_id: clienteId(),
    p_mesa_id: mesaId,
  });
  if (error) throw error;
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

export async function getSiteImagesAdmin(): Promise<SiteImages | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_site_images_admin", {
    p_cliente_id: clienteId(),
  });
  if (error) throw error;
  return (data as unknown as SiteImages | null) ?? null;
}

export async function setSiteImagesAdmin(value: SiteImages): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("set_site_images_admin", {
    p_cliente_id: clienteId(),
    p_value: value,
  });
  if (error) throw error;
}

export async function subirImagenSitio(file: File, carpeta: string): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${clienteId()}/site/${carpeta}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("palomita-bar").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("palomita-bar").getPublicUrl(path);
  return data.publicUrl;
}
