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

export interface RepartoInput {
  participante_id: string;
  importe_centimos: number;
}

export interface CartItemInput {
  producto_id: string;
  cantidad: number;
  notas?: string;
  reparto?: RepartoInput[];
}

export interface SiteImages {
  hero: string;
  about: string;
  ambiente: string[];
}

export type ModoSesion = "JUNTOS" | "SEPARADO";

export interface MesaSesion {
  id: string;
  cliente_id: string;
  mesa_id: string;
  modo: ModoSesion;
  estado: "ACTIVA" | "CERRADA";
  created_at: string;
}

export interface SesionParticipante {
  id: string;
  sesion_id: string;
  nombre: string;
  device_id: string;
  created_at: string;
}

export interface RepartoPublico {
  participante_id: string;
  importe_centimos: number;
  pagado: boolean;
}

export interface SesionItemPublico {
  id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario_centimos: number;
  repartos: RepartoPublico[];
}

export interface SesionPedidoPublico {
  id: string;
  estado: EstadoPedido;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  participante_id: string | null;
  total_centimos: number;
  created_at: string;
  items: SesionItemPublico[];
}

export interface SesionPublica {
  id: string;
  modo: ModoSesion;
  estado: "ACTIVA" | "CERRADA";
  mesa_numero: number;
  mesa_nombre: string | null;
  participantes: { id: string; nombre: string }[];
  pedidos: SesionPedidoPublico[];
}

export interface RepartoParaPagoItem {
  reparto_id: string;
  nombre: string;
  importe_centimos: number;
}

export interface RepartoParaPago {
  participante_id: string;
  nombre: string;
  sesion_id: string;
  items: RepartoParaPagoItem[];
}
