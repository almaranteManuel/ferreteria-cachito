import { invoke } from '@tauri-apps/api/core';
import { CreateGastoPersonalDto, CreatePurchaseDto, GastoPersonal, Purchase } from '../types';

export const expensesApi = {
  // Compras a proveedores (purchases) — usa tabla `purchases` existente
  listPurchases: async (limit = 50): Promise<Purchase[]> => {
    return await invoke<Purchase[]>('list_recent_purchases', { limit });
  },
  listPurchasesByDateRange: async (start: string, end: string): Promise<Purchase[]> => {
    return await invoke<Purchase[]>('list_purchases_by_date_range', { start, end });
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
  listGastosByDateRange: async (start: string, end: string): Promise<GastoPersonal[]> => {
    return await invoke<GastoPersonal[]>('listar_gastos_personales_por_rango', { start, end });
  },
  createGasto: async (dto: CreateGastoPersonalDto): Promise<GastoPersonal> => {
    return await invoke<GastoPersonal>('crear_gasto_personal', { dto });
  },
  deleteGasto: async (id: number): Promise<void> => {
    return await invoke<void>('eliminar_gasto_personal', { id });
  },
};
