export interface Customer {
  id: number;
  name: string;
  doc_type: string | null;
  doc_number: string | null;
  phone: string | null;
  address: string | null;
  current_balance: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerPayment {
  id: number;
  customer_id: number;
  amount: number;
  payment_method: string;
  note: string | null;
  date: string;
  transaction_type: 'PAGO' | 'DEUDA';
}

export interface CustomerWithPayments extends Customer {
  payments: CustomerPayment[];
}

export interface CreateCustomerDto {
  name: string;
  doc_type?: string | null;
  doc_number?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface CreateCustomerPaymentDto {
  customer_id: number;
  amount: number;
  payment_method: string;
  note?: string | null;
}

export interface AddCustomerDebtDto {
  customer_id: number;
  amount: number;
  note?: string | null;
}

export interface SupplierDebt {
  id: number;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
  amount: number | null;
  supplier_id: number | null;
  supplier_name: string | null;
  reminder_type: string;
  created_at: string;
}

export interface CreateSupplierDebtDto {
  title: string;
  description?: string | null;
  amount: number;
  supplier_id?: number | null;
  due_date?: string | null;
}
