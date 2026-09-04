export interface Supplier {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierDto {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface UpdateSupplierDto {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}