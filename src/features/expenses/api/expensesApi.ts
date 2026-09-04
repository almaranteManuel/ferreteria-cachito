import { invoke } from '@tauri-apps/api/core';
import { CreateGastoPersonalDto, CreatePurchaseDto, GastoPersonal, Purchase } from '../types';

export const expensesApi = {
  // Compras a proveedores (purchases) — usa tabla `purchases` existente
  listPurchases: async (limit = 50): Promise<Purchase[]> => {
    return await invoke<Purchase[]>('list_recent_purchases', { limit });
  },
  createPurchase: async (dto: CreatePurchaseDto): Promise<Purchase> => {
    return await invoke<Purchase>('create_purchase', { dto });
  },
  deletePurchase: async (id: number): Promise<void> => {
    return await invoke<void>('delete_purchase', { id });
  },

  // Gastos personales
  listGastos: async (limit = 50): Promise<GastoPersonal[]> => {
    return await invoke<GastoPersonal[]>('listar_gastos_personales', { limit });
  },
  createGasto: async (dto: CreateGastoPersonalDto): Promise<GastoPersonal> => {
    return await invoke<GastoPersonal>('crear_gasto_personal', { dto });
  },
  deleteGasto: async (id: number): Promise<void> => {
    return await invoke<void>('eliminar_gasto_personal', { id });
  },
};
