import type { EstadoPedido, PaymentMethod, PaymentStatus } from "@/lib/restaurant/types";

export interface PedidoCocinaItem {
  producto_nombre: string;
  producto_tipo: "comida" | "bebida" | null;
  cantidad: number;
  notas: string | null;
  estado: EstadoPedido;
}

export interface PedidoCocina {
  id: string;
  estado: EstadoPedido;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notas: string | null;
  total_centimos: number;
  created_at: string;
  mesa_numero: string | null;
  mesa_nombre: string | null;
  participante_nombre: string | null;
  items: PedidoCocinaItem[];
}
