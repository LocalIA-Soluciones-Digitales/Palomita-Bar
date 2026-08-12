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
  numero: number;
  nombre: string | null;
  identificador: string;
  activa: boolean;
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
  items: PedidoMesaItemAdmin[];
}

export interface MesaEstadoAdmin {
  id: string;
  numero: number;
  nombre: string | null;
  identificador: string;
  activa: boolean;
  pedidos_hoy: PedidoMesaAdmin[];
}

export interface VentasHoy {
  pedidos_hoy: number;
  ventas_centimos: number;
  ticket_medio_centimos: number;
  pendientes: number;
  en_preparacion: number;
  listos: number;
  pagos_online: number;
  pagos_local: number;
  top_productos: { nombre: string; cantidad: number }[];
}
