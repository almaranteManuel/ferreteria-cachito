export interface Purchase {
  id: number;
  date: string;
  total_amount: number;
  supplier_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreatePurchaseDto {
  date: string;
  total_amount: number;
  supplier_id?: number | null;
}

export interface GastoPersonal {
  id: number;
  fecha: string;
  monto: number;
  descripcion: string;
  categoria: string;
  created_at: string | null;
}

export interface CreateGastoPersonalDto {
  fecha: string;
  monto: number;
  descripcion: string;
  categoria: string;
}

export const GASTO_CATEGORIAS = ['IMPUESTO', 'GASTO_PERSONAL', 'OTRO'] as const;
export type GastoCategoria = (typeof GASTO_CATEGORIAS)[number];

export const GASTO_CATEGORIA_LABEL: Record<GastoCategoria, string> = {
  IMPUESTO: 'Impuesto',
  GASTO_PERSONAL: 'Gasto personal',
  OTRO: 'Otro',
};
