export interface Sale {
  id: number;
  date: string;
  total_amount: number;
  payment_method: string;
  customer_id: number | null;
  sale_type: 'TOTAL_DIA' | 'DETALLADA';
  is_facturada: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaleItemDetail {
  id: number;
  sale_id: number;
  product_id: number;
  product_code: string;
  product_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SaleWithItems extends Sale {
  items: SaleItemDetail[];
}

export interface CreateDailySaleDto {
  date: string;
  total_amount: number;
  payment_method: string;
}

export interface CreateSaleItemDto {
  product_id: number;
  quantity: number;
  unit_price?: number | null;
}

export interface CreateDetailedSaleDto {
  date: string;
  payment_method: string;
  customer_id?: number | null;
  items: CreateSaleItemDto[];
}

export interface CartItem {
  product_id: number;
  code: string;
  description: string;
  quantity: number;
  unit_price: number;
  stock: number;
}

export const PAYMENT_METHODS = [
  'EFECTIVO',
  'TRANSFERENCIA',
  'DEBITO',
  'CREDITO',
  'CUENTA_CORRIENTE',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function calcSalePrice(price: number | null, variant: number | null): number {
  const base = price ?? 0;
  const mult = variant ?? 1;
  return base * mult;
}
