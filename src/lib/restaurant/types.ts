export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  tipo: "comida" | "bebida";
  orden: number;
}

export interface Producto {
  id: string;
  categoria_id: string | null;
  nombre: string;
  descripcion: string | null;
  precio_centimos: number;
  imagen_url: string | null;
  disponible: boolean;
  destacado: boolean;
  alergenos: string[];
  orden: number;
}

export interface Mesa {
  id: string;
  numero: number;
  nombre: string | null;
  identificador: string;
  activa: boolean;
}

export type EstadoPedido =
  | "RECEIVED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMethod = "ONLINE" | "LOCAL";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface PedidoItemPublico {
  producto_nombre: string;
  cantidad: number;
  precio_unitario_centimos: number;
  notas: string | null;
}

export interface PedidoPublico {
  id: string;
  estado: EstadoPedido;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  total_centimos: number;
  mesa_numero: number | null;
  mesa_nombre: string | null;
  created_at: string;
  items: PedidoItemPublico[];
}

export interface CartItemInput {
  producto_id: string;
  cantidad: number;
  notas?: string;
}
