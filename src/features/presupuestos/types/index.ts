export interface Presupuesto {
  id: number;
  fecha: string;
  cliente_nombre: string | null;
  total: number;
  created_at: string;
}

export interface PresupuestoItem {
  id: number;
  presupuesto_id: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  product_id: number | null;
  code: string | null;
}

export interface PresupuestoWithItems extends Presupuesto {
  items: PresupuestoItem[];
}

export interface CreatePresupuestoItemDto {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  product_id?: number | null;
  code?: string | null;
}

export interface CreatePresupuestoDto {
  fecha: string;
  cliente_nombre?: string | null;
  items: CreatePresupuestoItemDto[];
}

export interface PresupuestoItemDraft {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  product_id: number | null;
  code: string | null;
}

export const DATOS_PUERTO = {
  razon_social: 'Puerto Ferretería',
  cuit: '20-37562549-1',
  condicion_iva: 'Responsable Monotributo',
  domicilio: 'Manuel Leiva 510',
  telefono: '',
};

export function formatearNumeroPresupuesto(p: Pick<Presupuesto, 'id' | 'fecha'>): string {
  const d = p.fecha.replace(/-/g, '');
  return `${d}-${String(p.id).padStart(4, '0')}`;
}
