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
  ocupada: boolean;
  pos_x: number | null;
  pos_y: number | null;
  zona_id: string | null;
  capacidad: number;
  camarero_id: string | null;
  clientes_sentados: number;
  entrada_at: string | null;
  pagando: boolean;
  por_limpiar: boolean;
  union_grupo_id: string | null;
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
  numero: number;
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
  por_limpiar: boolean;
  union_grupo_id: string | null;
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
