import { invoke } from '@tauri-apps/api/core';
import { Supplier, CreateSupplierDto, UpdateSupplierDto } from '../types';

export const supplierApi = {
  // Buscar proveedores por query (si la cadena está vacía, devuelve todos los proveedores)
  searchSuppliers: async (query: string): Promise<Supplier[]> => {
    return await invoke<Supplier[]>('search_suppliers', { query });
  },

  // Obtener un proveedor específico por ID
  getSupplierById: async (id: number): Promise<Supplier> => {
    return await invoke<Supplier>('get_supplier_by_id', { id });
  },

  // Crear proveedor
  createSupplier: async (dto: CreateSupplierDto): Promise<Supplier> => {
    return await invoke<Supplier>('create_supplier', { dto });
  },

  // Actualizar proveedor
  updateSupplier: async (dto: UpdateSupplierDto): Promise<Supplier> => {
    return await invoke<Supplier>('update_supplier', { dto });
  },

  // Eliminar proveedor
  deleteSupplier: async (id: number): Promise<void> => {
    return await invoke<void>('delete_supplier', { id });
  },
};