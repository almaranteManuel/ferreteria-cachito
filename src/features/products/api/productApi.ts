import { invoke } from '@tauri-apps/api/core';
import { Product, CreateProductDto } from '../types';

export const productApi = {
  searchProducts: async (query: string): Promise<Product[]> => {
    return await invoke<Product[]>('search_products', { query });
  },

  countProducts: async (): Promise<number> => {
    return await invoke<number>('count_products');
  },

  getProductById: async (id: number): Promise<Product> => {
    return await invoke<Product>('get_product_by_id', { id });
  },

  createProduct: async (dto: CreateProductDto): Promise<Product> => {
    return await invoke<Product>('create_product', { dto });
  },

  updateProduct: async (dto: Product): Promise<Product> => {
    return await invoke<Product>('update_product', { dto });
  },

  deleteProduct: async (id: number): Promise<void> => {
    return await invoke<void>('delete_product', { id });
  },
};