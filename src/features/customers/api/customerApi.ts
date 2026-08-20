import { invoke } from '@tauri-apps/api/core';
import {
  AddCustomerDebtDto,
  CreateCustomerDto,
  CreateCustomerPaymentDto,
  CreateSupplierDebtDto,
  Customer,
  CustomerWithPayments,
  SupplierDebt,
} from '../types';

export const customerApi = {
  searchCustomers: async (query: string): Promise<Customer[]> => {
    return await invoke<Customer[]>('search_customers', { query });
  },

  listCustomersWithBalance: async (): Promise<Customer[]> => {
    return await invoke<Customer[]>('list_customers_with_balance');
  },

  getCustomerWithPayments: async (id: number): Promise<CustomerWithPayments> => {
    return await invoke<CustomerWithPayments>('get_customer_with_payments', { id });
  },

  createCustomer: async (dto: CreateCustomerDto): Promise<Customer> => {
    return await invoke<Customer>('create_customer', { dto });
  },

  addPayment: async (dto: CreateCustomerPaymentDto): Promise<CustomerWithPayments> => {
    return await invoke<CustomerWithPayments>('add_customer_payment', { dto });
  },

  addDebt: async (dto: AddCustomerDebtDto): Promise<CustomerWithPayments> => {
    return await invoke<CustomerWithPayments>('add_customer_debt', { dto });
  },

  listSupplierDebts: async (): Promise<SupplierDebt[]> => {
    return await invoke<SupplierDebt[]>('list_supplier_debts');
  },

  createSupplierDebt: async (dto: CreateSupplierDebtDto): Promise<SupplierDebt> => {
    return await invoke<SupplierDebt>('create_supplier_debt', { dto });
  },

  markSupplierDebtPaid: async (id: number): Promise<void> => {
    return await invoke<void>('mark_supplier_debt_paid', { id });
  },

  deleteSupplierDebt: async (id: number): Promise<void> => {
    return await invoke<void>('delete_supplier_debt', { id });
  },
};
