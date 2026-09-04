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
  cliente_cuit: string | null;
  condicion_iva_receptor_id: number | null;
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
  /** Si está presente, se emite con DocTipo 80 (CUIT). */
  cliente_cuit?: number | null;
  /** CondicionIVAReceptorId del Padrón A5 (obligatorio si hay CUIT). */
  condicion_iva_receptor_id?: number | null;
}

/** Datos que devuelve el Padrón A5 de ARCA para un CUIT. */
export interface PersonaArca {
  cuit: number;
  denominacion: string;
  tipo_persona: string;
  estado: string;
  condicion_iva_receptor_id: number;
  condicion_iva_desc: string;
  domicilio: string | null;
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
