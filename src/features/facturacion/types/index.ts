export interface Factura {
  id: number;
  fecha: string;
  tipo: number;
  punto_venta: number;
  numero: number;
  total: number;
  cae: string | null;
  cae_expiration: string | null;
  resultado: 'PENDIENTE' | 'A' | 'O' | 'R';
  cliente_nombre: string | null;
  created_at: string;
}

export interface FacturaItem {
  id: number;
  factura_id: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  product_id: number | null;
}

export interface FacturaWithItems extends Factura {
  items: FacturaItem[];
}

export interface CreateFacturaItemDto {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  product_id?: number | null;
}

export interface CreateFacturaDto {
  items: CreateFacturaItemDto[];
  cliente_nombre?: string | null;
}

/** Ítem del carrito de la pantalla de facturación. */
export interface ItemFacturaCarrito {
  product_id: number | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

export const DATOS_EMISOR = {
  razon_social: 'Ferretería Cachito',
  cuit: '20-37562549-1',
  condicion_iva: 'Responsable Monotributo',
  domicilio: '',
  telefono: '',
};

export function formatearNumeroFactura(f: Pick<Factura, 'punto_venta' | 'numero'>): string {
  return `000${f.punto_venta}-${String(f.numero).padStart(8, '0')}`;
}
