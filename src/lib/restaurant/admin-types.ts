import type { EstadoPedido, PaymentMethod, PaymentStatus } from "@/lib/restaurant/types";

export interface CategoriaAdmin {
  id: string;
  cliente_id: string;
  nombre: string;
  slug: string;
  tipo: "comida" | "bebida";
  orden: number;
}

export interface ProductoAdmin {
  id: string;
  cliente_id: string;
  categoria_id: string | null;
  categoria_nombre: string | null;
  nombre: string;
  descripcion: string | null;
  precio_centimos: number;
  imagen_url: string | null;
  disponible: boolean;
  destacado: boolean;
  alergenos: string[];
  orden: number;
}

export interface MesaAdmin {
  id: string;
  cliente_id: string;
  numero: string;
  nombre: string | null;
  identificador: string;
  activa: boolean;
  ocupada: boolean;
  pos_x: number | null;
  pos_y: number | null;
  zona_id: string | null;
  capacidad: number;
  camarero_id: string | null;
  clientes_sentados: number;
  entrada_at: string | null;
  pagando: boolean;
  pagando_at: string | null;
  por_limpiar: boolean;
  union_grupo_id: string | null;
  nota: string | null;
}

export interface ZonaAdmin {
  id: string;
  cliente_id: string;
  nombre: string;
  orden: number;
}

export interface CamareroAdmin {
  id: string;
  cliente_id: string;
  nombre: string;
  activo: boolean;
}

export type EstadoReserva = "CONFIRMADA" | "SENTADA" | "CANCELADA" | "NO_SHOW";

export interface ReservaAdmin {
  id: string;
  cliente_id: string;
  mesa_id: string | null;
  mesa_ids: string[];
  zona_id: string | null;
  nombre_cliente: string;
  telefono: string | null;
  num_personas: number;
  fecha: string;
  hora: string;
  estado: EstadoReserva;
  notas: string | null;
  created_at: string;
}

export interface ComensalAdmin {
  id: string;
  nombre: string | null;
  telefono: string;
  email: string | null;
  total_visitas: number;
  created_at: string;
}

export interface ReglaPromocionAdmin {
  id: string;
  cliente_id: string;
  nombre: string;
  hora_desde: string | null;
  hora_hasta: string | null;
  visitas_requeridas: number;
  ventana_dias: number | null;
  premio_descripcion: string;
  activa: boolean;
  created_at: string;
}

export type EstadoPremio = "PENDIENTE" | "CANJEADO";

export interface PremioAdmin {
  id: string;
  comensal_id: string;
  comensal_nombre: string | null;
  comensal_telefono: string;
  regla_id: string;
  regla_nombre: string;
  premio_descripcion: string;
  visitas_alcanzadas: number;
  estado: EstadoPremio;
  fecha_otorgado: string;
  fecha_canjeado: string | null;
  canal_notificacion: "WHATSAPP" | "EMAIL" | null;
  notificado_en: string | null;
  error_notificacion: string | null;
}

export interface PedidoMesaItemAdmin {
  producto_nombre: string;
  cantidad: number;
  precio_unitario_centimos: number;
  notas: string | null;
}

export interface PedidoMesaAdmin {
  id: string;
  estado: EstadoPedido;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  total_centimos: number;
  notas: string | null;
  created_at: string;
  participante_nombre: string | null;
  items: PedidoMesaItemAdmin[];
}

export interface MesaEstadoAdmin {
  id: string;
  numero: string;
  nombre: string | null;
  identificador: string;
  activa: boolean;
  ocupada: boolean;
  pos_x: number | null;
  pos_y: number | null;
  zona_id: string | null;
  capacidad: number;
  camarero_id: string | null;
  camarero_nombre: string | null;
  clientes_sentados: number;
  entrada_at: string | null;
  pagando: boolean;
  pagando_at: string | null;
  por_limpiar: boolean;
  union_grupo_id: string | null;
  nota: string | null;
  aviso_camarero_at: string | null;
  sesion_modo: "JUNTOS" | "SEPARADO" | null;
  pedidos_hoy: PedidoMesaAdmin[];
}

export interface VentasHoy {
  pedidos_hoy: number;
  ventas_centimos: number;
  ticket_medio_centimos: number;
  pendientes: number;
  en_preparacion: number;
  listos: number;
  pedidos_juntos: number;
  pedidos_separado: number;
  pagos_online: number;
  pagos_local: number;
  top_productos: { nombre: string; cantidad: number }[];
}

export interface InformeVentasDia {
  fecha: string;
  pedidos: number;
  ventas_centimos: number;
}

export interface InformeVentasProducto {
  producto_id: string;
  nombre: string;
  categoria: string;
  unidades: number;
  ventas_centimos: number;
}

export interface InformeVentasCategoria {
  categoria: string;
  unidades: number;
  ventas_centimos: number;
}

export interface InformeVentas {
  resumen: {
    pedidos: number;
    ventas_centimos: number;
    ticket_medio_centimos: number;
    unidades_vendidas: number;
  };
  por_dia: InformeVentasDia[];
  por_categoria: InformeVentasCategoria[];
  productos: InformeVentasProducto[];
}

export interface VisitaAdmin {
  id: string;
  session_id: string;
  event_type: string;
  path: string;
  referrer: string | null;
  source_category: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  device_type: string | null;
  is_returning: boolean;
  created_at: string;
}

export interface NewsletterSubscriberAdmin {
  id: string;
  email: string;
  idioma: string;
  confirmado: boolean;
  confirmado_en: string | null;
  created_at: string;
}

export type EstadoResena = "pendiente" | "aprobada" | "rechazada";

export interface ResenaAdmin {
  id: string;
  nombre: string;
  valoracion: number;
  comentario: string | null;
  estado: EstadoResena;
  created_at: string;
}

export interface ErrorLogAdmin {
  id: string;
  message: string;
  stack: string | null;
  source: string;
  url: string | null;
  user_agent: string | null;
  created_at: string;
}
