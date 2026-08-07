export interface Supplier {
  id: number;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierDto {
  name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
}

export interface UpdateSupplierDto {
  name?: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
}