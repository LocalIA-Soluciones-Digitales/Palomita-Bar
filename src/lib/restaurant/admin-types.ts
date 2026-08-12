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
  identificador: string;
  activa: boolean;
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
