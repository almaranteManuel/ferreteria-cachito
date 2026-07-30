import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { productApi } from '../api/productApi';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      // Si la búsqueda está vacía, buscamos '%' para traer los primeros productos o usar un comando list_all
      const results = await productApi.searchProducts(query || '%');
      setProducts(results);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 250); // Debounce de 250ms para no saturar SQLite al tipear rápido

    return () => clearTimeout(timer);
  }, [searchQuery, fetchProducts]);

  return {
    products,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    refreshProducts: () => fetchProducts(searchQuery),
  };
}