import { invoke } from '@tauri-apps/api/core';
import {
  CreateDailySaleDto,
  CreateDetailedSaleDto,
  Sale,
  SaleWithItems,
} from '../types';

export const saleApi = {
  listRecentSales: async (limit = 50): Promise<Sale[]> => {
    return await invoke<Sale[]>('list_recent_sales', { limit });
  },

  listSalesByDateRange: async (start: string, end: string): Promise<Sale[]> => {
    return await invoke<Sale[]>('list_sales_by_date_range', { start, end });
  },

  getSaleById: async (id: number): Promise<SaleWithItems> => {
    return await invoke<SaleWithItems>('get_sale_by_id', { id });
  },

  createDailySale: async (dto: CreateDailySaleDto): Promise<Sale> => {
    return await invoke<Sale>('create_daily_sale', { dto });
  },

  createDetailedSale: async (dto: CreateDetailedSaleDto): Promise<SaleWithItems> => {
    return await invoke<SaleWithItems>('create_detailed_sale', { dto });
  },

  deleteSale: async (id: number): Promise<void> => {
    return await invoke<void>('delete_sale', { id });
  },

  calcProductSalePrice: async (productId: number): Promise<number> => {
    return await invoke<number>('calc_product_sale_price', { productId });
  },
};
