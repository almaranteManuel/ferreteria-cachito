import { invoke } from '@tauri-apps/api/core';
import { Product, CreateProductDto } from '../types';

export const productApi = {
  searchProducts: async (query: string): Promise<Product[]> => {
    return await invoke<Product[]>('search_products', { query });
  },

  getProductById: async (id: number): Promise<Product> => {
    return await invoke<Product>('get_product_by_id', { id });
  },

  createProduct: async (dto: CreateProductDto): Promise<Product> => {
    return await invoke<Product>('create_product', { dto });
  },

  deleteProduct: async (id: number): Promise<void> => {
    return await invoke<void>('delete_product', { id });
  },
};