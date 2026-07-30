export interface Product {
  id: number;
  code: string;
  description: string;
  price: number | null;
  own_price: string | null;
  variant: number | null;
  category_id: number | null;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductDto {
  code: string;
  description: string;
  price: number | null;
  own_price?: string;
  variant?: number | null;
  category_id?: number | null;
  stock: number;
}

export interface UpdateProductDto {
  code?: string;
  description?: string;
  price?: number | null;
  own_price?: string;
  variant?: number | null;
  category_id?: number | null;
  stock?: number;
}